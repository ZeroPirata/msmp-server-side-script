function applyEquipmentToBoss(boss: $LivingEntity, equipment: IEquipment): void {
  if (!equipment) return;
  function processEnchantments(config: any): { [key: string]: number } {
    let finalEnchantments: { [key: string]: number } = {};
    if (config.guaranteed) {
      Object.keys(config.guaranteed).forEach((enchId) => {
        finalEnchantments[enchId] = config.guaranteed[enchId];
      });
    }
    if (config.possible) {
      config.possible.forEach((ench) => {
        let roll = Math.random();
        if (roll <= ench.chance) {
          let level = randomBetween(ench.minLevel, ench.maxLevel);
          finalEnchantments[ench.id] = level;
          console.log(`[EQUIPMENT] Encantamento aleatório: ${ench.id} ${level}`);
        }
      });
    }
    return finalEnchantments;
  }

  function createEquipmentItem(config: any): $ItemStack {
    let item = Item.of(config.id, config.count || 1);
    if (config.enchantments) {
      let enchants;
      if (config.enchantments.possible || config.enchantments.guaranteed) {
        enchants = processEnchantments(config.enchantments);
      } else {
        enchants = config.enchantments;
      }
      Object.keys(enchants).forEach((enchId) => {
        item.enchant(enchId, enchants[enchId]);
      });
    }

    if (config.nbt) {
      try {
        if (!item.nbt) {
          item.nbt = {};
        }
        Object.keys(config.nbt).forEach((key) => {
          let value = config.nbt[key];
          if (typeof value === "string") {
            item.nbt.putString(key, value);
          } else if (typeof value === "number") {
            if (Number.isInteger(value)) {
              item.nbt.putInt(key, value);
            } else {
              item.nbt.putFloat(key, value);
            }
          } else if (typeof value === "boolean") {
            item.nbt.putBoolean(key, value);
          } else if (typeof value === "object") {
            item.nbt.putString(key, JSON.stringify(value));
          }
        });
      } catch (error) {
        console.error(`[EQUIPMENT] Erro ao aplicar NBT: ${error}`);
      }
    }
    return item;
  }

  if (equipment.mainHand) {
    boss.mainHandItem = createEquipmentItem(equipment.mainHand);
  }

  if (equipment.offHand) {
    boss.offHandItem = createEquipmentItem(equipment.offHand);
  }

  if (equipment.head) {
    boss.headArmorItem = createEquipmentItem(equipment.head);
  }

  if (equipment.chest) {
    boss.chestArmorItem = createEquipmentItem(equipment.chest);
  }

  if (equipment.legs) {
    boss.legsArmorItem = createEquipmentItem(equipment.legs);
  }

  if (equipment.feet) {
    boss.feetArmorItem = createEquipmentItem(equipment.feet);
  }
}

function spawnMinion(level: $ServerLevel, pos: $BlockPos, config: IMinionConfig): void {
  for (let i = 0; i < config.count; i++) {
    let angle = ((Math.PI * 2) / config.count) * i;
    let offsetX = Math.cos(angle) * 3;
    let offsetZ = Math.sin(angle) * 3;
    let minion = level.createEntity(config.id);
    if (!minion) continue;
    minion.setPos(pos.x + offsetX, pos.y, pos.z + offsetZ);
    if (minion.isLiving()) {
      let living = minion as $LivingEntity;
      living.persistentData.putString("minion_type", config.classe);
      if (config.attributes) {
        if (config.attributes.health) {
          living.maxHealth = config.attributes.health;
          living.health = config.attributes.health;
        }
        if (config.attributes.damage) {
          living.setAttributeBaseValue("minecraft:generic.attack_damage", config.attributes.damage);
        }
        if (config.attributes.speed) {
          living.setAttributeBaseValue("minecraft:generic.movement_speed", config.attributes.speed);
        }
        if (config.attributes.armor) {
          living.setAttributeBaseValue("minecraft:generic.armor", config.attributes.armor);
        }
      }
      if (config.equipment) {
        applyEquipmentToBoss(living, config.equipment);
      }
      if (config.potionEffects) {
        config.potionEffects.forEach((effect) => {
          living.potionEffects.add(effect.id, effect.duration, effect.amplifier, false, false);
        });
      }
      if (config.abilities && config.abilities.length > 0) {
        living.persistentData.putBoolean("kubejs_personalized_minion", true);
        living.persistentData.putString("kubejs_minion_abilities", JSON.stringify(config.abilities));
        living.persistentData.putInt("kubejs_minion_lastAbilityTick", level.server.getTickCount());
      }
      if (config.name) {
        living.customName = Text.of(config.name);
        living.setCustomNameVisible(true);
      }
    }
    minion.spawn();
  }
}
