/**
 * Excel-faithful calculation engines.
 * Source of truth: Sheet Inventori dan Finansial UMKM.xlsx
 * (ported 1:1 from the verified Python services).
 */

import type {
  CashFlowEntry,
  CashFlowResult,
  InventoryResult,
  Material,
  OverheadCost,
  Product,
  Settings,
  VariableCostComponent,
  WeeklyPlan,
} from "./types";

/** Excel ROUND(x, 0) — banker's? No: standard half-up like Python/Excel for positives. */
export function round0(x: number): number {
  return x >= 0 ? Math.floor(x + 0.5) : Math.ceil(x - 0.5);
}

export function round2(x: number): number {
  return Math.round(x * 100) / 100;
}

/** Biaya Variabel G: =E*F */
export function componentCostPerUnit(qty: number, price: number): number {
  return round2(qty * price);
}

/** SUMIF total variable cost (HPP) per product */
export function productHpp(
  productId: string,
  components: VariableCostComponent[],
): number {
  return round2(
    components
      .filter((c) => c.productId === productId)
      .reduce((s, c) => s + componentCostPerUnit(c.qtyPerUnit, c.pricePerUnit), 0),
  );
}

/** Biaya Tetap C7: =SUM(...) */
export function totalFixedCost(items: { amountPerMonth: number }[]): number {
  return round2(items.reduce((s, i) => s + (i.amountPerMonth || 0), 0));
}

/** Overhead E: =C*D ; total = SUM(E) */
export function allocatedOverhead(item: OverheadCost): number {
  return round2(item.amountPerMonth * item.allocationPct);
}

export function totalOverheadCost(items: OverheadCost[]): number {
  return round2(items.reduce((s, i) => s + allocatedOverhead(i), 0));
}

/**
 * Inventori Harian — EOQ + Safety Stock vs LFL + Safety Stock
 *
 * L = D / hari_kerja
 * M = E / hari_kerja
 * N = D * bulan_tahun
 * O = ROUND(SQRT(2*N*H/(I*bulan_tahun)), 0)   // EOQ
 * P = ROUND((M-L)*G, 0)                       // Safety Stock
 * Q = ROUND(L*F+P, 0)                         // ROP (avg lead + SS)
 * R = IF(K<=Q,"Segera Pesan","Aman")
 * U = MAX(S+T-K,0)                            // LFL order qty
 * V = IF(K<S+T,"Segera Pesan","Aman")
 */
export function calculateMaterialInventory(
  material: Material,
  settings: Settings,
): InventoryResult {
  const { hariKerjaPerBulan: hari, bulanPerTahun: bulan } = settings;
  const D = material.avgDemandMonth;
  const E = material.maxDemandMonth;
  const F = material.avgLeadTimeDays;
  const G = material.maxLeadTimeDays;
  const H = material.orderCost;
  const I = material.holdingCostPerUnitMonth;
  const K = material.currentStock;

  const L = hari > 0 ? D / hari : 0;
  const M = hari > 0 ? E / hari : 0;
  const N = D * bulan;
  const eoqRaw =
    I > 0 && bulan > 0 ? Math.sqrt((2 * N * H) / (I * bulan)) : 0;
  const O = round0(eoqRaw);
  const P = round0((M - L) * G);
  const Q = round0(L * F + P);
  const R: "Segera Pesan" | "Aman" = K <= Q ? "Segera Pesan" : "Aman";
  const S = D;
  const T = P;
  const U = Math.max(S + T - K, 0);
  const V: "Segera Pesan" | "Aman" = K < S + T ? "Segera Pesan" : "Aman";

  return {
    materialId: material.id,
    materialName: material.name,
    unit: material.unit,
    permintaanHarianRata2: Math.round(L * 10000) / 10000,
    permintaanHarianMaksimum: Math.round(M * 10000) / 10000,
    permintaanTahunan: Math.round(N * 100) / 100,
    eoq: O,
    safetyStock: P,
    reorderPoint: Q,
    statusReorderEoq: R,
    kebutuhanBulanDepanLfl: S,
    safetyStockLfl: T,
    jumlahPesanLfl: U,
    statusReorderLfl: V,
    currentStock: K,
  };
}

export function calculateAllMaterials(
  materials: Material[],
  settings: Settings,
): InventoryResult[] {
  return materials.map((m) => calculateMaterialInventory(m, settings));
}

export function countReorderNeeded(
  materials: Material[],
  settings: Settings,
  model: "eoq" | "lfl" = "eoq",
): number {
  const rows = calculateAllMaterials(materials, settings);
  const key = model === "eoq" ? "statusReorderEoq" : "statusReorderLfl";
  return rows.filter((r) => r[key] === "Segera Pesan").length;
}

/** Live preview helper for inventory form inputs */
export function previewInventory(
  input: Partial<Material> & {
    avgDemandMonth: number;
    maxDemandMonth: number;
    avgLeadTimeDays: number;
    maxLeadTimeDays: number;
    orderCost: number;
    holdingCostPerUnitMonth: number;
    currentStock: number;
  },
  settings: Settings,
): Pick<
  InventoryResult,
  | "permintaanHarianRata2"
  | "permintaanTahunan"
  | "eoq"
  | "safetyStock"
  | "reorderPoint"
  | "statusReorderEoq"
  | "jumlahPesanLfl"
  | "statusReorderLfl"
> {
  const stub: Material = {
    id: "preview",
    name: "preview",
    unit: "unit",
    purchasePrice: 0,
    ...input,
  };
  const r = calculateMaterialInventory(stub, settings);
  return {
    permintaanHarianRata2: Math.round(r.permintaanHarianRata2 * 10000) / 10000,
    permintaanTahunan: r.permintaanTahunan,
    eoq: r.eoq,
    safetyStock: r.safetyStock,
    reorderPoint: r.reorderPoint,
    statusReorderEoq: r.statusReorderEoq,
    jumlahPesanLfl: r.jumlahPesanLfl,
    statusReorderLfl: r.statusReorderLfl,
  };
}

export function calculateCashflowEntry(
  entry: CashFlowEntry,
  product: Product | undefined,
  components: VariableCostComponent[],
  fixedTotal: number,
  overheadTotal: number,
): CashFlowResult {
  const C = entry.unitsSold;
  const D = entry.sellingPrice;
  const H = entry.fixedCostAllocationPct;
  const J = entry.overheadAllocationPct;
  const F = product ? productHpp(product.id, components) : 0;
  const E = C * D;
  const G = C * F;
  const I = fixedTotal * H;
  const K = overheadTotal * J;
  const L = G + I + K;
  const M = E - L;
  const N = E === 0 ? 0 : M / E;

  return {
    entryId: entry.id,
    monthLabel: entry.monthLabel,
    productId: entry.productId,
    productName: product?.name ?? "—",
    unitsSold: C,
    sellingPrice: D,
    revenue: round2(E),
    variableCostPerUnit: round2(F),
    totalVariableCost: round2(G),
    fixedCostAllocationPct: H,
    allocatedFixedCost: round2(I),
    overheadAllocationPct: J,
    allocatedOverhead: round2(K),
    totalCost: round2(L),
    profit: round2(M),
    profitMarginPct: round2(N * 100),
  };
}

export function calculateAllCashflow(
  entries: CashFlowEntry[],
  products: Product[],
  components: VariableCostComponent[],
  fixedCosts: { amountPerMonth: number }[],
  overheadCosts: OverheadCost[],
): CashFlowResult[] {
  const fc = totalFixedCost(fixedCosts);
  const oh = totalOverheadCost(overheadCosts);
  const byId = new Map(products.map((p) => [p.id, p]));
  return entries.map((e) =>
    calculateCashflowEntry(e, byId.get(e.productId), components, fc, oh),
  );
}

export function cashflowTotals(rows: CashFlowResult[]) {
  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
  const totalVariableCost = rows.reduce((s, r) => s + r.totalVariableCost, 0);
  const totalAllocatedFixed = rows.reduce((s, r) => s + r.allocatedFixedCost, 0);
  const totalAllocatedOh = rows.reduce((s, r) => s + r.allocatedOverhead, 0);
  const totalCost = rows.reduce((s, r) => s + r.totalCost, 0);
  const totalProfit = rows.reduce((s, r) => s + r.profit, 0);
  const avgMargin =
    totalRevenue === 0 ? 0 : (totalProfit / totalRevenue) * 100;
  return {
    totalRevenue: round2(totalRevenue),
    totalVariableCost: round2(totalVariableCost),
    totalAllocatedFixedCost: round2(totalAllocatedFixed),
    totalAllocatedOverhead: round2(totalAllocatedOh),
    totalCost: round2(totalCost),
    totalProfit: round2(totalProfit),
    averageProfitMarginPct: round2(avgMargin),
  };
}

/**
 * Inventori Mingguan — lot-for-lot MRP rolling plan (aligned to sample sheet logic).
 * For each week t:
 *   available = endingPrior + scheduledReceipt[t]
 *   net = max(demand[t] + safetyStock - available, 0)
 *   planned receipt = net; release offset by leadTimeWeeks
 */
export function calculateWeeklyMrp(plan: WeeklyPlan) {
  const n = plan.weeklyDemand.length;
  const demand = plan.weeklyDemand;
  const receipts = [...plan.scheduledReceipts];
  while (receipts.length < n) receipts.push(0);

  const endingStock: number[] = [];
  const netRequirements: number[] = [];
  const plannedOrderReceipts = Array(n).fill(0) as number[];
  const plannedOrderReleases = Array(n).fill(0) as number[];
  const reorderStatus: ("Segera Pesan" | "Aman")[] = [];
  const projectedOnHand: number[] = [];

  let stock = plan.initialStock;
  for (let t = 0; t < n; t++) {
    const before = stock + (receipts[t] || 0);
    projectedOnHand.push(before);
    const need = demand[t] + plan.safetyStock;
    const net = Math.max(need - before, 0);
    netRequirements.push(net);
    if (net > 0) {
      plannedOrderReceipts[t] = net;
      const rel = t - plan.leadTimeWeeks;
      if (rel >= 0) plannedOrderReleases[rel] += net;
      else plannedOrderReleases[0] += net;
    }
    stock = before + plannedOrderReceipts[t] - demand[t];
    endingStock.push(stock);
    reorderStatus.push(before < need ? "Segera Pesan" : "Aman");
  }

  const holdingCost = endingStock.reduce(
    (s, e) => s + Math.max(e, 0) * plan.holdingCostPerUnitWeek,
    0,
  );
  const orderCount = plannedOrderReleases.filter((x) => x > 0).length;
  const setupCost = orderCount * plan.orderCost;

  return {
    projectedOnHand,
    netRequirements,
    plannedOrderReceipts,
    plannedOrderReleases,
    endingStock,
    reorderStatus,
    totalHoldingCost: round2(holdingCost),
    totalOrderCost: round2(setupCost),
    totalCost: round2(holdingCost + setupCost),
  };
}

export function dashboardSummary(args: {
  materials: Material[];
  settings: Settings;
  fixedCosts: { amountPerMonth: number }[];
  overheadCosts: OverheadCost[];
  products: Product[];
  components: VariableCostComponent[];
  cashflow: CashFlowEntry[];
}) {
  const rows = calculateAllCashflow(
    args.cashflow,
    args.products,
    args.components,
    args.fixedCosts,
    args.overheadCosts,
  );
  const totals = cashflowTotals(rows);
  return {
    ...totals,
    totalFixedCost: totalFixedCost(args.fixedCosts),
    totalOverheadCost: totalOverheadCost(args.overheadCosts),
    reorderNeededEoq: countReorderNeeded(args.materials, args.settings, "eoq"),
    reorderNeededLfl: countReorderNeeded(args.materials, args.settings, "lfl"),
    jumlahProduk: args.products.length,
    jumlahBahanBaku: args.materials.length,
    monthlySeries: buildMonthlySeries(rows),
    profitByProductMonth: buildProfitByProductMonth(rows),
  };
}

/** One object per month; keys = product names, value = profit Rp. */
function buildProfitByProductMonth(rows: CashFlowResult[]) {
  const months: string[] = [];
  const products: string[] = [];
  for (const r of rows) {
    if (!months.includes(r.monthLabel)) months.push(r.monthLabel);
    if (!products.includes(r.productName)) products.push(r.productName);
  }
  const series = months.map((month) => {
    const row: Record<string, string | number> = { month };
    for (const name of products) {
      // Sum profit for entries with same month + product name
      const total = rows
        .filter((r) => r.monthLabel === month && r.productName === name)
        .reduce((s, r) => s + r.profit, 0);
      row[name] = round2(total);
    }
    return row;
  });
  return { products, series };
}

function buildMonthlySeries(rows: CashFlowResult[]) {
  const map = new Map<
    string,
    { month: string; revenue: number; cost: number; profit: number }
  >();
  for (const r of rows) {
    const cur = map.get(r.monthLabel) ?? {
      month: r.monthLabel,
      revenue: 0,
      cost: 0,
      profit: 0,
    };
    cur.revenue += r.revenue;
    cur.cost += r.totalCost;
    cur.profit += r.profit;
    map.set(r.monthLabel, cur);
  }
  return [...map.values()].map((m) => ({
    ...m,
    revenue: round2(m.revenue),
    cost: round2(m.cost),
    profit: round2(m.profit),
    margin: m.revenue === 0 ? 0 : round2((m.profit / m.revenue) * 100),
  }));
}

