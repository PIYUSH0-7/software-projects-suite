import * as React from 'react';
import { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import DomainTracker from './components/DomainTracker';
import TaskSubmitter from './components/TaskSubmitter';
import AuthModal from './components/AuthModal';
import { INITIAL_DOMAINS } from './data';
import { Domain, View } from './types';
import { authService, dataService } from './services/firebase';
import { User } from 'firebase/auth';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };
  props: ErrorBoundaryProps;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.props = props;
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let errorMessage = "Something went wrong.";
      try {
        const parsedError = JSON.parse(this.state.error?.message || "{}");
        if (parsedError.error) {
          errorMessage = `Firestore Error: ${parsedError.error} (Operation: ${parsedError.operationType})`;
        }
      } catch (e) {
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Application Error</h1>
            <p className="text-gray-600 mb-6">{errorMessage}</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-xl hover:bg-indigo-700 transition-colors"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function AppContent() {
  const [domains, setDomains] = useState<Domain[]>(INITIAL_DOMAINS);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [activeDomainId, setActiveDomainId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Load from local storage on mount (immediate offline support)
  useEffect(() => {
    const savedData = localStorage.getItem('careerLaunchData');
    if (savedData) {
      try {
        setDomains(JSON.parse(savedData));
      } catch (e) {
        console.error("Failed to load local data", e);
      }
    }
  }, []);

  // Listen for Auth Changes and Sync
  useEffect(() => {
    const unsubscribe = authService.onUserChanged(async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        setIsSyncing(true);
        // Load cloud progress
        const cloudProgress = await dataService.loadProgress(currentUser.uid);
        
        if (cloudProgress) {
          // Merge cloud progress with current domains
          setDomains(prevDomains => 
            prevDomains.map(d => ({
              ...d,
              sections: d.sections.map(s => ({
                ...s,
                tasks: s.tasks.map(t => ({
                  ...t,
                  isCompleted: cloudProgress[t.id] ?? t.isCompleted
                }))
              }))
            }))
          );
        } else {
          // New user or no cloud data: Save current local state to cloud
          await dataService.saveProgress(currentUser.uid, domains);
        }
        setIsSyncing(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Save to Local Storage + Cloud on any change
  useEffect(() => {
    // 1. Local Storage
    localStorage.setItem('careerLaunchData', JSON.stringify(domains));

    // 2. Cloud Storage (Debounced slightly ideally, but direct here for simplicity)
    if (user && !isSyncing) {
      dataService.saveProgress(user.uid, domains);
    }
  }, [domains, user]);

  const handleDomainSelect = (id: string) => {
    setActiveDomainId(id);
    setCurrentView('domain');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToDashboard = () => {
    setActiveDomainId(null);
    setCurrentView('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTaskSubmitterClick = () => {
    setActiveDomainId(null);
    setCurrentView('task-submitter');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleTask = (domainId: string, sectionId: string, taskId: string) => {
    setDomains(prevDomains => 
      prevDomains.map(d => {
        if (d.id !== domainId) return d;
        return {
          ...d,
          sections: d.sections.map(s => {
            if (s.id !== sectionId) return s;
            return {
              ...s,
              tasks: s.tasks.map(t => {
                if (t.id !== taskId) return t;
                return { ...t, isCompleted: !t.isCompleted };
              })
            };
          })
        };
      })
    );
  };

  const handleSignIn = async () => {
    try {
      await authService.signIn();
    } catch (e: any) {
      console.error("Sign In Error:", e);
      alert(`Sign in failed: ${e?.message || "Check console for details"}`);
    }
  };

  const handleSignOut = async () => {
    await authService.logout();
  };

  const activeDomain = domains.find(d => d.id === activeDomainId);

  return (
    <Layout 
      onDashboardClick={handleBackToDashboard}
      onTaskSubmitterClick={handleTaskSubmitterClick}
      user={user}
      onSignIn={() => setShowAuthModal(true)}
      onSignOut={handleSignOut}
      currentView={currentView}
    >
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      {currentView === 'dashboard' ? (
        <>
          <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Your Learning Roadmap</h2>
              <p className="text-gray-500 mt-2 text-lg">Track your progress from beginner to FAANG-ready engineer.</p>
            </div>
            {user && (
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                Cloud Sync Active
              </div>
            )}
          </div>
          <Dashboard 
            domains={domains} 
            onSelectDomain={handleDomainSelect} 
          />
        </>
      ) : currentView === 'task-submitter' ? (
        <TaskSubmitter onSignIn={() => setShowAuthModal(true)} />
      ) : (
        activeDomain && (
          <DomainTracker 
            domain={activeDomain} 
            onBack={handleBackToDashboard}
            onToggleTask={handleToggleTask}
          />
        )
      )}
    </Layout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

export default App;
