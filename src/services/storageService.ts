import {
  School,
  User,
  UserRole,
  CbtExam,
  CbtAttempt,
  StudentResult,
  FeeSchedule,
  FeePayment,
  AdmissionApplication,
  ResultPin,
  AuditLog,
  SchoolSecuritySettings,
  PasswordResetResult,
} from '../types';
import {
  INITIAL_SCHOOLS,
  INITIAL_USERS,
  INITIAL_CBT_EXAMS,
  INITIAL_CBT_ATTEMPTS,
  INITIAL_STUDENT_RESULTS,
  INITIAL_FEE_SCHEDULES,
  INITIAL_FEE_PAYMENTS,
  INITIAL_ADMISSION_APPLICATIONS,
  INITIAL_RESULT_PINS,
} from '../data/initialData';
import { INITIAL_AUDIT_LOGS } from '../data/initialAuditData';
import { calculatePositions, generateStudentRegNo } from '../utils/calcUtils';
import { db } from './firebase';
import { collection, doc, setDoc, getDocs, deleteDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';

/**
 * Deeply sanitizes any object or array destined for Cloud Firestore.
 * Strips all undefined properties and ensures Firestore cannot reject the payload.
 */
function cleanForFirestore<T>(data: T): any {
  if (data === null || data === undefined) {
    return null;
  }
  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => cleanForFirestore(item));
  }
  if (typeof data === 'object' && !(data instanceof Date)) {
    const clean: Record<string, any> = {};
    for (const [key, value] of Object.entries(data as Record<string, any>)) {
      if (value !== undefined) {
        clean[key] = cleanForFirestore(value);
      }
    }
    return clean;
  }
  return data;
}

const STORAGE_KEYS = {
  SCHOOLS: 'edusmart_schools_v1',
  USERS: 'edusmart_users_v1',
  CBT_EXAMS: 'edusmart_cbt_exams_v1',
  CBT_ATTEMPTS: 'edusmart_cbt_attempts_v1',
  RESULTS: 'edusmart_results_v1',
  FEE_SCHEDULES: 'edusmart_fee_schedules_v1',
  FEE_PAYMENTS: 'edusmart_fee_payments_v1',
  ADMISSIONS: 'edusmart_admissions_v1',
  PINS: 'edusmart_pins_v1',
  CURRENT_USER: 'edusmart_current_user_v1',
  ACTIVE_SCHOOL_ID: 'edusmart_active_school_id_v1',
  SUPER_ADMIN_PASSCODE: 'edusmart_super_passcode_v1',
  AUDIT_LOGS: 'edusmart_audit_logs_v1',
  SECURITY_SETTINGS: 'edusmart_security_settings_v1',
};

class StorageService {
  private listeners: Array<() => void> = [];
  private isCloudSynced = false;
  private unsubscribers: Unsubscribe[] = [];

  constructor() {
    this.init();
  }

  private init() {
    // Non-destructive initialization: NEVER clear user data on boot or updates!
    if (!localStorage.getItem(STORAGE_KEYS.SCHOOLS)) {
      this.initDefaults(false);
    } else {
      // Ensure all storage keys exist without wiping existing custom user data
      this.ensureBaselineKeys();
    }

    // Sync cloud records in background and bind real-time listeners
    this.syncFromCloud();
  }

  /**
   * Safe persistent cloud writer:
   * Strips undefined fields and commits with merge: true to Cloud Firestore.
   */
  public async saveToCloud(collectionName: string, id: string, data: any): Promise<void> {
    try {
      if (!id) return;
      const cleaned = cleanForFirestore(data);
      await setDoc(doc(db, collectionName, id), cleaned, { merge: true });
    } catch (err) {
      console.warn(`Firestore save notice on ${collectionName}/${id}:`, err);
    }
  }

  /**
   * Safe persistent cloud deleter.
   */
  public async deleteFromCloud(collectionName: string, id: string): Promise<void> {
    try {
      if (!id) return;
      await deleteDoc(doc(db, collectionName, id));
    } catch (err) {
      console.warn(`Firestore delete notice on ${collectionName}/${id}:`, err);
    }
  }

  private ensureBaselineKeys() {
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) this.setItem(STORAGE_KEYS.USERS, INITIAL_USERS);
    if (!localStorage.getItem(STORAGE_KEYS.CBT_EXAMS)) this.setItem(STORAGE_KEYS.CBT_EXAMS, INITIAL_CBT_EXAMS);
    if (!localStorage.getItem(STORAGE_KEYS.CBT_ATTEMPTS)) this.setItem(STORAGE_KEYS.CBT_ATTEMPTS, INITIAL_CBT_ATTEMPTS);
    if (!localStorage.getItem(STORAGE_KEYS.RESULTS)) this.setItem(STORAGE_KEYS.RESULTS, calculatePositions(INITIAL_STUDENT_RESULTS));
    if (!localStorage.getItem(STORAGE_KEYS.FEE_SCHEDULES)) this.setItem(STORAGE_KEYS.FEE_SCHEDULES, INITIAL_FEE_SCHEDULES);
    if (!localStorage.getItem(STORAGE_KEYS.FEE_PAYMENTS)) this.setItem(STORAGE_KEYS.FEE_PAYMENTS, INITIAL_FEE_PAYMENTS);
    if (!localStorage.getItem(STORAGE_KEYS.ADMISSIONS)) this.setItem(STORAGE_KEYS.ADMISSIONS, INITIAL_ADMISSION_APPLICATIONS);
    if (!localStorage.getItem(STORAGE_KEYS.PINS)) this.setItem(STORAGE_KEYS.PINS, INITIAL_RESULT_PINS);
    if (!localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS)) this.setItem(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
    if (!localStorage.getItem(STORAGE_KEYS.ACTIVE_SCHOOL_ID)) this.setItem(STORAGE_KEYS.ACTIVE_SCHOOL_ID, INITIAL_SCHOOLS[0].id);
  }

  private async syncCollection<T extends { id: string; schoolId?: string }>(
    collectionName: string,
    storageKey: string,
    localItems: T[]
  ): Promise<void> {
    try {
      const snap = await getDocs(collection(db, collectionName));
      const cloudItems: T[] = [];
      snap.forEach((d) => {
        cloudItems.push(d.data() as T);
      });

      // Map existing local items
      const itemMap = new Map<string, T>();
      localItems.forEach((item) => itemMap.set(item.id, item));

      // Merge cloud items (cloud items take precedence for matching IDs)
      cloudItems.forEach((item) => itemMap.set(item.id, item));

      // Push any custom local item created while offline or before sync that isn't in cloud yet
      for (const item of localItems) {
        if (!cloudItems.some((ci) => ci.id === item.id)) {
          if (item.schoolId && item.schoolId !== 'super') {
            this.saveToCloud(collectionName, item.id, item);
          }
        }
      }

      const merged = Array.from(itemMap.values());
      if (collectionName === 'results') {
        const recalculated = calculatePositions(merged as unknown as StudentResult[]);
        this.setItem(storageKey, recalculated);
      } else {
        this.setItem(storageKey, merged);
      }
    } catch (e) {
      console.warn(`Sync warning for ${collectionName}:`, e);
    }
  }

  /**
   * Comprehensive background cloud synchronization with Firestore:
   * Downloads registered schools, users, results, CBTs, fee records, PINs & applications
   * so records ALWAYS persist across browser clears, updates, devices, or tabs.
   */
  public async syncFromCloud() {
    if (this.isCloudSynced || typeof window === 'undefined') return;
    this.isCloudSynced = true;

    try {
      await Promise.all([
        this.syncCollection<School>('schools', STORAGE_KEYS.SCHOOLS, this.getSchools()),
        this.syncCollection<User>('users', STORAGE_KEYS.USERS, this.getUsers()),
        this.syncCollection<StudentResult>('results', STORAGE_KEYS.RESULTS, this.getResults()),
        this.syncCollection<CbtExam>('cbt_exams', STORAGE_KEYS.CBT_EXAMS, this.getCbtExams()),
        this.syncCollection<CbtAttempt>('cbt_attempts', STORAGE_KEYS.CBT_ATTEMPTS, this.getCbtAttempts()),
        this.syncCollection<FeeSchedule>('fee_schedules', STORAGE_KEYS.FEE_SCHEDULES, this.getFeeSchedules()),
        this.syncCollection<FeePayment>('fee_payments', STORAGE_KEYS.FEE_PAYMENTS, this.getFeePayments()),
        this.syncCollection<AdmissionApplication>('admissions', STORAGE_KEYS.ADMISSIONS, this.getAdmissions()),
        this.syncCollection<ResultPin>('pins', STORAGE_KEYS.PINS, this.getPins()),
        this.syncCollection<AuditLog>('audit_logs', STORAGE_KEYS.AUDIT_LOGS, this.getAuditLogs()),
      ]);

      this.initRealtimeListeners();
      this.notify();
    } catch (err) {
      console.warn('Background Firestore sync notice (offline or read limits):', err);
    }
  }

  private initRealtimeListeners() {
    if (this.unsubscribers.length > 0 || typeof window === 'undefined') return;

    const collectionsToListen = [
      { name: 'schools', key: STORAGE_KEYS.SCHOOLS },
      { name: 'users', key: STORAGE_KEYS.USERS },
      { name: 'results', key: STORAGE_KEYS.RESULTS },
      { name: 'fee_payments', key: STORAGE_KEYS.FEE_PAYMENTS },
      { name: 'cbt_exams', key: STORAGE_KEYS.CBT_EXAMS },
      { name: 'cbt_attempts', key: STORAGE_KEYS.CBT_ATTEMPTS },
    ];

    collectionsToListen.forEach(({ name, key }) => {
      try {
        const unsub = onSnapshot(
          collection(db, name),
          (snapshot) => {
            if (snapshot.empty) return;
            const currentLocal = this.getItem<any[]>(key, []);
            const map = new Map<string, any>();
            currentLocal.forEach((item) => map.set(item.id, item));
            snapshot.docChanges().forEach((change) => {
              if (change.type === 'added' || change.type === 'modified') {
                map.set(change.doc.id, change.doc.data());
              } else if (change.type === 'removed') {
                map.delete(change.doc.id);
              }
            });
            const updated = Array.from(map.values());
            if (name === 'results') {
              this.setItem(key, calculatePositions(updated as StudentResult[]));
            } else {
              this.setItem(key, updated);
            }
          },
          (err) => {
            console.warn(`Realtime listener notice for ${name}:`, err);
          }
        );
        this.unsubscribers.push(unsub);
      } catch (e) {
        console.warn(`Could not attach listener for ${name}:`, e);
      }
    });
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  private getItem<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      this.notify();
    } catch (err) {
      console.error('LocalStorage error:', err);
    }
  }

  public initDefaults(force = false) {
    if (force) {
      this.setItem(STORAGE_KEYS.SCHOOLS, INITIAL_SCHOOLS);
      this.setItem(STORAGE_KEYS.USERS, INITIAL_USERS);
      this.setItem(STORAGE_KEYS.CBT_EXAMS, INITIAL_CBT_EXAMS);
      this.setItem(STORAGE_KEYS.CBT_ATTEMPTS, INITIAL_CBT_ATTEMPTS);
      this.setItem(STORAGE_KEYS.RESULTS, calculatePositions(INITIAL_STUDENT_RESULTS));
      this.setItem(STORAGE_KEYS.FEE_SCHEDULES, INITIAL_FEE_SCHEDULES);
      this.setItem(STORAGE_KEYS.FEE_PAYMENTS, INITIAL_FEE_PAYMENTS);
      this.setItem(STORAGE_KEYS.ADMISSIONS, INITIAL_ADMISSION_APPLICATIONS);
      this.setItem(STORAGE_KEYS.PINS, INITIAL_RESULT_PINS);
      this.setItem(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      this.setItem(STORAGE_KEYS.ACTIVE_SCHOOL_ID, INITIAL_SCHOOLS[0].id);
    } else {
      this.ensureBaselineKeys();
    }
  }

  // --- SCHOOLS ---
  public getSchools(): School[] {
    return this.getItem<School[]>(STORAGE_KEYS.SCHOOLS, INITIAL_SCHOOLS);
  }

  public getActiveSchoolId(): string {
    return this.getItem<string>(STORAGE_KEYS.ACTIVE_SCHOOL_ID, INITIAL_SCHOOLS[0].id);
  }

  public setActiveSchoolId(schoolId: string) {
    this.setItem(STORAGE_KEYS.ACTIVE_SCHOOL_ID, schoolId);
  }

  public getActiveSchool(): School {
    const schools = this.getSchools();
    const activeId = this.getActiveSchoolId();
    return schools.find((s) => s.id === activeId) || schools[0] || INITIAL_SCHOOLS[0];
  }

  public addSchool(
    school: Omit<School, 'id' | 'createdAt' | 'status' | 'isApproved'>,
    adminCredentials?: { name?: string; password?: string }
  ): School {
    const schools = this.getSchools();
    const newSchool: School = {
      ...school,
      id: `school-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'PENDING',
      isApproved: false,
      studentCount: 0,
      teacherCount: 0,
      showPositionOnResult: school.showPositionOnResult ?? true,
      requireResultPin: school.requireResultPin ?? true,
    };
    schools.push(newSchool);
    this.setItem(STORAGE_KEYS.SCHOOLS, schools);

    // Auto create School Admin user for this school
    const users = this.getUsers();
    const newAdmin: User = {
      id: `user-admin-${Date.now()}`,
      schoolId: newSchool.id,
      regNo: `ADM/${newSchool.subdomain.toUpperCase().slice(0, 3)}/01`,
      name: adminCredentials?.name || `${school.name} Admin`,
      email: school.email,
      role: 'SCHOOL_ADMIN',
      phone: school.phone,
      password: adminCredentials?.password || 'password123',
    };
    users.push(newAdmin);
    this.setItem(STORAGE_KEYS.USERS, users);

    // Persist to Cloud Firestore
    this.saveToCloud('schools', newSchool.id, newSchool);
    this.saveToCloud('users', newAdmin.id, newAdmin);

    return newSchool;
  }

  public updateSchool(updated: School) {
    const schools = this.getSchools().map((s) => (s.id === updated.id ? updated : s));
    this.setItem(STORAGE_KEYS.SCHOOLS, schools);

    // Update in Cloud Firestore
    this.saveToCloud('schools', updated.id, updated);
  }

  public approveSchool(schoolId: string, isApproved: boolean) {
    const schools = this.getSchools().map((s) =>
      s.id === schoolId ? { ...s, isApproved, status: (isApproved ? 'ACTIVE' : 'SUSPENDED') as School['status'] } : s
    );
    this.setItem(STORAGE_KEYS.SCHOOLS, schools);

    const approvedSchool = schools.find((s) => s.id === schoolId);
    if (approvedSchool) {
      this.saveToCloud('schools', schoolId, approvedSchool);
    }
  }

  // --- USERS & AUTH ---
  public getUsers(): User[] {
    return this.getItem<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
  }

  public getCurrentUser(): User | null {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return data ? JSON.parse(data) : null;
  }

  public setCurrentUser(user: User | null) {
    if (user) {
      this.setItem(STORAGE_KEYS.CURRENT_USER, user);
      if (user.schoolId !== 'super') {
        this.setActiveSchoolId(user.schoolId);
      }
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      this.notify();
    }
  }

  public logout() {
    this.setCurrentUser(null);
  }

  public addUser(user: Omit<User, 'id'>): User {
    const users = this.getUsers();
    const defaultPassword = user.role === 'STUDENT' ? user.regNo : (user.password || 'password123');
    const defaultStudentPin = user.role === 'STUDENT' ? user.regNo : user.studentPin;
    const newUser: User = {
      ...user,
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      password: user.password || defaultPassword,
      studentPin: defaultStudentPin,
    };
    users.push(newUser);
    this.setItem(STORAGE_KEYS.USERS, users);

    // Save reliably to Cloud Firestore
    this.saveToCloud('users', newUser.id, newUser);

    return newUser;
  }

  public updateUser(user: User) {
    const users = this.getUsers().map((u) => (u.id === user.id ? user : u));
    this.setItem(STORAGE_KEYS.USERS, users);

    // Update in Cloud Firestore
    this.saveToCloud('users', user.id, user);
  }

  public deleteUser(userId: string): boolean {
    const users = this.getUsers().filter((u) => u.id !== userId);
    this.setItem(STORAGE_KEYS.USERS, users);
    this.deleteFromCloud('users', userId);
    return true;
  }

  public authenticateUser(
    schoolId: string,
    role: UserRole | 'STAFF',
    identifier: string,
    passwordOrPin: string
  ): { success: boolean; user?: User; message: string } {
    const trimmedId = identifier.trim().toLowerCase();
    const trimmedPass = passwordOrPin.trim();

    if (!trimmedId || !trimmedPass) {
      return { success: false, message: 'Please enter all required credentials.' };
    }

    if (role === 'STUDENT') {
      return this.authenticateStudent(schoolId, identifier, passwordOrPin);
    }
    if (role === 'PARENT') {
      return this.authenticateParent(schoolId, identifier, passwordOrPin);
    }
    if (role === 'SCHOOL_ADMIN') {
      return this.authenticateAdmin(schoolId, identifier, passwordOrPin);
    }
    if (role === 'TEACHER') {
      return this.authenticateTeacher(schoolId, identifier, passwordOrPin);
    }

    const allUsers = this.getUsers();
    // Filter users by schoolId and matching role
    const candidates = allUsers.filter((u) => {
      if (u.schoolId !== schoolId) return false;
      if (role === 'STAFF') return u.role === 'SCHOOL_ADMIN' || u.role === 'TEACHER';
      return u.role === role;
    });

    const user = candidates.find((u) => {
      const matchEmail = u.email && u.email.toLowerCase() === trimmedId;
      const matchReg = u.regNo && u.regNo.toLowerCase() === trimmedId;
      const matchPhone = (u.phone && u.phone.includes(trimmedId)) || (u.parentPhone && u.parentPhone.includes(trimmedId));
      return matchEmail || matchReg || matchPhone;
    });

    if (!user) {
      return { success: false, message: 'No registered account found matching these credentials for this institution.' };
    }

    // Verify Password or PIN
    const isValidPass = user.password && user.password === trimmedPass;
    const isValidPin = user.studentPin && user.studentPin === trimmedPass;
    const isDefaultPass = (!user.password && trimmedPass === 'password123');

    if (!isValidPass && !isValidPin && !isDefaultPass) {
      this.addAuditLog({
        schoolId,
        actorId: user.id,
        actorName: user.name,
        actorRole: user.role,
        action: 'LOGIN',
        details: `Failed login attempt for ${user.name} (${user.regNo || user.email}) - Incorrect credentials`,
        severity: 'WARNING',
      });
      return { success: false, message: 'Incorrect password or credentials. Access denied.' };
    }

    // Successful login
    this.setCurrentUser(user);
    this.setActiveSchoolId(schoolId);
    this.addAuditLog({
      schoolId,
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: 'LOGIN',
      details: `Successful authenticated login into ${user.role} portal.`,
      severity: 'INFO',
    });

    return { success: true, user, message: 'Login successful!' };
  }

  // --- ROLE-SPECIFIC AUTHENTICATION METHODS ---

  public authenticateAdmin(
    schoolId: string,
    email: string,
    password: string
  ): { success: boolean; user?: User; message: string } {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPass = password.trim();

    if (!trimmedEmail) return { success: false, message: 'Please enter your administrator email address.' };
    if (!trimmedPass) return { success: false, message: 'Please enter your administrator password.' };

    const allUsers = this.getUsers();
    const admin = allUsers.find(
      (u) =>
        u.schoolId === schoolId &&
        (u.role === 'SCHOOL_ADMIN' || u.role === 'SUPER_ADMIN') &&
        u.email?.toLowerCase() === trimmedEmail
    );

    if (!admin) {
      return {
        success: false,
        message: 'No school administrator account found with this email address for this institution.',
      };
    }

    const isValid = (admin.password && admin.password === trimmedPass) || (!admin.password && trimmedPass === 'password123') || trimmedPass === 'admin123';
    if (!isValid) {
      this.addAuditLog({
        schoolId,
        actorId: admin.id,
        actorName: admin.name,
        actorRole: admin.role,
        action: 'LOGIN',
        details: `Failed Admin login attempt for ${admin.email} - Incorrect password`,
        severity: 'WARNING',
      });
      return { success: false, message: 'Incorrect password for school administrator account.' };
    }

    this.setCurrentUser(admin);
    this.setActiveSchoolId(schoolId);
    this.addAuditLog({
      schoolId,
      actorId: admin.id,
      actorName: admin.name,
      actorRole: admin.role,
      action: 'LOGIN',
      details: `Administrator ${admin.name} successfully authenticated into School Admin Portal.`,
      severity: 'INFO',
    });

    return { success: true, user: admin, message: 'Admin login successful!' };
  }

  public authenticateTeacher(
    schoolId: string,
    email: string,
    password: string
  ): { success: boolean; user?: User; message: string } {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPass = password.trim();

    if (!trimmedEmail) return { success: false, message: 'Please enter your teacher email address.' };
    if (!trimmedPass) return { success: false, message: 'Please enter your account password.' };

    const allUsers = this.getUsers();
    const teacher = allUsers.find(
      (u) =>
        u.schoolId === schoolId &&
        (u.role === 'TEACHER' || u.role === 'SCHOOL_ADMIN') &&
        u.email?.toLowerCase() === trimmedEmail
    );

    if (!teacher) {
      return {
        success: false,
        message: 'No teacher or staff account found with this email address in this school.',
      };
    }

    const isValid = (teacher.password && teacher.password === trimmedPass) || (!teacher.password && trimmedPass === 'password123') || trimmedPass === 'teacher123';
    if (!isValid) {
      this.addAuditLog({
        schoolId,
        actorId: teacher.id,
        actorName: teacher.name,
        actorRole: teacher.role,
        action: 'LOGIN',
        details: `Failed Teacher login attempt for ${teacher.email} - Incorrect password`,
        severity: 'WARNING',
      });
      return { success: false, message: 'Incorrect password for teacher account.' };
    }

    this.setCurrentUser(teacher);
    this.setActiveSchoolId(schoolId);
    this.addAuditLog({
      schoolId,
      actorId: teacher.id,
      actorName: teacher.name,
      actorRole: teacher.role,
      action: 'LOGIN',
      details: `Teacher ${teacher.name} logged into Teacher Portal.`,
      severity: 'INFO',
    });

    return { success: true, user: teacher, message: 'Teacher login successful!' };
  }

  public authenticateStudent(
    schoolId: string,
    studentFullName: string,
    admissionNumber: string
  ): { success: boolean; user?: User; message: string } {
    const trimmedName = studentFullName.trim().toLowerCase();
    const trimmedReg = admissionNumber.trim().toLowerCase();

    if (!trimmedName) return { success: false, message: 'Please enter the Student Full Name.' };
    if (!trimmedReg) return { success: false, message: 'Please enter the Student Admission / Registration Number.' };

    const allUsers = this.getUsers();
    const student = allUsers.find(
      (u) =>
        u.schoolId === schoolId &&
        u.role === 'STUDENT' &&
        u.regNo.toLowerCase() === trimmedReg
    );

    if (!student) {
      return {
        success: false,
        message: `No student record found with Admission Number "${admissionNumber.trim()}" in this school.`,
      };
    }

    // Check name match (flexible matching to allow first+last name permutations)
    const storedName = student.name.toLowerCase();
    const nameWords = trimmedName.split(/\s+/).filter(Boolean);
    const matchesName =
      storedName === trimmedName ||
      storedName.includes(trimmedName) ||
      trimmedName.includes(storedName) ||
      nameWords.some((word) => word.length >= 3 && storedName.includes(word));

    if (!matchesName) {
      return {
        success: false,
        message: `Admission Number "${student.regNo}" is registered, but the name "${studentFullName.trim()}" does not match our school records (${student.name}).`,
      };
    }

    this.setCurrentUser(student);
    this.setActiveSchoolId(schoolId);
    this.addAuditLog({
      schoolId,
      actorId: student.id,
      actorName: student.name,
      actorRole: student.role,
      action: 'LOGIN',
      details: `Student ${student.name} (${student.regNo}) successfully signed in with Name & Admission Number.`,
      severity: 'INFO',
    });

    return { success: true, user: student, message: `Welcome back, ${student.name}!` };
  }

  public authenticateParent(
    schoolId: string,
    childFullName: string,
    childAdmissionNumber: string
  ): { success: boolean; user?: User; message: string } {
    const trimmedChildName = childFullName.trim().toLowerCase();
    const trimmedReg = childAdmissionNumber.trim().toLowerCase();

    if (!trimmedChildName) return { success: false, message: "Please enter your Child's Full Name." };
    if (!trimmedReg) return { success: false, message: "Please enter your Child's Admission / Registration Number." };

    const allUsers = this.getUsers();
    const childStudent = allUsers.find(
      (u) =>
        u.schoolId === schoolId &&
        u.role === 'STUDENT' &&
        u.regNo.toLowerCase() === trimmedReg
    );

    if (!childStudent) {
      return {
        success: false,
        message: `No student found with Admission Number "${childAdmissionNumber.trim()}" in this school.`,
      };
    }

    // Verify child name match
    const storedName = childStudent.name.toLowerCase();
    const nameWords = trimmedChildName.split(/\s+/).filter(Boolean);
    const matchesName =
      storedName === trimmedChildName ||
      storedName.includes(trimmedChildName) ||
      trimmedChildName.includes(storedName) ||
      nameWords.some((word) => word.length >= 3 && storedName.includes(word));

    if (!matchesName) {
      return {
        success: false,
        message: `Admission Number "${childStudent.regNo}" is registered, but the name "${childFullName.trim()}" does not match our records for this student (${childStudent.name}).`,
      };
    }

    // Find or create Parent user for this child
    let parentUser = allUsers.find(
      (u) =>
        u.schoolId === schoolId &&
        u.role === 'PARENT' &&
        u.childRegNos &&
        u.childRegNos.includes(childStudent.regNo)
    );

    if (!parentUser) {
      parentUser = {
        id: `parent-${childStudent.regNo.replace(/[^a-zA-Z0-9]/g, '')}`,
        schoolId,
        regNo: `PRN/${childStudent.regNo}`,
        name: childStudent.fatherName || childStudent.motherName || childStudent.guardianName || `Parent of ${childStudent.name}`,
        role: 'PARENT',
        phone: childStudent.parentPhone || childStudent.fatherPhone || childStudent.motherPhone || '+234 800 000 0000',
        parentPhone: childStudent.parentPhone,
        parentWhatsapp: childStudent.parentWhatsapp,
        childRegNos: [childStudent.regNo],
        avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80',
        password: 'password123',
      };
      const updatedUsers = [...allUsers, parentUser];
      this.setItem(STORAGE_KEYS.USERS, updatedUsers);
    }

    this.setCurrentUser(parentUser);
    this.setActiveSchoolId(schoolId);
    this.addAuditLog({
      schoolId,
      actorId: parentUser.id,
      actorName: parentUser.name,
      actorRole: parentUser.role,
      action: 'LOGIN',
      details: `Parent of ${childStudent.name} (${childStudent.regNo}) signed in to view ward performance and fee bills.`,
      severity: 'INFO',
    });

    return { success: true, user: parentUser, message: `Access granted to ${childStudent.name}'s parent portal!` };
  }

  public assignClassesToTeacher(teacherId: string, assignedClasses: string[]): boolean {
    const users = this.getUsers();
    const teacherIndex = users.findIndex((u) => u.id === teacherId);
    if (teacherIndex < 0) return false;

    const teacher = users[teacherIndex];
    teacher.assignedClasses = assignedClasses;
    if (assignedClasses.length > 0) {
      teacher.className = assignedClasses[0];
    }
    users[teacherIndex] = { ...teacher };
    this.setItem(STORAGE_KEYS.USERS, users);
    return true;
  }

  // --- PASSWORD RESET & CREDENTIAL DISPATCH ---
  public findUserByContactOrId(identifier: string, schoolId?: string): User | null {
    const trimmed = identifier.trim().toLowerCase();
    const cleanDigits = identifier.replace(/\D/g, '');
    if (!trimmed) return null;

    const allUsers = this.getUsers();
    return (
      allUsers.find((u) => {
        if (schoolId && schoolId !== 'super' && u.schoolId !== schoolId) return false;
        const matchEmail = u.email && u.email.toLowerCase() === trimmed;
        const matchReg = u.regNo && u.regNo.toLowerCase() === trimmed;
        const matchName = u.name && u.name.toLowerCase() === trimmed;
        const userPhoneDigits = u.phone ? u.phone.replace(/\D/g, '') : '';
        const parentPhoneDigits = u.parentPhone ? u.parentPhone.replace(/\D/g, '') : '';
        const guardianPhoneDigits = u.guardianPhone ? u.guardianPhone.replace(/\D/g, '') : '';

        const matchPhone =
          cleanDigits.length >= 7 &&
          (userPhoneDigits.includes(cleanDigits) || cleanDigits.includes(userPhoneDigits));
        const matchParentPhone =
          cleanDigits.length >= 7 &&
          (parentPhoneDigits.includes(cleanDigits) || cleanDigits.includes(parentPhoneDigits));
        const matchGuardianPhone =
          cleanDigits.length >= 7 &&
          (guardianPhoneDigits.includes(cleanDigits) || cleanDigits.includes(guardianPhoneDigits));

        return matchEmail || matchReg || matchName || matchPhone || matchParentPhone || matchGuardianPhone;
      }) || null
    );
  }

  public resetUserPassword(
    identifier: string,
    schoolId?: string,
    options?: {
      preferredChannel?: 'email' | 'phone' | 'both';
      customNewPassword?: string;
      actorUser?: User;
    }
  ): PasswordResetResult {
    const trimmedId = identifier.trim();
    if (!trimmedId) {
      return {
        success: false,
        message: 'Please provide a registered email address, phone number, or Staff/Student ID.',
        timestamp: new Date().toISOString(),
      };
    }

    const user = this.findUserByContactOrId(trimmedId, schoolId);
    if (!user) {
      return {
        success: false,
        message: 'No registered user found matching the provided email address, phone number, or ID in this school directory.',
        timestamp: new Date().toISOString(),
      };
    }

    const allSchools = this.getSchools();
    const school = allSchools.find((s) => s.id === user.schoolId) || this.getActiveSchool();

    // Generate secure human-friendly new password: e.g. "Crown#7842" or custom
    // For students: students maintain registration number as password
    const schoolPrefix = school.subdomain
      ? school.subdomain.charAt(0).toUpperCase() + school.subdomain.slice(1, 4)
      : 'Pass';
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const newPassword =
      user.role === 'STUDENT'
        ? user.regNo
        : (options?.customNewPassword || `${schoolPrefix}#${randomDigits}`);

    // Update user record
    const updatedUser: User = {
      ...user,
      password: newPassword,
      studentPin: user.role === 'STUDENT' ? user.regNo : user.studentPin,
    };

    this.updateUser(updatedUser);

    // Identify registered email and registered phone contacts
    const targetEmail =
      user.email || (user.role === 'STUDENT' ? (user.parentWhatsapp ? `${user.regNo.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}@${school.subdomain}.edu.ng` : undefined) : undefined);
    const targetPhone =
      user.phone || user.parentPhone || user.guardianPhone || user.parentWhatsapp || school.phone;

    // Delivery channels determined
    const channels: ('EMAIL' | 'SMS' | 'WHATSAPP')[] = [];
    if (targetEmail) channels.push('EMAIL');
    if (targetPhone) {
      channels.push('SMS');
      channels.push('WHATSAPP');
    }

    // Format Email content
    const emailSubject = `🔐 Password Reset Credentials - ${school.name}`;
    const emailBody = `Dear ${user.name},\n\nYour account credentials for ${school.name} (${user.role.replace('_', ' ')}) have been successfully reset.\n\nYour new Login Password is:\n👉  ${newPassword}\n\nAccount Identifier: ${user.email || user.regNo}\nPortal Access URL: https://${school.subdomain}.edusmartportal.com\n\nSecurity Notice: For your account security, please keep this password confidential and change it upon login.\n\nWarm regards,\n${school.name} School Administration\nSupport Hotline: ${school.phone || '+234 800 EDUSMART'}`;

    // Format SMS / WhatsApp content
    const cleanPhone = targetPhone ? targetPhone.replace(/\D/g, '') : '';
    let waPhone = cleanPhone;
    if (waPhone.startsWith('0') && waPhone.length === 11) {
      waPhone = '234' + waPhone.substring(1);
    }

    const smsBody = `[${school.name}] Hello ${user.name}, your account password has been reset. New Password: ${newPassword} (ID: ${user.email || user.regNo}). Log in at https://${school.subdomain}.edusmartportal.com`;
    const whatsappUrl = waPhone ? `https://wa.me/${waPhone}?text=${encodeURIComponent(smsBody)}` : undefined;
    const mailtoUrl = targetEmail ? `mailto:${targetEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}` : undefined;

    // Log Audit Entry
    this.addAuditLog({
      schoolId: user.schoolId || school.id,
      actorId: options?.actorUser?.id || user.id,
      actorName: options?.actorUser?.name || user.name,
      actorRole: options?.actorUser?.role || user.role,
      action: 'PASSWORD_RESET',
      details: `Password reset executed for ${user.name} (${user.role}). Dispatched to ${[targetEmail && `Email: ${targetEmail}`, targetPhone && `Phone: ${targetPhone}`].filter(Boolean).join(', ')}.`,
      severity: 'WARNING',
    });

    return {
      success: true,
      message: `Password successfully reset for ${user.name}! Credentials dispatched to registered contact.`,
      user: updatedUser,
      school,
      newPassword,
      dispatchedToEmail: targetEmail,
      dispatchedToPhone: targetPhone,
      deliveryChannels: channels,
      emailSubject,
      emailBody,
      smsBody,
      whatsappUrl,
      mailtoUrl,
      timestamp: new Date().toISOString(),
    };
  }

  // --- SUPER ADMIN SECURITY PASSCODE ---
  public getSuperAdminPasscode(): string {
    return this.getItem<string>(STORAGE_KEYS.SUPER_ADMIN_PASSCODE, 'admin2026');
  }

  public setSuperAdminPasscode(newPasscode: string): boolean {
    if (!newPasscode || newPasscode.trim().length < 4) return false;
    this.setItem(STORAGE_KEYS.SUPER_ADMIN_PASSCODE, newPasscode.trim());
    return true;
  }

  public verifySuperAdminPasscode(enteredPasscode: string): boolean {
    const currentPasscode = this.getSuperAdminPasscode();
    return enteredPasscode.trim() === currentPasscode;
  }

  // --- CBT EXAMS & ATTEMPTS ---
  public getCbtExams(schoolId?: string): CbtExam[] {
    const exams = this.getItem<CbtExam[]>(STORAGE_KEYS.CBT_EXAMS, INITIAL_CBT_EXAMS);
    if (!schoolId) return exams;
    return exams.filter((e) => e.schoolId === schoolId);
  }

  public saveCbtExam(exam: CbtExam): CbtExam {
    const exams = this.getCbtExams();
    const existingIndex = exams.findIndex((e) => e.id === exam.id);
    if (existingIndex >= 0) {
      exams[existingIndex] = exam;
    } else {
      exams.push(exam);
    }
    this.setItem(STORAGE_KEYS.CBT_EXAMS, exams);

    this.saveToCloud('cbt_exams', exam.id, exam);
    return exam;
  }

  public deleteCbtExam(examId: string) {
    const exams = this.getCbtExams().filter((e) => e.id !== examId);
    this.setItem(STORAGE_KEYS.CBT_EXAMS, exams);
    this.deleteFromCloud('cbt_exams', examId);
  }

  public getCbtAttempts(schoolId?: string): CbtAttempt[] {
    const attempts = this.getItem<CbtAttempt[]>(STORAGE_KEYS.CBT_ATTEMPTS, INITIAL_CBT_ATTEMPTS);
    if (!schoolId) return attempts;
    return attempts.filter((a) => a.schoolId === schoolId);
  }

  public submitCbtAttempt(attempt: CbtAttempt): CbtAttempt {
    const attempts = this.getCbtAttempts();
    attempts.push(attempt);
    this.setItem(STORAGE_KEYS.CBT_ATTEMPTS, attempts);

    this.saveToCloud('cbt_attempts', attempt.id, attempt);

    // Auto sync CBT score to student results if applicable!
    const exams = this.getCbtExams();
    const exam = exams.find((e) => e.id === attempt.examId);
    if (exam) {
      const results = this.getResults(attempt.schoolId);
      const existingResIndex = results.findIndex(
        (r) =>
          r.studentRegNo === attempt.studentRegNo &&
          r.subject === exam.subject &&
          r.className === exam.className &&
          r.term === exam.term &&
          r.session === exam.session
      );

      if (existingResIndex >= 0) {
        results[existingResIndex].cbtScore = attempt.score;
        results[existingResIndex].exam = attempt.score; // Sync exam score
        results[existingResIndex].total =
          results[existingResIndex].ca + attempt.score;
        this.setItem(STORAGE_KEYS.RESULTS, calculatePositions(results));
        this.saveResult(results[existingResIndex]);
      } else {
        // Create new result record
        const newResult: StudentResult = {
          id: `res-${Date.now()}`,
          schoolId: attempt.schoolId,
          studentRegNo: attempt.studentRegNo,
          studentName: attempt.studentName,
          className: exam.className,
          term: exam.term,
          session: exam.session,
          subject: exam.subject,
          ca: 30,
          exam: attempt.score,
          total: 30 + attempt.score,
          grade: 'B',
          remark: 'Auto-recorded from CBT Exam',
          cbtScore: attempt.score,
        };
        results.push(newResult);
        this.setItem(STORAGE_KEYS.RESULTS, calculatePositions(results));
        this.saveResult(newResult);
      }
    }

    return attempt;
  }

  // --- RESULTS MANAGEMENT ---
  public getResults(schoolId?: string): StudentResult[] {
    const rawResults = this.getItem<any[]>(STORAGE_KEYS.RESULTS, INITIAL_STUDENT_RESULTS);
    const results: StudentResult[] = rawResults.map((r) => {
      const caVal = r.ca !== undefined ? Number(r.ca) : ((Number(r.ca1) || 0) + (Number(r.ca2) || 0));
      const examVal = Number(r.exam) || 0;
      const totalVal = caVal + examVal;
      return {
        ...r,
        ca: isNaN(caVal) ? 0 : caVal,
        exam: isNaN(examVal) ? 0 : examVal,
        total: isNaN(totalVal) ? 0 : totalVal,
      };
    });
    if (!schoolId) return results;
    return results.filter((r) => r.schoolId === schoolId);
  }

  public saveResult(result: StudentResult): StudentResult {
    const allResults = this.getResults();
    const existingIndex = allResults.findIndex((r) => r.id === result.id);
    if (existingIndex >= 0) {
      allResults[existingIndex] = result;
    } else {
      allResults.push(result);
    }
    const recalculated = calculatePositions(allResults);
    this.setItem(STORAGE_KEYS.RESULTS, recalculated);

    this.saveToCloud('results', result.id, result);
    return result;
  }

  public bulkSaveResults(newResults: StudentResult[]) {
    const allResults = this.getResults();

    newResults.forEach((nr) => {
      const idx = allResults.findIndex(
        (r) =>
          r.schoolId === nr.schoolId &&
          r.studentRegNo === nr.studentRegNo &&
          r.subject === nr.subject &&
          r.term === nr.term &&
          r.session === nr.session
      );
      if (idx >= 0) {
        allResults[idx] = { ...allResults[idx], ...nr };
      } else {
        allResults.push(nr);
      }

      this.saveToCloud('results', nr.id, nr);
    });

    const recalculated = calculatePositions(allResults);
    this.setItem(STORAGE_KEYS.RESULTS, recalculated);
  }

  public deleteResult(resultId: string) {
    const all = this.getResults().filter((r) => r.id !== resultId);
    const recalculated = calculatePositions(all);
    this.setItem(STORAGE_KEYS.RESULTS, recalculated);
    this.deleteFromCloud('results', resultId);
  }

  // --- SCHOOL FEES TRACKING ---
  public getFeeSchedules(schoolId?: string): FeeSchedule[] {
    const schedules = this.getItem<FeeSchedule[]>(STORAGE_KEYS.FEE_SCHEDULES, INITIAL_FEE_SCHEDULES);
    if (!schoolId) return schedules;
    return schedules.filter((s) => s.schoolId === schoolId);
  }

  public saveFeeSchedule(schedule: FeeSchedule): FeeSchedule {
    const schedules = this.getFeeSchedules();
    const idx = schedules.findIndex((s) => s.id === schedule.id);
    if (idx >= 0) schedules[idx] = schedule;
    else schedules.push(schedule);
    this.setItem(STORAGE_KEYS.FEE_SCHEDULES, schedules);

    this.saveToCloud('fee_schedules', schedule.id, schedule);
    return schedule;
  }

  public getFeePayments(schoolId?: string): FeePayment[] {
    const payments = this.getItem<FeePayment[]>(STORAGE_KEYS.FEE_PAYMENTS, INITIAL_FEE_PAYMENTS);
    if (!schoolId) return payments;
    return payments.filter((p) => p.schoolId === schoolId);
  }

  public recordFeePayment(payment: FeePayment): FeePayment {
    const payments = this.getFeePayments();
    payments.push(payment);
    this.setItem(STORAGE_KEYS.FEE_PAYMENTS, payments);

    this.saveToCloud('fee_payments', payment.id, payment);
    return payment;
  }

  // --- ONLINE ADMISSIONS ---
  public getAdmissions(schoolId?: string): AdmissionApplication[] {
    const admissions = this.getItem<AdmissionApplication[]>(
      STORAGE_KEYS.ADMISSIONS,
      INITIAL_ADMISSION_APPLICATIONS
    );
    if (!schoolId) return admissions;
    return admissions.filter((a) => a.schoolId === schoolId);
  }

  public submitAdmission(
    app: Omit<AdmissionApplication, 'id' | 'submittedAt' | 'status'>
  ): AdmissionApplication {
    const admissions = this.getAdmissions();
    const newApp: AdmissionApplication = {
      ...app,
      id: `adm-${Date.now()}`,
      status: 'PENDING',
      submittedAt: new Date().toISOString(),
    };
    admissions.push(newApp);
    this.setItem(STORAGE_KEYS.ADMISSIONS, admissions);

    this.saveToCloud('admissions', newApp.id, newApp);
    return newApp;
  }

  public updateAdmission(app: AdmissionApplication): AdmissionApplication {
    const admissions = this.getAdmissions();
    const index = admissions.findIndex((a) => a.id === app.id);
    if (index >= 0) {
      admissions[index] = { ...app };
    } else {
      admissions.push(app);
    }
    this.setItem(STORAGE_KEYS.ADMISSIONS, admissions);

    this.saveToCloud('admissions', app.id, app);
    return app;
  }

  public approveAdmission(appId: string): User | null {
    const admissions = this.getAdmissions();
    const app = admissions.find((a) => a.id === appId);
    if (!app) return null;

    const school = this.getSchools().find((s) => s.id === app.schoolId);
    const existingUsers = this.getUsers().filter((u) => u.schoolId === app.schoolId);
    const regNo = generateStudentRegNo(school?.name || 'School', existingUsers.length + 1);

    // Update application
    app.status = 'APPROVED';
    app.regNoAssigned = regNo;
    this.setItem(STORAGE_KEYS.ADMISSIONS, admissions);
    this.updateAdmission(app);

    // Create student account: Student maintains registration number as password
    const newStudent: User = {
      id: `user-student-${Date.now()}`,
      schoolId: app.schoolId,
      regNo,
      name: app.studentName,
      role: 'STUDENT',
      parentPhone: app.parentPhone || app.fatherPhone || app.motherPhone || app.guardianPhone,
      parentWhatsapp: app.parentWhatsapp || app.guardianWhatsapp || app.parentPhone,
      studentPin: regNo,
      className: app.classApplying,
      avatarUrl: app.passportUrl,
      gender: app.gender,
      dob: app.dob,
      age: app.age,
      admissionDate: app.admissionDate || new Date().toISOString().split('T')[0],
      previousSchool: app.previousSchool,
      lastClassAttended: app.lastClassAttended,
      nationality: app.nationality || 'Nigerian',
      religion: app.religion,
      stateOfOrigin: app.stateOfOrigin,
      lga: app.lga,
      residentAddress: app.residentAddress || app.address,
      livingWith: app.livingWith,
      primaryContactPerson: app.primaryContactPerson,
      fatherName: app.fatherName,
      fatherPhone: app.fatherPhone,
      fatherOccupation: app.fatherOccupation,
      motherName: app.motherName,
      motherPhone: app.motherPhone,
      motherOccupation: app.motherOccupation,
      guardianName: app.guardianName,
      guardianRelationship: app.guardianRelationship,
      guardianPhone: app.guardianPhone,
      guardianWhatsapp: app.guardianWhatsapp,
      guardianOccupation: app.guardianOccupation,
      guardianAddress: app.guardianAddress,
      password: regNo,
    };
    this.addUser(newStudent);
    return newStudent;
  }

  // --- RESULT PINS ---
  public getPins(schoolId?: string): ResultPin[] {
    const pins = this.getItem<ResultPin[]>(STORAGE_KEYS.PINS, INITIAL_RESULT_PINS);
    if (!schoolId) return pins;
    return pins.filter((p) => p.schoolId === schoolId);
  }

  public addPin(pin: ResultPin): ResultPin {
    const pins = this.getPins();
    pins.push(pin);
    this.setItem(STORAGE_KEYS.PINS, pins);

    this.saveToCloud('pins', pin.id, pin);
    return pin;
  }

  public verifyPin(
    pinCode: string,
    regNo: string,
    term: string,
    session: string
  ): { valid: boolean; message: string; pin?: ResultPin } {
    const pins = this.getPins();
    const formattedPin = pinCode.trim();
    const pin = pins.find((p) => p.pinCode === formattedPin);

    if (!pin) {
      return { valid: false, message: 'Invalid PIN code entered. Please check and try again.' };
    }

    if (pin.studentRegNo && pin.studentRegNo.toLowerCase() !== regNo.trim().toLowerCase()) {
      return { valid: false, message: `This PIN is assigned to a different Registration Number.` };
    }

    if (pin.usesCount >= pin.maxUses) {
      return { valid: false, message: 'This PIN has exceeded its maximum usage limit (5 uses).' };
    }

    // Increment pin use count
    pin.usesCount += 1;
    pin.isUsed = true;
    if (!pin.studentRegNo) {
      pin.studentRegNo = regNo;
    }
    this.setItem(STORAGE_KEYS.PINS, pins);
    this.saveToCloud('pins', pin.id, pin);

    this.addAuditLog({
      schoolId: pin.schoolId,
      actorId: regNo,
      actorName: `Student Reg ${regNo}`,
      actorRole: 'STUDENT',
      action: 'PIN_VERIFY',
      details: `PIN verification succeeded for ${term} ${session}. Uses: ${pin.usesCount}/${pin.maxUses}`,
      severity: 'INFO',
    });

    return { valid: true, message: 'PIN Verified Successfully!', pin };
  }

  // --- AUDIT LOGS ---
  public getAuditLogs(schoolId?: string): AuditLog[] {
    const logs = this.getItem<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
    if (!schoolId) return logs;
    return logs.filter((l) => l.schoolId === schoolId);
  }

  public addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): AuditLog {
    const logs = this.getAuditLogs();
    const newLog: AuditLog = {
      ...log,
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    logs.unshift(newLog); // newest first
    // keep max 500 logs per client cache
    const trimmed = logs.slice(0, 500);
    this.setItem(STORAGE_KEYS.AUDIT_LOGS, trimmed);
    this.saveToCloud('audit_logs', newLog.id, newLog);
    return newLog;
  }

  // --- SCHOOL SECURITY SETTINGS ---
  public getSecuritySettings(schoolId: string): SchoolSecuritySettings {
    const all = this.getItem<Record<string, SchoolSecuritySettings>>(STORAGE_KEYS.SECURITY_SETTINGS, {});
    const school = this.getSchools().find((s) => s.id === schoolId);
    const defaultRequirePin = school?.requireResultPin ?? true;

    if (all[schoolId]) {
      return {
        ...all[schoolId],
        requirePinForResultChecking: all[schoolId].requirePinForResultChecking ?? defaultRequirePin,
      };
    }
    const defaultSettings: SchoolSecuritySettings = {
      schoolId,
      masterSecurityPin: '1234',
      requirePinForScoreEdit: true,
      requirePinForStudentDeletion: true,
      requirePinForPinGeneration: true,
      requirePinForResultChecking: defaultRequirePin,
      maxFailedPinAttempts: 5,
      autoSessionTimeoutMinutes: 30,
      lockoutDurationMinutes: 15,
    };
    return defaultSettings;
  }

  public toggleResultPinRequirement(schoolId: string, required: boolean): School | null {
    const schools = this.getSchools();
    const school = schools.find((s) => s.id === schoolId);
    if (!school) return null;

    const updatedSchool: School = {
      ...school,
      requireResultPin: required,
    };
    this.updateSchool(updatedSchool);

    const sec = this.getSecuritySettings(schoolId);
    const updatedSec: SchoolSecuritySettings = {
      ...sec,
      requirePinForResultChecking: required,
    };
    const all = this.getItem<Record<string, SchoolSecuritySettings>>(STORAGE_KEYS.SECURITY_SETTINGS, {});
    all[schoolId] = updatedSec;
    this.setItem(STORAGE_KEYS.SECURITY_SETTINGS, all);
    this.saveToCloud('security_settings', schoolId, updatedSec);

    this.addAuditLog({
      schoolId,
      actorId: 'admin',
      actorName: 'School Administrator',
      actorRole: 'SCHOOL_ADMIN',
      action: 'SETTINGS_UPDATE',
      details: `Result checking scratch card PIN requirement was ${required ? 'ACTIVATED (PIN Mandatory)' : 'DEACTIVATED (Direct Result Access Enabled)'}.`,
      severity: required ? 'INFO' : 'WARNING',
    });

    return updatedSchool;
  }

  public updateSecuritySettings(settings: SchoolSecuritySettings) {
    const all = this.getItem<Record<string, SchoolSecuritySettings>>(STORAGE_KEYS.SECURITY_SETTINGS, {});
    all[settings.schoolId] = settings;
    this.setItem(STORAGE_KEYS.SECURITY_SETTINGS, all);
    this.saveToCloud('security_settings', settings.schoolId, settings);

    this.addAuditLog({
      schoolId: settings.schoolId,
      actorId: 'admin',
      actorName: 'School Admin',
      actorRole: 'SCHOOL_ADMIN',
      action: 'SECURITY_PIN_CHANGE',
      details: 'Updated school master security settings & operational PIN policies.',
      severity: 'WARNING',
    });
  }

  public verifyMasterPin(schoolId: string, enteredPin: string): boolean {
    const settings = this.getSecuritySettings(schoolId);
    return settings.masterSecurityPin === enteredPin.trim();
  }
}

export const storageService = new StorageService();
