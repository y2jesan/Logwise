import { Database, Loader2, Send, CheckCircle, XCircle, AlertTriangle, Zap, FileCode, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import Button from '../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import Input from '../components/ui/Input';
import api from '../lib/api';

const OptimizeQuery = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    project_id: '',
    function_name: '',
    query: ''
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
      const response = await api.post('/webhook/optimize-query', {
        project_id: formData.project_id,
        function_name: formData.function_name,
        query: formData.query
      });

      setResult(response.data);
      setMessage({ type: 'success', text: 'Query optimized successfully!' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to optimize query'
      });
    } finally {
      setLoading(false);
    }
  };

  const getQueryTypeColor = (queryType) => {
    const type = queryType?.toLowerCase() || '';
    if (type.includes('sql')) {
      return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800';
    } else if (type.includes('mongo') || type.includes('nosql')) {
      return 'text-green-600 bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800';
    }
    return 'text-purple-600 bg-purple-100 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800';
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Optimize Query</h1>
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
              <Database className="w-5 h-5" />
              Query Information
            </CardTitle>
            <CardDescription>
              Enter your database query (SQL or NoSQL) to get AI-powered optimization suggestions
            </CardDescription>
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
                  <FileCode className="w-4 h-4" />
                  Function Name
                </label>
                <Input
                  id="function_name"
                  type="text"
                  value={formData.function_name}
                  onChange={(e) => setFormData({ ...formData, function_name: e.target.value })}
                  placeholder="e.g., getUserData, fetchOrders, searchProducts"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="query" className="text-sm font-medium">
                  Query * (SQL or NoSQL)
                </label>
                <textarea
                  id="query"
                  required
                  value={formData.query}
                  onChange={(e) => setFormData({ ...formData, query: e.target.value })}
                  placeholder="Paste your database query here (SQL, MongoDB, etc.)..."
                  rows={12}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y font-mono"
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Optimizing Query...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Optimize Query
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Results */}
        {result && result.optimization && (
          <div className="space-y-4">
            {/* Query Type & Validation Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Query Analysis
                </CardTitle>
                <CardDescription>
                  Project: {result.project_name}
                  {result.function_name && ` | Function: ${result.function_name}`}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Query Type */}
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold mb-2">Query Type</h3>
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-md border ${getQueryTypeColor(result.optimization.queryType)}`}>
                      <Database className="w-4 h-4" />
                      <span className="font-semibold">{result.optimization.queryType}</span>
                      {result.optimization.language && (
                        <span className="text-xs opacity-75">({result.optimization.language})</span>
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold mb-2">Validation Status</h3>
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-md border ${
                      result.optimization.isValid
                        ? 'text-green-600 bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800'
                        : 'text-red-600 bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800'
                    }`}>
                      {result.optimization.isValid ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          <span className="font-semibold">Valid Query</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4" />
                          <span className="font-semibold">Invalid Query</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Errors (if any) */}
                {!result.optimization.isValid && result.optimization.errors && result.optimization.errors.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      Syntax Errors
                    </h3>
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3">
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {result.optimization.errors.map((error, index) => (
                          <li key={index} className="text-yellow-800 dark:text-yellow-200">
                            {error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Optimization Reason */}
                {result.optimization.optimizationReason && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                      Optimization Summary
                    </h3>
                    <p className="text-sm text-foreground bg-muted p-3 rounded-md">
                      {result.optimization.optimizationReason}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Optimizations */}
            {result.optimization.optimizations && result.optimization.optimizations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Optimization Suggestions
                  </CardTitle>
                  <CardDescription>
                    AI-powered recommendations to improve query performance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {result.optimization.optimizations.map((opt, index) => (
                      <div
                        key={index}
                        className="border rounded-md p-4 space-y-2 bg-muted/50"
                      >
                        <div className="flex items-start justify-between">
                          <h4 className="font-semibold text-sm flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            Suggestion {index + 1}
                          </h4>
                          {opt.impact && (
                            <span className={`text-xs px-2 py-1 rounded ${
                              opt.impact === 'high'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
                                : opt.impact === 'medium'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200'
                            }`}>
                              {opt.impact.toUpperCase()} Impact
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-foreground">
                          {opt.suggestion}
                        </p>
                        {opt.reason && (
                          <p className="text-xs text-muted-foreground">
                            {opt.reason}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Index Suggestions */}
            {result.optimization.indexSuggestions && result.optimization.indexSuggestions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    Index Suggestions
                  </CardTitle>
                  <CardDescription>
                    Recommended indexes to improve query performance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {result.optimization.indexSuggestions.map((index, idx) => (
                      <div
                        key={idx}
                        className="border rounded-md p-4 space-y-2 bg-muted/50"
                      >
                        <div className="flex items-start justify-between">
                          <h4 className="font-semibold text-sm flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-purple-600" />
                            Index {idx + 1}
                          </h4>
                        </div>
                        {index.index && (
                          <div className="bg-background border rounded p-3 font-mono text-sm">
                            {index.index}
                          </div>
                        )}
                        {index.reason && (
                          <p className="text-xs text-muted-foreground">
                            {index.reason}
                          </p>
                        )}
                        {index.columns && index.columns.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            <span className="text-xs font-medium">Columns:</span>
                            {index.columns.map((col, colIdx) => (
                              <span
                                key={colIdx}
                                className="text-xs px-2 py-1 bg-primary/10 text-primary rounded"
                              >
                                {col}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Optimized Query */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCode className="w-5 h-5" />
                  {result.optimization.isValid ? 'Optimized Query' : 'Corrected Query'}
                </CardTitle>
                <CardDescription>
                  {result.optimization.isValid
                    ? 'The optimized version of your query'
                    : 'The corrected and optimized version of your query'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted rounded-md p-4">
                  <pre className="text-sm font-mono whitespace-pre-wrap break-words text-foreground">
                    {result.optimization.correctedQuery || result.optimization.optimizedQuery}
                  </pre>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        result.optimization.correctedQuery || result.optimization.optimizedQuery
                      );
                      setMessage({ type: 'success', text: 'Query copied to clipboard!' });
                      setTimeout(() => setMessage({ type: '', text: '' }), 2000);
                    }}
                  >
                    Copy Query
                  </Button>
                </div>
                {/* Timestamp */}
                {result.optimization.createdAt && (
                  <div className="text-xs text-muted-foreground pt-2 border-t mt-4">
                    Optimized at: {new Date(result.optimization.createdAt).toLocaleString()}
                    {result.optimization.id && ` | Log ID: ${result.optimization.id}`}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default OptimizeQuery;

