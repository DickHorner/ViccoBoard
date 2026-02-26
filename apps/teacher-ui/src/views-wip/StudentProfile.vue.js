/// <reference types="../../../../node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useClassGroups, useStudents, useAttendance } from '../composables/useSportBridge';
import { getInitials, capitalize } from '../utils/stringUtils';
import { getTodayDateString } from '../utils/student';
const route = useRoute();
const router = useRouter();
const studentId = route.params.id;
// State
const student = ref(undefined);
const classes = ref([]);
const attendanceRecords = ref([]);
const attendanceSummary = ref(null);
const loading = ref(true);
const error = ref('');
const showEditModal = ref(false);
const showPhotoModal = ref(false);
const showDeleteModal = ref(false);
const showRemovePhotoModal = ref(false);
const saving = ref(false);
const editError = ref('');
const photoError = ref('');
const deleteError = ref('');
const photoPreview = ref('');
const photoInput = ref(null);
const editForm = ref({
    firstName: '',
    lastName: '',
    classId: '',
    dateOfBirth: '',
    email: ''
});
// Composables
const classGroups = useClassGroups();
const students = useStudents();
const attendance = useAttendance();
const hasClasses = computed(() => classes.value.length > 0);
// Methods
const loadStudent = async () => {
    loading.value = true;
    error.value = '';
    try {
        // Load student details
        student.value = await students.getById(studentId);
        if (!student.value) {
            error.value = 'Schüler nicht gefunden';
            return;
        }
        classes.value = await classGroups.getAll();
        editForm.value = {
            firstName: student.value.firstName,
            lastName: student.value.lastName,
            classId: student.value.classId,
            dateOfBirth: student.value.dateOfBirth
                ? new Date(student.value.dateOfBirth).toISOString().split('T')[0]
                : '',
            email: student.value.email ?? ''
        };
        // Load attendance records
        attendanceRecords.value = await attendance.getByStudentId(studentId);
        // Calculate attendance summary
        if (attendanceRecords.value.length > 0) {
            const present = attendanceRecords.value.filter(r => r.status === 'present').length;
            const absent = attendanceRecords.value.filter(r => r.status === 'absent').length;
            const excused = attendanceRecords.value.filter(r => r.status === 'excused').length;
            const passive = attendanceRecords.value.filter(r => r.status === 'passive').length;
            const late = attendanceRecords.value.filter(r => r.status === 'late').length;
            const total = attendanceRecords.value.length;
            attendanceSummary.value = {
                total,
                present,
                absent,
                excused,
                passive,
                late,
                percentage: Math.round((present / total) * 100)
            };
        }
    }
    catch (err) {
        console.error('Failed to load student:', err);
        error.value = 'Fehler beim Laden des Schülers. Bitte versuchen Sie es erneut.';
    }
    finally {
        loading.value = false;
    }
};
const handleEditStudent = async () => {
    if (!student.value)
        return;
    editError.value = '';
    saving.value = true;
    try {
        await students.update(student.value.id, {
            firstName: editForm.value.firstName.trim(),
            lastName: editForm.value.lastName.trim(),
            classGroupId: editForm.value.classId,
            dateOfBirth: editForm.value.dateOfBirth ? new Date(editForm.value.dateOfBirth) : undefined,
            email: editForm.value.email || undefined
        });
        // Reload from database to ensure consistency
        const updatedStudent = await students.getById(student.value.id);
        if (updatedStudent) {
            student.value = updatedStudent;
        }
        closeEditModal();
    }
    catch (err) {
        console.error('Failed to update student:', err);
        editError.value = err instanceof Error ? err.message : 'Fehler beim Aktualisieren des Schülers';
    }
    finally {
        saving.value = false;
    }
};
const handlePhotoSelect = (event) => {
    const target = event.target;
    const file = target.files?.[0];
    if (!file)
        return;
    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
        photoError.value = 'Fotogröße muss kleiner als 2MB sein';
        return;
    }
    // Validate file type
    if (!file.type.startsWith('image/')) {
        photoError.value = 'Bitte wählen Sie eine Bilddatei';
        return;
    }
    photoError.value = '';
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
        photoPreview.value = e.target?.result;
    };
    reader.readAsDataURL(file);
};
const savePhoto = async () => {
    if (!student.value || !photoPreview.value)
        return;
    saving.value = true;
    photoError.value = '';
    try {
        await students.update(student.value.id, {
            photo: photoPreview.value
        });
        // Reload from database to ensure consistency
        const updatedStudent = await students.getById(student.value.id);
        if (updatedStudent) {
            student.value = updatedStudent;
        }
        photoPreview.value = '';
        showPhotoModal.value = false;
    }
    catch (err) {
        console.error('Failed to save photo:', err);
        photoError.value = 'Fehler beim Speichern des Fotos. Bitte versuchen Sie es erneut.';
    }
    finally {
        saving.value = false;
    }
};
const removePhoto = async () => {
    if (!student.value)
        return;
    showRemovePhotoModal.value = true;
};
const confirmRemovePhoto = async () => {
    if (!student.value)
        return;
    saving.value = true;
    photoError.value = '';
    try {
        await students.update(student.value.id, {
            photo: undefined
        });
        // Reload from database to ensure consistency
        const updatedStudent = await students.getById(student.value.id);
        if (updatedStudent) {
            student.value = updatedStudent;
        }
        showPhotoModal.value = false;
        showRemovePhotoModal.value = false;
    }
    catch (err) {
        console.error('Failed to remove photo:', err);
        photoError.value = 'Fehler beim Entfernen des Fotos. Bitte versuchen Sie es erneut.';
    }
    finally {
        saving.value = false;
    }
};
const confirmDelete = () => {
    if (!student.value)
        return;
    showDeleteModal.value = true;
};
const handleDelete = async () => {
    if (!student.value)
        return;
    deleteError.value = '';
    saving.value = true;
    try {
        await students.remove(student.value.id);
        router.push('/students');
    }
    catch (err) {
        console.error('Failed to delete student:', err);
        deleteError.value = err instanceof Error ? err.message : 'Fehler beim Löschen des Schülers. Bitte versuchen Sie es erneut.';
        saving.value = false;
    }
};
const closeEditModal = () => {
    showEditModal.value = false;
    editError.value = '';
};
const closePhotoModal = () => {
    showPhotoModal.value = false;
    photoPreview.value = '';
    photoError.value = '';
    if (photoInput.value) {
        photoInput.value.value = '';
    }
};
const getClassName = (classId) => {
    const classGroup = classes.value.find(c => c.id === classId);
    return classGroup ? classGroup.name : 'Unbekannte Klasse';
};
const formatDate = (date) => {
    return new Date(date).toLocaleDateString('de-DE');
};
// Lifecycle
onMounted(() => {
    loadStudent();
});
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['back-button']} */ ;
/** @type {__VLS_StyleScopedClasses['page-header']} */ ;
/** @type {__VLS_StyleScopedClasses['spinner']} */ ;
/** @type {__VLS_StyleScopedClasses['spinner-small']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['photo-upload-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['student-info']} */ ;
/** @type {__VLS_StyleScopedClasses['student-info']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-link']} */ ;
/** @type {__VLS_StyleScopedClasses['attendance-table']} */ ;
/** @type {__VLS_StyleScopedClasses['attendance-table']} */ ;
/** @type {__VLS_StyleScopedClasses['attendance-table']} */ ;
/** @type {__VLS_StyleScopedClasses['attendance-table']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-close']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['form-input']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-danger']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-danger']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-danger-solid']} */ ;
/** @type {__VLS_StyleScopedClasses['student-header']} */ ;
/** @type {__VLS_StyleScopedClasses['header-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['attendance-table']} */ ;
/** @type {__VLS_StyleScopedClasses['attendance-table']} */ ;
/** @type {__VLS_StyleScopedClasses['attendance-table']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "student-profile-view" },
});
/** @type {__VLS_StyleScopedClasses['student-profile-view']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "page-header" },
});
/** @type {__VLS_StyleScopedClasses['page-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.$router.back();
            // @ts-ignore
            [$router,];
        } },
    ...{ class: "back-button" },
});
/** @type {__VLS_StyleScopedClasses['back-button']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "page-description" },
});
/** @type {__VLS_StyleScopedClasses['page-description']} */ ;
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
        ...{ onClick: (__VLS_ctx.loadStudent) },
        ...{ class: "btn-primary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
}
else if (__VLS_ctx.student) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "profile-layout" },
    });
    /** @type {__VLS_StyleScopedClasses['profile-layout']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "card profile-card" },
    });
    /** @type {__VLS_StyleScopedClasses['card']} */ ;
    /** @type {__VLS_StyleScopedClasses['profile-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "student-header" },
    });
    /** @type {__VLS_StyleScopedClasses['student-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "photo-container" },
    });
    /** @type {__VLS_StyleScopedClasses['photo-container']} */ ;
    if (__VLS_ctx.student.photo) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
            src: (__VLS_ctx.student.photo),
            ...{ class: "student-photo" },
            alt: "Student photo",
        });
        /** @type {__VLS_StyleScopedClasses['student-photo']} */ ;
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "student-avatar" },
        });
        /** @type {__VLS_StyleScopedClasses['student-avatar']} */ ;
        (__VLS_ctx.getInitials(__VLS_ctx.student.firstName, __VLS_ctx.student.lastName));
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.loading))
                    return;
                if (!!(__VLS_ctx.error))
                    return;
                if (!(__VLS_ctx.student))
                    return;
                __VLS_ctx.showPhotoModal = true;
                // @ts-ignore
                [loading, error, error, loadStudent, student, student, student, student, student, getInitials, showPhotoModal,];
            } },
        ...{ class: "photo-upload-btn" },
        title: "Foto verwalten",
    });
    /** @type {__VLS_StyleScopedClasses['photo-upload-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "student-info" },
    });
    /** @type {__VLS_StyleScopedClasses['student-info']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    (__VLS_ctx.student.firstName);
    (__VLS_ctx.student.lastName);
    if (__VLS_ctx.student.dateOfBirth) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
        (__VLS_ctx.formatDate(__VLS_ctx.student.dateOfBirth));
    }
    if (__VLS_ctx.student.email) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
        (__VLS_ctx.student.email);
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "class-info" },
    });
    /** @type {__VLS_StyleScopedClasses['class-info']} */ ;
    (__VLS_ctx.getClassName(__VLS_ctx.student.classId));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "header-actions" },
    });
    /** @type {__VLS_StyleScopedClasses['header-actions']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.loading))
                    return;
                if (!!(__VLS_ctx.error))
                    return;
                if (!(__VLS_ctx.student))
                    return;
                __VLS_ctx.showEditModal = true;
                // @ts-ignore
                [student, student, student, student, student, student, student, formatDate, getClassName, showEditModal,];
            } },
        ...{ class: "btn-icon" },
        title: "Schüler bearbeiten",
    });
    /** @type {__VLS_StyleScopedClasses['btn-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.confirmDelete) },
        ...{ class: "btn-icon btn-danger" },
        title: "Schüler löschen",
    });
    /** @type {__VLS_StyleScopedClasses['btn-icon']} */ ;
    /** @type {__VLS_StyleScopedClasses['btn-danger']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "card" },
    });
    /** @type {__VLS_StyleScopedClasses['card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    if (__VLS_ctx.attendanceSummary) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "card-content" },
        });
        /** @type {__VLS_StyleScopedClasses['card-content']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "summary-grid" },
        });
        /** @type {__VLS_StyleScopedClasses['summary-grid']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "summary-item" },
        });
        /** @type {__VLS_StyleScopedClasses['summary-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "summary-value" },
        });
        /** @type {__VLS_StyleScopedClasses['summary-value']} */ ;
        (__VLS_ctx.attendanceSummary.total);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "summary-item" },
        });
        /** @type {__VLS_StyleScopedClasses['summary-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "summary-value status-present" },
        });
        /** @type {__VLS_StyleScopedClasses['summary-value']} */ ;
        /** @type {__VLS_StyleScopedClasses['status-present']} */ ;
        (__VLS_ctx.attendanceSummary.present);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "summary-item" },
        });
        /** @type {__VLS_StyleScopedClasses['summary-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "summary-value status-absent" },
        });
        /** @type {__VLS_StyleScopedClasses['summary-value']} */ ;
        /** @type {__VLS_StyleScopedClasses['status-absent']} */ ;
        (__VLS_ctx.attendanceSummary.absent);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "summary-item" },
        });
        /** @type {__VLS_StyleScopedClasses['summary-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "summary-value" },
        });
        /** @type {__VLS_StyleScopedClasses['summary-value']} */ ;
        (__VLS_ctx.attendanceSummary.percentage.toFixed(1));
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "empty-state" },
        });
        /** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "card" },
    });
    /** @type {__VLS_StyleScopedClasses['card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-content" },
    });
    /** @type {__VLS_StyleScopedClasses['card-content']} */ ;
    if (__VLS_ctx.attendanceRecords.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "empty-state" },
        });
        /** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "attendance-list" },
        });
        /** @type {__VLS_StyleScopedClasses['attendance-list']} */ ;
        for (const [record] of __VLS_vFor((__VLS_ctx.attendanceRecords))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                key: (record.id),
                ...{ class: "attendance-record" },
            });
            /** @type {__VLS_StyleScopedClasses['attendance-record']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "record-date" },
            });
            /** @type {__VLS_StyleScopedClasses['record-date']} */ ;
            (__VLS_ctx.formatDate(record.date));
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: (['record-status', `status-${record.status}`]) },
            });
            /** @type {__VLS_StyleScopedClasses['record-status']} */ ;
            (__VLS_ctx.capitalize(record.status));
            if (record.notes) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "record-reason" },
                });
                /** @type {__VLS_StyleScopedClasses['record-reason']} */ ;
                (record.notes);
            }
            // @ts-ignore
            [formatDate, confirmDelete, attendanceSummary, attendanceSummary, attendanceSummary, attendanceSummary, attendanceSummary, attendanceRecords, attendanceRecords, capitalize,];
        }
    }
}
if (__VLS_ctx.showEditModal && __VLS_ctx.student) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (__VLS_ctx.closeEditModal) },
        ...{ class: "modal-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: () => { } },
        ...{ class: "modal" },
    });
    /** @type {__VLS_StyleScopedClasses['modal']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-header" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeEditModal) },
        ...{ class: "modal-close" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-close']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
        ...{ onSubmit: (__VLS_ctx.handleEditStudent) },
        ...{ class: "modal-form" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-form']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        for: "editFirstName",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        id: "editFirstName",
        value: (__VLS_ctx.editForm.firstName),
        type: "text",
        required: true,
        ...{ class: "form-input" },
    });
    /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        for: "editLastName",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        id: "editLastName",
        value: (__VLS_ctx.editForm.lastName),
        type: "text",
        required: true,
        ...{ class: "form-input" },
    });
    /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        for: "editClassId",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        id: "editClassId",
        value: (__VLS_ctx.editForm.classId),
        required: true,
        ...{ class: "form-input" },
        disabled: (!__VLS_ctx.hasClasses),
    });
    /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "",
        disabled: true,
    });
    (__VLS_ctx.hasClasses ? 'Wählen Sie eine Klasse' : 'Keine Klassen verfügbar');
    for (const [classGroup] of __VLS_vFor((__VLS_ctx.classes))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            key: (classGroup.id),
            value: (classGroup.id),
        });
        (classGroup.name);
        // @ts-ignore
        [student, showEditModal, closeEditModal, closeEditModal, handleEditStudent, editForm, editForm, editForm, hasClasses, hasClasses, classes,];
    }
    if (!__VLS_ctx.hasClasses) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({
            ...{ class: "form-hint error-hint" },
        });
        /** @type {__VLS_StyleScopedClasses['form-hint']} */ ;
        /** @type {__VLS_StyleScopedClasses['error-hint']} */ ;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        for: "editDateOfBirth",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        id: "editDateOfBirth",
        type: "date",
        max: (__VLS_ctx.getTodayDateString()),
        ...{ class: "form-input" },
    });
    (__VLS_ctx.editForm.dateOfBirth);
    /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        for: "editEmail",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        id: "editEmail",
        type: "email",
        ...{ class: "form-input" },
    });
    (__VLS_ctx.editForm.email);
    /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
    if (__VLS_ctx.editError) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "error-message" },
        });
        /** @type {__VLS_StyleScopedClasses['error-message']} */ ;
        (__VLS_ctx.editError);
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-actions" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-actions']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeEditModal) },
        type: "button",
        ...{ class: "btn-secondary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        type: "submit",
        disabled: (__VLS_ctx.saving),
        ...{ class: "btn-primary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
    (__VLS_ctx.saving ? 'Wird gespeichert...' : 'Änderungen speichern');
}
if (__VLS_ctx.showPhotoModal && __VLS_ctx.student) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (__VLS_ctx.closePhotoModal) },
        ...{ class: "modal-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: () => { } },
        ...{ class: "modal" },
    });
    /** @type {__VLS_StyleScopedClasses['modal']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-header" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closePhotoModal) },
        ...{ class: "modal-close" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-close']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-form" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-form']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "photo-preview-container" },
    });
    /** @type {__VLS_StyleScopedClasses['photo-preview-container']} */ ;
    if (__VLS_ctx.student.photo || __VLS_ctx.photoPreview) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
            src: (__VLS_ctx.photoPreview || __VLS_ctx.student.photo),
            ...{ class: "photo-preview" },
            alt: "Preview",
        });
        /** @type {__VLS_StyleScopedClasses['photo-preview']} */ ;
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "photo-preview-placeholder" },
        });
        /** @type {__VLS_StyleScopedClasses['photo-preview-placeholder']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        for: "photoInput",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        ...{ onChange: (__VLS_ctx.handlePhotoSelect) },
        id: "photoInput",
        ref: "photoInput",
        type: "file",
        accept: "image/*",
        ...{ class: "form-input" },
    });
    /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({
        ...{ class: "form-hint" },
    });
    /** @type {__VLS_StyleScopedClasses['form-hint']} */ ;
    if (__VLS_ctx.photoError) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "error-message" },
        });
        /** @type {__VLS_StyleScopedClasses['error-message']} */ ;
        (__VLS_ctx.photoError);
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-actions" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-actions']} */ ;
    if (__VLS_ctx.student.photo) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (__VLS_ctx.removePhoto) },
            type: "button",
            ...{ class: "btn-secondary btn-danger" },
        });
        /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
        /** @type {__VLS_StyleScopedClasses['btn-danger']} */ ;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closePhotoModal) },
        type: "button",
        ...{ class: "btn-secondary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
    if (__VLS_ctx.photoPreview) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (__VLS_ctx.savePhoto) },
            type: "button",
            disabled: (__VLS_ctx.saving),
            ...{ class: "btn-primary" },
        });
        /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
        (__VLS_ctx.saving ? 'Wird gespeichert...' : 'Foto speichern');
    }
}
if (__VLS_ctx.showDeleteModal && __VLS_ctx.student) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showDeleteModal && __VLS_ctx.student))
                    return;
                __VLS_ctx.showDeleteModal = false;
                // @ts-ignore
                [student, student, student, student, student, showPhotoModal, closeEditModal, editForm, editForm, hasClasses, getTodayDateString, editError, editError, saving, saving, saving, saving, closePhotoModal, closePhotoModal, closePhotoModal, photoPreview, photoPreview, photoPreview, handlePhotoSelect, photoError, photoError, removePhoto, savePhoto, showDeleteModal, showDeleteModal,];
            } },
        ...{ class: "modal-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: () => { } },
        ...{ class: "modal" },
    });
    /** @type {__VLS_StyleScopedClasses['modal']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-header" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showDeleteModal && __VLS_ctx.student))
                    return;
                __VLS_ctx.showDeleteModal = false;
                // @ts-ignore
                [showDeleteModal,];
            } },
        ...{ class: "modal-close" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-close']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-form" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-form']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "confirmation-text" },
    });
    /** @type {__VLS_StyleScopedClasses['confirmation-text']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.student.firstName);
    (__VLS_ctx.student.lastName);
    if (__VLS_ctx.deleteError) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "error-message" },
        });
        /** @type {__VLS_StyleScopedClasses['error-message']} */ ;
        (__VLS_ctx.deleteError);
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-actions" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-actions']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showDeleteModal && __VLS_ctx.student))
                    return;
                __VLS_ctx.showDeleteModal = false;
                // @ts-ignore
                [student, student, showDeleteModal, deleteError, deleteError,];
            } },
        type: "button",
        ...{ class: "btn-secondary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.handleDelete) },
        type: "button",
        disabled: (__VLS_ctx.saving),
        ...{ class: "btn-primary btn-danger-solid" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
    /** @type {__VLS_StyleScopedClasses['btn-danger-solid']} */ ;
    (__VLS_ctx.saving ? 'Wird gelöscht...' : 'Schüler löschen');
}
if (__VLS_ctx.showRemovePhotoModal && __VLS_ctx.student) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showRemovePhotoModal && __VLS_ctx.student))
                    return;
                __VLS_ctx.showRemovePhotoModal = false;
                // @ts-ignore
                [student, saving, saving, handleDelete, showRemovePhotoModal, showRemovePhotoModal,];
            } },
        ...{ class: "modal-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: () => { } },
        ...{ class: "modal" },
    });
    /** @type {__VLS_StyleScopedClasses['modal']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-header" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showRemovePhotoModal && __VLS_ctx.student))
                    return;
                __VLS_ctx.showRemovePhotoModal = false;
                // @ts-ignore
                [showRemovePhotoModal,];
            } },
        ...{ class: "modal-close" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-close']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-form" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-form']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "confirmation-text" },
    });
    /** @type {__VLS_StyleScopedClasses['confirmation-text']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-actions" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-actions']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showRemovePhotoModal && __VLS_ctx.student))
                    return;
                __VLS_ctx.showRemovePhotoModal = false;
                // @ts-ignore
                [showRemovePhotoModal,];
            } },
        type: "button",
        ...{ class: "btn-secondary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.confirmRemovePhoto) },
        type: "button",
        disabled: (__VLS_ctx.saving),
        ...{ class: "btn-primary btn-danger-solid" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
    /** @type {__VLS_StyleScopedClasses['btn-danger-solid']} */ ;
    (__VLS_ctx.saving ? 'Wird entfernt...' : 'Foto entfernen');
}
// @ts-ignore
[saving, saving, confirmRemovePhoto,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
