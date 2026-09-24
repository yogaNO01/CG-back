import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAccessGuard } from '../auth/jwt-access.guard';
import { MenusService } from './menus.service';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { MenuType } from '@prisma/client';
import { PermissionsGuard } from '../../common/permissions.guard';
import { RequirePermissions } from '../../common/permissions.decorator';
class MenuDto { @IsOptional() @IsString() parentId?: string; @IsOptional() @IsEnum(MenuType) type?: MenuType; @IsOptional() @IsString() name?: string; @IsOptional() @IsString() path?: string; @IsOptional() @IsString() component?: string; @IsOptional() @IsString() icon?: string; @IsOptional() @IsString() permissionCode?: string; @IsOptional() @IsInt() sortOrder?: number; @IsOptional() @IsBoolean() visible?: boolean; @IsOptional() @IsBoolean() enabled?: boolean; }

@ApiTags('menus')
@ApiBearerAuth()
@UseGuards(JwtAccessGuard, PermissionsGuard)
@Controller('menus')
export class MenusController {
  constructor(private readonly menus: MenusService) {}

  @Get('routes')
  routes(@Req() request: { user: { permissions: string[] } }): Promise<unknown> {
    return this.menus.availableRoutes(request.user.permissions);
  }
  @Get() @RequirePermissions('menu:read') list() { return this.menus.list(); }
  @Post() @RequirePermissions('menu:update') create(@Body() dto: MenuDto) { return this.menus.create(dto as MenuDto & { type: MenuType; name: string }); }
  @Patch(':id') @RequirePermissions('menu:update') update(@Param('id') id: string, @Body() dto: MenuDto) { return this.menus.update(id, dto); }
  @Delete(':id') @RequirePermissions('menu:update') remove(@Param('id') id: string) { return this.menus.remove(id); }
}
