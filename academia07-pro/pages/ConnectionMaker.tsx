import React, { useState, useEffect } from 'react';
import { GlassCard, Button } from '../components/UI';
import { Search, Briefcase, Linkedin, Github, Mail, UserPlus, Code2 } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db, auth } from '../services/auth';
import { StudentProfile } from '../types';

// Mock data for fallback
const MOCK_PROFILES: StudentProfile[] = [
  {
    uid: '1',
    displayName: 'Rahul Sharma',
    email: 'rahul@college.edu',
    branch: 'Computer Science',
    currentSemester: '7',
    skills: ['React', 'Node.js', 'Python'],
    bio: 'Full stack developer looking for hackathon teammates.',
    linkedin: '#',
    github: '#'
  },
  {
    uid: '2',
    displayName: 'Priya Patel',
    email: 'priya@college.edu',
    branch: 'Electronics',
    currentSemester: '5',
    skills: ['IoT', 'Arduino', 'C++'],
    bio: 'Embedded systems enthusiast.',
    linkedin: '#',
    github: '#'
  },
  {
    uid: '3',
    displayName: 'Amit Singh',
    email: 'amit@college.edu',
    branch: 'Mechanical',
    currentSemester: '7',
    skills: ['AutoCAD', 'SolidWorks', 'Matlab'],
    bio: 'Designing the future of mobility.',
    linkedin: '#'
  }
];

const ConnectionMaker = () => {
  const [profiles, setProfiles] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "users"));
        const fetchedProfiles: StudentProfile[] = [];
        
        querySnapshot.forEach((doc) => {
          // Do not include the current user in the list
          if (doc.id !== auth.currentUser?.uid) {
            const data = doc.data() as StudentProfile;
            // Only include profiles that have at least a name setup
            if (data.displayName) {
                fetchedProfiles.push(data);
            }
          }
        });
        
        // If Firestore is empty (new app), show mock data to demonstrate UI
        if (fetchedProfiles.length === 0) {
           console.log("No other users found in DB, using mocks for demo.");
           setProfiles(MOCK_PROFILES);
        } else {
           setProfiles(fetchedProfiles);
        }
      } catch (error) {
        console.error("Error fetching profiles:", error);
        // Fallback to mock data on error (e.g. offline or permission issues)
        setProfiles(MOCK_PROFILES); 
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, []);

  const filteredProfiles = profiles.filter(profile => {
    const matchesSearch = 
      (profile.displayName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (profile.skills || []).some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = filter === 'All' || profile.branch === filter;

    return matchesSearch && matchesFilter;
  });

  // Extract unique branches safely
  const uniqueBranches = ['All', ...Array.from(new Set(profiles.map(p => p.branch).filter(b => b && b.trim() !== '')))];

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-red-400">
            Connection Maker
          </h1>
          <p className="text-gray-400">Find peers with similar interests and build your network.</p>
        </div>
        
        <div className="flex gap-2">
           <GlassCard className="px-4 py-2 flex items-center gap-2 !p-2 !rounded-full">
             <div className="bg-green-500 w-2 h-2 rounded-full animate-pulse"></div>
             <span className="text-sm font-medium">{profiles.length > 0 ? profiles.length : 124} Students Online</span>
           </GlassCard>
        </div>
      </div>

      {/* Search and Filters */}
      <GlassCard className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Search by name or skill (e.g. 'React', 'Robotics')" 
              className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            {uniqueBranches.map(branch => (
              <button
                key={branch}
                onClick={() => setFilter(branch)}
                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  filter === branch 
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25' 
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                {branch}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Profiles Grid */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
           {[1,2,3].map(i => (
             <GlassCard key={i} className="h-64 animate-pulse flex flex-col justify-between">
               <div className="h-4 bg-white/10 rounded w-1/2"></div>
               <div className="space-y-2">
                 <div className="h-3 bg-white/10 rounded w-full"></div>
                 <div className="h-3 bg-white/10 rounded w-2/3"></div>
               </div>
             </GlassCard>
           ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProfiles.map((profile, idx) => (
            <GlassCard key={idx} className="group relative overflow-hidden transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-orange-500/10 border-t-2 border-t-transparent hover:border-t-orange-500">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-xl font-bold border border-white/20 overflow-hidden">
                    {profile.avatar ? (
                      <img src={profile.avatar} alt={profile.displayName} className="w-full h-full object-cover" />
                    ) : (
                      <span>{profile.displayName ? profile.displayName[0].toUpperCase() : 'U'}</span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{profile.displayName || 'Anonymous'}</h3>
                    <p className="text-xs text-orange-300 flex items-center gap-1">
                      <Briefcase size={12} /> {profile.branch || 'Student'} • {profile.currentSemester ? `Sem ${profile.currentSemester}` : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-400 line-clamp-2 min-h-[40px]">
                  {profile.bio || "No bio added yet."}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {(profile.skills || []).slice(0, 3).map((skill, sIdx) => (
                  <span key={sIdx} className="text-xs px-2 py-1 rounded bg-white/5 border border-white/10 flex items-center gap-1">
                    <Code2 size={10} /> {skill}
                  </span>
                ))}
                {(profile.skills || []).length > 3 && (
                   <span className="text-xs px-2 py-1 rounded bg-white/5 text-gray-500">+{profile.skills.length - 3}</span>
                )}
                {(profile.skills || []).length === 0 && (
                   <span className="text-xs px-2 py-1 rounded bg-white/5 text-gray-500 italic">No skills listed</span>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <div className="flex gap-2">
                  {profile.linkedin && (
                    <a href={profile.linkedin} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-blue-400 transition-colors">
                      <Linkedin size={18} />
                    </a>
                  )}
                  {profile.github && (
                    <a href={profile.github} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-white transition-colors">
                      <Github size={18} />
                    </a>
                  )}
                  <a href={`mailto:${profile.email}`} className="text-gray-400 hover:text-red-400 transition-colors">
                    <Mail size={18} />
                  </a>
                </div>
                
                <Button variant="outline" className="text-xs py-1 px-3 hover:bg-orange-500 hover:border-orange-500">
                  Connect
                </Button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
      
      {filteredProfiles.length === 0 && !loading && (
        <div className="text-center py-20 opacity-50">
          <UserPlus size={48} className="mx-auto mb-4" />
          <p>No students found matching criteria.</p>
        </div>
      )}
    </div>
  );
};

export default ConnectionMaker;