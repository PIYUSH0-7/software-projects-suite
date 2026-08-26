import React, { useState } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { Plus, Trash2, TrendingUp, TrendingDown, PiggyBank, Landmark, LineChart, Edit2, Wallet } from 'lucide-react';
import { Investment } from '../types';
import { formatCurrency, cn } from '../lib/utils';

interface InvestmentsProps {
  investments: Investment[];
}

export default function Investments({ investments }: InvestmentsProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingInv, setEditingInv] = useState<Investment | null>(null);
  const [newInv, setNewInv] = useState<Partial<Investment>>({
    type: 'mutual_fund',
    name: '',
    investedAmount: 0,
    currentValue: 0,
    growthRate: 0
  });

  const handleAddInvestment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    try {
      await addDoc(collection(db, 'investments'), {
        ...newInv,
        uid: auth.currentUser.uid,
        createdAt: new Date().toISOString()
      });
      setIsAdding(false);
      setNewInv({
        type: 'mutual_fund',
        name: '',
        investedAmount: 0,
        currentValue: 0,
        growthRate: 0
      });
    } catch (error) {
      console.error("Error adding investment:", error);
    }
  };

  const handleUpdateInvestment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInv) return;

    try {
      const { id, ...data } = editingInv;
      await updateDoc(doc(db, 'investments', id), data);
      setEditingInv(null);
    } catch (error) {
      console.error("Error updating investment:", error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'investments', id));
    } catch (error) {
      console.error("Error deleting investment:", error);
    }
  };

  const totalInvested = investments.reduce((acc, inv) => acc + (inv.investedAmount || 0), 0);
  const totalCurrent = investments.reduce((acc, inv) => acc + (inv.currentValue || 0), 0);
  const overallGrowth = totalInvested > 0 ? ((totalCurrent - totalInvested) / totalInvested) * 100 : 0;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'savings': return PiggyBank;
      case 'fd': return Landmark;
      case 'mutual_fund': return TrendingUp;
      case 'stock': return LineChart;
      default: return Wallet;
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
          <p className="text-xs font-semibold text-neutral-500 uppercase mb-1">Total Invested</p>
          <p className="text-2xl font-bold">{formatCurrency(totalInvested)}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
          <p className="text-xs font-semibold text-neutral-500 uppercase mb-1">Current Value</p>
          <p className="text-2xl font-bold">{formatCurrency(totalCurrent)}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
          <p className="text-xs font-semibold text-neutral-500 uppercase mb-1">Overall Growth</p>
          <p className={cn("text-2xl font-bold", overallGrowth >= 0 ? "text-green-600" : "text-red-600")}>
            {overallGrowth >= 0 ? '+' : ''}{overallGrowth.toFixed(2)}%
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold">Your Portfolio</h3>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Investment
        </button>
      </div>

      {(isAdding || editingInv) && (
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
          <h4 className="font-bold mb-4">{editingInv ? 'Edit Investment' : 'Add New Investment'}</h4>
          <form onSubmit={editingInv ? handleUpdateInvestment : handleAddInvestment} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-500 uppercase">Type</label>
              <select 
                className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-black/5"
                value={editingInv ? editingInv.type : newInv.type}
                onChange={e => editingInv ? setEditingInv({...editingInv, type: e.target.value as any}) : setNewInv({...newInv, type: e.target.value as any})}
              >
                <option value="savings">Savings Account</option>
                <option value="fd">Fixed Deposit</option>
                <option value="mutual_fund">Mutual Fund</option>
                <option value="stock">Stock</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-500 uppercase">Name</label>
              <input 
                required
                type="text" 
                placeholder="Nifty 50 Index Fund"
                className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-black/5"
                value={editingInv ? editingInv.name : newInv.name}
                onChange={e => editingInv ? setEditingInv({...editingInv, name: e.target.value}) : setNewInv({...newInv, name: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-500 uppercase">Invested Amount</label>
              <input 
                required
                type="number" 
                className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-black/5"
                value={editingInv ? editingInv.investedAmount : newInv.investedAmount}
                onChange={e => editingInv ? setEditingInv({...editingInv, investedAmount: Number(e.target.value)}) : setNewInv({...newInv, investedAmount: Number(e.target.value)})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-500 uppercase">Current Value</label>
              <input 
                required
                type="number" 
                className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-black/5"
                value={editingInv ? editingInv.currentValue : newInv.currentValue}
                onChange={e => editingInv ? setEditingInv({...editingInv, currentValue: Number(e.target.value)}) : setNewInv({...newInv, currentValue: Number(e.target.value)})}
              />
            </div>
            <div className="md:col-span-2 flex gap-2 pt-4">
              <button 
                type="submit"
                className="flex-1 bg-black text-white py-2 rounded-lg font-medium hover:bg-neutral-800 transition-colors"
              >
                {editingInv ? 'Update' : 'Save'} Investment
              </button>
              <button 
                type="button"
                onClick={() => { setIsAdding(false); setEditingInv(null); }}
                className="flex-1 bg-neutral-100 text-neutral-600 py-2 rounded-lg font-medium hover:bg-neutral-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {investments.map(inv => {
          const growth = inv.investedAmount > 0 ? ((inv.currentValue - inv.investedAmount) / inv.investedAmount) * 100 : 0;
          const Icon = getTypeIcon(inv.type);
          return (
            <div key={inv.id} className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm relative group">
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                <button 
                  onClick={() => setEditingInv(inv)}
                  className="p-2 bg-neutral-100 rounded-full hover:bg-neutral-200 text-neutral-600"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDelete(inv.id)}
                  className="p-2 bg-red-50 rounded-full hover:bg-red-100 text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-neutral-100 rounded-xl flex items-center justify-center text-neutral-600">
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-lg">{inv.name}</h4>
                  <p className="text-xs font-semibold text-neutral-500 uppercase">{inv.type.replace('_', ' ')}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-[10px] font-bold text-neutral-400 uppercase mb-1">Invested</p>
                  <p className="text-lg font-bold">{formatCurrency(inv.investedAmount)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-neutral-400 uppercase mb-1">Current Value</p>
                  <p className="text-lg font-bold">{formatCurrency(inv.currentValue)}</p>
                </div>
                <div className="col-span-2 pt-4 border-t border-neutral-100 flex justify-between items-center">
                  <span className="text-xs font-semibold text-neutral-500 uppercase">Returns</span>
                  <div className={cn("flex items-center gap-1 font-bold", growth >= 0 ? "text-green-600" : "text-red-600")}>
                    {growth >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    {growth >= 0 ? '+' : ''}{growth.toFixed(2)}%
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
