from flask import Blueprint, render_template, redirect, url_for, flash
from models import db, FixedCost, OverheadCost, Setting
from forms import FixedCostForm, OverheadCostForm, SettingsForm
from services.cost_service import total_fixed_cost, total_overhead_cost, overhead_breakdown

bp = Blueprint("costs", __name__)


# --- Biaya Tetap ---

@bp.route("/tetap", methods=["GET", "POST"])
def fixed_cost():
    form = FixedCostForm()
    if form.validate_on_submit():
        db.session.add(
            FixedCost(
                category=form.category.data.strip(),
                amount_per_month=form.amount_per_month.data,
                notes=form.notes.data,
            )
        )
        db.session.commit()
        flash("Biaya tetap berhasil ditambahkan.", "success")
        return redirect(url_for("costs.fixed_cost"))
    items = FixedCost.query.all()
    return render_template("costs/fixed.html", form=form, items=items, total=total_fixed_cost())


@bp.route("/tetap/<int:item_id>/hapus", methods=["POST"])
def delete_fixed_cost(item_id):
    item = FixedCost.query.get_or_404(item_id)
    db.session.delete(item)
    db.session.commit()
    flash("Biaya tetap berhasil dihapus.", "info")
    return redirect(url_for("costs.fixed_cost"))


# --- Biaya Tidak Langsung (Overhead) ---

@bp.route("/overhead", methods=["GET", "POST"])
def overhead_cost():
    form = OverheadCostForm()
    if form.validate_on_submit():
        db.session.add(
            OverheadCost(
                category=form.category.data.strip(),
                amount_per_month=form.amount_per_month.data,
                allocation_pct=form.allocation_pct.data,
            )
        )
        db.session.commit()
        flash("Biaya overhead berhasil ditambahkan.", "success")
        return redirect(url_for("costs.overhead_cost"))
    items = overhead_breakdown()
    return render_template("costs/overhead.html", form=form, items=items, total=total_overhead_cost())


@bp.route("/overhead/<int:item_id>/hapus", methods=["POST"])
def delete_overhead_cost(item_id):
    item = OverheadCost.query.get_or_404(item_id)
    db.session.delete(item)
    db.session.commit()
    flash("Biaya overhead berhasil dihapus.", "info")
    return redirect(url_for("costs.overhead_cost"))


# --- Asumsi / Settings ---

@bp.route("/asumsi", methods=["GET", "POST"])
def settings():
    form = SettingsForm()
    if form.validate_on_submit():
        for key in ("hari_kerja_per_bulan", "bulan_per_tahun"):
            row = Setting.query.get(key)
            value = getattr(form, key).data
            if row:
                row.value = value
            else:
                db.session.add(Setting(key=key, value=value, description=Setting.DEFAULTS[key][1]))
        db.session.commit()
        flash("Asumsi berhasil diperbarui.", "success")
        return redirect(url_for("costs.settings"))

    form.hari_kerja_per_bulan.data = Setting.get("hari_kerja_per_bulan")
    form.bulan_per_tahun.data = Setting.get("bulan_per_tahun")
    return render_template("costs/settings.html", form=form)
