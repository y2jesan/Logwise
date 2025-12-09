import {
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Database,
  FileCode,
  FolderOpen,
  Settings,
  TrendingUp,
  XCircle,
  Zap
} from 'lucide-react';
import { useState } from 'react';
import Button from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';

const QueryOptimizeLogCard = ({ log }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleLog = () => {
    setIsExpanded(!isExpanded);
  };

  const getQueryTypeColor = (queryType) => {
    const type = queryType?.toLowerCase() || '';
    if (type.includes('sql')) {
      return 'text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-800';
    } else if (type.includes('mongo') || type.includes('nosql')) {
      return 'text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/40 border border-green-200 dark:border-green-800';
    }
    return 'text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/40 border border-purple-200 dark:border-purple-800';
  };

  const getValidationColor = (isValid) => {
    return isValid
      ? 'text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/40 border border-green-200 dark:border-green-800'
      : 'text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/40 border border-red-200 dark:border-red-800';
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader 
        className="cursor-pointer p-4"
        onClick={toggleLog}
      >
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex-1">
            {/* Query Type and Validation Status */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Database className="w-5 h-5 text-primary" />
              <h3 className="text-xl font-bold text-foreground">
                {log.queryType || 'Unknown Query Type'}
              </h3>
              {log.language && (
                <span className="text-sm text-muted-foreground">
                  ({log.language})
                </span>
              )}
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${getQueryTypeColor(
                  log.queryType
                )}`}
              >
                {log.queryType || 'Unknown'}
              </span>
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${getValidationColor(
                  log.isValid
                )}`}
              >
                {log.isValid ? (
                  <span className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Valid
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <XCircle className="w-3 h-3" />
                    Invalid
                  </span>
                )}
              </span>
            </div>
            
            {/* Function Name */}
            {log.function_name && (
              <div className="flex items-center gap-2 mb-2">
                <Settings className="w-4 h-4 text-muted-foreground" /> 
                <span className="text-sm font-medium">{log.function_name}</span>
              </div>
            )}

            {/* Optimization Summary */}
            {log.optimizationReason && (
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-yellow-600" />
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {log.optimizationReason}
                </p>
              </div>
            )}

            {/* Query Preview */}
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground font-mono line-clamp-1">
                {log.query || 'No query'}
              </p>
            </div>
          </div>
          
          {/* Right Side: Project, Timestamp, Stats, Expand Button */}
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
            </div>

            {/* Stats */}
            <div className="flex items-center gap-2 flex-wrap md:justify-end">
              {log.optimizations && log.optimizations.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {log.optimizations.length} optimization{log.optimizations.length !== 1 ? 's' : ''}
                </span>
              )}
              {log.indexSuggestions && log.indexSuggestions.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {log.indexSuggestions.length} index suggestion{log.indexSuggestions.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            
            {/* Expand/Collapse Button */}
            <Button
              variant="ghost"
              size="icon"
              className="self-end md:self-auto"
              onClick={(e) => {
                e.stopPropagation();
                toggleLog();
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
          <div className="space-y-4">
            {/* Original Query */}
            <div>
              <p className="text-sm font-medium mb-1 flex items-center gap-2">
                <FileCode className="w-4 h-4" />
                Original Query:
              </p>
              <pre className="text-xs text-muted-foreground bg-muted p-3 rounded font-mono whitespace-pre-wrap break-words">
                {log.query || 'No query provided'}
              </pre>
            </div>

            {/* Errors (if any) */}
            {!log.isValid && log.errors && log.errors.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-1 flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-600" />
                  Syntax Errors:
                </p>
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {log.errors.map((error, index) => (
                      <li key={index} className="text-red-800 dark:text-red-200">
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Optimization Reason */}
            {log.optimizationReason && (
              <div>
                <p className="text-sm font-medium mb-1 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  Optimization Summary:
                </p>
                <p className="text-sm text-foreground bg-muted p-3 rounded-md">
                  {log.optimizationReason}
                </p>
              </div>
            )}

            {/* Optimizations */}
            {log.optimizations && log.optimizations.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-600" />
                  Optimization Suggestions ({log.optimizations.length}):
                </p>
                <div className="space-y-2">
                  {log.optimizations.map((opt, index) => (
                    <div
                      key={index}
                      className="border rounded-md p-3 space-y-1 bg-muted/50"
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
              </div>
            )}

            {/* Index Suggestions */}
            {log.indexSuggestions && log.indexSuggestions.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Database className="w-4 h-4 text-purple-600" />
                  Index Suggestions ({log.indexSuggestions.length}):
                </p>
                <div className="space-y-2">
                  {log.indexSuggestions.map((index, idx) => (
                    <div
                      key={idx}
                      className="border rounded-md p-3 space-y-1 bg-muted/50"
                    >
                      <div className="flex items-start justify-between">
                        <h4 className="font-semibold text-sm flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-purple-600" />
                          Index {idx + 1}
                        </h4>
                      </div>
                      {index.index && (
                        <div className="bg-background border rounded p-2 font-mono text-xs">
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
              </div>
            )}

            {/* Optimized/Corrected Query */}
            <div>
              <p className="text-sm font-medium mb-1 flex items-center gap-2">
                <FileCode className="w-4 h-4" />
                {log.isValid ? 'Optimized Query:' : 'Corrected Query:'}
              </p>
              <div className="bg-muted rounded-md p-3">
                <pre className="text-xs font-mono whitespace-pre-wrap break-words text-foreground">
                  {log.correctedQuery || log.optimizedQuery || log.query}
                </pre>
              </div>
              <div className="mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      log.correctedQuery || log.optimizedQuery || log.query
                    );
                  }}
                >
                  Copy Query
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default QueryOptimizeLogCard;

