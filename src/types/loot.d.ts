interface ISettingsDrops {
  itemId: string;
  chance: number;
  quantity: number;
}

interface IDrops {
  itemId: string;
  chance: number;
  min: number;
  max: number;
}

interface DropEntry {
  item: string;
  count: number;
}

interface ChestKeyData {
  pos: $BlockPos;
  ticks: number;
}
