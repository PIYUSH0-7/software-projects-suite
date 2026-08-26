import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from '../components/UI';
import { 
  BarChart3, Calculator, GraduationCap, BookOpen, ArrowRight, 
  Users, BrainCircuit, Clock, Target, Activity, List, X, 
  CheckCircle2, ChevronRight, User, ShieldAlert, ShieldCheck, 
  PlusCircle, ClipboardList, PenTool, AlertCircle, FileText 
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { auth, db } from '../services/auth';
import { Subject, StudentProfile, CurriculumSubject, AttendanceRecord, Grievance } from '../types';
import { getSemesterData } from '../data/curriculum';
import { doc, onSnapshot, collection, query, getDocs, where, updateDoc } from 'firebase/firestore';

const Dashboard = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState<'student' | 'teacher' | 'admin'>('student');
  const [userName, setUserName] = useState('Scholar');
  const [userProfile, setUserProfile] = useState<StudentProfile | null>(null);

  // Student States
  const [stats, setStats] = useState({
    attendance: 'NA',
    attendanceStatus: 'neutral', 
    cgpa: 'NA',
    targetSgpa: null as string | null,
    assignmentsPending: 0,
    assignmentsTotal: 0
  });
  const [assignmentDetails, setAssignmentDetails] = useState<Subject[]>([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [performanceData, setPerformanceData] = useState<{sem: string, sgpa: number}[]>([]);
  const [internalMarks, setInternalMarks] = useState<{subject: CurriculumSubject, marks: string}[]>([]);
  const [currentSem, setCurrentSem] = useState(1);

  // Teacher / Admin Unified Stats
  const [totalStudents, setTotalStudents] = useState(0);
  const [pendingGrievancesCount, setPendingGrievancesCount] = useState(0);
  const [totalAssignmentsCount, setTotalAssignmentsCount] = useState(0);
  const [isSessionalLocked, setIsSessionalLocked] = useState(false);

  const date = new Date();
  const hours = date.getHours();
  let greeting = "Good Evening";
  if (hours < 12) greeting = "Good Morning";
  else if (hours < 18) greeting = "Good Afternoon";

  // Load User details and role dynamically
  useEffect(() => {
    if (!auth.currentUser) return;

    const unsubscribeUser = onSnapshot(doc(db, "users", auth.currentUser.uid), (docSnap) => {
      if (docSnap.exists()) {
        const p = docSnap.data() as StudentProfile;
        setUserProfile(p);
        setRole(p.role || 'student');
        setUserName(p.displayName || auth.currentUser?.email?.split('@')[0] || 'Scholar');
      }
    });

    return () => unsubscribeUser();
  }, []);

  // Fetch Teacher / Admin aggregate logs from Firestore
  useEffect(() => {
    if (role === 'student') return;

    const fetchAggregates = async () => {
      try {
        // Fetch users count
        const usersSnap = await getDocs(collection(db, "users"));
        const students = usersSnap.docs.filter(d => (d.data().role || 'student') === 'student');
        setTotalStudents(students.length);

        // Fetch pending grievances count
        const grievancesSnap = await getDocs(collection(db, "grievances"));
        const pending = grievancesSnap.docs.filter(d => d.data().status === 'Pending');
        setPendingGrievancesCount(pending.length);

        // Fetch assignments count
        const assignmentsSnap = await getDocs(collection(db, "assignments"));
        setTotalAssignmentsCount(assignmentsSnap.docs.length);
      } catch (err) {
        console.error("Error fetching system aggregates:", err);
      }
    };

    fetchAggregates();
    const interval = setInterval(fetchAggregates, 10000);
    return () => clearInterval(interval);
  }, [role]);

  // Load student dashboard data with real-time Firestore integration
  useEffect(() => {
    if (role !== 'student' || !auth.currentUser) return;
    const uid = auth.currentUser.uid;

    const savedAttend = localStorage.getItem('dashboard_attendance_val');
    const savedAttendStatus = localStorage.getItem('dashboard_attendance_status');
    const savedCgpa = localStorage.getItem('dashboard_cgpa_val');
    const savedTarget = localStorage.getItem('dashboard_target_sgpa');

    let pending = 0;
    let theorySubjects: Subject[] = [];
    
    const savedProgress = localStorage.getItem(`progress_subjects_${uid}`);
    if (savedProgress) {
      const subjects = JSON.parse(savedProgress) as Subject[];
      theorySubjects = subjects.filter(s => s.isTheory);
      const totalPossible = theorySubjects.length * 5;
      const totalDone = theorySubjects.reduce((acc, curr) => acc + curr.assignmentsDone, 0);
      pending = totalPossible - totalDone;
    }

    const savedHistory = localStorage.getItem(`academic_history_${uid}`);
    if (savedHistory) {
      const hist = JSON.parse(savedHistory);
      const formatted = hist.sort((a: any, b: any) => a.sem - b.sem).map((h: any) => ({
          sem: `Sem ${h.sem}`,
          sgpa: parseFloat(h.sgpa)
      }));
      setPerformanceData(formatted);
    } else {
      setPerformanceData([]);
    }

    // Set initial stats from local storage fallback
    setStats({
      attendance: savedAttend ? `${savedAttend}%` : 'NA',
      attendanceStatus: (savedAttendStatus as any) || 'neutral',
      cgpa: savedCgpa || 'NA',
      targetSgpa: savedTarget,
      assignmentsPending: pending,
      assignmentsTotal: theorySubjects.length * 5
    });

    // 1. Subscribe to real-time Attendance Records in Firestore
    const qAttend = query(collection(db, "attendance_records"), where("studentId", "==", uid));
    const unsubAttend = onSnapshot(qAttend, (snap) => {
      if (!snap.empty) {
        let total = snap.docs.length;
        let present = snap.docs.filter(d => d.data().status === 'Present').length;
        let pct = Math.round((present / total) * 100);
        let status = pct >= 75 ? 'safe' : 'danger';
        setStats(prev => ({
          ...prev,
          attendance: `${pct}%`,
          attendanceStatus: status
        }));
      }
    });

    // 2. Subscribe to real-time Internal Marks in Firestore
    const qMarks = query(collection(db, "internal_marks_records"), where("studentId", "==", uid));
    const unsubMarks = onSnapshot(qMarks, (snap) => {
      if (!snap.empty && userProfile) {
        const sem = parseInt(userProfile.currentSemester) || 1;
        setCurrentSem(sem);
        const semData = getSemesterData(sem);
        if (semData) {
          const marksMap: Record<string, number> = {};
          snap.docs.forEach(d => {
            const data = d.data();
            if (data.subjectCode) {
              marksMap[data.subjectCode] = data.calculatedTotal || 0;
            }
          });
          const subjectsList = semData.subjects.filter(s => s.type === 'Theory').map(sub => ({
            subject: sub,
            marks: marksMap[sub.code] !== undefined ? marksMap[sub.code].toString() : 'NA'
          }));
          setInternalMarks(subjectsList);
        }
      } else {
        const savedProfile = localStorage.getItem(`profile_${uid}`);
        const savedInternals = localStorage.getItem(`internal_marks_${uid}`);
        const internalData = savedInternals ? JSON.parse(savedInternals) : {};
        
        if (savedProfile) {
          const p = JSON.parse(savedProfile) as StudentProfile;
          const sem = parseInt(p.currentSemester) || 1;
          setCurrentSem(sem);
          
          const semData = getSemesterData(sem);
          if (semData) {
              const subjectsList = semData.subjects.filter(s => s.type === 'Theory').map(sub => ({
                  subject: sub,
                  marks: internalData[sub.code] ? internalData[sub.code].toString() : 'NA'
              }));
              setInternalMarks(subjectsList);
          }
        }
      }
    });

    setAssignmentDetails(theorySubjects);

    return () => {
      unsubAttend();
      unsubMarks();
    };
  }, [role, userProfile]);

  const handleToggleSessionalLock = () => {
    setIsSessionalLocked(!isSessionalLocked);
    alert(isSessionalLocked 
      ? "Sessional marksheets unlocked! Faculty can edit internal marks entries." 
      : "Sessional sheets have been officially LOCKED! Only Admin overrides permitted."
    );
  };

  const StatCard = ({ title, value, sub, icon: Icon, color, trend, action }: any) => (
    <GlassCard className="relative overflow-hidden group min-h-[160px] flex flex-col justify-between">
      <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${color}`}>
        <Icon size={64} />
      </div>
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-3">
           <div className={`p-2 rounded-lg bg-white/5 ${color} bg-opacity-10 text-white border border-white/10`}>
             <Icon size={20} />
           </div>
           <span className="text-gray-400 font-medium text-xs uppercase tracking-wide">{title}</span>
        </div>
        <div className="text-3xl font-bold font-display text-white mb-2 tracking-tight">{value}</div>
        <div className="flex items-center gap-2 text-xs font-medium">
           {sub}
        </div>
      </div>
      {action && (
        <div className="mt-4 pt-3 border-t border-white/5">
          {action}
        </div>
      )}
    </GlassCard>
  );

  // -------------------------------------------------------------
  // STUDENT PORTAL VIEW
  // -------------------------------------------------------------
  if (role === 'student') {
    return (
      <div className="space-y-8 animate-fade-in pb-10 relative">
        <div className="flex flex-col md:flex-row justify-between items-end gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold font-display text-white mb-2">
              {greeting}, <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400">{userName}</span>
            </h1>
            <p className="text-gray-400 text-lg">Ready to engineer your future today?</p>
          </div>
          <GlassCard className="!p-3 !rounded-full flex items-center gap-3 pr-6 bg-blue-500/10 border-blue-500/20">
             <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_10px_#4ade80]"></div>
             <span className="text-sm font-medium text-blue-200">Student Portal Connected</span>
          </GlassCard>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <StatCard 
              title="Attendance Avg" 
              value={stats.attendance} 
              sub={
                <span className={`${stats.attendanceStatus === 'safe' ? 'text-green-400' : stats.attendanceStatus === 'danger' ? 'text-red-400' : 'text-gray-400'} flex items-center gap-1`}>
                   {stats.attendanceStatus === 'safe' ? '▲ Safe Zone' : stats.attendanceStatus === 'danger' ? '▼ Danger Zone' : '● No Data'}
                </span>
              }
              icon={BarChart3} 
              color="text-green-400" 
              action={
                <button onClick={() => navigate('/attendance')} className="text-xs flex items-center gap-1 text-green-400 hover:text-green-300 transition-colors">
                  <Activity size={12} /> Simulate Future
                </button>
              }
           />
           <StatCard 
              title="Current CGPA" 
              value={stats.cgpa} 
              sub={
                stats.targetSgpa ? (
                   <span className="text-purple-300 flex items-center gap-1 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                      <Target size={12} /> Next Sem Target: {stats.targetSgpa}
                   </span>
                ) : (
                  <span className="text-gray-500">No Goal Set</span>
                )
              }
              icon={GraduationCap} 
              color="text-purple-400" 
              action={
                <button onClick={() => navigate('/gpa')} className="text-xs flex items-center gap-1 text-purple-400 hover:text-purple-300 transition-colors">
                  <Calculator size={12} /> Calculate & Simulate
                </button>
              }
           />
           <StatCard 
              title="Sessional Assignments" 
              value={`${stats.assignmentsPending} Left`} 
              sub={<span className="text-orange-400">{stats.assignmentsTotal - stats.assignmentsPending} Completed</span>}
              icon={Clock} 
              color="text-orange-400" 
              action={
                <button onClick={() => setShowAssignModal(true)} className="text-xs flex items-center gap-1 text-orange-400 hover:text-orange-300 transition-colors">
                  <List size={12} /> View Details
                </button>
              }
           />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <GlassCard className="h-full min-h-[400px]">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-xl font-bold font-display">Academic Trajectory</h2>
                  <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">Semester Performance</p>
                </div>
                <button onClick={() => navigate('/gpa')} className="text-xs bg-white/5 hover:bg-white/10 px-3 py-1 rounded border border-white/10 transition-colors">
                   Update History
                </button>
              </div>
              <div className="h-72 w-full">
                {performanceData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={performanceData}>
                        <defs>
                          <linearGradient id="colorSgpa" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                        <XAxis 
                          dataKey="sem" 
                          stroke="#4b5563" 
                          tick={{fill: '#9ca3af', fontSize: 12}} 
                          axisLine={false}
                          tickLine={false}
                          dy={10}
                        />
                        <YAxis 
                          stroke="#4b5563" 
                          tick={{fill: '#9ca3af', fontSize: 12}} 
                          domain={[0, 10]} 
                          axisLine={false}
                          tickLine={false}
                          dx={-10}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(15, 22, 35, 0.95)', 
                            border: '1px solid rgba(255,255,255,0.1)', 
                            borderRadius: '12px', 
                            color: '#fff',
                            boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)' 
                          }}
                          cursor={{stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2}}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="sgpa" 
                          stroke="#3b82f6" 
                          strokeWidth={3} 
                          fillOpacity={1} 
                          fill="url(#colorSgpa)" 
                          animationDuration={2000}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500">
                        <BarChart3 className="mb-2 opacity-20" size={48} />
                        <p>No history found.</p>
                        <p className="text-xs mt-1">Go to Grade Calc &rarr; CGPA to enter past semesters.</p>
                    </div>
                )}
              </div>
            </GlassCard>
          </div>

          <div className="lg:col-span-1">
            <GlassCard className="h-full flex flex-col relative overflow-hidden">
               <div className="flex items-center justify-between mb-6">
                   <div>
                      <h2 className="text-xl font-bold font-display text-white">Internal Assessment</h2>
                      <p className="text-xs text-blue-400 font-medium">Semester {currentSem} Progress</p>
                   </div>
                   <div onClick={() => navigate('/internal-marks')} className="p-2 bg-white/5 rounded-lg hover:bg-white/10 cursor-pointer transition-colors">
                       <ChevronRight size={18} />
                   </div>
               </div>

               <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-white/20">
                  {internalMarks.length > 0 ? (
                      internalMarks.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5">
                              <div className="flex-1 min-w-0 mr-2">
                                  <h4 className="text-sm font-medium truncate" title={item.subject.name}>{item.subject.name}</h4>
                                  <p className="text-[10px] text-gray-500">{item.subject.code}</p>
                              </div>
                              <div className={`text-sm font-bold ${item.marks === 'NA' ? 'text-gray-600' : parseFloat(item.marks) > 25 ? 'text-green-400' : 'text-white'}`}>
                                  {item.marks} <span className="text-[10px] text-gray-600 font-normal">/ 30</span>
                              </div>
                          </div>
                      ))
                  ) : (
                      <div className="text-center py-10 text-gray-500">
                          <p>No theory subjects found for this semester.</p>
                      </div>
                  )}
               </div>
               
               <button 
                  onClick={() => navigate('/internal-marks')}
                  className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-medium text-sm shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all"
               >
                  Update Marks
               </button>
            </GlassCard>
          </div>
        </div>

        <h2 className="text-2xl font-bold font-display text-white mt-8 flex items-center gap-3">
          <span className="w-1 h-8 bg-purple-500 rounded-full"></span>
          Core Modules
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { title: "Attendance", icon: BarChart3, path: "/attendance", color: "text-blue-400", sub: "Calc Safe Bunks" },
            { title: "Internal Marks", icon: Calculator, path: "/internal-marks", color: "text-purple-400", sub: "Sessionals & Labs" },
            { title: "Network", icon: Users, path: "/connections", color: "text-cyan-400", sub: "Find Peers" },
            { title: "Progress", icon: BookOpen, path: "/progress", color: "text-pink-400", sub: "Track Syllabus" },
          ].map((tool, idx) => (
            <GlassCard 
              key={idx} 
              hoverEffect={true}
              className="cursor-pointer group border-l-4 border-l-transparent hover:border-l-blue-500"
            >
              <div onClick={() => navigate(tool.path)}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                     <div className={`p-3 rounded-xl bg-white/5 group-hover:bg-white/10 transition-colors ${tool.color}`}>
                      <tool.icon size={28} />
                     </div>
                  </div>
                  <ArrowRight className="text-gray-600 group-hover:text-white transition-colors opacity-0 group-hover:opacity-100 transform -translate-x-4 group-hover:translate-x-0 duration-300" />
                </div>
                
                <h3 className="text-lg font-bold font-display group-hover:text-blue-300 transition-colors">{tool.title}</h3>
                <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide group-hover:text-gray-400">{tool.sub}</p>
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Assignment Modal */}
        {showAssignModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
            <GlassCard className="w-full max-w-lg relative border-orange-500/20 shadow-[0_0_50px_rgba(249,115,22,0.1)]">
               <button 
                 onClick={() => setShowAssignModal(false)}
                 className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors"
               >
                 <X size={18} />
               </button>
               
               <div className="flex items-center gap-3 mb-6">
                 <div className="p-3 bg-orange-500/10 rounded-xl text-orange-400">
                   <List size={24} />
                 </div>
                 <div>
                    <h3 className="text-xl font-bold">Pending Assignments</h3>
                    <p className="text-sm text-gray-400">Theory Subjects Overview</p>
                 </div>
               </div>

               <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/20">
                 {assignmentDetails.length > 0 ? (
                   assignmentDetails.map(sub => {
                     const pending = 5 - sub.assignmentsDone;
                     return (
                       <div key={sub.id} className="p-4 bg-white/5 rounded-xl border border-white/5 flex justify-between items-center">
                          <div className="flex-1">
                             <div className="text-sm font-bold text-white mb-1 truncate">{sub.name}</div>
                             <div className="text-xs text-gray-500">{sub.code}</div>
                          </div>
                          <div className="flex flex-col items-end min-w-[80px]">
                             {pending === 0 ? (
                               <span className="flex items-center gap-1 text-green-400 text-sm font-medium">
                                 <CheckCircle2 size={14} /> Done
                               </span>
                             ) : (
                               <span className="text-orange-400 font-bold bg-orange-500/10 px-3 py-1 rounded-lg text-sm">
                                 {pending} Left
                               </span>
                             )}
                             <span className="text-[10px] text-gray-600 mt-1">{sub.assignmentsDone}/5 Completed</span>
                          </div>
                       </div>
                     );
                   })
                 ) : (
                   <div className="text-center py-8 text-gray-500">
                     <p>No theory subjects found.</p>
                     <p className="text-xs mt-2">Update your Progress Tracker first.</p>
                   </div>
                 )}
               </div>
               
               <div className="mt-6 pt-4 border-t border-white/10 text-center">
                  <button 
                    onClick={() => navigate('/progress')}
                    className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Update Progress Tracker →
                  </button>
               </div>
            </GlassCard>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // TEACHER (FACULTY) PORTAL VIEW
  // -------------------------------------------------------------
  if (role === 'teacher') {
    return (
      <div className="space-y-8 animate-fade-in pb-10">
        <div className="flex flex-col md:flex-row justify-between items-end gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold font-display text-white mb-2">
              Welcome, Prof. <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400">{userName}</span>
            </h1>
            <p className="text-gray-400 text-lg">Department Faculty Control Panel</p>
          </div>
          <GlassCard className="!p-3 !rounded-full flex items-center gap-3 pr-6 bg-green-500/10 border-green-500/20">
             <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_#10b981]"></div>
             <span className="text-sm font-medium text-green-200">Faculty Desk Active</span>
          </GlassCard>
        </div>

        {/* Aggregates row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            title="Total Students Registered" 
            value={totalStudents} 
            sub="Active student profiles"
            icon={Users}
            color="text-emerald-400"
          />
          <StatCard 
            title="Sessional Materials Uploads" 
            value={totalAssignmentsCount} 
            sub="Active assignments & notes"
            icon={BookOpen}
            color="text-blue-400"
            action={
              <button onClick={() => navigate('/assignments')} className="text-xs flex items-center gap-1 text-blue-400 hover:text-blue-300 font-semibold transition-colors">
                + Post New Material
              </button>
            }
          />
          <StatCard 
            title="Pending Grievances" 
            value={pendingGrievancesCount} 
            sub="Unresolved student tickets"
            icon={AlertCircle}
            color={pendingGrievancesCount > 0 ? "text-amber-400 animate-pulse" : "text-gray-400"}
            action={
              <button onClick={() => navigate('/grievances')} className="text-xs flex items-center gap-1 text-amber-400 hover:text-amber-300 font-semibold transition-colors">
                Open Redressal Desk
              </button>
            }
          />
        </div>

        {/* Quick Launchpad & College Policy */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <GlassCard>
              <h2 className="text-xl font-bold mb-4 font-display flex items-center gap-2">
                <ClipboardList className="text-emerald-400" size={20} /> Faculty Launchpad (Quick Loggers)
              </h2>
              <p className="text-gray-400 text-sm mb-6">
                Use these tools to log sessional test grades and mark daily lecture attendance rosters for B.Tech CSE sections.
              </p>
              
              <div className="grid sm:grid-cols-2 gap-4">
                <div 
                  onClick={() => navigate('/attendance')}
                  className="p-5 rounded-2xl bg-[#10b981]/5 border border-[#10b981]/10 hover:border-[#10b981]/40 cursor-pointer transition-all group flex items-start gap-4"
                >
                  <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-105 transition-transform shrink-0">
                    <BarChart3 size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white group-hover:text-emerald-400 transition-colors">Record Attendance</h3>
                    <p className="text-xs text-gray-500 mt-1">Take daily roll call and sync with student portals in real-time.</p>
                  </div>
                </div>

                <div 
                  onClick={() => navigate('/internal-marks')}
                  className="p-5 rounded-2xl bg-blue-500/5 border border-blue-500/10 hover:border-blue-500/40 cursor-pointer transition-all group flex items-start gap-4"
                >
                  <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 group-hover:scale-105 transition-transform shrink-0">
                    <Calculator size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white group-hover:text-blue-400 transition-colors">Sessional Grade Sheets</h3>
                    <p className="text-xs text-gray-500 mt-1">Record ST1, ST2, ST3, sessional quiz scores, and lab files.</p>
                  </div>
                </div>

                <div 
                  onClick={() => navigate('/assignments')}
                  className="p-5 rounded-2xl bg-purple-500/5 border border-purple-500/10 hover:border-purple-500/40 cursor-pointer transition-all group flex items-start gap-4"
                >
                  <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 group-hover:scale-105 transition-transform shrink-0">
                    <PlusCircle size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white group-hover:text-purple-400 transition-colors">Post Lecture Material</h3>
                    <p className="text-xs text-gray-500 mt-1">Post homework, B.Tech syllabus resources, and reference slides.</p>
                  </div>
                </div>

                <div 
                  onClick={() => navigate('/progress')}
                  className="p-5 rounded-2xl bg-pink-500/5 border border-pink-500/10 hover:border-pink-500/40 cursor-pointer transition-all group flex items-start gap-4"
                >
                  <div className="p-3 rounded-xl bg-pink-500/10 text-pink-400 group-hover:scale-105 transition-transform shrink-0">
                    <BookOpen size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white group-hover:text-pink-400 transition-colors">Syllabus Tracker</h3>
                    <p className="text-xs text-gray-500 mt-1">Update lecture completion state for department heads auditing.</p>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>

          <div className="lg:col-span-1">
            <GlassCard className="h-full border-t-4 border-t-emerald-500">
              <h2 className="text-lg font-bold font-display text-white mb-4">Academic Notice Board</h2>
              <div className="space-y-4 text-xs text-gray-300">
                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                  <span className="text-[9px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">Crucial</span>
                  <p className="font-bold mt-2 text-white">75% Attendance Compliance</p>
                  <p className="text-gray-400 mt-1">Ensure students with &lt; 75% attendance are warned before upcoming internal examinations.</p>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                  <span className="text-[9px] bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">Advisory</span>
                  <p className="font-bold mt-2 text-white">Sessional Lock Schedule</p>
                  <p className="text-gray-400 mt-1">Sessional sheets will be frozen by the Administrative cell post completion of ST3.</p>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // ADMINISTRATIVE PORTAL VIEW
  // -------------------------------------------------------------
  if (role === 'admin') {
    return (
      <div className="space-y-8 animate-fade-in pb-10">
        <div className="flex flex-col md:flex-row justify-between items-end gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold font-display text-white mb-2">
              Academic <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400">Control Deck</span>
            </h1>
            <p className="text-gray-400 text-lg">College Administrator Registry & Governance Console</p>
          </div>
          <GlassCard className="!p-3 !rounded-full flex items-center gap-3 pr-6 bg-purple-500/10 border-purple-500/20">
             <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse shadow-[0_0_10px_#a855f7]"></div>
             <span className="text-sm font-medium text-purple-200">Academic Cell Active</span>
          </GlassCard>
        </div>

        {/* Aggregates row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            title="Total Registered Students" 
            value={totalStudents} 
            sub="Active student profiles"
            icon={Users}
            color="text-purple-400"
            action={
              <button onClick={() => navigate('/users-management')} className="text-xs flex items-center gap-1 text-purple-400 hover:text-purple-300 font-semibold transition-colors">
                Manage User Roles →
              </button>
            }
          />
          <StatCard 
            title="Pending Grievances Status" 
            value={`${pendingGrievancesCount} Unsettled`} 
            sub="Resolution desk inbox"
            icon={FileText}
            color={pendingGrievancesCount > 0 ? "text-rose-400" : "text-gray-400"}
            action={
              <button onClick={() => navigate('/grievances')} className="text-xs flex items-center gap-1 text-rose-400 hover:text-rose-300 font-semibold transition-colors">
                Open Redressal Desk →
              </button>
            }
          />
          <StatCard 
            title="Sessional Status" 
            value={isSessionalLocked ? "LOCKED" : "ACTIVE"} 
            sub="Faculty editing restriction"
            icon={isSessionalLocked ? ShieldCheck : ShieldAlert}
            color={isSessionalLocked ? "text-green-400" : "text-yellow-400"}
            action={
              <button 
                onClick={handleToggleSessionalLock} 
                className={`text-xs font-bold transition-colors ${isSessionalLocked ? 'text-red-400 hover:text-red-300' : 'text-green-400 hover:text-green-300'}`}
              >
                {isSessionalLocked ? 'Unlock Sheets' : 'Freeze Marks Entry'}
              </button>
            }
          />
        </div>

        {/* Governance & Policy widgets */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <GlassCard>
              <h2 className="text-xl font-bold mb-4 font-display flex items-center gap-2">
                <ShieldAlert className="text-purple-400" size={20} /> Academic Governance & Overrides
              </h2>
              <p className="text-gray-400 text-sm mb-6">
                As an Administrator, you have system access to execute student registry modifications, override attendance percentages, freeze grade entries, and audit sessional records.
              </p>
              
              <div className="grid sm:grid-cols-2 gap-4">
                <div 
                  onClick={() => navigate('/users-management')}
                  className="p-5 rounded-2xl bg-purple-500/5 border border-purple-500/10 hover:border-purple-500/40 cursor-pointer transition-all group flex items-start gap-4"
                >
                  <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 group-hover:scale-105 transition-transform shrink-0">
                    <User size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white group-hover:text-purple-400 transition-colors">Manage User Roles</h3>
                    <p className="text-xs text-gray-500 mt-1">Promote registrants to Teachers/Admins or modify college departments.</p>
                  </div>
                </div>

                <div 
                  onClick={() => navigate('/attendance')}
                  className="p-5 rounded-2xl bg-red-500/5 border border-red-500/10 hover:border-red-500/40 cursor-pointer transition-all group flex items-start gap-4"
                >
                  <div className="p-3 rounded-xl bg-red-500/10 text-red-400 group-hover:scale-105 transition-transform shrink-0">
                    <BarChart3 size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white group-hover:text-red-400 transition-colors">Attendance Overrides</h3>
                    <p className="text-xs text-gray-500 mt-1">Directly adjust student attendance records or settle grievances.</p>
                  </div>
                </div>

                <div 
                  onClick={() => navigate('/internal-marks')}
                  className="p-5 rounded-2xl bg-pink-500/5 border border-pink-500/10 hover:border-pink-500/40 cursor-pointer transition-all group flex items-start gap-4"
                >
                  <div className="p-3 rounded-xl bg-pink-500/10 text-pink-400 group-hover:scale-105 transition-transform shrink-0">
                    <Calculator size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white group-hover:text-pink-400 transition-colors">Audit Sessional Marks</h3>
                    <p className="text-xs text-gray-500 mt-1">Review locked marksheets across CS/IT/EC branches.</p>
                  </div>
                </div>

                <div 
                  onClick={() => navigate('/grievances')}
                  className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/10 hover:border-amber-500/40 cursor-pointer transition-all group flex items-start gap-4"
                >
                  <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 group-hover:scale-105 transition-transform shrink-0">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white group-hover:text-amber-400 transition-colors">Grievance Desk</h3>
                    <p className="text-xs text-gray-500 mt-1">Review, answer and resolve official student academic complaints.</p>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>

          <div className="lg:col-span-1">
            <GlassCard className="h-full border-t-4 border-t-purple-500">
              <h2 className="text-lg font-bold font-display text-white mb-4">Academic System Status</h2>
              <div className="space-y-4 text-xs text-gray-300">
                <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-white">Firebase Sync Status</p>
                    <p className="text-gray-500 mt-0.5">Firestore Database Online</p>
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full bg-green-400 shadow-[0_0_8px_#4ade80]"></span>
                </div>
                <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-white">AI Assignment Solver</p>
                    <p className="text-gray-500 mt-0.5">Gemini Engine Running</p>
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full bg-green-400 shadow-[0_0_8px_#4ade80]"></span>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default Dashboard;
