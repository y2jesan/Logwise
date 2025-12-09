import express from 'express';
import Log from '../models/Log.js';
import Project from '../models/Project.js';
import { analyzeLog } from '../utils/groq.js';
import { sendTelegramNotification, formatTelegramMessage } from '../utils/telegram.js';

const router = express.Router();

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

