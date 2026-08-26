import React, { useState, useEffect } from 'react';
import { GlassCard, Button, Input } from '../components/UI';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Activity, CalendarClock, UserCheck, Plus, Check, Clipboard, CheckSquare, Search, ShieldAlert, ArrowLeftRight } from 'lucide-react';
import { auth, db } from '../services/auth';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { StudentProfile, AttendanceRecord, CurriculumSubject } from '../types';
import { getSemesterData } from '../data/curriculum';

const Attendance = () => {
  const [role, setRole] = useState<'student' | 'teacher' | 'admin'>('student');
  const [currentUserProfile, setCurrentUserProfile] = useState<StudentProfile | null>(null);

  // Student calculator state
  const [total, setTotal] = useState<string>('');
  const [attended, setAttended] = useState<string>('');
  const [target, setTarget] = useState<string>('75');
  const [simAttend, setSimAttend] = useState<string>('');
  const [simMiss, setSimMiss] = useState<string>('');
  const [result, setResult] = useState<{
    percentage: number;
    message: string;
    status: 'safe' | 'danger';
    details?: string;
    breakdown: { name: string; value: number }[];
    isSimulation?: boolean;
  } | null>(null);

  // Real Database Attendance Roster State (for Student logs view)
  const [studentRecords, setStudentRecords] = useState<AttendanceRecord[]>([]);

  // Teacher Logging state
  const [teacherBranch, setTeacherBranch] = useState('Computer Science');
  const [teacherSemester, setTeacherSemester] = useState('5');
  const [teacherSubjectCode, setTeacherSubjectCode] = useState('');
  const [teacherDate, setTeacherDate] = useState(new Date().toISOString().split('T')[0]);
  const [classStudents, setClassStudents] = useState<StudentProfile[]>([]);
  const [attendanceStatuses, setAttendanceStatuses] = useState<{ [key: string]: 'Present' | 'Absent' }>({});
  const [subjectsList, setSubjectsList] = useState<CurriculumSubject[]>([]);
  const [loggingStatus, setLoggingStatus] = useState(false);

  // Admin Override state
  const [adminRecords, setAdminRecords] = useState<AttendanceRecord[]>([]);
  const [searchAdmin, setSearchAdmin] = useState('');

  const COLORS = ['#10b981', '#ef4444'];

  // 1. Fetch User Profile & Role
  useEffect(() => {
    if (!auth.currentUser) return;

    const unsubscribe = onSnapshot(doc(db, "users", auth.currentUser.uid), (docSnap) => {
      if (docSnap.exists()) {
        const p = docSnap.data() as StudentProfile;
        setCurrentUserProfile(p);
        setRole(p.role || 'student');
        if (p.currentSemester) {
          setTeacherSemester(p.currentSemester);
        }
        if (p.branch) {
          setTeacherBranch(p.branch);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // 2. Fetch Subjects list based on selected Semester
  useEffect(() => {
    const sem = parseInt(teacherSemester);
    if (!isNaN(sem)) {
      const semData = getSemesterData(sem);
      if (semData) {
        setSubjectsList(semData.subjects);
        if (semData.subjects.length > 0) {
          setTeacherSubjectCode(semData.subjects[0].code);
        }
      }
    }
  }, [teacherSemester]);

  // 3. Listen to student's database logs
  useEffect(() => {
    if (role !== 'student' || !auth.currentUser) return;

    const q = query(
      collection(db, "attendance_records"),
      where("studentId", "==", auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: AttendanceRecord[] = [];
      snapshot.forEach(d => {
        list.push({ id: d.id, ...d.data() } as AttendanceRecord);
      });
      list.sort((a, b) => b.date.localeCompare(a.date));
      setStudentRecords(list);

      // Auto-compute local calculator values based on database records if they exist!
      if (list.length > 0) {
        const totalClasses = list.length;
        const presentClasses = list.filter(r => r.status === 'Present').length;
        setTotal(totalClasses.toString());
        setAttended(presentClasses.toString());
      }
    });

    return () => unsubscribe();
  }, [role]);

  // 4. Admin and Teacher Listeners for Records
  useEffect(() => {
    if (role === 'student') return;

    const q = query(collection(db, "attendance_records"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: AttendanceRecord[] = [];
      snapshot.forEach(d => {
        list.push({ id: d.id, ...d.data() } as AttendanceRecord);
      });
      list.sort((a, b) => b.date.localeCompare(a.date));
      setAdminRecords(list);
    });

    return () => unsubscribe();
  }, [role]);

  // 5. Teacher: Load students list to mark attendance
  const loadStudentsForLogging = async () => {
    try {
      const q = query(
        collection(db, "users"),
        where("role", "==", "student"),
        where("branch", "==", teacherBranch),
        where("currentSemester", "==", teacherSemester)
      );
      const snap = await getDocs(q);
      const list: StudentProfile[] = [];
      const initialStatuses: { [key: string]: 'Present' | 'Absent' } = {};

      snap.forEach(d => {
        const student = { uid: d.id, ...d.data() } as StudentProfile;
        list.push(student);
        initialStatuses[student.uid] = 'Present'; // Default everyone to present
      });

      setClassStudents(list);
      setAttendanceStatuses(initialStatuses);
      if (list.length === 0) {
        alert("No students registered for this Branch and Semester yet. Register them in 'Manage Roles' or Profile desk.");
      }
    } catch (err) {
      console.error("Error loading students for class:", err);
    }
  };

  const handleToggleStatus = (uid: string) => {
    setAttendanceStatuses(prev => ({
      ...prev,
      [uid]: prev[uid] === 'Present' ? 'Absent' : 'Present'
    }));
  };

  const submitTeacherAttendance = async () => {
    if (classStudents.length === 0) return;
    setLoggingStatus(true);
    try {
      const selectedSub = subjectsList.find(s => s.code === teacherSubjectCode);
      const subName = selectedSub ? selectedSub.name : 'Subject';
      const facultyName = currentUserProfile?.displayName || auth.currentUser?.email || 'Faculty';

      // Record logs for each student
      for (const student of classStudents) {
        const record: Omit<AttendanceRecord, 'id'> = {
          studentId: student.uid,
          studentName: student.displayName || 'Anonymous Student',
          branch: teacherBranch,
          semester: teacherSemester,
          subjectCode: teacherSubjectCode,
          subjectName: subName,
          date: teacherDate,
          status: attendanceStatuses[student.uid],
          recordedBy: facultyName,
          approved: false
        };
        await addDoc(collection(db, "attendance_records"), record);
      }

      alert("Daily Attendance logged successfully and synced with student dashboards!");
      setClassStudents([]);
      setAttendanceStatuses({});
    } catch (err) {
      console.error("Error logging attendance roster:", err);
      alert("Failed to submit roster.");
    } finally {
      setLoggingStatus(false);
    }
  };

  const handleAdminStatusToggle = async (record: AttendanceRecord) => {
    if (!record.id) return;
    try {
      const nextStatus = record.status === 'Present' ? 'Absent' : 'Present';
      const adminName = currentUserProfile?.displayName || auth.currentUser?.email || 'Admin';
      await updateDoc(doc(db, "attendance_records", record.id), {
        status: nextStatus,
        lastModifiedBy: adminName,
        approved: true
      });
      alert(`Status overridden to: ${nextStatus}`);
    } catch (err) {
      console.error("Override attendance error:", err);
    }
  };

  // Student calculator logic
  const generateAdvice = (a: number, t: number, r: number) => {
    const current = (a / t) * 100;
    let message = '';
    let status: 'safe' | 'danger' = 'safe';

    if (current < r) {
      status = 'danger';
      let needed = 0;
      while (((a + needed) / (t + needed)) * 100 < r) {
        needed++;
        if (needed > 500) break;
      }
      message = `You need to attend ${needed} more lectures to reach ${r}%.`;
    } else {
      status = 'safe';
      let missable = 0;
      while ((a / (t + missable)) * 100 >= r) {
        missable++;
        if (missable > 500) break;
      }
      missable--;
      message = `Hooray! You can miss ${Math.max(0, missable)} more lectures and stay above ${r}%.`;
    }
    return { message, status };
  };

  const calculateCurrent = () => {
    const t = parseFloat(total);
    const a = parseFloat(attended);
    const r = parseFloat(target);

    if (isNaN(t) || isNaN(a) || isNaN(r) || t === 0) return;

    const { message, status } = generateAdvice(a, t, r);
    const current = (a / t) * 100;

    localStorage.setItem('dashboard_attendance_val', current.toFixed(2));
    localStorage.setItem('dashboard_attendance_status', status);

    setResult({
      percentage: parseFloat(current.toFixed(2)),
      message,
      status,
      isSimulation: false,
      breakdown: [
        { name: 'Present', value: a },
        { name: 'Absent', value: t - a },
      ]
    });
  };

  const calculateSimulation = () => {
    const t = parseFloat(total);
    const a = parseFloat(attended);
    const r = parseFloat(target);
    const sAttend = parseFloat(simAttend) || 0;
    const sMiss = parseFloat(simMiss) || 0;

    if (isNaN(t) || isNaN(a) || isNaN(r) || t === 0) {
      alert("Please fill in the Current Status fields first.");
      return;
    }

    const newTotal = t + sAttend + sMiss;
    const newAttended = a + sAttend;
    const newPercent = (newAttended / newTotal) * 100;
    
    const { message, status } = generateAdvice(newAttended, newTotal, r);
    const diff = newPercent - r;
    
    setResult({
      percentage: parseFloat(newPercent.toFixed(2)),
      message,
      status,
      isSimulation: true,
      details: `New Total: ${newTotal} | New Attended: ${newAttended} | Deviation: ${diff > 0 ? '+' : ''}${diff.toFixed(2)}%`,
      breakdown: [
        { name: 'Present', value: newAttended },
        { name: 'Absent', value: newTotal - newAttended },
      ]
    });
  };

  const filteredAdminRecords = adminRecords.filter(r => {
    const s = `${r.studentName} ${r.subjectName} ${r.recordedBy} ${r.branch}`.toLowerCase();
    return s.includes(searchAdmin.toLowerCase());
  });

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-3xl font-bold font-display bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-emerald-400">
          Attendance Portal
        </h1>
        <p className="text-gray-400">
          {role === 'student' 
            ? "Track sessional lecture logs, calculate safe bunk counts, and simulate safe boundaries."
            : role === 'teacher'
            ? "Record daily student roll calls and sync immediately with CSE/IT department registries."
            : "Review, audit, and override daily college attendance sheets manually."
          }
        </p>
      </div>

      {/* ---------------- STUDENT VIEW ---------------- */}
      {role === 'student' && (
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <GlassCard>
              <div className="flex items-center gap-2 mb-4">
                <Activity className="text-blue-400" size={24} />
                <h2 className="text-xl font-semibold text-blue-100">Bunk Calculator & Stats</h2>
              </div>
              <p className="text-xs text-gray-500 mb-4">
                Tip: Enter your logs manually or review your live faculty roster below.
              </p>
              <div className="space-y-4">
                <Input 
                  label="Total Classes Held" 
                  type="number" 
                  value={total} 
                  onChange={(e) => setTotal(e.target.value)} 
                  placeholder="e.g. 40"
                />
                <Input 
                  label="Classes Attended" 
                  type="number" 
                  value={attended} 
                  onChange={(e) => setAttended(e.target.value)} 
                  placeholder="e.g. 32"
                />
                <Input 
                  label="Required Percentage (%)" 
                  type="number" 
                  value={target} 
                  onChange={(e) => setTarget(e.target.value)} 
                  placeholder="e.g. 75"
                />
                
                <Button onClick={calculateCurrent} className="w-full mt-4">
                  Check Safe Boundary
                </Button>
              </div>
            </GlassCard>

            <GlassCard className="border-t-4 border-t-purple-500">
              <div className="flex items-center gap-2 mb-4">
                <CalendarClock className="text-purple-400" size={24} />
                <h2 className="text-xl font-semibold text-purple-100">Future Simulation</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input 
                  label="Classes to Attend" 
                  type="number" 
                  value={simAttend} 
                  onChange={(e) => setSimAttend(e.target.value)} 
                  placeholder="e.g. 5"
                />
                <Input 
                  label="Classes to Miss" 
                  type="number" 
                  value={simMiss} 
                  onChange={(e) => setSimMiss(e.target.value)} 
                  placeholder="e.g. 2"
                />
              </div>
              <Button onClick={calculateSimulation} className="w-full mt-4 bg-purple-600 hover:bg-purple-700">
                Predict Trajectory
              </Button>
            </GlassCard>
          </div>

          <div className="space-y-6">
            {/* Pie Chart display */}
            {result && (
              <GlassCard className={`border ${result.status === 'safe' ? 'border-green-500/20' : 'border-red-500/20'}`}>
                <h3 className="text-lg font-bold font-display text-white mb-2">
                  {result.isSimulation ? 'Simulated Status' : 'Current Status'}
                </h3>
                {result.details && <p className="text-xs text-purple-300 font-mono mb-4">{result.details}</p>}
                
                <div className="h-48 flex justify-center items-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={result.breakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {result.breakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-3xl font-extrabold">{result.percentage}%</span>
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Attendance</span>
                  </div>
                </div>

                <div className="mt-4 text-center">
                  <p className={`text-sm font-semibold p-3 rounded-xl ${
                    result.status === 'safe' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                  }`}>
                    {result.message}
                  </p>
                </div>
              </GlassCard>
            )}

            {/* Official Teacher Daily Logs */}
            <GlassCard className="border-t-4 border-t-emerald-500">
              <h2 className="text-lg font-bold mb-4 font-display flex items-center gap-2">
                <UserCheck className="text-emerald-400" size={20} /> Verified Faculty Roster Logs
              </h2>
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10">
                {studentRecords.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-10">No daily logs registered by teachers for your profile yet.</p>
                ) : (
                  studentRecords.map((r) => (
                    <div key={r.id} className="p-3 bg-white/5 rounded-xl border border-white/5 flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-white">{r.subjectName} ({r.subjectCode})</p>
                        <p className="text-gray-500 mt-1">Date: {r.date} | Lecturer: {r.recordedBy}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full font-bold ${
                        r.status === 'Present' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        {r.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </GlassCard>
          </div>
        </div>
      )}

      {/* ---------------- TEACHER VIEW ---------------- */}
      {role === 'teacher' && (
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <GlassCard className="border-t-4 border-t-emerald-500">
              <h2 className="text-xl font-bold font-display text-white mb-4 flex items-center gap-2">
                <Clipboard className="text-emerald-400" size={20} /> Load Lecture Class
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-1">Semester</label>
                    <select 
                      className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      value={teacherSemester}
                      onChange={(e) => setTeacherSemester(e.target.value)}
                    >
                      {[1,2,3,4,5,6,7,8].map(s => (
                        <option key={s} value={s}>Semester {s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-1">Branch</label>
                    <select 
                      className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none"
                      value={teacherBranch}
                      onChange={(e) => setTeacherBranch(e.target.value)}
                    >
                      <option value="Computer Science">Computer Science</option>
                      <option value="Information Technology">Information Technology</option>
                      <option value="Electronics Engg">Electronics Engg</option>
                      <option value="Mechanical Engg">Mechanical Engg</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">Subject</label>
                  <select 
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none"
                    value={teacherSubjectCode}
                    onChange={(e) => setTeacherSubjectCode(e.target.value)}
                  >
                    {subjectsList.map(s => (
                      <option key={s.code} value={s.code}>{s.name} ({s.code})</option>
                    ))}
                    {subjectsList.length === 0 && <option>No subjects loaded</option>}
                  </select>
                </div>

                <Input 
                  label="Lecture Date" 
                  type="date" 
                  value={teacherDate} 
                  onChange={(e) => setTeacherDate(e.target.value)}
                />

                <Button onClick={loadStudentsForLogging} className="w-full mt-4 bg-emerald-500 hover:bg-emerald-600 text-black font-bold">
                  Load Roll Call List
                </Button>
              </div>
            </GlassCard>
          </div>

          <div className="lg:col-span-2 space-y-6">
            {classStudents.length > 0 ? (
              <GlassCard>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-xl font-bold font-display text-white flex items-center gap-2">
                      <CheckSquare className="text-emerald-400" size={20} /> Mark Roster
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">Tap a student's badge to toggle Present/Absent status.</p>
                  </div>
                  <Button onClick={submitTeacherAttendance} disabled={loggingStatus} className="bg-emerald-600 hover:bg-emerald-500">
                    {loggingStatus ? 'Logging...' : 'Sync & Save Attendance'}
                  </Button>
                </div>

                <div className="space-y-2 max-h-[450px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10">
                  {classStudents.map((student) => {
                    const status = attendanceStatuses[student.uid] || 'Present';
                    return (
                      <div 
                        key={student.uid} 
                        onClick={() => handleToggleStatus(student.uid)}
                        className="p-4 bg-white/5 hover:bg-white/[0.08] rounded-xl border border-white/5 flex justify-between items-center cursor-pointer transition-all"
                      >
                        <div>
                          <p className="font-bold text-white">{student.displayName || 'Anonymous'}</p>
                          <p className="text-xs text-gray-500 mt-1">UID: {student.uid.slice(0, 10)} | {student.email}</p>
                        </div>
                        <button className={`px-4 py-1.5 rounded-lg text-xs font-extrabold uppercase tracking-wider border transition-all ${
                          status === 'Present' 
                            ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                            : 'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                          {status}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </GlassCard>
            ) : (
              <GlassCard className="text-center py-20 border-2 border-dashed border-white/10 text-gray-500">
                <CheckSquare size={48} className="mx-auto mb-4 opacity-10" />
                <p className="text-lg"> Roster list is empty.</p>
                <p className="text-sm mt-1 opacity-60">Set class details and load the roll call list.</p>
              </GlassCard>
            )}
          </div>
        </div>
      )}

      {/* ---------------- ADMIN OVERRIDES VIEW ---------------- */}
      {role === 'admin' && (
        <div className="space-y-6">
          <GlassCard className="p-4 flex items-center gap-3">
            <Search className="text-gray-400" size={20} />
            <input 
              type="text"
              className="w-full bg-transparent border-none text-white focus:outline-none placeholder-gray-500 text-sm"
              placeholder="Search records by student name, subject, or faculty..."
              value={searchAdmin}
              onChange={(e) => setSearchAdmin(e.target.value)}
            />
          </GlassCard>

          <GlassCard>
            <h2 className="text-xl font-bold font-display text-white mb-6 flex items-center gap-2">
              <ShieldAlert className="text-red-400" size={20} /> Master Override Sheets
            </h2>

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10">
              {filteredAdminRecords.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-10">No daily logs registered on the network yet.</p>
              ) : (
                filteredAdminRecords.map((r) => (
                  <div key={r.id} className="p-4 bg-white/5 hover:bg-white/[0.08] rounded-xl border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-white text-sm">{r.studentName}</span>
                        <span className="text-[10px] bg-white/5 border border-white/10 text-gray-400 px-2 py-0.5 rounded font-mono uppercase">Sem {r.semester} • {r.branch}</span>
                      </div>
                      <p className="text-gray-400 mt-1 font-semibold">{r.subjectName} ({r.subjectCode})</p>
                      <p className="text-gray-500 mt-0.5">Date: {r.date} | Logged by Faculty: {r.recordedBy} {r.lastModifiedBy ? `| Admin overridden by ${r.lastModifiedBy}` : ''}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full font-bold border ${
                        r.status === 'Present' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}>
                        {r.status}
                      </span>
                      <Button 
                        onClick={() => handleAdminStatusToggle(r)}
                        className="bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/20 text-[10px] font-bold uppercase tracking-wider py-1 px-3 flex items-center gap-1 shrink-0"
                      >
                        <ArrowLeftRight size={12} /> Override Status
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};

export default Attendance;
