import { phases } from "./config.js";
import { canvas, ctx } from "./dom.js";

function getRarityInfo(variant = "") {
  const rarityMap = {
    ghost: { label: "LENDARIO", tone: "legendary" },
    angel: { label: "LENDARIO", tone: "legendary" },
    skull: { label: "PERIGOSO", tone: "danger" },
    panda: { label: "RARO", tone: "rare" },
    star: { label: "ESPECIAL", tone: "special" },
    bandana: { label: "ESPECIAL", tone: "special" },
    bow: { label: "COMUM", tone: "common" },
    patch: { label: "COMUM", tone: "common" },
    classic: { label: "COMUM", tone: "common" },
  };

  return rarityMap[variant] ?? { label: "COMUM", tone: "common" };
}

function roundRect(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fill();
}

function strokeRoundRect(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.stroke();
}

function getLayout() {
  const cabinetX = 10;
  const cabinetY = 2;
  const cabinetWidth = 398;
  const cabinetHeight = 712;
  const headerHeight = 62;
  const glassX = cabinetX + 14;
  const glassY = cabinetY + headerHeight + 10;
  const glassWidth = cabinetWidth - 28;
  const glassHeight = 532;
  const railY = glassY + 8;
  const shelfY = glassY + glassHeight - 48;
  const baseY = shelfY + 18;
  const bottomHeight = cabinetY + cabinetHeight - baseY - 10;

  return {
    cabinetX,
    cabinetY,
    cabinetWidth,
    cabinetHeight,
    headerHeight,
    glassX,
    glassY,
    glassWidth,
    glassHeight,
    railY,
    shelfY,
    baseY,
    bottomHeight,
  };
}

export function getControlTargets() {
  const layout = getLayout();

  return {
    joystickBase: {
      x: layout.cabinetX + 178,
      y: layout.baseY + 58,
      radius: 28,
    },
    dropButton: {
      x: layout.cabinetX + 254,
      y: layout.baseY + 55,
      radius: 22,
    },
  };
}

export function getGameOverTarget() {
  const layout = getLayout();

  return {
    x: layout.glassX + layout.glassWidth / 2 - 78,
    y: layout.glassY + layout.glassHeight / 2 + 40,
    width: 156,
    height: 42,
  };
}

function drawCabinet(state) {
  const layout = getLayout();
  const controls = getControlTargets();

  const bodyGradient = ctx.createLinearGradient(
    layout.cabinetX,
    layout.cabinetY,
    layout.cabinetX,
    layout.cabinetY + layout.cabinetHeight,
  );
  bodyGradient.addColorStop(0, "#171c24");
  bodyGradient.addColorStop(0.58, "#121824");
  bodyGradient.addColorStop(1, "#181f2b");
  ctx.fillStyle = bodyGradient;
  roundRect(layout.cabinetX, layout.cabinetY, layout.cabinetWidth, layout.cabinetHeight, 12);

  ctx.strokeStyle = "#4f5968";
  ctx.lineWidth = 2;
  strokeRoundRect(layout.cabinetX, layout.cabinetY, layout.cabinetWidth, layout.cabinetHeight, 12);

  ctx.strokeStyle = "rgba(154, 112, 255, 0.45)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(layout.cabinetX + 4, layout.cabinetY + 20);
  ctx.lineTo(layout.cabinetX + 4, layout.cabinetY + layout.cabinetHeight - 20);
  ctx.moveTo(layout.cabinetX + layout.cabinetWidth - 4, layout.cabinetY + 20);
  ctx.lineTo(layout.cabinetX + layout.cabinetWidth - 4, layout.cabinetY + layout.cabinetHeight - 20);
  ctx.stroke();

  ctx.fillStyle = "#0f141d";
  roundRect(layout.cabinetX + 4, layout.cabinetY + 4, layout.cabinetWidth - 8, layout.headerHeight, 10);

  ctx.fillStyle = "#f3f4f6";
  ctx.font = "700 20px Trebuchet MS";
  ctx.fillText("PLUFFIES", layout.cabinetX + 18, layout.cabinetY + 33);

  ctx.fillStyle = "#0d0d10";
  roundRect(layout.cabinetX + layout.cabinetWidth - 88, layout.cabinetY + 7, 54, 54, 8);
  ctx.strokeStyle = "#2b2b31";
  ctx.lineWidth = 1.2;
  strokeRoundRect(layout.cabinetX + layout.cabinetWidth - 88, layout.cabinetY + 7, 54, 54, 8);
  const timerColor = state.timer <= 5 ? "#ff3b30" : state.timer <= 10 ? "#ffd84d" : "#57d66b";
  ctx.fillStyle = timerColor;
  ctx.font = "700 36px Consolas";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(
    `${String(Math.max(0, state.timer)).padStart(2, "0")}`,
    layout.cabinetX + layout.cabinetWidth - 61,
    layout.cabinetY + 35,
  );
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  const glassGradient = ctx.createLinearGradient(0, layout.glassY, 0, layout.glassY + layout.glassHeight);
  glassGradient.addColorStop(0, "#101926");
  glassGradient.addColorStop(0.5, "#162435");
  glassGradient.addColorStop(1, "#18293c");
  ctx.fillStyle = glassGradient;
  roundRect(layout.glassX, layout.glassY, layout.glassWidth, layout.glassHeight, 8);

  const backWallGradient = ctx.createLinearGradient(
    layout.glassX + 28,
    layout.glassY + 34,
    layout.glassX + layout.glassWidth - 28,
    layout.glassY + layout.glassHeight - 80,
  );
  backWallGradient.addColorStop(0, "rgba(28, 44, 62, 0.35)");
  backWallGradient.addColorStop(0.5, "rgba(20, 31, 46, 0.12)");
  backWallGradient.addColorStop(1, "rgba(10, 17, 26, 0.34)");
  ctx.fillStyle = backWallGradient;
  roundRect(layout.glassX + 26, layout.glassY + 28, layout.glassWidth - 52, layout.glassHeight - 110, 10);

  ctx.fillStyle = "rgba(255,255,255,0.05)";
  ctx.beginPath();
  ctx.moveTo(layout.glassX + 28, layout.glassY + 34);
  ctx.lineTo(layout.glassX + 48, layout.glassY + 52);
  ctx.lineTo(layout.glassX + 48, layout.glassY + layout.glassHeight - 118);
  ctx.lineTo(layout.glassX + 28, layout.glassY + layout.glassHeight - 92);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(layout.glassX + layout.glassWidth - 28, layout.glassY + 34);
  ctx.lineTo(layout.glassX + layout.glassWidth - 48, layout.glassY + 52);
  ctx.lineTo(layout.glassX + layout.glassWidth - 48, layout.glassY + layout.glassHeight - 118);
  ctx.lineTo(layout.glassX + layout.glassWidth - 28, layout.glassY + layout.glassHeight - 92);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "#586476";
  ctx.lineWidth = 1.5;
  strokeRoundRect(layout.glassX, layout.glassY, layout.glassWidth, layout.glassHeight, 8);

  ctx.strokeStyle = "rgba(88, 241, 239, 0.55)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(layout.glassX + 10, layout.glassY + 26);
  ctx.lineTo(layout.glassX + 10, layout.glassY + layout.glassHeight - 16);
  ctx.moveTo(layout.glassX + layout.glassWidth - 10, layout.glassY + 26);
  ctx.lineTo(layout.glassX + layout.glassWidth - 10, layout.glassY + layout.glassHeight - 16);
  ctx.stroke();

  ctx.strokeStyle = "rgba(255,255,255,0.16)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(layout.glassX + 18, layout.glassY + 8);
  ctx.lineTo(layout.glassX + 18, layout.glassY + layout.glassHeight - 10);
  ctx.moveTo(layout.glassX + layout.glassWidth - 18, layout.glassY + 8);
  ctx.lineTo(layout.glassX + layout.glassWidth - 18, layout.glassY + layout.glassHeight - 10);
  ctx.stroke();

  ctx.fillStyle = "#d7e3eb";
  roundRect(layout.glassX + 8, layout.railY, layout.glassWidth - 16, 14, 7);

  ctx.fillStyle = "#476377";
  roundRect(layout.glassX + 18, layout.railY + 5, layout.glassWidth - 36, 5, 2);

  ctx.fillStyle = "#778c9d";
  roundRect(layout.glassX + 14, layout.railY + 2, 30, 12, 4);
  roundRect(layout.glassX + layout.glassWidth - 44, layout.railY + 2, 30, 12, 4);

  // Floor plane — gives the toys a real surface to sit on instead of floating in a void
  const floorTop = layout.shelfY - 50;
  const floorHeight = 68;
  const floorX = layout.glassX + 12;
  const floorWidth = layout.glassWidth - 24;

  const floorSurface = ctx.createLinearGradient(0, floorTop, 0, floorTop + floorHeight);
  floorSurface.addColorStop(0, "#43597a");
  floorSurface.addColorStop(0.35, "#324563");
  floorSurface.addColorStop(1, "#161f2b");
  ctx.fillStyle = floorSurface;
  roundRect(floorX, floorTop, floorWidth, floorHeight, 10);

  // Tile seams so the floor reads as an actual surface, not a gradient smear
  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = 1;
  const tileCount = 8;
  for (let i = 1; i < tileCount; i += 1) {
    const tx = floorX + (floorWidth / tileCount) * i;
    ctx.beginPath();
    ctx.moveTo(tx, floorTop + 10);
    ctx.lineTo(tx, floorTop + floorHeight - 6);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(floorX + 8, floorTop + 30);
  ctx.lineTo(floorX + floorWidth - 8, floorTop + 30);
  ctx.stroke();

  // Bright front lip catching the light, like a polished shelf edge
  ctx.fillStyle = "rgba(255,255,255,0.1)";
  roundRect(floorX + 6, floorTop + 7, floorWidth - 12, 5, 2.5);

  // Soft contact shadow at the very front so toys look grounded
  const contactShadow = ctx.createLinearGradient(0, floorTop + floorHeight - 20, 0, floorTop + floorHeight);
  contactShadow.addColorStop(0, "rgba(0,0,0,0)");
  contactShadow.addColorStop(1, "rgba(0,0,0,0.4)");
  ctx.fillStyle = contactShadow;
  roundRect(floorX, floorTop + floorHeight - 20, floorWidth, 20, 8);

  // Warm spotlight glow from above so the display case doesn't feel like an empty void
  const spotlight = ctx.createRadialGradient(
    layout.glassX + layout.glassWidth / 2,
    layout.glassY + 90,
    10,
    layout.glassX + layout.glassWidth / 2,
    layout.glassY + 90,
    170,
  );
  spotlight.addColorStop(0, "rgba(255, 244, 214, 0.10)");
  spotlight.addColorStop(1, "rgba(255, 244, 214, 0)");
  ctx.fillStyle = spotlight;
  roundRect(layout.glassX + 26, layout.glassY + 28, layout.glassWidth - 52, layout.glassHeight - 110, 10);

  // Outer base shell — brushed metal gradient instead of flat fill
  const baseShell = ctx.createLinearGradient(
    layout.cabinetX,
    layout.baseY,
    layout.cabinetX,
    layout.baseY + layout.bottomHeight,
  );
  baseShell.addColorStop(0, "#2b3242");
  baseShell.addColorStop(0.12, "#1c212c");
  baseShell.addColorStop(0.88, "#181d27");
  baseShell.addColorStop(1, "#0f131b");
  ctx.fillStyle = baseShell;
  roundRect(layout.cabinetX + 8, layout.baseY, layout.cabinetWidth - 16, layout.bottomHeight, 6);
  ctx.strokeStyle = "#5b6577";
  ctx.lineWidth = 1.2;
  strokeRoundRect(layout.cabinetX + 8, layout.baseY, layout.cabinetWidth - 16, layout.bottomHeight, 6);

  // Thin glowing trim along the top edge of the base, like cabinet accent lighting
  ctx.strokeStyle = "rgba(88, 220, 241, 0.55)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(layout.cabinetX + 16, layout.baseY + 3);
  ctx.lineTo(layout.cabinetX + layout.cabinetWidth - 16, layout.baseY + 3);
  ctx.stroke();

  // Corner bolts for a machined, screwed-together feel
  ctx.fillStyle = "#3a4152";
  const boltPositions = [
    [layout.cabinetX + 15, layout.baseY + 8],
    [layout.cabinetX + layout.cabinetWidth - 15, layout.baseY + 8],
    [layout.cabinetX + 15, layout.baseY + layout.bottomHeight - 8],
    [layout.cabinetX + layout.cabinetWidth - 15, layout.baseY + layout.bottomHeight - 8],
  ];
  boltPositions.forEach(([bx, by]) => {
    ctx.beginPath();
    ctx.arc(bx, by, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#171b24";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(bx - 2.4, by);
    ctx.lineTo(bx + 2.4, by);
    ctx.stroke();
  });

  const innerPanel = ctx.createLinearGradient(
    layout.cabinetX,
    layout.baseY + 12,
    layout.cabinetX,
    layout.baseY + layout.bottomHeight - 10,
  );
  innerPanel.addColorStop(0, "#1a202c");
  innerPanel.addColorStop(1, "#10141c");
  ctx.fillStyle = innerPanel;
  roundRect(layout.cabinetX + 22, layout.baseY + 12, layout.cabinetWidth - 44, layout.bottomHeight - 22, 12);
  ctx.strokeStyle = "#333c4c";
  ctx.lineWidth = 1;
  strokeRoundRect(layout.cabinetX + 22, layout.baseY + 12, layout.cabinetWidth - 44, layout.bottomHeight - 22, 12);

  // Prize chute — chrome bezel with glowing outline and a slotted flap
  const chuteGradient = ctx.createLinearGradient(
    layout.cabinetX + 22,
    layout.baseY + 18,
    layout.cabinetX + 80,
    layout.baseY + 96,
  );
  chuteGradient.addColorStop(0, "#31394a");
  chuteGradient.addColorStop(1, "#12151c");
  ctx.fillStyle = chuteGradient;
  roundRect(layout.cabinetX + 28, layout.baseY + 18, 52, 78, 10);
  ctx.strokeStyle = "rgba(171, 116, 255, 0.85)";
  ctx.lineWidth = 1.6;
  strokeRoundRect(layout.cabinetX + 28, layout.baseY + 18, 52, 78, 10);

  const chuteWell = ctx.createLinearGradient(
    layout.cabinetX + 35,
    layout.baseY + 28,
    layout.cabinetX + 35,
    layout.baseY + 76,
  );
  chuteWell.addColorStop(0, "#0a0c11");
  chuteWell.addColorStop(1, "#1c222d");
  ctx.fillStyle = chuteWell;
  roundRect(layout.cabinetX + 35, layout.baseY + 28, 38, 48, 8);
  ctx.strokeStyle = "#4c5866";
  ctx.lineWidth = 1;
  strokeRoundRect(layout.cabinetX + 35, layout.baseY + 28, 38, 48, 8);

  // Little flap lines to suggest a swinging prize door
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i += 1) {
    const fy = layout.baseY + 36 + i * 12;
    ctx.beginPath();
    ctx.moveTo(layout.cabinetX + 39, fy);
    ctx.lineTo(layout.cabinetX + 69, fy);
    ctx.stroke();
  }

  ctx.fillStyle = "#f1efe8";
  ctx.font = "700 10px Trebuchet MS";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("SAÍDA", layout.cabinetX + 54, layout.baseY + 86);

  // Control console — brushed panel with a subtle sheen
  const consolePanel = ctx.createLinearGradient(
    layout.cabinetX + 138,
    layout.baseY + 28,
    layout.cabinetX + 138,
    layout.baseY + 96,
  );
  consolePanel.addColorStop(0, "#232b3a");
  consolePanel.addColorStop(1, "#161c27");
  ctx.fillStyle = consolePanel;
  roundRect(layout.cabinetX + 138, layout.baseY + 28, 142, 68, 6);
  ctx.strokeStyle = "#57647a";
  ctx.lineWidth = 1.1;
  strokeRoundRect(layout.cabinetX + 138, layout.baseY + 28, 142, 68, 6);
  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(layout.cabinetX + 142, layout.baseY + 32);
  ctx.lineTo(layout.cabinetX + 276, layout.baseY + 32);
  ctx.stroke();

  // Joystick base plate with screws
  const stickPlate = ctx.createRadialGradient(
    controls.joystickBase.x - 6,
    controls.joystickBase.y - 6,
    4,
    controls.joystickBase.x,
    controls.joystickBase.y,
    controls.joystickBase.radius + 6,
  );
  stickPlate.addColorStop(0, "#333d4f");
  stickPlate.addColorStop(1, "#1b212c");
  ctx.fillStyle = stickPlate;
  ctx.beginPath();
  ctx.arc(controls.joystickBase.x, controls.joystickBase.y, controls.joystickBase.radius + 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#242d3b";
  ctx.beginPath();
  ctx.arc(controls.joystickBase.x, controls.joystickBase.y, controls.joystickBase.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#8090a6";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "#455066";
  [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ].forEach(([dx, dy]) => {
    ctx.beginPath();
    ctx.arc(
      controls.joystickBase.x + dx * (controls.joystickBase.radius + 6),
      controls.joystickBase.y + dy * (controls.joystickBase.radius + 6) * 0.55,
      2.4,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  });

  const stickTilt = state.moveDirection * 14;
  ctx.strokeStyle = "#8f9baa";
  ctx.lineWidth = 10;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(controls.joystickBase.x, controls.joystickBase.y - 6);
  ctx.lineTo(controls.joystickBase.x + stickTilt, controls.joystickBase.y - 40);
  ctx.stroke();

  const knobX = controls.joystickBase.x + stickTilt;
  const knobY = controls.joystickBase.y - 48;
  const knobGradient = ctx.createRadialGradient(knobX - 8, knobY - 10, 4, knobX, knobY, 26);
  knobGradient.addColorStop(0, "#ff8a7a");
  knobGradient.addColorStop(0.55, "#ef4335");
  knobGradient.addColorStop(1, "#a91010");
  ctx.fillStyle = knobGradient;
  ctx.beginPath();
  ctx.arc(knobX, knobY, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(knobX, knobY, 22, Math.PI * 1.1, Math.PI * 1.6);
  ctx.stroke();

  const buttonGradient = ctx.createRadialGradient(
    controls.dropButton.x - 6,
    controls.dropButton.y - 12,
    4,
    controls.dropButton.x,
    controls.dropButton.y,
    28,
  );
  const buttonPressOffset = (state.buttonPress ?? 0) * 6;
  buttonGradient.addColorStop(0, "#ffb37c");
  buttonGradient.addColorStop(0.4, "#ef7d57");
  buttonGradient.addColorStop(1, "#b84f2b");
  ctx.fillStyle = "#171b24";
  ctx.beginPath();
  ctx.arc(controls.dropButton.x, controls.dropButton.y + 2, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#3a4152";
  ctx.beginPath();
  ctx.arc(controls.dropButton.x, controls.dropButton.y - 1, 27, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = buttonGradient;
  ctx.beginPath();
  ctx.arc(
    controls.dropButton.x,
    controls.dropButton.y - 4 + buttonPressOffset,
    controls.dropButton.radius,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(
    controls.dropButton.x,
    controls.dropButton.y - 4 + buttonPressOffset,
    controls.dropButton.radius,
    Math.PI * 1.15,
    Math.PI * 1.55,
  );
  ctx.stroke();

  ctx.fillStyle = "#e7edf2";
  ctx.font = "700 10px Trebuchet MS";
  ctx.fillText("PEGAR", controls.dropButton.x, controls.dropButton.y + 28 + buttonPressOffset * 0.3);

  const triesPanelX = layout.cabinetX + 307;
  const triesPanelY = layout.baseY + 22;
  const triesPanelWidth = 58;
  const triesPanelHeight = 78;
  const triesPanelGradient = ctx.createLinearGradient(
    triesPanelX,
    triesPanelY,
    triesPanelX,
    triesPanelY + triesPanelHeight,
  );
  triesPanelGradient.addColorStop(0, "#202734");
  triesPanelGradient.addColorStop(1, "#141a24");
  ctx.fillStyle = triesPanelGradient;
  roundRect(triesPanelX, triesPanelY, triesPanelWidth, triesPanelHeight, 6);
  ctx.strokeStyle = "#4e596d";
  ctx.lineWidth = 1;
  strokeRoundRect(triesPanelX, triesPanelY, triesPanelWidth, triesPanelHeight, 6);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(215, 226, 236, 0.8)";
  ctx.font = "700 8px Trebuchet MS";
  ctx.fillText("TENTATIVAS", triesPanelX + triesPanelWidth / 2, triesPanelY + 15);

  ctx.fillStyle = "#f3f4f6";
  ctx.font = "700 28px Trebuchet MS";
  ctx.fillText(String(state.tries), triesPanelX + triesPanelWidth / 2, triesPanelY + 41);

  ctx.fillStyle = "rgba(215, 226, 236, 0.76)";
  ctx.font = "700 8px Trebuchet MS";
  ctx.fillText("RESTANTES", triesPanelX + triesPanelWidth / 2, triesPanelY + 64);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  // Rubber feet peeking out beneath the cabinet for a grounded, physical look
  ctx.fillStyle = "#0a0c11";
  [layout.cabinetX + 20, layout.cabinetX + layout.cabinetWidth - 20].forEach((fx) => {
    roundRect(fx - 10, layout.cabinetY + layout.cabinetHeight - 6, 20, 8, 3);
  });
}

const TOY_PILE_TEMPLATES = {
  back: [
    { x: 46, y: -14, radius: 14, color: "#6fb4ac", ears: 2, wobbleSeed: 0.2, variant: "star", accent: "#ffd35c", rotation: -0.18, scale: 0.88 },
    { x: 92, y: -16, radius: 16, color: "#d78ca5", ears: 3, wobbleSeed: 0.8, variant: "classic", rotation: 0.12, scale: 0.94 },
    { x: 138, y: -13, radius: 13, color: "#82a6d7", ears: 2, wobbleSeed: 1.4, variant: "bandana", accent: "#e0554a", rotation: -0.08, scale: 0.9 },
    { x: 188, y: -15, radius: 15, color: "#89be68", ears: 2, wobbleSeed: 2.0, variant: "classic", rotation: 0.22, scale: 0.9 },
    { x: 238, y: -14, radius: 14, color: "#d4a265", ears: 3, wobbleSeed: 2.6, variant: "patch", rotation: -0.42, scale: 0.86 },
    { x: 286, y: -15, radius: 15, color: "#b792db", ears: 2, wobbleSeed: 3.2, variant: "bow", accent: "#5ab0e0", rotation: 0.14, scale: 0.92 },
    { x: 314, y: -8, radius: 12, color: "#f7f5ee", ears: 2, wobbleSeed: 3.7, variant: "panda", rotation: 3.08, scale: 0.82 },
    { x: 26, y: -10, radius: 13, color: "#f1be72", ears: 2, wobbleSeed: 4.2, variant: "classic", rotation: -0.36, scale: 0.84 },
    { x: 166, y: -18, radius: 12, color: "#86d0c7", ears: 2, wobbleSeed: 4.8, variant: "bow", accent: "#ff8a96", rotation: 2.98, scale: 0.8 },
    { x: 262, y: -10, radius: 13, color: "#9fc4ef", ears: 3, wobbleSeed: 5.1, variant: "star", accent: "#ffd35c", rotation: 0.3, scale: 0.84 },
  ],
  front: [
    { x: 28, y: -18, radius: 18, color: "#8fd1c7", ears: 2, wobbleSeed: 0.3, variant: "bow", accent: "#ff5b7f", rotation: -0.1 },
    { x: 58, y: -16, radius: 16, color: "#f5b98a", ears: 2, wobbleSeed: 0.7, variant: "classic", rotation: 0.08 },
    { x: 92, y: -20, radius: 20, color: "#f7f5ee", ears: 3, wobbleSeed: 1.1, variant: "panda", rotation: -0.03 },
    { x: 126, y: -18, radius: 18, color: "#f2c15f", ears: 2, wobbleSeed: 1.5, variant: "star", accent: "#ff8a3d", rotation: 0.11 },
    { x: 162, y: -22, radius: 22, color: "#e2854a", ears: 2, wobbleSeed: 1.9, variant: "classic", rotation: -0.16 },
    { x: 198, y: -17, radius: 17, color: "#9fd27b", ears: 3, wobbleSeed: 2.3, variant: "bandana", accent: "#4b8bd6", rotation: 0.06 },
    { x: 232, y: -21, radius: 21, color: "#f0a7c3", ears: 2, wobbleSeed: 2.7, variant: "patch", rotation: -0.12 },
    { x: 266, y: -18, radius: 18, color: "#7fd2d5", ears: 2, wobbleSeed: 3.1, variant: "classic", rotation: 0.09 },
    { x: 298, y: -20, radius: 20, color: "#f0b25a", ears: 3, wobbleSeed: 3.5, variant: "bow", accent: "#c65fd6", rotation: 0.18 },
    { x: 326, y: -17, radius: 17, color: "#d9a6ef", ears: 2, wobbleSeed: 3.9, variant: "star", accent: "#5ce0c6", rotation: -0.24 },
    { x: 42, y: -26, radius: 14, color: "#f7f5ee", ears: 2, wobbleSeed: 4.3, variant: "panda", rotation: -0.4 },
    { x: 146, y: -30, radius: 15, color: "#d78ca5", ears: 3, wobbleSeed: 4.6, variant: "patch", rotation: 0.32 },
    { x: 214, y: -28, radius: 16, color: "#98cf73", ears: 2, wobbleSeed: 4.9, variant: "bandana", accent: "#4b8bd6", rotation: -3.02 },
    { x: 286, y: -30, radius: 14, color: "#82a6d7", ears: 2, wobbleSeed: 5.3, variant: "classic", rotation: 0.42 },
  ],
};
function rotateArray(items, offset) {
  if (!items.length) {
    return items;
  }

  const normalizedOffset = ((offset % items.length) + items.length) % items.length;
  return items.slice(normalizedOffset).concat(items.slice(0, normalizedOffset));
}

function selectPileToys(pool, counts) {
  const remaining = new Map(counts);
  const selected = [];
  const skipped = [];

  pool.forEach((toy) => {
    const pending = remaining.get(toy.variant) ?? 0;
    if (pending > 0) {
      remaining.set(toy.variant, pending - 1);
      skipped.push(toy);
      return;
    }
    selected.push(toy);
  });

  if (selected.length < pool.length) {
    skipped.forEach((toy) => {
      if (selected.length < pool.length) {
        selected.push(toy);
      }
    });
  }

  return selected.slice(0, pool.length);
}

function drawToyPile(state) {
  if (phases[state.phaseIndex]?.clearMachine) {
    return;
  }

  const layout = getLayout();
  const backRowFloor = layout.shelfY - 52;
  const frontRowFloor = layout.shelfY - 18;
  const shuffleSeed = state.pileShuffleStep;
  const backPool = selectPileToys(TOY_PILE_TEMPLATES.back, new Map());
  const frontPool = selectPileToys(TOY_PILE_TEMPLATES.front, new Map());
  const backPositions = rotateArray(TOY_PILE_TEMPLATES.back, shuffleSeed);
  const frontPositions = rotateArray(TOY_PILE_TEMPLATES.front, shuffleSeed * 2 + 1);

  const backRow = backPool.map((toy, index) => {
    const position = backPositions[index % backPositions.length];
    return {
      ...toy,
      x: layout.glassX + position.x,
      y: backRowFloor + position.y,
      rotation: (toy.rotation ?? 0) * 0.6 + (position.rotation ?? 0) * 0.4,
      scale: ((toy.scale ?? 0.92) + (position.scale ?? 0.92)) / 2,
    };
  });

  const frontRow = frontPool.map((toy, index) => {
    const position = frontPositions[index % frontPositions.length];
    return {
      ...toy,
      x: layout.glassX + position.x,
      y: frontRowFloor + position.y,
      rotation: (toy.rotation ?? 0) * 0.6 + (position.rotation ?? 0) * 0.4,
      scale: ((toy.scale ?? 1) + (position.scale ?? 1)) / 2,
    };
  });

  backRow.forEach((toy) => {
    ctx.save();
    ctx.globalAlpha = 0.6;
    drawPlush(toy, { wobbleEnabled: false, scale: toy.scale ?? 0.92, rotation: toy.rotation ?? 0 });
    ctx.restore();
  });

  frontRow.forEach((toy) => {
    drawPlush(toy, { wobbleEnabled: false, rotation: toy.rotation ?? 0 });
  });
}

function drawBackground(state) {
  drawCabinet(state);
  drawToyPile(state);
}

function colorWithAlpha(color, alpha) {
  if (color.startsWith("#")) {
    const hex = color.slice(1);
    const normalized = hex.length === 3
      ? hex.split("").map((char) => char + char).join("")
      : hex;
    const value = parseInt(normalized, 16);
    const r = (value >> 16) & 255;
    const g = (value >> 8) & 255;
    const b = value & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  if (color.startsWith("rgb(")) {
    return color.replace("rgb(", "rgba(").replace(")", `, ${alpha})`);
  }

  return `rgba(255,255,255,${alpha})`;
}

function drawPresent(present) {
  const colors = {
    green: { box: "#57d66b", ribbon: "#f4fff4" },
    blue: { box: "#5ab0e0", ribbon: "#eff9ff" },
    continue: { box: "#47d8c7", ribbon: "#fff5b9" },
    yellow: { box: "#ffd84d", ribbon: "#fff7d3" },
    orange: { box: "#ef9b42", ribbon: "#fff0de" },
    red: { box: "#ef5a4c", ribbon: "#ffe8e4" },
    purple: { box: "#a46ce8", ribbon: "#f5efff" },
    white: { box: "#f3f5f7", ribbon: "#cdd5de" },
  };

  const palette = colors[present.type] ?? colors.white;
  const pulse = 0.5 + 0.5 * Math.sin(performance.now() * 0.006 + present.wobbleSeed);
  const size = present.radius * 2.5;
  const x = present.x - size / 2;
  const y = present.y - size / 2 + pulse * 1.6;

  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.18)";
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 5;
  ctx.fillStyle = palette.box;
  roundRect(x, y, size, size, 8);
  ctx.restore();

  ctx.fillStyle = palette.ribbon;
  roundRect(x + size * 0.42, y, size * 0.16, size, 4);
  roundRect(x, y + size * 0.42, size, size * 0.16, 4);

  ctx.fillStyle = palette.ribbon;
  ctx.beginPath();
  ctx.moveTo(present.x, y + 2);
  ctx.quadraticCurveTo(present.x - 10, y - 10, present.x - 18, y + 6);
  ctx.quadraticCurveTo(present.x - 8, y + 10, present.x, y + 4);
  ctx.quadraticCurveTo(present.x + 8, y + 10, present.x + 18, y + 6);
  ctx.quadraticCurveTo(present.x + 10, y - 10, present.x, y + 2);
  ctx.fill();

  ctx.strokeStyle = `rgba(255,255,255,${0.38 + pulse * 0.28})`;
  ctx.lineWidth = 3;
  strokeRoundRect(x - 4, y - 4, size + 8, size + 8, 12);

  if (present.type === "continue") {
    ctx.fillStyle = "#123946";
    ctx.font = "900 18px Trebuchet MS";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("C", present.x, y + size * 0.54);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
  }
}

function drawPresentFlash(presentFlash) {
  const styles = {
    green: { main: "#57d66b", glow: "rgba(87,214,107,0.35)" },
    blue: { main: "#5ab0e0", glow: "rgba(90,176,224,0.35)" },
    continue: { main: "#47d8c7", glow: "rgba(71,216,199,0.35)" },
    yellow: { main: "#ffd84d", glow: "rgba(255,216,77,0.35)" },
    orange: { main: "#ef9b42", glow: "rgba(239,155,66,0.35)" },
    red: { main: "#ef5a4c", glow: "rgba(239,90,76,0.35)" },
    purple: { main: "#a46ce8", glow: "rgba(164,108,232,0.35)" },
    white: { main: "#f3f5f7", glow: "rgba(243,245,247,0.35)" },
    angel: { main: "#ffd84d", glow: "rgba(255,216,77,0.42)" },
    skull: { main: "#ef5a4c", glow: "rgba(239,90,76,0.42)" },
    double: { main: "#6ce3d7", glow: "rgba(108,227,215,0.42)" },
    triple: { main: "#ffd84d", glow: "rgba(255,216,77,0.42)" },
  };

  const layout = getLayout();
  const style = styles[presentFlash.type] ?? styles.white;
  const progress = Math.max(0, Math.min(1, presentFlash.timer / 1150));
  const pulse = 0.5 + 0.5 * Math.sin(performance.now() * 0.02);
  const scale = 1 + (1 - progress) * 0.22 + pulse * 0.02;
  const alpha = progress > 0.65 ? 1 : progress / 0.65;

  ctx.save();
  ctx.globalAlpha = Math.max(0, alpha);

  const glow = ctx.createRadialGradient(
    layout.glassX + layout.glassWidth / 2,
    layout.glassY + layout.glassHeight / 2,
    30,
    layout.glassX + layout.glassWidth / 2,
    layout.glassY + layout.glassHeight / 2,
    220,
  );
  glow.addColorStop(0, style.glow);
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(layout.glassX, layout.glassY, layout.glassWidth, layout.glassHeight);

  ctx.translate(layout.glassX + layout.glassWidth / 2, layout.glassY + 176);
  ctx.scale(scale, scale);

  ctx.fillStyle = style.main;
  ctx.font = "900 52px Trebuchet MS";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(presentFlash.title ?? "PREMIO!", 0, 0);

  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.lineWidth = 2.5;
  ctx.strokeText(presentFlash.title ?? "PREMIO!", 0, 0);

  ctx.fillStyle = "#fffaf2";
  ctx.font = "800 26px Trebuchet MS";
  ctx.fillText(presentFlash.message, 0, 44);

  for (let i = 0; i < 8; i += 1) {
    const angle = (Math.PI * 2 * i) / 8 + performance.now() * 0.002;
    const burstX = Math.cos(angle) * 118;
    const burstY = Math.sin(angle) * 50;
    ctx.strokeStyle = style.main;
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(burstX * 0.68, burstY * 0.68);
    ctx.lineTo(burstX, burstY);
    ctx.stroke();
  }

  ctx.restore();
}

function drawRarityChip(x, y, variant) {
  const rarity = getRarityInfo(variant);
  if (rarity.tone === "common") {
    return;
  }

  const palette = {
    legendary: { start: "#ffe58d", end: "#dba31c", text: "#5f4300" },
    danger: { start: "#ff7f7f", end: "#cb2b2b", text: "#fff3f3" },
    rare: { start: "#91c7ff", end: "#4d7bd3", text: "#eef7ff" },
    special: { start: "#84edcd", end: "#2eaa99", text: "#082d2a" },
  }[rarity.tone];

  const width = rarity.label.length * 8.1 + 22;
  const height = 24;
  const chipX = x - width / 2;
  const chipY = y;
  const radius = height / 2;
  const gradient = ctx.createLinearGradient(chipX, chipY, chipX, chipY + height);
  gradient.addColorStop(0, palette.start);
  gradient.addColorStop(1, palette.end);
  ctx.fillStyle = gradient;
  roundRect(chipX, chipY, width, height, radius);
  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.lineWidth = 1;
  strokeRoundRect(chipX, chipY, width, height, radius);
  ctx.fillStyle = palette.text;
  ctx.font = "800 12px Trebuchet MS";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(rarity.label, x, chipY + height / 2 + 0.5);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}

function drawFeedbackPulse(feedbackPulse) {
  const progress = Math.max(0, Math.min(1, feedbackPulse.timer / feedbackPulse.maxTimer));
  const inverse = 1 - progress;
  const radius = 18 + inverse * 58;

  ctx.save();
  ctx.globalAlpha = progress;
  ctx.strokeStyle = feedbackPulse.color;
  ctx.lineWidth = 5 - inverse * 2;
  ctx.beginPath();
  ctx.arc(feedbackPulse.x, feedbackPulse.y, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = "rgba(255,255,255,0.78)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(feedbackPulse.x, feedbackPulse.y, Math.max(10, radius - 12), 0, Math.PI * 2);
  ctx.stroke();

  if (feedbackPulse.label) {
    ctx.fillStyle = "#fff8ef";
    ctx.font = "900 22px Trebuchet MS";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(feedbackPulse.label, feedbackPulse.x, feedbackPulse.y - radius - 18);
  }

  ctx.restore();
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}

function drawFeedbackOverlay(feedbackOverlay) {
  const alpha = Math.max(0, Math.min(1, feedbackOverlay.timer / feedbackOverlay.maxTimer)) * 0.18;
  ctx.save();
  ctx.fillStyle = colorWithAlpha(feedbackOverlay.color, alpha);
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
}

function drawGameOverOverlay(state) {
  const layout = getLayout();
  const button = getGameOverTarget();
  const pulse = 0.55 + 0.45 * Math.sin(performance.now() * 0.01);

  ctx.fillStyle = `rgba(8, 12, 18, ${0.76 + pulse * 0.08})`;
  roundRect(layout.glassX + 18, layout.glassY + 72, layout.glassWidth - 36, layout.glassHeight - 144, 18);

  ctx.strokeStyle = `rgba(255, 72, 72, ${0.35 + pulse * 0.45})`;
  ctx.lineWidth = 2;
  strokeRoundRect(layout.glassX + 18, layout.glassY + 72, layout.glassWidth - 36, layout.glassHeight - 144, 18);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const isContinuePrompt = state.continuePrompt && state.continues > 0;
  ctx.fillStyle = isContinuePrompt
    ? `rgba(98, 239, 211, ${0.74 + pulse * 0.24})`
    : `rgba(255, 88, 88, ${0.75 + pulse * 0.25})`;
  ctx.font = "700 34px Trebuchet MS";
  ctx.fillText(isContinuePrompt ? "CONTINUE?" : "GAME OVER", layout.glassX + layout.glassWidth / 2, layout.glassY + 190);

  ctx.fillStyle = "#f2f5f9";
  ctx.font = "600 18px Trebuchet MS";
  if (isContinuePrompt) {
    ctx.fillText("Use seu continue para voltar para a fase.", layout.glassX + layout.glassWidth / 2, layout.glassY + 232);
    ctx.fillStyle = "#fff3a8";
    ctx.font = "900 46px Consolas";
    ctx.fillText(String(Math.max(0, Math.ceil(state.continueTimer / 1000))).padStart(2, "0"), layout.glassX + layout.glassWidth / 2, layout.glassY + 282);
    ctx.fillStyle = "#f2f5f9";
    ctx.font = "700 16px Trebuchet MS";
    ctx.fillText(`CONTINUES ${state.continues}`, layout.glassX + layout.glassWidth / 2, layout.glassY + 322);
  } else {
    const line = state.gameOverMessage || "Fim de jogo.";
    ctx.fillText(line, layout.glassX + layout.glassWidth / 2, layout.glassY + 238);
  }

  const buttonGradient = ctx.createLinearGradient(button.x, button.y, button.x, button.y + button.height);
  buttonGradient.addColorStop(0, isContinuePrompt ? "#6ce3d7" : "#ff9e7d");
  buttonGradient.addColorStop(1, isContinuePrompt ? "#2f9f92" : "#d85c37");
  ctx.fillStyle = buttonGradient;
  roundRect(button.x, button.y, button.width, button.height, 12);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.28)";
  ctx.lineWidth = 1.4;
  strokeRoundRect(button.x, button.y, button.width, button.height, 12);

  ctx.fillStyle = "#fff7f2";
  ctx.font = "700 20px Trebuchet MS";
  ctx.fillText(isContinuePrompt ? "Continuar" : "Reiniciar", button.x + button.width / 2, button.y + button.height / 2 + 1);

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}

function drawPauseOverlay() {
  const layout = getLayout();
  const pulse = 0.55 + 0.45 * Math.sin(performance.now() * 0.008);

  ctx.fillStyle = `rgba(8, 12, 18, ${0.72 + pulse * 0.06})`;
  roundRect(layout.glassX + 26, layout.glassY + 118, layout.glassWidth - 52, 184, 18);

  ctx.strokeStyle = `rgba(122, 240, 255, ${0.28 + pulse * 0.24})`;
  ctx.lineWidth = 2;
  strokeRoundRect(layout.glassX + 26, layout.glassY + 118, layout.glassWidth - 52, 184, 18);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#7af0ff";
  ctx.font = "700 32px Trebuchet MS";
  ctx.fillText("PAUSADO", layout.glassX + layout.glassWidth / 2, layout.glassY + 186);

  ctx.fillStyle = "#eef7ff";
  ctx.font = "600 18px Trebuchet MS";
  ctx.fillText("Aperte P ou o botao Pausar", layout.glassX + layout.glassWidth / 2, layout.glassY + 228);
  ctx.fillText("para continuar o jogo.", layout.glassX + layout.glassWidth / 2, layout.glassY + 256);

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}

function shadeColor(hex, percent) {
  const num = parseInt(hex.slice(1), 16);
  let r = (num >> 16) + percent;
  let g = ((num >> 8) & 0x00ff) + percent;
  let b = (num & 0x0000ff) + percent;
  r = Math.max(Math.min(255, r), 0);
  g = Math.max(Math.min(255, g), 0);
  b = Math.max(Math.min(255, b), 0);
  return `#${(0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1)}`;
}

function drawStar(cx, cy, size, color) {
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

function drawPlush(plush, options = {}) {
  const {
    wobbleEnabled = true,
    scale = 1,
    rotation = 0,
  } = options;
  const wobble = wobbleEnabled ? Math.sin(performance.now() * 0.002 + (plush.wobbleSeed ?? 0)) * 2.5 : 0;
  const r = plush.radius;
  const variant = plush.variant ?? "classic";
  const isPanda = variant === "panda";
  const bodyColor = isPanda ? "#f7f5ee" : plush.color;
  const earColor = isPanda ? "#2c2c30" : plush.color;
  const darkColor = shadeColor(bodyColor, -45);
  const lightColor = shadeColor(bodyColor, 35);
  const accent = plush.accent ?? "#ff5b7f";

  ctx.save();
  ctx.translate(plush.x, plush.y + wobble);
  ctx.rotate(rotation);
  ctx.scale(scale, scale);

  // Little rounded paws poking out at the base, so it reads as a sitting plush
  ctx.fillStyle = shadeColor(bodyColor, -45);
  ctx.beginPath();
  ctx.ellipse(-r * 0.68, r * 0.68, r * 0.3, r * 0.22, -0.35, 0, Math.PI * 2);
  ctx.ellipse(r * 0.68, r * 0.68, r * 0.3, r * 0.22, 0.35, 0, Math.PI * 2);
  ctx.fill();

  // Ears — outer fur circle with a softer inner-ear circle (panda ears stay solid black)
  const earY = -r * 0.8;
  const earR = r * 0.38;
  ctx.fillStyle = earColor;
  ctx.beginPath();
  ctx.arc(-r * 0.56, earY, earR, 0, Math.PI * 2);
  ctx.arc(r * 0.56, earY, earR, 0, Math.PI * 2);
  ctx.fill();
  if (!isPanda) {
    ctx.fillStyle = shadeColor(bodyColor, 18);
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
      ctx.fillStyle = shadeColor(bodyColor, 18);
      ctx.beginPath();
      ctx.arc(0, -r * 1.04, r * 0.12, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (variant === "angel" || variant === "skull" || variant === "ghost") {
    const glowColor = variant === "angel"
      ? "rgba(255, 222, 118, 0.42)"
      : variant === "ghost"
        ? "rgba(122, 240, 255, 0.4)"
        : "rgba(239, 90, 76, 0.32)";
    const glowRadius = r * (variant === "angel" ? 1.7 : variant === "ghost" ? 1.85 : 1.55);
    const glow = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, glowRadius);
    glow.addColorStop(0, glowColor);
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, glowRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Head — soft radial shading gives it a plush, rounded feel instead of a flat disc
  const headGradient = ctx.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.15, 0, 0, r * 1.05);
  headGradient.addColorStop(0, lightColor);
  headGradient.addColorStop(0.55, bodyColor);
  headGradient.addColorStop(1, darkColor);
  ctx.fillStyle = headGradient;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  // Panda eye patches sit behind the eyes, drawn before the muzzle
  if (isPanda) {
    ctx.fillStyle = "#2c2c30";
    ctx.beginPath();
    ctx.ellipse(-r * 0.34, -r * 0.08, r * 0.22, r * 0.26, -0.15, 0, Math.PI * 2);
    ctx.ellipse(r * 0.34, -r * 0.08, r * 0.22, r * 0.26, 0.15, 0, Math.PI * 2);
    ctx.fill();
  }

  // Muzzle patch
  ctx.fillStyle = "#fff6ea";
  ctx.beginPath();
  ctx.ellipse(0, r * 0.3, r * 0.46, r * 0.33, 0, 0, Math.PI * 2);
  ctx.fill();

  // Cheeks blush
  ctx.fillStyle = "rgba(255,140,140,0.32)";
  ctx.beginPath();
  ctx.arc(-r * 0.56, r * 0.2, r * 0.15, 0, Math.PI * 2);
  ctx.arc(r * 0.56, r * 0.2, r * 0.15, 0, Math.PI * 2);
  ctx.fill();

  // Eyes with a tiny highlight for sparkle
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

  // Nose
  ctx.fillStyle = "#4a3128";
  ctx.beginPath();
  ctx.ellipse(0, r * 0.22, r * 0.13, r * 0.09, 0, 0, Math.PI * 2);
  ctx.fill();

  // Mouth
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

  // Accessories — this is what makes each bear read as a different "type"
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
    ctx.fillStyle = shadeColor(accent, -25);
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
    drawStar(0, r * 0.64, r * 0.17, accent);
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
    ctx.fillStyle = "rgba(255,255,255,0.88)";
    ctx.beginPath();
    ctx.arc(0, -r * 0.06, r * 0.78, Math.PI, 0);
    ctx.lineTo(r * 0.74, r * 0.52);
    ctx.quadraticCurveTo(r * 0.42, r * 0.84, r * 0.14, r * 0.58);
    ctx.quadraticCurveTo(0, r * 0.94, -r * 0.14, r * 0.58);
    ctx.quadraticCurveTo(-r * 0.42, r * 0.84, -r * 0.74, r * 0.52);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "rgba(0,0,0,0.64)";
    ctx.beginPath();
    ctx.ellipse(-r * 0.24, 0, r * 0.12, r * 0.18, 0, 0, Math.PI * 2);
    ctx.ellipse(r * 0.24, 0, r * 0.12, r * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(0,0,0,0.58)";
    ctx.lineWidth = Math.max(1.6, r * 0.05);
    ctx.beginPath();
    ctx.moveTo(-r * 0.14, r * 0.3);
    ctx.quadraticCurveTo(0, r * 0.42, r * 0.14, r * 0.3);
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

    ctx.strokeStyle = "rgba(120, 48, 36, 0.65)";
    ctx.lineWidth = Math.max(1.1, r * 0.03);
    ctx.beginPath();
    ctx.arc(0, -r * 0.06, r * 0.88, Math.PI * 0.12, Math.PI * 0.88);
    ctx.stroke();

  }

  drawThemeAccent(plush, r, accent);

  ctx.restore();
}

function drawThemeAccent(plush, r, accent) {
  const themeId = plush.themeId ?? "";
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
    drawStar(0, r * 0.66, r * 0.17, "#ff9b2f");
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
    drawStar(0, r * 0.66, r * 0.15, "#9be05b");
    return;
  }

  if (themeId === "caipira" || themeId === "julino") {
    ctx.fillStyle = "#f0d268";
    ctx.beginPath();
    ctx.ellipse(0, -r * 1.02, r * 0.52, r * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawExitAnimation(exitAnimation) {
  const eased = 1 - (1 - exitAnimation.progress) ** 3;
  const radius = exitAnimation.startRadius + (exitAnimation.targetRadius - exitAnimation.startRadius) * eased;
  const x = exitAnimation.startX + (exitAnimation.targetX - exitAnimation.startX) * eased;
  const y = exitAnimation.startY + (exitAnimation.targetY - exitAnimation.startY) * eased;

  drawPlush(
    {
      x,
      y,
      radius,
      color: exitAnimation.color,
      ears: exitAnimation.ears,
      variant: exitAnimation.variant,
      themeId: exitAnimation.themeId,
      themeName: exitAnimation.themeName,
      accent: exitAnimation.accent,
      wobbleSeed: exitAnimation.wobbleSeed,
    },
    { wobbleEnabled: false },
  );
}

function drawClaw(claw, plush) {
  const layout = getLayout();
  const railY = layout.glassY + 8;
  const armBottom = claw.y + claw.armHeight;
  const cableTopY = railY + 18;
  const cableBottomY = armBottom + 10;
  const bodyY = armBottom + 12;
  const openAmount = claw.gripOpen ?? 1;
  const clawLength = 46 + openAmount * 14;
  const frontOffset = 18 + openAmount * 8;
  const sideOffset = 24 + openAmount * 12;
  const tipDrop = bodyY + 52 + clawLength;

  ctx.fillStyle = "#5f7587";
  roundRect(claw.x - 26, railY - 6, 52, 18, 6);

  ctx.fillStyle = "#8499ab";
  roundRect(claw.x - 18, railY + 10, 36, 14, 5);

  ctx.strokeStyle = "#b37a5f";
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(claw.x, cableTopY);
  ctx.lineTo(claw.x, cableBottomY);
  ctx.stroke();

  ctx.fillStyle = "#8e969b";
  roundRect(claw.x - 16, bodyY + 6, 32, 28, 5);

  ctx.fillStyle = "#6c7378";
  roundRect(claw.x - 8, bodyY - 8, 16, 18, 4);

  ctx.fillStyle = "#c2c7cb";
  roundRect(claw.x - 12, bodyY + 26, 24, 18, 4);

  ctx.strokeStyle = "#aab2b8";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(claw.x, bodyY + 38);
  ctx.lineTo(claw.x, bodyY + 58);
  ctx.stroke();

  ctx.strokeStyle = "#bcc3c7";
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(claw.x - 8, bodyY + 40);
  ctx.bezierCurveTo(claw.x - sideOffset, bodyY + 64, claw.x - sideOffset - 2, bodyY + 94, claw.x - sideOffset + 6, tipDrop);
  ctx.moveTo(claw.x + 8, bodyY + 40);
  ctx.bezierCurveTo(claw.x + sideOffset, bodyY + 64, claw.x + sideOffset + 2, bodyY + 94, claw.x + sideOffset - 6, tipDrop);
  ctx.moveTo(claw.x, bodyY + 42);
  ctx.bezierCurveTo(claw.x + frontOffset * 0.4, bodyY + 72, claw.x + frontOffset * 0.2, bodyY + 100, claw.x + 2, tipDrop - 2);
  ctx.stroke();

  ctx.strokeStyle = "#8a8f94";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(claw.x - 10, bodyY + 44);
  ctx.lineTo(claw.x - 16, bodyY + 58);
  ctx.moveTo(claw.x + 10, bodyY + 44);
  ctx.lineTo(claw.x + 16, bodyY + 58);
  ctx.moveTo(claw.x - 2, bodyY + 46);
  ctx.lineTo(claw.x, bodyY + 58);
  ctx.stroke();

  ctx.strokeStyle = "#d33d35";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(claw.x - sideOffset + 4, tipDrop - 1);
  ctx.lineTo(claw.x - sideOffset + 10, tipDrop + 9);
  ctx.moveTo(claw.x + sideOffset - 4, tipDrop - 1);
  ctx.lineTo(claw.x + sideOffset - 10, tipDrop + 9);
  ctx.moveTo(claw.x, tipDrop - 2);
  ctx.lineTo(claw.x, tipDrop + 10);
  ctx.stroke();

  const targetRadius = plush.radius * 1.08;
  const alignment = plush.radius > 0
    ? Math.max(0, 1 - Math.abs(claw.x - plush.x) / targetRadius)
    : 0;
  const pulse = 0.5 + 0.5 * Math.sin(performance.now() * 0.015);
  const activeGlow = alignment > 0.45 ? alignment * (0.55 + pulse * 0.45) : 0;

  ctx.strokeStyle = activeGlow > 0
    ? `rgba(106, 228, 160, ${0.34 + activeGlow * 0.34})`
    : "rgba(87, 160, 211, 0.26)";
  ctx.lineWidth = activeGlow > 0 ? 2.8 : 2;
  ctx.beginPath();
  ctx.arc(claw.x, plush.y, targetRadius + activeGlow * 4, 0, Math.PI * 2);
  ctx.stroke();

  if (activeGlow > 0) {
    ctx.strokeStyle = `rgba(198, 255, 220, ${0.22 + activeGlow * 0.25})`;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(claw.x, plush.y, targetRadius - 8 + pulse * 3, 0, Math.PI * 2);
    ctx.stroke();
  }
}

export function drawGame(state, claw) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  drawBackground(state);
  if (state.present) {
    drawPresent(state.present);
  }
  (state.plushes ?? []).forEach((plush) => {
    drawPlush(plush);
  });
  if (state.plush && state.plushVisible !== false && claw.carrying) {
    drawPlush(state.plush);
  }
  if (state.specialPlush) {
    drawPlush(state.specialPlush);
  }
  if (state.exitAnimation) {
    drawExitAnimation(state.exitAnimation);
  }
  const focusPlush = [...(state.plushes ?? []), state.specialPlush]
    .filter(Boolean)
    .sort((a, b) => Math.abs(a.x - claw.x) - Math.abs(b.x - claw.x))[0]
    ?? state.plush
    ?? { x: claw.x, y: claw.y, radius: 0 };
  drawClaw(claw, focusPlush);
  if (state.feedbackPulse) {
    drawFeedbackPulse(state.feedbackPulse);
  }
  if (state.presentFlash) {
    drawPresentFlash(state.presentFlash);
  }
  if (state.gameOver) {
    drawGameOverOverlay(state);
  } else if (state.paused) {
    drawPauseOverlay();
  }
  ctx.restore();
  if (state.feedbackOverlay) {
    drawFeedbackOverlay(state.feedbackOverlay);
  }
}
