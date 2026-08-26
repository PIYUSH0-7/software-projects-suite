
import React from 'react';
import { View } from '../types';
import { MessageSquare, History, User, Sword } from 'lucide-react';
import { BACKGROUND_IMAGE_URL } from '../constants';

interface LayoutProps {
  children: React.ReactNode;
  activeView: View;
  onViewChange: (view: View) => void;
  onboarded: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, activeView, onViewChange, onboarded }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-serif relative overflow-hidden">
      {/* The background image requested by the user */}
      <div 
        className="fixed inset-0 z-0 opacity-40 bg-cover bg-center bg-no-repeat transition-opacity duration-1000"
        style={{ backgroundImage: `url("${BACKGROUND_IMAGE_URL}")` }}
      />
      {/* Dark gradient for text readability */}
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-slate-950/90 via-slate-950/40 to-slate-950/90 pointer-events-none shadow-[inset_0_0_150px_rgba(0,0,0,0.8)]" />

      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-amber-500/30 px-4 md:px-8 py-3 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center shadow-[0_0_20px_rgba(251,191,36,0.5)] border border-amber-300/50">
            <Sword className="text-slate-950" size={18} />
          </div>
          <div>
            <h1 className="font-divine text-lg md:text-xl text-amber-500 font-black tracking-[0.2em] leading-none">
              GITA PATHA
            </h1>
            <p className="text-[8px] uppercase tracking-[0.3em] text-amber-500/60 font-bold mt-0.5">Divine Duty Mentor</p>
          </div>
        </div>
        
        {onboarded && (
          <nav className="hidden md:flex items-center gap-8">
            {[
              { id: 'chat', label: 'Upadesha', icon: MessageSquare },
              { id: 'history', label: 'Scrolls', icon: History },
              { id: 'profile', label: 'Dharma', icon: User },
            ].map(({ id, label, icon: Icon }) => (
              <button 
                key={id}
                onClick={() => onViewChange(id as View)}
                className={`group flex items-center gap-2 transition-all ${activeView === id ? 'text-amber-400' : 'text-slate-400 hover:text-amber-200'}`}
              >
                <Icon size={18} />
                <span className="text-[10px] uppercase tracking-widest font-bold">{label}</span>
              </button>
            ))}
          </nav>
        )}
      </header>

      {/* Main Content Area - Optimized for visibility */}
      <main className="flex-1 relative z-10 w-full max-w-4xl mx-auto px-4 py-4 md:py-6 flex flex-col">
        {children}
      </main>

      {/* Mobile Nav */}
      {onboarded && (
        <footer className="md:hidden sticky bottom-0 glass border-t border-amber-500/30 flex justify-around p-4 z-50">
          <button onClick={() => onViewChange('chat')} className={activeView === 'chat' ? 'text-amber-400 scale-110' : 'text-slate-400'}><MessageSquare size={22} /></button>
          <button onClick={() => onViewChange('history')} className={activeView === 'history' ? 'text-amber-400 scale-110' : 'text-slate-400'}><History size={22} /></button>
          <button onClick={() => onViewChange('profile')} className={activeView === 'profile' ? 'text-amber-400 scale-110' : 'text-slate-400'}><User size={22} /></button>
        </footer>
      )}
    </div>
  );
};

export default Layout;
