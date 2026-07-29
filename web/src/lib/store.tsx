"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  clearAllData,
  getDB,
  loadAllData,
  newId,
  saveSettings,
  type StoreData,
} from "./db";
import { seedSampleData } from "./seed";
import { DuplicateError, normalizeKey } from "./duplicates";
import type {
  CashFlowEntry,
  FixedCost,
  Material,
  OverheadCost,
  PesonaSnapshot,
  Product,
  Settings,
  VariableCostComponent,
  WeeklyPlan,
} from "./types";
import {
  calculateAllCashflow,
  calculateAllMaterials,
  dashboardSummary,
  productHpp,
} from "./calc";

type StoreContextValue = {
  ready: boolean;
  data: StoreData | null;
  refresh: () => Promise<void>;
  seed: (force?: boolean) => Promise<void>;
  wipe: () => Promise<void>;
  updateSettings: (s: Settings) => Promise<void>;
  // Products
  addProduct: (p: Omit<Product, "id" | "createdAt">) => Promise<string>;
  updateProduct: (p: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addComponent: (c: Omit<VariableCostComponent, "id">) => Promise<void>;
  deleteComponent: (id: string) => Promise<void>;
  addCategory: (name: string) => Promise<string>;
  deleteCategory: (id: string) => Promise<void>;
  // Costs
  addFixed: (f: Omit<FixedCost, "id">) => Promise<void>;
  deleteFixed: (id: string) => Promise<void>;
  addOverhead: (o: Omit<OverheadCost, "id">) => Promise<void>;
  deleteOverhead: (id: string) => Promise<void>;
  // Inventory
  addMaterial: (m: Omit<Material, "id">) => Promise<void>;
  updateMaterial: (m: Material) => Promise<void>;
  deleteMaterial: (id: string) => Promise<void>;
  // Cashflow
  addCashflow: (e: Omit<CashFlowEntry, "id">) => Promise<void>;
  deleteCashflow: (id: string) => Promise<void>;
  // Weekly
  upsertWeeklyPlan: (p: WeeklyPlan) => Promise<void>;
  deleteWeeklyPlan: (id: string) => Promise<void>;
  // Import
  importSnapshot: (snap: PesonaSnapshot) => Promise<void>;
  // Derived
  summary: ReturnType<typeof dashboardSummary> | null;
  inventoryRows: ReturnType<typeof calculateAllMaterials>;
  cashflowRows: ReturnType<typeof calculateAllCashflow>;
  hppOf: (productId: string) => number;
};

export { DuplicateError } from "./duplicates";

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [data, setData] = useState<StoreData | null>(null);

  const refresh = useCallback(async () => {
    // Never auto-seed: first visit and post-wipe stay empty (zeros / no rows).
    // Dummy Excel data is only loaded via explicit seed(true) from Data page.
    const all = await loadAllData();
    setData(all);
    setReady(true);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const mutate = useCallback(
    async (fn: () => Promise<void>) => {
      await fn();
      await refresh();
    },
    [refresh],
  );

  const value = useMemo<StoreContextValue>(() => {
    const summary = data
      ? dashboardSummary({
          materials: data.materials,
          settings: data.settings,
          fixedCosts: data.fixedCosts,
          overheadCosts: data.overheadCosts,
          products: data.products,
          components: data.components,
          cashflow: data.cashflow,
        })
      : null;

    const inventoryRows = data
      ? calculateAllMaterials(data.materials, data.settings)
      : [];
    const cashflowRows = data
      ? calculateAllCashflow(
          data.cashflow,
          data.products,
          data.components,
          data.fixedCosts,
          data.overheadCosts,
        )
      : [];

    return {
      ready,
      data,
      refresh,
      seed: (force) => mutate(() => seedSampleData(!!force).then(() => undefined)),
      wipe: () => mutate(() => clearAllData()),
      updateSettings: (s) => mutate(() => saveSettings(s)),
      addProduct: async (p) => {
        const id = newId();
        await mutate(async () => {
          const key = normalizeKey(p.name);
          if (!key) throw new DuplicateError("Nama produk tidak boleh kosong.");
          const existing = (await getDB().products.toArray()).some(
            (x) => normalizeKey(x.name) === key,
          );
          if (existing) {
            throw new DuplicateError(
              `Produk "${p.name.trim()}" sudah ada. Gunakan nama lain atau edit yang sudah ada.`,
            );
          }
          await getDB().products.add({
            ...p,
            name: p.name.trim(),
            id,
            createdAt: new Date().toISOString(),
          });
        });
        return id;
      },
      updateProduct: (p) =>
        mutate(async () => {
          const key = normalizeKey(p.name);
          const clash = (await getDB().products.toArray()).some(
            (x) => x.id !== p.id && normalizeKey(x.name) === key,
          );
          if (clash) {
            throw new DuplicateError(
              `Produk "${p.name.trim()}" sudah dipakai entri lain.`,
            );
          }
          await getDB().products.put({ ...p, name: p.name.trim() });
        }),
      deleteProduct: (id) =>
        mutate(async () => {
          const db = getDB();
          await db.components.where("productId").equals(id).delete();
          await db.cashflow.where("productId").equals(id).delete();
          await db.products.delete(id);
        }),
      addComponent: (c) =>
        mutate(async () => {
          const key = normalizeKey(c.componentName);
          if (!key) throw new DuplicateError("Nama komponen tidak boleh kosong.");
          const dup = (await getDB().components.toArray()).some(
            (x) =>
              x.productId === c.productId &&
              normalizeKey(x.componentName) === key,
          );
          if (dup) {
            throw new DuplicateError(
              `Komponen "${c.componentName.trim()}" sudah ada pada produk ini.`,
            );
          }
          await getDB().components.add({
            ...c,
            componentName: c.componentName.trim(),
            id: newId(),
          });
        }),
      deleteComponent: (id) =>
        mutate(async () => {
          await getDB().components.delete(id);
        }),
      addCategory: async (name) => {
        const id = newId();
        await mutate(async () => {
          const key = normalizeKey(name);
          if (!key) throw new DuplicateError("Nama kategori tidak boleh kosong.");
          const existing = (await getDB().categories.toArray()).some(
            (x) => normalizeKey(x.name) === key,
          );
          if (existing) {
            throw new DuplicateError(`Kategori "${name.trim()}" sudah ada.`);
          }
          await getDB().categories.add({ id, name: name.trim() });
        });
        return id;
      },
      deleteCategory: (id) =>
        mutate(async () => {
          const db = getDB();
          const products = await db.products.where("categoryId").equals(id).toArray();
          await Promise.all(
            products.map((p) => db.products.put({ ...p, categoryId: null })),
          );
          await db.categories.delete(id);
        }),
      addFixed: (f) =>
        mutate(async () => {
          const key = normalizeKey(f.category);
          if (!key) throw new DuplicateError("Kategori biaya tetap tidak boleh kosong.");
          const dup = (await getDB().fixedCosts.toArray()).some(
            (x) => normalizeKey(x.category) === key,
          );
          if (dup) {
            throw new DuplicateError(
              `Biaya tetap "${f.category.trim()}" sudah ada.`,
            );
          }
          await getDB().fixedCosts.add({
            ...f,
            category: f.category.trim(),
            id: newId(),
          });
        }),
      deleteFixed: (id) =>
        mutate(async () => {
          await getDB().fixedCosts.delete(id);
        }),
      addOverhead: (o) =>
        mutate(async () => {
          const key = normalizeKey(o.category);
          if (!key) throw new DuplicateError("Kategori overhead tidak boleh kosong.");
          const dup = (await getDB().overheadCosts.toArray()).some(
            (x) => normalizeKey(x.category) === key,
          );
          if (dup) {
            throw new DuplicateError(
              `Overhead "${o.category.trim()}" sudah ada.`,
            );
          }
          await getDB().overheadCosts.add({
            ...o,
            category: o.category.trim(),
            id: newId(),
          });
        }),
      deleteOverhead: (id) =>
        mutate(async () => {
          await getDB().overheadCosts.delete(id);
        }),
      addMaterial: (m) =>
        mutate(async () => {
          const key = normalizeKey(m.name);
          if (!key) throw new DuplicateError("Nama bahan baku tidak boleh kosong.");
          const dup = (await getDB().materials.toArray()).some(
            (x) => normalizeKey(x.name) === key,
          );
          if (dup) {
            throw new DuplicateError(
              `Bahan baku "${m.name.trim()}" sudah ada.`,
            );
          }
          await getDB().materials.add({ ...m, name: m.name.trim(), id: newId() });
        }),
      updateMaterial: (m) =>
        mutate(async () => {
          const key = normalizeKey(m.name);
          const clash = (await getDB().materials.toArray()).some(
            (x) => x.id !== m.id && normalizeKey(x.name) === key,
          );
          if (clash) {
            throw new DuplicateError(
              `Bahan baku "${m.name.trim()}" sudah dipakai entri lain.`,
            );
          }
          await getDB().materials.put({ ...m, name: m.name.trim() });
        }),
      deleteMaterial: (id) =>
        mutate(async () => {
          await getDB().materials.delete(id);
        }),
      addCashflow: (e) =>
        mutate(async () => {
          const monthKey = normalizeKey(e.monthLabel);
          const dup = (await getDB().cashflow.toArray()).some(
            (x) =>
              x.productId === e.productId &&
              normalizeKey(x.monthLabel) === monthKey,
          );
          if (dup) {
            throw new DuplicateError(
              "Entri arus kas untuk produk & bulan ini sudah ada. Hapus atau ubah yang lama dulu.",
            );
          }
          await getDB().cashflow.add({
            ...e,
            monthLabel: e.monthLabel.trim(),
            id: newId(),
          });
        }),
      deleteCashflow: (id) =>
        mutate(async () => {
          await getDB().cashflow.delete(id);
        }),
      upsertWeeklyPlan: (p) =>
        mutate(async () => {
          await getDB().weeklyPlans.put(p);
        }),
      deleteWeeklyPlan: (id) =>
        mutate(async () => {
          await getDB().weeklyPlans.delete(id);
        }),
      importSnapshot: (snap) =>
        mutate(async () => {
          const db = getDB();
          await clearAllData();
          await db.settings.put({ id: "settings", ...snap.settings });
          if (snap.categories?.length) await db.categories.bulkAdd(snap.categories);
          if (snap.products?.length) await db.products.bulkAdd(snap.products);
          if (snap.components?.length) await db.components.bulkAdd(snap.components);
          if (snap.fixedCosts?.length) await db.fixedCosts.bulkAdd(snap.fixedCosts);
          if (snap.overheadCosts?.length)
            await db.overheadCosts.bulkAdd(snap.overheadCosts);
          if (snap.materials?.length) await db.materials.bulkAdd(snap.materials);
          if (snap.cashflow?.length) await db.cashflow.bulkAdd(snap.cashflow);
          if (snap.weeklyPlans?.length)
            await db.weeklyPlans.bulkAdd(snap.weeklyPlans);
          await db.meta.put({
            id: "meta",
            seeded: true,
            theme: "system",
            updatedAt: new Date().toISOString(),
          });
        }),
      summary,
      inventoryRows,
      cashflowRows,
      hppOf: (productId) =>
        data ? productHpp(productId, data.components) : 0,
    };
  }, [ready, data, refresh, mutate]);

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
