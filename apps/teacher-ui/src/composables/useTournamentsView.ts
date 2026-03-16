import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import type { Sport } from '@viccoboard/core';
import { TournamentService, type ScoreboardSessionMetadata } from '@viccoboard/sport';

import { getSportBridge } from './useSportBridge';

type View = 'list' | 'create' | 'detail';

export function useTournamentsView() {
  const { t } = useI18n();

  const view = ref<View>('list');
  const detailTab = ref<'matches' | 'standings' | 'bracket'>('matches');
  const loading = ref(false);
  const saving = ref(false);
  const tournaments = ref<Sport.Tournament[]>([]);
  const activeTournament = ref<Sport.Tournament | null>(null);
  const createError = ref('');
  const scoreError = ref('');
  const form = ref({
    name: '',
    type: 'round-robin' as 'round-robin' | 'knockout',
    teams: ['', '']
  });
  const scoreEntry = ref<{
    open: boolean;
    match: Sport.Match | null;
    score1: number;
    score2: number;
  }>({
    open: false,
    match: null,
    score1: 0,
    score2: 0
  });
  const scoreboardSessions = ref<Sport.ToolSession[]>([]);
  const selectedScoreboardSessionId = ref('');
  const scoreboardImportHint = ref(false);

  let bridge: ReturnType<typeof getSportBridge>;
  const tournamentService = new TournamentService();

  try {
    bridge = getSportBridge();
  } catch {
    bridge = null as never;
  }

  function teamName(teamId: string): string {
    if (!activeTournament.value || !teamId) return '';
    const team = activeTournament.value.teams.find(t => t.id === teamId);
    return team?.name ?? teamId;
  }

  function formatType(type: string): string {
    if (type === 'round-robin') return t('TOURNAMENTS.mode.round_robin');
    if (type === 'knockout') return t('TOURNAMENTS.mode.knockout');
    return type;
  }

  const matchesByRound = computed(() => {
    if (!activeTournament.value) return [];
    const rounds: { round: number; matches: Sport.Match[] }[] = [];
    const sorted = [...activeTournament.value.matches].sort(
      (a, b) => a.round - b.round || a.sequence - b.sequence
    );
    for (const match of sorted) {
      let bucket = rounds.find(r => r.round === match.round);
      if (!bucket) {
        bucket = { round: match.round, matches: [] };
        rounds.push(bucket);
      }
      bucket.matches.push(match);
    }
    return rounds;
  });

  const standings = computed(() => {
    if (!activeTournament.value || activeTournament.value.type !== 'round-robin') return [];
    return tournamentService.computeRoundRobinStandings(
      activeTournament.value.teams,
      activeTournament.value.matches
    );
  });

  const knockoutBracket = computed(() => {
    if (!activeTournament.value || activeTournament.value.type !== 'knockout') {
      return { rounds: [] };
    }
    return tournamentService.buildKnockoutBracket(
      activeTournament.value.teams,
      activeTournament.value.matches
    );
  });

  async function loadTournaments() {
    if (!bridge) return;
    loading.value = true;
    try {
      tournaments.value = await bridge.tournamentRepository.findAll();
    } finally {
      loading.value = false;
    }
  }

  function startCreate() {
    form.value = { name: '', type: 'round-robin', teams: ['', ''] };
    createError.value = '';
    view.value = 'create';
  }

  function cancelCreate() {
    view.value = 'list';
  }

  function openTournament(tournament: Sport.Tournament) {
    activeTournament.value = tournament;
    detailTab.value = 'matches';
    view.value = 'detail';
  }

  async function backToList() {
    await loadTournaments();
    activeTournament.value = null;
    view.value = 'list';
  }

  function addTeam() {
    form.value.teams.push('');
  }

  function removeTeam(idx: number) {
    form.value.teams.splice(idx, 1);
  }

  async function submitCreate() {
    createError.value = '';
    const filledTeams = form.value.teams.map(n => n.trim()).filter(n => n.length > 0);
    if (filledTeams.length < 2) {
      createError.value = t('TOURNAMENTS.min_teams');
      return;
    }
    if (!form.value.name.trim()) return;

    saving.value = true;
    try {
      const { v4: uuidv4 } = await import('uuid');
      const teams = filledTeams.map(name => ({
        id: uuidv4(),
        name,
        studentIds: [] as string[]
      }));

      const created = await bridge.createTournamentUseCase.execute({
        classGroupId: 'default',
        name: form.value.name.trim(),
        type: form.value.type,
        teams
      });

      tournaments.value = [created, ...tournaments.value];
      openTournament(created);
    } catch (err) {
      createError.value = (err as Error).message;
    } finally {
      saving.value = false;
    }
  }

  async function openScoreEntry(match: Sport.Match): Promise<void> {
    selectedScoreboardSessionId.value = '';
    scoreboardImportHint.value = false;
    scoreEntry.value = { open: true, match, score1: 0, score2: 0 };
    scoreError.value = '';
    await loadScoreboardSessions();
  }

  function closeScoreEntry() {
    scoreEntry.value = { open: false, match: null, score1: 0, score2: 0 };
    scoreError.value = '';
    scoreboardSessions.value = [];
    selectedScoreboardSessionId.value = '';
    scoreboardImportHint.value = false;
  }

  async function loadScoreboardSessions(): Promise<void> {
    if (!bridge) return;
    const classGroupId = activeTournament.value?.classGroupId;
    const all = classGroupId && classGroupId !== 'default'
      ? await bridge.toolSessionRepository.findByClassGroup(classGroupId)
      : await bridge.toolSessionRepository.findAll();
    scoreboardSessions.value = [...all]
      .filter(s => s.toolType === 'scoreboard')
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  function applyScoreboardSession(sessionId: string): void {
    if (!sessionId || !scoreEntry.value.match || !activeTournament.value) return;
    const session = scoreboardSessions.value.find(s => s.id === sessionId);
    if (!session) return;
    const metadata = session.sessionMetadata as ScoreboardSessionMetadata;
    const result = tournamentService.mapScoreboardResultToMatch(
      activeTournament.value.teams,
      scoreEntry.value.match,
      { teams: metadata.teams ?? [], scores: metadata.scores ?? {} }
    );
    scoreEntry.value.score1 = result.score1;
    scoreEntry.value.score2 = result.score2;
    scoreboardImportHint.value = true;
  }

  function scoreboardSessionLabel(session: Sport.ToolSession): string {
    const metadata = session.sessionMetadata as ScoreboardSessionMetadata;
    const teams = (metadata.teams ?? []).slice(0, 2);
    const names = teams.map(t => t.name).join(' vs ');
    const scores = teams.map(t => (metadata.scores ?? {})[t.id] ?? 0).join(':');
    const date = session.createdAt.toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    return `${metadata.sessionName ?? names} · ${scores} · ${date}`;
  }

  async function saveScore() {
    if (!scoreEntry.value.match || !activeTournament.value) return;
    scoreError.value = '';
    saving.value = true;
    try {
      const updated = await bridge.updateTournamentMatchUseCase.execute({
        tournamentId: activeTournament.value.id,
        matchId: scoreEntry.value.match.id,
        score1: scoreEntry.value.score1,
        score2: scoreEntry.value.score2
      });
      activeTournament.value = updated;
      closeScoreEntry();
    } catch (err) {
      scoreError.value = (err as Error).message;
    } finally {
      saving.value = false;
    }
  }

  async function deleteTournament() {
    if (!activeTournament.value) return;
    if (!confirm(t('TOURNAMENTS.confirm_delete'))) return;
    await bridge.tournamentRepository.delete(activeTournament.value.id);
    await backToList();
  }

  onMounted(() => {
    void loadTournaments();
    const handoff = sessionStorage.getItem('scoreboard_handoff_teams');
    if (handoff) {
      sessionStorage.removeItem('scoreboard_handoff_teams');
      try {
        const teams: string[] = JSON.parse(handoff);
        if (Array.isArray(teams) && teams.length >= 2) {
          form.value = { name: '', type: 'round-robin', teams };
          view.value = 'create';
        }
      } catch {
        // ignore malformed data
      }
    }
  });

  return {
    t,
    view,
    detailTab,
    loading,
    saving,
    tournaments,
    activeTournament,
    createError,
    scoreError,
    form,
    scoreEntry,
    scoreboardSessions,
    selectedScoreboardSessionId,
    scoreboardImportHint,
    teamName,
    formatType,
    matchesByRound,
    standings,
    knockoutBracket,
    startCreate,
    cancelCreate,
    openTournament,
    backToList,
    addTeam,
    removeTeam,
    submitCreate,
    openScoreEntry,
    closeScoreEntry,
    applyScoreboardSession,
    scoreboardSessionLabel,
    saveScore,
    deleteTournament,
  };
}
