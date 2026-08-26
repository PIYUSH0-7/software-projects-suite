import React, { useState } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { SavingEntry, BorrowingEntry } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { Plus, Trash2, TrendingUp, Wallet, Target, Sparkles, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

interface OneCrTrackerProps {
  savings: SavingEntry[];
  borrowings: BorrowingEntry[];
}

const ONE_CR = 10000000;

export default function OneCrTracker({ savings, borrowings }: OneCrTrackerProps) {
  const [isAddingSaving, setIsAddingSaving] = useState(false);
  const [isAddingBorrowing, setIsAddingBorrowing] = useState(false);
  const [retirementYear, setRetirementYear] = useState(new Date().getFullYear() + 20);
  
  const [newSaving, setNewSaving] = useState({ amount: 0, source: '', date: new Date().toISOString().split('T')[0], growthRate: 7 });
  const [newBorrowing, setNewBorrowing] = useState({ amount: 0, source: '', date: new Date().toISOString().split('T')[0], growthRate: 12 });

  const currentYear = new Date().getFullYear();
  const yearsToRetire = Math.max(0, retirementYear - currentYear);

  // Future Value calculation: FV = PV * (1 + r)^n
  const calculateFutureValue = (amount: number, rate: number, years: number) => {
    return amount * Math.pow(1 + (rate / 100), years);
  };

  const totalSaved = savings.reduce((sum, s) => sum + s.amount, 0);
  const totalBorrowed = borrowings.reduce((sum, b) => sum + b.amount, 0);
  
  const futureSaved = savings.reduce((sum, s) => {
    const rate = s.growthRate || 0;
    return sum + calculateFutureValue(s.amount, rate, yearsToRetire);
  }, 0);

  const futureBorrowed = borrowings.reduce((sum, b) => {
    const rate = b.growthRate || 0;
    return sum + calculateFutureValue(b.amount, rate, yearsToRetire);
  }, 0);

  const netWorth = totalSaved - totalBorrowed;
  const futureNetWorth = futureSaved - futureBorrowed;
  
  // Difference from 1CR = (1CR + WHAT I BORROWED VALUE WITH GROWTH) - WHAT I SAVED WITH GROWTH
  const differenceFrom1Cr = (ONE_CR + futureBorrowed) - futureSaved;
  const progressPercent = Math.min((futureNetWorth / ONE_CR) * 100, 100);
  const isGoalReached = futureNetWorth >= ONE_CR;

  const handleAddSaving = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    try {
      await addDoc(collection(db, 'savings'), {
        ...newSaving,
        uid: auth.currentUser.uid,
        createdAt: new Date().toISOString()
      });
      setIsAddingSaving(false);
      setNewSaving({ amount: 0, source: '', date: new Date().toISOString().split('T')[0], growthRate: 7 });
    } catch (error) {
      console.error("Error adding saving:", error);
    }
  };

  const handleAddBorrowing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    try {
      await addDoc(collection(db, 'borrowings'), {
        ...newBorrowing,
        uid: auth.currentUser.uid,
        createdAt: new Date().toISOString()
      });
      setIsAddingBorrowing(false);
      setNewBorrowing({ amount: 0, source: '', date: new Date().toISOString().split('T')[0], growthRate: 12 });
    } catch (error) {
      console.error("Error adding borrowing:", error);
    }
  };

  const handleDelete = async (collectionName: string, id: string) => {
    try {
      await deleteDoc(doc(db, collectionName, id));
    } catch (error) {
      console.error(`Error deleting from ${collectionName}:`, error);
    }
  };

  const getMotivationalMessage = () => {
    if (isGoalReached) return {
      text: "LEGENDARY! You are projected to hit the 1 Crore mark by your retirement year. Keep this momentum!",
      color: "text-green-400",
      bg: "bg-green-500/10",
      serious: false
    };
    if (differenceFrom1Cr < 2500000) return {
      text: "SO CLOSE! You're almost there. A little more discipline and you'll be a Crorepati!",
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      serious: false
    };
    if (differenceFrom1Cr < 7500000) return {
      text: "YOU'RE ON THE PATH. It's time to increase your savings or reduce your high-interest debt to speed up.",
      color: "text-yellow-400",
      bg: "bg-yellow-500/10",
      serious: false
    };
    if (differenceFrom1Cr > 15000000) return {
      text: "CRITICAL WARNING! Your projected debt and low savings are leading you away from your goal. ACT NOW!",
      color: "text-red-500 font-black animate-pulse",
      bg: "bg-red-600/20",
      serious: true
    };
    return {
      text: "WAKE UP! The gap is massive. You need to get serious about your savings and growth rates NOW.",
      color: "text-red-400 font-bold",
      bg: "bg-red-500/10",
      serious: true
    };
  };

  const motivation = getMotivationalMessage();

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Simulation Controls */}
      <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-neutral-900 uppercase tracking-tight">Retirement Simulation</h4>
          <p className="text-xs text-neutral-500">Project your wealth based on your target retirement year.</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-neutral-400 uppercase">Retire Year:</label>
          <input 
            type="number" 
            min={currentYear}
            max={currentYear + 50}
            value={retirementYear}
            onChange={(e) => setRetirementYear(Number(e.target.value))}
            className="w-24 px-3 py-2 rounded-lg border border-neutral-200 text-sm font-bold focus:ring-2 focus:ring-black outline-none"
          />
          <span className="text-xs font-medium text-neutral-500">({yearsToRetire} years)</span>
        </div>
      </div>

      {/* 1CR Progress Visual */}
      <div className={cn(
        "relative rounded-3xl p-8 md:p-12 overflow-hidden shadow-2xl transition-all duration-500",
        motivation.serious ? "bg-red-950 ring-4 ring-red-500/30" : "bg-black"
      )}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full -ml-32 -mb-32 blur-3xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-white/70 text-xs font-bold uppercase tracking-widest mb-4">
              <Target className="w-3 h-3" />
              The 1 Crore Mission (Projected)
            </div>
            <h3 className="text-4xl md:text-6xl font-black text-white mb-2 tracking-tighter italic">
              {isGoalReached ? "GOAL REACHED!" : "ROAD TO 1CR"}
            </h3>
            <div className={cn("inline-block px-4 py-2 rounded-xl text-sm mb-4", motivation.bg, motivation.color)}>
              {motivation.text}
            </div>
          </div>

          <div className="w-full md:w-auto flex flex-col items-center md:items-end gap-2">
            <div className="text-right">
              <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Gap to 1CR in {retirementYear}</p>
              <p className="text-4xl font-black text-white tracking-tighter">
                {formatCurrency(Math.max(0, differenceFrom1Cr))}
              </p>
            </div>
            <div className="w-full md:w-64 h-3 bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(0, progressPercent)}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className={cn(
                  "h-full shadow-[0_0_20px_rgba(255,255,255,0.5)]",
                  motivation.serious ? "bg-red-500" : "bg-white"
                )}
              />
            </div>
            <p className="text-white/60 text-xs font-bold">{Math.max(0, progressPercent).toFixed(2)}% Completed</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Summary Cards */}
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Projected Assets</span>
          </div>
          <div>
            <p className="text-xs text-neutral-500 font-medium">Saved + Growth</p>
            <p className="text-2xl font-black text-neutral-900 tracking-tight">{formatCurrency(futureSaved)}</p>
            <p className="text-[10px] text-neutral-400 mt-1">Current: {formatCurrency(totalSaved)}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
              <Wallet className="w-5 h-5 text-red-600" />
            </div>
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Projected Liabilities</span>
          </div>
          <div>
            <p className="text-xs text-neutral-500 font-medium">Borrowed + Interest</p>
            <p className="text-2xl font-black text-neutral-900 tracking-tight">{formatCurrency(futureBorrowed)}</p>
            <p className="text-[10px] text-neutral-400 mt-1">Current: {formatCurrency(totalBorrowed)}</p>
          </div>
        </div>

        <div className="bg-black p-6 rounded-2xl shadow-xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Projected Net Worth</span>
          </div>
          <div className="relative z-10">
            <p className="text-xs text-white/60 font-medium">Standing in {retirementYear}</p>
            <p className="text-2xl font-black text-white tracking-tight">{formatCurrency(futureNetWorth)}</p>
            <p className="text-[10px] text-white/40 mt-1">Current: {formatCurrency(netWorth)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Savings Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-black italic tracking-tight flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              SAVINGS LOG
            </h4>
            <button 
              onClick={() => setIsAddingSaving(!isAddingSaving)}
              className="p-2 bg-neutral-100 hover:bg-black hover:text-white rounded-full transition-all"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {isAddingSaving && (
            <motion.form 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleAddSaving}
              className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase">Amount</label>
                  <input 
                    required
                    type="number" 
                    className="w-full px-3 py-2 rounded-lg border border-neutral-200 text-sm"
                    value={newSaving.amount || ''}
                    onChange={e => setNewSaving({...newSaving, amount: Number(e.target.value)})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase">Growth Rate (% PA)</label>
                  <input 
                    required
                    type="number" 
                    step="0.1"
                    className="w-full px-3 py-2 rounded-lg border border-neutral-200 text-sm"
                    value={newSaving.growthRate}
                    onChange={e => setNewSaving({...newSaving, growthRate: Number(e.target.value)})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase">Date</label>
                  <input 
                    required
                    type="date" 
                    className="w-full px-3 py-2 rounded-lg border border-neutral-200 text-sm"
                    value={newSaving.date}
                    onChange={e => setNewSaving({...newSaving, date: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase">Source</label>
                  <input 
                    required
                    type="text" 
                    placeholder="e.g. Salary, Bonus"
                    className="w-full px-3 py-2 rounded-lg border border-neutral-200 text-sm"
                    value={newSaving.source}
                    onChange={e => setNewSaving({...newSaving, source: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  type="submit"
                  className="flex-1 py-2 bg-black text-white rounded-lg text-xs font-bold uppercase tracking-wider"
                >
                  Add Saving
                </button>
                <button 
                  type="button"
                  onClick={() => setIsAddingSaving(false)}
                  className="px-4 py-2 bg-neutral-200 text-neutral-600 rounded-lg text-xs font-bold uppercase tracking-wider"
                >
                  Cancel
                </button>
              </div>
            </motion.form>
          )}

          <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
            <div className="divide-y divide-neutral-100">
              {savings.length === 0 ? (
                <div className="p-8 text-center text-neutral-400 italic text-sm">No savings logged yet. Start your journey!</div>
              ) : (
                savings.map(s => (
                  <div key={s.id} className="p-4 flex items-center justify-between hover:bg-neutral-50 group">
                    <div>
                      <p className="font-bold text-sm">{s.source}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-[10px] text-neutral-400">{new Date(s.date).toLocaleDateString()}</p>
                        <span className="text-[10px] font-bold text-green-600 bg-green-50 px-1.5 rounded">{s.growthRate}% PA</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-black text-green-600">{formatCurrency(s.amount)}</p>
                        <p className="text-[9px] text-neutral-400">Proj: {formatCurrency(calculateFutureValue(s.amount, s.growthRate || 0, yearsToRetire))}</p>
                      </div>
                      <button 
                        onClick={() => handleDelete('savings', s.id)}
                        className="p-2 text-neutral-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Borrowing Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-black italic tracking-tight flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              BORROWING LOG
            </h4>
            <button 
              onClick={() => setIsAddingBorrowing(!isAddingBorrowing)}
              className="p-2 bg-neutral-100 hover:bg-black hover:text-white rounded-full transition-all"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {isAddingBorrowing && (
            <motion.form 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleAddBorrowing}
              className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase">Amount</label>
                  <input 
                    required
                    type="number" 
                    className="w-full px-3 py-2 rounded-lg border border-neutral-200 text-sm"
                    value={newBorrowing.amount || ''}
                    onChange={e => setNewBorrowing({...newBorrowing, amount: Number(e.target.value)})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase">Interest Rate (% PA)</label>
                  <input 
                    required
                    type="number" 
                    step="0.1"
                    className="w-full px-3 py-2 rounded-lg border border-neutral-200 text-sm"
                    value={newBorrowing.growthRate}
                    onChange={e => setNewBorrowing({...newBorrowing, growthRate: Number(e.target.value)})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase">Date</label>
                  <input 
                    required
                    type="date" 
                    className="w-full px-3 py-2 rounded-lg border border-neutral-200 text-sm"
                    value={newBorrowing.date}
                    onChange={e => setNewBorrowing({...newBorrowing, date: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase">Lender</label>
                  <input 
                    required
                    type="text" 
                    placeholder="e.g. Bank, Friend"
                    className="w-full px-3 py-2 rounded-lg border border-neutral-200 text-sm"
                    value={newBorrowing.source}
                    onChange={e => setNewBorrowing({...newBorrowing, source: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  type="submit"
                  className="flex-1 py-2 bg-black text-white rounded-lg text-xs font-bold uppercase tracking-wider"
                >
                  Add Borrowing
                </button>
                <button 
                  type="button"
                  onClick={() => setIsAddingBorrowing(false)}
                  className="px-4 py-2 bg-neutral-200 text-neutral-600 rounded-lg text-xs font-bold uppercase tracking-wider"
                >
                  Cancel
                </button>
              </div>
            </motion.form>
          )}

          <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
            <div className="divide-y divide-neutral-100">
              {borrowings.length === 0 ? (
                <div className="p-8 text-center text-neutral-400 italic text-sm">No borrowings logged. Keep it that way!</div>
              ) : (
                borrowings.map(b => (
                  <div key={b.id} className="p-4 flex items-center justify-between hover:bg-neutral-50 group">
                    <div>
                      <p className="font-bold text-sm">{b.source}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-[10px] text-neutral-400">{new Date(b.date).toLocaleDateString()}</p>
                        <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 rounded">{b.growthRate}% PA</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-black text-red-600">{formatCurrency(b.amount)}</p>
                        <p className="text-[9px] text-neutral-400">Proj: {formatCurrency(calculateFutureValue(b.amount, b.growthRate || 0, yearsToRetire))}</p>
                      </div>
                      <button 
                        onClick={() => handleDelete('borrowings', b.id)}
                        className="p-2 text-neutral-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Motivational Quote */}
      <div className="bg-neutral-100 p-8 rounded-3xl text-center">
        <p className="text-lg font-serif italic text-neutral-600 max-w-2xl mx-auto">
          "Wealth is not about having a lot of money; it's about having a lot of options. 1 Crore is just the beginning of your freedom."
        </p>
      </div>
    </div>
  );
}

