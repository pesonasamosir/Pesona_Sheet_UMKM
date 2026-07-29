"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { DuplicateError, useStore } from "@/lib/store";
import { componentCostPerUnit } from "@/lib/calc";
import { rupiah, num } from "@/lib/format";
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
  Select,
} from "@/components/ui";

export default function ProdukPage() {
  const {
    ready,
    data,
    hppOf,
    addProduct,
    updateProduct,
    deleteProduct,
    addComponent,
    deleteComponent,
    addCategory,
    deleteCategory,
  } = useStore();

  const [name, setName] = useState("");
  const [price, setPrice] = useState(0);
  const [categoryId, setCategoryId] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<string>("");
  const [compName, setCompName] = useState("");
  const [unit, setUnit] = useState("pcs");
  const [qty, setQty] = useState(1);
  const [compPrice, setCompPrice] = useState(0);
  const [newCat, setNewCat] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [pendingCatDelete, setPendingCatDelete] = useState<string | null>(null);

  const liveHpp = useMemo(() => componentCostPerUnit(qty, compPrice), [qty, compPrice]);

  if (!ready || !data) return <p className="text-sm text-muted">Memuat…</p>;

  const activeId = selected || data.products[0]?.id || "";
  const active = data.products.find((p) => p.id === activeId);
  const comps = data.components.filter((c) => c.productId === activeId);
  const pendingCat = data.categories.find((c) => c.id === pendingCatDelete);
  const productsUsingCat = pendingCatDelete
    ? data.products.filter((p) => p.categoryId === pendingCatDelete).length
    : 0;
  const editingProduct = editingId
    ? data.products.find((p) => p.id === editingId)
    : null;

  function resetForm() {
    setEditingId(null);
    setName("");
    setPrice(0);
    setCategoryId("");
  }

  function startEdit(id: string) {
    const p = data!.products.find((x) => x.id === id);
    if (!p) return;
    setEditingId(p.id);
    setName(p.name);
    setPrice(p.sellingPrice);
    setCategoryId(p.categoryId ?? "");
    setSelected(p.id);
    setError(null);
  }

  async function withGuard(fn: () => Promise<void>) {
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(
        err instanceof DuplicateError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Gagal menyimpan.",
      );
    }
  }

  return (
    <div>
      <PageHeader
        title="Produk & HPP"
        lead="Hitung HPP per unit dari komponen biaya variabel (qty × harga), lalu agregasi per produk."
      />

      {error ? (
        <p className="mb-4 rounded-xl border border-[color-mix(in_srgb,var(--danger)_35%,var(--border))] bg-danger-soft px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card
          title={editingProduct ? `Edit Produk — ${editingProduct.name}` : "Tambah Produk"}
          action={
            editingId ? (
              <Button type="button" variant="ghost" size="sm" onClick={resetForm}>
                <X className="size-3.5" /> Batal
              </Button>
            ) : null
          }
        >
          <form
            className="grid gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              void withGuard(async () => {
                if (!name.trim()) return;
                if (editingId && editingProduct) {
                  await updateProduct({
                    ...editingProduct,
                    name: name.trim(),
                    sellingPrice: price,
                    categoryId: categoryId || null,
                  });
                  resetForm();
                } else {
                  const id = await addProduct({
                    name: name.trim(),
                    sellingPrice: price,
                    categoryId: categoryId || null,
                  });
                  setSelected(id);
                  resetForm();
                }
              });
            }}
          >
            <Field label="Nama Produk" hint="Tidak boleh sama dengan produk yang sudah ada">
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </Field>
            <Field label="Harga Jual (Rp)">
              <NumberInput value={price} onValueChange={setPrice} min={0} />
            </Field>
            <Field label="Kategori">
              <Select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">— tanpa kategori —</option>
                {data.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="flex flex-wrap gap-2">
              <Input
                placeholder="Kategori baru"
                value={newCat}
                onChange={(e) => setNewCat(e.target.value)}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  void withGuard(async () => {
                    if (!newCat.trim()) return;
                    const id = await addCategory(newCat.trim());
                    setCategoryId(id);
                    setNewCat("");
                  })
                }
              >
                + Kategori
              </Button>
            </div>
            <Button type="submit">
              {editingId ? (
                <>
                  <Pencil className="size-4" /> Simpan Perubahan
                </>
              ) : (
                <>
                  <Plus className="size-4" /> Tambah Produk
                </>
              )}
            </Button>
          </form>
        </Card>

        <Card title="Daftar Produk">
          {data.products.length === 0 ? (
            <Empty>Belum ada produk.</Empty>
          ) : (
            <ul className="space-y-2">
              {data.products.map((p) => {
                const cat = data.categories.find((c) => c.id === p.categoryId);
                return (
                  <li
                    key={p.id}
                    className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-3 py-2 ${
                      p.id === activeId ? "border-primary bg-primary-soft" : "border-border"
                    }`}
                    onClick={() => setSelected(p.id)}
                  >
                    <div>
                      <p className="font-semibold">{p.name}</p>
                      <p className="text-xs text-muted">
                        {cat ? `${cat.name} · ` : ""}
                        Jual {rupiah(p.sellingPrice)} · HPP {rupiah(hppOf(p.id))}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="secondary"
                        size="sm"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          startEdit(p.id);
                        }}
                      >
                        <Pencil className="size-3.5" /> Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPendingDelete(p.id);
                        }}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      <Card title="Kelola Kategori" className="mt-4">
        {data.categories.length === 0 ? (
          <Empty>Belum ada kategori.</Empty>
        ) : (
          <ul className="space-y-2">
            {data.categories.map((c) => {
              const used = data.products.filter((p) => p.categoryId === c.id).length;
              return (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2 text-sm"
                >
                  <span>
                    <span className="font-medium">{c.name}</span>
                    <span className="mt-0.5 block text-xs text-muted">
                      {used === 0
                        ? "Belum dipakai produk"
                        : `Dipakai ${used} produk`}
                    </span>
                  </span>
                  <Button
                    variant="danger"
                    size="sm"
                    type="button"
                    onClick={() => setPendingCatDelete(c.id)}
                  >
                    <Trash2 className="size-3.5" /> Hapus
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {active ? (
        <Card
          className="mt-4"
          title={`Komponen HPP — ${active.name}`}
          action={<Badge tone="neutral">HPP {rupiah(hppOf(active.id))}</Badge>}
        >
          <form
            className="mb-4 grid gap-3 md:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              void withGuard(async () => {
                if (!compName.trim()) return;
                await addComponent({
                  productId: active.id,
                  componentName: compName.trim(),
                  unit,
                  qtyPerUnit: qty,
                  pricePerUnit: compPrice,
                });
                setCompName("");
                setQty(1);
                setCompPrice(0);
              });
            }}
          >
            <Field
              label="Nama Bahan/Komponen"
              hint="Tidak boleh duplikat pada produk yang sama"
            >
              <Input value={compName} onChange={(e) => setCompName(e.target.value)} required />
            </Field>
            <Field label="Satuan">
              <Input value={unit} onChange={(e) => setUnit(e.target.value)} />
            </Field>
            <Field label="Kuantitas per Unit">
              <NumberInput value={qty} onValueChange={setQty} min={0} />
            </Field>
            <Field label="Harga per Satuan (Rp)">
              <NumberInput value={compPrice} onValueChange={setCompPrice} min={0} />
            </Field>
            <div className="md:col-span-2">
              <PreviewBox>
                Preview biaya komponen: <strong>{rupiah(liveHpp)}</strong>{" "}
                <span className="text-muted">(= qty × harga)</span>
              </PreviewBox>
            </div>
            <Button type="submit" className="md:col-span-2">
              <Plus className="size-4" /> Tambah Komponen
            </Button>
          </form>

          {comps.length === 0 ? (
            <Empty>Belum ada komponen untuk produk ini.</Empty>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[32rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
                    <th className="py-2 pr-2">Komponen</th>
                    <th className="py-2 pr-2">Qty</th>
                    <th className="py-2 pr-2">Harga</th>
                    <th className="py-2 pr-2">Biaya/Unit</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {comps.map((c) => (
                    <tr key={c.id} className="border-b border-border">
                      <td className="py-2 pr-2 font-medium">
                        {c.componentName}{" "}
                        <span className="text-muted">({c.unit})</span>
                      </td>
                      <td className="py-2 pr-2 tabular-nums">{num(c.qtyPerUnit, 2)}</td>
                      <td className="py-2 pr-2 tabular-nums">{rupiah(c.pricePerUnit)}</td>
                      <td className="py-2 pr-2 tabular-nums font-semibold">
                        {rupiah(componentCostPerUnit(c.qtyPerUnit, c.pricePerUnit))}
                      </td>
                      <td className="py-2 text-right">
                        <Button
                          variant="danger"
                          size="sm"
                          type="button"
                          onClick={() => deleteComponent(c.id)}
                        >
                          Hapus
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      ) : null}

      <ConfirmDialog
        open={!!pendingDelete}
        title="Hapus produk?"
        message="Produk, komponen HPP, dan entri arus kas terkait akan dihapus dari perangkat ini."
        onCancel={() => setPendingDelete(null)}
        onConfirm={async () => {
          if (pendingDelete) {
            if (editingId === pendingDelete) resetForm();
            await deleteProduct(pendingDelete);
          }
          setPendingDelete(null);
        }}
      />

      <ConfirmDialog
        open={!!pendingCatDelete}
        title="Hapus kategori?"
        message={
          pendingCat
            ? productsUsingCat > 0
              ? `Kategori "${pendingCat.name}" dipakai ${productsUsingCat} produk. Produk tersebut akan menjadi tanpa kategori.`
              : `Kategori "${pendingCat.name}" akan dihapus.`
            : "Kategori akan dihapus."
        }
        onCancel={() => setPendingCatDelete(null)}
        onConfirm={async () => {
          if (pendingCatDelete) {
            if (categoryId === pendingCatDelete) setCategoryId("");
            await deleteCategory(pendingCatDelete);
          }
          setPendingCatDelete(null);
        }}
      />
    </div>
  );
}
