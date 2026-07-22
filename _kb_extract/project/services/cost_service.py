"""
Mesin perhitungan biaya.

Konversi langsung dari sheet:
    - 'Biaya Tetap'         -> total_fixed_cost()
    - 'Biaya Tidak Langsung'-> total_overhead_cost(), overhead detail
    - 'Biaya Variabel'      -> variable cost per produk (lihat Product.total_variable_cost_per_unit
                                 di models/product.py, karena bergantung relasi DB)
"""

from models import db, FixedCost, OverheadCost


def total_fixed_cost():
    """Sheet 'Biaya Tetap' sel C7: =SUM(C3:C6)"""
    total = db.session.query(db.func.coalesce(db.func.sum(FixedCost.amount_per_month), 0)).scalar()
    return round(total, 2)


def total_overhead_cost():
    """Sheet 'Biaya Tidak Langsung' sel E7: =SUM(E3:E6), dimana E=C*D per baris."""
    rows = OverheadCost.query.all()
    return round(sum(r.allocated_amount for r in rows), 2)


def overhead_breakdown():
    """Detail per kategori overhead, dengan kolom E (Overhead Teralokasi) sudah dihitung."""
    rows = OverheadCost.query.all()
    return [
        {
            "id": r.id,
            "category": r.category,
            "amount_per_month": r.amount_per_month,
            "allocation_pct": r.allocation_pct,
            "allocated_amount": r.allocated_amount,
        }
        for r in rows
    ]
