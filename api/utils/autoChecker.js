import fetch from 'node-fetch';
import Log from '../models/Log.js';
import Project from '../models/Project.js';
import Service from '../models/Service.js';
import { analyzeLog } from './groq.js';
import { formatTelegramMessage, sendTelegramNotification } from './telegram.js';

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
    }
  } catch (error) {
    console.error('Error sending service notification:', error);
  }
};

// Check a single service
const checkService = async (service) => {
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
    service.lastAutoCheck = new Date();
    await service.save();

    // Create log for service check (respects report_success)
    await createServiceCheckLog(service, status, responseTime, null, service.report_success);

    // Send notification (respects report_success)
    if (status === 'down') {
      const logText = `Service ${service.name} (${service.url}) is down. Status code: ${response.status}`;
      const analysis = await analyzeLog(logText);
      await sendServiceNotification(service, status, analysis, response);
    }

    return { success: true, status, responseTime };
  } catch (error) {
    // Service is down or unreachable
    service.status = 'down';
    service.lastChecked = new Date();
    service.lastAutoCheck = new Date();
    await service.save();

    // Create log for service check (respects report_success)
    await createServiceCheckLog(service, 'down', null, error.message, service.report_success);

    // Send notification (respects report_success)
    const logText = `Service ${service.name} (${service.url}) is unreachable. Error: ${error.message}`;
    const analysis = await analyzeLog(logText);
    await sendServiceNotification(service, 'down', analysis, null, error);

    return { success: false, status: 'down', error: error.message };
  }
};

// Main auto-checker function
const runAutoCheck = async () => {
  try {
    // Find all services with auto_check enabled
    const services = await Service.find({ auto_check: true });

    if (services.length === 0) {
      return;
    }

    const now = Date.now();

    for (const service of services) {
      // Check if it's time to check this service
      const intervalMs = service.minute_interval * 60 * 1000;
      const lastCheck = service.lastAutoCheck ? new Date(service.lastAutoCheck).getTime() : 0;
      const timeSinceLastCheck = now - lastCheck;

      // If enough time has passed, check the service
      if (timeSinceLastCheck >= intervalMs || lastCheck === 0) {
        console.log(`[Auto-Check] Checking service: ${service.name} (${service.url})`);
        await checkService(service);
      }
    }
  } catch (error) {
    console.error('[Auto-Check] Error running auto-check:', error);
  }
};

// Start the auto-checker
let autoCheckInterval = null;

export const startAutoChecker = () => {
  // Run every minute to check if any services need to be checked
  autoCheckInterval = setInterval(() => {
    runAutoCheck().catch(error => {
      console.error('[Auto-Check] Fatal error in auto-checker:', error);
    });
  }, 60 * 1000); // Check every minute

  // Run immediately on startup
  runAutoCheck().catch(error => {
    console.error('[Auto-Check] Error on initial auto-check:', error);
  });

  console.log('✅ Auto-checker started');
};

export const stopAutoChecker = () => {
  if (autoCheckInterval) {
    clearInterval(autoCheckInterval);
    autoCheckInterval = null;
    console.log('⏹️  Auto-checker stopped');
  }
};

