
import React, { useRef } from 'react';
import { DailySession, Message } from '../types';
import { Calendar, Download, Upload, FileText } from 'lucide-react';

interface HistoryViewProps {
  sessions: DailySession[];
  onImport: (sessions: DailySession[]) => void;
}

const HistoryView: React.FC<HistoryViewProps> = ({ sessions, onImport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const exportToMarkdown = () => {
    let md = "# Krishna's Guidance - Chronicles of Duty\n\n";
    sessions.forEach(session => {
      md += `## Date: ${session.date}\n`;
      if (session.summary) md += `**Summary**: ${session.summary}\n\n`;
      md += `### Dialogue:\n`;
      session.messages.forEach(msg => {
        md += `- **${msg.role === 'model' ? 'Krishna' : 'User'}**: ${msg.text}\n`;
      });
      md += `\n---\n\n`;
    });

    // We embed a hidden JSON for easy re-import
    md += `\n\n<!-- DATA_START\n${JSON.stringify(sessions)}\nDATA_END -->`;

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `krishna_scrolls_${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const match = content.match(/<!-- DATA_START\n([\s\S]*?)\nDATA_END -->/);
      if (match && match[1]) {
        try {
          const importedSessions = JSON.parse(match[1]);
          if (confirm("Import these divine scrolls? This will merge them with your current journey.")) {
            onImport(importedSessions);
          }
        } catch (err) {
          alert("The scroll is corrupted or invalid.");
        }
      } else {
        alert("This file is not a valid Divine Scroll backup.");
      }
    };
    reader.readAsText(file);
  };

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center space-y-6 py-20 bg-slate-900/40 rounded-3xl border border-amber-900/10 backdrop-blur-sm">
        <div className="text-6xl opacity-30">📜</div>
        <div className="text-center">
          <h3 className="text-xl text-amber-500 font-divine mb-2 uppercase tracking-widest">Unwritten Chronicles</h3>
          <p className="text-slate-500 max-w-xs mx-auto">Your journey has not yet been recorded. Return to your guidance.</p>
        </div>
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-amber-400 px-4 py-2 rounded-lg border border-amber-900/20 transition-all"
        >
          <Upload size={18} /> Import Existing Scrolls
        </button>
        <input type="file" ref={fileInputRef} onChange={handleImport} className="hidden" accept=".md" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-20">
      <div className="flex items-center justify-between mb-8 border-b border-amber-900/20 pb-4">
        <h2 className="text-2xl font-divine text-amber-500 uppercase tracking-[0.2em]">Chronicles</h2>
        <div className="flex gap-2">
          <button 
            onClick={exportToMarkdown}
            className="flex items-center gap-2 bg-amber-600/20 hover:bg-amber-600/40 text-amber-400 px-3 py-1.5 rounded-lg border border-amber-900/30 text-xs uppercase tracking-widest font-bold transition-all"
          >
            <Download size={14} /> Export
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 text-xs uppercase tracking-widest font-bold transition-all"
          >
            <Upload size={14} /> Import
          </button>
          <input type="file" ref={fileInputRef} onChange={handleImport} className="hidden" accept=".md" />
        </div>
      </div>
      
      <div className="space-y-4">
        {sessions.slice().reverse().map((session) => (
          <div key={session.date} className="bg-slate-900/60 backdrop-blur-md border border-amber-900/10 rounded-xl p-5 hover:border-amber-900/30 transition-all group shadow-lg">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="mt-1 w-8 h-8 rounded-lg bg-amber-900/20 flex items-center justify-center text-amber-500">
                  <Calendar size={16} />
                </div>
                <div>
                  <h4 className="font-bold text-amber-100 mb-1">{new Date(session.date).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</h4>
                  <p className="text-amber-400/80 text-sm leading-relaxed italic">
                    <span className="font-divine text-[10px] uppercase tracking-widest mr-2 opacity-60">Sutra:</span>
                    {session.summary || "The day's wisdom awaits revelation..."}
                  </p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-slate-500 text-[10px] uppercase tracking-widest">
                <FileText size={12} /> {session.messages.length} exchanges
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoryView;
