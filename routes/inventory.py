from flask import Blueprint, render_template, redirect, url_for, flash
from models import db, Material
from forms import MaterialForm
from services.inventory_service import calculate_all_materials, calculate_material_inventory
from models.history import CalculationHistory

bp = Blueprint("inventory", __name__)


@bp.route("/")
def list_materials():
    materials = Material.query.order_by(Material.name).all()
    results = calculate_all_materials(materials)
    return render_template("inventory/list.html", results=results)


@bp.route("/tambah", methods=["GET", "POST"])
def add_material():
    form = MaterialForm()
    if form.validate_on_submit():
        material = Material(
            name=form.name.data.strip(),
            unit=form.unit.data.strip(),
            avg_demand_month=form.avg_demand_month.data,
            max_demand_month=form.max_demand_month.data,
            avg_lead_time_days=form.avg_lead_time_days.data,
            max_lead_time_days=form.max_lead_time_days.data,
            order_cost=form.order_cost.data,
            holding_cost_per_unit_month=form.holding_cost_per_unit_month.data,
            purchase_price=form.purchase_price.data,
            current_stock=form.current_stock.data,
        )
        db.session.add(material)
        db.session.commit()

        result = calculate_material_inventory(material)
        CalculationHistory.log("inventory", material.name, form.data, result)

        flash(f"Bahan baku '{material.name}' berhasil ditambahkan.", "success")
        return redirect(url_for("inventory.list_materials"))
    return render_template("inventory/form.html", form=form, title="Tambah Bahan Baku")


@bp.route("/<int:material_id>/edit", methods=["GET", "POST"])
def edit_material(material_id):
    material = Material.query.get_or_404(material_id)
    form = MaterialForm(obj=material)
    if form.validate_on_submit():
        form.populate_obj(material)
        db.session.commit()

        result = calculate_material_inventory(material)
        CalculationHistory.log("inventory", material.name, form.data, result)

        flash(f"Bahan baku '{material.name}' berhasil diperbarui.", "success")
        return redirect(url_for("inventory.list_materials"))
    return render_template("inventory/form.html", form=form, title="Edit Bahan Baku")


@bp.route("/<int:material_id>/hapus", methods=["POST"])
def delete_material(material_id):
    material = Material.query.get_or_404(material_id)
    db.session.delete(material)
    db.session.commit()
    flash("Bahan baku berhasil dihapus.", "info")
    return redirect(url_for("inventory.list_materials"))


@bp.route("/<int:material_id>")
def detail_material(material_id):
    material = Material.query.get_or_404(material_id)
    result = calculate_material_inventory(material)
    return render_template("inventory/detail.html", material=material, result=result)
