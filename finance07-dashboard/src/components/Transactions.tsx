import React, { useState } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, deleteDoc, doc, updateDoc, query, where, orderBy, limit } from 'firebase/firestore';
import { Plus, Trash2, Edit2, Search, Filter, Utensils, Car, Home, ShoppingBag, MoreHorizontal } from 'lucide-react';
import { Transaction } from '../types';
import { formatCurrency } from '../lib/utils';

interface TransactionsProps {
  transactions: Transaction[];
  initialDate?: string | null;
  onDateClear?: () => void;
}

export default function Transactions({ transactions, initialDate, onDateClear }: TransactionsProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [filterDate, setFilterDate] = useState<string>(initialDate || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [newTx, setNewTx] = useState<Partial<Transaction>>({
    amount: 0,
    category: 'Food',
    paymentMode: 'Cash',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const filteredTransactions = transactions.filter(tx => {
    const txDate = new Date(tx.date).toISOString().split('T')[0];
    const matchesDate = filterDate ? txDate === filterDate : true;
    const matchesSearch = searchQuery ? 
      (tx.description?.toLowerCase().includes(searchQuery.toLowerCase()) || 
       tx.category.toLowerCase().includes(searchQuery.toLowerCase())) : true;
    return matchesDate && matchesSearch;
  });

  const dailyTotal = filteredTransactions.reduce((sum, tx) => sum + tx.amount, 0);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    try {
      if (editingTx) {
        const { id, ...data } = editingTx;
        await updateDoc(doc(db, 'transactions', id), {
          ...data,
          date: new Date(data.date).toISOString()
        });
        setEditingTx(null);
      } else {
        await addDoc(collection(db, 'transactions'), {
          ...newTx,
          uid: auth.currentUser.uid,
          date: new Date(newTx.date!).toISOString()
        });
        setIsAdding(false);
        setNewTx({ amount: 0, category: 'Food', paymentMode: 'Cash', description: '', date: new Date().toISOString().split('T')[0] });
      }
    } catch (error) {
      console.error("Error saving transaction:", error);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'food': return Utensils;
      case 'travel': return Car;
      case 'rent': return Home;
      case 'shopping': return ShoppingBag;
      default: return MoreHorizontal;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold">Transaction History</h3>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Log Transaction
        </button>
      </div>

      {(isAdding || editingTx) && (
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
          <h4 className="font-bold mb-4">{editingTx ? 'Edit Transaction' : 'Log New Transaction'}</h4>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-500 uppercase">Amount</label>
              <input 
                required
                type="number" 
                className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-black/5"
                value={editingTx ? editingTx.amount : newTx.amount}
                onChange={e => editingTx ? setEditingTx({...editingTx, amount: Number(e.target.value)}) : setNewTx({...newTx, amount: Number(e.target.value)})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-500 uppercase">Category</label>
              <select 
                className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-black/5"
                value={editingTx ? editingTx.category : newTx.category}
                onChange={e => editingTx ? setEditingTx({...editingTx, category: e.target.value}) : setNewTx({...newTx, category: e.target.value})}
              >
                <option value="Food">Food</option>
                <option value="Travel">Travel</option>
                <option value="Rent">Rent</option>
                <option value="Shopping">Shopping</option>
                <option value="Bills">Bills</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-500 uppercase">Payment Mode</label>
              <select 
                className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-black/5"
                value={editingTx ? editingTx.paymentMode : newTx.paymentMode}
                onChange={e => editingTx ? setEditingTx({...editingTx, paymentMode: e.target.value}) : setNewTx({...newTx, paymentMode: e.target.value})}
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Debit Card">Debit Card</option>
                <option value="Investment">Investment</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-500 uppercase">Date</label>
              <input 
                required
                type="date" 
                className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-black/5"
                value={editingTx ? new Date(editingTx.date).toISOString().split('T')[0] : newTx.date}
                onChange={e => editingTx ? setEditingTx({...editingTx, date: e.target.value}) : setNewTx({...newTx, date: e.target.value})}
              />
            </div>
            <div className="md:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-neutral-500 uppercase">Description</label>
              <input 
                type="text" 
                placeholder="Dinner at Olive Garden"
                className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-black/5"
                value={editingTx ? editingTx.description : newTx.description}
                onChange={e => editingTx ? setEditingTx({...editingTx, description: e.target.value}) : setNewTx({...newTx, description: e.target.value})}
              />
            </div>
            <div className="md:col-span-2 flex gap-2 pt-4">
              <button type="submit" className="flex-1 bg-black text-white py-2 rounded-lg font-medium">{editingTx ? 'Update' : 'Log'} Transaction</button>
              <button type="button" onClick={() => { setIsAdding(false); setEditingTx(null); }} className="flex-1 bg-neutral-100 text-neutral-600 py-2 rounded-lg font-medium">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-neutral-100 flex flex-col md:flex-row md:items-center justify-between bg-neutral-50/50 gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="flex items-center gap-2 text-sm text-neutral-500 bg-white px-3 py-2 rounded-lg border border-neutral-200 flex-1 max-w-xs">
              <Search className="w-4 h-4" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="bg-transparent border-none focus:outline-none w-full"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-neutral-500 bg-white px-3 py-2 rounded-lg border border-neutral-200">
              <Filter className="w-4 h-4" />
              <input 
                type="date" 
                className="bg-transparent border-none focus:outline-none"
                value={filterDate}
                onChange={e => {
                  setFilterDate(e.target.value);
                  if (!e.target.value && onDateClear) onDateClear();
                }}
              />
              {filterDate && (
                <button 
                  onClick={() => {
                    setFilterDate('');
                    if (onDateClear) onDateClear();
                  }}
                  className="text-neutral-400 hover:text-black"
                >
                  ×
                </button>
              )}
            </div>
          </div>
          {filterDate && (
            <div className="text-right">
              <p className="text-xs text-neutral-500 uppercase font-bold tracking-wider">Total for {new Date(filterDate).toLocaleDateString()}</p>
              <p className="text-lg font-bold text-neutral-900">{formatCurrency(dailyTotal)}</p>
            </div>
          )}
        </div>
        <div className="divide-y divide-neutral-100">
          {filteredTransactions.map(tx => {
            const Icon = getCategoryIcon(tx.category);
            return (
              <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-neutral-50 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-neutral-100 rounded-xl flex items-center justify-center">
                    <Icon className="w-5 h-5 text-neutral-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-neutral-900">{tx.description || tx.category}</p>
                    <p className="text-xs text-neutral-500">{new Date(tx.date).toLocaleDateString()} • {tx.paymentMode}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-neutral-900">{formatCurrency(tx.amount)}</p>
                  <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => setEditingTx(tx)}
                      className="p-2 text-neutral-400 hover:text-black transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => deleteDoc(doc(db, 'transactions', tx.id))}
                      className="p-2 text-neutral-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {transactions.length === 0 && (
            <div className="p-12 text-center text-neutral-500 italic">No transactions logged yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
