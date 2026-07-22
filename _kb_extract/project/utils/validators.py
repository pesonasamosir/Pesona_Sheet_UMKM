"""Validasi ringan yang dipakai di beberapa route (di luar validasi WTForms)."""

import os


def allowed_file(filename, allowed_extensions):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in allowed_extensions


def safe_join_upload(upload_folder, filename):
    """Cegah path traversal (mis. '../../etc/passwd') pada nama file upload."""
    filename = os.path.basename(filename)
    return os.path.join(upload_folder, filename)
