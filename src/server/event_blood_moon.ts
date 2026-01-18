import { $MinecraftServer } from "net.minecraft.server.MinecraftServer";

console.log("[MSMP] Carregando evento Blood Moon...");

let lastBloodMoonCheck = 0;

ServerEvents.tick((event) => {
  let server = event.server;

  // Verificar apenas a cada 100 ticks (5 segundos)
  if (server.tickCount - lastBloodMoonCheck < 100) return;
  lastBloodMoonCheck = server.tickCount;

  let config = getBloodMoonConfig(server);

  // Se o sistema não está habilitado, sair
  if (!config.ENABLED) return;

  let overworld = server.overworld();
  let currentDay = Math.floor(overworld.getDayTime() / 24000);
  let isNight = overworld.isNight();

  // Carregar ou inicializar estado
  if (!currentBloodMoonState) {
    let loaded = loadBloodMoonState(server);
    if (loaded) {
      currentBloodMoonState = loaded;
    } else {
      // Primeira vez, calcular próxima blood moon
      let daysUntilNext = randomBetween(config.MIN_DAYS, config.MAX_DAYS);
      currentBloodMoonState = initBloodMoonState(currentDay, daysUntilNext);
      saveBloodMoonState(server, currentBloodMoonState);
    }
  }

  // Se a Blood Moon está ativa
  if (currentBloodMoonState.isActive) {
    // Verificar se ainda é noite
    if (!isNight) {
      endBloodMoon(server);
      return;
    }

    // Verificar duração
    let elapsed = server.tickCount - currentBloodMoonState.startTick;
    if (elapsed >= config.DURATION_TICKS) {
      endBloodMoon(server);
      return;
    }

    // Spawnar boss após o delay
    if (!currentBloodMoonState.bossSpawned && elapsed >= config.BOSS_SPAWN_DELAY) {
      spawnBloodMoonBoss(server);
    }

    // Aplicar efeitos visuais da Blood Moon
    applyBloodMoonEffects(server);
  } else {
    // Verificar se é hora de iniciar uma Blood Moon
    if (currentDay >= currentBloodMoonState.nextBloodMoonDay && isNight) {
      startBloodMoon(server, server.tickCount);
    }
  }
});
