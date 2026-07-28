"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
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
    deleteProduct,
    addComponent,
    deleteComponent,
    addCategory,
  } = useStore();

  const [name, setName] = useState("");
  const [price, setPrice] = useState(0);
  const [categoryId, setCategoryId] = useState("");
  const [selected, setSelected] = useState<string>("");
  const [compName, setCompName] = useState("");
  const [unit, setUnit] = useState("pcs");
  const [qty, setQty] = useState(1);
  const [compPrice, setCompPrice] = useState(0);
  const [newCat, setNewCat] = useState("");
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const liveHpp = useMemo(() => componentCostPerUnit(qty, compPrice), [qty, compPrice]);

  if (!ready || !data) return <p className="text-sm text-muted">Memuat…</p>;

  const activeId = selected || data.products[0]?.id || "";
  const active = data.products.find((p) => p.id === activeId);
  const comps = data.components.filter((c) => c.productId === activeId);

  return (
    <div>
      <PageHeader
        title="Produk & HPP"
        lead="Hitung HPP per unit dari komponen biaya variabel (qty × harga), lalu agregasi per produk."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Tambah Produk">
          <form
            className="grid gap-3"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!name.trim()) return;
              const id = await addProduct({
                name: name.trim(),
                sellingPrice: price,
                categoryId: categoryId || null,
              });
              setSelected(id);
              setName("");
              setPrice(0);
            }}
          >
            <Field label="Nama Produk">
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </Field>
            <Field label="Harga Jual (Rp)">
              <Input
                type="number"
                min={0}
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
              />
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
                onClick={async () => {
                  if (!newCat.trim()) return;
                  await addCategory(newCat.trim());
                  setNewCat("");
                }}
              >
                + Kategori
              </Button>
            </div>
            <Button type="submit">
              <Plus className="size-4" /> Tambah Produk
            </Button>
          </form>
        </Card>

        <Card title="Daftar Produk">
          {data.products.length === 0 ? (
            <Empty>Belum ada produk.</Empty>
          ) : (
            <ul className="space-y-2">
              {data.products.map((p) => (
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
                      Jual {rupiah(p.sellingPrice)} · HPP {rupiah(hppOf(p.id))}
                    </p>
                  </div>
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
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {active ? (
        <Card
          className="mt-4"
          title={`Komponen HPP — ${active.name}`}
          action={<Badge tone="neutral">HPP {rupiah(hppOf(active.id))}</Badge>}
        >
          <form
            className="mb-4 grid gap-3 md:grid-cols-2"
            onSubmit={async (e) => {
              e.preventDefault();
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
            }}
          >
            <Field label="Nama Bahan/Komponen">
              <Input value={compName} onChange={(e) => setCompName(e.target.value)} required />
            </Field>
            <Field label="Satuan">
              <Input value={unit} onChange={(e) => setUnit(e.target.value)} />
            </Field>
            <Field label="Kuantitas per Unit">
              <Input
                type="number"
                step="any"
                min={0}
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
              />
            </Field>
            <Field label="Harga per Satuan (Rp)">
              <Input
                type="number"
                min={0}
                value={compPrice}
                onChange={(e) => setCompPrice(Number(e.target.value))}
              />
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
          if (pendingDelete) await deleteProduct(pendingDelete);
          setPendingDelete(null);
        }}
      />
    </div>
  );
}
