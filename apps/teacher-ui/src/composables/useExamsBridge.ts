/**
 * Exams Module Bridge
 * Provides UI access to exams module repositories and use-cases
 * 
 * ARCHITECTURE: This is the ONLY place where UI should access exams domain.
 * All exam-related data access must go through this bridge.
 */

import { shallowRef, computed, type ComputedRef, type ShallowRef } from 'vue';
import {
  ExamRepository,
  TaskNodeRepository,
  CriterionRepository,
  CorrectionEntryRepository,
  CorrectionSheetPresetRepository,
  SupportTipRepository,
  StudentLongTermNoteRepository,
  GradingKeyService,
  GradingKeyEngine,
  AlternativeGradingService,
  CommentManagementService,
  SupportTipManagementService,
  ExamAnalysisService,
  LongTermNoteManagementService,
  createExamPayload,
  RecordCorrectionUseCase,
  CalculateGradeUseCase,
  GetCorrectionSheetPresetUseCase,
  SaveCorrectionSheetPresetUseCase,
  BuildCorrectionSheetProjectionUseCase,
  ExportCorrectionSheetsPdfUseCase
} from '@viccoboard/exams';
import { getStorageAdapter } from '../services/storage.service';

/**
 * Singleton exams bridge instance
 */
let examsBridgeInstance: ExamsBridge | null = null;

interface ExamsBridge {
  // Repositories
  examRepository: ExamRepository;
  taskNodeRepository: TaskNodeRepository;
  criterionRepository: CriterionRepository;
  correctionEntryRepository: CorrectionEntryRepository;
  supportTipRepository: SupportTipRepository;
  studentLongTermNoteRepository: StudentLongTermNoteRepository;
  correctionSheetPresetRepository: CorrectionSheetPresetRepository;

  // Use Cases
  createExamPayload: typeof createExamPayload;
  recordCorrectionUseCase: RecordCorrectionUseCase;
  calculateGradeUseCase: CalculateGradeUseCase;
  getCorrectionSheetPresetUseCase: GetCorrectionSheetPresetUseCase;
  saveCorrectionSheetPresetUseCase: SaveCorrectionSheetPresetUseCase;
  buildCorrectionSheetProjectionUseCase: BuildCorrectionSheetProjectionUseCase;
  exportCorrectionSheetsPdfUseCase: ExportCorrectionSheetsPdfUseCase;

  // Services
  gradingKeyService: typeof GradingKeyService;
  gradingKeyEngine: typeof GradingKeyEngine;
  alternativeGradingService: typeof AlternativeGradingService;
  commentManagementService: typeof CommentManagementService;
  supportTipManagementService: typeof SupportTipManagementService;
  examAnalysisService: typeof ExamAnalysisService;
  longTermNoteManagementService: typeof LongTermNoteManagementService;
  listExams(): Promise<any[]>;
  getExam(examId: string): Promise<any | null>;
  findCorrectionsByExam(examId: string): Promise<any[]>;
  findCorrectionByExamAndCandidate(examId: string, candidateId: string): Promise<any | null>;
  getCorrectionSheetPreset(examId: string): Promise<any>;
  saveCorrectionSheetPreset(input: any): Promise<any>;
  buildCorrectionSheetPreview(examId: string, candidateId: string): Promise<any>;
  exportCurrentCorrectionSheetPdf(examId: string, candidateId: string): Promise<any>;
  exportAllCorrectionSheetsPdf(examId: string): Promise<any>;

  initialized: boolean;
}

interface UseExamsBridgeResult {
  examsBridge: ShallowRef<ExamsBridge | null>;
  isInitialized: ComputedRef<boolean>;
  readonly examRepository: ExamsBridge['examRepository'] | undefined;
  readonly taskNodeRepository: ExamsBridge['taskNodeRepository'] | undefined;
  readonly criterionRepository: ExamsBridge['criterionRepository'] | undefined;
  readonly correctionEntryRepository: ExamsBridge['correctionEntryRepository'] | undefined;
  readonly supportTipRepository: ExamsBridge['supportTipRepository'] | undefined;
  readonly studentLongTermNoteRepository: ExamsBridge['studentLongTermNoteRepository'] | undefined;
  readonly correctionSheetPresetRepository: ExamsBridge['correctionSheetPresetRepository'] | undefined;
  readonly createExamPayload: ExamsBridge['createExamPayload'] | undefined;
  readonly recordCorrectionUseCase: ExamsBridge['recordCorrectionUseCase'] | undefined;
  readonly calculateGradeUseCase: ExamsBridge['calculateGradeUseCase'] | undefined;
  readonly getCorrectionSheetPresetUseCase: ExamsBridge['getCorrectionSheetPresetUseCase'] | undefined;
  readonly saveCorrectionSheetPresetUseCase: ExamsBridge['saveCorrectionSheetPresetUseCase'] | undefined;
  readonly buildCorrectionSheetProjectionUseCase: ExamsBridge['buildCorrectionSheetProjectionUseCase'] | undefined;
  readonly exportCorrectionSheetsPdfUseCase: ExamsBridge['exportCorrectionSheetsPdfUseCase'] | undefined;
  readonly gradingKeyService: ExamsBridge['gradingKeyService'] | undefined;
  readonly gradingKeyEngine: ExamsBridge['gradingKeyEngine'] | undefined;
  readonly alternativeGradingService: ExamsBridge['alternativeGradingService'] | undefined;
  readonly commentManagementService: ExamsBridge['commentManagementService'] | undefined;
  readonly supportTipManagementService: ExamsBridge['supportTipManagementService'] | undefined;
  readonly examAnalysisService: ExamsBridge['examAnalysisService'] | undefined;
  readonly longTermNoteManagementService: ExamsBridge['longTermNoteManagementService'] | undefined;
  listExams(): Promise<any[]>;
  getExam(examId: string): Promise<any | null>;
  findCorrectionsByExam(examId: string): Promise<any[]>;
  findCorrectionByExamAndCandidate(examId: string, candidateId: string): Promise<any | null>;
  getCorrectionSheetPreset(examId: string): Promise<any> | undefined;
  saveCorrectionSheetPreset(input: any): Promise<any> | undefined;
  buildCorrectionSheetPreview(examId: string, candidateId: string): Promise<any> | undefined;
  exportCurrentCorrectionSheetPdf(examId: string, candidateId: string): Promise<any> | undefined;
  exportAllCorrectionSheetsPdf(examId: string): Promise<any> | undefined;
}

/**
 * Initialize exams bridge
 * Must be called after storage is initialized
 */
export function initializeExamsBridge(): ExamsBridge {
  if (examsBridgeInstance) {
    return examsBridgeInstance;
  }

  const adapter = getStorageAdapter();

  // Initialize repositories with storage adapter
  const examRepo = new ExamRepository(adapter);
  const taskNodeRepo = new TaskNodeRepository(adapter);
  const criterionRepo = new CriterionRepository(adapter);
  const correctionEntryRepo = new CorrectionEntryRepository(adapter);
  const supportTipRepo = new SupportTipRepository(adapter);
  const studentLongTermNoteRepo = new StudentLongTermNoteRepository(adapter);
  const correctionSheetPresetRepo = new CorrectionSheetPresetRepository(examRepo);

  // Initialize use cases with repositories
  const recordCorrectionUseCase = new RecordCorrectionUseCase(correctionEntryRepo, examRepo);
  const calculateGradeUseCase = new CalculateGradeUseCase();
  const getCorrectionSheetPresetUseCase = new GetCorrectionSheetPresetUseCase(correctionSheetPresetRepo);
  const saveCorrectionSheetPresetUseCase = new SaveCorrectionSheetPresetUseCase(correctionSheetPresetRepo);
  const buildCorrectionSheetProjectionUseCase = new BuildCorrectionSheetProjectionUseCase(
    examRepo,
    correctionEntryRepo,
    getCorrectionSheetPresetUseCase
  );
  const exportCorrectionSheetsPdfUseCase = new ExportCorrectionSheetsPdfUseCase(
    examRepo,
    buildCorrectionSheetProjectionUseCase
  );

  examsBridgeInstance = {
    // Repositories
    examRepository: examRepo,
    taskNodeRepository: taskNodeRepo,
    criterionRepository: criterionRepo,
    correctionEntryRepository: correctionEntryRepo,
    supportTipRepository: supportTipRepo,
    studentLongTermNoteRepository: studentLongTermNoteRepo,
    correctionSheetPresetRepository: correctionSheetPresetRepo,

    // Use Cases
    createExamPayload,
    recordCorrectionUseCase,
    calculateGradeUseCase,
    getCorrectionSheetPresetUseCase,
    saveCorrectionSheetPresetUseCase,
    buildCorrectionSheetProjectionUseCase,
    exportCorrectionSheetsPdfUseCase,

    // Services (static classes are referenced directly)
    gradingKeyService: GradingKeyService,
    gradingKeyEngine: GradingKeyEngine,
    alternativeGradingService: AlternativeGradingService,
    commentManagementService: CommentManagementService,
    supportTipManagementService: SupportTipManagementService,
    examAnalysisService: ExamAnalysisService,
    longTermNoteManagementService: LongTermNoteManagementService,
    listExams: () => examRepo.findAll(),
    getExam: (examId) => examRepo.findById(examId),
    findCorrectionsByExam: (examId) => correctionEntryRepo.findByExam(examId),
    findCorrectionByExamAndCandidate: (examId, candidateId) =>
      correctionEntryRepo.findByExamAndCandidate(examId, candidateId),
    getCorrectionSheetPreset: (examId) =>
      getCorrectionSheetPresetUseCase.execute(examId),
    saveCorrectionSheetPreset: (input) =>
      saveCorrectionSheetPresetUseCase.execute(input),
    buildCorrectionSheetPreview: (examId, candidateId) =>
      buildCorrectionSheetProjectionUseCase.execute(examId, candidateId),
    exportCurrentCorrectionSheetPdf: (examId, candidateId) =>
      exportCorrectionSheetsPdfUseCase.exportCurrentCandidatePdf(examId, candidateId),
    exportAllCorrectionSheetsPdf: (examId) =>
      exportCorrectionSheetsPdfUseCase.exportAllCandidatesPdf(examId),

    initialized: true
  };

  return examsBridgeInstance;
}

/**
 * Get exams bridge instance
 */
export function getExamsBridge(): ExamsBridge {
  if (!examsBridgeInstance) {
    throw new Error(
      'ExamsBridge not initialized. Call initializeExamsBridge() first.'
    );
  }
  return examsBridgeInstance;
}

/**
 * Vue composable for exams module access
 * Provides reactive access to exams bridge
 */
export function useExamsBridge(): UseExamsBridgeResult {
  const bridge = shallowRef<ExamsBridge | null>(examsBridgeInstance);

  const isInitialized = computed(() => bridge.value !== null);

  return {
    examsBridge: bridge,
    isInitialized,
    // Direct references for convenience (after initialization)
    get examRepository() { return bridge.value?.examRepository; },
    get taskNodeRepository() { return bridge.value?.taskNodeRepository; },
    get criterionRepository() { return bridge.value?.criterionRepository; },
    get correctionEntryRepository() { return bridge.value?.correctionEntryRepository; },
    get supportTipRepository() { return bridge.value?.supportTipRepository; },
    get studentLongTermNoteRepository() { return bridge.value?.studentLongTermNoteRepository; },
    get correctionSheetPresetRepository() { return bridge.value?.correctionSheetPresetRepository; },
    get createExamPayload() { return bridge.value?.createExamPayload; },
    get recordCorrectionUseCase() { return bridge.value?.recordCorrectionUseCase; },
    get calculateGradeUseCase() { return bridge.value?.calculateGradeUseCase; },
    get getCorrectionSheetPresetUseCase() { return bridge.value?.getCorrectionSheetPresetUseCase; },
    get saveCorrectionSheetPresetUseCase() { return bridge.value?.saveCorrectionSheetPresetUseCase; },
    get buildCorrectionSheetProjectionUseCase() { return bridge.value?.buildCorrectionSheetProjectionUseCase; },
    get exportCorrectionSheetsPdfUseCase() { return bridge.value?.exportCorrectionSheetsPdfUseCase; },
    get gradingKeyService() { return bridge.value?.gradingKeyService; },
    get gradingKeyEngine() { return bridge.value?.gradingKeyEngine; },
    get alternativeGradingService() { return bridge.value?.alternativeGradingService; },
    get commentManagementService() { return bridge.value?.commentManagementService; },
    get supportTipManagementService() { return bridge.value?.supportTipManagementService; },
    get examAnalysisService() { return bridge.value?.examAnalysisService; },
    get longTermNoteManagementService() { return bridge.value?.longTermNoteManagementService; },
    listExams: () => bridge.value?.listExams() ?? Promise.resolve([]),
    getExam: (examId: string) => bridge.value?.getExam(examId) ?? Promise.resolve(null),
    findCorrectionsByExam: (examId: string) =>
      bridge.value?.findCorrectionsByExam(examId) ?? Promise.resolve([]),
    findCorrectionByExamAndCandidate: (examId: string, candidateId: string) =>
      bridge.value?.findCorrectionByExamAndCandidate(examId, candidateId) ?? Promise.resolve(null),
    getCorrectionSheetPreset: (examId: string) =>
      bridge.value?.getCorrectionSheetPreset(examId),
    saveCorrectionSheetPreset: (input: any) =>
      bridge.value?.saveCorrectionSheetPreset(input),
    buildCorrectionSheetPreview: (examId: string, candidateId: string) =>
      bridge.value?.buildCorrectionSheetPreview(examId, candidateId),
    exportCurrentCorrectionSheetPdf: (examId: string, candidateId: string) =>
      bridge.value?.exportCurrentCorrectionSheetPdf(examId, candidateId),
    exportAllCorrectionSheetsPdf: (examId: string) =>
      bridge.value?.exportAllCorrectionSheetsPdf(examId)
  };
}
