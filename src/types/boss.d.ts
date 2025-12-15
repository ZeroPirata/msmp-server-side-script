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

interface IPlayerScaling {
  healthFactor?: number; // Ex: 1.0 (100% da vida base extra por jogador)
  attackFactor?: number; // Ex: 0.25 (25% do ataque base extra por jogador)
  armorFactor?: number; // 3. Fator de Armadura/Defesa (Opcional, se o boss for muito focado em defesa)
  dropMultiplierFactor?: number; // 4. Fator de Drops (Opcional: Aumentar a chance/quantidade total de drops)
}
