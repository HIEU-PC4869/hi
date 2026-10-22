export type UserRole = 'Student' | 'Instructor' | 'Advisor' | 'Administrator';

export interface User {
  id: number;
  email: string;
  fullName: string;
  role: UserRole;
  studentId?: string;
  major?: string;
  department?: string;
  status: 'Active' | 'Flagged (EWS)' | 'Suspended';
  courses: string[];
  lastLogin: string;
  avatarUrl?: string;
}

export interface Course {
  id: number;
  code: string;
  name: string;
  schedule: string;
  location: string;
}

export interface StudentCourseStat {
  courseId: number;
  code: string;
  name: string;
  totalSessions: number;
  present: number;
  late: number;
  absent: number;
  excused: number;
  attendancePercentage: number;
  complianceStatus: 'Good Standing' | 'Notice' | '<80% Warning Threshold' | 'Exemplary';
}

export interface ExcuseRequest {
  id: number;
  studentId: number;
  studentName: string;
  courseCode: string;
  courseName: string;
  dateAbsent: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  docName?: string;
  docUrl?: string;
}

export interface ActiveSession {
  sessionId: number;
  courseCode: string;
  courseName: string;
  sessionCode: string;
  startTime: string;
  isActive: boolean;
  remainingSeconds: number;
}

export interface RosterStudent {
  attendanceId: number;
  studentId: number;
  fullName: string;
  initials: string;
  status: 'Present' | 'Late' | 'Absent' | 'Excused';
  timeLogged: string;
  method: 'QR Scan' | 'PIN Code' | 'Geolocation' | 'Manual Override' | '—';
  updatedBy?: number;
}

export interface EWSStudentFlag {
  id: number;
  studentId: number;
  studentName: string;
  avatarUrl: string;
  major: string;
  advisorName: string;
  courseCode: string;
  courseName: string;
  attendanceRate: number;
  consecutiveAbsences: number;
  priorAlerts: number;
  riskLevel: 'CRITICAL' | 'HIGH' | 'MODERATE';
  timeline: {
    date: string;
    actor: string;
    title: string;
    description: string;
    type: 'referral' | 'warning' | 'counseling';
  }[];
  counselingNotes: string;
}

export interface AuditLogItem {
  id: number;
  userId?: number;
  userName?: string;
  action: string;
  timestamp: string;
  details: string;
}
