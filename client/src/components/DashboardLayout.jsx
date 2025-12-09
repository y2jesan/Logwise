import {
  Activity,
  AlertTriangle,
  FolderOpen,
  LogOut,
  Settings,
  TrendingUp
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import Button from './ui/Button';

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuthStore();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 border-r bg-card">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-primary mb-8">LogWise AI</h2>
          <nav className="space-y-2">
            <Link
              to="/dashboard"
              className={`flex items-center gap-3 px-4 py-2 rounded-md ${
                isActive('/dashboard')
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent'
              }`}
            >
              <Activity className="w-5 h-5" />
              Dashboard
            </Link>
            <Link
              to="/logs"
              className={`flex items-center gap-3 px-4 py-2 rounded-md ${
                isActive('/logs')
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
              Logs
            </Link>
            <Link
              to="/projects"
              className={`flex items-center gap-3 px-4 py-2 rounded-md ${
                isActive('/projects')
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent'
              }`}
            >
              <FolderOpen className="w-5 h-5" />
              Projects
            </Link>
            <Link
              to="/services"
              className={`flex items-center gap-3 px-4 py-2 rounded-md ${
                isActive('/services')
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent'
              }`}
            >
              <TrendingUp className="w-5 h-5" />
              Services
            </Link>
            
            {user?.role === 'admin' && (
              <Link
                to="/settings"
                className={`flex items-center gap-3 px-4 py-2 rounded-md ${
                  isActive('/settings')
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent'
                }`}
              >
                <Settings className="w-5 h-5" />
                Settings
              </Link>
            )}
          </nav>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t">
          <div className="mb-4">
            <p className="text-sm font-medium">{user?.email}</p>
            <p className="text-xs text-muted-foreground">{user?.role}</p>
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;

