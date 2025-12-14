ServerEvents.recipes((r) => {
  r.remove({ output: "minecraft:ender_eye" });
  r.shaped(Item.of("minecraft:ender_eye", 1), [" P ", " E ", "GGG"], {
    P: Item.of("minecraft:blaze_powder"),
    E: Item.of("minecraft:ender_pearl"),
    G: Item.of("minecraft:glowstone_dust")
  });
});
