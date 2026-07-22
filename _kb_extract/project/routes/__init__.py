def register_blueprints(app):
    from routes.dashboard import bp as dashboard_bp
    from routes.products import bp as products_bp
    from routes.costs import bp as costs_bp
    from routes.inventory import bp as inventory_bp
    from routes.cashflow import bp as cashflow_bp
    from routes.data_io import bp as data_io_bp
    from routes.history import bp as history_bp

    app.register_blueprint(dashboard_bp)
    app.register_blueprint(products_bp, url_prefix="/produk")
    app.register_blueprint(costs_bp, url_prefix="/biaya")
    app.register_blueprint(inventory_bp, url_prefix="/inventori")
    app.register_blueprint(cashflow_bp, url_prefix="/arus-kas")
    app.register_blueprint(data_io_bp, url_prefix="/data")
    app.register_blueprint(history_bp, url_prefix="/riwayat")
