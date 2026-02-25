/// <reference types="../../../../node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { ref, onErrorCaptured } from 'vue';
const hasError = ref(false);
const errorMessage = ref('');
const errorStack = ref('');
onErrorCaptured((err, instance, info) => {
    hasError.value = true;
    if (err instanceof Error) {
        errorMessage.value = err.message || 'An unexpected error occurred';
        errorStack.value = err.stack || info;
    }
    else if (typeof err === 'string') {
        errorMessage.value = err;
    }
    else {
        errorMessage.value = 'An unexpected error occurred';
        errorStack.value = info;
    }
    // Log error to console for debugging
    console.error('[ErrorBoundary] Caught error:', {
        error: err,
        instance,
        info,
        timestamp: new Date().toISOString()
    });
    // Prevent error from propagating
    return false;
});
const handleReset = () => {
    hasError.value = false;
    errorMessage.value = '';
    errorStack.value = '';
};
const handleReloadPage = () => {
    window.location.reload();
};
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['error-content']} */ ;
/** @type {__VLS_StyleScopedClasses['error-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['error-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['error-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['error-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['error-details']} */ ;
/** @type {__VLS_StyleScopedClasses['error-details']} */ ;
/** @type {__VLS_StyleScopedClasses['error-details']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "error-boundary" },
});
/** @type {__VLS_StyleScopedClasses['error-boundary']} */ ;
if (!__VLS_ctx.hasError) {
    var __VLS_0 = {};
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "error-fallback" },
    });
    /** @type {__VLS_StyleScopedClasses['error-fallback']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "error-content" },
    });
    /** @type {__VLS_StyleScopedClasses['error-content']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "error-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['error-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "error-message" },
    });
    /** @type {__VLS_StyleScopedClasses['error-message']} */ ;
    (__VLS_ctx.errorMessage);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "error-actions" },
    });
    /** @type {__VLS_StyleScopedClasses['error-actions']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.handleReset) },
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.handleReloadPage) },
        ...{ class: "secondary" },
    });
    /** @type {__VLS_StyleScopedClasses['secondary']} */ ;
    if (__VLS_ctx.errorStack) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.details, __VLS_intrinsics.details)({
            ...{ class: "error-details" },
        });
        /** @type {__VLS_StyleScopedClasses['error-details']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.summary, __VLS_intrinsics.summary)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.pre, __VLS_intrinsics.pre)({});
        (__VLS_ctx.errorStack);
    }
}
// @ts-ignore
var __VLS_1 = __VLS_0;
// @ts-ignore
[hasError, errorMessage, handleReset, handleReloadPage, errorStack, errorStack,];
const __VLS_base = (await import('vue')).defineComponent({});
const __VLS_export = {};
export default {};
