"use client";

import { useRef, useState } from "react";
import { Upload, ShieldCheck, RotateCcw, Trash2, FileJson, FileSpreadsheet } from "lucide-react";
import { useStore } from "@/lib/store";
import { exportExcel, exportJson, parseJsonFile } from "@/lib/io";
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  PageHeader,
} from "@/components/ui";

export default function DataPage() {
  const { ready, data, seed, wipe, importSnapshot } = useStore();
  const jsonRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmWipe, setConfirmWipe] = useState(false);
  const [confirmReseed, setConfirmReseed] = useState(false);

  if (!ready || !data) return <p className="text-sm text-muted">Memuat…</p>;

  return (
    <div>
      <PageHeader
        title="Data Backup & Portabilitas"
        lead="Export/Import manual antar perangkat. Tidak ada cloud sync — total isolasi per browser."
        actions={<Badge tone="ok">IndexedDB lokal</Badge>}
      />

      <Card className="mb-4" title="Privasi perangkat">
        <div className="flex gap-3 text-sm leading-relaxed text-muted">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
          <div>
            <p>
              Semua transaksi, produk, biaya, dan inventori hanya tersimpan di{" "}
              <strong className="text-fg">IndexedDB browser ini</strong>. Orang lain
              yang membuka situs yang sama di perangkat berbeda mendapat lingkungan
              kosong/terpisah — zero data leakage antar pengunjung.
            </p>
            <p className="mt-2">
              Tidak ada server database bersama, tidak ada tracking, dan tidak ada
              telemetri.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Export">
          <div className="grid gap-2">
            <Button
              onClick={() => {
                exportExcel(data);
                setMessage("Excel berhasil diunduh.");
              }}
            >
              <FileSpreadsheet className="size-4" /> Export Excel (.xlsx)
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                exportJson(data);
                setMessage("JSON backup berhasil diunduh.");
              }}
            >
              <FileJson className="size-4" /> Export JSON Backup
            </Button>
          </div>
        </Card>

        <Card title="Import">
          <input
            ref={jsonRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                const snap = await parseJsonFile(file);
                await importSnapshot(snap);
                setMessage("Backup JSON berhasil dipulihkan ke perangkat ini.");
              } catch (err) {
                setMessage(
                  err instanceof Error ? err.message : "Gagal mengimpor JSON.",
                );
              } finally {
                e.target.value = "";
              }
            }}
          />
          <div className="grid gap-2">
            <Button onClick={() => jsonRef.current?.click()}>
              <Upload className="size-4" /> Import JSON Backup
            </Button>
            <p className="text-xs text-muted">
              Import mengganti seluruh data lokal dengan isi file backup. Export
              dulu sebelum import jika ingin menyimpan data sekarang.
            </p>
          </div>
        </Card>
      </div>

      <Card title="Utilitas data" className="mt-4">
        <p className="mb-3 text-sm text-muted">
          Kunjungan pertama dan setelah hapus data: semuanya kosong (0 / tanpa
          entri). Data dummy Excel hanya dimuat jika Anda tekan tombol di bawah.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setConfirmReseed(true)}>
            <RotateCcw className="size-4" /> Muat Data Dummy Excel (opsional)
          </Button>
          <Button variant="danger" onClick={() => setConfirmWipe(true)}>
            <Trash2 className="size-4" /> Hapus Semua Data Lokal
          </Button>
        </div>
        <p className="mt-3 text-xs text-muted">
          Ringkas: {data.products.length} produk · {data.materials.length} bahan ·{" "}
          {data.cashflow.length} entri arus kas · {data.fixedCosts.length} fixed ·{" "}
          {data.overheadCosts.length} overhead
        </p>
      </Card>

      {message ? (
        <p className="mt-4 rounded-xl border border-border bg-primary-soft px-3 py-2 text-sm">
          {message}
        </p>
      ) : null}

      <ConfirmDialog
        open={confirmWipe}
        title="Hapus semua data lokal?"
        message="Semua produk, biaya, inventori, dan arus kas di browser ini akan dikosongkan (nilai 0, tanpa entri contoh). Tidak bisa dibatalkan kecuali Anda punya file backup."
        confirmLabel="Hapus semua"
        onCancel={() => setConfirmWipe(false)}
        onConfirm={async () => {
          await wipe();
          setConfirmWipe(false);
          setMessage("Semua data lokal telah dikosongkan. Tidak ada entri tersisa.");
        }}
      />

      <ConfirmDialog
        open={confirmReseed}
        title="Ganti dengan data dummy?"
        message="Data lokal saat ini akan diganti dengan contoh dari Sheet Inventori dan Finansial UMKM."
        confirmLabel="Ya, muat dummy"
        onCancel={() => setConfirmReseed(false)}
        onConfirm={async () => {
          await seed(true);
          setConfirmReseed(false);
          setMessage("Data dummy Excel berhasil dimuat.");
        }}
      />
    </div>
  );
}
