
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Onboarding from './components/Onboarding';
import ChatInterface from './components/ChatInterface';
import HistoryView from './components/HistoryView';
import ProfileView from './components/ProfileView';
import { UserProfile, DailySession, Message, View } from './types';
import { krishnaService } from './services/gemini';

const App: React.FC = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [sessions, setSessions] = useState<DailySession[]>([]);
  const [activeView, setActiveView] = useState<View>('onboarding');
  const [currentSession, setCurrentSession] = useState<Message[]>([]);

  // Initialize from LocalStorage
  useEffect(() => {
    const savedProfile = localStorage.getItem('krishna_profile');
    const savedSessions = localStorage.getItem('krishna_sessions');
    
    if (savedProfile) {
      setUserProfile(JSON.parse(savedProfile));
      setActiveView('chat');
    }
    
    if (savedSessions) {
      setSessions(JSON.parse(savedSessions));
    }
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    if (userProfile) {
      localStorage.setItem('krishna_profile', JSON.stringify(userProfile));
    }
    if (sessions.length > 0) {
      localStorage.setItem('krishna_sessions', JSON.stringify(sessions));
    }
  }, [userProfile, sessions]);

  // Sync currentSession with today's history
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const sessionForToday = sessions.find(s => s.date === today);
    if (sessionForToday) {
      setCurrentSession(sessionForToday.messages);
    } else {
      setCurrentSession([]);
    }
  }, [sessions, activeView]);

  const handleOnboardingComplete = (profile: UserProfile) => {
    setUserProfile(profile);
    setActiveView('chat');
  };

  const handleNewMessage = async (msg: Message) => {
    const today = new Date().toISOString().split('T')[0];
    const updatedMessages = [...currentSession, msg];
    setCurrentSession(updatedMessages);

    setSessions(prev => {
      const existingIdx = prev.findIndex(s => s.date === today);
      if (existingIdx >= 0) {
        const newSessions = [...prev];
        newSessions[existingIdx] = { ...newSessions[existingIdx], messages: updatedMessages };
        return newSessions;
      } else {
        return [...prev, { date: today, messages: updatedMessages }];
      }
    });

    // Generate summary periodically (after every 4 messages or if user sends something specific)
    if (updatedMessages.length % 4 === 0 && msg.role === 'model') {
      const summary = await krishnaService.summarizeDay(updatedMessages);
      setSessions(prev => {
        const existingIdx = prev.findIndex(s => s.date === today);
        if (existingIdx >= 0) {
          const newSessions = [...prev];
          newSessions[existingIdx].summary = summary;
          return newSessions;
        }
        return prev;
      });
    }
  };

  const handleImportSessions = (newSessions: DailySession[]) => {
    setSessions(prev => {
      const merged = [...prev];
      newSessions.forEach(newS => {
        const idx = merged.findIndex(s => s.date === newS.date);
        if (idx >= 0) {
          // Merge messages and prefer the new summary
          merged[idx].messages = [...merged[idx].messages, ...newS.messages.filter(nm => 
            !merged[idx].messages.some(om => om.timestamp === nm.timestamp)
          )];
          merged[idx].summary = newS.summary || merged[idx].summary;
        } else {
          merged.push(newS);
        }
      });
      return merged.sort((a, b) => a.date.localeCompare(b.date));
    });
  };

  const renderView = () => {
    if (!userProfile) return <Onboarding onComplete={handleOnboardingComplete} />;

    switch (activeView) {
      case 'chat':
        return (
          <ChatInterface 
            userProfile={userProfile} 
            history={currentSession} 
            onNewMessage={handleNewMessage} 
          />
        );
      case 'history':
        return <HistoryView sessions={sessions} onImport={handleImportSessions} />;
      case 'profile':
        return <ProfileView userProfile={userProfile} />;
      default:
        return null;
    }
  };

  return (
    <Layout 
      activeView={activeView} 
      onViewChange={setActiveView} 
      onboarded={!!userProfile}
    >
      {renderView()}
    </Layout>
  );
};

export default App;
