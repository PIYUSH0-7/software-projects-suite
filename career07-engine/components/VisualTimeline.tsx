import React from 'react';
import { Flag, Star, Trophy, Target, CalendarClock, X } from 'lucide-react';

interface VisualTimelineProps {
  onClose: () => void;
}

const VisualTimeline: React.FC<VisualTimelineProps> = ({ onClose }) => {
  const events = [
    { date: '17 Mar - 17 May', title: 'Phase 1: Foundation', desc: 'DSA (Python) + MERN Stack', icon: Flag, color: 'bg-blue-500' },
    { date: '10-17 May', title: 'Phase 1 Exams', desc: 'DSA, Web Dev, Life Skills', icon: Star, color: 'bg-blue-600' },
    { date: '17 May - 17 Jun', title: 'Phase 2: Development', desc: 'App Dev + Advanced DSA', icon: Target, color: 'bg-indigo-500' },
    { date: '10-17 Jun', title: 'Phase 2 Exams', desc: 'App Dev, Adv DSA, Comm Skills', icon: Star, color: 'bg-indigo-600' },
    { date: '17 Jun - 17 Jul', title: 'Phase 3: Modern Skills', desc: 'Agentic AI + Soft Skills', icon: Target, color: 'bg-purple-500' },
    { date: '10-17 Jul', title: 'Phase 3 Exams', desc: 'AI, Soft Skills, Time & Finance', icon: Star, color: 'bg-purple-600' },
    { date: '17 Jul - 17 Aug', title: 'Phase 4: Mastery', desc: 'Must-Have Skills (Brand/Product)', icon: Target, color: 'bg-pink-500' },
    { date: '10-17 Aug', title: 'Phase 4 Exams', desc: 'Personal Brand, Product Mgmt', icon: Star, color: 'bg-pink-600' },
    { date: '10-15 Sep', title: 'THE FINAL EXAMS', desc: 'Grand Technical & Life Skills Exam', icon: Trophy, color: 'bg-yellow-500' },
    { date: '17 Aug - 17 Sep', title: 'Phase 5: Execution', desc: 'Projects, Job Hunt, Launch', icon: Flag, color: 'bg-emerald-500' },
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/95 z-50 overflow-y-auto backdrop-blur-md animate-in fade-in duration-300 custom-scroll">
      <div className="min-h-screen py-12 px-4 md:px-8 max-w-4xl mx-auto relative">
        <button 
          onClick={onClose}
          className="fixed top-4 right-4 md:top-8 md:right-8 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-colors z-50 backdrop-blur-sm shadow-xl border border-white/10"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex flex-col items-center mb-16 animate-in slide-in-from-top-10 duration-700">
          <CalendarClock className="w-16 h-16 text-blue-400 mb-6 drop-shadow-[0_0_15px_rgba(96,165,250,0.5)]" />
          <h2 className="text-3xl md:text-5xl font-bold text-center text-white tracking-tight mb-4">
            The 2026 Master Timeline
          </h2>
          <p className="text-slate-400 text-lg text-center max-w-xl">From Foundation to Real-World Execution. Every milestone is a step closer to your dream career.</p>
        </div>

        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-emerald-500 transform md:-translate-x-1/2 opacity-30"></div>

          {events.map((event, index) => {
            const isLeft = index % 2 === 0;
            return (
              <div key={index} className={`relative mb-12 flex items-center md:justify-between ${isLeft ? 'md:flex-row' : 'md:flex-row-reverse'} flex-row-reverse justify-end group animate-in slide-in-from-bottom-4 duration-700 delay-[${index * 100}ms]`}>
                
                {/* Content */}
                <div className={`w-full md:w-[45%] pl-12 md:pl-0 ${isLeft ? 'md:pr-8 md:text-right' : 'md:pl-8 md:text-left'}`}>
                  <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700/50 p-6 rounded-2xl hover:bg-slate-800 hover:border-slate-500 transition-all duration-300 hover:transform hover:scale-[1.02] shadow-2xl relative overflow-hidden group/card">
                    <div className={`absolute top-0 left-0 w-1 h-full ${event.color} opacity-80`}></div>
                    <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold mb-3 ${event.color} text-white shadow-lg uppercase tracking-wider`}>
                      {event.date}
                    </span>
                    <h3 className="text-xl font-bold text-white mb-2 group-hover/card:text-blue-300 transition-colors">{event.title}</h3>
                    <p className="text-slate-400 text-sm font-medium">{event.desc}</p>
                  </div>
                </div>

                {/* Dot */}
                <div className="absolute left-4 md:left-1/2 transform -translate-x-1/2 flex items-center justify-center w-8 h-8 rounded-full bg-slate-900 border-4 border-slate-700 z-10 group-hover:border-white transition-colors">
                  <div className={`w-3 h-3 rounded-full ${event.color} shadow-[0_0_15px_currentColor]`}></div>
                </div>

                {/* Empty Space for Grid */}
                <div className="hidden md:block w-[45%]"></div>
              </div>
            );
          })}
        </div>
        
        <div className="text-center mt-12 pb-12">
           <button 
             onClick={onClose}
             className="px-10 py-4 bg-white text-slate-900 rounded-full font-bold hover:bg-blue-50 transition-colors shadow-lg hover:shadow-white/20 transform hover:-translate-y-1"
           >
             Return to Dashboard
           </button>
        </div>
      </div>
    </div>
  );
};

export default VisualTimeline;