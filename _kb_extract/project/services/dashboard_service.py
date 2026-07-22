"""
Ringkasan Dashboard, setara sheet 'Visualisasi'.

Catatan penyesuaian yang disengaja (harap dibaca):
Pada spreadsheet asli, sel C19/C20 (jumlah bahan yang perlu segera pesan)
mengambil COUNTIF dari sheet 'Inventori Mingguan', yaitu satu tabel contoh
skenario MRP mingguan yang berdiri sendiri (tidak terhubung ke master data
bahan baku). Karena aplikasi ini dibuat agar bahan baku bisa ditambah/diubah
secara dinamis, angka reorder di dashboard web ini dihitung dari seluruh
data Material yang tersimpan di database (model EOQ dan LFL pada sheet
'Inventori Harian'), BUKAN dari skenario mingguan contoh tersebut.
Ini pilihan desain yang disengaja supaya dashboard tetap akurat walau
data bahan baku terus berubah -- bukan kesalahan konversi rumus.
"""

from models import Material, CashFlowEntry
from services.cost_service import total_fixed_cost, total_overhead_cost
from services.finance_service import cashflow_totals
from services.inventory_service import count_reorder_needed


def dashboard_summary():
    materials = Material.query.all()
    entries = CashFlowEntry.query.all()

    cf_totals = cashflow_totals(entries) if entries else {
        "total_revenue": 0, "total_variable_cost": 0, "total_allocated_fixed_cost": 0,
        "total_allocated_overhead": 0, "total_cost": 0, "total_profit": 0,
        "average_profit_margin_pct": 0,
    }

    return {
        "total_fixed_cost": total_fixed_cost(),
        "total_overhead_cost": total_overhead_cost(),
        "total_variable_cost_running": cf_totals["total_variable_cost"],
        "total_revenue": cf_totals["total_revenue"],
        "total_cost": cf_totals["total_cost"],
        "total_profit": cf_totals["total_profit"],
        "average_profit_margin_pct": cf_totals["average_profit_margin_pct"],
        "reorder_needed_eoq": count_reorder_needed(materials, "eoq") if materials else 0,
        "reorder_needed_lfl": count_reorder_needed(materials, "lfl") if materials else 0,
        "jumlah_produk": None,  # diisi di route (butuh query Product, hindari circular import)
    }
