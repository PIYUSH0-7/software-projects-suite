import React from 'react';
import { ResumeData, Education, Internship, Project, Certificate, Extracurricular } from '../types';

// Icons
const PhoneIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 inline-block mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
);
const MailIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 inline-block mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
);
const LinkedinIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 inline-block mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
);
const GithubIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 inline-block mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
);
const GlobeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 inline-block mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
);

interface Props {
  data: ResumeData;
  isCompact?: boolean; // New Prop for 1-Page Fit
}

// LaTeX-like styling classes
const SectionTitle = ({ children, isCompact }: { children?: React.ReactNode, isCompact?: boolean }) => (
  <h2 className={`font-bold border-b border-black uppercase tracking-wide ${isCompact ? 'text-[10pt] mb-1 mt-2' : 'text-[12pt] mb-2 mt-3'}`}>
    {children}
  </h2>
);

const ResumePreview: React.FC<Props> = ({ data, isCompact = false }) => {
  if (!data) return <div className="p-10 text-center">No Data Available</div>;

  // Dynamic Spacing Logic
  const containerPadding = isCompact ? 'p-[12mm] md:p-[12mm]' : 'p-[15mm] md:p-[20mm]';
  const bodyFontSize = isCompact ? 'text-[9pt]' : 'text-[10.5pt]';
  const headerSize = isCompact ? 'text-[20pt]' : 'text-[24pt]';
  const itemMargin = isCompact ? 'mb-2' : 'mb-3';
  const subItemMargin = isCompact ? 'mb-0' : 'mb-1';
  const listPadding = isCompact ? 'pl-0.5 mb-0' : 'pl-1 mb-0.5';

  // Safety helper to ensure we always map over an array
  const safeMap = <T,>(arr: T[] | undefined | null, render: (item: T, index: number) => React.ReactNode) => {
    if (!Array.isArray(arr)) return null;
    return arr.map(render);
  };

  return (
    <div className={`w-[210mm] min-h-[297mm] bg-white text-black ${containerPadding} font-latex shadow-[0_20px_50px_rgba(0,0,0,0.15)] mx-auto leading-snug ${bodyFontSize} box-border transition-all duration-300 origin-top`}>
      
      {/* Header */}
      <div className="text-center mb-4">
        <h1 className={`${headerSize} font-medium tracking-wide mb-1 uppercase`}>{data.fullName || "Your Name"}</h1>
        <p className={`${bodyFontSize} mb-1`}>{data.city}{data.city && data.state ? ', ' : ''}{data.state}</p>
        <div className={`flex flex-wrap justify-center gap-x-4 ${bodyFontSize}`}>
          {data.phone && <span className="flex items-center whitespace-nowrap"><PhoneIcon />{data.phone}</span>}
          {data.email && <span className="flex items-center whitespace-nowrap"><MailIcon />{data.email}</span>}
          {data.linkedin && <span className="flex items-center whitespace-nowrap"><LinkedinIcon />{data.linkedin.replace('https://', '').replace('www.', '')}</span>}
          {data.github && <span className="flex items-center whitespace-nowrap"><GithubIcon />{data.github.replace('https://', '').replace('www.', '')}</span>}
        </div>
        <div className="flex justify-center mt-1">
          {data.portfolio && <span className="flex items-center whitespace-nowrap"><GlobeIcon />{data.portfolio.replace('https://', '').replace('www.', '')}</span>}
        </div>
      </div>

      {/* Education */}
      <SectionTitle isCompact={isCompact}>Education</SectionTitle>
      <div className="mb-2">
        {safeMap<Education>(data.education, (edu, idx) => (
          <div key={idx} className={subItemMargin}>
            <div className="flex justify-between font-bold">
              <span>{edu.degree}</span>
              <span>{edu.startDate ? `${edu.startDate} – ` : ''}{edu.endDate}</span>
            </div>
            <div className="flex justify-between italic">
              <span>{edu.institution}</span>
              <span>{edu.score}</span>
            </div>
            {edu.location && <div className="text-xs text-gray-600">{edu.location}</div>}
          </div>
        ))}
      </div>

      {/* Technical Skills */}
      {(data.technicalSkills?.tools || data.technicalSkills?.skills) && (
        <>
          <SectionTitle isCompact={isCompact}>Technical Skills</SectionTitle>
          <div className="mb-2">
            {data.technicalSkills.tools && <p><span className="font-bold">Developer Tools:</span> {data.technicalSkills.tools}</p>}
            {data.technicalSkills.skills && <p><span className="font-bold">Skills:</span> {data.technicalSkills.skills}</p>}
          </div>
        </>
      )}

      {/* Internships */}
      {Array.isArray(data.internships) && data.internships.length > 0 && (
        <>
          <SectionTitle isCompact={isCompact}>Internships</SectionTitle>
          <div>
            {safeMap<Internship>(data.internships, (intern, idx) => (
              <div key={idx} className={itemMargin}>
                <div className="flex justify-between font-bold">
                  <span>{intern.company}</span>
                  <span>{intern.startDate} – {intern.endDate}</span>
                </div>
                <div className="flex justify-between italic mb-0.5">
                  <span>{intern.role}</span>
                  <span>{intern.location}</span>
                </div>
                <ul className="list-disc list-outside ml-4 pl-1">
                  {safeMap<string>(intern.points, (point, pIdx) => (
                    <li key={pIdx} className={listPadding}>{point}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Projects */}
      {Array.isArray(data.projects) && data.projects.length > 0 && (
        <>
          <SectionTitle isCompact={isCompact}>Projects</SectionTitle>
          <div>
            {safeMap<Project>(data.projects, (proj, idx) => (
              <div key={idx} className={itemMargin}>
                <div className="flex justify-between">
                  <div>
                    <span className="font-bold">{proj.name}</span>
                    {proj.technologies && <span className="ml-1 italic text-gray-800">({proj.technologies})</span>}
                  </div>
                  <span className="font-bold">{proj.startDate}</span>
                </div>
                <ul className="list-disc list-outside ml-4 pl-1">
                   {safeMap<string>(proj.points, (point, pIdx) => (
                    <li key={pIdx} className={listPadding}>{point}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Achievement */}
      {Array.isArray(data.achievements) && data.achievements.length > 0 && (
        <>
          <SectionTitle isCompact={isCompact}>Achievement</SectionTitle>
          <div className="mb-2">
            {safeMap<string>(data.achievements, (ach, idx) => (
              <div key={idx} className={subItemMargin}>
                <p>{ach}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Certificates */}
      {Array.isArray(data.certificates) && data.certificates.length > 0 && (
        <>
          <SectionTitle isCompact={isCompact}>Certificates</SectionTitle>
          <div className="mb-2">
            {safeMap<Certificate>(data.certificates, (cert, idx) => (
              <div key={idx} className={`flex justify-between ${subItemMargin}`}>
                <div>
                  <span className="font-bold">{cert.name}</span>
                  <div className="italic">{cert.issuer}</div>
                </div>
                <span className="font-bold text-right">{cert.date}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Extracurricular */}
      {Array.isArray(data.extracurricular) && data.extracurricular.length > 0 && (
        <>
          <SectionTitle isCompact={isCompact}>Extracurricular</SectionTitle>
          <div>
            {safeMap<Extracurricular>(data.extracurricular, (extra, idx) => (
              <div key={idx} className={itemMargin}>
                <div className="flex justify-between font-bold">
                  <span>{extra.organization}</span>
                  <span>{extra.startDate} – {extra.endDate}</span>
                </div>
                <div className="italic mb-0.5">{extra.role}</div>
                <ul className="list-disc list-outside ml-4 pl-1">
                   {safeMap<string>(extra.points, (point, pIdx) => (
                    <li key={pIdx} className={listPadding}>{point}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}

    </div>
  );
};

export default ResumePreview;