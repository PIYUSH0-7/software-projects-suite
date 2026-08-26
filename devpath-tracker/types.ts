
export interface DayEntry {
  raw: string;
  polished: string;
}

export interface WeekData {
  id: string; // unique ID for keying
  weekNumber: number;
  startDate: string; // ISO format YYYY-MM-DD
  days: DayEntry[]; // Index 0 = Day 1, etc.
  summary: string;
  // linkedinPost field removed as summary is now the post
  attachments: {
    leetCode?: string | null; // Base64 or filename
    wakaTime?: string | null;
    github?: string | null;
  };
  isExpanded: boolean;
}

export interface Course {
  id: string;
  title: string;
  folderColor: string;
  weeks: WeekData[];
  isCompleted: boolean;
  pinCode?: string; // 3-digit security code for folder locking
  skillAnalysis?: string; // AI generated feedback
  skillAnalysisCount?: number; // Track how many times analysis was run (max 3)
  completionData?: {
    youtubeUrl: string;
    blogUrl: string;
  };
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  COURSE_DETAIL = 'COURSE_DETAIL',
}

export const INITIAL_FOLDERS = [
  { id: 'dsa', title: '1. DSA with Python', color: 'bg-amber-400' },
  { id: 'mern', title: '2. FullStack MERN', color: 'bg-amber-400' },
  { id: 'react-native', title: '3. React Native', color: 'bg-amber-400' },
  { id: 'adv-dsa', title: '4. Advanced DSA Coding', color: 'bg-amber-400' },
  { id: 'agentic', title: '5. Agentic AI Vibe Coding', color: 'bg-amber-400' },
  { id: 'soft-skills', title: '6. Soft Skills', color: 'bg-amber-400' },
];
