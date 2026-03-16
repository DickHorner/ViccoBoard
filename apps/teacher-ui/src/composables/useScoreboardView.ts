import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import type { ClassGroup, Sport } from '@viccoboard/core';
import type { ScoreboardSessionMetadata, TeamSessionMetadata } from '@viccoboard/sport';

import { getSportBridge, initializeSportBridge } from './useSportBridge';

interface TeamState {
  id: string;
  slot: number;
  name: string;
  color: string;
}

interface ScoreHistoryEntry {
  teamId: string;
  points: number;
  type: 'add' | 'subtract' | 'set';
  description: string;
  timestamp: string;
}

const TEAM_COLORS = [
  { value: '#3b82f6', label: 'Blau' },
  { value: '#ef4444', label: 'Rot' },
  { value: '#22c55e', label: 'Grün' },
  { value: '#f59e0b', label: 'Gelb' },
  { value: '#a855f7', label: 'Lila' },
  { value: '#ec4899', label: 'Pink' },
  { value: '#06b6d4', label: 'Cyan' },
  { value: '#f97316', label: 'Orange' },
];

const DEFAULT_COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b'];

function makeTeam(slot: number): TeamState {
  return {
    id: `team-${slot}`,
    slot,
    name: '',
    color: DEFAULT_COLORS[(slot - 1) % DEFAULT_COLORS.length],
  };
}

export function useScoreboardView() {
  initializeSportBridge();

  const { t } = useI18n();
  const router = useRouter();
  const bridge = getSportBridge();

  const viewMode = ref<'manage' | 'presenter'>('manage');
  const layout = ref<2 | 4>(2);

  const allTeams = ref<TeamState[]>([makeTeam(1), makeTeam(2), makeTeam(3), makeTeam(4)]);
  const activeTeams = computed(() => allTeams.value.slice(0, layout.value));

  const scores = ref<Record<string, number>>({
    'team-1': 0,
    'team-2': 0,
    'team-3': 0,
    'team-4': 0,
  });

  const history = ref<ScoreHistoryEntry[]>([]);

  const classes = ref<ClassGroup[]>([]);
  const selectedClassId = ref('');
  const selectedTeamSessionId = ref('');
  const linkedTimerSessionId = ref('');
  const availableTeamSessions = ref<Sport.ToolSession[]>([]);
  const availableTimerSessions = ref<Sport.ToolSession[]>([]);
  const savedSessions = ref<Sport.ToolSession[]>([]);
  const currentSessionId = ref<string>();
  const sessionName = ref('');
  const saving = ref(false);
  const message = ref('');

  const timerElapsedMs = ref(0);
  const timerRunning = ref(false);
  let timerIntervalHandle: number | undefined;
  let timerLastTick: number | undefined;

  function setLayout(n: 2 | 4): void {
    layout.value = n;
  }

  function startTimer(): void {
    if (timerRunning.value) return;
    timerRunning.value = true;
    timerLastTick = Date.now();
    timerIntervalHandle = window.setInterval(() => {
      const now = Date.now();
      timerElapsedMs.value += now - (timerLastTick ?? now);
      timerLastTick = now;
    }, 200);
  }

  function pauseTimer(): void {
    timerRunning.value = false;
    window.clearInterval(timerIntervalHandle);
    timerIntervalHandle = undefined;
  }

  function resetTimer(): void {
    pauseTimer();
    timerElapsedMs.value = 0;
  }

  const canSave = computed(() => {
    const hasAnyTeamName = allTeams.value.slice(0, layout.value).some(team => team.name.trim());
    return Boolean(sessionName.value.trim() && (hasAnyTeamName || history.value.length > 0));
  });

  const linkedTimerSummary = computed(() => {
    if (!linkedTimerSessionId.value) return '';
    const session = availableTimerSessions.value.find(item => item.id === linkedTimerSessionId.value);
    if (!session) return '';
    const mode = String(session.sessionMetadata.mode ?? 'timer');
    return t('SCORES.timerLinkedSummary', { timer: timerSessionLabel(session), mode });
  });

  watch(selectedClassId, async () => { await refreshContextSessions(); }, { immediate: false });
  watch(selectedTeamSessionId, () => {
    if (selectedTeamSessionId.value) importTeamSession(selectedTeamSessionId.value);
  });

  async function loadClasses(): Promise<void> {
    classes.value = await bridge.classGroupRepository.findAll();
  }

  async function refreshContextSessions(): Promise<void> {
    const sessions = selectedClassId.value
      ? await bridge.toolSessionRepository.findByClassGroup(selectedClassId.value)
      : await bridge.toolSessionRepository.findAll();

    const sorted = [...sessions].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    availableTeamSessions.value = sorted.filter(s => s.toolType === 'teams');
    availableTimerSessions.value = sorted.filter(s => s.toolType === 'timer');
    savedSessions.value = sorted.filter(s => s.toolType === 'scoreboard');

    if (linkedTimerSessionId.value && !availableTimerSessions.value.some(s => s.id === linkedTimerSessionId.value)) {
      linkedTimerSessionId.value = '';
    }
    if (selectedTeamSessionId.value && !availableTeamSessions.value.some(s => s.id === selectedTeamSessionId.value)) {
      selectedTeamSessionId.value = '';
    }
  }

  function adjustScore(teamId: string, delta: number): void {
    const current = scores.value[teamId] ?? 0;
    const next = Math.max(0, current + delta);
    const applied = next - current;
    if (applied === 0) return;

    scores.value = { ...scores.value, [teamId]: next };
    history.value.unshift({
      teamId,
      points: applied,
      type: applied >= 0 ? 'add' : 'subtract',
      description: applied >= 0 ? t('SCORES.eventAdded') : t('SCORES.eventRemoved'),
      timestamp: new Date().toISOString(),
    });
    message.value = '';
  }

  function resetBoard(): void {
    scores.value = { 'team-1': 0, 'team-2': 0, 'team-3': 0, 'team-4': 0 };
    history.value = [];
    currentSessionId.value = undefined;
    resetTimer();
    message.value = '';
  }

  async function saveSession(): Promise<void> {
    if (!canSave.value) return;
    saving.value = true;
    try {
      const teamsForSave = allTeams.value.slice(0, layout.value).map(team => ({
        id: team.id,
        name: team.name.trim() || `${t('SCORES.teamNamePlaceholder')} ${team.slot}`,
        color: team.color,
      }));
      const scoresForSave: Record<string, number> = {};
      for (const team of teamsForSave) scoresForSave[team.id] = scores.value[team.id] ?? 0;

      const result = await bridge.saveScoreboardSessionUseCase.execute({
        sessionId: currentSessionId.value,
        classGroupId: selectedClassId.value || undefined,
        sessionName: sessionName.value,
        teams: teamsForSave,
        scores: scoresForSave,
        history: history.value,
        linkedTeamSessionId: selectedTeamSessionId.value || undefined,
        linkedTimerSessionId: linkedTimerSessionId.value || undefined,
        layout: layout.value,
        inlineTimer: { elapsedMs: timerElapsedMs.value, running: false },
      });

      currentSessionId.value = result.id;
      sessionName.value = String(result.sessionMetadata.sessionName ?? sessionName.value);
      message.value = t('SCORES.saveSuccess');
      if (!selectedClassId.value && result.classGroupId) selectedClassId.value = result.classGroupId;
      await refreshContextSessions();
    } finally {
      saving.value = false;
    }
  }

  function loadSession(session: Sport.ToolSession): void {
    const metadata = session.sessionMetadata as ScoreboardSessionMetadata;
    const savedTeams = metadata.teams ?? [];

    currentSessionId.value = session.id;
    selectedClassId.value = session.classGroupId ?? '';
    sessionName.value = metadata.sessionName ?? '';
    selectedTeamSessionId.value = metadata.linkedTeamSessionId ?? '';
    linkedTimerSessionId.value = metadata.linkedTimerSessionId ?? '';

    layout.value = (metadata.layout === 4 ? 4 : 2) as 2 | 4;

    const rebuilt: TeamState[] = [];
    for (let i = 0; i < 4; i++) {
      const saved = savedTeams[i];
      rebuilt.push({
        id: saved?.id ?? `team-${i + 1}`,
        slot: i + 1,
        name: saved?.name ?? '',
        color: saved?.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length],
      });
    }
    allTeams.value = rebuilt;

    const newScores: Record<string, number> = {};
    for (const team of rebuilt) {
      newScores[team.id] = metadata.scores?.[team.id] ?? 0;
    }
    scores.value = newScores;

    history.value = (metadata.history ?? []).map(entry => ({
      teamId: entry.teamId,
      points: entry.points,
      type: entry.type,
      description: entry.description ?? '',
      timestamp: entry.timestamp,
    }));

    resetTimer();
    if (metadata.inlineTimer) {
      timerElapsedMs.value = metadata.inlineTimer.elapsedMs;
    }

    message.value = '';
  }

  function importTeamSession(sessionId: string): void {
    const session = availableTeamSessions.value.find(item => item.id === sessionId);
    if (!session) return;

    const metadata = session.sessionMetadata as TeamSessionMetadata;
    const importedTeams = metadata.teams ?? [];
    if (importedTeams.length < 2) {
      message.value = t('SCORES.noTeamSessions');
      return;
    }

    const useCount = (importedTeams.length >= 4 ? 4 : 2) as 2 | 4;
    layout.value = useCount;

    const rebuilt: TeamState[] = [];
    for (let i = 0; i < 4; i++) {
      const src = importedTeams[i];
      rebuilt.push({
        id: src?.id ?? `team-${i + 1}`,
        slot: i + 1,
        name: src?.name ?? '',
        color: DEFAULT_COLORS[i % DEFAULT_COLORS.length],
      });
    }
    allTeams.value = rebuilt;
    scores.value = { 'team-1': 0, 'team-2': 0, 'team-3': 0, 'team-4': 0 };
    currentSessionId.value = undefined;
    history.value = [];
    resetTimer();
    sessionName.value = sessionName.value || metadata.sessionName || '';
    message.value = importedTeams.length > useCount ? t('SCORES.importedTeamsNotice') : '';
  }

  function handoffToTournament(): void {
    const teamNames = activeTeams.value.map(team => team.name.trim() || `${t('SCORES.teamNamePlaceholder')} ${team.slot}`);
    sessionStorage.setItem('scoreboard_handoff_teams', JSON.stringify(teamNames));
    void router.push({ name: 'tournaments' });
  }

  function displayTeamName(teamId: string): string {
    const team = allTeams.value.find(t => t.id === teamId);
    return team?.name.trim() || `${t('SCORES.teamNamePlaceholder')} ${team?.slot ?? teamId}`;
  }

  function scoreboardSessionName(session: Sport.ToolSession): string {
    const metadata = session.sessionMetadata as ScoreboardSessionMetadata;
    return String(metadata.sessionName ?? t('SCORES.title'));
  }

  function scoreboardSessionSummary(session: Sport.ToolSession): string {
    const metadata = session.sessionMetadata as ScoreboardSessionMetadata;
    const teams = metadata.teams ?? [];
    const parts = teams.map(team => `${team.name} ${metadata.scores?.[team.id] ?? 0}`).join(' | ');
    return `${formatDateTime(session.createdAt)} · ${parts}`;
  }

  function teamSessionLabel(session: Sport.ToolSession): string {
    const metadata = session.sessionMetadata as TeamSessionMetadata;
    const teamNames = (metadata.teams ?? []).slice(0, 3).map(team => team.name).join(', ');
    return `${metadata.sessionName ?? t('TEAM.session-name')} · ${teamNames}`;
  }

  function timerSessionLabel(session: Sport.ToolSession): string {
    const mode = String(session.sessionMetadata.mode ?? 'timer');
    const elapsedMs = Number(session.sessionMetadata.elapsedMs ?? 0);
    return `${mode} · ${formatDuration(elapsedMs)} · ${formatDateTime(session.createdAt)}`;
  }

  function formatDateTime(value: Date | string): string {
    const date = typeof value === 'string' ? new Date(value) : value;
    return date.toLocaleString('de-DE', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  function formatDuration(milliseconds: number): string {
    const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  onMounted(async () => {
    await loadClasses();
    await refreshContextSessions();
  });

  onUnmounted(() => {
    window.clearInterval(timerIntervalHandle);
  });

  return {
    t,
    TEAM_COLORS,
    viewMode,
    layout,
    activeTeams,
    scores,
    history,
    classes,
    selectedClassId,
    selectedTeamSessionId,
    linkedTimerSessionId,
    availableTeamSessions,
    availableTimerSessions,
    savedSessions,
    currentSessionId,
    sessionName,
    saving,
    message,
    timerElapsedMs,
    timerRunning,
    canSave,
    linkedTimerSummary,
    setLayout,
    startTimer,
    pauseTimer,
    resetTimer,
    adjustScore,
    resetBoard,
    saveSession,
    loadSession,
    handoffToTournament,
    displayTeamName,
    scoreboardSessionName,
    scoreboardSessionSummary,
    teamSessionLabel,
    timerSessionLabel,
    formatDateTime,
    formatDuration,
  };
}
