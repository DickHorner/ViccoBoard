import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import type { AttendanceRecord, ClassGroup, Lesson } from '@viccoboard/core';

import { DEFAULT_GRADING_SCHEME, GRADING_SCHEMES } from '../constants/grading';
import { useAttendance, useClassGroups, useLessons } from './useSportBridge';
import { getDashboardLessonState } from '../utils/dashboard-workspace';
import {
  formatGermanDate,
  formatGermanDateTime,
  formatGermanTime
} from '../utils/locale-format';

export function useDashboardView() {
  const { t } = useI18n();

  const classes = ref<ClassGroup[]>([]);
  const recentActivity = ref<AttendanceRecord[]>([]);
  const lessons = ref<Lesson[]>([]);
  const loading = ref(true);
  const loadError = ref('');
  const searchQuery = ref('');
  const filterSchoolYear = ref('');
  const showArchived = ref(false);
  const showCreateModal = ref(false);
  const creating = ref(false);
  const error = ref('');

  const newClass = ref<{ name: string; schoolYear: string; gradingScheme: string; color: string }>({
    name: '',
    schoolYear: '',
    gradingScheme: DEFAULT_GRADING_SCHEME,
    color: ''
  });

  const showEditModal = ref(false);
  const editClassData = ref<{ id: string; name: string; schoolYear: string; gradingScheme: string; color: string }>({
    id: '',
    name: '',
    schoolYear: '',
    gradingScheme: DEFAULT_GRADING_SCHEME,
    color: ''
  });
  const editError = ref('');
  const updating = ref(false);

  const showDeleteModal = ref(false);
  const classToDelete = ref<ClassGroup | null>(null);
  const deleteError = ref('');
  const deleting = ref(false);

  const classGroups = useClassGroups();
  const attendance = useAttendance();
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
  const instructionLinks = [
    { to: '/subjects/sport', title: 'Sport', description: 'Bewertung, Tests und Live-Tools' },
    { to: '/subjects/kbr', title: 'KBR', description: 'Prüfungen, Korrektur und Auswertung' }
  ];
  const organizationLinks = [
    { to: '/schedule', title: 'Stundenplan', description: 'Tagesübersicht und später Wochenraster' },
    { to: '/classes', title: 'Klassen', description: 'Klassenverwaltung fachneutral steuern' },
    { to: '/students', title: 'Schüler', description: 'Zentrale Schülerverwaltung' },
    { to: '/settings', title: 'Einstellungen', description: 'Sicherheit, Backups und Konfiguration' }
  ];

  const classesById = computed(() => new Map(classes.value.map((cls) => [cls.id, cls])));
  const schoolYears = computed(() => {
    const years = new Set(classes.value.map((cls: ClassGroup) => cls.schoolYear));
    return Array.from(years).sort().reverse();
  });

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

  const filteredClasses = computed(() => {
    const query = searchQuery.value.trim().toLowerCase();
    return classes.value.filter((cls: ClassGroup) => {
      const matchesQuery = !query
        || cls.name.toLowerCase().includes(query)
        || cls.schoolYear.toLowerCase().includes(query);
      const matchesYear = !filterSchoolYear.value || cls.schoolYear === filterSchoolYear.value;
      const matchesArchive = showArchived.value ? true : !cls.archived;
      return matchesQuery && matchesYear && matchesArchive;
    });
  });

  const loadData = async () => {
    loading.value = true;
    loadError.value = '';
    try {
      const loadedClasses = await classGroups.findAll();
      classes.value = loadedClasses;

      const [attendanceRecords, lessonCollections] = await Promise.all([
        attendance.findAll({
          orderBy: 'timestamp',
          orderDirection: 'desc',
          limit: 5
        }),
        Promise.all(loadedClasses.map((cls) => lessonsRepository.findByClassGroup(cls.id)))
      ]);

      recentActivity.value = attendanceRecords;
      const allLessons = lessonCollections.flat();
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      lessons.value = allLessons.filter((lesson) => {
        const lessonDate = new Date(lesson.date);
        return lessonDate >= startOfToday && lessonDate < startOfTomorrow;
      });
    } catch (err) {
      console.error('Failed to load data:', err);
      loadError.value = 'Fehler beim Laden der Übersichtsdaten. Bitte aktualisieren Sie die Seite.';
    } finally {
      loading.value = false;
    }
  };

  const getClassName = (classGroupId: string): string =>
    classesById.value.get(classGroupId)?.name ?? 'Unbekannte Klasse';

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
        gradingScheme: newClass.value.gradingScheme,
        color: newClass.value.color || undefined
      });

      await loadData();
      newClass.value = { name: '', schoolYear: '', gradingScheme: DEFAULT_GRADING_SCHEME, color: '' };
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
    newClass.value = { name: '', schoolYear: '', gradingScheme: DEFAULT_GRADING_SCHEME, color: '' };
  };

  const editClass = (cls: ClassGroup) => {
    editClassData.value = {
      id: cls.id,
      name: cls.name,
      schoolYear: cls.schoolYear,
      gradingScheme: cls.gradingScheme || DEFAULT_GRADING_SCHEME,
      color: cls.color || ''
    };
    showEditModal.value = true;
  };

  const handleUpdateClass = async () => {
    editError.value = '';
    updating.value = true;

    try {
      await classGroups.update(editClassData.value.id, {
        name: editClassData.value.name.trim(),
        schoolYear: editClassData.value.schoolYear.trim(),
        gradingScheme: editClassData.value.gradingScheme,
        color: editClassData.value.color || undefined
      });

      await loadData();
      showEditModal.value = false;
    } catch (err) {
      console.error('Failed to update class:', err);
      editError.value = err instanceof Error ? err.message : 'Fehler beim Aktualisieren der Klasse.';
    } finally {
      updating.value = false;
    }
  };

  const closeEditModal = () => {
    showEditModal.value = false;
    editError.value = '';
    editClassData.value = { id: '', name: '', schoolYear: '', gradingScheme: DEFAULT_GRADING_SCHEME, color: '' };
  };

  const getClassColorStyle = (color?: string) => {
    if (!color) {
      return { backgroundColor: '#e0e0e0' };
    }
    const colorMap: Record<string, string> = {
      white: '#f8f9fa',
      green: '#7ed957',
      red: '#ff6b6b',
      blue: '#4dabf7',
      orange: '#ffa94d',
      yellow: '#ffd43b',
      grey: '#adb5bd'
    };
    return { backgroundColor: colorMap[color] || '#e0e0e0' };
  };

  const confirmDeleteClass = (cls: ClassGroup) => {
    classToDelete.value = cls;
    showDeleteModal.value = true;
  };

  const handleDeleteClass = async () => {
    if (!classToDelete.value) return;

    deleteError.value = '';
    deleting.value = true;

    try {
      await classGroups.delete(classToDelete.value.id);
      await loadData();
      showDeleteModal.value = false;
      classToDelete.value = null;
    } catch (err) {
      console.error('Failed to delete class:', err);
      deleteError.value = err instanceof Error ? err.message : 'Fehler beim Löschen der Klasse.';
    } finally {
      deleting.value = false;
    }
  };

  const toggleArchiveClass = async (cls: ClassGroup) => {
    try {
      await classGroups.update(cls.id, { archived: !cls.archived });
      await loadData();
    } catch (err) {
      console.error('Failed to toggle archive:', err);
    }
  };

  const closeDeleteModal = () => {
    showDeleteModal.value = false;
    deleteError.value = '';
    classToDelete.value = null;
  };

  const getActivityIcon = (status: string): string => {
    const icons: Record<string, string> = {
      present: '✓',
      absent: '✗',
      excused: '📋',
      late: '⏰'
    };
    return icons[status] || '•';
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
    classes,
    recentActivity,
    lessons,
    loading,
    loadError,
    searchQuery,
    filterSchoolYear,
    showArchived,
    showCreateModal,
    creating,
    error,
    newClass,
    showEditModal,
    editClassData,
    editError,
    updating,
    showDeleteModal,
    classToDelete,
    deleteError,
    deleting,
    gradingSchemes,
    classColorOptions,
    organizationLinks,
    instructionLinks,
    schoolYears,
    todayLessons,
    currentOrNextLesson,
    upcomingLesson,
    currentOrNextMode,
    filteredClasses,
    loadData,
    getClassName,
    formatLessonTime,
    formatLessonDateTime,
    handleCreateClass,
    closeModal,
    editClass,
    handleUpdateClass,
    closeEditModal,
    getClassColorStyle,
    confirmDeleteClass,
    handleDeleteClass,
    toggleArchiveClass,
    closeDeleteModal,
    getActivityIcon,
    formatDate
  };
}
