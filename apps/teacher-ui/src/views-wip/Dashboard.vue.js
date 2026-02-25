/// <reference types="../../../../node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { ref, computed, onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import { useClassGroups, useAttendance } from '../composables/useSportBridge';
// State
const classes = ref([]);
const recentActivity = ref([]);
const loading = ref(true);
const loadError = ref('');
const searchQuery = ref('');
const showCreateModal = ref(false);
const creating = ref(false);
const error = ref('');
const newClass = ref({
    name: '',
    schoolYear: ''
});
// Edit state
const showEditModal = ref(false);
const editClassData = ref({ id: '', name: '', schoolYear: '' });
const editError = ref('');
const updating = ref(false);
// Delete state
const showDeleteModal = ref(false);
const classToDelete = ref(null);
const deleteError = ref('');
const deleting = ref(false);
// Composables
const classGroups = useClassGroups();
const attendance = useAttendance();
// Computed
const filteredClasses = computed(() => {
    if (!searchQuery.value) {
        return classes.value;
    }
    const query = searchQuery.value.toLowerCase();
    return classes.value.filter((cls) => cls.name.toLowerCase().includes(query) ||
        cls.schoolYear.toLowerCase().includes(query));
});
// Methods
const loadData = async () => {
    loading.value = true;
    loadError.value = '';
    try {
        classes.value = await classGroups.getAll();
        recentActivity.value = await attendance.getRecent(5);
    }
    catch (err) {
        console.error('Failed to load data:', err);
        loadError.value = 'Fehler beim Laden der Übersichtsdaten. Bitte aktualisieren Sie die Seite.';
    }
    finally {
        loading.value = false;
    }
};
const handleCreateClass = async () => {
    error.value = '';
    creating.value = true;
    try {
        await classGroups.create({
            name: newClass.value.name.trim(),
            schoolYear: newClass.value.schoolYear.trim()
        });
        // Reload classes
        await loadData();
        // Reset form and close modal
        newClass.value = { name: '', schoolYear: '' };
        showCreateModal.value = false;
    }
    catch (err) {
        console.error('Failed to create class:', err);
        if (err instanceof Error) {
            // Check for specific error types
            if (err.message.includes('already exists')) {
                error.value = 'Eine Klasse mit diesem Namen existiert bereits für dieses Schuljahr.';
            }
            else if (err.message.includes('name is required')) {
                error.value = 'Bitte geben Sie einen Klassennamen ein.';
            }
            else if (err.message.includes('School year')) {
                error.value = 'Bitte geben Sie ein gültiges Schuljahr im Format YYYY/YYYY ein (z.B. 2025/2026).';
            }
            else {
                error.value = err.message;
            }
        }
        else {
            error.value = 'Fehler beim Erstellen der Klasse. Bitte versuchen Sie es erneut.';
        }
    }
    finally {
        creating.value = false;
    }
};
const closeModal = () => {
    showCreateModal.value = false;
    error.value = '';
    newClass.value = { name: '', schoolYear: '' };
};
const editClass = (cls) => {
    editClassData.value = {
        id: cls.id,
        name: cls.name,
        schoolYear: cls.schoolYear
    };
    showEditModal.value = true;
};
const handleUpdateClass = async () => {
    editError.value = '';
    updating.value = true;
    try {
        await classGroups.update(editClassData.value.id, {
            name: editClassData.value.name.trim(),
            schoolYear: editClassData.value.schoolYear.trim()
        });
        // Reload classes
        await loadData();
        // Close modal
        showEditModal.value = false;
    }
    catch (err) {
        console.error('Failed to update class:', err);
        editError.value = err instanceof Error ? err.message : 'Failed to update class';
    }
    finally {
        updating.value = false;
    }
};
const closeEditModal = () => {
    showEditModal.value = false;
    editError.value = '';
    editClassData.value = { id: '', name: '', schoolYear: '' };
};
const confirmDeleteClass = (cls) => {
    classToDelete.value = cls;
    showDeleteModal.value = true;
};
const handleDeleteClass = async () => {
    if (!classToDelete.value)
        return;
    deleteError.value = '';
    deleting.value = true;
    try {
        await classGroups.remove(classToDelete.value.id);
        // Reload classes
        await loadData();
        // Close modal
        showDeleteModal.value = false;
        classToDelete.value = null;
    }
    catch (err) {
        console.error('Failed to delete class:', err);
        deleteError.value = err instanceof Error ? err.message : 'Failed to delete class';
    }
    finally {
        deleting.value = false;
    }
};
const closeDeleteModal = () => {
    showDeleteModal.value = false;
    deleteError.value = '';
    classToDelete.value = null;
};
const getActivityIcon = (status) => {
    const icons = {
        present: '✓',
        absent: '✗',
        excused: '📋',
        late: '⏰'
    };
    return icons[status] || '•';
};
const formatDate = (date) => {
    const now = new Date();
    const recordDate = new Date(date);
    const diffMs = now.getTime() - recordDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1)
        return 'Eben eben';
    if (diffMins < 60)
        return `vor ${diffMins} Minute${diffMins > 1 ? 'n' : ''}`;
    if (diffHours < 24)
        return `vor ${diffHours} Stunde${diffHours > 1 ? 'n' : ''}`;
    if (diffDays < 7)
        return `vor ${diffDays} Tag${diffDays > 1 ? 'en' : ''}`;
    return recordDate.toLocaleDateString();
};
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
/** @type {__VLS_StyleScopedClasses['page-header']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['card-header']} */ ;
/** @type {__VLS_StyleScopedClasses['search-input']} */ ;
/** @type {__VLS_StyleScopedClasses['error-state']} */ ;
/** @type {__VLS_StyleScopedClasses['class-card']} */ ;
/** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-danger']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-danger']} */ ;
/** @type {__VLS_StyleScopedClasses['action-button']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-close']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-content']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['form-input']} */ ;
/** @type {__VLS_StyleScopedClasses['dashboard-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['page-header']} */ ;
/** @type {__VLS_StyleScopedClasses['card-header']} */ ;
/** @type {__VLS_StyleScopedClasses['modal']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-actions']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "dashboard-view" },
});
/** @type {__VLS_StyleScopedClasses['dashboard-view']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "page-header" },
});
/** @type {__VLS_StyleScopedClasses['page-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "page-description" },
});
/** @type {__VLS_StyleScopedClasses['page-description']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "dashboard-grid" },
});
/** @type {__VLS_StyleScopedClasses['dashboard-grid']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
    ...{ class: "card classes-card" },
});
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['classes-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "card-header" },
});
/** @type {__VLS_StyleScopedClasses['card-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.showCreateModal = true;
            // @ts-ignore
            [showCreateModal,];
        } },
    ...{ class: "btn-primary btn-small" },
});
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-small']} */ ;
if (__VLS_ctx.classes.length > 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "search-bar" },
    });
    /** @type {__VLS_StyleScopedClasses['search-bar']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        value: (__VLS_ctx.searchQuery),
        type: "text",
        placeholder: "Klassen durchsuchen...",
        ...{ class: "search-input" },
    });
    /** @type {__VLS_StyleScopedClasses['search-input']} */ ;
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "card-content" },
});
/** @type {__VLS_StyleScopedClasses['card-content']} */ ;
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
else if (__VLS_ctx.loadError) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "error-state" },
    });
    /** @type {__VLS_StyleScopedClasses['error-state']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    (__VLS_ctx.loadError);
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.loadData) },
        ...{ class: "btn-primary btn-small" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
    /** @type {__VLS_StyleScopedClasses['btn-small']} */ ;
}
else if (__VLS_ctx.filteredClasses.length === 0 && __VLS_ctx.searchQuery === '') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "empty-state" },
    });
    /** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
}
else if (__VLS_ctx.filteredClasses.length === 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "empty-state" },
    });
    /** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    (__VLS_ctx.searchQuery);
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "class-list" },
    });
    /** @type {__VLS_StyleScopedClasses['class-list']} */ ;
    for (const [cls] of __VLS_vFor((__VLS_ctx.filteredClasses))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            key: (cls.id),
            ...{ class: "class-card-wrapper" },
        });
        /** @type {__VLS_StyleScopedClasses['class-card-wrapper']} */ ;
        let __VLS_0;
        /** @ts-ignore @type {typeof __VLS_components.RouterLink | typeof __VLS_components.RouterLink} */
        RouterLink;
        // @ts-ignore
        const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
            to: (`/classes/${cls.id}`),
            ...{ class: "class-card" },
        }));
        const __VLS_2 = __VLS_1({
            to: (`/classes/${cls.id}`),
            ...{ class: "class-card" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_1));
        /** @type {__VLS_StyleScopedClasses['class-card']} */ ;
        const { default: __VLS_5 } = __VLS_3.slots;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "class-info" },
        });
        /** @type {__VLS_StyleScopedClasses['class-info']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({});
        (cls.name);
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "class-meta" },
        });
        /** @type {__VLS_StyleScopedClasses['class-meta']} */ ;
        (cls.schoolYear);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "class-arrow" },
        });
        /** @type {__VLS_StyleScopedClasses['class-arrow']} */ ;
        // @ts-ignore
        [classes, searchQuery, searchQuery, searchQuery, loading, loadError, loadError, loadData, filteredClasses, filteredClasses, filteredClasses,];
        var __VLS_3;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "class-actions" },
        });
        /** @type {__VLS_StyleScopedClasses['class-actions']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(__VLS_ctx.loadError))
                        return;
                    if (!!(__VLS_ctx.filteredClasses.length === 0 && __VLS_ctx.searchQuery === ''))
                        return;
                    if (!!(__VLS_ctx.filteredClasses.length === 0))
                        return;
                    __VLS_ctx.editClass(cls);
                    // @ts-ignore
                    [editClass,];
                } },
            ...{ class: "action-btn" },
            title: (`Edit class ${cls.name}`),
            'aria-label': (`Edit class ${cls.name}`),
        });
        /** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(__VLS_ctx.loadError))
                        return;
                    if (!!(__VLS_ctx.filteredClasses.length === 0 && __VLS_ctx.searchQuery === ''))
                        return;
                    if (!!(__VLS_ctx.filteredClasses.length === 0))
                        return;
                    __VLS_ctx.confirmDeleteClass(cls);
                    // @ts-ignore
                    [confirmDeleteClass,];
                } },
            ...{ class: "action-btn action-btn-danger" },
            title: (`Delete class ${cls.name}`),
            'aria-label': (`Delete class ${cls.name}`),
        });
        /** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
        /** @type {__VLS_StyleScopedClasses['action-btn-danger']} */ ;
        // @ts-ignore
        [];
    }
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
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.showCreateModal = true;
            // @ts-ignore
            [showCreateModal,];
        } },
    ...{ class: "action-button" },
});
/** @type {__VLS_StyleScopedClasses['action-button']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "action-icon" },
});
/** @type {__VLS_StyleScopedClasses['action-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
let __VLS_6;
/** @ts-ignore @type {typeof __VLS_components.RouterLink | typeof __VLS_components.RouterLink} */
RouterLink;
// @ts-ignore
const __VLS_7 = __VLS_asFunctionalComponent1(__VLS_6, new __VLS_6({
    to: "/students",
    ...{ class: "action-button" },
}));
const __VLS_8 = __VLS_7({
    to: "/students",
    ...{ class: "action-button" },
}, ...__VLS_functionalComponentArgsRest(__VLS_7));
/** @type {__VLS_StyleScopedClasses['action-button']} */ ;
const { default: __VLS_11 } = __VLS_9.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "action-icon" },
});
/** @type {__VLS_StyleScopedClasses['action-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
// @ts-ignore
[];
var __VLS_9;
let __VLS_12;
/** @ts-ignore @type {typeof __VLS_components.RouterLink | typeof __VLS_components.RouterLink} */
RouterLink;
// @ts-ignore
const __VLS_13 = __VLS_asFunctionalComponent1(__VLS_12, new __VLS_12({
    to: "/attendance",
    ...{ class: "action-button" },
}));
const __VLS_14 = __VLS_13({
    to: "/attendance",
    ...{ class: "action-button" },
}, ...__VLS_functionalComponentArgsRest(__VLS_13));
/** @type {__VLS_StyleScopedClasses['action-button']} */ ;
const { default: __VLS_17 } = __VLS_15.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "action-icon" },
});
/** @type {__VLS_StyleScopedClasses['action-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
// @ts-ignore
[];
var __VLS_15;
__VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
    ...{ class: "card" },
});
/** @type {__VLS_StyleScopedClasses['card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "card-content" },
});
/** @type {__VLS_StyleScopedClasses['card-content']} */ ;
if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "loading-state-small" },
    });
    /** @type {__VLS_StyleScopedClasses['loading-state-small']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "spinner-small" },
    });
    /** @type {__VLS_StyleScopedClasses['spinner-small']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
}
else if (__VLS_ctx.recentActivity.length === 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "empty-state" },
    });
    /** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "activity-list" },
    });
    /** @type {__VLS_StyleScopedClasses['activity-list']} */ ;
    for (const [activity] of __VLS_vFor((__VLS_ctx.recentActivity))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            key: (activity.id),
            ...{ class: "activity-item" },
        });
        /** @type {__VLS_StyleScopedClasses['activity-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "activity-icon" },
        });
        /** @type {__VLS_StyleScopedClasses['activity-icon']} */ ;
        (__VLS_ctx.getActivityIcon(activity.status));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "activity-details" },
        });
        /** @type {__VLS_StyleScopedClasses['activity-details']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "activity-text" },
        });
        /** @type {__VLS_StyleScopedClasses['activity-text']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "activity-time" },
        });
        /** @type {__VLS_StyleScopedClasses['activity-time']} */ ;
        (__VLS_ctx.formatDate(activity.date));
        // @ts-ignore
        [loading, recentActivity, recentActivity, getActivityIcon, formatDate,];
    }
}
if (__VLS_ctx.showCreateModal) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (__VLS_ctx.closeModal) },
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
        ...{ onClick: (__VLS_ctx.closeModal) },
        ...{ class: "modal-close" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-close']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
        ...{ onSubmit: (__VLS_ctx.handleCreateClass) },
        ...{ class: "modal-form" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-form']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        for: "className",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        id: "className",
        value: (__VLS_ctx.newClass.name),
        type: "text",
        placeholder: "z.B. Klasse 9a Sport",
        required: true,
        ...{ class: "form-input" },
    });
    /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        for: "schoolYear",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        id: "schoolYear",
        value: (__VLS_ctx.newClass.schoolYear),
        type: "text",
        placeholder: "z.B. 2025/2026",
        pattern: "\u005c\u0064\u007b\u0034\u007d\u002f\u005c\u0064\u007b\u0034\u007d",
        required: true,
        ...{ class: "form-input" },
    });
    /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({
        ...{ class: "form-hint" },
    });
    /** @type {__VLS_StyleScopedClasses['form-hint']} */ ;
    if (__VLS_ctx.error) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "error-message" },
        });
        /** @type {__VLS_StyleScopedClasses['error-message']} */ ;
        (__VLS_ctx.error);
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-actions" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-actions']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeModal) },
        type: "button",
        ...{ class: "btn-secondary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        type: "submit",
        disabled: (__VLS_ctx.creating),
        ...{ class: "btn-primary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
    (__VLS_ctx.creating ? 'Wird erstellt...' : 'Klasse erstellen');
}
if (__VLS_ctx.showEditModal) {
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
        ...{ onSubmit: (__VLS_ctx.handleUpdateClass) },
        ...{ class: "modal-form" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-form']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "form-group" },
    });
    /** @type {__VLS_StyleScopedClasses['form-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        for: "editClassName",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        id: "editClassName",
        value: (__VLS_ctx.editClassData.name),
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
        for: "editSchoolYear",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        id: "editSchoolYear",
        value: (__VLS_ctx.editClassData.schoolYear),
        type: "text",
        pattern: "\u005c\u0064\u007b\u0034\u007d\u002f\u005c\u0064\u007b\u0034\u007d",
        required: true,
        ...{ class: "form-input" },
    });
    /** @type {__VLS_StyleScopedClasses['form-input']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({
        ...{ class: "form-hint" },
    });
    /** @type {__VLS_StyleScopedClasses['form-hint']} */ ;
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
        disabled: (__VLS_ctx.updating),
        ...{ class: "btn-primary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
    (__VLS_ctx.updating ? 'Updating...' : 'Update Class');
}
if (__VLS_ctx.showDeleteModal) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (__VLS_ctx.closeDeleteModal) },
        ...{ class: "modal-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: () => { } },
        ...{ class: "modal modal-small" },
    });
    /** @type {__VLS_StyleScopedClasses['modal']} */ ;
    /** @type {__VLS_StyleScopedClasses['modal-small']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-header" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeDeleteModal) },
        ...{ class: "modal-close" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-close']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-content" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-content']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.classToDelete?.name);
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "warning-text" },
    });
    /** @type {__VLS_StyleScopedClasses['warning-text']} */ ;
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
        ...{ onClick: (__VLS_ctx.closeDeleteModal) },
        type: "button",
        ...{ class: "btn-secondary" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.handleDeleteClass) },
        disabled: (__VLS_ctx.deleting),
        ...{ class: "btn-danger" },
    });
    /** @type {__VLS_StyleScopedClasses['btn-danger']} */ ;
    (__VLS_ctx.deleting ? 'Deleting...' : 'Delete Class');
}
// @ts-ignore
[showCreateModal, closeModal, closeModal, closeModal, handleCreateClass, newClass, newClass, error, error, creating, creating, showEditModal, closeEditModal, closeEditModal, closeEditModal, handleUpdateClass, editClassData, editClassData, editError, editError, updating, updating, showDeleteModal, closeDeleteModal, closeDeleteModal, closeDeleteModal, classToDelete, deleteError, deleteError, handleDeleteClass, deleting, deleting,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
