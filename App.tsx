
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import { View } from './types';
import { 
  DashboardView, 
  SmartStudyView, 
  PracticeView, 
  ProgressView, 
  PreferencesView, 
  ProfileView,
  LumaLearnView
} from './components/Views';
import AuthView from './components/AuthView';
import { auth } from './firebaseConfig';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { Loader2 } from 'lucide-react';

// Interface for Recent Learning Items
export interface Activity {
  title: string;
  time: string;
}

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>(View.DASHBOARD);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialPrompt, setInitialPrompt] = useState<string>('');
  
  // Shared state for the topic entered on Dashboard
  const [focusTopic, setFocusTopic] = useState<string>('');
  
  // Task 2: State for Recent Learning
  const [recentActivity, setRecentActivity] = useState<Activity[]>([
    { title: "Studied: Python Basics", time: "3 minutes ago" },
    { title: "Studied: Essay Structure", time: "1 hour ago" },
    { title: "Studied: Algebra Challenge", time: "Yesterday" }
  ]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleLaunchSession = (prompt: string) => {
    setInitialPrompt(prompt);
    setActiveView(View.LUMA_LEARN);
  };

  // Task 2: Handler to add new learning activity
  const handleAddActivity = (topic: string) => {
    // Truncate very long topics for display
    const cleanTopic = topic.length > 35 ? topic.substring(0, 35) + '...' : topic;
    const newActivity: Activity = {
      title: `Studied: ${cleanTopic}`,
      time: 'Just now'
    };

    setRecentActivity(prev => {
      const updated = [newActivity, ...prev];
      return updated.slice(0, 5); // Keep only last 5 items
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-50 text-mint-400">
        <Loader2 className="animate-spin w-10 h-10" />
      </div>
    );
  }

  if (!user) {
    return <AuthView />;
  }

  const renderView = () => {
    switch (activeView) {
      case View.DASHBOARD:
        return (
          <DashboardView 
            onNavigate={setActiveView} 
            onLaunchSession={handleLaunchSession}
            recentActivity={recentActivity}
            onAddActivity={handleAddActivity}
            focusTopic={focusTopic}
            setFocusTopic={setFocusTopic}
          />
        );
      case View.SMART_STUDY:
        return (
          <SmartStudyView 
            focusTopic={focusTopic}
            onLaunchSession={handleLaunchSession}
          />
        );
      case View.PRACTICE:
        return <PracticeView onLaunchSession={handleLaunchSession} />;
      case View.PROGRESS:
        return <ProgressView onNavigate={setActiveView} />;
      case View.PREFERENCES:
        return <PreferencesView />;
      case View.PROFILE:
        return <ProfileView onLogout={handleLogout} />;
      case View.LUMA_LEARN:
        return (
          <LumaLearnView 
            initialPrompt={initialPrompt} 
            onClearPrompt={() => setInitialPrompt('')}
            onAddActivity={handleAddActivity}
          />
        );
      default:
        return (
          <DashboardView 
            onNavigate={setActiveView} 
            onLaunchSession={handleLaunchSession} 
            recentActivity={recentActivity}
            onAddActivity={handleAddActivity}
            focusTopic={focusTopic}
            setFocusTopic={setFocusTopic}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-cream-50 font-sans flex">
      {/* Sidebar Navigation */}
      <Sidebar activeView={activeView} onNavigate={setActiveView} />

      {/* Main Content */}
      <div className="flex-1 ml-20 lg:ml-64 transition-all">
        <TopBar onProfileClick={() => setActiveView(View.PROFILE)} />
        
        <main className="px-6 lg:px-10 pb-12 max-w-7xl mx-auto">
           {renderView()}
        </main>
      </div>
    </div>
  );
};

export default App;
