import React, { useState } from 'react';
import { Domain } from '../types';
import { CheckCircle2, Award, Calendar, ChevronDown, ChevronRight, Play, BookOpen, Brain, Activity, Heart, Clock, Users, Zap, Target, FileText, ExternalLink, Compass, CheckSquare } from 'lucide-react';
import VisualTimeline from './VisualTimeline';

interface DashboardProps {
  domains: Domain[];
  onSelectDomain: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ domains, onSelectDomain }) => {
  const [activePhase, setActivePhase] = useState<number | null>(1);
  const [showTimeline, setShowTimeline] = useState(false);

  // Calculate global progress
  const totalTasks = domains.reduce((acc, domain) => 
    acc + domain.sections.reduce((sAcc, section) => sAcc + section.tasks.length, 0), 0);
  
  const completedTasks = domains.reduce((acc, domain) => 
    acc + domain.sections.reduce((sAcc, section) => 
      sAcc + section.tasks.filter(t => t.isCompleted).length, 0), 0);

  const progressPercentage = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  const phases = [
    {
      id: 1,
      title: "PHASE 1 — Foundation Phase",
      date: "17 March – 17 May",
      desc: "The bedrock of Engineering. Master DSA & Web Dev.",
      color: "border-l-4 border-blue-500",
      bg: "bg-blue-50",
      skills: [
        { 
          name: "DSA with Python", 
          domainId: "dsa-python", 
          icon: BookOpen,
          link: "https://drive.google.com/file/d/15-aZYNQhv3E8333krhZr9QBnb64vPrBJ/view?usp=drive_link"
        },
        { 
          name: "Full Stack Web Dev", 
          domainId: "mern", 
          icon: Zap,
          link: "https://drive.google.com/file/d/1byDwsYuQ-h5hbntoXY9PJfYSROujbJ3_/view?usp=drive_link"
        },
        { 
          name: "Learning Mgmt", 
          domainId: null, 
          icon: Brain, 
          note: "Found in Life Skills",
          link: "https://drive.google.com/file/d/1kdlcJiEr7yaMKs0EsvH5EyP2shptTocB/view?usp=drive_link"
        },
        { 
          name: "Health Mgmt", 
          domainId: null, 
          icon: Heart, 
          note: "Found in Life Skills",
          link: "https://drive.google.com/file/d/1kdlcJiEr7yaMKs0EsvH5EyP2shptTocB/view?usp=drive_link"
        }
      ],
      examSchedule: [
        { date: "10 May", event: "DSA with Python" },
        { date: "12 May", event: "Full Stack Web Development" },
        { date: "13 May", event: "Learning + Health Management" },
        { date: "17 May", event: "Phase 1 Result Analysis" }
      ]
    },
    {
      id: 2,
      title: "PHASE 2 — Development Phase",
      date: "17 May – 17 June",
      desc: "Deep thinking & Building real apps.",
      color: "border-l-4 border-indigo-500",
      bg: "bg-indigo-50",
      skills: [
        { 
          name: "App Development", 
          domainId: "app-dev", 
          icon: Zap,
          link: "https://drive.google.com/file/d/1ubOiTbQUTd2jyRzajH3nh2Gb2VFh4iu3/view?usp=drive_link"
        },
        { 
          name: "Advanced DSA", 
          domainId: "adv-dsa", 
          icon: Brain,
          link: "https://drive.google.com/file/d/1JiTseBwqsgtdGU2DyNU2YXBAJu4l1EcO/view?usp=drive_link"
        },
        { 
          name: "Thinking Skills", 
          domainId: null, 
          icon: Brain, 
          note: "Found in Life Skills",
          link: "https://drive.google.com/file/d/1kdlcJiEr7yaMKs0EsvH5EyP2shptTocB/view?usp=drive_link"
        },
        { 
          name: "Communication", 
          domainId: null, 
          icon: Users, 
          note: "Found in Soft Skills",
          link: "https://drive.google.com/file/d/1qYGhKPX56xNT9aEp9Bv-9vk8E4etIuQT/view?usp=drive_link"
        }
      ],
      examSchedule: [
        { date: "10 June", event: "App Development" },
        { date: "12 June", event: "Advanced DSA" },
        { date: "13 June", event: "Thinking + Communication" },
        { date: "17 June", event: "Phase 2 Result Analysis" }
      ]
    },
    {
      id: 3,
      title: "PHASE 3 — Modern Skills",
      date: "17 June – 17 July",
      desc: "Agentic AI & Professional Confidence.",
      color: "border-l-4 border-purple-500",
      bg: "bg-purple-50",
      skills: [
        { 
          name: "Agentic AI", 
          domainId: "agentic-ai", 
          icon: Brain,
          link: "https://drive.google.com/file/d/1OTpeU-QqJBJmzGcFW6cP90ZD4mPRcbi/view?usp=drive_link"
        },
        { 
          name: "Soft Skills", 
          domainId: "soft-skills", 
          icon: Users,
          link: "https://drive.google.com/file/d/1qYGhKPX56xNT9aEp9Bv-9vk8E4etIuQT/view?usp=drive_link"
        },
        { 
          name: "Time Mgmt", 
          domainId: null, 
          icon: Clock, 
          note: "Found in Life Skills",
          link: "https://drive.google.com/file/d/1kdlcJiEr7yaMKs0EsvH5EyP2shptTocB/view?usp=drive_link"
        },
        { 
          name: "Finance Mgmt", 
          domainId: null, 
          icon: Activity, 
          note: "Found in Life Skills",
          link: "https://drive.google.com/file/d/1kdlcJiEr7yaMKs0EsvH5EyP2shptTocB/view?usp=drive_link"
        }
      ],
      examSchedule: [
        { date: "10 July", event: "Agentic AI" },
        { date: "12 July", event: "Soft Skills Placement Test" },
        { date: "13 July", event: "Time + Finance Management" },
        { date: "17 July", event: "Phase 3 Result Analysis" }
      ]
    },
    {
      id: 4,
      title: "PHASE 4 — Mastery Phase",
      date: "17 July – 17 August",
      desc: "Must-Have Skills & Relationships.",
      color: "border-l-4 border-pink-500",
      bg: "bg-pink-50",
      skills: [
        { 
          name: "Must-Have Skills", 
          domainId: "must-have", 
          icon: Award,
          link: "https://drive.google.com/file/d/14qK1j-0MNq-cZOANuT-DRYpRT28grSmB/view?usp=drive_link"
        },
        { 
          name: "Relationships", 
          domainId: null, 
          icon: Heart, 
          note: "Found in Life Skills",
          link: "https://drive.google.com/file/d/1kdlcJiEr7yaMKs0EsvH5EyP2shptTocB/view?usp=drive_link"
        }
      ],
      examSchedule: [
        { date: "10-12 August", event: "Must-Have Skills Exams" },
        { date: "15 August", event: "All Previous Skills Exam" },
        { date: "17 August", event: "Phase 4 Result Analysis" }
      ]
    },
    {
      id: 5,
      title: "FINAL EXAMS & EXECUTION",
      date: "17 August – 17 September",
      desc: "The Grand Exams & Real World Job Hunt.",
      color: "border-l-4 border-emerald-500",
      bg: "bg-emerald-50",
      skills: [
        { 
          name: "Job Hunt & Projects", 
          domainId: null, 
          icon: Target, 
          note: "Execution Phase",
          link: "https://drive.google.com/file/d/1VMbtSf-lCcTZjKcQt5WZveM93PczTxsw/view?usp=drive_link"
        }
      ],
      examSchedule: [
        { date: "10 September", event: "GRAND TECHNICAL EXAM" },
        { date: "12 September", event: "LIFE SKILLS FINAL" },
        { date: "15 September", event: "Career Prediction Analysis" },
        { date: "17 September+", event: "Real-World Execution" }
      ]
    }
  ];

  // Helper to find domain progress
  const getDomainProgress = (id: string | null) => {
    if (!id) return 0;
    const domain = domains.find(d => d.id === id);
    if (!domain) return 0;
    const t = domain.sections.reduce((acc, s) => acc + s.tasks.length, 0);
    const c = domain.sections.reduce((acc, s) => acc + s.tasks.filter(tk => tk.isCompleted).length, 0);
    return t === 0 ? 0 : Math.round((c / t) * 100);
  };

  const getTargetIcon = (Icon: React.ElementType) => <Icon className="w-5 h-5" />;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {showTimeline && <VisualTimeline onClose={() => setShowTimeline(false)} />}

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
        
        {/* Card 1: Master Progress */}
        <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden flex flex-col justify-between h-full group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity duration-500">
            <Award className="w-32 h-32 transform rotate-12" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <Award className="w-6 h-6 text-yellow-400" />
              <h3 className="font-semibold text-lg tracking-wide">Master Progress</h3>
            </div>
            <div className="text-4xl font-bold mb-1 tracking-tight">{progressPercentage}%</div>
            <p className="text-slate-400 text-sm font-medium">Career Readiness Score</p>
            <div className="w-full bg-white/10 h-2 rounded-full mt-4 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-yellow-400 to-orange-500 h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(250,204,21,0.5)]" 
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
          <div className="relative z-10 mt-6 pt-4 border-t border-slate-800">
            <a 
              href="https://drive.google.com/file/d/1VMbtSf-lCcTZjKcQt5WZveM93PczTxsw/view?usp=drive_link" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center text-xs text-yellow-400 hover:text-yellow-300 transition-colors gap-1 font-semibold uppercase tracking-wider"
            >
              <FileText className="w-3 h-3" />
              View Progress Tracker PDF
              <ExternalLink className="w-3 h-3 ml-auto opacity-70" />
            </a>
          </div>
        </div>

        {/* Card 2: Dev Path Tracker */}
        <a 
          href="https://dev-path-tracker.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 group flex flex-col justify-between h-full relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div>
            <div className="flex items-center gap-3 mb-4 text-white">
              <Compass className="w-6 h-6" />
              <h3 className="font-semibold text-lg tracking-wide">Dev Path Tracker</h3>
            </div>
            <div className="text-sm text-indigo-100/90">
              <span className="font-bold text-white block text-lg mb-1">Visual Roadmap</span>
              Interactive skill trees and career path visualization.
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-white/20 flex items-center text-xs font-bold text-white/90 group-hover:text-white gap-1 uppercase tracking-wider">
            <ExternalLink className="w-3 h-3" />
            Open External App
          </div>
        </a>

        {/* Card 3: Exam Calendar */}
        <button 
          onClick={() => onSelectDomain('exam-calendar')}
          className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-lg hover:border-indigo-200 transition-all duration-300 group text-left flex flex-col justify-between h-full"
        >
          <div>
            <div className="flex items-center gap-3 mb-4 text-blue-600">
              <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                 <Calendar className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-lg text-gray-800">Exam Calendar</h3>
            </div>
            <div className="text-sm text-gray-500">
              <span className="font-bold text-gray-900 block text-lg mb-1">Critical Dates</span>
              Detailed syllabus & patterns for every test.
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-gray-100 flex items-center text-xs font-bold text-blue-600 gap-1 uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
            View Schedule <ChevronRight className="w-3 h-3" />
          </div>
        </button>

        {/* Card 4: Life Skills */}
        <div 
          onClick={() => onSelectDomain('life-skills')}
          className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-lg hover:border-rose-200 transition-all duration-300 group text-left flex flex-col justify-between h-full cursor-pointer"
        >
          <div>
            <div className="flex items-center gap-3 mb-4 text-rose-500">
              <div className="p-2 bg-rose-50 rounded-lg group-hover:bg-rose-100 transition-colors">
                <Heart className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-lg text-gray-800">Life Skills</h3>
            </div>
            <div className="text-sm text-gray-500">
              <span className="font-bold text-gray-900 block text-lg mb-1">8 Core Skills</span>
              Health, Finance, Time, Thinking & more.
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-gray-100">
             <a 
              href="https://drive.google.com/file/d/1kdlcJiEr7yaMKs0EsvH5EyP2shptTocB/view?usp=drive_link" 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors gap-1 uppercase tracking-wider"
            >
              <FileText className="w-3 h-3" />
              PDF Download
            </a>
          </div>
        </div>
      </div>

      {/* Phases Accordion */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Activity className="w-6 h-6 text-indigo-600" />
          Your 5-Phase Roadmap
        </h2>
        
        <div className="space-y-4">
          {phases.map((phase) => (
            <div 
              key={phase.id} 
              className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 ${activePhase === phase.id ? 'ring-1 ring-indigo-500 shadow-lg' : 'hover:border-indigo-200'}`}
            >
              <button 
                onClick={() => setActivePhase(activePhase === phase.id ? null : phase.id)}
                className={`w-full text-left p-5 flex items-center justify-between ${phase.color} bg-white hover:bg-gray-50 transition-colors`}
              >
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
                  <span className="font-bold text-gray-900 text-lg">{phase.title}</span>
                  <span className="text-xs font-bold px-3 py-1 bg-gray-100 text-gray-600 rounded-full border border-gray-200">{phase.date}</span>
                </div>
                {activePhase === phase.id ? <ChevronDown className="text-gray-400" /> : <ChevronRight className="text-gray-400" />}
              </button>

              {activePhase === phase.id && (
                <div className="p-6 bg-gray-50/50 border-t border-gray-100 animate-in slide-in-from-top-2 duration-200">
                  <p className="text-gray-600 mb-6 italic border-l-2 border-gray-300 pl-4 py-1">{phase.desc}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Skills Grid */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-gray-900 text-xs uppercase tracking-widest text-indigo-600">Skills to Learn</h4>
                        <button 
                          onClick={() => onSelectDomain('task-submitter')}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-[10px] font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 uppercase tracking-wider"
                        >
                          <CheckSquare className="w-3 h-3" />
                          Manage Tasks
                        </button>
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        {phase.skills.map((skill, idx) => (
                          <div
                            key={idx}
                            onClick={() => skill.domainId ? onSelectDomain(skill.domainId) : onSelectDomain('life-skills')}
                            className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all group cursor-pointer relative overflow-hidden"
                          >
                            <div className="flex items-center gap-4 relative z-10">
                              <div className={`p-2.5 rounded-lg ${skill.domainId ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-50 text-gray-500'} group-hover:scale-110 transition-transform`}>
                                {getTargetIcon(skill.icon)}
                              </div>
                              <div className="text-left">
                                <div className="font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors">{skill.name}</div>
                                {skill.note && <div className="text-xs text-gray-400 font-medium">{skill.note}</div>}
                              </div>
                            </div>

                            <div className="flex items-center gap-3 relative z-10">
                              {skill.link && (
                                <a 
                                  href={skill.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold text-red-600 bg-red-50 rounded-full hover:bg-red-100 transition-colors border border-red-100 group/link uppercase tracking-wider"
                                  title="View Syllabus PDF"
                                >
                                  <FileText className="w-3 h-3 group-hover/link:scale-110 transition-transform" />
                                  <span className="hidden sm:inline">Syllabus</span>
                                </a>
                              )}
                              
                              {skill.domainId && (
                                <div className="flex items-center gap-2 pl-3 border-l border-gray-100">
                                  <div className="text-xs font-bold text-indigo-600 min-w-[30px] text-right">{getDomainProgress(skill.domainId)}%</div>
                                  {getDomainProgress(skill.domainId) === 100 ? (
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                  ) : (
                                    <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                      <div 
                                        className="h-full bg-indigo-500 rounded-full" 
                                        style={{ width: `${getDomainProgress(skill.domainId)}%` }}
                                      ></div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Exam Schedule */}
                    <div>
                      <h4 className="font-bold text-gray-900 mb-4 text-xs uppercase tracking-widest text-indigo-600">Exam Schedule</h4>
                      <div className="bg-white rounded-xl border border-gray-200 p-1 space-y-1">
                        {phase.examSchedule.map((exam, idx) => (
                          <div key={idx} className="flex gap-4 text-sm p-3 hover:bg-gray-50 rounded-lg transition-colors items-center">
                            <div className="font-bold text-indigo-600 whitespace-nowrap min-w-[60px] bg-indigo-50 px-2 py-1 rounded text-center text-xs">{exam.date}</div>
                            <div className="text-gray-700 font-medium">{exam.event}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Timeline CTA */}
      <div className="mt-16 text-center">
        <button 
          onClick={() => setShowTimeline(true)}
          className="group relative inline-flex items-center gap-3 px-10 py-5 bg-slate-900 text-white rounded-full font-bold text-lg shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden ring-4 ring-slate-100"
        >
          <span className="absolute inset-0 bg-white/10 group-hover:translate-x-full transition-transform duration-500 ease-out skew-x-12 -ml-4"></span>
          <Calendar className="w-5 h-5 text-indigo-400 group-hover:text-white transition-colors" />
          <span className="relative z-10">Launch Interactive Timeline</span>
        </button>
        <p className="mt-4 text-sm text-gray-400">View the 2025-2026 Master Plan</p>
      </div>
    </div>
  );
};

export default Dashboard;