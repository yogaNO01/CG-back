import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/prisma.service';
import { Menu, MenuType } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService, private readonly config: ConfigService) {}
  private async profile(adminId: string) {
    const admin = await this.prisma.admin.findUnique({where:{id:adminId},include:{roles:{include:{role:{include:{menus:{include:{menu:true}}}}}}}});
    if (!admin || admin.status !== 'ENABLED') throw new UnauthorizedException('账号不可用');
    const roleCodes = admin.roles.map(({role}) => role.code);
    // Youlai uses ROOT as its built-in super-administrator marker. Keep the
    // domain role code too, so server-side RBAC stays explicit.
    const roles = roleCodes.includes('SUPER_ADMIN') ? [...roleCodes, 'ROOT'] : roleCodes;
    const permissions = [...new Set(admin.roles.flatMap(({role}) => role.menus.map(({menu}) => menu.permissionCode).filter((code): code is string => Boolean(code))))];
    const safeAdmin = { id: admin.id, username: admin.username, realName: admin.realName, roles, permissions };
    // `roles` / `perms` follow the Youlai client contract. `admin` keeps the
    // platform-facing shape explicit for other consumers of this API.
    const permittedMenus = [...new Map(
      admin.roles.flatMap(({ role }) => role.menus.map(({ menu }) => [menu.id, menu] as const)),
    ).values()].filter((menu) => menu.type !== MenuType.BUTTON && menu.enabled);
    return {
      admin: safeAdmin,
      userId: admin.id,
      username: admin.username,
      nickname: admin.realName ?? admin.username,
      roles,
      perms: permissions,
      permissions,
      menus: this.menuTree(permittedMenus),
    };
  }

  private menuTree(menus: Menu[]) {
    const byParent = new Map<string | null, Menu[]>();
    for (const menu of menus) {
      const parentId = menu.parentId && menus.some((item) => item.id === menu.parentId) ? menu.parentId : null;
      byParent.set(parentId, [...(byParent.get(parentId) ?? []), menu]);
    }
    const build = (parentId: string | null): unknown[] => (byParent.get(parentId) ?? [])
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((menu) => ({
        id: menu.id,
        name: menu.name,
        path: menu.path,
        component: menu.component,
        icon: menu.icon,
        children: build(menu.id),
      }));
    return build(null);
  }
  private tokens(subject: string) { return { accessToken:this.jwt.sign({sub:subject},{secret:this.config.getOrThrow('JWT_ACCESS_SECRET'),expiresIn:'15m'}), refreshToken:this.jwt.sign({sub:subject,type:'refresh'},{secret:this.config.getOrThrow('JWT_REFRESH_SECRET'),expiresIn:'7d'}) }; }
  async login(username: string, password: string) {
    const admin = await this.prisma.admin.findUnique({where:{username}});
    if (!admin || admin.status !== 'ENABLED' || !(await bcrypt.compare(password,admin.passwordHash))) throw new UnauthorizedException('用户名或密码错误');
    await this.prisma.admin.update({where:{id:admin.id},data:{lastLoginAt:new Date()}});
    return { ...(await this.profile(admin.id)), ...this.tokens(admin.id) };
  }
  async refresh(refreshToken: string) { const payload = await this.jwt.verifyAsync<{sub:string;type?:string}>(refreshToken,{secret:this.config.getOrThrow('JWT_REFRESH_SECRET')}); if (payload.type !== 'refresh') throw new UnauthorizedException(); return { ...(await this.profile(payload.sub)), ...this.tokens(payload.sub) }; }
  async resolveProfile(adminId: string) { return this.profile(adminId); }
}
