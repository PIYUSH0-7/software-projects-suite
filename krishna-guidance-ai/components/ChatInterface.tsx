
import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, Message, TimetableEntry } from '../types';
import { krishnaService } from '../services/gemini';
import { Send, Sparkles, Bell, Volume2 } from 'lucide-react';

// --- Improved Audio Cue Functions ---

const playChime = () => {
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) return;
  const ctx = new AudioContextClass();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = 'sine';
  osc.frequency.setValueAtTime(880, ctx.currentTime); 
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.5);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 1.5);
};

const playOm = () => {
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) return;
  const ctx = new AudioContextClass();
  const masterGain = ctx.createGain();
  
  masterGain.gain.setValueAtTime(0, ctx.currentTime);
  masterGain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 1.0);
  masterGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 4);

  const harmonics = [136.1, 272.2, 408.3, 544.4]; 
  harmonics.forEach((f, i) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(f, ctx.currentTime);
    g.gain.setValueAtTime(0.04 / (i + 1), ctx.currentTime);
    osc.connect(g);
    g.connect(masterGain);
    osc.start();
    osc.stop(ctx.currentTime + 4);
  });
  
  masterGain.connect(ctx.destination);
};

// --- Animated Krishna Component ---

const KrishnaAvatar = () => (
  <div className="relative w-24 h-24 mx-auto mb-2 group shrink-0">
    <div className="absolute inset-0 bg-amber-400 rounded-full blur-2xl opacity-20 animate-radiance scale-150"></div>
    <div className="relative w-full h-full rounded-full border-2 border-amber-500/60 overflow-hidden bg-slate-900 shadow-[0_0_40px_rgba(251,191,36,0.6)] animate-breathing ring-4 ring-amber-500/10">
      <img 
        src="./IMAGE.png"
        alt="Lord Krishna" 
        className="w-full h-full object-cover scale-[1.7] object-[center_20%] transition-transform duration-1000 group-hover:scale-[1.8]"
      />
      <div className="absolute inset-0 bg-amber-500/0 animate-shimmer pointer-events-none"></div>
    </div>
  </div>
);

// --- Main Interface Component ---

interface ChatInterfaceProps {
  userProfile: UserProfile;
  history: Message[];
  onNewMessage: (msg: Message) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ userProfile, history, onNewMessage }) => {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [streamedText, setStreamedText] = useState('');
  const [upcomingDuty, setUpcomingDuty] = useState<TimetableEntry | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [history, streamedText]);

  useEffect(() => {
    const checkDuty = () => {
      const now = new Date();
      const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
      const found = userProfile.timetable.find(t => {
        const [h, m] = t.time.split(':').map(Number);
        const d = new Date();
        d.setHours(h, m, 0, 0);
        return d > now && d <= nextHour;
      });
      setUpcomingDuty(found || null);
    };
    checkDuty();
    const interval = setInterval(checkDuty, 30000);
    return () => clearInterval(interval);
  }, [userProfile.timetable]);

  useEffect(() => {
    if (history.length === 0) {
      handleInitialGreeting();
    }
  }, []);

  const handleInitialGreeting = async () => {
    setIsTyping(true);
    playOm();
    let fullText = "";
    try {
      const stream = krishnaService.streamResponse(userProfile, [], "Arjuna is present. Command me, Lord.");
      for await (const chunk of stream) {
        fullText += chunk;
        setStreamedText(fullText);
      }
      playChime();
      onNewMessage({ role: 'model', text: fullText, timestamp: Date.now() });
      setStreamedText('');
    } catch (e) { console.error(e); } finally { setIsTyping(false); }
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isTyping) return;
    const userMsg: Message = { role: 'user', text: input, timestamp: Date.now() };
    onNewMessage(userMsg);
    setInput('');
    setIsTyping(true);
    playOm();
    let fullResponse = "";
    try {
      const stream = krishnaService.streamResponse(userProfile, history.concat(userMsg), input);
      for await (const chunk of stream) {
        fullResponse += chunk;
        setStreamedText(fullResponse);
      }
      playChime();
      onNewMessage({ role: 'model', text: fullResponse, timestamp: Date.now() });
      setStreamedText('');
    } catch (e) { console.error(e); } finally { setIsTyping(false); }
  };

  return (
    <div className="flex flex-col flex-1 glass rounded-3xl md:rounded-[2.5rem] shadow-2xl overflow-hidden relative border-amber-500/30 max-h-[85vh] animate-fade-in">
      {/* Presence Header - Made more compact for visibility */}
      <div className="py-4 md:py-6 border-b border-amber-500/20 bg-slate-950/40 text-center shrink-0">
        <KrishnaAvatar />
        <h3 className="font-divine text-amber-500 font-black tracking-[0.3em] uppercase text-[10px] md:text-xs">Sri Bhagavan Uvaca</h3>
        <p className="text-[8px] text-amber-500/40 uppercase font-bold tracking-[0.1em]">The Blessed Lord Spoke</p>
      </div>

      {/* Actionable Duty Reminder */}
      {upcomingDuty && (
        <div className="bg-amber-500/10 px-4 md:px-6 py-2 flex items-center justify-center gap-3 border-b border-amber-500/20 animate-pulse shrink-0">
          <Bell size={14} className="text-amber-500" />
          <span className="text-[9px] md:text-[10px] font-divine uppercase tracking-widest text-amber-100">
            Arjuna, thy duty <span className="text-amber-500 font-bold">"{upcomingDuty.activity}"</span> at {upcomingDuty.time}
          </span>
        </div>
      )}

      {/* Messages Area - Dynamic height */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 md:space-y-8 bg-slate-950/20 scroll-smooth">
        {history.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
            <div className={`max-w-[95%] md:max-w-[85%] rounded-2xl md:rounded-[1.5rem] px-4 md:px-5 py-3 md:py-4 shadow-xl border ${
              msg.role === 'user' 
                ? 'bg-amber-600 text-white rounded-tr-none border-amber-400/30' 
                : 'bg-slate-900/90 text-amber-50 border-amber-500/20 rounded-tl-none font-serif italic'
            }`}>
              {msg.role === 'model' && (
                <div className="flex items-center gap-2 mb-2 pb-1 border-b border-amber-500/10">
                   <Volume2 size={10} className="text-amber-500" />
                   <span className="text-[8px] uppercase font-divine tracking-[0.2em] text-amber-500/60 font-black">Celestial Wisdom</span>
                </div>
              )}
              <div className="whitespace-pre-wrap text-sm leading-relaxed">{msg.text}</div>
            </div>
          </div>
        ))}
        
        {streamedText && (
          <div className="flex justify-start">
            <div className="max-w-[95%] md:max-w-[85%] rounded-2xl md:rounded-[1.5rem] px-4 md:px-5 py-3 md:py-4 bg-slate-900/90 text-amber-50 border border-amber-500/20 shadow-xl rounded-tl-none font-serif italic">
               <div className="flex items-center gap-2 mb-2 pb-1 border-b border-amber-500/10">
                   <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" />
                   <span className="text-[8px] uppercase font-divine tracking-[0.2em] text-amber-500/60 font-black">Speaking...</span>
                </div>
              <div className="whitespace-pre-wrap text-sm leading-relaxed">{streamedText}</div>
            </div>
          </div>
        )}

        {isTyping && !streamedText && (
          <div className="flex justify-start">
            <div className="bg-slate-900/60 px-4 py-2 rounded-full flex gap-2 items-center border border-amber-500/10 shadow-lg">
              <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
              <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
            </div>
          </div>
        )}
      </div>

      {/* Input Form */}
      <div className="p-4 md:p-6 bg-slate-950/60 border-t border-amber-500/20 shrink-0">
        <form onSubmit={handleSend} className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Address the Lord..."
            className="flex-1 bg-slate-900/80 border border-amber-900/20 rounded-full px-6 py-3 text-sm focus:border-amber-500 outline-none transition-all placeholder:text-slate-600"
          />
          <button
            type="submit"
            disabled={isTyping || !input.trim()}
            className="w-12 h-12 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.4)] transition-all disabled:opacity-30 active:scale-95"
          >
            {isTyping ? <Sparkles size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </form>
      </div>

      <style>{`
        @keyframes breathing { 0%, 100% { transform: translateY(0px) scale(1); } 50% { transform: translateY(-5px) scale(1.02); } }
        @keyframes shimmer { 0%, 90%, 100% { background: rgba(0,0,0,0); } 95% { background: rgba(251,191,36,0.1); } }
        @keyframes radiance { 0%, 100% { opacity: 0.2; transform: scale(1.4); } 50% { opacity: 0.5; transform: scale(1.6); } }
        .animate-breathing { animation: breathing 5s ease-in-out infinite; }
        .animate-shimmer { animation: shimmer 6s infinite; }
        .animate-radiance { animation: radiance 4s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default ChatInterface;
