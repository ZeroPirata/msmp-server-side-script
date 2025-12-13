interface DamageTracker {
  [playerUuid: string]: {
    playerName: string;
    damage: number;
  };
}

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

interface PlayerChestData {
  lootTable: string; // exemplo: "mybosses:boss/smeagol"
  damagePercent: number; // exemplo: 0.67
  used: boolean; // player já pegou o loot?
  dropMultiplier?: number; // Fator final de multiplicador (Ex: 1.3)
}

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

interface ICrystalData {
  pos: $BlockPos;
  activeTime: number; // Ticks que ficou ativo
  destroyed: boolean;
  respawnAt?: number; // Tick de respawn
}
