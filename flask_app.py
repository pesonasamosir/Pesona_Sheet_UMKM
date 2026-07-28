"""
Legacy Flask entry (local only). Do NOT deploy to Vercel — /var/task is read-only
and SQLite makedirs fails with Errno 30. Production app: Next.js in /web.

Run locally: python flask_app.py
"""

import os
from flask import Flask, render_template
from flask_wtf import CSRFProtect

from config import config_by_name
from models import db
from models.cost import Setting
from routes import register_blueprints
from utils.formatters import register_filters


def create_app(env=None):
    env = env or os.environ.get("FLASK_ENV", "development")
    app = Flask(__name__)
    app.config.from_object(config_by_name[env])

    # #region agent log
    try:
        import json, time
        _log_path = os.path.join(os.path.dirname(__file__), "debug-90c741.log")
        with open(_log_path, "a", encoding="utf-8") as _f:
            _f.write(json.dumps({
                "sessionId": "90c741",
                "runId": "flask-boot",
                "hypothesisId": "B",
                "location": "flask_app.py:create_app",
                "message": "Flask create_app about to makedirs",
                "data": {
                    "db_uri": app.config.get("SQLALCHEMY_DATABASE_URI"),
                    "cwd": os.getcwd(),
                },
                "timestamp": int(time.time() * 1000),
            }) + "\n")
    except Exception:
        pass
    # #endregion

    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)
    os.makedirs(app.config["EXPORT_FOLDER"], exist_ok=True)
    os.makedirs(os.path.dirname(app.config["SQLALCHEMY_DATABASE_URI"].replace("sqlite:///", "")), exist_ok=True)

    db.init_app(app)
    CSRFProtect(app)
    register_filters(app)
    register_blueprints(app)

    with app.app_context():
        db.create_all()
        Setting.ensure_defaults()

    @app.errorhandler(404)
    def not_found(e):
        return render_template("errors/404.html"), 404

    @app.errorhandler(500)
    def server_error(e):
        return render_template("errors/500.html"), 500

    return app


app = create_app()

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
