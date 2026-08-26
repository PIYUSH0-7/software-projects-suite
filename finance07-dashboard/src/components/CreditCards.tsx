import React, { useState } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { Plus, Trash2, Edit2, CreditCard as CardIcon, AlertTriangle } from 'lucide-react';
import { CreditCard, Investment } from '../types';
import { formatCurrency, getUtilizationColor, cn } from '../lib/utils';
import { auth } from '../lib/firebase';

interface CreditCardsProps {
  cards: CreditCard[];
  investments: Investment[];
}

export default function CreditCards({ cards, investments }: CreditCardsProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);
  const [selectedInvestmentId, setSelectedInvestmentId] = useState<string>('');
  const [showPaymentModal, setShowPaymentModal] = useState<CreditCard | null>(null);
  const [newCard, setNewCard] = useState<Partial<CreditCard>>({
    cardName: '',
    bankName: '',
    creditLimit: 0,
    availableLimit: 0,
    outstandingBalance: 0,
    monthlyOutstanding: 0,
    dueDay: 15,
    statementDay: 1,
    minimumDue: 0
  });

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    try {
      if (editingCard) {
        const { id, ...data } = editingCard;
        await updateDoc(doc(db, 'creditCards', id), {
          ...data,
          lastUpdated: new Date().toISOString()
        });
        setEditingCard(null);
      } else {
        await addDoc(collection(db, 'creditCards'), {
          ...newCard,
          uid: auth.currentUser.uid,
          lastUpdated: new Date().toISOString()
        });
        setIsAdding(false);
        setNewCard({
          cardName: '',
          bankName: '',
          creditLimit: 0,
          availableLimit: 0,
          outstandingBalance: 0,
          monthlyOutstanding: 0,
          dueDay: 15,
          statementDay: 1,
          minimumDue: 0
        });
      }
    } catch (error) {
      console.error("Error saving card:", error);
    }
  };

  const handleMarkAsPaid = async (card: CreditCard, investmentId: string) => {
    if (!investmentId) return;
    
    try {
      const investment = investments.find(inv => inv.id === investmentId);
      if (!investment) return;

      const paymentAmount = card.monthlyOutstanding;
      const newInvestmentValue = investment.currentValue - paymentAmount;
      const newOutstanding = Math.max(0, card.outstandingBalance - paymentAmount);

      // Update Investment
      await updateDoc(doc(db, 'investments', investmentId), {
        currentValue: newInvestmentValue,
        lastUpdated: new Date().toISOString()
      });

      // Update Credit Card
      await updateDoc(doc(db, 'creditCards', card.id), {
        outstandingBalance: newOutstanding,
        monthlyOutstanding: 0,
        lastUpdated: new Date().toISOString()
      });

      // Log Transaction
      if (auth.currentUser) {
        await addDoc(collection(db, 'transactions'), {
          uid: auth.currentUser.uid,
          amount: paymentAmount,
          category: 'Bills',
          paymentMode: 'Investment',
          description: `Credit Card Payment: ${card.cardName} via ${investment.name}`,
          date: new Date().toISOString()
        });
      }

      setShowPaymentModal(null);
      setSelectedInvestmentId('');
    } catch (error) {
      console.error("Error marking as paid:", error);
    }
  };

  const handleUpdateMonthlyOutstanding = async (card: CreditCard, amount: number) => {
    try {
      await updateDoc(doc(db, 'creditCards', card.id), {
        monthlyOutstanding: amount,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error updating monthly outstanding:", error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'creditCards', id));
    } catch (error) {
      console.error("Error deleting card:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold">Your Cards</h3>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Card
        </button>
      </div>

      {(isAdding || editingCard) && (
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
          <h4 className="font-bold mb-4">{editingCard ? 'Edit Card' : 'Add New Card'}</h4>
          <form onSubmit={handleAddCard} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-500 uppercase">Card Name</label>
              <input 
                required
                type="text" 
                placeholder="Amazon Pay ICICI"
                className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-black/5"
                value={editingCard ? editingCard.cardName : newCard.cardName}
                onChange={e => editingCard ? setEditingCard({...editingCard, cardName: e.target.value}) : setNewCard({...newCard, cardName: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-500 uppercase">Bank Name</label>
              <input 
                required
                type="text" 
                placeholder="ICICI Bank"
                className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-black/5"
                value={editingCard ? editingCard.bankName : newCard.bankName}
                onChange={e => editingCard ? setEditingCard({...editingCard, bankName: e.target.value}) : setNewCard({...newCard, bankName: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-500 uppercase">Credit Limit</label>
              <input 
                required
                type="number" 
                className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-black/5"
                value={editingCard ? editingCard.creditLimit : newCard.creditLimit}
                onChange={e => editingCard ? setEditingCard({...editingCard, creditLimit: Number(e.target.value)}) : setNewCard({...newCard, creditLimit: Number(e.target.value)})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-500 uppercase">Total Outstanding Balance</label>
              <input 
                required
                type="number" 
                className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-black/5"
                value={editingCard ? editingCard.outstandingBalance : newCard.outstandingBalance}
                onChange={e => editingCard ? setEditingCard({...editingCard, outstandingBalance: Number(e.target.value)}) : setNewCard({...newCard, outstandingBalance: Number(e.target.value)})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-500 uppercase">Monthly Outstanding (Bill)</label>
              <input 
                required
                type="number" 
                className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-black/5"
                value={editingCard ? editingCard.monthlyOutstanding : newCard.monthlyOutstanding}
                onChange={e => editingCard ? setEditingCard({...editingCard, monthlyOutstanding: Number(e.target.value)}) : setNewCard({...newCard, monthlyOutstanding: Number(e.target.value)})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-500 uppercase">Due Day (1-31)</label>
              <input 
                required
                type="number" 
                min="1"
                max="31"
                className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-black/5"
                value={editingCard ? editingCard.dueDay : newCard.dueDay}
                onChange={e => editingCard ? setEditingCard({...editingCard, dueDay: Number(e.target.value)}) : setNewCard({...newCard, dueDay: Number(e.target.value)})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-500 uppercase">Statement Day (1-31)</label>
              <input 
                required
                type="number" 
                min="1"
                max="31"
                className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-black/5"
                value={editingCard ? editingCard.statementDay : newCard.statementDay}
                onChange={e => editingCard ? setEditingCard({...editingCard, statementDay: Number(e.target.value)}) : setNewCard({...newCard, statementDay: Number(e.target.value)})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-500 uppercase">Minimum Due</label>
              <input 
                required
                type="number" 
                className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-black/5"
                value={editingCard ? editingCard.minimumDue : newCard.minimumDue}
                onChange={e => editingCard ? setEditingCard({...editingCard, minimumDue: Number(e.target.value)}) : setNewCard({...newCard, minimumDue: Number(e.target.value)})}
              />
            </div>
            <div className="md:col-span-2 flex gap-2 pt-4">
              <button 
                type="submit"
                className="flex-1 bg-black text-white py-2 rounded-lg font-medium hover:bg-neutral-800 transition-colors"
              >
                {editingCard ? 'Update' : 'Save'} Card
              </button>
              <button 
                type="button"
                onClick={() => { setIsAdding(false); setEditingCard(null); }}
                className="flex-1 bg-neutral-100 text-neutral-600 py-2 rounded-lg font-medium hover:bg-neutral-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h4 className="text-xl font-bold mb-2">Pay Bill: {showPaymentModal.cardName}</h4>
            <p className="text-neutral-500 text-sm mb-6">Select an investment to pay from. Amount: {formatCurrency(showPaymentModal.monthlyOutstanding)}</p>
            
            <div className="space-y-3 mb-6 max-h-60 overflow-auto">
              {investments.map(inv => (
                <button
                  key={inv.id}
                  onClick={() => setSelectedInvestmentId(inv.id)}
                  className={cn(
                    "w-full flex items-center justify-between p-4 rounded-xl border transition-all",
                    selectedInvestmentId === inv.id 
                      ? "border-black bg-neutral-50 ring-2 ring-black/5" 
                      : "border-neutral-200 hover:border-neutral-300"
                  )}
                >
                  <div className="text-left">
                    <p className="font-bold text-sm">{inv.name}</p>
                    <p className="text-xs text-neutral-500">{inv.type}</p>
                  </div>
                  <p className="font-bold">{formatCurrency(inv.currentValue)}</p>
                </button>
              ))}
              {investments.length === 0 && (
                <p className="text-center py-4 text-neutral-500 italic text-sm">No investments found. Add one first.</p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleMarkAsPaid(showPaymentModal, selectedInvestmentId)}
                disabled={!selectedInvestmentId}
                className="flex-1 bg-black text-white py-3 rounded-xl font-bold hover:bg-neutral-800 disabled:bg-neutral-200 transition-colors"
              >
                Confirm Payment
              </button>
              <button
                onClick={() => { setShowPaymentModal(null); setSelectedInvestmentId(''); }}
                className="flex-1 bg-neutral-100 text-neutral-600 py-3 rounded-xl font-bold hover:bg-neutral-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cards.map(card => {
          const utilization = (card.outstandingBalance / card.creditLimit) * 100;
          return (
            <div key={card.id} className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm relative group overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                <button 
                  onClick={() => setEditingCard(card)}
                  className="p-2 bg-neutral-100 rounded-full hover:bg-neutral-200 text-neutral-600"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDelete(card.id)}
                  className="p-2 bg-red-50 rounded-full hover:bg-red-100 text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-neutral-900 rounded-xl flex items-center justify-center">
                  <CardIcon className="text-white w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-lg">{card.cardName}</h4>
                  <p className="text-sm text-neutral-500">{card.bankName}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-xs font-semibold text-neutral-500 uppercase mb-1">Total Outstanding</p>
                    <p className="text-2xl font-bold">{formatCurrency(card.outstandingBalance)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-neutral-500 uppercase mb-1">Limit</p>
                    <p className="text-sm font-medium">{formatCurrency(card.creditLimit)}</p>
                  </div>
                </div>

                <div className="p-4 bg-neutral-50 rounded-xl space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-[10px] font-bold text-neutral-400 uppercase">Monthly Bill</p>
                      <p className="text-lg font-bold">{formatCurrency(card.monthlyOutstanding)}</p>
                    </div>
                    <button 
                      onClick={() => setShowPaymentModal(card)}
                      disabled={card.monthlyOutstanding <= 0}
                      className="px-3 py-1.5 bg-black text-white text-xs font-bold rounded-lg hover:bg-neutral-800 disabled:bg-neutral-200 transition-colors"
                    >
                      Mark as Paid
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number"
                      placeholder="Update bill..."
                      className="flex-1 px-2 py-1 text-xs border border-neutral-200 rounded bg-white"
                      onBlur={(e) => handleUpdateMonthlyOutstanding(card, Number(e.target.value))}
                      defaultValue={card.monthlyOutstanding}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className={getUtilizationColor(utilization)}>Utilization: {utilization.toFixed(1)}%</span>
                    <span className="text-neutral-400">{formatCurrency(card.creditLimit - card.outstandingBalance)} available</span>
                  </div>
                  <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                    <div 
                      className={cn("h-full transition-all duration-500", 
                        utilization > 80 ? "bg-red-500" : utilization > 50 ? "bg-yellow-500" : "bg-green-500"
                      )}
                      style={{ width: `${Math.min(utilization, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-neutral-100">
                  <div>
                    <p className="text-[10px] font-bold text-neutral-400 uppercase">Due Day</p>
                    <p className="text-sm font-semibold">{card.dueDay}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-neutral-400 uppercase">Statement</p>
                    <p className="text-sm font-semibold">{card.statementDay}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-neutral-400 uppercase">Min Due</p>
                    <p className="text-sm font-semibold">{formatCurrency(card.minimumDue)}</p>
                  </div>
                </div>

                {utilization > 80 && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-xl text-xs font-medium">
                    <AlertTriangle className="w-4 h-4" />
                    High utilization! This might impact your credit score.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
