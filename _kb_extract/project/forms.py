"""
Form input dengan validasi & CSRF protection (Flask-WTF).

Label memakai Bahasa Indonesia yang mudah dipahami, sesuai permintaan
(mis. "Harga Produk" bukan "product_price").
"""

from flask_wtf import FlaskForm
from flask_wtf.file import FileField, FileAllowed, FileRequired
from wtforms import StringField, FloatField, SelectField, TextAreaField, IntegerField
from wtforms.validators import DataRequired, NumberRange, Optional, Length


class ProductForm(FlaskForm):
    name = StringField("Nama Produk", validators=[DataRequired(), Length(max=150)])
    category_id = SelectField("Kategori", coerce=int, validators=[Optional()])
    selling_price = FloatField("Harga Jual per Unit (Rp)", validators=[DataRequired(), NumberRange(min=0)])
    notes = TextAreaField("Catatan", validators=[Optional()])


class CategoryForm(FlaskForm):
    name = StringField("Nama Kategori", validators=[DataRequired(), Length(max=100)])


class VariableCostComponentForm(FlaskForm):
    component_name = StringField("Nama Bahan/Komponen", validators=[DataRequired(), Length(max=150)])
    unit = StringField("Satuan", validators=[DataRequired(), Length(max=30)])
    qty_per_unit = FloatField("Kuantitas per Unit Produk", validators=[DataRequired(), NumberRange(min=0)])
    price_per_unit = FloatField("Harga per Satuan (Rp)", validators=[DataRequired(), NumberRange(min=0)])


class FixedCostForm(FlaskForm):
    category = StringField("Kategori Biaya Tetap", validators=[DataRequired(), Length(max=150)])
    amount_per_month = FloatField("Nominal per Bulan (Rp)", validators=[DataRequired(), NumberRange(min=0)])
    notes = TextAreaField("Catatan", validators=[Optional()])


class OverheadCostForm(FlaskForm):
    category = StringField("Kategori Overhead", validators=[DataRequired(), Length(max=150)])
    amount_per_month = FloatField("Nominal per Bulan (Rp)", validators=[DataRequired(), NumberRange(min=0)])
    allocation_pct = FloatField(
        "Persentase Alokasi ke Produksi (0-1)", validators=[DataRequired(), NumberRange(min=0, max=1)]
    )


class MaterialForm(FlaskForm):
    name = StringField("Nama Barang/Bahan Baku", validators=[DataRequired(), Length(max=150)])
    unit = StringField("Satuan", validators=[DataRequired(), Length(max=30)])
    avg_demand_month = FloatField("Permintaan Rata-rata per Bulan", validators=[DataRequired(), NumberRange(min=0)])
    max_demand_month = FloatField("Permintaan Maksimum per Bulan", validators=[DataRequired(), NumberRange(min=0)])
    avg_lead_time_days = FloatField("Lead Time Rata-rata (hari)", validators=[DataRequired(), NumberRange(min=0)])
    max_lead_time_days = FloatField("Lead Time Maksimum (hari)", validators=[DataRequired(), NumberRange(min=0)])
    order_cost = FloatField("Biaya Pemesanan per Order (Rp)", validators=[DataRequired(), NumberRange(min=0)])
    holding_cost_per_unit_month = FloatField(
        "Biaya Simpan per Unit per Bulan (Rp)", validators=[DataRequired(), NumberRange(min=0)]
    )
    purchase_price = FloatField("Harga Beli per Unit (Rp)", validators=[DataRequired(), NumberRange(min=0)])
    current_stock = FloatField("Stok Saat Ini", validators=[DataRequired(), NumberRange(min=0)])


class CashFlowEntryForm(FlaskForm):
    month_label = StringField("Bulan", validators=[DataRequired(), Length(max=50)])
    product_id = SelectField("Nama Produk", coerce=int, validators=[DataRequired()])
    units_sold = FloatField("Unit Terjual", validators=[DataRequired(), NumberRange(min=0)])
    selling_price = FloatField("Harga Jual per Unit (Rp)", validators=[DataRequired(), NumberRange(min=0)])
    fixed_cost_allocation_pct = FloatField(
        "Persentase Alokasi Fixed Cost (0-1)", validators=[DataRequired(), NumberRange(min=0, max=1)]
    )
    overhead_allocation_pct = FloatField(
        "Persentase Alokasi Overhead (0-1)", validators=[DataRequired(), NumberRange(min=0, max=1)]
    )


class SettingsForm(FlaskForm):
    hari_kerja_per_bulan = FloatField("Hari Kerja per Bulan", validators=[DataRequired(), NumberRange(min=1)])
    bulan_per_tahun = FloatField("Bulan dalam 1 Tahun", validators=[DataRequired(), NumberRange(min=1)])


class UploadExcelForm(FlaskForm):
    file = FileField(
        "File Excel (.xlsx)",
        validators=[FileRequired(), FileAllowed(["xlsx"], "Hanya file .xlsx yang diperbolehkan!")],
    )
