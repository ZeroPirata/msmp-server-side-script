ServerEvents.commandRegistry((event) => {
  let { commands: Commands, arguments: Arguments } = event;
  // ============================================
  // COMANDO: Ver Status da Blood Moon
  // ============================================
  event.register(
    Commands.literal("bloodmoon").then(
      Commands.literal("status")
        .requires((s) => s.hasPermission(2))
        .executes((ctx) => {
          try {
            let source = ctx.source;
            let server = source.server;
            let config = getBloodMoonConfig(server);
            let overworld = server.overworld();
            let currentDay = Math.floor(overworld.getDayTime() / 24000);

            // Carregar estado
            if (!currentBloodMoonState) {
              currentBloodMoonState = loadBloodMoonState(server);
            }

            source.sendSuccess(Component.literal("§4§l════════════════════════════════").bold(), false);
            source.sendSuccess(Component.literal("§4§l     🩸 BLOOD MOON STATUS 🩸").bold(), false);
            source.sendSuccess(Component.literal("§4§l════════════════════════════════").bold(), false);
            source.sendSuccess(Component.literal(""), false);

            // Configuração
            source.sendSuccess(Component.literal("§e📋 Configuração:").bold(), false);
            source.sendSuccess(Component.literal(`  §7• Sistema: ${config.ENABLED ? "§a✓ Ativo" : "§c✗ Desativado"}`), false);
            source.sendSuccess(Component.literal(`  §7• Intervalo: §a${config.MIN_DAYS}-${config.MAX_DAYS} dias`), false);
            source.sendSuccess(Component.literal(`  §7• Duração: §a${Math.floor(config.DURATION_TICKS / 20)} segundos`), false);
            source.sendSuccess(Component.literal(`  §7• Boss: §6${config.BOSS_CLASSE}`), false);
            source.sendSuccess(Component.literal(""), false);

            // Estado Atual
            if (currentBloodMoonState) {
              source.sendSuccess(Component.literal("§e🌙 Estado Atual:").bold(), false);
              source.sendSuccess(Component.literal(`  §7• Dia Atual: §a${currentDay}`), false);

              if (currentBloodMoonState.isActive) {
                source.sendSuccess(Component.literal(`  §7• Status: §c✓ BLOOD MOON ATIVA!`), false);
                let elapsed = Math.floor((server.tickCount - currentBloodMoonState.startTick) / 20);
                let remaining = Math.floor((config.DURATION_TICKS - (server.tickCount - currentBloodMoonState.startTick)) / 20);
                source.sendSuccess(Component.literal(`  §7• Tempo Decorrido: §a${elapsed}s`), false);
                source.sendSuccess(Component.literal(`  §7• Tempo Restante: §a${remaining}s`), false);
                source.sendSuccess(Component.literal(`  §7• Boss Spawnado: ${currentBloodMoonState.bossSpawned ? "§a✓ Sim" : "§e⏳ Aguardando"}`), false);

                if (currentBloodMoonState.bossSpawned) {
                  source.sendSuccess(Component.literal(`  §7• Boss Morto: ${currentBloodMoonState.bossKilled ? "§a✓ Sim" : "§c✗ Não"}`), false);
                }
              } else {
                source.sendSuccess(Component.literal(`  §7• Status: §7Aguardando`), false);
                source.sendSuccess(Component.literal(`  §7• Próxima Blood Moon: §aDia ${currentBloodMoonState.nextBloodMoonDay}`), false);
                let daysRemaining = currentBloodMoonState.nextBloodMoonDay - currentDay;
                source.sendSuccess(Component.literal(`  §7• Dias Restantes: §a${daysRemaining}`), false);
              }
            } else {
              source.sendSuccess(Component.literal("§c⚠ Estado não inicializado"), false);
            }

            source.sendSuccess(Component.literal(""), false);
            source.sendSuccess(Component.literal("§4§l════════════════════════════════").bold(), false);

            return 1;
          } catch (error: any) {
            console.error(`[Blood Moon Status Error] ${error}`);
            ctx.source.sendFailure(Component.literal(`§cErro: ${error.message || error}`));
            return 0;
          }
        })
    )
  );

  // ============================================
  // COMANDO: Forçar Blood Moon
  // ============================================
  event.register(
    Commands.literal("bloodmoon").then(
      Commands.literal("force")
        .requires((s) => s.hasPermission(3))
        .executes((ctx) => {
          try {
            let source = ctx.source;
            let server = source.server;
            let overworld = server.overworld();
            let currentDay = Math.floor(overworld.getDayTime() / 24000);

            // Carregar estado
            if (!currentBloodMoonState) {
              currentBloodMoonState = loadBloodMoonState(server);
              if (!currentBloodMoonState) {
                currentBloodMoonState = initBloodMoonState(currentDay, 0);
              }
            }

            // Se já está ativa, avisar
            if (currentBloodMoonState.isActive) {
              source.sendFailure(Component.literal("§c⚠ Blood Moon já está ativa!"));
              return 0;
            }

            // Forçar início
            startBloodMoon(server, server.tickCount);

            source.sendSuccess(Component.literal("§a✅ Blood Moon forçada!").bold(), true);
            return 1;
          } catch (error: any) {
            console.error(`[Blood Moon Force Error] ${error}`);
            ctx.source.sendFailure(Component.literal(`§cErro: ${error.message || error}`));
            return 0;
          }
        })
    )
  );

  // ============================================
  // COMANDO: Cancelar Blood Moon
  // ============================================
  event.register(
    Commands.literal("bloodmoon").then(
      Commands.literal("cancel")
        .requires((s) => s.hasPermission(3))
        .executes((ctx) => {
          try {
            let source = ctx.source;
            let server = source.server;

            if (!currentBloodMoonState || !currentBloodMoonState.isActive) {
              source.sendFailure(Component.literal("§c⚠ Nenhuma Blood Moon ativa no momento!"));
              return 0;
            }

            endBloodMoon(server);
            source.sendSuccess(Component.literal("§a✅ Blood Moon cancelada!").bold(), true);
            return 1;
          } catch (error: any) {
            console.error(`[Blood Moon Cancel Error] ${error}`);
            ctx.source.sendFailure(Component.literal(`§cErro: ${error.message || error}`));
            return 0;
          }
        })
    )
  );

  // ============================================
  // COMANDO: Resetar Próxima Blood Moon
  // ============================================
  event.register(
    Commands.literal("bloodmoon").then(
      Commands.literal("reset")
        .requires((s) => s.hasPermission(3))
        .executes((ctx) => {
          try {
            let source = ctx.source;
            let server = source.server;
            let config = getBloodMoonConfig(server);
            let overworld = server.overworld();
            let currentDay = Math.floor(overworld.getDayTime() / 24000);

            let daysUntilNext = randomBetween(config.MIN_DAYS, config.MAX_DAYS);
            currentBloodMoonState = initBloodMoonState(currentDay, daysUntilNext);
            saveBloodMoonState(server, currentBloodMoonState);

            source.sendSuccess(Component.literal("§a✅ Sistema Blood Moon resetado!").bold(), true);
            source.sendSuccess(Component.literal(`§7Próxima Blood Moon: §aDia ${currentBloodMoonState.nextBloodMoonDay}`), false);
            return 1;
          } catch (error: any) {
            console.error(`[Blood Moon Reset Error] ${error}`);
            ctx.source.sendFailure(Component.literal(`§cErro: ${error.message || error}`));
            return 0;
          }
        })
    )
  );
});
