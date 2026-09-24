import { Module } from '@nestjs/common';
import { PermissionsGuard } from '../../common/permissions.guard';
import { AuthModule } from '../auth/auth.module';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';

@Module({ imports: [AuthModule], controllers: [CategoriesController], providers: [CategoriesService, PermissionsGuard] })
export class CategoriesModule {}
