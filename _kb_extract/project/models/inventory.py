"""Model untuk sheet 'Inventori Harian' (Model EOQ+Safety Stock vs LFL+Safety Stock)."""

from models import db


class Material(db.Model):
    """Satu baris bahan baku/barang pada sheet 'Inventori Harian'."""

    __tablename__ = "materials"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)  # Nama Barang/Bahan Baku
    unit = db.Column(db.String(30), nullable=False)  # Satuan

    avg_demand_month = db.Column(db.Float, nullable=False)  # D: Permintaan Rata-rata/Bulan
    max_demand_month = db.Column(db.Float, nullable=False)  # E: Permintaan Maksimum/Bulan
    avg_lead_time_days = db.Column(db.Float, nullable=False)  # F: Lead Time Rata-rata (hari)
    max_lead_time_days = db.Column(db.Float, nullable=False)  # G: Lead Time Maksimum (hari)
    order_cost = db.Column(db.Float, nullable=False)  # H: Biaya Pemesanan per Order (Rp)
    holding_cost_per_unit_month = db.Column(db.Float, nullable=False)  # I: Biaya Simpan/Unit/Bulan
    purchase_price = db.Column(db.Float, nullable=False, default=0)  # J: Harga Beli per Unit
    current_stock = db.Column(db.Float, nullable=False, default=0)  # K: Stok Saat Ini

    def __repr__(self):
        return f"<Material {self.name}>"
