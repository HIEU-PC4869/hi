import { User, Course, StudentCourseStat, ExcuseRequest, ActiveSession, RosterStudent, EWSStudentFlag, AuditLogItem } from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 1001,
    email: 'alex.rivera@student.univ.edu',
    fullName: 'Alex Rivera',
    role: 'Student',
    studentId: '24091',
    major: 'B.S. Software Engineering • Year 3',
    department: 'Dept. of Computer Science',
    status: 'Active',
    courses: ['CS-301', 'ENG-204', 'MATH-310', 'PHY-102'],
    lastLogin: 'Today, 08:42 AM',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDW1H8demv24Fah4Ts3AEOPQ5WdWNffOJQfNqXBUWmlmYc3qNcW4o5dGuk8G6hnB87ClAIPlVd5v2aOQh2W69QAQ2-jBhn1EZSzLkYsBdcxHlrw2sYR2U8zmNOEkFyAhcc-mZMQTWzc2LdNXFJvMUuNE1XtiGDQDOLqXw-XSg8ANSHc5SpAUvkzqc1DtWAZ06wIK_TiUgikB3Akt1czYlRABBPV2fssONQTY2VM0nXcNVdTdBa9Zqz9'
  },
  {
    id: 1002,
    email: 'dr.vance@faculty.univ.edu',
    fullName: 'Dr. Evelyn Vance',
    role: 'Instructor',
    major: 'Faculty / Lead Instructor',
    department: 'Faculty of Engineering',
    status: 'Active',
    courses: ['CS-301', 'CS-402'],
    lastLogin: 'Today, 07:15 AM',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAzH-7fzikK9qt-ALvc2g0BvjVT5Gp3inTEebEwIS0MvJ72EFbi-yxgtfI262r-fA3Vet-2f3WoJHp1rNvURCxECc7eAQ7zvCSilEUSPfw2UyM5s3MjBiOh8Znl64IunmkvmyRd_oacy99NeT-VqE_UJVYb1WXTU-ZEpf-g4iBEHh-Hybcxi9vlinYBxOFga2qSlovHKVMhDjxSgctnUyaMZK-SCs4Jp59aZLnNsg0NzRszWEh--3Yu'
  },
  {
    id: 1003,
    email: 'm.brody@counseling.univ.edu',
    fullName: 'Marcus Brody',
    role: 'Advisor',
    major: 'Lead Academic Advisor',
    department: 'Student Support Services',
    status: 'Active',
    courses: ['All CS Undergrads'],
    lastLogin: 'Yesterday, 04:30 PM',
  },
  {
    id: 1004,
    email: 'sysadmin@univ.edu',
    fullName: 'Root Systems Admin',
    role: 'Administrator',
    major: 'Global Root Privileges',
    department: 'Global Campus Services',
    status: 'Active',
    courses: ['System Master Node'],
    lastLogin: 'Active Now',
  },
  {
    id: 1005,
    email: 'sarah.jenkins@student.univ.edu',
    fullName: 'Sarah Jenkins',
    role: 'Student',
    studentId: '24094',
    major: 'B.S. Computer Science • Year 2',
    department: 'Dept. of Computer Science',
    status: 'Flagged (EWS)',
    courses: ['CS-301', 'ENG-204'],
    lastLogin: '3 days ago',
  },
  {
    id: 1006,
    email: 'david.kim@student.univ.edu',
    fullName: 'David Kim',
    role: 'Student',
    studentId: '24108',
    major: 'B.S. Computer Engineering • Year 2',
    department: 'Faculty of Engineering',
    status: 'Flagged (EWS)',
    courses: ['PHY-102', 'CS-301'],
    lastLogin: '4 days ago',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuADoR_pr70uOMzxF8haBZsFbnfflGtEmz87IJtymbTPkG4FjzmhocuVzAXuqatOpEYRhcRczLmgaqm5bJnMUaLnVGvU2UxeAcf6e6N3MH0zIGidm1ceLBByyO6NlAKp4dGepx7mqTyHlNAmjkQdXnfJWOxWeYgLe_ioiS9aeR0AyP7KWGoT9_L8Bj4yc70DlpGP8r33LbMJ3tZFIZpGFf9fyti2NTqcvnMUVgOrympMpnjLnRGOv7TE'
  }
];

export const INITIAL_COURSES: Course[] = [
  { id: 1, code: 'CS-301', name: 'Advanced Data Structures', schedule: 'Mon/Wed 10:00 AM', location: 'Hall B-12' },
  { id: 2, code: 'ENG-204', name: 'Technical Communication', schedule: 'Tue/Thu 11:30 AM', location: 'Online Studio' },
  { id: 3, code: 'MATH-310', name: 'Linear Algebra', schedule: 'Mon/Wed/Fri 01:00 PM', location: 'Science 402' },
  { id: 4, code: 'PHY-102', name: 'Engineering Physics II', schedule: 'Tue/Thu 02:00 PM', location: 'Lab 1A' }
];

export const INITIAL_STUDENT_STATS: StudentCourseStat[] = [
  {
    courseId: 1,
    code: 'CS-301',
    name: 'Advanced Data Structures',
    totalSessions: 28,
    present: 25,
    late: 2,
    absent: 1,
    excused: 0,
    attendancePercentage: 92.8,
    complianceStatus: 'Good Standing'
  },
  {
    courseId: 2,
    code: 'ENG-204',
    name: 'Technical Communication',
    totalSessions: 20,
    present: 15,
    late: 1,
    absent: 3,
    excused: 1,
    attendancePercentage: 80.0,
    complianceStatus: 'Notice'
  },
  {
    courseId: 3,
    code: 'MATH-310',
    name: 'Linear Algebra',
    totalSessions: 32,
    present: 30,
    late: 1,
    absent: 1,
    excused: 0,
    attendancePercentage: 96.8,
    complianceStatus: 'Exemplary'
  },
  {
    courseId: 4,
    code: 'PHY-102',
    name: 'Engineering Physics II',
    totalSessions: 26,
    present: 19,
    late: 2,
    absent: 4,
    excused: 1,
    attendancePercentage: 76.9,
    complianceStatus: '<80% Warning Threshold'
  }
];

export const INITIAL_ROSTER: RosterStudent[] = [
  { attendanceId: 501, studentId: 20240018, fullName: 'Marcus Chen', initials: 'MC', status: 'Present', timeLogged: '10:01:24 AM', method: 'QR Scan' },
  { attendanceId: 502, studentId: 20240104, fullName: 'Aaliyah Lawson', initials: 'AL', status: 'Present', timeLogged: '10:02:11 AM', method: 'PIN Code' },
  { attendanceId: 503, studentId: 20230892, fullName: 'Devon Kim', initials: 'DK', status: 'Late', timeLogged: '10:08:45 AM', method: 'Geolocation' },
  { attendanceId: 504, studentId: 20240341, fullName: 'Sophia Hernandez', initials: 'SH', status: 'Present', timeLogged: '10:00:52 AM', method: 'QR Scan' },
  { attendanceId: 505, studentId: 20240220, fullName: 'Julian Mercer', initials: 'JM', status: 'Absent', timeLogged: '—', method: '—' },
  { attendanceId: 506, studentId: 20240091, fullName: 'Elena Wu', initials: 'EW', status: 'Present', timeLogged: '10:04:19 AM', method: 'QR Scan' },
  { attendanceId: 507, studentId: 24091, fullName: 'Alex Rivera', initials: 'AR', status: 'Present', timeLogged: '10:03:00 AM', method: 'PIN Code' },
  { attendanceId: 508, studentId: 24094, fullName: 'Sarah Jenkins', initials: 'SJ', status: 'Late', timeLogged: '10:16:30 AM', method: 'PIN Code' }
];

export const INITIAL_EXCUSES: ExcuseRequest[] = [
  {
    id: 1,
    studentId: 20240220,
    studentName: 'Julian Mercer',
    courseCode: 'CS-301',
    courseName: 'Advanced Data Structures',
    dateAbsent: '2025-04-18',
    reason: 'Severe acute migraine and ophthalmology examination scheduled at 09:30 AM. Prescribed bedrest through end of day.',
    status: 'Pending',
    docName: 'DOC-2024-8841.pdf',
    docUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB7cIPK-5dCyLwZk3nZuHXwTHhMHdyIav0FdX3o5Xya0WLRc5XYDjqdB3CXGR_26mHqSecC8iax6yi3hojxhleXtRcMXIb0gB2VFlnzCCAh6i3OYoZhShBCgqHT9oyZAkWaGNbv36yvtgQJIE0F7n-ctIi3F1seGy1o6wzUnWNCt_UaLOM9_mDw8iv9ugKiy2YJziMmx-g-p3HVO-z2JUnWhHfMfdfXkB5Epg__OGWSebWbdI3snA6F'
  },
  {
    id: 2,
    studentId: 20240582,
    studentName: 'Kassandra Vance',
    courseCode: 'PHY-102',
    courseName: 'Engineering Physics II',
    dateAbsent: '2025-04-16',
    reason: 'Varsity athletics regional championship tournament travel with university team.',
    status: 'Pending',
    docName: 'Athletics_Order_99.pdf'
  },
  {
    id: 3,
    studentId: 20240118,
    studentName: 'Tariq Al-Mansoor',
    courseCode: 'ENG-204',
    courseName: 'Technical Communication',
    dateAbsent: '2025-04-15',
    reason: 'Academic conference paper presentation in Chicago.',
    status: 'Pending',
    docName: 'IEEE_Acceptance.pdf'
  }
];

export const INITIAL_EWS_FLAGS: EWSStudentFlag[] = [
  {
    id: 1,
    studentId: 24108,
    studentName: 'David Kim',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAc4VuFY7qGTfcq9hZfRZo2_eWrUEtgo85x_hAxdLVt5dtyrO02GplFVmLimu2WAEHNTjZHSttklvYB-YHglexgjkctNo4Wlc6gHw6Tj37ewwWwuMyJvSz9kaB_piYEF2P5Pz64fnUnOuYfZzE3jTDHvHmTm1cnTyLtw5SGcH4rvvt5swKcf4Hskylsf-S89BtWY6GeYewNLrgRe04WVld64D5pqcSnDpV-gBb6Woi_lrzZsrFmSSXP',
    major: 'B.S. Computer Engineering • 2nd Year',
    advisorName: 'Dr. Evelyn Vance',
    courseCode: 'PHY-102',
    courseName: 'Engineering Physics II',
    attendanceRate: 68.5,
    consecutiveAbsences: 4,
    priorAlerts: 2,
    riskLevel: 'CRITICAL',
    timeline: [
      {
        date: 'Feb 14, 2025 • 14:30',
        actor: 'Dr. Vance',
        title: 'Health Referral Issued',
        description: 'Directed student to University Health Services for non-academic documentation verification.',
        type: 'referral'
      },
      {
        date: 'Feb 02, 2025 • 10:15',
        actor: 'Automated System',
        title: '1st Early Warning Dispatch',
        description: 'Triggered after 2 consecutive absences in PHY-102. System notification sent to student portal.',
        type: 'warning'
      }
    ],
    counselingNotes: 'Met with student via virtual office hours regarding PHY-102 attendance dip (68.5%). Student cited acute health complications and missed lab syncs. Initiated student health referral; coordinated with Dr. Vance (Physics Dept) regarding lab makeup protocol. Agreed follow-up meeting scheduled for Friday at 11:00 AM to assess syllabus recovery milestones.'
  },
  {
    id: 2,
    studentId: 24094,
    studentName: 'Sarah Jenkins',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD39rhwuG-2yXNB4_2WnBYlnL8JooUfJ2s3Fy2ejjKpPaJ5y1dTvDFjT_Jx7movxzeSrOxIbwKQLw-kfLjv24WYbuMMtLk2lCCldLATrzXmzhmhIgx1ozNPpec6hEZccMdr77n6X3WBhiEjjTMvnuDa_gx-6i0hIV119RFRgtBqeByB-DlJ1p75I_qPnMzTIgUq6uibsvGHCIaFskRmRR80EkYl2QVVhS4QJTHmdYfy-Pjf_bHxUSTN',
    major: 'B.S. Computer Science • 2nd Year',
    advisorName: 'Marcus Brody',
    courseCode: 'CS-301',
    courseName: 'Advanced Data Structures',
    attendanceRate: 74.0,
    consecutiveAbsences: 3,
    priorAlerts: 1,
    riskLevel: 'HIGH',
    timeline: [
      {
        date: 'Mar 10, 2025 • 11:00',
        actor: 'Marcus Brody',
        title: 'Advising Outreach Email',
        description: 'Sent alert regarding consecutive unexcused lecture absences.',
        type: 'warning'
      }
    ],
    counselingNotes: 'Student reported sleep schedule disruption due to family relocation. Agreed to connect with campus academic counseling.'
  },
  {
    id: 3,
    studentId: 24155,
    studentName: 'Amira Patel',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDGmP2gmrrIMhXxnDMgyky59B1vF5Y5kY7RBnzv9sHnWcP2_9TVHbhgAEzRgZajzLgcWxhKxkryiWPUxZjC2IhVCR1KQGNS4gwgi0zsWT84bKHYV_0Q-k3rkxG8J5wb21kKuKpKiwEIpwWq11rCSO0aZMQl98rJhePoiIHaZ0hdtJnZKi8HeGZQMUucInnaeo9lkp4Q-P8VxFtGhhlpAWXrEidjjPilcBb4RNUwJQ7SKAW60HXceYSL',
    major: 'B.S. Electrical Engineering • 3rd Year',
    advisorName: 'Marcus Brody',
    courseCode: 'MATH-310',
    courseName: 'Linear Algebra',
    attendanceRate: 78.2,
    consecutiveAbsences: 2,
    priorAlerts: 1,
    riskLevel: 'MODERATE',
    timeline: [
      {
        date: 'Mar 22, 2025 • 09:15',
        actor: 'Automated System',
        title: 'Threshold Caution Notice',
        description: 'Attendance fell below 80% boundary for 14-day rolling cycle.',
        type: 'warning'
      }
    ],
    counselingNotes: 'Student attends office hours regularly. Needs 2 more sessions to return to compliant status.'
  },
  {
    id: 4,
    studentId: 24190,
    studentName: 'Carlos Mendez',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCMFmkTvuZ_atkJ1EXZjX24oNRaG5L6bIHbUX95VJCxzpVsMiItM-atrLBGpHQ-GazZzrPVuWba52RD5bXnCPzaw2BGtFu3GYzPsCpInmJNDaCh0VQfaWgjHX6wSlGfwEb8VWafC4SAly1LC3lUb3vGBxYtSS2d9IsVqJ9e8W5IgLeEK66xc1E-77DLcO6C-GDceQ1k_3V8gFJozEmKjQ3OtUoPZQmcpHnQpjOa4xFHNiTbd6ggzfzN',
    major: 'B.S. Software Engineering • 1st Year',
    advisorName: 'Dr. Evelyn Vance',
    courseCode: 'ENG-204',
    courseName: 'Technical Communication',
    attendanceRate: 71.0,
    consecutiveAbsences: 3,
    priorAlerts: 2,
    riskLevel: 'HIGH',
    timeline: [
      {
        date: 'Apr 02, 2025 • 15:45',
        actor: 'Dr. Vance',
        title: 'Midterm Warning Issued',
        description: 'Warned regarding unexcused lab absences.',
        type: 'warning'
      }
    ],
    counselingNotes: 'Commuting student facing public transit issues on Tuesday mornings. Recommended switching to Section B.'
  }
];

export const INITIAL_AUDIT_LOGS: AuditLogItem[] = [
  { id: 1, userId: 1002, userName: 'Dr. Evelyn Vance', action: 'Session Opened', timestamp: '2025-04-18 10:00:00', details: 'Instructor initiated session #SES-9821-B for CS-301.' },
  { id: 2, userId: 1001, userName: 'Alex Rivera', action: 'Check-in Recorded', timestamp: '2025-04-18 10:03:00', details: 'Check-in with token 849210 (Status: Present).' },
  { id: 3, userId: 1002, userName: 'Dr. Evelyn Vance', action: 'Manual Attendance Override', timestamp: '2025-04-18 10:14:12', details: 'Overrode Julian Mercer status to Absent.' },
  { id: 4, userId: 1003, userName: 'Marcus Brody', action: 'Counseling Note Added', timestamp: '2025-04-17 14:30:00', details: 'Logged health consultation follow-up with David Kim.' },
  { id: 5, userId: 1004, userName: 'Root Systems Admin', action: 'System Backup', timestamp: '2025-04-16 02:00:00', details: 'Automated encrypted snapshot to secondary cold tier.' }
];
