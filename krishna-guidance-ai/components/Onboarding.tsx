
import React, { useState } from 'react';
import { UserProfile, TimetableEntry } from '../types';
import { Plus, Trash2, ArrowRight, Clock, Star } from 'lucide-react';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [name, setName] = useState('');
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [newTime, setNewTime] = useState('');
  const [newActivity, setNewActivity] = useState('');

  const addEntry = () => {
    if (newTime && newActivity) {
      setTimetable([...timetable, { id: Math.random().toString(36).substr(2, 9), time: newTime, activity: newActivity }]);
      setNewTime('');
      setNewActivity('');
    }
  };

  const removeEntry = (id: string) => {
    setTimetable(timetable.filter(t => t.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && timetable.length > 0) {
      onComplete({ name, timetable, onboarded: true });
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-12 animate-fade-in py-10">
      <div className="text-center space-y-6">
        <div className="inline-block p-2 bg-amber-500/10 rounded-full border border-amber-500/30 mb-2">
          <Star className="text-amber-500 animate-spin-slow" size={24} />
        </div>
        <h2 className="font-divine text-5xl md:text-6xl text-amber-500 font-black tracking-[0.1em] drop-shadow-2xl">
          THE VOW OF DHARMA
        </h2>
        <p className="text-amber-200/60 italic text-xl max-w-lg mx-auto leading-relaxed">
          "A person who is not disturbed by the incessant flow of desires—that person alone can achieve peace."
        </p>
      </div>

      <form onSubmit={handleSubmit} className="glass p-10 md:p-14 rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.5)] space-y-12 border-amber-500/30">
        <div className="space-y-6">
          <label className="block text-amber-400 font-divine uppercase tracking-[0.4em] text-xs font-black">
            Thy Name, O Soul
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Arjuna"
            className="w-full bg-slate-900/50 border-b-2 border-amber-500/30 rounded-t-xl px-6 py-5 text-2xl focus:border-amber-500 outline-none transition-all placeholder:text-slate-700 font-divine font-bold text-amber-50"
            required
          />
        </div>

        <div className="space-y-8">
          <div className="flex items-center gap-4">
             <Clock className="text-amber-500" size={24} />
             <label className="text-amber-400 font-divine uppercase tracking-[0.4em] text-xs font-black">
               The Divine Timetable
             </label>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-8 bg-slate-900/60 rounded-3xl border border-amber-500/20">
            <div className="md:col-span-4">
               <input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="w-full bg-slate-800 rounded-2xl p-4 outline-none focus:ring-2 ring-amber-500 border border-amber-500/20 text-white font-bold"
              />
            </div>
            <div className="md:col-span-6">
               <input
                type="text"
                value={newActivity}
                onChange={(e) => setNewActivity(e.target.value)}
                placeholder="Prescribed Duty (e.g. Meditation)"
                className="w-full bg-slate-800 rounded-2xl p-4 outline-none focus:ring-2 ring-amber-500 border border-amber-500/20 text-white placeholder:text-slate-600"
              />
            </div>
            <div className="md:col-span-2">
              <button
                type="button"
                onClick={addEntry}
                className="w-full h-full flex items-center justify-center bg-amber-600 hover:bg-amber-500 text-white rounded-2xl transition-all shadow-lg active:scale-95"
              >
                <Plus size={28} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {timetable.sort((a,b) => a.time.localeCompare(b.time)).map((entry) => (
              <div key={entry.id} className="flex items-center justify-between bg-slate-800/80 p-5 rounded-2xl border border-amber-500/10 group hover:border-amber-500/40 transition-all">
                <div className="flex items-center gap-4">
                  <div className="bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-1 rounded">
                    {entry.time}
                  </div>
                  <span className="text-slate-200 font-bold tracking-wide">{entry.activity}</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeEntry(entry.id)}
                  className="text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={!name || timetable.length === 0}
          className="w-full py-6 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:opacity-30 disabled:grayscale text-slate-950 font-divine font-black text-2xl rounded-[2rem] shadow-[0_20px_60px_rgba(245,158,11,0.4)] transition-all flex items-center justify-center gap-6 active:scale-95"
        >
          ENTER THE BATTLEFIELD <ArrowRight size={32} />
        </button>
      </form>
      
      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow { animation: spin-slow 12s linear infinite; }
      `}</style>
    </div>
  );
};

export default Onboarding;
