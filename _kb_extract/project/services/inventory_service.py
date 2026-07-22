"""
Mesin perhitungan inventori.

Konversi 1:1 dari sheet 'Inventori Harian' (Model EOQ+Safety Stock vs LFL+Safety Stock).
Setiap fungsi dikomentari dengan referensi sel/rumus Excel aslinya supaya mudah
diverifikasi bahwa hasil Python identik dengan spreadsheet.

Catatan penting (WAJIB, dari sheet 'Panduan Teknis' & rumus asli):
  - Rumus Safety Stock di sini memakai (PermintaanHarianMaks - PermintaanHarianRata2) * LeadTimeMaksimum.
    Ini BUKAN rumus safety stock buku teks yang paling umum
    (Max Demand x Max Lead Time) - (Avg Demand x Avg Lead Time),
    tetapi ini adalah rumus yang benar-benar dipakai di spreadsheet asli Ben,
    sehingga dipertahankan apa adanya agar hasilnya identik.
  - Reorder Point (ROP) di sini memakai Permintaan Harian Rata-rata x Lead Time
    Maksimum, ditambah Safety Stock -- juga varian khusus dari spreadsheet asli,
    bukan rumus ROP standar (yang biasanya pakai avg lead time).
"""

import math
from models import Setting


def _round0(x):
    """Meniru ROUND(x, 0) Excel: pembulatan matematis standar ke integer terdekat."""
    return int(math.floor(x + 0.5)) if x >= 0 else int(math.ceil(x - 0.5))


def calculate_material_inventory(material, hari_kerja_per_bulan=None, bulan_per_tahun=None):
    """
    material: objek Material (atau dict dengan atribut/keys yang sama).
    Mengembalikan dict berisi seluruh kolom hasil (L..V) sheet 'Inventori Harian'.
    """
    hari_kerja = hari_kerja_per_bulan if hari_kerja_per_bulan is not None else Setting.get("hari_kerja_per_bulan")
    bulan_tahun = bulan_per_tahun if bulan_per_tahun is not None else Setting.get("bulan_per_tahun")

    D = material.avg_demand_month
    E = material.max_demand_month
    F = material.avg_lead_time_days
    G = material.max_lead_time_days
    H = material.order_cost
    I = material.holding_cost_per_unit_month
    K = material.current_stock

    # L4: =D4/Asumsi!C4  (Permintaan Harian Rata-rata)
    L = D / hari_kerja
    # M4: =E4/Asumsi!C4  (Permintaan Harian Maksimum)
    M = E / hari_kerja
    # N4: =D4*Asumsi!C5  (Permintaan Tahunan / D tahunan)
    N = D * bulan_tahun
    # O4: =ROUND(SQRT(2*N4*H4/(I4*Asumsi!C5)),0)  (EOQ)
    eoq_raw = math.sqrt((2 * N * H) / (I * bulan_tahun)) if I > 0 and bulan_tahun > 0 else 0
    O = _round0(eoq_raw)
    # P4: =ROUND((M4-L4)*G4,0)  (Safety Stock, dipakai untuk model EOQ maupun LFL)
    P = _round0((M - L) * G)
    # Q4: =ROUND(L4*F4+P4,0)  (Reorder Point model EOQ)
    Q = _round0(L * F + P)
    # R4: =IF(K4<=Q4,"Segera Pesan","Aman")
    R = "Segera Pesan" if K <= Q else "Aman"
    # S4: =D4  (Kebutuhan Bulan Depan, model LFL)
    S = D
    # T4: =P4  (Safety Stock LFL, sama dengan Safety Stock EOQ)
    T = P
    # U4: =MAX(S4+T4-K4,0)  (Jumlah Pesan, model LFL)
    U = max(S + T - K, 0)
    # V4: =IF(K4<S4+T4,"Segera Pesan","Aman")
    V = "Segera Pesan" if K < (S + T) else "Aman"

    return {
        "material_id": getattr(material, "id", None),
        "material_name": material.name,
        "unit": material.unit,
        "permintaan_harian_rata2": round(L, 4),
        "permintaan_harian_maksimum": round(M, 4),
        "permintaan_tahunan": round(N, 2),
        "eoq": O,
        "safety_stock": P,
        "reorder_point": Q,
        "status_reorder_eoq": R,
        "kebutuhan_bulan_depan_lfl": S,
        "safety_stock_lfl": T,
        "jumlah_pesan_lfl": U,
        "status_reorder_lfl": V,
    }


def calculate_all_materials(materials):
    return [calculate_material_inventory(m) for m in materials]


def count_reorder_needed(materials, model="eoq"):
    """Dipakai Dashboard: hitung berapa bahan baku yang statusnya 'Segera Pesan'."""
    results = calculate_all_materials(materials)
    key = "status_reorder_eoq" if model == "eoq" else "status_reorder_lfl"
    return sum(1 for r in results if r[key] == "Segera Pesan")
