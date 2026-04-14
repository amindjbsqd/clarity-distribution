import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...\n');

  // ─── ADMIN USER ───
  const adminHash = await bcrypt.hash('Admin@2026', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@clarity.ma' },
    update: {},
    create: {
      full_name: 'Admin Principal',
      email: 'admin@clarity.ma',
      phone: '+212600000001',
      password_hash: adminHash,
      role: 'admin',
      must_change_password: false,
      active: true,
    },
  });
  console.log('✅ Admin user: admin@clarity.ma / Admin@2026');

  // ─── CITIES ───
  const cities = [
    'Casablanca', 'Rabat', 'Salé', 'Marrakech', 'Fès', 'Tanger', 'Agadir',
    'Oujda', 'Kénitra', 'Meknès', 'Tétouan', 'Mohammedia', 'El Jadida',
    'Béni Mellal', 'Nador', 'Taza', 'Settat', 'Khémisset', 'Berrechid',
    'Safi', 'Khouribga', 'Laâyoune', 'Guelmim', 'Errachidia', 'Dakhla',
    'Essaouira', 'Ifrane', 'Ouarzazate', 'Tiznit', 'Al Hoceima',
  ];
  for (const name of cities) {
    await prisma.city.upsert({ where: { name }, update: {}, create: { name } });
  }
  console.log(`✅ ${cities.length} cities`);

  // ─── BRANDS ───
  const brands = [
    'Samsung', 'Apple', 'Huawei', 'Xiaomi', 'LG', 'Sony',
    'Oppo', 'Infinix', 'Tecno', 'Realme', 'OnePlus', 'Vivo',
  ];
  for (const name of brands) {
    await prisma.brand.upsert({ where: { name }, update: {}, create: { name } });
  }
  console.log(`✅ ${brands.length} brands`);

  // ─── CATEGORIES ───
  const categories = [
    'Smartphones', 'Tablets', 'Accessories', 'Audio', 'Wearables',
    'Chargers', 'Cases', 'Cables', 'Screen Protectors', 'Power Banks',
  ];
  for (const name of categories) {
    await prisma.category.upsert({ where: { name }, update: {}, create: { name } });
  }
  console.log(`✅ ${categories.length} categories`);

  // ─── SHIPPING COMPANIES ───
  const shippers = [
    { name: 'Amana Express', phone: '+212600111222', email: 'contact@amana.ma' },
    { name: 'Flash Delivery', phone: '+212600333444', email: 'info@flash.ma' },
    { name: 'Tawsil Pro', phone: '+212600555666', email: 'support@tawsil.ma' },
  ];
  for (const s of shippers) {
    await prisma.shippingCompany.upsert({ where: { name: s.name }, update: {}, create: { ...s, created_by: admin.id } });
  }
  console.log(`✅ ${shippers.length} shipping companies`);

  // ─── INVOICE SEQUENCES ───
  await prisma.invoiceSequence.upsert({ where: { type: 'HT' }, update: {}, create: { type: 'HT', last_number: 0 } });
  await prisma.invoiceSequence.upsert({ where: { type: 'TTC' }, update: {}, create: { type: 'TTC', last_number: 0 } });
  console.log('✅ Invoice sequences');

  // ─── SAMPLE PRODUCTS ───
  const samsungBrand = await prisma.brand.findUnique({ where: { name: 'Samsung' } });
  const appleBrand = await prisma.brand.findUnique({ where: { name: 'Apple' } });
  const xiaomiBrand = await prisma.brand.findUnique({ where: { name: 'Xiaomi' } });
  const smartphoneCat = await prisma.category.findUnique({ where: { name: 'Smartphones' } });
  const audioCat = await prisma.category.findUnique({ where: { name: 'Audio' } });
  const wearCat = await prisma.category.findUnique({ where: { name: 'Wearables' } });

  if (samsungBrand && smartphoneCat) {
    const p1 = await prisma.product.create({
      data: {
        name: 'Galaxy S24 Ultra', brand_id: samsungBrand.id, category_id: smartphoneCat.id,
        buying_price: 8500, selling_price: 12500, created_by: admin.id,
        variations: { create: [
          { name: '256GB Black', sku: 'GS24U-256-BK' },
          { name: '512GB White', sku: 'GS24U-512-WH' },
        ]},
      },
    });
    // Add initial stock
    const vars = await prisma.productVariation.findMany({ where: { product_id: p1.id } });
    for (const v of vars) {
      await prisma.stockMovement.create({ data: { product_id: p1.id, variation_id: v.id, type: 'initial_stock', quantity: 25, user_id: admin.id, note: 'Initial inventory' } });
    }
  }

  if (appleBrand && smartphoneCat) {
    const p2 = await prisma.product.create({
      data: {
        name: 'iPhone 15 Pro Max', brand_id: appleBrand.id, category_id: smartphoneCat.id,
        buying_price: 11000, selling_price: 16500, created_by: admin.id,
        variations: { create: [
          { name: '256GB Natural', sku: 'IP15PM-256-NT' },
          { name: '512GB Black', sku: 'IP15PM-512-BK' },
        ]},
      },
    });
    const vars = await prisma.productVariation.findMany({ where: { product_id: p2.id } });
    for (const v of vars) {
      await prisma.stockMovement.create({ data: { product_id: p2.id, variation_id: v.id, type: 'initial_stock', quantity: 15, user_id: admin.id, note: 'Initial inventory' } });
    }
  }

  if (xiaomiBrand && smartphoneCat) {
    const p3 = await prisma.product.create({
      data: { name: 'Redmi Note 13', brand_id: xiaomiBrand.id, category_id: smartphoneCat.id, buying_price: 1800, selling_price: 2800, created_by: admin.id },
    });
    await prisma.stockMovement.create({ data: { product_id: p3.id, type: 'initial_stock', quantity: 120, user_id: admin.id, note: 'Initial inventory' } });
  }

  if (appleBrand && audioCat) {
    const p4 = await prisma.product.create({
      data: { name: 'AirPods Pro 2', brand_id: appleBrand.id, category_id: audioCat.id, buying_price: 2200, selling_price: 3400, created_by: admin.id },
    });
    await prisma.stockMovement.create({ data: { product_id: p4.id, type: 'initial_stock', quantity: 55, user_id: admin.id, note: 'Initial inventory' } });
  }

  if (xiaomiBrand && wearCat) {
    const p5 = await prisma.product.create({
      data: { name: 'Smart Band 8', brand_id: xiaomiBrand.id, category_id: wearCat.id, buying_price: 350, selling_price: 550, created_by: admin.id },
    });
    await prisma.stockMovement.create({ data: { product_id: p5.id, type: 'initial_stock', quantity: 2, user_id: admin.id, note: 'Low initial stock' } });
  }

  console.log('✅ Sample products with stock');

  // ─── LOG ───
  await prisma.activityLog.create({
    data: { user_id: admin.id, action: 'Seed', module: 'System', description: 'Database seeded successfully' },
  });

  console.log('\n🎉 Seed complete! Login with: admin@clarity.ma / Admin@2026\n');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
