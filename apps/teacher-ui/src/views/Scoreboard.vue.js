/// <reference types="../../../../node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
const teamA = ref({ name: '', score: 0 });
const teamB = ref({ name: '', score: 0 });
function adjustScore(team, delta) {
    const target = team === 'A' ? teamA.value : teamB.value;
    target.score = Math.max(0, target.score + delta);
}
function resetScores() {
    teamA.value.score = 0;
    teamB.value.score = 0;
}
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['page-header']} */ ;
/** @type {__VLS_StyleScopedClasses['header-actions']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "scoreboard-view" },
});
/** @type {__VLS_StyleScopedClasses['scoreboard-view']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "page-header" },
});
/** @type {__VLS_StyleScopedClasses['page-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
(__VLS_ctx.t('SCORES.title'));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "header-actions" },
});
/** @type {__VLS_StyleScopedClasses['header-actions']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.resetScores) },
    ...{ class: "btn-secondary" },
    type: "button",
});
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
(__VLS_ctx.t('TRACKING.controls.reset'));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "scoreboard-grid" },
});
/** @type {__VLS_StyleScopedClasses['scoreboard-grid']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
    ...{ class: "team-card" },
});
/** @type {__VLS_StyleScopedClasses['team-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "team-header" },
});
/** @type {__VLS_StyleScopedClasses['team-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "team-label" },
});
/** @type {__VLS_StyleScopedClasses['team-label']} */ ;
(__VLS_ctx.t('TOURNAMENT.team'));
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    value: (__VLS_ctx.teamA.name),
    ...{ class: "team-input" },
    type: "text",
    placeholder: (`${__VLS_ctx.t('TOURNAMENT.team')} A`),
});
/** @type {__VLS_StyleScopedClasses['team-input']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "team-score" },
});
/** @type {__VLS_StyleScopedClasses['team-score']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.adjustScore('A', -1);
            // @ts-ignore
            [t, t, t, t, resetScores, teamA, adjustScore,];
        } },
    ...{ class: "score-btn" },
    type: "button",
});
/** @type {__VLS_StyleScopedClasses['score-btn']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "score-value" },
});
/** @type {__VLS_StyleScopedClasses['score-value']} */ ;
(__VLS_ctx.teamA.score);
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.adjustScore('A', 1);
            // @ts-ignore
            [teamA, adjustScore,];
        } },
    ...{ class: "score-btn" },
    type: "button",
});
/** @type {__VLS_StyleScopedClasses['score-btn']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "score-actions" },
});
/** @type {__VLS_StyleScopedClasses['score-actions']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.adjustScore('A', 2);
            // @ts-ignore
            [adjustScore,];
        } },
    ...{ class: "btn-secondary" },
    type: "button",
});
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.adjustScore('A', 3);
            // @ts-ignore
            [adjustScore,];
        } },
    ...{ class: "btn-secondary" },
    type: "button",
});
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
    ...{ class: "team-card" },
});
/** @type {__VLS_StyleScopedClasses['team-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "team-header" },
});
/** @type {__VLS_StyleScopedClasses['team-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "team-label" },
});
/** @type {__VLS_StyleScopedClasses['team-label']} */ ;
(__VLS_ctx.t('TOURNAMENT.team'));
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    value: (__VLS_ctx.teamB.name),
    ...{ class: "team-input" },
    type: "text",
    placeholder: (`${__VLS_ctx.t('TOURNAMENT.team')} B`),
});
/** @type {__VLS_StyleScopedClasses['team-input']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "team-score" },
});
/** @type {__VLS_StyleScopedClasses['team-score']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.adjustScore('B', -1);
            // @ts-ignore
            [t, t, adjustScore, teamB,];
        } },
    ...{ class: "score-btn" },
    type: "button",
});
/** @type {__VLS_StyleScopedClasses['score-btn']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "score-value" },
});
/** @type {__VLS_StyleScopedClasses['score-value']} */ ;
(__VLS_ctx.teamB.score);
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.adjustScore('B', 1);
            // @ts-ignore
            [adjustScore, teamB,];
        } },
    ...{ class: "score-btn" },
    type: "button",
});
/** @type {__VLS_StyleScopedClasses['score-btn']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "score-actions" },
});
/** @type {__VLS_StyleScopedClasses['score-actions']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.adjustScore('B', 2);
            // @ts-ignore
            [adjustScore,];
        } },
    ...{ class: "btn-secondary" },
    type: "button",
});
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.adjustScore('B', 3);
            // @ts-ignore
            [adjustScore,];
        } },
    ...{ class: "btn-secondary" },
    type: "button",
});
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
