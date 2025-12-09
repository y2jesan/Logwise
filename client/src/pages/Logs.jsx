import {
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  FolderOpen,
  Server,
  X,
  XCircle
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import Button from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Input from '../components/ui/Input';
import api from '../lib/api';
import useAuthStore from '../store/authStore';

const Logs = () => {
  const { user } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [logs, setLogs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedLogs, setExpandedLogs] = useState(new Set());
  const [filters, setFilters] = useState({
    project_id: '',
    service_id: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    // Get filters from URL query params
    const projectId = searchParams.get('project_id') || '';
    const serviceId = searchParams.get('service_id') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    
    setFilters({
      project_id: projectId,
      service_id: serviceId,
      startDate,
      endDate
    });
  }, [searchParams]);

  useEffect(() => {
    fetchServices();
  }, [filters.project_id]);

  useEffect(() => {
    fetchLogs();
  }, [filters]);

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects');
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchServices = async () => {
    try {
      const query = filters.project_id ? `?project_id=${filters.project_id}` : '';
      const response = await api.get(`/services${query}`);
      setServices(response.data);
      
      // Clear service filter if selected service is not in the filtered list
      if (filters.service_id && !response.data.find(s => s._id === filters.service_id)) {
        handleFilterChange('service_id', '');
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.project_id) params.append('project_id', filters.project_id);
      if (filters.service_id) params.append('service_id', filters.service_id);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      params.append('limit', '100');

      const response = await api.get(`/logs?${params.toString()}`);
      setLogs(response.data);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    // Update URL params
    const params = new URLSearchParams();
    if (newFilters.project_id) params.set('project_id', newFilters.project_id);
    if (newFilters.service_id) params.set('service_id', newFilters.service_id);
    if (newFilters.startDate) params.set('startDate', newFilters.startDate);
    if (newFilters.endDate) params.set('endDate', newFilters.endDate);
    setSearchParams(params);
  };

  const clearFilters = () => {
    setFilters({
      project_id: '',
      service_id: '',
      startDate: '',
      endDate: ''
    });
    setSearchParams({});
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'text-destructive bg-destructive/10';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-4 h-4 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const toggleLog = (logId) => {
    setExpandedLogs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(logId)) {
        newSet.delete(logId);
      } else {
        newSet.add(logId);
      }
      return newSet;
    });
  };

  const getServiceStatus = (log) => {
    // Extract status from log text or determine from severity
    const text = log.text?.toLowerCase() || '';
    if (text.includes('is up') || text.includes('operational')) {
      return { status: 'up', icon: CheckCircle, color: 'text-green-600' };
    }
    if (text.includes('is down') || text.includes('unreachable') || log.severity === 'critical') {
      return { status: 'down', icon: XCircle, color: 'text-destructive' };
    }
    return { status: 'unknown', icon: Clock, color: 'text-muted-foreground' };
  };

  if (loading && logs.length === 0) {
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
        <h1 className="text-3xl font-bold">Logs</h1>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Filters</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              disabled={!filters.project_id && !filters.service_id && !filters.startDate && !filters.endDate}
            >
              <X className="w-4 h-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label htmlFor="filter-project" className="text-sm font-medium">
                Project
              </label>
              <select
                id="filter-project"
                value={filters.project_id}
                onChange={(e) => handleFilterChange('project_id', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">All Projects</option>
                {projects.map((project) => (
                  <option key={project._id} value={project._id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="filter-service" className="text-sm font-medium">
                Service
              </label>
              <select
                id="filter-service"
                value={filters.service_id}
                onChange={(e) => handleFilterChange('service_id', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                disabled={!filters.project_id}
              >
                <option value="">All Services</option>
                {services.map((service) => (
                  <option key={service._id} value={service._id}>
                    {service.name}
                  </option>
                ))}
              </select>
              {/* {!filters.project_id && (
                <p className="text-xs text-muted-foreground">Select a project first</p>
              )} */}
            </div>

            <div className="space-y-2">
              <label htmlFor="filter-start-date" className="text-sm font-medium">
                Start Date
              </label>
              <Input
                id="filter-start-date"
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="filter-end-date" className="text-sm font-medium">
                End Date
              </label>
              <Input
                id="filter-end-date"
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs List */}
      {logs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Logs Found</h3>
            <p className="text-muted-foreground">
              {Object.values(filters).some(f => f) 
                ? 'Try adjusting your filters' 
                : 'No logs available yet'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {logs.map((log) => {
            const isExpanded = expandedLogs.has(log._id);
            const serviceStatus = getServiceStatus(log);
            const StatusIcon = serviceStatus.icon;

            return (
              <Card key={log._id} className="hover:shadow-lg transition-shadow">
                <CardHeader 
                  className="cursor-pointer p-4"
                  onClick={() => toggleLog(log._id)}
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      {/* Service Name - More Visible */}
                      {log.service_id && (
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <Server className="w-5 h-5 text-primary" />
                          <h3 className="text-xl font-bold text-foreground">
                            {log.service_id?.name || 'Unknown Service'}
                          </h3>
                          {/* Service Status - More Visible */}
                          <div className="flex items-center gap-1 ml-2">
                            <StatusIcon className={`w-5 h-5 ${serviceStatus.color}`} />
                            <span className={`text-base font-semibold ${serviceStatus.color}`}>
                              {serviceStatus.status.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {/* Summary */}
                      <div className="flex items-center gap-2 mb-2">
                        {getSeverityIcon(log.severity)}
                        <CardTitle className="text-base">{log.summary || 'Log Entry'}</CardTitle>
                      </div>
                    </div>
                    
                    {/* Right Side: Project, Timestamp, Severity, Expand Button */}
                    <div className="flex flex-col md:items-end gap-2 md:ml-4">
                      <div className="flex items-center gap-4 flex-wrap md:justify-end">
                        {log.project_id && (
                          <div className="flex items-center gap-1">
                            <FolderOpen className="w-4 h-4" />
                            <span className="text-sm">{log.project_id?.name || 'Unknown Project'}</span>
                          </div>
                        )}
                        <span className="text-sm text-muted-foreground">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(
                            log.severity
                          )}`}
                        >
                          {log.severity}
                        </span>
                      </div>
                      
                      {/* Expand/Collapse Button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="self-end md:self-auto"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLog(log._id);
                        }}
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                {/* Collapsible Content */}
                {isExpanded && (
                  <CardContent>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm font-medium mb-1">Log Text:</p>
                        <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                          {log.text}
                        </p>
                      </div>
                      {log.cause && (
                        <div>
                          <p className="text-sm font-medium mb-1">Cause:</p>
                          <p className="text-sm text-muted-foreground">{log.cause}</p>
                        </div>
                      )}
                      {log.fix && (
                        <div>
                          <p className="text-sm font-medium mb-1">Fix:</p>
                          <p className="text-sm text-muted-foreground bg-green-50 p-2 rounded">
                            {log.fix}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
};

export default Logs;

