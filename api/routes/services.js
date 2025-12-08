import express from 'express';
import Service from '../models/Service.js';
import { authenticate } from '../middleware/auth.js';
import { sendTelegramNotification, formatTelegramMessage } from '../utils/telegram.js';
import { analyzeLog } from '../utils/groq.js';
import fetch from 'node-fetch';

const router = express.Router();

// Get all services
router.get('/', authenticate, async (req, res) => {
  try {
    const services = await Service.find().sort({ createdAt: -1 });
    res.json(services);
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

// Create service
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, url } = req.body;

    if (!name || !url) {
      return res.status(400).json({ error: 'Name and URL are required' });
    }

    const service = await Service.create({ name, url });
    res.json(service);
  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({ error: 'Failed to create service' });
  }
});

// Check service status
router.get('/status', authenticate, async (req, res) => {
  try {
    const services = await Service.find();
    const results = [];

    for (const service of services) {
      try {
        const startTime = Date.now();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(service.url, {
          method: 'GET',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        const responseTime = Date.now() - startTime;

        const status = response.ok ? 'up' : 'down';
        service.status = status;
        service.lastChecked = new Date();
        await service.save();

        results.push({
          id: service._id,
          name: service.name,
          url: service.url,
          status,
          responseTime,
          lastChecked: service.lastChecked
        });

        // If service is down, send Telegram alert
        if (status === 'down') {
          const logText = `Service ${service.name} (${service.url}) is down. Status code: ${response.status}`;
          const analysis = await analyzeLog(logText);
          
          const message = formatTelegramMessage('service_down', {
            name: service.name,
            url: service.url,
            status: 'down',
            cause: analysis.cause,
            fix: analysis.fix
          });
          await sendTelegramNotification(message);
        }
      } catch (error) {
        // Service is down or unreachable
        service.status = 'down';
        service.lastChecked = new Date();
        await service.save();

        results.push({
          id: service._id,
          name: service.name,
          url: service.url,
          status: 'down',
          responseTime: null,
          lastChecked: service.lastChecked,
          error: error.message
        });

        // Send Telegram alert
        const logText = `Service ${service.name} (${service.url}) is unreachable. Error: ${error.message}`;
        const analysis = await analyzeLog(logText);
        
        const message = formatTelegramMessage('service_down', {
          name: service.name,
          url: service.url,
          status: 'down',
          cause: analysis.cause,
          fix: analysis.fix
        });
        await sendTelegramNotification(message);
      }
    }

    res.json(results);
  } catch (error) {
    console.error('Check services error:', error);
    res.status(500).json({ error: 'Failed to check services' });
  }
});

// Update service
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { name, url } = req.body;
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      { name, url },
      { new: true }
    );

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    res.json(service);
  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({ error: 'Failed to update service' });
  }
});

// Delete service
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }
    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({ error: 'Failed to delete service' });
  }
});

export default router;

