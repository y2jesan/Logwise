import { Send } from 'lucide-react';
import { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import Button from '../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import Input from '../components/ui/Input';
import api from '../lib/api';
import useAuthStore from '../store/authStore';

const Settings = () => {
  const { user, logout } = useAuthStore();
  const [settings, setSettings] = useState({
    telegramBotToken: '',
    telegramGroupId: '',
    thresholds: {
      responseTime: 1000,
      errorRate: 5
    }
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [testType, setTestType] = useState('test');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/settings');
      setSettings(response.data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      await api.post('/settings', settings);
      setMessage('Settings saved successfully!');
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleTestNotification = async () => {
    setLoading(true);
    setMessage('');

    try {
      const response = await api.post('/settings/test-notification', {
        type: testType,
        message: `Test notification for ${testType}`
      });
      setMessage(response.data.message || 'Test notification sent!');
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to send test notification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto p-8">
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
              <CardDescription>
                Configure Telegram notifications and system thresholds
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-6">
                {message && (
                  <div
                    className={`p-3 rounded-md text-sm ${
                      message.includes('success') || message.includes('sent')
                        ? 'bg-green-100 text-green-800'
                        : 'bg-destructive/10 text-destructive'
                    }`}
                  >
                    {message}
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="telegramBotToken" className="text-sm font-medium">
                    Telegram Bot Token
                  </label>
                  <Input
                    id="telegramBotToken"
                    type="text"
                    placeholder="Enter your Telegram bot token"
                    value={settings.telegramBotToken}
                    onChange={(e) =>
                      setSettings({ ...settings, telegramBotToken: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="telegramGroupId" className="text-sm font-medium">
                    Telegram Chat/Group ID
                  </label>
                  <Input
                    id="telegramGroupId"
                    type="text"
                    placeholder="Enter your Telegram chat/group ID"
                    value={settings.telegramGroupId}
                    onChange={(e) =>
                      setSettings({ ...settings, telegramGroupId: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="responseTime" className="text-sm font-medium">
                    Response Time Threshold (ms)
                  </label>
                  <Input
                    id="responseTime"
                    type="number"
                    value={settings.thresholds?.responseTime || 1000}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        thresholds: {
                          ...settings.thresholds,
                          responseTime: parseInt(e.target.value) || 1000
                        }
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="errorRate" className="text-sm font-medium">
                    Error Rate Threshold (%)
                  </label>
                  <Input
                    id="errorRate"
                    type="number"
                    value={settings.thresholds?.errorRate || 5}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        thresholds: {
                          ...settings.thresholds,
                          errorRate: parseInt(e.target.value) || 5
                        }
                      })
                    }
                  />
                </div>

                <div className="flex gap-4">
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Saving...' : 'Save Settings'}
                  </Button>
                </div>
              </form>

              {/* Test Notification */}
              <div className="mt-8 pt-8 border-t">
                <h3 className="text-lg font-semibold mb-4">Test Notification</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="testType" className="text-sm font-medium">
                      Notification Type
                    </label>
                    <select
                      id="testType"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={testType}
                      onChange={(e) => setTestType(e.target.value)}
                    >
                      <option value="test">Test</option>
                      <option value="critical_error">Critical Error</option>
                      <option value="service_down">Service Down</option>
                      <option value="performance_issue">Performance Issue</option>
                    </select>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleTestNotification}
                    disabled={loading}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send Test Notification
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;

