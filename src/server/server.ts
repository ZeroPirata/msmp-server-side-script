ServerEvents.loaded((server) => {
  getMsmpConfig(server.getServer());
});
