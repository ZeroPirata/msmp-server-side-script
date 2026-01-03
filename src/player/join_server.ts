PlayerEvents.loggedIn(function (event) {
  let player = event.player;
  let level = event.level;
  if (!player.tags.contains(VIDEO_TAG)) {
    level.runCommandSilent(`playvideo "${VIDEO_URL}" ${player.username}`);
    player.tags.add(VIDEO_TAG);
  }
});

PlayerEvents.tick((event) => {
  if (event.player.tickCount % 20 !== 0) return;
  let player = event.player;
  let data = player.persistentData;
  let timer = data.getInt("seen_boss_timer") || 0;
  timer += 20;
  data.putInt("seen_boss_timer", timer);
  if (timer >= RESET_TICKS) {
    let keys = data.allKeys;
    keys.forEach((key) => {
      if (key.startsWith("seen_boss_") && key !== "seen_boss_timer") {
        data.remove(key);
      }
    });
    data.putInt("seen_boss_timer", 0);
  }
});
