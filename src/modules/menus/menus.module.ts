import { Module } from '@nestjs/common';
import { PermissionsGuard } from '../../common/permissions.guard';
import { AuthModule } from '../auth/auth.module';
import { MenusController } from './menus.controller';
import { MenusService } from './menus.service';

@Module({ imports: [AuthModule], controllers: [MenusController], providers: [MenusService, PermissionsGuard] })
export class MenusModule {}
