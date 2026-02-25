import { type TaskDraft } from '../stores/examBuilderStore';
interface Props {
    task: TaskDraft;
    index: number;
    level: 1 | 2 | 3;
    mode: 'simple' | 'complex';
    parentIndex?: number;
    isLast?: boolean;
    parentTask?: TaskDraft;
}
declare const __VLS_export: import("vue").DefineComponent<Props, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {
    remove: () => any;
    moveUp: () => any;
    moveDown: () => any;
}, string, import("vue").PublicProps, Readonly<Props> & Readonly<{
    onRemove?: (() => any) | undefined;
    onMoveUp?: (() => any) | undefined;
    onMoveDown?: (() => any) | undefined;
}>, {
    parentIndex: number;
    isLast: boolean;
}, {}, {}, {}, string, import("vue").ComponentProvideOptions, false, {}, any>;
declare const _default: typeof __VLS_export;
export default _default;
