import * as XLSX from "xlsx";
import type { PesonaSnapshot } from "./types";
import type { StoreData } from "./db";
import { productHpp, totalFixedCost, totalOverheadCost, calculateAllMaterials, calculateAllCashflow, cashflowTotals } from "./calc";

export function toSnapshot(data: StoreData): PesonaSnapshot {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    settings: data.settings,
    categories: data.categories,
    products: data.products,
    components: data.components,
    fixedCosts: data.fixedCosts,
    overheadCosts: data.overheadCosts,
    materials: data.materials,
    cashflow: data.cashflow,
    weeklyPlans: data.weeklyPlans,
  };
}

export function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportJson(data: StoreData) {
  const snap = toSnapshot(data);
  const blob = new Blob([JSON.stringify(snap, null, 2)], {
    type: "application/json",
  });
  downloadBlob(`pesona-backup-${dateStamp()}.json`, blob);
}

export function exportExcel(data: StoreData) {
  const wb = XLSX.utils.book_new();
  const hppRows = data.products.map((p) => ({
    Produk: p.name,
    "Harga Jual": p.sellingPrice,
    "HPP / Unit": productHpp(p.id, data.components),
  }));
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(hppRows),
    "Produk HPP",
  );

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      data.components.map((c) => {
        const p = data.products.find((x) => x.id === c.productId);
        return {
          Produk: p?.name ?? "",
          Komponen: c.componentName,
          Satuan: c.unit,
          Qty: c.qtyPerUnit,
          "Harga/Satuan": c.pricePerUnit,
          "Biaya/Unit": c.qtyPerUnit * c.pricePerUnit,
        };
      }),
    ),
    "Biaya Variabel",
  );

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      data.fixedCosts.map((f) => ({
        Kategori: f.category,
        "Nominal/Bulan": f.amountPerMonth,
        Catatan: f.notes ?? "",
      })),
    ),
    "Biaya Tetap",
  );

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      data.overheadCosts.map((o) => ({
        Kategori: o.category,
        "Nominal/Bulan": o.amountPerMonth,
        "% Alokasi": o.allocationPct,
        Teralokasi: o.amountPerMonth * o.allocationPct,
      })),
    ),
    "Biaya Tidak Langsung",
  );

  const inv = calculateAllMaterials(data.materials, data.settings);
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      inv.map((r) => ({
        Bahan: r.materialName,
        Satuan: r.unit,
        "Stok Saat Ini": r.currentStock,
        EOQ: r.eoq,
        "Safety Stock": r.safetyStock,
        ROP: r.reorderPoint,
        "Status EOQ": r.statusReorderEoq,
        "Jumlah Pesan LFL": r.jumlahPesanLfl,
        "Status LFL": r.statusReorderLfl,
      })),
    ),
    "Inventori Harian",
  );

  const cf = calculateAllCashflow(
    data.cashflow,
    data.products,
    data.components,
    data.fixedCosts,
    data.overheadCosts,
  );
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      cf.map((r) => ({
        Bulan: r.monthLabel,
        Produk: r.productName,
        "Unit Terjual": r.unitsSold,
        "Harga Jual": r.sellingPrice,
        Revenue: r.revenue,
        "Total Cost": r.totalCost,
        Profit: r.profit,
        "Margin %": r.profitMarginPct,
      })),
    ),
    "Arus Kas",
  );

  const totals = cashflowTotals(cf);
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([
      ["Ringkasan Dashboard"],
      ["Total Fixed Cost", totalFixedCost(data.fixedCosts)],
      ["Total Overhead Teralokasi", totalOverheadCost(data.overheadCosts)],
      ["Total Revenue", totals.totalRevenue],
      ["Total Cost", totals.totalCost],
      ["Total Profit", totals.totalProfit],
      ["Margin %", totals.averageProfitMarginPct],
      ["Hari Kerja/Bulan", data.settings.hariKerjaPerBulan],
      ["Bulan/Tahun", data.settings.bulanPerTahun],
    ]),
    "Visualisasi",
  );

  XLSX.writeFile(wb, `pesona-export-${dateStamp()}.xlsx`);
}

function dateStamp() {
  return new Date().toISOString().slice(0, 10);
}

export async function parseJsonFile(file: File): Promise<PesonaSnapshot> {
  const text = await file.text();
  const data = JSON.parse(text) as PesonaSnapshot;
  if (!data || data.version !== 1) {
    throw new Error("Format JSON tidak dikenali. Gunakan backup PESONA v1.");
  }
  return data;
}

export async function parseExcelFile(file: File): Promise<Partial<PesonaSnapshot>> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  // Best-effort import of common sheet names from the original workbook
  const result: Partial<PesonaSnapshot> = { version: 1, exportedAt: new Date().toISOString() };

  const fixedSheet =
    wb.Sheets["Biaya Tetap"] || wb.Sheets["Fixed Cost"] || wb.Sheets["BiayaTetap"];
  if (fixedSheet) {
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(fixedSheet, {
      defval: "",
    });
    result.fixedCosts = rows
      .map((r) => {
        const category = String(
          r["Kategori"] ?? r["Category"] ?? r["kategori"] ?? "",
        ).trim();
        const amount = Number(
          r["Nominal per Bulan (Rp)"] ??
            r["Nominal/Bulan"] ??
            r["amountPerMonth"] ??
            0,
        );
        if (!category || category.toUpperCase().includes("TOTAL")) return null;
        return {
          id: crypto.randomUUID(),
          category,
          amountPerMonth: amount || 0,
          notes: String(r["Catatan"] ?? r["notes"] ?? ""),
        };
      })
      .filter(Boolean) as PesonaSnapshot["fixedCosts"];
  }

  return result;
}
