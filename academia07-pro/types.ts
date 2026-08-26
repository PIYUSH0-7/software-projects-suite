export interface User {
  email: string;
  uid: string;
}

export interface StudentProfile {
  uid: string;
  displayName: string;
  email: string;
  branch: string;
  currentSemester: string; // Changed from year to currentSemester (e.g., "1", "8")
  skills: string[];
  bio: string;
  linkedin?: string;
  github?: string;
  avatar?: string;
  role?: 'student' | 'teacher' | 'admin';
}

export interface Subject {
  id: string;
  name: string;
  assignmentsDone: number;
  chaptersDone: number;
  notesLink: string;
  isTheory: boolean; // Helper for dashboard calculation
  code?: string;
}

export interface SubjectMarks {
  st1: number;
  st2: number;
  st3: number;
  assignments: number;
  quizzes: number;
  attendance: number;
}

export interface SemesterData {
  id: string;
  sgpa: number;
  credits: number;
  semesterNumber: number;
}

export interface CurriculumSubject {
  code: string;
  name: string;
  credits: number;
  type: 'Theory' | 'Practical' | 'Audit';
}

export interface SemesterCurriculum {
  semester: number;
  subjects: CurriculumSubject[];
  totalCredits: number;
}

export interface AttendanceRecord {
  id?: string;
  studentId: string;
  studentName: string;
  branch: string;
  semester: string;
  subjectCode: string;
  subjectName: string;
  date: string;
  status: 'Present' | 'Absent';
  recordedBy: string;
  approved: boolean;
  lastModifiedBy?: string;
}

export interface InternalMarksRecord {
  id?: string;
  studentId: string;
  studentName: string;
  branch: string;
  semester: string;
  subjectCode: string;
  subjectName: string;
  st1: number;
  st2: number;
  st3: number;
  assignments: number;
  quizzes: number;
  attendancePercentage: number;
  calculatedTotal: number;
  locked: boolean;
  recordedBy: string;
  lastModifiedBy?: string;
  approved?: boolean;
}

export interface Assignment {
  id?: string;
  title: string;
  description: string;
  subjectCode: string;
  subjectName: string;
  branch: string;
  semester: string;
  dueDate: string;
  uploadedBy: string;
  notesLink?: string;
}

export interface Grievance {
  id?: string;
  studentId: string;
  studentName: string;
  title: string;
  description: string;
  category: 'Attendance' | 'Marks' | 'Exam Form' | 'Other';
  status: 'Pending' | 'Resolved';
  response?: string;
  createdAt: string;
  resolvedBy?: string;
}
