import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import type { ClassGroup, Student } from '@viccoboard/core';
import type { StudentCsvFile, StudentImportPreview } from '@viccoboard/students';

import demoStudents7a from '../assets/demo-import/students-7a.csv?raw';
import demoStudents9b from '../assets/demo-import/students-9b.csv?raw';
import demoStudents12a from '../assets/demo-import/students-12a.csv?raw';
import { getSportBridge, initializeSportBridge } from './useSportBridge';
import { getStudentsBridge, initializeStudentsBridge } from './useStudentsBridge';
import { useToast } from './useToast';

export interface StudentFormState {
  firstName: string;
  lastName: string;
  classGroupId: string | null;
  gender: 'm' | 'f' | null;
  dateOfBirth: string;
  email: string;
  parentEmail: string;
  phone: string;
}

export interface StudentRow {
  id: string;
  firstName: string;
  lastName: string;
  className: string;
  genderLabel: string;
  dateOfBirth: string | null;
  legacyFlag: boolean;
  original: Student;
}

const DEMO_IMPORT_FILES: StudentCsvFile[] = [
  { fileName: 'students-7a.csv', content: demoStudents7a },
  { fileName: 'students-9b.csv', content: demoStudents9b },
  { fileName: 'students-12a.csv', content: demoStudents12a }
];

export function useStudentListView() {
  const { t } = useI18n();
  const router = useRouter();
  const toast = useToast();

  initializeSportBridge();
  initializeStudentsBridge();

  const sportBridge = getSportBridge();
  const studentsBridge = getStudentsBridge();

  const loading = ref(true);
  const error = ref<string | null>(null);
  const students = ref<Student[]>([]);
  const classes = ref<ClassGroup[]>([]);

  const searchQuery = ref('');
  const filterClass = ref<string | null>(null);
  const filterGender = ref<'m' | 'f' | null>(null);
  const selectedStudents = ref<StudentRow[]>([]);

  const showEditor = ref(false);
  const showImportDialog = ref(false);
  const editingStudent = ref<Student | null>(null);
  const saving = ref(false);
  const importBusy = ref(false);
  const pendingImportFiles = ref<StudentCsvFile[]>([]);
  const importPreview = ref<StudentImportPreview | null>(null);
  const importLabel = ref('');
  const importSourceType = ref<'demo' | 'live'>('live');

  const defaultStudentForm = (): StudentFormState => ({
    firstName: '',
    lastName: '',
    classGroupId: null,
    gender: null,
    dateOfBirth: '',
    email: '',
    parentEmail: '',
    phone: ''
  });

  const studentForm = ref<StudentFormState>(defaultStudentForm());

  const classOptions = computed(() =>
    classes.value.map((classGroup) => ({
      label: classGroup.name,
      value: classGroup.id
    }))
  );

  const genderOptions = computed(() => [
    { label: t('SCHUELER.maennlich'), value: 'm' as const },
    { label: t('SCHUELER.weiblich'), value: 'f' as const }
  ]);

  const classNameById = computed(() =>
    new Map(classes.value.map((classGroup) => [classGroup.id, classGroup.name]))
  );

  const studentRows = computed<StudentRow[]>(() =>
    students.value.map((student) => ({
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      className: classNameById.value.get(student.classGroupId) ?? '-',
      genderLabel: getGenderDisplay(student.gender),
      dateOfBirth: student.dateOfBirth,
      legacyFlag: Boolean(student.legacyDateOfBirthMissing),
      original: student
    }))
  );

  const filteredStudents = computed(() => {
    const query = searchQuery.value.trim().toLowerCase();

    return studentRows.value.filter((student) => {
      const matchesQuery = query.length === 0
        || `${student.firstName} ${student.lastName}`.toLowerCase().includes(query)
        || student.className.toLowerCase().includes(query)
        || (student.dateOfBirth ?? '').includes(query);

      const matchesClass = !filterClass.value || student.original.classGroupId === filterClass.value;
      const matchesGender = !filterGender.value || student.original.gender === filterGender.value;

      return matchesQuery && matchesClass && matchesGender;
    });
  });

  const hasActiveFilters = computed(() =>
    searchQuery.value.trim().length > 0 || Boolean(filterClass.value) || Boolean(filterGender.value)
  );

  const emptyStateMessage = computed(() => {
    if (hasActiveFilters.value) {
      return 'Passen Sie Suche oder Filter an, um Schüler wieder einzublenden.';
    }

    return 'Noch keine Schüler vorhanden. Sie können direkt manuell anlegen oder per CSV importieren.';
  });

  const genderStats = computed(() => ({
    male: filteredStudents.value.filter((student) => student.original.gender === 'm').length,
    female: filteredStudents.value.filter((student) => student.original.gender === 'f').length
  }));

  async function loadData() {
    try {
      loading.value = true;
      error.value = null;

      const [loadedStudents, loadedClasses] = await Promise.all([
        studentsBridge.studentRepository.findAll(),
        sportBridge.classGroupRepository.findAll()
      ]);

      students.value = loadedStudents;
      classes.value = loadedClasses;
      selectedStudents.value = [];
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Fehler beim Laden';
    } finally {
      loading.value = false;
    }
  }

  function getGenderDisplay(gender?: 'm' | 'f'): string {
    if (gender === 'm') return t('SCHUELER.maennlich');
    if (gender === 'f') return t('SCHUELER.weiblich');
    return '-';
  }

  function resetForm() {
    studentForm.value = defaultStudentForm();
  }

  function resetFilters() {
    searchQuery.value = '';
    filterClass.value = null;
    filterGender.value = null;
  }

  function openCreateDialog() {
    editingStudent.value = null;
    resetForm();
    showEditor.value = true;
  }

  function editStudent(student: Student) {
    editingStudent.value = student;
    studentForm.value = {
      firstName: student.firstName,
      lastName: student.lastName,
      classGroupId: student.classGroupId,
      gender: student.gender ?? null,
      dateOfBirth: student.dateOfBirth ?? '',
      email: student.contactInfo?.email || '',
      parentEmail: student.contactInfo?.parentEmail || '',
      phone: student.contactInfo?.phone || ''
    };
    showEditor.value = true;
  }

  function closeEditor() {
    showEditor.value = false;
    editingStudent.value = null;
    resetForm();
  }

  function openStudentProfile(studentId: string) {
    void router.push(`/students/${studentId}`);
  }

  async function saveStudent() {
    const firstName = studentForm.value.firstName.trim();
    const lastName = studentForm.value.lastName.trim();
    const classGroupId = studentForm.value.classGroupId;
    const dateOfBirth = studentForm.value.dateOfBirth.trim();

    if (!firstName || !lastName || !classGroupId || !dateOfBirth) {
      toast.error('Bitte Vorname, Nachname, Klasse und Geburtsdatum ausfüllen.');
      return;
    }

    try {
      saving.value = true;

      if (editingStudent.value) {
        await studentsBridge.studentRepository.update(editingStudent.value.id, {
          firstName,
          lastName,
          classGroupId,
          dateOfBirth,
          gender: studentForm.value.gender ?? undefined,
          legacyDateOfBirthMissing: false,
          contactInfo: {
            email: studentForm.value.email || undefined,
            parentEmail: studentForm.value.parentEmail || undefined,
            phone: studentForm.value.phone || undefined
          }
        });
        toast.success('Schüler aktualisiert');
      } else {
        await studentsBridge.addStudentUseCase.execute({
          firstName,
          lastName,
          classGroupId,
          dateOfBirth,
          gender: studentForm.value.gender ?? undefined,
          email: studentForm.value.email || undefined,
          parentEmail: studentForm.value.parentEmail || undefined,
          phone: studentForm.value.phone || undefined
        });
        toast.success('Schüler hinzugefügt');
      }

      await loadData();
      closeEditor();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Fehler beim Speichern');
    } finally {
      saving.value = false;
    }
  }

  async function deleteStudent(student: Student) {
    const confirmed = window.confirm(`Schüler "${student.firstName} ${student.lastName}" wirklich löschen?`);

    if (!confirmed) {
      return;
    }

    try {
      await studentsBridge.studentRepository.delete(student.id);
      toast.success('Schüler gelöscht');
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Fehler beim Löschen');
    }
  }

  async function bulkDelete() {
    if (selectedStudents.value.length === 0) {
      return;
    }

    const confirmed = window.confirm(`${selectedStudents.value.length} Schüler wirklich löschen?`);

    if (!confirmed) {
      return;
    }

    try {
      for (const student of selectedStudents.value) {
        await studentsBridge.studentRepository.delete(student.id);
      }

      toast.success(`${selectedStudents.value.length} Schüler gelöscht`);
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Fehler beim Löschen');
    }
  }

  function bulkMoveToClass() {
    toast.warning('Sammelverschiebung ist noch nicht umgesetzt.');
  }

  function resetImportState() {
    pendingImportFiles.value = [];
    importPreview.value = null;
    importLabel.value = '';
    importSourceType.value = 'live';
  }

  async function previewImport(files: StudentCsvFile[], sourceType: 'demo' | 'live', label: string) {
    try {
      importBusy.value = true;
      pendingImportFiles.value = files;
      importSourceType.value = sourceType;
      importLabel.value = label;
      importPreview.value = await studentsBridge.studentCsvImportUseCase.preview(files, sourceType, label);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Fehler bei der Importvorschau');
    } finally {
      importBusy.value = false;
    }
  }

  async function handleCsvFileSelection(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    if (files.length === 0) {
      return;
    }

    const csvFiles = await Promise.all(files.map(async (file) => ({
      fileName: file.name,
      content: await file.text()
    })));

    await previewImport(csvFiles, 'live', 'Live-CSV-Import');
    input.value = '';
  }

  async function previewDemoImport() {
    await previewImport(DEMO_IMPORT_FILES, 'demo', 'RC-Demo-Import');
  }

  async function executeImport() {
    if (!pendingImportFiles.value.length || !importPreview.value) {
      toast.error('Keine Importvorschau vorhanden.');
      return;
    }

    try {
      importBusy.value = true;
      const result = await studentsBridge.studentCsvImportUseCase.execute(
        pendingImportFiles.value,
        importSourceType.value,
        importLabel.value
      );
      toast.success(
        `${result.summary.imported} importiert, ${result.summary.skipped} übersprungen, ${result.summary.conflicts} Konflikte`
      );
      showImportDialog.value = false;
      resetImportState();
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Fehler beim Importieren');
    } finally {
      importBusy.value = false;
    }
  }

  async function deleteDemoData() {
    const confirmed = window.confirm('Alle importierten Demo-Daten wirklich löschen?');
    if (!confirmed) {
      return;
    }

    try {
      importBusy.value = true;
      const result = await studentsBridge.studentCsvImportUseCase.deleteDemoData();
      toast.success(
        `${result.deletedStudents} Demo-Schüler und ${result.deletedClassGroups} Demo-Klassen gelöscht`
      );
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Fehler beim Löschen der Demo-Daten');
    } finally {
      importBusy.value = false;
    }
  }

  onMounted(() => {
    void loadData();
  });

  return {
    t,
    router,
    loading,
    error,
    searchQuery,
    filterClass,
    filterGender,
    selectedStudents,
    showEditor,
    showImportDialog,
    editingStudent,
    saving,
    importBusy,
    studentForm,
    classOptions,
    genderOptions,
    filteredStudents,
    hasActiveFilters,
    emptyStateMessage,
    genderStats,
    importPreview,
    loadData,
    resetFilters,
    openCreateDialog,
    editStudent,
    closeEditor,
    openStudentProfile,
    saveStudent,
    deleteStudent,
    bulkDelete,
    bulkMoveToClass,
    handleCsvFileSelection,
    previewDemoImport,
    executeImport,
    deleteDemoData,
    resetImportState
  };
}
