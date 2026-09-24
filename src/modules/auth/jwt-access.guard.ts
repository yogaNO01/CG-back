import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
@Injectable()
export class JwtAccessGuard implements CanActivate {
  constructor(private readonly jwt: JwtService, private readonly config: ConfigService, private readonly auth: AuthService) {}
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest(); const token = request.headers.authorization?.replace(/^Bearer\s+/i, '');
    if (!token) throw new UnauthorizedException('缺少访问令牌');
    try { const payload=await this.jwt.verifyAsync<{sub:string}>(token,{secret:this.config.getOrThrow('JWT_ACCESS_SECRET')}); const profile=await this.auth.resolveProfile(payload.sub); request.user=profile; return true; } catch { throw new UnauthorizedException('访问令牌无效'); }
  }
}
