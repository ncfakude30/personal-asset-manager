// src/assets/dto/assets.dto.ts
import { IsString, IsNumber, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateAssetDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  type: string; // ERC-20 or ERC-721

  @IsString()
  @IsNotEmpty()
  smartContractAddress: string;

  @IsString()
  @IsNotEmpty()
  chain: string;

  @IsOptional()
  @IsString()
  tokenId?: string; // Only for ERC-721

  @IsOptional()
  @IsNumber()
  quantity?: number; // Only for ERC-20
}

export class RemoveAssetDto {
  @IsString()
  @IsNotEmpty()
  assetId: string;
}
