/**
 * Correction Table View Component
 * Shows all candidates and their scores in a matrix format
 * Supports sorting, filtering, and quick edits
 */
import { Exams } from '@viccoboard/core';
interface Props {
    exam: Exams.Exam;
    candidates: Exams.Candidate[];
    corrections: Map<string, Exams.CorrectionEntry>;
    onJumpToCandidate?: (candidate: Exams.Candidate, task?: Exams.TaskNode) => void;
}
declare const __VLS_export: import("vue").DefineComponent<Props, {
    openCommentsModal: (candidate: Exams.Candidate, taskId?: string) => void;
}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {} & {
    "save-comment": (payload: {
        candidateId: string;
        comment: Omit<Exams.CorrectionComment, "id" | "timestamp">;
    }) => any;
    "copy-comments": (payload: {
        sourceCandidateId: string;
        targetCandidateIds: string[];
        comment: Omit<Exams.CorrectionComment, "id" | "timestamp">;
    }) => any;
}, string, import("vue").PublicProps, Readonly<Props> & Readonly<{
    "onSave-comment"?: ((payload: {
        candidateId: string;
        comment: Omit<Exams.CorrectionComment, "id" | "timestamp">;
    }) => any) | undefined;
    "onCopy-comments"?: ((payload: {
        sourceCandidateId: string;
        targetCandidateIds: string[];
        comment: Omit<Exams.CorrectionComment, "id" | "timestamp">;
    }) => any) | undefined;
}>, {}, {}, {}, {}, string, import("vue").ComponentProvideOptions, false, {}, any>;
declare const _default: typeof __VLS_export;
export default _default;
