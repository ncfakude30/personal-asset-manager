import {
    ColumnType,
    Generated,
    Insertable,
    Selectable,
    Updateable,
  } from 'kysely';
  
  // Define the User table interface
  export interface UserTable {
    id: Generated<string>; // Assuming id is auto-generated
    email: string;
  }
  
  // Define the Asset table interface
  export interface AssetTable {
    id: Generated<string>; // Assuming id is auto-generated
    name: string;
    user_id: string;
  }
  
  // Define the AssetDailyPrice table interface
  export interface AssetDailyPriceTable {
    asset_id: string; // Foreign key to Asset
    date: ColumnType<Date, string, string>; // Can be selected as Date, inserted as string
    price: number;
  }
  
  // Main Database interface
  export interface Database {
    user: UserTable;
    asset: AssetTable;
    asset_daily_price: AssetDailyPriceTable;
  }
  
  // Define types for selectable, insertable, and updatable entities
  export type User = Selectable<UserTable>;
  export type NewUser = Insertable<UserTable>;
  export type UserUpdate = Updateable<UserTable>;
  
  export type Asset = Selectable<AssetTable>;
  export type NewAsset = Insertable<AssetTable>;
  export type AssetUpdate = Updateable<AssetTable>;
  
  export type AssetDailyPrice = Selectable<AssetDailyPriceTable>;
  export type NewAssetDailyPrice = Insertable<AssetDailyPriceTable>;
  export type AssetDailyPriceUpdate = Updateable<AssetDailyPriceTable>;
  