"""Model untuk sheet 'Arus Kas' (Cash Flow & Profit Bulanan per Produk)."""

from models import db


class CashFlowEntry(db.Model):
    __tablename__ = "cashflow_entries"

    id = db.Column(db.Integer, primary_key=True)
    month_label = db.Column(db.String(50), nullable=False)  # "Bulan 1", atau nama bulan bebas
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=False)
    units_sold = db.Column(db.Float, nullable=False, default=0)  # C: Unit Terjual
    selling_price = db.Column(db.Float, nullable=False, default=0)  # D: Harga Jual per Unit

    # % alokasi manual sesuai Panduan Teknis catatan #4 (harus diisi manual oleh pemilik UMKM)
    fixed_cost_allocation_pct = db.Column(db.Float, nullable=False, default=0)  # H
    overhead_allocation_pct = db.Column(db.Float, nullable=False, default=0)  # J
