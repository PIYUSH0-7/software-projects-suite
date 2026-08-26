import React, { useState, useEffect } from 'react';
import { auth } from '../services/firebase';
import { getHolidays, addHoliday, deleteHoliday } from '../services/taskService';
import { Holiday } from '../types';
import { Calendar, Plus, Trash2, Loader2, Info } from 'lucide-react';

const HolidayManager: React.FC = () => {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const loadHolidays = async () => {
    const user = auth.currentUser;
    if (!user) return;
    setLoading(true);
    try {
      const data = await getHolidays(user.uid);
      setHolidays(data.sort((a, b) => a.date.localeCompare(b.date)));
    } catch (error) {
      console.error('Error loading holidays:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHolidays();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user || !newDate || !newLabel) return;

    setIsAdding(true);
    try {
      await addHoliday(user.uid, newDate, newLabel);
      setNewDate('');
      setNewLabel('');
      await loadHolidays();
    } catch (error) {
      console.error('Error adding holiday:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteHoliday(id);
      await loadHolidays();
    } catch (error) {
      console.error('Error deleting holiday:', error);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">Your Holidays</h3>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Adjusts future task deadlines</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3 mb-8">
          <input
            type="date"
            required
            className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
          />
          <input
            type="text"
            placeholder="Holiday Name (e.g. Diwali)"
            required
            className="flex-[2] px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
          />
          <button
            type="submit"
            disabled={isAdding || !newDate || !newLabel}
            className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-100"
          >
            {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Add
          </button>
        </form>

        <div className="space-y-3">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
            </div>
          ) : holidays.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <p className="text-slate-400 text-sm font-medium">No custom holidays added yet.</p>
            </div>
          ) : (
            holidays.map((holiday) => (
              <div key={holiday.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-indigo-200 transition-all">
                <div className="flex items-center gap-4">
                  <div className="bg-white px-3 py-1 rounded-lg border border-slate-200 text-xs font-bold text-indigo-600 shadow-sm">
                    {new Date(holiday.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  <span className="font-bold text-slate-700">{holiday.label}</span>
                </div>
                <button
                  onClick={() => handleDelete(holiday.id)}
                  className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="mt-8 flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-2xl">
          <Info className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 leading-relaxed">
            <strong>Note:</strong> Holidays only affect tasks when you <strong>Start a Phase</strong>. Adding a holiday after a phase has already started will not automatically shift existing task deadlines. To apply new holidays to an active phase, you must <strong>Reset</strong> the phase and start it again.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HolidayManager;
