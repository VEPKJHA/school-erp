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
} as const;

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

