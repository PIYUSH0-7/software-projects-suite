import React, { useState, useEffect, useRef } from "react";
import { GlassCard, Button, Input } from "../components/UI";
import { 
  Mic, MicOff, Play, Square, FileAudio, FileText, BrainCircuit, 
  CheckSquare, Sparkles, Plus, Trash2, Download, Save, BookOpen, 
  Award, MessageSquare, Clock, ArrowRight, ChevronRight, ChevronDown, 
  Copy, RotateCcw, HelpCircle, GitMerge, User, Calendar, ChevronLeft, 
  Lightbulb, FileCode, Check, Send, AlertTriangle
} from "lucide-react";
import { db, auth } from "../services/auth";
import { onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, getDocs, query, where, orderBy, doc, deleteDoc, Timestamp } from "firebase/firestore";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

// Define structured lecture interfaces
interface LectureSection {
  title: string;
  content: string;
  bulletPoints: string[];
}

interface MindmapNode {
  topic: string;
  subtopics: string[];
}

interface Flashcard {
  front: string;
  back: string;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

interface ProcessedLectureData {
  cleanTranscript: string;
  summary: string;
  sections: LectureSection[];
  mindmap: MindmapNode[];
  flashcards: Flashcard[];
  quiz: QuizQuestion[];
  actionItems: string[];
}

interface LectureDocument {
  id?: string;
  userId: string;
  title: string;
  subject: string;
  style: string;
  date: any;
  originalTranscript: string;
  processedData: ProcessedLectureData;
}

const SAMPLE_LECTURES = [
  {
    title: "Thermodynamics & Heat Transfer",
    subject: "Mechanical Engineering",
    style: "comprehensive",
    transcript: `Um, so today guys, uh, we are going to, let's say, talk about, um, thermodynamics, and particularly, uh, Carnot's engine... which is like, the absolute theoretical limit of thermodynamic efficiency, you know? So, Carnot cycle... uh, it consists of four reversible processes. First, we have, uh, isothermal expansion at a high temperature, let's call it Th. Isothermal expansion means, um, temperature remains constant, right? During this, heat Qh is absorbed from the hot reservoir. Then, second, we have adiabatic expansion. Adiabatic means no heat exchange, so Q is zero. The gas expands and cools down to a lower temperature, say, Tc. Third, uh, isothermal compression. This is at the low temperature Tc, and heat Qc is rejected to the cold sink. And finally, the fourth process is adiabatic compression, where the system is compressed back to its original state, warming back up to Th.
And, um, if we talk about efficiency, the formula is like, eta equals 1 minus Tc over Th. Remember, guys, temperatures MUST be in Kelvin! Always Kelvin, don't use Celsius or you'll fail the sessional exams! Uh, sessional question alert: why can't we achieve 100% efficiency? Well, because to get eta equals 1, Tc would have to be absolute zero (0 Kelvin), which violates the third law of thermodynamics, or Th would have to be infinity, which is, well, physically impossible. So, yeah, that's the Carnot engine in a nutshell. Make sure you memorize this derivation for sessional test-1 next week.`
  },
  {
    title: "Introduction to Artificial Neural Networks",
    subject: "Computer Science",
    style: "formulas",
    transcript: `Okay, uh, let's start today's lecture on, um, neural networks, or ANNs. Basically, uh, we are trying to mimic how the human brain works, or at least a very simplified model of it. So, at the core, we have this thing called a Perceptron. It was invented by, uh, Frank Rosenblatt in, what, 1958? A perceptron takes multiple binary inputs, x1, x2, x3, and then it multiplies them by weights, w1, w2, w3. And we sum them up, right? So we get a weighted sum: sum of wi times xi. Plus, we add this bias term, b.
And then, we pass this weighted sum through an activation function. The activation function decides if the neuron fires or not. For the original perceptron, it was a step function. But nowadays, we use things like ReLU, which is Rectified Linear Unit, or Sigmoid. Sigmoid is f of z equals 1 divided by 1 plus e to the negative z. It squeezes the output between 0 and 1. Which is super useful for probability, you know?
But wait, how does it learn? Ah, backpropagation! It's like, the backbone of deep learning. We calculate the error, or loss, using a loss function, like Mean Squared Error. Then we propagate this error backward through the network using the chain rule from calculus to calculate the gradient of the loss with respect to each weight. And then we update the weights using Gradient Descent: w equals w minus alpha times the gradient, where alpha is the learning rate. If alpha is too high, the model overshoots. If it's too low, it takes forever to converge. This is a very popular 10-mark question in university exams, so write this down!`
  }
];

const LOADING_MESSAGES = [
  "Filtering out ambient room noise and speech stutters...",
  "Running NLP models to segment key engineering concepts...",
  "Analyzing formulas, equations, and derivation steps...",
  "Synthesizing visual mind map nodes and hierarchal structures...",
  "Drafting sessional mock quiz questions and detailed solutions...",
  "Formatting study flashcards and executive lecture summaries...",
  "Aligning learning style with your specified academic needs..."
];

const LectureProcessor = () => {
  // Navigation & View States
  const [activeTab, setActiveTab] = useState<"library" | "process" | "workspace">("library");
  const [workspaceSubTab, setWorkspaceSubTab] = useState<"overview" | "notes" | "mindmap" | "flashcards" | "quiz" | "chat">("overview");

  // Core Data Lists
  const [savedLectures, setSavedLectures] = useState<LectureDocument[]>([]);
  const [loadingLectures, setLoadingLectures] = useState(false);

  // New Lecture Input State
  const [lectureTitle, setLectureTitle] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [learningStyle, setLearningStyle] = useState<"comprehensive" | "simplified" | "formulas" | "exam-prep">("comprehensive");
  const [rawTranscript, setRawTranscript] = useState("");

  // Speech Recognition States
  const [isRecording, setIsRecording] = useState(false);
  const [recognitionInstance, setRecognitionInstance] = useState<any>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // AI Processing State
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [processingError, setProcessingError] = useState("");

  // Active Selected Workspace Lecture
  const [selectedLecture, setSelectedLecture] = useState<LectureDocument | null>(null);

  // Sub-widgets State
  // Flashcard Flip State
  const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});
  const [activeCardIdx, setActiveCardIdx] = useState(0);

  // Quiz States
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  // Interactive Lecture Chat States
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Transcript view mode: original vs clean
  const [transcriptViewMode, setTranscriptViewMode] = useState<"clean" | "original">("clean");

  // Load Saved Lectures from Firebase Firestore on Mount and Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchSavedLectures(user);
      } else {
        setSavedLectures([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchSavedLectures = async (user = auth.currentUser) => {
    if (!user) return;
    setLoadingLectures(true);
    try {
      const q = query(
        collection(db, "lectures"),
        where("userId", "==", user.uid)
      );
      const snapshot = await getDocs(q);
      const list: LectureDocument[] = [];
      snapshot.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as LectureDocument);
      });
      // Sort locally descending by date safely
      const getSeconds = (d: any) => {
        if (!d) return 0;
        if (typeof d.seconds === 'number') return d.seconds;
        if (typeof d === 'string') return new Date(d).getTime() / 1000;
        if (typeof d.toDate === 'function') return d.toDate().getTime() / 1000;
        return 0;
      };
      list.sort((a, b) => getSeconds(b.date) - getSeconds(a.date));
      setSavedLectures(list);
    } catch (err) {
      console.error("Error loading lectures from Firestore:", err);
    } finally {
      setLoadingLectures(false);
    }
  };

  const formatLectureDate = (dateVal: any): string => {
    if (!dateVal) return new Date().toLocaleDateString();
    if (typeof dateVal.seconds === 'number') {
      return new Date(dateVal.seconds * 1000).toLocaleDateString();
    }
    if (typeof dateVal.toDate === 'function') {
      return dateVal.toDate().toLocaleDateString();
    }
    const parsed = new Date(dateVal);
    if (!isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString();
    }
    return new Date().toLocaleDateString();
  };

  // Cycle Loading Messages
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isProcessing) {
      interval = setInterval(() => {
        setLoadingMsgIdx((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [isProcessing]);

  // Handle Recording Timer
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setRecordingDuration(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  // Scroll Chat to Bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatLoading]);

  // Initialize Speech Recognition API
  const startRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please try Chrome, Edge, or Safari, or paste your transcript manually.");
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";

    let finalTranscript = rawTranscript;

    rec.onstart = () => {
      setIsRecording(true);
      setProcessingError("");
    };

    rec.onresult = (event: any) => {
      let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + " ";
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      setRawTranscript(finalTranscript + interimTranscript);
    };

    rec.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsRecording(false);
      rec.stop();
    };

    rec.onend = () => {
      setIsRecording(false);
    };

    rec.start();
    setRecognitionInstance(rec);
  };

  const stopRecording = () => {
    if (recognitionInstance) {
      recognitionInstance.stop();
    }
    setIsRecording(false);
  };

  // Select a pre-loaded sample
  const loadSampleLecture = (sampleIdx: number) => {
    const sample = SAMPLE_LECTURES[sampleIdx];
    setLectureTitle(sample.title);
    setSubjectName(sample.subject);
    setLearningStyle(sample.style as any);
    setRawTranscript(sample.transcript);
  };

  // Call Express API to process Lecture transcript with Gemini
  const handleAIProcess = async () => {
    if (!lectureTitle.trim()) {
      alert("Please specify a Lecture Title.");
      return;
    }
    if (!rawTranscript.trim()) {
      alert("Please provide some lecture recording transcript or paste notes.");
      return;
    }

    setIsProcessing(true);
    setProcessingError("");
    setLoadingMsgIdx(0);

    try {
      const response = await fetch("/api/lecture/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: rawTranscript,
          title: lectureTitle,
          subject: subjectName || "General Engineering",
          style: learningStyle
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Server processing failed.");
      }

      const result = await response.json();
      if (!result.success || !result.processedData) {
        throw new Error("Invalid output received from AI processor.");
      }

      // Save to Firebase Firestore
      const newDoc: LectureDocument = {
        userId: auth.currentUser?.uid || "anonymous",
        title: lectureTitle,
        subject: subjectName || "General Engineering",
        style: learningStyle,
        date: Timestamp.now(),
        originalTranscript: rawTranscript,
        processedData: result.processedData
      };

      const docRef = await addDoc(collection(db, "lectures"), newDoc);
      newDoc.id = docRef.id;

      // Refresh list
      setSavedLectures((prev) => [newDoc, ...prev]);

      // Open in Workspace
      setSelectedLecture(newDoc);
      // Reset quiz and flashcards state
      setFlippedCards({});
      setActiveCardIdx(0);
      setSelectedAnswers({});
      setQuizSubmitted(false);
      setQuizScore(0);
      // Initialize chat with default message
      setChatMessages([
        {
          role: "assistant",
          content: `Hi scholar! I have carefully digested your lecture: **"${lectureTitle}"**. I cleaned up the stutters, designed an interactive mind map, extracted tailored study guides, and prepared exam-prep quiz questions based on the content.\n\nAsk me anything! For example, "Can you explain Carnot's equation in detail?" or "What are some potential exam questions?"`
        }
      ]);
      setActiveTab("workspace");
      setWorkspaceSubTab("overview");

      // Reset input fields
      setLectureTitle("");
      setSubjectName("");
      setRawTranscript("");

    } catch (err: any) {
      console.error(err);
      setProcessingError(err.message || "An unexpected error occurred during processing. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Interactive Lecture Chat call
  const handleSendChatMessage = async () => {
    if (!chatInput.trim() || !selectedLecture) return;

    const userMsg = chatInput.trim();
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setChatLoading(true);

    try {
      const promptHistory = chatMessages.map((m) => ({
        role: m.role,
        content: m.content
      }));

      // We send both history, active user question, and the lecture context
      const response = await fetch("/api/lecture/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: selectedLecture.processedData.cleanTranscript,
          messages: [...promptHistory, { role: "user", content: userMsg }]
        })
      });

      if (!response.ok) {
        throw new Error("Chat assistant failed to respond.");
      }

      const result = await response.json();
      if (result.success && result.reply) {
        setChatMessages((prev) => [...prev, { role: "assistant", content: result.reply }]);
      } else {
        throw new Error("Could not formulate a response.");
      }
    } catch (err: any) {
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: `⚠️ Error: ${err.message || "Could not reach the AI Tutor server."}` }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // Delete Lecture
  const handleDeleteLecture = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this processed lecture document?")) return;
    try {
      await deleteDoc(doc(db, "lectures", id));
      setSavedLectures((prev) => prev.filter((l) => l.id !== id));
      if (selectedLecture?.id === id) {
        setSelectedLecture(null);
        setActiveTab("library");
      }
    } catch (err) {
      console.error("Error deleting lecture:", err);
      alert("Failed to delete the lecture. Please check Firebase permissions.");
    }
  };

  // Export Notes PDF
  const downloadNotesPDF = async () => {
    const element = document.getElementById("study-notes-pdf-area");
    if (!element) return;
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: "#0d131f",
        useCORS: true
      });
      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgProps = pdf.getImageProperties(imgData);
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;
      }
      pdf.save(`${selectedLecture?.title.replace(/\s+/g, "_") || "lecture"}_study_notes.pdf`);
    } catch (e) {
      console.error(e);
      alert("Failed to generate PDF. Make sure your browser supports standard download operations.");
    }
  };

  // Helper formatting for seconds to MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Handle Quiz selection
  const handleSelectQuizAnswer = (qIdx: number, oIdx: number) => {
    if (quizSubmitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [qIdx]: oIdx }));
  };

  const submitQuiz = () => {
    if (!selectedLecture) return;
    let score = 0;
    selectedLecture.processedData.quiz.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctAnswerIndex) {
        score++;
      }
    });
    setQuizScore(score);
    setQuizSubmitted(true);
  };

  const resetQuiz = () => {
    setSelectedAnswers({});
    setQuizSubmitted(false);
    setQuizScore(0);
  };

  // Render visual mind map tree recursively or in nested structured blocks
  const renderVisualMindMap = (nodes: MindmapNode[]) => {
    return (
      <div className="flex flex-col gap-6 relative p-4 max-w-4xl mx-auto">
        {nodes.map((node, index) => (
          <div key={index} className="flex flex-col md:flex-row items-stretch gap-4 relative animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
            {/* Main Central Branch Node */}
            <div className="flex items-center">
              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold px-5 py-4 rounded-2xl shadow-[0_0_20px_rgba(59,130,246,0.3)] border border-blue-400/30 flex items-center gap-3 relative z-10 w-full md:w-64 min-h-[70px]">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-mono text-sm">{index + 1}</div>
                <span className="font-display tracking-tight text-sm md:text-base">{node.topic}</span>
              </div>
              <div className="hidden md:block w-8 h-[2px] bg-blue-500/30 relative">
                <div className="absolute top-1/2 right-0 -translate-y-1/2 w-2 h-2 rounded-full bg-cyan-400"></div>
              </div>
            </div>

            {/* Sub-branches Node Grid */}
            <div className="flex-1 flex flex-col justify-center gap-2 pl-6 md:pl-0 border-l md:border-l-0 border-blue-500/20 relative py-2">
              <div className="absolute left-0 top-0 bottom-0 md:hidden w-[2px] bg-gradient-to-b from-blue-500 to-transparent"></div>
              {node.subtopics.map((sub, sIdx) => (
                <div key={sIdx} className="flex items-center gap-2">
                  <div className="hidden md:block w-4 h-[2px] bg-blue-500/10"></div>
                  <div className="bg-[#151D2A] hover:bg-[#1A2536] border border-white/5 hover:border-blue-500/20 px-4 py-2.5 rounded-xl text-gray-300 hover:text-white transition-all text-sm w-full flex items-center gap-2 group cursor-default">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 group-hover:scale-150 transition-all"></span>
                    <span>{sub}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Panel */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4 mb-2">
        <div>
          <span className="text-xs font-semibold text-blue-400 uppercase tracking-widest bg-blue-500/10 px-3 py-1.5 rounded-full border border-blue-500/20 inline-flex items-center gap-1.5">
            <Sparkles size={12} className="animate-pulse" /> Student Personalized Module
          </span>
          <h1 className="text-4xl font-bold font-display bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 mt-2 flex items-center gap-3">
            <BrainCircuit className="text-blue-400" size={38} /> Lecture AI Processor
          </h1>
          <p className="text-gray-400 mt-2 max-w-2xl">
            Transcribe raw teacher voice recordings dynamically. Auto-extract cleaned transcripts, bento summaries, flashcards, visual concept maps, sessional MCQ sheets, and study plan checklists customized exactly how you learn.
          </p>
        </div>

        {/* Global Nav */}
        <div className="flex gap-2">
          <Button 
            variant={activeTab === "library" ? "glow" : "outline"}
            onClick={() => {
              setActiveTab("library");
              setSelectedLecture(null);
            }}
            icon={<BookOpen size={16} />}
          >
            Study Library
          </Button>
          <Button 
            variant={activeTab === "process" ? "secondary" : "outline"}
            onClick={() => setActiveTab("process")}
            icon={<Mic size={16} />}
          >
            New Lecture
          </Button>
        </div>
      </div>

      {/* --- Tab 1: Library View --- */}
      {activeTab === "library" && (
        <div className="space-y-6 animate-fade-in">
          {loadingLectures ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
              <p className="text-gray-400 mt-4 font-display">Loading academic library archive...</p>
            </div>
          ) : savedLectures.length === 0 ? (
            <GlassCard className="text-center py-16 max-w-3xl mx-auto">
              <div className="p-4 bg-blue-500/10 text-blue-400 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <FileAudio size={32} />
              </div>
              <h2 className="text-2xl font-bold">No lectures processed yet</h2>
              <p className="text-gray-400 mt-2 max-w-md mx-auto">
                Begin your exam-prep journey by recording a lecture, importing an audio script, or testing with one of our ready-to-use sample engineering lectures.
              </p>
              <Button variant="secondary" className="mt-6 mx-auto" onClick={() => setActiveTab("process")} icon={<Mic size={18} />}>
                Record Your First Lecture
              </Button>
            </GlassCard>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedLectures.map((lecture) => (
                <GlassCard 
                  key={lecture.id}
                  hoverEffect
                  className="cursor-pointer bg-gradient-to-br from-white/5 to-white/[0.01] border-white/10 hover:border-blue-500/30 flex flex-col justify-between h-[230px]"
                  onClick={() => {
                    setSelectedLecture(lecture);
                    // Reset Sub states
                    setFlippedCards({});
                    setActiveCardIdx(0);
                    setSelectedAnswers({});
                    setQuizSubmitted(false);
                    setQuizScore(0);
                    setChatMessages([
                      {
                        role: "assistant",
                        content: `Hi scholar! I am ready to study this lecture: **"${lecture.title}"**. Cleaned notes, study guides, and MCQ cards are fully computed. What specific equations or concept questions should we tackle?`
                      }
                    ]);
                    setActiveTab("workspace");
                    setWorkspaceSubTab("overview");
                  }}
                >
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-xs px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-300 font-semibold border border-blue-500/20">
                        {lecture.subject}
                      </span>
                      <button 
                        onClick={(e) => handleDeleteLecture(lecture.id!, e)}
                        className="text-gray-500 hover:text-red-400 p-1 hover:bg-white/5 rounded-lg transition-colors"
                        title="Delete Lecture"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <h3 className="text-xl font-bold font-display tracking-tight text-white mt-4 line-clamp-2">
                      {lecture.title}
                    </h3>
                  </div>

                  <div className="border-t border-white/5 pt-3 flex items-center justify-between text-xs text-gray-500 mt-4">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {lecture.style === "comprehensive" && "Comprehensive"}
                      {lecture.style === "simplified" && "ELI5 Simplified"}
                      {lecture.style === "formulas" && "Formulas Core"}
                      {lecture.style === "exam-prep" && "Exam-Prep Focus"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {formatLectureDate(lecture.date)}
                    </span>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- Tab 2: Capture / Process Lecture Tab --- */}
      {activeTab === "process" && (
        <div className="grid lg:grid-cols-12 gap-8 animate-fade-in relative">
          
          {/* Processing Overlay Screen */}
          {isProcessing && (
            <div className="absolute inset-0 bg-[#070b13]/95 backdrop-blur-md rounded-2xl z-50 flex flex-col items-center justify-center text-center p-6 min-h-[500px]">
              <div className="relative mb-8">
                {/* Core pulse glow */}
                <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 animate-pulse absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 blur-xl opacity-60"></div>
                <div className="w-20 h-20 rounded-full border-4 border-cyan-400/10 border-t-cyan-400 animate-spin flex items-center justify-center relative">
                  <BrainCircuit className="text-cyan-400 animate-bounce" size={32} />
                </div>
              </div>
              <h3 className="text-2xl font-bold font-display tracking-tight text-white mb-2">
                Analyzing Lecture Content
              </h3>
              <p className="text-blue-400 text-lg max-w-md h-8 transition-all font-medium">
                {LOADING_MESSAGES[loadingMsgIdx]}
              </p>
              <div className="w-64 h-1 bg-white/10 rounded-full overflow-hidden mt-6">
                <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full animate-[shimmer_2s_infinite]" style={{ width: "80%" }}></div>
              </div>
              <p className="text-xs text-gray-500 mt-4">
                This process usually takes 5-15 seconds. Please do not close or navigate away.
              </p>
            </div>
          )}

          {/* Left Inputs Config column */}
          <div className="lg:col-span-5 space-y-6">
            <GlassCard className="bg-[#0c1220]/75 border-white/5 shadow-inner">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
                <Lightbulb className="text-yellow-400" size={18} /> Lecture Context
              </h2>
              
              <div className="space-y-4">
                <Input 
                  label="Lecture Title"
                  placeholder="e.g. Carnot Cycle & Heat Efficiency"
                  value={lectureTitle}
                  onChange={(e) => setLectureTitle(e.target.value)}
                />

                <Input 
                  label="Subject / Department"
                  placeholder="e.g. Thermodynamics ME-302"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                />

                {/* Custom Notes Styles for Personal Student Needs */}
                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-gray-400 mb-2">
                    Personalized Notes Style
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setLearningStyle("comprehensive")}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        learningStyle === "comprehensive" 
                          ? "bg-blue-500/10 border-blue-500/50 text-blue-300" 
                          : "bg-[#0a0f19] border-white/5 text-gray-400 hover:border-white/10"
                      }`}
                    >
                      <h4 className="text-sm font-bold flex items-center gap-1.5">
                        <FileText size={14} /> Comprehensive
                      </h4>
                      <p className="text-[10px] text-gray-500 mt-1">Full detailed paragraphs, examples, bullet grids</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setLearningStyle("simplified")}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        learningStyle === "simplified" 
                          ? "bg-purple-500/10 border-purple-500/50 text-purple-300" 
                          : "bg-[#0a0f19] border-white/5 text-gray-400 hover:border-white/10"
                      }`}
                    >
                      <h4 className="text-sm font-bold flex items-center gap-1.5">
                        <Award size={14} /> ELI5 Simplified
                      </h4>
                      <p className="text-[10px] text-gray-500 mt-1">Simple language, helpful analogies, brief briefs</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setLearningStyle("formulas")}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        learningStyle === "formulas" 
                          ? "bg-cyan-500/10 border-cyan-500/50 text-cyan-300" 
                          : "bg-[#0a0f19] border-white/5 text-gray-400 hover:border-white/10"
                      }`}
                    >
                      <h4 className="text-sm font-bold flex items-center gap-1.5">
                        <FileCode size={14} /> Formula-Core
                      </h4>
                      <p className="text-[10px] text-gray-500 mt-1">Emphasis on equations, maths, code syntax blocks</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setLearningStyle("exam-prep")}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        learningStyle === "exam-prep" 
                          ? "bg-amber-500/10 border-amber-500/50 text-amber-300" 
                          : "bg-[#0a0f19] border-white/5 text-gray-400 hover:border-white/10"
                      }`}
                    >
                      <h4 className="text-sm font-bold flex items-center gap-1.5">
                        <CheckSquare size={14} /> Exam-Prep Focus
                      </h4>
                      <p className="text-[10px] text-gray-500 mt-1">Target potential sessional MCQs, tips, marks criteria</p>
                    </button>
                  </div>
                </div>

                {/* Pre-populated Demo Lectures */}
                <div className="pt-2">
                  <label className="block text-xs uppercase tracking-wider font-semibold text-gray-400 mb-2">
                    Test Immediately with Samples
                  </label>
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => loadSampleLecture(0)}
                      className="text-left text-xs bg-[#0b101a] border border-white/5 hover:border-blue-500/30 px-3 py-2.5 rounded-xl text-gray-400 hover:text-white transition-all flex items-center justify-between"
                    >
                      <span className="truncate pr-2">📝 ME: Thermodynamics & Carnot</span>
                      <span className="text-[10px] text-blue-400 font-bold shrink-0">Load Sample</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => loadSampleLecture(1)}
                      className="text-left text-xs bg-[#0b101a] border border-white/5 hover:border-purple-500/30 px-3 py-2.5 rounded-xl text-gray-400 hover:text-white transition-all flex items-center justify-between"
                    >
                      <span className="truncate pr-2">💻 CS: Artificial Neural Networks</span>
                      <span className="text-[10px] text-purple-400 font-bold shrink-0">Load Sample</span>
                    </button>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Right Recording / Text input area */}
          <div className="lg:col-span-7 space-y-6">
            <GlassCard className="relative overflow-hidden">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Mic className="text-blue-400" size={20} /> Lecture Speech Capture
                </h2>
                
                {isRecording && (
                  <span className="flex items-center gap-2 text-red-400 text-sm font-mono font-bold bg-red-500/10 px-3 py-1.5 rounded-full border border-red-500/20">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
                    {formatTime(recordingDuration)}
                  </span>
                )}
              </div>

              {/* Wave visualizer simulator when recording */}
              {isRecording ? (
                <div className="w-full bg-[#0a0f19] border border-red-500/20 rounded-xl py-6 px-4 mb-4 flex flex-col items-center justify-center space-y-4 animate-pulse">
                  <div className="flex items-end justify-center gap-1.5 h-16 w-64">
                    {Array.from({ length: 18 }).map((_, i) => {
                      const h = [24, 48, 12, 60, 32, 54, 18, 40, 56, 12, 44, 28, 50, 16, 36, 48, 22, 10];
                      return (
                        <div 
                          key={i} 
                          className="w-1.5 bg-gradient-to-t from-red-600 to-amber-500 rounded-full transition-all duration-300" 
                          style={{ 
                            height: `${Math.max(4, h[i] * (0.5 + Math.random() * 0.5))}px`,
                            animation: `bounce 1s ease-in-out infinite alternate`,
                            animationDelay: `${i * 0.05}s`
                          }}
                        />
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-400 text-center font-mono">
                    Speak clearly near the microphone. Recording live transcripts...
                  </p>
                </div>
              ) : null}

              {/* Control Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 mb-4">
                {!isRecording ? (
                  <Button 
                    variant="glow"
                    className="flex-1 bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400"
                    onClick={startRecording}
                    icon={<Mic size={18} />}
                  >
                    Start Mic Capture
                  </Button>
                ) : (
                  <Button 
                    variant="danger" 
                    className="flex-1"
                    onClick={stopRecording}
                    icon={<MicOff size={18} />}
                  >
                    Stop Capture
                  </Button>
                )}
                
                {rawTranscript.trim() && (
                  <Button 
                    variant="ghost" 
                    onClick={() => {
                      if(window.confirm("Clear current text transcript?")) setRawTranscript("");
                    }}
                    icon={<RotateCcw size={16} />}
                  >
                    Clear Text
                  </Button>
                )}
              </div>

              {/* Real-time transcript display */}
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-gray-400 mb-2">
                  Captured Voice Script / Raw Transcript
                </label>
                <textarea
                  value={rawTranscript}
                  onChange={(e) => setRawTranscript(e.target.value)}
                  placeholder="Record your voice, upload a draft text file, or select a sample lecture. Standard verbal stutters and spelling issues will be thoroughly polished by the AI models."
                  className="w-full h-64 bg-[#0F1623] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all font-mono text-sm leading-relaxed"
                />
              </div>

              {/* Processing error */}
              {processingError && (
                <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2 text-red-300 text-sm">
                  <AlertTriangle className="shrink-0 text-red-400 mt-0.5" size={16} />
                  <div>
                    <span className="font-bold">Error Processing:</span> {processingError}
                  </div>
                </div>
              )}

              {/* Action execute button */}
              <div className="mt-6">
                <Button 
                  variant="secondary" 
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 shadow-[0_0_20px_rgba(6,182,212,0.3)] py-3.5 rounded-xl font-bold text-lg"
                  disabled={!rawTranscript.trim() || isRecording}
                  onClick={handleAIProcess}
                  icon={<Sparkles size={20} />}
                >
                  AI Process Lecture & Generate Study Pack
                </Button>
              </div>

            </GlassCard>
          </div>
        </div>
      )}

      {/* --- Tab 3: Structured Study Workspace --- */}
      {activeTab === "workspace" && selectedLecture && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Workspace Menu Bar */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[#0d1320] border border-white/5 rounded-2xl p-4 gap-4">
            
            {/* Left title info */}
            <div className="flex items-center gap-3">
              <button 
                onClick={() => {
                  setActiveTab("library");
                  setSelectedLecture(null);
                }}
                className="text-gray-400 hover:text-white p-2 hover:bg-white/5 rounded-xl transition-colors"
                title="Back to Library"
              >
                <ChevronLeft size={20} />
              </button>
              <div>
                <span className="text-xs text-blue-400 font-semibold bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded">
                  {selectedLecture.subject}
                </span>
                <h2 className="text-xl font-bold text-white font-display mt-0.5 max-w-md truncate">
                  {selectedLecture.title}
                </h2>
              </div>
            </div>

            {/* Right utility buttons */}
            <div className="flex gap-2 self-stretch md:self-auto">
              <Button 
                variant="outline" 
                onClick={downloadNotesPDF}
                className="flex-1 md:flex-none"
                icon={<Download size={16} />}
              >
                Save as PDF
              </Button>
              <Button 
                variant="glow" 
                className="flex-1 md:flex-none"
                onClick={() => {
                  setSelectedLecture(null);
                  setActiveTab("library");
                }}
                icon={<BookOpen size={16} />}
              >
                My Library
              </Button>
            </div>
          </div>

          {/* Core Study Workspace Grid */}
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Study Deck Nav Section */}
            <div className="lg:col-span-3 space-y-3">
              <h3 className="text-xs uppercase tracking-widest text-gray-500 font-bold px-3">
                STUDY CORNER
              </h3>
              
              <div className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible pb-3 lg:pb-0 gap-1 lg:gap-1.5 scrollbar-thin">
                <button
                  onClick={() => setWorkspaceSubTab("overview")}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all text-left whitespace-nowrap lg:w-full ${
                    workspaceSubTab === "overview"
                      ? "bg-blue-600/20 text-blue-400 border border-blue-500/30 font-bold"
                      : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <BookOpen size={16} />
                  <span>Lecture Overview</span>
                </button>

                <button
                  onClick={() => setWorkspaceSubTab("notes")}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all text-left whitespace-nowrap lg:w-full ${
                    workspaceSubTab === "notes"
                      ? "bg-purple-600/20 text-purple-400 border border-purple-500/30 font-bold"
                      : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <FileText size={16} />
                  <span>Structured Notes</span>
                </button>

                <button
                  onClick={() => setWorkspaceSubTab("mindmap")}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all text-left whitespace-nowrap lg:w-full ${
                    workspaceSubTab === "mindmap"
                      ? "bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 font-bold"
                      : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <GitMerge size={16} />
                  <span>Concept Mindmap</span>
                </button>

                <button
                  onClick={() => setWorkspaceSubTab("flashcards")}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all text-left whitespace-nowrap lg:w-full ${
                    workspaceSubTab === "flashcards"
                      ? "bg-pink-600/20 text-pink-400 border border-pink-500/30 font-bold"
                      : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <RotateCcw size={16} />
                  <span>Study Flashcards</span>
                </button>

                <button
                  onClick={() => setWorkspaceSubTab("quiz")}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all text-left whitespace-nowrap lg:w-full ${
                    workspaceSubTab === "quiz"
                      ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 font-bold"
                      : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <Award size={16} />
                  <span>Exam Prep Quiz</span>
                </button>

                <button
                  onClick={() => setWorkspaceSubTab("chat")}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all text-left whitespace-nowrap lg:w-full ${
                    workspaceSubTab === "chat"
                      ? "bg-amber-600/20 text-amber-400 border border-amber-500/30 font-bold"
                      : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <MessageSquare size={16} />
                  <span>Ask AI Tutor</span>
                </button>
              </div>
            </div>

            {/* Right Display Area */}
            <div id="study-notes-pdf-area" className="lg:col-span-9">
              
              {/* Workspace Tab Content 1: Overview */}
              {workspaceSubTab === "overview" && (
                <div className="space-y-6 animate-fade-in">
                  
                  {/* Summary grid */}
                  <div className="grid md:grid-cols-12 gap-6">
                    <GlassCard className="md:col-span-8 bg-[#0d1321] border-white/5">
                      <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                        <Sparkles className="text-yellow-400" size={16} /> AI Executive Summary
                      </h3>
                      <p className="text-gray-300 text-sm leading-relaxed">
                        {selectedLecture.processedData.summary}
                      </p>
                    </GlassCard>

                    <GlassCard className="md:col-span-4 bg-[#0d1321] border-white/5 flex flex-col justify-between">
                      <div>
                        <h3 className="text-xs uppercase font-bold tracking-wider text-gray-400 mb-2">
                          METRIC TRACKS
                        </h3>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-500">Subject:</span>
                            <span className="text-gray-200 font-semibold">{selectedLecture.subject}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-500">Style:</span>
                            <span className="text-gray-200 font-semibold uppercase">{selectedLecture.style}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-500">Created:</span>
                            <span className="text-gray-200 font-semibold">
                              {formatLectureDate(selectedLecture.date)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-3 border-t border-white/5 text-xs text-gray-500 flex items-center gap-1.5">
                        <Clock size={12} /> AI transcript segmentations completed successfully.
                      </div>
                    </GlassCard>
                  </div>

                  {/* Study Task Checklist */}
                  <GlassCard className="bg-[#0d1321] border-white/5">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <CheckSquare className="text-blue-400" size={18} /> Recommended Study Tasks
                    </h3>
                    <div className="grid md:grid-cols-2 gap-3">
                      {selectedLecture.processedData.actionItems.map((item, index) => (
                        <div key={index} className="flex items-start gap-3 bg-[#111827] px-4 py-3 rounded-xl border border-white/5">
                          <span className="w-5 h-5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {index + 1}
                          </span>
                          <span className="text-gray-300 text-xs md:text-sm">{item}</span>
                        </div>
                      ))}
                    </div>
                  </GlassCard>

                  {/* Transcript Swapper Widget */}
                  <GlassCard className="bg-[#0c1220] border-white/5">
                    <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-4">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <FileText className="text-purple-400" size={18} /> Interactive Lecture Transcript
                      </h3>
                      
                      <div className="bg-[#111827] p-1 rounded-lg flex gap-1 border border-white/5 text-xs">
                        <button
                          onClick={() => setTranscriptViewMode("clean")}
                          className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                            transcriptViewMode === "clean" ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white"
                          }`}
                        >
                          Polished Notes View
                        </button>
                        <button
                          onClick={() => setTranscriptViewMode("original")}
                          className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                            transcriptViewMode === "original" ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white"
                          }`}
                        >
                          Raw Captured Script
                        </button>
                      </div>
                    </div>

                    {transcriptViewMode === "clean" ? (
                      <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-line font-display p-3 bg-white/[0.01] rounded-xl border border-white/5 max-h-96 overflow-y-auto">
                        {selectedLecture.processedData.cleanTranscript}
                      </div>
                    ) : (
                      <div className="text-gray-400 text-sm leading-relaxed whitespace-pre-line font-mono p-3 bg-white/[0.01] rounded-xl border border-white/5 max-h-96 overflow-y-auto">
                        {selectedLecture.originalTranscript}
                      </div>
                    )}
                  </GlassCard>
                </div>
              )}

              {/* Workspace Tab Content 2: Tailored Study Notes */}
              {workspaceSubTab === "notes" && (
                <div className="space-y-6 animate-fade-in">
                  <GlassCard className="bg-[#0d1321] border-white/5">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-2xl font-bold font-display text-white flex items-center gap-2">
                        <FileText className="text-purple-400" size={24} /> Tailored Structured Notes
                      </h3>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20">
                        {selectedLecture.style === "comprehensive" && "COMPREHENSIVE NOTES"}
                        {selectedLecture.style === "simplified" && "ELI5 SIMPLIFIED STUDY"}
                        {selectedLecture.style === "formulas" && "FORMULAS & EQUATIONS"}
                        {selectedLecture.style === "exam-prep" && "EXAM CRITERIA NOTES"}
                      </span>
                    </div>

                    <div className="space-y-8">
                      {selectedLecture.processedData.sections.map((sec, sIdx) => (
                        <div key={sIdx} className="border-b border-white/5 pb-6 last:border-b-0 last:pb-0">
                          <h4 className="text-lg font-bold font-display text-purple-300 mb-3 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                            {sec.title}
                          </h4>
                          <p className="text-gray-300 text-sm md:text-base leading-relaxed mb-4 font-display">
                            {sec.content}
                          </p>
                          {sec.bulletPoints && sec.bulletPoints.length > 0 && (
                            <ul className="grid md:grid-cols-2 gap-2 pl-2">
                              {sec.bulletPoints.map((bullet, bIdx) => (
                                <li key={bIdx} className="text-xs md:text-sm text-gray-400 flex items-start gap-2 bg-[#121927] px-3.5 py-2.5 rounded-xl border border-white/5 hover:border-purple-500/10 transition-all">
                                  <span className="text-purple-400 font-bold mt-0.5 shrink-0">•</span>
                                  <span>{bullet}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                </div>
              )}

              {/* Workspace Tab Content 3: Concept Mindmap */}
              {workspaceSubTab === "mindmap" && (
                <div className="space-y-6 animate-fade-in">
                  <GlassCard className="bg-[#0d1321] border-white/5">
                    <div className="mb-6">
                      <h3 className="text-2xl font-bold font-display text-white flex items-center gap-2">
                        <GitMerge className="text-cyan-400" size={24} /> Interactive Concept Mindmap
                      </h3>
                      <p className="text-xs text-gray-400 mt-1">
                        Hierarchical link tree breaking down core lecture topics and associated academic sub-branches.
                      </p>
                    </div>

                    {renderVisualMindMap(selectedLecture.processedData.mindmap)}
                  </GlassCard>
                </div>
              )}

              {/* Workspace Tab Content 4: Study Flashcards */}
              {workspaceSubTab === "flashcards" && (
                <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
                  <GlassCard className="bg-[#0d1321] border-white/5 text-center">
                    <h3 className="text-2xl font-bold font-display text-white mb-2 flex items-center justify-center gap-2">
                      <RotateCcw className="text-pink-400" size={24} /> Concept Memory Flashcards
                    </h3>
                    <p className="text-xs text-gray-400 mb-6">
                      Quiz your recall of equations, definitions, and theories. Click to flip.
                    </p>

                    {/* Active Flashcard Canvas */}
                    <div className="w-full max-w-md mx-auto aspect-[1.6/1] cursor-pointer perspective-1000 mb-6" onClick={() => {
                      setFlippedCards(prev => ({ ...prev, [activeCardIdx]: !prev[activeCardIdx] }));
                    }}>
                      <div className={`w-full h-full duration-500 transform-style-preserve-3d relative ${
                        flippedCards[activeCardIdx] ? "rotate-y-180" : ""
                      }`}>
                        
                        {/* Front Side */}
                        <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-[#1d273a] to-[#121928] border-2 border-pink-500/20 rounded-2xl flex flex-col justify-between p-6">
                          <span className="text-[10px] text-pink-400 uppercase font-bold tracking-widest text-left">
                            Concept Flashcard #{activeCardIdx + 1}
                          </span>
                          <h4 className="text-lg md:text-xl font-bold font-display text-white px-4 leading-normal">
                            {selectedLecture.processedData.flashcards[activeCardIdx]?.front}
                          </h4>
                          <span className="text-xs text-pink-300 font-semibold underline decoration-pink-500/50">
                            Click Card to Reveal Answer
                          </span>
                        </div>

                        {/* Back Side */}
                        <div className="absolute inset-0 backface-hidden rotate-y-180 bg-gradient-to-br from-[#1c2237] to-[#0c1020] border-2 border-pink-500/40 rounded-2xl flex flex-col justify-between p-6">
                          <span className="text-[10px] text-pink-300 uppercase font-bold tracking-widest text-left">
                            Solution Definition
                          </span>
                          <p className="text-sm md:text-base text-gray-200 leading-relaxed px-2 overflow-y-auto max-h-32">
                            {selectedLecture.processedData.flashcards[activeCardIdx]?.back}
                          </p>
                          <span className="text-xs text-gray-500 font-semibold">
                            Click to flip back
                          </span>
                        </div>

                      </div>
                    </div>

                    {/* Pagination Controls */}
                    <div className="flex items-center justify-between max-w-xs mx-auto">
                      <Button
                        variant="outline"
                        disabled={activeCardIdx === 0}
                        onClick={() => {
                          setActiveCardIdx(prev => prev - 1);
                        }}
                      >
                        Prev
                      </Button>
                      <span className="text-sm font-mono font-bold text-gray-400">
                        {activeCardIdx + 1} of {selectedLecture.processedData.flashcards.length}
                      </span>
                      <Button
                        variant="outline"
                        disabled={activeCardIdx === selectedLecture.processedData.flashcards.length - 1}
                        onClick={() => {
                          setActiveCardIdx(prev => prev + 1);
                        }}
                      >
                        Next
                      </Button>
                    </div>

                  </GlassCard>
                </div>
              )}

              {/* Workspace Tab Content 5: Exam Prep Quiz */}
              {workspaceSubTab === "quiz" && (
                <div className="space-y-6 animate-fade-in">
                  <GlassCard className="bg-[#0d1321] border-white/5">
                    
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/5 pb-4 mb-6 gap-2">
                      <div>
                        <h3 className="text-2xl font-bold font-display text-white flex items-center gap-2">
                          <Award className="text-emerald-400" size={24} /> Exam-Prep Assessment
                        </h3>
                        <p className="text-xs text-gray-400 mt-1">
                          Synthesized multiple-choice test designed by AI based directly on lecture topics.
                        </p>
                      </div>

                      {quizSubmitted && (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl text-center">
                          <span className="text-[10px] text-emerald-400 uppercase font-bold tracking-widest">SCORE METRIC</span>
                          <h4 className="text-lg font-bold text-emerald-300 font-mono">
                            {quizScore} / {selectedLecture.processedData.quiz.length} Correct
                          </h4>
                        </div>
                      )}
                    </div>

                    {/* Quiz Questions List */}
                    <div className="space-y-6">
                      {selectedLecture.processedData.quiz.map((item, qIdx) => {
                        const hasSelected = selectedAnswers[qIdx] !== undefined;
                        const isCorrect = selectedAnswers[qIdx] === item.correctAnswerIndex;

                        return (
                          <div key={qIdx} className="bg-[#121927] p-5 rounded-xl border border-white/5">
                            <h4 className="text-base font-bold text-white mb-3 flex items-start gap-2.5 leading-snug">
                              <span className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-xs flex items-center justify-center shrink-0 mt-0.5">
                                {qIdx + 1}
                              </span>
                              <span>{item.question}</span>
                            </h4>

                            <div className="grid md:grid-cols-2 gap-2 mt-4">
                              {item.options.map((opt, oIdx) => {
                                const isOptionSelected = selectedAnswers[qIdx] === oIdx;
                                const isCorrectOpt = oIdx === item.correctAnswerIndex;

                                let optStyle = "bg-[#0b101b] border-white/5 text-gray-400 hover:border-white/10";
                                if (quizSubmitted) {
                                  if (isCorrectOpt) {
                                    optStyle = "bg-emerald-500/10 border-emerald-500/40 text-emerald-200";
                                  } else if (isOptionSelected && !isCorrectOpt) {
                                    optStyle = "bg-red-500/10 border-red-500/40 text-red-200";
                                  }
                                } else if (isOptionSelected) {
                                  optStyle = "bg-blue-500/10 border-blue-500/50 text-blue-300";
                                }

                                return (
                                  <button
                                    key={oIdx}
                                    type="button"
                                    onClick={() => handleSelectQuizAnswer(qIdx, oIdx)}
                                    className={`p-3 rounded-xl border text-left text-xs md:text-sm font-medium transition-all flex justify-between items-center ${optStyle}`}
                                  >
                                    <span className="pr-2">{opt}</span>
                                    {quizSubmitted && isCorrectOpt && <Check className="text-emerald-400 shrink-0" size={16} />}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Detailed Solution Explanation */}
                            {quizSubmitted && (
                              <div className="mt-4 p-3 bg-white/[0.02] rounded-lg border border-white/5 text-xs text-gray-400 flex items-start gap-1.5">
                                <HelpCircle className="text-emerald-400 shrink-0 mt-0.5" size={14} />
                                <div>
                                  <span className="font-semibold text-gray-300">Explanation:</span> {item.explanation}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Quiz submission footer */}
                    <div className="mt-6 pt-4 border-t border-white/5 flex gap-2">
                      {!quizSubmitted ? (
                        <Button
                          variant="glow"
                          onClick={submitQuiz}
                          disabled={Object.keys(selectedAnswers).length < selectedLecture.processedData.quiz.length}
                          className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400"
                        >
                          Submit Quiz and View Solutions
                        </Button>
                      ) : (
                        <Button variant="outline" className="w-full" onClick={resetQuiz} icon={<RotateCcw size={16} />}>
                          Reset Quiz and Re-try
                        </Button>
                      )}
                    </div>

                  </GlassCard>
                </div>
              )}

              {/* Workspace Tab Content 6: Chat with AI Tutor */}
              {workspaceSubTab === "chat" && (
                <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
                  <GlassCard className="bg-[#0d1321] border-white/5 flex flex-col h-[520px]">
                    
                    <div className="border-b border-white/5 pb-3 mb-4 shrink-0">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <MessageSquare className="text-amber-400" size={18} /> Grounded AI Lecture Tutor
                      </h3>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        Ask questions or request practice problems. Powered strictly from this lecture's academic details.
                      </p>
                    </div>

                    {/* Messages Container */}
                    <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin max-h-[350px]">
                      {chatMessages.map((msg, idx) => (
                        <div 
                          key={idx} 
                          className={`flex items-start gap-2.5 max-w-[85%] ${
                            msg.role === "user" ? "ml-auto flex-row-reverse" : ""
                          }`}
                        >
                          {/* Avatar icon */}
                          <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center font-mono text-xs font-bold ${
                            msg.role === "user" 
                              ? "bg-blue-600 text-white" 
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}>
                            {msg.role === "user" ? "U" : "AI"}
                          </div>

                          <div className={`p-3.5 rounded-2xl text-xs md:text-sm leading-relaxed whitespace-pre-wrap ${
                            msg.role === "user"
                              ? "bg-blue-600/15 border border-blue-500/20 text-blue-200 rounded-tr-none"
                              : "bg-white/[0.02] border border-white/5 text-gray-300 rounded-tl-none font-display"
                          }`}>
                            {msg.content}
                          </div>
                        </div>
                      ))}
                      {chatLoading && (
                        <div className="flex items-center gap-2 text-gray-500 text-xs font-medium pl-10">
                          <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"></span>
                          <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                          <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                          <span>AI Tutor drafting response...</span>
                        </div>
                      )}
                      <div ref={chatBottomRef} />
                    </div>

                    {/* Chat Input form */}
                    <div className="border-t border-white/5 pt-4 mt-auto flex gap-2 shrink-0">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !chatLoading) handleSendChatMessage();
                        }}
                        placeholder="e.g. Can you explain isothermal expansion in simpler terms?"
                        disabled={chatLoading}
                        className="flex-1 bg-[#0F1623] border border-white/10 rounded-xl px-4 py-2.5 text-xs md:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
                      />
                      <Button
                        variant="secondary"
                        onClick={handleSendChatMessage}
                        disabled={!chatInput.trim() || chatLoading}
                        className="bg-amber-600 hover:bg-amber-500 shadow-[0_0_15px_rgba(217,119,6,0.3)] shrink-0 px-4"
                        icon={<Send size={14} />}
                      >
                        Send
                      </Button>
                    </div>

                  </GlassCard>
                </div>
              )}

            </div>
          </div>

        </div>
      )}

    </div>
  );
};

export default LectureProcessor;
