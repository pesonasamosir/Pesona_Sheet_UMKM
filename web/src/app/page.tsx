"use client";

import Link from "next/link";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Plus, Download, AlertTriangle } from "lucide-react";
import { useStore } from "@/lib/store";
import { percent, rupiah } from "@/lib/format";
import { Button, Card, PageHeader, StatTile, Badge } from "@/components/ui";
import { exportExcel } from "@/lib/io";

export default function DashboardPage() {
  const { ready, data, summary, inventoryRows } = useStore();

  if (!ready || !data || !summary) {
    return <p className="text-sm text-muted">Memuat data lokal…</p>;
  }

  const alerts = inventoryRows.filter((r) => r.statusReorderEoq === "Segera Pesan");

  return (
    <div>
      <PageHeader
        title="Dashboard"
        lead="Ringkasan biaya, laba, dan stok — dihitung otomatis dari data lokal perangkat ini."
        actions={
          <>
            <Link href="/arus-kas">
              <Button>
                <Plus className="size-4" /> Catat Penjualan
              </Button>
            </Link>
            <Link href="/inventori">
              <Button variant="secondary">
                <Plus className="size-4" /> Tambah Stok
              </Button>
            </Link>
            <Button variant="secondary" onClick={() => exportExcel(data)}>
              <Download className="size-4" /> Export Excel
            </Button>
          </>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Pendapatan" value={rupiah(summary.totalRevenue)} tone="forest" />
        <StatTile
          label="Laba Bersih"
          value={rupiah(summary.totalProfit)}
          hint={`Margin ${percent(summary.averageProfitMarginPct)}`}
          tone="ok"
        />
        <StatTile
          label="Biaya Tetap"
          value={rupiah(summary.totalFixedCost)}
          hint={`Overhead ${rupiah(summary.totalOverheadCost)}`}
          tone="primary"
        />
        <StatTile
          label="Alert Stok (EOQ)"
          value={String(summary.reorderNeededEoq)}
          hint={`LFL: ${summary.reorderNeededLfl} item`}
          tone={summary.reorderNeededEoq > 0 ? "warn" : "primary"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card title="Tren Revenue vs Biaya" className="lg:col-span-3">
          {summary.monthlySeries.length === 0 ? (
            <p className="text-sm text-muted">Belum ada data arus kas.</p>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={summary.monthlySeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" tick={{ fill: "var(--muted)", fontSize: 12 }} />
                  <YAxis tick={{ fill: "var(--muted)", fontSize: 12 }} width={70} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#1f6b3a" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="cost" name="Biaya" stroke="#b54708" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="profit" name="Profit" stroke="#067647" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card title="Ringkasan Biaya & Laba" className="lg:col-span-2">
          <dl className="space-y-3 text-sm">
            {[
              ["Total Fixed Cost", rupiah(summary.totalFixedCost)],
              ["Total Overhead Teralokasi", rupiah(summary.totalOverheadCost)],
              ["Total Variable Cost", rupiah(summary.totalVariableCost)],
              ["Total Cost", rupiah(summary.totalCost)],
              ["Total Profit", rupiah(summary.totalProfit)],
              ["Margin Rata-rata", percent(summary.averageProfitMarginPct)],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-3 border-b border-border pb-2 last:border-0">
                <dt className="text-muted">{k}</dt>
                <dd className="font-semibold tabular-nums">{v}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>

      <Card
        title="Peringatan Stok — Segera Pesan"
        className="mt-4"
        action={
          alerts.length > 0 ? (
            <Badge tone="danger">{alerts.length} item</Badge>
          ) : (
            <Badge tone="ok">Aman</Badge>
          )
        }
      >
        {alerts.length === 0 ? (
          <p className="text-sm text-muted">Semua bahan baku di atas reorder point (EOQ).</p>
        ) : (
          <ul className="space-y-2">
            {alerts.map((a) => (
              <li
                key={a.materialId}
                className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2 text-sm"
              >
                <span className="flex items-center gap-2 font-medium">
                  <AlertTriangle className="size-4 text-danger" />
                  {a.materialName}
                </span>
                <span className="text-muted">
                  Stok {a.currentStock} · ROP {a.reorderPoint}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
