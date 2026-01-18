import { $LivingEntity } from "net.minecraft.world.entity.LivingEntity";
import { $LivingSpawnEvent$SpecialSpawn } from "net.neoforged.neoforge.event.entity.living.LivingSpawnEvent$SpecialSpawn";

/**
 * Sistema de buff de mobs durante Blood Moon
 * Aumenta vida e dano de TODOS os mobs hostis baseado na quantidade de players online
 */
EntityEvents.spawned((event) => {
  let entity = event.entity;
  if (!entity || !entity.isLiving()) return;

  let living = entity as $LivingEntity;
  let level = living.level;
  if (!level || level.isClientSide()) return;

  // Verificar se é Blood Moon ativa
  if (!currentBloodMoonState || !currentBloodMoonState.isActive) return;

  // Verificar se é mob hostil (não é boss)
  let category = living.type?.category;
  if (!category) return;

  let categoryString = category.toString();
  if (!categoryString.includes("MONSTER")) return;

  if (living.persistentData.contains("kubejs_bossActivated")) return; // Ignorar bosses

  let server = level.server;
  if (!server) return;

  // Contar players online não-espectadores
  let playerCount = server.overworld().players.filter((p) => !p.isSpectator() && p.isAlive()).length;

  if (playerCount === 0) return;

  // Calcular multiplicadores baseados na quantidade de players
  let healthMultiplier = 1.0 + playerCount * 0.5; // +50% de vida por player
  let damageMultiplier = 1.0 + playerCount * 0.3; // +30% de dano por player

  // Aplicar buff de vida
  let baseHealth = living.maxHealth;
  let newHealth = baseHealth * healthMultiplier;
  living.maxHealth = newHealth;
  living.health = newHealth;

  // Aplicar buff de dano através de atributo
  let attackAttribute = living.getAttribute("minecraft:generic.attack_damage");
  if (attackAttribute) {
    let baseAttack = attackAttribute.baseValue;
    attackAttribute.baseValue = baseAttack * damageMultiplier;
  }

  // Aplicar efeitos visuais
  living.potionEffects.add("minecraft:strength", 999999, Math.floor(playerCount / 2), false, false);
  living.potionEffects.add("minecraft:speed", 999999, 0, false, false);

  // Marcar como buffado pela Blood Moon
  living.persistentData.putBoolean("kubejs_blood_moon_buffed", true);
  living.persistentData.putInt("kubejs_blood_moon_player_count", playerCount);

  // Partículas vermelhas ao spawnar
  level.server.scheduleInTicks(5, () => {
    if (living.isAlive()) {
      level.server.runCommandSilent(`particle minecraft:dust 1 0 0 1 ${living.x} ${living.y + 1} ${living.z} 0.5 0.5 0.5 0.1 20 force`);
    }
  });
});
/**
 * Remover buffs de Blood Moon de todos os mobs quando terminar
 */
function removeBloodMoonBuffsFromMobs(server: any): void {
  let overworld = server.overworld();

  // Iterar por todas as entidades do overworld
  overworld.entities.forEach((entity: any) => {
    if (!entity || !entity.isLiving()) return;

    let living = entity as $LivingEntity;

    // Verificar se tem buff de Blood Moon
    if (!living.persistentData.getBoolean("kubejs_blood_moon_buffed")) return;

    // Remover efeitos
    living.potionEffects.removeEffect("minecraft:strength");
    living.potionEffects.removeEffect("minecraft:speed");

    // Resetar vida para o normal (reduzir para vida base)
    let playerCount = living.persistentData.getInt("kubejs_blood_moon_player_count");
    if (playerCount > 0) {
      let healthMultiplier = 1.0 + playerCount * 0.5;
      let baseHealth = living.maxHealth / healthMultiplier;
      living.maxHealth = baseHealth;

      // Ajustar vida atual proporcionalmente
      if (living.health > baseHealth) {
        living.health = baseHealth;
      }

      // Resetar ataque
      let attackAttribute = living.getAttribute("minecraft:generic.attack_damage");
      if (attackAttribute) {
        let damageMultiplier = 1.0 + playerCount * 0.3;
        attackAttribute.baseValue = attackAttribute.baseValue / damageMultiplier;
      }
    }

    // Remover marcadores
    living.persistentData.remove("kubejs_blood_moon_buffed");
    living.persistentData.remove("kubejs_blood_moon_player_count");
  });
}
