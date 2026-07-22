"""
Inisialisasi SQLAlchemy dan agregasi seluruh model.

Import semua model di sini supaya `db.create_all()` di app.py mengenali
seluruh tabel, dan supaya route/service bisa `from models import Product`
tanpa perlu tahu di file mana model itu didefinisikan.
"""

from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

from models.product import Category, Product, VariableCostComponent  # noqa: E402,F401
from models.cost import FixedCost, OverheadCost, Setting  # noqa: E402,F401
from models.inventory import Material  # noqa: E402,F401
from models.cashflow import CashFlowEntry  # noqa: E402,F401
from models.history import CalculationHistory  # noqa: E402,F401
