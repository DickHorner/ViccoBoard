import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import type { ClassGroup, Student, Sport } from '@viccoboard/core';
import { TournamentService, type ScoreboardSessionMetadata } from '@viccoboard/sport';

import { getSportBridge } from './useSportBridge';
import { getStudentsBridge, initializeStudentsBridge } from './useStudentsBridge';

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
  const classes = ref<ClassGroup[]>([]);
  const classStudents = ref<Student[]>([]);
  const selectedClassId = ref('');
  const presentStudentIds = ref<string[]>([]);
  const roundError = ref('');
  const scoreError = ref('');
  const form = ref({
    name: '',
    type: 'round-robin' as 'round-robin' | 'knockout' | 'adaptive',
    teams: ['', ''],
    teamSize: 1
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
  let studentsBridge: ReturnType<typeof getStudentsBridge>;
  try {
    initializeStudentsBridge();
    studentsBridge = getStudentsBridge();
  } catch {
    studentsBridge = null as never;
  }

  try {
    bridge = getSportBridge();
  } catch {
    bridge = null as never;
  }

  function matchTeamName(match: Sport.Match, side: 1 | 2): string {
    const participantIds = side === 1 ? match.team1ParticipantIds : match.team2ParticipantIds;
    if (participantIds?.length) return participantIds.map(teamName).join(' / ');
    return teamName(side === 1 ? match.team1Id : match.team2Id);
  }

  function teamName(teamId: string): string {
    if (!activeTournament.value || !teamId) return '';
    const team = activeTournament.value.teams.find(t => t.id === teamId);
    return team?.name ?? teamId;
  }

  function formatType(type: string): string {
    if (type === 'round-robin') return t('TOURNAMENTS.mode.round_robin');
    if (type === 'knockout') return t('TOURNAMENTS.mode.knockout');
    if (type === 'adaptive') return t('TOURNAMENTS.mode.adaptive');
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
    if (!activeTournament.value || !['round-robin', 'adaptive'].includes(activeTournament.value.type)) return [];
    if (activeTournament.value.type === 'adaptive') {
      return tournamentService.computeAdaptiveStandings(activeTournament.value.teams, activeTournament.value.matches);
    }
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

  async function loadClasses() {
    if (!bridge) return;
    classes.value = await bridge.classGroupRepository.findAll();
  }

  async function loadClassStudents() {
    classStudents.value = studentsBridge && selectedClassId.value
      ? await studentsBridge.studentRepository.findByClassGroup(selectedClassId.value)
      : [];
    presentStudentIds.value = classStudents.value.map(student => student.id);
  }

  async function loadTournamentParticipants() {
    if (!activeTournament.value || activeTournament.value.type !== 'adaptive' || !studentsBridge) return;
    selectedClassId.value = activeTournament.value.classGroupId;
    await loadClassStudents();
    const allowed = new Set(activeTournament.value.teams.flatMap(team => team.studentIds));
    presentStudentIds.value = presentStudentIds.value.filter(id => allowed.has(id));
  }

  async function drawRound() {
    if (!activeTournament.value || saving.value) return;
    roundError.value = '';
    saving.value = true;
    try {
      const teamIds = activeTournament.value.teams
        .filter(team => presentStudentIds.value.includes(team.studentIds[0]))
        .map(team => team.id);
      const today = new Date();
      const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      activeTournament.value = await bridge.drawAdaptiveRoundUseCase.execute({
        tournamentId: activeTournament.value.id,
        participantIds: teamIds,
        sessionDate: date
      });
    } catch (error) {
      roundError.value = (error as Error).message;
    } finally {
      saving.value = false;
    }
  }

  async function cancelAdaptiveMatch(matchId: string) {
    if (!activeTournament.value || saving.value) return;
    roundError.value = '';
    saving.value = true;
    try {
      activeTournament.value = await bridge.drawAdaptiveRoundUseCase.cancelMatch(activeTournament.value.id, matchId);
    } catch (error) {
      roundError.value = (error as Error).message;
    } finally {
      saving.value = false;
    }
  }

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
    form.value = { name: '', type: 'round-robin', teams: ['', ''], teamSize: 1 };
    createError.value = '';
    selectedClassId.value = '';
    classStudents.value = [];
    view.value = 'create';
  }

  function cancelCreate() {
    view.value = 'list';
  }

  function openTournament(tournament: Sport.Tournament) {
    activeTournament.value = tournament;
    detailTab.value = 'matches';
    view.value = 'detail';
    roundError.value = '';
    void loadTournamentParticipants();
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
    if (form.value.type === 'adaptive' && (!selectedClassId.value || classStudents.value.length < form.value.teamSize * 2)) {
      createError.value = t('TOURNAMENTS.adaptive_select_class');
      return;
    }
    if (form.value.type !== 'adaptive' && filledTeams.length < 2) {
      createError.value = t('TOURNAMENTS.min_teams');
      return;
    }
    if (!form.value.name.trim()) return;

    saving.value = true;
    try {
      const teams = form.value.type === 'adaptive'
        ? classStudents.value.map(student => ({
          id: crypto.randomUUID(),
          name: `${student.firstName} ${student.lastName}`.trim(),
          studentIds: [student.id]
        }))
        : filledTeams.map(name => ({
        id: crypto.randomUUID(),
        name,
        studentIds: [] as string[]
      }));

      const created = await bridge.createTournamentUseCase.execute({
        classGroupId: form.value.type === 'adaptive' ? selectedClassId.value : 'default',
        name: form.value.name.trim(),
        type: form.value.type,
        teamSize: form.value.type === 'adaptive' ? form.value.teamSize : undefined,
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
    void loadClasses();
    const handoff = sessionStorage.getItem('scoreboard_handoff_teams');
    if (handoff) {
      sessionStorage.removeItem('scoreboard_handoff_teams');
      try {
        const teams: string[] = JSON.parse(handoff);
        if (Array.isArray(teams) && teams.length >= 2) {
          form.value = { name: '', type: 'round-robin', teams, teamSize: 1 };
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
    classes,
    classStudents,
    selectedClassId,
    presentStudentIds,
    roundError,
    loadClassStudents,
    drawRound,
    cancelAdaptiveMatch,
    scoreError,
    form,
    scoreEntry,
    scoreboardSessions,
    selectedScoreboardSessionId,
    scoreboardImportHint,
    teamName,
    matchTeamName,
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
