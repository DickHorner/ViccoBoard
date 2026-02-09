/**
 * Exams Module Bridge
 * Provides UI access to exams module repositories and use-cases
 *
 * ARCHITECTURE: This is the ONLY place where UI should access exams domain.
 * All exam-related data access must go through this bridge.
 */
import { ref, computed } from 'vue';
import { ExamRepository, TaskNodeRepository, CriterionRepository, CorrectionEntryRepository, SupportTipRepository, StudentLongTermNoteRepository, GradingKeyService, GradingKeyEngine, AlternativeGradingService, CommentManagementService, SupportTipManagementService, ExamAnalysisService, LongTermNoteManagementService, createExamPayload, RecordCorrectionUseCase, CalculateGradeUseCase } from '@viccoboard/exams';
import { getStorageAdapter } from '../services/storage.service';
/**
 * Singleton exams bridge instance
 */
let examsBridgeInstance = null;
/**
 * Initialize exams bridge
 * Must be called after storage is initialized
 */
export function initializeExamsBridge() {
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
    // Initialize use cases with repositories
    const recordCorrectionUseCase = new RecordCorrectionUseCase(correctionEntryRepo, examRepo);
    const calculateGradeUseCase = new CalculateGradeUseCase();
    examsBridgeInstance = {
        // Repositories
        examRepository: examRepo,
        taskNodeRepository: taskNodeRepo,
        criterionRepository: criterionRepo,
        correctionEntryRepository: correctionEntryRepo,
        supportTipRepository: supportTipRepo,
        studentLongTermNoteRepository: studentLongTermNoteRepo,
        // Use Cases
        createExamPayload,
        recordCorrectionUseCase,
        calculateGradeUseCase,
        // Services (static classes are referenced directly)
        gradingKeyService: GradingKeyService,
        gradingKeyEngine: GradingKeyEngine,
        alternativeGradingService: AlternativeGradingService,
        commentManagementService: CommentManagementService,
        supportTipManagementService: SupportTipManagementService,
        examAnalysisService: ExamAnalysisService,
        longTermNoteManagementService: LongTermNoteManagementService,
        initialized: true
    };
    return examsBridgeInstance;
}
/**
 * Get exams bridge instance
 */
export function getExamsBridge() {
    if (!examsBridgeInstance) {
        throw new Error('ExamsBridge not initialized. Call initializeExamsBridge() first.');
    }
    return examsBridgeInstance;
}
/**
 * Vue composable for exams module access
 * Provides reactive access to exams bridge
 */
export function useExamsBridge() {
    const bridge = ref(examsBridgeInstance);
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
        get createExamPayload() { return bridge.value?.createExamPayload; },
        get recordCorrectionUseCase() { return bridge.value?.recordCorrectionUseCase; },
        get calculateGradeUseCase() { return bridge.value?.calculateGradeUseCase; },
        get gradingKeyService() { return bridge.value?.gradingKeyService; },
        get gradingKeyEngine() { return bridge.value?.gradingKeyEngine; },
        get alternativeGradingService() { return bridge.value?.alternativeGradingService; },
        get commentManagementService() { return bridge.value?.commentManagementService; },
        get supportTipManagementService() { return bridge.value?.supportTipManagementService; },
        get examAnalysisService() { return bridge.value?.examAnalysisService; },
        get longTermNoteManagementService() { return bridge.value?.longTermNoteManagementService; }
    };
}
