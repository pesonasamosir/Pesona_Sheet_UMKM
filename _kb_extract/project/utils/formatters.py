"""Fungsi format angka untuk ditampilkan di UI (dipakai sebagai Jinja filter)."""


def format_rupiah(value):
    """1234567.8 -> 'Rp 1.234.568'"""
    try:
        value = float(value)
    except (TypeError, ValueError):
        return "Rp 0"
    rounded = int(round(value))
    text = f"{abs(rounded):,}".replace(",", ".")
    sign = "-" if rounded < 0 else ""
    return f"{sign}Rp {text}"


def format_percent(value, decimals=1):
    """0.6632 -> '66.3%'  (nilai sudah dalam skala 0-100, atau 0-1 tergantung use_fraction)"""
    try:
        value = float(value)
    except (TypeError, ValueError):
        return "0%"
    return f"{value:.{decimals}f}%"


def format_number(value, decimals=2):
    try:
        value = float(value)
    except (TypeError, ValueError):
        return "0"
    if decimals == 0:
        return f"{int(round(value)):,}".replace(",", ".")
    text = f"{value:,.{decimals}f}"
    integer_part, _, decimal_part = text.partition(".")
    return f"{integer_part.replace(',', '.')},{decimal_part}"


def register_filters(app):
    app.jinja_env.filters["rupiah"] = format_rupiah
    app.jinja_env.filters["percent"] = format_percent
    app.jinja_env.filters["numfmt"] = format_number
