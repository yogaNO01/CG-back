import { Body, Controller, Get, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';
import { AuthService } from './auth.service';
import { JwtAccessGuard } from './jwt-access.guard';
class LoginDto { @IsString() username!: string; @IsString() @MinLength(8) password!: string; }
class RefreshDto { @IsString() refreshToken!: string; }
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  @Post('login') login(@Body() dto: LoginDto) { return this.auth.login(dto.username, dto.password); }
  @Post('refresh') async refresh(@Body() dto: RefreshDto) { try { return await this.auth.refresh(dto.refreshToken); } catch { throw new UnauthorizedException('登录态已失效'); } }
  @Get('me') @ApiBearerAuth() @UseGuards(JwtAccessGuard) me(@Req() request: { user: unknown }) { return request.user; }
}
