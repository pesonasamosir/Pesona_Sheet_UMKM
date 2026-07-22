"""
Model Master Data Produk.

Relasi:
    Category 1---N Product
    Product  1---N VariableCostComponent (bahan/komponen penyusun 1 unit produk)
"""

from datetime import datetime
from models import db


class Category(db.Model):
    __tablename__ = "categories"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)

    products = db.relationship("Product", backref="category", lazy=True)

    def __repr__(self):
        return f"<Category {self.name}>"


class Product(db.Model):
    __tablename__ = "products"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), unique=True, nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey("categories.id"), nullable=True)
    selling_price = db.Column(db.Float, nullable=False, default=0)
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    components = db.relationship(
        "VariableCostComponent",
        backref="product",
        lazy=True,
        cascade="all, delete-orphan",
    )
    cashflow_entries = db.relationship(
        "CashFlowEntry", backref="product", lazy=True, cascade="all, delete-orphan"
    )

    @property
    def total_variable_cost_per_unit(self):
        """
        Setara sheet 'Biaya Variabel' kolom J (SUMIF total variable cost per produk).
        Dihitung dari relasi komponen, bukan hardcode, sehingga otomatis
        menyesuaikan begitu komponen ditambah/diubah/dihapus.
        """
        return sum(c.cost_per_unit for c in self.components)

    def __repr__(self):
        return f"<Product {self.name}>"


class VariableCostComponent(db.Model):
    """Setara satu baris pada sheet 'Biaya Variabel' (bahan/komponen per produk)."""

    __tablename__ = "variable_cost_components"

    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=False)
    component_name = db.Column(db.String(150), nullable=False)
    unit = db.Column(db.String(30), nullable=False)  # kg, pcs, ml, dst
    qty_per_unit = db.Column(db.Float, nullable=False)  # kolom E
    price_per_unit = db.Column(db.Float, nullable=False)  # kolom F (Rp per satuan)

    @property
    def cost_per_unit(self):
        """Setara sheet 'Biaya Variabel' kolom G: =E*F"""
        return round(self.qty_per_unit * self.price_per_unit, 2)

    def __repr__(self):
        return f"<Component {self.component_name} for product_id={self.product_id}>"
