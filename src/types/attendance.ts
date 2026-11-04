export type AttendanceStatus = 'Present' | 'Absent' | 'Late';

export interface Student {
  uid: string;
  name: string;
  rollNumber: string;
  department: string;
  email: string;
  semester: string;
  registeredDate: string;
  avatarColor?: string;
}

export interface AttendanceRecord {
  id: string;
  uid: string;
  studentName: string;
  status: AttendanceStatus;
  timestamp: string; // ISO string
  date: string; // YYYY-MM-DD
  dayOfWeek: string; // 'Monday', 'Tuesday', etc.
  time: string; // HH:MM:SS
  deviceId?: string;
  verifiedVia: 'RFID_RC522' | 'MANUAL_OVERRIDE' | 'SIMULATOR';
}

export interface StudentStats {
  uid: string;
  name: string;
  totalClasses: number;
  attendedClasses: number; // Present + Late (or Present)
  absentClasses: number;
  lateClasses: number;
  attendancePercentage: number;
  recentAttendanceRate: number; // last 5 classes
  consecutiveAbsences: number;
  statusToday: AttendanceStatus | 'Not Marked';
  lastAttendedDate?: string;
  dayOfWeekAttendance: Record<string, { total: number; attended: number }>;
}

export interface MLFeatureVector {
  studentAttendancePercentage: number; // 0 - 100
  totalClassesConducted: number;
  totalClassesAttended: number;
  recentAttendanceHistory: number; // 0 - 100 (% of last 5 classes attended)
  consecutiveAbsences: number; // 0, 1, 2, ...
  dayOfWeek: number; // 1 (Mon) to 5 (Fri)
  previousDayPatternScore: number; // historical attendance % on this specific day of week
}

export interface AIPredictionResult {
  uid: string;
  studentName: string;
  predictedStatus: 'Present' | 'Absent';
  confidencePercentage: number; // e.g. 88.5
  attendanceRisk: 'Low' | 'Medium' | 'High';
  currentAttendancePercentage: number;
  projectedAttendancePercentage: number;
  personalizedInsights: string[];
  earlyWarning: boolean;
  warningMessage?: string;
  featureContributions: {
    feature: string;
    impact: 'Positive' | 'Negative' | 'Neutral';
    description: string;
  }[];
}

export interface RiskAnalysisItem {
  uid: string;
  name: string;
  currentPercentage: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  classesNeededFor75: number; // 0 if already >= 75% with safety margin, otherwise min classes to reach 75%
  safeAbsencesAllowed: number; // how many classes they can afford to miss before dropping below 75%
  consecutiveAbsences: number;
  statusToday: string;
  trend: 'Improving' | 'Declining' | 'Stable';
  warningLevel: 'None' | 'Advisory' | 'Severe';
}

export interface RandomForestMetrics {
  totalTrees: number;
  trainingSamplesCount: number;
  oobAccuracy: number; // Out-of-bag accuracy %
  featureImportances: {
    name: string;
    importance: number; // 0 - 1
  }[];
  treeDepths: number[];
  lastTrainedAt: string;
}

export interface FirebaseConnectionConfig {
  databaseURL: string;
  apiKey?: string;
  projectId?: string;
  path: string; // 'attendance'
  isConnected: boolean;
  lastSyncedAt?: string;
}
