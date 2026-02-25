/// <reference types="../../../../node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { getSportBridge } from '../composables/useSportBridge';
const route = useRoute();
const SportBridge = getSportBridge();
// State
const classes = ref([]);
const lessons = ref([]);
const classGroup = ref(null);
const loading = ref(false);
const saving = ref(false);
const error = ref('');
const saveError = ref('');
const selectedClassId = ref('');
const dateFrom = ref('');
const dateTo = ref('');
const showCreateLessonModal = ref(false);
const showEditLessonModal = ref(false);
const lessonForm = ref({
    classGroupId: '',
    date: new Date().toISOString().split('T')[0],
    time: '08:00'
});
// Computed
const filteredLessons = computed(() => {
    let filtered = lessons.value;
    if (selectedClassId.value) {
        filtered = filtered.filter(l => l.classGroupId === selectedClassId.value);
    }
    if (dateFrom.value) {
        const fromDate = new Date(dateFrom.value);
        filtered = filtered.filter(l => l.date >= fromDate);
    }
    if (dateTo.value) {
        const toDate = new Date(dateTo.value);
        toDate.setHours(23, 59, 59, 999);
        filtered = filtered.filter(l => l.date <= toDate);
    }
    // Sort by date descending
    return filtered.sort((a, b) => b.date.getTime() - a.date.getTime());
});
// Methods
const loadData = async () => {
    loading.value = true;
    error.value = '';
    try {
        // Load all classes
        classes.value = await SportBridge.classGroupRepository.findAll();
        // If classId is in route, load that class specifically
        const classIdFromRoute = route.query.classId;
        if (classIdFromRoute) {
            selectedClassId.value = classIdFromRoute;
            classGroup.value = await SportBridge.classGroupRepository.findById(classIdFromRoute);
            lessons.value = await SportBridge.lessonRepository.findByClassGroup(classIdFromRoute);
        }
        else {
            // Load all lessons for all classes
            const allLessons = [];
            for (const cls of classes.value) {
                const classLessons = await SportBridge.lessonRepository.findByClassGroup(cls.id);
                allLessons.push(...classLessons);
            }
            lessons.value = allLessons;
        }
    }
    catch (err) {
        console.error('Failed to load lessons:', err);
        error.value = 'Fehler beim Laden der Stunden';
    }
    finally {
        loading.value = false;
    }
};
const onClassChange = async () => {
    if (!selectedClassId.value) {
        lessons.value = [];
        const allLessons = [];
        for (const cls of classes.value) {
            const classLessons = await SportBridge.lessonRepository.findByClassGroup(cls.id);
            allLessons.push(...classLessons);
        }
        lessons.value = allLessons;
    }
    else {
        lessons.value = await SportBridge.lessonRepository.findByClassGroup(selectedClassId.value);
    }
};
const onDateFilterChange = () => {
    // Filtering happens automatically via computed property
};
const handleEditLesson = (lesson) => {
    lessonForm.value = {
        id: lesson.id,
        classGroupId: lesson.classGroupId,
        date: lesson.date.toISOString().split('T')[0],
        time: lesson.date.toTimeString().split(' ')[0].substring(0, 5)
    };
    showEditLessonModal.value = true;
};
const handleDeleteLesson = async (lessonId) => {
    if (!confirm('Möchten Sie diese Stunde wirklich löschen?')) {
        return;
    }
    try {
        await SportBridge.lessonRepository.delete(lessonId);
        await loadData();
    }
    catch (err) {
        console.error('Failed to delete lesson:', err);
        error.value = 'Fehler beim Löschen der Stunde';
    }
};
const handleSaveLesson = async () => {
    saveError.value = '';
    saving.value = true;
    try {
        // Combine date and time
        const dateTime = new Date(`${lessonForm.value.date}T${lessonForm.value.time}:00`);
        if (showEditLessonModal.value && lessonForm.value.id) {
            // Update existing lesson
            await SportBridge.lessonRepository.update(lessonForm.value.id, {
                date: dateTime
            });
        }
        else {
            // Create new lesson
            await SportBridge.createLessonUseCase.execute({
                classGroupId: lessonForm.value.classGroupId,
                date: dateTime
            });
        }
        closeModals();
        await loadData();
    }
    catch (err) {
        console.error('Failed to save lesson:', err);
        if (err instanceof Error) {
            saveError.value = err.message;
        }
        else {
            saveError.value = 'Fehler beim Speichern der Stunde';
        }
    }
    finally {
        saving.value = false;
    }
};
const closeModals = () => {
    showCreateLessonModal.value = false;
    showEditLessonModal.value = false;
    saveError.value = '';
    lessonForm.value = {
        classGroupId: selectedClassId.value || '',
        date: new Date().toISOString().split('T')[0],
        time: '08:00'
    };
};
const getClassName = (classGroupId) => {
    const cls = classes.value.find(c => c.id === classGroupId);
    return cls ? cls.name : 'Unbekannt';
};
const formatDay = (date) => {
    return date.getDate().toString().padStart(2, '0');
};
const formatMonth = (date) => {
    const months = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
    return months[date.getMonth()];
};
const formatTime = (date) => {
    return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
};
// Lifecycle
onMounted(async () => {
    await loadData();
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
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-input']} */ ;
/** @type {__VLS_StyleScopedClasses['lesson-card']} */ ;
/** @type {__VLS_StyleScopedClasses['lesson-info']} */ ;
/** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-close']} */ ;
/** @type {__VLS_StyleScopedClasses['form-input']} */ ;
/** @type {__VLS_StyleScopedClasses['header-content']} */ ;
/** @type {__VLS_StyleScopedClasses['filters']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-group']} */ ;
/** @type {__VLS_StyleScopedClasses['lesson-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['lesson-card']} */ ;
/** @type {__VLS_StyleScopedClasses['lesson-actions']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "lesson-list-view" },
});
/** @type {__VLS_StyleScopedClasses['lesson-list-view']} */ ;
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
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "header-content" },
});
/** @type {__VLS_StyleScopedClasses['header-content']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
(__VLS_ctx.classGroup ? `- ${__VLS_ctx.classGroup.name}` : '');
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "page-description" },
});
/** @type {__VLS_StyleScopedClasses['page-description']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.showCreateLessonModal = true;
            // @ts-ignore
            [classGroup, classGroup, showCreateLessonModal,];
        } },
    ...{ class: "btn-primary" },
});
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
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
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "card filters-card" },
    });
    /** @type {__VLS_StyleScopedClasses['card']} */ ;
    /** @type {__VLS_StyleScopedClasses['filters-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "filters" },
    });
    /** @type {__VLS_StyleScopedClasses['filters']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "filter-group" },
    });
    /** @type {__VLS_StyleScopedClasses['filter-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        for: "class-filter",
        ...{ class: "filter-label" },
    });
    /** @type {__VLS_StyleScopedClasses['filter-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        ...{ onChange: (__VLS_ctx.onClassChange) },
        id: "class-filter",
        value: (__VLS_ctx.selectedClassId),
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
        (cls.schoolYear);
        // @ts-ignore
        [loading, error, error, loadData, onClassChange, selectedClassId, classes,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "filter-group" },
    });
    /** @type {__VLS_StyleScopedClasses['filter-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        for: "date-from",
        ...{ class: "filter-label" },
    });
    /** @type {__VLS_StyleScopedClasses['filter-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        ...{ onChange: (__VLS_ctx.onDateFilterChange) },
        id: "date-from",
        type: "date",
        ...{ class: "filter-input" },
    });
    (__VLS_ctx.dateFrom);
    /** @type {__VLS_StyleScopedClasses['filter-input']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "filter-group" },
    });
    /** @type {__VLS_StyleScopedClasses['filter-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        for: "date-to",
        ...{ class: "filter-label" },
    });
    /** @type {__VLS_StyleScopedClasses['filter-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        ...{ onChange: (__VLS_ctx.onDateFilterChange) },
        id: "date-to",
        type: "date",
        ...{ class: "filter-input" },
    });
    (__VLS_ctx.dateTo);
    /** @type {__VLS_StyleScopedClasses['filter-input']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "card" },
    });
    /** @type {__VLS_StyleScopedClasses['card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    (__VLS_ctx.filteredLessons.length);
    if (__VLS_ctx.filteredLessons.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "empty-state" },
        });
        /** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
        (__VLS_ctx.selectedClassId ? 'Erstellen Sie die erste Stunde für diese Klasse.' : 'Wählen Sie eine Klasse und erstellen Sie eine Stunde.');
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "lessons-list" },
        });
        /** @type {__VLS_StyleScopedClasses['lessons-list']} */ ;
        for (const [lesson] of __VLS_vFor((__VLS_ctx.filteredLessons))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                key: (lesson.id),
                ...{ class: "lesson-card" },
            });
            /** @type {__VLS_StyleScopedClasses['lesson-card']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "lesson-main" },
            });
            /** @type {__VLS_StyleScopedClasses['lesson-main']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "lesson-date" },
            });
            /** @type {__VLS_StyleScopedClasses['lesson-date']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "lesson-day" },
            });
            /** @type {__VLS_StyleScopedClasses['lesson-day']} */ ;
            (__VLS_ctx.formatDay(lesson.date));
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "lesson-month" },
            });
            /** @type {__VLS_StyleScopedClasses['lesson-month']} */ ;
            (__VLS_ctx.formatMonth(lesson.date));
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "lesson-info" },
            });
            /** @type {__VLS_StyleScopedClasses['lesson-info']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({});
            (__VLS_ctx.getClassName(lesson.classGroupId));
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "lesson-time" },
            });
            /** @type {__VLS_StyleScopedClasses['lesson-time']} */ ;
            (__VLS_ctx.formatTime(lesson.date));
            if (lesson.lessonParts && lesson.lessonParts.length > 0) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "lesson-parts" },
                });
                /** @type {__VLS_StyleScopedClasses['lesson-parts']} */ ;
                for (const [part, idx] of __VLS_vFor((lesson.lessonParts))) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        key: (part.id),
                        ...{ class: "lesson-part" },
                    });
                    /** @type {__VLS_StyleScopedClasses['lesson-part']} */ ;
                    (part.description);
                    (idx < lesson.lessonParts.length - 1 ? ', ' : '');
                    // @ts-ignore
                    [selectedClassId, onDateFilterChange, onDateFilterChange, dateFrom, dateTo, filteredLessons, filteredLessons, filteredLessons, formatDay, formatMonth, getClassName, formatTime,];
                }
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "lesson-actions" },
            });
            /** @type {__VLS_StyleScopedClasses['lesson-actions']} */ ;
            let __VLS_0;
            /** @ts-ignore @type {typeof __VLS_components.RouterLink | typeof __VLS_components.RouterLink} */
            RouterLink;
            // @ts-ignore
            const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
                to: (`/attendance?classId=${lesson.classGroupId}&lessonId=${lesson.id}`),
                ...{ class: "action-btn action-btn-attendance" },
                title: "Anwesenheit erfassen",
            }));
            const __VLS_2 = __VLS_1({
                to: (`/attendance?classId=${lesson.classGroupId}&lessonId=${lesson.id}`),
                ...{ class: "action-btn action-btn-attendance" },
                title: "Anwesenheit erfassen",
            }, ...__VLS_functionalComponentArgsRest(__VLS_1));
            /** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
            /** @type {__VLS_StyleScopedClasses['action-btn-attendance']} */ ;
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
                        if (!!(__VLS_ctx.filteredLessons.length === 0))
                            return;
                        __VLS_ctx.handleEditLesson(lesson);
                        // @ts-ignore
                        [handleEditLesson,];
                    } },
                ...{ class: "action-btn action-btn-edit" },
                title: "Stunde bearbeiten",
            });
            /** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
            /** @type {__VLS_StyleScopedClasses['action-btn-edit']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!!(__VLS_ctx.error))
                            return;
                        if (!!(__VLS_ctx.filteredLessons.length === 0))
                            return;
                        __VLS_ctx.handleDeleteLesson(lesson.id);
                        // @ts-ignore
                        [handleDeleteLesson,];
                    } },
                ...{ class: "action-btn action-btn-delete" },
                title: "Stunde löschen",
            });
            /** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
            /** @type {__VLS_StyleScopedClasses['action-btn-delete']} */ ;
            // @ts-ignore
            [];
        }
    }
}
if (__VLS_ctx.showCreateLessonModal || __VLS_ctx.showEditLessonModal) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (__VLS_ctx.closeModals) },
        ...{ class: "modal-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal" },
    });
    /** @type {__VLS_StyleScopedClasses['modal']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-header" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    (__VLS_ctx.showEditLessonModal ? 'Stunde bearbeiten' : 'Neue Stunde');
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeModals) },
        ...{ class: "modal-close" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-close']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-content" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-content']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        for: "lesson-class",
        ...{ class: "form-label" },
    });
    /** @type {__VLS_StyleScopedClasses['form-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        id: "lesson-class",
        value: (__VLS_ctx.lessonForm.classGroupId),
        ...{ class: "form-input" },
        disabled: (__VLS_ctx.showEditLessonModal),
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
        (cls.schoolYear);
        // @ts-ignore
        [showCreateLessonModal, classes, showEditLessonModal, showEditLessonModal, showEditLessonModal, closeModals, closeModals, lessonForm,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        for: "lesson-date",
        ...{ class: "form-label" },
    });
    /** @type {__VLS_StyleScopedClasses['form-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        id: "lesson-date",
        type: "date",
        ...{ class: "form-input" },
    });
    (__VLS_ctx.lessonForm.date);
    /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        for: "lesson-time",
        ...{ class: "form-label" },
    });
    /** @type {__VLS_StyleScopedClasses['form-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        id: "lesson-time",
        type: "time",
        ...{ class: "form-input" },
    });
    (__VLS_ctx.lessonForm.time);
    /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
    if (__VLS_ctx.saveError) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "error-message" },
        });
        /** @type {__VLS_StyleScopedClasses['error-message']} */ ;
        (__VLS_ctx.saveError);
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-footer" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-footer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeModals) },
        ...{ class: "btn-secondary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.handleSaveLesson) },
        ...{ class: "btn-primary" },
        disabled: (!__VLS_ctx.lessonForm.classGroupId || !__VLS_ctx.lessonForm.date || __VLS_ctx.saving),
    });
    /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
    (__VLS_ctx.saving ? 'Wird gespeichert...' : (__VLS_ctx.showEditLessonModal ? 'Speichern' : 'Erstellen'));
}
// @ts-ignore
[showEditLessonModal, closeModals, lessonForm, lessonForm, lessonForm, lessonForm, saveError, saveError, handleSaveLesson, saving, saving,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
