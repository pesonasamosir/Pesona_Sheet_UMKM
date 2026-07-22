"""
Mesin perhitungan Cash Flow & Profit.

Konversi 1:1 dari sheet 'Arus Kas'.
    E = Revenue        = C (Unit Terjual) * D (Harga Jual per Unit)
    F = Var Cost/Unit   = VLOOKUP produk -> Product.total_variable_cost_per_unit
    G = Total Var Cost  = C * F
    I = Alokasi Fixed   = TotalFixedCost * H (% alokasi fixed, input manual)
    K = Alokasi Overhead= TotalOverheadCost * J (% alokasi overhead, input manual)
    L = Total Cost      = G + I + K
    M = Profit          = E - L
    N = Profit Margin % = IF(E=0, 0, M/E)
"""

from services.cost_service import total_fixed_cost, total_overhead_cost


def calculate_cashflow_entry(entry):
    """entry: objek CashFlowEntry (relasi .product harus sudah ter-load)."""
    C = entry.units_sold
    D = entry.selling_price
    H = entry.fixed_cost_allocation_pct
    J = entry.overhead_allocation_pct

    F = entry.product.total_variable_cost_per_unit  # VLOOKUP ke Biaya Variabel

    E = C * D
    G = C * F
    I = total_fixed_cost() * H
    K = total_overhead_cost() * J
    L = G + I + K
    M = E - L
    N = 0 if E == 0 else M / E

    return {
        "entry_id": entry.id,
        "month_label": entry.month_label,
        "product_name": entry.product.name,
        "units_sold": C,
        "selling_price": D,
        "revenue": round(E, 2),
        "variable_cost_per_unit": round(F, 2),
        "total_variable_cost": round(G, 2),
        "fixed_cost_allocation_pct": H,
        "allocated_fixed_cost": round(I, 2),
        "overhead_allocation_pct": J,
        "allocated_overhead": round(K, 2),
        "total_cost": round(L, 2),
        "profit": round(M, 2),
        "profit_margin_pct": round(N * 100, 2),
    }


def calculate_all_cashflow(entries):
    return [calculate_cashflow_entry(e) for e in entries]


def cashflow_totals(entries):
    """Setara baris 'Total' (E8, G8, I8, K8, L8, M8) pada sheet 'Arus Kas'."""
    rows = calculate_all_cashflow(entries)
    total_revenue = sum(r["revenue"] for r in rows)
    total_var_cost = sum(r["total_variable_cost"] for r in rows)
    total_fixed_alloc = sum(r["allocated_fixed_cost"] for r in rows)
    total_overhead_alloc = sum(r["allocated_overhead"] for r in rows)
    total_cost = sum(r["total_cost"] for r in rows)
    total_profit = sum(r["profit"] for r in rows)
    avg_margin = 0 if total_revenue == 0 else (total_profit / total_revenue) * 100

    return {
        "total_revenue": round(total_revenue, 2),
        "total_variable_cost": round(total_var_cost, 2),
        "total_allocated_fixed_cost": round(total_fixed_alloc, 2),
        "total_allocated_overhead": round(total_overhead_alloc, 2),
        "total_cost": round(total_cost, 2),
        "total_profit": round(total_profit, 2),
        "average_profit_margin_pct": round(avg_margin, 2),
    }
