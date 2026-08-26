
export interface TimetableEntry {
  id: string;
  time: string;
  activity: string;
}

export interface UserProfile {
  name: string;
  timetable: TimetableEntry[];
  onboarded: boolean;
}

export interface Message {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface DailySession {
  date: string;
  summary?: string;
  messages: Message[];
}

export type View = 'onboarding' | 'chat' | 'history' | 'profile';
