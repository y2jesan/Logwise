import express from 'express';
import Setting from '../models/Setting.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { sendTelegramNotification, formatTelegramMessage } from '../utils/telegram.js';

const router = express.Router();

// Get settings (admin only)
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const settings = await Setting.getSettings();
    res.json(settings);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Save settings (admin only)
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { telegramBotToken, telegramGroupId, thresholds } = req.body;

    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create({
        telegramBotToken: telegramBotToken || '',
        telegramGroupId: telegramGroupId || '',
        thresholds: thresholds || {}
      });
    } else {
      if (telegramBotToken !== undefined) settings.telegramBotToken = telegramBotToken;
      if (telegramGroupId !== undefined) settings.telegramGroupId = telegramGroupId;
      if (thresholds !== undefined) settings.thresholds = { ...settings.thresholds, ...thresholds };
      await settings.save();
    }

    res.json(settings);
  } catch (error) {
    console.error('Save settings error:', error);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

// Test notification (admin only)
router.post('/test-notification', authenticate, requireAdmin, async (req, res) => {
  try {
    const { type, message } = req.body;

    const testData = {
      type: type || 'test',
      message: message || 'This is a test notification from LogWise AI'
    };

    const telegramMessage = formatTelegramMessage('test', testData);
    const sent = await sendTelegramNotification(telegramMessage);

    if (sent) {
      res.json({ success: true, message: 'Test notification sent successfully' });
    } else {
      res.status(400).json({ error: 'Failed to send notification. Check Telegram configuration.' });
    }
  } catch (error) {
    console.error('Test notification error:', error);
    res.status(500).json({ error: 'Failed to send test notification' });
  }
});

export default router;

