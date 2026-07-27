const target = window.parent;

function send(tipo, payload) {
  target.postMessage(
    {
      tipo,
      payload,
      correlationId: crypto.randomUUID(),
      versao: "1.0",
    },
    "*",
  );
}

window.MyGaming = window.MyGaming ?? {
  registrarEvento(evento) {
    send("registrarEvento", evento);
  },
  atualizarPontuacao(payload) {
    send("atualizarPontuacao", payload);
  },
  finalizarPartida(payload) {
    send("finalizarPartida", payload);
  },
  salvarProgresso(payload) {
    send("salvarProgresso", payload);
  },
  carregarProgresso() {
    send("carregarProgresso");
  },
};
