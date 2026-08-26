import React, { useState } from 'react';
import { ResumeData } from '../types';
import { createGeminiPrompt, createRawDataPrompt, parseGeminiResponse } from '../services/geminiService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentData: ResumeData;
  onImport: (newData: ResumeData) => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
  triggerConfetti: () => void;
}

const AIModal: React.FC<Props> = ({ isOpen, onClose, currentData, onImport, showToast, triggerConfetti }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [targetRole, setTargetRole] = useState("");
  const [rawData, setRawData] = useState("");
  const [easyEducation, setEasyEducation] = useState("");
  const [easySkills, setEasySkills] = useState("");
  const [pastedJson, setPastedJson] = useState("");
  const [importError, setImportError] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetState = () => {
    setStep(1);
    setTargetRole("");
    setRawData("");
    setEasyEducation("");
    setEasySkills("");
    setPastedJson("");
    setImportError(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const copyPromptToClipboard = () => {
    let prompt = "";
    if (targetRole.trim()) {
      // Use the "Easy Mode" prompt
      prompt = createRawDataPrompt(targetRole, rawData, easyEducation, easySkills);
    } else {
      // Fallback to existing data prompt if fields are empty (Advanced user flow)
      prompt = createGeminiPrompt(currentData);
    }
    
    navigator.clipboard.writeText(prompt);
    showToast("Prompt copied! Opening Gemini...", "success");
    window.open("https://gemini.google.com/app", "_blank");
    setStep(3); // Move to import step
  };

  const handleImport = () => {
    try {
      if (!pastedJson.trim()) {
        setImportError("Please paste the JSON content first.");
        return;
      }
      const newData = parseGeminiResponse(pastedJson);
      onImport(newData);
      handleClose(); // Close and reset
      triggerConfetti();
      showToast("Resume updated! 200% ATS Optimized. 🎉", "success");
    } catch (e: any) {
      setImportError(e.message || "Invalid JSON format.");
      showToast(e.message || "Invalid JSON", "error");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[80] p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in-up">
        {/* Modal Header */}
        <div className="bg-purple-700 text-white p-4 flex justify-between items-center flex-shrink-0">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            AI Optimization Wizard
          </h3>
          <button onClick={handleClose} className="text-purple-200 hover:text-white text-2xl leading-none">&times;</button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Progress Steps */}
          <div className="flex justify-between items-center mb-4 px-8 relative">
              <div className="absolute left-0 right-0 top-1/2 h-1 bg-gray-200 -z-10"></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= 1 ? 'bg-purple-600 text-white' : 'bg-gray-300 text-gray-500'}`}>1</div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= 2 ? 'bg-purple-600 text-white' : 'bg-gray-300 text-gray-500'}`}>2</div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= 3 ? 'bg-purple-600 text-white' : 'bg-gray-300 text-gray-500'}`}>3</div>
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <h4 className="font-bold text-xl text-gray-800">Easy Input: Tell us about you</h4>
              <p className="text-sm text-gray-600">Fill in the simple fields below. Don't worry about formatting!</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="label">Target Job Role <span className="text-red-500">*</span></label>
                  <input 
                    className="input-field" 
                    placeholder="e.g. Senior Software Engineer"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                  />
                </div>
                
                <div>
                    <label className="label">Education / Degree</label>
                    <input 
                      className="input-field" 
                      placeholder="e.g. B.Tech in CS, MIT"
                      value={easyEducation}
                      onChange={(e) => setEasyEducation(e.target.value)}
                    />
                </div>

                <div>
                    <label className="label">Top Skills (Comma sep)</label>
                    <input 
                      className="input-field" 
                      placeholder="e.g. React, Python, AWS"
                      value={easySkills}
                      onChange={(e) => setEasySkills(e.target.value)}
                    />
                </div>
              </div>

              <div>
                <label className="label">Rough Notes / Projects / Experience <span className="text-red-500">*</span></label>
                <textarea 
                  className="input-field min-h-[150px]"
                  placeholder="Paste your LinkedIn summary, rough bullet points, project details, or old resume text here. e.g. 'I worked at X company from 2020-2022 doing React. I built a todo app using Node.js...'"
                  value={rawData}
                  onChange={(e) => setRawData(e.target.value)}
                />
              </div>
              
              <div className="bg-blue-50 p-3 rounded text-sm text-blue-700">
                  💡 <strong>Tip:</strong> The more details you provide about metrics (e.g., "Increased sales by 20%"), the better the AI can optimize.
              </div>

              <button 
                onClick={() => setStep(2)}
                disabled={!targetRole || !rawData}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next: Generate AI Prompt
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-fade-in-up">
              <h4 className="font-bold text-xl text-gray-800">Generate & Copy</h4>
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 text-center">
                <p className="text-purple-900 mb-4 font-medium">We've created a "Super Prompt" based on your rough inputs.</p>
                <button 
                  onClick={copyPromptToClipboard}
                  className="w-full py-3 bg-white border-2 border-purple-600 text-purple-700 font-bold rounded-lg hover:bg-purple-50 transition-colors flex justify-center items-center gap-2 shadow-sm"
                >
                  <span>📋 Copy Prompt & Open Gemini</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                </button>
              </div>
              <p className="text-xs text-gray-500 text-center mt-2">Clicking this copies the prompt and opens Gemini in a new tab.</p>
                <button onClick={() => setStep(1)} className="text-sm text-gray-500 underline text-center w-full block">Back to Edit Input</button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-fade-in-up">
              <h4 className="font-bold text-xl text-gray-800">Import Optimized JSON</h4>
              <p className="text-sm text-gray-600">
                Paste the JSON code block provided by Gemini below.
              </p>
              <textarea
                value={pastedJson}
                onChange={(e) => {
                  setPastedJson(e.target.value);
                  setImportError(null);
                }}
                placeholder='Paste the JSON here... e.g. { "fullName": "..." }'
                className="w-full h-40 p-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              ></textarea>
              {importError && (
                <p className="text-red-600 text-sm mt-2 font-medium bg-red-50 p-2 rounded">⚠️ {importError}</p>
              )}
              
                <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setStep(2)}
                  className="flex-1 px-4 py-2 text-gray-600 font-semibold hover:bg-gray-200 rounded-lg border border-gray-300"
                >
                  Back
                </button>
                <button 
                  onClick={handleImport}
                  className="flex-1 px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-md transition-transform transform active:scale-95"
                >
                  Import & Finish
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
      <style>{`
        .input-field {
          width: 100%;
          padding: 0.6rem;
          border: 1px solid #e2e8f0;
          border-radius: 0.5rem;
          font-size: 0.9rem;
          transition: all 0.2s;
          background: #fff;
          color: #1e293b;
        }
        .input-field:focus {
          outline: none;
          border-color: #9333ea;
          box-shadow: 0 0 0 3px rgba(147, 51, 234, 0.1);
        }
        .label {
            display: block;
            font-size: 0.75rem;
            font-weight: 600;
            color: #64748b;
            margin-bottom: 0.25rem;
            text-transform: uppercase;
        }
        @keyframes fade-in-up {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
            animation: fade-in-up 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default AIModal;