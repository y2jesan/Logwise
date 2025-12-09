import {
  Edit,
  ExternalLink,
  FolderOpen,
  Plus,
  Trash2,
  UserPlus,
  Users,
  X
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import Button from '../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import Input from '../components/ui/Input';
import api from '../lib/api';
import useAuthStore from '../store/authStore';

const Projects = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [serviceFormData, setServiceFormData] = useState({
    name: '',
    url: '',
    auto_check: false,
    minute_interval: '',
    report_success: false
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects');
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setMessage(error.response?.data?.error || 'Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectDetails = async (projectId) => {
    try {
      const response = await api.get(`/projects/${projectId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching project details:', error);
      return null;
    }
  };

  const fetchAvailableUsers = async (projectId) => {
    try {
      if (user?.role === 'admin') {
        const response = await api.get(`/projects/${projectId}/users/available`);
        setAvailableUsers(response.data);
      }
    } catch (error) {
      console.error('Error fetching available users:', error);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      await api.post('/projects', formData);
      setMessage('Project created successfully!');
      setShowCreateModal(false);
      setFormData({ name: '', description: '' });
      fetchProjects();
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      await api.put(`/projects/${selectedProject._id}`, formData);
      setMessage('Project updated successfully!');
      setShowEditModal(false);
      setSelectedProject(null);
      setFormData({ name: '', description: '' });
      fetchProjects();
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to update project');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project? This will also delete all associated services and logs.')) {
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      await api.delete(`/projects/${projectId}`);
      setMessage('Project deleted successfully!');
      fetchProjects();
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to delete project');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignUser = async (userId) => {
    setLoading(true);
    setMessage('');

    try {
      await api.post(`/projects/${selectedProject._id}/assign`, { userId });
      setMessage('User assigned successfully!');
      const updatedProject = await fetchProjectDetails(selectedProject._id);
      if (updatedProject) {
        setSelectedProject(updatedProject);
        fetchAvailableUsers(selectedProject._id);
      }
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to assign user');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveUser = async (userId) => {
    setLoading(true);
    setMessage('');

    try {
      await api.delete(`/projects/${selectedProject._id}/assign/${userId}`);
      setMessage('User removed successfully!');
      const updatedProject = await fetchProjectDetails(selectedProject._id);
      if (updatedProject) {
        setSelectedProject(updatedProject);
        fetchAvailableUsers(selectedProject._id);
      }
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to remove user');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (project) => {
    setSelectedProject(project);
    setFormData({
      name: project.name,
      description: project.description || ''
    });
    setShowEditModal(true);
  };

  const openAssignModal = async (project) => {
    setSelectedProject(project);
    const projectDetails = await fetchProjectDetails(project._id);
    if (projectDetails) {
      setSelectedProject(projectDetails);
    }
    if (user?.role === 'admin') {
      await fetchAvailableUsers(project._id);
    }
    setShowAssignModal(true);
  };

  const isOwner = (project) => {
    return project.owner?._id === user?._id || project.owner === user?._id;
  };

  const canManage = (project) => {
    return user?.role === 'admin' || isOwner(project);
  };

  const handleCreateService = async (e) => {
    e.preventDefault();
    if (!selectedProject) return;

    setLoading(true);
    setMessage('');

    try {
      // Prepare data for API - only include minute_interval if auto_check is true
      const serviceData = {
        ...serviceFormData,
        project_id: selectedProject._id,
        minute_interval: serviceFormData.auto_check && serviceFormData.minute_interval ? Number(serviceFormData.minute_interval) : undefined
      };
      await api.post('/services', serviceData);
      setMessage('Service created successfully!');
      setShowServiceModal(false);
      setServiceFormData({ name: '', url: '', auto_check: false, minute_interval: '', report_success: false });
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to create service');
    } finally {
      setLoading(false);
    }
  };

  const openServiceModal = (project) => {
    setSelectedProject(project);
    setServiceFormData({ name: '', url: '', auto_check: false, minute_interval: '', report_success: false });
    setShowServiceModal(true);
  };

  if (loading && projects.length === 0) {
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
        <h1 className="text-3xl font-bold">Projects</h1>
          <Button 
            onClick={() => setShowCreateModal(true)}
            size="icon"
            className="md:w-auto md:h-auto md:px-4 md:py-2"
            title="Create Project"
          >
            <Plus className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Create Project</span>
          </Button>
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card key={project._id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="w-5 h-5 text-primary" />
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                  </div>
                  {canManage(project) && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(project)}
                        className="text-muted-foreground hover:text-foreground"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(project._id)}
                        className="text-destructive hover:text-destructive/80"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                <CardDescription>
                  {project.description || 'No description'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Owner: {project.owner?.email || 'Unknown'}
                  </p>
                  <div className="space-y-2">
                    
                    <div className="flex gap-2">
                      {canManage(project) && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => openAssignModal(project)}
                          title="Manage Users"
                        >
                          <Users className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => navigate(`/services?project_id=${project._id}`)}
                      title="View Services"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => openServiceModal(project)}
                        title="Add Service"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {projects.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No projects yet. Create your first project!</p>
            </CardContent>
          </Card>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Create Project</CardTitle>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setFormData({ name: '', description: '' });
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
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium">
                      Project Name *
                    </label>
                    <Input
                      id="name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter project name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="description" className="text-sm font-medium">
                      Description
                    </label>
                    <textarea
                      id="description"
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Enter project description"
                    />
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
                        setFormData({ name: '', description: '' });
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
        {showEditModal && selectedProject && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Edit Project</CardTitle>
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedProject(null);
                      setFormData({ name: '', description: '' });
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
                  <div className="space-y-2">
                    <label htmlFor="edit-name" className="text-sm font-medium">
                      Project Name *
                    </label>
                    <Input
                      id="edit-name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter project name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="edit-description" className="text-sm font-medium">
                      Description
                    </label>
                    <textarea
                      id="edit-description"
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Enter project description"
                    />
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
                        setSelectedProject(null);
                        setFormData({ name: '', description: '' });
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

        {/* Assign Users Modal */}
        {showAssignModal && selectedProject && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Manage Users - {selectedProject.name}</CardTitle>
                  <button
                    onClick={() => {
                      setShowAssignModal(false);
                      setSelectedProject(null);
                      setMessage('');
                    }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Assigned Users</h4>
                    <div className="space-y-2">
                      <div className="p-2 border rounded-md flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{selectedProject.owner?.email}</p>
                          <p className="text-xs text-muted-foreground">Owner</p>
                        </div>
                      </div>
                      {selectedProject.assignedUsers?.map((assignedUser) => (
                        <div
                          key={assignedUser._id}
                          className="p-2 border rounded-md flex items-center justify-between"
                        >
                          <div>
                            <p className="text-sm font-medium">{assignedUser.email}</p>
                            <p className="text-xs text-muted-foreground">{assignedUser.role}</p>
                          </div>
                          {canManage(selectedProject) && (
                            <button
                              onClick={() => handleRemoveUser(assignedUser._id)}
                              className="text-destructive hover:text-destructive/80"
                              title="Remove"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      {(!selectedProject.assignedUsers || selectedProject.assignedUsers.length === 0) && (
                        <p className="text-sm text-muted-foreground">No assigned users</p>
                      )}
                    </div>
                  </div>

                  {user?.role === 'admin' && availableUsers.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Available Users</h4>
                      <div className="space-y-2">
                        {availableUsers.map((availableUser) => (
                          <div
                            key={availableUser._id}
                            className="p-2 border rounded-md flex items-center justify-between"
                          >
                            <div>
                              <p className="text-sm font-medium">{availableUser.email}</p>
                              <p className="text-xs text-muted-foreground">{availableUser.role}</p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAssignUser(availableUser._id)}
                              disabled={loading}
                            >
                              <UserPlus className="w-4 h-4 mr-1" />
                              Assign
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {user?.role === 'admin' && availableUsers.length === 0 && (
                    <p className="text-sm text-muted-foreground">All users are already assigned</p>
                  )}

                  {user?.role !== 'admin' && (
                    <p className="text-sm text-muted-foreground">
                      Only admins can assign users to projects
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Create Service Modal */}
        {showServiceModal && selectedProject && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Create Service - {selectedProject.name}</CardTitle>
                  <button
                    onClick={() => {
                      setShowServiceModal(false);
                      setSelectedProject(null);
                      setServiceFormData({ name: '', url: '', auto_check: false, minute_interval: '', report_success: false });
                      setMessage('');
                    }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateService} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="service-name" className="text-sm font-medium">
                      Service Name *
                    </label>
                    <Input
                      id="service-name"
                      required
                      value={serviceFormData.name}
                      onChange={(e) => setServiceFormData({ ...serviceFormData, name: e.target.value })}
                      placeholder="Enter service name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="service-url" className="text-sm font-medium">
                      Service URL *
                    </label>
                    <Input
                      id="service-url"
                      type="url"
                      required
                      value={serviceFormData.url}
                      onChange={(e) => setServiceFormData({ ...serviceFormData, url: e.target.value })}
                      placeholder="https://example.com/health"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={serviceFormData.auto_check}
                        onChange={(e) => setServiceFormData({ ...serviceFormData, auto_check: e.target.checked, minute_interval: e.target.checked ? serviceFormData.minute_interval : '' })}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <span className="text-sm font-medium">Enable Auto-Check</span>
                    </label>
                    {serviceFormData.auto_check && (
                      <div className="ml-6 space-y-2">
                        <label htmlFor="service-minute-interval" className="text-sm font-medium">
                          Check Interval (minutes) *
                        </label>
                        <Input
                          id="service-minute-interval"
                          type="number"
                          required={serviceFormData.auto_check}
                          min="1"
                          value={serviceFormData.minute_interval}
                          onChange={(e) => setServiceFormData({ ...serviceFormData, minute_interval: e.target.value })}
                          placeholder="e.g., 5"
                        />
                      </div>
                    )}
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={serviceFormData.report_success}
                        onChange={(e) => setServiceFormData({ ...serviceFormData, report_success: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <span className="text-sm font-medium">Report Success (log and notify on successful checks)</span>
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={loading} className="flex-1">
                      {loading ? 'Creating...' : 'Create Service'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowServiceModal(false);
                        setSelectedProject(null);
                        setServiceFormData({ name: '', url: '', auto_check: false, minute_interval: '', report_success: false });
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

export default Projects;

