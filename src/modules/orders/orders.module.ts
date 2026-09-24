import { Module } from '@nestjs/common';
import { PermissionsGuard } from '../../common/permissions.guard';
import { AuthModule } from '../auth/auth.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
@Module({ imports: [AuthModule], controllers: [OrdersController], providers: [OrdersService, PermissionsGuard] }) export class OrdersModule {}
