import { Module } from '@nestjs/common';
import { PermissionsGuard } from '../../common/permissions.guard';
import { AuthModule } from '../auth/auth.module';
import { AdminsController } from './admins.controller';
import { AdminsService } from './admins.service';

@Module({ imports: [AuthModule], controllers: [AdminsController], providers: [AdminsService, PermissionsGuard] })
export class AdminsModule {}
