/// <reference types="../../../../node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { getSportBridge, initializeSportBridge } from '../composables/useSportBridge';
import { getStudentsBridge, initializeStudentsBridge } from '../composables/useStudentsBridge';
import ToastNotification from '../components/ToastNotification.vue';
const { t } = useI18n();
initializeSportBridge();
initializeStudentsBridge();
const SportBridge = getSportBridge();
const studentsBridge = getStudentsBridge();
// State
const loading = ref(true);
const error = ref(null);
const students = ref([]);
const classes = ref([]);
const searchQuery = ref('');
const filterClass = ref('');
const filterGender = ref('');
const sortField = ref('lastName');
const sortDirection = ref('asc');
const currentPage = ref(1);
const itemsPerPage = 25;
const selectedStudents = ref(new Set());
// Modals
const showAddModal = ref(false);
const showImportModal = ref(false);
const editingStudent = ref(null);
const saving = ref(false);
// Forms
const studentForm = ref({
    firstName: '',
    lastName: '',
    classGroupId: '',
    gender: '',
    email: '',
    parentEmail: '',
    phone: ''
});
const birthYear = ref(null);
const csvData = ref('');
// Toast
const toast = ref({ show: false, message: '', type: 'success' });
// Computed
const filteredStudents = computed(() => {
    let filtered = students.value;
    // Search filter
    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        filtered = filtered.filter((student) => student.firstName.toLowerCase().includes(query) ||
            student.lastName.toLowerCase().includes(query));
    }
    // Class filter
    if (filterClass.value) {
        filtered = filtered.filter((student) => student.classGroupId === filterClass.value);
    }
    // Gender filter
    if (filterGender.value) {
        filtered = filtered.filter((student) => student.gender === (filterGender.value === 'm' ? 'male' : 'female'));
    }
    // Sort
    filtered.sort((a, b) => {
        const aVal = a[sortField.value];
        const bVal = b[sortField.value];
        if (aVal < bVal)
            return sortDirection.value === 'asc' ? -1 : 1;
        if (aVal > bVal)
            return sortDirection.value === 'asc' ? 1 : -1;
        return 0;
    });
    return filtered;
});
const paginatedStudents = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredStudents.value.slice(start, end);
});
const totalPages = computed(() => Math.ceil(filteredStudents.value.length / itemsPerPage));
const allSelected = computed(() => paginatedStudents.value.length > 0 &&
    paginatedStudents.value.every((student) => selectedStudents.value.has(student.id)));
const genderStats = computed(() => ({
    male: filteredStudents.value.filter((student) => student.gender === 'male').length,
    female: filteredStudents.value.filter((student) => student.gender === 'female').length
}));
// Methods
async function loadData() {
    try {
        loading.value = true;
        error.value = null;
        students.value = await studentsBridge.studentRepository.findAll();
        classes.value = await SportBridge.classGroupRepository.findAll();
    }
    catch (err) {
        error.value = err instanceof Error ? err.message : 'Fehler beim Laden';
    }
    finally {
        loading.value = false;
    }
}
function getClassName(classGroupId) {
    const cls = classes.value.find((classGroup) => classGroup.id === classGroupId);
    return cls ? cls.name : '-';
}
function getGenderDisplay(gender) {
    if (gender === 'male')
        return t('SCHUELER.maennlich');
    if (gender === 'female')
        return t('SCHUELER.weiblich');
    if (gender === 'diverse')
        return 'Divers';
    return '-';
}
function sort(field) {
    if (sortField.value === field) {
        sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
    }
    else {
        sortField.value = field;
        sortDirection.value = 'asc';
    }
}
function getSortIcon(field) {
    if (sortField.value !== field)
        return '';
    return sortDirection.value === 'asc' ? '↑' : '↓';
}
function toggleSelect(id) {
    if (selectedStudents.value.has(id)) {
        selectedStudents.value.delete(id);
    }
    else {
        selectedStudents.value.add(id);
    }
}
function toggleSelectAll() {
    if (allSelected.value) {
        paginatedStudents.value.forEach((student) => selectedStudents.value.delete(student.id));
    }
    else {
        paginatedStudents.value.forEach((student) => selectedStudents.value.add(student.id));
    }
}
function isSelected(id) {
    return selectedStudents.value.has(id);
}
function editStudent(student) {
    editingStudent.value = student;
    studentForm.value = {
        firstName: student.firstName,
        lastName: student.lastName,
        classGroupId: student.classGroupId,
        gender: student.gender === 'male' ? 'm' : student.gender === 'female' ? 'w' : '',
        email: student.contactInfo?.email || '',
        parentEmail: student.contactInfo?.parentEmail || '',
        phone: student.contactInfo?.phone || ''
    };
    birthYear.value = student.birthYear ?? null;
}
async function saveStudent() {
    try {
        saving.value = true;
        const gender = studentForm.value.gender === 'm'
            ? 'male'
            : studentForm.value.gender === 'w'
                ? 'female'
                : undefined;
        if (editingStudent.value) {
            await studentsBridge.studentRepository.update(editingStudent.value.id, {
                firstName: studentForm.value.firstName,
                lastName: studentForm.value.lastName,
                classGroupId: studentForm.value.classGroupId,
                birthYear: birthYear.value ?? undefined,
                gender,
                contactInfo: {
                    email: studentForm.value.email || undefined,
                    parentEmail: studentForm.value.parentEmail || undefined,
                    phone: studentForm.value.phone || undefined
                }
            });
            showToast('Schüler aktualisiert', 'success');
        }
        else {
            await studentsBridge.addStudentUseCase.execute({
                firstName: studentForm.value.firstName,
                lastName: studentForm.value.lastName,
                classGroupId: studentForm.value.classGroupId,
                birthYear: birthYear.value ?? undefined,
                gender,
                email: studentForm.value.email || undefined,
                parentEmail: studentForm.value.parentEmail || undefined,
                phone: studentForm.value.phone || undefined
            });
            showToast('Schüler hinzugefügt', 'success');
        }
        await loadData();
        closeModal();
    }
    catch (err) {
        showToast(err instanceof Error ? err.message : 'Fehler beim Speichern', 'error');
    }
    finally {
        saving.value = false;
    }
}
async function deleteStudent(student) {
    if (!confirm(`Schüler "${student.firstName} ${student.lastName}" wirklich löschen?`)) {
        return;
    }
    try {
        await studentsBridge.studentRepository.delete(student.id);
        showToast('Schüler gelöscht', 'success');
        await loadData();
    }
    catch (err) {
        showToast(err instanceof Error ? err.message : 'Fehler beim Löschen', 'error');
    }
}
async function bulkDelete() {
    if (!confirm(`${selectedStudents.value.size} Schüler wirklich löschen?`)) {
        return;
    }
    try {
        for (const id of selectedStudents.value) {
            await studentsBridge.studentRepository.delete(id);
        }
        showToast(`${selectedStudents.value.size} Schüler gelöscht`, 'success');
        selectedStudents.value.clear();
        await loadData();
    }
    catch (err) {
        showToast(err instanceof Error ? err.message : 'Fehler beim Löschen', 'error');
    }
}
function bulkMoveToClass() {
    // TODO: Implement bulk move - needs modal for class selection
    showToast('Funktion noch nicht implementiert', 'error');
}
async function importCSV() {
    if (!csvData.value.trim()) {
        showToast('Keine Daten zum Importieren', 'error');
        return;
    }
    try {
        const lines = csvData.value.trim().split('\n');
        let imported = 0;
        for (const line of lines) {
            const [firstName, lastName, className, gender, birthYearStr] = line.split(',').map((part) => part.trim());
            if (!firstName || !lastName || !className)
                continue;
            // Find or create class
            let cls = classes.value.find((classGroup) => classGroup.name === className);
            if (!cls) {
                // Create class if not exists
                const newClass = await SportBridge.classGroupRepository.create({
                    name: className,
                    schoolYear: new Date().getFullYear().toString()
                });
                classes.value.push(newClass);
                cls = newClass;
            }
            // Create student
            await studentsBridge.addStudentUseCase.execute({
                firstName,
                lastName,
                classGroupId: cls.id,
                gender: gender === 'm' ? 'male' : gender === 'w' ? 'female' : undefined,
                birthYear: birthYearStr ? parseInt(birthYearStr, 10) : undefined
            });
            imported++;
        }
        showToast(`${imported} Schüler importiert`, 'success');
        csvData.value = '';
        showImportModal.value = false;
        await loadData();
    }
    catch (err) {
        showToast(err instanceof Error ? err.message : 'Fehler beim Importieren', 'error');
    }
}
function closeModal() {
    showAddModal.value = false;
    editingStudent.value = null;
    studentForm.value = {
        firstName: '',
        lastName: '',
        classGroupId: '',
        gender: '',
        email: '',
        parentEmail: '',
        phone: ''
    };
    birthYear.value = null;
}
function showToast(message, type) {
    toast.value = { show: true, message, type };
    setTimeout(() => { toast.value.show = false; }, 3000);
}
// Lifecycle
onMounted(() => {
    loadData();
});
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['search-input']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
/** @type {__VLS_StyleScopedClasses['student-table']} */ ;
/** @type {__VLS_StyleScopedClasses['student-table']} */ ;
/** @type {__VLS_StyleScopedClasses['student-table']} */ ;
/** @type {__VLS_StyleScopedClasses['student-table']} */ ;
/** @type {__VLS_StyleScopedClasses['student-table']} */ ;
/** @type {__VLS_StyleScopedClasses['student-table']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-close']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['form-input']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-danger']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-danger']} */ ;
/** @type {__VLS_StyleScopedClasses['header-content']} */ ;
/** @type {__VLS_StyleScopedClasses['header-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['header-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['controls-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['search-group']} */ ;
/** @type {__VLS_StyleScopedClasses['student-table']} */ ;
/** @type {__VLS_StyleScopedClasses['student-table']} */ ;
/** @type {__VLS_StyleScopedClasses['student-table']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "student-list-view" },
});
/** @type {__VLS_StyleScopedClasses['student-list-view']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "page-header" },
});
/** @type {__VLS_StyleScopedClasses['page-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "header-content" },
});
/** @type {__VLS_StyleScopedClasses['header-content']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
(__VLS_ctx.t('SCHUELER.schueleruebersicht'));
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "page-description" },
});
/** @type {__VLS_StyleScopedClasses['page-description']} */ ;
(__VLS_ctx.t('SCHUELER.schueler'));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "header-actions" },
});
/** @type {__VLS_StyleScopedClasses['header-actions']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.showImportModal = true;
            // @ts-ignore
            [t, t, showImportModal,];
        } },
    ...{ class: "btn-secondary" },
});
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
(__VLS_ctx.t('SCHUELER.csv-import'));
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.showAddModal = true;
            // @ts-ignore
            [t, showAddModal,];
        } },
    ...{ class: "btn-primary" },
});
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
(__VLS_ctx.t('SCHUELER.schueler-hinzu'));
if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "loading-state" },
    });
    /** @type {__VLS_StyleScopedClasses['loading-state']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "spinner" },
    });
    /** @type {__VLS_StyleScopedClasses['spinner']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
}
else if (__VLS_ctx.error) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "error-state" },
    });
    /** @type {__VLS_StyleScopedClasses['error-state']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    (__VLS_ctx.error);
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.loadData) },
        ...{ class: "btn-primary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "student-content" },
    });
    /** @type {__VLS_StyleScopedClasses['student-content']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "controls-bar" },
    });
    /** @type {__VLS_StyleScopedClasses['controls-bar']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "search-group" },
    });
    /** @type {__VLS_StyleScopedClasses['search-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        value: (__VLS_ctx.searchQuery),
        type: "text",
        placeholder: (__VLS_ctx.t('SEARCH.placeholder') || 'Schüler suchen...'),
        ...{ class: "search-input" },
    });
    /** @type {__VLS_StyleScopedClasses['search-input']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        value: (__VLS_ctx.filterClass),
        ...{ class: "filter-select" },
    });
    /** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "",
    });
    for (const [cls] of __VLS_vFor((__VLS_ctx.classes))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            key: (cls.id),
            value: (cls.id),
        });
        (cls.name);
        // @ts-ignore
        [t, t, loading, error, error, loadData, searchQuery, filterClass, classes,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        value: (__VLS_ctx.filterGender),
        ...{ class: "filter-select" },
    });
    /** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "m",
    });
    (__VLS_ctx.t('SCHUELER.maennlich'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "w",
    });
    (__VLS_ctx.t('SCHUELER.weiblich'));
    if (__VLS_ctx.selectedStudents.size > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "bulk-actions" },
        });
        /** @type {__VLS_StyleScopedClasses['bulk-actions']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "selection-count" },
        });
        /** @type {__VLS_StyleScopedClasses['selection-count']} */ ;
        (__VLS_ctx.selectedStudents.size);
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (__VLS_ctx.bulkMoveToClass) },
            ...{ class: "btn-secondary btn-small" },
        });
        /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
        /** @type {__VLS_StyleScopedClasses['btn-small']} */ ;
        (__VLS_ctx.t('COMMON.move') || 'Verschieben');
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (__VLS_ctx.bulkDelete) },
            ...{ class: "btn-danger btn-small" },
        });
        /** @type {__VLS_StyleScopedClasses['btn-danger']} */ ;
        /** @type {__VLS_StyleScopedClasses['btn-small']} */ ;
        (__VLS_ctx.t('COMMON.delete') || 'Löschen');
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card" },
    });
    /** @type {__VLS_StyleScopedClasses['card']} */ ;
    if (__VLS_ctx.filteredStudents.length === 0 && __VLS_ctx.searchQuery === '' && !__VLS_ctx.filterClass) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "empty-state" },
        });
        /** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    }
    else if (__VLS_ctx.filteredStudents.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "empty-state" },
        });
        /** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
            ...{ class: "student-table" },
        });
        /** @type {__VLS_StyleScopedClasses['student-table']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
            ...{ class: "checkbox-col" },
        });
        /** @type {__VLS_StyleScopedClasses['checkbox-col']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            ...{ onChange: (__VLS_ctx.toggleSelectAll) },
            type: "checkbox",
            checked: (__VLS_ctx.allSelected),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(__VLS_ctx.error))
                        return;
                    if (!!(__VLS_ctx.filteredStudents.length === 0 && __VLS_ctx.searchQuery === '' && !__VLS_ctx.filterClass))
                        return;
                    if (!!(__VLS_ctx.filteredStudents.length === 0))
                        return;
                    __VLS_ctx.sort('lastName');
                    // @ts-ignore
                    [t, t, t, t, searchQuery, filterClass, filterGender, selectedStudents, selectedStudents, bulkMoveToClass, bulkDelete, filteredStudents, filteredStudents, toggleSelectAll, allSelected, sort,];
                } },
        });
        (__VLS_ctx.t('SCHUELER.nachname'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "sort-indicator" },
        });
        /** @type {__VLS_StyleScopedClasses['sort-indicator']} */ ;
        (__VLS_ctx.getSortIcon('lastName'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(__VLS_ctx.error))
                        return;
                    if (!!(__VLS_ctx.filteredStudents.length === 0 && __VLS_ctx.searchQuery === '' && !__VLS_ctx.filterClass))
                        return;
                    if (!!(__VLS_ctx.filteredStudents.length === 0))
                        return;
                    __VLS_ctx.sort('firstName');
                    // @ts-ignore
                    [t, sort, getSortIcon,];
                } },
        });
        (__VLS_ctx.t('SCHUELER.name'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "sort-indicator" },
        });
        /** @type {__VLS_StyleScopedClasses['sort-indicator']} */ ;
        (__VLS_ctx.getSortIcon('firstName'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        (__VLS_ctx.t('SCHUELER.klasse'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        (__VLS_ctx.t('SCHUELER.geschlecht'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        (__VLS_ctx.t('SCHUELER.geburtsjahr'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
            ...{ class: "actions-col" },
        });
        /** @type {__VLS_StyleScopedClasses['actions-col']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
        for (const [student] of __VLS_vFor((__VLS_ctx.paginatedStudents))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
                key: (student.id),
                ...{ class: ({ 'selected': __VLS_ctx.isSelected(student.id) }) },
            });
            /** @type {__VLS_StyleScopedClasses['selected']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "checkbox-col" },
            });
            /** @type {__VLS_StyleScopedClasses['checkbox-col']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                ...{ onChange: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!!(__VLS_ctx.error))
                            return;
                        if (!!(__VLS_ctx.filteredStudents.length === 0 && __VLS_ctx.searchQuery === '' && !__VLS_ctx.filterClass))
                            return;
                        if (!!(__VLS_ctx.filteredStudents.length === 0))
                            return;
                        __VLS_ctx.toggleSelect(student.id);
                        // @ts-ignore
                        [t, t, t, t, getSortIcon, paginatedStudents, isSelected, toggleSelect,];
                    } },
                type: "checkbox",
                checked: (__VLS_ctx.isSelected(student.id)),
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            (student.lastName);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            (student.firstName);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            (__VLS_ctx.getClassName(student.classGroupId));
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            (__VLS_ctx.getGenderDisplay(student.gender));
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            (student.birthYear ?? '-');
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "actions-col" },
            });
            /** @type {__VLS_StyleScopedClasses['actions-col']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!!(__VLS_ctx.error))
                            return;
                        if (!!(__VLS_ctx.filteredStudents.length === 0 && __VLS_ctx.searchQuery === '' && !__VLS_ctx.filterClass))
                            return;
                        if (!!(__VLS_ctx.filteredStudents.length === 0))
                            return;
                        __VLS_ctx.editStudent(student);
                        // @ts-ignore
                        [isSelected, getClassName, getGenderDisplay, editStudent,];
                    } },
                ...{ class: "btn-icon" },
                title: "Bearbeiten",
            });
            /** @type {__VLS_StyleScopedClasses['btn-icon']} */ ;
            let __VLS_0;
            /** @ts-ignore @type {typeof __VLS_components.RouterLink | typeof __VLS_components.RouterLink} */
            RouterLink;
            // @ts-ignore
            const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
                to: (`/students/${student.id}`),
                ...{ class: "btn-icon" },
                title: "Profil",
            }));
            const __VLS_2 = __VLS_1({
                to: (`/students/${student.id}`),
                ...{ class: "btn-icon" },
                title: "Profil",
            }, ...__VLS_functionalComponentArgsRest(__VLS_1));
            /** @type {__VLS_StyleScopedClasses['btn-icon']} */ ;
            const { default: __VLS_5 } = __VLS_3.slots;
            // @ts-ignore
            [];
            var __VLS_3;
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!!(__VLS_ctx.error))
                            return;
                        if (!!(__VLS_ctx.filteredStudents.length === 0 && __VLS_ctx.searchQuery === '' && !__VLS_ctx.filterClass))
                            return;
                        if (!!(__VLS_ctx.filteredStudents.length === 0))
                            return;
                        __VLS_ctx.deleteStudent(student);
                        // @ts-ignore
                        [deleteStudent,];
                    } },
                ...{ class: "btn-icon btn-danger" },
                title: "Löschen",
            });
            /** @type {__VLS_StyleScopedClasses['btn-icon']} */ ;
            /** @type {__VLS_StyleScopedClasses['btn-danger']} */ ;
            // @ts-ignore
            [];
        }
    }
    if (__VLS_ctx.totalPages > 1) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "pagination" },
        });
        /** @type {__VLS_StyleScopedClasses['pagination']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(__VLS_ctx.error))
                        return;
                    if (!(__VLS_ctx.totalPages > 1))
                        return;
                    __VLS_ctx.currentPage--;
                    // @ts-ignore
                    [totalPages, currentPage,];
                } },
            ...{ class: "btn-secondary btn-small" },
            disabled: (__VLS_ctx.currentPage === 1),
        });
        /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
        /** @type {__VLS_StyleScopedClasses['btn-small']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "page-info" },
        });
        /** @type {__VLS_StyleScopedClasses['page-info']} */ ;
        (__VLS_ctx.currentPage);
        (__VLS_ctx.totalPages);
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(__VLS_ctx.error))
                        return;
                    if (!(__VLS_ctx.totalPages > 1))
                        return;
                    __VLS_ctx.currentPage++;
                    // @ts-ignore
                    [totalPages, currentPage, currentPage, currentPage,];
                } },
            ...{ class: "btn-secondary btn-small" },
            disabled: (__VLS_ctx.currentPage === __VLS_ctx.totalPages),
        });
        /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
        /** @type {__VLS_StyleScopedClasses['btn-small']} */ ;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stats-bar" },
    });
    /** @type {__VLS_StyleScopedClasses['stats-bar']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-item" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "stat-label" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "stat-value" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
    (__VLS_ctx.filteredStudents.length);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-item" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "stat-label" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "stat-value" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
    (__VLS_ctx.genderStats.male);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-item" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "stat-label" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "stat-value" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
    (__VLS_ctx.genderStats.female);
}
if (__VLS_ctx.showAddModal || __VLS_ctx.editingStudent) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (__VLS_ctx.closeModal) },
        ...{ class: "modal-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-content" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-content']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-header" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    (__VLS_ctx.editingStudent ? __VLS_ctx.t('SCHUELER.schueler-bearbeiten') : __VLS_ctx.t('SCHUELER.schueler-hinzu'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeModal) },
        ...{ class: "btn-close" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-close']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
        ...{ onSubmit: (__VLS_ctx.saveStudent) },
        ...{ class: "modal-body" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-body']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    (__VLS_ctx.t('SCHUELER.name'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        value: (__VLS_ctx.studentForm.firstName),
        type: "text",
        required: true,
        ...{ class: "form-input" },
    });
    /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    (__VLS_ctx.t('SCHUELER.nachname'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        value: (__VLS_ctx.studentForm.lastName),
        type: "text",
        required: true,
        ...{ class: "form-input" },
    });
    /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    (__VLS_ctx.t('SCHUELER.klasse'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        value: (__VLS_ctx.studentForm.classGroupId),
        required: true,
        ...{ class: "form-input" },
    });
    /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "",
    });
    for (const [cls] of __VLS_vFor((__VLS_ctx.classes))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            key: (cls.id),
            value: (cls.id),
        });
        (cls.name);
        // @ts-ignore
        [t, t, t, t, t, showAddModal, classes, filteredStudents, totalPages, currentPage, genderStats, genderStats, editingStudent, editingStudent, closeModal, closeModal, saveStudent, studentForm, studentForm, studentForm,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    (__VLS_ctx.t('SCHUELER.geschlecht'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        value: (__VLS_ctx.studentForm.gender),
        ...{ class: "form-input" },
    });
    /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "m",
    });
    (__VLS_ctx.t('SCHUELER.maennlich'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "w",
    });
    (__VLS_ctx.t('SCHUELER.weiblich'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    (__VLS_ctx.t('SCHUELER.geburtsjahr'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "number",
        min: (1900),
        max: (new Date().getFullYear()),
        ...{ class: "form-input" },
    });
    (__VLS_ctx.birthYear);
    /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "form-hint" },
    });
    /** @type {__VLS_StyleScopedClasses['form-hint']} */ ;
    (__VLS_ctx.t('SCHUELER.geburt-hinweis'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    (__VLS_ctx.t('SCHUELER.email'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "email",
        ...{ class: "form-input" },
    });
    (__VLS_ctx.studentForm.email);
    /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    (__VLS_ctx.t('SCHUELER.parent-email'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "email",
        ...{ class: "form-input" },
    });
    (__VLS_ctx.studentForm.parentEmail);
    /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    (__VLS_ctx.t('SCHUELER.phone'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "tel",
        ...{ class: "form-input" },
    });
    (__VLS_ctx.studentForm.phone);
    /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-actions" },
    });
    /** @type {__VLS_StyleScopedClasses['form-actions']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeModal) },
        type: "button",
        ...{ class: "btn-secondary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
    (__VLS_ctx.t('COMMON.cancel') || 'Abbrechen');
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        type: "submit",
        ...{ class: "btn-primary" },
        disabled: (__VLS_ctx.saving),
    });
    /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
    (__VLS_ctx.saving ? 'Wird gespeichert...' : __VLS_ctx.t('SCHUELER.speichern'));
}
if (__VLS_ctx.showImportModal) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showImportModal))
                    return;
                __VLS_ctx.showImportModal = false;
                // @ts-ignore
                [t, t, t, t, t, t, t, t, t, t, showImportModal, showImportModal, closeModal, studentForm, studentForm, studentForm, studentForm, birthYear, saving, saving,];
            } },
        ...{ class: "modal-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-content" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-content']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-header" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    (__VLS_ctx.t('SCHUELER.csv-import'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showImportModal))
                    return;
                __VLS_ctx.showImportModal = false;
                // @ts-ignore
                [t, showImportModal,];
            } },
        ...{ class: "btn-close" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-close']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-body" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-body']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.textarea, __VLS_intrinsics.textarea)({
        value: (__VLS_ctx.csvData),
        ...{ class: "form-input" },
        rows: "10",
        placeholder: "Max,Mustermann,10a,m,2010&#10;Anna,Schmidt,10a,w,2009",
    });
    /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "form-hint" },
    });
    /** @type {__VLS_StyleScopedClasses['form-hint']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-actions" },
    });
    /** @type {__VLS_StyleScopedClasses['form-actions']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showImportModal))
                    return;
                __VLS_ctx.showImportModal = false;
                // @ts-ignore
                [showImportModal, csvData,];
            } },
        type: "button",
        ...{ class: "btn-secondary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
    (__VLS_ctx.t('COMMON.cancel') || 'Abbrechen');
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.importCSV) },
        type: "button",
        ...{ class: "btn-primary" },
        disabled: (!__VLS_ctx.csvData),
    });
    /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
}
if (__VLS_ctx.toast.show) {
    const __VLS_6 = ToastNotification;
    // @ts-ignore
    const __VLS_7 = __VLS_asFunctionalComponent1(__VLS_6, new __VLS_6({
        ...{ 'onClose': {} },
        message: (__VLS_ctx.toast.message),
        type: (__VLS_ctx.toast.type),
    }));
    const __VLS_8 = __VLS_7({
        ...{ 'onClose': {} },
        message: (__VLS_ctx.toast.message),
        type: (__VLS_ctx.toast.type),
    }, ...__VLS_functionalComponentArgsRest(__VLS_7));
    let __VLS_11;
    const __VLS_12 = ({ close: {} },
        { onClose: (...[$event]) => {
                if (!(__VLS_ctx.toast.show))
                    return;
                __VLS_ctx.toast.show = false;
                // @ts-ignore
                [t, csvData, importCSV, toast, toast, toast, toast,];
            } });
    var __VLS_9;
    var __VLS_10;
}
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
