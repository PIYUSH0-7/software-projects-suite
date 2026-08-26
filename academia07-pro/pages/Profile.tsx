import React, { useState, useEffect } from 'react';
import { GlassCard, Button, Input } from '../components/UI';
import { auth, db } from '../services/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Save, Check } from 'lucide-react';
import { StudentProfile } from '../types';

const Profile = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<StudentProfile>({
    uid: '',
    displayName: '',
    email: '',
    branch: '',
    currentSemester: '',
    skills: [],
    bio: '',
    linkedin: '',
    github: ''
  });
  const [skillInput, setSkillInput] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      if (!auth.currentUser) return;
      
      const initProfile = {
        uid: auth.currentUser.uid,
        displayName: auth.currentUser.displayName || 'Student',
        email: auth.currentUser.email || '',
        branch: '',
        currentSemester: '1',
        skills: [],
        bio: '',
        linkedin: '',
        github: ''
      };

      try {
        // Try to get from Firestore
        const docRef = doc(db, "users", auth.currentUser.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data() as StudentProfile;
          // Ensure defaults for older data
          if (!data.currentSemester) data.currentSemester = '1';
          if (!data.skills) data.skills = [];
          setProfile(data);
        } else {
           // New user or not in DB yet
           setProfile(initProfile);
        }
      } catch (error) {
        console.warn("Firestore fetch failed, checking local storage:", error);
        const localData = localStorage.getItem(`profile_${auth.currentUser.uid}`);
        if (localData) {
            setProfile(JSON.parse(localData));
        } else {
            setProfile(initProfile);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (field: keyof StudentProfile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const addSkill = () => {
    if (skillInput && !profile.skills.includes(skillInput)) {
      setProfile(prev => ({ ...prev, skills: [...prev.skills, skillInput] }));
      setSkillInput('');
    }
  };

  const removeSkill = (skill: string) => {
    setProfile(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }));
  };

  const saveProfile = async () => {
    if (!auth.currentUser) return;
    setSaving(true);
    
    // Update local state UID just in case
    const profileToSave = { ...profile, uid: auth.currentUser.uid };
    
    // 1. Save to Local Storage (Backup)
    localStorage.setItem(`profile_${auth.currentUser.uid}`, JSON.stringify(profileToSave));

    // 2. Save to Firestore (Primary Backend)
    try {
      await setDoc(doc(db, "users", auth.currentUser.uid), profileToSave, { merge: true });
      alert("Profile updated in database!");
    } catch (error) {
      console.error("Firestore save error:", error);
      alert("Saved locally (Offline Mode). Changes will sync when online.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-20 text-white">Loading profile...</div>;

  return (
    <div className="space-y-6 pb-10">
      <h1 className="text-3xl font-bold font-display bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-blue-400">
        My Profile
      </h1>
      <p className="text-gray-400">Set up your digital card for the Connection Maker.</p>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column - Form */}
        <div className="lg:col-span-2 space-y-6">
          <GlassCard>
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/10">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-3xl font-bold">
                {profile.displayName ? profile.displayName[0]?.toUpperCase() : '?'}
              </div>
              <div>
                <h3 className="text-xl font-semibold">{auth.currentUser?.email}</h3>
                <p className="text-sm text-gray-400">UID: {auth.currentUser?.uid.slice(0, 8)}...</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Input 
                label="Full Name" 
                value={profile.displayName} 
                onChange={(e) => handleChange('displayName', e.target.value)}
              />
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-200 mb-1">Current Semester</label>
                <select 
                  className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner"
                  value={profile.currentSemester}
                  onChange={(e) => handleChange('currentSemester', e.target.value)}
                >
                  <option value="">Select Semester</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                    <option key={sem} value={sem.toString()}>Semester {sem}</option>
                  ))}
                </select>
              </div>
              <Input 
                label="Branch / Major" 
                value={profile.branch} 
                onChange={(e) => handleChange('branch', e.target.value)}
                placeholder="e.g. Computer Science"
              />
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-200 mb-1">Bio</label>
              <textarea 
                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                placeholder="Tell others about your interests and goals..."
                value={profile.bio}
                onChange={(e) => handleChange('bio', e.target.value)}
              />
            </div>
          </GlassCard>

          <GlassCard>
            <h3 className="text-lg font-semibold mb-4 text-teal-300">Skills & Socials</h3>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-200 mb-2">Skills (Press Enter to add)</label>
              <div className="flex gap-2 mb-3">
                <input 
                  type="text" 
                  className="flex-1 bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white"
                  placeholder="e.g. Java, Public Speaking, Figma"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addSkill()}
                />
                <Button onClick={addSkill} variant="outline" className="py-2">Add</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.skills && profile.skills.map((skill, idx) => (
                  <span key={idx} className="px-3 py-1 bg-teal-500/20 text-teal-200 rounded-full text-sm border border-teal-500/30 flex items-center gap-2">
                    {skill}
                    <button onClick={() => removeSkill(skill)} className="hover:text-white">×</button>
                  </span>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Input 
                label="LinkedIn URL" 
                value={profile.linkedin || ''} 
                onChange={(e) => handleChange('linkedin', e.target.value)}
                placeholder="https://linkedin.com/in/..."
              />
              <Input 
                label="GitHub URL" 
                value={profile.github || ''} 
                onChange={(e) => handleChange('github', e.target.value)}
                placeholder="https://github.com/..."
              />
            </div>
          </GlassCard>

          <div className="flex justify-end">
            <Button onClick={saveProfile} disabled={saving} className="flex items-center gap-2 px-8 py-3 text-lg">
              {saving ? 'Saving...' : <><Save size={20} /> Save Profile</>}
            </Button>
          </div>
        </div>

        {/* Right Column - Preview */}
        <div className="hidden lg:block">
           <div className="sticky top-24">
             <h3 className="text-gray-400 mb-4 text-sm uppercase tracking-wide">Live Preview</h3>
             <GlassCard className="border-t-4 border-t-teal-500 relative">
                <div className="absolute top-4 right-4 text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded border border-green-500/30 flex items-center gap-1">
                  <Check size={10} /> Active
                </div>
                <div className="flex flex-col items-center text-center mb-6">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-700 to-black border-2 border-teal-500 mb-3 flex items-center justify-center text-2xl font-bold">
                    {profile.displayName ? profile.displayName[0]?.toUpperCase() : '?'}
                  </div>
                  <h2 className="text-xl font-bold font-display">{profile.displayName || 'Your Name'}</h2>
                  <p className="text-sm text-teal-300">{profile.branch || 'Branch'} • Semester {profile.currentSemester || '1'}</p>
                </div>
                
                <p className="text-sm text-gray-400 text-center mb-6 italic">
                  "{profile.bio || 'Your bio will appear here...'}"
                </p>

                <div className="flex flex-wrap justify-center gap-2 mb-6">
                  {(profile.skills && profile.skills.length > 0 ? profile.skills : ['Skill 1', 'Skill 2']).slice(0,4).map((skill, i) => (
                    <span key={i} className="text-xs px-2 py-1 bg-white/5 rounded border border-white/10">{skill}</span>
                  ))}
                </div>

                <Button variant="outline" className="w-full text-sm">Connect</Button>
             </GlassCard>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;