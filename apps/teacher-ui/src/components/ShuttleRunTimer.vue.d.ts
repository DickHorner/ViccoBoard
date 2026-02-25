import type { Student, Sport } from '@viccoboard/core';
interface Props {
    students: Student[];
    config: Sport.ShuttleRunConfig;
    audioEnabled?: boolean;
}
declare const __VLS_export: import("vue").DefineComponent<Props, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {
    complete: (stops: Record<string, number>) => any;
}, string, import("vue").PublicProps, Readonly<Props> & Readonly<{
    onComplete?: ((stops: Record<string, number>) => any) | undefined;
}>, {
    audioEnabled: boolean;
}, {}, {}, {}, string, import("vue").ComponentProvideOptions, false, {}, any>;
declare const _default: typeof __VLS_export;
export default _default;
