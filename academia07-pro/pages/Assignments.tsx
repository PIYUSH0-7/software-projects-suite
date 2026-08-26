import React, { useState, useEffect } from 'react';
import { GlassCard, Button, Input } from '../components/UI';
import { auth, db } from '../services/auth';
import { collection, query, where, addDoc, doc, onSnapshot, deleteDoc } from 'firebase/firestore';
import { BookOpen, Calendar, User, Link, Trash2, Plus, PenTool, ExternalLink, RefreshCw, FileText } from 'lucide-react';
import { Assignment, StudentProfile, CurriculumSubject } from '../types';
import { getSemesterData } from '../data/curriculum';
import { useNavigate } from 'react-router-dom';

const Assignments = () => {
  const [role, setRole] = useState<'student' | 'teacher' | 'admin'>('student');
  const [currentUserProfile, setCurrentUserProfile] = useState<StudentProfile | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [subjects, setSubjects] = useState<CurriculumSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  // Create Assignment State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetSemester, setTargetSemester] = useState('5');
  const [targetBranch, setTargetBranch] = useState('Computer Science');
  const [selectedSubjectCode, setSelectedSubjectCode] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notesLink, setNotesLink] = useState('');

  useEffect(() => {
    if (!auth.currentUser) return;

    // Fetch user profile and role
    const unsubscribeProfile = onSnapshot(doc(db, "users", auth.currentUser.uid), (docSnap) => {
      if (docSnap.exists()) {
        const profile = docSnap.data() as StudentProfile;
        setCurrentUserProfile(profile);
        setRole(profile.role || 'student');
        if (profile.currentSemester) {
          setTargetSemester(profile.currentSemester);
        }
        if (profile.branch) {
          setTargetBranch(profile.branch);
        }
      }
    });

    return () => unsubscribeProfile();
  }, []);

  // Update subject choices based on targetSemester
  useEffect(() => {
    const semNum = parseInt(targetSemester);
    if (!isNaN(semNum)) {
      const data = getSemesterData(semNum);
      if (data) {
        setSubjects(data.subjects);
        if (data.subjects.length > 0) {
          setSelectedSubjectCode(data.subjects[0].code);
        }
      }
    }
  }, [targetSemester]);

  // Listen to assignments
  useEffect(() => {
    if (!auth.currentUser) return;

    setLoading(true);
    let q;

    if (role === 'student' && currentUserProfile) {
      // Students see assignments for their semester and branch
      q = query(
        collection(db, "assignments"),
        where("semester", "==", currentUserProfile.currentSemester || '1')
      );
    } else {
      // Teachers and Admins see all
      q = query(collection(db, "assignments"));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Assignment[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Assignment);
      });
      // Sort: closest due date first
      list.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
      setAssignments(list);
      setLoading(false);
    }, (error) => {
      console.error("Error listening to assignments:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [role, currentUserProfile]);

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !title.trim() || !dueDate) {
      alert("Please fill in Title, Due Date, and Subject.");
      return;
    }

    setSubmitting(true);
    try {
      const subjectObj = subjects.find(s => s.code === selectedSubjectCode);
      const subjectName = subjectObj ? subjectObj.name : 'Unknown';

      const newAssignment: Omit<Assignment, 'id'> = {
        title,
        description,
        subjectCode: selectedSubjectCode,
        subjectName,
        semester: targetSemester,
        branch: targetBranch,
        dueDate,
        uploadedBy: currentUserProfile?.displayName || auth.currentUser.email || 'Faculty Member',
        notesLink: notesLink.trim() || undefined
      };

      await addDoc(collection(db, "assignments"), newAssignment);
      setTitle('');
      setDescription('');
      setNotesLink('');
      setDueDate('');
      alert("Assignment & Lecture Study Notes posted successfully!");
    } catch (error) {
      console.error("Error creating assignment:", error);
      alert("Failed to post assignment.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this posting?")) return;
    try {
      await deleteDoc(doc(db, "assignments", id));
      alert("Posting deleted.");
    } catch (error) {
      console.error("Delete assignment error:", error);
      alert("Failed to delete.");
    }
  };

  const handleSolveWithAI = (assignment: Assignment) => {
    // Generate a mock formatted JSON for the student, navigating directly to the solver
    const queryPayload = {
      questions: [
        {
          number: 1,
          question: `Explain the core concepts of: "${assignment.title}". \nDescription: ${assignment.description}`,
          answer: `[AI Tutor generating answers for ${assignment.subjectName} assignment...]`
        }
      ]
    };
    
    // Save to localstorage so the tutor page can parse it on mount if needed
    localStorage.setItem('ai_tutor_prefill', JSON.stringify(queryPayload));
    navigate('/ai-tutor');
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold font-display bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
            Syllabus, Assignments & Material
          </h1>
          <p className="text-gray-400">
            {role === 'student'
              ? "Download active assignments, homework questions, or lecture notes uploaded by your subject faculties."
              : "Post assignments, lecture outlines, sessional notes, and exam prep material."
            }
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Upload Form (Teacher / Admin) */}
        {role !== 'student' && (
          <div className="lg:col-span-1 space-y-6">
            <GlassCard className="border-t-4 border-t-blue-500">
              <h2 className="text-xl font-bold font-display text-white mb-4 flex items-center gap-2">
                <Plus size={20} className="text-blue-400" /> Post New Resource
              </h2>
              <form onSubmit={handleCreateAssignment} className="space-y-4">
                <Input 
                  label="Title" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="e.g. Mini Project Report / Unit 3 Assignment"
                  required
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-1">Semester</label>
                    <select 
                      className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={targetSemester}
                      onChange={(e) => setTargetSemester(e.target.value)}
                    >
                      {[1,2,3,4,5,6,7,8].map(sem => (
                        <option key={sem} value={sem}>{sem}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-1">Branch</label>
                    <select 
                      className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={targetBranch}
                      onChange={(e) => setTargetBranch(e.target.value)}
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
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={selectedSubjectCode}
                    onChange={(e) => setSelectedSubjectCode(e.target.value)}
                  >
                    {subjects.map(s => (
                      <option key={s.code} value={s.code}>{s.name} ({s.code})</option>
                    ))}
                    {subjects.length === 0 && <option>No subjects loaded</option>}
                  </select>
                </div>

                <Input 
                  label="Due Date" 
                  type="date"
                  value={dueDate} 
                  onChange={(e) => setDueDate(e.target.value)} 
                  required
                />

                <Input 
                  label="Drive Link / Drive Folder" 
                  value={notesLink} 
                  onChange={(e) => setNotesLink(e.target.value)} 
                  placeholder="https://drive.google.com/drive/..."
                />

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">Task Details/Instructions</label>
                  <textarea 
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                    placeholder="Enter details of assignment questions, topics, or reference books."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <Button disabled={submitting} className="w-full">
                  {submitting ? 'Posting...' : 'Post Assignment'}
                </Button>
              </form>
            </GlassCard>
          </div>
        )}

        {/* List of Resource Cards */}
        <div className={role !== 'student' ? 'lg:col-span-2 space-y-4' : 'lg:col-span-3 grid md:grid-cols-2 gap-6'}>
          {loading ? (
            <div className="text-center py-20 text-gray-400 col-span-full">Loading resources portal...</div>
          ) : assignments.length === 0 ? (
            <GlassCard className="text-center py-16 text-gray-500 col-span-full border-2 border-dashed border-white/10">
              <BookOpen size={48} className="mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">No postings yet</p>
              <p className="text-sm mt-1 opacity-60">
                {role === 'student' 
                  ? "Relax! Faculty hasn't uploaded sessional homework assignments yet." 
                  : "Start uploading notes and sessional assignments above."
                }
              </p>
            </GlassCard>
          ) : (
            assignments.map((assign) => (
              <GlassCard key={assign.id} className="border-t-2 border-t-indigo-500 flex flex-col justify-between relative group overflow-hidden">
                <div className="absolute top-0 right-0 p-3 bg-indigo-500/10 blur-[30px] rounded-full pointer-events-none"></div>
                <div>
                  <div className="flex justify-between items-start gap-4 mb-2">
                    <div>
                      <span className="text-[10px] bg-indigo-900/40 text-indigo-300 px-2.5 py-1 rounded-full border border-indigo-500/20 font-bold uppercase tracking-wider">
                        {assign.subjectCode} • Sem {assign.semester}
                      </span>
                      <h3 className="text-lg font-bold text-white mt-2 leading-snug">{assign.title}</h3>
                      <p className="text-xs text-gray-400 italic font-medium">{assign.subjectName}</p>
                    </div>
                    {role !== 'student' && (
                      <button 
                        onClick={() => handleDeleteAssignment(assign.id || '')}
                        className="p-1.5 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-lg border border-red-500/20 transition-all shadow"
                        title="Delete Assignment"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  <p className="text-sm text-gray-300 bg-black/20 p-3 rounded-lg leading-relaxed mb-4 mt-3 whitespace-pre-line">
                    {assign.description || 'No detailed instructions. Check notes link.'}
                  </p>
                </div>

                <div className="space-y-3 pt-3 border-t border-white/5 text-xs text-gray-400 mt-auto">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-indigo-400" />
                    <span>Submission Deadline: <strong className="text-white">{assign.dueDate}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-indigo-400" />
                    <span>Posted By: <strong className="text-white">{assign.uploadedBy}</strong></span>
                  </div>
                  {assign.notesLink && (
                    <a 
                      href={assign.notesLink} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex items-center gap-2 text-blue-400 hover:text-blue-300 font-semibold"
                    >
                      <Link size={14} />
                      <span>Download Study Notes / Reference Folder <ExternalLink size={10} className="inline ml-1" /></span>
                    </a>
                  )}

                  {role === 'student' && (
                    <div className="pt-2">
                      <Button 
                        onClick={() => handleSolveWithAI(assign)}
                        variant="secondary" 
                        className="w-full bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-500/30 text-indigo-300 hover:text-white font-bold flex items-center justify-center gap-2 py-2"
                      >
                        <PenTool size={14} /> Solved with AI Assignment Solver
                      </Button>
                    </div>
                  )}
                </div>
              </GlassCard>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Assignments;
