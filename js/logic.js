import { createInitialClaw, machine, phases } from "./config.js";
import { triesLeftEl } from "./dom.js";
import { randomRange } from "./utils.js";
import { renderCollection, setMessage, syncUI } from "./ui.js";

const PLUSH_PALETTES = [
  { color: "#ef845d", accent: "#64b6f2" },
  { color: "#9dd66f", accent: "#ffd45c" },
  { color: "#d893c8", accent: "#6ce3d7" },
  { color: "#f6b249", accent: "#ff8a96" },
  { color: "#7ba0d7", accent: "#ef5c74" },
  { color: "#8ccfca", accent: "#f5c46a" },
];

const VARIANT_NAMES = {
  classic: "Urso Classico",
  bow: "Urso de Laco",
  patch: "Urso Pirata",
  bandana: "Urso Bandana",
  star: "Urso Estrela",
  panda: "Urso Panda",
  skull: "Urso Caveira",
  angel: "Urso Anjo",
  ghost: "Urso Fantasma",
  big: "BIG Urso",
  kangaroo: "Urso Canguru",
};
const PLUSH_VARIANTS = ["classic", "bow", "patch", "bandana", "star", "panda"];

const MONTHLY_THEMES = {
  1: { id: "praia", name: "Urso Praia" },
  2: { id: "carnaval", name: "Urso Carnaval" },
  3: { id: "trevo", name: "Urso Trevo" },
  4: { id: "coelho", name: "Urso Coelho" },
  5: { id: "flor", name: "Urso Flor" },
  6: { id: "caipira", name: "Urso Caipira" },
  7: { id: "julino", name: "Urso Julino" },
  8: { id: "surfista", name: "Urso Surfista" },
  9: { id: "primavera", name: "Urso Primavera" },
  10: { id: "abobora", name: "Urso Abobora" },
  11: { id: "folhas", name: "Urso Folhas" },
  12: { id: "noel", name: "Urso Noel" },
};

const VARIANT_RARITY_LABELS = {
  ghost: "LENDARIO",
  big: "RARO",
  kangaroo: "ESPECIAL",
  panda: "RARO",
  star: "ESPECIAL",
  bandana: "ESPECIAL",
};

function queueSound(state, cue) {
  state.soundEvents.push(cue);
}

const CONTINUE_PROMPT_MS = 9000;

function triggerVisualFeedback(state, {
  x,
  y,
  color,
  label = "",
  pulseTimer = 420,
  overlayTimer = 220,
  shake = 0,
}) {
  state.feedbackPulse = {
    x,
    y,
    color,
    label,
    timer: pulseTimer,
    maxTimer: pulseTimer,
  };
  state.feedbackOverlay = {
    color,
    timer: overlayTimer,
    maxTimer: overlayTimer,
  };
  state.screenShake = Math.max(state.screenShake, shake);
}

function getPrizeExitTarget() {
  return {
    x: machine.x + 20,
    y: machine.y + machine.height + 2,
    radius: 16,
  };
}

function getPrizeName(plush, index) {
  const base = plush.themeId
    ? (MONTHLY_THEMES[new Date().getMonth() + 1]?.id === plush.themeId
      ? MONTHLY_THEMES[new Date().getMonth() + 1].name
      : (plush.themeName ?? VARIANT_NAMES[plush.variant] ?? "Urso Especial"))
    : (VARIANT_NAMES[plush.variant] ?? "Urso Especial");
  return `${base} ${index}`;
}

function getCurrentThemeConfig() {
  return MONTHLY_THEMES[new Date().getMonth() + 1] ?? null;
}

function getPointMultiplier(variant = "") {
  if (variant === "ghost") return 4;
  if (variant === "angel") return 2;
  return 1;
}

function getThemeChance(phaseId) {
  if (phaseId >= 80) return 0.34;
  if (phaseId >= 40) return 0.26;
  return 0.18;
}

function getSpecialAnchorPoints() {
  return [
    machine.x + 78,
    machine.x + machine.width * 0.35,
    machine.x + machine.width * 0.65,
    machine.x + machine.width - 78,
  ];
}

function isDoubleRoundPhase(phaseId) {
  return phaseId > 20 && phaseId % 10 !== 0 && phaseId % 2 === 0;
}

function isTripleRoundPhase(phaseId) {
  return phaseId > 30 && phaseId % 10 !== 0 && phaseId % 2 === 1;
}

function getRoundTargetCaptures(state, phase) {
  return state.bonusRound?.count ?? phase.targetCaptures;
}

function getRoundInstruction(state, phase) {
  if (state.bonusRound) {
    return `Rodada x${state.bonusRound.multiplier}. Pegue ${state.bonusRound.count} ursos iguais antes do tempo acabar para multiplicar os pontos.`;
  }

  return "Use A e D ou as setas. Aperte espaco ou seta para baixo para soltar.";
}

function resetClawForPhase(claw, phase) {
  const freshClaw = createInitialClaw();
  claw.x = freshClaw.x;
  claw.y = freshClaw.y;
  claw.width = freshClaw.width;
  claw.armHeight = 0;
  claw.speed = phase.clawSpeed;
  claw.dropping = false;
  claw.returning = false;
  claw.carrying = false;
  claw.gripOpen = 1;
  claw.gripTarget = 1;
}

function resetRound(state, claw, options = {}) {
  const {
    resetTimer = false,
    resetTries = false,
    resetProgress = false,
    resetSlowMotion = false,
    clearGameOver = false,
    preserveRoundState = false,
  } = options;
  const phase = phases[state.phaseIndex];

  resetClawForPhase(claw, phase);

  if (resetTimer) {
    state.timer = phase.timer;
    state.timerTick = 0;
  }

  if (resetTries) {
    state.tries = 3 + state.extraTries;
  }

  if (resetProgress) {
    state.phaseCatchCount = 0;
  }

  if (resetSlowMotion) {
    state.slowMotionTick = 0;
  }

  if (clearGameOver) {
    state.gameOver = false;
    state.gameOverMessage = "";
  }

  state.moveDirection = 0;
  state.touchTargetX = claw.x;
  state.bigBearMashRemaining = 0;
  state.ghostTrail = [];
  if (!preserveRoundState) {
    state.bonusRound = getBonusRoundConfig(state, phase);
    state.bonusRoundScore = 0;
    state.bonusRoundFailed = false;
    state.plushes = createRoundPlushes(state, phase, state.bonusRound);
    state.plush = state.plushes[0] ?? null;
    state.specialPlush = createSpecialPlush(state, phase, state.plushes, state.bonusRound);
  } else {
    state.plush = state.plushes[0] ?? null;
  }
  state.plushVisible = true;
  state.resultLock = false;
  state.exitAnimation = null;
  state.present = preserveRoundState
    ? state.present
    : createPresent(state, phase, state.plushes, state.bonusRound);
  state.presentFlash = null;
  state.feedbackPulse = null;
  state.feedbackOverlay = null;

  if (state.bonusRound && !preserveRoundState) {
    triggerPresentFlash(
      state,
      state.bonusRound.count === 3 ? "triple" : "double",
      state.bonusRound.count === 3 ? "PEGUE 3 E TRIPLIQUE" : "PEGUE 2 E DUPLIQUE",
      state.bonusRound.count === 3 ? "RODADA TRIPLA!" : "RODADA DUPLA!",
    );
    triggerVisualFeedback(state, {
      x: machine.x + machine.width / 2,
      y: machine.y + 210,
      color: state.bonusRound.count === 3 ? "#ffd84d" : "#6ce3d7",
      label: state.bonusRound.count === 3 ? "RODADA TRIPLA" : "RODADA DUPLA",
      pulseTimer: 900,
      overlayTimer: 260,
      shake: 0,
    });
  }
}

function getSpecialWindowIndex(phaseId) {
  return Math.floor((phaseId - 1) / 10);
}

function getBonusWindowIndex(phaseId) {
  return Math.floor((phaseId - 1) / 20);
}

function getGhostWindowIndex(phaseId) {
  return Math.floor((phaseId - 1) / 20);
}

function ensureSpecialAssignment(state, phaseId) {
  const windowIndex = getSpecialWindowIndex(phaseId);
  if (state.specialAssignments[windowIndex]) {
    return state.specialAssignments[windowIndex];
  }

  const start = windowIndex * 10 + 1;
  const end = Math.min(100, start + 9);
  const phaseIds = Array.from({ length: end - start + 1 }, (_, index) => start + index);
  const skullPhase = phaseIds[Math.floor(Math.random() * phaseIds.length)];
  const angelCandidates = phaseIds.filter((id) => id !== skullPhase);
  const angelPhase = angelCandidates[Math.floor(Math.random() * angelCandidates.length)] ?? skullPhase;

  state.specialAssignments[windowIndex] = {
    skullPhase,
    angelPhase,
  };

  return state.specialAssignments[windowIndex];
}

function ensureBonusAssignment(state, phaseId) {
  const windowIndex = getBonusWindowIndex(phaseId);
  if (state.bonusAssignments[windowIndex]) {
    return state.bonusAssignments[windowIndex];
  }
  const phaseIdSelected = (windowIndex + 1) * 20;
  const count = Math.random() < 0.5 ? 2 : 3;

  state.bonusAssignments[windowIndex] = {
    phaseId: phaseIdSelected,
    count,
  };

  return state.bonusAssignments[windowIndex];
}

function ensureGhostAssignment(state, phaseId) {
  const windowIndex = getGhostWindowIndex(phaseId);
  const key = `ghost-${windowIndex}`;
  if (state.specialAssignments[key]) {
    return state.specialAssignments[key];
  }

  const start = windowIndex * 20 + 1;
  const end = Math.min(100, start + 19);
  const candidateIds = [];

  for (let id = start; id <= end; id += 1) {
    if (id % 20 === 0) {
      continue;
    }
    const phase = phases[id - 1];
    if (!phase || phase.clearMachine) {
      continue;
    }
    candidateIds.push(id);
  }

  const enabled = Math.random() < 0.38;
  state.specialAssignments[key] = {
    phaseId: enabled && candidateIds.length
      ? candidateIds[Math.floor(Math.random() * candidateIds.length)]
      : null,
  };

  return state.specialAssignments[key];
}

function getBonusRoundConfig(state, phase) {
  if (phase.clearMachine || state.usedBonusPhaseIds.includes(phase.id)) {
    return null;
  }

  let count = 0;
  if (isTripleRoundPhase(phase.id)) {
    count = 3;
  } else if (isDoubleRoundPhase(phase.id)) {
    count = 2;
  }

  if (!count) {
    return null;
  }

  state.usedBonusPhaseIds.push(phase.id);

  return {
    count,
    multiplier: count,
  };
}

function createSpecialPlush(state, phase, mainPlushes, bonusRound) {
  if (phase.clearMachine) {
    return null;
  }

  const windowIndex = getSpecialWindowIndex(phase.id);
  const assignment = ensureSpecialAssignment(state, phase.id);
  let variant = null;

  if (assignment.skullPhase === phase.id && !state.usedSpecialWindows.skull.includes(windowIndex)) {
    variant = "skull";
    state.usedSpecialWindows.skull.push(windowIndex);
  } else if (!bonusRound && assignment.angelPhase === phase.id && !state.usedSpecialWindows.angel.includes(windowIndex)) {
    variant = "angel";
    state.usedSpecialWindows.angel.push(windowIndex);
  }

  if (!variant && !bonusRound) {
    const ghostWindowIndex = getGhostWindowIndex(phase.id);
    const ghostAssignment = ensureGhostAssignment(state, phase.id);
    if (
      ghostAssignment.phaseId === phase.id &&
      !state.usedSpecialWindows.ghost.includes(ghostWindowIndex)
    ) {
      variant = "ghost";
      state.usedSpecialWindows.ghost.push(ghostWindowIndex);
    }
  }

  if (!variant && !bonusRound && phase.id >= 25 && phase.id % 10 === 5) {
    variant = "big";
  }

  if (!variant && !bonusRound && phase.id >= 18 && phase.id % 10 === 8) {
    variant = "kangaroo";
  }

  if (!variant) {
    return null;
  }

  const minX = machine.x + 84;
  const maxX = machine.x + machine.width - 84;
  let x = randomRange(minX, maxX);
  let attempts = 0;
  const activePlushes = mainPlushes ?? [];

  while (activePlushes.some((plush) => Math.abs(x - plush.x) < plush.radius + 60) && attempts < 12) {
    x = randomRange(minX, maxX);
    attempts += 1;
  }

  if (activePlushes.some((plush) => Math.abs(x - plush.x) < plush.radius + 60)) {
    const anchor = activePlushes[0];
    if (anchor) {
      x = anchor.x < machine.x + machine.width / 2
        ? Math.min(maxX, anchor.x + anchor.radius + 62)
        : Math.max(minX, anchor.x - anchor.radius - 62);
    }
  }

  return {
    x,
    y: machine.y + machine.height - 140,
    radius: variant === "big"
      ? Math.max(60, phase.plushRadius * 1.74)
      : variant === "kangaroo"
        ? Math.max(38, phase.plushRadius * 1.18)
        : Math.max(24, phase.plushRadius * (bonusRound ? 0.78 : 0.88)),
    color: variant === "angel"
      ? "#fff0d9"
      : variant === "ghost"
        ? "#d3fbf4"
        : variant === "big"
          ? "#f0b04d"
          : variant === "kangaroo"
            ? "#c98b58"
            : "#fff3eb",
    accent: variant === "angel"
      ? "#ffd84d"
      : variant === "ghost"
        ? "#7af0ff"
        : variant === "big"
          ? "#ff7b38"
          : variant === "kangaroo"
            ? "#ffe3a7"
            : "#d21428",
    ears: 2,
    wobbleSeed: Math.random() * Math.PI * 2,
    variant,
    direction: Math.random() > 0.5 ? 1 : -1,
    speed: variant === "angel" || variant === "skull"
      ? Math.max(1.55, phase.plushSpeed * 1.28)
      : Math.max(0.7, phase.plushSpeed * 1.05),
    visibleAlpha: variant === "ghost" ? 0.92 : 1,
    ghostTeleportTimer: variant === "ghost" ? 980 : 0,
    ghostPhase: variant === "ghost" ? "visible" : "",
    kangarooJumpTimer: variant === "kangaroo" ? 820 : 0,
    kangarooJumping: false,
    kangarooGroundY: machine.y + machine.height - 140,
  };
}

function createPresent(state, phase, plushes, bonusRound) {
  if (!phase.presentType || phase.clearMachine || bonusRound) {
    return null;
  }

  if (state.specialPlush?.variant === "skull") {
    return null;
  }

  if (phase.presentType === "continue" && state.claimedContinuePhases.includes(phase.id)) {
    return null;
  }

  if (phase.presentType === "continue" && (state.spawnedContinuePhases ?? []).includes(phase.id)) {
    return null;
  }

  const radius = 24;
  const minX = machine.x + 70;
  const maxX = machine.x + machine.width - 70;
  let x = randomRange(minX, maxX);
  let attempts = 0;
  const activePlushes = plushes ?? [];

  while (activePlushes.some((plush) => Math.abs(x - plush.x) < plush.radius + radius + 40) && attempts < 10) {
    x = randomRange(minX, maxX);
    attempts += 1;
  }

  if (activePlushes.some((plush) => Math.abs(x - plush.x) < plush.radius + radius + 40)) {
    const anchor = activePlushes[0];
    if (anchor) {
      const minDistanceFromPlush = anchor.radius + radius + 40;
      x = anchor.x < machine.x + machine.width / 2
        ? Math.min(maxX, anchor.x + minDistanceFromPlush)
        : Math.max(minX, anchor.x - minDistanceFromPlush);
    }
  }

  if (phase.presentType === "continue") {
    state.spawnedContinuePhases = state.spawnedContinuePhases ?? [];
    state.spawnedContinuePhases.push(phase.id);
  }

  return {
    x,
    y: machine.y + machine.height - 118,
    radius,
    type: phase.presentType,
    wobbleSeed: Math.random() * Math.PI * 2,
  };
}

function triggerPresentFlash(state, presentType, message, title = "PREMIO!") {
  state.presentFlash = {
    type: presentType,
    title,
    message,
    timer: 1150,
  };
}

function triggerGameOver(state, claw, message) {
  if (state.gameOver) {
    return;
  }

  state.resultLock = true;
  state.gameOver = true;
  state.moveDirection = 0;
  claw.dropping = false;
  claw.returning = false;
  claw.carrying = false;
  claw.armHeight = 0;
  claw.gripTarget = 1;
  state.gameOverMessage = message;
  state.continuePrompt = state.continues > 0;
  state.continueTimer = state.continuePrompt ? CONTINUE_PROMPT_MS : 0;
  queueSound(state, "gameover");
  triggerVisualFeedback(state, {
    x: machine.x + machine.width / 2,
    y: machine.y + 180,
    color: "#ef5a4c",
    label: "ERROU",
    pulseTimer: 520,
    overlayTimer: 320,
    shake: 12,
  });
  setMessage(state.continuePrompt
    ? `Continue disponivel. Voce tem ${Math.ceil(state.continueTimer / 1000)}s para usar.`
    : message);
}

function consumeTry(state) {
  const hadExtraBuffered = state.tries > 3 && state.extraTries > 0;
  state.tries = Math.max(0, state.tries - 1);

  if (hadExtraBuffered) {
    state.extraTries = Math.max(0, state.extraTries - 1);
  }
}

function handleRoundTimeout(state, claw, message) {
  consumeTry(state);
  if (triesLeftEl) {
    triesLeftEl.textContent = String(state.tries);
  }

  if (state.tries <= 0) {
    triggerGameOver(state, claw, "Suas tentativas acabaram.");
    return;
  }

  resetRound(state, claw, {
    resetTimer: true,
    resetSlowMotion: true,
    preserveRoundState: Boolean(state.bonusRound),
  });
  syncUI(state, phases);
  setMessage(message);
}

function createPlush(state, phase) {
  const plushOptions = [];
  const weightedVariants = getWeightedVariantsForPhase(phase.id);

  PLUSH_PALETTES.forEach((palette, paletteIndex) => {
    weightedVariants.forEach((variant) => {
      plushOptions.push({
        palette,
        variant,
        key: `${variant}-${paletteIndex}`,
      });
    });
  });

  const filteredOptions = plushOptions.filter((option) => option.key !== state.lastPlushKey);
  const selectedOption = filteredOptions[Math.floor(Math.random() * filteredOptions.length)]
    ?? plushOptions[0];
  const x = phase.clearMachine
    ? machine.x + machine.width / 2
    : randomRange(machine.x + 84, machine.x + machine.width - 84);
  const monthlyTheme = getCurrentThemeConfig();
  const themeId = monthlyTheme && Math.random() < getThemeChance(phase.id) ? monthlyTheme.id : null;

  state.lastPlushKey = selectedOption.key;

  return {
    x,
    y: machine.y + machine.height - 138,
    radius: phase.plushRadius,
    color: selectedOption.palette.color,
    accent: selectedOption.palette.accent,
    ears: phase.id >= 3 ? 3 : 2,
    wobbleSeed: Math.random() * Math.PI * 2,
    variant: selectedOption.variant,
    themeId,
    themeName: themeId ? monthlyTheme.name : "",
    direction: Math.random() > 0.5 ? 1 : -1,
    speed: phase.plushSpeed,
  };
}

function getWeightedVariantsForPhase(phaseId) {
  if (phaseId <= 10) {
    return [
      "classic", "classic", "classic", "classic", "classic", "classic",
      "bow", "bow", "bow",
      "patch", "patch",
    ];
  }

  if (phaseId <= 20) {
    return [
      "classic", "classic", "classic", "classic", "classic",
      "bow", "bow", "bow",
      "patch", "patch",
      "bandana",
    ];
  }

  if (phaseId <= 35) {
    return [
      "classic", "classic", "classic", "classic",
      "bow", "bow",
      "patch", "patch",
      "bandana", "bandana",
      "star",
    ];
  }

  if (phaseId <= 55) {
    return [
      "classic", "classic", "classic", "classic",
      "bow", "bow",
      "patch", "patch",
      "bandana", "bandana",
      "star",
      "panda",
    ];
  }

  return [
    "classic", "classic", "classic",
    "bow", "bow",
    "patch", "patch",
    "bandana", "bandana",
    "star", "star",
    "panda",
  ];
}

function createRoundPlushes(state, phase, bonusRound) {
  const basePlush = createPlush(state, phase);
  if (!bonusRound) {
    return [basePlush];
  }

  const radiusScales = bonusRound.count === 3 ? [1, 0.8, 0.64] : [1, 0.76];
  const plushes = [];

  radiusScales.forEach((scale, index) => {
    const radius = Math.max(22, Math.round(phase.plushRadius * scale));
    const minX = machine.x + radius + 24;
    const maxX = machine.x + machine.width - radius - 24;
    let x = randomRange(minX, maxX);
    let attempts = 0;

    while (plushes.some((plush) => Math.abs(x - plush.x) < plush.radius + radius + 16) && attempts < 18) {
      x = randomRange(minX, maxX);
      attempts += 1;
    }

    if (plushes.some((plush) => Math.abs(x - plush.x) < plush.radius + radius + 16)) {
      x = minX + ((maxX - minX) / Math.max(1, bonusRound.count - 1)) * index;
    }

    plushes.push({
      ...basePlush,
      x,
      y: machine.y + machine.height - 138 - randomRange(0, 8),
      radius,
      wobbleSeed: Math.random() * Math.PI * 2,
      direction: Math.random() > 0.5 ? -1 : 1,
      speed: Math.max(0, phase.plushSpeed * (0.95 + index * 0.1)),
    });
  });

  plushes.sort((a, b) => a.x - b.x);
  return plushes;
}

function moveClaw(claw, direction, speedMultiplier = 1, targetX = null, useTarget = false) {
  const margin = claw.width / 2;

  if (useTarget && Number.isFinite(targetX)) {
    const clampedTarget = Math.max(machine.x + margin, Math.min(machine.x + machine.width - margin, targetX));
    const step = claw.speed * speedMultiplier;
    const delta = clampedTarget - claw.x;

    if (Math.abs(delta) <= step) {
      claw.x = clampedTarget;
    } else {
      claw.x += Math.sign(delta) * step;
    }

    claw.x = Math.max(machine.x + margin, Math.min(machine.x + machine.width - margin, claw.x));
    return;
  }

  if (!direction) {
    return;
  }

  claw.x += direction * claw.speed * speedMultiplier;
  claw.x = Math.max(machine.x + margin, Math.min(machine.x + machine.width - margin, claw.x));
}

function attemptCatch(state, claw) {
  const phase = phases[state.phaseIndex];
  const candidates = [...(state.plushes ?? []), state.specialPlush].filter(Boolean);
  let bestTarget = null;
  let bestScore = -1;

  candidates.forEach((plush) => {
    if (plush.variant === "ghost" && (plush.visibleAlpha ?? 1) < 0.55) {
      return;
    }
    if (plush.variant === "kangaroo" && plush.kangarooJumping) {
      return;
    }
    const tolerance = plush.radius * 1.08;
    const horizontalDistance = Math.abs(claw.x - plush.x);
    const alignmentScore = Math.max(0, 1 - horizontalDistance / tolerance);
    if (alignmentScore >= phase.catchThreshold && alignmentScore > bestScore) {
      bestTarget = plush;
      bestScore = alignmentScore;
    }
  });

  return bestTarget;
}

function getClosestDropTarget(state, claw) {
  const candidates = [...(state.plushes ?? []), state.specialPlush].filter(Boolean);
  if (!candidates.length) {
    return null;
  }

  return [...candidates].sort((a, b) => Math.abs(a.x - claw.x) - Math.abs(b.x - claw.x))[0];
}

function attemptPresentCatch(state, claw) {
  const present = state.present;
  if (!present) {
    return false;
  }

  return Math.abs(claw.x - present.x) <= present.radius * 1.2;
}

function applyPresentEffect(state, claw) {
  const present = state.present;
  if (!present) {
    return;
  }

  const phase = phases[state.phaseIndex];
  const penalty = Math.max(25, Math.round(state.points * 0.2));
  let flashMessage = "PREMIO";

  switch (present.type) {
    case "green":
      state.extraTries += 1;
      state.tries += 1;
      queueSound(state, "bonus");
      setMessage("Presente verde: ganhou 1 tentativa.");
      flashMessage = "+1 TENTATIVA";
      break;
    case "blue":
      state.timer += 5;
      queueSound(state, "bonus");
      setMessage("Presente azul: +5 segundos.");
      flashMessage = "+5 SEGUNDOS";
      break;
    case "yellow":
      state.slowMotionTick = 5000;
      queueSound(state, "bonus");
      setMessage("Presente amarelo: maquina em camera lenta.");
      flashMessage = "CAMERA LENTA";
      break;
    case "orange":
      state.points += Math.round(phase.points * 0.5);
      queueSound(state, "bonus");
      setMessage("Presente laranja: bonus de pontos.");
      flashMessage = "BONUS DE PONTOS";
      break;
    case "red":
      state.timer = Math.max(0, state.timer - 5);
      state.points = Math.max(0, state.points - penalty);
      queueSound(state, "bomb");
      setMessage("Bomba vermelha: perdeu tempo e pontos.");
      flashMessage = "BOMBA";
      if (state.timer <= 0) {
        triggerPresentFlash(state, present.type, flashMessage);
        state.present = null;
        handleRoundTimeout(state, claw, "A bomba zerou o tempo. -1 tentativa.");
        return;
      }
      break;
    case "purple":
      state.timer += 3;
      state.extraTries += 1;
      state.tries += 1;
      queueSound(state, "bonus");
      setMessage("Presente roxo: bonus misto de tempo e tentativa.");
      flashMessage = "SUPER BONUS";
      break;
    case "white":
      state.timer += 2;
      state.points += Math.round(phase.points * 0.35);
      queueSound(state, "bonus");
      setMessage("Presente branco: premio surpresa.");
      flashMessage = "PREMIO SURPRESA";
      break;
    case "continue":
      state.continues += 1;
      if (!state.claimedContinuePhases.includes(phase.id)) {
        state.claimedContinuePhases.push(phase.id);
      }
      queueSound(state, "bonus");
      setMessage("Presente continue: ganhou 1 continue.");
      flashMessage = "CONTINUE";
      break;
    default:
      break;
  }

  triggerPresentFlash(state, present.type, flashMessage);
  triggerVisualFeedback(state, {
    x: present.x,
    y: present.y,
    color: present.type === "red" ? "#ef5a4c" : "#57d66b",
    label: flashMessage,
    pulseTimer: 520,
    overlayTimer: 240,
    shake: present.type === "red" ? 10 : 6,
  });
  state.present = null;
  syncUI(state, phases);
}

function handleWin(state, claw) {
  const phase = phases[state.phaseIndex];
  const plush = state.plush;
  const exitTarget = getPrizeExitTarget();
  const targetCaptures = getRoundTargetCaptures(state, phase);

  const pointsAward = phase.points * getPointMultiplier(plush.variant);
  state.points += pointsAward;
  if (state.bonusRound) {
    state.bonusRoundScore += pointsAward;
  }
  state.exitAnimation = {
    progress: 0,
    startX: plush.x,
    startY: plush.y,
    startRadius: plush.radius,
    targetX: exitTarget.x,
    targetY: exitTarget.y,
    targetRadius: exitTarget.radius,
    color: plush.color,
    ears: plush.ears,
    variant: plush.variant,
    accent: plush.accent,
    themeId: plush.themeId ?? "",
    themeName: plush.themeName ?? "",
    wobbleSeed: plush.wobbleSeed,
  };
  if (state.pileShuffleCooldown <= 0) {
    state.pileShuffleStep += 1;
    state.pileShuffleCooldown = 3;
  } else {
    state.pileShuffleCooldown -= 1;
  }

  state.collection.unshift({
    name: getPrizeName(plush, state.collection.length + 1),
    detail: `${phase.name} - ${pointsAward} pontos`,
    color: plush.color,
    accent: plush.accent,
    variant: plush.variant,
    themeId: plush.themeId ?? "",
    themeName: plush.themeName ?? "",
    ears: plush.ears,
    points: pointsAward,
  });

  renderCollection(state);
  state.phaseCatchCount += 1;
  state.bigBearMashRemaining = 0;

  if (state.phaseCatchCount >= targetCaptures) {
    if (state.phaseIndex + 1 < phases.length) {
      state.unlocked = Math.max(state.unlocked, state.phaseIndex + 2);
    }
  }

  let bonusMessage = "";
  if (state.bonusRound && state.phaseCatchCount >= targetCaptures) {
    if (!state.bonusRoundFailed) {
      const bonusExtra = state.bonusRoundScore * (state.bonusRound.multiplier - 1);
      if (bonusExtra > 0) {
        state.points += bonusExtra;
        bonusMessage = ` Bonus x${state.bonusRound.multiplier}: +${bonusExtra} pontos.`;
        queueSound(state, "bonus");
        triggerPresentFlash(
          state,
          state.bonusRound.multiplier === 3 ? "triple" : "double",
          `+${bonusExtra} PONTOS`,
          state.bonusRound.multiplier === 3 ? "TRIPLICOU!" : "DUPLICOU!",
        );
        triggerVisualFeedback(state, {
          x: machine.x + machine.width / 2,
          y: machine.y + 208,
          color: state.bonusRound.multiplier === 3 ? "#ffd84d" : "#6ce3d7",
          label: `x${state.bonusRound.multiplier} BONUS`,
          pulseTimer: 760,
          overlayTimer: 280,
          shake: 7,
        });
      }
    } else {
      bonusMessage = " Rodada especial perdida.";
    }
  }

  syncUI(state, phases);
  claw.carrying = false;
  claw.dropping = false;
  claw.returning = false;
  queueSound(state, "win");
  triggerVisualFeedback(state, {
    x: exitTarget.x,
    y: exitTarget.y,
    color: "#ffd84d",
    label: `+${pointsAward}`,
    pulseTimer: 560,
    overlayTimer: 220,
    shake: 8,
  });
  if (plush.variant === "angel") {
    triggerPresentFlash(state, "angel", `LENDARIO +${pointsAward} PONTOS`, "URSO ANJO!");
    setMessage(`Urso anjo pego. ${pointsAward} pontos. ${state.phaseCatchCount}/${targetCaptures} capturas.${bonusMessage}`);
  } else if (plush.variant === "ghost") {
    triggerPresentFlash(state, "ghost", `FANTASMA x4 +${pointsAward}`, "URSO FANTASMA!");
    setMessage(`Urso fantasma pego. ${pointsAward} pontos. ${state.phaseCatchCount}/${targetCaptures} capturas.${bonusMessage}`);
  } else {
    setMessage(`Boa. ${pointsAward} pontos. ${state.phaseCatchCount}/${targetCaptures} capturas.${bonusMessage}`);
  }
}

function handleSkullCatch(state, claw, skullPlush) {
  const phase = phases[state.phaseIndex];
  const penalty = Math.max(20, Math.round(phase.points * 0.45));
  state.points = Math.max(0, state.points - penalty);
  state.plushes = [];
  state.plush = null;
  state.specialPlush = null;
  if (state.bonusRound) {
    state.bonusRoundFailed = true;
  }
  state.pendingRoundRespawn = true;
  syncUI(state, phases);
  claw.carrying = false;
  claw.dropping = false;
  claw.returning = true;
  queueSound(state, "bomb");
  triggerVisualFeedback(state, {
    x: skullPlush.x,
    y: skullPlush.y,
    color: "#ef5a4c",
    label: `-${penalty}`,
    pulseTimer: 520,
    overlayTimer: 220,
    shake: 7,
  });
  triggerPresentFlash(state, "skull", `PERIGOSO -${penalty} PONTOS`, "URSO CAVEIRA!");
  setMessage(state.bonusRound
    ? `Urso caveira pego. Voce perdeu ${penalty} pontos e a rodada x${state.bonusRound.multiplier} foi perdida.`
    : `Urso caveira pego. Voce perdeu ${penalty} pontos.`);
}

function resolveDropAtBottom(state, claw) {
  const phase = phases[state.phaseIndex];
  claw.gripTarget = 0.18;

  if (attemptPresentCatch(state, claw)) {
    applyPresentEffect(state, claw);
    claw.carrying = false;
    claw.dropping = false;
    claw.returning = true;
    return;
  }

  const caughtPlush = attemptCatch(state, claw);

  if (caughtPlush?.variant === "skull") {
    handleSkullCatch(state, claw, caughtPlush);
    return;
  }

  if (caughtPlush) {
    const phasePoints = phase.points * getPointMultiplier(caughtPlush.variant);
    const rarityLabel = VARIANT_RARITY_LABELS[caughtPlush.variant];
    claw.carrying = true;
    claw.dropping = false;
    claw.returning = true;
    state.plushVisible = true;
    state.plush = caughtPlush;
    state.plushes = (state.plushes ?? []).filter((plush) => plush !== caughtPlush);
    if (caughtPlush === state.specialPlush) {
      state.specialPlush = null;
    }
    state.bigBearMashRemaining = caughtPlush.variant === "big" ? 2 : 0;
    queueSound(state, "catch");
    triggerVisualFeedback(state, {
      x: caughtPlush.x,
      y: caughtPlush.y,
      color: "#6ae4a0",
      label: rarityLabel ? `${rarityLabel} +${phasePoints}` : `+${phasePoints}`,
      pulseTimer: 420,
      overlayTimer: 180,
      shake: 6,
    });
    setMessage(
      caughtPlush.variant === "big"
        ? "BIG Urso pego. Aperte PEGAR mais 2 vezes para subir."
        : "Pegou. Subindo com a pelucia."
    );
    return;
  }

  consumeTry(state);
  if (triesLeftEl) {
    triesLeftEl.textContent = String(state.tries);
  }
  claw.carrying = false;
  claw.dropping = false;
  claw.returning = true;

  if (state.tries <= 0) {
    triggerGameOver(state, claw, "Suas tentativas acabaram.");
    return;
  }

  queueSound(state, "miss");
  triggerVisualFeedback(state, {
    x: claw.x,
    y: machine.y + machine.height - 122,
    color: "#ff6b63",
    label: "ERROU",
    pulseTimer: 360,
    overlayTimer: 140,
    shake: 5,
  });
  setMessage("A pelucia escapou. Ajuste melhor a mira.");
}

function finishReturn(state, claw) {
  claw.returning = false;
  claw.armHeight = 0;
  claw.gripTarget = 1;

  if (claw.carrying) {
    handleWin(state, claw);
    return;
  }

  if (state.pendingRoundRespawn) {
    state.pendingRoundRespawn = false;
    state.bonusRound = null;
    state.bonusRoundScore = 0;
    resetRound(state, claw);
    syncUI(state, phases);
    setMessage("Rodada reiniciada apos o urso caveira.");
    return;
  }

  state.resultLock = false;
}

export function resetPhase(state, claw, resetMessage = true) {
  const phase = phases[state.phaseIndex];
  resetRound(state, claw, {
    resetTimer: true,
    resetTries: true,
    resetProgress: true,
    resetSlowMotion: true,
    clearGameOver: true,
  });

  syncUI(state, phases);

  if (resetMessage) {
    setMessage(getRoundInstruction(state, phase));
  }
}

export function beginDrop(state, claw) {
  if (claw.carrying && state.plush?.variant === "big" && state.bigBearMashRemaining > 0) {
    state.bigBearMashRemaining -= 1;
    state.buttonPress = 1;
    queueSound(state, "catch");
    triggerVisualFeedback(state, {
      x: claw.x,
      y: claw.y + claw.armHeight + 92,
      color: "#ffb24f",
      label: `${Math.max(0, state.bigBearMashRemaining)}x`,
      pulseTimer: 260,
      overlayTimer: 120,
      shake: 4,
    });
    setMessage(
      state.bigBearMashRemaining > 0
        ? `BIG Urso pesado. Aperte PEGAR mais ${state.bigBearMashRemaining} vez(es).`
        : "BIG Urso liberado. Subindo!"
    );
    return;
  }

  if (state.resultLock || state.gameOver || claw.dropping || claw.returning) {
    return;
  }

  state.resultLock = true;
  state.buttonPress = 1;
  state.moveDirection = 0;
  claw.dropping = true;
  claw.carrying = false;
  claw.gripTarget = 1;
  queueSound(state, "drop");
  setMessage("Garra descendo.");
}

export function restartAfterGameOver(state, claw) {
  state.points = 0;
  state.continues = 0;
  state.collection = [];
  state.claimedContinuePhases = [];
  state.spawnedContinuePhases = [];
  state.bonusRound = null;
  state.bonusAssignments = {};
  state.usedBonusPhaseIds = [];
  state.bonusRoundScore = 0;
  state.bonusRoundFailed = false;
  state.pendingRoundRespawn = false;
  state.specialAssignments = {};
  state.usedSpecialWindows = { skull: [], angel: [], ghost: [] };
  state.plushes = [];
  state.bigBearMashRemaining = 0;
  state.ghostTrail = [];
  state.extraTries = 0;
  state.phaseIndex = 0;
  state.unlocked = 1;
  state.scoreSaved = false;
  state.continuePrompt = false;
  state.continueTimer = 0;
  resetPhase(state, claw);
  setMessage("Jogo reiniciado. Volte para a Fase 1.");
  renderCollection(state);
}

export function useContinue(state, claw) {
  if (!state.gameOver || !state.continuePrompt || state.continues <= 0) {
    return;
  }

  state.continues -= 1;
  state.scoreSaved = false;
  resetRound(state, claw, {
    resetTimer: true,
    resetTries: true,
    resetSlowMotion: true,
    clearGameOver: true,
    preserveRoundState: Boolean(state.bonusRound),
  });
  state.continuePrompt = false;
  state.continueTimer = 0;
  syncUI(state, phases);
  queueSound(state, "bonus");
  triggerVisualFeedback(state, {
    x: machine.x + machine.width / 2,
    y: machine.y + 180,
    color: "#6ce3d7",
    label: "CONTINUE",
    pulseTimer: 540,
    overlayTimer: 220,
    shake: 0,
  });
  setMessage(`Continue usado. Volte para ${phases[state.phaseIndex].name}.`);
}

export function updateGame(state, claw, deltaMs) {
  if (
    !state.plush &&
    !(state.plushes?.length) &&
    !state.specialPlush &&
    !state.exitAnimation &&
    !claw.dropping &&
    !claw.returning &&
    !claw.carrying &&
    !state.pendingRoundRespawn
  ) {
    return;
  }

  const phase = phases[state.phaseIndex];
  const targetCaptures = getRoundTargetCaptures(state, phase);
  const deltaFactor = deltaMs / 16.6667;
  const slowFactor = state.slowMotionTick > 0 ? 0.65 : 1;
  const activePlushes = state.plushes ?? [];

  if (state.buttonPress > 0) {
    state.buttonPress = Math.max(0, state.buttonPress - deltaMs / 140);
  }

  if (state.presentFlash) {
    state.presentFlash.timer = Math.max(0, state.presentFlash.timer - deltaMs);
    if (state.presentFlash.timer === 0) {
      state.presentFlash = null;
    }
  }

  if (state.feedbackPulse) {
    state.feedbackPulse.timer = Math.max(0, state.feedbackPulse.timer - deltaMs);
    if (state.feedbackPulse.timer === 0) {
      state.feedbackPulse = null;
    }
  }

  if (state.feedbackOverlay) {
    state.feedbackOverlay.timer = Math.max(0, state.feedbackOverlay.timer - deltaMs);
    if (state.feedbackOverlay.timer === 0) {
      state.feedbackOverlay = null;
    }
  }

  if (state.screenShake > 0) {
    state.screenShake = Math.max(0, state.screenShake - deltaMs * 0.045);
  }

  if (state.gameOver && state.continuePrompt) {
    state.continueTimer = Math.max(0, state.continueTimer - deltaMs);
    if (state.continueTimer === 0) {
      state.continuePrompt = false;
      setMessage(state.gameOverMessage || "Suas tentativas acabaram.");
    }
  }

  if (state.slowMotionTick > 0) {
    state.slowMotionTick = Math.max(0, state.slowMotionTick - deltaMs);
  }

  claw.gripOpen += (claw.gripTarget - claw.gripOpen) * Math.min(1, deltaMs / 120);

  if (!state.gameOver && !claw.carrying && !state.exitAnimation) {
    state.timerTick += deltaMs;
    if (state.timerTick >= 1000) {
      const lostSeconds = Math.floor(state.timerTick / 1000);
      state.timerTick -= lostSeconds * 1000;
      state.timer = Math.max(0, state.timer - lostSeconds);
      if (state.timer === 0) {
        handleRoundTimeout(state, claw, "O tempo acabou. -1 tentativa.");
        return;
      }
    }
  }

  if (state.ghostTrail?.length) {
    state.ghostTrail = state.ghostTrail
      .map((trail) => ({ ...trail, timer: Math.max(0, trail.timer - deltaMs) }))
      .filter((trail) => trail.timer > 0);
  }

  if (!state.resultLock) {
    moveClaw(claw, state.moveDirection, slowFactor * deltaFactor, state.touchTargetX, state.touchControlActive);
  }

  const specialAlwaysMoves =
    state.specialPlush?.variant === "angel" ||
    state.specialPlush?.variant === "skull" ||
    state.specialPlush?.variant === "ghost";
  if (!claw.dropping && !claw.returning && !claw.carrying && !phase.clearMachine && (phase.plushSpeed > 0 || specialAlwaysMoves)) {
    [...activePlushes, state.specialPlush].filter(Boolean).forEach((plush) => {
      if (plush.variant === "ghost") {
        plush.ghostTeleportTimer -= deltaMs;
        if (plush.ghostPhase === "visible") {
          if (plush.ghostTeleportTimer <= 320) {
            plush.visibleAlpha = Math.max(0, (plush.ghostTeleportTimer / 320) * 0.92);
          } else {
            plush.visibleAlpha = 0.92;
          }
        } else if (plush.ghostPhase === "vanishing") {
          plush.visibleAlpha = 0;
        } else if (plush.ghostPhase === "appearing") {
          plush.visibleAlpha = Math.min(0.92, (1 - (plush.ghostTeleportTimer / 360)) * 0.92);
        }

        if (plush.ghostTeleportTimer <= 0) {
          if (plush.ghostPhase === "visible") {
            plush.ghostPhase = "vanishing";
            plush.ghostTeleportTimer = 180;
            plush.visibleAlpha = 0;
          } else if (plush.ghostPhase === "vanishing") {
            const anchors = getSpecialAnchorPoints();
            const currentZone = anchors.findIndex((value) => Math.abs(value - plush.x) < 20);
            const availableAnchors = anchors.filter((_, index) => index !== currentZone);
            const nextX = availableAnchors[Math.floor(Math.random() * availableAnchors.length)] ?? anchors[0];
            state.ghostTrail.push({ fromX: plush.x, fromY: plush.y, toX: nextX, toY: plush.y, timer: 420, maxTimer: 420 });
            plush.x = nextX;
            plush.direction = Math.random() > 0.5 ? 1 : -1;
            plush.ghostPhase = "appearing";
            plush.ghostTeleportTimer = 360;
            plush.visibleAlpha = 0;
          } else {
            plush.ghostPhase = "visible";
            plush.ghostTeleportTimer = 980;
            plush.visibleAlpha = 0.92;
          }
        }
        return;
      }

      if (plush.variant === "kangaroo") {
        plush.kangarooJumpTimer -= deltaMs;
        if (plush.kangarooJumpTimer <= 0) {
          plush.kangarooJumping = !plush.kangarooJumping;
          plush.kangarooJumpTimer = plush.kangarooJumping ? 520 : 860;
          if (plush.kangarooJumping) {
            const anchors = getSpecialAnchorPoints();
            const currentIndex = anchors.findIndex((value) => Math.abs(value - plush.x) < 16);
            const nextIndex = currentIndex <= 1 ? 3 : 0;
            plush.direction = nextIndex > currentIndex ? 1 : -1;
            plush.targetJumpX = anchors[nextIndex];
          }
        }

        if (plush.kangarooJumping) {
          const deltaX = (plush.targetJumpX ?? plush.x) - plush.x;
          plush.x += Math.sign(deltaX) * Math.min(Math.abs(deltaX), 3.6 * deltaFactor);
          const jumpProgress = 1 - (plush.kangarooJumpTimer / 520);
          plush.y = plush.kangarooGroundY - Math.sin(Math.max(0, Math.min(1, jumpProgress)) * Math.PI) * 44;
          if (Math.abs(deltaX) <= 4) {
            plush.x = plush.targetJumpX ?? plush.x;
          }
        } else {
          plush.y = plush.kangarooGroundY;
        }
      }

      const sidePadding = plush.radius + 18;
      plush.x += plush.direction * plush.speed * slowFactor * deltaFactor;
      if (plush.x <= machine.x + sidePadding || plush.x >= machine.x + machine.width - sidePadding) {
        plush.direction *= -1;
        plush.x = Math.max(machine.x + sidePadding, Math.min(machine.x + machine.width - sidePadding, plush.x));
      }
    });
  }

  if (claw.dropping) {
    claw.armHeight += 10 * slowFactor * deltaFactor;
    const targetPlush = getClosestDropTarget(state, claw);
    const targetDrop = targetPlush
      ? targetPlush.y - claw.y - 124 + targetPlush.radius * 0.18
      : machine.height - 164;
    const maxDrop = Math.max(160, Math.min(machine.height - 164, targetDrop));
    if (claw.armHeight >= maxDrop) {
      claw.armHeight = maxDrop;
      resolveDropAtBottom(state, claw);
    }
  } else if (claw.returning) {
    if (claw.carrying && state.plush?.variant === "big" && state.bigBearMashRemaining > 0 && claw.armHeight <= 98) {
      claw.armHeight = 98;
    } else {
    claw.armHeight -= 10 * slowFactor * deltaFactor;
    if (claw.armHeight <= 0) {
      finishReturn(state, claw);
    }
    }
  }

  if (claw.carrying) {
    state.plush.x = claw.x;
    state.plush.y = claw.y + claw.armHeight + 114;
    if (claw.returning && claw.armHeight <= 18) {
      state.plushVisible = false;
      handleWin(state, claw);
      return;
    }
  } else if (state.exitAnimation) {
    state.plushVisible = false;
  } else {
    state.plushes.forEach((plush, index) => {
      plush.y = machine.y + machine.height - 138 - (state.bonusRound ? Math.min(8, index * 4) : 0);
    });
    if (state.specialPlush) {
      if (state.specialPlush.variant !== "kangaroo") {
        state.specialPlush.y = machine.y + machine.height - 140;
      }
    }
    state.plush = state.plushes[0] ?? null;
    state.plushVisible = true;
  }

  if (state.exitAnimation) {
    state.exitAnimation.progress += deltaMs / 560;
    if (state.exitAnimation.progress >= 1) {
      state.exitAnimation = null;
      if (state.phaseCatchCount >= targetCaptures) {
        if (state.phaseIndex < phases.length - 1) {
          state.phaseIndex += 1;
          resetPhase(state, claw);
          setMessage(`Fase concluida. Indo para ${phases[state.phaseIndex].name}.`);
        } else {
          resetPhase(state, claw, false);
          setMessage("Fase 100 concluida. Reiniciando o desafio final.");
        }
      } else {
        if (state.bonusRound) {
          resetClawForPhase(claw, phase);
          state.moveDirection = 0;
          state.resultLock = false;
          state.plush = state.plushes[0] ?? null;
          state.plushVisible = true;
          syncUI(state, phases);
          setMessage(`Rodada x${state.bonusRound.multiplier} ativa. ${state.phaseCatchCount}/${targetCaptures} ursos pegos.`);
        } else {
          resetRound(state, claw);
          syncUI(state, phases);
          setMessage(`Continue. ${state.phaseCatchCount}/${targetCaptures} capturas na ${phase.name}.`);
        }
      }
    }
  }
}

