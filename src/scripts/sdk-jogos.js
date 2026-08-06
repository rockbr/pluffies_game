const target = window.parent;
const queryParams = new URLSearchParams(window.location.search);
const embedded = queryParams.get("embedded") === "1";
const explicitParentOrigin = (queryParams.get("parentOrigin") ?? "").trim();
const sessionToken = (queryParams.get("sessionToken") ?? "").trim();
const parentOrigin = resolveParentOrigin();

const integrationState = {
  handshakeRequested: false,
  handshakeConfirmed: false,
  handshakeRejected: false,
  lastError: "",
  playerName: "",
  rankingSnapshot: [],
  topScore: 0,
  handshakeAttempts: 0,
  handshakeRetryTimerId: 0,
};

function logSdk(evento, detalhes = {}) {
  console.info(`[MyGaming SDK] ${evento}`, detalhes);
}

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
    rankingSnapshot: integrationState.rankingSnapshot,
    topScore: integrationState.topScore,
    sessionStatus: getSessionStatus(),
    handshakeRequested: integrationState.handshakeRequested,
    handshakeConfirmed: integrationState.handshakeConfirmed,
    handshakeRejected: integrationState.handshakeRejected,
    handshakeAttempts: integrationState.handshakeAttempts,
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

function normalizeRankingSnapshot(entries) {
  if (!Array.isArray(entries)) {
    return [];
  }

  return entries
    .slice(0, 3)
    .map((entry, index) => ({
      posicao: Number(entry?.posicao) || index + 1,
      nickname: String(entry?.nickname ?? "").trim().slice(0, 14),
      pontos: Number(entry?.pontos) || 0,
      melhorDuracaoSegundos: Number(entry?.melhorDuracaoSegundos) || 0,
    }))
    .filter((entry) => entry.nickname);
}

function requestHandshake(extraPayload = {}) {
  if (!embedded || target === window || !sessionToken) {
    integrationState.lastError = !sessionToken && embedded
      ? "session_token_ausente"
      : integrationState.lastError;
    refreshMeta();
    logSdk("handshake_bloqueado", {
      embedded,
      hasTarget: target !== window,
      hasSessionToken: Boolean(sessionToken),
      lastError: integrationState.lastError,
    });
    return false;
  }

  integrationState.handshakeRequested = true;
  integrationState.handshakeRejected = false;
  integrationState.handshakeAttempts += 1;
  integrationState.lastError = "";
  refreshMeta();
  logSdk("handshake_enviado", {
    attempt: integrationState.handshakeAttempts,
    parentOrigin,
    sessionTokenPreview: sessionToken.slice(0, 8),
    retry: Boolean(extraPayload.retry),
  });

  return postToParent("handshakeJogo", {
    sessionToken,
    origemJogo: window.location.origin,
    caminho: window.location.pathname,
    ...extraPayload,
  });
}

function stopHandshakeRetryLoop() {
  if (integrationState.handshakeRetryTimerId) {
    window.clearInterval(integrationState.handshakeRetryTimerId);
    integrationState.handshakeRetryTimerId = 0;
  }
}

function ensureHandshakeRetryLoop() {
  if (!embedded || !sessionToken || integrationState.handshakeConfirmed || integrationState.handshakeRejected) {
    stopHandshakeRetryLoop();
    return;
  }

  if (integrationState.handshakeRetryTimerId) {
    return;
  }

  integrationState.handshakeRetryTimerId = window.setInterval(() => {
    if (integrationState.handshakeConfirmed || integrationState.handshakeRejected || integrationState.handshakeAttempts >= 12) {
      stopHandshakeRetryLoop();
      if (!integrationState.handshakeConfirmed && !integrationState.handshakeRejected) {
        integrationState.lastError = "handshake_timeout";
        refreshMeta();
      }
      return;
    }

    requestHandshake({ retry: true });
  }, 500);
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
    if (embedded) {
      logSdk("mensagem_ignorada_origem", {
        origin: event.origin,
        parentOrigin,
        tipo: event.data?.tipo ?? null,
      });
    }
    return;
  }

  const data = event.data ?? {};
  if (data.tipo === "handshakePlataformaOk") {
    logSdk("handshake_ok_recebido", {
      origin: event.origin,
      hasPlayerNickname: Boolean(data.payload?.playerNickname),
      rankingCount: Array.isArray(data.payload?.rankingSnapshot) ? data.payload.rankingSnapshot.length : 0,
      sessionTokenPreview: String(data.payload?.sessionToken ?? "").slice(0, 8),
    });
    if (String(data.payload?.sessionToken ?? "") !== sessionToken) {
      integrationState.handshakeConfirmed = false;
      integrationState.handshakeRejected = true;
      integrationState.lastError = "token_partida_invalido";
      stopHandshakeRetryLoop();
      refreshMeta();
      logSdk("handshake_token_invalido", {
        expectedTokenPreview: sessionToken.slice(0, 8),
        receivedTokenPreview: String(data.payload?.sessionToken ?? "").slice(0, 8),
      });
      return;
    }

    const incomingNickname = String(data.payload?.playerNickname ?? "").trim().slice(0, 14);
    if (incomingNickname) {
      integrationState.playerName = incomingNickname;
    }
    integrationState.rankingSnapshot = normalizeRankingSnapshot(data.payload?.rankingSnapshot);
    integrationState.topScore = Number(data.payload?.topScore) || integrationState.rankingSnapshot[0]?.pontos || 0;
    integrationState.handshakeConfirmed = true;
    integrationState.handshakeRejected = false;
    integrationState.lastError = "";
    stopHandshakeRetryLoop();
    refreshMeta();
    logSdk("bootstrap_aplicado", {
      playerName: integrationState.playerName,
      rankingCount: integrationState.rankingSnapshot.length,
      topScore: integrationState.topScore,
    });
    return;
  }

  if (data.tipo === "handshakePlataformaErro") {
    integrationState.handshakeConfirmed = false;
    integrationState.handshakeRejected = true;
    integrationState.lastError = String(data.payload?.motivo ?? "handshake_rejeitado");
    stopHandshakeRetryLoop();
    refreshMeta();
    logSdk("handshake_erro_recebido", {
      origin: event.origin,
      motivo: integrationState.lastError,
    });
    return;
  }

  if (data.tipo === "rankingPlataformaAtualizado") {
    if (String(data.payload?.sessionToken ?? "") !== sessionToken) {
      logSdk("ranking_token_invalido", {
        expectedTokenPreview: sessionToken.slice(0, 8),
        receivedTokenPreview: String(data.payload?.sessionToken ?? "").slice(0, 8),
      });
      return;
    }

    integrationState.rankingSnapshot = normalizeRankingSnapshot(data.payload?.rankingSnapshot);
    integrationState.topScore = Number(data.payload?.topScore) || integrationState.rankingSnapshot[0]?.pontos || 0;
    refreshMeta();
    logSdk("ranking_atualizado", {
      rankingCount: integrationState.rankingSnapshot.length,
      topScore: integrationState.topScore,
    });
  }
});

window.MyGaming = window.MyGaming ?? {};
window.MyGaming.requestHandshake = requestHandshake;
window.MyGaming.isSessionValidated = () => canSendOfficial();
window.MyGaming.getSessionStatus = () => getSessionStatus();
window.MyGaming.getPlayerName = () => integrationState.playerName || "";
window.MyGaming.getRankingSnapshot = () => integrationState.rankingSnapshot.map((entry) => ({ ...entry }));
window.MyGaming.getTopScore = () => integrationState.topScore || 0;
window.MyGaming.registrarEvento = (evento) => send("registrarEvento", evento);
window.MyGaming.atualizarPontuacao = (payload) => send("atualizarPontuacao", payload);
window.MyGaming.finalizarPartida = (payload) => send("finalizarPartida", payload);
window.MyGaming.salvarProgresso = (payload) => send("salvarProgresso", payload);
window.MyGaming.carregarProgresso = (payload = {}) => send("carregarProgresso", payload);

refreshMeta();
if (embedded && sessionToken) {
  requestHandshake();
  ensureHandshakeRetryLoop();
}
