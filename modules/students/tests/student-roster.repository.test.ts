import { InMemoryStorageAdapter } from '@viccoboard/storage/browser';
import { StudentRepository } from '../src/repositories/student.repository';

describe('StudentRepository class roster', () => {
  test('hides inactive students without changing their identity or class', async () => {
    const adapter = new InMemoryStorageAdapter();
    await adapter.initialize();
    const repository = new StudentRepository(adapter);

    const student = await repository.create({
      firstName: 'Anna',
      lastName: 'Muster',
      dateOfBirth: '2010-10-01',
      classGroupId: 'class-9a'
    });

    expect(await repository.findByClassGroup('class-9a')).toHaveLength(1);

    await repository.update(student.id, { inactive: true });

    expect(await repository.findByClassGroup('class-9a')).toHaveLength(0);
    expect(await repository.findAllByClassGroup('class-9a')).toHaveLength(1);
    expect(await repository.findById(student.id)).toMatchObject({
      id: student.id,
      classGroupId: 'class-9a',
      inactive: true
    });

    await repository.update(student.id, { inactive: false });
    expect(await repository.findByClassGroup('class-9a')).toHaveLength(1);
  });
});
