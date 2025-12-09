import {
  Clock,
  FolderOpen,
  Plus
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import Button from '../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import api from '../lib/api';
import useAuthStore from '../store/authStore';

const Dashboard = () => {
  const { user } = useAuthStore();
  const [logs, setLogs] = useState([]);
  const [services, setServices] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [uptime, setUptime] = useState(99.9);
  const [loading, setLoading] = useState(false);
  const [projectsLoading, setProjectsLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      // Auto-select first project if available
      setSelectedProjectId(projects[0]._id);
    } else if (projects.length === 0 && !projectsLoading) {
      // No projects and projects have finished loading
      setLoading(false);
    }
  }, [projects, selectedProjectId, projectsLoading]);

  useEffect(() => {
    if (selectedProjectId) {
      fetchData();
    }
  }, [selectedProjectId]);

  const fetchProjects = async () => {
    setProjectsLoading(true);
    try {
      const response = await api.get('/projects');
      setProjects(response.data);
      if (response.data.length > 0) {
        setSelectedProjectId(response.data[0]._id);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setProjectsLoading(false);
    }
  };

  const fetchData = async () => {
    if (!selectedProjectId) {
      setLogs([]);
      setServices([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const [logsRes, servicesRes] = await Promise.all([
        api.get(`/logs?limit=10&project_id=${selectedProjectId}`),
        api.get(`/services?project_id=${selectedProjectId}`)
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

  if (projectsLoading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div>Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            {projects.length > 0 ? (
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {projects.map((project) => (
                  <option key={project._id} value={project._id}>
                    {project.name}
                  </option>
                ))}
              </select>
            ) : (
              <Link to="/projects">
                <Button>
                  <FolderOpen className="w-4 h-4 mr-2" />
                  Create Your First Project
                </Button>
              </Link>
            )}
          </div>

          {projects.length === 0 && (
            <Card className="mb-6">
              <CardContent className="py-12 text-center">
                <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Projects Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create a project to start monitoring services and logs
                </p>
                <Link to="/projects">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Project
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
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

          {/* Services Status */}
          <Card className="mb-6">
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

          {/* Recent Logs */}
          <Card>
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
    </DashboardLayout>
  );
};

export default Dashboard;

