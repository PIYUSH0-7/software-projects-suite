import React, { useState, useEffect } from 'react';
import { GlassCard, Button, Input } from '../components/UI';
import { auth, db } from '../services/auth';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, onSnapshot, getDoc } from 'firebase/firestore';
import { AlertCircle, CheckCircle, MessageSquare, Plus, Send, RefreshCw, HelpCircle } from 'lucide-react';
import { Grievance, StudentProfile } from '../types';

const Grievances = () => {
  const [currentUserProfile, setCurrentUserProfile] = useState<StudentProfile | null>(null);
  const [role, setRole] = useState<'student' | 'teacher' | 'admin'>('student');
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'resolved'>('all');

  // Submit form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'Attendance' | 'Marks' | 'Exam Form' | 'Other'>('Attendance');
  const [description, setDescription] = useState('');

  // Response state for teachers/admins
  const [responses, setResponses] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (!auth.currentUser) return;

    // Fetch user profile to get role
    const unsubscribeProfile = onSnapshot(doc(db, "users", auth.currentUser.uid), (docSnap) => {
      if (docSnap.exists()) {
        const profile = docSnap.data() as StudentProfile;
        setCurrentUserProfile(profile);
        setRole(profile.role || 'student');
      }
    });

    return () => unsubscribeProfile();
  }, []);

  // Listen to grievances based on role
  useEffect(() => {
    if (!auth.currentUser) return;

    setLoading(true);
    let grievancesQuery;

    if (role === 'student') {
      // Students see only their own grievances
      grievancesQuery = query(
        collection(db, "grievances"),
        where("studentId", "==", auth.currentUser.uid)
      );
    } else {
      // Teachers and Admins see all grievances
      grievancesQuery = query(collection(db, "grievances"));
    }

    const unsubscribe = onSnapshot(grievancesQuery, (snapshot) => {
      const list: Grievance[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Grievance);
      });
      // Sort: newest first
      list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      setGrievances(list);
      setLoading(false);
    }, (error) => {
      console.error("Grievances listen error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [role]);

  const handleSubmitGrievance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !title.trim() || !description.trim()) return;

    setSubmitting(true);
    try {
      const studentName = currentUserProfile?.displayName || auth.currentUser.displayName || auth.currentUser.email || 'Student';
      const newGrievance: Omit<Grievance, 'id'> = {
        studentId: auth.currentUser.uid,
        studentName,
        title,
        category,
        description,
        status: 'Pending',
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, "grievances"), newGrievance);
      setTitle('');
      setDescription('');
      alert("Your grievance has been submitted to the academic cell. We will look into it shortly.");
    } catch (error) {
      console.error("Error submitting grievance:", error);
      alert("Failed to submit grievance. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolveGrievance = async (grievanceId: string) => {
    const responseText = responses[grievanceId];
    if (!responseText || !responseText.trim() || !auth.currentUser) {
      alert("Please enter a resolution response.");
      return;
    }

    try {
      const resolverName = currentUserProfile?.displayName || auth.currentUser.email || 'Admin';
      const grievanceRef = doc(db, "grievances", grievanceId);
      
      await updateDoc(grievanceRef, {
        status: 'Resolved',
        response: responseText,
        resolvedBy: `${resolverName} (${role === 'admin' ? 'HOD/Admin' : 'Faculty'})`
      });

      // Clear the input
      setResponses(prev => ({ ...prev, [grievanceId]: '' }));
      alert("Grievance resolved successfully.");
    } catch (error) {
      console.error("Error resolving grievance:", error);
      alert("Failed to resolve grievance.");
    }
  };

  const filteredGrievances = grievances.filter(g => {
    if (activeTab === 'pending') return g.status === 'Pending';
    if (activeTab === 'resolved') return g.status === 'Resolved';
    return true;
  });

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-amber-400">
            Grievance Redressal Desk
          </h1>
          <p className="text-gray-400">
            {role === 'student' 
              ? "Lodge a query regarding your internal marks, attendance mismatches, or sessional ratings."
              : "Review, investigate, and resolve grievances lodged by college students."
            }
          </p>
        </div>
        <div className="flex bg-white/5 border border-white/10 rounded-lg p-1">
          <button 
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-md text-xs font-semibold transition-all ${activeTab === 'all' ? 'bg-amber-500 text-black' : 'text-gray-400'}`}
          >
            All Logs
          </button>
          <button 
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 rounded-md text-xs font-semibold transition-all ${activeTab === 'pending' ? 'bg-amber-500 text-black' : 'text-gray-400'}`}
          >
            Pending
          </button>
          <button 
            onClick={() => setActiveTab('resolved')}
            className={`px-4 py-2 rounded-md text-xs font-semibold transition-all ${activeTab === 'resolved' ? 'bg-amber-500 text-black' : 'text-gray-400'}`}
          >
            Resolved
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Form to Lodge Grievance (Student Only) */}
        {role === 'student' && (
          <div className="lg:col-span-1 space-y-6">
            <GlassCard className="border-t-4 border-t-amber-500">
              <h2 className="text-xl font-bold font-display text-white mb-4 flex items-center gap-2">
                <Plus size={20} className="text-amber-400" /> Lodge New Query
              </h2>
              <form onSubmit={handleSubmitGrievance} className="space-y-4">
                <Input 
                  label="Subject/Grievance Title" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="e.g. ST2 DBMS marks mismatch"
                  required
                />
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-200 mb-1">Category</label>
                  <select 
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                  >
                    <option value="Attendance">Attendance Correction</option>
                    <option value="Marks">Sessional Marks Recount</option>
                    <option value="Exam Form">Exam Form / Admit Card</option>
                    <option value="Other">Other Academic Queries</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">Elaborate Description</label>
                  <textarea 
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-[120px]"
                    placeholder="Provide specific details like subject code, teacher name, date, etc."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </div>
                <Button disabled={submitting} className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold">
                  {submitting ? 'Lodging...' : 'Lodge Grievance'}
                </Button>
              </form>
            </GlassCard>
          </div>
        )}

        {/* List of Grievances */}
        <div className={role === 'student' ? 'lg:col-span-2 space-y-4' : 'lg:col-span-3 space-y-4'}>
          {loading ? (
            <div className="text-center py-20 text-gray-400">Loading grievances logs...</div>
          ) : filteredGrievances.length === 0 ? (
            <GlassCard className="text-center py-16 text-gray-500">
              <HelpCircle size={48} className="mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">No grievances found</p>
              <p className="text-sm mt-1 opacity-60">All queries are settled. College is running smooth!</p>
            </GlassCard>
          ) : (
            filteredGrievances.map((g) => (
              <GlassCard key={g.id} className={`border-l-4 ${g.status === 'Resolved' ? 'border-l-green-500' : 'border-l-amber-500'}`}>
                <div className="flex justify-between items-start gap-4 mb-3">
                  <div>
                    <span className="text-xs bg-white/5 px-2 py-1 rounded border border-white/10 text-gray-400 font-mono">
                      {g.category}
                    </span>
                    <h3 className="text-lg font-bold text-white mt-2">{g.title}</h3>
                    {role !== 'student' && (
                      <p className="text-xs text-blue-400 mt-1">
                        By Student: <strong className="text-white">{g.studentName}</strong> (UID: {g.studentId?.slice(0, 8)})
                      </p>
                    )}
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    g.status === 'Resolved' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    {g.status}
                  </div>
                </div>

                <p className="text-sm text-gray-300 bg-black/20 p-3 rounded-lg leading-relaxed mb-4">
                  {g.description}
                </p>

                {g.status === 'Resolved' ? (
                  <div className="bg-green-500/5 border border-green-500/10 rounded-lg p-3 mt-3">
                    <div className="flex items-center gap-2 text-green-400 font-semibold text-sm mb-1">
                      <CheckCircle size={16} /> Official Resolution Reply:
                    </div>
                    <p className="text-sm text-gray-300 italic">"{g.response}"</p>
                    <p className="text-[10px] text-gray-500 mt-2 text-right">Resolved by: {g.resolvedBy}</p>
                  </div>
                ) : (
                  // Reply form for Teachers/Admins
                  role !== 'student' && (
                    <div className="space-y-3 mt-4 pt-3 border-t border-white/5">
                      <label className="block text-xs font-semibold text-amber-300 uppercase tracking-wider">
                        Resolve & Answer Grievance
                      </label>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                          placeholder="e.g. ST2 paper checked, updated in Portal. Sessional Marks sync initiated."
                          value={responses[g.id || ''] || ''}
                          onChange={(e) => setResponses(prev => ({ ...prev, [g.id || '']: e.target.value }))}
                        />
                        <Button 
                          onClick={() => handleResolveGrievance(g.id || '')} 
                          className="bg-green-600 hover:bg-green-500 text-white flex items-center gap-1 py-2 text-xs"
                        >
                          <Send size={14} /> Resolve
                        </Button>
                      </div>
                    </div>
                  )
                )}
                <div className="text-[10px] text-gray-500 mt-3 flex justify-between">
                  <span>Lodge Date: {new Date(g.createdAt).toLocaleString()}</span>
                </div>
              </GlassCard>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Grievances;
