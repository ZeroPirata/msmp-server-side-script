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
