
import React, { useState, useEffect } from 'react';
import { Course, WeekData } from '../types';
import { ArrowLeft, CheckCircle, Youtube, BookOpen, Download, Lock, Unlock, FileText, PieChart, Wand2, ChevronDown, ChevronRight, XCircle, RefreshCw, ExternalLink, Calendar } from './Icons';
import { WeekAccordion } from './WeekAccordion';
import { generateMonthlyBlog, generateSkillGapAnalysis } from '../services/geminiService';

interface CourseDetailProps {
  course: Course;
  onBack: () => void;
  onUpdateCourse: (updatedCourse: Course) => void;
  isEditorMode: boolean;
  onTriggerRestriction: () => void;
}

export const CourseDetail: React.FC<CourseDetailProps> = ({ course, onBack, onUpdateCourse, isEditorMode, onTriggerRestriction }) => {
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionForm, setCompletionForm] = useState({ youtube: '', blog: '', pin: '' });
  const [error, setError] = useState('');
  
  // Security State (Folder PIN for editing)
  const [isLocked, setIsLocked] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlockPin, setUnlockPin] = useState('');

  // UI State
  const [isGeneratingBlog, setIsGeneratingBlog] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showSkillAnalysis, setShowSkillAnalysis] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Condition Modal State
  const [conditionModal, setConditionModal] = useState<{show: boolean, title: string, message: string} | null>(null);

  useEffect(() => {
    // Lock by default if completed and in editor mode
    if (course.isCompleted && course.pinCode) {
        setIsLocked(true);
    }
  }, [course.isCompleted, course.pinCode]);

  const handleUpdateWeek = (updatedWeek: WeekData) => {
    const updatedWeeks = course.weeks.map(w => w.id === updatedWeek.id ? updatedWeek : w);
    onUpdateCourse({ ...course, weeks: updatedWeeks });
  };

  const handleDeleteWeek = (weekId: string) => {
    if (!isEditorMode || isLocked) {
        onTriggerRestriction();
        return;
    }
    if (window.confirm("Are you sure you want to remove this week's logs? This action cannot be undone.")) {
      const updatedWeeks = course.weeks.filter(w => w.id !== weekId);
      onUpdateCourse({ ...course, weeks: updatedWeeks });
    }
  };

  const getLocalISODate = (date: Date) => {
    const offset = date.getTimezoneOffset();
    const local = new Date(date.getTime() - (offset * 60 * 1000));
    return local.toISOString().split('T')[0];
  };

  const handleAddWeek = () => {
    if (!isEditorMode || isLocked) {
        onTriggerRestriction();
        return;
    }
    const nextWeekNum = course.weeks.length > 0 
      ? Math.max(...course.weeks.map(w => w.weekNumber)) + 1 
      : 1;

    if (nextWeekNum > 17) {
      alert("Maximum 17 weeks reached!");
      return;
    }

    // Determine Start Date
    let newStartDateStr = getLocalISODate(new Date()); 
    if (course.weeks.length > 0) {
        const sortedWeeks = [...course.weeks].sort((a,b) => a.weekNumber - b.weekNumber);
        const lastWeek = sortedWeeks[sortedWeeks.length - 1];
        if (lastWeek.startDate) {
            const [y, m, d] = lastWeek.startDate.split('-').map(Number);
            const lastDate = new Date(y, m - 1, d);
            const nextDate = new Date(lastDate);
            nextDate.setDate(lastDate.getDate() + 7);
            const nextY = nextDate.getFullYear();
            const nextM = String(nextDate.getMonth() + 1).padStart(2, '0');
            const nextD = String(nextDate.getDate()).padStart(2, '0');
            newStartDateStr = `${nextY}-${nextM}-${nextD}`;
        }
    }

    const newWeek: WeekData = {
      id: Date.now().toString(),
      weekNumber: nextWeekNum,
      startDate: newStartDateStr,
      isExpanded: true,
      summary: '',
      attachments: {},
      days: Array(7).fill(null).map(() => ({ raw: '', polished: '' }))
    };

    onUpdateCourse({ ...course, weeks: [...course.weeks, newWeek] });
  };

  const markCompleted = () => {
    if (!isEditorMode) {
        onTriggerRestriction();
        return;
    }

    if (!completionForm.youtube.trim() || !completionForm.blog.trim()) {
      setError("Both YouTube Video URL and Blog Post URL are required.");
      return;
    }
    if (!completionForm.pin.trim() || completionForm.pin.length !== 3) {
      setError("Please set a 3-digit security PIN.");
      return;
    }

    onUpdateCourse({
      ...course,
      isCompleted: true,
      pinCode: completionForm.pin,
      completionData: {
        youtubeUrl: completionForm.youtube,
        blogUrl: completionForm.blog
      }
    });
    setShowCompletionModal(false);
    setIsLocked(true);
  };

  const handleUnlock = () => {
    if (unlockPin === course.pinCode) {
        setIsLocked(false);
        setShowUnlockModal(false);
        setUnlockPin('');
    } else {
        alert("Incorrect PIN");
    }
  };

  const handleGenerateBlog = async () => {
    if (!isEditorMode) {
        onTriggerRestriction();
        return;
    }
    
    if (course.weeks.length < 4) {
        setConditionModal({
            show: true,
            title: "Blog Not Available",
            message: "You must complete at least 4 weeks of logs to generate a Monthly Blog."
        });
        return;
    }

    setIsGeneratingBlog(true);
    try {
        const sortedWeeks = [...course.weeks].sort((a,b) => b.weekNumber - a.weekNumber).slice(0, 4).reverse();
        const blogContent = await generateMonthlyBlog(sortedWeeks.map(w => ({weekNum: w.weekNumber, summary: w.summary})), course.title);
        
        const blob = new Blob([blogContent], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${course.title.replace(/\s+/g, '_')}_Monthly_Blog.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (e) {
        alert("Failed to generate blog.");
    } finally {
        setIsGeneratingBlog(false);
    }
  };

  const handleAnalyzeSkills = async () => {
    if (!isEditorMode) {
        onTriggerRestriction();
        return;
    }
    
    if (course.weeks.length < 7) {
        setConditionModal({
            show: true,
            title: "Analysis Not Available",
            message: "Skill Gap Analysis requires at least 7 weeks of data to be accurate."
        });
        return;
    }
    
    const currentCount = course.skillAnalysisCount || 0;
    if (currentCount >= 3) {
        setConditionModal({
            show: true,
            title: "Limit Reached",
            message: "You have used all 3 Skill Gap Analyses allowed for this course."
        });
        return;
    }

    setIsAnalyzing(true);
    try {
        const summaries = course.weeks.map(w => `Week ${w.weekNumber}: ${w.summary}`);
        const analysis = await generateSkillGapAnalysis(summaries, course.title);
        
        onUpdateCourse({ 
          ...course, 
          skillAnalysis: analysis,
          skillAnalysisCount: currentCount + 1 
        });
        setShowSkillAnalysis(true);
    } catch (e) {
        alert("Failed to analyze skills.");
    } finally {
        setIsAnalyzing(false);
    }
  };

  const handlePDFReport = () => {
    if (course.weeks.length === 0) {
        setConditionModal({
            show: true,
            title: "Report Empty",
            message: "Start tracking at least one week to generate a PDF report."
        });
        return;
    }
    
    setIsPrinting(true);
    const allExpandedWeeks = course.weeks.map(w => ({...w, isExpanded: true}));
    
    if (course.skillAnalysis) {
        setShowSkillAnalysis(true);
    }

    onUpdateCourse({...course, weeks: allExpandedWeeks});
    
    setTimeout(() => {
        window.print();
        setIsPrinting(false);
    }, 500);
  };

  const handleAutoSyncCourse = () => {
    setIsSyncing(true);
    setTimeout(() => {
        let mdContent = `# ${course.title} - Progress Log\n\n`;
        mdContent += `Generated on: ${new Date().toLocaleString()}\n\n`;
        
        const sortedWeeks = [...course.weeks].sort((a, b) => a.weekNumber - b.weekNumber);
        
        sortedWeeks.forEach(week => {
            mdContent += `## Week ${week.weekNumber} (${week.startDate})\n`;
            if (week.summary) {
                mdContent += `**Summary:**\n> ${week.summary.replace(/\n/g, '\n> ')}\n\n`;
            }
            mdContent += `### Daily Logs\n`;
            week.days.forEach((day, idx) => {
                const log = day.polished || day.raw || "";
                if (log) {
                    mdContent += `- **Day ${idx + 1}:** ${log}\n`;
                }
            });
            mdContent += `\n---\n\n`;
        });

        const blob = new Blob([mdContent], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `progress_log.md`; // Standardized name as requested
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        setIsSyncing(false);
    }, 800);
  };

  return (
    <div className="min-h-screen flex flex-col bg-transparent print:bg-white print:text-black">
      {/* Sticky Header with Frosted Glass */}
      <div className="sticky top-0 z-40 bg-[#0B0F19]/80 backdrop-blur-lg border-b border-slate-700/50 shadow-lg print:hidden transition-all duration-300">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Left: Title & Back */}
            <div className="flex items-center gap-4 w-full md:w-auto">
               <button 
                onClick={onBack} 
                className="group p-2 -ml-2 rounded-full hover:bg-slate-800/50 text-slate-400 hover:text-white transition-colors"
                title="Back to Dashboard"
               >
                 <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
               </button>
               <div>
                 <h2 className="text-xl font-bold text-slate-100 leading-none truncate max-w-[200px] sm:max-w-sm tracking-tight">{course.title}</h2>
                 <p className="text-xs text-slate-500 font-medium mt-1">
                    {course.weeks.length} Weeks Recorded • {course.isCompleted ? <span className="text-green-500">Completed</span> : <span className="text-amber-500">Tracking Active</span>}
                 </p>
               </div>
            </div>

            {/* Right: Actions Toolbar */}
            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
               
               {/* Primary Action Group */}
               <div className="flex items-center gap-0.5 p-1 bg-[#161b2c] rounded-lg border border-slate-700/50">
                   <button 
                      onClick={handleAutoSyncCourse} 
                      className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-slate-700/80 text-xs font-medium text-slate-300 hover:text-white transition-all whitespace-nowrap"
                      title="Sync Markdown for Git"
                   >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-amber-500' : ''}`} />
                      <span className="hidden sm:inline">Sync Log</span>
                   </button>
                   <div className="w-px h-4 bg-slate-700/50 mx-1"></div>
                   <button 
                      onClick={handlePDFReport} 
                      className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-slate-700/80 text-xs font-medium text-slate-300 hover:text-white transition-all whitespace-nowrap"
                   >
                      <Download className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{isPrinting ? 'Processing...' : 'PDF Report'}</span>
                   </button>
               </div>

               {/* AI Tools Group */}
               <div className="flex items-center gap-0.5 p-1 bg-[#161b2c] rounded-lg border border-slate-700/50">
                 <button 
                    onClick={handleGenerateBlog} 
                    className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-slate-700/80 text-xs font-medium text-slate-300 hover:text-white transition-all whitespace-nowrap"
                 >
                    {isGeneratingBlog ? <Wand2 className="w-3.5 h-3.5 animate-spin text-amber-500"/> : <FileText className="w-3.5 h-3.5" />} 
                    <span className="hidden sm:inline">Create Blog</span>
                 </button>
                 <div className="w-px h-4 bg-slate-700/50 mx-1"></div>
                 <button 
                    onClick={handleAnalyzeSkills} 
                    className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-slate-700/80 text-xs font-medium text-slate-300 hover:text-white transition-all whitespace-nowrap"
                 >
                    {isAnalyzing ? <Wand2 className="w-3.5 h-3.5 animate-spin text-amber-500"/> : <PieChart className="w-3.5 h-3.5" />} 
                    <span className="hidden sm:inline">Skill Check ({course.skillAnalysisCount || 0}/3)</span>
                 </button>
               </div>

               {/* Status Button */}
               {course.isCompleted ? (
                   isLocked ? (
                      <button onClick={!isEditorMode ? onTriggerRestriction : () => setShowUnlockModal(true)} className="ml-2 flex items-center gap-1.5 px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 rounded-lg transition-all text-xs font-bold whitespace-nowrap shadow-[0_0_10px_rgba(239,68,68,0.1)]">
                          <Lock className="w-3.5 h-3.5" /> Locked
                      </button>
                   ) : (
                      <button onClick={!isEditorMode ? onTriggerRestriction : () => setIsLocked(true)} className="ml-2 flex items-center gap-1.5 px-4 py-2 bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20 rounded-lg transition-all text-xs font-bold whitespace-nowrap shadow-[0_0_10px_rgba(34,197,94,0.1)]">
                          <Unlock className="w-3.5 h-3.5" /> Unlocked
                      </button>
                   )
               ) : (
                   <button 
                      onClick={!isEditorMode ? onTriggerRestriction : () => setShowCompletionModal(true)}
                      className="ml-2 px-5 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white text-xs font-bold rounded-lg shadow-lg shadow-amber-900/30 transition-all whitespace-nowrap hover:-translate-y-0.5"
                   >
                      Complete Course
                   </button>
               )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 w-full max-w-5xl mx-auto p-4 sm:p-8 pb-32 print:p-0 print:w-full">
            
            {/* Print Header */}
            <div className="hidden print:block text-center border-b-2 border-black pb-8 mb-8 mt-8">
                <h1 className="text-4xl font-bold mb-2">{course.title}</h1>
                <p className="text-xl text-gray-600">Development Progress Report</p>
                <div className="mt-4 flex justify-center gap-8 text-sm text-gray-500 font-mono">
                    <span>Generated: {new Date().toLocaleDateString()}</span>
                    <span>Status: {course.isCompleted ? 'Completed' : 'In Progress'}</span>
                </div>
            </div>

            {/* Public/Completed Assets Banner */}
            {course.isCompleted && course.completionData && (
                 <div className="mb-10 relative overflow-hidden rounded-2xl border border-green-500/20 bg-[#161b2c]/80 backdrop-blur-sm p-8 print:border-2 print:border-gray-200 print:bg-gray-50 print:break-inside-avoid shadow-xl">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-[60px] -z-10"></div>
                    <h3 className="text-green-400 font-bold mb-6 flex items-center gap-2 text-lg print:text-black tracking-wide">
                        <CheckCircle className="w-5 h-5" /> VERIFIED PORTFOLIO ASSETS
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:block">
                        <a href={course.completionData.youtubeUrl} target="_blank" rel="noreferrer" className="flex items-center gap-4 p-5 rounded-xl bg-slate-900/50 hover:bg-slate-800 border border-slate-700/50 hover:border-red-500/30 transition-all group">
                             <div className="p-3 bg-red-500/10 rounded-lg group-hover:bg-red-500/20 shadow-inner"><Youtube className="w-6 h-6 text-red-500"/></div>
                             <div className="flex-1 min-w-0">
                                <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">Project Video</div>
                                <div className="text-sm text-slate-200 truncate font-medium">{course.completionData.youtubeUrl}</div>
                             </div>
                             <ExternalLink className="w-4 h-4 text-slate-600 group-hover:text-white transition-colors" />
                        </a>
                        <a href={course.completionData.blogUrl} target="_blank" rel="noreferrer" className="flex items-center gap-4 p-5 rounded-xl bg-slate-900/50 hover:bg-slate-800 border border-slate-700/50 hover:border-blue-500/30 transition-all group">
                             <div className="p-3 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 shadow-inner"><BookOpen className="w-6 h-6 text-blue-500"/></div>
                             <div className="flex-1 min-w-0">
                                <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">Article</div>
                                <div className="text-sm text-slate-200 truncate font-medium">{course.completionData.blogUrl}</div>
                             </div>
                             <ExternalLink className="w-4 h-4 text-slate-600 group-hover:text-white transition-colors" />
                        </a>
                    </div>
                 </div>
            )}

            {/* Empty State */}
            {course.weeks.length === 0 ? (
                <div className="text-center py-24 border border-dashed border-slate-800 rounded-2xl bg-[#161b2c]/30 backdrop-blur-sm print:hidden">
                    <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ring-1 ring-slate-700/50">
                        <Calendar className="w-10 h-10 text-slate-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-200 mb-3 tracking-tight">Your Journey Begins Here</h3>
                    <p className="text-slate-500 mb-8 max-w-md mx-auto leading-relaxed">Start tracking your weekly progress to generate AI summaries and build your portfolio.</p>
                    <button onClick={handleAddWeek} className="px-8 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-full shadow-lg hover:shadow-amber-500/20 transition-all transform hover:-translate-y-1">
                        + Start Week 1
                    </button>
                </div>
            ) : (
                <div className="space-y-6">
                    {course.weeks.map(week => (
                        <WeekAccordion 
                            key={week.id} 
                            week={week} 
                            courseTitle={course.title}
                            isLocked={isLocked}
                            onUpdate={handleUpdateWeek} 
                            onDelete={() => handleDeleteWeek(week.id)}
                            isEditorMode={isEditorMode}
                            onTriggerRestriction={onTriggerRestriction}
                        />
                    ))}
                </div>
            )}
            
            {/* Skill Analysis Section */}
            {course.skillAnalysis && (
                <div className="mt-10 bg-gradient-to-br from-[#1e1b4b] to-[#312e81]/40 border border-indigo-500/20 rounded-2xl overflow-hidden print:border-2 print:border-indigo-100 print:bg-white print:break-before-page shadow-2xl">
                    <div 
                        className="p-6 flex justify-between items-center cursor-pointer hover:bg-white/5 transition-colors print:bg-indigo-50"
                        onClick={() => setShowSkillAnalysis(!showSkillAnalysis)}
                    >
                        <h3 className="text-indigo-300 font-bold flex items-center gap-3 text-lg print:text-indigo-800 tracking-wide">
                            <PieChart className="w-6 h-6" /> 
                            <span>AI MENTOR: SKILL GAP ANALYSIS</span>
                        </h3>
                        <div className="print:hidden bg-indigo-500/20 p-1.5 rounded-lg">
                            {showSkillAnalysis ? <ChevronDown className="w-5 h-5 text-indigo-300"/> : <ChevronRight className="w-5 h-5 text-indigo-300"/>}
                        </div>
                    </div>
                    {(showSkillAnalysis || typeof window !== 'undefined' && window.matchMedia('print').matches) && (
                         <div className="p-8 md:p-10 prose prose-invert prose-lg max-w-none print:prose-indigo print:text-black whitespace-pre-line border-t border-indigo-500/20 print:border-none print:block bg-black/20">
                            {course.skillAnalysis}
                             <div className="mt-8 pt-4 border-t border-white/5 text-xs text-indigo-300/50 print:hidden flex justify-between font-mono">
                                <span>Powered by Google Gemini 2.5</span>
                                <span>Analysis used: {course.skillAnalysisCount}/3</span>
                             </div>
                         </div>
                    )}
                </div>
            )}

            {/* Start New Week Button */}
            {!isLocked && course.weeks.length > 0 && (
                <button 
                    onClick={handleAddWeek}
                    className="mt-10 w-full py-5 border border-dashed border-slate-700/50 bg-[#161b2c]/30 rounded-2xl text-slate-400 hover:text-amber-500 hover:border-amber-500/30 hover:bg-[#161b2c]/50 transition-all font-bold tracking-wide flex items-center justify-center gap-3 print:hidden group hover:shadow-lg"
                >
                    <span className="w-8 h-8 rounded-full bg-slate-800/50 group-hover:bg-amber-500/20 flex items-center justify-center transition-colors shadow-inner">+</span>
                    START NEXT WEEK LOG
                </button>
            )}
      </div>

      {/* Condition Modal */}
      {conditionModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[70] flex items-center justify-center p-4">
            <div className="bg-[#161b2c] border border-slate-700/50 rounded-2xl p-8 w-full max-w-sm shadow-2xl text-center">
                <div className="mx-auto w-14 h-14 bg-slate-800/50 rounded-full flex items-center justify-center mb-5 border border-slate-700/50">
                    <XCircle className="w-7 h-7 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2 tracking-tight">{conditionModal.title}</h3>
                <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                    {conditionModal.message}
                </p>
                <button 
                    onClick={() => setConditionModal(null)}
                    className="w-full py-3 bg-slate-800 hover:bg-slate-700 border border-slate-600/50 text-white font-medium rounded-xl transition-all"
                >
                    Dismiss
                </button>
            </div>
        </div>
      )}

      {/* Completion Modal */}
      {showCompletionModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#161b2c] border border-slate-700/50 rounded-2xl p-8 w-full max-w-md shadow-2xl shadow-black/50">
            <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Complete Course</h3>
            <p className="text-slate-400 text-sm mb-8">
              Finalize "{course.title}" by verifying your portfolio links.
            </p>
            
            <div className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">YouTube Video URL</label>
                <input 
                  type="text" 
                  value={completionForm.youtube}
                  onChange={e => setCompletionForm({...completionForm, youtube: e.target.value})}
                  className="w-full bg-[#0B0F19] border border-slate-700 rounded-xl p-3.5 text-sm text-white focus:border-amber-500 outline-none focus:ring-1 focus:ring-amber-500 transition-all shadow-inner"
                  placeholder="https://youtube.com/..."
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Blog Post URL</label>
                <input 
                  type="text" 
                  value={completionForm.blog}
                  onChange={e => setCompletionForm({...completionForm, blog: e.target.value})}
                  className="w-full bg-[#0B0F19] border border-slate-700 rounded-xl p-3.5 text-sm text-white focus:border-amber-500 outline-none focus:ring-1 focus:ring-amber-500 transition-all shadow-inner"
                  placeholder="https://medium.com/..."
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1.5 ml-1">Set Security PIN (3 Digits)</label>
                <div className="relative">
                    <input 
                      type="text" 
                      maxLength={3}
                      value={completionForm.pin}
                      onChange={e => setCompletionForm({...completionForm, pin: e.target.value.replace(/\D/g,'')})}
                      className="w-full bg-[#0B0F19] border border-amber-500/30 rounded-xl p-3.5 text-xl text-center tracking-[1em] font-mono text-white focus:border-amber-500 outline-none transition-all shadow-inner"
                      placeholder="•••"
                    />
                    <Lock className="absolute right-4 top-4 w-4 h-4 text-slate-600" />
                </div>
                <p className="text-[10px] text-slate-500 mt-2 ml-1">This PIN will be required to edit logs later.</p>
              </div>
            </div>

            {error && <p className="text-red-400 text-xs mt-4 bg-red-900/10 border border-red-500/10 p-3 rounded-lg text-center">{error}</p>}

            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setShowCompletionModal(false)} className="px-5 py-2.5 text-slate-400 hover:text-white text-sm font-medium transition-colors">Cancel</button>
              <button onClick={markCompleted} className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-green-900/20 transform active:scale-95">Verify & Lock</button>
            </div>
          </div>
        </div>
      )}

      {/* Unlock Modal */}
      {showUnlockModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#161b2c] border border-slate-700/50 rounded-2xl p-8 w-full max-w-sm shadow-2xl text-center">
            <div className="w-14 h-14 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-5 border border-slate-700/50">
                <Lock className="w-6 h-6 text-amber-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Restricted Access</h3>
            <p className="text-slate-400 text-sm mb-8">Enter the 3-digit PIN to unlock this folder.</p>
            <input 
                type="password" 
                maxLength={3}
                autoFocus
                value={unlockPin}
                onChange={e => setUnlockPin(e.target.value.replace(/\D/g,''))}
                className="w-full bg-[#0B0F19] border border-slate-600 rounded-xl p-4 text-3xl text-center tracking-[0.5em] text-white focus:border-amber-500 outline-none mb-8 transition-all shadow-inner"
                placeholder="•••"
            />
            <div className="flex gap-3">
               <button onClick={() => {setShowUnlockModal(false); setUnlockPin('');}} className="flex-1 py-3 text-slate-400 hover:bg-slate-800 rounded-xl transition-colors font-medium">Cancel</button>
               <button onClick={handleUnlock} className="flex-1 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold shadow-lg">Unlock</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
