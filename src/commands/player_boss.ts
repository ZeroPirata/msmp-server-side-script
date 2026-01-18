ServerEvents.commandRegistry((event) => {
  let { commands: Commands, arguments: Arguments } = event;

  // ============================================
  // COMANDO 1: Ver Status de Todos os Bosses
  // ============================================
  event.register(
    Commands.literal("msmpBossStatus")
      .requires((s) => s.hasPermission(2))
      .executes((ctx) => {
        try {
          let source = ctx.source;
          let server = source.server;
          let config = getMsmpConfig(server);

          // Cabeçalho
          source.sendSuccess(Component.literal("§6§l════════════════════════════════").bold(), false);
          source.sendSuccess(Component.literal("§6§l        STATUS DOS BOSSES").bold(), false);
          source.sendSuccess(Component.literal("§6§l════════════════════════════════").bold(), false);
          source.sendSuccess(Component.literal(""), false);

          // Informações Gerais
          source.sendSuccess(Component.literal("§e📊 Estatísticas Gerais:").bold(), false);
          source.sendSuccess(Component.literal(`  §7• Bosses Ativos: §a${Object.keys(activeBosses).length}`), false);
          source.sendSuccess(Component.literal(`  §7• Bosses Pendentes: §a${pendingBosses.length}`), false);
          source.sendSuccess(Component.literal(`  §7• Max por Noite: §a${config.MAX_BOSS_NIGHT}`), false);
          source.sendSuccess(Component.literal(""), false);

          // Estado da Noite Atual
          if (currentNightState) {
            source.sendSuccess(Component.literal("§e🌙 Estado da Noite Atual:").bold(), false);
            source.sendSuccess(Component.literal(`  §7• Dia: §a${currentNightState.day}`), false);
            source.sendSuccess(Component.literal(`  §7• Spawnados: §a${currentNightState.spawnedCount}§7/§a${config.MAX_BOSS_NIGHT}`), false);
            source.sendSuccess(Component.literal(`  §7• Tentativas: §a${currentNightState.attemptCount}§7/§a${config.MAX_SPAWN_ATTEMPTS}`), false);

            // Bosses por Dificuldade
            if (Object.keys(currentNightState.spawnedDifficulties).length > 0) {
              source.sendSuccess(Component.literal("  §7• Por Dificuldade:"), false);
              let difficulties = Object.keys(currentNightState.spawnedDifficulties);
              for (let i = 0; i < difficulties.length; i++) {
                let difficulty = difficulties[i];
                let count = currentNightState.spawnedDifficulties[difficulty];
                let color = getDifficultyColor(difficulty);
                let maxForDiff = MAX_PER_DIFFICULTY.get(difficulty) || 1;
                source.sendSuccess(Component.literal(`    ${color}${difficulty}: §a${count}§7/§a${maxForDiff}`), false);
              }
            }
            source.sendSuccess(Component.literal(""), false);
          } else {
            source.sendSuccess(Component.literal("§e🌙 Estado da Noite: §7Nenhum estado ativo (não é noite)"), false);
            source.sendSuccess(Component.literal(""), false);
          }

          // Lista de Bosses Ativos
          if (Object.keys(activeBosses).length > 0) {
            source.sendSuccess(Component.literal("§e⚔ Bosses Ativos:").bold(), false);

            let bossKeys = Object.keys(activeBosses);
            for (let i = 0; i < bossKeys.length; i++) {
              let formattedUuid = bossKeys[i];
              let bossData = activeBosses[formattedUuid];
              if (!bossData) continue;

              let boss = findBossByUuid(server, bossData.uuid);
              let difficultyColor = getDifficultyColor(bossData.config.difficulty || "NORMAL");
              let difficulty = bossData.config.difficulty || "NORMAL";

              if (boss && boss.isAlive()) {
                let health = boss.health;
                let maxHealth = boss.maxHealth;
                let healthPercent = ((health / maxHealth) * 100).toFixed(1);
                let isActivated = boss.persistentData.getBoolean("kubejs_bossActivated");
                let status = isActivated ? "§a✓ Ativo" : "§e⏸ Aguardando";

                source.sendSuccess(Component.literal(""), false);
                source.sendSuccess(Component.literal(`  §6${bossData.config.name}`).bold(), false);
                source.sendSuccess(Component.literal(`    §7• Dificuldade: ${difficultyColor}${difficulty}`), false);
                source.sendSuccess(Component.literal(`    §7• Status: ${status}`), false);
                source.sendSuccess(Component.literal(`    §7• Vida: §c${health.toFixed(0)}§7/§c${maxHealth.toFixed(0)} §7(${healthPercent}%)`), false);
                source.sendSuccess(
                  Component.literal(`    §7• Coordenadas: §bX: ${Math.floor(bossData.position.x)} Y: ${Math.floor(bossData.position.y)} Z: ${Math.floor(bossData.position.z)}`),
                  false
                );
                source.sendSuccess(Component.literal(`    §7• UUID: §8${uuid.substring(0, 8)}...`), false);
                source.sendSuccess(Component.literal(`    §7• Dia Spawn: §a${bossData.spawnDay}`), false);
              } else {
                source.sendSuccess(Component.literal(`  §c✕ ${bossData.config.name} §7(Morto/Removido)`), false);
              }
            }
            source.sendSuccess(Component.literal(""), false);
          } else {
            source.sendSuccess(Component.literal("§e⚔ Bosses Ativos: §7Nenhum"), false);
            source.sendSuccess(Component.literal(""), false);
          }

          // Lista de Bosses Pendentes
          if (pendingBosses.length > 0) {
            source.sendSuccess(Component.literal("§e⏳ Bosses Pendentes de Ativação:").bold(), false);

            for (let index = 0; index < pendingBosses.length; index++) {
              let pending = pendingBosses[index];
              let difficultyColor = getDifficultyColor(pending.config.difficulty || "NORMAL");
              let difficulty = pending.config.difficulty || "NORMAL";

              source.sendSuccess(Component.literal(""), false);
              source.sendSuccess(Component.literal(`  §6${index + 1}. ${pending.config.name}`).bold(), false);
              source.sendSuccess(Component.literal(`    §7• Dificuldade: ${difficultyColor}${difficulty}`), false);
              source.sendSuccess(Component.literal(`    §7• Coordenadas: §bX: ${Math.floor(pending.x)} Y: ${Math.floor(pending.y)} Z: ${Math.floor(pending.z)}`), false);
              source.sendSuccess(Component.literal(`    §7• Range Ativação: §a${pending.activationRange} blocos`), false);
              source.sendSuccess(Component.literal(`    §7• Dia Spawn: §a${pending.spawnDay}`), false);
            }
            source.sendSuccess(Component.literal(""), false);
          } else {
            source.sendSuccess(Component.literal("§e⏳ Bosses Pendentes: §7Nenhum"), false);
            source.sendSuccess(Component.literal(""), false);
          }

          // Rodapé
          source.sendSuccess(Component.literal("§6§l════════════════════════════════").bold(), false);

          return 1;
        } catch (error: any) {
          console.error(`[MSMP BOSS STATUS ERROR] ${error}`);
          console.error(`[MSMP BOSS STATUS ERROR] Stack: ${error.stack}`);
          ctx.source.sendFailure(Component.literal(`§cErro ao exibir status: ${error.message || error}`));
          return 0;
        }
      })
  );

  // ============================================
  // COMANDO 2: Resetar Tentativas de Spawn
  // ============================================
  event.register(
    Commands.literal("msmpResetAttempts")
      .requires((s) => s.hasPermission(2))
      .executes((ctx) => {
        try {
          let source = ctx.source;
          let server = source.server;

          if (!currentNightState) {
            source.sendFailure(Component.literal("§c❌ Erro: Nenhum estado de noite ativo no momento."));
            return 0;
          }

          let oldAttempts = currentNightState.attemptCount;
          currentNightState.attemptCount = 0;
          saveNightState(server, currentNightState);

          source.sendSuccess(Component.literal("§a✅ Tentativas de spawn resetadas!").bold(), true);
          source.sendSuccess(Component.literal(`§7Tentativas anteriores: §c${oldAttempts}`), false);
          source.sendSuccess(Component.literal(`§7Tentativas atuais: §a0`), false);
          source.sendSuccess(Component.literal(`§7O sistema pode fazer até §a${getMsmpConfig(server).MAX_SPAWN_ATTEMPTS} §7tentativas novamente.`), false);

          return 1;
        } catch (error: any) {
          console.error(`[MSMP RESET ATTEMPTS ERROR] ${error}`);
          console.error(`[MSMP RESET ATTEMPTS ERROR] Stack: ${error.stack}`);
          ctx.source.sendFailure(Component.literal(`§cErro ao resetar tentativas: ${error.message || error}`));
          return 0;
        }
      })
  );

  // ============================================
  // COMANDO 3: Resetar Estado Completo da Noite (BONUS)
  // ============================================
  event.register(
    Commands.literal("msmpResetNight")
      .requires((s) => s.hasPermission(3)) // Requer nível 3 (admin)
      .executes((ctx) => {
        try {
          let source = ctx.source;
          let server = source.server;

          if (!currentNightState) {
            source.sendFailure(Component.literal("§c❌ Erro: Nenhum estado de noite ativo no momento."));
            return 0;
          }

          let oldCount = currentNightState.spawnedCount;
          let oldAttempts = currentNightState.attemptCount;
          let day = currentNightState.day;

          currentNightState = initNightState(day);
          saveNightState(server, currentNightState);

          source.sendSuccess(Component.literal("§a✅ Estado da noite completamente resetado!").bold(), true);
          source.sendSuccess(Component.literal(`§7Bosses spawnados: §c${oldCount} §7→ §a0`), false);
          source.sendSuccess(Component.literal(`§7Tentativas: §c${oldAttempts} §7→ §a0`), false);
          source.sendSuccess(Component.literal(`§7Dificuldades resetadas.`), false);
          source.sendSuccess(Component.literal("§e⚠ Nota: Bosses já ativos continuarão vivos."), false);

          return 1;
        } catch (error: any) {
          console.error(`[MSMP RESET NIGHT ERROR] ${error}`);
          console.error(`[MSMP RESET NIGHT ERROR] Stack: ${error.stack}`);
          ctx.source.sendFailure(Component.literal(`§cErro ao resetar noite: ${error.message || error}`));
          return 0;
        }
      })
  );

  // ============================================
  // COMANDO 4: Forçar Spawn de Boss (BONUS)
  // ============================================
  event.register(
    Commands.literal("msmpForceSpawn")
      .requires((s) => s.hasPermission(3))
      .then(
        Commands.argument("difficulty", Arguments.STRING.create(event))
          .suggests((ctx, builder) => {
            ["FACIL", "NORMAL", "MEDIO", "DIFICIL", "RAID"].forEach((diff) => {
              builder.suggest(diff);
            });
            return builder.buildFuture();
          })
          .executes((ctx) => {
            try {
              let source = ctx.source;
              let server = source.server;
              let overworld = server.overworld();
              let command = ctx.getInput();
              let difficulty = command.split(" ")[1].toUpperCase() as BossDifficulty;

              if (!["FACIL", "NORMAL", "MEDIO", "DIFICIL", "RAID"].includes(difficulty)) {
                source.sendFailure(Component.literal(`§c❌ Dificuldade inválida: ${difficulty}`));
                return 0;
              }

              let config = getMsmpConfig(server);
              let currentDay = Math.floor(overworld.getDayTime() / 24000);

              // Inicializa estado se necessário
              if (!currentNightState) {
                currentNightState = initNightState(currentDay);
              }

              // Filtra bosses pela dificuldade
              let availableBosses = MINIBOSSES.filter((b) => (b.difficulty || "NORMAL") === difficulty);

              if (availableBosses.length === 0) {
                source.sendFailure(Component.literal(`§c❌ Nenhum boss com dificuldade ${difficulty} encontrado.`));
                return 0;
              }

              // Seleciona boss aleatório
              let bossConfig = availableBosses[Math.floor(Math.random() * availableBosses.length)];

              // Gera posição
              let pos = generateBossPosition(overworld, currentNightState.spawnedPositions, config);

              if (!pos) {
                source.sendFailure(Component.literal("§c❌ Não foi possível encontrar posição válida."));
                return 0;
              }

              // Atualiza estado
              currentNightState.spawnedCount++;
              currentNightState.spawnedPositions.push({ x: pos.getX(), z: pos.getZ() });
              let currentDiffCount = currentNightState.spawnedDifficulties[difficulty] || 0;
              currentNightState.spawnedDifficulties[difficulty] = currentDiffCount + 1;
              saveNightState(server, currentNightState);

              // Spawna boss
              prepareBossSpawnMulti(overworld.server, overworld, bossConfig, pos, currentDay, false);

              let diffColor = getDifficultyColor(difficulty);
              source.sendSuccess(Component.literal(`§a✅ Boss forçado com sucesso!`).bold(), true);
              source.sendSuccess(Component.literal(`§7Boss: §6${bossConfig.name}`), false);
              source.sendSuccess(Component.literal(`§7Dificuldade: ${diffColor}${difficulty}`), false);
              source.sendSuccess(Component.literal(`§7Coordenadas: §bX: ${Math.floor(pos.getX())} Y: ${Math.floor(pos.getY())} Z: ${Math.floor(pos.getZ())}`), false);

              return 1;
            } catch (error: any) {
              console.error(`[MSMP FORCE SPAWN ERROR] ${error}`);
              console.error(`[MSMP FORCE SPAWN ERROR] Stack: ${error.stack}`);
              ctx.source.sendFailure(Component.literal(`§cErro ao forçar spawn: ${error.message || error}`));
              return 0;
            }
          })
      )
  );

  // ============================================
  // COMANDO 5: Debug de Bosses Pendentes (NOVO)
  // ============================================
  event.register(
    Commands.literal("msmpDebugPending")
      .requires((s) => s.hasPermission(2))
      .executes((ctx) => {
        try {
          let source = ctx.source;
          let player = source.player;

          source.sendSuccess(Component.literal("§6§l═══ DEBUG BOSSES PENDENTES ═══").bold(), false);
          source.sendSuccess(Component.literal(""), false);

          source.sendSuccess(Component.literal(`§eTotal de bosses pendentes: §a${pendingBosses.length}`), false);
          source.sendSuccess(Component.literal(""), false);

          if (pendingBosses.length === 0) {
            source.sendSuccess(Component.literal("§7Nenhum boss pendente no momento."), false);
            return 1;
          }

          for (let index = 0; index < pendingBosses.length; index++) {
            let pending = pendingBosses[index];
            let diffColor = getDifficultyColor(pending.config.difficulty || "NORMAL");

            source.sendSuccess(Component.literal(`§6${index + 1}. ${pending.config.name}`).bold(), false);
            source.sendSuccess(Component.literal(`  §7Dificuldade: ${diffColor}${pending.config.difficulty || "NORMAL"}`), false);
            source.sendSuccess(Component.literal(`  §7Coordenadas: §bX:${Math.floor(pending.x)} Y:${Math.floor(pending.y)} Z:${Math.floor(pending.z)}`), false);
            source.sendSuccess(Component.literal(`  §7Range de Ativação: §a${pending.activationRange} blocos`), false);

            // Calcula distância do player
            if (player) {
              let playerPos = player.position();
              let distance = Math.sqrt(Math.pow(playerPos.x - pending.x, 2) + Math.pow(playerPos.y - pending.y, 2) + Math.pow(playerPos.z - pending.z, 2));

              let distColor = distance <= pending.activationRange ? "§a" : "§c";
              source.sendSuccess(Component.literal(`  §7Sua distância: ${distColor}${distance.toFixed(1)} blocos`), false);

              if (distance <= pending.activationRange) {
                source.sendSuccess(Component.literal(`  §a✓ Você está no range! Boss deveria spawnar...`), false);
              } else {
                let blocksNeeded = (distance - pending.activationRange).toFixed(1);
                source.sendSuccess(Component.literal(`  §c✗ Aproxime-se mais ${blocksNeeded} blocos`), false);
              }
            }

            source.sendSuccess(Component.literal(""), false);
          }

          source.sendSuccess(Component.literal("§6§l═══════════════════════════").bold(), false);

          return 1;
        } catch (error: any) {
          console.error(`[MSMP DEBUG PENDING ERROR] ${error}`);
          console.error(`[MSMP DEBUG PENDING ERROR] Stack: ${error.stack}`);
          ctx.source.sendFailure(Component.literal(`§cErro: ${error.message || error}`));
          return 0;
        }
      })
  );

  // ============================================
  // COMANDO 6: Forçar Spawn dos Bosses Pendentes (NOVO)
  // ============================================
  event.register(
    Commands.literal("msmpForceSpawnPending")
      .requires((s) => s.hasPermission(3))
      .executes((ctx) => {
        try {
          let source = ctx.source;
          let server = source.server;
          let overworld = server.overworld();

          if (pendingBosses.length === 0) {
            source.sendFailure(Component.literal("§c❌ Não há bosses pendentes para spawnar."));
            return 0;
          }

          let count = pendingBosses.length;
          source.sendSuccess(Component.literal(`§a✅ Forçando spawn de ${count} boss(es) pendente(s)...`).bold(), true);

          // Spawna todos os bosses pendentes
          let toRemove: number[] = [];
          for (let index = 0; index < pendingBosses.length; index++) {
            let pending = pendingBosses[index];
            spawnBossAtPositionMulti(overworld, pending);
            toRemove.push(index);

            source.sendSuccess(Component.literal(`§7✓ ${pending.config.name} spawnado em X:${Math.floor(pending.x)} Y:${Math.floor(pending.y)} Z:${Math.floor(pending.z)}`), false);
          }

          // Remove da lista
          for (let i = toRemove.length - 1; i >= 0; i--) {
            pendingBosses.splice(toRemove[i], 1);
          }

          source.sendSuccess(Component.literal(`§a✅ ${count} boss(es) spawnado(s) com sucesso!`), false);

          return 1;
        } catch (error: any) {
          console.error(`[MSMP FORCE SPAWN PENDING ERROR] ${error}`);
          console.error(`[MSMP FORCE SPAWN PENDING ERROR] Stack: ${error.stack}`);
          ctx.source.sendFailure(Component.literal(`§cErro: ${error.message || error}`));
          return 0;
        }
      })
  );

  // ============================================
  // COMANDO 7: Verificar Boss por UUID (DEBUG)
  // ============================================
  event.register(
    Commands.literal("msmpCheckBoss")
      .requires((s) => s.hasPermission(2))
      .then(
        Commands.argument("uuid", Arguments.STRING.create(event)).executes((ctx) => {
          try {
            let source = ctx.source;
            let server = source.server;
            let command = ctx.getInput();
            let uuid = command.split(" ")[1];

            source.sendSuccess(Component.literal("§6§l═══ VERIFICAÇÃO DE BOSS ═══").bold(), false);
            source.sendSuccess(Component.literal(""), false);
            source.sendSuccess(Component.literal(`§7UUID: §e${uuid}`), false);
            source.sendSuccess(Component.literal(""), false);

            // Verifica se está nos ativos
            let formattedUuid = uuid.split("-").join("").toLowerCase();
            let isInActive = formattedUuid in activeBosses;
            if (isInActive) {
              let bossData = activeBosses[formattedUuid];
              source.sendSuccess(Component.literal(`§a✓ Boss encontrado nos ATIVOS`).bold(), false);
              source.sendSuccess(Component.literal(`§7Nome: §6${bossData.config.name}`), false);
              source.sendSuccess(Component.literal(`§7Dificuldade: ${getDifficultyColor(bossData.config.difficulty || "NORMAL")}${bossData.config.difficulty || "NORMAL"}`), false);
              source.sendSuccess(Component.literal(`§7Dia Spawn: §a${bossData.spawnDay}`), false);
            } else {
              source.sendSuccess(Component.literal(`§c✗ Boss NÃO encontrado nos ativos`), false);
            }

            // Verifica se a entidade existe no mundo
            let boss = findBossByUuid(server, uuid);
            if (boss) {
              source.sendSuccess(Component.literal(""), false);
              source.sendSuccess(Component.literal(`§a✓ Entidade encontrada no MUNDO`).bold(), false);
              source.sendSuccess(Component.literal(`§7Vivo: ${boss.isAlive() ? "§a✓" : "§c✗"}`), false);
              source.sendSuccess(Component.literal(`§7No Nível: ${boss.isAddedToLevel() ? "§a✓" : "§c✗"}`), false);
              source.sendSuccess(Component.literal(`§7Vida: §c${boss.health.toFixed(0)}§7/§c${boss.maxHealth.toFixed(0)}`), false);
              source.sendSuccess(Component.literal(`§7Coordenadas: §bX:${Math.floor(boss.x)} Y:${Math.floor(boss.y)} Z:${Math.floor(boss.z)}`), false);

              // Verifica persistentData
              let pd = boss.persistentData;
              source.sendSuccess(Component.literal(""), false);
              source.sendSuccess(Component.literal(`§e📋 PersistentData:`).bold(), false);
              source.sendSuccess(Component.literal(`§7• kubejs_customDrops: ${pd.contains("kubejs_customDrops") ? "§a✓" : "§c✗"}`), false);
              source.sendSuccess(Component.literal(`§7• kubejs_bossActivated: ${pd.getBoolean("kubejs_bossActivated") ? "§a✓" : "§c✗"}`), false);
              source.sendSuccess(Component.literal(`§7• boss_type: §e${pd.getString("boss_type") || "§c(vazio)"}`), false);
            } else {
              source.sendSuccess(Component.literal(""), false);
              source.sendSuccess(Component.literal(`§c✗ Entidade NÃO encontrada no mundo`), false);
            }

            source.sendSuccess(Component.literal(""), false);
            source.sendSuccess(Component.literal("§6§l═══════════════════════════").bold(), false);

            return 1;
          } catch (error: any) {
            console.error(`[MSMP CHECK BOSS ERROR] ${error}`);
            console.error(`[MSMP CHECK BOSS ERROR] Stack: ${error.stack}`);
            ctx.source.sendFailure(Component.literal(`§cErro: ${error.message || error}`));
            return 0;
          }
        })
      )
  );

  // ============================================
  // COMANDO 8: Localização de Bosses Ativos (PÚBLICO)
  // ============================================
  event.register(
    Commands.literal("msmpBossesStatus").executes((ctx) => {
      try {
        let source = ctx.source;
        let server = source.server;
        let player = source.player;

        // Cabeçalho
        source.sendSuccess(Component.literal("§6§l════════════════════════════").bold(), false);
        source.sendSuccess(Component.literal("§6§l    BOSSES NO MAPA").bold(), false);
        source.sendSuccess(Component.literal("§6§l════════════════════════════").bold(), false);
        source.sendSuccess(Component.literal(""), false);

        let totalBosses = Object.keys(activeBosses).length + pendingBosses.length;

        if (totalBosses === 0) {
          source.sendSuccess(Component.literal("§7Nenhum boss no mapa no momento."), false);
          source.sendSuccess(Component.literal("§7Aproveite a paz enquanto dura... 😊"), false);
          source.sendSuccess(Component.literal(""), false);
          source.sendSuccess(Component.literal("§6§l════════════════════════════").bold(), false);
          return 1;
        }

        source.sendSuccess(Component.literal(`§eBosses encontrados: §a${totalBosses}`), false);
        source.sendSuccess(Component.literal(""), false);

        let bossNumber = 1;

        // Lista bosses pendentes
        for (let i = 0; i < pendingBosses.length; i++) {
          let pending = pendingBosses[i];

          source.sendSuccess(Component.literal(`§6${bossNumber}. ${pending.config.name}`).bold(), false);
          source.sendSuccess(Component.literal(`  §7Status: §e⏸ Aguardando ativação`), false);
          source.sendSuccess(Component.literal(`  §7Localização: §bX: ${Math.floor(pending.x)} Y: ${Math.floor(pending.y)} Z: ${Math.floor(pending.z)}`), false);

          // Calcula distância do player se disponível
          if (player) {
            let playerPos = player.position();
            let distance = Math.sqrt(Math.pow(playerPos.x - pending.x, 2) + Math.pow(playerPos.y - pending.y, 2) + Math.pow(playerPos.z - pending.z, 2));

            let distColor = distance < 100 ? "§c" : distance < 300 ? "§e" : "§a";
            source.sendSuccess(Component.literal(`  §7Distância: ${distColor}${distance.toFixed(0)} blocos`), false);

            if (distance <= pending.activationRange) {
              source.sendSuccess(Component.literal(`  §a✓ Você está no range de ativação!`), false);
            }
          }

          source.sendSuccess(Component.literal(""), false);
          bossNumber++;
        }

        // Lista bosses ativos
        let bossKeys = Object.keys(activeBosses);
        for (let i = 0; i < bossKeys.length; i++) {
          let formattedUuid = bossKeys[i];
          let bossData = activeBosses[formattedUuid];
          if (!bossData) continue;

          let boss = findBossByUuid(server, bossData.uuid);
          if (!boss || !boss.isAlive()) continue;

          let isActivated = boss.persistentData.getBoolean("kubejs_bossActivated");
          let status = isActivated ? "§a⚔ Ativo" : "§e⏸ Aguardando jogador";

          source.sendSuccess(Component.literal(`§6${bossNumber}. ${bossData.config.name}`).bold(), false);
          source.sendSuccess(Component.literal(`  §7Status: ${status}`), false);
          source.sendSuccess(Component.literal(`  §7Localização: §bX: ${Math.floor(bossData.position.x)} Y: ${Math.floor(bossData.position.y)} Z: ${Math.floor(bossData.position.z)}`), false);

          // Calcula distância do player se disponível
          if (player) {
            let playerPos = player.position();
            let distance = Math.sqrt(Math.pow(playerPos.x - bossData.position.x, 2) + Math.pow(playerPos.y - bossData.position.y, 2) + Math.pow(playerPos.z - bossData.position.z, 2));

            let distColor = distance < 100 ? "§c" : distance < 300 ? "§e" : "§a";
            source.sendSuccess(Component.literal(`  §7Distância: ${distColor}${distance.toFixed(0)} blocos`), false);
          }

          source.sendSuccess(Component.literal(""), false);
          bossNumber++;
        }

        source.sendSuccess(Component.literal("§7Boa sorte na caçada! ⚔"), false);
        source.sendSuccess(Component.literal("§6§l════════════════════════════").bold(), false);

        return 1;
      } catch (error: any) {
        console.error(`[MSMP BOSSES STATUS ERROR] ${error}`);
        console.error(`[MSMP BOSSES STATUS ERROR] Stack: ${error.stack}`);
        ctx.source.sendFailure(Component.literal(`§cErro ao exibir bosses: ${error.message || error}`));
        return 0;
      }
    })
  );

  // ============================================
  // COMANDO 9: Registrar Boss Manualmente (EMERGÊNCIA)
  // ============================================
  event.register(
    Commands.literal("msmpRegisterBoss")
      .requires((s) => s.hasPermission(3))
      .then(
        Commands.argument("uuid", Arguments.STRING.create(event)).executes((ctx) => {
          try {
            let source = ctx.source;
            let server = source.server;
            let command = ctx.getInput();
            let uuid = command.split(" ")[1];

            // Verifica se já está registrado
            let formattedUuid = uuid.split("-").join("").toLowerCase();
            if (formattedUuid in activeBosses) {
              source.sendFailure(Component.literal(`§c❌ Boss ${uuid} já está registrado!`));
              return 0;
            }

            // Encontra o boss no mundo
            let boss = findBossByUuid(server, uuid);
            if (!boss) {
              source.sendFailure(Component.literal(`§c❌ Boss com UUID ${uuid} não encontrado no mundo!`));
              return 0;
            }

            // Tenta recuperar config do boss_type
            let bossType = boss.persistentData.getString("boss_type");
            let config = MINIBOSSES.find((b) => b.classe === bossType);

            if (!config) {
              source.sendFailure(Component.literal(`§c❌ Não foi possível encontrar configuração para boss tipo: ${bossType}`));
              source.sendSuccess(Component.literal(`§7Tipos disponíveis: ${MINIBOSSES.map((b) => b.classe).join(", ")}`), false);
              return 0;
            }

            // Registra o boss
            let currentDay = Math.floor(server.overworld().getDayTime() / 24000);
            registerActiveBoss(boss, config, currentDay, server);

            source.sendSuccess(Component.literal(`§a✅ Boss registrado com sucesso!`).bold(), true);
            source.sendSuccess(Component.literal(`§7Nome: §6${config.name}`), false);
            source.sendSuccess(Component.literal(`§7UUID: §e${uuid}`), false);
            source.sendSuccess(Component.literal(`§7Tipo: §e${bossType}`), false);

            return 1;
          } catch (error: any) {
            console.error(`[MSMP REGISTER BOSS ERROR] ${error}`);
            console.error(`[MSMP REGISTER BOSS ERROR] Stack: ${error.stack}`);
            ctx.source.sendFailure(Component.literal(`§cErro: ${error.message || error}`));
            return 0;
          }
        })
      )
  );
});

// ============================================
// FUNÇÃO AUXILIAR: Cores por Dificuldade
// ============================================
function getDifficultyColor(difficulty: string): string {
  switch (difficulty) {
    case "FACIL":
      return "§a"; // Verde
    case "NORMAL":
      return "§e"; // Amarelo
    case "MEDIO":
      return "§6"; // Laranja
    case "DIFICIL":
      return "§c"; // Vermelho
    case "RAID":
      return "§5"; // Roxo
    default:
      return "§7"; // Cinza
  }
}
