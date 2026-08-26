import React, { useState, useEffect } from 'react';
import { GlassCard, Button, Input } from '../components/UI';
import { SubjectMarks, StudentProfile, CurriculumSubject, InternalMarksRecord } from '../types';
import { auth, db } from '../services/auth';
import { getSemesterData } from '../data/curriculum';
import { collection, query, where, getDocs, doc, addDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { Calculator, ShieldAlert, CheckSquare, Clipboard, Users, PenTool, Search } from 'lucide-react';

const InternalMarks = () => {
  const [role, setRole] = useState<'student' | 'teacher' | 'admin'>('student');
  const [currentUserProfile, setCurrentUserProfile] = useState<StudentProfile | null>(null);

  // Student calculator states
  const [currentSem, setCurrentSem] = useState(1);
  const [subjects, setSubjects] = useState<CurriculumSubject[]>([]);
  const [selectedSubjectCode, setSelectedSubjectCode] = useState('');
  const [marks, setMarks] = useState<SubjectMarks>({
    st1: 0,
    st2: 0,
    st3: 0,
    assignments: 0,
    quizzes: 0,
    attendance: 0
  });
  const [result, setResult] = useState<number | null>(null);

  // Student list fetched from Firestore
  const [myLoggedMarks, setMyLoggedMarks] = useState<InternalMarksRecord[]>([]);

  // Teacher entries states
  const [teacherBranch, setTeacherBranch] = useState('Computer Science');
  const [teacherSemester, setTeacherSemester] = useState('5');
  const [teacherSubjectCode, setTeacherSubjectCode] = useState('');
  const [subjectsList, setSubjectsList] = useState<CurriculumSubject[]>([]);
  const [classStudents, setClassStudents] = useState<StudentProfile[]>([]);
  const [studentGrades, setStudentGrades] = useState<{
    [key: string]: {
      st1: number;
      st2: number;
      st3: number;
      assignments: number;
      quizzes: number;
      attendance: number;
    }
  }>({});
  const [submitting, setSubmitting] = useState(false);

  // Admin states
  const [adminRecords, setAdminRecords] = useState<InternalMarksRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Listen to Current User Details & Role
  useEffect(() => {
    if (!auth.currentUser) return;

    const unsubscribe = onSnapshot(doc(db, "users", auth.currentUser.uid), (docSnap) => {
      if (docSnap.exists()) {
        const p = docSnap.data() as StudentProfile;
        setCurrentUserProfile(p);
        setRole(p.role || 'student');
        if (p.currentSemester) {
          setCurrentSem(parseInt(p.currentSemester) || 1);
          setTeacherSemester(p.currentSemester);
        }
        if (p.branch) {
          setTeacherBranch(p.branch);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // 2. Load subjects list for student/faculty based on semester selections
  useEffect(() => {
    const sem = role === 'student' ? currentSem : parseInt(teacherSemester);
    if (!isNaN(sem)) {
      const data = getSemesterData(sem);
      if (data) {
        const theorySubs = data.subjects.filter(s => s.type === 'Theory');
        setSubjectsList(theorySubs);
        if (role === 'student') {
          setSubjects(theorySubs);
          if (theorySubs.length > 0) {
            setSelectedSubjectCode(theorySubs[0].code);
          }
        } else {
          if (theorySubs.length > 0) {
            setTeacherSubjectCode(theorySubs[0].code);
          }
        }
      }
    }
  }, [currentSem, teacherSemester, role]);

  // 3. Fetch student's official Firestore internal grades
  useEffect(() => {
    if (role !== 'student' || !auth.currentUser) return;

    const q = query(
      collection(db, "internal_marks_records"),
      where("studentId", "==", auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: InternalMarksRecord[] = [];
      snapshot.forEach(d => {
        list.push({ id: d.id, ...d.data() } as InternalMarksRecord);
      });
      setMyLoggedMarks(list);
    });

    return () => unsubscribe();
  }, [role]);

  // 4. Fetch all records for admin
  useEffect(() => {
    if (role !== 'admin') return;

    const q = query(collection(db, "internal_marks_records"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: InternalMarksRecord[] = [];
      snapshot.forEach(d => {
        list.push({ id: d.id, ...d.data() } as InternalMarksRecord);
      });
      setAdminRecords(list);
    });

    return () => unsubscribe();
  }, [role]);

  // 5. Faculty: Load registered students
  const loadClassForGrades = async () => {
    try {
      const q = query(
        collection(db, "users"),
        where("role", "==", "student"),
        where("branch", "==", teacherBranch),
        where("currentSemester", "==", teacherSemester)
      );
      const snap = await getDocs(q);
      const list: StudentProfile[] = [];
      const gradesInit: typeof studentGrades = {};

      snap.forEach(d => {
        const student = { uid: d.id, ...d.data() } as StudentProfile;
        list.push(student);
        gradesInit[student.uid] = {
          st1: 0,
          st2: 0,
          st3: 0,
          assignments: 0,
          quizzes: 0,
          attendance: 75
        };
      });

      setClassStudents(list);
      setStudentGrades(gradesInit);
      if (list.length === 0) {
        alert("No students registered for this class segment. Modify user semesters in the Users cell.");
      }
    } catch (err) {
      console.error("Error loading student grades roster:", err);
    }
  };

  const handleGradeChange = (uid: string, field: string, value: string) => {
    const num = parseFloat(value) || 0;
    setStudentGrades(prev => ({
      ...prev,
      [uid]: {
        ...prev[uid],
        [field]: num
      }
    }));
  };

  // Helper formula to calculate AKTU sessional marks
  const runSessionalFormula = (grade: any) => {
    const normalizedST3 = (grade.st3 * 30) / 40;
    const allSTs = [grade.st1, grade.st2, normalizedST3];
    allSTs.sort((a, b) => b - a);
    const bestTwo = allSTs.slice(0, 2);
    const stTotal = (bestTwo[0] * 7.5) / 30 + (bestTwo[1] * 7.5) / 30;

    const assignmentScore = Math.min(grade.assignments, 5);
    const quizScore = Math.min(grade.quizzes, 5);
    
    let attendanceScore = 3;
    if (grade.attendance >= 85) attendanceScore = 5;
    else if (grade.attendance >= 75) attendanceScore = 4;

    const finalResult = parseFloat((stTotal + assignmentScore + quizScore + attendanceScore).toFixed(2));
    return finalResult;
  };

  const submitFacultySessionalRoster = async () => {
    if (classStudents.length === 0) return;
    setSubmitting(true);
    try {
      const selectedSub = subjectsList.find(s => s.code === teacherSubjectCode);
      const subName = selectedSub ? selectedSub.name : 'Subject';
      const facultyName = currentUserProfile?.displayName || auth.currentUser?.email || 'Faculty';

      for (const student of classStudents) {
        const grade = studentGrades[student.uid];
        const finalCalculated = runSessionalFormula(grade);

        const record: Omit<InternalMarksRecord, 'id'> = {
          studentId: student.uid,
          studentName: student.displayName || 'Anonymous Student',
          branch: teacherBranch,
          semester: teacherSemester,
          subjectCode: teacherSubjectCode,
          subjectName: subName,
          st1: grade.st1,
          st2: grade.st2,
          st3: grade.st3,
          assignments: grade.assignments,
          quizzes: grade.quizzes,
          attendancePercentage: grade.attendance,
          calculatedTotal: finalCalculated,
          locked: false,
          recordedBy: facultyName,
          approved: false
        };

        // Post to database
        await addDoc(collection(db, "internal_marks_records"), record);
      }

      alert("Sessional grades logged and synced with student portals successfully!");
      setClassStudents([]);
      setStudentGrades({});
    } catch (err) {
      console.error("Error submitting sessional roster:", err);
      alert("Failed to submit sessional grade logs.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdminOverrideMarks = async (record: InternalMarksRecord, field: string, nextValue: number) => {
    if (!record.id) return;
    try {
      const updatedRecord = { ...record, [field]: nextValue };
      const nextTotal = runSessionalFormula({
        st1: updatedRecord.st1,
        st2: updatedRecord.st2,
        st3: updatedRecord.st3,
        assignments: updatedRecord.assignments,
        quizzes: updatedRecord.quizzes,
        attendance: updatedRecord.attendancePercentage ?? 0
      });

      await updateDoc(doc(db, "internal_marks_records", record.id), {
        [field]: nextValue,
        calculatedTotal: nextTotal,
        lastModifiedBy: currentUserProfile?.displayName || 'Admin',
        approved: true
      });
      alert(`Sessional overridden! Recalculated Total: ${nextTotal}`);
    } catch (err) {
      console.error("Admin sessional override error:", err);
    }
  };

  // Student local calculator logic
  const handleChange = (field: keyof SubjectMarks, value: string) => {
    setMarks(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));
  };

  const calculateStudentLocal = () => {
    if (!auth.currentUser || !selectedSubjectCode) return;
    const finalCalculated = runSessionalFormula(marks);
    setResult(finalCalculated);

    const key = `internal_marks_${auth.currentUser.uid}`;
    const existing = localStorage.getItem(key);
    let data = existing ? JSON.parse(existing) : {};
    data[selectedSubjectCode] = finalCalculated;
    localStorage.setItem(key, JSON.stringify(data));
  };

  const filteredAdminRecords = adminRecords.filter(r => {
    const s = `${r.studentName} ${r.subjectName} ${r.recordedBy} ${r.branch}`.toLowerCase();
    return s.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-3xl font-bold font-display bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-400">
          Internal Marks cell
        </h1>
        <p className="text-gray-400">
          {role === 'student'
            ? "Calculate sessional exam weights, normalize ST3 results, and view official records."
            : role === 'teacher'
            ? "Record B.Tech Sessional Tests (ST1, ST2, ST3), quiz scores, and student lab logs."
            : "Directly view and execute overrides on faculty internal marks entries college-wide."
          }
        </p>
      </div>

      {/* ---------------- STUDENT VIEW ---------------- */}
      {role === 'student' && (
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <GlassCard>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-purple-300 flex items-center gap-2">
                  <Calculator size={22} className="text-purple-400" /> Sessional Weight Calculator
                </h2>
                <span className="text-xs bg-purple-900/30 text-purple-400 px-3 py-1 rounded-full border border-purple-500/20 font-bold">
                  Semester {currentSem}
                </span>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-400 mb-2">Select Subject</label>
                <select
                  value={selectedSubjectCode}
                  onChange={(e) => setSelectedSubjectCode(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none"
                >
                  {subjects.map(s => (
                    <option key={s.code} value={s.code}>{s.name} ({s.code})</option>
                  ))}
                  {subjects.length === 0 && <option>No theory subjects found</option>}
                </select>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <Input 
                  label="ST1 Marks (out of 30)" 
                  value={marks.st1} 
                  type="number"
                  onChange={(e) => handleChange('st1', e.target.value)} 
                />
                <Input 
                  label="ST2 Marks (out of 30)" 
                  value={marks.st2} 
                  type="number"
                  onChange={(e) => handleChange('st2', e.target.value)} 
                />
                <Input 
                  label="ST3 Marks (out of 40)" 
                  value={marks.st3} 
                  type="number"
                  onChange={(e) => handleChange('st3', e.target.value)} 
                />
                <Input 
                  label="Roster Attendance %" 
                  value={marks.attendance} 
                  type="number"
                  onChange={(e) => handleChange('attendance', e.target.value)} 
                />
                <Input 
                  label="Sessional Assignments Completed (Max 5)" 
                  value={marks.assignments} 
                  type="number" max={5}
                  onChange={(e) => handleChange('assignments', e.target.value)} 
                />
                <Input 
                  label="Class Quizzes Succeeded (Max 5)" 
                  value={marks.quizzes} 
                  type="number" max={5}
                  onChange={(e) => handleChange('quizzes', e.target.value)} 
                />
              </div>

              <Button onClick={calculateStudentLocal} className="w-full mt-6 bg-purple-600 hover:bg-purple-500 text-white font-bold" disabled={!selectedSubjectCode}>
                Calculate Best-of-Two Sessionals
              </Button>
            </GlassCard>
          </div>

          <div className="lg:col-span-1 space-y-6">
            {/* Dynamic Local Result card */}
            {result !== null && (
              <GlassCard className="border border-purple-500/20 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 text-purple-400">
                  <Calculator size={96} />
                </div>
                <h3 className="text-sm uppercase tracking-wider text-gray-400 font-semibold mb-2">Simulated internal Weight</h3>
                <div className="text-5xl font-extrabold text-purple-400 font-display my-3">{result}</div>
                <p className="text-xs text-gray-500 font-semibold">Normalized Out of 30 Sessional Marks</p>
                <p className="text-[11px] text-gray-400 bg-white/5 p-2 rounded-lg mt-4">
                  Uses best two scores of (ST1, ST2, Normalized ST3/30), plus Attendance bonus and Assignments.
                </p>
              </GlassCard>
            )}

            {/* Official Grades from Teacher */}
            <GlassCard className="border-t-4 border-t-purple-500">
              <h2 className="text-lg font-bold mb-4 font-display flex items-center gap-2">
                <CheckSquare className="text-purple-400" size={20} /> Verified College Marksheet
              </h2>
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10">
                {myLoggedMarks.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-10">No official internal grades logged by department faculty yet.</p>
                ) : (
                  myLoggedMarks.map((r) => (
                    <div key={r.id} className="p-3 bg-white/5 rounded-xl border border-white/5 text-xs space-y-1.5">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-white">{r.subjectName}</p>
                          <p className="text-gray-500 mt-0.5 font-mono text-[10px]">{r.subjectCode}</p>
                        </div>
                        <span className="text-sm font-bold text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-lg border border-purple-500/20">
                          {r.totalCalculated} <span className="text-[10px] text-gray-600 font-normal">/30</span>
                        </span>
                      </div>
                      <div className="text-[10px] text-gray-500 grid grid-cols-2 gap-y-1 bg-black/10 p-2 rounded-lg">
                        <p>ST1 Score: <span className="text-white font-bold">{r.st1}</span></p>
                        <p>ST2 Score: <span className="text-white font-bold">{r.st2}</span></p>
                        <p>ST3 Score: <span className="text-white font-bold">{r.st3}</span></p>
                        <p>Attendance: <span className="text-white font-bold">{r.attendance}%</span></p>
                      </div>
                      <p className="text-[10px] text-gray-600 mt-1">Logged by: {r.recordedBy}</p>
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
        <div className="grid lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <GlassCard className="border-t-4 border-t-purple-500">
              <h2 className="text-xl font-bold font-display text-white mb-4 flex items-center gap-2">
                <Clipboard className="text-purple-400" size={20} /> Load Grade Sheet
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">Semester</label>
                  <select 
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
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

                <Button onClick={loadClassForGrades} className="w-full mt-4 bg-purple-500 hover:bg-purple-600 text-black font-bold">
                  Load Students list
                </Button>
              </div>
            </GlassCard>
          </div>

          <div className="lg:col-span-3 space-y-6">
            {classStudents.length > 0 ? (
              <GlassCard>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-xl font-bold font-display text-white flex items-center gap-2">
                      <Users className="text-purple-400" size={20} /> Grade Roster Sheet
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">Enter marks and watch the Best-of-Two sessional formula calculate dynamically.</p>
                  </div>
                  <Button onClick={submitFacultySessionalRoster} disabled={submitting} className="bg-purple-600 hover:bg-purple-500">
                    {submitting ? 'Syncing...' : 'Sync & Save Marks'}
                  </Button>
                </div>

                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10">
                  {classStudents.map((student) => {
                    const grade = studentGrades[student.uid] || { st1: 0, st2: 0, st3: 0, assignments: 0, quizzes: 0, attendance: 75 };
                    const currentTotal = runSessionalFormula(grade);
                    return (
                      <div key={student.uid} className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-bold text-white text-sm">{student.displayName || 'Scholar'}</p>
                            <p className="text-[10px] text-gray-500">UID: {student.uid.slice(0, 10)}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-xs text-gray-500">Calculated Total</span>
                            <p className="text-sm font-bold text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-lg border border-purple-500/20">{currentTotal} / 30</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                          <div>
                            <label className="text-[9px] text-gray-500 uppercase font-bold block mb-1">ST1 (30)</label>
                            <input 
                              type="number"
                              className="w-full bg-black/30 border border-white/10 text-xs rounded px-2 py-1.5 focus:outline-none"
                              value={grade.st1}
                              onChange={(e) => handleGradeChange(student.uid, 'st1', e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="text-[9px] text-gray-500 uppercase font-bold block mb-1">ST2 (30)</label>
                            <input 
                              type="number"
                              className="w-full bg-black/30 border border-white/10 text-xs rounded px-2 py-1.5 focus:outline-none"
                              value={grade.st2}
                              onChange={(e) => handleGradeChange(student.uid, 'st2', e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="text-[9px] text-gray-500 uppercase font-bold block mb-1">ST3 (40)</label>
                            <input 
                              type="number"
                              className="w-full bg-black/30 border border-white/10 text-xs rounded px-2 py-1.5 focus:outline-none"
                              value={grade.st3}
                              onChange={(e) => handleGradeChange(student.uid, 'st3', e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="text-[9px] text-gray-500 uppercase font-bold block mb-1">Assign (5)</label>
                            <input 
                              type="number"
                              className="w-full bg-black/30 border border-white/10 text-xs rounded px-2 py-1.5 focus:outline-none"
                              value={grade.assignments}
                              onChange={(e) => handleGradeChange(student.uid, 'assignments', e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="text-[9px] text-gray-500 uppercase font-bold block mb-1">Quiz (5)</label>
                            <input 
                              type="number"
                              className="w-full bg-black/30 border border-white/10 text-xs rounded px-2 py-1.5 focus:outline-none"
                              value={grade.quizzes}
                              onChange={(e) => handleGradeChange(student.uid, 'quizzes', e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="text-[9px] text-gray-500 uppercase font-bold block mb-1">Attend %</label>
                            <input 
                              type="number"
                              className="w-full bg-black/30 border border-white/10 text-xs rounded px-2 py-1.5 focus:outline-none"
                              value={grade.attendance}
                              onChange={(e) => handleGradeChange(student.uid, 'attendance', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </GlassCard>
            ) : (
              <GlassCard className="text-center py-20 border-2 border-dashed border-white/10 text-gray-500">
                <CheckSquare size={48} className="mx-auto mb-4 opacity-10" />
                <p className="text-lg">Marksheet is empty.</p>
                <p className="text-sm mt-1 opacity-60">Set class criteria and load the sessional list.</p>
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
              placeholder="Search sessional records by student, subject, or faculty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </GlassCard>

          <GlassCard>
            <h2 className="text-xl font-bold font-display text-white mb-6 flex items-center gap-2">
              <ShieldAlert className="text-red-400" size={20} /> Administrative Override Desk
            </h2>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10">
              {filteredAdminRecords.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-10">No official internal grades logged on the network yet.</p>
              ) : (
                filteredAdminRecords.map((r) => (
                  <div key={r.id} className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-3 text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <p className="font-bold text-white text-sm">{r.studentName}</p>
                        <p className="text-gray-500 mt-0.5">Subject: {r.subjectName} ({r.subjectCode}) | Logged by faculty: {r.recordedBy}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-gray-500 block">Sessional Sum</span>
                        <span className="font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">{r.totalCalculated} / 30</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 bg-black/20 p-3 rounded-lg">
                      <div>
                        <label className="text-[9px] text-gray-500 block mb-0.5 font-bold uppercase">ST1 (30)</label>
                        <input 
                          type="number"
                          className="w-full bg-white/5 border border-white/10 text-xs rounded px-1.5 py-1 text-white focus:outline-none"
                          value={r.st1}
                          onChange={(e) => handleAdminOverrideMarks(r, 'st1', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-gray-500 block mb-0.5 font-bold uppercase">ST2 (30)</label>
                        <input 
                          type="number"
                          className="w-full bg-white/5 border border-white/10 text-xs rounded px-1.5 py-1 text-white focus:outline-none"
                          value={r.st2}
                          onChange={(e) => handleAdminOverrideMarks(r, 'st2', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-gray-500 block mb-0.5 font-bold uppercase">ST3 (40)</label>
                        <input 
                          type="number"
                          className="w-full bg-white/5 border border-white/10 text-xs rounded px-1.5 py-1 text-white focus:outline-none"
                          value={r.st3}
                          onChange={(e) => handleAdminOverrideMarks(r, 'st3', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-gray-500 block mb-0.5 font-bold uppercase">Assign (5)</label>
                        <input 
                          type="number"
                          className="w-full bg-white/5 border border-white/10 text-xs rounded px-1.5 py-1 text-white focus:outline-none"
                          value={r.assignments}
                          onChange={(e) => handleAdminOverrideMarks(r, 'assignments', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-gray-500 block mb-0.5 font-bold uppercase">Quiz (5)</label>
                        <input 
                          type="number"
                          className="w-full bg-white/5 border border-white/10 text-xs rounded px-1.5 py-1 text-white focus:outline-none"
                          value={r.quizzes}
                          onChange={(e) => handleAdminOverrideMarks(r, 'quizzes', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-gray-500 block mb-0.5 font-bold uppercase">Attend %</label>
                        <input 
                          type="number"
                          className="w-full bg-white/5 border border-white/10 text-xs rounded px-1.5 py-1 text-white focus:outline-none"
                          value={r.attendance}
                          onChange={(e) => handleAdminOverrideMarks(r, 'attendance', parseFloat(e.target.value) || 0)}
                        />
                      </div>
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

export default InternalMarks;
