import React, { useState } from 'react';
import { ResumeData, Education, Internship, Project, Certificate, Extracurricular } from '../types';

interface Props {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
  onOpenAI: () => void; // Trigger AI Modal in parent
}

// Collapsible Section Component
const SectionAccordion = ({ 
  title, 
  children, 
  defaultOpen = false,
  onAdd 
}: { 
  title: string, 
  children?: React.ReactNode, 
  defaultOpen?: boolean,
  onAdd?: () => void
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden mb-5 transition-all hover:shadow-md">
      <div 
        className={`flex justify-between items-center p-4 cursor-pointer transition-colors ${isOpen ? 'bg-gray-50 text-purple-900' : 'bg-white hover:bg-gray-50'}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
           <span className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180 text-purple-600' : 'text-gray-400'}`}>
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
           </span>
           <h3 className={`text-sm font-bold uppercase tracking-wider ${isOpen ? 'text-purple-700' : 'text-gray-700'}`}>{title}</h3>
        </div>
        {onAdd && (
          <button 
            onClick={(e) => { e.stopPropagation(); onAdd(); }} 
            className="text-xs bg-purple-50 text-purple-700 px-3 py-1.5 rounded-full border border-purple-100 hover:bg-purple-600 hover:text-white transition-all font-bold flex items-center gap-1"
          >
            <span>+</span> ADD
          </button>
        )}
      </div>
      {isOpen && (
        <div className="p-5 border-t border-gray-100 bg-white">
          {children}
        </div>
      )}
    </div>
  );
};

const ResumeForm: React.FC<Props> = ({ data, onChange, onOpenAI }) => {
  if (!data) return <div>Loading...</div>;

  const handleChange = (field: keyof ResumeData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  // --- Array Helpers ---
  const getArray = <T,>(section: keyof ResumeData): T[] => {
    const arr = data[section];
    return Array.isArray(arr) ? (arr as unknown as T[]) : [];
  };

  const handleArrayChange = <T,>(
    section: keyof ResumeData,
    index: number,
    field: keyof T,
    value: any
  ) => {
    const arr = [...getArray<T>(section)];
    if (!arr[index]) return;
    arr[index] = { ...arr[index], [field]: value };
    handleChange(section, arr);
  };

  const addItem = (section: keyof ResumeData, template: any) => {
    handleChange(section, [...getArray(section), template]);
  };

  const removeItem = (section: keyof ResumeData, index: number) => {
    const arr = [...getArray(section)];
    arr.splice(index, 1);
    handleChange(section, arr);
  };

  const handlePointsChange = (
    section: 'internships' | 'projects' | 'extracurricular',
    itemIndex: number,
    pointIndex: number,
    value: string
  ) => {
    const arr = [...getArray<any>(section)];
    const item = { ...arr[itemIndex] };
    if (!item) return;
    const newPoints = Array.isArray(item.points) ? [...item.points] : [];
    newPoints[pointIndex] = value;
    item.points = newPoints;
    arr[itemIndex] = item;
    handleChange(section, arr);
  };

  const addPoint = (section: 'internships' | 'projects' | 'extracurricular', itemIndex: number) => {
    const arr = [...getArray<any>(section)];
    const item = { ...arr[itemIndex] };
    if (!item) return;
    item.points = Array.isArray(item.points) ? [...item.points, "New bullet point"] : ["New bullet point"];
    arr[itemIndex] = item;
    handleChange(section, arr);
  };
  
  const removePoint = (section: 'internships' | 'projects' | 'extracurricular', itemIndex: number, pointIndex: number) => {
    const arr = [...getArray<any>(section)];
    const item = { ...arr[itemIndex] };
    if (!item) return;
    const newPoints = Array.isArray(item.points) ? [...item.points] : [];
    newPoints.splice(pointIndex, 1);
    item.points = newPoints;
    arr[itemIndex] = item;
    handleChange(section, arr);
  };

  return (
    <div className="space-y-6">
      {/* Sticky Header */}
      <div className="flex justify-between items-center pb-4 sticky top-0 bg-gray-50 z-20 border-b border-gray-200 mb-6 pt-2">
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Editor</h2>
        <button
          onClick={onOpenAI}
          className="px-4 py-2 rounded-full font-bold text-white text-sm bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 flex items-center gap-2 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
        >
          <span className="text-lg">✨</span> AI Optimize
        </button>
      </div>

      {/* Personal Info */}
      <SectionAccordion title="Personal Information" defaultOpen={true}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="col-span-1 md:col-span-2">
             <label className="label">Full Name</label>
             <input className="input-field" value={data.fullName || ''} onChange={(e) => handleChange('fullName', e.target.value)} />
          </div>
          <div>
            <label className="label">City</label>
            <input className="input-field" value={data.city || ''} onChange={(e) => handleChange('city', e.target.value)} />
          </div>
          <div>
            <label className="label">State</label>
            <input className="input-field" value={data.state || ''} onChange={(e) => handleChange('state', e.target.value)} />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input-field" value={data.phone || ''} onChange={(e) => handleChange('phone', e.target.value)} />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input-field" value={data.email || ''} onChange={(e) => handleChange('email', e.target.value)} />
          </div>
          <div>
            <label className="label">LinkedIn (URL)</label>
            <input className="input-field" value={data.linkedin || ''} onChange={(e) => handleChange('linkedin', e.target.value)} />
          </div>
          <div>
            <label className="label">GitHub (URL)</label>
            <input className="input-field" value={data.github || ''} onChange={(e) => handleChange('github', e.target.value)} />
          </div>
          <div className="col-span-1 md:col-span-2">
            <label className="label">Portfolio (URL)</label>
            <input className="input-field" value={data.portfolio || ''} onChange={(e) => handleChange('portfolio', e.target.value)} />
          </div>
        </div>
      </SectionAccordion>

      {/* Education */}
      <SectionAccordion 
        title="Education" 
        onAdd={() => addItem('education', { institution: '', degree: '', startDate: '', endDate: '', score: '' })}
      >
        {getArray<Education>('education').map((edu, idx) => (
          <div key={idx} className="p-4 bg-gray-50 rounded-lg mb-4 relative group border border-gray-200 shadow-sm transition-shadow hover:shadow-md">
            <button onClick={() => removeItem('education', idx)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 hover:bg-red-50 p-1 rounded-full transition-colors">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            <div className="grid grid-cols-1 gap-3">
              <input className="input-field font-semibold" placeholder="Institution Name" value={edu.institution || ''} onChange={(e) => handleArrayChange<Education>('education', idx, 'institution', e.target.value)} />
              <input className="input-field" placeholder="Degree / Certificate" value={edu.degree || ''} onChange={(e) => handleArrayChange<Education>('education', idx, 'degree', e.target.value)} />
              <div className="flex gap-2">
                 <input className="input-field w-1/3" placeholder="Score/CGPA" value={edu.score || ''} onChange={(e) => handleArrayChange<Education>('education', idx, 'score', e.target.value)} />
                 <input className="input-field w-1/3" placeholder="Start Date" value={edu.startDate || ''} onChange={(e) => handleArrayChange<Education>('education', idx, 'startDate', e.target.value)} />
                 <input className="input-field w-1/3" placeholder="End Date" value={edu.endDate || ''} onChange={(e) => handleArrayChange<Education>('education', idx, 'endDate', e.target.value)} />
              </div>
            </div>
          </div>
        ))}
      </SectionAccordion>

      {/* Skills */}
      <SectionAccordion title="Technical Skills">
        <div className="space-y-4">
          <div>
            <label className="label">Developer Tools (Comma separated)</label>
            <textarea className="input-field min-h-[60px]" value={data.technicalSkills?.tools || ''} onChange={(e) => handleChange('technicalSkills', { ...(data.technicalSkills || {}), tools: e.target.value })} />
          </div>
          <div>
            <label className="label">Skills (Comma separated)</label>
            <textarea className="input-field min-h-[60px]" value={data.technicalSkills?.skills || ''} onChange={(e) => handleChange('technicalSkills', { ...(data.technicalSkills || {}), skills: e.target.value })} />
          </div>
        </div>
      </SectionAccordion>

      {/* Internships */}
      <SectionAccordion 
        title="Internships" 
        onAdd={() => addItem('internships', { company: '', role: '', startDate: '', endDate: '', location: '', points: [''] })}
      >
        {getArray<Internship>('internships').map((intern, idx) => (
          <div key={idx} className="p-4 bg-gray-50 rounded-lg mb-4 relative group border border-gray-200 shadow-sm transition-shadow hover:shadow-md">
            <button onClick={() => removeItem('internships', idx)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 hover:bg-red-50 p-1 rounded-full">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input className="input-field col-span-2 font-semibold" placeholder="Company Name" value={intern.company || ''} onChange={(e) => handleArrayChange<Internship>('internships', idx, 'company', e.target.value)} />
              <input className="input-field" placeholder="Role" value={intern.role || ''} onChange={(e) => handleArrayChange<Internship>('internships', idx, 'role', e.target.value)} />
              <input className="input-field" placeholder="Location" value={intern.location || ''} onChange={(e) => handleArrayChange<Internship>('internships', idx, 'location', e.target.value)} />
              <input className="input-field" placeholder="Start Date" value={intern.startDate || ''} onChange={(e) => handleArrayChange<Internship>('internships', idx, 'startDate', e.target.value)} />
              <input className="input-field" placeholder="End Date" value={intern.endDate || ''} onChange={(e) => handleArrayChange<Internship>('internships', idx, 'endDate', e.target.value)} />
            </div>
            <div className="space-y-2 mt-2 bg-white p-3 rounded border border-gray-100">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Work Done (Bullets)</label>
              {(Array.isArray(intern.points) ? intern.points : []).map((point, pIdx) => (
                <div key={pIdx} className="flex gap-2 items-start">
                  <span className="text-gray-400 mt-2">•</span>
                  <textarea 
                    className="input-field flex-1 text-sm min-h-[40px]" 
                    value={point} 
                    onChange={(e) => handlePointsChange('internships', idx, pIdx, e.target.value)} 
                    rows={1}
                  />
                  <button onClick={() => removePoint('internships', idx, pIdx)} className="text-gray-400 hover:text-red-600 px-1 mt-1 transition-colors">
                     <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>
                </div>
              ))}
              <button onClick={() => addPoint('internships', idx)} className="text-sm text-purple-600 font-bold hover:text-purple-800 mt-1 flex items-center gap-1">
                 <span>+</span> Add Bullet
              </button>
            </div>
          </div>
        ))}
      </SectionAccordion>

       {/* Projects */}
       <SectionAccordion 
          title="Projects" 
          onAdd={() => addItem('projects', { name: '', technologies: '', startDate: '', points: [''] })}
        >
        {getArray<Project>('projects').map((proj, idx) => (
          <div key={idx} className="p-4 bg-gray-50 rounded-lg mb-4 relative group border border-gray-200 shadow-sm transition-shadow hover:shadow-md">
            <button onClick={() => removeItem('projects', idx)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 hover:bg-red-50 p-1 rounded-full">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            <div className="grid grid-cols-1 gap-3 mb-3">
              <input className="input-field font-semibold" placeholder="Project Name" value={proj.name || ''} onChange={(e) => handleArrayChange<Project>('projects', idx, 'name', e.target.value)} />
              <div className="flex gap-3">
                 <input className="input-field flex-1" placeholder="Tech Stack / Subtitle" value={proj.technologies || ''} onChange={(e) => handleArrayChange<Project>('projects', idx, 'technologies', e.target.value)} />
                 <input className="input-field w-1/3" placeholder="Date" value={proj.startDate || ''} onChange={(e) => handleArrayChange<Project>('projects', idx, 'startDate', e.target.value)} />
              </div>
            </div>
            <div className="space-y-2 bg-white p-3 rounded border border-gray-100">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Details (Bullets)</label>
              {(Array.isArray(proj.points) ? proj.points : []).map((point, pIdx) => (
                <div key={pIdx} className="flex gap-2 items-start">
                  <span className="text-gray-400 mt-2">•</span>
                  <textarea 
                    className="input-field flex-1 text-sm min-h-[40px]" 
                    value={point} 
                    onChange={(e) => handlePointsChange('projects', idx, pIdx, e.target.value)} 
                    rows={1}
                  />
                   <button onClick={() => removePoint('projects', idx, pIdx)} className="text-gray-400 hover:text-red-600 px-1 mt-1 transition-colors">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                   </button>
                </div>
              ))}
              <button onClick={() => addPoint('projects', idx)} className="text-sm text-purple-600 font-bold hover:text-purple-800 mt-1 flex items-center gap-1">
                  <span>+</span> Add Bullet
              </button>
            </div>
          </div>
        ))}
      </SectionAccordion>

      {/* Achievements */}
      <SectionAccordion 
        title="Achievements" 
        onAdd={() => addItem('achievements', '')}
      >
         {getArray('achievements').map((ach: any, idx) => (
          <div key={idx} className="flex gap-2 mb-2">
             <input className="input-field" value={ach} onChange={(e) => {
               const arr = [...getArray('achievements')];
               arr[idx] = e.target.value;
               handleChange('achievements', arr);
             }} />
             <button onClick={() => removeItem('achievements', idx)} className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
             </button>
          </div>
         ))}
      </SectionAccordion>

      {/* Certificates */}
      <SectionAccordion 
        title="Certificates" 
        onAdd={() => addItem('certificates', { name: '', issuer: '', date: '' })}
      >
        {getArray<Certificate>('certificates').map((cert, idx) => (
          <div key={idx} className="p-4 bg-gray-50 rounded-lg mb-4 relative border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
             <button onClick={() => removeItem('certificates', idx)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 hover:bg-red-50 p-1 rounded-full">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
             </button>
             <div className="grid grid-cols-1 gap-3">
                <input className="input-field font-semibold" placeholder="Certificate Name" value={cert.name || ''} onChange={(e) => handleArrayChange('certificates', idx, 'name', e.target.value)} />
                <div className="flex gap-3">
                  <input className="input-field flex-1" placeholder="Issuer" value={cert.issuer || ''} onChange={(e) => handleArrayChange('certificates', idx, 'issuer', e.target.value)} />
                  <input className="input-field w-1/3" placeholder="Date" value={cert.date || ''} onChange={(e) => handleArrayChange('certificates', idx, 'date', e.target.value)} />
                </div>
             </div>
          </div>
        ))}
      </SectionAccordion>

      {/* Extracurricular */}
      <SectionAccordion 
        title="Extracurricular" 
        onAdd={() => addItem('extracurricular', { organization: '', role: '', startDate: '', endDate: '', points: [''] })}
      >
        {getArray<Extracurricular>('extracurricular').map((extra, idx) => (
          <div key={idx} className="p-4 bg-gray-50 rounded-lg mb-4 relative border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
             <button onClick={() => removeItem('extracurricular', idx)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 hover:bg-red-50 p-1 rounded-full">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
             </button>
            <div className="grid grid-cols-1 gap-3 mb-3">
              <input className="input-field font-semibold" placeholder="Organization" value={extra.organization || ''} onChange={(e) => handleArrayChange<Extracurricular>('extracurricular', idx, 'organization', e.target.value)} />
              <input className="input-field" placeholder="Role" value={extra.role || ''} onChange={(e) => handleArrayChange<Extracurricular>('extracurricular', idx, 'role', e.target.value)} />
              <div className="flex gap-2">
                <input className="input-field w-1/2" placeholder="Start" value={extra.startDate || ''} onChange={(e) => handleArrayChange<Extracurricular>('extracurricular', idx, 'startDate', e.target.value)} />
                <input className="input-field w-1/2" placeholder="End" value={extra.endDate || ''} onChange={(e) => handleArrayChange<Extracurricular>('extracurricular', idx, 'endDate', e.target.value)} />
              </div>
            </div>
            <div className="space-y-2 bg-white p-3 rounded border border-gray-100">
               <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Details (Bullets)</label>
               {(Array.isArray(extra.points) ? extra.points : []).map((point, pIdx) => (
                <div key={pIdx} className="flex gap-2 items-start">
                  <span className="text-gray-400 mt-2">•</span>
                  <textarea 
                    className="input-field flex-1 text-sm min-h-[40px]" 
                    value={point} 
                    onChange={(e) => handlePointsChange('extracurricular', idx, pIdx, e.target.value)} 
                    rows={1}
                  />
                  <button onClick={() => removePoint('extracurricular', idx, pIdx)} className="text-gray-400 hover:text-red-600 px-1 mt-1 transition-colors">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>
                </div>
              ))}
               <button onClick={() => addPoint('extracurricular', idx)} className="text-sm text-purple-600 font-bold hover:text-purple-800 mt-1 flex items-center gap-1">
                  <span>+</span> Add Bullet
               </button>
            </div>
          </div>
        ))}
      </SectionAccordion>
      
      <style>{`
        .input-field {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #e2e8f0;
          border-radius: 0.5rem;
          font-size: 0.95rem;
          transition: all 0.2s ease-in-out;
          background: #fff;
          color: #334155;
        }
        .input-field:focus {
          outline: none;
          border-color: #9333ea;
          box-shadow: 0 0 0 3px rgba(147, 51, 234, 0.1);
        }
        .input-field::placeholder {
            color: #94a3b8;
        }
        .label {
            display: block;
            font-size: 0.75rem;
            font-weight: 700;
            color: #64748b;
            margin-bottom: 0.35rem;
            text-transform: uppercase;
            letter-spacing: 0.025em;
        }
      `}</style>
    </div>
  );
};

export default ResumeForm;