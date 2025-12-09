import express from 'express';
import fetch from 'node-fetch';
import { authenticate } from '../middleware/auth.js';
import Log from '../models/Log.js';
import Project from '../models/Project.js';
import Service from '../models/Service.js';
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

// Helper function to create log for service check
const createServiceCheckLog = async (service, status, responseTime, error = null, reportSuccess = false) => {
  try {
    // Only log success if report_success is true
    if (status === 'up' && !reportSuccess) {
      return;
    }

    const project = await Project.findById(service.project_id);
    const logText = error
      ? `Service check: ${service.name} (${service.url}) is ${status}. Error: ${error}. Response time: ${responseTime ? responseTime + 'ms' : 'N/A'}. Project: ${project?.name || 'Unknown'}`
      : `Service check: ${service.name} (${service.url}) is ${status}. Response time: ${responseTime ? responseTime + 'ms' : 'N/A'}. Project: ${project?.name || 'Unknown'}`;

    const analysis = await analyzeLog(logText);

    await Log.create({
      text: logText,
      project_id: service.project_id,
      service_id: service._id,
      summary: analysis.summary || `Service ${service.name} status check: ${status}`,
      cause: analysis.cause || (status === 'down' ? 'Service is not responding' : 'Service is operational'),
      severity: status === 'down' ? 'critical' : 'info',
      fix: analysis.fix || (status === 'down' ? 'Check service configuration and network connectivity' : 'No action needed')
    });
  } catch (error) {
    console.error('Error creating service check log:', error);
  }
};

// Helper function to send Telegram notification (respects report_success)
const sendServiceNotification = async (service, status, analysis, response = null, error = null) => {
  try {
    // Only notify on failure, or on success if report_success is true
    if (status === 'up' && !service.report_success) {
      return;
    }

    if (status === 'down') {
      const logText = error
        ? `Service ${service.name} (${service.url}) is unreachable. Error: ${error.message || error}`
        : `Service ${service.name} (${service.url}) is down. Status code: ${response?.status}`;

      const serviceAnalysis = analysis || await analyzeLog(logText);

      const message = formatTelegramMessage('service_down', {
        name: service.name,
        url: service.url,
        status: 'down',
        cause: serviceAnalysis.cause,
        fix: serviceAnalysis.fix
      });
      await sendTelegramNotification(message);
    } else if (status === 'up' && service.report_success) {
      // Optional: send success notification if report_success is true
      // For now, we'll just log it, but you can add a success notification format if needed
    }
  } catch (error) {
    console.error('Error sending service notification:', error);
  }
};

// Get all services (filtered by project_id if provided)
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;
    const { project_id } = req.query;

    let query = {};

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

    const services = await Service.find(query).sort({ createdAt: -1 });
    res.json(services);
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

// Create service
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, url, project_id, auto_check, minute_interval, report_success } = req.body;

    if (!name || !url || !project_id) {
      return res.status(400).json({ error: 'Name, URL, and project_id are required' });
    }

    // Validate minute_interval if auto_check is true
    if (auto_check && (!minute_interval || minute_interval < 1)) {
      return res.status(400).json({ error: 'minute_interval is required and must be at least 1 when auto_check is true' });
    }

    // Verify user has access to this project
    const hasAccess = await hasProjectAccess(req.user._id, project_id);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied to this project' });
    }

    const serviceData = {
      name,
      url,
      project_id,
      auto_check: auto_check || false,
      minute_interval: auto_check ? minute_interval : null,
      report_success: report_success || false
    };

    const service = await Service.create(serviceData);
    res.json(service);
  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({ error: 'Failed to create service' });
  }
});

// Check service status
router.get('/status', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;
    const { project_id } = req.query;

    let query = {};

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

    const services = await Service.find(query);
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

        // Create log for service check (respects report_success)
        await createServiceCheckLog(service, status, responseTime, null, service.report_success);

        results.push({
          id: service._id,
          name: service.name,
          url: service.url,
          status,
          responseTime,
          lastChecked: service.lastChecked
        });

        // Send notification (respects report_success)
        if (status === 'down') {
          const logText = `Service ${service.name} (${service.url}) is down. Status code: ${response.status}`;
          const analysis = await analyzeLog(logText);
          await sendServiceNotification(service, status, analysis, response);
        }
      } catch (error) {
        // Service is down or unreachable
        service.status = 'down';
        service.lastChecked = new Date();
        await service.save();

        // Create log for service check (respects report_success)
        await createServiceCheckLog(service, 'down', null, error.message, service.report_success);

        results.push({
          id: service._id,
          name: service.name,
          url: service.url,
          status: 'down',
          responseTime: null,
          lastChecked: service.lastChecked,
          error: error.message
        });

        // Send notification (respects report_success)
        const logText = `Service ${service.name} (${service.url}) is unreachable. Error: ${error.message}`;
        const analysis = await analyzeLog(logText);
        await sendServiceNotification(service, 'down', analysis, null, error);
      }
    }

    res.json(results);
  } catch (error) {
    console.error('Check services error:', error);
    res.status(500).json({ error: 'Failed to check services' });
  }
});

// Check single service status
router.get('/:id/status', authenticate, async (req, res) => {
  try {
    const serviceId = req.params.id;
    const service = await Service.findById(serviceId);

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    // Verify user has access to the service's project
    const hasAccess = await hasProjectAccess(req.user._id, service.project_id);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied to this service' });
    }

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

      // Create log for service check (respects report_success)
      await createServiceCheckLog(service, status, responseTime, null, service.report_success);

      const result = {
        id: service._id,
        name: service.name,
        url: service.url,
        status,
        responseTime,
        lastChecked: service.lastChecked
      };

      // Send notification (respects report_success)
      if (status === 'down') {
        const logText = `Service ${service.name} (${service.url}) is down. Status code: ${response.status}`;
        const analysis = await analyzeLog(logText);
        await sendServiceNotification(service, status, analysis, response);
      }

      res.json(result);
    } catch (error) {
      // Service is down or unreachable
      service.status = 'down';
      service.lastChecked = new Date();
      await service.save();

      // Create log for service check (respects report_success)
      await createServiceCheckLog(service, 'down', null, error.message, service.report_success);

      const result = {
        id: service._id,
        name: service.name,
        url: service.url,
        status: 'down',
        responseTime: null,
        lastChecked: service.lastChecked,
        error: error.message
      };

      // Send notification (respects report_success)
      const logText = `Service ${service.name} (${service.url}) is unreachable. Error: ${error.message}`;
      const analysis = await analyzeLog(logText);
      await sendServiceNotification(service, 'down', analysis, null, error);

      res.json(result);
    }
  } catch (error) {
    console.error('Check service status error:', error);
    res.status(500).json({ error: 'Failed to check service status' });
  }
});

// Update service
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { name, url, project_id, auto_check, minute_interval, report_success } = req.body;
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    // Verify user has access to the service's project
    const hasAccess = await hasProjectAccess(req.user._id, service.project_id);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied to this service' });
    }

    // If project_id is being changed, verify access to new project
    if (project_id && project_id !== service.project_id.toString()) {
      const hasNewProjectAccess = await hasProjectAccess(req.user._id, project_id);
      if (!hasNewProjectAccess) {
        return res.status(403).json({ error: 'Access denied to the new project' });
      }
    }

    // Validate minute_interval if auto_check is true
    if (auto_check === true && (!minute_interval || minute_interval < 1)) {
      return res.status(400).json({ error: 'minute_interval is required and must be at least 1 when auto_check is true' });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (url !== undefined) updateData.url = url;
    if (project_id !== undefined) updateData.project_id = project_id;
    if (auto_check !== undefined) {
      updateData.auto_check = auto_check;
      // If auto_check is false, clear minute_interval
      if (!auto_check) {
        updateData.minute_interval = null;
      } else if (minute_interval !== undefined) {
        updateData.minute_interval = minute_interval;
      }
    } else if (minute_interval !== undefined) {
      // Only update minute_interval if auto_check is already true
      if (service.auto_check) {
        updateData.minute_interval = minute_interval;
      }
    }
    if (report_success !== undefined) updateData.report_success = report_success;

    const updatedService = await Service.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.json(updatedService);
  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({ error: 'Failed to update service' });
  }
});

// Delete service
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    // Verify user has access to the service's project
    const hasAccess = await hasProjectAccess(req.user._id, service.project_id);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied to this service' });
    }

    await Service.findByIdAndDelete(req.params.id);
    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({ error: 'Failed to delete service' });
  }
});

export default router;

