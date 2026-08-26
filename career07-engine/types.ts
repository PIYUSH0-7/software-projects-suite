export interface Task {
  id: string;
  text: string;
  isCompleted: boolean;
  notes?: string;
}

export interface Section {
  id: string;
  title: string;
  tasks: Task[];
}

export interface DomainResources {
  book: string;
  teacher: string;
  courseLink?: string;
}

export interface Domain {
  id: string;
  title: string;
  description: string;
  iconName: string; // Used to map to Lucide icons
  phase: string;
  examDate?: string;
  strategy?: string;
  mindset?: string;
  resources?: DomainResources;
  sections: Section[];
}

export interface UserTask {
  id: string;
  userId: string;
  phaseId: string;
  skillName: string;
  skillType: 'main' | 'life';
  type: 'video' | 'book' | 'pyq' | 'syllabus' | 'cert' | 'teaching' | 'revision';
  title: string;
  hoursRequired: number;
  startDate: string; // ISO string
  deadline: string; // ISO string
  assignedDays: string[]; // e.g. ["Monday", "Tuesday"]
  status: 'pending' | 'submitted' | 'approved';
  submissionUrl?: string;
  submittedAt?: string;
}

export interface UserStats {
  userId: string;
  resetCount: number;
  workingHours?: Record<number, number>; // 0-6 (Sun-Sat)
  taskHours?: Record<string, number>; // task type -> hours
}

export interface PhaseStatus {
  userId: string;
  phaseId: string;
  startDate: string; // ISO string
  isStarted: boolean;
}

export interface Holiday {
  id: string;
  userId: string;
  date: string; // ISO string (YYYY-MM-DD)
  label: string;
}

export interface AppState {
  domains: Domain[];
  activeDomainId: string;
  userTasks: UserTask[];
  phaseStatuses: PhaseStatus[];
}

export type View = 'dashboard' | 'domain' | 'task-submitter';
