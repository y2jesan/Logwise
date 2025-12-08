import fetch from 'node-fetch';
import Setting from '../models/Setting.js';

export const sendTelegramNotification = async (message) => {
  try {
    const settings = await Setting.getSettings();

    if (!settings.telegramBotToken || !settings.telegramGroupId) {
      console.log('⚠️ Telegram not configured, skipping notification');
      return false;
    }

    const url = `https://api.telegram.org/bot${settings.telegramBotToken}/sendMessage`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: settings.telegramGroupId,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    const data = await response.json();

    if (data.ok) {
      console.log('✅ Telegram notification sent');
      return true;
    } else {
      console.error('❌ Telegram error:', data.description);
      return false;
    }
  } catch (error) {
    console.error('❌ Telegram notification error:', error);
    return false;
  }
};

export const formatTelegramMessage = (type, data) => {
  const timestamp = new Date().toISOString();

  switch (type) {
    case 'critical_error':
      return `🚨 <b>Critical Error Detected</b>\n\n` + `Summary: ${data.summary}\n` + `Cause: ${data.cause}\n` + `Severity: ${data.severity}\n` + `Fix: ${data.fix}\n` + `Time: ${timestamp}`;

    case 'service_down':
      return `⚠️ <b>Service Down</b>\n\n` + `Service: ${data.name}\n` + `URL: ${data.url}\n` + `Status: ${data.status}\n` + `Time: ${timestamp}`;

    case 'performance_issue':
      return `⚡ <b>Performance Issue</b>\n\n` + `Endpoint: ${data.endpoint}\n` + `Response Time: ${data.responseTime}ms\n` + `Threshold: ${data.threshold}ms\n` + `Suggestion: ${data.suggestion}\n` + `Time: ${timestamp}`;

    case 'test':
      return `🧪 <b>Test Notification</b>\n\n` + `Type: ${data.type}\n` + `Message: ${data.message}\n` + `Time: ${timestamp}`;

    default:
      return `📢 <b>LogWise Alert</b>\n\n${JSON.stringify(data, null, 2)}\nTime: ${timestamp}`;
  }
};
