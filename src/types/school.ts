export type ModuleTab = 'overview' | 'scheduling' | 'instructors' | 'payments' | 'courses' | 'account';

export type UserRole = 'Operations Staff' | 'Driving Instructor' | 'Student';

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
  branch: BranchName;
  createdAt: string;
}

export type BranchName = 'Westlands' | 'Kilimani' | 'Mombasa Nyali' | 'Nakuru';

export type LicenseClass = 'Class B1 (Auto)' | 'Class B2 (Manual)' | 'Class A2 (Moto)' | 'Class C1 (Light Truck)';

export type LessonType = 'Practical Road' | 'Yard Maneuvers' | 'Theory & Highway Code' | 'NTSA Mock Test';

export type LessonStatus = 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';

export type InstructorStatus = 'On Road' | 'Available' | 'Theory Class' | 'Off Duty';

export type PaymentMethod = 'M-Pesa' | 'Card' | 'Bank Transfer' | 'Cash';

export type InvoiceStatus = 'Paid' | 'Partial' | 'Unpaid' | 'Overdue';

export interface CoursePackage {
  id: string;
  code: string;
  title: string;
  licenseClass: LicenseClass;
  practicalHours: number;
  theoryHours: number;
  feeKsh: number;
  durationWeeks: number;
  description: string;
  includesExamBooking: boolean;
}

export interface Student {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  nationalId: string;
  branch: BranchName;
  licenseClass: LicenseClass;
  completedHours: number;
  requiredHours: number;
  enrolledDate: string;
  ntsaStage: 'Theory' | 'Practical' | 'Exam Ready' | 'Licensed';
}

export interface Instructor {
  id: string;
  fullName: string;
  phone: string;
  branch: BranchName;
  specialties: LicenseClass[];
  vehiclePlate: string;
  vehicleModel: string;
  transmission: 'Automatic' | 'Manual' | 'Motorcycle';
  status: InstructorStatus;
  currentZone: string;
  activeStudentName: string | null;
  hoursToday: number;
  passRatePercent: number;
  ntsaCertNo: string;
}

export interface Lesson {
  id: string;
  studentId: string;
  instructorId: string;
  branch: BranchName;
  lessonType: LessonType;
  date: string;
  time: string;
  durationHours: number;
  vehiclePlate: string;
  pickupZone: string;
  status: LessonStatus;
  notes?: string;
}

export interface PaymentTransaction {
  id: string;
  invoiceId: string;
  studentId: string;
  amountKsh: number;
  method: PaymentMethod;
  reference: string;
  paidAt: string;
  recordedBy: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  studentId: string;
  description: string;
  totalAmountKsh: number;
  paidAmountKsh: number;
  dueDate: string;
  issuedDate: string;
  status: InvoiceStatus;
}

export interface SchoolState {
  students: Student[];
  instructors: Instructor[];
  lessons: Lesson[];
  invoices: Invoice[];
  transactions: PaymentTransaction[];
  courses: CoursePackage[];
}
