/**
 * Formula accuracy check vs Excel dummy values from Sheet Inventori dan Finansial UMKM.
 * Run: npm run verify:formulas
 */
import {
  calculateMaterialInventory,
  productHpp,
  totalFixedCost,
  totalOverheadCost,
  calculateCashflowEntry,
  cashflowTotals,
  calculateAllCashflow,
} from "../src/lib/calc";
import type {
  CashFlowEntry,
  Material,
  OverheadCost,
  Product,
  VariableCostComponent,
} from "../src/lib/types";

const settings = { hariKerjaPerBulan: 26, bulanPerTahun: 12 };

function assertClose(label: string, actual: number, expected: number, tol = 0.01) {
  if (Math.abs(actual - expected) > tol) {
    throw new Error(`${label}: expected ${expected}, got ${actual}`);
  }
  console.log(`✓ ${label} = ${actual}`);
}

const components: VariableCostComponent[] = [
  { id: "1", productId: "a", componentName: "BBU", unit: "kg", qtyPerUnit: 0.2, pricePerUnit: 15000 },
  { id: "2", productId: "a", componentName: "BP", unit: "pcs", qtyPerUnit: 1, pricePerUnit: 2000 },
  { id: "3", productId: "a", componentName: "KP", unit: "pcs", qtyPerUnit: 1, pricePerUnit: 1000 },
  { id: "4", productId: "b", componentName: "BBU", unit: "kg", qtyPerUnit: 0.15, pricePerUnit: 15000 },
  { id: "5", productId: "b", componentName: "BP", unit: "pcs", qtyPerUnit: 2, pricePerUnit: 1500 },
  { id: "6", productId: "b", componentName: "KP", unit: "pcs", qtyPerUnit: 1, pricePerUnit: 1200 },
];

assertClose("HPP Produk A", productHpp("a", components), 6000);
assertClose("HPP Produk B", productHpp("b", components), 6450);

assertClose(
  "Total Fixed Cost",
  totalFixedCost([
    { amountPerMonth: 500000 },
    { amountPerMonth: 0 },
    { amountPerMonth: 100000 },
  ]),
  600000,
);

const overhead: OverheadCost[] = [
  { id: "1", category: "Listrik", amountPerMonth: 300000, allocationPct: 0.7 },
  { id: "2", category: "Air", amountPerMonth: 100000, allocationPct: 0.5 },
  { id: "3", category: "Transport", amountPerMonth: 200000, allocationPct: 1 },
  { id: "4", category: "Packing", amountPerMonth: 150000, allocationPct: 1 },
];
assertClose("Total Overhead", totalOverheadCost(overhead), 610000);

const matA: Material = {
  id: "ma",
  name: "A",
  unit: "kg",
  avgDemandMonth: 60,
  maxDemandMonth: 100,
  avgLeadTimeDays: 5,
  maxLeadTimeDays: 10,
  orderCost: 50000,
  holdingCostPerUnitMonth: 500,
  purchasePrice: 15000,
  currentStock: 40,
};
const invA = calculateMaterialInventory(matA, settings);
assertClose("Permintaan harian rata2 A", invA.permintaanHarianRata2, 60 / 26, 0.0001);
assertClose("Permintaan tahunan A", invA.permintaanTahunan, 720);
// EOQ = ROUND(SQRT(2*720*50000/(500*12)),0) = ROUND(SQRT(72000000/6000),0) = ROUND(SQRT(12000),0) = 110
assertClose("EOQ A", invA.eoq, 110);
assertClose("Safety Stock A", invA.safetyStock, Math.round(((100 / 26 - 60 / 26) * 10)));
assertClose("ROP A", invA.reorderPoint, Math.round((60 / 26) * 5 + invA.safetyStock));

const products: Product[] = [
  { id: "a", name: "Produk A", categoryId: null, sellingPrice: 25000, createdAt: "" },
  { id: "b", name: "Produk B", categoryId: null, sellingPrice: 18000, createdAt: "" },
];
const fixed = [{ amountPerMonth: 600000 }];
const entries: CashFlowEntry[] = [
  { id: "1", monthLabel: "Bulan 1", productId: "a", unitsSold: 300, sellingPrice: 25000, fixedCostAllocationPct: 0.6, overheadAllocationPct: 0.6 },
  { id: "2", monthLabel: "Bulan 1", productId: "b", unitsSold: 250, sellingPrice: 18000, fixedCostAllocationPct: 0.4, overheadAllocationPct: 0.4 },
  { id: "3", monthLabel: "Bulan 2", productId: "a", unitsSold: 320, sellingPrice: 25000, fixedCostAllocationPct: 0.55, overheadAllocationPct: 0.55 },
  { id: "4", monthLabel: "Bulan 2", productId: "b", unitsSold: 260, sellingPrice: 18000, fixedCostAllocationPct: 0.45, overheadAllocationPct: 0.45 },
];

const rows = calculateAllCashflow(entries, products, components, fixed, overhead);
const totals = cashflowTotals(rows);
assertClose("Total Revenue", totals.totalRevenue, 24680000);
assertClose("Total Profit", totals.totalProfit, 15250500);
assertClose("Avg Margin %", totals.averageProfitMarginPct, 61.79, 0.02);

const one = calculateCashflowEntry(entries[0], products[0], components, 600000, 610000);
assertClose("Revenue Bulan1 A", one.revenue, 7500000);
assertClose("Profit Bulan1 A", one.profit, 7500000 - (1800000 + 360000 + 366000));

console.log("\nAll formula checks passed.");
