import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import api from '../lib/api';
import Button from '../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { 
  LogOut, 
  Settings, 
  Activity, 
  AlertTriangle, 
  Clock,
  TrendingUp
} from 'lucide-react';

const Dashboard = () => {
  const { user, logout } = useAuthStore();
  const [logs, setLogs] = useState([]);
  const [services, setServices] = useState([]);
  const [uptime, setUptime] = useState(99.9);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [logsRes, servicesRes] = await Promise.all([
        api.get('/logs?limit=10'),
        api.get('/services')
      ]);
      
      setLogs(logsRes.data);
      setServices(servicesRes.data);
      
      // Calculate uptime (dummy for MVP)
      const upServices = servicesRes.data.filter(s => s.status === 'up').length;
      const totalServices = servicesRes.data.length || 1;
      setUptime((upServices / totalServices) * 100);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'text-destructive';
      case 'warning':
        return 'text-yellow-600';
      default:
        return 'text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 border-r bg-card">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-primary mb-8">LogWise AI</h2>
          <nav className="space-y-2">
            <Link
              to="/dashboard"
              className="flex items-center gap-3 px-4 py-2 rounded-md bg-primary text-primary-foreground"
            >
              <Activity className="w-5 h-5" />
              Dashboard
            </Link>
            <Link
              to="/dashboard"
              className="flex items-center gap-3 px-4 py-2 rounded-md hover:bg-accent"
            >
              <AlertTriangle className="w-5 h-5" />
              Logs
            </Link>
            <Link
              to="/dashboard"
              className="flex items-center gap-3 px-4 py-2 rounded-md hover:bg-accent"
            >
              <TrendingUp className="w-5 h-5" />
              Services
            </Link>
            {user?.role === 'admin' && (
              <Link
                to="/settings"
                className="flex items-center gap-3 px-4 py-2 rounded-md hover:bg-accent"
              >
                <Settings className="w-5 h-5" />
                Settings
              </Link>
            )}
          </nav>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t">
          <div className="mb-4">
            <p className="text-sm font-medium">{user?.email}</p>
            <p className="text-xs text-muted-foreground">{user?.role}</p>
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">System Uptime</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{uptime.toFixed(1)}%</div>
                <CardDescription>All services operational</CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Errors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {logs.filter(l => l.severity === 'critical').length}
                </div>
                <CardDescription>Critical issues detected</CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Active Services</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {services.filter(s => s.status === 'up').length}/{services.length}
                </div>
                <CardDescription>Services running</CardDescription>
              </CardContent>
            </Card>
          </div>

          {/* Recent Logs */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Recent Logs</CardTitle>
              <CardDescription>Latest log entries analyzed by AI</CardDescription>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <p className="text-muted-foreground">No logs yet</p>
              ) : (
                <div className="space-y-4">
                  {logs.map((log) => (
                    <div
                      key={log._id}
                      className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(
                              log.severity
                            )} bg-muted`}
                          >
                            {log.severity}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            <Clock className="w-3 h-3 inline mr-1" />
                            {new Date(log.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <h4 className="font-medium mb-1">{log.summary}</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        {log.cause}
                      </p>
                      {log.fix && (
                        <div className="mt-2 p-2 bg-muted rounded text-sm">
                          <strong>Fix:</strong> {log.fix}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Services Status */}
          <Card>
            <CardHeader>
              <CardTitle>Services Status</CardTitle>
              <CardDescription>Current status of monitored services</CardDescription>
            </CardHeader>
            <CardContent>
              {services.length === 0 ? (
                <p className="text-muted-foreground">No services configured</p>
              ) : (
                <div className="space-y-2">
                  {services.map((service) => (
                    <div
                      key={service._id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{service.name}</p>
                        <p className="text-sm text-muted-foreground">{service.url}</p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          service.status === 'up'
                            ? 'bg-green-100 text-green-800'
                            : service.status === 'down'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {service.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;

