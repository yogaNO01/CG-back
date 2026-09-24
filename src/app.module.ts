import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { join } from 'node:path';
import { HealthController } from './common/health.controller';
import { PrismaModule } from './common/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { MenusModule } from './modules/menus/menus.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { MerchantsModule } from './modules/merchants/merchants.module';
import { ProductsModule } from './modules/products/products.module';
import { PublicModule } from './modules/public/public.module';
import { AdminsModule } from './modules/admins/admins.module';
import { RolesModule } from './modules/roles/roles.module';
import { OrdersModule } from './modules/orders/orders.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { InquiriesModule } from './modules/inquiries/inquiries.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Local development keeps secrets at the repository root while the
      // container receives them through Docker's env_file mechanism.
      envFilePath: [join(process.cwd(), '.env'), join(process.cwd(), '../.env')],
      validationSchema: Joi.object({
        DATABASE_URL: Joi.string().required(),
        JWT_ACCESS_SECRET: Joi.string().min(32).required(),
        JWT_REFRESH_SECRET: Joi.string().min(32).required(),
        API_PORT: Joi.number().default(3000),
      }),
    }),
    PrismaModule,
    AuthModule,
    MenusModule,
    CategoriesModule,
    MerchantsModule,
    ProductsModule,
    PublicModule,
    AdminsModule,
    RolesModule,
    OrdersModule,
    UploadsModule,
    AuditLogsModule,
    InquiriesModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
