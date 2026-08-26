
import React, { useState, useEffect } from 'react';
import { AppView, Course, INITIAL_FOLDERS } from './types';
import { Dashboard } from './components/Dashboard';
import { CourseDetail } from './components/CourseDetail';
import { Lock, Cloud, LogIn, LogOut } from './components/Icons';
import { auth, db, loginWithGoogle, logout, handleFirestoreError, OperationType } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, doc, setDoc, onSnapshot, query, writeBatch } from 'firebase/firestore';

const STORAGE_KEY = 'devpath_tracker_data_v1';
const MASTER_PIN = '338576';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.DASHBOARD);
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // App Mode State - Default to Public (false)
  const [isEditorMode, setIsEditorMode] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  // Restriction Modal State
  const [showRestrictionModal, setShowRestrictionModal] = useState(false);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        // If logged out, load from local storage
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          setCourses(JSON.parse(stored));
        } else {
          const initialCourses: Course[] = INITIAL_FOLDERS.map(f => ({
            id: f.id,
            title: f.title,
            folderColor: f.color,
            weeks: [],
            isCompleted: false
          }));
          setCourses(initialCourses);
        }
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Firestore Sync
  useEffect(() => {
    if (!user) return;

    setIsLoading(true);
    const coursesRef = collection(db, 'users', user.uid, 'courses');
    const q = query(coursesRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const cloudCourses: Course[] = [];
      snapshot.forEach((doc) => {
        cloudCourses.push(doc.data() as Course);
      });

      if (cloudCourses.length > 0) {
        // Sort by initial folder order if possible
        const sorted = INITIAL_FOLDERS.map(f => {
          const found = cloudCourses.find(c => c.id === f.id);
          return found || { id: f.id, title: f.title, folderColor: f.color, weeks: [], isCompleted: false };
        });
        setCourses(sorted);
      } else {
        // First time user or empty cloud, try to migrate local data
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const localData = JSON.parse(stored) as Course[];
          setCourses(localData);
          // Optionally auto-upload local data to cloud
          uploadToCloud(user.uid, localData);
        } else {
          const initialCourses: Course[] = INITIAL_FOLDERS.map(f => ({
            id: f.id,
            title: f.title,
            folderColor: f.color,
            weeks: [],
            isCompleted: false
          }));
          setCourses(initialCourses);
        }
      }
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/courses`);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const uploadToCloud = async (uid: string, data: Course[]) => {
    setIsSyncing(true);
    try {
      const batch = writeBatch(db);
      
      // Update user profile
      const userRef = doc(db, 'users', uid);
      batch.set(userRef, {
        uid,
        email: auth.currentUser?.email,
        displayName: auth.currentUser?.displayName,
        photoURL: auth.currentUser?.photoURL,
        lastLogin: new Date().toISOString()
      }, { merge: true });

      // Update courses
      data.forEach(course => {
        const courseRef = doc(db, 'users', uid, 'courses', course.id);
        batch.set(courseRef, course);
      });

      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${uid}/courses`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSelectCourse = (courseId: string) => {
    setActiveCourseId(courseId);
    setView(AppView.COURSE_DETAIL);
  };

  const handleBackToDashboard = () => {
    setActiveCourseId(null);
    setView(AppView.DASHBOARD);
  };

  const handleUpdateCourse = async (updatedCourse: Course) => {
    // Optimistic UI update
    setCourses(prev => prev.map(c => c.id === updatedCourse.id ? updatedCourse : c));
    
    if (user) {
      try {
        const courseRef = doc(db, 'users', user.uid, 'courses', updatedCourse.id);
        await setDoc(courseRef, updatedCourse);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/courses/${updatedCourse.id}`);
      }
    } else {
      // Save to local storage if not logged in
      const updatedCourses = courses.map(c => c.id === updatedCourse.id ? updatedCourse : c);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCourses));
    }
  };

  const handleImportData = (importedCourses: Course[]) => {
    setCourses(importedCourses);
    if (user) {
      uploadToCloud(user.uid, importedCourses);
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(importedCourses));
    }
  };

  const handleModeToggleRequest = () => {
    if (isEditorMode) {
      setIsEditorMode(false);
    } else {
      setShowPinModal(true);
      setPinInput('');
      setPinError(false);
    }
  };

  const verifyPin = () => {
    if (pinInput === MASTER_PIN) {
      setIsEditorMode(true);
      setShowPinModal(false);
    } else {
      setPinError(true);
      setTimeout(() => setPinError(false), 2000);
    }
  };

  const handleTriggerRestriction = () => {
    setShowRestrictionModal(true);
  };

  const handleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (e) {
      console.error("Login failed", e);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      // Reset view to dashboard on logout
      setView(AppView.DASHBOARD);
      setActiveCourseId(null);
    } catch (e) {
      console.error("Logout failed", e);
    }
  };

  if (isLoading) {
    return <div className="h-screen w-full flex items-center justify-center bg-[#0B0F19] text-slate-500 font-mono tracking-widest uppercase">Initializing DevPath...</div>;
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0B0F19] to-[#0B0F19] text-slate-200 font-sans selection:bg-amber-500/30 selection:text-amber-100 overflow-x-hidden">
      
      {/* Auth Bar */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-3">
        {user ? (
          <div className="flex items-center gap-3 bg-[#161b2c]/80 backdrop-blur-md border border-slate-700/50 rounded-full pl-1 pr-4 py-1 shadow-xl">
            <img src={user.photoURL || ''} alt={user.displayName || ''} className="w-8 h-8 rounded-full border border-slate-600" referrerPolicy="no-referrer" />
            <div className="hidden sm:block">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider leading-none">Cloud Active</p>
              <p className="text-xs text-white font-medium truncate max-w-[100px]">{user.displayName}</p>
            </div>
            <button onClick={handleLogout} className="p-1.5 text-slate-400 hover:text-red-400 transition-colors" title="Logout">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button 
            onClick={handleLogin}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs font-bold text-white backdrop-blur-md transition-all shadow-xl"
          >
            <LogIn className="w-4 h-4 text-amber-500" />
            Sign In for Cloud Backup
          </button>
        )}
      </div>

      {view === AppView.DASHBOARD && (
        <Dashboard 
          courses={courses} 
          onSelectCourse={handleSelectCourse}
          isEditorMode={isEditorMode}
          onToggleMode={handleModeToggleRequest}
          onImportData={handleImportData}
        />
      )}

      {view === AppView.COURSE_DETAIL && activeCourseId && (
        <CourseDetail 
          course={courses.find(c => c.id === activeCourseId)!}
          onBack={handleBackToDashboard}
          onUpdateCourse={handleUpdateCourse}
          isEditorMode={isEditorMode}
          onTriggerRestriction={handleTriggerRestriction}
        />
      )}

      {/* Master PIN Modal */}
      {showPinModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-all duration-300">
          <div className="bg-[#161b2c] border border-slate-700/50 rounded-2xl p-8 w-full max-w-sm shadow-2xl shadow-black/50 text-center relative overflow-hidden">
             {/* Modal decorative glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-amber-500/50 blur-[2px]"></div>
            
            <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Admin Access</h3>
            <p className="text-slate-400 text-sm mb-6">Enter security code to switch to Editor Mode.</p>
            
            <input 
              type="password"
              autoFocus
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && verifyPin()}
              className={`w-full bg-[#0B0F19] border ${pinError ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'border-slate-800 focus:border-amber-500/50 focus:shadow-[0_0_15px_rgba(245,158,11,0.1)]'} rounded-xl p-4 text-center text-2xl text-white tracking-[0.5em] outline-none mb-6 transition-all duration-300 placeholder:text-slate-800`}
              placeholder="••••••"
            />
            
            <div className="flex gap-3">
              <button 
                onClick={() => setShowPinModal(false)}
                className="flex-1 py-2.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors font-medium text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={verifyPin}
                className="flex-1 py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold rounded-lg shadow-lg shadow-amber-900/20 transition-all text-sm transform active:scale-95"
              >
                Unlock
              </button>
            </div>
            {pinError && <p className="text-red-400 text-xs mt-4 font-mono animate-pulse">ERROR: INVALID ACCESS CODE</p>}
          </div>
        </div>
      )}

      {/* Restriction Modal */}
      {showRestrictionModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-[#161b2c] border border-slate-700/50 rounded-2xl p-8 w-full max-w-sm shadow-2xl shadow-black/50 text-center transform transition-all scale-100">
            <div className="mx-auto w-14 h-14 bg-slate-800/50 rounded-full flex items-center justify-center mb-5 border border-slate-700">
              <Lock className="w-6 h-6 text-amber-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Read-Only Mode</h3>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              You are currently viewing the Public Portfolio. 
              <br/>Switch to <strong>Editor Mode</strong> to make changes.
            </p>
            
            <button 
              onClick={() => setShowRestrictionModal(false)}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition-all border border-slate-700 hover:border-slate-600"
            >
              Understood
            </button>
          </div>
        </div>
      )}

      {/* Syncing Overlay */}
      {isSyncing && (
        <div className="fixed bottom-4 left-4 z-50 flex items-center gap-3 bg-amber-600 text-white px-4 py-2 rounded-full shadow-lg animate-pulse">
          <Cloud className="w-4 h-4 animate-bounce" />
          <span className="text-xs font-bold uppercase tracking-widest">Syncing to Cloud...</span>
        </div>
      )}
    </div>
  );
};

export default App;
