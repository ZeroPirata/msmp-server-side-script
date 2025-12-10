ServerEvents.commandRegistry((event) => {
  let { commands: Commands, arguments: Arguments } = event;

  let displayConfig = (source) => {
    try {
      let config = getMsmpConfig(source.server);
      for (let [key, value] of Object.entries(config)) {
        source.sendSuccess(Component.literal(` §a${key}: §b${value}`), false);
      }
      return 1;
    } catch (error: any) {
      console.error(`[TEST ERROR] ${error}`);
      console.error(`[TEST ERROR] Stack: ${error.stack}`);
      ctx.source.sendFailure(`§cErro: ${error.message || error}`);
      return 0;
    }
  };

  event.register(
    Commands.literal("msmpConfig")
      .requires((s) => s.hasPermission(2))
      .executes((ctx) => displayConfig(ctx.source))
      .then(
        Commands.argument("key", Arguments.STRING.create(event))
          .suggests((ctx, builder) => {
            Object.keys(DEFAULT_CONFIG).forEach((key) => builder.suggest(key));
            return builder.buildFuture();
          })
          .then(
            Commands.argument("value", Arguments.FLOAT.create(event)).executes((ctx) => {
              try {
                let server = ctx.source.server;
                let command = ctx.getInput();
                let key = command.split(" ")[1].toUpperCase();
                let value = parseFloat(command.split(" ")[2]);
                let config = getMsmpConfig(server);
                if (!(key in config)) {
                  ctx.source.sendFailure(Component.literal(`❌ Erro: Chave '${key}' não existe na configuração.`));
                  return 0;
                }
                config[key] = value;
                saveMsmpConfig(server, config);
                ctx.source.sendSuccess(Component.literal(`✅ Configuração '${key}' atualizada para `).green().append(Component.literal(value.toString()).yellow()), true);
                return 1;
              } catch (error: any) {
                console.error(`[TEST ERROR] ${error}`);
                console.error(`[TEST ERROR] Stack: ${error.stack}`);
                ctx.source.sendFailure(`§cErro: ${error.message || error}`);
                return 0;
              }
            })
          )
      )
  );
});
