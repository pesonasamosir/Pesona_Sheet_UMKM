"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { calculateWeeklyMrp } from "@/lib/calc";
import { newId } from "@/lib/db";
import { num, rupiah } from "@/lib/format";
import {
  Badge,
  Button,
  Card,
  Empty,
  Field,
  Input,
  PageHeader,
  Select,
} from "@/components/ui";
import type { WeeklyPlan } from "@/lib/types";

export default function InventoriMingguanPage() {
  const { ready, data, upsertWeeklyPlan, deleteWeeklyPlan } = useStore();
  const [planId, setPlanId] = useState<string>("");

  const plan = useMemo(() => {
    if (!data) return null;
    return data.weeklyPlans.find((p) => p.id === planId) ?? data.weeklyPlans[0] ?? null;
  }, [data, planId]);

  const result = useMemo(() => (plan ? calculateWeeklyMrp(plan) : null), [plan]);

  if (!ready || !data) return <p className="text-sm text-muted">Memuat…</p>;

  async function createPlan() {
    const material = data!.materials[0];
    if (!material) return;
    const p: WeeklyPlan = {
      id: newId(),
      materialId: material.id,
      name: `Skenario — ${material.name}`,
      leadTimeWeeks: 3,
      safetyStock: 45,
      holdingCostPerUnitWeek: 12,
      orderCost: 25,
      initialStock: material.currentStock,
      weeklyDemand: Array(12).fill(150),
      scheduledReceipts: Array(12).fill(0),
    };
    await upsertWeeklyPlan(p);
    setPlanId(p.id);
  }

  return (
    <div>
      <PageHeader
        title="Inventori Mingguan"
        lead="Perencanaan MRP lot-for-lot mingguan (sheet Inventori Mingguan) — skenario lokal per perangkat."
        actions={
          <>
            <Link href="/inventori">
              <Button variant="secondary">Kembali ke EOQ</Button>
            </Link>
            <Button onClick={() => void createPlan()}>+ Skenario Baru</Button>
          </>
        }
      />

      {data.weeklyPlans.length === 0 ? (
        <Empty>Belum ada skenario mingguan. Buat dari bahan baku yang ada.</Empty>
      ) : (
        <>
          <Card title="Pilih Skenario" className="mb-4">
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Skenario">
                <Select
                  value={plan?.id ?? ""}
                  onChange={(e) => setPlanId(e.target.value)}
                >
                  {data.weeklyPlans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </Select>
              </Field>
              {plan ? (
                <div className="flex items-end gap-2">
                  <Button
                    variant="danger"
                    onClick={() => void deleteWeeklyPlan(plan.id)}
                  >
                    Hapus Skenario
                  </Button>
                </div>
              ) : null}
            </div>
          </Card>

          {plan && result ? (
            <>
              <Card title="Parameter" className="mb-4">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {(
                    [
                      ["leadTimeWeeks", "Lead Time (minggu)"],
                      ["safetyStock", "Safety Stock"],
                      ["holdingCostPerUnitWeek", "Biaya Simpan / Unit / Minggu"],
                      ["orderCost", "Biaya Order"],
                      ["initialStock", "Stok Awal"],
                    ] as const
                  ).map(([key, label]) => (
                    <Field key={key} label={label}>
                      <Input
                        type="number"
                        value={plan[key]}
                        onChange={(e) =>
                          void upsertWeeklyPlan({
                            ...plan,
                            [key]: Number(e.target.value),
                          })
                        }
                      />
                    </Field>
                  ))}
                </div>
              </Card>

              <Card title="Kebutuhan per Minggu">
                <div className="mb-3 flex flex-wrap gap-2 text-sm">
                  <Badge tone="neutral">
                    Biaya simpan {rupiah(result.totalHoldingCost)}
                  </Badge>
                  <Badge tone="neutral">
                    Biaya order {rupiah(result.totalOrderCost)}
                  </Badge>
                  <Badge tone="ok">Total {rupiah(result.totalCost)}</Badge>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[48rem] text-left text-xs">
                    <thead>
                      <tr className="border-b border-border text-muted">
                        <th className="py-2 pr-2">Metrik</th>
                        {plan.weeklyDemand.map((_, i) => (
                          <th key={i} className="py-2 pr-2 text-right">
                            M{i + 1}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-border">
                        <td className="py-1 pr-2 font-medium">Demand</td>
                        {plan.weeklyDemand.map((d, i) => (
                          <td key={i} className="py-1 pr-2 text-right">
                            <Input
                              className="min-h-8 px-1 text-right text-xs"
                              type="number"
                              value={d}
                              onChange={(e) => {
                                const weeklyDemand = [...plan.weeklyDemand];
                                weeklyDemand[i] = Number(e.target.value);
                                void upsertWeeklyPlan({ ...plan, weeklyDemand });
                              }}
                            />
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b border-border">
                        <td className="py-1 pr-2">Ending Stock</td>
                        {result.endingStock.map((v, i) => (
                          <td key={i} className="py-1 pr-2 text-right tabular-nums">
                            {num(v, 0)}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b border-border">
                        <td className="py-1 pr-2">Planned Receipt</td>
                        {result.plannedOrderReceipts.map((v, i) => (
                          <td key={i} className="py-1 pr-2 text-right tabular-nums">
                            {num(v, 0)}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b border-border">
                        <td className="py-1 pr-2">Order Release</td>
                        {result.plannedOrderReleases.map((v, i) => (
                          <td key={i} className="py-1 pr-2 text-right tabular-nums">
                            {num(v, 0)}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-1 pr-2">Status</td>
                        {result.reorderStatus.map((s, i) => (
                          <td key={i} className="py-1 pr-2 text-right">
                            <Badge tone={s === "Segera Pesan" ? "danger" : "ok"}>
                              {s === "Segera Pesan" ? "Pesan" : "Aman"}
                            </Badge>
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          ) : null}
        </>
      )}
    </div>
  );
}
