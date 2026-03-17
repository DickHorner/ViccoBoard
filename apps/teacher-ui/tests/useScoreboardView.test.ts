const mockRouterPush = jest.fn();
const mockFindClasses = jest.fn().mockResolvedValue([]);
const mockFindToolSessions = jest.fn().mockResolvedValue([]);
const mockFindToolSessionsByClass = jest.fn().mockResolvedValue([]);
const mockSaveScoreboardSession = jest.fn();

jest.mock('vue', () => {
  const actual = jest.requireActual('vue');
  return {
    ...actual,
    onMounted: (callback: () => void | Promise<void>) => {
      void callback();
    },
    onUnmounted: jest.fn(),
    watch: jest.fn()
  };
});

jest.mock('vue-router', () => ({
  useRouter: () => ({ push: mockRouterPush })
}));

jest.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      if (key === 'SCORES.teamNamePlaceholder') {
        return 'Team';
      }
      if (key === 'SCORES.timerLinkedSummary') {
        return `linked:${String(params?.timer ?? '')}`;
      }
      return key;
    }
  })
}));

jest.mock('../src/composables/useSportBridge', () => ({
  initializeSportBridge: jest.fn(),
  getSportBridge: () => ({
    classGroupRepository: { findAll: mockFindClasses },
    toolSessionRepository: {
      findAll: mockFindToolSessions,
      findByClassGroup: mockFindToolSessionsByClass
    },
    saveScoreboardSessionUseCase: {
      execute: mockSaveScoreboardSession
    }
  })
}));

import { useScoreboardView } from '../src/composables/useScoreboardView';

describe('useScoreboardView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
    mockSaveScoreboardSession.mockResolvedValue({
      id: 'scoreboard-session-1',
      classGroupId: 'class-1',
      sessionMetadata: {
        sessionName: 'Volleyball Session'
      }
    });
  });

  it('persists presenter layout and inline timer state when saving', async () => {
    const view = useScoreboardView();

    view.sessionName.value = 'Volleyball Session';
    view.setLayout(4);
    view.activeTeams.value[0].name = 'Lions';
    view.activeTeams.value[1].name = 'Tigers';
    view.activeTeams.value[2].name = 'Bears';
    view.activeTeams.value[3].name = 'Wolves';
    view.timerElapsedMs.value = 54321;

    await view.saveSession();

    expect(mockSaveScoreboardSession).toHaveBeenCalledWith(expect.objectContaining({
      sessionName: 'Volleyball Session',
      layout: 4,
      inlineTimer: {
        elapsedMs: 54321,
        running: false
      },
      teams: [
        expect.objectContaining({ name: 'Lions' }),
        expect.objectContaining({ name: 'Tigers' }),
        expect.objectContaining({ name: 'Bears' }),
        expect.objectContaining({ name: 'Wolves' })
      ]
    }));
  });

  it('stores the active teams for tournament handoff and navigates to tournaments', () => {
    const view = useScoreboardView();

    view.setLayout(4);
    view.activeTeams.value[0].name = 'Lions';
    view.activeTeams.value[1].name = 'Tigers';
    view.activeTeams.value[2].name = '';
    view.activeTeams.value[3].name = 'Bears';

    view.handoffToTournament();

    expect(sessionStorage.getItem('scoreboard_handoff_teams')).toBe(
      JSON.stringify(['Lions', 'Tigers', 'Team 3', 'Bears'])
    );
    expect(mockRouterPush).toHaveBeenCalledWith({ name: 'tournaments' });
  });
});
