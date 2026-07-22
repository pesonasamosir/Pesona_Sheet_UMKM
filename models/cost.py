"""Model untuk sheet 'Biaya Tetap', 'Biaya Tidak Langsung', dan 'Asumsi'."""

from models import db


class FixedCost(db.Model):
    """Setara sheet 'Biaya Tetap' (Fixed Cost Bulanan)."""

    __tablename__ = "fixed_costs"

    id = db.Column(db.Integer, primary_key=True)
    category = db.Column(db.String(150), nullable=False)  # Sewa, Gaji, dst
    amount_per_month = db.Column(db.Float, nullable=False, default=0)
    notes = db.Column(db.Text, nullable=True)


class OverheadCost(db.Model):
    """Setara sheet 'Biaya Tidak Langsung' (Overhead Cost Bulanan)."""

    __tablename__ = "overhead_costs"

    id = db.Column(db.Integer, primary_key=True)
    category = db.Column(db.String(150), nullable=False)  # Listrik, Air, dst
    amount_per_month = db.Column(db.Float, nullable=False, default=0)
    allocation_pct = db.Column(db.Float, nullable=False, default=0)  # 0..1

    @property
    def allocated_amount(self):
        """Setara kolom E: =C*D"""
        return round(self.amount_per_month * self.allocation_pct, 2)


class Setting(db.Model):
    """
    Setara sheet 'Asumsi'. Disimpan sebagai key-value supaya fleksibel
    kalau nanti ada parameter tambahan tanpa perlu migrasi kolom baru.
    """

    __tablename__ = "settings"

    key = db.Column(db.String(50), primary_key=True)
    value = db.Column(db.Float, nullable=False)
    description = db.Column(db.String(255), nullable=True)

    # Key baku yang dipakai formula, dengan default sesuai sheet 'Asumsi'
    DEFAULTS = {
        "hari_kerja_per_bulan": (26.0, "Hari kerja efektif UMKM per bulan"),
        "bulan_per_tahun": (12.0, "Jumlah bulan dalam 1 tahun, untuk konversi permintaan tahunan"),
    }

    @classmethod
    def get(cls, key):
        row = cls.query.get(key)
        if row:
            return row.value
        return cls.DEFAULTS[key][0]

    @classmethod
    def ensure_defaults(cls):
        for key, (value, desc) in cls.DEFAULTS.items():
            if not cls.query.get(key):
                db.session.add(cls(key=key, value=value, description=desc))
        db.session.commit()
