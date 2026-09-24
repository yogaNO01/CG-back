import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminStatus } from '@prisma/client';
import { IsArray, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { RequirePermissions } from '../../common/permissions.decorator';
import { PermissionsGuard } from '../../common/permissions.guard';
import { JwtAccessGuard } from '../auth/jwt-access.guard';
import { AdminsService } from './admins.service';
class QueryDto { @IsOptional() @IsString() keywords?: string; @IsOptional() @IsEnum(AdminStatus) status?: AdminStatus; @IsOptional() page?: number; @IsOptional() pageSize?: number; }
class AdminDto { @IsString() username!: string; @IsOptional() @IsString() @MaxLength(128) password?: string; @IsOptional() @IsString() realName?: string; @IsOptional() @IsString() phone?: string; @IsOptional() @IsString() email?: string; @IsOptional() @IsEnum(AdminStatus) status?: AdminStatus; @IsOptional() @IsArray() @IsString({ each: true }) roleIds?: string[]; }
class AdminUpdateDto { @IsOptional() @IsString() username?: string; @IsOptional() @IsString() @MaxLength(128) password?: string; @IsOptional() @IsString() realName?: string; @IsOptional() @IsString() phone?: string; @IsOptional() @IsString() email?: string; @IsOptional() @IsEnum(AdminStatus) status?: AdminStatus; @IsOptional() @IsArray() @IsString({ each: true }) roleIds?: string[]; }
class PasswordDto { @IsString() @MaxLength(128) password!: string; }
class StatusDto { @IsEnum(AdminStatus) status!: AdminStatus; }
@ApiTags('admins') @ApiBearerAuth() @UseGuards(JwtAccessGuard, PermissionsGuard) @Controller('admins')
export class AdminsController { constructor(private readonly admins: AdminsService) {} @Get() @RequirePermissions('admin:read') page(@Query() q: QueryDto) { return this.admins.page(q); } @Get(':id') @RequirePermissions('admin:read') detail(@Param('id') id: string) { return this.admins.detail(id); } @Post() @RequirePermissions('admin:create') create(@Body() dto: AdminDto) { return this.admins.create(dto); } @Patch(':id') @RequirePermissions('admin:update') update(@Param('id') id: string, @Body() dto: AdminUpdateDto, @Req() req: any) { return this.admins.update(id, dto, req.user.userId); } @Patch(':id/password') @RequirePermissions('admin:update') password(@Param('id') id: string, @Body() dto: PasswordDto, @Req() req: any) { return this.admins.resetPassword(id, dto.password, req.user.userId); } @Patch(':id/status') @RequirePermissions('admin:update') status(@Param('id') id: string, @Body() dto: StatusDto, @Req() req: any) { return this.admins.setStatus(id, dto.status, req.user.userId); } }
