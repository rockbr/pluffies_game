function getPhaseTimer(id) {
  if (id === 100) return 8;
  if (id >= 61) return 10;
  if (id >= 21) return 12;
  return 15;
}

function getClawSpeed(id) {
  if (id === 100) return 12;
  if (id >= 91) return 11;
  if (id >= 71) return 10;
  if (id >= 41) return 9;
  if (id >= 21) return 8;
  return 7;
}

function getPlushSpeed(id) {
  if (id === 100) return 0;
  if (id >= 81) return 2.5;
  if (id >= 61) return 2.1;
  if (id >= 41) return 1.6;
  if (id >= 21) return 1.1;
  if (id >= 11) return 0.6;
  return 0;
}

function getPlushRadius(id) {
  if (id === 100) return 22;
  if (id >= 91) return 22;
  if (id >= 71) return 24;
  if (id >= 51) return 28;
  if (id >= 31) return 34;
  if (id >= 11) return 40;
  return 48;
}

function getPhasePoints(id) {
  return 15 + id * 5;
}

function getPresentType(id) {
  const map = {
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

  return map[id] ?? null;
}

function getCatchThreshold(id) {
  if (id === 100) return 0.72;
  if (id >= 81) return 0.68;
  if (id >= 61) return 0.64;
  if (id >= 31) return 0.6;
  return 0.56;
}

function getPhaseDescription(id, clawSpeed, plushSpeed, presentType) {
  const targetCaptures = 2;

  if (id === 100) {
    return `Fase final. Maquina vazia, sem figurantes, alvo unico e precisao maxima. Meta ${targetCaptures} capturas.`;
  }

  const movementText = plushSpeed === 0
    ? "bicho parado"
    : `bicho em movimento ${plushSpeed.toFixed(1)}x`;
  const giftText = presentType ? ` Presente ${presentType} nesta fase.` : "";

  return `Meta ${targetCaptures} capturas. Garra ${clawSpeed.toFixed(1)}x, ${movementText}.${giftText}`;
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
    clearMachine: id === 100,
  };
}

export const phases = Array.from({ length: 100 }, (_, index) => createPhase(index + 1));

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
    specialPlush: null,
    plushVisible: true,
    resultLock: false,
    collection: [],
    buttonPress: 0,
    exitAnimation: null,
    present: null,
    presentFlash: null,
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


