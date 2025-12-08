import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { sendTelegramNotification, formatTelegramMessage } from '../utils/telegram.js';
import { analyzeLog } from '../utils/groq.js';
import Setting from '../models/Setting.js';
import fetch from 'node-fetch';

const router = express.Router();

// Check API performance
router.get('/check', authenticate, async (req, res) => {
  try {
    const { endpoint } = req.query;

    if (!endpoint) {
      return res.status(400).json({ error: 'Endpoint URL is required' });
    }

    const settings = await Setting.getSettings();
    const threshold = settings.thresholds?.responseTime || 1000;

    const startTime = Date.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(endpoint, {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      const responseTime = Date.now() - startTime;
      const isSlow = responseTime > threshold;

      let suggestion = '';
      if (isSlow) {
        const logText = `API endpoint ${endpoint} is slow. Response time: ${responseTime}ms, Threshold: ${threshold}ms`;
        const analysis = await analyzeLog(logText);
        suggestion = analysis.fix;

        // Send Telegram alert
        const message = formatTelegramMessage('performance_issue', {
          endpoint,
          responseTime,
          threshold,
          suggestion
        });
        await sendTelegramNotification(message);
      }

      res.json({
        endpoint,
        responseTime,
        threshold,
        status: response.status,
        isSlow,
        suggestion
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;
      res.status(500).json({
        endpoint,
        responseTime,
        threshold,
        error: error.message,
        isSlow: true
      });
    }
  } catch (error) {
    console.error('Performance check error:', error);
    res.status(500).json({ error: 'Failed to check performance' });
  }
});

export default router;

