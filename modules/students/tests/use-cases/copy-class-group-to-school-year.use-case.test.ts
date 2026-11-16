import type { ClassGroup } from '@viccoboard/core';
import {
  CopyClassGroupToSchoolYearUseCase,
  type CopyClassGroupGateway
} from '../../src/use-cases/copy-class-group-to-school-year.use-case';

describe('CopyClassGroupToSchoolYearUseCase', () => {
  let groups: ClassGroup[];
  let useCase: CopyClassGroupToSchoolYearUseCase;

  beforeEach(() => {
    groups = [{
      id: 'class-9a',
      name: '9a',
      schoolYear: '2025/2026',
      gradeLevel: 9,
      archived: false,
      createdAt: new Date(),
      lastModified: new Date()
    }];

    const classGateway: CopyClassGroupGateway = {
      findById: async id => groups.find(group => group.id === id) ?? null,
      findBySchoolYear: async year => groups.filter(group => group.schoolYear === year),
      create: async input => {
        const group: ClassGroup = {
          ...input,
          id: `class-${groups.length + 1}`,
          createdAt: new Date(),
          lastModified: new Date()
        };
        groups.push(group);
        return group;
      },
      update: async (id, changes) => {
        const group = groups.find(group => group.id === id);
        if (!group) throw new Error('Class not found');
        Object.assign(group, changes);
        return group;
      },
      delete: async id => {
        const oldLength = groups.length;
        groups = groups.filter(group => group.id !== id);
        return groups.length < oldLength;
      }
    };
    useCase = new CopyClassGroupToSchoolYearUseCase(classGateway);
  });

  test('promotes the same class ID without creating a class or pupils', async () => {
    const result = await useCase.execute({
      sourceClassGroupId: 'class-9a',
      targetSchoolYear: '2026/2027',
      targetClassName: '10a',
      targetGradeLevel: 10
    });

    expect(result.classGroup).toMatchObject({
      name: '10a',
      gradeLevel: 10,
      schoolYear: '2026/2027',
      archived: false
    });
    expect(result.classGroup.id).toBe('class-9a');
    expect(result.copiedStudents).toBe(0);
    expect(groups).toHaveLength(1);
    expect(groups[0].gradeLevel).toBe(10);
  });

  test('rejects duplicate target class names', async () => {
    groups.push({ ...groups[0], id: 'already', name: '10a', schoolYear: '2026/2027' });

    await expect(useCase.execute({
      sourceClassGroupId: 'class-9a',
      targetSchoolYear: '2026/2027',
      targetClassName: '10a',
      targetGradeLevel: 10
    })).rejects.toThrow('already exists');

    expect(groups[0].schoolYear).toBe('2025/2026');
  });

  test('rejects invalid target school years and grade levels', async () => {
    await expect(useCase.execute({
      sourceClassGroupId: 'class-9a',
      targetSchoolYear: '2026/2029'
    })).rejects.toThrow('YYYY/YYYY');

    await expect(useCase.execute({
      sourceClassGroupId: 'class-9a',
      targetSchoolYear: '2026/2027',
      targetGradeLevel: 14
    })).rejects.toThrow('between 1 and 13');
  });
});
