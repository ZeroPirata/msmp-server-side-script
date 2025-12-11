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
