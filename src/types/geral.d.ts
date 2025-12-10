// Interfaces globais para o projeto

// Interface para scaling de inimigos baseado no número de jogadores
interface IPlayerScaling {
  // 1. Fator de Vida (Essencial)
  // Ex: 1.0 (100% da vida base extra por jogador)
  healthFactor?: number;

  // 2. Fator de Dano (Altamente Recomendado)
  // Ex: 0.25 (25% do ataque base extra por jogador)
  attackFactor?: number;

  // 3. Fator de Armadura/Defesa (Opcional, se o boss for muito focado em defesa)
  armorFactor?: number;

  // 4. Fator de Drops (Opcional: Aumentar a chance/quantidade total de drops)
  // Isso é diferente de 'lootMultiplier', pois é aplicado dinamicamente
  dropMultiplierFactor?: number;
}

// Interface para inimigos genéricos
interface IEnemy {
  id: string;
  name: string;
  health: number;
  attack: number;
  armor: number;
  armorToughness: number;
  speed: number;
  drops?: IDrops[]; // Itens que o inimigo pode dropar
  equipment?: IEquipment; // Equipamento do inimigo
  scaling?: IPlayerScaling;
}

// Interface para equipamento de entidades
interface IEquipment {
  mainHand?: string; // Item na mão principal
  offHand?: string; // Item na mão secundária
  head?: string; // Capacete
  chest?: string; // Peitoral
  legs?: string; // Calças
  feet?: string; // Botas
  dropChance?: {
    // Chance de dropar cada equipamento ao morrer
    mainHand?: number;
    offHand?: number;
    head?: number;
    chest?: number;
    legs?: number;
    feet?: number;
  };
}

// Interface para definir os drops dos inimigos
interface IDrops {
  itemId: string;
  chance: number;
  min: number;
  max: number;
}

// Interface para configuração de drops
interface ISettingsDrops {
  itemId: string;
  chance: number;
  quantity: number;
}

// Interface para minibosses, que estende a interface IEnemy
interface IMiniBoss extends IEnemy {
  lootrName: string; // Nome do baú lootr associado
  spawnWeight: number; // Peso de spawn em relação a outros minibosses
  specialAbilities: string[]; // Habilidades especiais
  enrageThreshold?: number; // HP que fica enraivecido (50% = 0.5)
  phases?: number; // Quantas fases tem?
  immuneTo?: string[]; // Imune a certos danos
  lootMultiplier?: number; // Boss premium dropa 2x mais
  summonMinions?: boolean; // Spawna ajudantes?
  summonMinionsPerPhase?: number; // Quantos ajudantes por fase?
  summonMinionList: IEnemy[]; // Lista de inimigos que podem ser summonados
}

// Interface para rastrear dano causado por jogadores
interface DamageTracker {
  [playerUuid: string]: {
    playerName: string;
    damage: number;
  };
}

// Interface para entrada de drop
interface DropEntry {
  item: string;
  count: number;
}

// Interface para dados de loot de jogador
interface PlayerLootData {
  drops: DropEntry[];
  damagePercent: number;
  playerUUID: string;
  playerName: string;
  totalDamage: number;
  playerDamage: number;
  bossName: string;
  timestamp: number;
}

// Interface para dados de baú de jogador
interface PlayerChestData {
  lootTable: string; // exemplo: "mybosses:boss/smeagol"
  damagePercent: number; // exemplo: 0.67
  used: boolean; // player já pegou o loot?
  dropMultiplier?: number; // Fator final de multiplicador (Ex: 1.3)
}

// Interface para dados de chave de baú
interface ChestKeyData {
  pos: $BlockPos;
  ticks: number;
}
