import type { Exams as ExamsTypes } from '@viccoboard/core';
export interface CriterionDraft {
    id: string;
    text: string;
    points: number;
}
export interface TaskDraft {
    id: string;
    title: string;
    points: number;
    bonusPoints: number;
    isChoice: boolean;
    choiceGroup: string;
    criteria: CriterionDraft[];
    subtasks: TaskDraft[];
}
export interface PartDraft {
    id: string;
    name: string;
    description: string;
    taskIds: string[];
    calculateSubScore: boolean;
    scoreType: 'points' | 'grade';
    printable: boolean;
    order: number;
}
export declare const useExamBuilderStore: import("pinia").StoreDefinition<"examBuilder", Pick<{
    title: import("vue").Ref<string, string>;
    description: import("vue").Ref<string, string>;
    classGroupId: import("vue").Ref<string, string>;
    mode: import("vue").Ref<"simple" | "complex", "simple" | "complex">;
    tasks: import("vue").Ref<{
        id: string;
        title: string;
        points: number;
        bonusPoints: number;
        isChoice: boolean;
        choiceGroup: string;
        criteria: {
            id: string;
            text: string;
            points: number;
        }[];
        subtasks: /*elided*/ any[];
    }[], TaskDraft[] | {
        id: string;
        title: string;
        points: number;
        bonusPoints: number;
        isChoice: boolean;
        choiceGroup: string;
        criteria: {
            id: string;
            text: string;
            points: number;
        }[];
        subtasks: /*elided*/ any[];
    }[]>;
    parts: import("vue").Ref<{
        id: string;
        name: string;
        description: string;
        taskIds: string[];
        calculateSubScore: boolean;
        scoreType: "points" | "grade";
        printable: boolean;
        order: number;
    }[], PartDraft[] | {
        id: string;
        name: string;
        description: string;
        taskIds: string[];
        calculateSubScore: boolean;
        scoreType: "points" | "grade";
        printable: boolean;
        order: number;
    }[]>;
    isEditing: import("vue").Ref<boolean, boolean>;
    createdAt: import("vue").Ref<Date | null, Date | null>;
    examId: import("vue").Ref<string | undefined, string | undefined>;
    flatTasks: import("vue").ComputedRef<ExamsTypes.TaskNode[]>;
    totalPoints: import("vue").ComputedRef<number>;
    canSave: import("vue").ComputedRef<boolean>;
    setMode: (next: "simple" | "complex") => void;
    addTask: () => void;
    addSubtask: (task: TaskDraft, level: 2 | 3) => void;
    removeTask: (id: string) => void;
    removeNestedTask: (parent: TaskDraft, id: string) => void;
    moveTask: (list: TaskDraft[], index: number, delta: number) => void;
    addCriterion: (task: TaskDraft) => void;
    removeCriterion: (task: TaskDraft, id: string) => void;
    addPart: () => void;
    removePart: (id: string) => void;
    buildExam: () => ExamsTypes.Exam;
    saveExam: () => Promise<void>;
    loadExam: (id: string) => Promise<void>;
    reset: () => void;
}, "title" | "createdAt" | "classGroupId" | "description" | "mode" | "examId" | "tasks" | "parts" | "isEditing">, Pick<{
    title: import("vue").Ref<string, string>;
    description: import("vue").Ref<string, string>;
    classGroupId: import("vue").Ref<string, string>;
    mode: import("vue").Ref<"simple" | "complex", "simple" | "complex">;
    tasks: import("vue").Ref<{
        id: string;
        title: string;
        points: number;
        bonusPoints: number;
        isChoice: boolean;
        choiceGroup: string;
        criteria: {
            id: string;
            text: string;
            points: number;
        }[];
        subtasks: /*elided*/ any[];
    }[], TaskDraft[] | {
        id: string;
        title: string;
        points: number;
        bonusPoints: number;
        isChoice: boolean;
        choiceGroup: string;
        criteria: {
            id: string;
            text: string;
            points: number;
        }[];
        subtasks: /*elided*/ any[];
    }[]>;
    parts: import("vue").Ref<{
        id: string;
        name: string;
        description: string;
        taskIds: string[];
        calculateSubScore: boolean;
        scoreType: "points" | "grade";
        printable: boolean;
        order: number;
    }[], PartDraft[] | {
        id: string;
        name: string;
        description: string;
        taskIds: string[];
        calculateSubScore: boolean;
        scoreType: "points" | "grade";
        printable: boolean;
        order: number;
    }[]>;
    isEditing: import("vue").Ref<boolean, boolean>;
    createdAt: import("vue").Ref<Date | null, Date | null>;
    examId: import("vue").Ref<string | undefined, string | undefined>;
    flatTasks: import("vue").ComputedRef<ExamsTypes.TaskNode[]>;
    totalPoints: import("vue").ComputedRef<number>;
    canSave: import("vue").ComputedRef<boolean>;
    setMode: (next: "simple" | "complex") => void;
    addTask: () => void;
    addSubtask: (task: TaskDraft, level: 2 | 3) => void;
    removeTask: (id: string) => void;
    removeNestedTask: (parent: TaskDraft, id: string) => void;
    moveTask: (list: TaskDraft[], index: number, delta: number) => void;
    addCriterion: (task: TaskDraft) => void;
    removeCriterion: (task: TaskDraft, id: string) => void;
    addPart: () => void;
    removePart: (id: string) => void;
    buildExam: () => ExamsTypes.Exam;
    saveExam: () => Promise<void>;
    loadExam: (id: string) => Promise<void>;
    reset: () => void;
}, "totalPoints" | "flatTasks" | "canSave">, Pick<{
    title: import("vue").Ref<string, string>;
    description: import("vue").Ref<string, string>;
    classGroupId: import("vue").Ref<string, string>;
    mode: import("vue").Ref<"simple" | "complex", "simple" | "complex">;
    tasks: import("vue").Ref<{
        id: string;
        title: string;
        points: number;
        bonusPoints: number;
        isChoice: boolean;
        choiceGroup: string;
        criteria: {
            id: string;
            text: string;
            points: number;
        }[];
        subtasks: /*elided*/ any[];
    }[], TaskDraft[] | {
        id: string;
        title: string;
        points: number;
        bonusPoints: number;
        isChoice: boolean;
        choiceGroup: string;
        criteria: {
            id: string;
            text: string;
            points: number;
        }[];
        subtasks: /*elided*/ any[];
    }[]>;
    parts: import("vue").Ref<{
        id: string;
        name: string;
        description: string;
        taskIds: string[];
        calculateSubScore: boolean;
        scoreType: "points" | "grade";
        printable: boolean;
        order: number;
    }[], PartDraft[] | {
        id: string;
        name: string;
        description: string;
        taskIds: string[];
        calculateSubScore: boolean;
        scoreType: "points" | "grade";
        printable: boolean;
        order: number;
    }[]>;
    isEditing: import("vue").Ref<boolean, boolean>;
    createdAt: import("vue").Ref<Date | null, Date | null>;
    examId: import("vue").Ref<string | undefined, string | undefined>;
    flatTasks: import("vue").ComputedRef<ExamsTypes.TaskNode[]>;
    totalPoints: import("vue").ComputedRef<number>;
    canSave: import("vue").ComputedRef<boolean>;
    setMode: (next: "simple" | "complex") => void;
    addTask: () => void;
    addSubtask: (task: TaskDraft, level: 2 | 3) => void;
    removeTask: (id: string) => void;
    removeNestedTask: (parent: TaskDraft, id: string) => void;
    moveTask: (list: TaskDraft[], index: number, delta: number) => void;
    addCriterion: (task: TaskDraft) => void;
    removeCriterion: (task: TaskDraft, id: string) => void;
    addPart: () => void;
    removePart: (id: string) => void;
    buildExam: () => ExamsTypes.Exam;
    saveExam: () => Promise<void>;
    loadExam: (id: string) => Promise<void>;
    reset: () => void;
}, "reset" | "setMode" | "addTask" | "addSubtask" | "removeTask" | "removeNestedTask" | "moveTask" | "addCriterion" | "removeCriterion" | "addPart" | "removePart" | "buildExam" | "saveExam" | "loadExam">>;
