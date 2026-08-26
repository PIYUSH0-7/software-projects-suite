
import React from 'react';
import { UserProfile } from '../types';
import { User, ShieldCheck, Clock } from 'lucide-react';

interface ProfileViewProps {
  userProfile: UserProfile;
}

const ProfileView: React.FC<ProfileViewProps> = ({ userProfile }) => {
  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex items-center gap-6 bg-slate-900/80 p-8 rounded-3xl border border-amber-900/20">
        <div className="w-24 h-24 rounded-full bg-amber-500 flex items-center justify-center text-4xl shadow-[0_0_40px_rgba(245,158,11,0.2)]">
          {userProfile.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="text-3xl font-divine text-amber-500 font-bold">{userProfile.name}</h2>
          <div className="flex items-center gap-2 text-slate-400 mt-2">
            <ShieldCheck size={18} className="text-emerald-500" />
            <span>Swadharma Pledged</span>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/80 p-8 rounded-3xl border border-amber-900/20">
        <div className="flex items-center gap-3 mb-6 border-b border-amber-900/20 pb-4">
          <Clock className="text-amber-500" />
          <h3 className="text-xl font-divine text-amber-200">The Divine Schedule</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {userProfile.timetable.sort((a,b) => a.time.localeCompare(b.time)).map((entry) => (
            <div key={entry.id} className="flex items-center gap-4 bg-slate-800/50 p-4 rounded-xl border border-slate-700">
              <span className="text-amber-500 font-bold font-mono text-lg">{entry.time}</span>
              <div className="h-4 w-px bg-slate-700"></div>
              <span className="text-slate-200">{entry.activity}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="p-8 bg-amber-900/10 rounded-3xl border border-amber-900/20 text-center">
        <p className="italic text-amber-200/60 leading-relaxed">
          "Focus on your work and never on its fruit. Next to attachment to fruit, let there be no attachment to inaction in you."
          <br />
          <span className="font-divine mt-4 block text-amber-500">— Bhagavad Gita</span>
        </p>
      </div>
    </div>
  );
};

export default ProfileView;
