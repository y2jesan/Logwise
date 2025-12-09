import { AlertTriangle, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import LogCard from '../components/LogCard';
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
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
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
    // Get filters and page from URL query params
    const projectId = searchParams.get('project_id') || '';
    const serviceId = searchParams.get('service_id') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const page = parseInt(searchParams.get('page')) || 1;
    
    setFilters({
      project_id: projectId,
      service_id: serviceId,
      startDate,
      endDate
    });
    setPagination(prev => ({ ...prev, page }));
  }, [searchParams]);

  useEffect(() => {
    fetchServices();
  }, [filters.project_id]);

  useEffect(() => {
    fetchLogs();
  }, [filters, pagination.page]);

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
      params.append('limit', '20');
      params.append('page', pagination.page.toString());

      const response = await api.get(`/logs?${params.toString()}`);
      setLogs(response.data.logs || response.data);
      if (response.data.pagination) {
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    // Reset to page 1 when filters change
    setPagination(prev => ({ ...prev, page: 1 }));
    
    // Update URL params
    const params = new URLSearchParams();
    if (newFilters.project_id) params.set('project_id', newFilters.project_id);
    if (newFilters.service_id) params.set('service_id', newFilters.service_id);
    if (newFilters.startDate) params.set('startDate', newFilters.startDate);
    if (newFilters.endDate) params.set('endDate', newFilters.endDate);
    params.set('page', '1');
    setSearchParams(params);
  };

  const clearFilters = () => {
    setFilters({
      project_id: '',
      service_id: '',
      startDate: '',
      endDate: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
    setSearchParams({ page: '1' });
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
        <>
          <div className="space-y-4 mb-6">
            {logs.map((log) => (
              <LogCard key={log._id} log={log} />
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                    {pagination.total} logs
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        let pageNum;
                        if (pagination.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (pagination.page <= 3) {
                          pageNum = i + 1;
                        } else if (pagination.page >= pagination.totalPages - 2) {
                          pageNum = pagination.totalPages - 4 + i;
                        } else {
                          pageNum = pagination.page - 2 + i;
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={pagination.page === pageNum ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handlePageChange(pageNum)}
                            className="min-w-[2.5rem]"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </DashboardLayout>
  );
};

export default Logs;

