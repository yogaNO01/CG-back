import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAccessGuard } from './jwt-access.guard';
@Module({
  imports: [JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, JwtAccessGuard],
  // Controllers in feature modules resolve guards in their own module context.
  // Re-export JwtModule so JwtAccessGuard can receive JwtService everywhere it is used.
  exports: [AuthService, JwtAccessGuard, JwtModule],
})
export class AuthModule {}
