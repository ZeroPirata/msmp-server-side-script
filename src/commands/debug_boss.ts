ServerEvents.commandRegistry((event) => {
  let { commands: Commands, arguments: Arguments } = event;

  event.register(
    Commands.literal("resetbossday")
      .requires((src) => src.hasPermission(2))
      .executes((ctx) => {
        let server = ctx.source.server;

        let oldDay = server.persistentData.getInt(TAG_LAST_DAY);
        server.persistentData.remove(TAG_LAST_DAY);

        ctx.source.sendSuccess(`§a✓ Último dia de spawn resetado!`, false);
        ctx.source.sendSuccess(`§7Era: dia ${oldDay} → Agora: sem registro`, false);
        ctx.source.sendSuccess(`§eO boss poderá spawnar novamente hoje!`, false);

        return 1;
      })
  );

  // Comando para ver o último dia
  event.register(
    Commands.literal("checkbossday")
      .requires((src) => src.hasPermission(2))
      .executes((ctx) => {
        let server = ctx.source.server;
        let overworld = server.overworld();

        let lastDay = server.persistentData.getInt(TAG_LAST_DAY);
        let currentDay = Math.floor(overworld.getDayTime() / 24000);

        ctx.source.sendSuccess(`§6===== INFO DO BOSS =====`, false);
        ctx.source.sendSuccess(`§7Dia atual: §e${currentDay}`, false);
        ctx.source.sendSuccess(`§7Último spawn: §e${lastDay || "Nunca"}`, false);

        if (lastDay === currentDay) {
          ctx.source.sendSuccess(`§c✗ Boss já spawnou hoje`, false);
        } else {
          ctx.source.sendSuccess(`§a✓ Boss pode spawnar hoje`, false);
        }

        return 1;
      })
  );

  // Comando para forçar spawn (ignora tudo)
  event.register(
    Commands.literal("forcebossspawn")
      .requires((src) => src.hasPermission(2)) // Se não fornecer args, mostra a config (mantido da sua lógica original)
      .executes((ctx) => displayConfigBosses(ctx.source))
      .then(
        Commands.argument("key", Arguments.STRING.create(event))
          .suggests((ctx, builder) => {
            Object.keys(BOSS_NAME_FOR_CONFIG).forEach((key) => builder.suggest(key));
            return builder.buildFuture();
          })
          .executes((ctx) => {
            let server = ctx.source.server;
            let overworld = server.overworld();

            overworld.persistentData.remove("kubejs_damageTracker");
            overworld.persistentData.remove("kubejs_isEnraged");
            overworld.persistentData.remove("kubejs_maxHealth");
            overworld.persistentData.remove("kubejs_bossActivated");
            overworld.persistentData.remove("kubejs_activationRange");
            overworld.persistentData.remove("kubejs_customDrops");

            let args = ctx.getInput().split(" ");
            let keyArg = args[1];
            let config = BOSS_NAME_FOR_CONFIG;
            if (!(keyArg in config)) {
              ctx.source.sendFailure(Component.literal(`❌ Erro: Chave '${keyArg}' não existe na configuração.`));
              return 0;
            }
            let bossId = config[keyArg];
            let bossConfig = MINIBOSSES[bossId];

            let pos = generateRandomPositionBoss(overworld);
            server.persistentData.remove(TAG_LAST_DAY); // Chama a função de spawn com a configuração correta
            if (typeof prepareBossSpawn === "function") {
              prepareBossSpawn(overworld, bossConfig, pos.x, pos.y, pos.z);
            } else {
              ctx.source.sendFailure(Component.literal(`❌ Erro: Função 'prepareBossSpawn' não está definida.`));
              return 0;
            }

            ctx.source.sendSuccess(Component.literal(`§a✓ Boss ${keyArg} (ID: ${bossId}) forçado a spawnar!`), false);
            ctx.source.sendSuccess(Component.literal(`§7Posição: §e${pos.x}, ${pos.y}, ${pos.z}`), false);
            return 1;
          })
      )
  );

  let displayConfigBosses = (source) => {
    try {
      let bosses = BOSS_NAME_FOR_CONFIG;
      source.sendSuccess(Component.literal(`§6--- Bosses Configurados (${Object.keys(bosses).length}) ---`), false);
      for (let [key, value] of Object.entries(bosses)) {
        source.sendSuccess(Component.literal(` §a${key}: §b${value}`), false);
      }
      return 1;
    } catch (error) {
      console.error(`[BOSS CONFIG ERROR] ${error}`);
      source.sendFailure(Component.literal(`§cErro ao exibir configuração: ${error.message || error}`));
      return 0;
    }
  };
});
