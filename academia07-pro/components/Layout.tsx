import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Calculator, GraduationCap, BarChart3, LogOut, Menu, X, BookOpen, Users, UserCircle, PenTool, Sparkles, ExternalLink, Code2, FileText, Shield, User, BrainCircuit } from 'lucide-react';
import { auth, db } from '../services/auth';
import { signOut } from 'firebase/auth';
import { doc, onSnapshot, updateDoc, setDoc } from 'firebase/firestore';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showFloatingFooter, setShowFloatingFooter] = useState(true);
  const [role, setRole] = useState<'student' | 'teacher' | 'admin'>('student');
  const [profile, setProfile] = useState<any>(null);
  const location = useLocation();

  useEffect(() => {
    if (!auth.currentUser) return;

    // Listen to user profile updates and extract role dynamically
    const docRef = doc(db, "users", auth.currentUser.uid);
    const unsubscribe = onSnapshot(docRef, async (docSnap) => {
      if (docSnap.exists()) {
        const p = docSnap.data();
        setProfile(p);
        setRole(p.role || 'student');
      } else {
        try {
          const initProfile = {
            uid: auth.currentUser!.uid,
            displayName: auth.currentUser!.displayName || auth.currentUser!.email?.split('@')[0] || 'Scholar',
            email: auth.currentUser!.email || '',
            role: 'student',
            branch: 'Computer Science',
            currentSemester: '1',
            skills: [],
            bio: 'B.Tech Student',
            linkedin: '',
            github: ''
          };
          await setDoc(docRef, initProfile);
        } catch (err) {
          console.error("Error creating default user profile:", err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handleRoleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedRole = e.target.value;
    if (!auth.currentUser) return;
    try {
      await setDoc(doc(db, "users", auth.currentUser.uid), {
        role: selectedRole
      }, { merge: true });
    } catch (error) {
      console.error("Error setting preview role:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    if (scrollTop > 50 && showFloatingFooter) {
      setShowFloatingFooter(false);
    } else if (scrollTop <= 50 && !showFloatingFooter) {
      setShowFloatingFooter(true);
    }
  };

  // Build menus based on active role
  const getMenuItems = () => {
    switch (role) {
      case 'admin':
        return [
          { to: "/", icon: LayoutDashboard, label: "Admin Dashboard" },
          { to: "/attendance", icon: BarChart3, label: "Attendance Overrides" },
          { to: "/internal-marks", icon: Calculator, label: "Lock Sessionals" },
          { to: "/grievances", icon: FileText, label: "Grievance Desk" },
          { to: "/users-management", icon: Users, label: "Manage Roles" },
          { to: "/profile", icon: UserCircle, label: "Profile" },
        ];
      case 'teacher':
        return [
          { to: "/", icon: LayoutDashboard, label: "Faculty Dashboard" },
          { to: "/attendance", icon: BarChart3, label: "Mark Attendance" },
          { to: "/internal-marks", icon: Calculator, label: "Sessional Marks" },
          { to: "/lectures", icon: BrainCircuit, label: "AI Lecture Notes", isNew: true },
          { to: "/assignments", icon: BookOpen, label: "Upload Assignments" },
          { to: "/progress", icon: BookOpen, label: "Syllabus Tracker" },
          { to: "/connections", icon: Users, label: "Connections" },
          { to: "/profile", icon: UserCircle, label: "Profile" },
        ];
      case 'student':
      default:
        return [
          { to: "/", icon: LayoutDashboard, label: "Dashboard" },
          { to: "/lectures", icon: BrainCircuit, label: "AI Lecture Notes", isNew: true },
          { to: "/ai-tutor", icon: PenTool, label: "Assignment Solver", isNew: true },
          { to: "/attendance", icon: BarChart3, label: "Attendance Tracker" },
          { to: "/internal-marks", icon: Calculator, label: "Internal Marks" },
          { to: "/gpa", icon: GraduationCap, label: "Grade Calc" },
          { to: "/progress", icon: BookOpen, label: "Progress" },
          { to: "/grievances", icon: FileText, label: "Grievances" },
          { to: "/connections", icon: Users, label: "Connections" },
          { to: "/profile", icon: UserCircle, label: "Profile" },
        ];
    }
  };

  const NavItem = ({ to, icon: Icon, label, isNew = false }: { to: string; icon: any; label: string; isNew?: boolean; key?: string }) => {
    const isActive = location.pathname === to;
    return (
      <Link
        to={to}
        onClick={() => setIsSidebarOpen(false)}
        className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group overflow-hidden ${
          isActive 
            ? 'bg-blue-600/10 text-blue-400 shadow-[inset_0_0_20px_rgba(37,99,235,0.1)] border border-blue-500/20' 
            : 'text-gray-400 hover:text-white hover:bg-white/5'
        }`}
      >
        {isActive && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r-full shadow-[0_0_10px_#3b82f6]"></div>
        )}
        <Icon size={20} className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
        <span className="font-medium font-display tracking-wide text-sm">{label}</span>
        {isNew && (
          <span className="ml-auto text-[10px] font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-0.5 rounded-full shadow-lg animate-pulse-glow animate-pulse">
            AI
          </span>
        )}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white relative overflow-hidden font-sans">
      {/* Advanced Ambient Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-900/20 rounded-full mix-blend-screen filter blur-[100px] animate-blob"></div>
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] bg-purple-900/20 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] bg-cyan-900/20 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-4000"></div>
        {/* Grid Overlay */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-[#0B0F19]/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-tr from-blue-500 to-cyan-500 p-1.5 rounded-lg">
            <GraduationCap className="text-white" size={20} />
          </div>
          <span className="font-bold text-lg font-display tracking-tight text-white">Academia<span className="text-blue-500">07</span></span>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={role} 
            onChange={handleRoleChange}
            className="bg-white/5 border border-white/10 text-xs rounded-lg px-2.5 py-1.5 text-amber-400 font-bold focus:outline-none"
          >
            <option value="student" className="bg-[#0B0F19]">Student</option>
            <option value="teacher" className="bg-[#0B0F19]">Teacher</option>
            <option value="admin" className="bg-[#0B0F19]">Admin</option>
          </select>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-gray-300">
            {isSidebarOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      <div className="flex h-screen overflow-hidden">
        {/* Glass Sidebar */}
        <aside className={`
          fixed lg:sticky top-0 left-0 z-40 h-screen w-72 bg-[#0F1623]/80 backdrop-blur-2xl border-r border-white/5 
          transition-transform duration-300 ease-in-out lg:translate-x-0 flex flex-col shadow-2xl
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="p-8 overflow-y-auto flex-1">
            <div className="flex items-center gap-3 mb-10">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative bg-black rounded-xl p-2.5 ring-1 ring-white/10">
                  <GraduationCap size={28} className="text-blue-400" />
                </div>
              </div>
              <div>
                <h1 className="font-bold text-2xl font-display tracking-tight text-white leading-none">Academia<span className="text-blue-500">07</span></h1>
                <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-[0.2em] mt-1">Pro Portal</p>
              </div>
            </div>

            <nav className="space-y-1.5">
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 px-4 mt-2">
                {role === 'admin' ? 'Administrative' : role === 'teacher' ? 'Faculty Panel' : 'Student Portal'}
              </div>
              
              {getMenuItems().map((item) => (
                <NavItem key={item.to} to={item.to} icon={item.icon} label={item.label} isNew={item.isNew} />
              ))}
            </nav>
          </div>

          <div className="mt-auto p-6 border-t border-white/5 bg-gradient-to-t from-black/40 to-transparent">
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 text-gray-400 hover:text-red-400 transition-colors w-full px-4 py-3 hover:bg-red-500/5 rounded-xl border border-transparent hover:border-red-500/10 group"
            >
              <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium text-sm">Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main 
          className="flex-1 overflow-y-auto relative scroll-smooth"
          onScroll={handleScroll}
        >
          {/* Header Bar */}
          <div className="sticky top-0 z-30 flex items-center justify-between px-8 py-4 bg-[#0B0F19]/80 backdrop-blur-md border-b border-white/5">
             <div className="flex items-center gap-2 text-sm text-gray-400">
               <span className="hover:text-white transition-colors cursor-pointer">Academia07</span>
               <span>/</span>
               <span className="text-blue-400 font-medium">{location.pathname === '/' ? 'Dashboard' : location.pathname.slice(1).replace('-', ' ').replace(/^\w/, c => c.toUpperCase())}</span>
             </div>
             <div className="flex items-center gap-4">
                {/* Advanced Role Preview Selector */}
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
                    <span className="text-xs text-gray-400 font-medium">Preview As:</span>
                    <select 
                      value={role} 
                      onChange={handleRoleChange}
                      className="bg-transparent border-none text-xs font-bold focus:outline-none text-amber-400 cursor-pointer text-right"
                    >
                      <option value="student" className="bg-[#0F1623] text-white">Student</option>
                      <option value="teacher" className="bg-[#0F1623] text-white">Teacher</option>
                      <option value="admin" className="bg-[#0F1623] text-white">Admin</option>
                    </select>
                </div>

                <div className="hidden md:flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                   <Sparkles size={14} className="text-yellow-400 animate-pulse" />
                   <span className="text-xs font-medium text-gray-300">
                     {role === 'admin' ? 'Academic Board' : role === 'teacher' ? 'Faculty Star' : 'Pro Student'}
                   </span>
                </div>
             </div>
          </div>

          <div className="p-4 lg:p-8 max-w-7xl mx-auto min-h-[calc(100vh-80px)]">
            {children}
          </div>
          
          <footer className="text-center text-gray-600 text-xs py-8 border-t border-white/5 bg-[#080b12]">
             <p className="font-display tracking-widest opacity-50">ACADEMIA07 PRO • ENGINEERED BY PIYUSH GANGWAR</p>
          </footer>

          {/* Floating Footer - Shows only when not scrolled */}
          <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-40 transition-all duration-700 cubic-bezier(0.175, 0.885, 0.32, 1.275) ${showFloatingFooter ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20 pointer-events-none'}`}>
             <a 
               href="https://piyush07-pi.vercel.app/" 
               target="_blank" 
               rel="noopener noreferrer"
               className="flex items-center gap-3 bg-[#0F1623]/80 backdrop-blur-2xl text-white pl-4 pr-6 py-3 rounded-full shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-white/10 hover:scale-105 hover:border-blue-500/30 transition-all group"
             >
               <div className="bg-gradient-to-tr from-blue-500 to-purple-500 p-1.5 rounded-full shadow-lg">
                 <Code2 size={16} className="text-white" />
               </div>
               <span className="font-display tracking-wide text-sm">
                 <span className="font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-200 to-purple-200 group-hover:to-white transition-all">Piyush's Portfolio</span>
                 <span className="mx-3 text-gray-600">|</span> 
                 <span className="text-gray-400 text-xs uppercase tracking-wider font-semibold">B.Tech Final Year Project</span>
               </span>
               <ExternalLink size={12} className="text-gray-500 group-hover:text-blue-400 transition-colors ml-1" />
             </a>
          </div>
        </main>
      </div>
      
      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;
