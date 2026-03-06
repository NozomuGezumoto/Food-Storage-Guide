export type StorageType = 'fridge' | 'freezer' | 'room';

export type FoodCategory =
  | 'dairy_eggs'
  | 'seafood_meat'
  | 'vegetables'
  | 'fruits'
  | 'bread_grains'
  | 'condiments_pantry'
  | 'prepared_meals'
  | 'plant_protein';

export type RangeByStorage = {
  /** min〜max は両端含む（有効な日数は min, min+1, …, max の max - min + 1 個） */
  fridge?: { min: number; max: number };
  freezer?: { min: number; max: number };
  room?: { min: number; max: number };
};

export type DefaultNotifyDaysByStorage = {
  fridge?: number;
  freezer?: number;
  room?: number;
};

export interface FoodMaster {
  id: string;
  name: string;
  /** Japanese display name (for i18n and search) */
  nameJa: string;
  /** Alternative names for search (e.g. scallion for green onion) */
  aliases: string[];
  category: FoodCategory;
  storageOptions: StorageType[];
  defaultStorage: StorageType;
  rangeDaysByStorage: RangeByStorage;
  defaultNotifyDaysByStorage: DefaultNotifyDaysByStorage;
  tips: string[];
  note: string;
}

export interface PurchaseItem {
  id: string;
  foodId: string;
  foodName: string;
  storage: StorageType;
  purchasedAt: number;
  notifyDays: number;
  notifyAt: number;
  photoUri?: string;
  region?: string;
  notifyDayBefore: boolean;
  notifyOnDay: boolean;
  notificationIds?: { dayBefore?: string; onDay?: string };
  /** 食べたとして一覧から外した日時（履歴に残す） */
  eatenAt?: number;
  /** メモ（任意） */
  memo?: string;
}
