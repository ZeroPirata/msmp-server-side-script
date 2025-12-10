PlayerEvents.loggedIn(function (event) {
  let player = event.player;
  let level = event.level;
  if (!player.tags.contains(VIDEO_TAG)) {
    level.runCommandSilent(`playvideo "${videoUrl}" ${player.username}`);
    player.tags.add(videoUrl);
  }
});
