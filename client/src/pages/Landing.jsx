import { Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import Button from '../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { 
  Brain, 
  Bell, 
  Activity, 
  Zap, 
  BarChart3 
} from 'lucide-react';

const Landing = () => {
  const { user } = useAuthStore();

  const features = [
    {
      icon: Brain,
      title: 'AI Log Analyzer',
      description: 'Intelligent log analysis using Groq AI to identify patterns, errors, and anomalies in your application logs.'
    },
    {
      icon: Bell,
      title: 'AI Alerting System',
      description: 'Smart notifications via Telegram when critical issues are detected, with AI-powered root cause analysis.'
    },
    {
      icon: Activity,
      title: 'Smart Uptime Monitor',
      description: 'Monitor your services and get instant alerts when they go down, with AI-determined probable causes.'
    },
    {
      icon: Zap,
      title: 'API Performance Watcher',
      description: 'Track API response times and receive alerts when performance thresholds are exceeded.'
    },
    {
      icon: BarChart3,
      title: 'Dashboard + History',
      description: 'Comprehensive dashboard with system metrics, recent errors, and AI-generated summaries.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">LogWise AI</h1>
          <div className="flex gap-2">
            {user ? (
              <Link to="/dashboard">
                <Button>Go to Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="outline">Login</Button>
                </Link>
                <Link to="/register">
                  <Button>Register</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-5xl font-bold mb-6">
          Error Detection & Resolver Tool
        </h2>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          AI-powered log analysis and monitoring system that detects errors, 
          analyzes root causes, and provides intelligent solutions.
        </p>
        {!user && (
          <Link to="/login">
            <Button size="lg">Get Started</Button>
          </Link>
        )}
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <h3 className="text-3xl font-bold text-center mb-12">Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index}>
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
          <p>© 2024 LogWise AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;

