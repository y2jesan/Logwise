import express from 'express';
import Log from '../models/Log.js';
import { authenticate } from '../middleware/auth.js';
import { analyzeLog } from '../utils/groq.js';
import { sendTelegramNotification, formatTelegramMessage } from '../utils/telegram.js';

const router = express.Router();

// Analyze log
router.post('/analyze', authenticate, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Log text is required' });
    }

    const analysis = await analyzeLog(text);
    
    const log = await Log.create({
      text,
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
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Log text is required' });
    }

    const analysis = await analyzeLog(text);
    
    const log = await Log.create({
      text,
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
    const limit = parseInt(req.query.limit) || 50;
    const logs = await Log.find()
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
    res.json(log);
  } catch (error) {
    console.error('Get log error:', error);
    res.status(500).json({ error: 'Failed to fetch log' });
  }
});

export default router;

