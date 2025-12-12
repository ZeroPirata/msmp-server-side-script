PlayerEvents.loggedIn(function (event) {
  let player = event.player;
  let level = event.level;
  if (!player.tags.contains(VIDEO_TAG)) {
    level.runCommandSilent(`playvideo "${VIDEO_URL}" ${player.username}`);
    player.tags.add(VIDEO_TAG);
  }
});
