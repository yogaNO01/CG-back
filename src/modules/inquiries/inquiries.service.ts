import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

type CreateInquiry = {
  companyId: string; productId?: string; skuId?: string; requirement: string; expectedSpec?: string;
  quantity?: string; unit?: string; expectedDeliveryAt?: string; contactName: string; contactPhone: string; contactEmail?: string;
};

@Injectable()
export class InquiriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateInquiry) {
    if (!/^1[3-9]\d{9}$/.test(input.contactPhone.trim())) throw new BadRequestException('请输入有效的中国大陆手机号');
    const merchant = await this.prisma.merchant.findFirst({
      where: { id: input.companyId, status: 'ENABLED', certificationStatus: 'APPROVED' },
    });
    if (!merchant) throw new NotFoundException('店铺不存在或未上线');

    let productNameSnapshot = `${merchant.companyName} 企业咨询`;
    if (input.productId) {
      const product = await this.prisma.product.findFirst({
        where: { id: input.productId, merchantId: merchant.id, status: 'ON_SHELF', deletedAt: null },
        include: { skus: { select: { id: true, enabled: true } } },
      });
      if (!product) throw new NotFoundException('商品不存在、未上架或不属于该店铺');
      if (input.skuId && !product.skus.some((sku) => sku.id === input.skuId && sku.enabled)) {
        throw new BadRequestException('所选规格不存在或不可询价');
      }
      productNameSnapshot = product.name;
    } else if (input.skuId) {
      throw new BadRequestException('未选择商品时不能提交规格');
    }

    return this.prisma.inquiry.create({
      data: {
        merchantId: merchant.id, productId: input.productId, skuId: input.skuId, productNameSnapshot,
        requirement: input.requirement.trim(), expectedSpec: input.expectedSpec?.trim() || null,
        quantity: input.quantity, unit: input.unit?.trim() || null,
        expectedDeliveryAt: input.expectedDeliveryAt ? new Date(input.expectedDeliveryAt) : null,
        contactName: input.contactName.trim(), contactPhone: input.contactPhone.trim(), contactEmail: input.contactEmail?.trim() || null,
      },
      select: { id: true, status: true, createdAt: true },
    });
  }
}
