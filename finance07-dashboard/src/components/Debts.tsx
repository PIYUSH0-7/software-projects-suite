import React, { useState } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { Plus, Trash2, Edit2, Wallet, Users, Landmark, Calendar } from 'lucide-react';
import { Debt, Investment } from '../types';
import { formatCurrency, cn } from '../lib/utils';

interface DebtsProps {
  debts: Debt[];
  investments: Investment[];
}

export default function Debts({ debts, investments }: DebtsProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [selectedInvestmentId, setSelectedInvestmentId] = useState<string>('');
  const [showPaymentModal, setShowPaymentModal] = useState<Debt | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [newDebt, setNewDebt] = useState<Partial<Debt>>({
    source: '',
    totalAmount: 0,
    remainingBalance: 0,
    interestRate: 0,
    dueDate: '',
    repaymentSchedule: ''
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    try {
      if (editingDebt) {
        const { id, ...data } = editingDebt;
        await updateDoc(doc(db, 'debts', id), data);
        setEditingDebt(null);
      } else {
        await addDoc(collection(db, 'debts'), {
          ...newDebt,
          uid: auth.currentUser.uid,
          createdAt: new Date().toISOString()
        });
        setIsAdding(false);
        setNewDebt({ source: '', totalAmount: 0, remainingBalance: 0, interestRate: 0, dueDate: '', repaymentSchedule: '' });
      }
    } catch (error) {
      console.error("Error saving debt:", error);
    }
  };

  const handleMakePayment = async (debt: Debt, investmentId: string, amount: number) => {
    if (!investmentId || amount <= 0) return;

    try {
      const investment = investments.find(inv => inv.id === investmentId);
      if (!investment) return;

      const newInvestmentValue = investment.currentValue - amount;
      const newRemainingBalance = Math.max(0, debt.remainingBalance - amount);

      // Update Investment
      await updateDoc(doc(db, 'investments', investmentId), {
        currentValue: newInvestmentValue,
        lastUpdated: new Date().toISOString()
      });

      // Update Debt
      await updateDoc(doc(db, 'debts', debt.id), {
        remainingBalance: newRemainingBalance,
        lastUpdated: new Date().toISOString()
      });

      // Log Transaction
      if (auth.currentUser) {
        await addDoc(collection(db, 'transactions'), {
          uid: auth.currentUser.uid,
          amount: amount,
          category: 'Debt Repayment',
          paymentMode: 'Investment',
          description: `Debt Payment: ${debt.source} via ${investment.name}`,
          date: new Date().toISOString()
        });
      }

      setShowPaymentModal(null);
      setSelectedInvestmentId('');
      setPaymentAmount(0);
    } catch (error) {
      console.error("Error making payment:", error);
    }
  };

  const totalOwed = debts.reduce((sum, d) => sum + d.remainingBalance, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold">Debts & Borrowings</h3>
          <p className="text-sm text-neutral-500">Total Owed: {formatCurrency(totalOwed)}</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Debt
        </button>
      </div>

      {(isAdding || editingDebt) && (
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
          <h4 className="font-bold mb-4">{editingDebt ? 'Edit Debt' : 'Add New Debt'}</h4>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-500 uppercase">Source (Bank/Friend)</label>
              <input 
                required
                type="text" 
                placeholder="HDFC Personal Loan"
                className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-black/5"
                value={editingDebt ? editingDebt.source : newDebt.source}
                onChange={e => editingDebt ? setEditingDebt({...editingDebt, source: e.target.value}) : setNewDebt({...newDebt, source: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-500 uppercase">Total Amount</label>
              <input 
                required
                type="number" 
                className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-black/5"
                value={editingDebt ? editingDebt.totalAmount : newDebt.totalAmount}
                onChange={e => editingDebt ? setEditingDebt({...editingDebt, totalAmount: Number(e.target.value)}) : setNewDebt({...newDebt, totalAmount: Number(e.target.value), remainingBalance: Number(e.target.value)})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-500 uppercase">Remaining Balance</label>
              <input 
                required
                type="number" 
                className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-black/5"
                value={editingDebt ? editingDebt.remainingBalance : newDebt.remainingBalance}
                onChange={e => editingDebt ? setEditingDebt({...editingDebt, remainingBalance: Number(e.target.value)}) : setNewDebt({...newDebt, remainingBalance: Number(e.target.value)})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-500 uppercase">Interest Rate (%)</label>
              <input 
                type="number" 
                className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-black/5"
                value={editingDebt ? editingDebt.interestRate : newDebt.interestRate}
                onChange={e => editingDebt ? setEditingDebt({...editingDebt, interestRate: Number(e.target.value)}) : setNewDebt({...newDebt, interestRate: Number(e.target.value)})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-500 uppercase">Due Date</label>
              <input 
                type="date" 
                className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-black/5"
                value={editingDebt ? editingDebt.dueDate : newDebt.dueDate}
                onChange={e => editingDebt ? setEditingDebt({...editingDebt, dueDate: e.target.value}) : setNewDebt({...newDebt, dueDate: e.target.value})}
              />
            </div>
            <div className="md:col-span-2 flex gap-2 pt-4">
              <button type="submit" className="flex-1 bg-black text-white py-2 rounded-lg font-medium">{editingDebt ? 'Update' : 'Save'} Debt</button>
              <button type="button" onClick={() => { setIsAdding(false); setEditingDebt(null); }} className="flex-1 bg-neutral-100 text-neutral-600 py-2 rounded-lg font-medium">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h4 className="text-xl font-bold mb-2">Pay Debt: {showPaymentModal.source}</h4>
            <p className="text-neutral-500 text-sm mb-4">Select an investment and amount to pay. Remaining: {formatCurrency(showPaymentModal.remainingBalance)}</p>
            
            <div className="space-y-4 mb-6">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-500 uppercase">Payment Amount</label>
                <input 
                  type="number"
                  max={showPaymentModal.remainingBalance}
                  className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-black/5"
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(Number(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-neutral-500 uppercase">Select Investment</label>
                <div className="space-y-2 max-h-48 overflow-auto">
                  {investments.map(inv => (
                    <button
                      key={inv.id}
                      onClick={() => setSelectedInvestmentId(inv.id)}
                      className={cn(
                        "w-full flex items-center justify-between p-3 rounded-xl border text-sm transition-all",
                        selectedInvestmentId === inv.id 
                          ? "border-black bg-neutral-50" 
                          : "border-neutral-200 hover:border-neutral-300"
                      )}
                    >
                      <span className="font-bold">{inv.name}</span>
                      <span className="text-neutral-500">{formatCurrency(inv.currentValue)}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleMakePayment(showPaymentModal, selectedInvestmentId, paymentAmount)}
                disabled={!selectedInvestmentId || paymentAmount <= 0 || paymentAmount > showPaymentModal.remainingBalance}
                className="flex-1 bg-black text-white py-3 rounded-xl font-bold hover:bg-neutral-800 disabled:bg-neutral-200 transition-colors"
              >
                Confirm Payment
              </button>
              <button
                onClick={() => { setShowPaymentModal(null); setSelectedInvestmentId(''); setPaymentAmount(0); }}
                className="flex-1 bg-neutral-100 text-neutral-600 py-3 rounded-xl font-bold hover:bg-neutral-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {debts.map(debt => (
          <div key={debt.id} className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-neutral-50 rounded-xl flex items-center justify-center">
                {debt.source.toLowerCase().includes('bank') ? <Landmark className="w-6 h-6 text-neutral-600" /> : <Users className="w-6 h-6 text-neutral-600" />}
              </div>
              <div>
                <h4 className="font-bold text-neutral-900">{debt.source}</h4>
                <p className="text-sm text-neutral-500">Remaining: {formatCurrency(debt.remainingBalance)} / {formatCurrency(debt.totalAmount)}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden md:block">
                <p className="text-xs font-bold text-neutral-400 uppercase">Next Payment</p>
                <p className="text-sm font-semibold">{debt.dueDate ? new Date(debt.dueDate).toLocaleDateString() : 'N/A'}</p>
              </div>
              <div className="w-32 h-2 bg-neutral-100 rounded-full overflow-hidden hidden md:block">
                <div 
                  className="h-full bg-black" 
                  style={{ width: `${((debt.totalAmount - debt.remainingBalance) / debt.totalAmount) * 100}%` }}
                />
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => { setShowPaymentModal(debt); setPaymentAmount(debt.remainingBalance > 0 ? debt.remainingBalance : 0); }}
                  className="px-3 py-1.5 bg-black text-white text-xs font-bold rounded-lg hover:bg-neutral-800 transition-colors"
                >
                  Pay
                </button>
                <button 
                  onClick={() => setEditingDebt(debt)}
                  className="p-2 text-neutral-400 hover:text-black transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => deleteDoc(doc(db, 'debts', debt.id))}
                  className="p-2 text-neutral-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
