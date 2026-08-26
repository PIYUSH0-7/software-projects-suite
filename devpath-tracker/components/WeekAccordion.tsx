
import React, { useState, useRef } from 'react';
import { WeekData } from '../types';
import { ChevronDown, ChevronRight, Wand2, Trash2, Upload, FileText, Calendar, Linkedin, Copy, Lock, CheckCircle } from './Icons';
import { rewriteEntry, generateWeeklySummary } from '../services/geminiService';

interface WeekAccordionProps {
  week: WeekData;
  courseTitle: string;
  isLocked: boolean;
  onUpdate: (updatedWeek: WeekData) => void;
  onDelete: () => void;
  isEditorMode: boolean;
  onTriggerRestriction: () => void;
}

export const WeekAccordion: React.FC<WeekAccordionProps> = ({ week, courseTitle, isLocked, onUpdate, onDelete, isEditorMode, onTriggerRestriction }) => {
  const [isProcessingDay, setIsProcessingDay] = useState<number | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const toggleExpand = () => {
    onUpdate({ ...week, isExpanded: !week.isExpanded });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isEditorMode || isLocked) {
        onTriggerRestriction();
        return;
    }
    onDelete();
  };

  const handleDayChange = (index: number, value: string) => {
    if (isLocked || !isEditorMode) return;
    const newDays = [...week.days];
    newDays[index] = { ...newDays[index], raw: value };
    onUpdate({ ...week, days: newDays });
  };

  const handleAutoFix = async (index: number) => {
    if (!isEditorMode || isLocked) {
        onTriggerRestriction();
        return;
    }
    const dayEntry = week.days[index];
    if (!dayEntry.raw.trim()) return;

    setIsProcessingDay(index);
    try {
      const polished = await rewriteEntry(dayEntry.raw);
      const newDays = [...week.days];
      newDays[index] = { ...newDays[index], polished: polished };
      onUpdate({ ...week, days: newDays });
    } finally {
      setIsProcessingDay(null);
    }
  };

  const handleGenerateSummary = async () => {
    if (!isEditorMode || isLocked) {
        onTriggerRestriction();
        return;
    }
    setIsSummarizing(true);
    try {
      const dayTexts = week.days.map(d => d.polished || d.raw);
      const summary = await generateWeeklySummary(dayTexts, courseTitle, week.weekNumber);
      onUpdate({ ...week, summary });
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'leetCode' | 'wakaTime' | 'github') => {
    if (isLocked || !isEditorMode) return;
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdate({
          ...week,
          attachments: {
            ...week.attachments,
            [type]: reader.result as string
          }
        });
      };
      reader.readAsDataURL(file);
    }
  };
  
  const triggerFileUpload = (e: React.MouseEvent, inputId: string) => {
      e.preventDefault();
      if (!isEditorMode || isLocked) {
          onTriggerRestriction();
          return;
      }
      const fileInput = document.getElementById(inputId);
      if (fileInput) fileInput.click();
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isLocked || !isEditorMode) return;
    onUpdate({ ...week, startDate: e.target.value });
  };
  
  const hasAllProof = week.attachments.leetCode && week.attachments.wakaTime && week.attachments.github;

  const generateCanvasImage = async () => {
    if (!isEditorMode) {
        onTriggerRestriction();
        return;
    }
    
    if (!hasAllProof) {
        alert("Action Required: Please upload all 3 proof screenshots (LeetCode, WakaTime, GitHub) before generating the post image.");
        return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsGeneratingImage(true);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 1080;
    const height = 1080; 
    canvas.width = width;
    canvas.height = height;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    const padding = 40;
    const halfW = (width - (padding * 3)) / 2;
    const halfH = (height - (padding * 3)) / 2;

    const q1x = padding;
    const q1y = padding;
    
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(q1x, q1y, halfW, halfH, 20);
    ctx.fill();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText(`${courseTitle}`, q1x + 30, q1y + 50);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(`Week ${week.weekNumber} Update`, q1x + 30, q1y + 90);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '20px sans-serif';
    const words = week.summary.split(/\s+/);
    let line = '';
    let y = q1y + 140;
    const maxWidth = halfW - 60;
    const lineHeight = 30;

    for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
            ctx.fillText(line, q1x + 30, y);
            line = words[n] + ' ';
            y += lineHeight;
        } else {
            line = testLine;
        }
        if (y > q1y + halfH - 40) {
            ctx.fillText(line + "...", q1x + 30, y);
            break;
        }
    }
    if (y <= q1y + halfH - 40) ctx.fillText(line, q1x + 30, y);

    const drawImageInQuad = async (src: string, x: number, y: number, label: string) => {
        return new Promise<void>((resolve) => {
            const img = new Image();
            img.src = src;
            img.onload = () => {
                ctx.save();
                ctx.beginPath();
                ctx.roundRect(x, y, halfW, halfH, 20);
                ctx.clip();
                
                ctx.fillStyle = '#000';
                ctx.fillRect(x, y, halfW, halfH);

                const scale = Math.max(halfW / img.width, halfH / img.height);
                const iw = img.width * scale;
                const ih = img.height * scale;
                const ix = x + (halfW - iw) / 2;
                const iy = y + (halfH - ih) / 2;
                ctx.drawImage(img, ix, iy, iw, ih);
                
                ctx.fillStyle = 'rgba(0,0,0,0.7)';
                ctx.fillRect(x, y + halfH - 50, halfW, 50);
                
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 24px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(label, x + halfW / 2, y + halfH - 18);
                ctx.textAlign = 'left';

                ctx.strokeStyle = '#475569';
                ctx.lineWidth = 2;
                ctx.strokeRect(x, y, halfW, halfH);

                ctx.restore();
                resolve();
            };
            img.onerror = () => resolve();
        });
    };

    if (week.attachments.leetCode) await drawImageInQuad(week.attachments.leetCode, padding + halfW + padding, padding, "LeetCode / Project");
    if (week.attachments.wakaTime) await drawImageInQuad(week.attachments.wakaTime, padding, padding + halfH + padding, "WakaTime Stats");
    if (week.attachments.github) await drawImageInQuad(week.attachments.github, padding + halfW + padding, padding + halfH + padding, "GitHub Contributions");

    ctx.fillStyle = '#64748b';
    ctx.font = 'italic 16px sans-serif';
    ctx.fillText("Generated via DevPath Tracker", width - 250, height - 15);

    try {
        const link = document.createElement('a');
        link.download = `${courseTitle.replace(/\s+/g,'_')}_Week_${week.weekNumber}_Post.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    } catch (e) {
        console.error("Canvas export error", e);
    } finally {
        setIsGeneratingImage(false);
    }
  };

  const getSafeDate = (dateStr: string) => {
    if (!dateStr) return new Date();
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const [y, m, d] = parts.map(Number);
      return new Date(y, m - 1, d);
    }
    return new Date(dateStr);
  };

  const startDate = getSafeDate(week.startDate);
  const getEndDate = () => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + 6);
    return d;
  };

  const formatDate = (date: Date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const formatDayDate = (index: number) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + index);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const canEdit = isEditorMode && !isLocked;

  return (
    <div className="mb-6 border border-slate-700/50 rounded-2xl bg-[#161b2c]/40 backdrop-blur-md overflow-hidden transition-all duration-300 hover:border-slate-600/80 shadow-lg print:break-inside-avoid print:border-black print:mb-8 print:shadow-none print:bg-white">
      <div 
        className="flex items-center justify-between p-5 cursor-pointer hover:bg-slate-800/30 transition-colors print:bg-white print:border-b print:border-black print:p-2"
        onClick={toggleExpand}
      >
        <div className="flex items-center gap-5">
          <div className="w-10 h-10 rounded-xl bg-slate-800/50 flex items-center justify-center text-slate-400 border border-slate-700/50 print:hidden transition-transform group-hover:scale-105">
            {week.isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
            <h3 className="text-xl font-bold text-slate-100 print:text-black tracking-tight">Week {week.weekNumber}</h3>
            
            <div className="relative group flex items-center gap-2 text-sm text-slate-500 font-mono print:text-black">
              <Calendar className="w-3.5 h-3.5" />
              <span className="group-hover:text-amber-400 transition-colors">{formatDate(startDate)} - {formatDate(getEndDate())}</span>
              <input 
                  type="date" 
                  value={week.startDate || ''} 
                  onChange={handleDateChange}
                  onClick={(e) => { if(!isEditorMode) { e.preventDefault(); onTriggerRestriction(); } }}
                  disabled={!isEditorMode}
                  className={`absolute inset-0 opacity-0 w-full h-full print:hidden ${!isEditorMode ? 'hidden' : 'cursor-pointer'}`}
              />
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4 print:hidden">
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 bg-slate-900/50 px-3 py-1.5 rounded-full border border-slate-800">
             <div className={`w-2 h-2 rounded-full ${week.days.filter(d => d.raw.trim().length > 0).length === 7 ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'}`}></div>
             {week.days.filter(d => d.raw.trim().length > 0).length}/7 Logs
          </div>
          <button 
            type="button"
            onClick={handleDelete}
            className={`text-slate-500 p-2.5 rounded-full hover:bg-red-500/10 hover:text-red-400 transition-colors z-10`}
            title="Delete Week Logs"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {week.isExpanded && (
        <div className="p-5 sm:p-8 border-t border-slate-800/50 bg-[#0B0F19]/30 print:bg-white print:border-none print:p-0">
          {/* Days Grid */}
          <div className="space-y-8">
            {week.days.map((day, idx) => (
              <div key={idx} className="group print:mb-4 print:border-b print:border-gray-100 print:pb-2">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-bold tracking-widest flex items-center gap-2 print:text-black uppercase">
                    <span className="text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/10 print:bg-transparent print:text-black print:p-0">Day {idx + 1}</span>
                    <span className="text-slate-500 print:text-gray-600 font-normal font-mono">{formatDayDate(idx)}</span>
                  </label>
                  <button 
                    onClick={() => handleAutoFix(idx)}
                    disabled={(!day.raw.trim() && isEditorMode) || isProcessingDay === idx}
                    className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full border border-sky-500/20 bg-sky-500/5 hover:bg-sky-500/10 text-sky-400 hover:text-sky-300 disabled:opacity-30 transition-all print:hidden ${!isEditorMode && 'opacity-70'}`}
                  >
                    <Wand2 className={`w-3 h-3 ${isProcessingDay === idx ? 'animate-spin' : ''}`} />
                    {isProcessingDay === idx ? 'Refining...' : 'Refine with AI'}
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:block">
                   <textarea
                    value={day.raw}
                    onChange={(e) => handleDayChange(idx, e.target.value)}
                    readOnly={!canEdit}
                    placeholder={canEdit ? `Draft your log for ${formatDayDate(idx)}...` : "No log entry recorded."}
                    className={`w-full bg-[#0B0F19] border ${canEdit ? 'border-slate-800 text-slate-300 focus:border-amber-500/50 focus:shadow-[0_0_15px_rgba(245,158,11,0.05)]' : 'border-transparent text-slate-500 cursor-default'} rounded-xl p-4 text-sm focus:outline-none transition-all resize-y min-h-[100px] placeholder:text-slate-700 shadow-inner print:hidden leading-relaxed`}
                  />
                  <div className={`w-full bg-[#0B0F19]/50 border border-slate-800/50 rounded-xl p-4 text-sm transition-all min-h-[100px] relative ${day.polished ? 'text-emerald-300' : 'text-slate-500 italic'} print:bg-transparent print:border-none print:text-black print:p-0 print:text-base leading-relaxed`}>
                    {day.polished || day.raw || (canEdit ? "AI-polished version will appear here..." : "No entry")}
                    {day.polished && <div className="absolute top-3 right-3 text-[9px] text-emerald-500 font-bold border border-emerald-500/20 px-1.5 py-0.5 rounded uppercase tracking-wider print:hidden bg-emerald-900/10">Polished</div>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent my-10 print:hidden"></div>

          {/* Weekly Summary Section */}
          <div className="space-y-4 print:break-inside-avoid">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h4 className="text-sm font-bold text-amber-500 flex items-center gap-2 print:text-black print:text-lg uppercase tracking-wider">
                <FileText className="w-4 h-4" /> Weekly Summary
              </h4>
              <div className="flex gap-2 print:hidden">
                <button
                  onClick={handleGenerateSummary}
                  disabled={isSummarizing}
                  className={`px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs rounded-lg flex items-center gap-2 transition-all shadow-md ${!isEditorMode && 'opacity-70'}`}
                >
                  <Wand2 className={`w-3.5 h-3.5 ${isSummarizing ? 'animate-spin' : 'text-amber-500'}`} />
                  {isSummarizing ? 'Generating...' : 'Generate AI Summary'}
                </button>
                {week.summary && (
                  <button onClick={() => navigator.clipboard.writeText(week.summary || '')} className="text-slate-400 hover:text-white flex items-center gap-1.5 text-xs px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors">
                     <Copy className="w-3.5 h-3.5" /> Copy
                  </button>
                )}
              </div>
            </div>
            
            <div className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl p-6 text-sm text-slate-300 min-h-[120px] leading-relaxed whitespace-pre-line shadow-inner print:bg-white print:border-none print:text-black print:p-0 print:text-base">
              {week.summary || <span className="text-slate-600 italic">Generate a summary to see the weekly recap here.</span>}
            </div>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent my-10 print:hidden"></div>

          {/* Attachments Section */}
          <div className="space-y-6 print:break-inside-avoid">
            <h4 className="text-sm font-bold text-slate-400 flex items-center gap-2 print:text-black uppercase tracking-wider">
              <Upload className="w-4 h-4" /> Proof of Work (Mandatory for Image Gen)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { id: 'leetCode', label: 'LeetCode / Project', color: 'text-amber-500', icon: '💻' },
                { id: 'wakaTime', label: 'WakaTime Stats', color: 'text-sky-500', icon: '⏱️' },
                { id: 'github', label: 'GitHub Activity', color: 'text-purple-500', icon: '🐙' }
              ].map((item) => (
                <div key={item.id} className="relative group">
                    <div className={`border-2 border-dashed ${week.attachments[item.id as keyof typeof week.attachments] ? 'border-slate-700 bg-slate-900/50' : 'border-slate-800 bg-[#0B0F19]/50 hover:bg-slate-800/30 hover:border-slate-600'} rounded-2xl p-4 flex flex-col items-center justify-center text-center transition-all h-48 print:border-gray-300 print:bg-white print:h-auto`}>
                        {week.attachments[item.id as keyof typeof week.attachments] ? (
                        <div className="relative w-full h-full rounded-xl overflow-hidden group-hover:opacity-90 transition-opacity">
                            <img src={week.attachments[item.id as keyof typeof week.attachments] as string} alt={item.label} className="object-cover w-full h-full" />
                            <button onClick={!isEditorMode ? onTriggerRestriction : () => onUpdate({...week, attachments: {...week.attachments, [item.id]: null}})} className="absolute top-2 right-2 bg-black/70 text-white p-2 rounded-full hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100 print:hidden"><Trash2 className="w-4 h-4"/></button>
                            <div className="absolute bottom-2 right-2 bg-green-500 text-white rounded-full p-1 shadow-lg print:hidden"><CheckCircle className="w-4 h-4" /></div>
                        </div>
                        ) : (
                        <>
                            <div className="text-3xl mb-3 opacity-50 grayscale group-hover:grayscale-0 transition-all duration-300">{item.icon}</div>
                            <span className={`text-xs font-bold ${item.color} mb-3`}>{item.label}</span>
                            <input type="file" id={`${item.id}-${week.id}`} className="hidden" onChange={(e) => handleFileUpload(e, item.id as any)} accept="image/*" />
                            <button onClick={(e) => triggerFileUpload(e, `${item.id}-${week.id}`)} className="text-xs text-slate-400 hover:text-white px-4 py-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors print:hidden">Upload Screenshot</button>
                        </>
                        )}
                    </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* LinkedIn Image Generator */}
          <div className="mt-12 flex flex-col items-center justify-center print:hidden">
              <button
                  onClick={generateCanvasImage}
                  disabled={isGeneratingImage && isEditorMode} 
                  className={`group relative px-10 py-4 bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-white rounded-full shadow-lg shadow-blue-900/30 flex items-center gap-3 font-bold transition-all transform hover:-translate-y-1 active:translate-y-0 ${!isEditorMode && 'opacity-75'} ${!hasAllProof && isEditorMode ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
              >
                  <Linkedin className="w-5 h-5" />
                  {isGeneratingImage ? "Designing Asset..." : "Generate LinkedIn Post Image"}
                  {!hasAllProof && isEditorMode && <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] px-2 py-1 rounded-full animate-bounce shadow-md border border-red-400">Needs 3 Proofs</div>}
              </button>
              <p className="text-slate-600 text-xs mt-4 font-medium tracking-wide">Combines your summary and 3 proof screenshots into a professional 1080x1080 social media asset.</p>
          </div>

          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}
    </div>
  );
};
