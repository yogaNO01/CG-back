import { PublicService } from './public.service';

describe('PublicService', () => {
  const merchant = {
    id: 'company-1', shopId: 'shop-1', companyName: '华东智能装备有限公司', shortName: '华智装备',
    logo: null, logoText: '华智', themeColor: 'blue', mainCategories: ['category-1'], supportsCustomization: true,
    businessYears: 5, responseRate: 98,
  };

  it('builds a nested public category tree', async () => {
    const prisma: any = { category: { findMany: jest.fn().mockResolvedValue([
      { id: 'root', parentId: null, name: '机械设备', icon: 'gear', level: 1 },
      { id: 'leaf', parentId: 'root', name: '包装机', icon: null, level: 2 },
    ]) } };
    const service = new PublicService(prisma);

    await expect(service.categories()).resolves.toEqual([{
      categoryId: 'root', categoryName: '机械设备', icon: 'gear', level: 1,
      children: [{ categoryId: 'leaf', categoryName: '包装机', icon: null, level: 2, children: [] }],
    }]);
  });

  it('serializes decimal prices, SKU tiers and merchant summary for product cards', async () => {
    const product: any = {
      id: 'product-1', merchantId: merchant.id, categoryId: 'category-1', name: '工业控制终端', spuCode: 'QCY-01-001',
      shortDescription: '稳定供货', brand: '华智', model: 'HZ-101', manufacturer: merchant.companyName, originPlace: '江苏苏州',
      mainImage: '/images/product-touch-panel.png', imageUrls: ['/images/product-touch-panel.png'], marketingBadge: 'source_supply',
      sellingPoints: ['支持定制'], supplyMethods: ['spot', 'custom'], supplyType: 'SPOT', salesCount: 12, viewCount: BigInt(99),
      merchant, category: { name: '工控终端' }, images: [],
      skus: [{ id: 'sku-1', skuCode: 'QCY-01-001-STD', specName: '配置', specValue: '标准配置', specValues: null, imageUrl: null, priceCent: 123000, priceCurrency: 'CNY', priceUnit: '台', priceFrom: true, stockQuantity: 24, stockStatus: 'in_stock', enabled: true, tierPrices: [{ minQuantity: { toFixed: () => '1.000' }, maxQuantity: null, unitPrice: { toFixed: () => '1230.00' }, currency: 'CNY' }] }],
    };
    const prisma: any = {
      product: { findMany: jest.fn().mockResolvedValue([product]), count: jest.fn().mockResolvedValue(1) },
      $transaction: jest.fn((queries: Promise<unknown>[]) => Promise.all(queries)),
    };
    const service = new PublicService(prisma);

    const page = await service.products({ page: 1, pageSize: 10 });
    expect(page).toMatchObject({ page: 1, pageSize: 10, total: 1 });
    expect(page.items[0]).toMatchObject({ productId: 'product-1', productName: '工业控制终端', viewCount: '99' });
    expect(page.items[0].defaultSku).toMatchObject({ displayPrice: '1230.00', priceCurrency: 'CNY', stockStatus: 'in_stock' });
    expect(page.items[0].defaultSku?.tierPrices).toEqual([{ minQuantity: '1.000', maxQuantity: null, unitPrice: '1230.00', currency: 'CNY' }]);
  });
});
