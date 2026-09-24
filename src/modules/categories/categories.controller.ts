import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { RequirePermissions } from '../../common/permissions.decorator';
import { PermissionsGuard } from '../../common/permissions.guard';
import { JwtAccessGuard } from '../auth/jwt-access.guard';
import { CategoriesService } from './categories.service';

class CategoryDto {
  @IsString() @MaxLength(80) name!: string;
  @IsOptional() @IsString() parentId?: string;
  @IsOptional() @IsString() icon?: string;
  @IsOptional() @IsInt() @Min(0) sortOrder?: number;
  @IsOptional() @IsBoolean() enabled?: boolean;
}

@ApiTags('categories')
@ApiBearerAuth()
@UseGuards(JwtAccessGuard, PermissionsGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}
  @Get('tree') @RequirePermissions('category:read') tree() { return this.categories.tree(); }
  @Post() @RequirePermissions('category:create') create(@Body() dto: CategoryDto) { return this.categories.create(dto); }
  @Patch(':id') @RequirePermissions('category:update') update(@Param('id') id: string, @Body() dto: Partial<CategoryDto>) { return this.categories.update(id, dto); }
  @Delete(':id') @RequirePermissions('category:delete') remove(@Param('id') id: string) { return this.categories.remove(id); }
}
