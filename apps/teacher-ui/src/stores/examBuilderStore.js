import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { createUuid } from '../utils/uuid';
import { useExamsBridge } from '../composables/useExamsBridge';
import { useToast } from '../composables/useToast';
import { useRouter } from 'vue-router';
export const useExamBuilderStore = defineStore('examBuilder', () => {
    // ============ State ============
    const title = ref('');
    const description = ref('');
    const classGroupId = ref('');
    const mode = ref('simple');
    const tasks = ref([]);
    const parts = ref([]);
    const isEditing = ref(false);
    const createdAt = ref(null);
    const examId = ref(undefined);
    // ============ Getters ============
    const flatTasks = computed(() => flattenTasks(tasks.value));
    const totalPoints = computed(() => flatTasks.value.reduce((sum, task) => sum + (Number(task.points) || 0), 0));
    const canSave = computed(() => title.value.trim().length > 0 && tasks.value.length > 0);
    // ============ Helper Functions ============
    const newTask = () => ({
        id: createUuid(),
        title: '',
        points: 0,
        bonusPoints: 0,
        isChoice: false,
        choiceGroup: '',
        criteria: [],
        subtasks: []
    });
    const newCriterion = () => ({
        id: createUuid(),
        text: '',
        points: 0
    });
    const newPart = () => ({
        id: createUuid(),
        name: '',
        description: '',
        taskIds: [],
        calculateSubScore: false,
        scoreType: 'points',
        printable: true,
        order: parts.value.length + 1
    });
    const flattenTasks = (items, level = 1, parentId) => {
        const output = [];
        items.forEach((task, index) => {
            output.push({
                id: task.id,
                parentId,
                level,
                order: index + 1,
                title: task.title.trim() || `Task ${index + 1}`,
                description: undefined,
                points: Number(task.points) || 0,
                bonusPoints: Number(task.bonusPoints) || 0,
                isChoice: task.isChoice,
                choiceGroup: task.choiceGroup || undefined,
                criteria: task.criteria.map(criterion => ({
                    id: criterion.id,
                    text: criterion.text.trim() || 'Criterion',
                    formatting: {},
                    points: Number(criterion.points) || 0,
                    aspectBased: false
                })),
                allowComments: false,
                allowSupportTips: false,
                commentBoxEnabled: false,
                subtasks: task.subtasks.map(sub => sub.id)
            });
            if (level < 3 && task.subtasks.length) {
                output.push(...flattenTasks(task.subtasks, (level + 1), task.id));
            }
        });
        return output;
    };
    // ============ Actions ============
    const setMode = (next) => {
        mode.value = next;
        if (next === 'simple') {
            parts.value = [];
            tasks.value.forEach(task => {
                task.subtasks = [];
            });
        }
    };
    const addTask = () => {
        tasks.value.push(newTask());
    };
    const addSubtask = (task, level) => {
        if (level === 2 || level === 3) {
            task.subtasks.push(newTask());
        }
    };
    const removeTask = (id) => {
        tasks.value = tasks.value.filter(task => task.id !== id);
    };
    const removeNestedTask = (parent, id) => {
        parent.subtasks = parent.subtasks.filter(task => task.id !== id);
    };
    const moveTask = (list, index, delta) => {
        const next = index + delta;
        if (next < 0 || next >= list.length)
            return;
        const [item] = list.splice(index, 1);
        list.splice(next, 0, item);
    };
    const addCriterion = (task) => {
        task.criteria.push(newCriterion());
    };
    const removeCriterion = (task, id) => {
        task.criteria = task.criteria.filter(criterion => criterion.id !== id);
    };
    const addPart = () => {
        parts.value.push(newPart());
    };
    const removePart = (id) => {
        parts.value = parts.value.filter(part => part.id !== id);
    };
    const buildExam = () => {
        const now = new Date();
        const taskNodes = flattenTasks(tasks.value);
        const exam = {
            id: examId.value ?? createUuid(),
            title: title.value.trim(),
            description: description.value.trim() || undefined,
            classGroupId: classGroupId.value.trim() || undefined,
            mode: mode.value,
            structure: {
                parts: parts.value.map((part, index) => ({
                    id: part.id,
                    name: part.name || `Part ${index + 1}`,
                    description: part.description || undefined,
                    taskIds: part.taskIds,
                    calculateSubScore: part.calculateSubScore,
                    scoreType: part.scoreType,
                    printable: part.printable,
                    order: index + 1
                })),
                tasks: taskNodes,
                allowsComments: false,
                allowsSupportTips: false,
                totalPoints: totalPoints.value
            },
            gradingKey: {
                id: createUuid(),
                name: 'default',
                type: 'points',
                totalPoints: totalPoints.value,
                gradeBoundaries: [],
                roundingRule: { type: 'none', decimalPlaces: 0 },
                errorPointsToGrade: false,
                customizable: true,
                modifiedAfterCorrection: false
            },
            printPresets: [],
            candidates: [],
            status: 'draft',
            createdAt: createdAt.value ?? now,
            lastModified: now
        };
        return exam;
    };
    const saveExam = async () => {
        const router = useRouter();
        const { examRepository } = useExamsBridge();
        const { success, error: showError } = useToast();
        if (!canSave.value) {
            showError('Add a title and at least one task before saving.');
            return;
        }
        const exam = buildExam();
        try {
            if (isEditing.value && examId.value) {
                await examRepository?.update(examId.value, exam);
                success('Exam updated.');
            }
            else {
                const created = await examRepository?.create?.(exam);
                if (created) {
                    examId.value = created.id;
                }
                success('Exam saved.');
            }
            router.push('/exams');
        }
        catch (err) {
            showError(err instanceof Error ? err.message : 'Failed to save exam.');
        }
    };
    const loadExam = async (id) => {
        const router = useRouter();
        const { examRepository } = useExamsBridge();
        const { error: showError } = useToast();
        try {
            const exam = await examRepository?.findById(id);
            if (!exam) {
                showError('Exam not found.');
                router.push('/exams');
                return;
            }
            examId.value = id;
            isEditing.value = true;
            createdAt.value = exam.createdAt;
            title.value = exam.title;
            description.value = exam.description ?? '';
            classGroupId.value = exam.classGroupId ?? '';
            mode.value = exam.mode;
            parts.value = exam.structure.parts.map((part, index) => ({
                id: part.id,
                name: part.name,
                description: part.description ?? '',
                taskIds: part.taskIds,
                calculateSubScore: part.calculateSubScore,
                scoreType: part.scoreType,
                printable: part.printable,
                order: index + 1
            }));
            if (exam.mode === 'simple') {
                tasks.value = exam.structure.tasks
                    .filter(task => task.level === 1)
                    .sort((a, b) => a.order - b.order)
                    .map(task => ({
                    id: task.id,
                    title: task.title,
                    points: task.points,
                    bonusPoints: task.bonusPoints ?? 0,
                    isChoice: task.isChoice,
                    choiceGroup: task.choiceGroup ?? '',
                    criteria: task.criteria.map(criterion => ({
                        id: criterion.id,
                        text: criterion.text,
                        points: criterion.points
                    })),
                    subtasks: []
                }));
                return;
            }
            const byId = new Map();
            exam.structure.tasks.forEach(task => {
                byId.set(task.id, {
                    id: task.id,
                    title: task.title,
                    points: task.points,
                    bonusPoints: task.bonusPoints ?? 0,
                    isChoice: task.isChoice,
                    choiceGroup: task.choiceGroup ?? '',
                    criteria: task.criteria.map(criterion => ({
                        id: criterion.id,
                        text: criterion.text,
                        points: criterion.points
                    })),
                    subtasks: []
                });
            });
            const root = [];
            exam.structure.tasks
                .sort((a, b) => a.order - b.order)
                .forEach(task => {
                const draft = byId.get(task.id);
                if (!draft)
                    return;
                if (!task.parentId) {
                    root.push(draft);
                }
                else {
                    const parent = byId.get(task.parentId);
                    if (parent) {
                        parent.subtasks.push(draft);
                    }
                }
            });
            tasks.value = root;
        }
        catch (err) {
            showError(err instanceof Error ? err.message : 'Failed to load exam.');
            router.push('/exams');
        }
    };
    const reset = () => {
        examId.value = undefined;
        isEditing.value = false;
        createdAt.value = null;
        title.value = '';
        description.value = '';
        classGroupId.value = '';
        mode.value = 'simple';
        tasks.value = [];
        parts.value = [];
    };
    return {
        // State
        title,
        description,
        classGroupId,
        mode,
        tasks,
        parts,
        isEditing,
        createdAt,
        examId,
        // Getters
        flatTasks,
        totalPoints,
        canSave,
        // Actions
        setMode,
        addTask,
        addSubtask,
        removeTask,
        removeNestedTask,
        moveTask,
        addCriterion,
        removeCriterion,
        addPart,
        removePart,
        buildExam,
        saveExam,
        loadExam,
        reset
    };
});
