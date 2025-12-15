# Tipo de inimigos

### Interface

#### Geral

```typescript
interface IEnemy {
  id: string;
  name: string;
  health: number;
  attack: number;
  armor: number;
  armorToughness: number;
  speed: number;
  drops?: IDrops[];
  equipment?: IEquipment;
}

interface ISettingsEquipment {
  id: string;
  count?: number;
  enchantments?: {
    [enchantmentId: string]: number;
  };
  nbt?: {
    [key: string]: any;
  };
}

interface IRandomEquipment {
  id: string;
  count?: number;
  enchantments?: {
    possible: Array<{
      id: string;
      minLevel: number;
      maxLevel: number;
      chance: number; // 0.0 a 1.0 (100%)
    }>;
    guaranteed?: {
      [enchantmentId: string]: number;
    };
  };
  nbt?: {
    [key: string]: any;
  };
}

interface IEquipment {
  mainHand?: ISettingsEquipment | IRandomEquipment;
  offHand?: ISettingsEquipment | IRandomEquipment;
  head?: ISettingsEquipment | IRandomEquipment;
  chest?: ISettingsEquipment | IRandomEquipment;
  legs?: ISettingsEquipment | IRandomEquipment;
  feet?: ISettingsEquipment | IRandomEquipment;

  dropChance?: {
    mainHand?: number; // 0.0 a 1.0
    offHand?: number;
    head?: number;
    chest?: number;
    legs?: number;
    feet?: number;
  };
}

interface IEquipmentPreset {
  name: string;
  description?: string;
  equipment: IEquipment;
}
```

#### Boss

```typescript
interface IMiniBoss extends IEnemy {
  lootrName: string; // Nome do baú lootr associado
  spawnWeight: number; // Peso de spawn em relação a outros minibosses
  phases?: IBossPhase[]; // ← NOVO: Array de fases
  immuneTo?: string[]; // Imune a certos danos
  lootMultiplier?: number; // Boss premium dropa 2x mais
  scaling?: IPlayerScaling; // Escala com o número de jogadores
  classe:
    | "mage_summoner"
    | "battle_mage"
    | "necromancer"
    | "blood_mage"
    | "crystal_guardian"
    | "tank_brawler"
    | "berserker"
    | "fallen_hero"
    | "armored_juggernaut"
    | "assassin"
    | "archer_sniper"
    | "archer_assassin"
    | "marksman"
    | "elemental_fury"
    | "void_walker"
    | "storm_caller"
    | "plague_bearer";
}
```
##### Habilidades

```typescript
type PhaseAbilityType =
  | "summon_minions"
  | "heal"
  | "buff_attributes"
  | "shoot_projectiles"
  | "aoe_damage"
  | "teleport"
  | "spawn_totems"
  | "weather_change"
  | "potion_effects"
  | "enrage"
  | "projectile_rain"
  | "crystal_phase"
  | "cast_spell";

interface ICrystalConfig {
  crystalBlockType: string; // Ex: "minecraft:end_crystal", "minecraft:beacon"
  crystalCount: number; // Quantos cristais spawnar
  distanceFromBoss: number; // Distância em blocos do boss
  minionSpawnPerCrystal?: IMinionConfig[]; // Minions que spawnam em cada cristal
  ritualHeight: 4; // Altura do ritual (blocos)
  maxRitualTime: 3600; // 3 minutos antes do timeout
  damageBuffPerSecond: number; // Buff de dano por segundo ativo (max 10)
  maxDamageBuff: number; // Cap de dano (padrão: 10)
  respawnTime?: number; // Ticks para cristal respawnar (0 = não respawna)
  particleEffect?: string; // Efeito de partícula no cristal
  protectionRadius?: number; // Raio onde players tomam dano perto do cristal
}

interface IPhaseAbility {
  type: PhaseAbilityType;
  config?: any;
}

interface ICrystalPhaseAbility extends IPhaseAbility {
  type: "crystal_phase";
  config: ICrystalConfig;
}

interface ISummonMinionsAbility extends IPhaseAbility {
  type: "summon_minions";
  config: {
    minions: IMinionConfig[];
    onEnter?: boolean;
    periodic?: {
      intervalTicks: number;
    };
  };
}

interface IHealAbility extends IPhaseAbility {
  type: "heal";
  config: {
    amount?: number; // Quantidade fixa
    percentage?: number; // Ou porcentagem da vida máxima
    onEnter?: boolean; // Cura ao entrar na fase
    periodic?: {
      intervalTicks: number;
      amount: number;
    };
  };
}

interface IBuffAttributesAbility extends IPhaseAbility {
  type: "buff_attributes";
  config: {
    damage?: number; // Multiplica o dano (1.5 = 150%)
    speed?: number;
    armor?: number;
    knockbackResistance?: number;
    potionEffects?: Array<{
      id: string;
      amplifier: number;
    }>;
  };
}

interface IShootProjectilesAbility extends IPhaseAbility {
  type: "shoot_projectiles";
  config: {
    projectileType: string; // "minecraft:arrow", "minecraft:fireball", etc
    intervalTicks: number; // Frequência de tiro
    count?: number; // Quantos projéteis por vez
    spread?: number; // Dispersão (0 = direto, 1 = muito espalhado)
    speed?: number;
  };
}

interface IAoeDamageAbility extends IPhaseAbility {
  type: "aoe_damage";
  config: {
    radius: number;
    damage: number;
    intervalTicks: number;
    particleEffect?: string;
    knockback?: number;
  };
}

interface ITeleportAbility extends IPhaseAbility {
  type: "teleport";
  config: {
    intervalTicks: number;
    radius: number;
    toLowHealthPlayer?: boolean;
  };
}

interface IWeatherChangeAbility extends IPhaseAbility {
  type: "weather_change";
  config: {
    weather: "rain" | "thunder" | "clear";
    onEnter?: boolean;
  };
}

interface IEnrageAbility extends IPhaseAbility {
  type: "enrage";
  config: {
    damageMultiplier: number;
    speedMultiplier: number;
    particleEffect?: boolean;
  };
}

interface IProjectileRainAbility extends IPhaseAbility {
  type: "projectile_rain";
  config: {
    projectileType: string; // "minecraft:arrow", "projectvibrantjourneys:icicle", etc
    intervalTicks: number; // Frequência da chuva
    radius: number; // Raio da área de chuva
    projectileCount: number; // Quantos projéteis por chuva
    fallHeight: number; // Altura de onde os projéteis caem (padrão: 20)
    targetMode: "random" | "players" | "boss"; // Onde a chuva cai
    damage?: number; // Dano customizado (opcional)
    spreadPattern?: "random" | "circle" | "grid"; // Padrão de distribuição
    warningTime?: number; // Ticks de aviso antes de cair (partículas)
    warningParticle?: string; // Partícula de aviso
  };
}

interface ICastSpellAbility extends IPhaseAbility {
  type: "cast_spell";
  config: {
    spellId: string; // Nome do spell (sem "irons_spellbooks:")
    intervalTicks: number; // Frequência de cast
    targetMode: "nearest_player" | "all_players" | "self" | "random_nearby"; // Quem é o alvo
    range?: number; // Alcance para detectar alvos (padrão: 30)
    castCount?: number; // Quantas vezes casta por vez (padrão: 1)
    requiresLineOfSight?: boolean; // Precisa ver o alvo? (padrão: false)
    soundEffectPath?: string; // Som customizado ao castar (opcional)
  };
}

interface IBossPhase {
  threshold: number; // Percentual de vida (0.75 = 75%, 0.5 = 50%, etc)
  name?: string; // Nome da fase (ex: "Fase de Invocação")
  abilities: IPhaseAbility[]; // Lista de habilidades ativas nesta fase
  onEnterMessage?: string; // Mensagem ao entrar na fase
  bossBarColor?: string; // Cor da boss bar nesta fase
  bossBarOverlay?: string; // Overlay da boss bar
}

```

#### Minions

```typescript
interface ISummonMinions {
  enabled: boolean;
  triggers?: Array<{
    healthPercentage: number;
    minions: IMinionConfig[];
    maxSpawns?: number;
    cooldown?: number;
  }>;
  onDeath?: {
    minions: IMinionConfig[];
  };
  periodic?: {
    intervalTicks: number;
    minions: IMinionConfig[];
  };
}

interface IMinionConfig {
  id: string;
  name?: string;
  count?: number;
  health?: number;
  equipment?: IEquipment;
  classe:
    | "mage"
    | "summoner"
    | "necromancer_minion"
    | "break"
    | "battle_mage_minion"
    | "warrior"
    | "knight"
    | "berserker_minion"
    | "tank"
    | "guardian"
    | "archer"
    | "ranger"
    | "sniper"
    | "support"
    | "healer"
    | "cleric"
    | "assassin"
    | "rogue"
    | "bomber"
    | "exploder"
    | "shielder";
  attributes?: {
    damage?: number;
    speed?: number;
    armor?: number;
    knockbackResistance?: number;
  };
  potionEffects?: Array<{
    id: string;
    duration: number;
    amplifier: number;
  }>;
  dropChance?: number;
  abilities?: IMinionAbility[];
}

interface IMinionAbility {
  type: "cast_spell" | "shoot_projectile" | "aoe_attack";
  config: {
    // Para cast_spell
    spellId?: string;

    // Para shoot_projectile
    projectileType?: string;

    // Geral
    intervalTicks: number;
    range?: number;
    targetMode?: "nearest_enemy" | "random_enemy";
  };
}
```

### BOSSES:

| Tipo               | Comportamento           | Melhor Para              |
| ------------------ | ----------------------- | ------------------------ |
| `mage_summoner`    | Foge longe + invoca     | Necromantes, invocadores |
| `battle_mage`      | Distância média + melee | Híbridos mágicos         |
| `blood_mage`       | Médio alcance + healing | Irmão Sangue             |
| `crystal_guardian` | Defensivo + área        | Boss dos cristais        |
| `tank_brawler`     | Lento tanque melee      | Boss resistente          |
| `berserker`        | Agressivo rápido        | Boss de DPS              |
| `assassin`         | Hit and run             | Boss evasivo             |
| `archer_sniper`    | Longe + preciso         | Boss ranged              |
| `void_walker`      | Teleporte + melee       | Boss dimensional         |
| `storm_caller`     | AOE ranged              | Boss elemental           |

### MINIONS:

| Tipo                 | Comportamento              |
| -------------------- | -------------------------- |
| `mage` / `summoner`  | Foge + casta spells        |
| `warrior` / `knight` | Melee agressivo            |
| `tank` / `guardian`  | Melee lento tanky          |
| `archer` / `ranger`  | Ranged + kiting            |
| `support` / `healer` | Foge muito + buffs         |
| `assassin` / `rogue` | Hit and run rápido         |
| `bomber`             | Corre pro player + explode |

# Exemplo de Skills

## Habilidade de Boss

### 1. SUMMON_MINIONS (Invocar Minions)

```json
{
  "type": "summon_minions",
  "config": {
    "minions": [
      {
        "id": "minecraft:zombie",
        "name": "§cGuardião Morto-Vivo",
        "count": 2,
        "health": 50
      },
      {
        "id": "minecraft:skeleton",
        "name": "§eArqueiro Esquelético",
        "count": 3,
        "health": 30
      }
    ],
    "onEnter": true,
    "periodic": {
      "intervalTicks": 400
    }
  }
}
```

### 2. HEAL (Curar)

#### Versão com quantidade fixa:

```json
{
  "type": "heal",
  "config": {
    "amount": 100,
    "onEnter": true
  }
}
```

#### Versão com porcentagem:

```json
{
  "type": "heal",
  "config": {
    "percentage": 0.25,
    "onEnter": true
  }
}
```

#### Versão com cura periódica:

```json
{
  "type": "heal",
  "config": {
    "percentage": 0.2,
    "onEnter": true,
    "periodic": {
      "intervalTicks": 200,
      "amount": 50
    }
  }
}
```

### 3. BUFF_ATTRIBUTES (Aumentar Atributos)

```json
{
  "type": "buff_attributes",
  "config": {
    "damage": 1.5,
    "speed": 1.3,
    "armor": 10,
    "knockbackResistance": 0.5,
    "potionEffects": [
      {
        "id": "minecraft:strength",
        "amplifier": 2
      },
      {
        "id": "minecraft:resistance",
        "amplifier": 1
      },
      {
        "id": "minecraft:speed",
        "amplifier": 1
      }
    ]
  }
}
```

### 4. SHOOT_PROJECTILES (Atirar Projéteis)

#### Arqueiro simples:

```json
{
  "type": "shoot_projectiles",
  "config": {
    "projectileType": "minecraft:arrow",
    "intervalTicks": 40,
    "count": 1,
    "speed": 2.0
  }
}
```

#### Metralhadora de flechas:

```json
{
  "type": "shoot_projectiles",
  "config": {
    "projectileType": "minecraft:arrow",
    "intervalTicks": 10,
    "count": 5,
    "spread": 0.3,
    "speed": 2.5
  }
}
```

#### Atirador de bolas de fogo:

```json
{
  "type": "shoot_projectiles",
  "config": {
    "projectileType": "minecraft:fireball",
    "intervalTicks": 60,
    "count": 1,
    "speed": 1.5
  }
}
```

#### Shotgun (espalhamento):

```json
{
  "type": "shoot_projectiles",
  "config": {
    "projectileType": "minecraft:arrow",
    "intervalTicks": 30,
    "count": 8,
    "spread": 0.8,
    "speed": 2.0
  }
}
```

### 5. AOE_DAMAGE (Dano em Área)

### Explosão básica:

```json
{
  "type": "aoe_damage",
  "config": {
    "radius": 8,
    "damage": 10,
    "intervalTicks": 100
  }
}
```

### Explosão com knockback e efeitos:

```json
{
  "type": "aoe_damage",
  "config": {
    "radius": 10,
    "damage": 15,
    "intervalTicks": 150,
    "particleEffect": "minecraft:soul_fire_flame",
    "knockback": 2.5
  }
}
```

### Pulso rápido:

```json
{
  "type": "aoe_damage",
  "config": {
    "radius": 5,
    "damage": 5,
    "intervalTicks": 40,
    "particleEffect": "minecraft:electric_spark",
    "knockback": 0.5
  }
}
```

### 6. TELEPORT (Teleporte)

### Teleporte aleatório:

```json
{
  "type": "teleport",
  "config": {
    "intervalTicks": 200,
    "radius": 15
  }
}
```

### Teleporte para jogador com menos vida:

```json
{
  "type": "teleport",
  "config": {
    "intervalTicks": 300,
    "radius": 20,
    "toLowHealthPlayer": true
  }
}
```

### 7. WEATHER_CHANGE (Mudar Clima)

### Chuva:

```json
{
  "type": "weather_change",
  "config": {
    "weather": "rain",
    "onEnter": true
  }
}
```

### Tempestade:

```json
{
  "type": "weather_change",
  "config": {
    "weather": "thunder",
    "onEnter": true
  }
}
```

### Limpar:

```json
{
  "type": "weather_change",
  "config": {
    "weather": "clear",
    "onEnter": true
  }
}
```

### 8. ENRAGE (Enraivecer)

### Enrage básico:

```json
{
  "type": "enrage",
  "config": {
    "damageMultiplier": 2.0,
    "speedMultiplier": 1.5
  }
}
```

### Enrage com efeitos visuais:

```json
{
  "type": "enrage",
  "config": {
    "damageMultiplier": 2.5,
    "speedMultiplier": 1.8,
    "particleEffect": true
  }
}
```

## Habilidade de minions

### AOE Ataque

```json
{
  "type": "aoe_attack",
  "config": {
    "intervalTicks": 100,
    "range": 4
  }
}
```

### Usar Mágia

```json
{
  "type": "cast_spell",
  "config": {
    "spellId": "summon_vex",
    "intervalTicks": 200,
    "range": 30
  }
}
```

### Atirar Projetil

```json
{
  "type": "shoot_projectile",
  "config": {
    "projectileType": "minecraft:arrow",
    "intervalTicks": 40,
    "range": 25
  }
}
```

# Inimigos

## Boss

- minecraft:skeleton
- minecraft:zombie
- born_in_chaos_v1:fallen_chaos_knight
- irons_spellbooks:necromancer
- minecraft:wither_skeleton
- born_in_chaos_v1:bloody_gadfly
- twilightforest:yeti
- cataclysm:royal_draugr
- irons_spellbooks:cryomancer
- irons_spellbooks:archevoker
- cataclysm:cindaria
- cataclysm:elite_draugr
- cataclysm:the_prowler
- cataclysm:hippocamtus
- born_in_chaos_v1:skeleton_thrasher

## Minions

- minecraft:zombie
- minecraft:zombie_villager
- minecraft:pillager
- minecraft:skeleton
- minecraft:evoker
- minecraft:creeper

# Speels

## AOE

- scorch
- alshanex_familiars:explosion_melody
- cataclysm_spellbooks:bone_storm
- cataclysm_spellbooks:gravity_storm
- cataclysm_spellbooks:hellish_blade
- cataclysm_spellbooks:malevolent_battlefield
- cataclysm_spellbooks:tectonic_tremble
- cataclysm_spellbooks:void_beam
- cataclysm_spellbooks:void_rune
- earthquake
- ice_block
- starfall
- thunderstorm
- firefly_swarm

## Shot

- snowball
- shadow_slash
- magic_missile
- icicle
- wall_of_fire
- ray_of_frost
- flaming_barrage
- devour
- flaming_strike
- electrocute
- chain_lightning
- cataclysm_spellbooks:infernal_strike
- alshanex_familiars:default_note
- alshanex_familiars:harp_symphony
- alshanex_familiars:music_bolt
- magic_arrow
- ball_lightning
- blaze_storm
- cataclysm_spellbooks:abyssal_blast
- cataclysm_spellbooks:abyss_fireball
- cataclysm_spellbooks:desert_winds
- cone_of_cold
- fire_arrow
- firebolt

## Dash

- burning_dash
- cataclysm_spellbooks:cursed_rush
- frost_step

## Summon

- [CARANGUEIJO] cataclysm_spellbooks:conjure_amethyst_crab
- [GUARDIAO_DE_FOGO] cataclysm_spellbooks:conjure_ignited_reinforcement
- [UM_KOBOLD_DE_OSSO] cataclysm_spellbooks:conjure_koboldiator
- [ESCRAVOS_DE_OSSO_] cataclysm_spellbooks:conjure_thralls
- [CALANGUINHO] cataclysm_spellbooks:summon_koboleton

## Buff

- fortify
- charge
- healing_circle
- spider_aspect
