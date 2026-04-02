/**
 * Exam long-term tracking and feedback export types.
 */

export interface StudentLongTermRecord {
  studentId: string;
  schoolYear: string;
  competencyAreas: CompetencyArea[];
  notes: LongTermNote[];
  exams: StudentExamSummary[];
}

export interface CompetencyArea {
  id: string;
  name: string;
  description?: string;
  development: 'improving' | 'stable' | 'needs-attention';
  lastAssessed: Date;
}

export interface LongTermNote {
  id: string;
  date: Date;
  category: 'development' | 'strength' | 'support-need' | 'general';
  text: string;
  linkedExamId?: string;
}

export interface StudentExamSummary {
  examId: string;
  examTitle: string;
  date: Date;
  grade: string | number;
  points: number;
  maxPoints: number;
  percentageScore: number;
  taskComments: string[];
  supportTips: string[];
}

export interface FeedbackSheet {
  examId: string;
  candidateId: string;
  layout: FeedbackLayout;
  header: FeedbackHeader;
  content: FeedbackContent;
  footer: FeedbackFooter;
  generatedAt: Date;
}

export interface FeedbackLayout {
  id: string;
  name: string;
  type: 'compact' | 'detailed' | 'extended' | 'custom';
  pageSize: 'A4' | 'Letter';
  orientation: 'portrait' | 'landscape';
}

export interface FeedbackHeader {
  schoolName?: string;
  schoolLogo?: string;
  examTitle: string;
  examDate?: Date;
  studentName: string;
  customFields?: Record<string, string>;
}

export interface FeedbackContent {
  showTaskBreakdown: boolean;
  showCriteria: boolean;
  showPercentages: boolean;
  showPointDeductions: boolean;
  showComments: boolean;
  showSupportTips: boolean;
  formatCriteriaText: boolean;
  italicizeComments: boolean;
}

export interface FeedbackFooter {
  signature?: string;
  signatureType: 'image' | 'drawn' | 'empty';
  teacherName?: string;
  date?: Date;
  customText?: string;
}

export interface PrintPreset {
  id: string;
  name: string;
  layout: FeedbackLayout;
  header: Partial<FeedbackHeader>;
  content: FeedbackContent;
  footer: Partial<FeedbackFooter>;
  isDefault: boolean;
  metadata?: Record<string, unknown>;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  placeholders: EmailPlaceholder[];
  attachPDF: boolean;
  createdAt: Date;
  lastModified: Date;
}

export interface EmailPlaceholder {
  key: string;
  description: string;
  example: string;
  type: 'text' | 'number' | 'grade' | 'date';
}

export interface EmailSendRecord {
  id: string;
  examId: string;
  candidateId: string;
  recipientType: 'student' | 'parent' | 'both';
  recipients: string[];
  templateId: string;
  sentAt: Date;
  status: 'sent' | 'failed' | 'bounced';
  error?: string;
}
