import React from 'react';
import { auth } from '../lib/firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { motion } from 'motion/react';
import { TrendingUp, ShieldCheck, Zap, BarChart3 } from 'lucide-react';

export default function Auth() {
  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login Error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col md:flex-row">
      <div className="flex-1 p-8 md:p-16 flex flex-col justify-center bg-black text-white">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="max-w-md"
        >
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-8">
            <TrendingUp className="text-black w-8 h-8" />
          </div>
          <h1 className="text-5xl font-bold tracking-tight mb-6">Master your money with AI.</h1>
          <p className="text-neutral-400 text-lg mb-12">
            FinAI helps you track investments, manage credit cards, and get personalized financial advice powered by Gemini.
          </p>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <h3 className="font-semibold">AI Insights</h3>
                <p className="text-sm text-neutral-500">Get smart suggestions on debt repayment and investment growth.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold">Real-time Tracking</h3>
                <p className="text-sm text-neutral-500">Monitor your net worth, spending, and credit utilization instantly.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold">Secure & Private</h3>
                <p className="text-sm text-neutral-500">Your financial data is encrypted and protected with industry standards.</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="flex-1 p-8 md:p-16 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-sm border border-neutral-200"
        >
          <h2 className="text-2xl font-bold mb-2">Welcome Back</h2>
          <p className="text-neutral-500 mb-8">Sign in to continue to your dashboard.</p>
          
          <button
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-neutral-300 rounded-xl font-medium hover:bg-neutral-50 transition-colors mb-4"
          >
            <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
            Continue with Google
          </button>
          
          <p className="text-xs text-center text-neutral-400 mt-8">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
