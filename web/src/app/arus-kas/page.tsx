"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { DuplicateError, useStore } from "@/lib/store";
import {
  calculateCashflowEntry,
  productHpp,
  totalFixedCost,
  totalOverheadCost,
} from "@/lib/calc";
import { percent, rupiah } from "@/lib/format";
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  Empty,
  Field,
  NumberInput,
  PageHeader,
  PreviewBox,
  Select,
} from "@/components/ui";
import type { CashFlowEntry } from "@/lib/types";

/** Convert "YYYY-MM" from <input type="month"> to a readable label like "Jan 2025" */
function monthValueToLabel(v: string): string {
  if (!v) return "";
  const [y, m] = v.split("-");
  const date = new Date(Number(y), Number(m) - 1, 1);
  return date.toLocaleDateString("id-ID", { month: "short", year: "numeric" });
}

/** Convert a stored monthLabel back to "YYYY-MM" for the input, or today's month as fallback */
function labelToMonthValue(label: string): string {
  // Try parsing "MMM YYYY" Indonesian format
  const months: Record<string, string> = {
    jan: "01", feb: "02", mar: "03", apr: "04", mei: "05", jun: "06",
    jul: "07", agu: "08", sep: "09", okt: "10", nov: "11", des: "12",
  };
  const parts = label.toLowerCase().split(" ");
  if (parts.length === 2) {
    const mo = months[parts[0]];
    const yr = parts[1];
    if (mo && yr.length === 4) return `${yr}-${mo}`;
  }
  // Fallback: current month
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function todayMonthValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

const EMPTY_FORM = {
  monthValue: todayMonthValue(),
  productId: "",
  unitsSold: 0,
  sellingPrice: 0,
  fixedPct: 0,
  ohPct: 0,
};

export default function ArusKasPage() {
  const { ready, data, cashflowRows, addCashflow, updateCashflow, deleteCashflow, summary } =
    useStore();

  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const preview = useMemo(() => {
    if (!data) return null;
    const pid = form.productId || data.products[0]?.id;
    const product = data.products.find((p) => p.id === pid);
    return calculateCashflowEntry(
      {
        id: "preview",
        monthLabel: monthValueToLabel(form.monthValue) || "–",
        productId: pid || "",
        unitsSold: form.unitsSold,
        sellingPrice: form.sellingPrice,
        fixedCostAllocationPct: form.fixedPct,
        overheadAllocationPct: form.ohPct,
      },
      product,
      data.components,
      totalFixedCost(data.fixedCosts),
      totalOverheadCost(data.overheadCosts),
    );
  }, [data, form]);

  if (!ready || !data) return <p className="text-sm text-muted">Memuat…</p>;

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setError(null);
  }

  function startEdit(entry: CashFlowEntry) {
    setEditingId(entry.id);
    setError(null);
    setForm({
      monthValue: labelToMonthValue(entry.monthLabel),
      productId: entry.productId,
      unitsSold: entry.unitsSold,
      sellingPrice: entry.sellingPrice,
      fixedPct: entry.fixedCostAllocationPct,
      ohPct: entry.overheadAllocationPct,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!data) return;
    const pid = form.productId || data.products[0]?.id;
    if (!pid) return;
    const monthLabel = monthValueToLabel(form.monthValue) || form.monthValue;
    try {
      if (editingId) {
        await updateCashflow({
          id: editingId,
          monthLabel,
          productId: pid,
          unitsSold: form.unitsSold,
          sellingPrice: form.sellingPrice,
          fixedCostAllocationPct: form.fixedPct,
          overheadAllocationPct: form.ohPct,
        });
        resetForm();
      } else {
        await addCashflow({
          monthLabel,
          productId: pid,
          unitsSold: form.unitsSold,
          sellingPrice: form.sellingPrice,
          fixedCostAllocationPct: form.fixedPct,
          overheadAllocationPct: form.ohPct,
        });
        setForm((f) => ({ ...f, unitsSold: 0, sellingPrice: 0, fixedPct: 0, ohPct: 0 }));
      }
    } catch (err) {
      setError(
        err instanceof DuplicateError || err instanceof Error
          ? err.message
          : "Gagal mencatat penjualan.",
      );
    }
  }

  const cardTitle = editingId
    ? `Edit Entri — ${cashflowRows.find((r) => r.entryId === editingId)?.productName ?? ""}`
    : "+ Catat Penjualan";

  return (
    <div>
      <PageHeader
        title="Arus Kas"
        lead="Catat penjualan, alokasi FC/OH, lalu lihat revenue, cost, profit, dan margin secara langsung."
        actions={
          summary ? (
            <Badge tone="ok">Laba {rupiah(summary.totalProfit)}</Badge>
          ) : null
        }
      />

      {error ? (
        <p className="mb-4 rounded-xl border border-[color-mix(in_srgb,var(--danger)_35%,var(--border))] bg-danger-soft px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <Card
        title={cardTitle}
        className="mb-4"
        action={
          editingId ? (
            <Button type="button" variant="ghost" size="sm" onClick={resetForm}>
              <X className="size-3.5" /> Batal
            </Button>
          ) : null
        }
      >
        <form className="grid gap-3 md:grid-cols-2" onSubmit={(e) => void handleSubmit(e)}>
          <Field label="Bulan">
            <input
              type="month"
              className="w-full min-h-11 rounded-xl border border-border bg-elevated px-3 text-base text-fg outline-none focus:border-primary focus:ring-2 focus:ring-[var(--ring)]"
              value={form.monthValue}
              onChange={(e) => setForm((f) => ({ ...f, monthValue: e.target.value }))}
              required
            />
          </Field>
          <Field label="Produk">
            <Select
              value={form.productId || data.products[0]?.id || ""}
              onChange={(e) => {
                const p = data.products.find((x) => x.id === e.target.value);
                setForm((f) => ({
                  ...f,
                  productId: e.target.value,
                  sellingPrice: p ? p.sellingPrice : f.sellingPrice,
                }));
              }}
            >
              {data.products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (HPP {rupiah(productHpp(p.id, data.components))})
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Unit Terjual">
            <NumberInput
              value={form.unitsSold}
              onValueChange={(n) => setForm((f) => ({ ...f, unitsSold: n }))}
              min={0}
            />
          </Field>
          <Field label="Harga Jual / Unit">
            <NumberInput
              value={form.sellingPrice}
              onValueChange={(n) => setForm((f) => ({ ...f, sellingPrice: n }))}
              min={0}
            />
          </Field>
          <Field
            label="% Alokasi Fixed Cost (0–1)"
            hint="Manual sesuai estimasi pemilik UMKM"
          >
            <NumberInput
              value={form.fixedPct}
              onValueChange={(n) => setForm((f) => ({ ...f, fixedPct: n }))}
              min={0}
              max={1}
              step={0.01}
            />
          </Field>
          <Field label="% Alokasi Overhead (0–1)">
            <NumberInput
              value={form.ohPct}
              onValueChange={(n) => setForm((f) => ({ ...f, ohPct: n }))}
              min={0}
              max={1}
              step={0.01}
            />
          </Field>

          {preview ? (
            <div className="md:col-span-2">
              <PreviewBox>
                <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-4">
                  <p>Revenue: <strong>{rupiah(preview.revenue)}</strong></p>
                  <p>Total Cost: <strong>{rupiah(preview.totalCost)}</strong></p>
                  <p>Profit: <strong>{rupiah(preview.profit)}</strong></p>
                  <p>Margin: <strong>{percent(preview.profitMarginPct)}</strong></p>
                </div>
              </PreviewBox>
            </div>
          ) : null}

          <Button type="submit" className="md:col-span-2">
            {editingId ? (
              <><Pencil className="size-4" /> Simpan Perubahan</>
            ) : (
              <><Plus className="size-4" /> Catat Penjualan</>
            )}
          </Button>
        </form>
      </Card>

      <Card title="Entri Arus Kas">
        {cashflowRows.length === 0 ? (
          <Empty>Belum ada data arus kas.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
                  <th className="py-2 pr-2">Bulan</th>
                  <th className="py-2 pr-2">Produk</th>
                  <th className="py-2 pr-2 text-right">Unit</th>
                  <th className="py-2 pr-2 text-right">Revenue</th>
                  <th className="py-2 pr-2 text-right">Cost</th>
                  <th className="py-2 pr-2 text-right">Profit</th>
                  <th className="py-2 pr-2 text-right">Margin</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {cashflowRows.map((r) => (
                  <tr
                    key={r.entryId}
                    className={`border-b border-border ${editingId === r.entryId ? "bg-[color-mix(in_srgb,var(--primary)_8%,transparent)]" : ""}`}
                  >
                    <td className="py-2 pr-2">{r.monthLabel}</td>
                    <td className="py-2 pr-2 font-medium">{r.productName}</td>
                    <td className="py-2 pr-2 text-right tabular-nums">{r.unitsSold}</td>
                    <td className="py-2 pr-2 text-right tabular-nums">{rupiah(r.revenue)}</td>
                    <td className="py-2 pr-2 text-right tabular-nums">{rupiah(r.totalCost)}</td>
                    <td className="py-2 pr-2 text-right tabular-nums font-semibold">{rupiah(r.profit)}</td>
                    <td className="py-2 pr-2 text-right tabular-nums">{percent(r.profitMarginPct)}</td>
                    <td className="py-2 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="secondary"
                          size="sm"
                          type="button"
                          onClick={() => startEdit(data.cashflow.find((c) => c.id === r.entryId)!)}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          type="button"
                          onClick={() => setPendingDelete(r.entryId)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              {summary ? (
                <tfoot>
                  <tr className="font-bold">
                    <td className="py-2" colSpan={3}>TOTAL</td>
                    <td className="py-2 text-right">{rupiah(summary.totalRevenue)}</td>
                    <td className="py-2 text-right">{rupiah(summary.totalCost)}</td>
                    <td className="py-2 text-right">{rupiah(summary.totalProfit)}</td>
                    <td className="py-2 text-right">{percent(summary.averageProfitMarginPct)}</td>
                    <td />
                  </tr>
                </tfoot>
              ) : null}
            </table>
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={!!pendingDelete}
        title="Hapus entri arus kas?"
        message="Entri penjualan ini akan dihapus dari penyimpanan lokal."
        onCancel={() => setPendingDelete(null)}
        onConfirm={async () => {
          if (pendingDelete) await deleteCashflow(pendingDelete);
          setPendingDelete(null);
        }}
      />
    </div>
  );
}
