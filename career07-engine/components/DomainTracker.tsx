import React, { useState } from 'react';
import { Domain, Task } from '../types';
import { ArrowLeft, CheckCircle2, Circle, HelpCircle, BookOpen, User, Lightbulb, Target, Calendar } from 'lucide-react';
import GeminiTutor from './GeminiTutor';

interface DomainTrackerProps {
  domain: Domain;
  onBack: () => void;
  onToggleTask: (domainId: string, sectionId: string, taskId: string) => void;
}

const DomainTracker: React.FC<DomainTrackerProps> = ({ domain, onBack, onToggleTask }) => {
  const [tutorState, setTutorState] = useState<{ isOpen: boolean; concept: string }>({ 
    isOpen: false, 
    concept: '' 
  });

  const totalTasks = domain.sections.reduce((acc, s) => acc + s.tasks.length, 0);
  const completedTasks = domain.sections.reduce((acc, s) => 
    acc + s.tasks.filter(t => t.isCompleted).length, 0);
  const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  return (
    <div className="max-w-5xl mx-auto animate-in slide-in-from-right-4 duration-500">
      {/* Header */}
      <div className="mb-8 sticky top-0 bg-[#f8fafc]/80 backdrop-blur-md py-6 z-30 border-b border-gray-200/50 transition-all">
        <button 
          onClick={onBack}
          className="flex items-center text-slate-500 hover:text-indigo-600 mb-3 transition-colors text-sm font-bold uppercase tracking-wide group"
        >
          <ArrowLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
        </button>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">{domain.title}</h1>
              <span className="bg-indigo-100 text-indigo-700 text-xs px-3 py-1 rounded-full font-bold border border-indigo-200">
                {domain.phase}
              </span>
            </div>
            <p className="text-slate-500 mt-2 text-lg font-medium">{domain.description}</p>
          </div>
          <div className="flex items-center gap-5 bg-white px-6 py-3 rounded-2xl border border-gray-200 shadow-lg shadow-indigo-100/50">
            <div className="text-right">
              <div className="text-3xl font-black text-indigo-600">{progress}%</div>
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Complete</div>
            </div>
            <div className="w-14 h-14 rounded-full border-[6px] border-indigo-50 flex items-center justify-center relative">
               <div 
                 className="absolute inset-0 rounded-full border-[6px] border-indigo-600 border-t-transparent transition-all duration-1000 ease-out" 
                 style={{ transform: `rotate(${progress * 3.6}deg)` }}
               ></div>
               {progress === 100 && <CheckCircle2 className="w-6 h-6 text-emerald-500 animate-in zoom-in duration-300" />}
            </div>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {domain.resources && (
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-2 text-indigo-600">
              <BookOpen className="w-4 h-4" />
              <h3 className="font-bold text-xs uppercase tracking-widest">Best Book</h3>
            </div>
            <p className="text-sm text-slate-800 font-semibold">{domain.resources.book}</p>
          </div>
        )}
        
        {domain.resources && (
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-2 text-violet-600">
              <User className="w-4 h-4" />
              <h3 className="font-bold text-xs uppercase tracking-widest">Best Teacher</h3>
            </div>
            <p className="text-sm text-slate-800 font-semibold">{domain.resources.teacher}</p>
          </div>
        )}

        {domain.strategy && (
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-2 text-emerald-600">
              <Target className="w-4 h-4" />
              <h3 className="font-bold text-xs uppercase tracking-widest">Strategy</h3>
            </div>
            <p className="text-sm text-slate-800 font-semibold">{domain.strategy}</p>
            {domain.mindset && <p className="text-xs text-slate-500 mt-1 font-medium italic">Mindset: {domain.mindset}</p>}
          </div>
        )}

        {domain.examDate && (
           <div className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white p-5 rounded-xl border border-indigo-700 shadow-lg transform hover:-translate-y-1 transition-transform">
            <div className="flex items-center gap-2 mb-2 text-indigo-100">
              <Calendar className="w-4 h-4" />
              <h3 className="font-bold text-xs uppercase tracking-widest">Exam Date</h3>
            </div>
            <p className="text-xl font-black">{domain.examDate}</p>
          </div>
        )}
      </div>

      {/* Sections */}
      <div className="space-y-8 pb-24">
        {domain.sections.map((section) => (
          <div key={section.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden group hover:border-indigo-200 transition-colors">
            <div className="bg-gray-50/50 px-6 py-5 border-b border-gray-100 flex justify-between items-center group-hover:bg-indigo-50/30 transition-colors">
              <h2 className="font-bold text-slate-900 text-lg">{section.title}</h2>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-white text-indigo-700 border border-indigo-100 shadow-sm">
                {section.tasks.filter(t => t.isCompleted).length} / {section.tasks.length}
              </span>
            </div>
            <div className="divide-y divide-gray-50">
              {section.tasks.map((task) => (
                <div 
                  key={task.id} 
                  className={`px-6 py-5 flex items-start gap-4 transition-all duration-200 ${task.isCompleted ? 'bg-indigo-50/20' : 'hover:bg-gray-50'}`}
                >
                  <button 
                    onClick={() => onToggleTask(domain.id, section.id, task.id)}
                    className="mt-0.5 flex-shrink-0 text-gray-300 hover:text-indigo-600 transition-colors focus:outline-none"
                  >
                    {task.isCompleted ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-500 fill-emerald-50 animate-in zoom-in duration-200" />
                    ) : (
                      <Circle className="w-6 h-6" />
                    )}
                  </button>
                  
                  <div className="flex-grow">
                    <span className={`text-base font-medium leading-relaxed block ${task.isCompleted ? 'text-gray-400 line-through' : 'text-slate-800'}`}>
                      {task.text}
                    </span>
                    {task.notes && (
                      <div className={`mt-3 text-sm p-4 rounded-xl border ${task.isCompleted ? 'bg-white/50 border-gray-100 text-gray-400' : 'bg-blue-50/50 border-blue-100 text-slate-600'}`}>
                        {task.notes.split('\n').map((line, i) => (
                          <div key={i} className={line.startsWith('PATTERN') || line.startsWith('SYLLABUS') ? 'font-bold text-indigo-700 mb-1 text-xs uppercase tracking-wider' : ''}>
                            {line}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setTutorState({ isOpen: true, concept: task.text })}
                    className="flex-shrink-0 text-indigo-300 hover:text-indigo-600 p-2 rounded-lg hover:bg-indigo-50 transition-colors"
                    title="Ask AI Tutor"
                  >
                    <HelpCircle className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <GeminiTutor 
        concept={tutorState.concept}
        context={`The student is learning ${domain.title}. Their strategy is ${domain.strategy} and resources include ${domain.resources?.book}.`}
        isOpen={tutorState.isOpen}
        onClose={() => setTutorState({ ...tutorState, isOpen: false })}
      />
    </div>
  );
};

export default DomainTracker;