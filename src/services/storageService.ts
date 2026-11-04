import { Student, AttendanceRecord, StudentStats, RiskAnalysisItem } from '../types/attendance';

export const INITIAL_REGISTERED_STUDENTS: Student[] = [
  {
    uid: '16042907',
    name: 'Raj',
    rollNumber: 'CS21B042',
    department: 'Computer Science & Engineering',
    email: 'raj.cs21@college.edu',
    semester: '6th Semester',
    registeredDate: '2024-08-01',
    avatarColor: 'from-blue-600 to-indigo-700'
  },
  {
    uid: '13F97330',
    name: 'Sai',
    rollNumber: 'CS21B058',
    department: 'Computer Science & Engineering',
    email: 'sai.cs21@college.edu',
    semester: '6th Semester',
    registeredDate: '2024-08-01',
    avatarColor: 'from-emerald-600 to-teal-700'
  },
  {
    uid: '3ED4D106',
    name: 'Pranav',
    rollNumber: 'CS21B089',
    department: 'Computer Science & Engineering',
    email: 'pranav.cs21@college.edu',
    semester: '6th Semester',
    registeredDate: '2024-08-01',
    avatarColor: 'from-amber-600 to-orange-700'
  }
];

/**
 * Generate historical semester attendance records spanning 30 class days (Monday to Friday)
 * for the 3 registered RFID cards.
 */
export function generateInitialAttendanceHistory(): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  const baseDate = new Date();
  baseDate.setHours(9, 0, 0, 0);

  // We generate 32 weekday lecture sessions in past 45 calendar days
  const sessionDates: { dateStr: string; dayName: string; dateObj: Date }[] = [];
  let dayOffset = 45;
  while (sessionDates.length < 32 && dayOffset >= 0) {
    const d = new Date(baseDate);
    d.setDate(d.getDate() - dayOffset);
    const day = d.getDay();
    if (day >= 1 && day <= 5) {
      // Monday to Friday
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      sessionDates.push({
        dateStr: d.toISOString().split('T')[0],
        dayName: dayNames[day],
        dateObj: d
      });
    }
    dayOffset--;
  }

  // Pre-determined deterministic patterns reflecting distinct student profiles:
  // Raj: ~93% attendance (punctual, misses only session #12 and #27)
  // Sai: ~81% attendance (solid, but misses ~6 sessions, mostly on Fridays or Mondays)
  // Pranav: ~68% attendance (recent irregular pattern, missed 10 sessions including last 2 consecutively, triggering <75% ML alarm)
  sessionDates.forEach((session, index) => {
    // 1. Raj
    const rajAbsentIndices = [11, 26];
    const rajLateIndices = [4, 18];
    const isRajAbsent = rajAbsentIndices.includes(index);
    const isRajLate = rajLateIndices.includes(index);

    const rajTime = isRajLate ? '09:16:42' : `08:${52 + (index % 6)}:${(10 + (index * 7) % 45).toString().padStart(2, '0')}`;
    const rajDate = new Date(`${session.dateStr}T${rajTime}`);

    records.push({
      id: `att-raj-${index + 1}`,
      uid: '16042907',
      studentName: 'Raj',
      status: isRajAbsent ? 'Absent' : isRajLate ? 'Late' : 'Present',
      timestamp: rajDate.toISOString(),
      date: session.dateStr,
      dayOfWeek: session.dayName,
      time: rajTime,
      deviceId: 'ESP32_RC522_GATE_01',
      verifiedVia: isRajAbsent ? 'MANUAL_OVERRIDE' : 'RFID_RC522'
    });

    // 2. Sai
    const saiAbsentIndices = [3, 9, 14, 20, 25, 29];
    const saiLateIndices = [7, 16];
    const isSaiAbsent = saiAbsentIndices.includes(index);
    const isSaiLate = saiLateIndices.includes(index);

    const saiTime = isSaiLate ? '09:18:15' : `08:${54 + (index % 5)}:${(15 + (index * 11) % 40).toString().padStart(2, '0')}`;
    const saiDate = new Date(`${session.dateStr}T${saiTime}`);

    records.push({
      id: `att-sai-${index + 1}`,
      uid: '13F97330',
      studentName: 'Sai',
      status: isSaiAbsent ? 'Absent' : isSaiLate ? 'Late' : 'Present',
      timestamp: saiDate.toISOString(),
      date: session.dateStr,
      dayOfWeek: session.dayName,
      time: saiTime,
      deviceId: 'ESP32_RC522_GATE_01',
      verifiedVia: isSaiAbsent ? 'MANUAL_OVERRIDE' : 'RFID_RC522'
    });

    // 3. Pranav
    // Pranav misses: 2, 5, 8, 13, 17, 21, 24, 28, 30, 31 (30 and 31 are last 2 sessions, so consecutive absences = 2)
    const pranavAbsentIndices = [2, 5, 8, 13, 17, 21, 24, 28, 30, 31];
    const pranavLateIndices = [10, 22];
    const isPranavAbsent = pranavAbsentIndices.includes(index);
    const isPranavLate = pranavLateIndices.includes(index);

    const pranavTime = isPranavLate ? '09:22:04' : `09:${(index % 4).toString().padStart(2, '0')}:${(20 + (index * 9) % 35).toString().padStart(2, '0')}`;
    const pranavDate = new Date(`${session.dateStr}T${pranavTime}`);

    records.push({
      id: `att-pranav-${index + 1}`,
      uid: '3ED4D106',
      studentName: 'Pranav',
      status: isPranavAbsent ? 'Absent' : isPranavLate ? 'Late' : 'Present',
      timestamp: pranavDate.toISOString(),
      date: session.dateStr,
      dayOfWeek: session.dayName,
      time: pranavTime,
      deviceId: 'ESP32_RC522_GATE_01',
      verifiedVia: isPranavAbsent ? 'MANUAL_OVERRIDE' : 'RFID_RC522'
    });
  });

  // Sort descending by timestamp (newest first)
  return records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

const STORAGE_KEYS = {
  STUDENTS: 'rfid_attendance_students_v1',
  RECORDS: 'rfid_attendance_records_v1',
  FIREBASE_CONFIG: 'rfid_attendance_firebase_config_v1'
};

export const StorageService = {
  getStudents(): Student[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STUDENTS);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Failed to parse students from localStorage', e);
    }
    this.saveStudents(INITIAL_REGISTERED_STUDENTS);
    return INITIAL_REGISTERED_STUDENTS;
  },

  saveStudents(students: Student[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    } catch (e) {
      console.error('Failed to save students to localStorage', e);
    }
  },

  getRecords(): AttendanceRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.RECORDS);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Failed to parse attendance records from localStorage', e);
    }
    const initialRecords = generateInitialAttendanceHistory();
    this.saveRecords(initialRecords);
    return initialRecords;
  },

  saveRecords(records: AttendanceRecord[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
    } catch (e) {
      console.error('Failed to save records to localStorage', e);
    }
  },

  addRecord(record: AttendanceRecord): AttendanceRecord[] {
    const existing = this.getRecords();
    const updated = [record, ...existing];
    this.saveRecords(updated);
    return updated;
  },

  registerStudent(student: Student): Student[] {
    const existing = this.getStudents();
    const filtered = existing.filter(s => s.uid.toLowerCase() !== student.uid.toLowerCase());
    const updated = [...filtered, student];
    this.saveStudents(updated);
    return updated;
  },

  calculateStudentStats(students: Student[], records: AttendanceRecord[]): Record<string, StudentStats> {
    const statsMap: Record<string, StudentStats> = {};
    const todayStr = new Date().toISOString().split('T')[0];

    // Initialize map
    for (const s of students) {
      statsMap[s.uid] = {
        uid: s.uid,
        name: s.name,
        totalClasses: 0,
        attendedClasses: 0,
        absentClasses: 0,
        lateClasses: 0,
        attendancePercentage: 0,
        recentAttendanceRate: 100,
        consecutiveAbsences: 0,
        statusToday: 'Not Marked',
        dayOfWeekAttendance: {
          Monday: { total: 0, attended: 0 },
          Tuesday: { total: 0, attended: 0 },
          Wednesday: { total: 0, attended: 0 },
          Thursday: { total: 0, attended: 0 },
          Friday: { total: 0, attended: 0 },
          Saturday: { total: 0, attended: 0 },
          Sunday: { total: 0, attended: 0 }
        }
      };
    }

    // Sort records chronological ascending for streak & recent calculations
    const sortedAsc = [...records].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Group by student
    const studentLogs: Record<string, AttendanceRecord[]> = {};
    for (const r of sortedAsc) {
      if (!studentLogs[r.uid]) studentLogs[r.uid] = [];
      studentLogs[r.uid].push(r);
    }

    for (const s of students) {
      const logs = studentLogs[s.uid] || [];
      const stats = statsMap[s.uid];
      stats.totalClasses = logs.length;

      let consecutiveAbs = 0;
      const recentWindow: number[] = [];

      for (const log of logs) {
        const isPresent = log.status === 'Present' || log.status === 'Late';

        if (log.status === 'Present') stats.attendedClasses++;
        else if (log.status === 'Late') {
          stats.attendedClasses++;
          stats.lateClasses++;
        } else if (log.status === 'Absent') {
          stats.absentClasses++;
        }

        if (isPresent) {
          consecutiveAbs = 0;
          recentWindow.push(1);
          stats.lastAttendedDate = log.date;
        } else {
          consecutiveAbs++;
          recentWindow.push(0);
        }

        if (recentWindow.length > 5) recentWindow.shift();

        // Day of week stats
        const day = log.dayOfWeek;
        if (stats.dayOfWeekAttendance[day]) {
          stats.dayOfWeekAttendance[day].total++;
          if (isPresent) stats.dayOfWeekAttendance[day].attended++;
        }

        // Check if marked today
        if (log.date === todayStr) {
          stats.statusToday = log.status;
        }
      }

      stats.consecutiveAbsences = consecutiveAbs;
      stats.attendancePercentage =
        stats.totalClasses > 0
          ? Math.round((stats.attendedClasses / stats.totalClasses) * 1000) / 10
          : 0;

      stats.recentAttendanceRate =
        recentWindow.length > 0
          ? Math.round((recentWindow.reduce((a, b) => a + b, 0) / recentWindow.length) * 1000) / 10
          : stats.attendancePercentage;
    }

    return statsMap;
  },

  calculateRiskAnalysis(statsMap: Record<string, StudentStats>): RiskAnalysisItem[] {
    return Object.values(statsMap).map(stats => {
      const pct = stats.attendancePercentage;
      const total = stats.totalClasses;
      const attended = stats.attendedClasses;

      // Calculate classes needed to reach 75%
      // 0.75 <= (attended + X) / (total + X)
      // 0.75*(total + X) <= attended + X
      // 0.75*total + 0.75*X <= attended + X
      // 0.75*total - attended <= 0.25*X
      // X >= (0.75*total - attended) / 0.25
      let classesNeededFor75 = 0;
      let safeAbsencesAllowed = 0;

      if (pct < 75) {
        classesNeededFor75 = Math.max(1, Math.ceil((0.75 * total - attended) / 0.25));
      } else {
        // Safe absences before dropping below 75%:
        // attended / (total + Y) >= 0.75
        // attended >= 0.75*total + 0.75*Y
        // (attended - 0.75*total) / 0.75 >= Y
        safeAbsencesAllowed = Math.max(0, Math.floor((attended - 0.75 * total) / 0.75));
      }

      let riskLevel: 'Low' | 'Medium' | 'High' = 'Low';
      let warningLevel: 'None' | 'Advisory' | 'Severe' = 'None';

      if (pct < 75 || stats.consecutiveAbsences >= 2) {
        riskLevel = 'High';
        warningLevel = 'Severe';
      } else if (pct < 80 || safeAbsencesAllowed <= 1 || stats.recentAttendanceRate < 60) {
        riskLevel = 'Medium';
        warningLevel = 'Advisory';
      } else {
        riskLevel = 'Low';
        warningLevel = 'None';
      }

      let trend: 'Improving' | 'Declining' | 'Stable' = 'Stable';
      if (stats.recentAttendanceRate > pct + 5) trend = 'Improving';
      else if (stats.recentAttendanceRate < pct - 5) trend = 'Declining';

      return {
        uid: stats.uid,
        name: stats.name,
        currentPercentage: pct,
        riskLevel,
        classesNeededFor75,
        safeAbsencesAllowed,
        consecutiveAbsences: stats.consecutiveAbsences,
        statusToday: stats.statusToday,
        trend,
        warningLevel
      };
    });
  }
};
