import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}
  list() { return this.prisma.role.findMany({ orderBy: { createdAt: 'asc' }, include: { menus: { include: { menu: true } }, _count: { select: { admins: true } } } }); }
  async create(input: { code: string; name: string; description?: string; enabled?: boolean; menuIds?: string[] }) { await this.assertMenus(input.menuIds); const { menuIds = [], ...data } = input; return this.prisma.role.create({ data: { ...data, menus: { create: menuIds.map((menuId) => ({ menuId })) } }, include: { menus: true } }); }
  async update(id: string, input: { code?: string; name?: string; description?: string; enabled?: boolean; menuIds?: string[] }) { const role = await this.get(id); if (role.builtIn && input.code && input.code !== role.code) throw new BadRequestException('内置角色编码不可修改'); await this.assertMenus(input.menuIds); const { menuIds, ...data } = input; return this.prisma.role.update({ where: { id }, data: { ...data, ...(menuIds ? { menus: { deleteMany: {}, create: menuIds.map((menuId) => ({ menuId })) } } : {}) }, include: { menus: true } }); }
  async remove(id: string) { const role = await this.get(id); if (role.builtIn) throw new BadRequestException('内置角色不允许删除'); if (role._count.admins) throw new BadRequestException('角色已分配管理员，不能删除'); await this.prisma.role.delete({ where: { id } }); }
  private async get(id: string) { const role = await this.prisma.role.findUnique({ where: { id }, include: { _count: { select: { admins: true } } } }); if (!role) throw new NotFoundException('角色不存在'); return role; }
  private async assertMenus(ids?: string[]) { if (!ids) return; const count = await this.prisma.menu.count({ where: { id: { in: ids } } }); if (count !== new Set(ids).size) throw new BadRequestException('包含不存在的菜单或权限'); }
}
