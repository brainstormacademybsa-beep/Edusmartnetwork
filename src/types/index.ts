export type UserRole = 'SUPER_ADMIN' | 'SCHOOL_ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';

export interface School {
  id: string;
  name: string;
  subdomain: string;
  logo: string;
  primaryColor: string;
  secondaryColor: string;
  address: string;
  phone: string;
  email: string;
  motto: string;
  isApproved: boolean;
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED';
  createdAt: string;
  studentCount?: number;
  teacherCount?: number;
  showPositionOnResult?: boolean;
  requireResultPin?: boolean; // When true: Scratch card PIN mandatory for result checking. When false: PIN deactivated, students/parents check results with only Reg No.
}

export interface User {
  id: string;
  schoolId: string; // 'super' for Super Admin
  regNo: string; // e.g. 'CRA/2026/001' or 'ADM/001' or 'TCH/001'
  name: string;
  email?: string; // Optional for children/students
  role: UserRole;
  phone?: string;
  parentPhone?: string; // Guardian phone for notifications & WhatsApp
  parentWhatsapp?: string; // Guardian WhatsApp for report card delivery
  studentPin?: string; // Student 4-6 digit admission PIN for portal login
  avatarUrl?: string;
  classId?: string;
  className?: string; // e.g. 'JSS 1A', 'SSS 2 Science' (primary/default class)
  assignedClasses?: string[]; // Multiple classes assigned to teacher (e.g. ['JSS 1A', 'JSS 1B', 'SSS 2 Science'])
  assignedSubjects?: string[]; // Multiple subjects assigned to teacher
  department?: string; // e.g. 'Middle Basic', 'Sciences', 'Arts'
  gender?: 'Male' | 'Female' | 'Other' | string;
  dob?: string; // e.g. '2017-04-01'
  age?: number; // Auto-calculated from DOB
  admissionDate?: string; // Date of Admission
  previousSchool?: string; // Previous School Attended
  lastClassAttended?: string; // Last class attended
  nationality?: string; // Nationality (e.g. Nigerian)
  religion?: string; // Religion (e.g. Christianity, Islam, Other)
  stateOfOrigin?: string;
  lga?: string; // Local Government Area
  residentAddress?: string; // Residential Address
  livingWith?: 'Biological Parents' | 'Father Only' | 'Mother Only' | 'Guardian / Relative' | 'Foster Care' | string;
  primaryContactPerson?: 'Father' | 'Mother' | 'Guardian' | string;
  // Biological Parents Details
  fatherName?: string;
  fatherPhone?: string;
  fatherOccupation?: string;
  motherName?: string;
  motherPhone?: string;
  motherOccupation?: string;
  // Guardian / Guidance Details
  guardianName?: string;
  guardianRelationship?: string; // e.g. Uncle, Aunt, Grandparent, Foster Parent, Other Relative
  guardianPhone?: string;
  guardianWhatsapp?: string;
  guardianOccupation?: string;
  guardianAddress?: string;
  childRegNos?: string[]; // For parent role
  password?: string;
  daysOpened?: number;
  daysPresent?: number;
  daysAbsent?: number;
  termBegins?: string;
  termEnds?: string;
  nextTermBegins?: string;
  teacherComment?: string;
  affectiveScores?: Record<string, number>;
  psychomotorScores?: Record<string, number>;
}

export interface AcademicClass {
  id: string;
  schoolId: string;
  name: string; // e.g. 'JSS 1', 'SSS 2'
  arm: string; // e.g. 'A', 'Science'
}

export interface Subject {
  id: string;
  schoolId: string;
  code: string; // e.g. 'MTH', 'ENG'
  name: string; // e.g. 'Mathematics', 'English Language'
}

export interface CbtQuestion {
  id: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  points: number;
  explanation?: string;
}

export interface CbtExam {
  id: string;
  schoolId: string;
  teacherId: string;
  teacherName: string;
  title: string;
  subject: string;
  className: string;
  term: string;
  session: string;
  durationMinutes: number;
  passPercentage: number;
  questions: CbtQuestion[];
  isPublished: boolean;
  createdAt: string;
}

export interface CbtAttempt {
  id: string;
  examId: string;
  examTitle: string;
  studentId: string;
  studentRegNo: string;
  studentName: string;
  schoolId: string;
  score: number;
  maxScore: number;
  percentage: number;
  isPassed: boolean;
  submittedAt: string;
  answers: Record<string, 'A' | 'B' | 'C' | 'D'>;
}

export interface StudentResult {
  id: string;
  schoolId: string;
  studentRegNo: string;
  studentName: string;
  className: string;
  term: string; // e.g. 'First Term'
  session: string; // e.g. '2025/2026'
  subject: string;
  ca: number; // Max 40
  exam: number; // Max 60
  total: number; // Calculated (0 - 100)
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  position?: number;
  remark: string;
  cbtScore?: number;
}

export interface FeeSchedule {
  id: string;
  schoolId: string;
  className: string;
  term: string;
  session: string;
  tuitionFee: number;
  ictFee: number;
  uniformFee: number;
  sportsFee: number;
  totalAmount: number;
  description: string;
}

export interface FeePayment {
  id: string;
  schoolId: string;
  studentRegNo: string;
  studentName: string;
  className: string;
  amountPaid: number;
  totalExpected: number;
  balanceRemaining: number;
  paymentDate: string;
  paymentMethod: 'Bank Transfer' | 'Cash' | 'Card' | 'POS';
  term: string;
  session: string;
  receiptNo: string;
  status: 'PAID' | 'PARTIAL' | 'OWING';
  remarks?: string;
}

export interface AdmissionApplication {
  id: string;
  schoolId: string;
  schoolName: string;
  studentName: string;
  dob: string;
  age?: number;
  gender: 'Male' | 'Female' | 'Other';
  admissionDate?: string;
  previousSchool?: string;
  lastClassAttended?: string;
  nationality?: string;
  religion?: string;
  stateOfOrigin?: string;
  lga?: string;
  classApplying: string;
  parentName: string;
  parentPhone: string;
  parentWhatsapp: string;
  address: string;
  residentAddress?: string;
  livingWith?: 'Biological Parents' | 'Father Only' | 'Mother Only' | 'Guardian / Relative' | 'Foster Care' | string;
  primaryContactPerson?: 'Father' | 'Mother' | 'Guardian' | string;
  // Biological Parents Details
  fatherName?: string;
  fatherPhone?: string;
  fatherOccupation?: string;
  motherName?: string;
  motherPhone?: string;
  motherOccupation?: string;
  // Guardian / Guidance Details
  guardianName?: string;
  guardianRelationship?: string;
  guardianPhone?: string;
  guardianWhatsapp?: string;
  guardianOccupation?: string;
  guardianAddress?: string;
  passportUrl: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submittedAt: string;
  regNoAssigned?: string;
}

export interface ResultPin {
  id: string;
  schoolId: string;
  pinCode: string; // e.g. '1234-5678-9012'
  studentRegNo?: string;
  term: string;
  session: string;
  isUsed: boolean;
  usesCount: number;
  maxUses: number;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  schoolId: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: 'LOGIN' | 'LOGOUT' | 'RESULT_UPLOAD' | 'RESULT_EDIT' | 'STUDENT_REGISTER' | 'STUDENT_EDIT' | 'STUDENT_DELETE' | 'PIN_GENERATE' | 'PIN_VERIFY' | 'ADMISSION_DECISION' | 'FEE_PAYMENT_RECORD' | 'SECURITY_PIN_CHANGE' | 'SETTINGS_UPDATE' | 'PASSWORD_RESET';
  details: string;
  ipAddress?: string;
  timestamp: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
}

export interface PasswordResetResult {
  success: boolean;
  message: string;
  user?: User;
  school?: School;
  maskedEmail?: string;
  maskedPhone?: string;
  newPassword?: string;
  firebaseEmailSent?: boolean;
  dispatchedToEmail?: string;
  dispatchedToPhone?: string;
  deliveryChannels?: ('EMAIL' | 'SMS' | 'WHATSAPP')[];
  emailSubject?: string;
  emailBody?: string;
  smsBody?: string;
  whatsappUrl?: string;
  mailtoUrl?: string;
  timestamp: string;
}

export interface SchoolSecuritySettings {
  schoolId: string;
  masterSecurityPin: string; // 4-6 digit administrative PIN for sensitive actions
  requirePinForScoreEdit: boolean;
  requirePinForStudentDeletion: boolean;
  requirePinForPinGeneration: boolean;
  requirePinForResultChecking?: boolean;
  maxFailedPinAttempts: number;
  autoSessionTimeoutMinutes: number;
  lockoutDurationMinutes: number;
}

