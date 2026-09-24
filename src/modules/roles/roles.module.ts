import { Module } from '@nestjs/common';
import { PermissionsGuard } from '../../common/permissions.guard';
import { AuthModule } from '../auth/auth.module';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
@Module({ imports: [AuthModule], controllers: [RolesController], providers: [RolesService, PermissionsGuard] }) export class RolesModule {}
