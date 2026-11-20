import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import type { ClassGroup, Sport } from '@viccoboard/core';
import type { RoundExclusionMode, ScoreboardSessionMetadata, TeamSessionMetadata } from '@viccoboard/sport';

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

  const numberPicker = bridge.roundNumberPickerService;
  const sport = ref<'basketball' | 'standard' | 'custom'>('basketball');
  const customPoints = ref(1);
  const pointOptions = computed(() => sport.value === 'basketball' ? [1, 2, 3] :
    sport.value === 'custom' ? (Number.isInteger(customPoints.value) && customPoints.value > 0 && customPoints.value <= 20 ? [customPoints.value] : []) : [1]);

  const timerMode = ref<'stopwatch' | 'countdown'>('stopwatch');
  const roundMinutes = ref(3);
  const roundSeconds = ref(0);
  const roundDurationMs = computed(() => (Number(roundMinutes.value) * 60 + Number(roundSeconds.value)) * 1000);
  const timerRemainingMs = ref(180000);
  const displayedTimerMs = computed(() => timerMode.value === 'countdown' ? timerRemainingMs.value : timerElapsedMs.value);

  const numberPickerEnabled = ref(false);
  const teamSize = ref(12);
  const playersPerRound = ref(5);
  const exclusionMode = ref<RoundExclusionMode>('unused');
  const selectionMethod = ref<'random' | 'manual'>('random');
  const activeNumbers = ref<number[]>([]);
  const pendingNumbers = ref<number[]>([]);
  const roundHistory = ref<number[][]>([]);
  const roundActive = ref(false);
  const roundMessage = ref('');
  const nextRoundNumber = computed(() => roundHistory.value.length + 1);
  const usedNumbers = computed(() => roundHistory.value.flat());
  const previousNumbers = computed(() => roundHistory.value[roundHistory.value.length - 1] ?? []);
  const pickerInput = computed(() => ({
    teamSize: teamSize.value,
    playersPerRound: playersPerRound.value,
    exclusionMode: exclusionMode.value,
    usedNumbers: usedNumbers.value,
    previousNumbers: previousNumbers.value,
  }));
  const selectableNumbers = computed(() => {
    try {
      return numberPicker.eligibleNumbers(pickerInput.value);
    } catch {
      return [];
    }
  });
  const roundConfigurationValid = computed(() =>
    layout.value === 2 && Number.isInteger(teamSize.value) && teamSize.value >= 1 && teamSize.value <= 99 &&
    Number.isInteger(playersPerRound.value) && playersPerRound.value >= 1 && playersPerRound.value <= teamSize.value
  );
  const timerConfigurationValid = computed(() => Number.isInteger(roundMinutes.value) && Number.isInteger(roundSeconds.value) &&
    roundMinutes.value >= 0 && roundMinutes.value <= 99 && roundSeconds.value >= 0 && roundSeconds.value <= 59 &&
    roundDurationMs.value > 0);

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
  let roundAudioContext: AudioContext | undefined;

  function setLayout(n: 2 | 4): void {
    if (n !== layout.value && numberPickerEnabled.value) resetRoundCycle();
    layout.value = n;
  }

  function resetRoundCycle(): void {
    pauseTimer();
    activeNumbers.value = [];
    pendingNumbers.value = [];
    roundHistory.value = [];
    roundActive.value = false;
    roundMessage.value = '';
    resetTimer();
  }

  watch([teamSize, playersPerRound, exclusionMode, selectionMethod, numberPickerEnabled], resetRoundCycle, { flush: 'sync' });
  watch([timerMode, roundMinutes, roundSeconds], () => {
    if (!timerRunning.value) resetTimer();
  }, { flush: 'sync' });

  function prepareNextRound(): void {
    if (!numberPickerEnabled.value || !roundConfigurationValid.value) {
      roundMessage.value = t('SCORES.invalidRoundSettings');
      pendingNumbers.value = [];
      return;
    }
    try {
      if (selectableNumbers.value.length < playersPerRound.value) {
        pendingNumbers.value = [];
        roundMessage.value = t('SCORES.noEligibleNumbers');
      } else if (selectionMethod.value === 'random') {
        pendingNumbers.value = numberPicker.draw(pickerInput.value) ?? [];
        roundMessage.value = '';
      } else {
        pendingNumbers.value = [];
        roundMessage.value = '';
      }
    } catch {
      pendingNumbers.value = [];
      roundMessage.value = t('SCORES.invalidRoundSettings');
    }
  }

  function toggleManualNumber(number: number): void {
    if (selectionMethod.value !== 'manual' || roundActive.value || timerRunning.value ||
        !selectableNumbers.value.includes(number)) return;
    pendingNumbers.value = pendingNumbers.value.includes(number)
      ? pendingNumbers.value.filter(value => value !== number)
      : pendingNumbers.value.length < playersPerRound.value
        ? [...pendingNumbers.value, number].sort((a, b) => a - b)
        : pendingNumbers.value;
    roundMessage.value = '';
  }

  function startRound(): void {
    if (!numberPickerEnabled.value || roundActive.value || !roundConfigurationValid.value ||
        timerMode.value !== 'countdown' || !timerConfigurationValid.value) {
      roundMessage.value = t('SCORES.invalidRoundSettings');
      return;
    }
    const valid = pendingNumbers.value.length === playersPerRound.value &&
      new Set(pendingNumbers.value).size === playersPerRound.value &&
      pendingNumbers.value.every(number => selectableNumbers.value.includes(number));
    if (!valid) {
      roundMessage.value = t('SCORES.chooseNumbers');
      return;
    }
    activeNumbers.value = [...pendingNumbers.value];
    roundHistory.value = [...roundHistory.value, activeNumbers.value];
    pendingNumbers.value = [];
    roundActive.value = true;
    roundMessage.value = '';
    resetTimer();
    startTimer();
  }

  function unlockRoundAudio(): void {
    try {
      const AudioCtx = window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      roundAudioContext ??= new AudioCtx();
      void roundAudioContext.resume().catch(() => {});
    } catch {
      // Timer operation remains available when the device blocks audio.
    }
  }

  function playRoundSignal(): void {
    try {
      const context = roundAudioContext;
      if (!context) return;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.frequency.value = 800;
      gain.gain.value = 0.2;
      oscillator.start();
      oscillator.stop(context.currentTime + 0.2);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    } catch {
      // Audio is optional; timer completion must not depend on playback.
    }
  }

  function startTimer(): void {
    if (timerRunning.value) return;
    if (numberPickerEnabled.value && !roundActive.value) return;
    if (timerMode.value === 'countdown' && !timerConfigurationValid.value) return;
    if (timerMode.value === 'countdown') unlockRoundAudio();
    if (timerMode.value === 'countdown' && timerRemainingMs.value === 0) {
      timerRemainingMs.value = roundDurationMs.value;
      timerElapsedMs.value = 0;
    }
    timerRunning.value = true;
    timerLastTick = Date.now();
    timerIntervalHandle = window.setInterval(() => {
      const now = Date.now();
      const delta = now - (timerLastTick ?? now);
      timerLastTick = now;
      timerElapsedMs.value += delta;
      if (timerMode.value === 'countdown') {
        timerRemainingMs.value = Math.max(0, timerRemainingMs.value - delta);
        if (timerRemainingMs.value === 0) {
          pauseTimer();
          playRoundSignal();
          if (numberPickerEnabled.value) {
            roundActive.value = false;
            prepareNextRound();
          }
        }
      }
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
    timerRemainingMs.value = timerConfigurationValid.value ? roundDurationMs.value : 0;
  }

  const canSave = computed(() => {
    const hasAnyTeamName = allTeams.value.slice(0, layout.value).some(team => team.name.trim());
    return Boolean(sessionName.value.trim() && (hasAnyTeamName || history.value.length > 0 || roundHistory.value.length > 0));
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

  function undoLastScore(): void {
    const last = history.value.shift();
    if (!last) return;
    scores.value = {
      ...scores.value,
      [last.teamId]: Math.max(0, (scores.value[last.teamId] ?? 0) - last.points),
    };
    message.value = '';
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
    resetRoundCycle();
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
        roundSettings: {
          sport: sport.value,
          customPoints: customPoints.value,
          timerMode: timerMode.value,
          roundDurationMs: roundDurationMs.value,
          numberPickerEnabled: numberPickerEnabled.value,
          teamSize: teamSize.value,
          playersPerRound: playersPerRound.value,
          exclusionMode: exclusionMode.value,
          selectionMethod: selectionMethod.value,
          activeNumbers: activeNumbers.value,
          pendingNumbers: pendingNumbers.value,
          roundHistory: roundHistory.value,
        },
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

    resetRoundCycle();
    const settings = metadata.roundSettings;
    sport.value = settings?.sport === 'standard' || settings?.sport === 'custom' ? settings.sport : 'basketball';
    customPoints.value = settings?.customPoints ?? 1;
    timerMode.value = settings?.timerMode === 'countdown' ? 'countdown' : 'stopwatch';
    const duration = settings?.roundDurationMs ?? 180000;
    roundMinutes.value = Math.floor(duration / 60000);
    roundSeconds.value = Math.floor((duration % 60000) / 1000);
    numberPickerEnabled.value = settings?.numberPickerEnabled ?? false;
    teamSize.value = settings?.teamSize ?? 12;
    playersPerRound.value = settings?.playersPerRound ?? 5;
    exclusionMode.value = settings?.exclusionMode ?? 'unused';
    selectionMethod.value = settings?.selectionMethod ?? 'random';
    roundHistory.value = settings?.roundHistory?.map(numbers => [...numbers]) ?? [];
    activeNumbers.value = [...(settings?.activeNumbers ?? [])];
    pendingNumbers.value = [...(settings?.pendingNumbers ?? [])];
    resetTimer();
    if (metadata.inlineTimer && Number.isFinite(metadata.inlineTimer.elapsedMs)) {
      timerElapsedMs.value = Math.max(0, metadata.inlineTimer.elapsedMs);
      timerRemainingMs.value = Math.max(0, roundDurationMs.value - timerElapsedMs.value);
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
    resetRoundCycle();
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
    if (roundAudioContext) void roundAudioContext.close();
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
    timerRemainingMs,
    displayedTimerMs,
    timerRunning,
    timerMode,
    roundMinutes,
    roundSeconds,
    timerConfigurationValid,
    sport,
    customPoints,
    pointOptions,
    numberPickerEnabled,
    teamSize,
    playersPerRound,
    exclusionMode,
    selectionMethod,
    selectableNumbers,
    activeNumbers,
    pendingNumbers,
    roundHistory,
    roundActive,
    roundMessage,
    nextRoundNumber,
    roundConfigurationValid,
    canSave,
    linkedTimerSummary,
    setLayout,
    startTimer,
    pauseTimer,
    resetTimer,
    adjustScore,
    undoLastScore,
    prepareNextRound,
    toggleManualNumber,
    startRound,
    resetRoundCycle,
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
