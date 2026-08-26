import React, { useState } from 'react';

interface Props {
  onClose: () => void;
}

const TutorialModal: React.FC<Props> = ({ onClose }) => {
  const [step, setStep] = useState(1);

  const steps = [
    {
      title: "Welcome to ATS Resume Builder",
      content: "Create professional, ATS-friendly resumes in minutes using our LaTeX-style templates and AI optimization.",
      icon: "👋"
    },
    {
      title: "The Editor",
      content: "Fill in your details on the left panel. We use 'Collapsible' sections (Accordions) to keep the form clean and organized.",
      icon: "📝"
    },
    {
      title: "AI Power (Easy Mode)",
      content: "Struggling to write bullet points? Click '✨ AI Optimize' to paste raw text (like your LinkedIn summary), and let AI rewrite it into a perfect resume.",
      icon: "🤖"
    },
    {
      title: "Preview & Export",
      content: "See live updates on the right. When ready, use 'Print / PDF' for a polished PDF or 'Word (DOCX)' for an editable file.",
      icon: "📄"
    }
  ];

  const handleNext = () => {
    if (step < steps.length) setStep(step + 1);
    else onClose();
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60] p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-fade-in-up">
        {/* Header with progress */}
        <div className="bg-gradient-to-r from-purple-700 to-indigo-700 p-6 text-white text-center relative">
          <div className="text-4xl mb-3">{steps[step - 1].icon}</div>
          <h2 className="text-2xl font-bold">{steps[step - 1].title}</h2>
          <div className="flex justify-center mt-4 gap-2">
            {steps.map((_, i) => (
              <div 
                key={i} 
                className={`h-1.5 rounded-full transition-all duration-300 ${i + 1 === step ? 'w-8 bg-white' : 'w-2 bg-white/40'}`}
              ></div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-8 text-center min-h-[160px] flex items-center justify-center">
          <p className="text-gray-600 text-lg leading-relaxed">{steps[step - 1].content}</p>
        </div>

        {/* Footer Buttons */}
        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-between">
          <button 
            onClick={handleBack} 
            disabled={step === 1}
            className={`px-4 py-2 font-medium rounded-lg transition-colors ${step === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-200'}`}
          >
            Back
          </button>
          
          <button 
            onClick={handleNext}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg shadow-md transition-transform transform active:scale-95"
          >
            {step === steps.length ? "Get Started" : "Next"}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        .animate-fade-in {
            animation: fade-in 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default TutorialModal;