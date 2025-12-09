import express from 'express';
import { authenticate } from '../middleware/auth.js';
import Log from '../models/Log.js';
import Project from '../models/Project.js';
import UserProject from '../models/UserProject.js';
import { analyzeLog } from '../utils/groq.js';
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

