const target = window.parent;
const queryParams = new URLSearchParams(window.location.search);
const embedded = queryParams.get("embedded") === "1";
const explicitParentOrigin = (queryParams.get("parentOrigin") ?? "").trim();
const sessionToken = (queryParams.get("sessionToken") ?? "").trim();
const fallbackPlayerName = (queryParams.get("player") ?? "").trim().slice(0, 14);
const parentOrigin = resolveParentOrigin();

const integrationState = {
  handshakeRequested: false,
  handshakeConfirmed: false,
  handshakeRejected: false,
  lastError: "",
  playerName: fallbackPlayerName,
};

function resolveParentOrigin() {
  if (explicitParentOrigin) {
    try {
      return new URL(explicitParentOrigin).origin;
    } catch {
      return window.location.origin;
    }
  }

  if (document.referrer) {
    try {
      return new URL(document.referrer).origin;
    } catch {
      return window.location.origin;
    }
  }

  return window.location.origin;
}

function getSessionStatus() {
  if (!embedded) return "local";
  if (!sessionToken) return "missing_token";
  if (integrationState.handshakeRejected) return "rejected";
  if (!integrationState.handshakeConfirmed) return "pending";
  return "validated";
}

function canSendOfficial() {
  return embedded
    && target !== window
    && Boolean(sessionToken)
    && integrationState.handshakeConfirmed
    && !integrationState.handshakeRejected;
}

function refreshMeta() {
  window.MyGaming.meta = {
    embedded,
    parentOrigin,
    hasSessionToken: Boolean(sessionToken),
    playerName: integrationState.playerName,
    sessionStatus: getSessionStatus(),
    handshakeRequested: integrationState.handshakeRequested,
    handshakeConfirmed: integrationState.handshakeConfirmed,
    handshakeRejected: integrationState.handshakeRejected,
    lastError: integrationState.lastError,
  };

  window.dispatchEvent(new CustomEvent("mygaming:session-meta", { detail: window.MyGaming.meta }));
}

function normalizePayload(payload) {
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    return {
      ...payload,
      sessionToken: payload.sessionToken ?? sessionToken,
    };
  }

  return {
    value: payload ?? null,
    sessionToken,
  };
}

function postToParent(tipo, payload = {}) {
  if (!embedded || target === window) {
    return false;
  }

  target.postMessage(
    {
      tipo,
      payload: normalizePayload(payload),
      correlationId: crypto.randomUUID(),
      versao: "1.2",
    },
    parentOrigin,
  );

  return true;
}

function requestHandshake(extraPayload = {}) {
  if (!embedded || target === window || !sessionToken) {
    integrationState.lastError = !sessionToken && embedded
      ? "session_token_ausente"
      : integrationState.lastError;
    refreshMeta();
    return false;
  }

  integrationState.handshakeRequested = true;
  integrationState.handshakeRejected = false;
  integrationState.lastError = "";
  refreshMeta();

  return postToParent("handshakeJogo", {
    sessionToken,
    origemJogo: window.location.origin,
    caminho: window.location.pathname,
    ...extraPayload,
  });
}

function send(tipo, payload = {}, { requireValidatedSession = true } = {}) {
  if (requireValidatedSession && !canSendOfficial()) {
    integrationState.lastError = getSessionStatus();
    refreshMeta();
    return false;
  }

  return postToParent(tipo, payload);
}

window.addEventListener("message", (event) => {
  if (!embedded || event.origin !== parentOrigin) {
    return;
  }

  const data = event.data ?? {};
  if (data.tipo === "handshakePlataformaOk") {
    const incomingNickname = String(data.payload?.playerNickname ?? "").trim().slice(0, 14);
    if (incomingNickname) {
      integrationState.playerName = incomingNickname;
    }
    integrationState.handshakeConfirmed = true;
    integrationState.handshakeRejected = false;
    integrationState.lastError = "";
    refreshMeta();
    return;
  }

  if (data.tipo === "handshakePlataformaErro") {
    integrationState.handshakeConfirmed = false;
    integrationState.handshakeRejected = true;
    integrationState.lastError = String(data.payload?.motivo ?? "handshake_rejeitado");
    refreshMeta();
  }
});

window.MyGaming = window.MyGaming ?? {};
window.MyGaming.requestHandshake = requestHandshake;
window.MyGaming.isSessionValidated = () => canSendOfficial();
window.MyGaming.getSessionStatus = () => getSessionStatus();
window.MyGaming.getPlayerName = () => integrationState.playerName || fallbackPlayerName || "";
window.MyGaming.registrarEvento = (evento) => send("registrarEvento", evento);
window.MyGaming.atualizarPontuacao = (payload) => send("atualizarPontuacao", payload);
window.MyGaming.finalizarPartida = (payload) => send("finalizarPartida", payload);
window.MyGaming.salvarProgresso = (payload) => send("salvarProgresso", payload);
window.MyGaming.carregarProgresso = (payload = {}) => send("carregarProgresso", payload);

refreshMeta();
if (embedded && sessionToken) {
  requestHandshake();
}
