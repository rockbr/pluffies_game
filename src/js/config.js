export const TOTAL_PHASES = 999;
export const FINAL_PHASE_ID = TOTAL_PHASES;
const BASE_CAMPAIGN_PHASES = 100;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function lerp(start, end, amount) {
  return start + (end - start) * amount;
}

function getRangeProgress(id, start, end) {
  if (end <= start) {
    return 1;
  }

  return clamp((id - start) / (end - start), 0, 1);
}

function getPostBaseProgress(id) {
  return getRangeProgress(id, BASE_CAMPAIGN_PHASES + 1, FINAL_PHASE_ID - 1);
}

function getPhaseTier(id) {
  if (id <= 100) return 0;
  if (id <= 300) return 1;
  if (id <= 600) return 2;
  if (id < FINAL_PHASE_ID) return 3;
  return 4;
}

function getPhaseTimer(id) {
  if (id === FINAL_PHASE_ID) return 8;
  if (id <= 20) return 15;
  if (id <= 60) return 12;
  if (id <= 99) return 10;
  if (id === 100) return 10;

  const tier = getPhaseTier(id);
  const progress = getPostBaseProgress(id);
  const target = tier >= 3 ? 8 : tier === 2 ? 9 : 10;
  return Math.round(lerp(10, target, progress));
}

function getClawSpeed(id) {
  if (id === FINAL_PHASE_ID) return 12;
  if (id <= 20) return 7;
  if (id <= 40) return 8;
  if (id <= 70) return 9;
  if (id <= 90) return 10;
  if (id <= 100) return 11;

  const tier = getPhaseTier(id);
  const progress = getPostBaseProgress(id);
  const cap = tier >= 3 ? 13.4 : tier === 2 ? 12.8 : 12.1;
  return Number(lerp(11.1, cap, progress).toFixed(1));
}

function getPlushSpeed(id) {
  if (id === FINAL_PHASE_ID) return 0;
  if (id <= 10) return 0;
  if (id <= 20) return 0.6;
  if (id <= 40) return 1.1;
  if (id <= 60) return 1.6;
  if (id <= 80) return 2.1;
  if (id <= 100) return 2.5;

  const tier = getPhaseTier(id);
  const progress = getPostBaseProgress(id);
  const cap = tier >= 3 ? 3.9 : tier === 2 ? 3.5 : 3;
  return Number(lerp(2.55, cap, progress).toFixed(1));
}

function getPlushRadius(id) {
  if (id >= FINAL_PHASE_ID) return 22;
  if (id <= 10) return 48;
  if (id <= 30) return 40;
  if (id <= 50) return 34;
  if (id <= 70) return 28;
  if (id <= 90) return 24;
  if (id <= 100) return 22;

  const progress = getPostBaseProgress(id);
  return Math.round(lerp(22, 18, progress));
}

function getPhasePoints(id) {
  return 15 + id * 5;
}

function getPresentType(id) {
  if (id === FINAL_PHASE_ID) {
    return null;
  }

  const baseMap = {
    5: "green",
    10: "continue",
    15: "blue",
    20: "continue",
    25: "yellow",
    30: "continue",
    35: "orange",
    40: "continue",
    45: "red",
    50: "continue",
    55: "green",
    60: "continue",
    65: "blue",
    70: "continue",
    75: "yellow",
    80: "continue",
    85: "purple",
    90: "continue",
    95: "white",
  };

  if (baseMap[id]) {
    return baseMap[id];
  }

  if (id <= 100 || id % 5 !== 0) {
    return null;
  }

  if (id % 10 === 0) {
    return "continue";
  }

  const cycle = ["green", "blue", "yellow", "orange", "red", "purple", "white"];
  const cycleIndex = Math.floor((id - 105) / 5) % cycle.length;
  return cycle[cycleIndex];
}

function getCatchThreshold(id) {
  if (id === FINAL_PHASE_ID) return 0.72;
  if (id <= 30) return 0.56;
  if (id <= 60) return 0.6;
  if (id <= 80) return 0.64;
  if (id <= 99) return 0.68;
  if (id === 100) return 0.68;

  const progress = getPostBaseProgress(id);
  return Number(lerp(0.681, 0.75, progress).toFixed(2));
}

function getPhaseDescription(id, clawSpeed, plushSpeed, presentType) {
  const targetCaptures = 2;

  if (id === FINAL_PHASE_ID) {
    return `Fase final. Maquina vazia, sem figurantes, alvo unico e precisao maxima. Meta ${targetCaptures} capturas.`;
  }

  const movementText = plushSpeed === 0
    ? "bicho parado"
    : `bicho em movimento ${plushSpeed.toFixed(1)}x`;
  const giftText = presentType ? ` Presente ${presentType} nesta fase.` : "";
  const tier = getPhaseTier(id);

  if (tier === 0) {
    return `Meta ${targetCaptures} capturas. Garra ${clawSpeed.toFixed(1)}x, ${movementText}.${giftText}`;
  }

  if (tier === 1) {
    return `Meta ${targetCaptures} capturas. Fase estendida com ${movementText}, garra ${clawSpeed.toFixed(1)}x e mais variacao de especiais.${giftText}`;
  }

  if (tier === 2) {
    return `Meta ${targetCaptures} capturas. Tier avancado: garra ${clawSpeed.toFixed(1)}x, alvo menor e maior pressao de combos.${giftText}`;
  }

  return `Meta ${targetCaptures} capturas. Endurance: garra ${clawSpeed.toFixed(1)}x, margem curta e leitura rapida.${giftText}`;
}

function createPhase(id) {
  const clawSpeed = getClawSpeed(id);
  const plushSpeed = getPlushSpeed(id);
  const presentType = getPresentType(id);

  return {
    id,
    name: `Fase ${id}`,
    description: getPhaseDescription(id, clawSpeed, plushSpeed, presentType),
    plushRadius: getPlushRadius(id),
    clawSpeed,
    plushSpeed,
    timer: getPhaseTimer(id),
    points: getPhasePoints(id),
    presentType,
    catchThreshold: getCatchThreshold(id),
    targetCaptures: 2,
    clearMachine: id === FINAL_PHASE_ID,
  };
}

export const phases = Array.from({ length: TOTAL_PHASES }, (_, index) => createPhase(index + 1));

export const machine = {
  x: 44,
  y: 110,
  width: 332,
  height: 520,
};

export function createInitialClaw() {
  return {
    x: machine.x + machine.width / 2,
    y: 92,
    width: 72,
    armHeight: 0,
    speed: phases[0].clawSpeed,
    dropping: false,
    returning: false,
    carrying: false,
    gripOpen: 1,
    gripTarget: 1,
  };
}

export function createInitialState() {
  return {
    phaseIndex: 0,
    unlocked: 1,
    points: 0,
    continues: 0,
    tries: 3,
    extraTries: 0,
    timer: phases[0].timer,
    timerTick: 0,
    moveDirection: 0,
    plush: null,
    plushes: [],
    carriedPlushes: [],
    specialPlush: null,
    plushVisible: true,
    resultLock: false,
    collection: [],
    buttonPress: 0,
    exitAnimation: null,
    exitAnimations: [],
    present: null,
    presentFlash: null,
    comboExtraFlash: null,
    feedbackPulse: null,
    feedbackOverlay: null,
    ghostTrail: [],
    screenShake: 0,
    soundEvents: [],
    slowMotionTick: 0,
    gameOver: false,
    continuePrompt: false,
    continueTimer: 0,
    gameOverMessage: "",
    phaseCatchCount: 0,
    bonusRound: null,
    bonusAssignments: {},
    usedBonusPhaseIds: [],
    bonusRoundScore: 0,
    bonusRoundFailed: false,
    pendingRoundRespawn: false,
    claimedContinuePhases: [],
    spawnedContinuePhases: [],
    specialAssignments: {},
    usedSpecialWindows: { skull: [], angel: [], ghost: [] },
    bigBearMashRemaining: 0,
    lastPlushKey: "",
    pileShuffleStep: 0,
    pileShuffleCooldown: 0,
    runTimeMs: 0,
    touchTargetX: null,
    touchControlActive: false,
    hasStarted: false,
    playerName: "",
    scoreSaved: false,
    soundMuted: false,
    paused: false,
  };
}
