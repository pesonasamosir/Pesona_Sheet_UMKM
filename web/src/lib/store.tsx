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
import type {
  CashFlowEntry,
  Category,
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
  addCategory: (name: string) => Promise<void>;
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
          await getDB().products.add({
            ...p,
            id,
            createdAt: new Date().toISOString(),
          });
        });
        return id;
      },
      updateProduct: (p) =>
        mutate(async () => {
          await getDB().products.put(p);
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
          await getDB().components.add({ ...c, id: newId() });
        }),
      deleteComponent: (id) =>
        mutate(async () => {
          await getDB().components.delete(id);
        }),
      addCategory: (name) =>
        mutate(async () => {
          await getDB().categories.add({ id: newId(), name });
        }),
      deleteCategory: (id) =>
        mutate(async () => {
          await getDB().categories.delete(id);
        }),
      addFixed: (f) =>
        mutate(async () => {
          await getDB().fixedCosts.add({ ...f, id: newId() });
        }),
      deleteFixed: (id) =>
        mutate(async () => {
          await getDB().fixedCosts.delete(id);
        }),
      addOverhead: (o) =>
        mutate(async () => {
          await getDB().overheadCosts.add({ ...o, id: newId() });
        }),
      deleteOverhead: (id) =>
        mutate(async () => {
          await getDB().overheadCosts.delete(id);
        }),
      addMaterial: (m) =>
        mutate(async () => {
          await getDB().materials.add({ ...m, id: newId() });
        }),
      updateMaterial: (m) =>
        mutate(async () => {
          await getDB().materials.put(m);
        }),
      deleteMaterial: (id) =>
        mutate(async () => {
          await getDB().materials.delete(id);
        }),
      addCashflow: (e) =>
        mutate(async () => {
          await getDB().cashflow.add({ ...e, id: newId() });
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
