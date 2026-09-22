"""
CashFlowShield AI - Python Flask Backend & Calculation Engine
Provides API endpoints for cash flow analysis, RTO exposure modeling,
what-if simulation, and serves the frontend application.
"""

from flask import Flask, request, jsonify, send_from_directory, render_template_string
import os

app = Flask(__name__, static_folder=".", static_url_path="")

# Root route serves index.html
@app.route("/")
def index():
    return send_from_directory(".", "index.html")

# Serve CSS and JS assets
@app.route("/css/<path:path>")
def send_css(path):
    return send_from_directory("css", path)

@app.route("/js/<path:path>")
def send_js(path):
    return send_from_directory("js", path)

def parse_float(val, default=0.0):
    try:
        if val is None or val == "":
            return default
        # Strip currency symbols, commas, spaces
        cleaned = str(val).replace("₹", "").replace("$", "").replace(",", "").strip()
        return float(cleaned)
    except (ValueError, TypeError):
        return default

def calculate_cash_flow(data):
    """
    Core backend calculation engine using actual submitted user values.
    """
    current_balance = parse_float(data.get("current_balance"), 100000.0)
    expected_inflows = parse_float(data.get("expected_inflows"), 40000.0)
    upcoming_outflows = parse_float(data.get("upcoming_outflows"), 70000.0)
    monthly_orders = max(0, int(parse_float(data.get("monthly_orders"), 1000.0)))
    average_order_value = parse_float(data.get("average_order_value"), 1000.0)
    rto_rate = max(0.0, min(100.0, parse_float(data.get("rto_rate"), 8.0)))
    pending_receivables = parse_float(data.get("pending_receivables"), 50000.0)
    currency_symbol = data.get("currency_symbol", "₹")

    # 1. Projected Balance
    # Projected Balance = Current Balance + Expected Inflows - Upcoming Outflows
    projected_balance = current_balance + expected_inflows - upcoming_outflows

    # 2. RTO Exposure
    # Estimated RTO Orders = Monthly Orders × RTO Rate / 100
    estimated_rto_orders = round(monthly_orders * (rto_rate / 100.0))
    # Estimated RTO GMV Value = Estimated RTO Orders × Average Order Value
    estimated_rto_value = round(estimated_rto_orders * average_order_value)
    # Estimated RTO direct shipping & handling loss (~₹550 per return or ~25% of AOV)
    unit_rto_cost = min(650.0, max(350.0, average_order_value * 0.25))
    estimated_rto_loss = round(estimated_rto_orders * unit_rto_cost)

    # 3. Protected Balance Requirement
    # Essential Outflows + Safety Buffer (25% of outflows or 14-day burn)
    safety_buffer = round(upcoming_outflows * 0.25) + 15000
    protected_balance_requirement = max(0, round(upcoming_outflows - expected_inflows + safety_buffer))
    shortfall_gap = max(0, round(protected_balance_requirement - current_balance))
    surplus_buffer = max(0, round(current_balance - protected_balance_requirement))

    # Cash at Risk combines expected RTO loss, pending receivables exposed to delay, and urgent outflows
    cash_at_risk = round(estimated_rto_loss + (pending_receivables * 0.65) + (upcoming_outflows * 0.20))
    receivables_at_risk = pending_receivables
    upcoming_7d_payments = upcoming_outflows

    # 4. Transparent Cash Health Assessment (Safe / Watch / High Risk)
    status = "Safe"
    status_tone = "Safe"
    status_badge_class = "safe"

    if projected_balance <= 0 or current_balance < (upcoming_outflows * 0.4):
        status = "High Risk"
        status_tone = "High Risk"
        status_badge_class = "risk"
    elif projected_balance < safety_buffer or upcoming_outflows > (current_balance + expected_inflows * 0.7) or rto_rate >= 20.0:
        status = "Watch"
        status_tone = "Watch"
        status_badge_class = "warn"
    else:
        status = "Safe"
        status_tone = "Safe"
        status_badge_class = "safe"

    # 5. Why? Breakdown Factors (Transparent Calculation)
    why_factors = [
        {
            "icon": "fa-arrow-up-right-from-square",
            "title": f"Upcoming Payments & Debits",
            "detail": f"{currency_symbol}{upcoming_outflows:,.0f} scheduled to leave account",
            "status": "warning" if upcoming_outflows >= current_balance * 0.6 else "normal"
        },
        {
            "icon": "fa-file-invoice-dollar",
            "title": f"Pending B2B Receivables",
            "detail": f"{currency_symbol}{pending_receivables:,.0f} tied up in unpaid invoices",
            "status": "warning" if pending_receivables >= upcoming_outflows * 0.5 else "normal"
        },
        {
            "icon": "fa-rotate-left",
            "title": f"RTO Refusal Drag",
            "detail": f"{rto_rate:.1f}% return rate ({estimated_rto_orders:,} returned orders, ~{currency_symbol}{estimated_rto_loss:,.0f} shipping drag)",
            "status": "warning" if rto_rate >= 15.0 else "normal"
        },
        {
            "icon": "fa-chart-line",
            "title": f"Net Projected Cash Trajectory",
            "detail": f"Projected balance of {currency_symbol}{projected_balance:,.0f} (Current {currency_symbol}{current_balance:,.0f} + Inflows {currency_symbol}{expected_inflows:,.0f} - Outflows {currency_symbol}{upcoming_outflows:,.0f})",
            "status": "warning" if projected_balance <= 0 else "safe"
        }
    ]

    # 6. AI Cash Insight (Natural Language Summary)
    if status == "High Risk":
        ai_cash_insight = (
            f"Your projected cash position is under pressure mainly because upcoming payments ({currency_symbol}{upcoming_outflows:,.0f}) "
            f"exceed available cash ({currency_symbol}{current_balance:,.0f}) and expected inflows ({currency_symbol}{expected_inflows:,.0f}), "
            f"resulting in a projected deficit of {currency_symbol}{abs(projected_balance):,.0f}. "
            f"Accelerating {currency_symbol}{pending_receivables:,.0f} in pending receivables and curbing unrecoverable RTO return costs "
            f"(~{currency_symbol}{estimated_rto_loss:,.0f}) can help stabilize liquidity."
        )
    elif status == "Watch":
        ai_cash_insight = (
            f"Your projected cash position requires close attention. While the projected balance remains positive at {currency_symbol}{projected_balance:,.0f}, "
            f"upcoming payments of {currency_symbol}{upcoming_outflows:,.0f} consume a large share of liquid funds. "
            f"Pending receivables of {currency_symbol}{pending_receivables:,.0f} could reduce the pressure if collected on time. "
            f"RTO exposure of ~{currency_symbol}{estimated_rto_loss:,.0f} is another potential source of cash leakage."
        )
    else:
        ai_cash_insight = (
            f"Your projected cash position is healthy and stable. With {currency_symbol}{current_balance:,.0f} available "
            f"and {currency_symbol}{expected_inflows:,.0f} in expected customer inflows, your projected balance of {currency_symbol}{projected_balance:,.0f} "
            f"safely covers upcoming payments of {currency_symbol}{upcoming_outflows:,.0f}. "
            f"Maintaining an operating buffer of {currency_symbol}{safety_buffer:,.0f} will keep your business insulated against unexpected delays."
        )

    # 7. Early Warning Alerts (Dynamic)
    early_warnings = []
    if projected_balance <= 0:
        early_warnings.append({
            "level": "critical",
            "title": "Cash-Flow Pressure Expected in Next 7-14 Days",
            "message": f"Upcoming commitments of {currency_symbol}{upcoming_outflows:,.0f} exceed liquid cash and expected inflows by {currency_symbol}{abs(projected_balance):,.0f}."
        })
    elif upcoming_outflows >= current_balance * 0.7:
        early_warnings.append({
            "level": "warning",
            "title": "High Near-Term Outflows",
            "message": f"{currency_symbol}{upcoming_outflows:,.0f} in upcoming payments may reduce your available cash significantly."
        })

    if pending_receivables >= 30000:
        early_warnings.append({
            "level": "info",
            "title": "Pending Receivables Delay Risk",
            "message": f"{currency_symbol}{pending_receivables:,.0f} in customer receivables are still pending settlement."
        })

    if rto_rate >= 12.0:
        early_warnings.append({
            "level": "warning",
            "title": "Elevated RTO Refusal Rate",
            "message": f"At an {rto_rate:.1f}% RTO rate, approximately {estimated_rto_orders:,} customer shipments may bounce back unfulfilled."
        })

    # 8. TOP 3 RECOMMENDED ACTIONS ONLY
    # Labeled as suggestions / estimates with user approval required
    top_3_actions = []

    # Action 1: Receivables
    if pending_receivables > 0:
        rec_impact = round(pending_receivables * 0.98)
        top_3_actions.append({
            "rank": 1,
            "id": "act_receivables",
            "title": "Follow up on pending receivables",
            "description": f"{currency_symbol}{pending_receivables:,.0f} is currently pending from B2B clients. Offer a 2% early settlement discount to pull forward cash before scheduled debits mature.",
            "impact_label": f"Pulls forward up to {currency_symbol}{rec_impact:,.0f}",
            "impact_amount": rec_impact,
            "category": "Receivable Management",
            "user_approval_required": True,
            "badge": "Priority 1"
        })

    # Action 2: RTO
    if estimated_rto_loss > 0 or rto_rate >= 5:
        rto_savings = round(estimated_rto_loss * 0.55)
        top_3_actions.append({
            "rank": 2,
            "id": "act_rto",
            "title": "Review high-risk COD orders",
            "description": f"RTO exposure may increase operational costs by ~{currency_symbol}{estimated_rto_loss:,.0f}. Enable automated WhatsApp address verification and offer ₹50 prepaid conversion incentives.",
            "impact_label": f"Averts ~{currency_symbol}{rto_savings:,.0f} return drag",
            "impact_amount": rto_savings,
            "category": "D2C Logistics",
            "user_approval_required": True,
            "badge": "Priority 2"
        })

    # Action 3: Buffer & Outflows
    top_3_actions.append({
        "rank": 3,
        "id": "act_buffer",
        "title": "Maintain an appropriate cash buffer",
        "description": f"Upcoming payments of {currency_symbol}{upcoming_outflows:,.0f} may reduce available cash. Stage non-essential POs and reserve at least {currency_symbol}{safety_buffer:,.0f} in operating funds.",
        "impact_label": f"Protects {currency_symbol}{upcoming_outflows:,.0f} commitments",
        "impact_amount": upcoming_outflows,
        "category": "Liquidity Buffer",
        "user_approval_required": True,
        "badge": "Priority 3"
    })

    # Slice strictly to top 3
    top_3_actions = top_3_actions[:3]

    # 9. Clean Forecast Points (Current -> 7 Days -> 15 Days -> 30 Days)
    milestones = {
        "current": round(current_balance),
        "day7": round(current_balance + (expected_inflows * 0.25) - (upcoming_outflows * 0.45) - (estimated_rto_loss * 0.25)),
        "day15": round(current_balance + (expected_inflows * 0.55) - (upcoming_outflows * 0.75) - (estimated_rto_loss * 0.50)),
        "day30": round(projected_balance - estimated_rto_loss)
    }

    forecast_points = []
    daily_in = expected_inflows / 30.0
    daily_out = upcoming_outflows / 30.0
    daily_rto = estimated_rto_loss / 30.0
    cur_b = current_balance

    for d in range(0, 31):
        if d == 0:
            forecast_points.append({"day": 0, "balance": round(cur_b)})
        else:
            in_step = daily_in * 1.0
            if d in (4, 11, 18, 25):
                in_step += (expected_inflows * 0.18)
            out_step = daily_out * 0.5
            if d in (5, 12, 20):
                out_step += (upcoming_outflows * 0.25)
            cur_b = cur_b + in_step - out_step - daily_rto
            forecast_points.append({"day": d, "balance": round(cur_b)})

    return {
        "inputs": {
            "current_balance": current_balance,
            "expected_inflows": expected_inflows,
            "upcoming_outflows": upcoming_outflows,
            "monthly_orders": monthly_orders,
            "average_order_value": average_order_value,
            "rto_rate": rto_rate,
            "pending_receivables": pending_receivables,
            "currency_symbol": currency_symbol
        },
        "results": {
            # 6 Key Dashboard KPI Cards
            "current_balance": current_balance,
            "protected_balance": protected_balance_requirement,
            "cash_at_risk": cash_at_risk,
            "receivables_at_risk": receivables_at_risk,
            "rto_exposure": estimated_rto_loss,
            "rto_exposure_gmv": estimated_rto_value,
            "upcoming_7d_payments": upcoming_7d_payments,

            # General Metrics
            "projected_balance": projected_balance,
            "estimated_rto_orders": estimated_rto_orders,
            "safety_buffer": safety_buffer,
            "shortfall_gap": shortfall_gap,
            "surplus_buffer": surplus_buffer,

            # Cash Health & Transparent Explanation
            "status": status,
            "status_tone": status_tone,
            "status_badge_class": status_badge_class,
            "health": {
                "status": status,
                "tone": status_tone,
                "badge_class": status_badge_class
            },
            "why_factors": why_factors,

            # AI Insights & Dynamic Alerts
            "ai_cash_insight": ai_cash_insight,
            "early_warnings": early_warnings,

            # Top 3 Recommended Actions
            "top_3_actions": top_3_actions,

            # Forecast
            "milestones": milestones,
            "forecast_points": forecast_points,
            "disclaimer": "Predictions are estimates based on the provided or simulated data. Not financial advice."
        }
    }

@app.route("/api/analyze", methods=["POST"])
def analyze():
    """
    API endpoint: Accepts user form data, validates, and returns calculated results.
    """
    if request.is_json:
        data = request.get_json() or {}
    else:
        data = request.form.to_dict()

    calculation = calculate_cash_flow(data)
    return jsonify({
        "success": True,
        "message": "Cash flow analysis completed successfully.",
        "dashboard": calculation["results"],
        **calculation
    })

@app.route("/api/simulate", methods=["POST"])
def simulate():
    """
    API endpoint for dynamic What-If simulator recalculations.
    Supports both direct simulation payload or { base, scenario } comparison.
    """
    if request.is_json:
        data = request.get_json() or {}
    else:
        data = request.form.to_dict()

    if "scenario" in data and "base" in data:
        base_calc = calculate_cash_flow(data["base"])
        scen_calc = calculate_cash_flow(data["scenario"])
        base_exp = base_calc["results"]["rto_exposure"]
        scen_exp = scen_calc["results"]["rto_exposure"]
        diff = scen_exp - base_exp
        return jsonify({
            "success": True,
            "message": "What-If comparison simulated successfully.",
            "current_exposure": base_exp,
            "scenario_exposure": scen_exp,
            "difference": diff,
            "projected_balance": scen_calc["results"]["projected_balance"],
            "base_results": base_calc["results"],
            "scenario_results": scen_calc["results"],
            "dashboard": scen_calc["results"],
            **scen_calc
        })

    calculation = calculate_cash_flow(data)
    return jsonify({
        "success": True,
        "message": "What-If simulation recalculated successfully.",
        "current_exposure": calculation["results"]["rto_exposure"],
        "scenario_exposure": calculation["results"]["rto_exposure"],
        "difference": 0,
        "dashboard": calculation["results"],
        **calculation
    })

@app.route("/api/demo", methods=["GET"])
def get_demo_presets():
    """
    Returns realistic demo presets for the 'Try Demo' button.
    """
    preset_type = request.args.get("preset", "standard")
    presets = {
        "standard": {
            "current_balance": 100000,
            "expected_inflows": 40000,
            "upcoming_outflows": 70000,
            "monthly_orders": 1000,
            "average_order_value": 1000,
            "rto_rate": 8.0,
            "pending_receivables": 50000
        },
        "d2c_fashion": {
            "current_balance": 420000,
            "expected_inflows": 180000,
            "upcoming_outflows": 250000,
            "monthly_orders": 2800,
            "average_order_value": 1450,
            "rto_rate": 26.0,
            "pending_receivables": 120000
        },
        "cash_crunch": {
            "current_balance": 80000,
            "expected_inflows": 35000,
            "upcoming_outflows": 145000,
            "monthly_orders": 2200,
            "average_order_value": 1800,
            "rto_rate": 32.0,
            "pending_receivables": 65000
        }
    }
    selected = presets.get(preset_type, presets["standard"])
    calculation = calculate_cash_flow(selected)
    return jsonify({
        "success": True,
        "preset": preset_type,
        "data": selected,
        "inputs": selected,
        "results": calculation["results"],
        "dashboard": calculation["results"]
    })

@app.route("/api/upload-csv", methods=["POST"])
def upload_csv():
    """
    Accepts CSV text or file for Orders, Invoices, or Transactions and extracts financial summary.
    """
    try:
        if request.is_json:
            j = request.get_json() or {}
            csv_type = j.get("type") or j.get("csv_type", "orders")
            csv_text = j.get("csv_text", "")
        else:
            csv_type = request.form.get("csv_type", "orders")
            csv_text = request.form.get("csv_text", "")
            if "file" in request.files:
                file = request.files["file"]
                csv_text = file.read().decode("utf-8", errors="ignore")

        lines = [l.strip() for l in csv_text.strip().split("\n") if l.strip()]
        if len(lines) <= 1:
            return jsonify({"success": False, "error": "CSV file appears empty or missing data rows."}), 400

        header = [h.strip().lower() for h in lines[0].split(",")]
        rows = []
        for line in lines[1:]:
            parts = [p.strip() for p in line.split(",")]
            if len(parts) == len(header):
                rows.append(dict(zip(header, parts)))

        summary = {"type": csv_type, "rowCount": len(rows), "data": rows[:20]}

        if csv_type == "orders":
            total_val = sum([parse_float(r.get("amount", 0)) for r in rows])
            cod_count = sum([1 for r in rows if r.get("payment", "").upper() == "COD"])
            prev_rto_count = sum([1 for r in rows if r.get("previous rto", "").lower() in ("yes", "true", "1")])
            rto_pct = round((prev_rto_count / max(1, len(rows))) * 100, 1) if prev_rto_count else 8.0
            summary["calculated"] = {
                "monthly_orders": len(rows),
                "total_order_value": total_val,
                "average_order_value": round(total_val / max(1, len(rows))),
                "rto_rate": rto_pct
            }
        elif csv_type == "invoices":
            total_rec = sum([parse_float(r.get("amount", 0)) for r in rows])
            summary["calculated"] = {
                "pending_receivables": total_rec,
                "invoice_count": len(rows)
            }
        elif csv_type == "transactions":
            total_debit = sum([parse_float(r.get("amount", 0)) for r in rows if r.get("type", "").lower() == "debit"])
            total_credit = sum([parse_float(r.get("amount", 0)) for r in rows if r.get("type", "").lower() == "credit"])
            summary["calculated"] = {
                "upcoming_outflows": total_debit,
                "expected_inflows": total_credit,
                "tx_count": len(rows)
            }

        return jsonify({
            "success": True,
            "message": f"Successfully parsed {len(rows)} rows from {csv_type} CSV.",
            "summary": summary,
            "inputs": summary.get("calculated", {})
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"Starting CashFlowShield AI Flask Backend on port {port}...")
    app.run(host="0.0.0.0", port=port, debug=False)
