export const PERMISSIONS = {
  // School
  SCHOOL_READ: 'school:read',
  SCHOOL_UPDATE: 'school:update',

  // Users
  USER_CREATE: 'user:create',
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',

  // Academic Sessions
  ACADEMIC_SESSION_CREATE: 'academic:session:create',
  ACADEMIC_SESSION_READ: 'academic:session:read',
  ACADEMIC_SESSION_UPDATE: 'academic:session:update',

  // Classes
  CLASS_CREATE: 'class:create',
  CLASS_READ: 'class:read',
  CLASS_UPDATE: 'class:update',
  CLASS_DELETE: 'class:delete',

  // Sections
  SECTION_CREATE: 'section:create',
  SECTION_READ: 'section:read',
  SECTION_UPDATE: 'section:update',
  SECTION_DELETE: 'section:delete',

  // Students (Phase 2)
  STUDENT_CREATE: 'student:create',
  STUDENT_READ: 'student:read',
  STUDENT_UPDATE: 'student:update',
  STUDENT_DELETE: 'student:delete',

  // Admissions (Phase 2)
  ADMISSION_CREATE: 'admission:create',
  ADMISSION_READ: 'admission:read',
  ADMISSION_UPDATE: 'admission:update',
  ADMISSION_APPROVE: 'admission:approve',

  // Documents (Phase 2)
  DOCUMENT_CREATE: 'document:create',
  DOCUMENT_READ: 'document:read',
  DOCUMENT_DELETE: 'document:delete',

  // Parents (Phase 2)
  PARENT_READ: 'parent:read',
  PARENT_UPDATE: 'parent:update',

  // Fees (Phase 6)
  FEE_HEAD_CREATE: 'fee:head:create',
  FEE_HEAD_READ: 'fee:head:read',
  FEE_HEAD_UPDATE: 'fee:head:update',
  FEE_HEAD_DELETE: 'fee:head:delete',
  FEE_STRUCTURE_CREATE: 'fee:structure:create',
  FEE_STRUCTURE_READ: 'fee:structure:read',
  FEE_STRUCTURE_UPDATE: 'fee:structure:update',
  FEE_STRUCTURE_DELETE: 'fee:structure:delete',
  FEE_ASSIGNMENT_CREATE: 'fee:assignment:create',
  FEE_ASSIGNMENT_READ: 'fee:assignment:read',
  FEE_INVOICE_CREATE: 'fee:invoice:create',
  FEE_INVOICE_READ: 'fee:invoice:read',
  FEE_PAYMENT_CREATE: 'fee:payment:create',
  FEE_PAYMENT_READ: 'fee:payment:read',
  FEE_REPORT_READ: 'fee:report:read',

  // Attendance (Phase 6)
  ATTENDANCE_STUDENT_CREATE: 'attendance:student:create',
  ATTENDANCE_STUDENT_READ: 'attendance:student:read',
  ATTENDANCE_STUDENT_UPDATE: 'attendance:student:update',
  ATTENDANCE_STUDENT_REPORT: 'attendance:student:report',
  
  // Timetable & Subjects (Phase 6)
  SUBJECT_CREATE: 'subject:create',
  SUBJECT_READ: 'subject:read',
  SUBJECT_UPDATE: 'subject:update',
  SUBJECT_DELETE: 'subject:delete',
  TIMETABLE_CREATE: 'timetable:create',
  TIMETABLE_READ: 'timetable:read',
  TIMETABLE_UPDATE: 'timetable:update',
  TIMETABLE_DELETE: 'timetable:delete',

  // Exams (Phase 6)
  EXAM_CREATE: 'exam:create',
  EXAM_READ: 'exam:read',
  EXAM_UPDATE: 'exam:update',
  EXAM_DELETE: 'exam:delete',
  MARKS_CREATE: 'marks:create',
  MARKS_READ: 'marks:read',
  MARKS_UPDATE: 'marks:update',

} as const;

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

