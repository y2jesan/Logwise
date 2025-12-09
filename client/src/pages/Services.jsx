import {
  AlertCircle,
  CheckCircle,
  Clock,
  Edit,
  FolderOpen,
  Plus,
  RefreshCw,
  Server,
  Trash2,
  X,
  XCircle
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import Button from '../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import Input from '../components/ui/Input';
import api from '../lib/api';
import useAuthStore from '../store/authStore';

const Services = () => {
  const { user } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [services, setServices] = useState([]);
  const [projects, setProjects] = useState([]);
  const [projectMap, setProjectMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [checkingServiceId, setCheckingServiceId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    project_id: '',
    auto_check: false,
    minute_interval: '',
    report_success: false
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    // Get project_id from URL query params on initial load
    const projectIdFromUrl = searchParams.get('project_id');
    if (projectIdFromUrl) {
      setSelectedProjectId(projectIdFromUrl);
    } else {
      // If no project_id in URL, show all services
      setSelectedProjectId('');
    }
  }, [searchParams]);

  useEffect(() => {
    if (projects.length > 0) {
      // Create a map of project IDs to project names
      const map = {};
      projects.forEach(project => {
        map[project._id] = project;
      });
      setProjectMap(map);
      
      // Set default project_id for form if not set
      if (!formData.project_id && projects.length > 0 && !selectedProjectId) {
        setFormData(prev => ({ ...prev, project_id: projects[0]._id }));
      }
    }
  }, [projects]);

  useEffect(() => {
    if (projects.length > 0) {
      fetchServices();
    }
  }, [selectedProjectId, projects]);

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects');
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchServices = async () => {
    setLoading(true);
    try {
      const query = selectedProjectId ? `?project_id=${selectedProjectId}` : '';
      const response = await api.get(`/services${query}`);
      setServices(response.data);
    } catch (error) {
      console.error('Error fetching services:', error);
      setMessage(error.response?.data?.error || 'Failed to fetch services');
    } finally {
      setLoading(false);
    }
  };

  const handleProjectFilterChange = (projectId) => {
    setSelectedProjectId(projectId);
    if (projectId) {
      setSearchParams({ project_id: projectId });
    } else {
      setSearchParams({});
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Prepare data for API - only include minute_interval if auto_check is true
      const serviceData = {
        ...formData,
        minute_interval: formData.auto_check && formData.minute_interval ? Number(formData.minute_interval) : undefined
      };
      await api.post('/services', serviceData);
      setMessage('Service created successfully!');
      setShowCreateModal(false);
      setFormData({ name: '', url: '', project_id: selectedProjectId || projects[0]?._id || '', auto_check: false, minute_interval: '', report_success: false });
      fetchServices();
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to create service');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Prepare data for API - only include minute_interval if auto_check is true
      const serviceData = {
        ...formData,
        minute_interval: formData.auto_check && formData.minute_interval ? Number(formData.minute_interval) : undefined
      };
      await api.put(`/services/${selectedService._id}`, serviceData);
      setMessage('Service updated successfully!');
      setShowEditModal(false);
      setSelectedService(null);
      setFormData({ name: '', url: '', project_id: '', auto_check: false, minute_interval: '', report_success: false });
      fetchServices();
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to update service');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (serviceId) => {
    if (!window.confirm('Are you sure you want to delete this service?')) {
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      await api.delete(`/services/${serviceId}`);
      setMessage('Service deleted successfully!');
      fetchServices();
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to delete service');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    setLoading(true);
    setMessage('');

    try {
      const query = selectedProjectId ? `?project_id=${selectedProjectId}` : '';
      await api.get(`/services/status${query}`);
      setMessage('Service status checked successfully!');
      fetchServices();
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to check service status');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckSingleServiceStatus = async (serviceId) => {
    setCheckingServiceId(serviceId);
    setMessage('');

    try {
      await api.get(`/services/${serviceId}/status`);
      setMessage('Service status checked successfully!');
      fetchServices();
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to check service status');
    } finally {
      setCheckingServiceId(null);
    }
  };

  const openEditModal = (service) => {
    setSelectedService(service);
    setFormData({
      name: service.name,
      url: service.url,
      project_id: service.project_id,
      auto_check: service.auto_check || false,
      minute_interval: service.minute_interval || '',
      report_success: service.report_success || false
    });
    setShowEditModal(true);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'up':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'down':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'up':
        return 'bg-green-100 text-green-800';
      case 'down':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && services.length === 0) {
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
        <h1 className="text-3xl font-bold">Services</h1>
          <div className="flex gap-2">
            {services.length > 0 && (
              <Button 
                variant="outline" 
                size="icon"
                onClick={handleCheckStatus} 
                disabled={loading}
                className="md:w-auto md:h-auto md:px-4 md:py-2"
                title="Check Status"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''} md:mr-2`} />
                <span className="hidden md:inline">Check Status</span>
              </Button>
            )}
            <Button 
              onClick={() => {
                setFormData({ name: '', url: '', project_id: selectedProjectId || projects[0]?._id || '', auto_check: false, minute_interval: '', report_success: false });
                setShowCreateModal(true);
              }}
              size="icon"
              className="md:w-auto md:h-auto md:px-4 md:py-2"
              title="Create Service"
            >
              <Plus className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Create Service</span>
            </Button>
          </div>
        </div>

        {message && (
          <div
            className={`mb-6 p-3 rounded-md text-sm ${
              message.includes('success')
                ? 'bg-green-100 text-green-800'
                : 'bg-destructive/10 text-destructive'
            }`}
          >
            {message}
          </div>
        )}

        {projects.length > 0 && (
          <div className="mb-6">
            <label htmlFor="project-select" className="text-sm font-medium mb-2 block">
              Filter by Project
            </label>
            <select
              id="project-select"
              value={selectedProjectId || ''}
              onChange={(e) => handleProjectFilterChange(e.target.value)}
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">All Projects</option>
              {projects.map((project) => (
                <option key={project._id} value={project._id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {services.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Server className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Services Yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first service to start monitoring
              </p>
              <Button onClick={() => {
                setFormData({ name: '', url: '', project_id: selectedProjectId || projects[0]?._id || '', auto_check: false, minute_interval: '', report_success: false });
                setShowCreateModal(true);
              }}>
                <Plus className="w-4 h-4 mr-2" />
                Create Service
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <Card key={service._id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Server className="w-5 h-5 text-primary" />
                      <CardTitle className="text-lg">{service.name}</CardTitle>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(service)}
                        className="text-muted-foreground hover:text-foreground"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(service._id)}
                        className="text-destructive hover:text-destructive/80"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <CardDescription className="break-all">
                    {service.url}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {service.project_id && projectMap[service.project_id] && (
                      <div className="flex items-center gap-2 mb-2">
                        <FolderOpen className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {projectMap[service.project_id].name}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">Status:</span>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(service.status)}
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              service.status
                            )}`}
                          >
                            {service.status || 'unknown'}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleCheckSingleServiceStatus(service._id)}
                        disabled={checkingServiceId === service._id}
                        title="Check Status"
                      >
                        <RefreshCw className={`w-4 h-4 ${checkingServiceId === service._id ? 'animate-spin' : ''}`} />
                      </Button>
                    </div>
                    {service.lastChecked && (
                      <p className="text-xs text-muted-foreground">
                        Last checked: {new Date(service.lastChecked).toLocaleString()}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className={`w-4 h-4 ${service.auto_check ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`} />
                      <span className={`text-sm ${service.auto_check ? 'text-green-700 dark:text-green-300 font-medium' : 'text-muted-foreground'}`}>
                        Auto-Check: {service.auto_check ? `Enabled (every ${service.minute_interval} min)` : 'Disabled'}
                      </span>
                    </div>
                    {service.auto_check && service.report_success && (
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-muted-foreground italic">
                          ✓ Reports success
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Create Service</CardTitle>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setFormData({ name: '', url: '', project_id: selectedProjectId || projects[0]?._id || '', auto_check: false, minute_interval: '', report_success: false });
                      setMessage('');
                    }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreate} className="space-y-4">
                  {projects.length > 0 && (
                    <div className="space-y-2">
                      <label htmlFor="create-project" className="text-sm font-medium">
                        Project *
                      </label>
                      <select
                        id="create-project"
                        required
                        value={formData.project_id}
                        onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <option value="">Select a project</option>
                        {projects.map((project) => (
                          <option key={project._id} value={project._id}>
                            {project.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="space-y-2">
                    <label htmlFor="create-name" className="text-sm font-medium">
                      Service Name *
                    </label>
                    <Input
                      id="create-name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter service name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="create-url" className="text-sm font-medium">
                      Service URL *
                    </label>
                    <Input
                      id="create-url"
                      type="url"
                      required
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                      placeholder="https://example.com/health"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.auto_check}
                        onChange={(e) => setFormData({ ...formData, auto_check: e.target.checked, minute_interval: e.target.checked ? formData.minute_interval : '' })}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <span className="text-sm font-medium">Enable Auto-Check</span>
                    </label>
                    {formData.auto_check && (
                      <div className="ml-6 space-y-2">
                        <label htmlFor="create-minute-interval" className="text-sm font-medium">
                          Check Interval (minutes) *
                        </label>
                        <Input
                          id="create-minute-interval"
                          type="number"
                          required={formData.auto_check}
                          min="1"
                          value={formData.minute_interval}
                          onChange={(e) => setFormData({ ...formData, minute_interval: e.target.value })}
                          placeholder="e.g., 5"
                        />
                      </div>
                    )}
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.report_success}
                        onChange={(e) => setFormData({ ...formData, report_success: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <span className="text-sm font-medium">Log Success (log on successful checks)</span>
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={loading} className="flex-1">
                      {loading ? 'Creating...' : 'Create'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowCreateModal(false);
                        setFormData({ name: '', url: '', project_id: selectedProjectId || projects[0]?._id || '', auto_check: false, minute_interval: '', report_success: false });
                        setMessage('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && selectedService && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Edit Service</CardTitle>
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedService(null);
                      setFormData({ name: '', url: '', project_id: '', auto_check: false, minute_interval: '', report_success: false });
                      setMessage('');
                    }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdate} className="space-y-4">
                  {projects.length > 0 && (
                    <div className="space-y-2">
                      <label htmlFor="edit-project" className="text-sm font-medium">
                        Project *
                      </label>
                      <select
                        id="edit-project"
                        required
                        value={formData.project_id}
                        onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        {projects.map((project) => (
                          <option key={project._id} value={project._id}>
                            {project.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="space-y-2">
                    <label htmlFor="edit-name" className="text-sm font-medium">
                      Service Name *
                    </label>
                    <Input
                      id="edit-name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter service name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="edit-url" className="text-sm font-medium">
                      Service URL *
                    </label>
                    <Input
                      id="edit-url"
                      type="url"
                      required
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                      placeholder="https://example.com/health"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.auto_check}
                        onChange={(e) => setFormData({ ...formData, auto_check: e.target.checked, minute_interval: e.target.checked ? formData.minute_interval : '' })}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <span className="text-sm font-medium">Enable Auto-Check</span>
                    </label>
                    {formData.auto_check && (
                      <div className="ml-6 space-y-2">
                        <label htmlFor="edit-minute-interval" className="text-sm font-medium">
                          Check Interval (minutes) *
                        </label>
                        <Input
                          id="edit-minute-interval"
                          type="number"
                          required={formData.auto_check}
                          min="1"
                          value={formData.minute_interval}
                          onChange={(e) => setFormData({ ...formData, minute_interval: e.target.value })}
                          placeholder="e.g., 5"
                        />
                      </div>
                    )}
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.report_success}
                        onChange={(e) => setFormData({ ...formData, report_success: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <span className="text-sm font-medium">Log Success (log and notify on successful checks)</span>
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={loading} className="flex-1">
                      {loading ? 'Updating...' : 'Update'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowEditModal(false);
                        setSelectedService(null);
                        setFormData({ name: '', url: '', project_id: '', auto_check: false, minute_interval: '', report_success: false });
                        setMessage('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
    </DashboardLayout>
  );
};

export default Services;

