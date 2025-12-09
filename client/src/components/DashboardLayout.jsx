import {
  Activity,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  LogOut,
  Menu,
  Moon,
  Settings,
  Sun,
  TrendingUp,
  X
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import useAuthStore from '../store/authStore';
import Button from './ui/Button';

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    // Load from localStorage, default to false (expanded) for desktop
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebarCollapsed');
      return saved === 'true';
    }
    return false;
  });

  // Save to localStorage when collapsed state changes (desktop only)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      localStorage.setItem('sidebarCollapsed', sidebarCollapsed.toString());
    }
  }, [sidebarCollapsed]);

  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  // Close sidebar when route changes on mobile
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [sidebarOpen]);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-card border-b flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-primary">LogWise AI</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            className="h-8 w-8"
          >
            {theme === 'light' ? (
              <Moon className="w-4 h-4" />
            ) : (
              <Sun className="w-4 h-4" />
            )}
          </Button>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle menu"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </header>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full border-r bg-card z-40 transform transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } ${
          sidebarCollapsed ? 'w-16 md:w-16' : 'w-64'
        }`}
      >
        <div className="flex flex-col h-full relative">
          {/* Collapse/Expand Button - Desktop Only */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-50 bg-card border rounded-r-md hover:bg-accent h-8 w-8"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </Button>

          <div className={`flex-1 overflow-y-auto ${sidebarCollapsed ? 'p-2' : 'p-4'}`}>
            <div className={`flex items-center ${sidebarCollapsed ? 'flex-col gap-2 justify-center mb-6' : 'justify-between mb-8'}`}>
              {!sidebarCollapsed ? (
                <div className="flex items-center gap-2 flex-1">
                  <h2 className="text-2xl font-bold text-primary">LogWise AI</h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleTheme}
                    title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
                    className="h-8 w-8"
                  >
                    {theme === 'light' ? (
                      <Moon className="w-4 h-4" />
                    ) : (
                      <Sun className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              ) : (
                <>
                  <h2 className="text-lg font-bold text-primary">LW</h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleTheme}
                    title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
                    className="h-8 w-8"
                  >
                    {theme === 'light' ? (
                      <Moon className="w-4 h-4" />
                    ) : (
                      <Sun className="w-4 h-4" />
                    )}
                  </Button>
                </>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setSidebarOpen(false)}
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <nav className={`${sidebarCollapsed ? 'space-y-1' : 'space-y-2'}`}>
              <Link
                to="/dashboard"
                className={`group relative flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} ${
                  sidebarCollapsed ? 'px-2 py-3' : 'px-4 py-2'
                } rounded-md transition-colors ${
                  isActive('/dashboard')
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent text-foreground'
                }`}
                onClick={() => setSidebarOpen(false)}
                title={sidebarCollapsed ? 'Dashboard' : ''}
              >
                <Activity className={`${sidebarCollapsed ? 'w-5 h-5' : 'w-5 h-5'} flex-shrink-0`} />
                {!sidebarCollapsed && <span className="text-sm">Dashboard</span>}
                {sidebarCollapsed && isActive('/dashboard') && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
                )}
              </Link>
              <Link
                to="/logs"
                className={`group relative flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} ${
                  sidebarCollapsed ? 'px-2 py-3' : 'px-4 py-2'
                } rounded-md transition-colors ${
                  isActive('/logs')
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent text-foreground'
                }`}
                onClick={() => setSidebarOpen(false)}
                title={sidebarCollapsed ? 'Logs' : ''}
              >
                <AlertTriangle className={`${sidebarCollapsed ? 'w-5 h-5' : 'w-5 h-5'} flex-shrink-0`} />
                {!sidebarCollapsed && <span className="text-sm">Logs</span>}
                {sidebarCollapsed && isActive('/logs') && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
                )}
              </Link>
              <Link
                to="/projects"
                className={`group relative flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} ${
                  sidebarCollapsed ? 'px-2 py-3' : 'px-4 py-2'
                } rounded-md transition-colors ${
                  isActive('/projects')
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent text-foreground'
                }`}
                onClick={() => setSidebarOpen(false)}
                title={sidebarCollapsed ? 'Projects' : ''}
              >
                <FolderOpen className={`${sidebarCollapsed ? 'w-5 h-5' : 'w-5 h-5'} flex-shrink-0`} />
                {!sidebarCollapsed && <span className="text-sm">Projects</span>}
                {sidebarCollapsed && isActive('/projects') && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
                )}
              </Link>
              <Link
                to="/services"
                className={`group relative flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} ${
                  sidebarCollapsed ? 'px-2 py-3' : 'px-4 py-2'
                } rounded-md transition-colors ${
                  isActive('/services')
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent text-foreground'
                }`}
                onClick={() => setSidebarOpen(false)}
                title={sidebarCollapsed ? 'Services' : ''}
              >
                <TrendingUp className={`${sidebarCollapsed ? 'w-5 h-5' : 'w-5 h-5'} flex-shrink-0`} />
                {!sidebarCollapsed && <span className="text-sm">Services</span>}
                {sidebarCollapsed && isActive('/services') && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
                )}
              </Link>
              
              {user?.role === 'admin' && (
                <Link
                  to="/settings"
                  className={`group relative flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} ${
                    sidebarCollapsed ? 'px-2 py-3' : 'px-4 py-2'
                  } rounded-md transition-colors ${
                    isActive('/settings')
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent text-foreground'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                  title={sidebarCollapsed ? 'Settings' : ''}
                >
                  <Settings className={`${sidebarCollapsed ? 'w-5 h-5' : 'w-5 h-5'} flex-shrink-0`} />
                  {!sidebarCollapsed && <span className="text-sm">Settings</span>}
                  {sidebarCollapsed && isActive('/settings') && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
                  )}
                </Link>
              )}
            </nav>
          </div>
          <div className={`border-t ${sidebarCollapsed ? 'p-2' : 'p-4'}`}>
            <div className={`flex items-center ${sidebarCollapsed ? 'flex-col justify-center gap-2' : 'justify-between'}`}>
              {!sidebarCollapsed ? (
                <>
                  <Link
                    to="/profile"
                    className="flex-1 hover:opacity-80 transition-opacity"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <p className="text-sm font-medium truncate">
                      {user?.name || user?.email}
                    </p>
                    <p className="text-xs text-muted-foreground">{user?.role}</p>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-2"
                    onClick={handleLogout}
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Link
                    to="/profile"
                    className="hover:opacity-80 transition-opacity group relative"
                    onClick={() => setSidebarOpen(false)}
                    title={user?.name || user?.email}
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20 group-hover:border-primary/40 transition-colors">
                      <span className="text-sm font-medium text-primary">
                        {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-10 h-10"
                    onClick={handleLogout}
                    title="Logout"
                  >
                    <LogOut className="w-5 h-5" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`pt-16 md:pt-0 p-4 md:p-8 transition-all duration-300 ${
        sidebarCollapsed ? 'md:ml-16' : 'md:ml-64'
      }`}>
        <div className="max-w-7xl mx-auto py-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;

