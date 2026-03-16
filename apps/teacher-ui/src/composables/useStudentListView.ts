import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import type { ClassGroup, Student } from '@viccoboard/core';

import { getSportBridge, initializeSportBridge } from './useSportBridge';
import { getStudentsBridge, initializeStudentsBridge } from './useStudentsBridge';
import { useToast } from './useToast';

export interface StudentFormState {
  firstName: string;
  lastName: string;
  classGroupId: string | null;
  gender: 'm' | 'w' | null;
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
  birthYear?: number;
  original: Student;
}

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
  const filterGender = ref<'m' | 'w' | null>(null);
  const selectedStudents = ref<StudentRow[]>([]);

  const showEditor = ref(false);
  const showImportDialog = ref(false);
  const editingStudent = ref<Student | null>(null);
  const saving = ref(false);

  const currentYear = new Date().getFullYear();

  const defaultStudentForm = (): StudentFormState => ({
    firstName: '',
    lastName: '',
    classGroupId: null,
    gender: null,
    email: '',
    parentEmail: '',
    phone: ''
  });

  const studentForm = ref<StudentFormState>(defaultStudentForm());
  const birthYearInput = ref('');
  const csvData = ref('');

  const classOptions = computed(() =>
    classes.value.map((classGroup) => ({
      label: classGroup.name,
      value: classGroup.id
    }))
  );

  const genderOptions = computed(() => [
    { label: t('SCHUELER.maennlich'), value: 'm' as const },
    { label: t('SCHUELER.weiblich'), value: 'w' as const }
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
      birthYear: student.birthYear,
      original: student
    }))
  );

  const filteredStudents = computed(() => {
    const query = searchQuery.value.trim().toLowerCase();

    return studentRows.value.filter((student) => {
      const matchesQuery = query.length === 0
        || `${student.firstName} ${student.lastName}`.toLowerCase().includes(query)
        || student.className.toLowerCase().includes(query);

      const matchesClass = !filterClass.value || student.original.classGroupId === filterClass.value;
      const matchesGender = !filterGender.value
        || student.original.gender === (filterGender.value === 'm' ? 'male' : 'female');

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
    male: filteredStudents.value.filter((student) => student.original.gender === 'male').length,
    female: filteredStudents.value.filter((student) => student.original.gender === 'female').length
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

  function getGenderDisplay(gender?: 'male' | 'female' | 'diverse'): string {
    if (gender === 'male') return t('SCHUELER.maennlich');
    if (gender === 'female') return t('SCHUELER.weiblich');
    if (gender === 'diverse') return 'Divers';
    return '-';
  }

  function resetForm() {
    studentForm.value = defaultStudentForm();
    birthYearInput.value = '';
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
      gender: student.gender === 'male' ? 'm' : student.gender === 'female' ? 'w' : null,
      email: student.contactInfo?.email || '',
      parentEmail: student.contactInfo?.parentEmail || '',
      phone: student.contactInfo?.phone || ''
    };
    birthYearInput.value = student.birthYear ? String(student.birthYear) : '';
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

  function parseBirthYear(): number | undefined {
    const rawValue = birthYearInput.value.trim();

    if (!rawValue) {
      return undefined;
    }

    const parsed = Number.parseInt(rawValue, 10);

    if (Number.isNaN(parsed) || parsed < 1900 || parsed > currentYear) {
      throw new Error(`Geburtsjahr muss zwischen 1900 und ${currentYear} liegen.`);
    }

    return parsed;
  }

  async function saveStudent() {
    const firstName = studentForm.value.firstName.trim();
    const lastName = studentForm.value.lastName.trim();
    const classGroupId = studentForm.value.classGroupId;

    if (!firstName || !lastName || !classGroupId) {
      toast.error('Bitte Vorname, Nachname und Klasse ausfüllen.');
      return;
    }

    try {
      saving.value = true;

      const birthYear = parseBirthYear();
      const gender = studentForm.value.gender === 'm'
        ? 'male'
        : studentForm.value.gender === 'w'
          ? 'female'
          : undefined;

      if (editingStudent.value) {
        await studentsBridge.studentRepository.update(editingStudent.value.id, {
          firstName,
          lastName,
          classGroupId,
          birthYear,
          gender,
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
          birthYear,
          gender,
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

  async function importCSV() {
    if (!csvData.value.trim()) {
      toast.error('Keine Daten zum Importieren');
      return;
    }

    try {
      const lines = csvData.value.trim().split('\n');
      let imported = 0;

      for (const line of lines) {
        const [firstName, lastName, className, gender, birthYearValue] = line.split(',').map((part) => part.trim());

        if (!firstName || !lastName || !className) {
          continue;
        }

        let classGroup = classes.value.find((entry) => entry.name === className);

        if (!classGroup) {
          classGroup = await sportBridge.classGroupRepository.create({
            name: className,
            schoolYear: String(currentYear)
          });
          classes.value.push(classGroup);
        }

        await studentsBridge.addStudentUseCase.execute({
          firstName,
          lastName,
          classGroupId: classGroup.id,
          gender: gender === 'm' ? 'male' : gender === 'w' ? 'female' : undefined,
          birthYear: birthYearValue ? Number.parseInt(birthYearValue, 10) : undefined
        });

        imported += 1;
      }

      toast.success(`${imported} Schüler importiert`);
      csvData.value = '';
      showImportDialog.value = false;
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Fehler beim Importieren');
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
    currentYear,
    studentForm,
    birthYearInput,
    csvData,
    classOptions,
    genderOptions,
    filteredStudents,
    hasActiveFilters,
    emptyStateMessage,
    genderStats,
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
    importCSV
  };
}
