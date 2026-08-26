import React, { useState, useEffect } from 'react';
import { 
  auth, 
  db 
} from './lib/firebase';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot,
  collection,
  query,
  where,
  orderBy,
  limit,
  addDoc
} from 'firebase/firestore';
import { 
  LayoutDashboard, 
  CreditCard as CardIcon, 
  TrendingUp, 
  Wallet, 
  History, 
  Calendar, 
  Settings, 
  LogOut, 
  Plus, 
  Bell,
  MessageSquare,
  ChevronRight,
  AlertCircle,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  UserProfile, 
  CreditCard, 
  Investment, 
  Debt, 
  Transaction, 
  Plan, 
  SavingEntry,
  BorrowingEntry,
  Notification,
  OperationType
} from './types';
import { formatCurrency, cn } from './lib/utils';

// Components
import Dashboard from './components/Dashboard';
import CreditCards from './components/CreditCards';
import Investments from './components/Investments';
import Debts from './components/Debts';
import Transactions from './components/Transactions';
import AIAssistant from './components/AIAssistant';
import Planning from './components/Planning';
import Budgeting from './components/Budgeting';
import OneCrTracker from './components/OneCrTracker';
import Auth from './components/Auth';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('transactions');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [savings, setSavings] = useState<SavingEntry[]>([]);
  const [borrowings, setBorrowings] = useState<BorrowingEntry[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Fetch or create profile
        const profileRef = doc(db, 'users', user.uid);
        const profileSnap = await getDoc(profileRef);
        
        if (profileSnap.exists()) {
          setProfile(profileSnap.data() as UserProfile);
        } else {
          const newProfile: UserProfile = {
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || '',
            createdAt: new Date().toISOString(),
            currency: 'INR'
          };
          await setDoc(profileRef, newProfile);
          setProfile(newProfile);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Real-time listeners
  useEffect(() => {
    if (!user) return;

    const unsubCards = onSnapshot(
      query(collection(db, 'creditCards'), where('uid', '==', user.uid)),
      (snap) => setCreditCards(snap.docs.map(d => ({ id: d.id, ...d.data() } as CreditCard)))
    );

    const unsubInvestments = onSnapshot(
      query(collection(db, 'investments'), where('uid', '==', user.uid)),
      (snap) => setInvestments(snap.docs.map(d => ({ id: d.id, ...d.data() } as Investment)))
    );

    const unsubDebts = onSnapshot(
      query(collection(db, 'debts'), where('uid', '==', user.uid)),
      (snap) => setDebts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Debt)))
    );

    const unsubTransactions = onSnapshot(
      query(collection(db, 'transactions'), where('uid', '==', user.uid), orderBy('date', 'desc'), limit(50)),
      (snap) => setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)))
    );

    const unsubPlans = onSnapshot(
      query(collection(db, 'plans'), where('uid', '==', user.uid)),
      (snap) => setPlans(snap.docs.map(d => ({ id: d.id, ...d.data() } as Plan)))
    );

    const unsubSavings = onSnapshot(
      query(collection(db, 'savings'), where('uid', '==', user.uid)),
      (snap) => setSavings(snap.docs.map(d => ({ id: d.id, ...d.data() } as SavingEntry)))
    );

    const unsubBorrowings = onSnapshot(
      query(collection(db, 'borrowings'), where('uid', '==', user.uid)),
      (snap) => setBorrowings(snap.docs.map(d => ({ id: d.id, ...d.data() } as BorrowingEntry)))
    );

    const unsubNotifications = onSnapshot(
      query(collection(db, 'notifications'), where('uid', '==', user.uid), orderBy('createdAt', 'desc'), limit(10)),
      (snap) => setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() } as Notification)))
    );

    return () => {
      unsubCards();
      unsubInvestments();
      unsubDebts();
      unsubTransactions();
      unsubPlans();
      unsubSavings();
      unsubBorrowings();
      unsubNotifications();
    };
  }, [user]);

  // Notification logic
  useEffect(() => {
    if (!user || !profile) return;

    const checkNotifications = async () => {
      // Check Credit Card Due Dates
      for (const card of creditCards) {
        const today = new Date();
        const dueDate = new Date(today.getFullYear(), today.getMonth(), card.dueDay);
        
        // If due date for this month has passed, check next month
        if (dueDate < today) {
          dueDate.setMonth(dueDate.getMonth() + 1);
        }

        const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays <= 3 && diffDays >= 0) {
          const existing = notifications.find(n => n.type === 'due_date' && n.message.includes(card.cardName));
          if (!existing) {
            await addDoc(collection(db, 'notifications'), {
              uid: user.uid,
              title: 'Upcoming Due Date',
              message: `Your ${card.cardName} bill is due in ${diffDays} days.`,
              type: 'due_date',
              isRead: false,
              createdAt: new Date().toISOString()
            });
          }
        }
      }

      // Check Budget Limits
      if (profile.monthlyBudget) {
        const monthlySpent = transactions
          .filter(t => new Date(t.date).getMonth() === new Date().getMonth())
          .reduce((sum, t) => sum + t.amount, 0);
        
        if (monthlySpent > profile.monthlyBudget) {
          const existing = notifications.find(n => n.type === 'budget_limit' && n.message.includes('monthly budget'));
          if (!existing) {
            await addDoc(collection(db, 'notifications'), {
              uid: user.uid,
              title: 'Budget Exceeded',
              message: `You have exceeded your monthly budget of ${formatCurrency(profile.monthlyBudget)}.`,
              type: 'budget_limit',
              isRead: false,
              createdAt: new Date().toISOString()
            });
          }
        }
      }

      // Check Fixed Plans (Reminders)
      for (const plan of plans) {
        if (plan.isFixed && !plan.isPaid) {
          const today = new Date().getDate();
          if (plan.fixedDay === today) {
            const existing = notifications.find(n => n.type === 'plan' && n.message.includes(plan.description || plan.category));
            if (!existing) {
              await addDoc(collection(db, 'notifications'), {
                uid: user.uid,
                title: 'Plan Reminder',
                message: `Today is the fixed date for your plan: ${plan.description || plan.category} (${formatCurrency(plan.amount)})`,
                type: 'plan',
                isRead: false,
                createdAt: new Date().toISOString()
              });
            }
          }
        }
      }

      // Monthly Summary (Simulated Email/Report)
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthName = lastMonth.toLocaleString('default', { month: 'long' });
      const summaryId = `monthly-summary-${lastMonth.getFullYear()}-${lastMonth.getMonth()}`;
      
      const existingSummary = notifications.find(n => n.title === `Monthly Summary: ${lastMonthName}`);
      if (!existingSummary) {
        const lastMonthSpent = transactions
          .filter(t => {
            const d = new Date(t.date);
            return d.getMonth() === lastMonth.getMonth() && d.getFullYear() === lastMonth.getFullYear();
          })
          .reduce((sum, t) => sum + t.amount, 0);

        if (lastMonthSpent > 0) {
          await addDoc(collection(db, 'notifications'), {
            uid: user.uid,
            title: `Monthly Summary: ${lastMonthName}`,
            message: `Your total spending for ${lastMonthName} was ${formatCurrency(lastMonthSpent)}. Check your history for details.`,
            type: 'budget_limit',
            isRead: false,
            createdAt: new Date().toISOString()
          });
        }
      }
    };

    checkNotifications();
  }, [user, profile, creditCards, transactions, notifications, plans]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard data={{ creditCards, investments, debts, transactions, plans, profile }} onTabChange={setActiveTab} onDateSelect={setSelectedDate} />;
      case 'cards': return <CreditCards cards={creditCards} investments={investments} />;
      case 'investments': return <Investments investments={investments} />;
      case 'debts': return <Debts debts={debts} investments={investments} />;
      case 'transactions': return <Transactions transactions={transactions} initialDate={selectedDate} onDateClear={() => setSelectedDate(null)} />;
      case 'assistant': return <AIAssistant data={{ creditCards, investments, debts, transactions, plans }} />;
      case 'planning': return <Planning plans={plans} />;
      case 'budgeting': return <Budgeting profile={profile} transactions={transactions} />;
      case 'onecr': return <OneCrTracker savings={savings} borrowings={borrowings} />;
      default: return <Dashboard data={{ creditCards, investments, debts, transactions, plans, profile }} onTabChange={setActiveTab} onDateSelect={setSelectedDate} />;
    }
  };

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'cards', icon: CardIcon, label: 'Cards' },
    { id: 'investments', icon: TrendingUp, label: 'Investments' },
    { id: 'debts', icon: Wallet, label: 'Debts' },
    { id: 'transactions', icon: History, label: 'Transactions' },
    { id: 'assistant', icon: MessageSquare, label: 'AI Assistant' },
    { id: 'planning', icon: Calendar, label: 'Planning' },
    { id: 'budgeting', icon: PieChart, label: 'Budgeting' },
    { id: 'onecr', icon: Target, label: '1CR Tracker' },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-neutral-200 p-4 flex flex-col">
        <div className="flex items-center gap-2 px-2 mb-8">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
            <TrendingUp className="text-white w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">FinAI</h1>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                activeTab === item.id 
                  ? "bg-black text-white" 
                  : "text-neutral-600 hover:bg-neutral-100"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-4 border-t border-neutral-200">
          <div className="flex items-center gap-3 px-3 py-2 mb-4">
            <div className="w-8 h-8 bg-neutral-200 rounded-full overflow-hidden">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || ''} referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-neutral-500 text-xs">
                  {user.displayName?.charAt(0) || 'U'}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-900 truncate">{user.displayName}</p>
              <p className="text-xs text-neutral-500 truncate">{user.email}</p>
            </div>
          </div>
          <button 
            onClick={() => signOut(auth)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4 md:p-8">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-neutral-900">
              {navItems.find(i => i.id === activeTab)?.label}
            </h2>
            <p className="text-neutral-500 text-sm">Manage your finances with AI assistance.</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-neutral-600 hover:bg-neutral-100 rounded-full transition-colors">
              <Bell className="w-5 h-5" />
              {notifications.some(n => !n.isRead) && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
              )}
            </button>
            <button 
              onClick={() => setActiveTab('assistant')}
              className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-neutral-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Quick Action
            </button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
