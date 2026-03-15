/**
 * GameEntryRepository Tests
 * Verifies CRUD operations for the local sport game database.
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { GameEntryRepository } from '../src/repositories/game-entry.repository';
import {
  SQLiteStorage,
  InitialSchemaMigration,
  GradingSchemaMigration,
  GameDatabaseSchemaMigration
} from '@viccoboard/storage/node';
import type { StorageAdapter } from '@viccoboard/storage/node';

describe('GameEntryRepository', () => {
  let storage: SQLiteStorage;
  let adapter: StorageAdapter;
  let repository: GameEntryRepository;

  beforeEach(async () => {
    storage = new SQLiteStorage({ databasePath: ':memory:', memory: true });
    await storage.initialize('test-password');
    storage.registerMigration(new InitialSchemaMigration(storage));
    storage.registerMigration(new GradingSchemaMigration(storage));
    storage.registerMigration(new GameDatabaseSchemaMigration(storage));
    await storage.migrate();

    adapter = storage.getAdapter();
    repository = new GameEntryRepository(adapter);
  });

  afterEach(async () => {
    if (storage) await storage.close();
  });

  it('creates and retrieves a game entry by id', async () => {
    const entry = await repository.create({
      name: 'Zahlenball',
      category: 'erwaermung',
      phase: 'erwaermung',
      difficulty: 'anfaenger',
      duration: 5,
      ageGroup: 'Klasse 5–10',
      material: '1 Ball',
      goal: 'Aktivierung und Reaktion',
      description: 'Alle stehen im Kreis und werfen sich den Ball zu.',
      isCustom: false
    });

    expect(entry.id).toBeDefined();
    expect(entry.name).toBe('Zahlenball');
    expect(entry.category).toBe('erwaermung');
    expect(entry.difficulty).toBe('anfaenger');
    expect(entry.duration).toBe(5);
    expect(entry.isCustom).toBe(false);

    const found = await repository.findById(entry.id);
    expect(found).not.toBeNull();
    expect(found!.name).toBe('Zahlenball');
  });

  it('returns null when entry not found', async () => {
    const result = await repository.findById('nonexistent-id');
    expect(result).toBeNull();
  });

  it('finds all entries', async () => {
    await repository.create({
      name: 'Spiel A',
      category: 'ballspiel',
      phase: 'hauptteil',
      difficulty: 'fortgeschrittene',
      duration: 20,
      ageGroup: 'Klasse 7–10',
      goal: 'Teamspiel',
      description: 'Beschreibung A',
      isCustom: true
    });

    await repository.create({
      name: 'Spiel B',
      category: 'laufspiel',
      phase: 'erwaermung',
      difficulty: 'anfaenger',
      duration: 10,
      ageGroup: 'Klasse 5–7',
      goal: 'Laufen',
      description: 'Beschreibung B',
      isCustom: false
    });

    const all = await repository.findAll();
    expect(all.length).toBe(2);
  });

  it('filters by category', async () => {
    await repository.create({
      name: 'Ballspiel 1',
      category: 'ballspiel',
      phase: 'hauptteil',
      difficulty: 'anfaenger',
      duration: 15,
      ageGroup: 'Klasse 5–8',
      goal: 'Werfen',
      description: 'Desc',
      isCustom: false
    });

    await repository.create({
      name: 'Laufspiel 1',
      category: 'laufspiel',
      phase: 'erwaermung',
      difficulty: 'anfaenger',
      duration: 8,
      ageGroup: 'Klasse 5–7',
      goal: 'Laufen',
      description: 'Desc',
      isCustom: false
    });

    const ballGames = await repository.findByCategory('ballspiel');
    expect(ballGames.length).toBe(1);
    expect(ballGames[0].name).toBe('Ballspiel 1');
  });

  it('updates an entry', async () => {
    const entry = await repository.create({
      name: 'Original',
      category: 'koordination',
      phase: 'hauptteil',
      difficulty: 'fortgeschrittene',
      duration: 10,
      ageGroup: 'Klasse 6–9',
      goal: 'Koordination verbessern',
      description: 'Ursprüngliche Beschreibung',
      isCustom: true
    });

    const updated = await repository.update(entry.id, {
      name: 'Aktualisiert',
      duration: 15
    });

    expect(updated.name).toBe('Aktualisiert');
    expect(updated.duration).toBe(15);
    expect(updated.category).toBe('koordination');

    const found = await repository.findById(entry.id);
    expect(found!.name).toBe('Aktualisiert');
  });

  it('deletes an entry', async () => {
    const entry = await repository.create({
      name: 'Zu löschendes Spiel',
      category: 'sonstiges',
      phase: 'schluss',
      difficulty: 'anfaenger',
      duration: 5,
      ageGroup: 'Klasse 5–12',
      goal: 'Abschluss',
      description: 'Kurze Beschreibung',
      isCustom: true
    });

    await repository.delete(entry.id);

    const found = await repository.findById(entry.id);
    expect(found).toBeNull();
  });

  it('counts entries correctly', async () => {
    expect(await repository.count()).toBe(0);

    await repository.create({
      name: 'Spiel 1',
      category: 'erwaermung',
      phase: 'erwaermung',
      difficulty: 'anfaenger',
      duration: 5,
      ageGroup: 'Klasse 5–8',
      goal: 'Aufwärmen',
      description: 'Desc',
      isCustom: false
    });

    expect(await repository.count()).toBe(1);
  });

  it('persists optional fields correctly', async () => {
    const entry = await repository.create({
      name: 'Mit Variationen',
      category: 'reaktionsspiel',
      phase: 'erwaermung',
      difficulty: 'anfaenger',
      duration: 7,
      ageGroup: 'Klasse 5–9',
      material: 'Farbkarten',
      goal: 'Reaktion testen',
      description: 'Grundbeschreibung',
      variation: 'Variante A oder B',
      notes: 'Sicherheit beachten',
      sportType: 'Allgemein',
      isCustom: false
    });

    const found = await repository.findById(entry.id);
    expect(found!.material).toBe('Farbkarten');
    expect(found!.variation).toBe('Variante A oder B');
    expect(found!.notes).toBe('Sicherheit beachten');
    expect(found!.sportType).toBe('Allgemein');
  });
});
