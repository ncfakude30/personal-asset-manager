import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { AssetsService } from './assets.service';
import { CreateAssetDto } from './dto/assets.dto';
import { AuthGuard } from '../auth/auth.guard';

@ApiTags('Assets')
@Controller('assets')
@UseGuards(AuthGuard) // Applies the AuthGuard to all routes in this controller
export class AssetsController {
  constructor(private assetsService: AssetsService) {}

  @Post()
  @ApiOperation({ summary: "Add a new asset to the user's profile" })
  async addAsset(@Req() req, @Body() assetData: CreateAssetDto) {
    return this.assetsService.addAsset(req?.user?.id, assetData);
  }

  @Delete(':assetId')
  @ApiOperation({ summary: "Remove a specific asset from the user's profile" })
  @ApiParam({ name: 'assetId', description: 'The ID of the asset to remove' })
  async removeAsset(@Req() req, @Param('assetId') assetId: string) {
    return this.assetsService.removeAsset(req?.user?.id, assetId);
  }

  @Get()
  @ApiOperation({ summary: "List all assets in the user's profile" })
  async listAssets(@Req() req) {
    return this.assetsService.listAssets(req?.user?.id);
  }
}
