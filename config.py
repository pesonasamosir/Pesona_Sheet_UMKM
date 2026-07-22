"""
Konfigurasi aplikasi.

Database default: SQLite (file lokal, tanpa setup server).
Untuk upgrade ke PostgreSQL/MySQL di masa depan, cukup set environment
variable DATABASE_URL, contoh:
    postgresql://user:password@localhost:5432/umkm_db
    mysql+pymysql://user:password@localhost:3306/umkm_db
Tidak ada perubahan kode yang dibutuhkan karena SQLAlchemy abstrak dari
jenis database (asal driver-nya sudah terpasang, mis. psycopg2 / pymysql).
"""

import os

BASE_DIR = os.path.abspath(os.path.dirname(__file__))


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "ganti-secret-key-ini-di-production")

    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL", "sqlite:///" + os.path.join(BASE_DIR, "database", "app.db")
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
    EXPORT_FOLDER = os.path.join(BASE_DIR, "exports")
    ALLOWED_UPLOAD_EXTENSIONS = {"xlsx"}
    MAX_CONTENT_LENGTH = 10 * 1024 * 1024  # 10 MB, mencegah upload file raksasa

    WTF_CSRF_ENABLED = True


class DevelopmentConfig(Config):
    DEBUG = True


class ProductionConfig(Config):
    DEBUG = False


config_by_name = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
}
