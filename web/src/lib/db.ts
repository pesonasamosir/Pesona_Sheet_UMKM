import Dexie, { type EntityTable } from "dexie";
import type {
  AppMeta,
  CashFlowEntry,
  Category,
  FixedCost,
  Material,
  OverheadCost,
  Product,
  Settings,
  VariableCostComponent,
  WeeklyPlan,
} from "./types";

/**
 * Per-browser IndexedDB. Each device/visitor gets a fully private store.
 * No server writes. No shared state. Zero telemetry.
 */
class PesonaDB extends Dexie {
  categories!: EntityTable<Category, "id">;
  products!: EntityTable<Product, "id">;
  components!: EntityTable<VariableCostComponent, "id">;
  fixedCosts!: EntityTable<FixedCost, "id">;
  overheadCosts!: EntityTable<OverheadCost, "id">;
  materials!: EntityTable<Material, "id">;
  cashflow!: EntityTable<CashFlowEntry, "id">;
  weeklyPlans!: EntityTable<WeeklyPlan, "id">;
  settings!: EntityTable<Settings & { id: "settings" }, "id">;
  meta!: EntityTable<AppMeta, "id">;

  constructor() {
    // v2: empty-by-default (no auto-seed). Bumps DB name so prior dummy rows are not reused.
    super("pesona_umkm_v2");
    this.version(1).stores({
      categories: "id, name",
      products: "id, name, categoryId",
      components: "id, productId",
      fixedCosts: "id",
      overheadCosts: "id",
      materials: "id, name",
      cashflow: "id, monthLabel, productId",
      weeklyPlans: "id, materialId",
      settings: "id",
      meta: "id",
    });
  }
}

let dbSingleton: PesonaDB | null = null;

export function getDB() {
  if (typeof indexedDB === "undefined") {
    throw new Error("IndexedDB tidak tersedia di lingkungan ini.");
  }
  if (!dbSingleton) dbSingleton = new PesonaDB();
  return dbSingleton;
}

export function newId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export const DEFAULT_SETTINGS: Settings = {
  hariKerjaPerBulan: 26,
  bulanPerTahun: 12,
};

export async function ensureSettings(): Promise<Settings> {
  const db = getDB();
  const row = await db.settings.get("settings");
  if (row) {
    const { id: _id, ...rest } = row;
    return rest;
  }
  await db.settings.put({ id: "settings", ...DEFAULT_SETTINGS });
  return { ...DEFAULT_SETTINGS };
}

export async function saveSettings(settings: Settings) {
  const db = getDB();
  await db.settings.put({ id: "settings", ...settings });
}

export async function loadAllData() {
  const db = getDB();
  const [
    categories,
    products,
    components,
    fixedCosts,
    overheadCosts,
    materials,
    cashflow,
    weeklyPlans,
    settings,
    meta,
  ] = await Promise.all([
    db.categories.toArray(),
    db.products.toArray(),
    db.components.toArray(),
    db.fixedCosts.toArray(),
    db.overheadCosts.toArray(),
    db.materials.toArray(),
    db.cashflow.toArray(),
    db.weeklyPlans.toArray(),
    ensureSettings(),
    db.meta.get("meta"),
  ]);
  return {
    categories,
    products,
    components,
    fixedCosts,
    overheadCosts,
    materials,
    cashflow,
    weeklyPlans,
    settings,
    meta: meta ?? {
      id: "meta" as const,
      seeded: false,
      theme: "system" as const,
      updatedAt: new Date().toISOString(),
    },
  };
}

export type StoreData = Awaited<ReturnType<typeof loadAllData>>;

export async function clearAllData() {
  const db = getDB();
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
  await db.settings.put({ id: "settings", ...DEFAULT_SETTINGS });
  await db.meta.put({
    id: "meta",
    seeded: false,
    theme: "system",
    updatedAt: new Date().toISOString(),
  });
}
