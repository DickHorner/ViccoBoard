export type CorrectionSheetLayoutMode = 'compact' | 'standard';

export interface CorrectionSheetPreset {
  id: string;
  examId: string;
  name: string;
  layoutMode: CorrectionSheetLayoutMode;
  showHeader: boolean;
  showOverallPoints: boolean;
  showGrade: boolean;
  showTaskPoints: boolean;
  showTaskComments: boolean;
  showGeneralComment: boolean;
  showExamParts: boolean;
  showSignatureArea: boolean;
  headerText?: string;
  footerText?: string;
  updatedAt: Date;
}

export interface CorrectionSheetTaskRow {
  taskId: string;
  label: string;
  maxPoints: number;
  awardedPoints: number;
  comment?: string;
  partLabel?: string;
}

export interface CorrectionSheetProjection {
  examId: string;
  examTitle: string;
  examDate?: Date;
  candidateId: string;
  candidateName: string;
  maxPoints: number;
  totalPoints: number;
  grade?: string | number;
  generalComment?: string;
  headerText?: string;
  footerText?: string;
  layoutMode: CorrectionSheetLayoutMode;
  showHeader: boolean;
  showOverallPoints: boolean;
  showGrade: boolean;
  showTaskPoints: boolean;
  showTaskComments: boolean;
  showGeneralComment: boolean;
  showExamParts: boolean;
  showSignatureArea: boolean;
  taskRows: CorrectionSheetTaskRow[];
}

export interface CorrectionSheetPdfDocument {
  bytes: Uint8Array;
  fileName: string;
  candidateCount: number;
}
