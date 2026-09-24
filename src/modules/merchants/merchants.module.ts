import { Module } from '@nestjs/common';
import { PermissionsGuard } from '../../common/permissions.guard';
import { AuthModule } from '../auth/auth.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { MerchantsController } from './merchants.controller';
import { MerchantsService } from './merchants.service';
@Module({ imports:[AuthModule, AuditLogsModule], controllers:[MerchantsController], providers:[MerchantsService, PermissionsGuard] })
export class MerchantsModule {}
