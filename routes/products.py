from flask import Blueprint, render_template, redirect, url_for, flash, request
from models import db, Product, Category, VariableCostComponent
from forms import ProductForm, CategoryForm, VariableCostComponentForm

bp = Blueprint("products", __name__)


@bp.route("/")
def list_products():
    products = Product.query.order_by(Product.name).all()
    return render_template("products/list.html", products=products)


@bp.route("/tambah", methods=["GET", "POST"])
def add_product():
    form = ProductForm()
    form.category_id.choices = [(0, "-- Tanpa Kategori --")] + [
        (c.id, c.name) for c in Category.query.order_by(Category.name)
    ]
    if form.validate_on_submit():
        product = Product(
            name=form.name.data.strip(),
            category_id=form.category_id.data or None,
            selling_price=form.selling_price.data,
            notes=form.notes.data,
        )
        db.session.add(product)
        db.session.commit()
        flash(f"Produk '{product.name}' berhasil ditambahkan.", "success")
        return redirect(url_for("products.list_products"))
    return render_template("products/form.html", form=form, title="Tambah Produk")


@bp.route("/<int:product_id>/edit", methods=["GET", "POST"])
def edit_product(product_id):
    product = Product.query.get_or_404(product_id)
    form = ProductForm(obj=product)
    form.category_id.choices = [(0, "-- Tanpa Kategori --")] + [
        (c.id, c.name) for c in Category.query.order_by(Category.name)
    ]
    if request.method == "GET":
        form.category_id.data = product.category_id or 0

    if form.validate_on_submit():
        product.name = form.name.data.strip()
        product.category_id = form.category_id.data or None
        product.selling_price = form.selling_price.data
        product.notes = form.notes.data
        db.session.commit()
        flash(f"Produk '{product.name}' berhasil diperbarui.", "success")
        return redirect(url_for("products.list_products"))
    return render_template("products/form.html", form=form, title="Edit Produk")


@bp.route("/<int:product_id>/hapus", methods=["POST"])
def delete_product(product_id):
    product = Product.query.get_or_404(product_id)
    db.session.delete(product)
    db.session.commit()
    flash(f"Produk '{product.name}' berhasil dihapus.", "info")
    return redirect(url_for("products.list_products"))


@bp.route("/<int:product_id>")
def detail_product(product_id):
    product = Product.query.get_or_404(product_id)
    component_form = VariableCostComponentForm()
    return render_template("products/detail.html", product=product, form=component_form)


@bp.route("/<int:product_id>/komponen/tambah", methods=["POST"])
def add_component(product_id):
    product = Product.query.get_or_404(product_id)
    form = VariableCostComponentForm()
    if form.validate_on_submit():
        component = VariableCostComponent(
            product_id=product.id,
            component_name=form.component_name.data.strip(),
            unit=form.unit.data.strip(),
            qty_per_unit=form.qty_per_unit.data,
            price_per_unit=form.price_per_unit.data,
        )
        db.session.add(component)
        db.session.commit()
        flash("Komponen biaya variabel berhasil ditambahkan.", "success")
    else:
        flash("Gagal menambahkan komponen, periksa kembali input.", "danger")
    return redirect(url_for("products.detail_product", product_id=product.id))


@bp.route("/komponen/<int:component_id>/hapus", methods=["POST"])
def delete_component(component_id):
    component = VariableCostComponent.query.get_or_404(component_id)
    product_id = component.product_id
    db.session.delete(component)
    db.session.commit()
    flash("Komponen berhasil dihapus.", "info")
    return redirect(url_for("products.detail_product", product_id=product_id))


# --- Kategori ---

@bp.route("/kategori", methods=["GET", "POST"])
def categories():
    form = CategoryForm()
    if form.validate_on_submit():
        db.session.add(Category(name=form.name.data.strip()))
        db.session.commit()
        flash("Kategori berhasil ditambahkan.", "success")
        return redirect(url_for("products.categories"))
    all_categories = Category.query.order_by(Category.name).all()
    return render_template("products/categories.html", form=form, categories=all_categories)


@bp.route("/kategori/<int:category_id>/hapus", methods=["POST"])
def delete_category(category_id):
    category = Category.query.get_or_404(category_id)
    db.session.delete(category)
    db.session.commit()
    flash("Kategori berhasil dihapus.", "info")
    return redirect(url_for("products.categories"))
