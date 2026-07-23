import { createInitialClaw, createInitialState, phases } from "./config.js";
import {
  canvas,
  collectionCloseButton,
  collectionOpenButton,
  collectionPanel,
  collectionSummaryEl,
  exitGameButton,
  helpCloseButton,
  helpPanel,
  helpToggleButton,
  hudStatsEl,
  logoutPlayerButton,
  menuCloseButton,
  menuPanel,
  menuToggleButton,
  pauseToggleButton,
  playerNameInputEl,
  rankingCloseButton,
  rankingPanel,
  soundToggleButton,
  statusPanelEl,
  startGameButtonEl,
  startOverlayEl,
} from "./dom.js";
import { beginDrop, resetPhase, restartAfterGameOver, updateGame, useContinue } from "./logic.js";
import { drawGame, getControlTargets, getGameOverTarget } from "./render.js";
import {
  closeRankingDetail,
  closeHelp,
  closeCollection,
  closeMenu,
  formatElapsedTime,
  groupCollectionForDisplay,
  openHelp,
  openRankingDetail,
  openCollection,
  openMenu,
  renderCollection,
  renderRanking,
  setRankingInspectHandler,
  setMessage,
  syncUI,
} from "./ui.js";

const state = createInitialState();
const claw = createInitialClaw();
const RANKING_STORAGE_KEY = "plush-claw-ranking-v1";
const SOUND_STORAGE_KEY = "plush-claw-sound-muted-v1";
const GAME_STATE_STORAGE_KEY = "plush-claw-progress-v1";
const queryParams = new URLSearchParams(window.location.search);
const embeddedMode = queryParams.get("embedded") === "1";
const platformPlayerName = (queryParams.get("player") ?? "").trim().slice(0, 14);
const startLabelEl = document.querySelector(".start-label");
let rankingEntries = loadRanking();
let audioContext = null;
let lastPersistAt = 0;

state.soundMuted = window.localStorage.getItem(SOUND_STORAGE_KEY) === "1";

function syncSignedOutUI() {
  const signedIn = state.hasStarted;
  hudStatsEl.hidden = true;
  collectionSummaryEl.hidden = !signedIn;
  logoutPlayerButton.hidden = !signedIn;
  statusPanelEl.classList.toggle("signed-out", !signedIn);
}

function syncSoundButton() {
  soundToggleButton.textContent = state.soundMuted ? "Som: Off" : "Som: On";
}

function syncPauseButton() {
  pauseToggleButton.textContent = state.paused ? "Continuar" : "Pausar";
}

function syncEmbeddedStartScreen() {
  if (!embeddedMode) {
    return;
  }

  playerNameInputEl.value = platformPlayerName || "jogador";
  playerNameInputEl.readOnly = true;
  playerNameInputEl.setAttribute("aria-readonly", "true");
  playerNameInputEl.classList.add("start-input-locked");
  startLabelEl.textContent = "Jogador da plataforma";
}

function togglePause(forceValue) {
  if (!state.hasStarted || state.gameOver) {
    return;
  }

  state.paused = typeof forceValue === "boolean" ? forceValue : !state.paused;
  if (state.paused) {
    state.moveDirection = 0;
    keyState.left = false;
    keyState.right = false;
    setMessage("Jogo pausado.");
  } else {
    setMessage("Jogo retomado.");
  }
  syncPauseButton();
}

function ensureAudioContext() {
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      return null;
    }
    audioContext = new AudioContextClass();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume();
  }

  return audioContext;
}

function playTone({ frequency, duration = 0.1, type = "sine", volume = 0.05, when = 0 }) {
  const ctx = ensureAudioContext();
  if (!ctx || state.soundMuted) {
    return;
  }

  const startAt = ctx.currentTime + when;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startAt);
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(volume, startAt + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(startAt);
  oscillator.stop(startAt + duration + 0.03);
}

function playCue(cue) {
  switch (cue) {
    case "drop":
      playTone({ frequency: 220, duration: 0.08, type: "square", volume: 0.045 });
      break;
    case "catch":
      playTone({ frequency: 620, duration: 0.07, type: "triangle", volume: 0.055 });
      playTone({ frequency: 840, duration: 0.09, type: "triangle", volume: 0.045, when: 0.05 });
      break;
    case "miss":
      playTone({ frequency: 210, duration: 0.12, type: "sawtooth", volume: 0.05 });
      playTone({ frequency: 170, duration: 0.16, type: "sawtooth", volume: 0.04, when: 0.06 });
      break;
    case "bonus":
      playTone({ frequency: 660, duration: 0.08, type: "triangle", volume: 0.05 });
      playTone({ frequency: 880, duration: 0.08, type: "triangle", volume: 0.045, when: 0.07 });
      playTone({ frequency: 1100, duration: 0.1, type: "triangle", volume: 0.04, when: 0.14 });
      break;
    case "bomb":
      playTone({ frequency: 180, duration: 0.14, type: "sawtooth", volume: 0.06 });
      playTone({ frequency: 120, duration: 0.18, type: "sawtooth", volume: 0.05, when: 0.08 });
      break;
    case "win":
      playTone({ frequency: 740, duration: 0.08, type: "triangle", volume: 0.055 });
      playTone({ frequency: 980, duration: 0.08, type: "triangle", volume: 0.05, when: 0.08 });
      playTone({ frequency: 1320, duration: 0.12, type: "triangle", volume: 0.045, when: 0.16 });
      break;
    case "gameover":
      playTone({ frequency: 260, duration: 0.16, type: "sawtooth", volume: 0.05 });
      playTone({ frequency: 196, duration: 0.2, type: "sawtooth", volume: 0.045, when: 0.09 });
      playTone({ frequency: 146, duration: 0.24, type: "sawtooth", volume: 0.04, when: 0.18 });
      break;
    default:
      break;
  }
}

function flushSoundEvents() {
  if (!state.soundEvents.length) {
    return;
  }

  const cues = state.soundEvents.splice(0, state.soundEvents.length);
  cues.forEach(playCue);
}

function loadRanking() {
  try {
    const raw = window.localStorage.getItem(RANKING_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function notifyPlatformMatchComplete(result = "concluido") {
  if (!embeddedMode || state.platformResultSent || !state.hasStarted) {
    return;
  }

  state.platformResultSent = true;
  const payload = {
    pontuacao: state.points,
    duracaoSegundos: Math.max(1, Math.floor((state.runTimeMs ?? 0) / 1000)),
    resultado: result,
  };

  if (window.MyGaming?.finalizarPartida) {
    window.MyGaming.finalizarPartida(payload);
    return;
  }

  window.parent.postMessage({
    tipo: "finalizarPartida",
    payload,
    correlationId: crypto.randomUUID(),
    versao: "1.0",
  }, "*");
}

function saveRanking() {
  window.localStorage.setItem(RANKING_STORAGE_KEY, JSON.stringify(rankingEntries));
}

function getPersistedSnapshot() {
  if (!state.hasStarted) {
    return null;
  }

  return {
    state: {
      unlocked: state.unlocked,
      phaseIndex: state.phaseIndex,
      points: state.points,
      continues: state.continues,
      tries: state.tries,
      extraTries: state.extraTries,
      timer: state.timer,
      timerTick: state.timerTick,
      moveDirection: 0,
      plush: state.plush,
      plushes: state.plushes,
      specialPlush: state.specialPlush,
      plushVisible: state.plushVisible,
      resultLock: false,
      collection: state.collection,
      buttonPress: 0,
      exitAnimation: null,
      present: state.present,
      presentFlash: null,
      feedbackPulse: null,
      feedbackOverlay: null,
      screenShake: 0,
      soundEvents: [],
      slowMotionTick: state.slowMotionTick,
      gameOver: state.gameOver,
      continuePrompt: state.continuePrompt,
      continueTimer: state.continueTimer,
      gameOverMessage: state.gameOverMessage,
      phaseCatchCount: state.phaseCatchCount,
      bonusRound: state.bonusRound,
      bonusAssignments: state.bonusAssignments,
      usedBonusPhaseIds: state.usedBonusPhaseIds,
      bonusRoundScore: state.bonusRoundScore,
      bonusRoundFailed: state.bonusRoundFailed,
      pendingRoundRespawn: false,
      claimedContinuePhases: state.claimedContinuePhases,
      spawnedContinuePhases: state.spawnedContinuePhases,
      specialAssignments: state.specialAssignments,
      usedSpecialWindows: state.usedSpecialWindows,
      lastPlushKey: state.lastPlushKey,
      pileShuffleStep: state.pileShuffleStep,
      pileShuffleCooldown: state.pileShuffleCooldown,
      runTimeMs: state.runTimeMs,
      touchTargetX: state.touchTargetX,
      touchControlActive: state.touchControlActive,
      hasStarted: state.hasStarted,
      playerName: state.playerName,
      scoreSaved: state.scoreSaved,
      soundMuted: state.soundMuted,
      paused: state.paused,
    },
    claw: {
      ...claw,
      armHeight: 0,
      dropping: false,
      returning: false,
      carrying: false,
      gripOpen: 1,
      gripTarget: 1,
    },
  };
}

function saveGameProgress(force = false) {
  if (!state.hasStarted) {
    window.localStorage.removeItem(GAME_STATE_STORAGE_KEY);
    return;
  }

  const snapshot = getPersistedSnapshot();
  if (!snapshot) {
    return;
  }

  if (!force && performance.now() - lastPersistAt < 800) {
    return;
  }

  window.localStorage.setItem(GAME_STATE_STORAGE_KEY, JSON.stringify(snapshot));
  lastPersistAt = performance.now();
}

function restoreGameProgress() {
  if (embeddedMode) {
    return false;
  }

  try {
    const raw = window.localStorage.getItem(GAME_STATE_STORAGE_KEY);
    if (!raw) {
      return false;
    }

    const snapshot = JSON.parse(raw);
    if (!snapshot?.state?.hasStarted) {
      return false;
    }

    Object.assign(state, snapshot.state);
    Object.assign(claw, snapshot.claw ?? {});
    state.soundMuted = window.localStorage.getItem(SOUND_STORAGE_KEY) === "1";
    state.soundEvents = [];
    state.feedbackPulse = null;
    state.feedbackOverlay = null;
    state.presentFlash = null;
    state.exitAnimation = null;
    state.resultLock = false;
    state.pendingRoundRespawn = false;
    state.moveDirection = 0;
    state.buttonPress = 0;
    state.touchTargetX = claw.x;
    state.touchControlActive = false;

    startOverlayEl.hidden = true;
    playerNameInputEl.value = state.playerName ?? "";
    syncPauseButton();
    syncSignedOutUI();
    syncUI(state, phases);
    renderCollection(state);
    renderRanking(rankingEntries, state.playerName);
    setMessage(`Partida restaurada para ${state.playerName}.`);
    return true;
  } catch {
    return false;
  }
}

function normalizeRanking(entries) {
  const bestByName = new Map();

  entries.forEach((entry) => {
    if (!entry?.name) {
      return;
    }

    const normalizedEntry = {
      name: String(entry.name).trim(),
      phase: Number(entry.phase) || 1,
      points: Number(entry.points ?? entry.score ?? entry.coins) || 0,
      durationSec: Number(entry.durationSec) || 0,
      timeLabel: entry.timeLabel || formatElapsedTime((Number(entry.durationSec) || 0) * 1000),
      collection: Array.isArray(entry.collection) ? entry.collection : [],
    };

    const key = normalizedEntry.name.toLowerCase();
    const current = bestByName.get(key);

    if (!current || normalizedEntry.points > current.points) {
      bestByName.set(key, normalizedEntry);
    }
  });

  return [...bestByName.values()]
    .sort((a, b) => b.points - a.points)
    .slice(0, 3);
}

function registerRankingEntry() {
  if (state.scoreSaved || !state.playerName) {
    return;
  }

  rankingEntries.push({
    name: state.playerName,
    phase: state.phaseIndex + 1,
    points: state.points,
    durationSec: Math.floor((state.runTimeMs ?? 0) / 1000),
    timeLabel: formatElapsedTime(state.runTimeMs ?? 0),
    collection: state.collection.map((toy) => ({ ...toy })),
  });

  rankingEntries = normalizeRanking(rankingEntries);
  saveRanking();
  renderRanking(rankingEntries, state.playerName);
  state.scoreSaved = true;
  notifyPlatformMatchComplete(state.phaseIndex >= phases.length - 1 ? "vitoria" : "concluido");
}

function startGame() {
  ensureAudioContext();
  const rawName = embeddedMode ? (platformPlayerName || "jogador") : playerNameInputEl.value.trim();
  if (!rawName) {
    playerNameInputEl.classList.add("start-input-error");
    playerNameInputEl.focus();
    setMessage("Digite o nome do jogador para iniciar.");
    return;
  }

  playerNameInputEl.classList.remove("start-input-error");
  state.playerName = rawName.slice(0, 14);
  state.hasStarted = true;
  state.scoreSaved = false;
  state.platformResultSent = false;
  startOverlayEl.hidden = true;
  state.paused = false;
  state.runTimeMs = 0;
  syncPauseButton();
  syncSignedOutUI();
  resetPhase(state, claw);
  renderCollection(state);
  renderRanking(rankingEntries, state.playerName);
  setMessage(`Boa sorte, ${state.playerName}. Pegue os ursos antes do tempo acabar.`);
  saveGameProgress(true);
}

function logoutPlayer() {
  if (embeddedMode && state.hasStarted && !state.platformResultSent) {
    notifyPlatformMatchComplete("encerrado");
  }

  state.hasStarted = false;
  state.playerName = "";
  state.scoreSaved = false;
  state.platformResultSent = false;
  state.paused = false;
  state.points = 0;
  state.continues = 0;
  state.extraTries = 0;
  state.bonusRound = null;
  state.bonusAssignments = {};
  state.usedBonusPhaseIds = [];
  state.bonusRoundScore = 0;
  state.bonusRoundFailed = false;
  state.pendingRoundRespawn = false;
  state.specialPlush = null;
  state.specialAssignments = {};
  state.usedSpecialWindows = { skull: [], angel: [], ghost: [] };
  state.claimedContinuePhases = [];
  state.spawnedContinuePhases = [];
  state.plushes = [];
  state.collection = [];
  state.phaseIndex = 0;
  state.unlocked = 1;
  state.runTimeMs = 0;
  state.touchTargetX = claw.x;
  state.touchControlActive = false;
  closeMenu();
  closeCollection();
  closeRankingDetail();
  resetPhase(state, claw);
  renderCollection(state);
  renderRanking(rankingEntries, "");
  startOverlayEl.hidden = false;
  syncSignedOutUI();
  playerNameInputEl.value = "";
  if (!embeddedMode) {
    playerNameInputEl.focus();
  }
  setMessage(embeddedMode ? "Aperte Start para jogar." : "Digite o nome do jogador e aperte Start.");
  syncPauseButton();
  window.localStorage.removeItem(GAME_STATE_STORAGE_KEY);

  if (embeddedMode) {
    syncEmbeddedStartScreen();
    playerNameInputEl.blur();
  }
}

const keyState = {
  left: false,
  right: false,
};

function syncMoveDirection() {
  if (keyState.left && !keyState.right) {
    state.moveDirection = -1;
    return;
  }

  if (keyState.right && !keyState.left) {
    state.moveDirection = 1;
    return;
  }

  state.moveDirection = 0;
}

function setDirectionalKey(direction, pressed) {
  state.touchControlActive = false;
  if (direction < 0) {
    keyState.left = pressed;
  } else {
    keyState.right = pressed;
  }

  syncMoveDirection();
}

function usesTouchTargetControls(event = null) {
  if (event?.pointerType) {
    return event.pointerType === "touch";
  }

  return window.matchMedia("(pointer: coarse)").matches;
}

function getCanvasPoint(event) {
  const bounds = canvas.getBoundingClientRect();
  const scaleX = canvas.width / bounds.width;
  const scaleY = canvas.height / bounds.height;

  return {
    x: (event.clientX - bounds.left) * scaleX,
    y: (event.clientY - bounds.top) * scaleY,
  };
}

function isInsideCircle(point, circle) {
  const dx = point.x - circle.x;
  const dy = point.y - circle.y;
  return Math.hypot(dx, dy) <= circle.radius;
}

function isInsideRect(point, rect) {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

function handleCanvasControl(point, event = null) {
  if (!state.hasStarted) {
    return false;
  }

  if (state.paused) {
    return false;
  }

  if (state.gameOver && isInsideRect(point, getGameOverTarget())) {
    if (state.continuePrompt && state.continues > 0) {
      useContinue(state, claw);
    } else {
      restartAfterGameOver(state, claw);
    }
    return true;
  }

  const controls = getControlTargets();

  if (isInsideCircle(point, controls.dropButton)) {
    beginDrop(state, claw);
    return true;
  }

  if (usesTouchTargetControls(event)) {
    state.touchTargetX = point.x;
    state.moveDirection = 0;
    state.touchControlActive = true;
    return true;
  }

  if (isInsideCircle(point, controls.joystickBase)) {
    if (point.x < controls.joystickBase.x - 8) {
      state.moveDirection = -1;
    } else if (point.x > controls.joystickBase.x + 8) {
      state.moveDirection = 1;
    } else {
      state.moveDirection = 0;
    }
    state.touchControlActive = false;
    return true;
  }

  return false;
}

let lastFrame = performance.now();

function frame(now) {
  const deltaMs = now - lastFrame;
  lastFrame = now;
  if (state.hasStarted) {
    if (!state.paused) {
      if (!state.gameOver) {
        state.runTimeMs += deltaMs;
      }
      updateGame(state, claw, deltaMs);
    }
    flushSoundEvents();
    if (state.gameOver && !state.continuePrompt) {
      registerRankingEntry();
    }
    saveGameProgress();
  }
  drawGame(state, claw);
  requestAnimationFrame(frame);
}

syncSoundButton();
syncPauseButton();

playerNameInputEl.addEventListener("input", () => {
  if (playerNameInputEl.value.trim()) {
    playerNameInputEl.classList.remove("start-input-error");
  }
});

window.addEventListener("keydown", (event) => {
  if (!state.hasStarted) {
    if (event.key === "Enter") {
      event.preventDefault();
      startGame();
    }
    return;
  }

  const key = event.key.toLowerCase();

  if (key === "p") {
    event.preventDefault();
    togglePause();
    return;
  }

  if (state.paused) {
    return;
  }

  if (state.gameOver && (key === "enter" || key === " " || key === "spacebar" || key === "space" || key === "arrowdown")) {
    event.preventDefault();
    if (state.continuePrompt && state.continues > 0) {
      useContinue(state, claw);
    } else {
      restartAfterGameOver(state, claw);
    }
    return;
  }

  if (key === "arrowleft" || key === "a") {
    event.preventDefault();
    setDirectionalKey(-1, true);
    return;
  }

  if (key === "arrowright" || key === "d") {
    event.preventDefault();
    setDirectionalKey(1, true);
    return;
  }

  if ((key === " " || key === "spacebar" || key === "space" || key === "arrowdown") && !event.repeat) {
    event.preventDefault();
    beginDrop(state, claw);
  }
});

window.addEventListener("keyup", (event) => {
  const key = event.key.toLowerCase();

  if (state.paused) {
    return;
  }

  if (key === "arrowleft" || key === "a") {
    event.preventDefault();
    setDirectionalKey(-1, false);
    return;
  }

  if (key === "arrowright" || key === "d") {
    event.preventDefault();
    setDirectionalKey(1, false);
  }
});

canvas.addEventListener("pointerdown", (event) => {
  ensureAudioContext();
  if (handleCanvasControl(getCanvasPoint(event), event)) {
    event.preventDefault();
  }
});

canvas.addEventListener("pointermove", (event) => {
  if (!state.hasStarted) {
    return;
  }

  if ((event.buttons & 1) === 0) {
    return;
  }

  const point = getCanvasPoint(event);
  const controls = getControlTargets();

  if (usesTouchTargetControls(event)) {
    if (!isInsideCircle(point, controls.dropButton)) {
      state.touchTargetX = point.x;
      state.moveDirection = 0;
      state.touchControlActive = true;
    }
    return;
  }

  if (isInsideCircle(point, controls.joystickBase)) {
    if (point.x < controls.joystickBase.x - 8) {
      state.moveDirection = -1;
    } else if (point.x > controls.joystickBase.x + 8) {
      state.moveDirection = 1;
    } else {
      state.moveDirection = 0;
    }
  }
});

["pointerup", "pointerleave", "pointercancel"].forEach((eventName) => {
  canvas.addEventListener(eventName, () => {
    if (usesTouchTargetControls()) {
      return;
    }
    if (!keyState.left && !keyState.right) {
      state.moveDirection = 0;
    }
  });
});

menuToggleButton.addEventListener("click", openMenu);
pauseToggleButton.addEventListener("click", () => togglePause());
menuCloseButton.addEventListener("click", closeMenu);
helpToggleButton.addEventListener("click", openHelp);
helpCloseButton.addEventListener("click", closeHelp);
collectionOpenButton.addEventListener("click", openCollection);
collectionCloseButton.addEventListener("click", closeCollection);
soundToggleButton.addEventListener("click", () => {
  state.soundMuted = !state.soundMuted;
  window.localStorage.setItem(SOUND_STORAGE_KEY, state.soundMuted ? "1" : "0");
  ensureAudioContext();
  syncSoundButton();
});
exitGameButton.addEventListener("click", logoutPlayer);
logoutPlayerButton.addEventListener("click", logoutPlayer);
startGameButtonEl.addEventListener("click", startGame);
playerNameInputEl.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    startGame();
  }
});
menuPanel.addEventListener("click", (event) => {
  if (event.target === menuPanel) {
    closeMenu();
  }
});
helpPanel.addEventListener("click", (event) => {
  if (event.target === helpPanel) {
    closeHelp();
  }
});
collectionPanel.addEventListener("click", (event) => {
  if (event.target === collectionPanel) {
    closeCollection();
  }
});
rankingCloseButton.addEventListener("click", closeRankingDetail);
rankingPanel.addEventListener("click", (event) => {
  if (event.target === rankingPanel) {
    closeRankingDetail();
  }
});

setRankingInspectHandler((entry) => {
  openRankingDetail(entry, groupCollectionForDisplay(entry.collection ?? []));
});

window.addEventListener("beforeunload", () => {
  saveGameProgress(true);
});

resetPhase(state, claw);
rankingEntries = normalizeRanking(rankingEntries);
saveRanking();
if (!restoreGameProgress()) {
  renderCollection(state);
  renderRanking(rankingEntries, state.playerName);
  syncSignedOutUI();
  if (embeddedMode) {
    syncEmbeddedStartScreen();
    setMessage("Aperte Start para jogar.");
  }
}
requestAnimationFrame(frame);
