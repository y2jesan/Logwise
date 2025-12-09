import express from 'express';
import Log from '../models/Log.js';
import Project from '../models/Project.js';
import UserProject from '../models/UserProject.js';
import Service from '../models/Service.js';
import { authenticate } from '../middleware/auth.js';
import { analyzeLog } from '../utils/groq.js';
import { sendTelegramNotification, formatTelegramMessage } from '../utils/telegram.js';

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

// Analyze log
router.post('/analyze', authenticate, async (req, res) => {
  try {
    const { text, project_id } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Log text is required' });
    }

    if (!project_id) {
      return res.status(400).json({ error: 'project_id is required' });
    }

    // Verify user has access to this project
    const hasAccess = await hasProjectAccess(req.user._id, project_id);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied to this project' });
    }

    const analysis = await analyzeLog(text);
    
    const log = await Log.create({
      text,
      project_id,
      ...analysis
    });

    res.json(log);
  } catch (error) {
    console.error('Analyze log error:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze log' });
  }
});

// Push log (external integration)
router.post('/push', async (req, res) => {
  try {
    const { text, project_id } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Log text is required' });
    }

    if (!project_id) {
      return res.status(400).json({ error: 'project_id is required' });
    }

    const analysis = await analyzeLog(text);
    
    const log = await Log.create({
      text,
      project_id,
      ...analysis
    });

    // Send Telegram alert if severity is critical
    if (analysis.severity === 'critical') {
      const message = formatTelegramMessage('critical_error', {
        summary: analysis.summary,
        cause: analysis.cause,
        severity: analysis.severity,
        fix: analysis.fix
      });
      await sendTelegramNotification(message);
    }

    res.json(log);
  } catch (error) {
    console.error('Push log error:', error);
    res.status(500).json({ error: error.message || 'Failed to process log' });
  }
});

// Get recent logs
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;
    const limit = parseInt(req.query.limit) || 50;
    const { project_id, service_id, startDate, endDate } = req.query;
    
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
        return res.json([]);
      }
      
      query.project_id = { $in: accessibleProjectIds };
    }

    // Add service filter if provided
    if (service_id) {
      // Verify user has access to the service's project
      const service = await Service.findById(service_id);
      if (service) {
        const hasAccess = await hasProjectAccess(userId, service.project_id);
        if (!hasAccess) {
          return res.status(403).json({ error: 'Access denied to this service' });
        }
        query.service_id = service_id;
        // Also ensure project_id matches if both are provided
        if (project_id && service.project_id.toString() !== project_id) {
          return res.status(400).json({ error: 'Service does not belong to the selected project' });
        }
      }
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
    
    const logs = await Log.find(query)
      .populate('project_id', 'name')
      .populate('service_id', 'name url')
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('-aiRaw');
    
    res.json(logs);
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// Get log by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const log = await Log.findById(req.params.id);
    if (!log) {
      return res.status(404).json({ error: 'Log not found' });
    }

    // Verify user has access to the log's project
    const hasAccess = await hasProjectAccess(req.user._id, log.project_id);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied to this log' });
    }

    res.json(log);
  } catch (error) {
    console.error('Get log error:', error);
    res.status(500).json({ error: 'Failed to fetch log' });
  }
});

export default router;

