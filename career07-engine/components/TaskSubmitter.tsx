import React, { useState, useEffect } from 'react';
import { auth } from '../services/firebase';
import { getUserTasks, submitTaskProof, getPhaseStatus, startPhase, resetPhaseTasks, getUserStats, isPhaseCompleted } from '../services/taskService';
import { UserTask, PhaseStatus, UserStats } from '../types';
import { CheckCircle2, Clock, ExternalLink, Send, AlertCircle, Play, Calendar, Loader2, RotateCcw, ShieldAlert, Palmtree, Settings2, Plus, Minus, Target } from 'lucide-react';
import ConfirmModal from './ConfirmModal';
import HolidayManager from './HolidayManager';
import { TASK_TYPES } from '../services/taskService';

interface TaskSubmitterProps {
  onSignIn?: () => void;
}

const TaskSubmitter: React.FC<TaskSubmitterProps> = ({ onSignIn }) => {
  const [selectedPhase, setSelectedPhase] = useState<number>(1);
  const [tasks, setTasks] = useState<UserTask[]>([]);
  const [phaseStatus, setPhaseStatus] = useState<PhaseStatus | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [submissionUrl, setSubmissionUrl] = useState('');
  const [skillFilter, setSkillFilter] = useState<'main' | 'life'>('main');
  const [error, setError] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showHolidays, setShowHolidays] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [customWorkingHours, setCustomWorkingHours] = useState<Record<number, number>>({
    1: 3, 2: 3, 3: 6, 4: 6, 5: 6, 6: 10, 0: 10
  });
  const [customTaskHours, setCustomTaskHours] = useState<Record<string, number>>(
    TASK_TYPES.reduce((acc, curr) => ({ ...acc, [curr.type]: curr.hours }), {})
  );

  const [prevPhaseCompleted, setPrevPhaseCompleted] = useState<boolean>(true);

  const phases = [
    { id: 1, title: "PHASE 1 — Foundation Phase" },
    { id: 2, title: "PHASE 2 — Development Phase" },
    { id: 3, title: "PHASE 3 — Modern Skills" },
    { id: 4, title: "PHASE 4 — Mastery Phase" },
    { id: 5, title: "FINAL EXAMS & EXECUTION" },
  ];

  const loadData = async () => {
    const user = auth.currentUser;
    if (!user) return;

    setLoading(true);
    setError(null);
    try {
      const [status, stats] = await Promise.all([
        getPhaseStatus(user.uid, selectedPhase.toString()),
        getUserStats(user.uid)
      ]);
      
      // Check if previous phase is completed
      if (selectedPhase > 1) {
        const completed = await isPhaseCompleted(user.uid, (selectedPhase - 1).toString());
        setPrevPhaseCompleted(completed);
      } else {
        setPrevPhaseCompleted(true);
      }

      setPhaseStatus(status);
      setUserStats(stats);

      if (stats.workingHours) {
        setCustomWorkingHours(stats.workingHours);
      }
      if (stats.taskHours) {
        setCustomTaskHours(prev => ({ ...prev, ...stats.taskHours }));
      }

      if (status?.isStarted) {
        const userTasks = await getUserTasks(user.uid, selectedPhase.toString());
        // Sort by startDate
        setTasks(userTasks.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()));
      } else {
        setTasks([]);
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
      setError('Failed to load tasks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedPhase]);

  const handleStartPhase = async () => {
    const user = auth.currentUser;
    if (!user) return;

    setLoading(true);
    setError(null);
    try {
      await startPhase(user.uid, selectedPhase.toString(), customWorkingHours, customTaskHours);
      await loadData();
    } catch (err: any) {
      console.error('Error starting phase:', err);
      setError(err.message || 'Error starting phase.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPhase = async () => {
    const user = auth.currentUser;
    if (!user) return;

    setLoading(true);
    setError(null);
    try {
      await resetPhaseTasks(user.uid, selectedPhase.toString());
      await loadData();
    } catch (err: any) {
      console.error('Error resetting phase:', err);
      setError(err.message || 'Error resetting phase.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (taskId: string) => {
    if (!submissionUrl) return;
    setSubmitting(taskId);
    try {
      await submitTaskProof(taskId, submissionUrl);
      setSubmissionUrl('');
      await loadData();
    } catch (error) {
      console.error('Error submitting task:', error);
    } finally {
      setSubmitting(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-emerald-500 bg-emerald-50 border-emerald-100';
      case 'submitted': return 'text-blue-500 bg-blue-50 border-blue-100';
      default: return 'text-slate-500 bg-slate-50 border-slate-100';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Task Submitter</h2>
          <p className="text-slate-500">Auto-assigned tasks based on your phase start date.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowHolidays(!showHolidays)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${showHolidays ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
          >
            <Palmtree className="w-4 h-4" />
            Holidays
          </button>
          <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
            {phases.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPhase(p.id)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${selectedPhase === p.id ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                P{p.id}
              </button>
            ))}
          </div>
        </div>
      </div>

      {showHolidays && <HolidayManager />}

      {showPreferences && !phaseStatus?.isStarted && (
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xl shadow-slate-200/50 space-y-8 animate-in slide-in-from-bottom duration-500">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 rounded-lg">
                <Settings2 className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Customize Your Schedule</h3>
                <p className="text-sm text-slate-500">Set your daily working hours and task durations.</p>
              </div>
            </div>
            <button 
              onClick={() => setShowPreferences(false)}
              className="text-slate-400 hover:text-slate-600 font-bold"
            >
              ✕
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <h4 className="font-bold text-slate-800 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-50" />
                Daily Working Hours
              </h4>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { id: 1, label: 'Monday' },
                  { id: 2, label: 'Tuesday' },
                  { id: 3, label: 'Wednesday' },
                  { id: 4, label: 'Thursday' },
                  { id: 5, label: 'Friday' },
                  { id: 6, label: 'Saturday' },
                  { id: 0, label: 'Sunday' },
                ].map((day) => (
                  <div key={day.id} className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-sm font-medium text-slate-700">{day.label}</span>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setCustomWorkingHours(prev => ({ ...prev, [day.id]: Math.max(0, (prev[day.id] || 0) - 1) }))}
                        className="p-1 hover:bg-slate-200 rounded-md transition-colors"
                      >
                        <Minus className="w-4 h-4 text-slate-500" />
                      </button>
                      <span className="w-8 text-center font-bold text-indigo-600">{customWorkingHours[day.id] || 0}h</span>
                      <button 
                        onClick={() => setCustomWorkingHours(prev => ({ ...prev, [day.id]: (prev[day.id] || 0) + 1 }))}
                        className="p-1 hover:bg-slate-200 rounded-md transition-colors"
                      >
                        <Plus className="w-4 h-4 text-slate-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="font-bold text-slate-800 flex items-center gap-2">
                <Target className="w-4 h-4 text-indigo-50" />
                Task Durations (Total Hours)
              </h4>
              <div className="grid grid-cols-1 gap-3">
                {TASK_TYPES.map((task) => (
                  <div key={task.type} className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-sm font-medium text-slate-700">{task.title}</span>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setCustomTaskHours(prev => ({ ...prev, [task.type]: Math.max(1, (prev[task.type] || 0) - 1) }))}
                        className="p-1 hover:bg-slate-200 rounded-md transition-colors"
                      >
                        <Minus className="w-4 h-4 text-slate-500" />
                      </button>
                      <span className="w-12 text-center font-bold text-indigo-600">{customTaskHours[task.type] || 0}h</span>
                      <button 
                        onClick={() => setCustomTaskHours(prev => ({ ...prev, [task.type]: (prev[task.type] || 0) + 1 }))}
                        className="p-1 hover:bg-slate-200 rounded-md transition-colors"
                      >
                        <Plus className="w-4 h-4 text-slate-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-end">
            <button
              onClick={handleStartPhase}
              className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
            >
              Save & Start Phase
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center gap-3 text-rose-700 animate-in slide-in-from-top duration-300">
          <ShieldAlert className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-rose-400 hover:text-rose-600 font-bold">✕</button>
        </div>
      )}

      {!auth.currentUser ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-amber-900 mb-2">Authentication Required</h3>
          <p className="text-amber-700 mb-6">Please sign in to access your personalized tasks and submit proof.</p>
          <button 
            onClick={onSignIn}
            className="px-6 py-2 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 transition-colors shadow-lg shadow-amber-200"
          >
            Sign In Now
          </button>
        </div>
      ) : loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
          <p className="text-slate-500 font-medium">Loading your roadmap...</p>
        </div>
      ) : !phaseStatus?.isStarted ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-xl shadow-slate-200/50">
          <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Play className="w-10 h-10 text-indigo-600 ml-1" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-3">{phases.find(p => p.id === selectedPhase)?.title}</h3>
          <p className="text-slate-500 max-w-md mx-auto mb-8">
            Ready to begin? Starting this phase will auto-assign core tasks with calculated deadlines based on your working hours.
          </p>
          {!prevPhaseCompleted ? (
            <div className="bg-rose-50 border border-rose-100 rounded-2xl p-6 text-center">
              <ShieldAlert className="w-10 h-10 text-rose-500 mx-auto mb-4" />
              <h4 className="text-lg font-bold text-rose-900 mb-2">Phase Locked</h4>
              <p className="text-rose-700 text-sm">
                You must complete all tasks in Phase {selectedPhase - 1} and get them approved before you can start Phase {selectedPhase}.
              </p>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => setShowPreferences(true)}
                className="px-8 py-4 bg-white text-indigo-600 border-2 border-indigo-600 rounded-2xl font-bold text-lg hover:bg-indigo-50 transition-all shadow-lg shadow-indigo-100 hover:-translate-y-1 flex items-center gap-2"
              >
                <Settings2 className="w-5 h-5" />
                Customize Schedule
              </button>
              <button
                onClick={handleStartPhase}
                className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 hover:-translate-y-1"
              >
                Start Phase Now
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setSkillFilter('main')}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${skillFilter === 'main' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Main Skills
              </button>
              <button
                onClick={() => setSkillFilter('life')}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${skillFilter === 'life' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Life Skills
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl px-4 py-2 flex items-center gap-3">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-indigo-900">Started: {new Date(phaseStatus.startDate).toLocaleDateString()}</span>
              </div>
              <button
                onClick={() => setShowResetConfirm(true)}
                className="flex items-center gap-2 px-4 py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition-all border border-transparent hover:border-rose-100"
                title="Reset Phase"
              >
                <RotateCcw className="w-4 h-4" />
                Reset Phase
              </button>
            </div>
          </div>

          <ConfirmModal
            isOpen={showResetConfirm}
            title="Reset Phase Progress?"
            message={`Warning: YOU ARE NOT DOING RIGHT WITH YOUR GOALS. This will delete all tasks for Phase ${selectedPhase} and reset your progress. This action cannot be undone.`}
            confirmText="Yes, Reset Phase"
            cancelText="Cancel"
            onConfirm={handleResetPhase}
            onClose={() => setShowResetConfirm(false)}
            isDanger={true}
          />

          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-sm">
            <div className="text-sm font-bold text-slate-600 uppercase tracking-widest">
              {tasks.filter(t => t.skillType === skillFilter && t.status === 'approved').length} / {tasks.filter(t => t.skillType === skillFilter).length} {skillFilter} Skills Completed
            </div>
            <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-500 transition-all duration-500"
                style={{ width: `${(tasks.filter(t => t.skillType === skillFilter && t.status === 'approved').length / (tasks.filter(t => t.skillType === skillFilter).length || 1)) * 100}%` }}
              />
            </div>
          </div>

          <div className="space-y-8">
            {Array.from(new Set(tasks.filter(t => t.skillType === skillFilter).map(t => t.skillName))).map((skillName, idx) => (
              <div key={skillName || `skill-${idx}`} className="space-y-4">
                <h3 className="text-xl font-bold text-slate-800 border-l-4 border-indigo-500 pl-4">{skillName}</h3>
                <div className="grid gap-4">
                  {tasks.filter(t => t.skillName === skillName).map((task) => (
                    <div key={task.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex-grow">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-lg font-bold text-slate-900">{task.title}</h4>
                            <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(task.status)}`}>
                              {task.status}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                            <div className="flex items-center gap-1.5 font-medium">
                              <Clock className="w-4 h-4 text-indigo-500" />
                              {task.hoursRequired} Hours
                            </div>
                            <div className="flex items-center gap-1.5 font-medium">
                              <Calendar className="w-4 h-4 text-rose-500" />
                              <div className="flex flex-col">
                                {task.type === 'revision' ? (
                                  <>
                                    <span className="text-indigo-600 font-bold uppercase tracking-widest text-[10px]">Daily Revision</span>
                                    <span className="text-[10px] text-slate-400">
                                      {new Date(task.startDate).toLocaleDateString()} - {new Date(task.deadline).toLocaleDateString()}
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <span>
                                      {new Date(task.startDate).toLocaleDateString()} - {new Date(task.deadline).toLocaleDateString()}
                                    </span>
                                    <span className="text-[10px] uppercase tracking-tighter text-slate-400">
                                      {task.assignedDays?.join(', ')}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-3">
                          {task.status === 'pending' ? (
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                              <input
                                type="url"
                                placeholder="Proof URL"
                                className="flex-grow sm:w-48 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                value={submitting === task.id ? submissionUrl : (submitting === null ? submissionUrl : '')}
                                onChange={(e) => setSubmissionUrl(e.target.value)}
                              />
                              <button
                                onClick={() => handleSubmit(task.id)}
                                disabled={submitting === task.id || !submissionUrl}
                                className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-md shadow-indigo-100"
                              >
                                {submitting === task.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                              {task.submissionUrl && (
                                <a
                                  href={task.submissionUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all"
                                >
                                  <ExternalLink className="w-4 h-4" /> View Proof
                                </a>
                              )}
                              {task.status === 'approved' && (
                                <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                                  <CheckCircle2 className="w-5 h-5" /> Done
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskSubmitter;
