/**
 * Sport Module Bridge
 * Provides UI access to sport module repositories and use-cases.
 *
 * ARCHITECTURE: This is the only place where UI should access sport domain data.
 */

import { computed, ref } from 'vue';
import {
  AttendanceRepository,
  BJSGradingService,
  ClassGroupRepository,
  CooperTestConfigRepository,
  CooperTestService,
  CreateClassUseCase,
  CreateGradeCategoryUseCase,
  CreateLessonUseCase,
  CreateTournamentUseCase,
  CriteriaGradingEngine,
  DeleteGradeCategoryUseCase,
  DeleteTableDefinitionUseCase,
  FeedbackSessionRepository,
  GameEntryRepository,
  GradeCategoryRepository,
  ImportShuttleRunConfigUseCase,
  ImportTableDefinitionUseCase,
  LessonRepository,
  PerformanceEntryRepository,
  RecordAttendanceUseCase,
  RecordCooperTestResultUseCase,
  RecordDiceRollUseCase,
  RecordFeedbackSessionUseCase,
  RecordGradeUseCase,
  RecordShuttleRunResultUseCase,
  RecordSportabzeichenResultUseCase,
  RecordTimerResultUseCase,
  SaveCooperSessionUseCase,
  SaveScoreboardSessionUseCase,
  SaveMultistopSessionUseCase,
  SaveSlowMotionSessionUseCase,
  SaveTableDefinitionUseCase,
  SaveTacticsSnapshotUseCase,
  SaveTeamAssignmentUseCase,
  ShuttleRunConfigRepository,
  ShuttleRunService,
  SportStatisticsService,
  SportabzeichenResultRepository,
  SportabzeichenService,
  SportabzeichenStandardRepository,
  TableDefinitionRepository,
  TacticsSnapshotRepository,
  TeamBuilderService,
  TimeGradingService,
  ToolSessionRepository,
  TournamentRepository,
  TournamentService,
  UpdateGradeCategoryUseCase,
  UpdateTournamentMatchUseCase,
  type CreateClassInput,
  type CreateGradeCategoryInput,
  type CreateLessonInput,
  type DeleteGradeCategoryInput,
  type DeleteGradeCategoryResult,
  type RecordAttendanceInput,
  type RecordDiceRollInput,
  type RecordGradeInput,
  type SaveTableDefinitionInput,
  type UpdateGradeCategoryInput
} from '@viccoboard/sport';
import { getStorageAdapter } from '../services/storage.service';

let sportBridgeInstance: SportBridge | null = null;

interface SportBridge {
  classGroupRepository: ClassGroupRepository;
  lessonRepository: LessonRepository;
  gradeCategoryRepository: GradeCategoryRepository;
  performanceEntryRepository: PerformanceEntryRepository;
  attendanceRepository: AttendanceRepository;
  toolSessionRepository: ToolSessionRepository;
  feedbackSessionRepository: FeedbackSessionRepository;
  tableDefinitionRepository: TableDefinitionRepository;
  cooperTestConfigRepository: CooperTestConfigRepository;
  shuttleRunConfigRepository: ShuttleRunConfigRepository;
  sportabzeichenStandardRepository: SportabzeichenStandardRepository;
  SportabzeichenStandardRepository: SportabzeichenStandardRepository;
  sportabzeichenResultRepository: SportabzeichenResultRepository;
  SportabzeichenResultRepository: SportabzeichenResultRepository;
  tacticsSnapshotRepository: TacticsSnapshotRepository;
  tournamentRepository: TournamentRepository;
  gameEntryRepository: GameEntryRepository;

  createClassUseCase: CreateClassUseCase;
  createLessonUseCase: CreateLessonUseCase;
  recordAttendanceUseCase: RecordAttendanceUseCase;
  createGradeCategoryUseCase: CreateGradeCategoryUseCase;
  updateGradeCategoryUseCase: UpdateGradeCategoryUseCase;
  deleteGradeCategoryUseCase: DeleteGradeCategoryUseCase;
  saveTableDefinitionUseCase: SaveTableDefinitionUseCase;
  deleteTableDefinitionUseCase: DeleteTableDefinitionUseCase;
  recordGradeUseCase: RecordGradeUseCase;
  recordCooperTestResultUseCase: RecordCooperTestResultUseCase;
  recordShuttleRunResultUseCase: RecordShuttleRunResultUseCase;
  importShuttleRunConfigUseCase: ImportShuttleRunConfigUseCase;
  recordSportabzeichenResultUseCase: RecordSportabzeichenResultUseCase;
  recordTimerResultUseCase: RecordTimerResultUseCase;
  recordDiceRollUseCase: RecordDiceRollUseCase;
  recordFeedbackSessionUseCase: RecordFeedbackSessionUseCase;
  saveTacticsSnapshotUseCase: SaveTacticsSnapshotUseCase;
  saveTeamAssignmentUseCase: SaveTeamAssignmentUseCase;
  saveScoreboardSessionUseCase: SaveScoreboardSessionUseCase;
  saveCooperSessionUseCase: SaveCooperSessionUseCase;
  saveMultistopSessionUseCase: SaveMultistopSessionUseCase;
  saveSlowMotionSessionUseCase: SaveSlowMotionSessionUseCase;
  importTableDefinitionUseCase: ImportTableDefinitionUseCase;
  createTournamentUseCase: CreateTournamentUseCase;
  updateTournamentMatchUseCase: UpdateTournamentMatchUseCase;

  criteriaGradingEngine: CriteriaGradingEngine;
  timeGradingService: TimeGradingService;
  cooperTestService: CooperTestService;
  shuttleRunService: ShuttleRunService;
  sportabzeichenService: SportabzeichenService;
  SportabzeichenService: SportabzeichenService;
  bjsGradingService: BJSGradingService;
  sportStatisticsService: SportStatisticsService;
  teamBuilderService: TeamBuilderService;
  tournamentService: TournamentService;
}

export function initializeSportBridge(): SportBridge {
  if (sportBridgeInstance) {
    return sportBridgeInstance;
  }

  const adapter = getStorageAdapter();

  const classGroupRepository = new ClassGroupRepository(adapter);
  const lessonRepository = new LessonRepository(adapter);
  const gradeCategoryRepository = new GradeCategoryRepository(adapter);
  const performanceEntryRepository = new PerformanceEntryRepository(adapter);
  const attendanceRepository = new AttendanceRepository(adapter);
  const tableDefinitionRepository = new TableDefinitionRepository(adapter);
  const cooperTestConfigRepository = new CooperTestConfigRepository(adapter);
  const shuttleRunConfigRepository = new ShuttleRunConfigRepository(adapter);
  const sportabzeichenStandardRepository = new SportabzeichenStandardRepository(adapter);
  const sportabzeichenResultRepository = new SportabzeichenResultRepository(adapter);
  const toolSessionRepository = new ToolSessionRepository(adapter);
  const feedbackSessionRepository = new FeedbackSessionRepository(toolSessionRepository);
  const tacticsSnapshotRepository = new TacticsSnapshotRepository(adapter);
  const tournamentRepository = new TournamentRepository(adapter);
  const gameEntryRepository = new GameEntryRepository(adapter);

  const createClassUseCase = new CreateClassUseCase(classGroupRepository);
  const createLessonUseCase = new CreateLessonUseCase(lessonRepository);
  const recordAttendanceUseCase = new RecordAttendanceUseCase(attendanceRepository);
  const createGradeCategoryUseCase = new CreateGradeCategoryUseCase(gradeCategoryRepository);
  const updateGradeCategoryUseCase = new UpdateGradeCategoryUseCase(gradeCategoryRepository);
  const deleteGradeCategoryUseCase = new DeleteGradeCategoryUseCase(
    gradeCategoryRepository,
    performanceEntryRepository
  );
  const saveTableDefinitionUseCase = new SaveTableDefinitionUseCase(tableDefinitionRepository);
  const deleteTableDefinitionUseCase = new DeleteTableDefinitionUseCase(tableDefinitionRepository);
  const recordGradeUseCase = new RecordGradeUseCase(performanceEntryRepository);
  const recordCooperTestResultUseCase = new RecordCooperTestResultUseCase(
    performanceEntryRepository,
    cooperTestConfigRepository,
    tableDefinitionRepository
  );
  const recordShuttleRunResultUseCase = new RecordShuttleRunResultUseCase(
    performanceEntryRepository,
    shuttleRunConfigRepository
  );
  const importShuttleRunConfigUseCase = new ImportShuttleRunConfigUseCase(
    shuttleRunConfigRepository
  );
  const recordSportabzeichenResultUseCase = new RecordSportabzeichenResultUseCase(
    sportabzeichenResultRepository,
    sportabzeichenStandardRepository
  );
  const recordTimerResultUseCase = new RecordTimerResultUseCase(toolSessionRepository);
  const recordDiceRollUseCase = new RecordDiceRollUseCase(toolSessionRepository);
  const recordFeedbackSessionUseCase = new RecordFeedbackSessionUseCase(
    feedbackSessionRepository
  );
  const saveTacticsSnapshotUseCase = new SaveTacticsSnapshotUseCase(tacticsSnapshotRepository);
  const saveTeamAssignmentUseCase = new SaveTeamAssignmentUseCase(toolSessionRepository);
  const saveScoreboardSessionUseCase = new SaveScoreboardSessionUseCase(toolSessionRepository);
  const saveCooperSessionUseCase = new SaveCooperSessionUseCase(
    toolSessionRepository,
    performanceEntryRepository,
    cooperTestConfigRepository
  );
  const saveMultistopSessionUseCase = new SaveMultistopSessionUseCase(toolSessionRepository);
  const saveSlowMotionSessionUseCase = new SaveSlowMotionSessionUseCase(toolSessionRepository);
  const importTableDefinitionUseCase = new ImportTableDefinitionUseCase(
    tableDefinitionRepository
  );
  const tournamentService = new TournamentService();
  const createTournamentUseCase = new CreateTournamentUseCase(
    tournamentRepository,
    tournamentService
  );
  const updateTournamentMatchUseCase = new UpdateTournamentMatchUseCase(
    tournamentRepository,
    tournamentService
  );

  const criteriaGradingEngine = new CriteriaGradingEngine();
  const timeGradingService = new TimeGradingService();
  const cooperTestService = new CooperTestService();
  const shuttleRunService = new ShuttleRunService();
  const sportabzeichenService = new SportabzeichenService();
  const bjsGradingService = new BJSGradingService();
  const sportStatisticsService = new SportStatisticsService();
  const teamBuilderService = new TeamBuilderService();

  sportBridgeInstance = {
    classGroupRepository,
    lessonRepository,
    gradeCategoryRepository,
    performanceEntryRepository,
    attendanceRepository,
    toolSessionRepository,
    feedbackSessionRepository,
    tableDefinitionRepository,
    cooperTestConfigRepository,
    shuttleRunConfigRepository,
    sportabzeichenStandardRepository,
    SportabzeichenStandardRepository: sportabzeichenStandardRepository,
    sportabzeichenResultRepository,
    SportabzeichenResultRepository: sportabzeichenResultRepository,
    tacticsSnapshotRepository,
    tournamentRepository,
    gameEntryRepository,

    createClassUseCase,
    createLessonUseCase,
    recordAttendanceUseCase,
    createGradeCategoryUseCase,
    updateGradeCategoryUseCase,
    deleteGradeCategoryUseCase,
    saveTableDefinitionUseCase,
    deleteTableDefinitionUseCase,
    recordGradeUseCase,
    recordCooperTestResultUseCase,
    recordShuttleRunResultUseCase,
    importShuttleRunConfigUseCase,
    recordSportabzeichenResultUseCase,
    recordTimerResultUseCase,
    recordDiceRollUseCase,
    recordFeedbackSessionUseCase,
    saveTacticsSnapshotUseCase,
    saveTeamAssignmentUseCase,
    saveScoreboardSessionUseCase,
    saveCooperSessionUseCase,
    saveMultistopSessionUseCase,
    saveSlowMotionSessionUseCase,
    importTableDefinitionUseCase,
    createTournamentUseCase,
    updateTournamentMatchUseCase,

    criteriaGradingEngine,
    timeGradingService,
    cooperTestService,
    shuttleRunService,
    sportabzeichenService,
    SportabzeichenService: sportabzeichenService,
    bjsGradingService,
    sportStatisticsService,
    teamBuilderService,
    tournamentService
  };

  return sportBridgeInstance;
}

export function getSportBridge(): SportBridge {
  if (!sportBridgeInstance) {
    throw new Error('SportBridge not initialized. Call initializeSportBridge() first.');
  }

  return sportBridgeInstance;
}

export function useClassGroups() {
  return getSportBridge().classGroupRepository;
}

export function useLessons() {
  return getSportBridge().lessonRepository;
}

export function useAttendance() {
  return getSportBridge().attendanceRepository;
}

export function useSportBridge() {
  const bridge = ref<SportBridge | null>(sportBridgeInstance);
  const isInitialized = computed(() => bridge.value !== null);

  return {
    sportBridge: bridge,
    SportBridge: bridge,
    isInitialized,
    classGroups: computed(() => bridge.value?.classGroupRepository),
    lessons: computed(() => bridge.value?.lessonRepository),
    gradeCategories: computed(() => bridge.value?.gradeCategoryRepository),
    performanceEntries: computed(() => bridge.value?.performanceEntryRepository),
    attendance: computed(() => bridge.value?.attendanceRepository),
    toolSessions: computed(() => bridge.value?.toolSessionRepository),
    tableDefinitions: computed(() => bridge.value?.tableDefinitionRepository),
    useCreateClass: computed(() => bridge.value?.createClassUseCase),
    useCreateLesson: computed(() => bridge.value?.createLessonUseCase),
    useRecordAttendance: computed(() => bridge.value?.recordAttendanceUseCase),
    useCriteriaGrading: computed(() => bridge.value?.criteriaGradingEngine),
    useTimeGrading: computed(() => bridge.value?.timeGradingService),
    useCooperTest: computed(() => bridge.value?.cooperTestService),
    useShuttleRun: computed(() => bridge.value?.shuttleRunService)
  };
}

export function useStudents(): never {
  throw new Error(
    'useStudents from useSportBridge is deprecated. Import useStudents from useStudentsBridge instead.'
  );
}

export {
  AttendanceRepository,
  ClassGroupRepository,
  CreateClassUseCase,
  CreateGradeCategoryUseCase,
  CreateLessonUseCase,
  CriteriaGradingEngine,
  DeleteGradeCategoryUseCase,
  DeleteTableDefinitionUseCase,
  GradeCategoryRepository,
  LessonRepository,
  PerformanceEntryRepository,
  RecordAttendanceUseCase,
  RecordGradeUseCase,
  SaveTableDefinitionUseCase,
  SportStatisticsService,
  TimeGradingService,
  UpdateGradeCategoryUseCase
};
export type {
  CreateClassInput,
  CreateGradeCategoryInput,
  CreateLessonInput,
  DeleteGradeCategoryInput,
  DeleteGradeCategoryResult,
  RecordAttendanceInput,
  RecordDiceRollInput,
  RecordGradeInput,
  SaveTableDefinitionInput,
  UpdateGradeCategoryInput
};
