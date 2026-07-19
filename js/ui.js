import {
  continueCountEl,
  collectionCountEl,
  collectionFullListEl,
  collectionListEl,
  collectionOpenButton,
  elapsedTimeEl,
  helpPanel,
  pointsEl,
  collectionPanel,
  menuPanel,
  messageEl,
  phaseNameEl,
  rankingCloseButton,
  rankingDetailListEl,
  rankingDetailMetaEl,
  rankingDetailTitleEl,
  rankingListEl,
  rankingPanel,
  triesExtraEl,
  triesLeftEl,
} from "./dom.js";

export function setMessage(text) {
  messageEl.textContent = text;
}

export function renderCollection(state) {
  collectionListEl.textContent = "";
  collectionFullListEl.textContent = "";
  const groupedCollection = groupCollectionByType(state.collection);

  if (groupedCollection.length === 0) {
    const empty = document.createElement("p");
    empty.className = "collection-empty";
    empty.textContent = "Os ursos pegos vao aparecer aqui.";
    collectionListEl.appendChild(empty);
    collectionFullListEl.appendChild(empty.cloneNode(true));
    collectionOpenButton.hidden = true;
    return;
  }

  const latestToy = state.collection[0];
  const latestKey = latestToy ? getCollectionGroupKey(latestToy) : null;
  const featuredGroup = groupedCollection.find((group) =>
    getCollectionGroupKey(group) === latestKey
  ) ?? groupedCollection[0];
  const featuredItem = createCollectionItem(featuredGroup, { featured: true });
  featuredItem.classList.add("collection-featured-summary");
  const inlineOpenButton = document.createElement("button");
  inlineOpenButton.type = "button";
  inlineOpenButton.className = "collection-open collection-open-inside";
  inlineOpenButton.setAttribute("aria-label", "Ver coleção completa");
  inlineOpenButton.textContent = "+";
  inlineOpenButton.addEventListener("click", openCollection);
  featuredItem.appendChild(inlineOpenButton);
  collectionListEl.appendChild(featuredItem);

  collectionOpenButton.hidden = true;

  groupedCollection.forEach((group) => {
    collectionFullListEl.appendChild(createCollectionItem(group, { modal: true }));
  });
}

let rankingInspectHandler = null;

export function setRankingInspectHandler(handler) {
  rankingInspectHandler = handler;
}

export function formatElapsedTime(totalMs = 0) {
  const totalSeconds = Math.max(0, Math.floor(totalMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function renderRanking(entries, currentPlayer = "") {
  rankingListEl.textContent = "";

  if (!entries.length) {
    const empty = document.createElement("p");
    empty.className = "collection-empty";
    empty.textContent = "Nenhuma partida registrada ainda.";
    rankingListEl.appendChild(empty);
    return;
  }

  entries.slice(0, 3).forEach((entry, index) => {
    const row = document.createElement("div");
    row.className = "ranking-item";
    row.classList.add(`podium-${index + 1}`);
    if (currentPlayer && entry.name === currentPlayer) {
      row.classList.add("current");
    }

    const place = document.createElement("strong");
    place.className = "ranking-place";
    place.textContent = `${index + 1}`;

    const meta = document.createElement("div");
    meta.className = "ranking-meta";

    const name = document.createElement("span");
    name.className = "ranking-name";
    name.textContent = entry.name;

    const detail = document.createElement("span");
    detail.className = "ranking-detail";
    detail.textContent = `Fase ${entry.phase}  ·  ${entry.timeLabel ?? formatElapsedTime((entry.durationSec ?? 0) * 1000)}`;

    meta.append(name, detail);

    const score = document.createElement("span");
    score.className = "ranking-score";
    score.textContent = `${entry.points} pts`;

    const inspectButton = document.createElement("button");
    inspectButton.type = "button";
    inspectButton.className = "ranking-open";
    inspectButton.setAttribute("aria-label", `Ver coleção de ${entry.name}`);
    inspectButton.textContent = "+";

    if (typeof rankingInspectHandler === "function") {
      row.tabIndex = 0;
      row.setAttribute("role", "button");
      row.addEventListener("click", () => rankingInspectHandler(entry));
      row.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          rankingInspectHandler(entry);
        }
      });
      inspectButton.addEventListener("click", (event) => {
        event.stopPropagation();
        rankingInspectHandler(entry);
      });
    }

    row.append(place, meta, score, inspectButton);
    rankingListEl.appendChild(row);
  });
}

function createToyIcon(toy, size = "large") {
  const icon = document.createElement("div");
  const isSmall = size === "small";
  icon.className = `collection-toy-avatar ${isSmall ? "collection-toy-avatar-small" : ""}`;
  icon.appendChild(renderToyCanvas(toy, isSmall ? 42 : 62));
  return icon;
}

function normalizeToyName(name = "") {
  return String(name).replace(/\s+\d+$/, "").trim();
}

function getToyPoints(toy = {}) {
  if (Number.isFinite(Number(toy.points))) {
    return Number(toy.points);
  }

  const match = String(toy.detail ?? "").match(/(\d+)\s*pontos/i);
  return match ? Number(match[1]) : 0;
}

function getCollectionPriority(variant = "") {
  const priorities = {
    ghost: 0,
    angel: 1,
    skull: 2,
    panda: 3,
    star: 4,
    bandana: 5,
    bow: 6,
    patch: 7,
    classic: 8,
  };

  return priorities[variant] ?? 99;
}

export function getRarityInfo(variant = "") {
  const rarityMap = {
    ghost: { label: "Mitico", tone: "legendary" },
    angel: { label: "Lendario", tone: "legendary" },
    skull: { label: "Perigoso", tone: "danger" },
    panda: { label: "Raro", tone: "rare" },
    star: { label: "Especial", tone: "special" },
    bandana: { label: "Especial", tone: "special" },
    bow: { label: "Comum", tone: "common" },
    patch: { label: "Comum", tone: "common" },
    classic: { label: "Comum", tone: "common" },
  };

  return rarityMap[variant] ?? { label: "Comum", tone: "common" };
}

function getCollectionGroupKey(toy = {}) {
  if (toy.themeId) {
    return `theme:${toy.themeId}`;
  }

  return toy.variant ?? normalizeToyName(toy.name).toLowerCase();
}

function groupCollectionByType(collection) {
  const groups = new Map();

  collection.forEach((toy) => {
    const key = getCollectionGroupKey(toy);
    if (!groups.has(key)) {
      groups.set(key, {
        ...toy,
        name: normalizeToyName(toy.name),
        count: 0,
        totalPoints: 0,
      });
    }

    const group = groups.get(key);
    group.count += 1;
    group.totalPoints += getToyPoints(toy);
  });

  return [...groups.values()].sort((a, b) => {
    const priorityDiff = getCollectionPriority(a.variant) - getCollectionPriority(b.variant);
    if (priorityDiff !== 0) {
      return priorityDiff;
    }

    if (b.count !== a.count) {
      return b.count - a.count;
    }

    return a.name.localeCompare(b.name, "pt-BR");
  });
}

function createCollectionItem(group, options = {}) {
  const item = document.createElement("div");
  item.className = `collection-featured${options.modal ? " collection-modal-item" : ""}`;

  const iconWrap = document.createElement("div");
  iconWrap.className = "collection-icon-wrap";
  const icon = createToyIcon(group, options.modal ? "small" : "large");
  iconWrap.appendChild(icon);

  if (group.count > 1) {
    const badge = document.createElement("span");
    badge.className = "collection-count-badge";
    badge.textContent = String(group.count);
    iconWrap.appendChild(badge);
  }

  const meta = document.createElement("div");
  meta.className = "collection-meta";

  const rarity = getRarityInfo(group.variant);
  const title = document.createElement("strong");
  title.textContent = group.name;

  const detail = document.createElement("span");
  detail.textContent = group.count > 1
    ? `${group.count} capturas · ${group.totalPoints} pontos`
    : group.detail;

  if (rarity.tone !== "common") {
    const rarityTag = document.createElement("span");
    rarityTag.className = `collection-rarity rarity-${rarity.tone}`;
    rarityTag.textContent = rarity.label;
    meta.append(rarityTag);
  }

  meta.append(title, detail);
  item.append(iconWrap, meta);
  return item;
}

function shadeHex(hex, amount) {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((char) => char + char).join("") : clean;
  const value = parseInt(full, 16);
  const clamp = (channel) => Math.max(0, Math.min(255, channel + amount));
  const r = clamp((value >> 16) & 255);
  const g = clamp((value >> 8) & 255);
  const b = clamp(value & 255);
  return `#${[r, g, b].map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

function drawStarOnContext(ctx, cx, cy, size, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 5; i += 1) {
    const outerAngle = (Math.PI / 2) + (i * 2 * Math.PI) / 5;
    const innerAngle = outerAngle + Math.PI / 5;
    const ox = cx + Math.cos(outerAngle) * size;
    const oy = cy - Math.sin(outerAngle) * size;
    const ix = cx + Math.cos(innerAngle) * size * 0.42;
    const iy = cy - Math.sin(innerAngle) * size * 0.42;
    if (i === 0) ctx.moveTo(ox, oy);
    else ctx.lineTo(ox, oy);
    ctx.lineTo(ix, iy);
  }
  ctx.closePath();
  ctx.fill();
}

function renderToyCanvas(toy, size) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  canvas.setAttribute("aria-hidden", "true");
  const ctx = canvas.getContext("2d");

  const plush = {
    x: size / 2,
    y: size * 0.5,
    radius: size * 0.3,
    color: toy.color ?? "#ef845d",
    accent: toy.accent ?? "#64b6f2",
    ears: toy.ears ?? 2,
    variant: toy.variant ?? "classic",
  };

  const r = plush.radius;
  const variant = plush.variant;
  const isPanda = variant === "panda";
  const bodyColor = isPanda ? "#f7f5ee" : plush.color;
  const earColor = isPanda ? "#2c2c30" : plush.color;
  const darkColor = shadeHex(bodyColor, -45);
  const lightColor = shadeHex(bodyColor, 35);
  const accent = plush.accent;

  ctx.save();
  ctx.translate(plush.x, plush.y);

  if (variant === "angel" || variant === "skull" || variant === "ghost") {
    const glowColor = variant === "angel"
      ? "rgba(255, 222, 118, 0.42)"
      : variant === "ghost"
        ? "rgba(122, 240, 255, 0.38)"
        : "rgba(239, 90, 76, 0.3)";
    const glowRadius = r * (variant === "angel" ? 1.7 : variant === "ghost" ? 1.8 : 1.5);
    const glow = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, glowRadius);
    glow.addColorStop(0, glowColor);
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, glowRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = shadeHex(bodyColor, -45);
  ctx.beginPath();
  ctx.ellipse(-r * 0.68, r * 0.68, r * 0.3, r * 0.22, -0.35, 0, Math.PI * 2);
  ctx.ellipse(r * 0.68, r * 0.68, r * 0.3, r * 0.22, 0.35, 0, Math.PI * 2);
  ctx.fill();

  const earY = -r * 0.8;
  const earR = r * 0.38;
  ctx.fillStyle = earColor;
  ctx.beginPath();
  ctx.arc(-r * 0.56, earY, earR, 0, Math.PI * 2);
  ctx.arc(r * 0.56, earY, earR, 0, Math.PI * 2);
  ctx.fill();
  if (!isPanda) {
    ctx.fillStyle = shadeHex(bodyColor, 18);
    ctx.beginPath();
    ctx.arc(-r * 0.56, earY, earR * 0.52, 0, Math.PI * 2);
    ctx.arc(r * 0.56, earY, earR * 0.52, 0, Math.PI * 2);
    ctx.fill();
  }

  if (plush.ears === 3) {
    ctx.fillStyle = earColor;
    ctx.beginPath();
    ctx.arc(0, -r * 1.04, r * 0.22, 0, Math.PI * 2);
    ctx.fill();
    if (!isPanda) {
      ctx.fillStyle = shadeHex(bodyColor, 18);
      ctx.beginPath();
      ctx.arc(0, -r * 1.04, r * 0.12, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const headGradient = ctx.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.15, 0, 0, r * 1.05);
  headGradient.addColorStop(0, lightColor);
  headGradient.addColorStop(0.55, bodyColor);
  headGradient.addColorStop(1, darkColor);
  ctx.fillStyle = headGradient;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  if (isPanda) {
    ctx.fillStyle = "#2c2c30";
    ctx.beginPath();
    ctx.ellipse(-r * 0.34, -r * 0.08, r * 0.22, r * 0.26, -0.15, 0, Math.PI * 2);
    ctx.ellipse(r * 0.34, -r * 0.08, r * 0.22, r * 0.26, 0.15, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "#fff6ea";
  ctx.beginPath();
  ctx.ellipse(0, r * 0.3, r * 0.46, r * 0.33, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255,140,140,0.32)";
  ctx.beginPath();
  ctx.arc(-r * 0.56, r * 0.2, r * 0.15, 0, Math.PI * 2);
  ctx.arc(r * 0.56, r * 0.2, r * 0.15, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#2c2a2a";
  ctx.beginPath();
  ctx.arc(-r * 0.32, -r * 0.06, r * 0.11, 0, Math.PI * 2);
  ctx.arc(r * 0.32, -r * 0.06, r * 0.11, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(-r * 0.36, -r * 0.1, r * 0.035, 0, Math.PI * 2);
  ctx.arc(r * 0.28, -r * 0.1, r * 0.035, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#4a3128";
  ctx.beginPath();
  ctx.ellipse(0, r * 0.22, r * 0.13, r * 0.09, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#4a3128";
  ctx.lineWidth = Math.max(1, r * 0.05);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, r * 0.3);
  ctx.lineTo(0, r * 0.4);
  ctx.quadraticCurveTo(-r * 0.14, r * 0.5, -r * 0.24, r * 0.42);
  ctx.moveTo(0, r * 0.4);
  ctx.quadraticCurveTo(r * 0.14, r * 0.5, r * 0.24, r * 0.42);
  ctx.stroke();

  if (variant === "bow") {
    const bowY = r * 0.66;
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.moveTo(0, bowY);
    ctx.lineTo(-r * 0.34, bowY - r * 0.16);
    ctx.lineTo(-r * 0.34, bowY + r * 0.16);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, bowY);
    ctx.lineTo(r * 0.34, bowY - r * 0.16);
    ctx.lineTo(r * 0.34, bowY + r * 0.16);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = shadeHex(accent, -25);
    ctx.beginPath();
    ctx.arc(0, bowY, r * 0.1, 0, Math.PI * 2);
    ctx.fill();
  } else if (variant === "patch") {
    ctx.fillStyle = "#2c2a2a";
    ctx.beginPath();
    ctx.ellipse(r * 0.32, -r * 0.06, r * 0.17, r * 0.15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#2c2a2a";
    ctx.lineWidth = Math.max(1, r * 0.05);
    ctx.beginPath();
    ctx.moveTo(r * 0.08, -r * 0.22);
    ctx.lineTo(-r * 0.6, -r * 0.52);
    ctx.stroke();
  } else if (variant === "bandana") {
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.moveTo(-r * 0.98, r * 0.05);
    ctx.quadraticCurveTo(0, r * 0.44, r * 0.98, r * 0.05);
    ctx.quadraticCurveTo(0, r * 0.2, -r * 0.98, r * 0.05);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(r * 0.5, r * 0.22);
    ctx.lineTo(r * 0.72, r * 0.42);
    ctx.lineTo(r * 0.42, r * 0.36);
    ctx.closePath();
    ctx.fill();
  } else if (variant === "star") {
    drawStarOnContext(ctx, 0, r * 0.64, r * 0.17, accent);
  } else if (variant === "angel") {
    ctx.fillStyle = "rgba(255, 250, 235, 0.8)";
    ctx.beginPath();
    ctx.ellipse(-r * 0.94, r * 0.04, r * 0.28, r * 0.56, -0.62, 0, Math.PI * 2);
    ctx.ellipse(r * 0.94, r * 0.04, r * 0.28, r * 0.56, 0.62, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(255, 255, 255, 0.82)";
    ctx.beginPath();
    ctx.ellipse(-r * 0.84, r * 0.06, r * 0.14, r * 0.4, -0.62, 0, Math.PI * 2);
    ctx.ellipse(r * 0.84, r * 0.06, r * 0.14, r * 0.4, 0.62, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 235, 150, 0.42)";
    ctx.lineWidth = Math.max(2, r * 0.08);
    ctx.beginPath();
    ctx.arc(0, -r * 1.02, r * 0.5, 0.2, Math.PI - 0.2);
    ctx.stroke();

    ctx.strokeStyle = "#ffd84d";
    ctx.lineWidth = Math.max(1.5, r * 0.05);
    ctx.beginPath();
    ctx.ellipse(0, -r * 1.04, r * 0.46, r * 0.16, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "rgba(255, 248, 228, 0.88)";
    ctx.beginPath();
    ctx.ellipse(-r * 0.86, r * 0.08, r * 0.24, r * 0.48, -0.55, 0, Math.PI * 2);
    ctx.ellipse(r * 0.86, r * 0.08, r * 0.24, r * 0.48, 0.55, 0, Math.PI * 2);
    ctx.fill();
  } else if (variant === "ghost") {
    ctx.fillStyle = "rgba(255,255,255,0.86)";
    ctx.beginPath();
    ctx.arc(0, -r * 0.06, r * 0.76, Math.PI, 0);
    ctx.lineTo(r * 0.72, r * 0.46);
    ctx.quadraticCurveTo(r * 0.42, r * 0.72, r * 0.16, r * 0.5);
    ctx.quadraticCurveTo(0, r * 0.78, -r * 0.16, r * 0.5);
    ctx.quadraticCurveTo(-r * 0.42, r * 0.72, -r * 0.72, r * 0.46);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "rgba(0,0,0,0.62)";
    ctx.beginPath();
    ctx.ellipse(-r * 0.22, r * 0.02, r * 0.12, r * 0.18, 0, 0, Math.PI * 2);
    ctx.ellipse(r * 0.22, r * 0.02, r * 0.12, r * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(0,0,0,0.58)";
    ctx.lineWidth = Math.max(1.4, r * 0.05);
    ctx.beginPath();
    ctx.moveTo(-r * 0.16, r * 0.28);
    ctx.quadraticCurveTo(0, r * 0.4, r * 0.16, r * 0.28);
    ctx.stroke();
  } else if (variant === "skull") {
    ctx.fillStyle = "rgba(80, 14, 10, 0.16)";
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.05, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#f8f1e7";
    ctx.beginPath();
    ctx.arc(0, -r * 0.06, r * 0.86, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-r * 0.46, r * 0.44);
    ctx.lineTo(-r * 0.4, r * 0.78);
    ctx.lineTo(r * 0.4, r * 0.78);
    ctx.lineTo(r * 0.46, r * 0.44);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#23130f";
    ctx.beginPath();
    ctx.ellipse(-r * 0.28, -r * 0.08, r * 0.24, r * 0.3, -0.16, 0, Math.PI * 2);
    ctx.ellipse(r * 0.28, -r * 0.08, r * 0.24, r * 0.3, 0.16, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, r * 0.12);
    ctx.lineTo(-r * 0.14, r * 0.34);
    ctx.lineTo(r * 0.14, r * 0.34);
    ctx.closePath();
    ctx.fill();

    ctx.fillRect(-r * 0.34, r * 0.42, r * 0.68, r * 0.14);

    ctx.strokeStyle = "#23130f";
    ctx.lineWidth = Math.max(1.2, r * 0.035);
    for (let i = -2; i <= 2; i += 1) {
      ctx.beginPath();
      ctx.moveTo(i * r * 0.12, r * 0.42);
      ctx.lineTo(i * r * 0.12, r * 0.56);
      ctx.stroke();
    }

  }

  drawThemeAccessory(ctx, toy.themeId, r, accent);

  ctx.restore();
  return canvas;
}

function drawThemeAccessory(ctx, themeId, r, accent) {
  if (!themeId) return;

  if (themeId === "coelho") {
    ctx.fillStyle = "#fff5fb";
    ctx.beginPath();
    ctx.ellipse(-r * 0.34, -r * 1.24, r * 0.18, r * 0.52, -0.14, 0, Math.PI * 2);
    ctx.ellipse(r * 0.34, -r * 1.24, r * 0.18, r * 0.52, 0.14, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  if (themeId === "noel") {
    ctx.fillStyle = "#db3434";
    ctx.beginPath();
    ctx.moveTo(0, -r * 1.34);
    ctx.lineTo(-r * 0.42, -r * 0.78);
    ctx.lineTo(r * 0.42, -r * 0.78);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.fillRect(-r * 0.42, -r * 0.86, r * 0.84, r * 0.13);
    ctx.beginPath();
    ctx.arc(r * 0.14, -r * 1.34, r * 0.12, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  if (themeId === "abobora") {
    drawStarOnContext(ctx, 0, r * 0.66, r * 0.17, "#ff9b2f");
    return;
  }

  if (themeId === "carnaval") {
    ctx.fillStyle = accent;
    ctx.fillRect(-r * 0.48, -r * 0.94, r * 0.96, r * 0.08);
    ctx.fillStyle = "#ffe17d";
    ctx.fillRect(-r * 0.34, -r * 1.02, r * 0.68, r * 0.08);
    return;
  }

  if (themeId === "praia" || themeId === "surfista") {
    ctx.fillStyle = "#f0d268";
    ctx.fillRect(-r * 0.42, -r * 0.96, r * 0.84, r * 0.08);
    return;
  }

  if (themeId === "trevo" || themeId === "primavera" || themeId === "flor" || themeId === "folhas") {
    drawStarOnContext(ctx, 0, r * 0.66, r * 0.15, "#9be05b");
    return;
  }

  if (themeId === "caipira" || themeId === "julino") {
    ctx.fillStyle = "#f0d268";
    ctx.beginPath();
    ctx.ellipse(0, -r * 1.02, r * 0.52, r * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function syncUI(state, phases) {
  const phase = phases[state.phaseIndex];
  phaseNameEl.textContent = phase.name;
  if (elapsedTimeEl) {
    elapsedTimeEl.textContent = formatElapsedTime(state.runTimeMs ?? 0);
  }
  continueCountEl.textContent = String(state.continues);
  pointsEl.textContent = String(state.points);
  const showExtraBreakdown = state.extraTries > 0 && state.tries > 3;
  if (triesLeftEl) {
    triesLeftEl.textContent = showExtraBreakdown
      ? `3+${state.extraTries}=${state.tries}`
      : String(state.tries);
  }
  if (triesExtraEl) {
    triesExtraEl.textContent = showExtraBreakdown
      ? "base + extra = total"
      : "";
  }
  collectionCountEl.textContent = String(state.collection.length);
}

export function openMenu() {
  menuPanel.classList.add("open");
  menuPanel.setAttribute("aria-hidden", "false");
}

export function closeMenu() {
  menuPanel.classList.remove("open");
  menuPanel.setAttribute("aria-hidden", "true");
}

export function openCollection() {
  collectionPanel.classList.add("open");
  collectionPanel.setAttribute("aria-hidden", "false");
}

export function closeCollection() {
  collectionPanel.classList.remove("open");
  collectionPanel.setAttribute("aria-hidden", "true");
}

export function openHelp() {
  helpPanel.classList.add("open");
  helpPanel.setAttribute("aria-hidden", "false");
}

export function closeHelp() {
  helpPanel.classList.remove("open");
  helpPanel.setAttribute("aria-hidden", "true");
}

export function openRankingDetail(entry, groupedCollection) {
  rankingDetailTitleEl.textContent = `Coleção de ${entry.name}`;
  rankingDetailMetaEl.textContent = `${entry.phase ? `Fase ${entry.phase}` : ""} · ${entry.timeLabel ?? formatElapsedTime((entry.durationSec ?? 0) * 1000)} · ${entry.points} pts`;
  rankingDetailListEl.textContent = "";

  if (!groupedCollection.length) {
    const empty = document.createElement("p");
    empty.className = "collection-empty";
    empty.textContent = "Nenhum urso registrado nessa partida.";
    rankingDetailListEl.appendChild(empty);
  } else {
    groupedCollection.forEach((group) => {
      rankingDetailListEl.appendChild(createCollectionItem(group, { modal: true }));
    });
  }

  rankingPanel.classList.add("open");
  rankingPanel.setAttribute("aria-hidden", "false");
}

export function closeRankingDetail() {
  rankingPanel.classList.remove("open");
  rankingPanel.setAttribute("aria-hidden", "true");
}

export function groupCollectionForDisplay(collection = []) {
  return groupCollectionByType(collection);
}
