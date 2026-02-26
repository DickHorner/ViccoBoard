/// <reference types="../../../../node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useSportBridge } from '../composables/useSportBridge';
import { useStudents } from '../composables/useStudentsBridge';
import { useToast } from '../composables/useToast';
const route = useRoute();
const { SportBridge } = useSportBridge();
const { repository: studentRepository } = useStudents();
const toast = useToast();
const categoryId = route.params.id;
const category = ref(null);
const students = ref([]);
const timeEntries = ref(new Map());
const comments = ref(new Map());
const loading = ref(true);
const saving = ref(false);
const error = ref(null);
const hasUnsavedChanges = ref(false);
const unsavedStudents = ref(new Set());
const showCommentModal = ref(false);
const currentCommentStudentId = ref(null);
const currentComment = ref('');
const config = computed(() => {
    if (!category.value)
        return null;
    return category.value.configuration;
});
onMounted(async () => {
    await loadData();
});
async function loadData() {
    loading.value = true;
    error.value = null;
    try {
        // Load category
        category.value = await SportBridge.value.gradeCategoryRepository.read(categoryId);
        if (!category.value) {
            error.value = 'Kategorie nicht gefunden';
            return;
        }
        // Load students
        students.value = await studentRepository.value?.findByClassGroup(category.value.classGroupId) ?? [];
        // Load existing times
        for (const student of students.value) {
            const entries = await SportBridge.value.performanceEntryRepository
                .findByStudentAndCategory(student.id, categoryId);
            if (entries.length > 0) {
                const latestEntry = entries[entries.length - 1];
                if (latestEntry.measurements?.time) {
                    timeEntries.value.set(student.id, formatSecondsToTime(latestEntry.measurements.time));
                }
                if (latestEntry.comment) {
                    comments.value.set(student.id, latestEntry.comment);
                }
            }
        }
    }
    catch (err) {
        console.error('Failed to load grading data:', err);
        error.value = 'Fehler beim Laden der Daten';
    }
    finally {
        loading.value = false;
    }
}
function getTimeValue(studentId) {
    return timeEntries.value.get(studentId) || '';
}
function getSecondsValue(studentId) {
    const time = timeEntries.value.get(studentId);
    if (!time)
        return '';
    const seconds = parseTimeToSeconds(time);
    if (seconds === null)
        return '';
    return seconds.toFixed(2) + 's';
}
function parseTimeToSeconds(timeStr) {
    // Parse MM:SS.MS or SS.MS format
    const parts = timeStr.split(':');
    let minutes = 0;
    let seconds = 0;
    if (parts.length === 2) {
        // MM:SS.MS format
        minutes = parseFloat(parts[0]);
        seconds = parseFloat(parts[1]);
    }
    else if (parts.length === 1) {
        // SS.MS format
        seconds = parseFloat(parts[0]);
    }
    else {
        return null;
    }
    if (isNaN(minutes) || isNaN(seconds))
        return null;
    return minutes * 60 + seconds;
}
function formatSecondsToTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(2);
    if (mins > 0) {
        const [secIntPart, secFracPart] = secs.split('.');
        const paddedIntPart = secIntPart.length < 2 ? secIntPart.padStart(2, '0') : secIntPart;
        const formattedSecs = `${paddedIntPart}.${secFracPart ?? '00'}`;
        return `${mins}:${formattedSecs}`;
    }
    return secs;
}
function getCalculatedGrade(studentId) {
    const time = timeEntries.value.get(studentId);
    if (!time)
        return null;
    const seconds = parseTimeToSeconds(time);
    if (seconds === null || !config.value)
        return null;
    const cfg = config.value;
    const rawBoundaries = Array.isArray(cfg.customBoundaries) ? cfg.customBoundaries : [];
    const boundaries = rawBoundaries
        .filter((b) => typeof b?.timeSeconds === 'number' && typeof b?.grade === 'number')
        .slice()
        .sort((a, b) => a.timeSeconds - b.timeSeconds);
    const linearMapping = cfg.linearMapping !== false;
    const bestGrade = Number(cfg.bestGrade);
    const worstGrade = Number(cfg.worstGrade);
    // If we have custom boundaries and linear mapping is disabled, use step-wise thresholds.
    if (!linearMapping && boundaries.length > 0) {
        // Faster or equal to the best boundary time gets the best boundary grade.
        if (seconds <= boundaries[0].timeSeconds) {
            return String(boundaries[0].grade);
        }
        const lastBoundary = boundaries[boundaries.length - 1];
        // Slower or equal to the worst boundary time gets the worst boundary grade.
        if (seconds >= lastBoundary.timeSeconds) {
            return String(lastBoundary.grade);
        }
        // Otherwise, find the first boundary that the time is better than or equal to.
        for (let i = 1; i < boundaries.length; i += 1) {
            const boundary = boundaries[i];
            if (seconds <= boundary.timeSeconds) {
                return String(boundary.grade);
            }
        }
    }
    // Linear interpolation between best and worst grade.
    // Derive best and worst times from custom boundaries if available, otherwise fall back.
    let bestTime;
    let worstTime;
    if (boundaries.length >= 2) {
        bestTime = boundaries[0].timeSeconds;
        worstTime = boundaries[boundaries.length - 1].timeSeconds;
    }
    else {
        // Fallback to placeholder values if no valid boundaries are configured.
        bestTime = 60;
        worstTime = 300;
    }
    if (seconds <= bestTime)
        return String(bestGrade);
    if (seconds >= worstTime)
        return String(worstGrade);
    const ratio = (seconds - bestTime) / (worstTime - bestTime);
    const grade = bestGrade + ratio * (worstGrade - bestGrade);
    return grade.toFixed(1);
}
function onTimeChange(studentId, newTime) {
    timeEntries.value.set(studentId, newTime);
    hasUnsavedChanges.value = true;
    unsavedStudents.value.add(studentId);
}
function hasUnsavedChangesForStudent(studentId) {
    return unsavedStudents.value.has(studentId);
}
async function saveStudentTime(studentId) {
    if (!unsavedStudents.value.has(studentId))
        return;
    const timeStr = timeEntries.value.get(studentId);
    if (!timeStr)
        return;
    const seconds = parseTimeToSeconds(timeStr);
    if (seconds === null) {
        toast.error('Ungültiges Zeitformat. Verwenden Sie MM:SS.MS oder SS.MS');
        return;
    }
    saving.value = true;
    try {
        await SportBridge.value.recordGradeUseCase.execute({
            studentId,
            categoryId,
            measurements: { time: seconds },
            calculatedGrade: getCalculatedGrade(studentId) || undefined,
            comment: comments.value.get(studentId)
        });
        unsavedStudents.value.delete(studentId);
        if (unsavedStudents.value.size === 0) {
            hasUnsavedChanges.value = false;
        }
    }
    catch (err) {
        console.error('Failed to save time:', err);
        toast.error('Fehler beim Speichern der Zeit');
    }
    finally {
        saving.value = false;
    }
}
async function saveAllTimes() {
    saving.value = true;
    try {
        for (const studentId of unsavedStudents.value) {
            await saveStudentTime(studentId);
        }
        toast.success('Alle Zeiten gespeichert!');
    }
    catch (err) {
        console.error('Failed to save all times:', err);
        toast.error('Fehler beim Speichern einiger Zeiten');
    }
    finally {
        saving.value = false;
    }
}
function addComment(studentId) {
    currentCommentStudentId.value = studentId;
    currentComment.value = comments.value.get(studentId) || '';
    showCommentModal.value = true;
}
async function saveComment() {
    if (!currentCommentStudentId.value)
        return;
    comments.value.set(currentCommentStudentId.value, currentComment.value);
    unsavedStudents.value.add(currentCommentStudentId.value);
    hasUnsavedChanges.value = true;
    await saveStudentTime(currentCommentStudentId.value);
    showCommentModal.value = false;
    currentCommentStudentId.value = null;
    currentComment.value = '';
}
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['page-header']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['info-item']} */ ;
/** @type {__VLS_StyleScopedClasses['info-item']} */ ;
/** @type {__VLS_StyleScopedClasses['time-table']} */ ;
/** @type {__VLS_StyleScopedClasses['time-table']} */ ;
/** @type {__VLS_StyleScopedClasses['time-table']} */ ;
/** @type {__VLS_StyleScopedClasses['time-input']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['time-table']} */ ;
/** @type {__VLS_StyleScopedClasses['time-input']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "time-grading-view" },
});
/** @type {__VLS_StyleScopedClasses['time-grading-view']} */ ;
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
(__VLS_ctx.category?.name || 'Zeitbasierte Bewertung');
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
        ...{ onClick: (__VLS_ctx.loadData) },
        ...{ class: "btn-primary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
}
else if (__VLS_ctx.category) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "grading-content" },
    });
    /** @type {__VLS_StyleScopedClasses['grading-content']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "card" },
    });
    /** @type {__VLS_StyleScopedClasses['card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-grid" },
    });
    /** @type {__VLS_StyleScopedClasses['info-grid']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-item" },
    });
    /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-item" },
    });
    /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.config.bestGrade);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-item" },
    });
    /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.config.worstGrade);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-item" },
    });
    /** @type {__VLS_StyleScopedClasses['info-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.config.linearMapping ? 'Linear' : 'Benutzerdefiniert');
    if (__VLS_ctx.students.length > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
            ...{ class: "card" },
        });
        /** @type {__VLS_StyleScopedClasses['card']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "card-header" },
        });
        /** @type {__VLS_StyleScopedClasses['card-header']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "header-actions" },
        });
        /** @type {__VLS_StyleScopedClasses['header-actions']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (__VLS_ctx.saveAllTimes) },
            ...{ class: "btn-primary btn-small" },
            disabled: (__VLS_ctx.saving || !__VLS_ctx.hasUnsavedChanges),
        });
        /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
        /** @type {__VLS_StyleScopedClasses['btn-small']} */ ;
        (__VLS_ctx.saving ? 'Speichern...' : 'Alle speichern');
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "card-content" },
        });
        /** @type {__VLS_StyleScopedClasses['card-content']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "info-note" },
        });
        /** @type {__VLS_StyleScopedClasses['info-note']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "time-table-wrapper" },
        });
        /** @type {__VLS_StyleScopedClasses['time-table-wrapper']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
            ...{ class: "time-table" },
        });
        /** @type {__VLS_StyleScopedClasses['time-table']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
            ...{ class: "student-col" },
        });
        /** @type {__VLS_StyleScopedClasses['student-col']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
            ...{ class: "time-col" },
        });
        /** @type {__VLS_StyleScopedClasses['time-col']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
            ...{ class: "seconds-col" },
        });
        /** @type {__VLS_StyleScopedClasses['seconds-col']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
            ...{ class: "grade-col" },
        });
        /** @type {__VLS_StyleScopedClasses['grade-col']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
            ...{ class: "actions-col" },
        });
        /** @type {__VLS_StyleScopedClasses['actions-col']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
        for (const [student] of __VLS_vFor((__VLS_ctx.students))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
                key: (student.id),
                ...{ class: ({ 'highlight-row': __VLS_ctx.hasUnsavedChangesForStudent(student.id) }) },
            });
            /** @type {__VLS_StyleScopedClasses['highlight-row']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "student-name" },
            });
            /** @type {__VLS_StyleScopedClasses['student-name']} */ ;
            (student.firstName);
            (student.lastName);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "input-cell" },
            });
            /** @type {__VLS_StyleScopedClasses['input-cell']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                ...{ onInput: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!!(__VLS_ctx.error))
                            return;
                        if (!(__VLS_ctx.category))
                            return;
                        if (!(__VLS_ctx.students.length > 0))
                            return;
                        __VLS_ctx.onTimeChange(student.id, $event.target.value);
                        // @ts-ignore
                        [category, category, loading, error, error, loadData, config, config, config, students, students, saveAllTimes, saving, saving, hasUnsavedChanges, hasUnsavedChangesForStudent, onTimeChange,];
                    } },
                ...{ onBlur: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!!(__VLS_ctx.error))
                            return;
                        if (!(__VLS_ctx.category))
                            return;
                        if (!(__VLS_ctx.students.length > 0))
                            return;
                        __VLS_ctx.saveStudentTime(student.id);
                        // @ts-ignore
                        [saveStudentTime,];
                    } },
                type: "text",
                value: (__VLS_ctx.getTimeValue(student.id)),
                placeholder: "MM:SS.MS",
                ...{ class: "time-input" },
                disabled: (__VLS_ctx.saving),
            });
            /** @type {__VLS_StyleScopedClasses['time-input']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "seconds-cell" },
            });
            /** @type {__VLS_StyleScopedClasses['seconds-cell']} */ ;
            (__VLS_ctx.getSecondsValue(student.id) || '—');
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "grade-cell" },
            });
            /** @type {__VLS_StyleScopedClasses['grade-cell']} */ ;
            if (__VLS_ctx.getCalculatedGrade(student.id)) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "calculated-grade" },
                });
                /** @type {__VLS_StyleScopedClasses['calculated-grade']} */ ;
                (__VLS_ctx.getCalculatedGrade(student.id));
            }
            else {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "grade-missing" },
                });
                /** @type {__VLS_StyleScopedClasses['grade-missing']} */ ;
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "actions-cell" },
            });
            /** @type {__VLS_StyleScopedClasses['actions-cell']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!!(__VLS_ctx.error))
                            return;
                        if (!(__VLS_ctx.category))
                            return;
                        if (!(__VLS_ctx.students.length > 0))
                            return;
                        __VLS_ctx.addComment(student.id);
                        // @ts-ignore
                        [saving, getTimeValue, getSecondsValue, getCalculatedGrade, getCalculatedGrade, addComment,];
                    } },
                ...{ class: "btn-text-small" },
                title: ('Kommentar hinzufügen'),
            });
            /** @type {__VLS_StyleScopedClasses['btn-text-small']} */ ;
            // @ts-ignore
            [];
        }
    }
    if (__VLS_ctx.students.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
            ...{ class: "card" },
        });
        /** @type {__VLS_StyleScopedClasses['card']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "empty-state" },
        });
        /** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    }
}
if (__VLS_ctx.showCommentModal) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showCommentModal))
                    return;
                __VLS_ctx.showCommentModal = false;
                // @ts-ignore
                [students, showCommentModal, showCommentModal,];
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
                if (!(__VLS_ctx.showCommentModal))
                    return;
                __VLS_ctx.showCommentModal = false;
                // @ts-ignore
                [showCommentModal,];
            } },
        ...{ class: "close-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['close-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-content" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-content']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
        ...{ onSubmit: (__VLS_ctx.saveComment) },
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        for: "comment-text",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.textarea, __VLS_intrinsics.textarea)({
        id: "comment-text",
        value: (__VLS_ctx.currentComment),
        rows: "5",
        placeholder: "Fügen Sie einen Kommentar hinzu...",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-actions" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-actions']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showCommentModal))
                    return;
                __VLS_ctx.showCommentModal = false;
                // @ts-ignore
                [showCommentModal, saveComment, currentComment,];
            } },
        type: "button",
        ...{ class: "btn-secondary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        type: "submit",
        ...{ class: "btn-primary" },
        disabled: (__VLS_ctx.saving),
    });
    /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
    (__VLS_ctx.saving ? 'Speichern...' : 'Speichern');
}
// @ts-ignore
[saving, saving,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
