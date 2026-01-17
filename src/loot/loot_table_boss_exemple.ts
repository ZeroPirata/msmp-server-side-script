LootJS.lootTables((e) => {
  // Tier BAIXO (0-33% contribuição) - pesos normais
  e.create("kubejs:teste_lootr_low").createPool((p) => {
    p.rolls([1, 3]);
    p.addEntry(LootEntry.of("minecraft:rotten_flesh").setCount([10, 20]).withWeight(100));
    p.addEntry(LootEntry.of("minecraft:iron_ingot").setCount([5, 15]).withWeight(80));
    p.addEntry(LootEntry.of("minecraft:gold_ingot").setCount([3, 10]).withWeight(60));
    p.addEntry(LootEntry.of("minecraft:emerald").setCount([3, 8]).withWeight(40));
    p.addEntry(LootEntry.of("minecraft:diamond").setCount([1, 5]).withWeight(20));
    p.addEntry(LootEntry.of("minecraft:netherite_scrap").setCount([1, 3]).withWeight(8));
    p.addEntry(LootEntry.of("minecraft:enchanted_golden_apple").setCount([1, 2]).withWeight(5));
    p.addEntry(LootEntry.of("minecraft:nether_star").setCount([1, 1]).withWeight(2));
    p.addEntry(LootEntry.of("minecraft:elytra").setCount([1, 1]).withWeight(1));
  });

  // Tier MÉDIO (34-66% contribuição) - pesos aumentados em itens raros
  e.create("kubejs:teste_lootr_medium").createPool((p) => {
    p.rolls([2, 4]);
    p.addEntry(LootEntry.of("minecraft:rotten_flesh").setCount([10, 20]).withWeight(80)); // Reduzido
    p.addEntry(LootEntry.of("minecraft:iron_ingot").setCount([5, 15]).withWeight(90)); // Aumentado
    p.addEntry(LootEntry.of("minecraft:gold_ingot").setCount([3, 10]).withWeight(80));
    p.addEntry(LootEntry.of("minecraft:emerald").setCount([3, 8]).withWeight(60));
    p.addEntry(LootEntry.of("minecraft:diamond").setCount([1, 5]).withWeight(35)); // Aumentado
    p.addEntry(LootEntry.of("minecraft:netherite_scrap").setCount([1, 3]).withWeight(15));
    p.addEntry(LootEntry.of("minecraft:enchanted_golden_apple").setCount([1, 2]).withWeight(10));
    p.addEntry(LootEntry.of("minecraft:nether_star").setCount([1, 1]).withWeight(4));
    p.addEntry(LootEntry.of("minecraft:elytra").setCount([1, 1]).withWeight(2));
  });

  // Tier ALTO (67-100% contribuição) - pesos muito aumentados em itens épicos/lendários
  e.create("kubejs:teste_lootr_high").createPool((p) => {
    p.rolls([2, 5]);
    p.addEntry(LootEntry.of("minecraft:rotten_flesh").setCount([10, 20]).withWeight(50)); // Bem reduzido
    p.addEntry(LootEntry.of("minecraft:iron_ingot").setCount([5, 15]).withWeight(100));
    p.addEntry(LootEntry.of("minecraft:gold_ingot").setCount([3, 10]).withWeight(100));
    p.addEntry(LootEntry.of("minecraft:emerald").setCount([3, 8]).withWeight(80));
    p.addEntry(LootEntry.of("minecraft:diamond").setCount([1, 5]).withWeight(50)); // Muito aumentado
    p.addEntry(LootEntry.of("minecraft:netherite_scrap").setCount([1, 3]).withWeight(25));
    p.addEntry(LootEntry.of("minecraft:enchanted_golden_apple").setCount([1, 2]).withWeight(20));
    p.addEntry(LootEntry.of("minecraft:nether_star").setCount([1, 1]).withWeight(8));
    p.addEntry(LootEntry.of("minecraft:elytra").setCount([1, 1]).withWeight(5));
  });
});

LootJS.modifiers((e) => {
  let removeItems = [
    // Ender Remastered itens
    "endrem:black_eye",
    "endrem:evil_eye",
    "endrem:witch_pupil",
    "endrem:guardian_eye",
    "endrem:magical_eye",
    "endrem:undead_eye",
    "endrem:lost_eye",
    "endrem:exotic_eye",
    "endrem:cursed_eye",
    "endrem:wither_eye",
    "endrem:nether_eye",
    "endrem:witch_eye",
    "endrem:corrupted_eye",
    "endrem:cold_eye",
    "endrem:cryptic_eye",
    "endrem:old_eye",
    "endrem:rogue_eye",
    // Nether Remastered itens
    "nether_remastered:bottled_nether_essence",
    "nether_remastered:seal_piece_1",
    "nether_remastered:seal_piece_2",
    "nether_remastered:seal_piece_3",
    "nether_remastered:seal_piece_4"
  ];

  e.addTableModifier(/.*/).removeLoot(removeItems);
});
