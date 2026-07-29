"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { DuplicateError, useStore } from "@/lib/store";
import { previewInventory } from "@/lib/calc";
import { num } from "@/lib/format";
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  Empty,
  Field,
  Input,
  NumberInput,
  PageHeader,
  PreviewBox,
} from "@/components/ui";

const emptyForm = {
  name: "",
  unit: "kg",
  avgDemandMonth: 0,
  maxDemandMonth: 0,
  avgLeadTimeDays: 0,
  maxLeadTimeDays: 0,
  orderCost: 0,
  holdingCostPerUnitMonth: 0,
  purchasePrice: 0,
  currentStock: 0,
};

export default function InventoriPage() {
  const { ready, data, inventoryRows, addMaterial, deleteMaterial, updateMaterial } =
    useStore();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const preview = useMemo(() => {
    if (!data) return null;
    return previewInventory(form, data.settings);
  }, [form, data]);

  if (!ready || !data) return <p className="text-sm text-muted">Memuat…</p>;

  return (
    <div>
      <PageHeader
        title="Inventori & EOQ"
        lead="Model EOQ + Safety Stock vs LFL + Safety Stock — rumus 1:1 dari sheet Inventori Harian."
        actions={
          <Link href="/inventori/mingguan">
            <Button variant="secondary">Inventori Mingguan</Button>
          </Link>
        }
      />

      {error ? (
        <p className="mb-4 rounded-xl border border-[color-mix(in_srgb,var(--danger)_35%,var(--border))] bg-danger-soft px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <Card title="+ Tambah / Update Stok Bahan Baku" className="mb-4">
        <form
          className="grid gap-3 md:grid-cols-2"
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            try {
              if (!form.name.trim()) return;
              await addMaterial({ ...form, name: form.name.trim() });
              setForm(emptyForm);
            } catch (err) {
              setError(
                err instanceof DuplicateError || err instanceof Error
                  ? err.message
                  : "Gagal menambah bahan.",
              );
            }
          }}
        >
          {(
            [
              ["name", "Nama Bahan", "text"],
              ["unit", "Satuan", "text"],
            ] as const
          ).map(([key, label]) => (
            <Field key={key} label={label}>
              <Input
                value={form[key]}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    [key]: e.target.value,
                  }))
                }
                required={key === "name"}
              />
            </Field>
          ))}
          {(
            [
              ["avgDemandMonth", "Permintaan Rata-rata/Bulan"],
              ["maxDemandMonth", "Permintaan Maksimum/Bulan"],
              ["avgLeadTimeDays", "Lead Time Rata-rata (hari)"],
              ["maxLeadTimeDays", "Lead Time Maksimum (hari)"],
              ["orderCost", "Biaya Pemesanan / Order (Rp)"],
              ["holdingCostPerUnitMonth", "Biaya Simpan / Unit / Bulan"],
              ["purchasePrice", "Harga Beli / Unit"],
              ["currentStock", "Stok Saat Ini"],
            ] as const
          ).map(([key, label]) => (
            <Field key={key} label={label}>
              <NumberInput
                value={form[key]}
                onValueChange={(n) => setForm((f) => ({ ...f, [key]: n }))}
                min={0}
              />
            </Field>
          ))}

          {preview ? (
            <div className="md:col-span-2">
              <PreviewBox>
                <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-4">
                  <p>
                    EOQ: <strong>{preview.eoq}</strong>
                  </p>
                  <p>
                    Safety Stock: <strong>{preview.safetyStock}</strong>
                  </p>
                  <p>
                    ROP: <strong>{preview.reorderPoint}</strong>
                  </p>
                  <p>
                    Status EOQ:{" "}
                    <Badge tone={preview.statusReorderEoq === "Segera Pesan" ? "danger" : "ok"}>
                      {preview.statusReorderEoq}
                    </Badge>
                  </p>
                  <p>
                    Pesan LFL: <strong>{num(preview.jumlahPesanLfl, 0)}</strong>
                  </p>
                  <p>
                    Status LFL:{" "}
                    <Badge tone={preview.statusReorderLfl === "Segera Pesan" ? "danger" : "ok"}>
                      {preview.statusReorderLfl}
                    </Badge>
                  </p>
                </div>
              </PreviewBox>
            </div>
          ) : null}

          <Button type="submit" className="md:col-span-2">
            <Plus className="size-4" /> Tambah Bahan Baku
          </Button>
        </form>
      </Card>

      <Card title="Hasil Perhitungan Inventori">
        {inventoryRows.length === 0 ? (
          <Empty>Belum ada bahan baku.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[56rem] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
                  <th className="py-2 pr-2">Bahan</th>
                  <th className="py-2 pr-2 text-right">Stok</th>
                  <th className="py-2 pr-2 text-right">EOQ</th>
                  <th className="py-2 pr-2 text-right">SS</th>
                  <th className="py-2 pr-2 text-right">ROP</th>
                  <th className="py-2 pr-2">EOQ</th>
                  <th className="py-2 pr-2 text-right">Pesan LFL</th>
                  <th className="py-2 pr-2">LFL</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {inventoryRows.map((r) => {
                  const mat = data.materials.find((m) => m.id === r.materialId);
                  return (
                    <tr key={r.materialId} className="border-b border-border">
                      <td className="py-2 pr-2 font-medium">
                        {r.materialName}
                        <div className="text-xs text-muted">{r.unit}</div>
                      </td>
                      <td className="py-2 pr-2 text-right tabular-nums">{r.currentStock}</td>
                      <td className="py-2 pr-2 text-right tabular-nums">{r.eoq}</td>
                      <td className="py-2 pr-2 text-right tabular-nums">{r.safetyStock}</td>
                      <td className="py-2 pr-2 text-right tabular-nums">{r.reorderPoint}</td>
                      <td className="py-2 pr-2">
                        <Badge tone={r.statusReorderEoq === "Segera Pesan" ? "danger" : "ok"}>
                          {r.statusReorderEoq}
                        </Badge>
                      </td>
                      <td className="py-2 pr-2 text-right tabular-nums">
                        {num(r.jumlahPesanLfl, 0)}
                      </td>
                      <td className="py-2 pr-2">
                        <Badge tone={r.statusReorderLfl === "Segera Pesan" ? "danger" : "ok"}>
                          {r.statusReorderLfl}
                        </Badge>
                      </td>
                      <td className="py-2 text-right">
                        <div className="flex justify-end gap-1">
                          {mat ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={async () => {
                                const next = Number(
                                  prompt("Stok saat ini?", String(mat.currentStock)),
                                );
                                if (Number.isFinite(next)) {
                                  await updateMaterial({ ...mat, currentStock: next });
                                }
                              }}
                            >
                              Stok
                            </Button>
                          ) : null}
                          <Button
                            type="button"
                            size="sm"
                            variant="danger"
                            onClick={() => setPendingDelete(r.materialId)}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 text-xs text-muted">
          EOQ = ROUND(√(2·D·S)/(H·bulan), 0) dengan D = permintaan tahunan.
          Safety Stock = (perm. harian maks − rata2) × lead time maks.
        </p>
      </Card>

      <ConfirmDialog
        open={!!pendingDelete}
        title="Hapus bahan baku?"
        message="Data inventori bahan ini akan dihapus dari perangkat lokal."
        onCancel={() => setPendingDelete(null)}
        onConfirm={async () => {
          if (pendingDelete) await deleteMaterial(pendingDelete);
          setPendingDelete(null);
        }}
      />
    </div>
  );
}
