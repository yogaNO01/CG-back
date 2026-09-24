import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

type PageQuery = { page?: number; pageSize?: number; categoryId?: string; companyId?: string; keyword?: string; sort?: string };

@Injectable()
export class PublicService {
  constructor(private readonly prisma: PrismaService) {}

  async categories() {
    const rows = await this.prisma.category.findMany({ where: { enabled: true }, orderBy: { sortOrder: 'asc' } });
    const build = (parentId: string | null): unknown[] => rows.filter((row) => row.parentId === parentId)
      .map((row) => ({ categoryId: row.id, categoryName: row.name, icon: row.icon, level: row.level, children: build(row.id) }));
    return build(null);
  }

  async products(query: PageQuery) {
    const { page, pageSize, skip } = this.pagination(query);
    const where: any = {
      status: 'ON_SHELF', deletedAt: null,
      ...(query.companyId ? { merchantId: query.companyId } : {}),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.keyword ? { OR: [{ name: { contains: query.keyword } }, { spuCode: { contains: query.keyword } }, { brand: { contains: query.keyword } }, { model: { contains: query.keyword } }] } : {}),
    };
    const orderBy: any = query.sort === 'popularity' ? { salesCount: 'desc' } : [{ sortOrder: 'desc' }, { publishedAt: 'desc' }];
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({ where, skip, take: pageSize, orderBy, include: this.productInclude() }),
      this.prisma.product.count({ where }),
    ]);
    return { items: rows.map((row) => this.productCard(row)), page, pageSize, total };
  }

  async product(id: string) {
    const row = await this.prisma.product.findFirst({ where: { id, status: 'ON_SHELF', deletedAt: null }, include: this.productInclude() });
    if (!row) throw new NotFoundException('商品不存在或未上架');
    const defaultSku = this.defaultSku(row.skus);
    return {
      ...this.productCard(row), description: row.detailContent, videoUrls: row.videoUrls ?? [],
      applicationScenarios: row.applicationScenarios ?? [], serviceGuarantees: row.serviceGuarantees ?? [],
      afterSalesService: row.afterSalesService, technicalParameters: row.technicalParameters ?? [], featureTags: row.featureTags ?? [],
      customizationEnabled: row.customizationEnabled, inquiryEnabled: row.inquiryEnabled, minOrderQuantity: String(row.minOrderQuantity),
      unit: row.unit, shipWithinHours: row.shipWithinHours, saleStatus: 'on_sale',
      skus: row.skus.filter((sku: any) => sku.enabled).map((sku: any) => this.sku(sku)),
      defaultSku: defaultSku ? this.sku(defaultSku) : null, company: this.companySummary(row.merchant),
      relatedProducts: await this.relatedProducts(row.merchantId, row.id),
    };
  }

  async companies(query: PageQuery) {
    const { page, pageSize, skip } = this.pagination(query);
    const where: any = { status: 'ENABLED', certificationStatus: 'APPROVED', ...(query.keyword ? { OR: [{ companyName: { contains: query.keyword } }, { shortName: { contains: query.keyword } }] } : {}) };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.merchant.findMany({ where, skip, take: pageSize, orderBy: [{ sortOrder: 'desc' }, { createdAt: 'desc' }], include: { products: { where: { status: 'ON_SHELF', deletedAt: null }, include: { skus: { include: { tierPrices: true } }, images: true }, take: 3 }, _count: { select: { products: { where: { status: 'ON_SHELF', deletedAt: null } } } } } }),
      this.prisma.merchant.count({ where }),
    ]);
    const items = rows.filter((row: any) => !query.categoryId || (Array.isArray(row.mainCategories) && row.mainCategories.includes(query.categoryId)))
      .map((row) => ({ ...this.companySummary(row), featuredProducts: row.products.map((product: any) => this.productCard({ ...product, merchant: row })) }));
    return { items, page, pageSize, total: query.categoryId ? items.length : total };
  }

  async company(id: string) {
    const row = await this.prisma.merchant.findFirst({
      where: { id, status: 'ENABLED', certificationStatus: 'APPROVED' },
      include: { shippingAddresses: { where: { isDefaultShippingAddress: true }, take: 1 }, verifications: true, products: { where: { status: 'ON_SHELF', deletedAt: null }, include: { skus: { include: { tierPrices: true } }, images: true }, take: 6, orderBy: { sortOrder: 'desc' } }, _count: { select: { products: { where: { status: 'ON_SHELF', deletedAt: null } } } } },
    });
    if (!row) throw new NotFoundException('店铺不存在或未上线');
    const address = row.shippingAddresses[0];
    const approved = new Set(row.verifications.filter((item: any) => item.verificationStatus === 'APPROVED').map((item: any) => item.verificationType));
    return {
      ...this.companySummary(row), introduction: row.introduction, mainProductKeywords: row.mainProductKeywords ?? [],
      businessInfo: { companyType: row.companyType, businessStatus: row.businessStatus, legalRepresentative: row.legalRepresentative, registeredCapital: row.registeredCapital?.toFixed(2) ?? null, registeredCapitalCurrency: row.registeredCapitalCurrency, establishedAt: row.establishedAt, businessTermStart: row.businessTermStart, businessTermEnd: row.businessTermEnd, unifiedSocialCreditCodeMasked: this.mask(row.unifiedSocialCreditCode), organizationCode: row.organizationCode, taxpayerId: this.mask(row.taxpayerId), registrationNumber: row.registrationNumber, registeredAddress: row.address, websiteUrl: row.websiteUrl, businessScope: row.businessScope, registrationAuthority: row.registrationAuthority },
      shippingAddress: address ? { provinceCode: address.provinceCode, cityCode: address.cityCode, districtCode: address.districtCode, displayName: `${row.province ?? ''}·${row.city ?? ''}`, addressDetail: address.addressDetail } : null,
      verification: { subjectVerified: approved.has('subject'), factoryAudited: approved.has('factory'), verifiedAt: row.verifications.find((item: any) => item.verifiedAt)?.verifiedAt ?? null },
      products: row.products.map((product: any) => this.productCard({ ...product, merchant: row })),
    };
  }

  async companyProducts(id: string, query: PageQuery) { await this.company(id); return this.products({ ...query, companyId: id }); }

  private productInclude() { return { merchant: true, category: true, skus: { include: { tierPrices: true } }, images: { orderBy: { sortOrder: 'asc' } } } as any; }
  private pagination(query: PageQuery) { const page = Math.max(1, query.page ?? 1); const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20)); return { page, pageSize, skip: (page - 1) * pageSize }; }
  private defaultSku(skus: any[]) { return skus.filter((sku) => sku.enabled).sort((a, b) => a.priceCent - b.priceCent)[0]; }
  private sku(sku: any) { return { skuId: sku.id, skuCode: sku.skuCode, specValues: sku.specValues ?? [{ specName: sku.specName, specValue: sku.specValue }], imageUrl: sku.imageUrl, displayPrice: (sku.priceCent / 100).toFixed(2), priceCurrency: sku.priceCurrency, priceUnit: sku.priceUnit, priceFrom: sku.priceFrom, stockQuantity: String(sku.stockQuantity), stockStatus: sku.stockStatus, tierPrices: sku.tierPrices?.map((tier: any) => ({ minQuantity: tier.minQuantity.toFixed(3), maxQuantity: tier.maxQuantity?.toFixed(3) ?? null, unitPrice: tier.unitPrice.toFixed(2), currency: tier.currency })) ?? [] }; }
  private productCard(row: any) { const sku = this.defaultSku(row.skus); return { productId: row.id, companyId: row.merchantId, spuCode: row.spuCode, productName: row.name, shortDescription: row.shortDescription, categoryId: row.categoryId, categoryName: row.category?.name, brand: row.brand, model: row.model, manufacturer: row.manufacturer, originPlace: row.originPlace, mainImageUrl: row.mainImage ?? row.images?.[0]?.url ?? '', imageUrls: row.imageUrls ?? row.images?.map((image: any) => image.url) ?? [], marketingBadge: row.marketingBadge, sellingPoints: row.sellingPoints ?? [], supplyMethod: row.supplyMethods ?? [row.supplyType.toLowerCase()], salesCount: row.salesCount, viewCount: row.viewCount?.toString(), defaultSku: sku ? this.sku(sku) : null, company: row.merchant ? this.companySummary(row.merchant) : undefined }; }
  private companySummary(row: any) { return { companyId: row.id, shopId: row.shopId, companyName: row.companyName, shortName: row.shortName, logoUrl: row.logo, logoText: row.logoText, themeColor: row.themeColor, mainCategoryIds: row.mainCategories ?? [], serviceCapabilities: this.capabilities(row), statistics: { operatingYears: row.businessYears ?? 0, responseRate: row.responseRate ? `${row.responseRate}.00` : null, onSaleProductCount: row._count?.products ?? row.products?.length ?? 0 }, status: 'online' }; }
  private capabilities(row: any) { const values = ['source_factory']; if (row.supportsCustomization) values.push('customization'); return values; }
  private mask(value?: string | null) { return value ? `${value.slice(0, 4)}${'*'.repeat(Math.max(0, value.length - 8))}${value.slice(-4)}` : null; }
  private async relatedProducts(merchantId: string, productId: string) { const rows = await this.prisma.product.findMany({ where: { merchantId, id: { not: productId }, status: 'ON_SHELF', deletedAt: null }, take: 4, orderBy: { salesCount: 'desc' }, include: this.productInclude() }); return rows.map((row) => this.productCard(row)); }
}
