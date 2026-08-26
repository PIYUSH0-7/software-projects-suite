export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  monthlyBudget?: number;
  dailySpendingLimit?: number;
  budgetDetails?: { category: string, amount: number }[];
  currency?: string;
  createdAt: string;
}

export interface CreditCard {
  id: string;
  uid: string;
  cardName: string;
  bankName: string;
  creditLimit: number;
  availableLimit: number;
  outstandingBalance: number;
  monthlyOutstanding: number;
  dueDay: number; // Day of month (1-31)
  statementDay: number; // Day of month (1-31)
  minimumDue: number;
  lastUpdated: string;
}

export interface Investment {
  id: string;
  uid: string;
  type: 'savings' | 'fd' | 'mutual_fund' | 'stock' | 'other';
  name: string;
  investedAmount: number;
  currentValue: number;
  growthRate?: number;
  createdAt: string;
}

export interface Debt {
  id: string;
  uid: string;
  source: string;
  totalAmount: number;
  remainingBalance: number;
  interestRate?: number;
  dueDate?: string;
  repaymentSchedule?: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  uid: string;
  amount: number;
  category: string;
  paymentMode: string;
  description?: string;
  date: string;
}

export interface Plan {
  id: string;
  uid: string;
  amount: number;
  category: string;
  date: string;
  description?: string;
  isPaid: boolean;
  isFixed?: boolean;
  fixedDay?: number;
}

export interface SavingEntry {
  id: string;
  uid: string;
  amount: number;
  source: string;
  date: string;
  growthRate?: number; // Annual %
}

export interface BorrowingEntry {
  id: string;
  uid: string;
  amount: number;
  source: string;
  date: string;
  growthRate?: number; // Annual %
}

export interface Notification {
  id: string;
  uid: string;
  title: string;
  message: string;
  type: 'due_date' | 'budget_limit' | 'utilization' | 'plan';
  isRead: boolean;
  createdAt: string;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string | null;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}
