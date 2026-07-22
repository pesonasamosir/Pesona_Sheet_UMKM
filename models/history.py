"""Model riwayat perhitungan (audit trail semua kalkulasi yang dijalankan user)."""

import json
from datetime import datetime
from models import db


class CalculationHistory(db.Model):
    __tablename__ = "calculation_history"

    id = db.Column(db.Integer, primary_key=True)
    calc_type = db.Column(db.String(50), nullable=False)  # 'inventory', 'cashflow', dst
    reference_name = db.Column(db.String(150), nullable=True)  # nama produk/bahan terkait
    input_json = db.Column(db.Text, nullable=False)
    result_json = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    @classmethod
    def log(cls, calc_type, reference_name, input_data, result_data):
        entry = cls(
            calc_type=calc_type,
            reference_name=reference_name,
            input_json=json.dumps(input_data, default=str),
            result_json=json.dumps(result_data, default=str),
        )
        db.session.add(entry)
        db.session.commit()
        return entry

    @property
    def input_data(self):
        return json.loads(self.input_json)

    @property
    def result_data(self):
        return json.loads(self.result_json)
