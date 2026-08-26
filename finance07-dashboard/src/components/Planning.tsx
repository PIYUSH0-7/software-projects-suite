import React, { useState } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { Plus, Trash2, Calendar, CheckCircle2, Circle, Edit2 } from 'lucide-react';
import { Plan } from '../types';
import { formatCurrency } from '../lib/utils';

interface PlanningProps {
  plans: Plan[];
}

export default function Planning({ plans }: PlanningProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [newPlan, setNewPlan] = useState<Partial<Plan>>({
    amount: 0,
    category: 'Groceries',
    date: '',
    description: '',
    isPaid: false,
    isFixed: false,
    fixedDay: 1
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    try {
      if (editingPlan) {
        const { id, ...data } = editingPlan;
        await updateDoc(doc(db, 'plans', id), data);
        setEditingPlan(null);
      } else {
        await addDoc(collection(db, 'plans'), {
          ...newPlan,
          uid: auth.currentUser.uid,
          isPaid: false,
          date: newPlan.isFixed ? '' : new Date(newPlan.date!).toISOString()
        });
        setIsAdding(false);
        setNewPlan({ amount: 0, category: 'Groceries', date: '', description: '', isPaid: false, isFixed: false, fixedDay: 1 });
      }
    } catch (error) {
      console.error("Error saving plan:", error);
    }
  };

  const togglePaid = async (plan: Plan) => {
    try {
      await updateDoc(doc(db, 'plans', plan.id), {
        isPaid: !plan.isPaid
      });
    } catch (error) {
      console.error("Error updating plan:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold">Monthly Planning</h3>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Pre-plan Expense
        </button>
      </div>

      {(isAdding || editingPlan) && (
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
          <h4 className="font-bold mb-4">{editingPlan ? 'Edit Plan' : 'Pre-plan Expense'}</h4>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-500 uppercase">Amount</label>
              <input 
                required
                type="number" 
                className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-black/5"
                value={editingPlan ? editingPlan.amount : newPlan.amount}
                onChange={e => editingPlan ? setEditingPlan({...editingPlan, amount: Number(e.target.value)}) : setNewPlan({...newPlan, amount: Number(e.target.value)})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-500 uppercase">Type</label>
              <div className="flex gap-2">
                <button 
                  type="button"
                  onClick={() => editingPlan ? setEditingPlan({...editingPlan, isFixed: false}) : setNewPlan({...newPlan, isFixed: false})}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all ${!(editingPlan ? editingPlan.isFixed : newPlan.isFixed) ? 'bg-black text-white border-black' : 'bg-white text-neutral-400 border-neutral-200'}`}
                >
                  One-time
                </button>
                <button 
                  type="button"
                  onClick={() => editingPlan ? setEditingPlan({...editingPlan, isFixed: true}) : setNewPlan({...newPlan, isFixed: true})}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all ${(editingPlan ? editingPlan.isFixed : newPlan.isFixed) ? 'bg-black text-white border-black' : 'bg-white text-neutral-400 border-neutral-200'}`}
                >
                  Monthly Fixed
                </button>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-500 uppercase">{(editingPlan ? editingPlan.isFixed : newPlan.isFixed) ? 'Day of Month' : 'Date'}</label>
              {(editingPlan ? editingPlan.isFixed : newPlan.isFixed) ? (
                <input 
                  required
                  type="number" 
                  min="1"
                  max="31"
                  className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-black/5"
                  value={editingPlan ? editingPlan.fixedDay : newPlan.fixedDay}
                  onChange={e => editingPlan ? setEditingPlan({...editingPlan, fixedDay: Number(e.target.value)}) : setNewPlan({...newPlan, fixedDay: Number(e.target.value)})}
                />
              ) : (
                <input 
                  required
                  type="date" 
                  className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-black/5"
                  value={editingPlan ? (editingPlan.date ? new Date(editingPlan.date).toISOString().split('T')[0] : '') : newPlan.date}
                  onChange={e => editingPlan ? setEditingPlan({...editingPlan, date: e.target.value}) : setNewPlan({...newPlan, date: e.target.value})}
                />
              )}
            </div>
            <div className="md:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-neutral-500 uppercase">Description</label>
              <input 
                type="text" 
                placeholder="₹1000 for groceries on 5th"
                className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-black/5"
                value={editingPlan ? editingPlan.description : newPlan.description}
                onChange={e => editingPlan ? setEditingPlan({...editingPlan, description: e.target.value}) : setNewPlan({...newPlan, description: e.target.value})}
              />
            </div>
            <div className="md:col-span-2 flex gap-2 pt-4">
              <button type="submit" className="flex-1 bg-black text-white py-2 rounded-lg font-medium">{editingPlan ? 'Update' : 'Save'} Plan</button>
              <button type="button" onClick={() => { setIsAdding(false); setEditingPlan(null); }} className="flex-1 bg-neutral-100 text-neutral-600 py-2 rounded-lg font-medium">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {plans.map(plan => (
          <div key={plan.id} className={`p-6 rounded-2xl border transition-all ${plan.isPaid ? 'bg-neutral-50 border-neutral-100 opacity-60' : 'bg-white border-neutral-200 shadow-sm'}`}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <button onClick={() => togglePaid(plan)}>
                  {plan.isPaid ? <CheckCircle2 className="w-6 h-6 text-green-500" /> : <Circle className="w-6 h-6 text-neutral-300" />}
                </button>
                <div>
                  <h4 className={`font-bold ${plan.isPaid ? 'line-through text-neutral-400' : 'text-neutral-900'}`}>{plan.description || plan.category}</h4>
                  <p className="text-xs text-neutral-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {plan.isFixed ? `Fixed: Day ${plan.fixedDay} of each month` : new Date(plan.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <p className={`text-lg font-bold ${plan.isPaid ? 'text-neutral-400' : 'text-neutral-900'}`}>{formatCurrency(plan.amount)}</p>
            </div>
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setEditingPlan(plan)}
                className="text-neutral-300 hover:text-black transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button 
                onClick={() => deleteDoc(doc(db, 'plans', plan.id))}
                className="text-neutral-300 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
