import type { ClassGroup, Student } from '@viccoboard/core';
import {
  CopyClassGroupToSchoolYearUseCase,
  type CopyClassGroupGateway
} from '../../src/use-cases/copy-class-group-to-school-year.use-case';
import type { StudentRepository } from '../../src/repositories/student.repository';

describe('CopyClassGroupToSchoolYearUseCase', () => {
  let groups: ClassGroup[];
  let students: Student[];
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
    students = [{
      id: 'pupil-1',
      firstName: 'Anna',
      lastName: 'Muster',
      dateOfBirth: '2010-10-01',
      classGroupId: 'class-9a',
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
      delete: async id => {
        const oldLength = groups.length;
        groups = groups.filter(group => group.id !== id);
        return groups.length < oldLength;
      }
    };
    const studentGateway = {
      findByClassGroup: async (id: string) => students.filter(student => student.classGroupId === id),
      create: async (input: Omit<Student, 'id' | 'createdAt' | 'lastModified'>) => {
        const student: Student = {
          ...input,
          id: `pupil-${students.length + 1}`,
          createdAt: new Date(),
          lastModified: new Date()
        };
        students.push(student);
        return student;
      }
    } as StudentRepository;

    useCase = new CopyClassGroupToSchoolYearUseCase(studentGateway, classGateway);
  });

  test('copies a class, its grade level and pupils without touching the original', async () => {
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
    expect(result.copiedStudents).toBe(1);
    expect(students.filter(student => student.classGroupId === result.classGroup.id)).toHaveLength(1);
    expect(students.filter(student => student.classGroupId === 'class-9a')).toHaveLength(1);
    expect(students[0].id).not.toBe(students[1].id);
    expect(groups[0].gradeLevel).toBe(9);
  });

  test('rejects duplicate target classes without copying pupils', async () => {
    groups.push({ ...groups[0], id: 'already', name: '10a', schoolYear: '2026/2027' });

    await expect(useCase.execute({
      sourceClassGroupId: 'class-9a',
      targetSchoolYear: '2026/2027',
      targetClassName: '10a',
      targetGradeLevel: 10
    })).rejects.toThrow('already exists');

    expect(students).toHaveLength(1);
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
