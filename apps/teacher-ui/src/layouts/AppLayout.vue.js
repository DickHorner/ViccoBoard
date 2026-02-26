/// <reference types="../../../../node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { RouterLink, RouterView, useRoute } from 'vue-router';
const route = useRoute();
const navItems = [
    { to: '/', label: 'Dashboard', hint: 'Classes and activity' },
    { to: '/exams', label: 'Exams', hint: 'KBR assessments' },
    { to: '/students', label: 'Students', hint: 'Roster and profiles' },
    { to: '/lessons', label: 'Lessons', hint: 'Schedule and history' },
    { to: '/attendance', label: 'Attendance', hint: 'Daily check-in' },
    { to: '/grading', label: 'Grading', hint: 'Entries and history' },
    { to: '/tools/timer', label: 'Timer', hint: 'Tools' },
    { to: '/tools/multistop', label: 'Multistop', hint: 'Tools' },
    { to: '/tools/scoreboard', label: 'Scoreboard', hint: 'Tools' },
    { to: '/tools/teams', label: 'Teams', hint: 'Tools' },
    { to: '/tools/tournaments', label: 'Tournaments', hint: 'Tools' },
    { to: '/tools/tactics', label: 'Tactics', hint: 'Tools' },
    { to: '/tools/feedback', label: 'Feedback', hint: 'Tools' }
];
const pageTitle = computed(() => {
    const metaTitle = route.meta?.title;
    if (typeof metaTitle === 'string' && metaTitle.trim().length > 0) {
        return metaTitle;
    }
    return 'Dashboard';
});
const compactWidth = 900;
const getInitialLayout = () => {
    if (typeof window !== 'undefined') {
        return window.innerWidth < compactWidth;
    }
    return false;
};
const isCompact = ref(getInitialLayout());
const isSidebarOpen = ref(!isCompact.value);
const updateLayout = () => {
    const compact = window.innerWidth < compactWidth;
    if (compact !== isCompact.value) {
        isCompact.value = compact;
        isSidebarOpen.value = !compact;
    }
};
const toggleSidebar = () => {
    if (!isCompact.value) {
        return;
    }
    isSidebarOpen.value = !isSidebarOpen.value;
};
const closeSidebar = () => {
    if (isCompact.value) {
        isSidebarOpen.value = false;
    }
};
const handleNavClick = () => {
    if (isCompact.value) {
        isSidebarOpen.value = false;
    }
};
onMounted(() => {
    updateLayout();
    window.addEventListener('resize', updateLayout);
});
onUnmounted(() => {
    window.removeEventListener('resize', updateLayout);
});
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['skip-link']} */ ;
/** @type {__VLS_StyleScopedClasses['menu-button']} */ ;
/** @type {__VLS_StyleScopedClasses['nav-item']} */ ;
/** @type {__VLS_StyleScopedClasses['nav-item']} */ ;
/** @type {__VLS_StyleScopedClasses['app-header']} */ ;
/** @type {__VLS_StyleScopedClasses['menu-button']} */ ;
/** @type {__VLS_StyleScopedClasses['header-meta']} */ ;
/** @type {__VLS_StyleScopedClasses['app-body']} */ ;
/** @type {__VLS_StyleScopedClasses['app-sidebar']} */ ;
/** @type {__VLS_StyleScopedClasses['app-sidebar']} */ ;
/** @type {__VLS_StyleScopedClasses['app-content']} */ ;
/** @type {__VLS_StyleScopedClasses['app-header']} */ ;
/** @type {__VLS_StyleScopedClasses['brand-mark']} */ ;
/** @type {__VLS_StyleScopedClasses['brand-title']} */ ;
/** @type {__VLS_StyleScopedClasses['app-content']} */ ;
/** @type {__VLS_StyleScopedClasses['app-sidebar']} */ ;
/** @type {__VLS_StyleScopedClasses['app-body']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "app-shell" },
});
/** @type {__VLS_StyleScopedClasses['app-shell']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.a, __VLS_intrinsics.a)({
    ...{ class: "skip-link" },
    href: "#main-content",
});
/** @type {__VLS_StyleScopedClasses['skip-link']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.header, __VLS_intrinsics.header)({
    ...{ class: "app-header" },
});
/** @type {__VLS_StyleScopedClasses['app-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.toggleSidebar) },
    ...{ class: "menu-button" },
    type: "button",
    'aria-expanded': (__VLS_ctx.isSidebarOpen),
    'aria-controls': "primary-navigation",
});
/** @type {__VLS_StyleScopedClasses['menu-button']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "brand" },
});
/** @type {__VLS_StyleScopedClasses['brand']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "brand-mark" },
});
/** @type {__VLS_StyleScopedClasses['brand-mark']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "brand-text" },
});
/** @type {__VLS_StyleScopedClasses['brand-text']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({
    ...{ class: "brand-title" },
});
/** @type {__VLS_StyleScopedClasses['brand-title']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "brand-subtitle" },
});
/** @type {__VLS_StyleScopedClasses['brand-subtitle']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "header-meta" },
});
/** @type {__VLS_StyleScopedClasses['header-meta']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "page-title" },
});
/** @type {__VLS_StyleScopedClasses['page-title']} */ ;
(__VLS_ctx.pageTitle);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "status-pill" },
});
/** @type {__VLS_StyleScopedClasses['status-pill']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "app-body" },
});
/** @type {__VLS_StyleScopedClasses['app-body']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.aside, __VLS_intrinsics.aside)({
    id: "primary-navigation",
    ...{ class: "app-sidebar" },
    ...{ class: ({ open: __VLS_ctx.isSidebarOpen }) },
    'aria-label': "Primary",
});
/** @type {__VLS_StyleScopedClasses['app-sidebar']} */ ;
/** @type {__VLS_StyleScopedClasses['open']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.nav, __VLS_intrinsics.nav)({
    ...{ class: "nav-menu" },
});
/** @type {__VLS_StyleScopedClasses['nav-menu']} */ ;
for (const [item] of __VLS_vFor((__VLS_ctx.navItems))) {
    let __VLS_0;
    /** @ts-ignore @type {typeof __VLS_components.RouterLink | typeof __VLS_components.RouterLink} */
    RouterLink;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        ...{ 'onClick': {} },
        key: (item.to),
        to: (item.to),
        ...{ class: "nav-item" },
        activeClass: "active",
    }));
    const __VLS_2 = __VLS_1({
        ...{ 'onClick': {} },
        key: (item.to),
        to: (item.to),
        ...{ class: "nav-item" },
        activeClass: "active",
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    let __VLS_5;
    const __VLS_6 = ({ click: {} },
        { onClick: (__VLS_ctx.handleNavClick) });
    /** @type {__VLS_StyleScopedClasses['nav-item']} */ ;
    const { default: __VLS_7 } = __VLS_3.slots;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "nav-dot" },
        'aria-hidden': "true",
    });
    /** @type {__VLS_StyleScopedClasses['nav-dot']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "nav-label" },
    });
    /** @type {__VLS_StyleScopedClasses['nav-label']} */ ;
    (item.label);
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "nav-hint" },
    });
    /** @type {__VLS_StyleScopedClasses['nav-hint']} */ ;
    (item.hint);
    // @ts-ignore
    [toggleSidebar, isSidebarOpen, isSidebarOpen, pageTitle, navItems, handleNavClick,];
    var __VLS_3;
    var __VLS_4;
    // @ts-ignore
    [];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "sidebar-footer" },
});
/** @type {__VLS_StyleScopedClasses['sidebar-footer']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "sidebar-card" },
});
/** @type {__VLS_StyleScopedClasses['sidebar-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "sidebar-card-title" },
});
/** @type {__VLS_StyleScopedClasses['sidebar-card-title']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "sidebar-card-body" },
});
/** @type {__VLS_StyleScopedClasses['sidebar-card-body']} */ ;
if (__VLS_ctx.isCompact && __VLS_ctx.isSidebarOpen) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.closeSidebar) },
        ...{ class: "sidebar-backdrop" },
        type: "button",
        'aria-label': "Close navigation",
    });
    /** @type {__VLS_StyleScopedClasses['sidebar-backdrop']} */ ;
}
__VLS_asFunctionalElement1(__VLS_intrinsics.main, __VLS_intrinsics.main)({
    id: "main-content",
    ...{ class: "app-content" },
});
/** @type {__VLS_StyleScopedClasses['app-content']} */ ;
let __VLS_8;
/** @ts-ignore @type {typeof __VLS_components.RouterView | typeof __VLS_components.RouterView} */
RouterView;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent1(__VLS_8, new __VLS_8({}));
const __VLS_10 = __VLS_9({}, ...__VLS_functionalComponentArgsRest(__VLS_9));
{
    const { default: __VLS_13 } = __VLS_11.slots;
    const [{ Component }] = __VLS_vSlot(__VLS_13);
    let __VLS_14;
    /** @ts-ignore @type {typeof __VLS_components.Transition | typeof __VLS_components.Transition} */
    Transition;
    // @ts-ignore
    const __VLS_15 = __VLS_asFunctionalComponent1(__VLS_14, new __VLS_14({
        name: "view-fade",
        mode: "out-in",
    }));
    const __VLS_16 = __VLS_15({
        name: "view-fade",
        mode: "out-in",
    }, ...__VLS_functionalComponentArgsRest(__VLS_15));
    const { default: __VLS_19 } = __VLS_17.slots;
    const __VLS_20 = (Component);
    // @ts-ignore
    const __VLS_21 = __VLS_asFunctionalComponent1(__VLS_20, new __VLS_20({
        key: (__VLS_ctx.route.fullPath),
    }));
    const __VLS_22 = __VLS_21({
        key: (__VLS_ctx.route.fullPath),
    }, ...__VLS_functionalComponentArgsRest(__VLS_21));
    // @ts-ignore
    [isSidebarOpen, isCompact, closeSidebar, route,];
    var __VLS_17;
    // @ts-ignore
    [];
    __VLS_11.slots['' /* empty slot name completion */];
}
var __VLS_11;
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
