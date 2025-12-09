import express from 'express';
import { authenticate } from '../middleware/auth.js';
import Log from '../models/Log.js';
import Project from '../models/Project.js';
import QueryOptimizeLog from '../models/QueryOptimizeLog.js';
import UserProject from '../models/UserProject.js';
import { analyzeLog, optimizeQuery } from '../utils/groq.js';
import { formatTelegramMessage, sendTelegramNotification } from '../utils/telegram.js';

const router = express.Router();

// Helper function to check if user has access to project
const hasProjectAccess = async (userId, projectId) => {
  const project = await Project.findById(projectId);
  if (!project) return false;

  // Check if user is owner
  if (project.owner.toString() === userId.toString()) return true;

  // Check if user is assigned
  const userProject = await UserProject.findOne({ user: userId, project: projectId });
  return !!userProject;
};

// Non-blocking webhook endpoint for error logging
router.post('/log', async (req, res) => {
  try {
    const { project_id, function_name, error_text } = req.body;

    // Basic validation
    if (!error_text) {
      return res.status(400).json({ error: 'error_text is required' });
    }

    if (!project_id) {
      return res.status(400).json({ error: 'project_id is required' });
    }

    // Verify project exists
    const project = await Project.findById(project_id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Respond immediately - non-blocking
    res.status(202).json({
      message: 'Log registered',
      project_id,
      timestamp: new Date().toISOString()
    });

    // Process asynchronously (don't await)
    processErrorLog({
      project_id,
      function_name,
      error_text,
      project_name: project.name
    }).catch(error => {
      console.error('Error processing webhook log:', error);
    });

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Failed to register log' });
  }
});

// Synchronous analyze endpoint (for frontend UI) - returns results without Telegram
router.post('/analyze', authenticate, async (req, res) => {
  try {
    const { project_id, function_name, error_text } = req.body;

    // Basic validation
    if (!error_text) {
      return res.status(400).json({ error: 'error_text is required' });
    }

    if (!project_id) {
      return res.status(400).json({ error: 'project_id is required' });
    }

    // Verify project exists and user has access
    const project = await Project.findById(project_id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Verify user has access to this project
    const hasAccess = await hasProjectAccess(req.user._id, project_id);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied to this project' });
    }

    // Analyze error using Groq AI
    const analysis = await analyzeLog(error_text);

    // Save log to database
    const log = await Log.create({
      text: error_text,
      project_id,
      function_name: function_name || null,
      summary: analysis.summary,
      cause: analysis.cause,
      severity: analysis.severity,
      fix: analysis.fix,
      aiRaw: analysis.aiRaw
    });

    // Return results (no Telegram notification)
    res.json({
      log: {
        id: log._id,
        summary: analysis.summary,
        cause: analysis.cause,
        severity: analysis.severity,
        fix: analysis.fix,
        createdAt: log.createdAt
      },
      project_name: project.name
    });

  } catch (error) {
    console.error('Analyze error:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze error' });
  }
});

// Query optimization endpoint
router.post('/optimize-query', authenticate, async (req, res) => {
  try {
    const { project_id, function_name, query } = req.body;

    // Basic validation
    if (!query) {
      return res.status(400).json({ error: 'query is required' });
    }

    if (!project_id) {
      return res.status(400).json({ error: 'project_id is required' });
    }

    // Verify project exists and user has access
    const project = await Project.findById(project_id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Verify user has access to this project
    const hasAccess = await hasProjectAccess(req.user._id, project_id);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied to this project' });
    }

    // Optimize query using Groq AI
    const optimization = await optimizeQuery(query, function_name);

    // Save optimization log to database
    const queryLog = await QueryOptimizeLog.create({
      query,
      project_id,
      function_name: function_name || null,
      queryType: optimization.queryType,
      language: optimization.language,
      isValid: optimization.isValid,
      errors: optimization.errors,
      optimizedQuery: optimization.optimizedQuery,
      optimizationReason: optimization.optimizationReason,
      optimizations: optimization.optimizations,
      indexSuggestions: optimization.indexSuggestions,
      correctedQuery: optimization.correctedQuery,
      aiRaw: optimization.aiRaw
    });

    // Return results
    res.json({
      optimization: {
        id: queryLog._id,
        queryType: optimization.queryType,
        language: optimization.language,
        isValid: optimization.isValid,
        errors: optimization.errors,
        optimizedQuery: optimization.optimizedQuery,
        optimizationReason: optimization.optimizationReason,
        optimizations: optimization.optimizations,
        indexSuggestions: optimization.indexSuggestions,
        correctedQuery: optimization.correctedQuery,
        createdAt: queryLog.createdAt
      },
      project_name: project.name,
      function_name: function_name || null
    });

  } catch (error) {
    console.error('Optimize query error:', error);
    res.status(500).json({ error: error.message || 'Failed to optimize query' });
  }
});

// Get query optimization logs
router.get('/optimize-query', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;
    const limit = parseInt(req.query.limit) || 20;
    const page = parseInt(req.query.page) || 1;
    const { project_id, startDate, endDate } = req.query;
    
    let query = {};
    
    // Build project filter
    if (project_id) {
      // Verify user has access to this project
      const hasAccess = await hasProjectAccess(userId, project_id);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied to this project' });
      }
      query.project_id = project_id;
    } else {
      // Get all projects user has access to
      const ownedProjects = await Project.find({ owner: userId });
      const userProjects = await UserProject.find({ user: userId });
      const accessibleProjectIds = [
        ...ownedProjects.map(p => p._id),
        ...userProjects.map(up => up.project)
      ];
      
      if (accessibleProjectIds.length === 0) {
        return res.json({
          logs: [],
          pagination: {
            page: 1,
            limit,
            total: 0,
            totalPages: 0
          }
        });
      }
      
      query.project_id = { $in: accessibleProjectIds };
    }

    // Add date filter if provided
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        // Set end date to end of day
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }
    
    // Get total count for pagination
    const total = await QueryOptimizeLog.countDocuments(query);
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;
    
    const logs = await QueryOptimizeLog.find(query)
      .populate('project_id', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-aiRaw');
    
    res.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    });
  } catch (error) {
    console.error('Get query optimization logs error:', error);
    res.status(500).json({ error: 'Failed to fetch query optimization logs' });
  }
});

// Get query optimization log by ID
router.get('/optimize-query/:id', authenticate, async (req, res) => {
  try {
    const log = await QueryOptimizeLog.findById(req.params.id);
    if (!log) {
      return res.status(404).json({ error: 'Query optimization log not found' });
    }

    // Verify user has access to the log's project
    const hasAccess = await hasProjectAccess(req.user._id, log.project_id);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied to this log' });
    }

    await log.populate('project_id', 'name');
    res.json(log);
  } catch (error) {
    console.error('Get query optimization log error:', error);
    res.status(500).json({ error: 'Failed to fetch query optimization log' });
  }
});

// Async function to process the error log
async function processErrorLog({ project_id, function_name, error_text, project_name }) {
  try {
    console.log(`Processing error log for project: ${project_name}`);

    // Step 1: Analyze error using Groq AI
    const analysis = await analyzeLog(error_text);

    // Step 2: Save log to database
    const log = await Log.create({
      text: error_text,
      project_id,
      function_name: function_name || null,
      summary: analysis.summary,
      cause: analysis.cause,
      severity: analysis.severity,
      fix: analysis.fix,
      aiRaw: analysis.aiRaw
    });

    console.log(`Log saved with ID: ${log._id}, Severity: ${analysis.severity}`);

    // Step 3: Send comprehensive Telegram notification
    const telegramMessage = formatTelegramMessage('webhook_error', {
      project_name,
      function_name: function_name || 'Unknown',
      summary: analysis.summary,
      cause: analysis.cause,
      severity: analysis.severity,
      fix: analysis.fix,
      error_text: error_text.length > 500 ? error_text.substring(0, 500) + '...' : error_text,
      log_id: log._id.toString()
    });

    await sendTelegramNotification(telegramMessage);

    console.log(`Telegram notification sent for log: ${log._id}`);

  } catch (error) {
    console.error('Error in processErrorLog:', error);
    // Even if processing fails, we don't want to throw as the API already responded
  }
}

export default router;

