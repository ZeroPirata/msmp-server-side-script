ServerEvents.recipes((r) => {
  r.remove({ output: "minecraft:ender_eye" });
  r.shaped(Item.of("minecraft:ender_eye", 1), [" P ", " E ", "GGG"], {
    P: Item.of("minecraft:blaze_powder"),
    E: Item.of("minecraft:ender_pearl"),
    G: Item.of("minecraft:glowstone_dust")
  });

  let backpacks = ["copper_backpack", "gold_backpack", "diamond_backpack", "iron_backpack"];
  backpacks.forEach((backpack) => {
    r.remove({ output: `sophisticatedbackpacks:${backpack}` });
  });

  r.shaped(Item.of("sophisticatedbackpacks:copper_backpack", 1), ["LBL", "BMB", "LBL"], {
    L: Item.of("minecraft:copper_ingot"),
    B: Item.of("minecraft:copper_block"),
    M: Item.of("sophisticatedbackpacks:backpack")
  });

  r.shaped(Item.of("sophisticatedbackpacks:iron_backpack", 1), ["LBL", "BMB", "LBL"], {
    L: Item.of("minecraft:iron_ingot"),
    B: Item.of("minecraft:iron_block"),
    M: Item.of("sophisticatedbackpacks:copper_backpack")
  });

  r.shaped(Item.of("sophisticatedbackpacks:gold_backpack", 1), ["LBL", "BMB", "LBL"], {
    L: Item.of("minecraft:gold_ingot"),
    B: Item.of("minecraft:gold_block"),
    M: Item.of("sophisticatedbackpacks:iron_backpack")
  });

  r.shaped(Item.of("sophisticatedbackpacks:diamond_backpack", 1), ["LBL", "BMB", "LBL"], {
    L: Item.of("minecraft:diamond"),
    B: Item.of("minecraft:diamond_block"),
    M: Item.of("sophisticatedbackpacks:gold_backpack")
  });

  let upgrades = ["inception_upgrade", "feeding_upgrade", "smelting_upgrade", "smoking_upgrade", "blasting_upgrade", "stack_upgrade_tier_1", "tool_swapper_upgrade"];
  upgrades.forEach((upgrade) => {
    r.remove({ output: `sophisticatedbackpacks:${upgrade}` });
  });

  r.shaped(Item.of("sophisticatedbackpacks:inception_upgrade", 1), ["ENE", "BMB", "EBE"], {
    E: "minecraft:ender_eye",
    N: "minecraft:nether_star",
    B: "minecraft:diamond_block",
    M: "sophisticatedbackpacks:iron_backpack"
  });

  r.shaped(Item.of("sophisticatedbackpacks:feeding_upgrade", 1), ["CTB", "AMG", "DKP"], {
    C: "minecraft:cake",
    T: "minecraft:golden_carrot"
    B: "minecraft:bread",
    A: "minecraft:golden_apple",
    M: "sophisticatedbackpacks:upgrade_base",
    G: "minecraft:glistering_melon_slice",
    D: "minecraft:cookie",
    K: "minecraft:diamond",
    P: "minecraft:pumpkin_pie",
  });

  r.shaped(Item.of("sophisticatedbackpacks:smelting_upgrade", 1), ["RGR", "IMI", "RFR"], {
    R: "minecraft:redstone",
    G: "minecraft:gold_ingot",
    I: "minecraft:iron_ingot",
    M: "sophisticatedbackpacks:upgrade_base",
    F: "minecraft:furnace"
  });

  r.shaped(Item.of("sophisticatedbackpacks:smoking_upgrade", 1), ["RGR", "IMI", "RFR"], {
    R: "minecraft:apple",
    G: "minecraft:golden_carrot",
    I: "minecraft:bread",
    M: "sophisticatedbackpacks:smelting_upgrade",
    F: "minecraft:smoker"
  });

  r.shaped(Item.of("sophisticatedbackpacks:blasting_upgrade", 1), ["RGR", "IMI", "RFR"], {
    R: "minecraft:diamond",
    G: "minecraft:gold_ingot",
    I: "minecraft:iron_ingot",
    M: "sophisticatedbackpacks:smelting_upgrade",
    F: "minecraft:blast_furnace"
  });

  r.shaped(Item.of("sophisticatedbackpacks:stack_upgrade_tier_1", 1), ["III", "IMI", "III"], {
    I: "minecraft:iron_block",
    M: "sophisticatedbackpacks:stack_upgrade_starter_tier",
  });

  r.shaped(Item.of("sophisticatedbackpacks:tool_swapper_upgrade", 1), ["RSR", "PMA", "RPR"], {
    R: "minecraft:redstone",
    S: "minecraft:iron_sword",
    P: "minecraft:iron_pickaxe",
    A: "minecraft:iron_axe",
    P: "minecraft:iron_shovel",
    M: "sophisticatedbackpacks:upgrade_base",
  });

  r.remove({ output: `nether_remastered:seal_of_the_underworld_item`  })
});
