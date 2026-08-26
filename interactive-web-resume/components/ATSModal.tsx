import React, { useState } from 'react';
import { ResumeData } from '../types';
import { createImprovementPrompt, parseGeminiResponse } from '../services/geminiService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentData: ResumeData;
  onImport: (newData: ResumeData) => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
  triggerConfetti: () => void;
}

const ATSModal: React.FC<Props> = ({ isOpen, onClose, currentData, onImport, showToast, triggerConfetti }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Menu, 2: Input Feedback, 3: Import
  const [feedback, setFeedback] = useState("");
  const [pastedJson, setPastedJson] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const reset = () => {
    setStep(1);
    setFeedback("");
    setPastedJson("");
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleExternalCheck = () => {
    window.open('https://resumeworded.com/score', '_blank');
  };

  const copyPrompt = () => {
    if (!feedback.trim()) {
        setError("Please enter some feedback first.");
        return;
    }
    const prompt = createImprovementPrompt(currentData, feedback);
    navigator.clipboard.writeText(prompt);
    showToast("Improvement Prompt copied! Opening Gemini...", "success");
    window.open("https://gemini.google.com/app", "_blank");
    setStep(3);
  };

  const handleImport = () => {
     try {
        if (!pastedJson.trim()) {
            setError("Please paste the JSON first.");
            return;
        }
        const newData = parseGeminiResponse(pastedJson);
        onImport(newData);
        handleClose();
        triggerConfetti();
        showToast("Resume Improved Successfully! 🚀", "success");
     } catch (e: any) {
        setError(e.message || "Invalid JSON");
     }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[80] p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up">
        {/* Header */}
        <div className="bg-indigo-700 text-white p-4 flex justify-between items-center">
            <h3 className="text-lg font-bold flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                ATS Checker & Improver
            </h3>
            <button onClick={handleClose} className="text-indigo-200 hover:text-white text-2xl leading-none">&times;</button>
        </div>

        <div className="p-6">
            {step === 1 && (
                <div className="space-y-4">
                    <p className="text-gray-600 text-sm">Choose an option to verify and improve your resume's ATS score.</p>
                    
                    <button 
                        onClick={handleExternalCheck}
                        className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
                    >
                        <div className="flex flex-col items-start">
                            <span className="font-bold text-gray-800">1. Check ATS Score (External)</span>
                            <span className="text-xs text-gray-500">Opens ResumeWorded.com to get a score out of 100.</span>
                        </div>
                        <svg className="w-5 h-5 text-gray-400 group-hover:text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                    </button>

                    <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-gray-300"></div>
                        <span className="flex-shrink-0 mx-4 text-gray-400 text-xs font-bold uppercase">Then</span>
                        <div className="flex-grow border-t border-gray-300"></div>
                    </div>

                    <button 
                        onClick={() => setStep(2)}
                        className="w-full flex items-center justify-between p-4 border border-indigo-200 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors group"
                    >
                         <div className="flex flex-col items-start">
                            <span className="font-bold text-indigo-900">2. Fix with AI (Gemini)</span>
                            <span className="text-xs text-indigo-600">Tell AI what's wrong (e.g. "Score is low, add keywords") and fix it instantly.</span>
                        </div>
                        <svg className="w-5 h-5 text-indigo-500 group-hover:text-indigo-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                    </button>
                </div>
            )}

            {step === 2 && (
                <div className="space-y-4 animate-fade-in-up">
                    <h4 className="font-bold text-gray-800">What needs improvement?</h4>
                    <p className="text-xs text-gray-500">Paste the feedback you got from the ATS checker, or describe the problem.</p>
                    <textarea 
                        className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 min-h-[100px]"
                        placeholder='e.g. "My score is 45. I need more action verbs and keywords related to React and Node.js."'
                        value={feedback}
                        onChange={(e) => {
                            setFeedback(e.target.value);
                            setError(null);
                        }}
                    />
                    {error && <p className="text-red-500 text-xs">{error}</p>}
                    <div className="flex gap-2">
                        <button onClick={() => setStep(1)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded">Back</button>
                        <button onClick={copyPrompt} className="flex-1 bg-indigo-600 text-white py-2 rounded font-bold hover:bg-indigo-700">Generate Fix Prompt</button>
                    </div>
                </div>
            )}

             {step === 3 && (
                <div className="space-y-4 animate-fade-in-up">
                     <h4 className="font-bold text-gray-800">Import Improved JSON</h4>
                     <p className="text-xs text-gray-500">Paste the JSON response from Gemini here.</p>
                     <textarea 
                        className="w-full p-3 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-green-500 min-h-[150px]"
                        placeholder='{ "fullName": ... }'
                        value={pastedJson}
                        onChange={(e) => {
                            setPastedJson(e.target.value);
                            setError(null);
                        }}
                    />
                     {error && <p className="text-red-500 text-xs">{error}</p>}
                     <div className="flex gap-2">
                        <button onClick={() => setStep(2)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded">Back</button>
                        <button onClick={handleImport} className="flex-1 bg-green-600 text-white py-2 rounded font-bold hover:bg-green-700">Import Fixes</button>
                    </div>
                </div>
             )}
        </div>
      </div>
    </div>
  );
};

export default ATSModal;