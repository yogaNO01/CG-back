import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AdminStatus, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/prisma.service';

type AdminInput = { username: string; password?: string; realName?: string; phone?: string; email?: string; status?: AdminStatus; roleIds?: string[] };

@Injectable()
export class AdminsService {
  constructor(private readonly prisma: PrismaService) {}

  async page(q: { page?: number; pageSize?: number; keywords?: string; status?: AdminStatus }) {
    const page = Math.max(1, q.page ?? 1); const pageSize = Math.min(100, Math.max(1, q.pageSize ?? 20));
    const where: Prisma.AdminWhereInput = { ...(q.status ? { status: q.status } : {}), ...(q.keywords ? { OR: [{ username: { contains: q.keywords } }, { realName: { contains: q.keywords } }, { phone: { contains: q.keywords } }] } : {}) };
    const [items, total] = await this.prisma.$transaction([this.prisma.admin.findMany({ where, skip: (page - 1) * pageSize, take: pageSize, orderBy: { createdAt: 'desc' }, include: { roles: { include: { role: true } } } }), this.prisma.admin.count({ where })]);
    return { items: items.map(({ passwordHash: _, ...admin }) => admin), page, pageSize, total };
  }

  async detail(id: string) { const row = await this.prisma.admin.findUnique({ where: { id }, include: { roles: { include: { role: true } } } }); if (!row) throw new NotFoundException('管理员不存在'); const { passwordHash: _, ...safe } = row; return safe; }

  async create(input: AdminInput) {
    if (!input.password) throw new BadRequestException('初始密码不能为空');
    await this.assertRoles(input.roleIds);
    const passwordHash = await bcrypt.hash(input.password, 12);
    const { roleIds = [], password: _, ...data } = input;
    return this.prisma.admin.create({ data: { ...data, passwordHash, roles: { create: roleIds.map((roleId) => ({ roleId })) } }, include: { roles: { include: { role: true } } } });
  }

  async update(id: string, input: Partial<AdminInput>, actorId: string) {
    const admin = await this.detail(id); await this.assertNotProtected(admin.roles.map(({ role }) => role.code), actorId, id);
    await this.assertRoles(input.roleIds); const { roleIds, password: _, ...data } = input;
    return this.prisma.admin.update({ where: { id }, data: { ...data, ...(roleIds ? { roles: { deleteMany: {}, create: roleIds.map((roleId) => ({ roleId })) } } : {}) }, include: { roles: { include: { role: true } } } });
  }

  async resetPassword(id: string, password: string, actorId: string) { const admin = await this.detail(id); await this.assertNotProtected(admin.roles.map(({ role }) => role.code), actorId, id); return this.prisma.admin.update({ where: { id }, data: { passwordHash: await bcrypt.hash(password, 12) } }); }
  async setStatus(id: string, status: AdminStatus, actorId: string) { if (id === actorId && status === 'DISABLED') throw new BadRequestException('不能禁用自己'); const admin = await this.detail(id); await this.assertNotProtected(admin.roles.map(({ role }) => role.code), actorId, id); return this.prisma.admin.update({ where: { id }, data: { status } }); }

  private async assertRoles(roleIds?: string[]) { if (!roleIds) return; const count = await this.prisma.role.count({ where: { id: { in: roleIds } } }); if (count !== new Set(roleIds).size) throw new BadRequestException('包含不存在的角色'); }
  private async assertNotProtected(targetRoles: string[], actorId: string, targetId: string) { if (!targetRoles.includes('SUPER_ADMIN')) return; const actor = await this.detail(actorId); if (!actor.roles.some(({ role }) => role.code === 'SUPER_ADMIN') || actorId !== targetId) throw new BadRequestException('禁止修改超级管理员'); }
}
