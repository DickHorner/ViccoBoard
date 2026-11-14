const mockRouterPush = jest.fn();
const mockFindStudents = jest.fn().mockResolvedValue([]);

jest.mock('vue-router', () => ({
  useRouter: () => ({ push: mockRouterPush })
}));

jest.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key })
}));

jest.mock('../src/composables/useSportBridge', () => ({
  initializeSportBridge: jest.fn(),
  getSportBridge: () => ({
    classGroupRepository: { findAll: jest.fn().mockResolvedValue([]) }
  })
}));

jest.mock('../src/composables/useStudentsBridge', () => ({
  initializeStudentsBridge: jest.fn(),
  getStudentsBridge: () => ({
    studentRepository: { findByClassGroup: mockFindStudents }
  })
}));

import { useTeamBuilderView } from '../src/composables/useTeamBuilderView';

describe('TeamBuilder tournament handoff', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
    mockFindStudents.mockResolvedValue([]);
  });

  it('passes all current team memberships to the tournament planner without requiring a save', () => {
    const view = useTeamBuilderView();
    view.selectedClassId.value = 'class-1';
    view.teams.value = [
      { id: 'red', name: 'Red', students: [{ id: 's1' }, { id: 's2' }] as any },
      { id: 'blue', name: 'Blue', students: [{ id: 's3' }, { id: 's4' }] as any }
    ];

    expect(view.canHandoffToTournament.value).toBe(true);
    view.handoffToTournament();

    expect(JSON.parse(sessionStorage.getItem('team_builder_handoff')!)).toEqual({
      classGroupId: 'class-1',
      teams: [
        { id: 'red', name: 'Red', studentIds: ['s1', 's2'] },
        { id: 'blue', name: 'Blue', studentIds: ['s3', 's4'] }
      ]
    });
    expect(mockRouterPush).toHaveBeenCalledWith({ name: 'tournaments' });
  });

  it('does not transfer an incomplete saved team session', async () => {
    mockFindStudents.mockResolvedValue([{ id: 's1' }]);
    const view = useTeamBuilderView();
    view.selectedClassId.value = 'class-1';

    await view.loadSession({
      sessionMetadata: {
        sessionName: 'Training',
        teams: [
          { id: 'red', name: 'Red', studentIds: ['s1', 'missing'] },
          { id: 'blue', name: 'Blue', studentIds: ['missing-2'] }
        ]
      }
    } as any);

    expect(view.canHandoffToTournament.value).toBe(false);
    expect(view.warning.value).toBe('TEAM.handoff_missing_members');
    view.handoffToTournament();
    expect(sessionStorage.getItem('team_builder_handoff')).toBeNull();
    expect(mockRouterPush).not.toHaveBeenCalled();
  });
});
