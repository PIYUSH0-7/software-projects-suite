import React, { useState, useEffect, useRef } from 'react';
import { GlassCard, Button } from '../components/UI';
import { 
  PenTool, Download, Copy, FileText, ChevronRight, Info, ExternalLink, Check, 
  Brain, Sparkles, MessageSquare, ShieldAlert, CheckSquare, ListTodo, 
  GraduationCap, Award, CalendarClock, BookOpen, Send, User, ChevronUp, Layers, RefreshCw
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { db, auth } from '../services/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, onSnapshot, doc } from 'firebase/firestore';
import { StudentProfile, AttendanceRecord, InternalMarksRecord, Assignment, Subject } from '../types';

interface Question {
  number: number;
  question: string;
  answer: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const AITutor = () => {
  const [activeMainTab, setActiveMainTab] = useState<'rag' | 'audit' | 'solver'>('rag');
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);

  // Database / Telemetry state for RAG context
  const [lectures, setLectures] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [internalMarks, setInternalMarks] = useState<InternalMarksRecord[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [syllabusSubjects, setSyllabusSubjects] = useState<Subject[]>([]);

  // Telemetry Loading
  const [loadingTelemetry, setLoadingTelemetry] = useState(false);

  // RAG Configuration: Selected Sources
  const [selectedSources, setSelectedSources] = useState({
    lectureNotes: true,
    attendance: true,
    internalMarks: true,
    syllabusTracker: true,
    assignments: true,
  });

  // RAG Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { 
      role: 'assistant', 
      content: "Hello! I am **Academia07 Pro**, your RAG Academic Advisor & Study Coach.\n\nI have successfully mapped your university profile, lecture notes library, attendance sheets, and sessional marksheets. Ask me anything to diagnose your grades, generate personalized revision plans, or review core concepts." 
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- Original Assignment Solver State ---
  const [jsonInput, setJsonInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [resultData, setResultData] = useState<{ questions: Question[] } | null>(null);
  const [solverLoading, setSolverLoading] = useState(false);
  const [activeSolverTab, setActiveSolverTab] = useState<'input' | 'preview'>('input');
  const previewRef = useRef<HTMLDivElement>(null);

  const SYSTEM_PROMPT = `You are an intelligent academic tutor designed to solve assignments for university students.

INSTRUCTIONS:
1. I will provide study material (notes, PDF content, or topic names) and a list of questions.
2. You must answer every question comprehensively.
   - Approx 150-200 words per answer.
   - Use bullet points, clear headings, and examples to ensure maximum marks.
3. OUTPUT FORMAT: strictly pure JSON. Do not wrap in markdown code blocks (no \`\`\`json).

REQUIRED JSON STRUCTURE:
{
  "questions": [
    {
      "number": 1,
      "question": "The exact question text here",
      "answer": "The detailed answer text here..."
    }
  ]
}`;

  // Auth & Profile Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Load User Profile from Firestore
        const unsubscribeProfile = onSnapshot(doc(db, "users", currentUser.uid), (docSnap) => {
          if (docSnap.exists()) {
            const p = docSnap.data() as StudentProfile;
            setProfile(p);
            fetchAcademicTelemetry(currentUser, p);
          } else {
            // Fallback from localStorage
            const savedProfile = localStorage.getItem(`profile_${currentUser.uid}`);
            if (savedProfile) {
              const p = JSON.parse(savedProfile) as StudentProfile;
              setProfile(p);
              fetchAcademicTelemetry(currentUser, p);
            }
          }
        });
        return () => unsubscribeProfile();
      } else {
        setUser(null);
        setProfile(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Scroll to bottom on chat update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatLoading]);

  // Fetch student performance telemetry from firestore/localstorage for RAG context
  const fetchAcademicTelemetry = async (currentUser: any, p: StudentProfile) => {
    setLoadingTelemetry(true);
    const uid = currentUser.uid;
    try {
      // 1. Fetch Processed Lectures notes
      const qLectures = query(collection(db, "lectures"), where("userId", "==", uid));
      const lecturesSnap = await getDocs(qLectures);
      const tempLectures: any[] = [];
      lecturesSnap.forEach(d => {
        tempLectures.push({ id: d.id, ...d.data() });
      });
      setLectures(tempLectures);

      // 2. Fetch Attendance Records
      const qAttendance = query(collection(db, "attendance_records"), where("studentId", "==", uid));
      const attendanceSnap = await getDocs(qAttendance);
      const tempAttendance: AttendanceRecord[] = [];
      attendanceSnap.forEach(d => {
        tempAttendance.push({ id: d.id, ...d.data() } as AttendanceRecord);
      });
      setAttendanceRecords(tempAttendance);

      // 3. Fetch Sessional/Internal Marks Records
      const qMarks = query(collection(db, "internal_marks_records"), where("studentId", "==", uid));
      const marksSnap = await getDocs(qMarks);
      const tempMarks: InternalMarksRecord[] = [];
      marksSnap.forEach(d => {
        tempMarks.push({ id: d.id, ...d.data() } as InternalMarksRecord);
      });
      setInternalMarks(tempMarks);

      // 4. Fetch Semester Assignments
      const sem = p.currentSemester || '1';
      const qAssignments = query(collection(db, "assignments"), where("semester", "==", sem));
      const assignmentsSnap = await getDocs(qAssignments);
      const tempAssignments: Assignment[] = [];
      assignmentsSnap.forEach(d => {
        tempAssignments.push({ id: d.id, ...d.data() } as Assignment);
      });
      setAssignments(tempAssignments);

      // 5. Fetch Syllabus Progress Subjects from LocalStorage
      const savedSubjects = localStorage.getItem(`progress_subjects_${uid}`);
      if (savedSubjects) {
        setSyllabusSubjects(JSON.parse(savedSubjects));
      } else {
        setSyllabusSubjects([]);
      }
    } catch (error) {
      console.error("Error fetching academic telemetry for RAG:", error);
    } finally {
      setLoadingTelemetry(false);
    }
  };

  // Compile Context package to feed into API call
  const getRAGContextData = () => {
    // 1. Compile Attendance summaries
    const attendedCount = attendanceRecords.filter(r => r.status === 'Present').length;
    const totalAttendanceCount = attendanceRecords.length;
    const attendancePercentage = totalAttendanceCount > 0 ? Math.round((attendedCount / totalAttendanceCount) * 100) : 0;
    
    let statusMessage = "Safe - No issues flagged.";
    if (attendancePercentage < 75 && totalAttendanceCount > 0) {
      statusMessage = "Warning: Attendance falls below standard 75% requirement. You must attend more classes.";
    }

    // 2. Compile Lecture notes payload
    const summarizedLectures = lectures.map(l => ({
      title: l.title || "Lecture",
      subject: l.subject,
      summary: l.processedData?.summary,
      actionItems: l.processedData?.actionItems,
      sections: l.processedData?.sections?.map((s: any) => ({
        title: s.title,
        content: s.content,
        bulletPoints: s.bulletPoints
      }))
    }));

    return {
      attendance: {
        overallPercentage: attendancePercentage || 0,
        recordsCount: totalAttendanceCount,
        records: attendanceRecords.slice(0, 10), // Send recent 10 logs for performance
        statusMessage
      },
      internalMarks: {
        records: internalMarks
      },
      syllabusTracker: {
        subjects: syllabusSubjects
      },
      lectureNotes: {
        lectures: summarizedLectures
      },
      assignments: {
        records: assignments
      }
    };
  };

  // Chat Query handler
  const handleSendQuery = async (predefinedMessage?: string) => {
    const queryText = predefinedMessage || chatInput.trim();
    if (!queryText) return;

    if (!predefinedMessage) {
      setChatInput('');
    }

    // Append User Message to Chat State
    const updatedMessages = [...chatMessages, { role: 'user' as const, content: queryText }];
    setChatMessages(updatedMessages);
    setChatLoading(true);

    try {
      const contextData = getRAGContextData();
      
      const response = await fetch("/api/rag/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
          studentProfile: profile,
          selectedSources,
          contextData
        })
      });

      if (!response.ok) {
        throw new Error("RAG Server failed to generate response.");
      }

      const result = await response.json();
      if (result.success && result.reply) {
        setChatMessages(prev => [...prev, { role: 'assistant', content: result.reply }]);
      } else {
        throw new Error("Failed to formulate personalized response.");
      }
    } catch (error: any) {
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `⚠️ **Advisory Connection Interrupted**\n\nFailed to fetch advice from Gemini server. Error details: ${error.message || "Unknown error"}. Ensure your \`GEMINI_API_KEY\` is configured in the secrets menu.` 
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  // --- Original Handwritter solver actions ---
  const copyPrompt = () => {
    navigator.clipboard.writeText(SYSTEM_PROMPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const processManualJson = () => {
    try {
      if (!jsonInput.trim()) {
         alert("Please paste the JSON output from Gemini first.");
         return;
      }
      const cleanJson = jsonInput.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      if (!parsed.questions || !Array.isArray(parsed.questions)) throw new Error("Invalid format");
      setResultData(parsed);
      setActiveSolverTab('preview');
    } catch (e) {
      alert("Invalid JSON format. Please ensure it matches the required structure.");
      console.error(e);
    }
  };

  const downloadPDF = async () => {
    if (!previewRef.current) return;
    setSolverLoading(true);
    try {
        const element = previewRef.current;
        const canvas = await html2canvas(element, {
            scale: 2,
            backgroundColor: '#ffffff',
            useCORS: true
        });
        const imgData = canvas.toDataURL('image/jpeg', 0.9);
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgProps = pdf.getImageProperties(imgData);
        const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;

        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight);
          heightLeft -= pdfHeight;
        }
        pdf.save('assignment_solution.pdf');
    } catch (e) {
        console.error(e);
        alert("Failed to generate PDF");
    } finally {
        setSolverLoading(false);
    }
  };

  // Custom regex markdown parser to render lists, headers, bullet points and bolding smoothly
  const renderMarkdownText = (text: string) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      // Headers
      if (line.startsWith('### ')) {
        return <h4 key={idx} className="text-sm font-bold text-white mt-4 mb-2 font-display">{line.substring(4)}</h4>;
      }
      if (line.startsWith('## ')) {
        return <h3 key={idx} className="text-base font-bold text-indigo-300 mt-5 mb-2 font-display border-b border-white/5 pb-1">{line.substring(3)}</h3>;
      }
      if (line.startsWith('# ')) {
        return <h2 key={idx} className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 mt-6 mb-3 font-display">{line.substring(2)}</h2>;
      }
      
      // Blockquotes
      if (line.startsWith('> ')) {
        return (
          <blockquote key={idx} className="border-l-4 border-indigo-500/50 bg-indigo-500/5 px-4 py-2 my-2 rounded-r-lg text-xs text-gray-300 italic">
            {line.substring(2)}
          </blockquote>
        );
      }
      
      // Horizontal rules
      if (line === '---' || line === '***') {
        return <hr key={idx} className="border-white/10 my-4" />;
      }
      
      // Lists
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        const cleanItem = line.trim().substring(2);
        return (
          <li key={idx} className="list-disc list-inside text-gray-300 text-xs md:text-sm ml-4 my-1 leading-relaxed">
            {formatInlineMarkdown(cleanItem)}
          </li>
        );
      }

      // Ordered Lists
      const matchOrdered = line.trim().match(/^(\d+)\.\s(.*)/);
      if (matchOrdered) {
        return (
          <li key={idx} className="list-decimal list-inside text-gray-300 text-xs md:text-sm ml-4 my-1 leading-relaxed">
            {formatInlineMarkdown(matchOrdered[2])}
          </li>
        );
      }

      // Tables (simple table parser)
      if (line.startsWith('|') && line.endsWith('|')) {
        if (line.includes('---')) return null; // skip separators
        const cells = line.split('|').map(c => c.trim()).filter((_, i, arr) => i > 0 && i < arr.length - 1);
        const isHeader = idx === 0 || (lines[idx - 1] && lines[idx - 1].startsWith('|') && lines[idx + 1] && lines[idx + 1].includes('---'));
        return (
          <div key={idx} className={`flex border-b border-white/5 py-1.5 px-3 text-xs md:text-sm font-display ${isHeader ? 'bg-white/5 font-bold text-white' : 'text-gray-300 hover:bg-white/[0.01]'}`}>
            {cells.map((cell, cidx) => (
              <div key={cidx} className="flex-1 overflow-x-auto truncate pr-2">{formatInlineMarkdown(cell)}</div>
            ))}
          </div>
        );
      }

      // Plain paragraphs
      return line.trim() ? (
        <p key={idx} className="text-xs md:text-sm text-gray-300 leading-relaxed my-1.5 font-display">
          {formatInlineMarkdown(line)}
        </p>
      ) : <div key={idx} className="h-1.5" />;
    });
  };

  const formatInlineMarkdown = (text: string) => {
    let parts: (string | React.ReactNode)[] = [text];
    
    // Bold parsing
    parts = parts.flatMap((part, pi) => {
      if (typeof part !== 'string') return part;
      const pieces = part.split('**');
      if (pieces.length === 1) return part;
      return pieces.map((piece, i) => i % 2 === 1 ? <strong key={`${pi}-${i}`} className="text-white font-bold">{piece}</strong> : piece);
    });

    // LaTeX math inline parsing
    parts = parts.flatMap((part, pi) => {
      if (typeof part !== 'string') return part;
      const pieces = part.split('$$');
      if (pieces.length === 1) return part;
      return pieces.map((piece, i) => i % 2 === 1 ? <span key={`${pi}-${i}`} className="font-mono bg-blue-500/10 text-blue-300 px-1 py-0.5 rounded text-xs">{piece}</span> : piece);
    });

    // Code snippets
    parts = parts.flatMap((part, pi) => {
      if (typeof part !== 'string') return part;
      const pieces = part.split('`');
      if (pieces.length === 1) return part;
      return pieces.map((piece, i) => i % 2 === 1 ? <code key={`${pi}-${i}`} className="font-mono text-xs bg-indigo-500/15 text-indigo-400 px-1 py-0.5 rounded border border-indigo-500/10">{piece}</code> : piece);
    });

    return <>{parts}</>;
  };

  // Pre-calculated metrics for Audit view
  const getAttendanceMetrics = () => {
    const totalClasses = attendanceRecords.length;
    const attended = attendanceRecords.filter(r => r.status === 'Present').length;
    const percentage = totalClasses > 0 ? Math.round((attended / totalClasses) * 100) : 0;
    
    let advice = "No attendance logs. Please log some classes in the Attendance roster.";
    let status: 'safe' | 'danger' = 'safe';
    
    if (totalClasses > 0) {
      if (percentage >= 75) {
        const missable = Math.floor((attended - (0.75 * totalClasses)) / 0.75);
        status = 'safe';
        advice = missable > 0 
          ? `You have a healthy attendance record. You can safely miss up to ${missable} more classes while maintaining the required 75% standard.`
          : `You are exactly at standard. Avoid missing any upcoming lectures to stay safe!`;
      } else {
        const needed = Math.ceil(((0.75 * totalClasses) - attended) / 0.25);
        status = 'danger';
        advice = `Urgent Warning: Your attendance has dropped to ${percentage}%. You must attend the next ${needed} classes consecutively to recover back to the 75% standard.`;
      }
    }
    return { percentage, totalClasses, attended, advice, status };
  };

  const getSyllabusMetrics = () => {
    if (syllabusSubjects.length === 0) return { completion: 0, chapters: 0, assignments: 0 };
    let totalChapters = syllabusSubjects.length * 5;
    let totalAssignments = syllabusSubjects.length * 5;
    let chaptersDone = syllabusSubjects.reduce((acc, curr) => acc + (curr.chaptersDone || 0), 0);
    let assignmentsDone = syllabusSubjects.reduce((acc, curr) => acc + (curr.assignmentsDone || 0), 0);
    
    const overallProgress = Math.round(((chaptersDone + assignmentsDone) / (totalChapters + totalAssignments)) * 100) || 0;
    return { completion: overallProgress, chapters: `${chaptersDone}/${totalChapters}`, assignments: `${assignmentsDone}/${totalAssignments}` };
  };

  const attendanceMetrics = getAttendanceMetrics();
  const syllabusMetrics = getSyllabusMetrics();

  // Find lowest sessional subject marks
  const getPerformanceRiskSubject = () => {
    if (internalMarks.length === 0) return null;
    const sorted = [...internalMarks].sort((a, b) => {
      const scoreA = Math.min(a.st1 || 30, a.st2 || 30);
      const scoreB = Math.min(b.st1 || 30, b.st2 || 30);
      return scoreA - scoreB;
    });
    const weakest = sorted[0];
    if (weakest && (weakest.st1 < 18 || weakest.st2 < 18)) {
      return weakest;
    }
    return null;
  };
  const performanceRisk = getPerformanceRiskSubject();

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Grid with RAG Metrics Status Bar */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6 mb-4">
        <div>
          <h1 className="text-4xl font-extrabold font-display bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 flex items-center gap-3">
             <Brain className="text-indigo-400 animate-pulse" size={40} /> Academia07 Pro Advisor
          </h1>
          <p className="text-gray-400 mt-2 text-lg font-medium">An intelligent AI companion retrieving lecture notes, internal grades, sessional scores, and syllabus tracker telemetry.</p>
        </div>

        {/* Global RAG Source Connected Status Pill */}
        <div className="flex flex-wrap gap-2 items-center bg-white/[0.03] p-2.5 rounded-2xl border border-white/5 backdrop-blur-md">
          <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold px-2">RAG Context:</span>
          {Object.entries(selectedSources).map(([key, active]) => {
            const label = {
              lectureNotes: 'Lectures',
              attendance: 'Attendance',
              internalMarks: 'Sessional Grades',
              syllabusTracker: 'Syllabus',
              assignments: 'Assignments'
            }[key] || key;
            return (
              <span 
                key={key} 
                onClick={() => setSelectedSources(prev => ({ ...prev, [key]: !active }))}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-full border cursor-pointer select-none transition-all duration-300 flex items-center gap-1.5 ${
                  active 
                    ? "bg-indigo-500/10 text-indigo-300 border-indigo-500/20 shadow-[0_0_8px_rgba(99,102,241,0.2)]" 
                    : "bg-gray-800/40 text-gray-500 border-transparent hover:border-white/5"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-indigo-400 animate-ping' : 'bg-gray-600'}`}></span>
                {label}
              </span>
            );
          })}
        </div>
      </div>

      {/* Main Tab Controller */}
      <div className="flex border-b border-white/5 gap-2 shrink-0">
        <button 
          onClick={() => setActiveMainTab('rag')}
          className={`px-6 py-3.5 text-sm font-bold transition-all flex items-center gap-2 border-b-2 ${
            activeMainTab === 'rag' 
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' 
              : 'border-transparent text-gray-400 hover:text-white hover:bg-white/[0.02]'
          }`}
        >
          <Sparkles size={16} /> RAG Study Coach
        </button>
        <button 
          onClick={() => setActiveMainTab('audit')}
          className={`px-6 py-3.5 text-sm font-bold transition-all flex items-center gap-2 border-b-2 ${
            activeMainTab === 'audit' 
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' 
              : 'border-transparent text-gray-400 hover:text-white hover:bg-white/[0.02]'
          }`}
        >
          <Layers size={16} /> My Academic Audit (Telemetry)
        </button>
        <button 
          onClick={() => setActiveMainTab('solver')}
          className={`px-6 py-3.5 text-sm font-bold transition-all flex items-center gap-2 border-b-2 ${
            activeMainTab === 'solver' 
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' 
              : 'border-transparent text-gray-400 hover:text-white hover:bg-white/[0.02]'
          }`}
        >
          <PenTool size={16} /> Legacy Assignment Solver
        </button>
      </div>

      {/* TAB CONTENT 1: RAG Study Coach */}
      {activeMainTab === 'rag' && (
        <div className="grid lg:grid-cols-12 gap-8 animate-fade-in items-start">
          {/* Left Sidebar: Telemetry Highlights & Checkboxes */}
          <div className="lg:col-span-4 space-y-6">
            <GlassCard className="bg-[#0b0f1a] border-white/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-16 bg-indigo-500/10 blur-[50px] rounded-full pointer-events-none"></div>
              
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 border-b border-white/5 pb-2">
                <Layers className="text-indigo-400" size={18} /> Grounding Telemetry
              </h3>

              {loadingTelemetry ? (
                <div className="py-8 text-center text-gray-500 flex flex-col items-center gap-2">
                  <RefreshCw size={20} className="animate-spin text-indigo-400" />
                  <span className="text-xs font-mono">Syncing Firestore database...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Status Card: Attendance */}
                  <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl flex justify-between items-center">
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Attendance Strength</p>
                      <p className="text-lg font-bold font-display text-white mt-0.5">{attendanceMetrics.percentage}%</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      attendanceMetrics.status === 'safe' 
                        ? 'bg-green-500/10 text-green-400 border border-green-500/10' 
                        : 'bg-red-500/10 text-red-400 border border-red-500/10 animate-pulse'
                    }`}>
                      {attendanceMetrics.status === 'safe' ? 'Safe' : 'Attendance Risk'}
                    </span>
                  </div>

                  {/* Status Card: Sessional Marks */}
                  <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl flex justify-between items-center">
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Sessional Grades</p>
                      <p className="text-sm font-bold text-white mt-1">
                        {internalMarks.length > 0 
                          ? `${internalMarks.length} Subjects Logged` 
                          : 'No internal marks logged'}
                      </p>
                    </div>
                    {performanceRisk ? (
                      <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/10 font-bold px-2 py-0.5 rounded-full" title={`Weak ST scores in ${performanceRisk.subjectName}`}>
                        Grade Risk
                      </span>
                    ) : (
                      <span className="text-[10px] bg-green-500/10 text-green-400 border border-green-500/10 font-bold px-2 py-0.5 rounded-full">
                        Stable Grades
                      </span>
                    )}
                  </div>

                  {/* Status Card: Lecture Notes Repository */}
                  <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl flex justify-between items-center">
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Processed Lecture Bank</p>
                      <p className="text-sm font-bold text-white mt-0.5">{lectures.length} Audio Notes Saved</p>
                    </div>
                    <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/10 font-bold px-2 py-0.5 rounded-full">
                      Synced
                    </span>
                  </div>

                  {/* Status Card: Syllabus tracker */}
                  <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl flex justify-between items-center">
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Syllabus Completed</p>
                      <p className="text-lg font-bold font-display text-white mt-0.5">{syllabusMetrics.completion}%</p>
                    </div>
                    <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/10 font-bold px-2 py-0.5 rounded-full">
                      Curriculum Tracker
                    </span>
                  </div>
                </div>
              )}
            </GlassCard>

            {/* Smart Suggested Action Prompts */}
            <GlassCard className="bg-[#0b0f1a] border-white/5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Academic Diagnostics Suggestions</h4>
              <div className="space-y-2">
                <button 
                  onClick={() => handleSendQuery("Perform a complete academic diagnostic audit on my performance data. Detail my attendance risks and grade statuses across sessional papers.")}
                  className="w-full text-left p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 transition-all text-xs font-medium text-gray-300 flex items-center gap-2 group"
                >
                  <ShieldAlert size={14} className="text-amber-400 shrink-0" />
                  <span className="truncate flex-1 group-hover:text-white">Audit my academic risk levels</span>
                  <ChevronRight size={12} className="text-gray-500 group-hover:translate-x-1 transition-transform" />
                </button>
                
                <button 
                  onClick={() => handleSendQuery("Generate a hyper-personalized daily study schedule for this week. Pull units I haven't completed from my progress tracker, focus on weak sessional subjects, and incorporate action points from my lecture notes.")}
                  className="w-full text-left p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 transition-all text-xs font-medium text-gray-300 flex items-center gap-2 group"
                >
                  <CalendarClock size={14} className="text-blue-400 shrink-0" />
                  <span className="truncate flex-1 group-hover:text-white">Create a personalized weekly study schedule</span>
                  <ChevronRight size={12} className="text-gray-500 group-hover:translate-x-1 transition-transform" />
                </button>

                <button 
                  onClick={() => handleSendQuery("Analyze my upcoming assignments against my saved lecture notes. Summarize the major lecture concepts that will help me solve each assignment.")}
                  className="w-full text-left p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 transition-all text-xs font-medium text-gray-300 flex items-center gap-2 group"
                >
                  <ListTodo size={14} className="text-purple-400 shrink-0" />
                  <span className="truncate flex-1 group-hover:text-white">Relate lecture notes to my assignments</span>
                  <ChevronRight size={12} className="text-gray-500 group-hover:translate-x-1 transition-transform" />
                </button>

                <button 
                  onClick={() => handleSendQuery("Draft a comprehensive sessional exam preparation study guide for my weakest subject. Create mock exam questions and bullet-point answers based on key lecture summaries.")}
                  className="w-full text-left p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 transition-all text-xs font-medium text-gray-300 flex items-center gap-2 group"
                >
                  <Award size={14} className="text-emerald-400 shrink-0" />
                  <span className="truncate flex-1 group-hover:text-white">Create mock exam prep guide</span>
                  <ChevronRight size={12} className="text-gray-500 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </GlassCard>
          </div>

          {/* Right Area: Main Interactive Chat Console */}
          <div className="lg:col-span-8">
            <GlassCard className="bg-[#0b0f1c]/80 border-white/5 flex flex-col h-[650px] relative">
              
              {/* Chat Header */}
              <div className="flex justify-between items-center border-b border-white/5 pb-3 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Brain className="animate-bounce" size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm md:text-base">Personalized Study Coach (RAG Mode)</h3>
                    <p className="text-[10px] text-gray-400 mt-0.5">Custom answers synthesized from your active course records.</p>
                  </div>
                </div>
                
                {/* Active Source Badge indicator */}
                <span className="text-[9px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/25 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Gemini-3.5-Flash
                </span>
              </div>

              {/* Chat Messages Log */}
              <div className="flex-1 overflow-y-auto space-y-6 py-4 pr-1 scrollbar-thin my-2">
                {chatMessages.map((msg, idx) => (
                  <div 
                    key={idx} 
                    className={`flex items-start gap-3.5 max-w-[88%] ${
                      msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''
                    }`}
                  >
                    {/* User / AI Avatar */}
                    <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center font-bold text-xs ${
                      msg.role === 'user' 
                        ? 'bg-indigo-600 text-white shadow-[0_0_12px_rgba(79,70,229,0.4)]' 
                        : 'bg-white/5 text-indigo-400 border border-white/5'
                    }`}>
                      {msg.role === 'user' ? 'U' : 'AI'}
                    </div>

                    {/* Speech Bubble Container */}
                    <div className={`p-4 rounded-2xl relative shadow-lg ${
                      msg.role === 'user'
                        ? 'bg-indigo-600/15 border border-indigo-500/20 text-indigo-100 rounded-tr-none'
                        : 'bg-white/[0.02] border border-white/5 rounded-tl-none font-display text-gray-200'
                    }`}>
                      <div className="space-y-2">
                        {msg.role === 'user' ? msg.content : renderMarkdownText(msg.content)}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Loading typing state */}
                {chatLoading && (
                  <div className="flex items-center gap-3.5 pl-4 max-w-[50%]">
                    <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/5 shrink-0 flex items-center justify-center font-bold text-xs text-indigo-400">
                      AI
                    </div>
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl rounded-tl-none p-4 flex gap-1.5 items-center">
                      <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></span>
                      <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                      <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input form footer */}
              <div className="border-t border-white/5 pt-3 shrink-0 flex gap-2">
                <input 
                  type="text"
                  className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs md:text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-display"
                  placeholder="Ask about attendance safety, weak subjects, study blocks, or lectures..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendQuery()}
                  disabled={chatLoading}
                />
                <Button 
                  onClick={() => handleSendQuery()} 
                  disabled={chatLoading}
                  className="bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20"
                  icon={<Send size={16} />}
                >
                  Send
                </Button>
              </div>
            </GlassCard>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: Academic Audit Telemetry Bento View */}
      {activeMainTab === 'audit' && (
        <div className="space-y-8 animate-fade-in">
          {/* Header */}
          <div className="bg-white/[0.02] border border-white/5 p-6 rounded-3xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-32 bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none"></div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Layers className="text-indigo-400" size={24} /> Telemetry Audit Synthesis
            </h2>
            <p className="text-gray-400 text-sm mt-1">This read-only dashboard compiles and visualizes the database telemetry utilized by our RAG system to ground and personalize your AI study guide recommendations.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Bento Card 1: Attendance Roster */}
            <GlassCard className="relative overflow-hidden group">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Attendance Database</h3>
                <CalendarClock size={18} className="text-indigo-400" />
              </div>
              
              <div className="flex justify-between items-end mb-4">
                <div>
                  <p className="text-4xl font-extrabold font-display text-white">{attendanceMetrics.percentage}%</p>
                  <p className="text-xs text-gray-500 mt-1">{attendanceMetrics.attended} of {attendanceMetrics.totalClasses} lectures attended</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                    attendanceMetrics.status === 'safe' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                  }`}>
                    {attendanceMetrics.status === 'safe' ? 'Standard Safe' : 'Warning Level'}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-gray-800 rounded-full h-2.5 mb-4">
                <div 
                  className={`h-2.5 rounded-full transition-all duration-500 ${
                    attendanceMetrics.status === 'safe' ? 'bg-green-500 shadow-[0_0_8px_#10b981]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'
                  }`}
                  style={{ width: `${Math.min(100, attendanceMetrics.percentage)}%` }}
                ></div>
              </div>

              <div className="p-3.5 bg-white/[0.01] border border-white/5 rounded-xl">
                <p className="text-xs text-gray-300 leading-relaxed font-display">{attendanceMetrics.advice}</p>
              </div>
            </GlassCard>

            {/* Bento Card 2: Sessional Performance Audit */}
            <GlassCard className="relative overflow-hidden group">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Sessional Performance</h3>
                <Award size={18} className="text-indigo-400" />
              </div>

              {internalMarks.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  <p className="text-xs">No official internal/sessional marks records found.</p>
                  <p className="text-[10px] mt-1 text-indigo-300 hover:underline cursor-pointer" onClick={() => setActiveMainTab('solver')}>Log your grades in internal marks marksheet</p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {internalMarks.map((record, i) => {
                    const lowest = Math.min(record.st1 || 30, record.st2 || 30);
                    const isWeak = lowest < 18;
                    return (
                      <div key={i} className="flex justify-between items-center pb-2 border-b border-white/5 last:border-0 last:pb-0">
                        <div className="truncate flex-1 pr-2">
                          <p className="text-xs font-bold text-white truncate">{record.subjectName}</p>
                          <p className="text-[10px] text-gray-500 font-mono mt-0.5">{record.subjectCode} • Sessional Scores</p>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="flex gap-2 text-xs font-mono">
                            <span className={record.st1 < 18 ? 'text-red-400' : 'text-gray-300'}>ST1: {record.st1}/30</span>
                            <span className={record.st2 < 18 ? 'text-red-400' : 'text-gray-300'}>ST2: {record.st2}/30</span>
                          </div>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full inline-block mt-1 ${
                            isWeak ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'
                          }`}>
                            {isWeak ? 'Revision Required' : 'On Track'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </GlassCard>

            {/* Bento Card 3: Curriculum Syllabus Tracker */}
            <GlassCard className="relative overflow-hidden group">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Syllabus Completion</h3>
                <BookOpen size={18} className="text-indigo-400" />
              </div>

              <div className="flex justify-between items-end mb-4">
                <div>
                  <p className="text-4xl font-extrabold font-display text-white">{syllabusMetrics.completion}%</p>
                  <p className="text-xs text-gray-500 mt-1">Combined units & assignment progress</p>
                </div>
              </div>

              {/* Progress Tracker bar */}
              <div className="w-full bg-gray-800 rounded-full h-2.5 mb-4">
                <div 
                  className="h-2.5 rounded-full bg-purple-500 shadow-[0_0_8px_#a855f7] transition-all duration-500"
                  style={{ width: `${syllabusMetrics.completion}%` }}
                ></div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-2.5 bg-white/[0.01] border border-white/5 rounded-xl text-center">
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Units Solved</p>
                  <p className="text-sm font-bold text-white mt-1">{syllabusMetrics.chapters}</p>
                </div>
                <div className="p-2.5 bg-white/[0.01] border border-white/5 rounded-xl text-center">
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Assig. Solved</p>
                  <p className="text-sm font-bold text-white mt-1">{syllabusMetrics.assignments}</p>
                </div>
              </div>
            </GlassCard>

            {/* Bento Card 4: Recent Processed Lectures summaries */}
            <div className="md:col-span-2 GlassCard p-6 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Lecture Summary Matrix</h3>
                <Brain size={18} className="text-indigo-400" />
              </div>

              {lectures.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  <p className="text-xs">No processed lectures found in your vault.</p>
                  <p className="text-[10px] text-indigo-300 mt-1">Upload lecture audio files or paste transcripts in the Lecture Processor tab to register them.</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-1">
                  {lectures.map((lec, i) => (
                    <div key={i} className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl flex flex-col justify-between hover:border-white/10 transition-colors">
                      <div>
                        <span className="text-[9px] font-bold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          {lec.subject || 'Lecture'}
                        </span>
                        <h4 className="text-sm font-bold text-white mt-2 leading-tight">{lec.title}</h4>
                        <p className="text-xs text-gray-400 mt-1.5 line-clamp-2 leading-relaxed font-display">{lec.processedData?.summary || 'No summary generated yet.'}</p>
                      </div>
                      
                      {lec.processedData?.actionItems && (
                        <div className="mt-3 pt-3 border-t border-white/5">
                          <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Action Points</p>
                          <p className="text-xs text-indigo-300 truncate mt-1">⚙️ {lec.processedData.actionItems.join(', ')}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bento Card 5: Upcoming assignments list */}
            <GlassCard className="relative overflow-hidden group">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Assignments Due</h3>
                <CalendarClock size={18} className="text-indigo-400" />
              </div>

              {assignments.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  <p className="text-xs">No pending assignments uploaded for this semester.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {assignments.map((a, i) => (
                    <div key={i} className="p-3 bg-white/[0.01] border border-white/5 rounded-xl hover:border-indigo-500/20 transition-all">
                      <div className="flex justify-between items-start">
                        <h4 className="text-xs font-bold text-white truncate max-w-[150px]">{a.title}</h4>
                        <span className="text-[9px] bg-red-500/10 text-red-400 font-bold px-1.5 py-0.5 rounded-full">
                          {a.dueDate}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400 font-mono mt-1">{a.subjectName} • Sem {a.semester}</p>
                      <p className="text-[11px] text-gray-500 mt-1 line-clamp-1 leading-normal font-display">{a.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>

          </div>
        </div>
      )}

      {/* TAB CONTENT 3: Legacy Assignment Solver */}
      {activeMainTab === 'solver' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-end gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                 <PenTool className="text-blue-400" size={24} /> AI Assignment Handwriting PDF Generator
              </h2>
              <p className="text-gray-400 mt-2 text-sm">Paste study JSON parameters to render handwriting documents.</p>
            </div>
            
            {/* Step Indicator */}
            <div className="hidden md:flex gap-4 items-center bg-white/5 px-6 py-3 rounded-full border border-white/5">
               <div className={`flex items-center gap-2 ${activeSolverTab === 'input' ? 'text-blue-400' : 'text-gray-500'}`}>
                  <div className="w-6 h-6 rounded-full border border-current flex items-center justify-center text-xs font-bold">1</div>
                  <span className="font-medium">External Gemini</span>
               </div>
               <ChevronRight size={16} className="text-gray-600" />
               <div className={`flex items-center gap-2 ${activeSolverTab === 'preview' ? 'text-blue-400' : 'text-gray-500'}`}>
                  <div className="w-6 h-6 rounded-full border border-current flex items-center justify-center text-xs font-bold">2</div>
                  <span className="font-medium">PDF Render</span>
               </div>
            </div>
          </div>

          {activeSolverTab === 'input' && (
            <div className="grid lg:grid-cols-2 gap-8 animate-fade-in">
               {/* Step 1: Prompt */}
               <GlassCard className="h-full bg-gradient-to-br from-purple-900/10 to-blue-900/10 border-blue-500/20 shadow-lg shadow-blue-500/5 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-32 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none"></div>
                  
                  <div className="flex items-center gap-3 mb-6 relative z-10">
                     <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                        <ExternalLink size={24} />
                     </div>
                     <div>
                        <h2 className="text-2xl font-bold font-display">Step 1: External Generation</h2>
                        <p className="text-xs text-blue-300 uppercase tracking-widest font-semibold mt-1">Via Google Gemini</p>
                     </div>
                  </div>

                  <div className="space-y-4 relative z-10">
                      <div className="flex items-start gap-3 text-sm text-gray-300">
                        <span className="bg-blue-500/20 text-blue-300 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold shrink-0">1</span>
                        <p>Copy the System Prompt below.</p>
                      </div>
                      <div className="flex items-start gap-3 text-sm text-gray-300">
                        <span className="bg-blue-500/20 text-blue-300 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold shrink-0">2</span>
                        <p>Open <a href="https://gemini.google.com/" target="_blank" className="text-blue-400 hover:underline">Google Gemini</a>.</p>
                      </div>
                      <div className="flex items-start gap-3 text-sm text-gray-300">
                        <span className="bg-blue-500/20 text-blue-300 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold shrink-0">3</span>
                        <p>Paste the prompt + your assignment questions/notes.</p>
                      </div>
                  </div>
                  
                  <div className="bg-black/40 rounded-xl p-4 border border-white/10 mt-6 relative group/code transition-all hover:border-blue-500/30">
                     <div className="absolute top-0 right-0 bg-blue-500/10 text-blue-300 text-[10px] px-2 py-1 rounded-bl-lg border-b border-l border-white/5 font-mono">
                        SYSTEM PROMPT
                     </div>
                     <pre className="text-xs text-gray-400 whitespace-pre-wrap font-mono h-40 overflow-y-auto custom-scrollbar pt-4">
                        {SYSTEM_PROMPT}
                     </pre>
                     <button 
                       onClick={copyPrompt}
                       className="absolute bottom-4 right-4 p-2 bg-blue-600 text-white rounded-lg opacity-0 group-hover/code:opacity-100 transition-all hover:bg-blue-500 shadow-lg hover:scale-105 flex items-center gap-2 text-xs font-bold px-4"
                     >
                        {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied!' : 'Copy Code'}
                     </button>
                  </div>
                  
                  <div className="mt-6 flex gap-3">
                     <a 
                       href="https://gemini.google.com/" 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="flex-1 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-center text-sm font-bold transition-all border border-white/10 hover:border-white/20 flex items-center justify-center gap-2 group/btn"
                     >
                       Open Gemini <ExternalLink size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                     </a>
                     <button 
                        onClick={copyPrompt}
                        className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-center text-sm font-bold transition-all text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 flex items-center justify-center gap-2"
                     >
                        {copied ? <Check size={18} /> : <Copy size={18} />} {copied ? 'Prompt Copied!' : 'Copy System Prompt'}
                     </button>
                  </div>
               </GlassCard>

               {/* Step 2: Input */}
               <GlassCard className="h-full flex flex-col relative overflow-hidden">
                   <div className="absolute bottom-0 left-0 p-32 bg-green-500/5 blur-[80px] rounded-full pointer-events-none"></div>

                  <div className="flex items-center gap-3 mb-6 relative z-10">
                     <div className="p-3 bg-green-500/20 rounded-xl text-green-400 border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.2)]">
                        <FileText size={24} />
                     </div>
                     <div>
                        <h2 className="text-2xl font-bold font-display">Step 2: JSON Input</h2>
                        <p className="text-xs text-green-300 uppercase tracking-widest font-semibold mt-1">Paste Result Here</p>
                     </div>
                  </div>
                  
                  <div className="relative z-10 flex-1 flex flex-col">
                      <p className="text-gray-400 text-sm mb-3">
                         Paste the JSON code block generated by Gemini.
                      </p>

                      <textarea 
                         className="flex-1 w-full bg-black/30 border border-white/10 rounded-xl p-4 text-sm font-mono text-gray-300 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 focus:outline-none min-h-[200px] resize-none transition-all placeholder-gray-600"
                         placeholder='{ "questions": [ ... ] }'
                         value={jsonInput}
                         onChange={(e) => setJsonInput(e.target.value)}
                      />
                      
                      <div className="mt-6 flex justify-end">
                         <Button 
                            onClick={processManualJson} 
                            className="w-full md:w-auto bg-green-600 hover:bg-green-500 shadow-green-500/20 border-green-500/20" 
                            icon={<PenTool size={18} />}
                         >
                            Generate Handwriting
                         </Button>
                      </div>
                  </div>
               </GlassCard>
            </div>
          )}

          {activeSolverTab === 'preview' && resultData && (
            <div className="animate-fade-in flex flex-col items-center">
               <div className="w-full flex justify-between items-center mb-6 bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-sm sticky top-24 z-20 shadow-xl">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 border border-green-500/30">
                        <PenTool size={20} />
                     </div>
                     <div>
                        <h3 className="font-bold">Preview Ready</h3>
                        <p className="text-xs text-gray-400">{resultData.questions.length} Questions Processed</p>
                     </div>
                  </div>
                  <div className="flex gap-3">
                     <Button variant="outline" onClick={() => setActiveSolverTab('input')}>
                        ← Back
                     </Button>
                     <Button variant="secondary" onClick={downloadPDF} disabled={solverLoading} icon={<Download />}>
                        {solverLoading ? 'Converting...' : 'Download PDF'}
                     </Button>
                  </div>
               </div>

               {/* Paper Preview Container */}
               <div className="overflow-auto w-full flex justify-center bg-[#1a1f2e] p-4 md:p-12 rounded-xl border border-white/5 shadow-inner">
                  <div 
                     ref={previewRef}
                     className="bg-white text-blue-900 font-handwriting text-xl leading-relaxed relative shadow-[0_0_50px_rgba(0,0,0,0.3)] transform transition-transform"
                     style={{
                        width: '210mm',
                        minHeight: '297mm',
                        padding: '20mm',
                        backgroundImage: 'repeating-linear-gradient(transparent, transparent 29px, #a3c2e0 30px)',
                        backgroundAttachment: 'local',
                        lineHeight: '30px'
                     }}
                  >
                     {/* Red Margin Line */}
                     <div className="absolute top-0 left-[20mm] bottom-0 w-px bg-red-300/50 h-full"></div>

                     {/* Content */}
                     <div className="relative z-10 font-sans">
                        <div className="flex justify-between items-start mb-8 text-base text-gray-500 font-sans">
                           <span className="uppercase tracking-widest text-xs font-sans">Assignment Solution</span>
                           <span className="font-sans">Date: {new Date().toLocaleDateString()}</span>
                        </div>
                        
                        {resultData.questions.map((q, idx) => (
                           <div key={idx} className="mb-10 break-inside-avoid relative group font-sans">
                              <div className="font-bold text-black mb-3 flex gap-3 leading-snug font-sans">
                                 <span className="min-w-[24px]">Q{q.number}.</span>
                                 <span>{q.question}</span>
                              </div>
                              <div className="text-blue-900/90 pl-9 whitespace-pre-wrap font-semibold font-sans">
                                 {q.answer}
                              </div>
                           </div>
                        ))}
                        
                        <div className="mt-16 text-center font-sans">
                           <div className="inline-block px-4 py-1 border-t border-b border-gray-300 text-gray-400 text-xs uppercase tracking-[0.3em] font-sans">
                              End of Document
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AITutor;
