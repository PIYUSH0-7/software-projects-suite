import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  CreditCard as CardIcon, 
  TrendingUp, 
  Wallet, 
  AlertCircle 
} from 'lucide-react';
import { CreditCard, Investment, Debt, Transaction, Plan, UserProfile } from '../types';
import { formatCurrency, cn, getUtilizationColor } from '../lib/utils';

interface DashboardProps {
  data: {
    creditCards: CreditCard[];
    investments: Investment[];
    debts: Debt[];
    transactions: Transaction[];
    plans: Plan[];
    profile: UserProfile | null;
  };
  onTabChange: (tab: string) => void;
  onDateSelect: (date: string) => void;
}

export default function Dashboard({ data, onTabChange, onDateSelect }: DashboardProps) {
  const { creditCards, investments, debts, transactions, plans, profile } = data;

  const totalAssets = investments.reduce((sum, inv) => sum + (inv.currentValue || 0), 0);
  const totalLiabilities = debts.reduce((sum, debt) => sum + debt.remainingBalance, 0) + 
                          creditCards.reduce((sum, card) => sum + card.outstandingBalance, 0);
  const netWorth = totalAssets - totalLiabilities;

  const today = new Date().toISOString().split('T')[0];
  const dailySpending = transactions
    .filter(t => t.date.split('T')[0] === today)
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyExpenses = transactions
    .filter(t => new Date(t.date).getMonth() === new Date().getMonth())
    .reduce((sum, t) => sum + t.amount, 0);

  const handleDailySpendingClick = () => {
    onDateSelect(today);
    onTabChange('transactions');
  };

  const chartData = [
    { name: 'Assets', value: totalAssets, color: '#10b981' },
    { name: 'Liabilities', value: totalLiabilities, color: '#ef4444' },
  ];

  const categoryData = transactions.reduce((acc: any[], t) => {
    const existing = acc.find(item => item.name === t.category);
    if (existing) {
      existing.value += t.amount;
    } else {
      acc.push({ name: t.category, value: t.amount });
    }
    return acc;
  }, []).slice(0, 5);

  const COLORS = ['#000000', '#404040', '#737373', '#a3a3a3', '#d4d4d4'];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-neutral-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-neutral-600" />
            </div>
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" />
              +2.4%
            </span>
          </div>
          <p className="text-sm text-neutral-500 font-medium">Net Worth</p>
          <h3 className="text-2xl font-bold text-neutral-900">{formatCurrency(netWorth)}</h3>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-neutral-100 rounded-xl flex items-center justify-center">
              <Wallet className="w-5 h-5 text-neutral-600" />
            </div>
          </div>
          <p className="text-sm text-neutral-500 font-medium">Total Assets</p>
          <h3 className="text-2xl font-bold text-neutral-900">{formatCurrency(totalAssets)}</h3>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-neutral-100 rounded-xl flex items-center justify-center">
              <CardIcon className="w-5 h-5 text-neutral-600" />
            </div>
          </div>
          <p className="text-sm text-neutral-500 font-medium">Total Liabilities</p>
          <h3 className="text-2xl font-bold text-neutral-900">{formatCurrency(totalLiabilities)}</h3>
        </div>

        <div 
          onClick={handleDailySpendingClick}
          className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm cursor-pointer hover:border-black transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-neutral-100 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-neutral-600" />
            </div>
          </div>
          <p className="text-sm text-neutral-500 font-medium">Daily Spending</p>
          <h3 className="text-2xl font-bold text-neutral-900">{formatCurrency(dailySpending)}</h3>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-neutral-100 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-neutral-600" />
            </div>
          </div>
          <p className="text-sm text-neutral-500 font-medium">Monthly Spending</p>
          <h3 className="text-2xl font-bold text-neutral-900">{formatCurrency(monthlyExpenses)}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
          <h4 className="text-lg font-bold mb-6">Assets vs Liabilities</h4>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#737373' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#737373' }} />
                <Tooltip 
                  cursor={{ fill: '#f5f5f5' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Spending Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
          <h4 className="text-lg font-bold mb-6">Spending Breakdown</h4>
          <div className="h-[200px] mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3">
            {categoryData.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-sm text-neutral-600">{item.name}</span>
                </div>
                <span className="text-sm font-medium">{formatCurrency(item.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Credit Card Alerts */}
      <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
        <h4 className="text-lg font-bold mb-6">Credit Card Alerts</h4>
        <div className="space-y-4">
          {creditCards.map(card => {
            const utilization = (card.outstandingBalance / card.creditLimit) * 100;
            return (
              <div key={card.id} className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-lg border border-neutral-200 flex items-center justify-center">
                    <CardIcon className="w-5 h-5 text-neutral-600" />
                  </div>
                  <div>
                    <p className="font-medium text-neutral-900">{card.cardName}</p>
                    <p className="text-xs text-neutral-500">Due on day {card.dueDay} of each month</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn("text-sm font-bold", getUtilizationColor(utilization))}>
                    {utilization.toFixed(1)}% Utilized
                  </p>
                  <p className="text-xs text-neutral-500">{formatCurrency(card.outstandingBalance)} outstanding</p>
                </div>
              </div>
            );
          })}
          {creditCards.length === 0 && (
            <p className="text-neutral-500 text-center py-4 italic">No credit cards added yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
