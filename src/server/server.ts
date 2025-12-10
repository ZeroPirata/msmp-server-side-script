ServerEvents.loaded((server) => {
  getMsmpConfig(server.getServer());
  console.log("[MSMP Config] Configuração inicializada.");
});
