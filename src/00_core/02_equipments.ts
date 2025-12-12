let EquipmentSlot = Java.loadClass("net.minecraft.world.entity.EquipmentSlot");

function applyEquipmentToBoss(boss: $LivingEntity, equipment: IEquipment): void {
  console.log(`[EQUIPMENT] Aplicando equipamento ao boss...`);

  // Função helper para processar encantamentos
  function processEnchantments(config: any): { [key: string]: number } {
    let finalEnchantments: { [key: string]: number } = {};

    // Adiciona encantamentos garantidos
    if (config.guaranteed) {
      Object.keys(config.guaranteed).forEach((enchId) => {
        finalEnchantments[enchId] = config.guaranteed[enchId];
      });
    }

    // Rola encantamentos possíveis
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

  // Função helper para criar item
  function createEquipmentItem(config: any): $ItemStack {
    let item = Item.of(config.id, config.count || 1);

    // Aplica encantamentos
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

    // ===== CORRIGIDO: Aplica NBT customizado =====
    if (config.nbt) {
      try {
        // Garante que o item tem NBT
        if (!item.nbt) {
          item.nbt = {}; // Inicializa se não existir
        }

        Object.keys(config.nbt).forEach((key) => {
          let value = config.nbt[key];

          // Verifica o tipo e usa o método correto
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
            // Para objetos complexos, converte para JSON string
            item.nbt.putString(key, JSON.stringify(value));
          }
        });
      } catch (error) {
        console.error(`[EQUIPMENT] Erro ao aplicar NBT: ${error}`);
      }
    }

    return item;
  }

  // Aplica equipamentos
  if (equipment.mainHand) {
    boss.mainHandItem = createEquipmentItem(equipment.mainHand);
    console.log(`[EQUIPMENT] Mão principal: ${equipment.mainHand.id}`);
  }

  if (equipment.offHand) {
    boss.offHandItem = createEquipmentItem(equipment.offHand);
    console.log(`[EQUIPMENT] Mão secundária: ${equipment.offHand.id}`);
  }

  if (equipment.head) {
    boss.headArmorItem = createEquipmentItem(equipment.head);
    console.log(`[EQUIPMENT] Capacete: ${equipment.head.id}`);
  }

  if (equipment.chest) {
    boss.chestArmorItem = createEquipmentItem(equipment.chest);
    console.log(`[EQUIPMENT] Peitoral: ${equipment.chest.id}`);
  }

  if (equipment.legs) {
    boss.legsArmorItem = createEquipmentItem(equipment.legs);
    console.log(`[EQUIPMENT] Calças: ${equipment.legs.id}`);
  }

  if (equipment.feet) {
    boss.feetArmorItem = createEquipmentItem(equipment.feet);
    console.log(`[EQUIPMENT] Botas: ${equipment.feet.id}`);
  }

  // ===== CONFIGURA CHANCES DE DROP (CORRIGIDO) =====
  if (equipment.dropChance) {
    try {
      // Mão principal
      if (equipment.dropChance.mainHand !== undefined) {
        boss.setDropChance(EquipmentSlot.MAINHAND, equipment.dropChance.mainHand);
        console.log(`[EQUIPMENT] Drop chance mão principal: ${equipment.dropChance.mainHand}`);
      }

      // Mão secundária
      if (equipment.dropChance.offHand !== undefined) {
        boss.setDropChance(EquipmentSlot.OFFHAND, equipment.dropChance.offHand);
        console.log(`[EQUIPMENT] Drop chance mão secundária: ${equipment.dropChance.offHand}`);
      }

      // Armadura
      if (equipment.dropChance.head !== undefined) {
        boss.setDropChance(EquipmentSlot.HEAD, equipment.dropChance.head);
        console.log(`[EQUIPMENT] Drop chance capacete: ${equipment.dropChance.head}`);
      }

      if (equipment.dropChance.chest !== undefined) {
        boss.setDropChance(EquipmentSlot.CHEST, equipment.dropChance.chest);
        console.log(`[EQUIPMENT] Drop chance peitoral: ${equipment.dropChance.chest}`);
      }

      if (equipment.dropChance.legs !== undefined) {
        boss.setDropChance(EquipmentSlot.LEGS, equipment.dropChance.legs);
        console.log(`[EQUIPMENT] Drop chance calças: ${equipment.dropChance.legs}`);
      }

      if (equipment.dropChance.feet !== undefined) {
        boss.setDropChance(EquipmentSlot.FEET, equipment.dropChance.feet);
        console.log(`[EQUIPMENT] Drop chance botas: ${equipment.dropChance.feet}`);
      }
    } catch (error) {
      console.error(`[EQUIPMENT] Erro ao configurar drop chances: ${error}`);
    }
  }

  console.log(`[EQUIPMENT] Equipamento aplicado com sucesso!`);
}

function spawnMinion(level: $ServerLevel, bossPos: $BlockPos, minionConfig: IMinionConfig): $LivingEntity[] {
  let spawnedMinions: $LivingEntity[] = [];
  let count = minionConfig.count || 1;

  console.log(`[MINION] Spawnando ${count}x ${minionConfig.id}...`);

  for (let i = 0; i < count; i++) {
    // Posição aleatória ao redor do boss (raio de 3-5 blocos)
    let angle = Math.random() * 2 * Math.PI;
    let distance = randomBetween(3, 5);
    let offsetX = Math.floor(distance * Math.cos(angle));
    let offsetZ = Math.floor(distance * Math.sin(angle));

    let spawnPos = new BlockPos(bossPos.x + offsetX, bossPos.y, bossPos.z + offsetZ);

    // Encontra posição segura no chão
    let groundY = spawnPos.y;
    while (groundY > level.getMinBuildHeight() && level.getBlockState(new BlockPos(spawnPos.x, groundY, spawnPos.z)).isAir()) {
      groundY--;
    }
    spawnPos = new BlockPos(spawnPos.x, groundY + 1, spawnPos.z);

    // Cria o minion
    let minion = level.createEntity(minionConfig.id);
    if (!minion) {
      console.error(`[MINION] Falha ao criar: ${minionConfig.id}`);
      continue;
    }

    minion.setPos(spawnPos.x + 0.5, spawnPos.y, spawnPos.z + 0.5);

    let living = minion as $LivingEntity;

    // Nome customizado
    if (minionConfig.name) {
      living.setCustomName(minionConfig.name);
      living.setCustomNameVisible(true);
    }

    // Vida customizada
    if (minionConfig.health) {
      living.maxHealth = minionConfig.health;
      living.health = minionConfig.health;
    }

    // Aplica equipamento
    if (minionConfig.equipment) {
      applyEquipmentToBoss(living, minionConfig.equipment);
    }

    // Atributos customizados
    if (minionConfig.attributes) {
      if (minionConfig.attributes.damage !== undefined) {
        living.setAttributeBaseValue("minecraft:generic.attack_damage", minionConfig.attributes.damage);
      }
      if (minionConfig.attributes.speed !== undefined) {
        living.setAttributeBaseValue("minecraft:generic.movement_speed", minionConfig.attributes.speed);
      }
      if (minionConfig.attributes.armor !== undefined) {
        living.setAttributeBaseValue("minecraft:generic.armor", minionConfig.attributes.armor);
      }
      if (minionConfig.attributes.knockbackResistance !== undefined) {
        living.setAttributeBaseValue("minecraft:generic.knockback_resistance", minionConfig.attributes.knockbackResistance);
      }
    }

    // Efeitos de poção
    if (minionConfig.potionEffects) {
      minionConfig.potionEffects.forEach((effect) => {
        living.potionEffects.add(effect.id, effect.duration, effect.amplifier, false, false);
      });
    }

    // Marca como minion do boss
    living.persistentData.putBoolean("kubejs_isMinion", true);
    living.persistentData.putByte("PersistenceRequired", 1);

    // Spawna
    minion.spawn();

    spawnedMinions.push(living);

    // Efeitos visuais
    level.runCommandSilent(`particle minecraft:poof ${spawnPos.x + 0.5} ${spawnPos.y + 1} ${spawnPos.z + 0.5} 0.3 0.5 0.3 0.1 20 force @a`);
    level.runCommandSilent(`playsound minecraft:entity.zombie_villager.converted hostile @a ${spawnPos.x} ${spawnPos.y} ${spawnPos.z} 1 0.8`);

    console.log(`[MINION] Spawnado em X:${spawnPos.x} Y:${spawnPos.y} Z:${spawnPos.z}`);
  }

  return spawnedMinions;
}
