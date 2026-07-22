from flask import Blueprint, render_template
from models import Product, Material
from services.dashboard_service import dashboard_summary

bp = Blueprint("dashboard", __name__)


@bp.route("/")
def index():
    summary = dashboard_summary()
    summary["jumlah_produk"] = Product.query.count()
    summary["jumlah_bahan_baku"] = Material.query.count()
    return render_template("dashboard.html", summary=summary)
