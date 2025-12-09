import {
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  FolderOpen,
  Server,
  Settings,
  XCircle
} from 'lucide-react';
import { useState } from 'react';
import Button from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';

const LogCard = ({ log }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleLog = () => {
    setIsExpanded(!isExpanded);
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/40 border border-red-200 dark:border-red-800';
      case 'warning':
        return 'text-yellow-700 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-900/40 border border-yellow-200 dark:border-yellow-800';
      default:
        return 'text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-800';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-4 h-4 text-red-700 dark:text-red-400" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-700 dark:text-yellow-400" />;
      default:
        return <Clock className="w-4 h-4 text-blue-700 dark:text-blue-400" />;
    }
  };

  const getServiceStatus = (log) => {
    // Extract status from log text or determine from severity
    const text = log.text?.toLowerCase() || '';
    if (text.includes('is up') || text.includes('operational')) {
      return { 
        status: 'up', 
        icon: CheckCircle, 
        color: 'text-green-700 dark:text-green-300',
        bgColor: 'bg-green-100 dark:bg-green-900/40',
        borderColor: 'border-green-200 dark:border-green-800'
      };
    }
    if (text.includes('is down') || text.includes('unreachable') || log.severity === 'critical') {
      return { 
        status: 'down', 
        icon: XCircle, 
        color: 'text-red-700 dark:text-red-300',
        bgColor: 'bg-red-100 dark:bg-red-900/40',
        borderColor: 'border-red-200 dark:border-red-800'
      };
    }
    return { 
      status: 'unknown', 
      icon: Clock, 
      color: 'text-gray-700 dark:text-gray-300',
      bgColor: 'bg-gray-100 dark:bg-gray-800',
      borderColor: 'border-gray-200 dark:border-gray-700'
    };
  };

  const serviceStatus = getServiceStatus(log);
  const StatusIcon = serviceStatus.icon;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader 
        className="cursor-pointer p-4"
        onClick={toggleLog}
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
                <div className={`flex items-center gap-1.5 ml-2 px-3 py-1 rounded-full border ${serviceStatus.bgColor} ${serviceStatus.borderColor}`}>
                  <StatusIcon className={`w-4 h-4 ${serviceStatus.color}`} />
                  <span className={`text-sm font-bold ${serviceStatus.color}`}>
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
            {log.function_name && (
              <div className="flex items-center gap-2 mb-2">
                <Settings className="w-4 h-4 text-muted-foreground" /> 
                <CardTitle className="text-base">{log.function_name}</CardTitle>
              </div>
            )}
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
                <p className="text-sm text-green-900 dark:text-green-100 bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 p-3 rounded-md">
                  {log.fix}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default LogCard;

