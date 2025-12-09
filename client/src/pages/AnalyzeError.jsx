import { AlertTriangle, CheckCircle, FileText, Loader2, Send, Settings, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import Button from '../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import Input from '../components/ui/Input';
import api from '../lib/api';

const AnalyzeError = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    project_id: '',
    function_name: '',
    error_text: ''
  });
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects');
      setProjects(response.data);
      if (response.data.length > 0 && !formData.project_id) {
        setFormData(prev => ({ ...prev, project_id: response.data[0]._id }));
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      setMessage({ type: 'error', text: 'Failed to fetch projects' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    setResult(null);

    try {
      const response = await api.post('/webhook/analyze', {
        project_id: formData.project_id,
        function_name: formData.function_name,
        error_text: formData.error_text
      });

      setResult(response.data);
      setMessage({ type: 'success', text: 'Error analyzed successfully!' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to analyze error'
      });
    } finally {
      setLoading(false);
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="w-5 h-5 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      default:
        return <CheckCircle className="w-5 h-5 text-green-600" />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'text-destructive bg-destructive/10 border-destructive/20';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800';
      default:
        return 'text-green-600 bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800';
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Analyze Error</h1>
        </div>

        {message.text && (
          <div
            className={`p-4 rounded-md ${
              message.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Error Information
            </CardTitle>
            <CardDescription>Enter error details to analyze with AI</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="project" className="text-sm font-medium">
                  Project *
                </label>
                <select
                  id="project"
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

              <div className="space-y-2">
                <label htmlFor="function_name" className="text-sm font-medium flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Function Name
                </label>
                <Input
                  id="function_name"
                  type="text"
                  value={formData.function_name}
                  onChange={(e) => setFormData({ ...formData, function_name: e.target.value })}
                  placeholder="e.g., processPayment, handleRequest"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="error_text" className="text-sm font-medium">
                  Error Text *
                </label>
                <textarea
                  id="error_text"
                  required
                  value={formData.error_text}
                  onChange={(e) => setFormData({ ...formData, error_text: e.target.value })}
                  placeholder="Paste your error log or stack trace here..."
                  rows={10}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Analyze Error
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Results */}
        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getSeverityIcon(result.log.severity)}
                Analysis Results
              </CardTitle>
              <CardDescription>
                Project: {result.project_name} | Log ID: {result.log.id}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Severity Badge */}
              <div className={`flex items-center gap-2 px-4 py-2 rounded-md border ${getSeverityColor(result.log.severity)}`}>
                <span className="font-semibold">Severity:</span>
                <span className="font-bold uppercase">{result.log.severity}</span>
              </div>

              {/* Summary */}
              <div>
                <h3 className="text-sm font-semibold mb-2">Summary</h3>
                <p className="text-sm text-foreground bg-muted p-3 rounded-md">
                  {result.log.summary}
                </p>
              </div>

              {/* Root Cause */}
              <div>
                <h3 className="text-sm font-semibold mb-2">Root Cause</h3>
                <p className="text-sm text-foreground bg-muted p-3 rounded-md">
                  {result.log.cause}
                </p>
              </div>

              {/* Fix Recommendation */}
              <div>
                <h3 className="text-sm font-semibold mb-2">Recommended Fix</h3>
                <p className="text-sm text-green-900 dark:text-green-100 bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 p-3 rounded-md">
                  {result.log.fix}
                </p>
              </div>

              {/* Timestamp */}
              <div className="text-xs text-muted-foreground pt-2 border-t">
                Analyzed at: {new Date(result.log.createdAt).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AnalyzeError;

