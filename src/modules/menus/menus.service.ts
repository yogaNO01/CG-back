import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Menu, MenuType } from '@prisma/client';
import { PrismaService } from '../../common/prisma.service';

type RouteNode = {
  name: string;
  path: string;
  component?: string;
  children?: RouteNode[];
  meta: { title: string; icon?: string; hidden: boolean };
};

@Injectable()
export class MenusService {
  constructor(private readonly prisma: PrismaService) {}

  async availableRoutes(permissions: string[]): Promise<RouteNode[]> {
    const menus = await this.prisma.menu.findMany({
      where: {
        type: { not: MenuType.BUTTON },
        enabled: true,
        OR: [
          { permissionCode: null },
          { permissionCode: { in: permissions } },
          { roles: { some: { role: { menus: { some: { menu: { permissionCode: { in: permissions } } } } } } } },
        ],
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return this.toTree(menus);
  }

  async list() {
    const rows = await this.prisma.menu.findMany({ orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] });
    return this.asTree(rows);
  }

  async create(input: { parentId?: string | null; type: MenuType; name: string; path?: string; component?: string; icon?: string; permissionCode?: string; sortOrder?: number; visible?: boolean; enabled?: boolean }) {
    if (input.parentId) await this.requireMenu(input.parentId);
    return this.prisma.menu.create({ data: { ...input, parentId: input.parentId ?? null } });
  }

  async update(id: string, input: { parentId?: string | null; type?: MenuType; name?: string; path?: string; component?: string; icon?: string; permissionCode?: string; sortOrder?: number; visible?: boolean; enabled?: boolean }) {
    await this.requireMenu(id);
    if (input.parentId === id) throw new BadRequestException('菜单不能作为自己的上级');
    if (input.parentId) await this.requireMenu(input.parentId);
    return this.prisma.menu.update({ where: { id }, data: input });
  }

  async remove(id: string) {
    const menu = await this.prisma.menu.findUnique({ where: { id }, include: { _count: { select: { children: true, roles: true } } } });
    if (!menu) throw new NotFoundException('菜单不存在');
    if (menu._count.children) throw new BadRequestException('存在子菜单，不能删除');
    if (menu._count.roles) throw new BadRequestException('菜单已分配角色，不能删除');
    await this.prisma.menu.delete({ where: { id } });
  }

  private async requireMenu(id: string) { const menu = await this.prisma.menu.findUnique({ where: { id } }); if (!menu) throw new NotFoundException('菜单不存在'); return menu; }
  private asTree(rows: Menu[]) { const byParent = new Map<string | null, Menu[]>(); for (const row of rows) byParent.set(row.parentId, [...(byParent.get(row.parentId) ?? []), row]); const build = (parentId: string | null): unknown[] => (byParent.get(parentId) ?? []).map((row) => ({ ...row, children: build(row.id) })); return build(null); }

  private toTree(menus: Menu[]): RouteNode[] {
    const byParent = new Map<string | null, Menu[]>();
    for (const menu of menus) {
      const key = menu.parentId && menus.some((item) => item.id === menu.parentId) ? menu.parentId : null;
      byParent.set(key, [...(byParent.get(key) ?? []), menu]);
    }
    const build = (parentId: string | null): RouteNode[] =>
      (byParent.get(parentId) ?? []).map((menu) => {
        const children = build(menu.id);
        return {
          // Display names may be Chinese (or otherwise sanitize to the same
          // string), while Vue Router requires route names to be unique.
          // The database id is stable and unique, so use it for the router key.
          name: `menu-${menu.id}`,
          path: menu.path ?? `/${menu.id}`,
          ...(menu.component ? { component: menu.component } : {}),
          ...(children.length ? { children } : {}),
          meta: { title: menu.name, ...(menu.icon ? { icon: menu.icon } : {}), hidden: !menu.visible },
        };
      });
    return build(null);
  }
}
