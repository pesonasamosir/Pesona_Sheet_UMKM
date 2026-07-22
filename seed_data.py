"""
Skrip opsional untuk mengisi data contoh (sama seperti data dummy pada
spreadsheet asli) supaya aplikasi bisa langsung dicoba.

PENTING: sesuai catatan sheet 'Panduan Teknis', angka-angka ini adalah
DATA DUMMY untuk menguji struktur perhitungan -- BUKAN data riil UMKM.
Jalankan: python seed_data.py
"""

from app import create_app
from models import db, Category, Product, VariableCostComponent, FixedCost, OverheadCost, Material, CashFlowEntry


def seed():
    app = create_app()
    with app.app_context():
        if Product.query.count() > 0:
            print("Data sudah ada, seed dibatalkan (hapus database/app.db jika ingin mengulang).")
            return

        cat = Category(name="Minuman")
        db.session.add(cat)
        db.session.flush()

        produk_a = Product(name="Produk A", category_id=cat.id, selling_price=25000)
        produk_b = Product(name="Produk B", category_id=cat.id, selling_price=18000)
        db.session.add_all([produk_a, produk_b])
        db.session.flush()

        db.session.add_all([
            VariableCostComponent(product_id=produk_a.id, component_name="Bahan Baku Utama", unit="kg", qty_per_unit=0.2, price_per_unit=15000),
            VariableCostComponent(product_id=produk_a.id, component_name="Bahan Pendukung", unit="pcs", qty_per_unit=1, price_per_unit=2000),
            VariableCostComponent(product_id=produk_a.id, component_name="Kemasan Primer", unit="pcs", qty_per_unit=1, price_per_unit=1000),
            VariableCostComponent(product_id=produk_b.id, component_name="Bahan Baku Utama", unit="kg", qty_per_unit=0.15, price_per_unit=15000),
            VariableCostComponent(product_id=produk_b.id, component_name="Bahan Pendukung", unit="pcs", qty_per_unit=2, price_per_unit=1500),
            VariableCostComponent(product_id=produk_b.id, component_name="Kemasan Primer", unit="pcs", qty_per_unit=1, price_per_unit=1200),
        ])

        db.session.add_all([
            FixedCost(category="Sewa Tempat/Lahan Usaha", amount_per_month=500000),
            FixedCost(category="Gaji Karyawan Tetap", amount_per_month=0),
            FixedCost(category="Penyusutan Peralatan", amount_per_month=100000),
        ])

        db.session.add_all([
            OverheadCost(category="Listrik", amount_per_month=300000, allocation_pct=0.7),
            OverheadCost(category="Air", amount_per_month=100000, allocation_pct=0.5),
            OverheadCost(category="Transportasi/Distribusi", amount_per_month=200000, allocation_pct=1.0),
            OverheadCost(category="Kemasan Sekunder & Packing", amount_per_month=150000, allocation_pct=1.0),
        ])

        db.session.add_all([
            Material(name="Bahan Baku A (contoh)", unit="kg", avg_demand_month=60, max_demand_month=100,
                      avg_lead_time_days=5, max_lead_time_days=10, order_cost=50000,
                      holding_cost_per_unit_month=500, purchase_price=15000, current_stock=40),
            Material(name="Bahan Baku B (contoh)", unit="pcs", avg_demand_month=200, max_demand_month=350,
                      avg_lead_time_days=3, max_lead_time_days=7, order_cost=30000,
                      holding_cost_per_unit_month=150, purchase_price=2000, current_stock=150),
            Material(name="Bahan Baku C (contoh)", unit="pcs", avg_demand_month=150, max_demand_month=260,
                      avg_lead_time_days=4, max_lead_time_days=8, order_cost=25000,
                      holding_cost_per_unit_month=200, purchase_price=1000, current_stock=80),
        ])

        db.session.add_all([
            CashFlowEntry(month_label="Bulan 1", product_id=produk_a.id, units_sold=300, selling_price=25000, fixed_cost_allocation_pct=0.6, overhead_allocation_pct=0.6),
            CashFlowEntry(month_label="Bulan 1", product_id=produk_b.id, units_sold=250, selling_price=18000, fixed_cost_allocation_pct=0.4, overhead_allocation_pct=0.4),
            CashFlowEntry(month_label="Bulan 2", product_id=produk_a.id, units_sold=320, selling_price=25000, fixed_cost_allocation_pct=0.55, overhead_allocation_pct=0.55),
            CashFlowEntry(month_label="Bulan 2", product_id=produk_b.id, units_sold=260, selling_price=18000, fixed_cost_allocation_pct=0.45, overhead_allocation_pct=0.45),
        ])

        db.session.commit()
        print("Data contoh (dummy, sama seperti spreadsheet asli) berhasil dimasukkan.")


if __name__ == "__main__":
    seed()
