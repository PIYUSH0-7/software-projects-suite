import React, { useState } from 'react';
import { GlassCard, Button, Input } from '../components/UI';
import { auth, googleProvider, signInWithPopup } from '../services/auth';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Globe, AlertCircle, Settings, Copy, Check } from 'lucide-react';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [domainError, setDomainError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      navigate('/');
    } catch (err: any) {
      console.error("Auth Error:", err);
      setError(err.message.replace('Firebase: ', ''));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setError('');
      setDomainError(null);
      setLoading(true);
      console.log("Initiating Google Sign-In on:", window.location.hostname);
      const result = await signInWithPopup(auth, googleProvider);
      console.log("Sign-In Successful:", result.user.email);
      navigate('/');
    } catch (err: any) {
      console.error("Google Sign-In Error:", err);
      
      let errorMessage = "Failed to sign in with Google.";
      
      if (err.code === 'auth/popup-closed-by-user') {
        errorMessage = "Sign-in was cancelled.";
      } else if (err.code === 'auth/popup-blocked') {
        errorMessage = "Popup blocked! Please allow popups for this site.";
      } else if (err.code === 'auth/unauthorized-domain') {
        setDomainError(window.location.hostname);
        setLoading(false);
        return;
      } else if (err.code === 'auth/cancelled-popup-request') {
        errorMessage = "Only one popup request allowed at a time.";
      } else if (err.message) {
        errorMessage = err.message.replace('Firebase: ', '');
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const copyDomain = () => {
    if (domainError) {
      navigator.clipboard.writeText(domainError);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (domainError) {
    return (
       <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gray-900 font-sans p-4">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
               <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
            </div>
            
            <div className="w-full max-w-md relative z-10">
               <GlassCard className="border-t-4 border-t-red-500 shadow-2xl">
                   <div className="text-center mb-6">
                       <div className="inline-block p-3 rounded-full bg-red-500/20 mb-4 shadow-[0_0_20px_rgba(239,68,68,0.3)] border border-red-500/30">
                          <Settings size={40} className="text-red-400" />
                       </div>
                       <h1 className="text-2xl font-bold text-white mb-2">Setup Required</h1>
                       <p className="text-gray-400 text-sm">This domain is not authorized by Firebase.</p>
                   </div>

                   <div className="bg-black/30 rounded-xl p-4 border border-white/10 mb-6 text-left">
                       <div className="flex justify-between items-center mb-2">
                         <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold">Current Domain</p>
                         {copied && <span className="text-xs text-green-400 flex items-center gap-1"><Check size={10} /> Copied</span>}
                       </div>
                       <div className="flex items-center justify-between bg-black/50 p-3 rounded-lg border border-white/5 mb-4 group cursor-pointer hover:border-blue-500/30 transition-colors" onClick={copyDomain}>
                           <code className="text-green-400 font-mono text-sm break-all">{domainError}</code>
                           <button className="text-gray-400 hover:text-white p-1">
                             <Copy size={16}/>
                           </button>
                       </div>
                       <div className="text-xs text-gray-400 leading-relaxed space-y-2">
                          <p>To fix this error:</p>
                          <ol className="list-decimal pl-4 space-y-1 text-gray-300">
                            <li>Go to <strong>Firebase Console</strong></li>
                            <li>Navigate to <strong>Authentication</strong> &gt; <strong>Settings</strong></li>
                            <li>Select <strong>Authorized Domains</strong> tab</li>
                            <li>Click <strong>Add Domain</strong> and paste the domain above.</li>
                          </ol>
                       </div>
                   </div>

                   <div className="flex flex-col gap-3">
                     <a 
                       href="https://console.firebase.google.com/" 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-center text-sm font-bold border border-white/10 transition-all flex items-center justify-center gap-2"
                     >
                        Open Firebase Console
                     </a>
                     <Button onClick={() => setDomainError(null)} className="w-full">
                        I've Added It, Try Again
                     </Button>
                   </div>
               </GlassCard>
            </div>
       </div>
    );
 }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gray-900 font-sans">
       <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>

      <div className="w-full max-w-md p-4 relative z-10">
        <GlassCard className="border-t-4 border-t-blue-500 shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-block p-3 rounded-full bg-blue-500/20 mb-4 shadow-[0_0_20px_rgba(59,130,246,0.3)] border border-blue-500/30">
              <GraduationCap size={40} className="text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold font-display text-white mb-2 tracking-tight">
              {isLogin ? 'Welcome Back' : 'Join Academia07'}
            </h1>
            <p className="text-gray-400">
              {isLogin ? 'Sign in to access your pro portal' : 'Create an account to engineer your future'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            <Input 
              label="Email Address" 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="student@college.edu"
            />
            <Input 
              label="Password" 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="••••••••"
            />
            
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-200 text-sm flex items-start gap-3 animate-fade-in backdrop-blur-sm">
                <AlertCircle size={20} className="mt-0.5 shrink-0 text-red-400" />
                <div className="flex-1">
                   <span className="font-bold block mb-1 text-red-100">Authentication Error</span>
                   <span className="leading-relaxed opacity-90">{error}</span>
                </div>
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full py-3.5 text-base shadow-lg shadow-blue-900/20">
              {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
            </Button>
          </form>

          <div className="my-8 flex items-center gap-3">
             <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent flex-1"></div>
             <span className="text-gray-500 text-xs uppercase tracking-widest font-semibold">Or continue with</span>
             <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent flex-1"></div>
          </div>

          <Button 
            variant="outline" 
            onClick={handleGoogleLogin} 
            disabled={loading} 
            className="w-full py-3.5 bg-white text-gray-900 hover:bg-gray-100 hover:text-gray-900 border-none font-bold flex items-center justify-center gap-3 transition-transform hover:scale-[1.02]"
          >
            <Globe size={20} className="text-blue-600" />
            Sign in with Google
          </Button>

          <div className="mt-8 text-center">
            <button 
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-gray-400 hover:text-white text-sm transition-colors hover:underline underline-offset-4"
            >
              {isLogin ? "Don't have an account? Register Now" : "Already have an account? Login"}
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default Auth;