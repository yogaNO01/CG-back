import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

export type CategoryInput = { name: string; parentId?: string | null; icon?: string; sortOrder?: number; enabled?: boolean };

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async tree() {
    const rows = await this.prisma.category.findMany({ orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] });
    const build = (parentId: string | null): unknown[] => rows.filter((row) => row.parentId === parentId).map((row) => ({ ...row, children: build(row.id) }));
    return build(null);
  }

  async create(input: CategoryInput) {
    const parent = input.parentId ? await this.prisma.category.findUnique({ where: { id: input.parentId } }) : null;
    if (input.parentId && !parent) throw new NotFoundException('上级分类不存在');
    if (parent && !parent.enabled) throw new BadRequestException('停用分类下不能新建子分类');
    const level = parent ? parent.level + 1 : 1;
    if (level > 3) throw new BadRequestException('分类最多支持三级');
    return this.prisma.category.create({ data: { ...input, parentId: input.parentId ?? null, level } });
  }

  async update(id: string, input: Partial<CategoryInput>) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('分类不存在');
    if (input.parentId !== undefined && input.parentId !== category.parentId) throw new BadRequestException('分类层级调整请新建后迁移商品');
    return this.prisma.category.update({ where: { id }, data: input });
  }

  async remove(id: string) {
    const category = await this.prisma.category.findUnique({ where: { id }, include: { _count: { select: { children: true, products: true } } } });
    if (!category) throw new NotFoundException('分类不存在');
    if (category._count.children) throw new BadRequestException('存在子分类，不能删除');
    if (category._count.products) throw new BadRequestException('分类下存在商品，不能删除');
    await this.prisma.category.delete({ where: { id } });
  }
}
