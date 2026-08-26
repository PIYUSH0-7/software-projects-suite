
import React, { useState, useRef } from 'react';
import { Course, INITIAL_FOLDERS } from '../types';
import { Folder, CheckCircle, Globe, Lock, ExternalLink, Wand2, RefreshCw, UploadCloud } from './Icons';

interface DashboardProps {
  courses: Course[];
  onSelectCourse: (courseId: string) => void;
  isEditorMode: boolean;
  onToggleMode: () => void;
  onImportData: (courses: Course[]) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ courses, onSelectCourse, isEditorMode, onToggleMode, onImportData }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const completedCount = courses.filter(c => c.isCompleted).length;
  const totalWeeks = courses.reduce((acc, c) => acc + c.weeks.length, 0);

  const handleAutoSyncAll = () => {
    setIsSyncing(true);
    
    setTimeout(() => {
      // 1. Generate Human Readable Markdown
      let mdContent = `# DevPath Tracker - Master Progress Log\n\nGenerated on: ${new Date().toLocaleString()}\n\n`;

      courses.forEach(course => {
        mdContent += `## ${course.title}\n`;
        mdContent += `**Status:** ${course.isCompleted ? 'Completed' : 'In Progress'} | **Weeks Tracked:** ${course.weeks.length}\n\n`;

        if (course.weeks.length === 0) {
          mdContent += `*No logs recorded yet.*\n\n`;
        } else {
          // Sort weeks to ensure order
          const sortedWeeks = [...course.weeks].sort((a, b) => a.weekNumber - b.weekNumber);
          
          sortedWeeks.forEach(week => {
            mdContent += `### Week ${week.weekNumber} (${week.startDate})\n`;
            if (week.summary) {
              mdContent += `**Summary:**\n> ${week.summary.replace(/\n/g, '\n> ')}\n\n`;
            }
            
            mdContent += `**Daily Logs:**\n`;
            week.days.forEach((day, idx) => {
              const log = day.polished || day.raw;
              if (log && log.trim()) {
                 mdContent += `- **Day ${idx + 1}:** ${log}\n`;
              }
            });
            mdContent += `\n`;
          });
        }
        mdContent += `---\n\n`;
      });

      // 2. Generate Hidden Data Backup (Base64 Encoded JSON)
      // We use encodeURIComponent to safely handle UTF-8 characters before base64 encoding
      const jsonStr = JSON.stringify(courses);
      const base64Data = btoa(unescape(encodeURIComponent(jsonStr)));
      
      mdContent += `\n<!--\nDEVPATH_DATA_BACKUP_START\n${base64Data}\nDEVPATH_DATA_BACKUP_END\n-->\n`;
      mdContent += `\n<!-- NOTE: This file contains your complete application data hidden in the block above. Import this file in DevPath Tracker to restore your progress. -->`;

      // 3. Download File
      const blob = new Blob([mdContent], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `progress_log.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setIsSyncing(false);
    }, 800);
  };

  const handleRestoreClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm("WARNING: Restoring data will OVERWRITE your current progress. Are you sure you want to proceed?")) {
        e.target.value = ''; // Reset input
        return;
    }

    setIsRestoring(true);
    const reader = new FileReader();
    
    reader.onload = (event) => {
        try {
            const content = event.target?.result as string;
            
            // Try to find the hidden backup block
            const regex = /DEVPATH_DATA_BACKUP_START\n([\s\S]*?)\nDEVPATH_DATA_BACKUP_END/;
            const match = content.match(regex);
            
            let parsedData: Course[] | null = null;

            if (match && match[1]) {
                // Found embedded data
                const base64Data = match[1].trim();
                const jsonStr = decodeURIComponent(escape(atob(base64Data)));
                parsedData = JSON.parse(jsonStr);
            } else {
                // Fallback: Try parsing the whole file as JSON (in case user uploaded a raw JSON backup)
                try {
                    parsedData = JSON.parse(content);
                } catch {
                    throw new Error("No valid backup data found in this file.");
                }
            }

            if (parsedData && Array.isArray(parsedData)) {
                onImportData(parsedData);
                alert("Success! Data restored successfully.");
            } else {
                throw new Error("Invalid data structure.");
            }

        } catch (error) {
            console.error(error);
            alert("Failed to restore data. The file might be corrupted or not a valid DevPath log.");
        } finally {
            setIsRestoring(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    reader.readAsText(file);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-end mb-8 gap-4">
        
        <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".md,.json" 
            className="hidden" 
        />

        <button 
          onClick={handleRestoreClick}
          disabled={isRestoring}
          className="group flex items-center justify-center gap-2 px-5 py-2.5 rounded-full border border-slate-700/50 bg-[#161b2c]/80 text-slate-400 hover:text-white hover:border-slate-500 hover:bg-slate-800 transition-all shadow-lg backdrop-blur-md"
          title="Restore data from progress_log.md"
        >
           <UploadCloud className={`w-4 h-4 ${isRestoring ? 'animate-bounce text-sky-500' : 'group-hover:text-sky-500 transition-colors'}`} />
           <span className="text-sm font-medium tracking-wide">{isRestoring ? 'Restoring...' : 'Restore Data'}</span>
        </button>

        <button 
          onClick={handleAutoSyncAll}
          disabled={isSyncing}
          className="group flex items-center justify-center gap-2 px-5 py-2.5 rounded-full border border-slate-700/50 bg-[#161b2c]/80 text-slate-400 hover:text-white hover:border-slate-500 hover:bg-slate-800 transition-all shadow-lg backdrop-blur-md"
          title="Download Master Log (Contains Backup Data)"
        >
           <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-amber-500' : 'group-hover:text-amber-500 transition-colors'}`} />
           <span className="text-sm font-medium tracking-wide">{isSyncing ? 'Syncing...' : 'Auto Sync All'}</span>
        </button>

        <button 
          onClick={onToggleMode}
          className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-full border transition-all shadow-lg backdrop-blur-md ${
            !isEditorMode 
              ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white border-transparent shadow-amber-900/20' 
              : 'bg-[#161b2c]/80 text-slate-300 border-slate-700 hover:border-amber-500/50 hover:text-white'
          }`}
        >
          {isEditorMode ? (
            <>
              <Wand2 className="w-4 h-4 text-amber-400" /> <span className="text-sm font-semibold tracking-wide">Editor Mode</span>
            </>
          ) : (
            <>
              <Globe className="w-4 h-4" /> <span className="text-sm font-semibold tracking-wide">Public Portfolio</span>
            </>
          )}
        </button>
      </div>

      {/* Hero Section */}
      <div className="text-center mb-16 space-y-6">
        <div className="inline-block relative">
          <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-200 to-slate-500 tracking-tighter pb-2">
            {!isEditorMode ? 'My Portfolio' : 'DevPath Tracker'}
          </h1>
          {/* Subtle glow behind text */}
          <div className="absolute inset-0 bg-white/10 blur-[80px] -z-10 pointer-events-none"></div>
        </div>
        
        <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-light">
          {!isEditorMode 
            ? `Exploring ${completedCount} completed tracks and ${totalWeeks} weeks of engineering excellence.` 
            : 'Track daily progress, generate AI summaries, and build your professional history.'}
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {INITIAL_FOLDERS.map((folderMeta) => {
          const courseData = courses.find(c => c.id === folderMeta.id);
          const isCompleted = courseData?.isCompleted;
          const weekCount = courseData?.weeks.length || 0;
          const progressPercent = Math.min((weekCount / 17) * 100, 100);
          
          return (
            <button
              key={folderMeta.id}
              onClick={() => onSelectCourse(folderMeta.id)}
              className={`group relative rounded-2xl p-6 transition-all duration-500 flex flex-col items-start text-left h-64 border backdrop-blur-md overflow-hidden
                ${!isEditorMode && !isCompleted 
                  ? 'bg-slate-900/10 border-slate-800/50 opacity-50 grayscale cursor-not-allowed' 
                  : 'bg-[#161b2c]/60 border-slate-800/80 hover:bg-[#1e2538]/80 hover:border-slate-600/50 hover:shadow-2xl hover:shadow-black/50 hover:-translate-y-1'
                }
              `}
              disabled={!isEditorMode && !isCompleted && weekCount === 0}
            >
              {/* Background Glow Effect */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-500/5 rounded-full blur-[50px] transition-all duration-700 group-hover:bg-amber-500/10 group-hover:blur-[60px]"></div>

              <div className="absolute top-5 right-5 flex gap-2">
                 {isCompleted && (
                   <div className="flex items-center gap-2">
                      {isEditorMode && courseData?.pinCode && <Lock className="w-3.5 h-3.5 text-slate-500" />}
                      <div className="bg-green-500/10 p-1.5 rounded-full ring-1 ring-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.1)]">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      </div>
                   </div>
                 )}
              </div>
              
              <div className="mb-auto w-full relative z-10">
                 <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-all duration-300 ${isCompleted ? 'bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/20' : 'bg-slate-800/50 text-slate-500 ring-1 ring-slate-700/50 group-hover:text-amber-400 group-hover:ring-amber-500/30 group-hover:bg-amber-500/5'}`}>
                    <Folder className="w-6 h-6" fill="currentColor" fillOpacity={isCompleted ? 0.2 : 0} />
                 </div>
                 
                 <h2 className="text-xl font-bold text-slate-100 group-hover:text-amber-400 transition-colors pr-8 tracking-tight">
                   {folderMeta.title}
                 </h2>
                 <p className="text-xs text-slate-500 mt-2 font-medium tracking-wide uppercase">
                   {isCompleted ? 'Completed' : 'In Progress'}
                 </p>
              </div>
              
              <div className="w-full mt-4 relative z-10">
                <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-widest">
                   <span>{weekCount} / 17 Weeks</span>
                   <span className="group-hover:text-amber-400 transition-colors">{!isEditorMode ? 'View' : 'Open'}</span>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-slate-800/50 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ease-out ${isCompleted ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]' : 'bg-gradient-to-r from-amber-600 to-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.4)]'}`}
                    style={{ width: `${isCompleted ? 100 : progressPercent}%` }} 
                  />
                </div>
                
                {!isEditorMode && isCompleted && courseData?.completionData && (
                  <div className="mt-4 flex gap-2 text-xs">
                    {courseData.completionData.youtubeUrl && (
                      <span className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors bg-slate-800/50 px-2.5 py-1.5 rounded-md border border-slate-700/50 hover:border-red-500/30">
                        <ExternalLink className="w-3 h-3 text-red-500"/> Video
                      </span>
                    )}
                    {courseData.completionData.blogUrl && (
                      <span className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors bg-slate-800/50 px-2.5 py-1.5 rounded-md border border-slate-700/50 hover:border-blue-500/30">
                        <ExternalLink className="w-3 h-3 text-blue-500"/> Blog
                      </span>
                    )}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
