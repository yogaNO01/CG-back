import { InquiriesService } from './inquiries.service';

describe('InquiriesService', () => {
  it('stores a product inquiry with a server-side product-name snapshot', async () => {
    const prisma: any = {
      merchant: { findFirst: jest.fn().mockResolvedValue({ id: 'company-1', companyName: '华东智能装备有限公司' }) },
      product: { findFirst: jest.fn().mockResolvedValue({ id: 'product-1', name: '工业控制终端', skus: [{ id: 'sku-1', enabled: true }] }) },
      inquiry: { create: jest.fn().mockResolvedValue({ id: 'inquiry-1', status: 'SUBMITTED' }) },
    };
    const service = new InquiriesService(prisma);

    await expect(service.create({
      companyId: 'company-1', productId: 'product-1', skuId: 'sku-1', requirement: '采购 20 台',
      quantity: '20.000', unit: '台', contactName: '王先生', contactPhone: '13800138000',
    })).resolves.toEqual({ id: 'inquiry-1', status: 'SUBMITTED' });

    expect(prisma.inquiry.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ merchantId: 'company-1', productId: 'product-1', skuId: 'sku-1', productNameSnapshot: '工业控制终端' }),
    }));
  });

  it('rejects an SKU that is not part of the selected product', async () => {
    const prisma: any = {
      merchant: { findFirst: jest.fn().mockResolvedValue({ id: 'company-1', companyName: '华东智能装备有限公司' }) },
      product: { findFirst: jest.fn().mockResolvedValue({ id: 'product-1', name: '工业控制终端', skus: [{ id: 'sku-1', enabled: true }] }) },
    };
    const service = new InquiriesService(prisma);

    await expect(service.create({ companyId: 'company-1', productId: 'product-1', skuId: 'sku-other', requirement: '询价', contactName: '王先生', contactPhone: '13800138000' }))
      .rejects.toThrow('所选规格不存在或不可询价');
  });
});
