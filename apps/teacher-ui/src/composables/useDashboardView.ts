import { computed, nextTick, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import type { AttendanceRecord, ClassGroup, Lesson, Subject } from '@viccoboard/core';

import { DEFAULT_GRADING_SCHEME, GRADING_SCHEMES } from '../constants/grading';
import { useAttendance, useClassGroups, useLessons, useSubjects } from './useSportBridge';
import { getDashboardLessonState } from '../utils/dashboard-workspace';
import { recordRouteContentReady } from '../utils/navigation-performance';
import {
  formatGermanDate,
  formatGermanDateTime,
  formatGermanTime
} from '../utils/locale-format';

export function useDashboardView() {
  const { t } = useI18n();

  const classes = ref<ClassGroup[]>([]);
  const recentActivity = ref<AttendanceRecord[]>([]);
  const subjects = ref<Subject[]>([]);
  const lessons = ref<Lesson[]>([]);
  const loading = ref(true);
  const loadError = ref('');
  const loadingWorkspace = ref(true);
  const workspaceError = ref('');
  const showCreateModal = ref(false);
  const creating = ref(false);
  const error = ref('');

  const newClass = ref<{ name: string; schoolYear: string; gradeLevel?: number; gradingScheme: string; color: string }>({
    name: '',
    schoolYear: '',
    gradeLevel: undefined,
    gradingScheme: DEFAULT_GRADING_SCHEME,
    color: ''
  });

  const classGroups = useClassGroups();
  const attendance = useAttendance();
  const subjectsRepository = useSubjects();
  const lessonsRepository = useLessons();
  const gradingSchemes = GRADING_SCHEMES;
  const classColorOptions = [
    { value: 'white', label: 'Weiß' },
    { value: 'green', label: 'Grün' },
    { value: 'red', label: 'Rot' },
    { value: 'blue', label: 'Blau' },
    { value: 'orange', label: 'Orange' },
    { value: 'yellow', label: 'Gelb' },
    { value: 'grey', label: 'Grau' }
  ];
  const classesById = computed(() => new Map(classes.value.map((cls) => [cls.id, cls])));
  const subjectsById = computed(() => new Map(subjects.value.map((subject) => [subject.id, subject])));
  const dashboardLessonState = computed(() => getDashboardLessonState(lessons.value));
  const todayLessons = computed(() => dashboardLessonState.value.todayLessons);
  const currentOrNextLesson = computed(() => dashboardLessonState.value.currentOrNextLesson);
  const upcomingLesson = computed(() => dashboardLessonState.value.upcomingLesson);
  const currentOrNextMode = computed(() => {
    if (!currentOrNextLesson.value) {
      return 'Heute';
    }

    return currentOrNextLesson.value.date.getTime() >= Date.now() ? 'Als Nächstes' : 'Zuletzt heute';
  });

  const loadData = async () => {
    loading.value = true;
    loadingWorkspace.value = true;
    loadError.value = '';
    workspaceError.value = '';

    let loadedClasses: ClassGroup[] = [];
    try {
      loadedClasses = await classGroups.findAll();
      classes.value = loadedClasses;
    } catch (err) {
      console.error('Failed to load class overview:', err);
      loadError.value = 'Fehler beim Laden der Klassen. Bitte aktualisieren Sie die Seite.';
    } finally {
      loading.value = false;
    }

    if (loadError.value) {
      loadingWorkspace.value = false;
      workspaceError.value = 'Unterrichtsdaten konnten nicht geladen werden.';
      return;
    }

    await nextTick();
    recordRouteContentReady('dashboard');

    try {
      const [attendanceRecords, loadedSubjects, lessonCollections] = await Promise.all([
        attendance.findAll({
          orderBy: 'timestamp',
          orderDirection: 'desc',
          limit: 5
        }),
        subjectsRepository.findAll(),
        Promise.all(loadedClasses.map((cls) => lessonsRepository.findByClassGroup(cls.id)))
      ]);

      recentActivity.value = attendanceRecords;
      subjects.value = loadedSubjects;
      const allLessons = lessonCollections.flat();
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      lessons.value = allLessons.filter((lesson) => {
        const lessonDate = new Date(lesson.date);
        return lessonDate >= startOfToday && lessonDate < startOfTomorrow;
      });
    } catch (err) {
      console.error('Failed to load dashboard workspace:', err);
      workspaceError.value = 'Unterrichtsdaten konnten nicht geladen werden.';
    } finally {
      loadingWorkspace.value = false;
    }
  };

  const getClassName = (classGroupId: string): string =>
    classesById.value.get(classGroupId)?.name ?? 'Unbekannte Klasse';

  const getSubjectName = (subjectId: string): string =>
    subjectsById.value.get(subjectId)?.name ?? 'Unzugeordnet';

  const formatLessonTime = (date: Date): string =>
    formatGermanTime(date);

  const formatLessonDateTime = (date: Date): string =>
    formatGermanDateTime(date, {
      weekday: 'short'
    });

  const handleCreateClass = async () => {
    error.value = '';
    creating.value = true;

    try {
      await classGroups.create({
        name: newClass.value.name.trim(),
        schoolYear: newClass.value.schoolYear.trim(),
        gradeLevel: newClass.value.gradeLevel,
        gradingScheme: newClass.value.gradingScheme,
        color: newClass.value.color || undefined
      });

      await loadData();
      newClass.value = { name: '', schoolYear: '', gradeLevel: undefined, gradingScheme: DEFAULT_GRADING_SCHEME, color: '' };
      showCreateModal.value = false;
    } catch (err) {
      console.error('Failed to create class:', err);
      if (err instanceof Error) {
        if (err.message.includes('already exists')) {
          error.value = 'Eine Klasse mit diesem Namen existiert bereits für dieses Schuljahr.';
        } else if (err.message.includes('name is required')) {
          error.value = 'Bitte geben Sie einen Klassennamen ein.';
        } else if (err.message.includes('School year')) {
          error.value = 'Bitte geben Sie ein gültiges Schuljahr im Format YYYY/YYYY ein (z.B. 2025/2026).';
        } else {
          error.value = err.message;
        }
      } else {
        error.value = 'Fehler beim Erstellen der Klasse. Bitte versuchen Sie es erneut.';
      }
    } finally {
      creating.value = false;
    }
  };

  const closeModal = () => {
    showCreateModal.value = false;
    error.value = '';
    newClass.value = { name: '', schoolYear: '', gradeLevel: undefined, gradingScheme: DEFAULT_GRADING_SCHEME, color: '' };
  };

  const formatDate = (date: Date): string => {
    const now = new Date();
    const recordDate = new Date(date);
    const diffMs = now.getTime() - recordDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Eben eben';
    if (diffMins < 60) return `vor ${diffMins} Minute${diffMins > 1 ? 'n' : ''}`;
    if (diffHours < 24) return `vor ${diffHours} Stunde${diffHours > 1 ? 'n' : ''}`;
    if (diffDays < 7) return `vor ${diffDays} Tag${diffDays > 1 ? 'en' : ''}`;

    return formatGermanDate(recordDate);
  };

  onMounted(() => {
    void loadData();
  });

  return {
    t,
    recentActivity,
    loadingWorkspace,
    workspaceError,
    showCreateModal,
    creating,
    error,
    newClass,
    gradingSchemes,
    classColorOptions,
    todayLessons,
    currentOrNextLesson,
    upcomingLesson,
    currentOrNextMode,
    getClassName,
    getSubjectName,
    formatLessonTime,
    formatLessonDateTime,
    handleCreateClass,
    closeModal,
    formatDate
  };
}
