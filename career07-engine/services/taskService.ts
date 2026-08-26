import { db } from './firebase';
import { collection, addDoc, query, where, getDocs, doc, setDoc, serverTimestamp, deleteDoc, writeBatch, getDoc } from 'firebase/firestore';
import { UserTask, PhaseStatus, UserStats, Holiday } from '../types';

export const TASK_TYPES = [
  { type: 'video', title: 'Video Course & Notes', hours: 64 },
  { type: 'book', title: 'Book Overview', hours: 12 },
  { type: 'pyq', title: 'Solve PYQs', hours: 32 },
  { type: 'syllabus', title: 'Syllabus Checklist', hours: 3 },
  { type: 'cert', title: 'Certificates & Job Sims', hours: 21 },
  { type: 'teaching', title: 'Short Notes & Teaching', hours: 20 },
  { type: 'revision', title: 'Spaced Revision', hours: 20 }, // Added 7th task
] as const;

export const PHASE_SKILLS: Record<string, { main: string[], life: string[] }> = {
  '1': { 
    main: ['DSA with Python', 'Full Stack Web Dev'], 
    life: ['Learning Mgmt', 'Health Mgmt'] 
  },
  '2': { 
    main: ['App Development', 'Advanced DSA'], 
    life: ['Thinking Skills', 'Communication'] 
  },
  '3': { 
    main: ['Agentic AI', 'Soft Skills'], 
    life: ['Time Mgmt', 'Finance Mgmt'] 
  },
  '4': { 
    main: ['Must-Have Skills'], 
    life: ['Relationships'] 
  },
  '5': { 
    main: ['Job Hunt & Projects'], 
    life: [] 
  }
};

const NORMAL_SCHEDULE: Record<number, number> = {
  1: 3, // Monday
  2: 3, // Tuesday
  3: 6, // Wednesday
  4: 6, // Thursday
  5: 6, // Friday
  6: 10, // Saturday
  0: 10, // Sunday
};

const AFTER_LEAVE_HOURS = 10;
const LEAVE_START = new Date('2026-05-01');
const LEAVE_END = new Date('2026-05-10');

const getDaysList = (start: Date, end: Date): string[] => {
  const days = [];
  const curr = new Date(start);
  while (curr <= end) {
    days.push(curr.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase());
    curr.setDate(curr.getDate() + 1);
  }
  return days;
};

export const calculateTaskDuration = (
  startDate: Date, 
  hoursRequired: number, 
  holidays: string[] = [],
  workingHours: Record<number, number> = NORMAL_SCHEDULE
) => {
  let currentDate = new Date(startDate);
  let remainingHours = hoursRequired;
  const daysList: string[] = [];

  while (remainingHours > 0) {
    const dateStr = currentDate.toISOString().split('T')[0];
    
    // Check if in leave period OR user holiday
    const isHoliday = (currentDate >= LEAVE_START && currentDate <= LEAVE_END) || holidays.includes(dateStr);

    if (isHoliday) {
      currentDate.setDate(currentDate.getDate() + 1);
      continue;
    }

    let hoursForDay = 0;
    if (currentDate > LEAVE_END) {
      hoursForDay = AFTER_LEAVE_HOURS;
    } else {
      const dayOfWeek = currentDate.getDay();
      hoursForDay = workingHours[dayOfWeek] || 0;
    }

    if (hoursForDay > 0) {
      const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
      if (!daysList.includes(dayName)) {
        daysList.push(dayName);
      }
      
      remainingHours -= hoursForDay;
    }

    if (remainingHours > 0) {
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  return { endDate: currentDate, days: daysList };
};

export const isPhaseCompleted = async (userId: string, phaseId: string): Promise<boolean> => {
  const tasks = await getUserTasks(userId, phaseId);
  if (tasks.length === 0) return false;
  return tasks.every(t => t.status === 'approved');
};

export const startPhase = async (
  userId: string, 
  phaseId: string, 
  customWorkingHours?: Record<number, number>,
  customTaskHours?: Record<string, number>
) => {
  // Check dependency: Phase N requires Phase N-1 to be completed
  const currentPhaseNum = parseInt(phaseId);
  if (currentPhaseNum > 1) {
    const prevPhaseId = (currentPhaseNum - 1).toString();
    const prevCompleted = await isPhaseCompleted(userId, prevPhaseId);
    if (!prevCompleted) {
      throw new Error(`Phase ${prevPhaseId} must be completed (all tasks approved) before starting Phase ${phaseId}.`);
    }
  }

  // Fetch holidays to adjust durations
  const holidays = await getHolidays(userId);
  const holidayDates = holidays.map(h => h.date);

  const workingHours = customWorkingHours || NORMAL_SCHEDULE;

  const startDate = new Date();
  const statusId = `${userId}_${phaseId}`;
  
  // 1. Save Phase Status
  await setDoc(doc(db, 'phase_statuses', statusId), {
    userId,
    phaseId,
    startDate: startDate.toISOString(),
    isStarted: true
  });

  // 2. Save preferences to user doc
  if (customWorkingHours || customTaskHours) {
    await setDoc(doc(db, 'users', userId), {
      workingHours: customWorkingHours || null,
      taskHours: customTaskHours || null
    }, { merge: true });
  }

  // 3. Auto-assign tasks
  const phaseInfo = PHASE_SKILLS[phaseId];
  if (!phaseInfo) return;

  const batch = writeBatch(db);
  let currentMainStartDate = new Date(startDate);

  for (let i = 0; i < phaseInfo.main.length; i++) {
    const mainSkill = phaseInfo.main[i];
    const lifeSkill = phaseInfo.life[i];

    let currentTaskStartDate = new Date(currentMainStartDate);
    const skillStartDate = new Date(currentMainStartDate);
    let skillEndDate = new Date(currentMainStartDate);

    // Filter out revision to handle it as a daily task spanning the skill duration
    const technicalTasks = TASK_TYPES.filter(t => t.type !== 'revision');

    for (const taskTemplate of technicalTasks) {
      const hours = customTaskHours?.[taskTemplate.type] || taskTemplate.hours;
      const { endDate, days } = calculateTaskDuration(currentTaskStartDate, hours, holidayDates, workingHours);
      
      // Assign Main Skill Task
      const mainTaskRef = doc(collection(db, 'user_tasks'));
      batch.set(mainTaskRef, {
        userId,
        phaseId,
        skillName: mainSkill,
        skillType: 'main',
        type: taskTemplate.type,
        title: taskTemplate.title,
        hoursRequired: hours,
        startDate: currentTaskStartDate.toISOString(),
        deadline: endDate.toISOString(),
        assignedDays: days,
        status: 'pending',
        createdAt: serverTimestamp()
      });

      // Assign Life Skill Task (if exists) with same dates
      if (lifeSkill) {
        const lifeTaskRef = doc(collection(db, 'user_tasks'));
        batch.set(lifeTaskRef, {
          userId,
          phaseId,
          skillName: lifeSkill,
          skillType: 'life',
          type: taskTemplate.type,
          title: taskTemplate.title,
          hoursRequired: hours,
          startDate: currentTaskStartDate.toISOString(),
          deadline: endDate.toISOString(),
          assignedDays: days,
          status: 'pending',
          createdAt: serverTimestamp()
        });
      }

      skillEndDate = new Date(endDate);
      currentTaskStartDate = new Date(endDate);
      currentTaskStartDate.setDate(currentTaskStartDate.getDate() + 1);
    }

    // Assign Spaced Revision for this skill (Daily)
    const revisionTemplate = TASK_TYPES.find(t => t.type === 'revision');
    if (revisionTemplate) {
      const hours = customTaskHours?.[revisionTemplate.type] || revisionTemplate.hours;
      const mainRevRef = doc(collection(db, 'user_tasks'));
      batch.set(mainRevRef, {
        userId,
        phaseId,
        skillName: mainSkill,
        skillType: 'main',
        type: 'revision',
        title: revisionTemplate.title,
        hoursRequired: hours,
        startDate: skillStartDate.toISOString(),
        deadline: skillEndDate.toISOString(),
        assignedDays: ['DAILY'],
        status: 'pending',
        createdAt: serverTimestamp()
      });

      if (lifeSkill) {
        const lifeRevRef = doc(collection(db, 'user_tasks'));
        batch.set(lifeRevRef, {
          userId,
          phaseId,
          skillName: lifeSkill,
          skillType: 'life',
          type: 'revision',
          title: revisionTemplate.title,
          hoursRequired: hours,
          startDate: skillStartDate.toISOString(),
          deadline: skillEndDate.toISOString(),
          assignedDays: ['DAILY'],
          status: 'pending',
          createdAt: serverTimestamp()
        });
      }
    }

    // Next main skill starts after the current one finishes
    currentMainStartDate = new Date(skillEndDate);
    currentMainStartDate.setDate(currentMainStartDate.getDate() + 1);
  }

  await batch.commit();
};

export const getHolidays = async (userId: string): Promise<Holiday[]> => {
  const q = query(collection(db, 'holidays'), where('userId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Holiday));
};

export const addHoliday = async (userId: string, date: string, label: string) => {
  await addDoc(collection(db, 'holidays'), {
    userId,
    date,
    label,
    createdAt: serverTimestamp()
  });
};

export const deleteHoliday = async (holidayId: string) => {
  await deleteDoc(doc(db, 'holidays', holidayId));
};

export const getUserStats = async (userId: string): Promise<UserStats> => {
  const docRef = doc(db, 'users', userId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    return { 
      userId, 
      resetCount: data.resetCount || 0,
      workingHours: data.workingHours,
      taskHours: data.taskHours
    };
  }
  return { userId, resetCount: 0 };
};

export const resetPhaseTasks = async (userId: string, phaseId: string) => {
  const statusId = `${userId}_${phaseId}`;
  const status = await getPhaseStatus(userId, phaseId);
  const stats = await getUserStats(userId);
  
  if (!status) throw new Error("Phase not started.");

  const batch = writeBatch(db);

  // 1. Delete all tasks for this phase
  const q = query(collection(db, 'user_tasks'), where('userId', '==', userId), where('phaseId', '==', phaseId));
  const snapshot = await getDocs(q);
  snapshot.forEach(d => batch.delete(d.ref));

  // 2. Update reset count and reset status
  batch.update(doc(db, 'phase_statuses', statusId), {
    isStarted: false
  });

  batch.set(doc(db, 'users', userId), {
    resetCount: stats.resetCount + 1
  }, { merge: true });

  await batch.commit();
};

export const getUserTasks = async (userId: string, phaseId?: string) => {
  let q = query(collection(db, 'user_tasks'), where('userId', '==', userId));
  if (phaseId) {
    q = query(q, where('phaseId', '==', phaseId));
  }
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserTask));
};

export const getPhaseStatus = async (userId: string, phaseId: string) => {
  const snapshot = await getDocs(query(
    collection(db, 'phase_statuses'),
    where('userId', '==', userId),
    where('phaseId', '==', phaseId)
  ));
  if (snapshot.empty) return null;
  return snapshot.docs[0].data() as PhaseStatus;
};

export const submitTaskProof = async (taskId: string, submissionUrl: string) => {
  await setDoc(doc(db, 'user_tasks', taskId), {
    status: 'submitted',
    submissionUrl,
    submittedAt: new Date().toISOString()
  }, { merge: true });
};
