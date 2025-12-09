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
};

export default LogCard;

