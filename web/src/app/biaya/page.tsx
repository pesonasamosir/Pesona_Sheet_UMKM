"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { allocatedOverhead, totalFixedCost, totalOverheadCost } from "@/lib/calc";
import { percent, rupiah } from "@/lib/format";
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
} from "@/components/ui";

export default function BiayaPage() {
  const {
    ready,
    data,
    addFixed,
    deleteFixed,
    addOverhead,
    deleteOverhead,
    updateSettings,
  } = useStore();

  const [fcCat, setFcCat] = useState("");
  const [fcAmt, setFcAmt] = useState(0);
  const [ohCat, setOhCat] = useState("");
  const [ohAmt, setOhAmt] = useState(0);
  const [ohPct, setOhPct] = useState(1);
  const [hariKerja, setHariKerja] = useState<number | null>(null);
  const [bulanTahun, setBulanTahun] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<{ type: "fc" | "oh"; id: string } | null>(
    null,
  );

  if (!ready || !data) return <p className="text-sm text-muted">Memuat…</p>;

  const hariValue = hariKerja ?? data.settings.hariKerjaPerBulan;
  const bulanValue = bulanTahun ?? data.settings.bulanPerTahun;

  const fcTotal = totalFixedCost(data.fixedCosts);
  const ohTotal = totalOverheadCost(data.overheadCosts);

  async function withGuard(fn: () => Promise<void>) {
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan.");
    }
  }

  return (
    <div>
      <PageHeader
        title="Biaya & Overhead"
        lead="Biaya tetap bulanan, overhead teralokasi, dan asumsi hari kerja untuk rumus inventori."
        actions={
          <>
            <Badge tone="neutral">FC {rupiah(fcTotal)}</Badge>
            <Badge tone="neutral">OH {rupiah(ohTotal)}</Badge>
          </>
        }
      />

      {error ? (
        <p className="mb-4 rounded-xl border border-[color-mix(in_srgb,var(--danger)_35%,var(--border))] bg-danger-soft px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Biaya Tetap">
          <form
            className="mb-4 grid gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              void withGuard(async () => {
                if (!fcCat.trim()) return;
                await addFixed({
                  category: fcCat.trim(),
                  amountPerMonth: fcAmt,
                });
                setFcCat("");
                setFcAmt(0);
              });
            }}
          >
            <Field label="Kategori" hint="Tidak boleh duplikat">
              <Input value={fcCat} onChange={(e) => setFcCat(e.target.value)} required />
            </Field>
            <Field label="Nominal per Bulan (Rp)">
              <NumberInput value={fcAmt} onValueChange={setFcAmt} min={0} />
            </Field>
            <Button type="submit">
              <Plus className="size-4" /> Tambah Biaya Tetap
            </Button>
          </form>
          {data.fixedCosts.length === 0 ? (
            <Empty>Belum ada biaya tetap.</Empty>
          ) : (
            <ul className="space-y-2">
              {data.fixedCosts.map((f) => (
                <li
                  key={f.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2 text-sm"
                >
                  <span>
                    <span className="font-medium">{f.category}</span>
                    <span className="mt-0.5 block text-muted">{rupiah(f.amountPerMonth)}</span>
                  </span>
                  <Button
                    variant="danger"
                    size="sm"
                    type="button"
                    onClick={() => setPending({ type: "fc", id: f.id })}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </li>
              ))}
              <li className="flex justify-between px-1 pt-1 text-sm font-bold">
                <span>TOTAL FIXED COST</span>
                <span>{rupiah(fcTotal)}</span>
              </li>
            </ul>
          )}
        </Card>

        <Card title="Biaya Tidak Langsung (Overhead)">
          <form
            className="mb-4 grid gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              void withGuard(async () => {
                if (!ohCat.trim()) return;
                await addOverhead({
                  category: ohCat.trim(),
                  amountPerMonth: ohAmt,
                  allocationPct: ohPct,
                });
                setOhCat("");
                setOhAmt(0);
                setOhPct(1);
              });
            }}
          >
            <Field label="Kategori" hint="Tidak boleh duplikat">
              <Input value={ohCat} onChange={(e) => setOhCat(e.target.value)} required />
            </Field>
            <Field label="Nominal per Bulan (Rp)">
              <NumberInput value={ohAmt} onValueChange={setOhAmt} min={0} />
            </Field>
            <Field label="% Alokasi ke Produksi (0–1)">
              <NumberInput
                value={ohPct}
                onValueChange={setOhPct}
                min={0}
                max={1}
                allowDecimal
              />
            </Field>
            <p className="text-xs text-muted">
              Preview teralokasi: {rupiah(ohAmt * ohPct)}
            </p>
            <Button type="submit">
              <Plus className="size-4" /> Tambah Overhead
            </Button>
          </form>
          {data.overheadCosts.length === 0 ? (
            <Empty>Belum ada overhead.</Empty>
          ) : (
            <ul className="space-y-2">
              {data.overheadCosts.map((o) => (
                <li
                  key={o.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2 text-sm"
                >
                  <span>
                    <span className="font-medium">{o.category}</span>
                    <span className="mt-0.5 block text-muted">
                      {rupiah(o.amountPerMonth)} × {percent(o.allocationPct * 100, 0)} ={" "}
                      {rupiah(allocatedOverhead(o))}
                    </span>
                  </span>
                  <Button
                    variant="danger"
                    size="sm"
                    type="button"
                    onClick={() => setPending({ type: "oh", id: o.id })}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </li>
              ))}
              <li className="flex justify-between px-1 pt-1 text-sm font-bold">
                <span>TOTAL OVERHEAD TERALOKASI</span>
                <span>{rupiah(ohTotal)}</span>
              </li>
            </ul>
          )}
        </Card>
      </div>

      <Card title="Asumsi (Parameter Umum)" className="mt-4">
        <form
          className="grid max-w-lg gap-3"
          onSubmit={async (e) => {
            e.preventDefault();
            await updateSettings({
              hariKerjaPerBulan: hariValue,
              bulanPerTahun: bulanValue,
            });
            setHariKerja(null);
            setBulanTahun(null);
          }}
        >
          <Field
            label="Hari Kerja per Bulan"
            hint="Dipakai untuk konversi permintaan bulanan → harian"
          >
            <NumberInput
              value={hariValue}
              onValueChange={setHariKerja}
              min={1}
              allowDecimal={false}
            />
          </Field>
          <Field
            label="Bulan dalam 1 Tahun"
            hint="Dipakai untuk permintaan tahunan & EOQ"
          >
            <NumberInput
              value={bulanValue}
              onValueChange={setBulanTahun}
              min={1}
              allowDecimal={false}
            />
          </Field>
          <Button type="submit">Simpan Asumsi</Button>
        </form>
      </Card>

      <ConfirmDialog
        open={!!pending}
        title="Hapus item biaya?"
        message="Item ini akan dihapus dari penyimpanan lokal perangkat."
        onCancel={() => setPending(null)}
        onConfirm={async () => {
          if (!pending) return;
          if (pending.type === "fc") await deleteFixed(pending.id);
          else await deleteOverhead(pending.id);
          setPending(null);
        }}
      />
    </div>
  );
}
