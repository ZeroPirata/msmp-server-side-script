ServerEvents.recipes((r) => {
  r.remove({ id: "endrem:undead_eye" });
  r.remove({ id: "endrem:witch_eye" });
  r.remove({ id: "endrem:exotic_eye" });

  const itemsToRemove = [
    "immersive_aircraft:hull",
    "immersive_aircraft:engine",
    "immersive_aircraft:boiler",
    "immersive_aircraft:sail",
    "immersive_aircraft:propeller",
    "immersive_aircraft:industrial_gears",
    "immersive_aircraft:bomb_bay",
    "immersive_aircraft:enhanced_propeller",
    "immersive_aircraft:eco_engine",
    "immersive_aircraft:nether_engine",
    "immersive_aircraft:steel_boiler",
    "immersive_aircraft:sturdy_pipes",
    "immersive_aircraft:gyroscope",
    "immersive_aircraft:electronic_gyroscope",
    "immersive_aircraft:advanced_gyroscope",
    "immersive_aircraft:hull_reinforcement",
    "immersive_aircraft:improved_landing_gear",
    "immersive_aircraft:gyroscope",
    "immersive_aircraft:gyroscope_dials",
    "immersive_aircraft:heavy_crossbow"
  ];

  itemsToRemove.forEach((item) => {
    r.remove({
      output: item,
      mod: "immersive_aircraft"
    });
  });
});
