import { PrismaClient, MenuType } from '@prisma/client';
import * as bcrypt from 'bcrypt';
// The procurement site remains JavaScript; this seed deliberately consumes its
// canonical mock catalogue until the public site switches to the API.
// @ts-expect-error JavaScript source has no declaration file.
import { categories as frontendCategories } from '../../index/src/mock/home.js';
const prisma = new PrismaClient();
const permissions = ['merchant:read','merchant:create','merchant:update','merchant:approve','product:read','product:create','product:update','product:approve','product:publish','product:unpublish','category:read','category:create','category:update','category:delete','order:read','order:update','admin:read','admin:create','admin:update','role:read','role:update','menu:read','menu:update'];
async function main() {
  const superRole = await prisma.role.upsert({ where:{code:'SUPER_ADMIN'}, update:{}, create:{code:'SUPER_ADMIN',name:'超级管理员',enabled:true,builtIn:true} });
  const roleEntries = [['OPERATOR','平台运营'],['AUDITOR','审核专员'],['ORDER_CLERK','订单专员'],['VIEWER','只读人员']] as const;
  const roles = new Map<string, string>();
  for (const [code,name] of roleEntries) {
    const role = await prisma.role.upsert({where:{code},update:{},create:{code,name,enabled:true,builtIn:true}});
    roles.set(code, role.id);
  }
  const dashboard = await prisma.menu.upsert({where:{permissionCode:'dashboard:read'},update:{},create:{name:'工作台',type:MenuType.MENU,path:'/dashboard',component:'dashboard/index',icon:'Odometer',permissionCode:'dashboard:read',sortOrder:1}});
  const root = await prisma.menu.upsert({where:{permissionCode:'system:catalog'},update:{},create:{name:'系统管理',type:MenuType.CATALOG,path:'/system',component:'Layout',permissionCode:'system:catalog',sortOrder:100}});
  const businessRoot = await prisma.menu.upsert({where:{permissionCode:'business:catalog'},update:{},create:{name:'业务管理',type:MenuType.CATALOG,path:'/business',component:'Layout',icon:'Monitor',permissionCode:'business:catalog',sortOrder:10}});
  const merchants = await prisma.menu.upsert({where:{permissionCode:'merchant:menu'},update:{},create:{name:'商家管理',type:MenuType.MENU,parentId:businessRoot.id,path:'/business/merchants',component:'business/merchants/index',icon:'OfficeBuilding',permissionCode:'merchant:menu',sortOrder:1}});
  const products = await prisma.menu.upsert({where:{permissionCode:'product:menu'},update:{},create:{name:'商品管理',type:MenuType.MENU,parentId:businessRoot.id,path:'/business/products',component:'business/products/index',icon:'Goods',permissionCode:'product:menu',sortOrder:2}});
  const orders = await prisma.menu.upsert({where:{permissionCode:'order:menu'},update:{},create:{name:'采购订单',type:MenuType.MENU,parentId:businessRoot.id,path:'/business/orders',component:'business/orders/index',icon:'Document',permissionCode:'order:menu',sortOrder:3}});
  const catalog = await prisma.menu.upsert({where:{permissionCode:'category:menu'},update:{},create:{name:'商品分类',type:MenuType.MENU,path:'/catalog/categories',component:'catalog/categories/index',icon:'CollectionTag',permissionCode:'category:menu',sortOrder:20}});
  const admins = await prisma.menu.upsert({where:{permissionCode:'admin:menu'},update:{},create:{name:'管理员管理',type:MenuType.MENU,parentId:root.id,path:'/system/admins',component:'system/admins/index',icon:'User',permissionCode:'admin:menu',sortOrder:1}});
  const rolesMenu = await prisma.menu.upsert({where:{permissionCode:'role:menu'},update:{icon:'UserFilled'},create:{name:'角色权限',type:MenuType.MENU,parentId:root.id,path:'/system/roles',component:'system/roles/index',icon:'UserFilled',permissionCode:'role:menu',sortOrder:2}});
  const menusMenu = await prisma.menu.upsert({where:{permissionCode:'menu:menu'},update:{},create:{name:'菜单管理',type:MenuType.MENU,parentId:root.id,path:'/system/menus',component:'system/menus/index',icon:'Menu',permissionCode:'menu:menu',sortOrder:3}});
  const buttonIds:string[]=[];
  for (const permissionCode of permissions) { const menu=await prisma.menu.upsert({where:{permissionCode},update:{},create:{name:permissionCode,type:MenuType.BUTTON,parentId:root.id,permissionCode,visible:false}}); buttonIds.push(menu.id); }
  await prisma.roleMenu.createMany({data:[dashboard.id, businessRoot.id, merchants.id, products.id, orders.id, catalog.id, root.id, admins.id, rolesMenu.id, menusMenu.id, ...buttonIds].map(menuId=>({roleId:superRole.id,menuId})),skipDuplicates:true});
  const idByPermission = new Map((await prisma.menu.findMany({ where: { permissionCode: { in: permissions } } })).map((menu) => [menu.permissionCode!, menu.id]));
  const grants: Record<string, string[]> = {
    OPERATOR: ['merchant:read','merchant:create','merchant:update','product:read','product:create','product:update','product:publish','product:unpublish','category:read','category:create','category:update','category:delete','order:read','order:update'],
    AUDITOR: ['merchant:read','merchant:approve','product:read','product:approve'],
    ORDER_CLERK: ['order:read','order:update'],
    VIEWER: ['merchant:read','product:read','category:read','order:read'],
  };
  for (const [roleCode, permissionCodes] of Object.entries(grants)) {
    await prisma.roleMenu.createMany({
      data: [dashboard.id, ...(permissionCodes.some((code) => code.startsWith('merchant:')) ? [businessRoot.id, merchants.id] : []), ...(permissionCodes.some((code) => code.startsWith('product:')) ? [businessRoot.id, products.id] : []), ...(permissionCodes.some((code) => code.startsWith('order:')) ? [businessRoot.id, orders.id] : []), ...(permissionCodes.some((code) => code.startsWith('category:')) ? [catalog.id] : []), root.id, ...permissionCodes.map((code) => idByPermission.get(code)!)].map((menuId) => ({ roleId: roles.get(roleCode)!, menuId })),
      skipDuplicates: true,
    });
  }
  const passwordHash=await bcrypt.hash('ChangeMe123!',12);
  const admin=await prisma.admin.upsert({where:{username:'admin'},update:{},create:{username:'admin',passwordHash,realName:'系统管理员'}});
  await prisma.adminRole.upsert({where:{adminId_roleId:{adminId:admin.id,roleId:superRole.id}},update:{},create:{adminId:admin.id,roleId:superRole.id}});
  // Keep the public catalogue and database in sync: level 1 is a homepage
  // category, its groups are level 2, and the group items are level 3.
  for (const [rootOrder, rootData] of frontendCategories.entries()) {
    let rootCategory = await prisma.category.findFirst({ where: { parentId: null, name: rootData.name } });
    if (!rootCategory) rootCategory = await prisma.category.create({ data: { name: rootData.name, icon: rootData.icon, level: 1, sortOrder: rootOrder } });
    for (const [groupOrder, group] of rootData.groups.entries()) {
      let groupCategory = await prisma.category.findFirst({ where: { parentId: rootCategory.id, name: group.title } });
      if (!groupCategory) groupCategory = await prisma.category.create({ data: { parentId: rootCategory.id, name: group.title, level: 2, sortOrder: groupOrder } });
      for (const [itemOrder, item] of group.items.entries()) {
        const exists = await prisma.category.findFirst({ where: { parentId: groupCategory.id, name: item } });
        if (!exists) await prisma.category.create({ data: { parentId: groupCategory.id, name: item, level: 3, sortOrder: itemOrder } });
      }
    }
  }
  // Public catalogue fixtures are server-owned and may be rerun safely. The
  // supplier profiles below are realistic demo records, not claimed business
  // registrations; leave legal-registration fields empty until they are verified.
  const leafCategories = await prisma.category.findMany({ where: { level: 3, enabled: true }, orderBy: { sortOrder: 'asc' } });
  const categoryByName = new Map(leafCategories.map((category) => [category.name, category]));
  const category = (name: string) => {
    const value = categoryByName.get(name);
    if (!value) throw new Error(`Missing seed category: ${name}`);
    return value;
  };
  const companies = [
    { companyName: '华东智能装备有限公司', shortName: '华智装备', logo: '/images/company-logos/huadong-intelligent.png', province: '江苏', city: '苏州', legalRepresentative: '张宏伟', establishedAt: '2017-06-18', registeredCapital: '12000000', businessScope: '工业自动化装备、包装机械及产线改造服务。', introduction: '面向制造企业提供包装、装配和产线自动化设备的选型、集成与交付服务。', categoryName: '包装机', keywords: ['自动化产线', '包装设备', '控制柜'], products: [
      ['自动封箱机 折盖型物流包装设备', 'HZ-PK-6050', '包装机', 398000, 18, '台', '适配纸箱自动折盖与封箱，适用于仓储发货及产线末端包装。', ['封箱速度', '0–20 箱/分钟', '胶带宽度', '48–72 mm'], '/images/market-equipment-banner.png'],
      ['立式颗粒包装机 计量充填封口一体机', 'HZ-PK-420', '包装机', 568000, 9, '台', '适用于颗粒、粉末等物料的定量包装，支持按袋型配置。', ['制袋宽度', '50–200 mm', '计量范围', '10–1000 g'], '/images/smart-manufacturing.png'],
      ['工业控制柜 非标自动化设备配套', 'HZ-CC-2208', '工控装备', 1280000, 12, '台', '按电气原理图完成元器件装配、接线与出厂通电测试。', ['防护等级', 'IP54', '柜体材质', '冷轧钢板喷塑'], '/images/product-touch-panel.png'],
      ['热转印智能打码机 包装日期批号喷印设备', 'HZ-TTO-53', '打码机', 198000, 21, '台', '支持日期、批号和追溯码的高速热转印，适配柔性包装产线。', ['打印速度', '300 mm/s', '打印宽度', '53 mm'], '/images/factory-direct.png'],
      ['不锈钢皮带输送机 食品包装线配套', 'HZ-SS-600', '包装辅助设备', 256000, 14, '台', '模块化机架与变频调速设计，可按输送长度定制。', ['皮带宽度', '600 mm', '输送速度', '5–25 m/min'], '/images/industry-solution.png'],
    ] },
    { companyName: '冀中环保科技有限公司', shortName: '冀中环保', logo: '/images/company-logos/jizhong-environment.png', province: '河北', city: '石家庄', legalRepresentative: '李建国', establishedAt: '2016-09-12', registeredCapital: '8000000', businessScope: '水处理设备、环保设备及工程技术服务。', introduction: '为工业循环水、预处理和污水回用项目提供成套设备与运维技术支持。', categoryName: '工业水过滤设备', keywords: ['水处理', '过滤设备', '循环水'], products: [
      ['全自动反冲洗过滤器 不锈钢立式', 'JZ-GL-150', '工业水过滤设备', 68000, 36, '台', '压差控制自动反冲洗，适用于循环水和工艺水预处理。', ['过滤精度', '100 μm', '处理量', '80 m³/h'], '/images/market-equipment-banner.png'],
      ['定压补水脱气机组 闭式循环系统配套', 'JZ-BS-800', '泵', 328000, 11, '套', '集成定压、补水与脱气功能，适用于暖通及工业循环水系统。', ['额定流量', '8 m³/h', '工作压力', '0.6 MPa'], '/images/industry-solution.png'],
      ['一体化气浮设备 溶气气浮污水处理机', 'JZ-QF-30', '气浮设备', 786000, 6, '套', '用于含油、悬浮物废水的预处理，可按水量配置。', ['处理量', '30 m³/h', '主体材质', '碳钢防腐'], '/images/factory-direct.png'],
      ['叠螺式污泥脱水机 低速浓缩脱水设备', 'JZ-DL-202', '污泥处理', 468000, 8, '台', '适用于市政与工业污泥减量处理，运行能耗低、维护便捷。', ['处理量', '20 kgDS/h', '螺旋直径', '200 mm'], '/images/market-equipment-banner.png'],
      ['电动蝶阀 对夹式污水管路控制阀', 'JZ-D971X-100', '阀门', 12800, 64, '台', '适用于水处理管路启闭与流量控制，可选开关型或调节型执行器。', ['公称通径', 'DN100', '阀体材质', '球墨铸铁'], '/images/industry-solution.png'],
    ] },
    { companyName: '郑州华杰线缆有限公司', shortName: '华杰线缆', logo: '/images/company-logos/huajie-cable.png', province: '河南', city: '郑州', legalRepresentative: '王海峰', establishedAt: '2018-03-26', registeredCapital: '10000000', businessScope: '电线电缆、矿用电缆及线缆附件销售。', introduction: '服务工程建设、设备制造和矿山场景，提供电力、控制及耐环境线缆的选型与批量交付。', categoryName: '电力电缆', keywords: ['电力电缆', '控制电缆', '工程线缆'], products: [
      ['YJV22 8.7/15kV 钢带铠装电力电缆', 'HJ-YJV22-15KV', '电力电缆', 18600, 500, '米', '适用于配电线路固定敷设，规格可按芯数及截面定制。', ['额定电压', '8.7/15 kV', '导体材质', '铜'], '/images/factory-direct.png'],
      ['KVV 控制电缆 铜芯聚氯乙烯绝缘护套', 'HJ-KVV-10X1.5', '控制电缆', 1250, 1200, '米', '适用于控制、信号和保护回路固定敷设。', ['规格', '10×1.5 mm²', '额定电压', '450/750 V'], '/images/factory-direct-clean-banner.png'],
      ['矿用阻燃通信电缆 MHYVP 屏蔽型', 'HJ-MHYVP-10X2X0.8', '通讯电缆', 860, 900, '米', '适用于矿井通信及信号传输，支持按长度发货。', ['导体直径', '0.8 mm', '屏蔽方式', '铜丝屏蔽'], '/images/market-building-banner.png'],
      ['耐寒耐油拖链电缆 伺服设备专用', 'HJ-TRVV-4X2.5', '特种电缆', 2850, 650, '米', '适用于频繁往复移动工况，适配机床、机器人和自动化设备。', ['弯曲半径', '7.5D', '耐温范围', '-40–80 ℃'], '/images/factory-direct.png'],
      ['BV 铜芯聚氯乙烯绝缘电线 2.5 平方', 'HJ-BV-2.5', '绝缘导线', 238, 3200, '卷', '适用于建筑配电及设备内部布线，按 100 米/卷供应。', ['导体截面', '2.5 mm²', '额定电压', '450/750 V'], '/images/factory-direct-clean-banner.png'],
    ] },
    { companyName: '华测工业仪表有限公司', shortName: '华测仪表', logo: '/images/company-logos/huace-instruments.png', province: '上海', city: '上海', legalRepresentative: '周明远', establishedAt: '2019-05-20', registeredCapital: '6000000', businessScope: '工业仪表、数据采集终端及自动化控制设备。', introduction: '聚焦工业现场测量与数据采集，为设备配套、产线改造和能源管理项目提供工控终端。', categoryName: '工业检测', keywords: ['工控终端', '数据采集', '工业仪表'], products: [
      ['工业级触控一体机 15.6 英寸嵌入式工控平板', 'HC-IPC-156', '工控装备', 128000, 42, '台', '全金属机身，支持多接口扩展，适用于产线 HMI 与设备操作终端。', ['屏幕尺寸', '15.6 英寸', '防护等级', '前面板 IP65'], '/images/product-touch-panel.png'],
      ['4G 工业数据采集网关 Modbus 协议转换', 'HC-DTU-4G', '数据采集设备', 23800, 75, '台', '支持 RS485、以太网与 4G 上云，适用于远程抄表和设备状态采集。', ['串口数量', '2 路 RS485', '网络制式', '4G 全网通'], '/images/smart-manufacturing.png'],
      ['智能温湿度变送器 RS485 数字输出', 'HC-TH-485', '温度检测', 9800, 160, '台', '适用于仓储、机房和车间环境监测，可接入常见监控平台。', ['温度范围', '-40–85 ℃', '湿度精度', '±3%RH'], '/images/market-instrument-banner.png'],
      ['电磁流量计 DN50 4–20mA 智能型', 'HC-LDG-50', '工程仪表', 36800, 48, '台', '用于导电液体流量测量，支持现场显示和远传信号输出。', ['口径', 'DN50', '精度等级', '0.5 级'], '/images/market-instrument-banner.png'],
      ['便携式超声波测厚仪 金属壁厚无损检测', 'HC-UT-300', '测厚仪', 15800, 58, '台', '适用于管道、容器和金属构件的现场厚度巡检。', ['测量范围', '1.2–225 mm', '测量精度', '±0.5%'], '/images/product-touch-panel.png'],
    ] },
    { companyName: '山东鲁建新材料有限公司', shortName: '鲁建新材', logo: '/images/company-logos/lujian-materials.svg', province: '山东', city: '济南', legalRepresentative: '赵建军', establishedAt: '2017-11-08', registeredCapital: '15000000', businessScope: '保温材料、防水材料及工程建设材料。', introduction: '为工业厂房、公共建筑与基础设施项目供应保温、防水和耐火材料，支持项目批量发货。', categoryName: '防水/防潮材料', keywords: ['防水卷材', '保温材料', '工程建材'], products: [
      ['SBS 改性沥青防水卷材 聚酯胎 4mm', 'LJ-SBS-4', '防水/防潮材料', 4200, 680, '卷', '适用于屋面、地下室及工程防水层施工。', ['厚度', '4 mm', '幅宽', '1 m'], '/images/market-building-banner.png'],
      ['岩棉保温板 A 级不燃 外墙保温材料', 'LJ-RW-100', '保温/隔热材料', 18500, 420, '立方米', '适用于外墙和设备保温，支持不同容重与厚度配置。', ['容重', '120 kg/m³', '导热系数', '≤0.040 W/(m·K)'], '/images/industry-solution.png'],
      ['聚氨酯密封胶 耐候型建筑接缝胶', 'LJ-PU-600', '胶', 2680, 920, '支', '适用于金属、混凝土和玻璃等基材的弹性密封。', ['容量', '600 mL', '表干时间', '≤2 h'], '/images/factory-direct-clean-banner.png'],
      ['硅酸铝耐火纤维毯 高温设备保温', 'LJ-SAL-128', '耐火/防火材料', 9600, 380, '卷', '适用于窑炉、热处理设备和高温管道的隔热保温。', ['长期使用温度', '1000 ℃', '容重', '128 kg/m³'], '/images/industry-solution.png'],
      ['环氧自流平地坪漆 双组份耐磨型', 'LJ-EP-25', '地坪漆', 39800, 96, '组', '适用于车间、仓库和洁净区域地面，支持按颜色调配。', ['包装规格', '25 kg/组', '施工厚度', '1–3 mm'], '/images/market-building-banner.png'],
    ] },
    { companyName: '广东南方化工材料有限公司', shortName: '南方化材', logo: '/images/company-logos/nanfang-chemical.svg', province: '广东', city: '广州', legalRepresentative: '黄伟', establishedAt: '2018-07-16', registeredCapital: '10000000', businessScope: '水处理设备配套药剂、工业涂料及工程塑料。', introduction: '提供工业水处理药剂、防腐涂料和工程塑料的批量供应及应用建议。', categoryName: '反渗透阻垢剂', keywords: ['阻垢剂', '防腐涂料', '工程塑料'], products: [
      ['反渗透阻垢剂 RO 膜系统专用水处理药剂', 'NF-RO-3100', '反渗透阻垢剂', 16800, 240, '桶', '适用于苦咸水及地表水 RO 系统，具体投加量按水质报告确定。', ['包装规格', '25 kg/桶', 'pH 适用范围', '5–9'], '/images/market-chemical-banner.png'],
      ['环氧富锌底漆 工业钢结构防腐涂料', 'NF-EP-ZN70', '防腐涂料', 46800, 85, '组', '用于钢结构、储罐和设备底涂，适配工程防腐体系。', ['锌粉含量', '≥70%', '混合配比', '6:1'], '/images/factory-direct.png'],
      ['PA66 GF30 玻纤增强尼龙工程塑料', 'NF-PA66-GF30', 'PA66', 3280, 1200, '千克', '适用于电气、汽车及机械部件注塑加工。', ['玻纤含量', '30%', '颜色', '本色/黑色'], '/images/market-chemical-banner.png'],
      ['循环水缓蚀阻垢剂 复配型工业水处理剂', 'NF-CW-600', '阻垢剂', 13800, 280, '桶', '用于循环冷却水系统的结垢与腐蚀控制，建议按水质调整投加量。', ['包装规格', '25 kg/桶', '适用系统', '循环冷却水'], '/images/market-chemical-banner.png'],
      ['水性丙烯酸防腐面漆 工业设备涂装', 'NF-AC-200', '工业涂料', 32800, 110, '组', '低气味水性体系，适用于钢结构及设备表面防护。', ['颜色', '可调色', '表干时间', '≤1 h'], '/images/factory-direct.png'],
    ] },
    { companyName: '龙岩凯龙矿山设备有限公司', shortName: '凯龙矿机', logo: '/images/company-logos/kailong-mining.png', province: '福建', city: '龙岩', legalRepresentative: '陈志强', establishedAt: '2016-04-22', registeredCapital: '9000000', businessScope: '矿山设备、防爆器材及安全存储设备销售。', introduction: '面向矿山开采、隧道施工和危险品管理场景提供安全装备与现场配套方案。', categoryName: '防爆工具', keywords: ['矿山安全', '防爆设备', '应急装备'], products: [
      ['防爆工具套装 铝青铜无火花维修组合', 'KL-FB-32', '防爆工具', 168000, 25, '套', '适用于易燃易爆环境下的检维修作业，配置常用扳手与敲击工具。', ['套装数量', '32 件', '材质', '铝青铜'], '/images/factory-direct.png'],
      ['矿用本安型气体检测报警仪 四合一', 'KL-GAS-4', '安全监测', 98000, 32, '台', '可检测可燃气、氧气、一氧化碳和硫化氢，适用于井下巡检。', ['检测气体', '4 种', '防护等级', 'IP66'], '/images/market-instrument-banner.png'],
      ['移动式防爆器材柜 危化品暂存安全柜', 'KL-CAB-90', '环保箱', 268000, 10, '台', '双层钢板结构，适用于作业现场小批量危险品和器材临时存放。', ['容积', '90 L', '柜体材质', '双层冷轧钢板'], '/images/industry-solution.png'],
      ['矿用应急救援背包 现场抢险物资套装', 'KL-RES-01', '救援用品', 128000, 18, '套', '含照明、急救、警戒和基础救援用品，适用于现场应急响应。', ['配置类别', '8 类', '背包材质', '防水牛津布'], '/images/factory-direct-clean-banner.png'],
      ['干粉灭火器 4kg ABC 类手提式', 'KL-MFZ-4', '灭火器', 16800, 140, '具', '适用于设备间、仓库和施工现场的初起火灾扑救。', ['灭火剂充装量', '4 kg', '灭火级别', '2A 55B C'], '/images/market-equipment-banner.png'],
    ] },
    { companyName: '宁波力科五金工具有限公司', shortName: '力科五金', logo: '/images/company-logos/like-tools.svg', province: '浙江', city: '宁波', legalRepresentative: '孙立强', establishedAt: '2019-08-30', registeredCapital: '5000000', businessScope: '五金工具、紧固件及工位工具套装销售。', introduction: '服务设备维护、工厂工位和工程施工，提供专业工具、耗材与批量采购交付。', categoryName: '扳手', keywords: ['五金工具', '设备维修', '工位套装'], products: [
      ['铬钒钢两用扳手套装 8–24mm', 'LK-WR-14', '扳手', 18800, 130, '套', '镜面镀铬处理，适用于设备维修和装配作业。', ['规格数量', '14 件', '材质', '铬钒钢'], '/images/factory-direct-clean-banner.png'],
      ['六角套筒组 1/2 英寸汽修机修套装', 'LK-SK-32', '套筒', 26800, 96, '套', '含常用公制套筒与棘轮扳手，适用于机械维护。', ['方头尺寸', '1/2 英寸', '套筒数量', '32 件'], '/images/market-equipment-banner.png'],
      ['锂电电动螺丝刀 12V 双速充电式', 'LK-ES-12', '电动螺丝刀', 35800, 78, '把', '双速电子调节，适用于机柜装配和日常维护。', ['额定电压', '12 V', '最大扭矩', '35 N·m'], '/images/product-touch-panel.png'],
      ['125mm 角向磨光机 850W 工业级', 'LK-AG-125', '角磨机', 29800, 64, '台', '适用于金属切割、打磨与除锈，配有防护罩和侧手柄。', ['额定功率', '850 W', '砂轮直径', '125 mm'], '/images/factory-direct.png'],
      ['移动式工具车 七抽屉带锁维修柜', 'LK-TC-7', '工具箱包', 468000, 16, '台', '适用于车间工位工具分类存放，抽屉带防滑垫和集中锁。', ['抽屉数量', '7 个', '承重', '300 kg'], '/images/industry-solution.png'],
    ] },
  ] as const;
  const activeSpuCodes = companies.flatMap((company, companyIndex) => company.products.map((_, productIndex) => `QCY-${String(companyIndex + 1).padStart(2, '0')}-${String(productIndex + 1).padStart(3, '0')}`));
  // Preserve old seed records for auditability, but keep superseded placeholders
  // out of the public catalogue. The QCY prefix is reserved for this script.
  await prisma.product.updateMany({ where: { spuCode: { startsWith: 'QCY-', notIn: activeSpuCodes }, status: 'ON_SHELF' }, data: { status: 'OFF_SHELF' } });
  for (const [index, company] of companies.entries()) {
    const { companyName, shortName, province, city, legalRepresentative, businessScope, introduction } = company;
    const companyCategory = category(company.categoryName);
    const address = `${province}${city}高新技术产业园${index + 1}号`;
    const contactPhone = `1380000${String(1000 + index).slice(-4)}`;
    const merchantData = { shortName, logo: company.logo, logoText: shortName.slice(0, 2), themeColor: ['blue', 'green', 'orange', 'teal'][index % 4], introduction, province, city, address, mainCategories: [companyCategory.id], mainProducts: company.products.map(([name]) => name), mainProductKeywords: company.keywords, contactName: `${legalRepresentative}经理`, contactPhone, businessYears: 2026 - Number(company.establishedAt.slice(0, 4)), responseRate: 95 + (index % 4), deliveryLocation: `${province}·${city}`, supportsCustomization: true, status: 'ENABLED' as const, certificationStatus: 'APPROVED' as const, companyType: 'limited_liability_company', businessStatus: 'active', legalRepresentative, registeredCapital: company.registeredCapital, registeredCapitalCurrency: 'CNY', establishedAt: new Date(company.establishedAt), businessTermStart: new Date(company.establishedAt), businessScope, registrationAuthority: `${city}市市场监督管理局`, unifiedSocialCreditCode: null, organizationCode: null, taxpayerId: null, registrationNumber: null, websiteUrl: null, sortOrder: 100 - index };
    const merchant = await prisma.merchant.upsert({
      where: { companyName },
      update: merchantData,
      create: { companyName, ...merchantData },
    });
    await prisma.merchantContact.deleteMany({ where: { merchantId: merchant.id } });
    await prisma.merchantShippingAddress.deleteMany({ where: { merchantId: merchant.id } });
    await prisma.merchantVerification.deleteMany({ where: { merchantId: merchant.id } });
    await prisma.merchantContact.create({ data: { merchantId: merchant.id, name: `${legalRepresentative}经理`, mobile: contactPhone, position: '销售负责人', isPrimary: true, visibleToBuyer: true } });
    await prisma.merchantShippingAddress.create({ data: { merchantId: merchant.id, provinceCode: `${String(13 + index).padStart(2, '0')}0000`, cityCode: `${String(1300 + index).padStart(6, '0')}`, districtCode: `${String(130000 + index).padStart(6, '0')}`, addressDetail: address, isDefaultShippingAddress: true } });
    await prisma.merchantVerification.createMany({ data: ['subject', 'factory', 'business_license'].map((verificationType) => ({ merchantId: merchant.id, verificationType, verificationStatus: 'APPROVED', verifiedAt: new Date('2026-01-12T09:00:00+08:00') })) });
    for (const [productIndex, [productName, model, categoryName, priceCent, stockQuantity, unit, shortDescription, parameters, mainImage]] of company.products.entries()) {
      const productCategory = category(categoryName);
      const spuCode = `QCY-${String(index + 1).padStart(2, '0')}-${String(productIndex + 1).padStart(3, '0')}`;
      const productImage = `/images/products/${spuCode}.png`;
      const technicalParameters = [{ parameterId: 'model', name: '产品型号', value: model, unit: '', group: '基础参数' }, { parameterId: 'parameter_1', name: parameters[0], value: parameters[1], unit: '', group: '技术参数' }, { parameterId: 'parameter_2', name: parameters[2], value: parameters[3], unit: '', group: '技术参数' }];
      const productData = { merchantId: merchant.id, categoryId: productCategory.id, spuCode, name: productName, brand: shortName, model, manufacturer: companyName, originPlace: `${province}${city}`, shortDescription, detailContent: `<p>${shortDescription}</p><p>${productName}采用 ${parameters[0]} ${parameters[1]}、${parameters[2]} ${parameters[3]} 的配置，采购前可根据现场工况确认规格与交期。</p>`, mainImage: productImage, imageUrls: [productImage], videoUrls: [], marketingBadge: productIndex === 0 ? 'source_supply' : 'hot_sale', sellingPoints: [model, `${parameters[0]} ${parameters[1]}`, `${parameters[2]} ${parameters[3]}`], supplyMethods: ['spot', 'custom'], applicationScenarios: [categoryName, `${province}${city}发货`, '工程配套'], serviceGuarantees: ['platform_verified', 'customization', 'fast_shipping'], afterSalesService: `${productName}提供选型确认、到货验收咨询及对应型号的售后技术支持。`, technicalParameters, featureTags: ['selection_support'], customizationEnabled: true, inquiryEnabled: true, unit, shipWithinHours: productIndex === 0 ? 24 : 48, searchKeywords: [shortName, model, categoryName, ...company.keywords], sortOrder: 1000 - index * 10 - productIndex, salesCount: 28 + index * 17 + productIndex * 9, viewCount: BigInt(1200 + index * 310 + productIndex * 78), minOrderQuantity: unit === '米' || unit === '千克' ? 100 : 1, status: 'ON_SHELF' as const, publishedAt: new Date('2026-09-01T09:00:00+08:00') };
      const product = await prisma.product.upsert({
        where: { spuCode },
        update: productData,
        create: productData,
      });
      await prisma.productSku.deleteMany({ where: { productId: product.id } });
      await prisma.productImage.deleteMany({ where: { productId: product.id } });
      for (const skuIndex of [0, 1]) {
        const skuPriceCent = skuIndex ? Math.round(priceCent * 1.12) : priceCent;
        const sku = await prisma.productSku.create({ data: { productId: product.id, specName: '配置', specValue: skuIndex ? '工程加强款' : '标准配置', specValues: [{ specName: '配置', specValue: skuIndex ? '工程加强款' : '标准配置' }], skuCode: `${spuCode}-${skuIndex ? 'PRO' : 'STD'}`, priceCent: skuPriceCent, minOrderQuantity: productData.minOrderQuantity, stockQuantity: skuIndex ? Math.max(3, Math.floor(stockQuantity / 3)) : stockQuantity, priceCurrency: 'CNY', priceUnit: unit, priceFrom: skuIndex === 0, stockStatus: skuIndex ? 'low_stock' : 'in_stock', enabled: true } });
        await prisma.skuTierPrice.createMany({ data: [{ skuId: sku.id, minQuantity: String(productData.minOrderQuantity), maxQuantity: '9', unitPrice: String(skuPriceCent / 100), currency: 'CNY' }, { skuId: sku.id, minQuantity: '10', maxQuantity: null, unitPrice: String(Math.round(skuPriceCent * 0.94) / 100), currency: 'CNY' }] });
      }
      await prisma.productImage.create({ data: { productId: product.id, url: productImage, type: 'MAIN', sortOrder: 0 } });
    }
  }
  const newsTitles = [
    '制造企业采购如何建立合格供应商清单', '工业品询价前需要确认的六项参数', '供应链韧性：从单一货源到多源协同', '设备更新周期中的采购成本评估方法',
    '工程项目采购：交期与验收条款的协同管理', '制造业库存优化的实用分级方法', '工业材料采购中的质量证明文件要点', '中小工厂如何规范化采购需求描述',
    '批量采购谈判：阶梯价与年度框架协议', '设备备件采购如何降低停线风险', '绿色制造背景下的供应链选型趋势', '工业采购数字化的第一步：数据标准化'
  ];
  const newsCoverImages = [
    '/images/news/supplier-qualification.png',
    '/images/news/rfq-technical-parameters.png',
    '/images/news/supply-chain-resilience.png',
  ];
  for (const [index, title] of newsTitles.entries()) await prisma.newsArticle.upsert({
    where: { id: `seed-news-${index + 1}` }, update: { title, summary: `${title}，本文从工业采购的实际协作场景出发，梳理可执行的准备事项与风险控制要点。`, content: `<h1>${title}</h1><p>工业采购需要在质量、交付、成本和服务之间取得平衡。本文结合制造业常见场景，说明采购团队在需求确认、供应商沟通与验收留档中应关注的关键事项。</p><h2>采购建议</h2><p>建议将技术规格、数量、交期、验收标准和售后需求形成书面清单，并保留询价与沟通记录，以提升跨部门协作效率。</p>`, coverImage: newsCoverImages[index % newsCoverImages.length], publishedAt: new Date(Date.now() - index * 86400000), status: 'PUBLISHED' },
    create: { id: `seed-news-${index + 1}`, title, summary: `${title}，本文从工业采购的实际协作场景出发，梳理可执行的准备事项与风险控制要点。`, content: `<h1>${title}</h1><p>工业采购需要在质量、交付、成本和服务之间取得平衡。本文结合制造业常见场景，说明采购团队在需求确认、供应商沟通与验收留档中应关注的关键事项。</p><h2>采购建议</h2><p>建议将技术规格、数量、交期、验收标准和售后需求形成书面清单，并保留询价与沟通记录，以提升跨部门协作效率。</p>`, coverImage: newsCoverImages[index % newsCoverImages.length], publishedAt: new Date(Date.now() - index * 86400000), status: 'PUBLISHED' }
  });
}
main().finally(()=>prisma.$disconnect());
