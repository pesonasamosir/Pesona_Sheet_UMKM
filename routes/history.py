from flask import Blueprint, render_template
from models import CalculationHistory

bp = Blueprint("history", __name__)


@bp.route("/")
def list_history():
    entries = CalculationHistory.query.order_by(CalculationHistory.created_at.desc()).limit(200).all()
    return render_template("history/list.html", entries=entries)
