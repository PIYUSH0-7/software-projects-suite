import React, { useState, useEffect } from 'react';
import { GlassCard, Button, Input } from '../components/UI';
import { db, auth } from '../services/auth';
import { collection, onSnapshot, doc, updateDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { Shield, User, GraduationCap, Mail, RefreshCw, Trash2, Edit2, Search, Check } from 'lucide-react';
import { StudentProfile } from '../types';

const UsersManagement = () => {
  const [profiles, setProfiles] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Editing state form
  const [editRole, setEditRole] = useState<'student' | 'teacher' | 'admin'>('student');
  const [editBranch, setEditBranch] = useState('');
  const [editSemester, setEditSemester] = useState('5');

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      const list: StudentProfile[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ uid: docSnap.id, ...docSnap.data() } as StudentProfile);
      });
      setProfiles(list);
      setLoading(false);
    }, (error) => {
      console.error("Error reading users:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleStartEdit = (user: StudentProfile) => {
    setEditingUserId(user.uid);
    setEditRole(user.role || 'student');
    setEditBranch(user.branch || '');
    setEditSemester(user.currentSemester || '1');
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
  };

  const handleSaveUser = async (uid: string) => {
    try {
      const userRef = doc(db, "users", uid);
      await updateDoc(userRef, {
        role: editRole,
        branch: editBranch,
        currentSemester: editSemester
      });
      setEditingUserId(null);
      alert("User profile and roll updated successfully!");
    } catch (error) {
      console.error("Error saving user:", error);
      alert("Failed to update user.");
    }
  };

  const handleDeleteUser = async (uid: string) => {
    if (uid === auth.currentUser?.uid) {
      alert("Self-destruction avoided! You cannot delete your own logged-in admin account.");
      return;
    }
    if (!window.confirm("Are you sure you want to permanently delete this user from academic records?")) return;

    try {
      await deleteDoc(doc(db, "users", uid));
      alert("User deleted from academic records.");
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user.");
    }
  };

  const filteredProfiles = profiles.filter(user => {
    const searchString = `${user.displayName || ''} ${user.email || ''} ${user.branch || ''}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-3xl font-bold font-display bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
          User Role & Registry Desk
        </h1>
        <p className="text-gray-400">
          Manage system users, assign role privileges (Student / Teacher / Admin), and sync departments and academic semesters.
        </p>
      </div>

      <GlassCard className="p-4 flex items-center gap-3">
        <Search className="text-gray-400 shrink-0" size={20} />
        <input 
          type="text"
          className="w-full bg-transparent border-none text-white focus:outline-none placeholder-gray-500 text-sm"
          placeholder="Search registered students, teachers, or staff by display name, email, or branch..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </GlassCard>

      <GlassCard className="overflow-hidden">
        {loading ? (
          <div className="text-center py-20 text-gray-400 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="animate-spin text-purple-400" size={24} />
            <span>Loading academic registries...</span>
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            No academic users match your search query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-gray-300 font-semibold text-xs uppercase tracking-wider font-mono">
                  <th className="px-6 py-4">User Details</th>
                  <th className="px-6 py-4">Branch & Semester</th>
                  <th className="px-6 py-4">Assigned Role</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm text-gray-300">
                {filteredProfiles.map((user) => {
                  const isEditing = editingUserId === user.uid;
                  return (
                    <tr key={user.uid} className={`hover:bg-white/[0.02] transition-colors ${isEditing ? 'bg-purple-500/5' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-full ${
                            user.role === 'admin' ? 'bg-purple-500/10 text-purple-400' :
                            user.role === 'teacher' ? 'bg-green-500/10 text-green-400' :
                            'bg-blue-500/10 text-blue-400'
                          }`}>
                            {user.role === 'admin' ? <Shield size={18} /> : 
                             user.role === 'teacher' ? <User size={18} /> : 
                             <GraduationCap size={18} />}
                          </div>
                          <div>
                            <div className="font-bold text-white flex items-center gap-2">
                              {user.displayName || 'No Display Name'}
                              {user.uid === auth.currentUser?.uid && (
                                <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-500/30">You</span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                              <Mail size={12} /> {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {isEditing ? (
                          <div className="flex gap-2 max-w-xs">
                            <input 
                              type="text" 
                              className="w-1/2 bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white"
                              value={editBranch}
                              onChange={(e) => setEditBranch(e.target.value)}
                              placeholder="Branch name"
                            />
                            <select 
                              className="w-1/2 bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white"
                              value={editSemester}
                              onChange={(e) => setEditSemester(e.target.value)}
                            >
                              {[1,2,3,4,5,6,7,8].map(s => (
                                <option key={s} value={s}>Sem {s}</option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <div>
                            <div className="font-semibold text-gray-200">{user.branch || 'Not Assigned'}</div>
                            <div className="text-xs text-gray-500 font-mono mt-0.5">Semester {user.currentSemester || 'N/A'}</div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {isEditing ? (
                          <select 
                            className="bg-black/40 border border-white/10 rounded px-2 py-1.5 text-xs text-white"
                            value={editRole}
                            onChange={(e) => setEditRole(e.target.value as any)}
                          >
                            <option value="student">Student</option>
                            <option value="teacher">Teacher (Faculty)</option>
                            <option value="admin">Admin (Academic Cell)</option>
                          </select>
                        ) : (
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                            user.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                            user.role === 'teacher' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                            'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          }`}>
                            {user.role || 'student'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isEditing ? (
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => handleSaveUser(user.uid)}
                              className="p-1.5 bg-green-500/10 hover:bg-green-500 text-green-400 hover:text-white rounded border border-green-500/20 transition-all"
                              title="Save Changes"
                            >
                              <Check size={14} />
                            </button>
                            <button 
                              onClick={handleCancelEdit}
                              className="p-1.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded border border-white/10 transition-all"
                              title="Cancel"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => handleStartEdit(user)}
                              className="p-1.5 bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white rounded border border-blue-500/20 transition-all"
                              title="Modify Registry"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button 
                              onClick={() => handleDeleteUser(user.uid)}
                              className="p-1.5 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded border border-red-500/20 transition-all"
                              title="Remove Registrant"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
};

export default UsersManagement;
