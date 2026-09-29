import { InMemoryStorageAdapter } from '@viccoboard/storage/browser';
import { SubjectRepository } from '../src/repositories/subject.repository';

describe('SubjectRepository', () => {
  const createRepository = async () => {
    const adapter = new InMemoryStorageAdapter();
    await adapter.initialize();
    return new SubjectRepository(adapter);
  };

  it('creates and reloads subjects', async () => {
    const repository = await createRepository();

    const created = await repository.create({
      name: 'Sport',
      workspaceProfile: 'sport'
    });

    const loaded = await repository.findById(created.id);

    expect(loaded?.name).toBe('Sport');
    expect(loaded?.workspaceProfile).toBe('sport');
  });

  it('rejects duplicate subject names case-insensitively', async () => {
    const repository = await createRepository();

    await repository.create({
      name: 'Physik',
      workspaceProfile: 'generic'
    });

    await expect(repository.create({
      name: 'physik',
      workspaceProfile: 'generic'
    })).rejects.toThrow('Subject name already exists');
  });

  it('rejects empty subject names', async () => {
    const repository = await createRepository();

    await expect(repository.create({
      name: '   ',
      workspaceProfile: 'generic'
    })).rejects.toThrow('Subject name is required');
  });
});
