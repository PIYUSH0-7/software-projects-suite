import React, { useState } from 'react';
import { db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { UserProfile, Transaction } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { Target, AlertCircle, CheckCircle2 } from 'lucide-react';

interface BudgetingProps {
  profile: UserProfile | null;
  transactions: Transaction[];
}

export default function Budgeting({ profile, transactions }: BudgetingProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [budget, setBudget] = useState(profile?.monthlyBudget || 0);
  const [dailyLimit, setDailyLimit] = useState(profile?.dailySpendingLimit || 0);
  const [budgetDetails, setBudgetDetails] = useState<{ category: string, amount: number }[]>(profile?.budgetDetails || []);

  const currentMonth = new Date().getMonth();
  const monthlySpent = transactions
    .filter(t => new Date(t.date).getMonth() === currentMonth)
    .reduce((sum, t) => sum + t.amount, 0);

  const today = new Date().toISOString().split('T')[0];
  const dailySpent = transactions
    .filter(t => t.date.split('T')[0] === today)
    .reduce((sum, t) => sum + t.amount, 0);

  const handleSave = async () => {
    if (!profile) return;
    try {
      await updateDoc(doc(db, 'users', profile.uid), {
        monthlyBudget: budget,
        dailySpendingLimit: dailyLimit,
        budgetDetails: budgetDetails
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating budget:", error);
    }
  };

  const addBudgetDetail = () => {
    setBudgetDetails([...budgetDetails, { category: '', amount: 0 }]);
  };

  const removeBudgetDetail = (index: number) => {
    setBudgetDetails(budgetDetails.filter((_, i) => i !== index));
  };

  const updateBudgetDetail = (index: number, field: 'category' | 'amount', value: string | number) => {
    const updated = [...budgetDetails];
    updated[index] = { ...updated[index], [field]: value };
    setBudgetDetails(updated);
  };

  const monthlyProgress = budget > 0 ? (monthlySpent / budget) * 100 : 0;
  const dailyProgress = dailyLimit > 0 ? (dailySpent / dailyLimit) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold">Budgeting & Limits</h3>
        <button 
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium"
        >
          {isEditing ? 'Save Limits' : 'Edit Limits'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Monthly Budget */}
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-neutral-100 rounded-xl flex items-center justify-center">
              <Target className="w-5 h-5 text-neutral-600" />
            </div>
            <div>
              <h4 className="font-bold">Monthly Budget</h4>
              <p className="text-xs text-neutral-500">Total spending limit for this month</p>
            </div>
          </div>

          {isEditing ? (
            <div className="mb-6">
              <input 
                type="number" 
                className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-black/5"
                value={budget}
                onChange={e => setBudget(Number(e.target.value))}
              />
            </div>
          ) : (
            <div className="mb-6">
              <p className="text-3xl font-bold">{formatCurrency(budget)}</p>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500">Spent: {formatCurrency(monthlySpent)}</span>
              <span className={cn("font-bold", monthlyProgress > 90 ? "text-red-500" : "text-neutral-900")}>
                {monthlyProgress.toFixed(1)}%
              </span>
            </div>
            <div className="h-3 bg-neutral-100 rounded-full overflow-hidden">
              <div 
                className={cn("h-full transition-all duration-500", 
                  monthlyProgress > 90 ? "bg-red-500" : monthlyProgress > 70 ? "bg-yellow-500" : "bg-black"
                )}
                style={{ width: `${Math.min(monthlyProgress, 100)}%` }}
              />
            </div>
          </div>

          {monthlyProgress > 100 && (
            <div className="mt-4 flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-xl text-xs font-medium">
              <AlertCircle className="w-4 h-4" />
              You have exceeded your monthly budget!
            </div>
          )}
        </div>

        {/* Daily Limit */}
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-neutral-100 rounded-xl flex items-center justify-center">
              <Target className="w-5 h-5 text-neutral-600" />
            </div>
            <div>
              <h4 className="font-bold">Daily Spending Limit</h4>
              <p className="text-xs text-neutral-500">Maximum daily allowance</p>
            </div>
          </div>

          {isEditing ? (
            <div className="mb-6">
              <input 
                type="number" 
                className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-black/5"
                value={dailyLimit}
                onChange={e => setDailyLimit(Number(e.target.value))}
              />
            </div>
          ) : (
            <div className="mb-6">
              <p className="text-3xl font-bold">{formatCurrency(dailyLimit)}</p>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500">Spent Today: {formatCurrency(dailySpent)}</span>
              <span className={cn("font-bold", dailyProgress > 90 ? "text-red-500" : "text-neutral-900")}>
                {dailyProgress.toFixed(1)}%
              </span>
            </div>
            <div className="h-3 bg-neutral-100 rounded-full overflow-hidden">
              <div 
                className={cn("h-full transition-all duration-500", 
                  dailyProgress > 90 ? "bg-red-500" : dailyProgress > 70 ? "bg-yellow-500" : "bg-black"
                )}
                style={{ width: `${Math.min(dailyProgress, 100)}%` }}
              />
            </div>
          </div>

          {dailyProgress > 100 && (
            <div className="mt-4 flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-xl text-xs font-medium">
              <AlertCircle className="w-4 h-4" />
              Daily limit exceeded! Try to cut back for the rest of the day.
            </div>
          )}
        </div>
      </div>

      {/* Budget Breakdown */}
      <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h4 className="font-bold">Budget Breakdown</h4>
          {isEditing && (
            <button 
              onClick={addBudgetDetail}
              className="text-xs font-bold text-neutral-500 hover:text-black uppercase tracking-wider"
            >
              + Add Category
            </button>
          )}
        </div>

        <div className="space-y-4">
          {budgetDetails.map((detail, index) => (
            <div key={index} className="flex items-center gap-4">
              {isEditing ? (
                <>
                  <input 
                    type="text" 
                    placeholder="Category (e.g. Food)"
                    className="flex-1 px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-black/5"
                    value={detail.category}
                    onChange={e => updateBudgetDetail(index, 'category', e.target.value)}
                  />
                  <input 
                    type="number" 
                    placeholder="Amount"
                    className="w-32 px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-black/5"
                    value={detail.amount}
                    onChange={e => updateBudgetDetail(index, 'amount', Number(e.target.value))}
                  />
                  <button 
                    onClick={() => removeBudgetDetail(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </>
              ) : (
                <div className="w-full flex items-center justify-between p-4 bg-neutral-50 rounded-xl">
                  <span className="font-medium">{detail.category}</span>
                  <span className="font-bold">{formatCurrency(detail.amount)}</span>
                </div>
              )}
            </div>
          ))}
          {budgetDetails.length === 0 && !isEditing && (
            <p className="text-neutral-500 text-center py-4 italic">No budget breakdown added yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
