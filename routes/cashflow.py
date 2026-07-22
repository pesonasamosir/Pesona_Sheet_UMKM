from flask import Blueprint, render_template, redirect, url_for, flash
from models import db, CashFlowEntry, Product
from forms import CashFlowEntryForm
from services.finance_service import calculate_all_cashflow, calculate_cashflow_entry, cashflow_totals
from models.history import CalculationHistory

bp = Blueprint("cashflow", __name__)


def _product_choices():
    return [(p.id, p.name) for p in Product.query.order_by(Product.name)]


@bp.route("/")
def list_cashflow():
    entries = CashFlowEntry.query.order_by(CashFlowEntry.id).all()
    results = calculate_all_cashflow(entries)
    totals = cashflow_totals(entries)
    return render_template("cashflow/list.html", results=results, totals=totals)


@bp.route("/tambah", methods=["GET", "POST"])
def add_cashflow():
    form = CashFlowEntryForm()
    form.product_id.choices = _product_choices()
    if not form.product_id.choices:
        flash("Tambahkan produk terlebih dahulu sebelum mencatat arus kas.", "warning")
        return redirect(url_for("products.add_product"))

    if form.validate_on_submit():
        entry = CashFlowEntry(
            month_label=form.month_label.data.strip(),
            product_id=form.product_id.data,
            units_sold=form.units_sold.data,
            selling_price=form.selling_price.data,
            fixed_cost_allocation_pct=form.fixed_cost_allocation_pct.data,
            overhead_allocation_pct=form.overhead_allocation_pct.data,
        )
        db.session.add(entry)
        db.session.commit()

        result = calculate_cashflow_entry(entry)
        CalculationHistory.log("cashflow", entry.product.name, form.data, result)

        flash("Data arus kas berhasil ditambahkan.", "success")
        return redirect(url_for("cashflow.list_cashflow"))
    return render_template("cashflow/form.html", form=form, title="Tambah Data Arus Kas")


@bp.route("/<int:entry_id>/hapus", methods=["POST"])
def delete_cashflow(entry_id):
    entry = CashFlowEntry.query.get_or_404(entry_id)
    db.session.delete(entry)
    db.session.commit()
    flash("Data arus kas berhasil dihapus.", "info")
    return redirect(url_for("cashflow.list_cashflow"))
