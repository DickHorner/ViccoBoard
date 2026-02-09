import { CooperTestService } from '../src/services/cooper-test.service';
describe('CooperTestService', () => {
    const table = {
        id: 'table-1',
        name: 'Cooper Running',
        type: 'simple',
        source: 'local',
        dimensions: [],
        mappingRules: [],
        entries: [
            { key: { minDistance: 0, maxDistance: 1999, sportType: 'running' }, value: '4' },
            { key: { minDistance: 2000, maxDistance: 2499, sportType: 'running' }, value: '3' },
            { key: { minDistance: 2500, sportType: 'running' }, value: '2' },
            { key: { distance: 400, sportType: 'swimming' }, value: '1' }
        ],
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        lastModified: new Date('2026-01-01T00:00:00.000Z')
    };
    test('calculates distance from rounds', () => {
        const service = new CooperTestService();
        const distance = service.calculateDistance(8, 200, 50);
        expect(distance).toBe(1650);
    });
    test('builds a result with timestamp', () => {
        const service = new CooperTestService();
        const result = service.buildResult('running', 5, 200, 20);
        expect(result.distanceMeters).toBe(1020);
        expect(result.timestamp).toBeInstanceOf(Date);
    });
    test('calculates grade from table with context', () => {
        const service = new CooperTestService();
        const grade = service.calculateGradeFromTable(table, 2200, { sportType: 'running' });
        expect(grade).toBe('3');
    });
    test('matches exact distance entries', () => {
        const service = new CooperTestService();
        const grade = service.calculateGradeFromTable(table, 400, { sportType: 'swimming' });
        expect(grade).toBe('1');
    });
});
