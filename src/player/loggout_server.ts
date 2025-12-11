PlayerEvents.loggedOut((event) => {
  if (activeBossBar) {
    removePlayerFromBossBar(event.player);
  }
});
