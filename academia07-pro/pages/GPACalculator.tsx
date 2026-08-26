import React, { useState, useEffect } from 'react';
import { GlassCard, Button, Input } from '../components/UI';
import { Target } from 'lucide-react';
import { auth } from '../services/auth';
import { getSemesterData } from '../data/curriculum';
import { StudentProfile } from '../types';

interface SubjectEntry {
  id: string;
  code: string;
  name: string;
  credits: number;
  marks: string; // Input by user
}

interface SemesterEntry {
  sem: number;
  sgpa: string; // Input by user
  credits: number; // Pre-filled
}

const GPACalculator = () => {
  const [mode, setMode] = useState<'sgpa' | 'cgpa'>('sgpa');
  
  // SGPA State
  const [selectedSem, setSelectedSem] = useState<number>(1);
  const [sgpaSubjects, setSgpaSubjects] = useState<SubjectEntry[]>([]);
  const [sgpaResult, setSgpaResult] = useState<number | null>(null);

  // CGPA State
  const [semesters, setSemesters] = useState<SemesterEntry[]>([]);
  const [cgpaResult, setCgpaResult] = useState<number | null>(null);
  const [profileSem, setProfileSem] = useState<number>(1);
  
  // Simulation State
  const [desiredCGPA, setDesiredCGPA] = useState('');
  const [simResult, setSimResult] = useState<string | null>(null);

  // Initial Load
  useEffect(() => {
    if (auth.currentUser) {
      const savedProfile = localStorage.getItem(`profile_${auth.currentUser.uid}`);
      let currentSem = 1;
      if (savedProfile) {
        const p = JSON.parse(savedProfile) as StudentProfile;
        currentSem = parseInt(p.currentSemester) || 1;
      }
      setProfileSem(currentSem);
      setSelectedSem(currentSem);
      
      // Auto-load subjects for SGPA for current sem
      loadSgpaSubjects(currentSem);

      // Auto-load past semesters for CGPA
      loadCgpaSemesters(currentSem);
    }
  }, []);

  const loadSgpaSubjects = (sem: number) => {
    const data = getSemesterData(sem);
    if (data) {
      setSgpaSubjects(data.subjects.map(s => ({
        id: s.code,
        code: s.code,
        name: s.name,
        credits: s.credits,
        marks: ''
      })));
      setSgpaResult(null);
    }
  };

  const loadCgpaSemesters = (current: number) => {
    // Determine how many semesters to show. 
    // Usually 1 to current-1, but if Sem 1, show just Sem 1 placeholder.
    const sems: SemesterEntry[] = [];
    const loopLimit = current > 1 ? current : 2; 
    
    for (let i = 1; i < loopLimit; i++) {
       const data = getSemesterData(i);
       // Try to pre-fill from saved history if available
       sems.push({
         sem: i,
         sgpa: '',
         credits: data ? data.totalCredits : 0
       });
    }

    // Load saved values if they exist
    if (auth.currentUser) {
        const savedHistory = localStorage.getItem(`academic_history_${auth.currentUser.uid}`);
        if (savedHistory) {
            const history = JSON.parse(savedHistory);
            sems.forEach(s => {
                const found = history.find((h: any) => h.sem === s.sem);
                if (found) s.sgpa = found.sgpa.toString();
            });
        }
    }

    setSemesters(sems);
  };

  const handleSemChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sem = parseInt(e.target.value);
    setSelectedSem(sem);
    loadSgpaSubjects(sem);
  };

  // --- SGPA Logic ---
  const updateSubjectMark = (id: string, val: string) => {
    setSgpaSubjects(prev => prev.map(s => s.id === id ? { ...s, marks: val } : s));
  };

  const calculateSGPA = () => {
    let totalPoints = 0;
    let totalCredits = 0;

    sgpaSubjects.forEach(sub => {
      const marks = parseFloat(sub.marks);
      const credits = sub.credits;
      
      if (!isNaN(marks) && marks > 0) {
        let gradePoint = 0;
        // AKTU Standard Grading (Approximate)
        if (marks >= 90) gradePoint = 10;
        else if (marks >= 80) gradePoint = 9;
        else if (marks >= 70) gradePoint = 8;
        else if (marks >= 60) gradePoint = 7;
        else if (marks >= 50) gradePoint = 6;
        else if (marks >= 45) gradePoint = 5;
        else if (marks >= 40) gradePoint = 4;
        
        totalPoints += (gradePoint * credits);
        totalCredits += credits;
      }
    });

    setSgpaResult(totalCredits > 0 ? parseFloat((totalPoints / totalCredits).toFixed(2)) : 0);
  };

  // --- CGPA Logic ---
  const updateSemesterSgpa = (sem: number, val: string) => {
    setSemesters(prev => prev.map(s => s.sem === sem ? { ...s, sgpa: val } : s));
  };

  const calculateCGPA = () => {
    let totalPoints = 0;
    let totalCredits = 0;
    const historyToSave: {sem: number, sgpa: number}[] = [];

    semesters.forEach(s => {
      const sgpa = parseFloat(s.sgpa);
      if(!isNaN(sgpa)) {
        totalPoints += (sgpa * s.credits);
        totalCredits += s.credits;
        historyToSave.push({ sem: s.sem, sgpa });
      }
    });

    const result = totalCredits > 0 ? parseFloat((totalPoints / totalCredits).toFixed(2)) : 0;
    setCgpaResult(result);
    localStorage.setItem('dashboard_cgpa_val', result.toString());

    // Save history for Dashboard Chart
    if (auth.currentUser) {
        localStorage.setItem(`academic_history_${auth.currentUser.uid}`, JSON.stringify(historyToSave));
    }
  };

  const calculateSimulation = () => {
    // 1. Calculate points achieved so far
    let currentPoints = 0;
    let currentCredits = 0;
    
    semesters.forEach(s => {
      const sgpa = parseFloat(s.sgpa);
      if(!isNaN(sgpa)) {
        currentPoints += (sgpa * s.credits);
        currentCredits += s.credits;
      }
    });

    // 2. Calculate remaining credits
    const totalSems = 8;
    const startSem = semesters.length + 1; // e.g., if we filled up to Sem 3, we start predicting from Sem 4
    let remainingCredits = 0;
    
    for(let i = startSem; i <= totalSems; i++) {
       const d = getSemesterData(i);
       if(d) remainingCredits += d.totalCredits;
    }

    if (remainingCredits === 0) {
      setSimResult("Degree complete!");
      return;
    }

    const target = parseFloat(desiredCGPA);
    const totalProgramCredits = currentCredits + remainingCredits;
    const requiredTotalPoints = target * totalProgramCredits;
    const neededPoints = requiredTotalPoints - currentPoints;
    
    const reqAvgSGPA = neededPoints / remainingCredits;
    
    const val = reqAvgSGPA.toFixed(2);
    setSimResult(val);
    localStorage.setItem('dashboard_target_sgpa', val);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold font-display">GPA Calculator</h1>
        <div className="bg-white/10 p-1 rounded-lg flex gap-1">
          <button 
            onClick={() => setMode('sgpa')}
            className={`px-4 py-1 rounded-md transition-colors ${mode === 'sgpa' ? 'bg-blue-600 text-white' : 'hover:bg-white/10 text-gray-300'}`}
          >
            SGPA
          </button>
          <button 
            onClick={() => setMode('cgpa')}
            className={`px-4 py-1 rounded-md transition-colors ${mode === 'cgpa' ? 'bg-blue-600 text-white' : 'hover:bg-white/10 text-gray-300'}`}
          >
            CGPA
          </button>
        </div>
      </div>

      <GlassCard>
        {mode === 'sgpa' ? (
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <h2 className="text-xl font-semibold text-pink-300">Marks to SGPA</h2>
              <select 
                value={selectedSem} 
                onChange={handleSemChange}
                className="bg-black/30 border border-white/10 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:ring-1 focus:ring-pink-500"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                   <option key={s} value={s}>Semester {s}</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-3">
              <div className="grid grid-cols-12 gap-4 text-xs font-bold text-gray-500 uppercase tracking-wide px-2">
                <div className="col-span-2">Code</div>
                <div className="col-span-5">Subject</div>
                <div className="col-span-2 text-center">Credit</div>
                <div className="col-span-3">Marks</div>
              </div>
              
              {sgpaSubjects.map((sub) => (
                <div key={sub.id} className="grid grid-cols-12 gap-4 items-center bg-white/5 p-3 rounded-xl border border-white/5">
                  <div className="col-span-2 text-xs font-mono text-gray-400">{sub.code.split('/')[0]}</div>
                  <div className="col-span-5 text-sm font-medium leading-tight">{sub.name}</div>
                  <div className="col-span-2 text-center text-sm font-bold text-blue-400">{sub.credits}</div>
                  <div className="col-span-3">
                    <input
                      type="number"
                      placeholder="Obtained"
                      className="w-full bg-black/20 border border-white/10 rounded px-2 py-1 text-white focus:outline-none focus:border-pink-500 text-sm"
                      value={sub.marks}
                      onChange={(e) => updateSubjectMark(sub.id, e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
            
            <div className="pt-6 border-t border-white/10 flex justify-between items-center">
               <Button onClick={calculateSGPA}>Calculate SGPA</Button>
               {sgpaResult !== null && (
                 <div className="text-right">
                   <p className="text-sm text-gray-400">Your SGPA</p>
                   <p className="text-4xl font-bold font-display text-pink-400">{sgpaResult}</p>
                 </div>
               )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-green-300">Semester Performance</h2>
              <span className="text-xs bg-green-900/30 text-green-400 px-2 py-1 rounded border border-green-500/20">
                 Current Profile: Sem {profileSem}
              </span>
            </div>
            <p className="text-xs text-gray-400">Enter your SGPA for previous semesters to calculate CGPA and update your Academic Trajectory on the Dashboard.</p>
            
            <div className="space-y-3">
              {semesters.map((sem) => (
                <div key={sem.sem} className="flex gap-4 items-center animate-fade-in">
                   <div className="w-24 text-gray-400 font-medium">Semester {sem.sem}</div>
                   <div className="w-24 text-center bg-white/5 rounded py-2 text-xs text-gray-400 border border-white/5">
                      {sem.credits} Credits
                   </div>
                   <div className="flex-1">
                     <Input 
                        value={sem.sgpa}
                        onChange={(e) => updateSemesterSgpa(sem.sem, e.target.value)}
                        placeholder="Enter SGPA"
                        type="number"
                        max={10}
                     />
                   </div>
                </div>
              ))}
            </div>
            
             <div className="pt-4 border-t border-white/10 flex justify-between items-center">
               <Button onClick={calculateCGPA}>Calculate CGPA & Update Dashboard</Button>
               {cgpaResult !== null && (
                 <div className="text-right">
                   <p className="text-sm text-gray-400">Cumulative GPA</p>
                   <p className="text-4xl font-bold font-display text-green-400">{cgpaResult}</p>
                 </div>
               )}
            </div>

            {/* Simulation Section */}
            <div className="mt-8 pt-8 border-t border-white/10">
               <div className="flex items-center gap-2 mb-4 text-purple-300">
                  <Target size={20} />
                  <h3 className="text-lg font-semibold">Future Simulation</h3>
               </div>
               
               <div className="bg-purple-900/10 border border-purple-500/20 rounded-xl p-4">
                 <p className="text-sm text-gray-400 mb-4">
                   What SGPA do I need in remaining semesters to get my dream CGPA?
                 </p>
                 
                 <div className="flex gap-4 items-end">
                    <div className="flex-1">
                      <Input 
                        label="Desired CGPA" 
                        value={desiredCGPA} 
                        onChange={(e) => setDesiredCGPA(e.target.value)} 
                        placeholder="e.g. 8.5"
                      />
                    </div>
                    <div className="mb-4">
                      <Button onClick={calculateSimulation} variant="secondary">Simulate</Button>
                    </div>
                 </div>

                 {simResult && (
                    <div className="mt-4 p-4 bg-purple-500/20 rounded-lg border border-purple-500/30 flex items-center justify-between">
                       <span>Required Avg SGPA:</span>
                       <span className={`text-2xl font-bold ${parseFloat(simResult) > 10 ? 'text-red-400' : 'text-white'}`}>
                         {parseFloat(simResult) > 10 ? 'Impossible (>10)' : simResult}
                       </span>
                    </div>
                 )}
               </div>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
};

export default GPACalculator;