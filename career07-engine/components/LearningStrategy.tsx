import React from 'react';
import { X, PlayCircle, BookOpen, Code, CheckSquare, Award, Youtube, Repeat, Star, Flame, Trophy, ArrowRight } from 'lucide-react';

interface LearningStrategyProps {
  onClose: () => void;
}

const steps = [
  {
    id: 1,
    title: "Video Course & Notes",
    action: "Watch video course → make notes → solve all questions (handwritten + laptop)",
    icon: PlayCircle,
    color: "text-blue-500",
    bg: "bg-blue-50",
    border: "border-blue-200",
    verdict: "PERFECT. Builds concept understanding, memory storage, practical execution, and pattern recognition. Handwritten = long-term memory. Laptop = interview-ready skill."
  },
  {
    id: 2,
    title: "Book Overview",
    action: "Overview the book → add important things to notes (not very deep)",
    icon: BookOpen,
    color: "text-indigo-500",
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    verdict: "EXCELLENT. Books are for big-picture understanding and filling gaps, not reading like novels. Saves time while strengthening concepts."
  },
  {
    id: 3,
    title: "Solve PYQs",
    action: "Solve good amount of PYQs (handwritten + laptop)",
    icon: Code,
    color: "text-violet-500",
    bg: "bg-violet-50",
    border: "border-violet-200",
    verdict: "BRILLIANT. PYQ = REAL WORLD. Writing them improves memory, coding them builds practice. Guarantees high interview success and pattern mastery."
  },
  {
    id: 4,
    title: "Syllabus Checklist",
    action: "Go through checklist of syllabus – make sure everything is covered",
    icon: CheckSquare,
    color: "text-emerald-500",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    verdict: "VERY PROFESSIONAL. Ensures no gaps, no blind spots, and no weak topics. Treats learning like a project."
  },
  {
    id: 5,
    title: "Certificates & Job Sims",
    action: "Complete checklist for certificates, job simulations, etc. (notes + execution)",
    icon: Award,
    color: "text-amber-500",
    bg: "bg-amber-50",
    border: "border-amber-200",
    verdict: "FUTURE-PROOF. Companies check certificates, GitHub, and portfolio work. Makes you placement-ready BEFORE job hunting."
  },
  {
    id: 6,
    title: "Short Notes & Teaching",
    action: "Make short notes + YouTube one-shot by yourself",
    icon: Youtube,
    color: "text-red-500",
    bg: "bg-red-50",
    border: "border-red-200",
    verdict: "AMAZING. Teaching is the highest form of learning. Compresses knowledge and increases confidence. A top-tier memory technique."
  },
  {
    id: 7,
    title: "Spaced Revision",
    action: "Daily, weekly, monthly revision before phase exams",
    icon: Repeat,
    color: "text-cyan-500",
    bg: "bg-cyan-50",
    border: "border-cyan-200",
    verdict: "THE BEST PART. The secret to NEVER forgetting. Uses Spaced Repetition Method (used by toppers). Guarantees long-term retention."
  }
];

const LearningStrategy: React.FC<LearningStrategyProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-slate-900/95 z-[60] overflow-y-auto backdrop-blur-md animate-in fade-in zoom-in duration-300 custom-scroll">
      <div className="min-h-screen py-12 px-4 md:px-8 max-w-5xl mx-auto relative">
        <button 
          onClick={onClose}
          className="fixed top-4 right-4 md:top-8 md:right-8 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-colors z-50 shadow-xl border border-white/10"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="text-center mb-16 space-y-4 animate-in slide-in-from-top-10 duration-500">
          <div className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-orange-500 to-red-600 rounded-3xl shadow-2xl shadow-red-500/30 mb-4">
            <Flame className="w-10 h-10 text-white fill-orange-100" />
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">
            The Ultimate Learning Strategy
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto font-medium leading-relaxed">
            A scientifically proven 7-step protocol to master any skill, never forget concepts, and crush FAANG interviews.
          </p>
          <div className="flex justify-center gap-2 mt-4">
            <span className="px-4 py-1.5 bg-yellow-400/10 rounded-full text-xs font-bold text-yellow-400 border border-yellow-400/20 flex items-center gap-2 uppercase tracking-wide">
              <Star className="w-3.5 h-3.5 fill-yellow-400" /> Rated 10/10 Strategy
            </span>
          </div>
        </div>

        {/* Steps Grid */}
        <div className="space-y-8 relative">
          {/* Connecting Line (Desktop) */}
          <div className="hidden md:block absolute left-[2.25rem] top-8 bottom-8 w-0.5 bg-slate-700/50 -z-10"></div>

          {steps.map((step, index) => (
            <div key={step.id} className="group relative flex flex-col md:flex-row gap-6 md:gap-8 items-start">
              
              {/* Number Circle */}
              <div className={`hidden md:flex flex-shrink-0 w-20 h-20 rounded-full ${step.bg} border-4 ${step.border} items-center justify-center shadow-xl z-10 transition-transform group-hover:scale-110 duration-300`}>
                <step.icon className={`w-8 h-8 ${step.color}`} />
              </div>

              {/* Card */}
              <div className="flex-grow w-full bg-slate-800/80 backdrop-blur-md border border-slate-700 rounded-2xl p-6 md:p-8 hover:bg-slate-800 transition-all duration-300 hover:shadow-2xl hover:border-slate-500 group-hover:translate-x-2">
                <div className="flex items-center gap-3 md:hidden mb-4">
                   <div className={`p-2 rounded-lg ${step.bg}`}>
                      <step.icon className={`w-6 h-6 ${step.color}`} />
                   </div>
                   <span className="text-slate-400 font-bold text-sm uppercase tracking-wide">Step {index + 1}</span>
                </div>

                <h3 className={`text-2xl font-bold text-white mb-2 flex items-center gap-3`}>
                  {step.title}
                  <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-white transition-colors" />
                </h3>
                
                <p className="text-lg text-slate-200 font-medium mb-8 leading-relaxed border-l-4 border-slate-600 pl-6 py-1">
                  {step.action}
                </p>

                <div className={`p-5 rounded-xl bg-slate-900/50 border border-slate-700/50`}>
                  <div className="flex items-start gap-3">
                    <Trophy className={`w-5 h-5 ${step.color} mt-1 flex-shrink-0`} />
                    <p className="text-sm text-slate-400 leading-relaxed">
                      <span className={`font-bold ${step.color} block mb-1 uppercase tracking-wider text-xs`}>Why this works</span>
                      {step.verdict}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-20 text-center pb-8">
          <p className="text-slate-500 text-sm mb-8 font-medium">
            "This strategy guarantees: High interview success, Pattern mastery, and No surprises in exams."
          </p>
          <button 
             onClick={onClose}
             className="px-10 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full font-bold hover:shadow-lg hover:shadow-indigo-500/25 transition-all transform hover:-translate-y-1 text-lg"
           >
             I'm Ready to Execute
           </button>
        </div>
      </div>
    </div>
  );
};

export default LearningStrategy;