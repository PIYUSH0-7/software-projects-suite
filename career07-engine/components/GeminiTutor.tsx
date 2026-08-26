import React, { useState } from 'react';
import { Sparkles, X, Loader2 } from 'lucide-react';
import { explainConcept } from '../services/geminiService';

interface GeminiTutorProps {
  concept: string;
  context: string;
  isOpen: boolean;
  onClose: () => void;
}

const GeminiTutor: React.FC<GeminiTutorProps> = ({ concept, context, isOpen, onClose }) => {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (isOpen && concept) {
      setLoading(true);
      setExplanation(null);
      explainConcept(concept, context)
        .then((text) => setExplanation(text))
        .finally(() => setLoading(false));
    }
  }, [isOpen, concept, context]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-indigo-600 text-white">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            <h3 className="font-semibold text-lg">AI Tutor</h3>
          </div>
          <button onClick={onClose} className="hover:bg-indigo-700 p-1 rounded transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto custom-scroll">
          <h4 className="font-bold text-gray-800 mb-3 text-lg">{concept}</h4>
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
              <Loader2 className="w-8 h-8 animate-spin mb-2 text-indigo-600" />
              <p>Consulting the neural network...</p>
            </div>
          ) : (
            <div className="prose prose-indigo text-gray-600 leading-relaxed whitespace-pre-wrap text-sm">
              {explanation}
            </div>
          )}
        </div>
        
        <div className="p-4 bg-gray-50 border-t border-gray-100 text-xs text-gray-400 text-center">
          Powered by Gemini 2.5 Flash
        </div>
      </div>
    </div>
  );
};

export default GeminiTutor;
