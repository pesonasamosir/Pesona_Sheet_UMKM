"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
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
  Input,
  PageHeader,
  PreviewBox,
  Select,
} from "@/components/ui";

export default function ArusKasPage() {
  const { ready, data, cashflowRows, addCashflow, deleteCashflow, summary } =
    useStore();

  const [monthLabel, setMonthLabel] = useState("Bulan 1");
  const [productId, setProductId] = useState("");
  const [unitsSold, setUnitsSold] = useState(100);
  const [sellingPrice, setSellingPrice] = useState(25000);
  const [fixedPct, setFixedPct] = useState(0.5);
  const [ohPct, setOhPct] = useState(0.5);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const preview = useMemo(() => {
    if (!data) return null;
    const pid = productId || data.products[0]?.id;
    const product = data.products.find((p) => p.id === pid);
    return calculateCashflowEntry(
      {
        id: "preview",
        monthLabel,
        productId: pid || "",
        unitsSold,
        sellingPrice,
        fixedCostAllocationPct: fixedPct,
        overheadAllocationPct: ohPct,
      },
      product,
      data.components,
      totalFixedCost(data.fixedCosts),
      totalOverheadCost(data.overheadCosts),
    );
  }, [data, monthLabel, productId, unitsSold, sellingPrice, fixedPct, ohPct]);

  if (!ready || !data) return <p className="text-sm text-muted">Memuat…</p>;

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

      <Card title="+ Catat Penjualan" className="mb-4">
        <form
          className="grid gap-3 md:grid-cols-2"
          onSubmit={async (e) => {
            e.preventDefault();
            const pid = productId || data.products[0]?.id;
            if (!pid) return;
            await addCashflow({
              monthLabel: monthLabel.trim() || "Bulan",
              productId: pid,
              unitsSold,
              sellingPrice,
              fixedCostAllocationPct: fixedPct,
              overheadAllocationPct: ohPct,
            });
          }}
        >
          <Field label="Label Bulan">
            <Input value={monthLabel} onChange={(e) => setMonthLabel(e.target.value)} />
          </Field>
          <Field label="Produk">
            <Select
              value={productId || data.products[0]?.id || ""}
              onChange={(e) => {
                setProductId(e.target.value);
                const p = data.products.find((x) => x.id === e.target.value);
                if (p) setSellingPrice(p.sellingPrice);
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
            <Input
              type="number"
              min={0}
              value={unitsSold}
              onChange={(e) => setUnitsSold(Number(e.target.value))}
            />
          </Field>
          <Field label="Harga Jual / Unit">
            <Input
              type="number"
              min={0}
              value={sellingPrice}
              onChange={(e) => setSellingPrice(Number(e.target.value))}
            />
          </Field>
          <Field
            label="% Alokasi Fixed Cost (0–1)"
            hint="Manual sesuai estimasi pemilik UMKM"
          >
            <Input
              type="number"
              step="0.01"
              min={0}
              max={1}
              value={fixedPct}
              onChange={(e) => setFixedPct(Number(e.target.value))}
            />
          </Field>
          <Field label="% Alokasi Overhead (0–1)">
            <Input
              type="number"
              step="0.01"
              min={0}
              max={1}
              value={ohPct}
              onChange={(e) => setOhPct(Number(e.target.value))}
            />
          </Field>

          {preview ? (
            <div className="md:col-span-2">
              <PreviewBox>
                <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-4">
                  <p>
                    Revenue: <strong>{rupiah(preview.revenue)}</strong>
                  </p>
                  <p>
                    Total Cost: <strong>{rupiah(preview.totalCost)}</strong>
                  </p>
                  <p>
                    Profit: <strong>{rupiah(preview.profit)}</strong>
                  </p>
                  <p>
                    Margin: <strong>{percent(preview.profitMarginPct)}</strong>
                  </p>
                </div>
              </PreviewBox>
            </div>
          ) : null}

          <Button type="submit" className="md:col-span-2">
            <Plus className="size-4" /> Catat Penjualan
          </Button>
        </form>
      </Card>

      <Card title="Entri Arus Kas">
        {cashflowRows.length === 0 ? (
          <Empty>Belum ada data arus kas.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[48rem] text-left text-sm">
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
                  <tr key={r.entryId} className="border-b border-border">
                    <td className="py-2 pr-2">{r.monthLabel}</td>
                    <td className="py-2 pr-2 font-medium">{r.productName}</td>
                    <td className="py-2 pr-2 text-right tabular-nums">{r.unitsSold}</td>
                    <td className="py-2 pr-2 text-right tabular-nums">
                      {rupiah(r.revenue)}
                    </td>
                    <td className="py-2 pr-2 text-right tabular-nums">
                      {rupiah(r.totalCost)}
                    </td>
                    <td className="py-2 pr-2 text-right tabular-nums font-semibold">
                      {rupiah(r.profit)}
                    </td>
                    <td className="py-2 pr-2 text-right tabular-nums">
                      {percent(r.profitMarginPct)}
                    </td>
                    <td className="py-2 text-right">
                      <Button
                        variant="danger"
                        size="sm"
                        type="button"
                        onClick={() => setPendingDelete(r.entryId)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
              {summary ? (
                <tfoot>
                  <tr className="font-bold">
                    <td className="py-2" colSpan={3}>
                      TOTAL
                    </td>
                    <td className="py-2 text-right">{rupiah(summary.totalRevenue)}</td>
                    <td className="py-2 text-right">{rupiah(summary.totalCost)}</td>
                    <td className="py-2 text-right">{rupiah(summary.totalProfit)}</td>
                    <td className="py-2 text-right">
                      {percent(summary.averageProfitMarginPct)}
                    </td>
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
