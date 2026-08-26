import React, { useState, useEffect } from 'react';
import ResumeForm from './components/ResumeForm';
import ResumePreview from './components/ResumePreview';
import TutorialModal from './components/TutorialModal';
import AIModal from './components/AIModal';
import ATSModal from './components/ATSModal';
import { ResumeData, INITIAL_RESUME_STATE } from './types';
import { generateDocx } from './services/docxGenerator';
import confetti from 'canvas-confetti';

interface Toast {
  message: string;
  type: 'success' | 'error' | 'info';
  id: number;
}

const App: React.FC = () => {
  const [resumeData, setResumeData] = useState<ResumeData>(INITIAL_RESUME_STATE);
  const [downloadUnlocked, setDownloadUnlocked] = useState(false);
  const [followedLinkedin, setFollowedLinkedin] = useState(false);
  const [followedGithub, setFollowedGithub] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showATSModal, setShowATSModal] = useState(false);
  
  // Layout State
  const [isCompactMode, setIsCompactMode] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(0.8); // Default zoom scale
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Toast State
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Show Toast Helper
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { message, type, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Trigger Confetti Helper
  const triggerConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#9333ea', '#4f46e5', '#2563eb', '#e11d48']
    });
  };

  // Load unlock state and tutorial state from local storage on mount
  useEffect(() => {
    const isUnlocked = localStorage.getItem('resume_builder_unlocked') === 'true';
    if (isUnlocked) {
      setDownloadUnlocked(true);
      setFollowedLinkedin(true);
      setFollowedGithub(true);
    }

    const hasSeenTutorial = localStorage.getItem('has_seen_tutorial');
    if (!hasSeenTutorial) {
      setShowTutorial(true);
    }

    // Set initial zoom based on screen width
    if (window.innerWidth < 768) {
      setZoomLevel(0.55);
    } else if (window.innerWidth < 1024) {
      setZoomLevel(0.7);
    }
  }, []);

  // Unlock logic
  useEffect(() => {
    if (followedLinkedin && followedGithub && !downloadUnlocked) {
      setDownloadUnlocked(true);
      localStorage.setItem('resume_builder_unlocked', 'true');
      triggerConfetti();
      showToast("Downloads Unlocked! 🎉", "success");
    }
  }, [followedLinkedin, followedGithub, downloadUnlocked]);

  const handleCloseTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem('has_seen_tutorial', 'true');
  };

  const handleOpenTutorial = () => {
    setShowTutorial(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadDocx = async () => {
      setIsGenerating(true);
      try {
          await generateDocx(resumeData);
          showToast("DOCX Generated Successfully!", "success");
      } catch (error) {
          console.error("Failed to generate DOCX", error);
          showToast("Failed to generate DOCX. Please try again.", "error");
      } finally {
          setIsGenerating(false);
      }
  };

  const handleReset = () => {
    if (confirm("Are you sure you want to reset all data to the default template? This cannot be undone.")) {
      setResumeData(INITIAL_RESUME_STATE);
      showToast("Data reset to default", "info");
    }
  };

  const handleLinkClick = (platform: 'linkedin' | 'github') => {
    if (platform === 'linkedin') {
      setFollowedLinkedin(true);
      window.open('https://www.linkedin.com/in/piyush070/', '_blank');
    } else {
      setFollowedGithub(true);
      window.open('https://github.com/PIYUSH0-7', '_blank');
    }
  };

  return (
    <div id="app-container" className="flex flex-col h-screen bg-gray-100 font-sans relative">
      {/* Toast Notifications */}
      <div className="fixed top-5 right-5 z-[70] flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div 
            key={toast.id}
            className={`
              pointer-events-auto px-4 py-3 rounded-lg shadow-lg text-white text-sm font-semibold 
              transform transition-all duration-300 animate-slide-in flex items-center gap-2
              ${toast.type === 'success' ? 'bg-green-600' : toast.type === 'error' ? 'bg-red-600' : 'bg-slate-700'}
            `}
          >
             {toast.type === 'success' && <span>✓</span>}
             {toast.type === 'error' && <span>✕</span>}
             {toast.message}
          </div>
        ))}
      </div>

      {/* Modals */}
      {showTutorial && <TutorialModal onClose={handleCloseTutorial} />}
      
      <AIModal 
        isOpen={showAIModal} 
        onClose={() => setShowAIModal(false)}
        currentData={resumeData}
        onImport={(newData) => setResumeData(newData)}
        showToast={showToast}
        triggerConfetti={triggerConfetti}
      />

      <ATSModal
        isOpen={showATSModal}
        onClose={() => setShowATSModal(false)}
        currentData={resumeData}
        onImport={(newData) => setResumeData(newData)}
        showToast={showToast}
        triggerConfetti={triggerConfetti}
      />

      {/* Header / Navbar */}
      <header className="bg-white border-b border-gray-200 text-slate-800 p-3 shadow-sm z-10 no-print flex-shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
             <div className="bg-purple-600 text-white w-10 h-10 flex items-center justify-center rounded-lg font-bold text-xl shadow-md bg-gradient-to-br from-purple-500 to-indigo-600">CV</div>
             <div>
               <h1 className="text-xl font-extrabold tracking-tight text-slate-900">ATS Resume Builder</h1>
               <div className="flex gap-2 items-center text-xs text-slate-500 font-medium">
                  <span>Professional LaTeX Format</span>
                  <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                  <button 
                    onClick={() => setShowATSModal(true)}
                    className="text-indigo-600 hover:text-indigo-800 hover:underline transition-colors"
                  >
                    Check ATS Score
                  </button>
               </div>
             </div>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-3">
             <div className="flex items-center bg-gray-100 rounded-lg p-1 border border-gray-200">
                <button
                  onClick={() => setIsCompactMode(!isCompactMode)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-md transition-all flex items-center gap-1 ${isCompactMode ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-600 hover:bg-gray-200'}`}
                  title="Fit content to 1 Page"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path></svg>
                  Compact
                </button>
                <div className="w-px h-4 bg-gray-300 mx-1"></div>
                <button 
                  onClick={handleReset}
                  className="text-xs font-medium text-slate-600 hover:text-red-600 px-3 py-1.5 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Reset
                </button>
             </div>

            {!downloadUnlocked ? (
              <div className="flex flex-col sm:flex-row items-center gap-3 bg-gradient-to-r from-amber-50 to-orange-50 px-3 py-1.5 rounded-lg border border-amber-200 shadow-sm">
                 <span className="text-xs font-bold text-amber-800 flex items-center gap-1 uppercase tracking-wide">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                    Unlock:
                 </span>
                 <div className="flex gap-2">
                   <button 
                      onClick={() => handleLinkClick('linkedin')}
                      className={`text-xs px-2 py-1 rounded font-semibold transition-all shadow-sm ${followedLinkedin ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
                   >
                     {followedLinkedin ? '✓' : 'LinkedIn'}
                   </button>
                   <button 
                      onClick={() => handleLinkClick('github')}
                      className={`text-xs px-2 py-1 rounded font-semibold transition-all shadow-sm ${followedGithub ? 'bg-green-600 text-white' : 'bg-gray-800 hover:bg-gray-700 text-white'}`}
                   >
                      {followedGithub ? '✓' : 'GitHub'}
                   </button>
                 </div>
              </div>
            ) : (
              <div className="flex gap-2">
                 <button 
                  onClick={handlePrint}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold shadow-md transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2 text-sm"
                  title="Open Print Preview"
                >
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                   PDF
                </button>
                <button 
                  onClick={handleDownloadDocx}
                  disabled={isGenerating}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold shadow-md transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2 text-sm disabled:opacity-70 disabled:cursor-not-allowed"
                  title="Download Editable DOCX"
                >
                  {isGenerating ? (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                  )}
                  {isGenerating ? 'Generating...' : 'DOCX'}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col md:flex-row h-[calc(100vh-64px)] overflow-hidden relative">
        {/* Left: Input Form */}
        <div className="w-full md:w-1/2 lg:w-5/12 xl:w-4/12 flex-1 h-full overflow-y-auto bg-gray-50 border-r border-gray-200 no-print custom-scrollbar z-0">
          <div className="max-w-3xl mx-auto p-4 pb-24">
            <ResumeForm 
              data={resumeData} 
              onChange={setResumeData} 
              onOpenAI={() => setShowAIModal(true)}
            />
          </div>
        </div>

        {/* Right: Live Preview */}
        <div className="w-full md:w-1/2 lg:w-7/12 xl:w-8/12 flex-1 h-full bg-slate-200 overflow-hidden flex flex-col relative z-0 pattern-grid print-container">
          {/* Zoom Controls Overlay */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-30 flex items-center bg-white/90 backdrop-blur shadow-lg rounded-full px-4 py-2 border border-gray-200 gap-4 transition-all hover:bg-white no-print">
              <button onClick={() => setZoomLevel(Math.max(0.4, zoomLevel - 0.1))} className="text-gray-600 hover:text-purple-600 transition-colors" title="Zoom Out">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4"></path></svg>
              </button>
              <span className="text-xs font-bold text-gray-500 w-12 text-center">{Math.round(zoomLevel * 100)}%</span>
              <button onClick={() => setZoomLevel(Math.min(1.5, zoomLevel + 0.1))} className="text-gray-600 hover:text-purple-600 transition-colors" title="Zoom In">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
              </button>
              <div className="w-px h-4 bg-gray-300"></div>
              <button onClick={() => setZoomLevel(0.8)} className="text-xs text-gray-500 hover:text-purple-600 font-medium" title="Reset Zoom">
                  Reset
              </button>
          </div>

          <div className="flex-1 overflow-auto custom-scrollbar p-8 flex justify-center items-start">
             <div 
                className="print-area transition-transform origin-top bg-white relative z-10 shadow-2xl"
                style={{ transform: `scale(${zoomLevel})` }}
             >
                <ResumePreview data={resumeData} isCompact={isCompactMode} />
             </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white text-slate-500 py-3 text-center text-xs no-print border-t border-gray-200 flex-shrink-0 z-20 flex justify-center items-center gap-4">
        <p>
          © {new Date().getFullYear()} Resume Builder. 
          <span className="mx-2 text-slate-300">|</span>
          <a href="https://piyush07-pi.vercel.app/" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:text-purple-700 transition-colors font-semibold">
            Developed by Piyush
          </a>
        </p>
        <button 
          onClick={handleOpenTutorial}
          className="text-slate-500 hover:text-purple-600 underline text-xs transition-colors"
        >
          Tutorial
        </button>
      </footer>
      
      {/* Styles */}
      <style>{`
        /* Pattern Grid */
        .pattern-grid {
          background-color: #f1f5f9;
          background-image: radial-gradient(#cbd5e1 1px, transparent 1px);
          background-size: 24px 24px;
        }

        @keyframes slide-in {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out forwards;
        }
         @keyframes fade-in-up {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
            animation: fade-in-up 0.3s ease-out forwards;
        }

        /* Custom Scrollbar */
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }

        @media print {
            @page {
              margin: 0;
            }
            body {
                background: white;
                margin: 0;
                padding: 0;
            }
            .no-print {
                display: none !important;
            }
            
            body > * {
                display: none;
            }
            
            div#root, div#app-container {
                display: block !important;
                height: auto !important;
                overflow: visible !important;
                background: white !important;
            }

            main {
                display: block !important;
                height: auto !important;
                overflow: visible !important;
            }

            .print-container {
                display: block !important;
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
                width: 100% !important;
                height: auto !important;
                margin: 0 !important;
                padding: 0 !important;
                background: white !important;
                overflow: visible !important;
                z-index: 9999 !important;
            }
            
            .print-container > div {
                overflow: visible !important;
                padding: 0 !important;
            }

            .print-area {
                 transform: none !important;
                 box-shadow: none !important;
                 margin: 0 auto !important;
                 width: 100% !important;
                 min-height: auto !important;
            }
        }
      `}</style>
    </div>
  );
};

export default App;