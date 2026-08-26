import React, { useState, useRef, useEffect } from 'react';
import { getFinancialAdvice } from '../services/geminiService';
import { CreditCard, Investment, Debt, Transaction, Plan } from '../types';
import ReactMarkdown from 'react-markdown';
import { Send, Bot, User, Sparkles, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

interface AIAssistantProps {
  data: {
    creditCards: CreditCard[];
    investments: Investment[];
    debts: Debt[];
    transactions: Transaction[];
    plans: Plan[];
  };
}

export default function AIAssistant({ data }: AIAssistantProps) {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([
    { role: 'assistant', content: "Hello! I'm your FinAI Assistant. I've analyzed your financial data. How can I help you today? I can suggest bill payment strategies, investment advice, or help you with budgeting." }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsTyping(true);

    try {
      const advice = await getFinancialAdvice(data, userMsg);
      setMessages(prev => [...prev, { role: 'assistant', content: advice || "I'm sorry, I couldn't process that request." }]);
    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error. Please try again later." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-sm">FinAI Assistant</h3>
            <p className="text-[10px] text-green-600 font-bold uppercase tracking-wider">Powered by Gemini</p>
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'assistant' ? 'bg-neutral-100' : 'bg-black'}`}>
              {msg.role === 'assistant' ? <Bot className="w-4 h-4 text-neutral-600" /> : <User className="w-4 h-4 text-white" />}
            </div>
            <div className={`max-w-[80%] p-4 rounded-2xl text-sm ${msg.role === 'assistant' ? 'bg-neutral-50 text-neutral-800' : 'bg-black text-white'}`}>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            </div>
          </motion.div>
        ))}
        {isTyping && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center">
              <Bot className="w-4 h-4 text-neutral-600" />
            </div>
            <div className="bg-neutral-50 p-4 rounded-2xl flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />
              <span className="text-xs text-neutral-400 font-medium">Assistant is thinking...</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-neutral-100 bg-neutral-50/50">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Ask anything about your finances..."
            className="w-full pl-4 pr-12 py-3 bg-white border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 shadow-sm"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
          />
          <button 
            onClick={handleSend}
            disabled={isTyping || !input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black text-white rounded-lg hover:bg-neutral-800 disabled:bg-neutral-300 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
