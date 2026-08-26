import React, { useState, useEffect } from 'react';
import { GlassCard, Button, Input } from '../components/UI';
import { Subject, StudentProfile } from '../types';
import { ExternalLink, RefreshCw, BookOpen } from 'lucide-react';
import { auth } from '../services/auth';
import { getSemesterData } from '../data/curriculum';

const ProgressTracker = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileSem, setProfileSem] = useState<number>(1);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setLoading(true);
    if (!auth.currentUser) return;

    // 1. Get Profile Semester
    const savedProfile = localStorage.getItem(`profile_${auth.currentUser.uid}`);
    let currentSem = 1;
    if (savedProfile) {
      const p = JSON.parse(savedProfile) as StudentProfile;
      currentSem = parseInt(p.currentSemester) || 1;
    }
    setProfileSem(currentSem);

    // 2. Check if subjects exist in LS for this user
    const savedSubjects = localStorage.getItem(`progress_subjects_${auth.currentUser.uid}`);
    
    if (savedSubjects) {
      const parsed = JSON.parse(savedSubjects);
      // Check if stored subjects match the current semester logic (simple check)
      // If user changed profile semester, we might want to prompt reset, but for now let's use a manual reset button
      setSubjects(parsed);
    } else {
      // 3. Initialize from Curriculum Data
      initializeFromCurriculum(currentSem);
    }
    setLoading(false);
  };

  const initializeFromCurriculum = (sem: number) => {
    const semData = getSemesterData(sem);
    if (semData) {
      const newSubjects: Subject[] = semData.subjects.map((sub, index) => ({
        id: `auto_${sem}_${index}_${Date.now()}`,
        code: sub.code,
        name: sub.name,
        assignmentsDone: 0,
        chaptersDone: 0,
        notesLink: '',
        isTheory: sub.type === 'Theory' || sub.type === 'Audit' // Count audits in list but maybe not assignment calc? Let's treat them as subjects
      }));
      setSubjects(newSubjects);
      saveToLocal(newSubjects);
    }
  };

  const saveToLocal = (updatedSubjects: Subject[]) => {
    if (!auth.currentUser) return;
    setSubjects(updatedSubjects);
    localStorage.setItem(`progress_subjects_${auth.currentUser.uid}`, JSON.stringify(updatedSubjects));
  };

  const updateSubject = (id: string, field: keyof Subject, value: any) => {
    const updated = subjects.map(s => s.id === id ? { ...s, [field]: value } : s);
    saveToLocal(updated);
  };

  const ProgressBar = ({ current, total, color = "bg-blue-500" }: { current: number, total: number, color?: string }) => (
    <div className="w-full bg-gray-700 rounded-full h-2.5 mt-2">
      <div 
        className={`${color} h-2.5 rounded-full transition-all duration-500 shadow-[0_0_10px_currentColor]`} 
        style={{ width: `${(current/total) * 100}%` }}
      ></div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display">Progress Tracker</h1>
          <p className="text-gray-400">Semester {profileSem} Curriculum</p>
        </div>
        <Button onClick={() => initializeFromCurriculum(profileSem)} variant="outline" className="text-xs">
          <RefreshCw size={14} className="mr-2" /> Reset to Default Curriculum
        </Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subjects.map(subject => (
          <GlassCard key={subject.id} className="relative group hover:bg-white/10 transition-colors border-t-2 border-t-transparent hover:border-t-blue-500">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-bold bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded uppercase tracking-wider">
                {subject.code || 'SUB'}
              </span>
              {subject.isTheory && (
                <span className="text-[10px] text-gray-500" title="Theory Subject">
                  <BookOpen size={12} />
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold mb-4 leading-tight min-h-[48px]">{subject.name}</h3>
            
            <div className="space-y-4">
              {/* Assignments */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Assignments</span>
                  <span className={`${subject.assignmentsDone === 5 ? 'text-green-400' : 'text-white'}`}>{subject.assignmentsDone} / 5</span>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button 
                      key={n}
                      onClick={() => updateSubject(subject.id, 'assignmentsDone', n === subject.assignmentsDone ? n-1 : n)}
                      className={`flex-1 h-2 rounded-sm transition-all duration-300 ${n <= subject.assignmentsDone ? 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]' : 'bg-gray-700 hover:bg-gray-600'}`}
                    />
                  ))}
                </div>
              </div>

              {/* Chapters/Units */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Units Completed</span>
                  <span>{subject.chaptersDone} / 5</span>
                </div>
                <ProgressBar current={subject.chaptersDone} total={5} color="bg-blue-500" />
                 <div className="flex justify-between mt-2">
                    <button onClick={() => updateSubject(subject.id, 'chaptersDone', Math.max(0, subject.chaptersDone - 1))} className="text-xs bg-white/10 px-2 py-1 rounded hover:bg-white/20">-</button>
                    <button onClick={() => updateSubject(subject.id, 'chaptersDone', Math.min(5, subject.chaptersDone + 1))} className="text-xs bg-white/10 px-2 py-1 rounded hover:bg-white/20">+</button>
                 </div>
              </div>

              {/* Notes Link */}
              <div className="pt-4 border-t border-white/10">
                 <div className="flex gap-2">
                   <input 
                     type="text" 
                     value={subject.notesLink}
                     onChange={(e) => updateSubject(subject.id, 'notesLink', e.target.value)}
                     className="bg-black/20 border border-white/10 rounded px-3 py-1.5 text-xs w-full text-gray-300 focus:outline-none focus:border-blue-500/50 transition-colors"
                     placeholder="Paste notes link..."
                   />
                   {subject.notesLink && (
                     <a 
                       href={subject.notesLink} 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="p-1.5 bg-green-500/20 text-green-400 rounded hover:bg-green-500/40 border border-green-500/20"
                     >
                       <ExternalLink size={14} />
                     </a>
                   )}
                 </div>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
      
      {subjects.length === 0 && !loading && (
        <div className="text-center py-20 opacity-50">
          <p>No subjects loaded. Check your profile semester.</p>
        </div>
      )}
    </div>
  );
};

export default ProgressTracker;