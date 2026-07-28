/** Core domain types — aligned with Sheet Inventori dan Finansial UMKM */

export type Id = string;

export interface Category {
  id: Id;
  name: string;
}

export interface VariableCostComponent {
  id: Id;
  productId: Id;
  componentName: string;
  unit: string;
  qtyPerUnit: number;
  pricePerUnit: number;
}

export interface Product {
  id: Id;
  name: string;
  categoryId: Id | null;
  sellingPrice: number;
  notes?: string;
  createdAt: string;
}

export interface FixedCost {
  id: Id;
  category: string;
  amountPerMonth: number;
  notes?: string;
}

export interface OverheadCost {
  id: Id;
  category: string;
  amountPerMonth: number;
  /** 0..1 allocation ratio to production */
  allocationPct: number;
}

export interface Material {
  id: Id;
  name: string;
  unit: string;
  avgDemandMonth: number;
  maxDemandMonth: number;
  avgLeadTimeDays: number;
  maxLeadTimeDays: number;
  orderCost: number;
  holdingCostPerUnitMonth: number;
  purchasePrice: number;
  currentStock: number;
}

export interface CashFlowEntry {
  id: Id;
  monthLabel: string;
  productId: Id;
  unitsSold: number;
  sellingPrice: number;
  fixedCostAllocationPct: number;
  overheadAllocationPct: number;
}

export interface Settings {
  hariKerjaPerBulan: number;
  bulanPerTahun: number;
}

/** Weekly MRP planner (Inventori Mingguan) — per-material scenario */
export interface WeeklyPlan {
  id: Id;
  materialId: Id;
  name: string;
  leadTimeWeeks: number;
  safetyStock: number;
  holdingCostPerUnitWeek: number;
  orderCost: number;
  initialStock: number;
  /** Demand quantity per week (length typically 12) */
  weeklyDemand: number[];
  /** Scheduled receipts already planned (same length) */
  scheduledReceipts: number[];
}

export interface AppMeta {
  id: "meta";
  seeded: boolean;
  theme: "light" | "dark" | "system";
  updatedAt: string;
}

export interface InventoryResult {
  materialId: Id;
  materialName: string;
  unit: string;
  permintaanHarianRata2: number;
  permintaanHarianMaksimum: number;
  permintaanTahunan: number;
  eoq: number;
  safetyStock: number;
  reorderPoint: number;
  statusReorderEoq: "Segera Pesan" | "Aman";
  kebutuhanBulanDepanLfl: number;
  safetyStockLfl: number;
  jumlahPesanLfl: number;
  statusReorderLfl: "Segera Pesan" | "Aman";
  currentStock: number;
}

export interface CashFlowResult {
  entryId: Id;
  monthLabel: string;
  productId: Id;
  productName: string;
  unitsSold: number;
  sellingPrice: number;
  revenue: number;
  variableCostPerUnit: number;
  totalVariableCost: number;
  fixedCostAllocationPct: number;
  allocatedFixedCost: number;
  overheadAllocationPct: number;
  allocatedOverhead: number;
  totalCost: number;
  profit: number;
  profitMarginPct: number;
}

export interface PesonaSnapshot {
  version: 1;
  exportedAt: string;
  settings: Settings;
  categories: Category[];
  products: Product[];
  components: VariableCostComponent[];
  fixedCosts: FixedCost[];
  overheadCosts: OverheadCost[];
  materials: Material[];
  cashflow: CashFlowEntry[];
  weeklyPlans: WeeklyPlan[];
}
