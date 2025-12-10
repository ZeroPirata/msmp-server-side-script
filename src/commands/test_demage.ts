ServerEvents.commandRegistry((event) => {
  let { commands: Commands, arguments: Arguments } = event;

  event.register(
    Commands.literal("testdamage")
      .requires((src) => src.hasPermission(2))
      .then(
        Commands.argument("damage_type", Arguments.STRING.create(event)).executes((ctx) => {
          try {
            let executor = ctx.source.player;

            if (!executor) {
              ctx.source.sendFailure("Comando deve ser executado por um jogador!");
              return 0;
            }

            let args = ctx.getInput().split(" ");
            let damageType = args[1];

            let level = executor.level;

            // Procura QUALQUER LivingEntity próximo para testar
            let target: $LivingEntity | null = null;
            let searchRadius = 50;

            level.entities.forEach((entity) => {
              if (!entity.isLiving()) return;
              if (entity.isPlayer()) return;

              let dist = entity.distanceToSqr(executor);
              if (dist < searchRadius * searchRadius && !target) {
                target = entity as $LivingEntity;
              }
            });

            if (!target) {
              ctx.source.sendFailure(`§cNenhuma entidade encontrada em ${searchRadius} blocos!`);
              return 0;
            }

            executor.tell(`§aEntidade encontrada: §e${target.type}`);

            let totalDamage = 1000;
            let playerDamage = 0;

            if (damageType == "high") {
              playerDamage = 670; // 67%
            } else if (damageType == "medium") {
              playerDamage = 450; // 45%
            } else if (damageType == "low") {
              playerDamage = 100; // 10%
            } else {
              ctx.source.sendFailure("§cUso: /testdamage <high|medium|low>");
              return 0;
            }

            let remainingDamage = totalDamage - playerDamage;
            let fakeDamageA = Math.floor(remainingDamage / 2);
            let fakeDamageB = remainingDamage - fakeDamageA;
            let myUuid = executor.uuid.toString();
            let myName = executor.name.string;
            let fakePlayerAUuid = "11111111-1111-1111-1111-111111111111";
            let fakePlayerBUuid = "22222222-2222-2222-2222-222222222222";
            let damageTracker = {};

            damageTracker[fakePlayerAUuid] = {
              playerName: "FakePlayerA",
              damage: fakeDamageA
            };

            damageTracker[fakePlayerBUuid] = {
              playerName: "FakePlayerB",
              damage: fakeDamageB
            };

            damageTracker[myUuid] = {
              playerName: myName,
              damage: playerDamage
            };

            let trackerJson = JSON.stringify(damageTracker);
            target.persistentData.remove("kubejs_damageTracker");
            target.persistentData.remove("kubejs_customDrops");
            target.persistentData.putString("kubejs_damageTracker", trackerJson);
            target.persistentData.putBoolean("kubejs_customDrops", true);
            let verification = target.persistentData.getString("kubejs_damageTracker");
            let verifyParsed = JSON.parse(verification);
            let percentage = ((playerDamage / totalDamage) * 100).toFixed(1);

            executor.tell(`§a§l✓ DANO CONFIGURADO COM SUCESSO!`);
            executor.tell(`§7Tier: §e${damageType.toUpperCase()}`);
            executor.tell(`§7Distribuição:`);
            executor.tell(`  §61º - ${myName}: §b${playerDamage} §7(${percentage}%)`);
            executor.tell(`  §f2º - FakePlayerA: §b${fakeDamageA} §7(${((fakeDamageA / totalDamage) * 100).toFixed(1)}%)`);
            executor.tell(`  §73º - FakePlayerB: §b${fakeDamageB} §7(${((fakeDamageB / totalDamage) * 100).toFixed(1)}%)`);
            executor.tell(`§c§l⚠ MATE O BOSS AGORA!`);
            executor.tell(`§eDevem aparecer 3 baús (1 para cada jogador)`);

            return 1;
          } catch (error: any) {
            console.error(`[TESTDAMAGE ERROR] ${error}`);
            console.error(`[TESTDAMAGE ERROR] Stack: ${error.stack}`);
            ctx.source.sendFailure(`§cErro: ${error.message || error}`);
            return 0;
          }
        })
      )
  );

  event.register(
    Commands.literal("chestinfo")
      .requires((src) => src.hasPermission(2))
      .executes((ctx) => {
        try {
          let executor = ctx.source.player;
          if (!executor) {
            ctx.source.sendFailure("Comando deve ser executado por um jogador!");
            return 0;
          }

          let server = executor.server;
          let activePlayers = getActiveChestPlayers(server);

          if (activePlayers.length === 0) {
            executor.tell("§7Nenhum baú ativo no momento.");
            return 1;
          }

          executor.tell("§6§l===== BAÚS ATIVOS =====");
          activePlayers.forEach((playerName, index) => {
            let chestData = loadChestKey(playerName, server);
            if (chestData) {
              executor.tell(`§e${index + 1}. §b${playerName}`);
              executor.tell(`   §7Posição: §f${chestData.pos.x}, ${chestData.pos.y}, ${chestData.pos.z}`);

              // Verifica se é o dono
              if (playerName === executor.name.string) {
                executor.tell(`   §a✓ Você PODE abrir este baú`);
              } else {
                executor.tell(`   §c✗ Você NÃO pode abrir este baú`);
              }
            }
          });
          executor.tell("§6§l========================");

          return 1;
        } catch (error: any) {
          ctx.source.sendFailure(`§cErro: ${error.message || error}`);
          return 0;
        }
      })
  );

  event.register(
    Commands.literal("clearchests")
      .requires((src) => src.hasPermission(2))
      .executes((ctx) => {
        try {
          let executor = ctx.source.player;
          if (!executor) {
            ctx.source.sendFailure("Comando deve ser executado por um jogador!");
            return 0;
          }
          let server = executor.server;
          let level = executor.level;
          let activePlayers = getActiveChestPlayers(server);
          activePlayers.forEach((playerName) => {
            let chestData = loadChestKey(playerName, server);
            if (chestData) {
              level.runCommandSilent(`setblock ${chestData.pos.x} ${chestData.pos.y} ${chestData.pos.z} air`);
            }
            removeChestKey(playerName, server);
          });
          server.persistentData.remove("chest_active_players");
          ctx.source.sendSuccess(`§a✓ ${activePlayers.length} baú(s) removido(s)!`, false);
          return 1;
        } catch (error: any) {
          ctx.source.sendFailure(`§cErro: ${error.message || error}`);
          return 0;
        }
      })
  );

  event.register(
    Commands.literal("resetdamage")
      .requires((src) => src.hasPermission(2))
      .executes((ctx) => {
        try {
          let executor = ctx.source.player;
          if (!executor) {
            ctx.source.sendFailure("Comando deve ser executado por um jogador!");
            return 0;
          }
          let BOSS_ID = "cataclysm:royal_draugr";
          let level = executor.level;
          let target: $LivingEntity | null = null;
          level.entities.forEach((entity) => {
            if (entity.type.toString() === BOSS_ID && !target) {
              target = entity as $LivingEntity;
            }
          });
          if (!target) {
            ctx.source.sendFailure(`§cNenhum boss encontrado!`);
            return 0;
          }
          target.persistentData.remove("kubejs_damageTracker");
          target.persistentData.remove("kubejs_customDrops");
          ctx.source.sendSuccess("§a✓ Dados de dano resetados!", false);
          return 1;
        } catch (error: any) {
          ctx.source.sendFailure(`§cErro: ${error.message || error}`);
          return 0;
        }
      })
  );
});
