export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  role: {
    id: string;
    code: string;
    name: string;
  };
  school?: {
    id: string;
    name: string;
    code: string;
    logoUrl?: string;
    city?: string;
    board?: string;
  } | null;
  permissions: string[];
}

export interface AcademicSession {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  status: 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  createdAt: string;
}

export interface Section {
  id: string;
  classId: string;
  name: string;
  capacity: number;
  roomNumber?: string;
  isActive: boolean;
  class?: {
    id: string;
    name: string;
    code: string;
    numericOrder: number;
  };
}

export interface ClassItem {
  id: string;
  name: string;
  code: string;
  numericOrder: number;
  description?: string;
  isActive: boolean;
  sections?: Section[];
}

export interface Role {
  id: string;
  name: string;
  code: string;
  description?: string;
  isSystem: boolean;
}

export interface DashboardStats {
  totalClasses: number;
  totalSections: number;
  activeUsers: number;
  currentSession: string;
  currentSessionDates?: {
    start: string;
    end: string;
  } | null;
}

export type StudentStatus =
  | 'APPLIED'
  | 'ADMITTED'
  | 'ACTIVE'
  | 'INACTIVE'
  | 'TRANSFERRED'
  | 'PASSED_OUT'
  | 'WITHDRAWN';

export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

export type ParentRelation = 'FATHER' | 'MOTHER' | 'GUARDIAN';

export interface Parent {
  id: string;
  firstName: string;
  lastName: string;
  relationship: ParentRelation;
  phone: string;
  email?: string;
  occupation?: string;
  annualIncome?: number;
}

export interface StudentParent {
  id: string;
  studentId: string;
  parentId: string;
  relationship: ParentRelation;
  isPrimaryContact: boolean;
  isEmergencyContact: boolean;
  parent: Parent;
}

export interface StudentAddress {
  id: string;
  studentId: string;
  type: 'CURRENT' | 'PERMANENT';
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface StudentDocument {
  id: string;
  studentId?: string;
  admissionId?: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  mimeType?: string;
  uploadedAt: string;
}

export interface Student {
  id: string;
  schoolId: string;
  admissionNumber: string;
  studentCode: string;
  rollNumber?: string;
  classId: string;
  sectionId: string;
  academicSessionId: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: string;
  gender: Gender;
  bloodGroup?: string;
  nationality: string;
  category?: string;
  religion?: string;
  aadhaarNumber?: string;
  email?: string;
  mobile?: string;
  photoUrl?: string;
  status: StudentStatus;
  statusReason?: string;
  admissionDate: string;
  class?: ClassItem;
  section?: Section;
  session?: AcademicSession;
  studentParents?: StudentParent[];
  addresses?: StudentAddress[];
  documents?: StudentDocument[];
  createdAt: string;
  updatedAt: string;
}

export type AdmissionStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'DOCUMENT_PENDING'
  | 'APPROVED'
  | 'REJECTED';

export interface Admission {
  id: string;
  schoolId: string;
  academicSessionId: string;
  applyingClassId: string;
  assignedSectionId?: string;
  studentId?: string;
  applicationNumber: string;
  status: AdmissionStatus;
  statusRemarks?: string;
  rejectionReason?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: string;
  gender: Gender;
  bloodGroup?: string;
  nationality: string;
  category?: string;
  religion?: string;
  aadhaarNumber?: string;
  parentName: string;
  parentRelation: ParentRelation;
  parentMobile: string;
  parentEmail?: string;
  parentOccupation?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  previousSchoolName?: string;
  previousClass?: string;
  previousPercentage?: number;
  session?: AcademicSession;
  applyingClass?: ClassItem;
  assignedSection?: Section;
  student?: Student;
  documents?: StudentDocument[];
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// PHASE 3: FEE ENGINE & COLLECTION TYPES
// ==========================================

export interface FeeHead {
  id: string;
  schoolId: string;
  name: string;
  code: string;
  description?: string;
  isRefundable: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type FeeFrequency =
  | 'ONE_TIME'
  | 'MONTHLY'
  | 'QUARTERLY'
  | 'TERMWISE'
  | 'ANNUAL';

export interface FeeStructureItem {
  id: string;
  feeStructureId: string;
  feeHeadId: string;
  amount: number | string;
  dueDayOfMonth?: number;
  feeHead: FeeHead;
}

export interface FeeStructure {
  id: string;
  schoolId: string;
  academicSessionId: string;
  classId: string;
  name: string;
  frequency: FeeFrequency;
  description?: string;
  isActive: boolean;
  class?: ClassItem;
  session?: AcademicSession;
  items?: FeeStructureItem[];
  createdAt: string;
  updatedAt: string;
}

export interface StudentFeeAssignment {
  id: string;
  schoolId: string;
  studentId: string;
  feeStructureId: string;
  academicSessionId: string;
  concessionAmount: number | string;
  concessionPercent: number | string;
  concessionReason?: string;
  isActive: boolean;
  student?: Student;
  feeStructure?: FeeStructure;
}

export type InvoiceStatus =
  | 'UNPAID'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'OVERDUE'
  | 'VOID'
  | 'CANCELLED';

export interface FeeInvoiceItem {
  id: string;
  invoiceId: string;
  feeHeadId: string;
  description?: string;
  amount: number | string;
  feeHead?: FeeHead;
}

export interface FeeInvoice {
  id: string;
  schoolId: string;
  studentId: string;
  academicSessionId: string;
  invoiceNumber: string;
  title: string;
  issueDate: string;
  dueDate: string;
  subtotal: number | string;
  discountAmount: number | string;
  lateFeeAmount: number | string;
  totalAmount: number | string;
  paidAmount: number | string;
  balanceAmount: number | string;
  status: InvoiceStatus;
  remarks?: string;
  student?: Student;
  session?: AcademicSession;
  items?: FeeInvoiceItem[];
  payments?: FeePayment[];
  createdAt: string;
  updatedAt: string;
}

export type PaymentMode =
  | 'CASH'
  | 'CHEQUE'
  | 'BANK_TRANSFER'
  | 'ONLINE'
  | 'CARD'
  | 'UPI';

export type PaymentStatus =
  | 'SUCCESS'
  | 'PENDING'
  | 'BOUNCED'
  | 'REVERSED'
  | 'FAILED';

export interface FeePayment {
  id: string;
  schoolId: string;
  invoiceId: string;
  studentId: string;
  receiptNumber: string;
  paymentDate: string;
  amount: number | string;
  paymentMode: PaymentMode;
  referenceNumber?: string;
  status: PaymentStatus;
  collectedById?: string;
  remarks?: string;
  student?: Student;
  invoice?: FeeInvoice;
  collectedBy?: { id: string; firstName: string; lastName: string; email?: string };
  createdAt: string;
}

export interface StudentFeeLedger {
  id: string;
  schoolId: string;
  studentId: string;
  entryDate: string;
  type: 'DEBIT' | 'CREDIT';
  amount: number | string;
  balanceAfter: number | string;
  referenceType: string;
  referenceId?: string;
  description: string;
  createdAt: string;
}

export interface FeeSummaryReport {
  totalBilled: number;
  totalCollected: number;
  totalOutstanding: number;
  totalInvoices: number;
  paidInvoicesCount: number;
  unpaidInvoicesCount: number;
  partiallyPaidCount: number;
  overdueCount: number;
  modeBreakdown: Record<string, number>;
}

// ==========================================
// PHASE 4: ATTENDANCE & TIMETABLE TYPES
// ==========================================

export type AttendanceStatus =
  | 'PRESENT'
  | 'ABSENT'
  | 'LATE'
  | 'HALF_DAY'
  | 'EXCUSED';

export interface StudentAttendance {
  id: string;
  schoolId: string;
  studentId: string;
  classId: string;
  sectionId: string;
  academicSessionId: string;
  date: string;
  status: AttendanceStatus;
  remarks?: string;
  markedById?: string;
  student?: Student;
  class?: ClassItem;
  section?: Section;
  markedBy?: { id: string; firstName: string; lastName: string };
  createdAt: string;
  updatedAt: string;
}

export interface DailyAttendanceSummary {
  PRESENT: number;
  ABSENT: number;
  LATE: number;
  HALF_DAY: number;
  EXCUSED: number;
  TOTAL: number;
}

export interface MonthlyRegisterStudent {
  student: Student;
  days: Record<number, AttendanceStatus>;
  summary: {
    present: number;
    absent: number;
    late: number;
    halfDay: number;
    excused: number;
    totalMarked: number;
    percentage: number;
  };
}

export interface MonthlyRegisterReport {
  year: number;
  month: number;
  daysInMonth: number;
  totalStudents: number;
  register: MonthlyRegisterStudent[];
}

export type SubjectType = 'THEORY' | 'PRACTICAL' | 'BOTH';

export interface Subject {
  id: string;
  schoolId: string;
  name: string;
  code: string;
  type: SubjectType;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ClassSubject {
  id: string;
  schoolId: string;
  classId: string;
  subjectId: string;
  isElective: boolean;
  subject?: Subject;
  class?: ClassItem;
}

export type DayOfWeek =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';

export interface TimetableSlot {
  id: string;
  schoolId: string;
  academicSessionId: string;
  classId: string;
  sectionId: string;
  subjectId: string;
  teacherId?: string | null;
  dayOfWeek: DayOfWeek;
  periodNumber: number;
  startTime: string;
  endTime: string;
  roomNumber?: string | null;
  subject?: Subject;
  teacher?: { id: string; firstName: string; lastName: string; email?: string };
  class?: ClassItem;
  section?: Section;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// PHASE 5: EXAMINATION & REPORT CARDS TYPES
// ==========================================

export interface ExamTerm {
  id: string;
  schoolId: string;
  academicSessionId: string;
  name: string;
  code: string;
  startDate: string;
  endDate: string;
  description?: string;
  isPublished: boolean;
  academicSession?: AcademicSession;
  examSchedules?: ExamSchedule[];
  _count?: { examSchedules: number };
  createdAt: string;
  updatedAt: string;
}

export interface GradingScaleRule {
  id?: string;
  grade: string;
  minPercentage: number;
  maxPercentage: number;
  gradePoint?: number;
  description?: string;
  isPassing?: boolean;
}

export interface GradingScale {
  id: string;
  schoolId: string;
  name: string;
  description?: string;
  rules: GradingScaleRule[];
  createdAt: string;
  updatedAt: string;
}

export interface ExamSchedule {
  id: string;
  schoolId: string;
  examTermId: string;
  classId: string;
  subjectId: string;
  gradingScaleId?: string | null;
  examDate: string;
  startTime: string;
  endTime: string;
  maxMarks: number;
  passMarks: number;
  roomNumber?: string | null;
  examTerm?: ExamTerm;
  class?: ClassItem;
  subject?: Subject;
  gradingScale?: GradingScale | null;
  _count?: { marks: number };
  createdAt: string;
  updatedAt: string;
}

export interface ExamMark {
  id: string;
  schoolId: string;
  examScheduleId: string;
  studentId: string;
  marksObtained?: number | null;
  grade?: string | null;
  isAbsent: boolean;
  isExempt: boolean;
  remarks?: string | null;
  enteredById?: string | null;
  student?: Student;
  enteredBy?: { id: string; firstName: string; lastName: string };
  examSchedule?: ExamSchedule;
  createdAt: string;
  updatedAt: string;
}

export interface StudentReportCard {
  student: {
    id: string;
    firstName: string;
    lastName: string;
    admissionNumber: string;
    studentCode: string;
    rollNumber?: string;
    gender: string;
    dateOfBirth: string;
    class: ClassItem;
    section: Section;
    session: AcademicSession;
    parents?: any[];
  };
  term: {
    id: string;
    name: string;
    code: string;
    startDate: string;
    endDate: string;
    isPublished: boolean;
  };
  subjects: {
    subjectId: string;
    subjectName: string;
    subjectCode: string;
    subjectType: string;
    maxMarks: number;
    passMarks: number;
    marksObtained: number | null;
    isAbsent: boolean;
    isExempt: boolean;
    grade?: string;
    percentage: number;
    isPassing: boolean;
    remarks?: string;
  }[];
  summary: {
    totalSubjects: number;
    totalMaxMarks: number;
    totalObtainedMarks: number;
    overallPercentage: number;
    overallGrade: string;
    finalResult: 'PASSED' | 'COMPARTMENT' | 'FAILED';
    subjectsPassed: number;
    subjectsFailed: number;
  };
  attendance: {
    totalDays: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    halfDays: number;
    attendancePercentage: number;
  };
}


