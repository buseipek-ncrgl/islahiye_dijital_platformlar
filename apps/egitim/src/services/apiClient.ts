export type PublicationStatus = 0 | 1 | 2;

export interface TermDto {
  id: string;
  programId: string;
  name: string;
  startDate: string;
  endDate: string;
  applicationStartAt: string;
  applicationEndAt: string;
  capacity: number;
  status: PublicationStatus;
  rowVersion?: string;
}

export interface ProgramDto {
  id: string;
  name: string;
  slug: string;
  description: string;
  targetAudience: string;
  prerequisites: string;
  learningOutcomes: string;
  status: PublicationStatus;
  rowVersion?: string;
  terms: TermDto[];
}

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  roles: string[];
  permissions: string[];
}

export interface ApplicationDocumentDto {
  id: string;
  documentType: string;
  fileName: string;
  contentType: string;
  fileSizeBytes: number;
  status: number;
  verifiedAt?: string;
}

export interface ApplicationEvaluationDto {
  id: string;
  evaluatedByUserId: string;
  totalScore: number;
  recommendation: string;
  evaluationNotes: string;
  evaluatedAt: string;
}

export interface ApplicationDto {
  id: string;
  applicationNumber: string;
  applicantUserId: string;
  programId: string;
  programName: string;
  termId: string;
  termName: string;
  fullName: string;
  email: string;
  phone: string;
  birthDate: string;
  educationLevel: string;
  occupation: string;
  experienceYears: number;
  motivation: string;
  address: string;
  specialNeeds: string;
  status: number; // 0=Draft, 1=Submitted, 2=UnderReview, 3=Accepted, 4=Waitlisted, 5=Rejected, 6=Withdrawn
  submittedAt?: string;
  adminNotes?: string;
  rejectionReason?: string;
  score: number;
  documents: ApplicationDocumentDto[];
  evaluations: ApplicationEvaluationDto[];
  createdAt: string;
}

export interface CourseGroupDto {
  id: string;
  programId: string;
  programName: string;
  termId: string;
  termName: string;
  name: string;
  code: string;
  classroom: string;
  capacity: number;
  instructorUserId?: string;
  instructorName?: string;
  status: number;
  enrolledCount: number;
  createdAt: string;
}

export interface EnrollmentDto {
  id: string;
  applicationId?: string;
  studentUserId: string;
  studentName: string;
  studentEmail: string;
  programId: string;
  programName: string;
  termId: string;
  termName: string;
  groupId?: string;
  groupName?: string;
  enrollmentNumber: string;
  status: number; // 1=Active, 2=Completed, 3=Dropped
  enrolledAt: string;
  completedAt?: string;
}

export interface AttendanceRecordDto {
  id: string;
  sessionId: string;
  studentUserId: string;
  studentName: string;
  status: number; // 1=Present, 2=Absent, 3=Excused
  recordedAt: string;
  notes?: string;
}

export interface CourseSessionDto {
  id: string;
  groupId: string;
  groupName: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  classroom: string;
  status: number; // 1=Scheduled, 2=Completed, 3=Cancelled
  notes?: string;
  attendanceRecords: AttendanceRecordDto[];
}

export interface AssignmentSubmissionDto {
  id: string;
  assignmentId: string;
  studentUserId: string;
  studentName: string;
  submissionText: string;
  attachmentPath?: string;
  submittedAt: string;
  score?: number;
  feedback?: string;
  evaluatedByUserId?: string;
  evaluatedAt?: string;
  status: number; // 1=Submitted, 2=Graded, 3=RevisionRequested
  revisionNumber: number;
}

export interface AssignmentDto {
  id: string;
  groupId: string;
  groupName: string;
  title: string;
  description: string;
  dueDate: string;
  maxScore: number;
  weight: number;
  isMandatory: boolean;
  submissions: AssignmentSubmissionDto[];
  createdAt: string;
}

export interface SuccessDecisionDto {
  id: string;
  studentUserId: string;
  studentName: string;
  programId: string;
  programName: string;
  termId: string;
  termName: string;
  attendanceRate: number;
  assignmentAverage: number;
  mandatoryAssignmentsPassed: boolean;
  finalStatus: number; // 1=Successful, 2=Unsuccessful, 3=Conditional
  decidedByUserId: string;
  decidedAt: string;
  decisionNotes?: string;
}

export interface CertificateDto {
  id: string;
  studentUserId: string;
  studentName: string;
  programId: string;
  programName: string;
  termId: string;
  termName: string;
  certificateNumber: string;
  verificationCode: string;
  issueDate: string;
  expiryDate?: string;
  pdfUrl?: string;
  status: number; // 1=Active, 2=Revoked
  revocationReason?: string;
  revokedAt?: string;
}

export interface CertificateVerifyResult {
  isValid: boolean;
  studentName?: string;
  programName?: string;
  termName?: string;
  certificateNumber?: string;
  verificationCode?: string;
  issueDate?: string;
  status?: number;
  message?: string;
}

export interface ChannelMessageDto {
  id: string;
  channelId: string;
  senderUserId: string;
  senderName: string;
  content: string;
  createdAt: string;
}

export interface ChannelDto {
  id: string;
  name: string;
  description: string;
  type: number;
  groupId?: string;
  createdByUserId: string;
  isArchived: boolean;
  messageCount: number;
  createdAt: string;
}

export interface DirectMessageDto {
  id: string;
  senderUserId: string;
  senderName: string;
  receiverUserId: string;
  receiverName: string;
  content: string;
  createdAt: string;
  readAt?: string;
}

export interface AnnouncementDto {
  id: string;
  title: string;
  content: string;
  targetRole: string;
  priority: number;
  isActive: boolean;
  createdByUserId: string;
  createdAt: string;
}

export interface NotificationDto {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface UserDetailDto {
  id: string;
  email: string;
  displayName: string;
  isActive: boolean;
  roles: string[];
  createdAt: string;
}

export interface SystemSettingDto {
  id: string;
  key: string;
  value: string;
  category: string;
  description: string;
  updatedAt: string;
}

// Low-level fetch wrapper
let csrfToken = '';
async function csrf(): Promise<string> {
  if (csrfToken) return csrfToken;
  try {
    const response = await fetch('/api/v1/auth/csrf', { credentials: 'include' });
    if (response.ok) {
      csrfToken = (await response.json()).token;
    }
  } catch {
    // Graceful fallback if csrf endpoint isn't needed
  }
  return csrfToken;
}

async function request<T>(url: string, init: RequestInit = {}): Promise<T> {
  const method = init.method?.toUpperCase() ?? 'GET';
  const headers = new Headers(init.headers);
  if (method !== 'GET' && method !== 'HEAD') {
    const token = await csrf();
    if (token) headers.set('X-CSRF-TOKEN', token);
  }
  if (init.body && typeof init.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const response = await fetch(url, { ...init, headers, credentials: 'include' });
  if (response.status === 204) return undefined as T;
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(body?.detail ?? body?.title ?? `Sunucu isteği reddetti (${response.status}).`);
  }
  return body as T;
}

// Typed API Client
export const educationApi = {
  // Programs & Terms
  programs: () => request<ProgramDto[]>('/api/v1/programs'),
  program: (id: string) => request<ProgramDto>(`/api/v1/programs/${id}`),
  createProgram: (body: Omit<ProgramDto, 'id' | 'terms' | 'rowVersion'>, idempotencyKey = crypto.randomUUID()) =>
    request<ProgramDto>('/api/v1/programs', { method: 'POST', headers: { 'Idempotency-Key': idempotencyKey }, body: JSON.stringify(body) }),
  updateProgram: (id: string, body: Omit<ProgramDto, 'id' | 'terms'>) =>
    request<ProgramDto>(`/api/v1/programs/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteProgram: (id: string) =>
    request<void>(`/api/v1/programs/${id}`, { method: 'DELETE' }),
  createTerm: (programId: string, body: Omit<TermDto, 'id' | 'programId' | 'rowVersion'>) =>
    request<TermDto>(`/api/v1/programs/${programId}/terms`, { method: 'POST', body: JSON.stringify(body) }),
  updateTerm: (id: string, body: Omit<TermDto, 'id' | 'programId'>) =>
    request<TermDto>(`/api/v1/terms/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteTerm: (id: string) =>
    request<void>(`/api/v1/terms/${id}`, { method: 'DELETE' }),

  // Applications
  applications: (params?: { programId?: string; termId?: string; status?: number; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.programId) q.set('programId', params.programId);
    if (params?.termId) q.set('termId', params.termId);
    if (params?.status !== undefined) q.set('status', params.status.toString());
    if (params?.search) q.set('search', params.search);
    const query = q.toString() ? `?${q}` : '';
    return request<ApplicationDto[]>(`/api/v1/applications${query}`);
  },
  myApplications: () => request<ApplicationDto[]>('/api/v1/applications/mine'),
  application: (id: string) => request<ApplicationDto>(`/api/v1/applications/${id}`),
  createApplication: (body: any) =>
    request<ApplicationDto>('/api/v1/applications', { method: 'POST', body: JSON.stringify(body) }),
  updateApplication: (id: string, body: any) =>
    request<ApplicationDto>(`/api/v1/applications/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  updateApplicationStatus: (id: string, body: { status: number; adminNotes?: string; rejectionReason?: string; internalDecisionNote?: string }) =>
    request<ApplicationDto>(`/api/v1/applications/${id}/status`, { method: 'PATCH', body: JSON.stringify(body) }),
  evaluateApplication: (id: string, body: { totalScore: number; recommendation: string; evaluationNotes: string }) =>
    request<ApplicationDto>(`/api/v1/applications/${id}/evaluate`, { method: 'POST', body: JSON.stringify(body) }),
  deleteApplication: (id: string) =>
    request<void>(`/api/v1/applications/${id}`, { method: 'DELETE' }),

  // Groups
  groups: (params?: { termId?: string; instructorId?: string }) => {
    const q = new URLSearchParams();
    if (params?.termId) q.set('termId', params.termId);
    if (params?.instructorId) q.set('instructorId', params.instructorId);
    const query = q.toString() ? `?${q}` : '';
    return request<CourseGroupDto[]>(`/api/v1/groups${query}`);
  },
  group: (id: string) => request<CourseGroupDto>(`/api/v1/groups/${id}`),
  createGroup: (body: any) =>
    request<CourseGroupDto>('/api/v1/groups', { method: 'POST', body: JSON.stringify(body) }),
  updateGroup: (id: string, body: any) =>
    request<CourseGroupDto>(`/api/v1/groups/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteGroup: (id: string) =>
    request<void>(`/api/v1/groups/${id}`, { method: 'DELETE' }),
  assignStudentToGroup: (id: string, student: { studentUserId: string; studentName: string; studentEmail: string }) =>
    request<CourseGroupDto>(`/api/v1/groups/${id}/students`, { method: 'POST', body: JSON.stringify(student) }),
  removeStudentFromGroup: (id: string, studentUserId: string) =>
    request<void>(`/api/v1/groups/${id}/students/${studentUserId}`, { method: 'DELETE' }),

  // Enrollments
  enrollments: (params?: { programId?: string; termId?: string; groupId?: string; studentId?: string; status?: number }) => {
    const q = new URLSearchParams();
    if (params?.programId) q.set('programId', params.programId);
    if (params?.termId) q.set('termId', params.termId);
    if (params?.groupId) q.set('groupId', params.groupId);
    if (params?.studentId) q.set('studentId', params.studentId);
    if (params?.status !== undefined) q.set('status', params.status.toString());
    const query = q.toString() ? `?${q}` : '';
    return request<EnrollmentDto[]>(`/api/v1/enrollments${query}`);
  },
  createEnrollment: (body: any) =>
    request<EnrollmentDto>('/api/v1/enrollments', { method: 'POST', body: JSON.stringify(body) }),
  updateEnrollmentStatus: (id: string, status: number) =>
    request<EnrollmentDto>(`/api/v1/enrollments/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  deleteEnrollment: (id: string) =>
    request<void>(`/api/v1/enrollments/${id}`, { method: 'DELETE' }),

  // Course Sessions & Attendance
  sessions: (params?: { groupId?: string; date?: string }) => {
    const q = new URLSearchParams();
    if (params?.groupId) q.set('groupId', params.groupId);
    if (params?.date) q.set('date', params.date);
    const query = q.toString() ? `?${q}` : '';
    return request<CourseSessionDto[]>(`/api/v1/sessions${query}`);
  },
  session: (id: string) => request<CourseSessionDto>(`/api/v1/sessions/${id}`),
  createSession: (body: any) =>
    request<CourseSessionDto>('/api/v1/sessions', { method: 'POST', body: JSON.stringify(body) }),
  updateSession: (id: string, body: any) =>
    request<CourseSessionDto>(`/api/v1/sessions/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteSession: (id: string) =>
    request<void>(`/api/v1/sessions/${id}`, { method: 'DELETE' }),
  sessionAttendance: (id: string) =>
    request<AttendanceRecordDto[]>(`/api/v1/sessions/${id}/attendance`),
  saveSessionAttendance: (id: string, records: { studentUserId: string; status: number; notes?: string }[]) =>
    request<CourseSessionDto>(`/api/v1/sessions/${id}/attendance`, { method: 'POST', body: JSON.stringify({ records }) }),

  // Assignments & Submissions
  assignments: (params?: { groupId?: string }) => {
    const q = new URLSearchParams();
    if (params?.groupId) q.set('groupId', params.groupId);
    const query = q.toString() ? `?${q}` : '';
    return request<AssignmentDto[]>(`/api/v1/assignments${query}`);
  },
  assignment: (id: string) => request<AssignmentDto>(`/api/v1/assignments/${id}`),
  createAssignment: (body: any) =>
    request<AssignmentDto>('/api/v1/assignments', { method: 'POST', body: JSON.stringify(body) }),
  updateAssignment: (id: string, body: any) =>
    request<AssignmentDto>(`/api/v1/assignments/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteAssignment: (id: string) =>
    request<void>(`/api/v1/assignments/${id}`, { method: 'DELETE' }),
  submitAssignment: (id: string, body: { submissionText: string; attachmentPath?: string }) =>
    request<AssignmentSubmissionDto>(`/api/v1/assignments/${id}/submit`, { method: 'POST', body: JSON.stringify(body) }),
  gradeAssignment: (submissionId: string, body: { score: number; feedback: string; status?: number }) =>
    request<AssignmentSubmissionDto>(`/api/v1/assignments/submissions/${submissionId}/grade`, { method: 'POST', body: JSON.stringify(body) }),

  // Success Decisions
  successDecisions: (params?: { programId?: string; termId?: string; studentId?: string }) => {
    const q = new URLSearchParams();
    if (params?.programId) q.set('programId', params.programId);
    if (params?.termId) q.set('termId', params.termId);
    if (params?.studentId) q.set('studentId', params.studentId);
    const query = q.toString() ? `?${q}` : '';
    return request<SuccessDecisionDto[]>(`/api/v1/success-decisions${query}`);
  },
  createSuccessDecision: (body: any) =>
    request<SuccessDecisionDto>('/api/v1/success-decisions', { method: 'POST', body: JSON.stringify(body) }),

  // Certificates & Verification
  certificates: (params?: { studentId?: string; termId?: string; status?: number }) => {
    const q = new URLSearchParams();
    if (params?.studentId) q.set('studentId', params.studentId);
    if (params?.termId) q.set('termId', params.termId);
    if (params?.status !== undefined) q.set('status', params.status.toString());
    const query = q.toString() ? `?${q}` : '';
    return request<CertificateDto[]>(`/api/v1/certificates${query}`);
  },
  verifyCertificate: (code: string) =>
    request<CertificateVerifyResult>(`/api/v1/certificates/verify/${encodeURIComponent(code)}`),
  issueCertificate: (body: any) =>
    request<CertificateDto>('/api/v1/certificates/issue', { method: 'POST', body: JSON.stringify(body) }),
  revokeCertificate: (id: string, reason: string) =>
    request<CertificateDto>(`/api/v1/certificates/${id}/revoke`, { method: 'PATCH', body: JSON.stringify(reason) }),
  certificatePdfUrl: (idOrCode: string) => `/api/v1/certificates/${encodeURIComponent(idOrCode)}/pdf`,
  verifyCertificatePdfUrl: (code: string) => `/api/v1/certificates/verify/${encodeURIComponent(code)}/pdf`,

  // Criteria & Scoring Rules
  criteria: (programId?: string) => {
    const query = programId ? `?programId=${encodeURIComponent(programId)}` : '';
    return request<any[]>(`/api/v1/criteria${query}`);
  },
  createCriteriaVersion: (body: any) =>
    request<any>('/api/v1/criteria', { method: 'POST', body: JSON.stringify(body) }),
  updateCriteria: (id: string, body: any) =>
    request<any>(`/api/v1/criteria/${id}`, { method: 'PUT', body: JSON.stringify(body) }),

  // File Uploads
  uploadFile: async (file: File, folder = 'general'): Promise<{ url: string; fileName: string; fileSizeBytes: number }> => {
    const formData = new FormData();
    formData.append('file', file);
    const token = await csrf();
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (token) headers['X-CSRF-TOKEN'] = token;
    const res = await fetch(`/api/v1/files/upload?folder=${encodeURIComponent(folder)}`, {
      method: 'POST',
      credentials: 'include',
      headers,
      body: formData,
    });
    if (!res.ok) throw new Error(`Dosya yüklenemedi: HTTP ${res.status}`);
    return res.json();
  },
  uploadApplicationDocument: async (applicationId: string, file: File, documentType: string): Promise<ApplicationDocumentDto> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    const token = await csrf();
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (token) headers['X-CSRF-TOKEN'] = token;
    const res = await fetch(`/api/v1/applications/${applicationId}/documents`, {
      method: 'POST',
      credentials: 'include',
      headers,
      body: formData,
    });
    if (!res.ok) throw new Error(`Belge yüklenemedi: HTTP ${res.status}`);
    return res.json();
  },

  // Channels & Messages
  channels: () => request<ChannelDto[]>('/api/v1/channels'),
  createChannel: (body: any) =>
    request<ChannelDto>('/api/v1/channels', { method: 'POST', body: JSON.stringify(body) }),
  channelMessages: (id: string) => request<ChannelMessageDto[]>(`/api/v1/channels/${id}/messages`),
  sendChannelMessage: (id: string, content: string) =>
    request<ChannelMessageDto>(`/api/v1/channels/${id}/messages`, { method: 'POST', body: JSON.stringify({ content }) }),
  directMessages: (user1: string, user2: string) =>
    request<DirectMessageDto[]>(`/api/v1/messages/direct?user1=${encodeURIComponent(user1)}&user2=${encodeURIComponent(user2)}`),
  sendDirectMessage: (body: { receiverUserId: string; receiverName: string; content: string }) =>
    request<DirectMessageDto>('/api/v1/messages/direct', { method: 'POST', body: JSON.stringify(body) }),

  // Announcements & Notifications
  announcements: (params?: { role?: string; activeOnly?: boolean }) => {
    const q = new URLSearchParams();
    if (params?.role) q.set('role', params.role);
    if (params?.activeOnly !== undefined) q.set('activeOnly', params.activeOnly.toString());
    const query = q.toString() ? `?${q}` : '';
    return request<AnnouncementDto[]>(`/api/v1/announcements${query}`);
  },
  createAnnouncement: (body: any) =>
    request<AnnouncementDto>('/api/v1/announcements', { method: 'POST', body: JSON.stringify(body) }),
  deleteAnnouncement: (id: string) =>
    request<void>(`/api/v1/announcements/${id}`, { method: 'DELETE' }),
  notifications: (userId?: string) => {
    const query = userId ? `?userId=${encodeURIComponent(userId)}` : '';
    return request<NotificationDto[]>(`/api/v1/notifications${query}`);
  },
  markNotificationRead: (id: string) =>
    request<void>(`/api/v1/notifications/${id}/read`, { method: 'PATCH' }),

  // Users & System Settings
  users: () => request<UserDetailDto[]>('/api/v1/users'),
  createUser: (body: any) =>
    request<UserDetailDto>('/api/v1/users', { method: 'POST', body: JSON.stringify(body) }),
  updateUser: (id: string, body: any) =>
    request<UserDetailDto>(`/api/v1/users/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteUser: (id: string) =>
    request<void>(`/api/v1/users/${id}`, { method: 'DELETE' }),
  systemSettings: () => request<SystemSettingDto[]>('/api/v1/system/settings'),
  updateSystemSetting: (key: string, body: any) =>
    request<SystemSettingDto>(`/api/v1/system/settings/${encodeURIComponent(key)}`, { method: 'PUT', body: JSON.stringify(body) }),
  auditLogs: (limit = 50) => request<any[]>(`/api/v1/system/audit-logs?limit=${limit}`),

  // Authentication
  login: async (email: string, password: string) => {
    const user = await request<AuthUser>('/api/v1/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    csrfToken = '';
    return user;
  },
  register: async (email: string, password: string, displayName: string) => {
    const user = await request<AuthUser>('/api/v1/auth/register', { method: 'POST', body: JSON.stringify({ email, password, displayName }) });
    csrfToken = '';
    return user;
  },
  me: () => request<AuthUser>('/api/v1/auth/me'),
  logout: async () => {
    await request<void>('/api/v1/auth/logout', { method: 'POST' });
    csrfToken = '';
  },

  // Health
  healthLive: () => request<{ status: string; timestamp: string }>('/health/live'),
  healthReady: () => request<any>('/health/ready'),
};
