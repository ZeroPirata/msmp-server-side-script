// Impede interação com portais
BlockEvents.rightClicked((event) => {
  const player = event.player;
  const block = event.block;

  const blockedPortals = ["minecraft:nether_portal", "minecraft:end_portal_frame", "minecraft:end_portal", "deeperdarker:otherside_portal", "twilightforest:twilight_portal"];

  if (blockedPortals.includes(block.id)) {
    event.cancel();
    player.tell("§cEste portal está desativado!");
  }
});

// Impede o jogador de pisar/entrar nos portais
PlayerEvents.tick((event) => {
  if (event.player.level.time % 20 !== 0) return;
  const player = event.player;
  const blockBelow = player.block;

  // Verifica o bloco que o jogador está pisando
  const blockedPortals = ["minecraft:nether_portal", "minecraft:end_portal", "deeperdarker:otherside_portal", "twilightforest:twilight_portal"];

  if (blockedPortals.includes(blockBelow.id)) {
    // Empurra o jogador para trás
    player.potionEffects.add("minecraft:levitation", 10, 2);
    player.tell("§cVocê não pode entrar neste portal!");
  }
});

// Última linha de defesa: se conseguir mudar de dimensão, teleporta de volta
PlayerEvents.tick((event) => {
  if (event.player.level.time % 20 !== 0) return;
  const player = event.player;
  const dimension = player.level.dimension.toString();
  const blockedDimensions = ["minecraft:the_nether", "minecraft:the_end", "twilightforest:twilight_forest", "deeperdarker:otherside"];

  if (blockedDimensions.includes(dimension)) {
    player.teleportTo("minecraft:overworld", 293, 104, 176, 0, 0);
    player.tell("§cDimensão bloqueada! Retornando ao Overworld...");
  }
});
