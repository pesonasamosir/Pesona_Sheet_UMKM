import { getDB, newId, DEFAULT_SETTINGS } from "./db";

/** Dummy data matching Sheet Inventori dan Finansial UMKM.xlsx (Panduan Teknis: DATA DUMMY) */
export async function seedSampleData(force = false) {
  const db = getDB();
  const meta = await db.meta.get("meta");
  if (meta?.seeded && !force) return false;
  if (force) {
    await Promise.all([
      db.categories.clear(),
      db.products.clear(),
      db.components.clear(),
      db.fixedCosts.clear(),
      db.overheadCosts.clear(),
      db.materials.clear(),
      db.cashflow.clear(),
      db.weeklyPlans.clear(),
    ]);
  }

  const catId = newId();
  await db.categories.add({ id: catId, name: "Minuman" });

  const produkA = newId();
  const produkB = newId();
  await db.products.bulkAdd([
    {
      id: produkA,
      name: "Produk A",
      categoryId: catId,
      sellingPrice: 25000,
      createdAt: new Date().toISOString(),
    },
    {
      id: produkB,
      name: "Produk B",
      categoryId: catId,
      sellingPrice: 18000,
      createdAt: new Date().toISOString(),
    },
  ]);

  await db.components.bulkAdd([
    {
      id: newId(),
      productId: produkA,
      componentName: "Bahan Baku Utama",
      unit: "kg",
      qtyPerUnit: 0.2,
      pricePerUnit: 15000,
    },
    {
      id: newId(),
      productId: produkA,
      componentName: "Bahan Pendukung",
      unit: "pcs",
      qtyPerUnit: 1,
      pricePerUnit: 2000,
    },
    {
      id: newId(),
      productId: produkA,
      componentName: "Kemasan Primer",
      unit: "pcs",
      qtyPerUnit: 1,
      pricePerUnit: 1000,
    },
    {
      id: newId(),
      productId: produkB,
      componentName: "Bahan Baku Utama",
      unit: "kg",
      qtyPerUnit: 0.15,
      pricePerUnit: 15000,
    },
    {
      id: newId(),
      productId: produkB,
      componentName: "Bahan Pendukung",
      unit: "pcs",
      qtyPerUnit: 2,
      pricePerUnit: 1500,
    },
    {
      id: newId(),
      productId: produkB,
      componentName: "Kemasan Primer",
      unit: "pcs",
      qtyPerUnit: 1,
      pricePerUnit: 1200,
    },
  ]);

  await db.fixedCosts.bulkAdd([
    {
      id: newId(),
      category: "Sewa Tempat/Lahan Usaha",
      amountPerMonth: 500000,
    },
    { id: newId(), category: "Gaji Karyawan Tetap", amountPerMonth: 0 },
    {
      id: newId(),
      category: "Penyusutan Peralatan",
      amountPerMonth: 100000,
    },
  ]);

  await db.overheadCosts.bulkAdd([
    {
      id: newId(),
      category: "Listrik",
      amountPerMonth: 300000,
      allocationPct: 0.7,
    },
    { id: newId(), category: "Air", amountPerMonth: 100000, allocationPct: 0.5 },
    {
      id: newId(),
      category: "Transportasi/Distribusi",
      amountPerMonth: 200000,
      allocationPct: 1,
    },
    {
      id: newId(),
      category: "Kemasan Sekunder & Packing",
      amountPerMonth: 150000,
      allocationPct: 1,
    },
  ]);

  const matA = newId();
  await db.materials.bulkAdd([
    {
      id: matA,
      name: "Bahan Baku A (contoh)",
      unit: "kg",
      avgDemandMonth: 60,
      maxDemandMonth: 100,
      avgLeadTimeDays: 5,
      maxLeadTimeDays: 10,
      orderCost: 50000,
      holdingCostPerUnitMonth: 500,
      purchasePrice: 15000,
      currentStock: 40,
    },
    {
      id: newId(),
      name: "Bahan Baku B (contoh)",
      unit: "pcs",
      avgDemandMonth: 200,
      maxDemandMonth: 350,
      avgLeadTimeDays: 3,
      maxLeadTimeDays: 7,
      orderCost: 30000,
      holdingCostPerUnitMonth: 150,
      purchasePrice: 2000,
      currentStock: 150,
    },
    {
      id: newId(),
      name: "Bahan Baku C (contoh)",
      unit: "pcs",
      avgDemandMonth: 150,
      maxDemandMonth: 260,
      avgLeadTimeDays: 4,
      maxLeadTimeDays: 8,
      orderCost: 25000,
      holdingCostPerUnitMonth: 200,
      purchasePrice: 1000,
      currentStock: 80,
    },
  ]);

  await db.cashflow.bulkAdd([
    {
      id: newId(),
      monthLabel: "Bulan 1",
      productId: produkA,
      unitsSold: 300,
      sellingPrice: 25000,
      fixedCostAllocationPct: 0.6,
      overheadAllocationPct: 0.6,
    },
    {
      id: newId(),
      monthLabel: "Bulan 1",
      productId: produkB,
      unitsSold: 250,
      sellingPrice: 18000,
      fixedCostAllocationPct: 0.4,
      overheadAllocationPct: 0.4,
    },
    {
      id: newId(),
      monthLabel: "Bulan 2",
      productId: produkA,
      unitsSold: 320,
      sellingPrice: 25000,
      fixedCostAllocationPct: 0.55,
      overheadAllocationPct: 0.55,
    },
    {
      id: newId(),
      monthLabel: "Bulan 2",
      productId: produkB,
      unitsSold: 260,
      sellingPrice: 18000,
      fixedCostAllocationPct: 0.45,
      overheadAllocationPct: 0.45,
    },
  ]);

  await db.weeklyPlans.add({
    id: newId(),
    materialId: matA,
    name: "Skenario Mingguan — Bahan Baku A",
    leadTimeWeeks: 3,
    safetyStock: 45,
    holdingCostPerUnitWeek: 12,
    orderCost: 25,
    initialStock: 100,
    weeklyDemand: [150, 200, 100, 250, 200, 300, 200, 150, 350, 200, 100, 150],
    scheduledReceipts: Array(12).fill(0),
  });

  await db.settings.put({ id: "settings", ...DEFAULT_SETTINGS });
  await db.meta.put({
    id: "meta",
    seeded: true,
    theme: "system",
    updatedAt: new Date().toISOString(),
  });
  return true;
}
