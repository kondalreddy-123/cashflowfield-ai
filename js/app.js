/**
 * CashFlowShield AI - Main Application Controller
 * Philosophy: Detect -> Predict -> Explain -> Protect -> Act
 * Theme: Clean White Modern Fintech
 */

import { BUSINESS_PRESETS } from './data/mockData.js';
import { RTOEngine } from './engines/rtoEngine.js';
import { ReceivableEngine } from './engines/receivableEngine.js';
import { BankDebitEngine } from './engines/bankDebitEngine.js';
import { CashAtRiskEngine } from './engines/cashAtRiskEngine.js';
import { ProtectedBalanceEngine } from './engines/protectedBalanceEngine.js';
import { ForecastEngine } from './engines/forecastEngine.js';
import { ForecastChart } from './components/charts.js';
import { WhatIfSimulator } from './components/simulator.js';
import { ModalController } from './components/modal.js';
import { ToastManager } from './components/toast.js';
import { ThreeShieldScene } from './three/threeScene.js';

class CashFlowShieldApp {
  constructor() {
    this.currentPresetId = "aurathreads";
    this.activePreset = null;
    this.currencySymbol = "₹";
    this.currencyRate = 1; // 1 for INR, 0.012 for USD
    this.activeHorizon = 30; // 7, 15, 30

    // Dynamic State
    this.orders = [];
    this.invoices = [];
    this.debits = [];
    this.currentBalance = 100000;
    this.safetyBufferDays = 14;

    // AI Action State
    this.actions = [];
    this.totalCashProtectedByActions = 0;

    // Sub-components
    this.forecastChart = null;
    this.simulator = null;
    this.threeScene = null;
    this.modalCtrl = new ModalController();
    this.toast = new ToastManager();

    // Engine Results Cache
    this.rtoResult = null;
    this.receivableResult = null;
    this.debitResult = null;
    this.cashAtRiskResult = null;
    this.protectedBalanceResult = null;
    this.forecastResult = null;
    this.backendAnalysisResult = null;
  }

  init() {
    this.loadPreset(this.currentPresetId);
    this.initChart();
    this.initSimulator();
    this.initThreeScene();
    this.bindHeaderEvents();
    this.bindTabEvents();
    this.bindRiskCenterSubtabs();
    this.bindStartAnalysisEvents();
    this.bindWhyHealthModalEvents();
    this.bindCsvUploadEvents();
    this.bindReportPrintEvents();
    this.bindActionEvents();

    // Initial analysis call to Flask backend
    this.submitCashFlowAnalysis();
  }

  loadPreset(presetId) {
    const preset = BUSINESS_PRESETS[presetId] || BUSINESS_PRESETS.aurathreads;
    this.activePreset = preset;
    this.currentPresetId = preset.id;

    // Clone data
    this.orders = JSON.parse(JSON.stringify(preset.orders));
    this.invoices = JSON.parse(JSON.stringify(preset.invoices));
    this.debits = JSON.parse(JSON.stringify(preset.debits));
    this.currentBalance = preset.currentBalance;
    this.safetyBufferDays = preset.safetyBufferDays || 14;
    this.totalCashProtectedByActions = 0;

    // Populate the 7 input form fields with preset data
    this.syncFormWithPreset(preset);

    // Initialize actions & recompute
    this.generateActionsQueue();
    this.recomputeAll();

    this.toast.info(`Loaded scenario: ${preset.name}`);
  }

  syncFormWithPreset(preset) {
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val;
    };

    setVal("inpCurrentBalance", preset.currentBalance || 100000);
    setVal("inpExpectedInflows", preset.simDefaults?.expectedInflows || 40000);
    setVal("inpUpcomingOutflows", preset.simDefaults?.upcomingOutflows || 70000);
    setVal("inpMonthlyOrders", preset.simDefaults?.monthlyOrders || 1000);
    setVal("inpAov", preset.simDefaults?.aov || 1000);
    setVal("inpRtoRate", preset.simDefaults?.rtoRate || 8);

    // Pending receivables from invoices total
    const pendingRec = (preset.invoices || []).reduce((acc, inv) => acc + (inv.amount || 0), 0);
    setVal("inpPendingReceivables", pendingRec || 50000);
  }

  formatCurrency(value) {
    const adjusted = value * this.currencyRate;
    if (this.currencySymbol === "₹") {
      if (Math.abs(adjusted) >= 10000000) {
        return `₹${(adjusted / 10000000).toFixed(2)} Cr`;
      }
      if (Math.abs(adjusted) >= 100000) {
        return `₹${(adjusted / 100000).toFixed(2)}L`;
      }
      return `₹${Math.round(adjusted).toLocaleString('en-IN')}`;
    } else {
      if (Math.abs(adjusted) >= 1000000) {
        return `$${(adjusted / 1000000).toFixed(2)}M`;
      }
      if (Math.abs(adjusted) >= 1000) {
        return `$${(adjusted / 1000).toFixed(1)}k`;
      }
      return `$${Math.round(adjusted).toLocaleString('en-US')}`;
    }
  }

  formatNumber(value) {
    const adjusted = value * this.currencyRate;
    return Math.round(adjusted).toLocaleString(this.currencySymbol === "₹" ? 'en-IN' : 'en-US');
  }

  /**
   * Generates prioritized AI actionable recommendations.
   */
  generateActionsQueue() {
    const newActions = [];

    // 1. High-risk D2C Order actions
    this.orders.forEach(order => {
      if (order.rtoProbability >= 50) {
        newActions.push({
          id: `act_order_${order.id}`,
          category: "D2C RTO Protection",
          priority: "high",
          title: `Verify Delivery Address for ${order.id} (${order.customer})`,
          description: `High RTO probability (${order.rtoProbability}%). Send automated WhatsApp location confirmation before dispatch to prevent return shipping drag.`,
          potentialImpact: Math.round((order.rtoCost || 550) * 0.7),
          status: "pending",
          relatedId: order.id,
          type: "rto"
        });
      }
    });

    // 2. High-risk B2B Receivable actions
    this.invoices.forEach(inv => {
      if (inv.delayProbability >= 50) {
        newActions.push({
          id: `act_inv_${inv.id}`,
          category: "Receivable Liquidity",
          priority: "high",
          title: `Offer 2% Early-Payment Rebate to ${inv.client}`,
          description: `Due in ${inv.daysRemaining} days. Payment delay risk is ${inv.delayProbability}%. Offering a 2% settlement incentive pulls forward ${this.formatCurrency(inv.amount)} into immediate balance.`,
          potentialImpact: Math.round(inv.amount * 0.98),
          status: "pending",
          relatedId: inv.id,
          type: "receivable"
        });
      }
    });

    // 3. Imminent mandatory debit management
    const urgentDebit = this.debits.find(d => d.daysRemaining <= 7 && d.mandatory);
    if (urgentDebit) {
      newActions.push({
        id: `act_debit_${urgentDebit.id}`,
        category: "Mandatory Outflow",
        priority: "medium",
        title: `Pre-Allocate Cash for ${urgentDebit.name}`,
        description: `${this.formatCurrency(urgentDebit.amount)} will be auto-debited in ${urgentDebit.daysRemaining} days. Lock funds into Protected Balance to avert bounce fees.`,
        potentialImpact: urgentDebit.amount,
        status: "pending",
        relatedId: urgentDebit.id,
        type: "debit"
      });
    }

    this.actions = newActions;
  }

  /**
   * Recompute all financial intelligence engines and refresh UI views.
   */
  recomputeAll() {
    // 1. Run D2C RTO Risk Engine
    this.rtoResult = RTOEngine.analyzeBatch(this.orders);

    // 2. Run B2B Receivable Risk Engine
    this.receivableResult = ReceivableEngine.analyzeBatch(this.invoices);

    // 3. Run Bank Debit Prediction Engine
    this.debitResult = BankDebitEngine.analyzeDebits(this.debits, this.currentBalance);

    // 4. Run Cash-at-Risk Engine
    this.cashAtRiskResult = CashAtRiskEngine.compute(
      this.rtoResult,
      this.receivableResult,
      this.debitResult,
      this.currentBalance
    );

    // 5. Run Protected Balance Engine
    const essentialObligations = this.debitResult.next15DaysTotal;
    const reliableInflows = Math.max(0, this.receivableResult.totalReceivables - this.receivableResult.totalDelayedExposure);
    const safetyBuffer = Math.round((this.activePreset?.dailyBurnRate || 18000) * this.safetyBufferDays);

    this.protectedBalanceResult = ProtectedBalanceEngine.calculate({
      currentBalance: this.currentBalance,
      essentialObligations,
      reliableInflows,
      safetyBuffer,
      safetyBufferDays: this.safetyBufferDays
    });

    // 6. Run Future Cash-Balance Forecast Engine
    this.forecastResult = ForecastEngine.generate({
      currentBalance: this.currentBalance,
      debits: this.debitResult.debits,
      invoices: this.receivableResult.invoices,
      rtoMetrics: this.rtoResult,
      horizonDays: this.activeHorizon,
      safetyBuffer: safetyBuffer,
      actionsApplied: this.totalCashProtectedByActions > 0
    });

    // 7. Update UI Views
    this.renderRiskCenterTables();

    // 8. Update Chart
    if (this.forecastChart) {
      this.forecastChart.updateData(this.forecastResult);
    }
  }

  /**
   * Reads form values, sends them to Flask backend /api/analyze,
   * and updates all 6 KPI cards, Cash Health status, AI insight, and top 3 actions.
   */
  async submitCashFlowAnalysis() {
    const btnAnalyze = document.getElementById("btnAnalyzeCashFlow");
    const originalBtnHtml = btnAnalyze ? btnAnalyze.innerHTML : "Analyze Cash Flow";

    const getVal = (id, fallback) => {
      const el = document.getElementById(id);
      return el ? parseFloat(el.value) || fallback : fallback;
    };

    const currentBalance = getVal("inpCurrentBalance", 100000);
    const expectedInflows = getVal("inpExpectedInflows", 40000);
    const upcomingOutflows = getVal("inpUpcomingOutflows", 70000);
    const monthlyOrders = getVal("inpMonthlyOrders", 1000);
    const averageOrderValue = getVal("inpAov", 1000);
    const rtoRate = getVal("inpRtoRate", 8);
    const pendingReceivables = getVal("inpPendingReceivables", 50000);

    const payload = {
      current_balance: currentBalance,
      expected_inflows: expectedInflows,
      upcoming_outflows: upcomingOutflows,
      monthly_orders: monthlyOrders,
      average_order_value: averageOrderValue,
      rto_rate: rtoRate,
      pending_receivables: pendingReceivables,
      currency_symbol: this.currencySymbol
    };

    if (btnAnalyze) {
      btnAnalyze.disabled = true;
      btnAnalyze.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>Analyzing...</span>`;
    }

    try {
      let data = null;
      try {
        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (response.ok) {
          data = await response.json();
        }
      } catch (networkErr) {
        console.warn("Backend /api/analyze unreachable, executing local logic:", networkErr);
      }

      if (!data || !data.results) {
        data = this.calculateCashFlowLocally(payload);
      }

      this.backendAnalysisResult = data.results;
      this.updateDashboardFromAnalysis(data.results, payload);
      this.toast.success(`Cash Analysis Complete: Projected Balance ${this.formatCurrency(data.results.projected_balance)} (${data.results.status})`);
    } catch (err) {
      console.error("Error analyzing cash flow:", err);
      this.toast.error("Failed to execute cash flow analysis.");
    } finally {
      if (btnAnalyze) {
        btnAnalyze.disabled = false;
        btnAnalyze.innerHTML = originalBtnHtml;
      }
    }
  }

  /**
   * Updates all sections of the dashboard using the calculated results.
   */
  updateDashboardFromAnalysis(results, inputs) {
    this.currentBalance = inputs.current_balance;

    const setTxt = (id, txt) => {
      const el = document.getElementById(id);
      if (el) el.textContent = txt;
    };

    // 1. Top 6 Key KPI Cards
    setTxt("kpiCurrentCash", this.formatCurrency(inputs.current_balance));
    setTxt("kpiProtectedTarget", this.formatCurrency(results.protected_balance));
    setTxt("kpiCashAtRisk", this.formatCurrency(results.cash_at_risk));
    setTxt("kpiReceivablesAtRisk", this.formatCurrency(results.receivables_at_risk));
    setTxt("kpiRtoExposure", this.formatCurrency(results.rto_exposure));
    setTxt("kpiUpcomingDebits", this.formatCurrency(results.upcoming_7d_payments));

    // 2. Cash Health Overview (Safe / Watch / High Risk)
    const badge = document.getElementById("healthBadge");
    const statusText = document.getElementById("healthStatusText");
    const overviewTitle = document.getElementById("healthOverviewTitle");
    const overviewDesc = document.getElementById("healthOverviewDesc");

    if (badge && statusText) {
      badge.className = `health-badge ${results.status_badge_class || (results.status === 'High Risk' ? 'risk' : results.status === 'Watch' ? 'warn' : 'safe')}`;
      statusText.textContent = results.status;
    }

    if (overviewTitle && overviewDesc) {
      if (results.status === "High Risk") {
        overviewTitle.textContent = "Cash Safety Overview: High Risk of Liquidity Shortage";
        overviewDesc.textContent = `Upcoming payments exceed available cash & inflows by ${this.formatCurrency(Math.abs(results.projected_balance))}. Action required.`;
      } else if (results.status === "Watch") {
        overviewTitle.textContent = "Cash Safety Overview: Attention & Monitoring Required";
        overviewDesc.textContent = "Near-term commitments consume a substantial portion of liquid reserves. Follow up on receivables.";
      } else {
        overviewTitle.textContent = "Cash Safety Overview: Operational Reserves Adequate";
        overviewDesc.textContent = `Projected balance of ${this.formatCurrency(results.projected_balance)} safely covers scheduled commitments with contingency buffer.`;
      }
    }

    // 3. Early Warning Banner (Dynamic)
    const earlyBanner = document.getElementById("earlyWarningBanner");
    const warnTitle = document.getElementById("warningTitle");
    const warnDetails = document.getElementById("warningDetails");

    if (earlyBanner) {
      if (results.early_warnings && results.early_warnings.length > 0) {
        earlyBanner.style.display = "flex";
        const topWarn = results.early_warnings[0];
        earlyBanner.className = `early-warning-card ${topWarn.level === 'critical' ? 'risk' : (topWarn.level === 'warning' ? 'warn' : 'safe')}`;
        if (warnTitle) warnTitle.textContent = topWarn.title;
        if (warnDetails) warnDetails.textContent = topWarn.message;
      } else {
        earlyBanner.className = "early-warning-card safe";
        if (warnTitle) warnTitle.textContent = "Operating Buffer Stable";
        if (warnDetails) warnDetails.textContent = "No critical liquidity shortfall risks detected for the upcoming cycle.";
      }
    }

    // 4. AI Cash Insight Card
    const insightEl = document.getElementById("aiCashInsightText");
    if (insightEl) {
      insightEl.textContent = results.ai_cash_insight || "Projected cash trajectory is stable.";
    }

    // 5. Top 3 Recommended Actions Only
    const actContainer = document.getElementById("top3ActionsContainer");
    if (actContainer && results.top_3_actions) {
      actContainer.innerHTML = results.top_3_actions.map(act => `
        <div class="action-item-card">
          <div>
            <span class="action-rank-tag">${act.badge || 'Priority ' + act.rank}</span>
            <div class="action-card-title">${act.rank}. ${act.title}</div>
            <div class="action-card-desc">${act.description}</div>
          </div>
          <div class="action-card-footer">
            <span class="action-impact-label"><i class="fa-solid fa-shield"></i> ${act.impact_label}</span>
            <button type="button" class="btn-approve-action" data-action-rank="${act.rank}" data-action-title="${act.title}">
              <i class="fa-solid fa-check"></i> Approve Action
            </button>
          </div>
        </div>
      `).join('');
    }

    // 6. Forecast Milestones
    if (results.milestones) {
      setTxt("msCurrent", this.formatCurrency(results.milestones.current));
      setTxt("msDay7", this.formatCurrency(results.milestones.day7));
      setTxt("msDay15", this.formatCurrency(results.milestones.day15));
      setTxt("msDay30", this.formatCurrency(results.milestones.day30));
    }

    // 7. Update What-If Simulator Baseline
    if (this.simulator) {
      this.simulator.setBaseline({
        rtoRate: inputs.rto_rate,
        expectedInflows: inputs.expected_inflows,
        upcomingOutflows: inputs.upcoming_outflows,
        monthlyOrders: inputs.monthly_orders,
        aov: inputs.average_order_value,
        currentBalance: inputs.current_balance
      });
    }

    // 8. Update Executive Cash-Flow Report View
    this.updateReportSheet(results, inputs);

    // 9. Update Risk Center Data & Synthesize realistic rows
    this.syncRiskCenterWithInputs(inputs, results);
  }

  syncRiskCenterWithInputs(inputs, results) {
    const setTxt = (id, txt) => {
      const el = document.getElementById(id);
      if (el) el.textContent = txt;
    };

    setTxt("rcRtoRate", `${inputs.rto_rate.toFixed(1)}%`);
    setTxt("rcRtoLoss", this.formatCurrency(results.rto_exposure));
    setTxt("rcRiskyOrdersCount", `${(results.estimated_rto_orders || 80).toLocaleString()} Orders`);

    setTxt("rcPendingRec", this.formatCurrency(inputs.pending_receivables));
    setTxt("rcDelayedRec", this.formatCurrency(Math.round(inputs.pending_receivables * 0.65)));
    setTxt("rcDueCount", "3 Invoices");

    setTxt("rcSupplierDebits", this.formatCurrency(Math.round(inputs.upcoming_outflows * 0.42)));
    setTxt("rcEmiDebits", this.formatCurrency(Math.round(inputs.upcoming_outflows * 0.18)));
    setTxt("rcTotalDebits", this.formatCurrency(inputs.upcoming_outflows));

    // Synthesize debits
    const outflow = inputs.upcoming_outflows;
    this.debits = [
      { id: "deb_u1", name: "Supplier Raw Materials PO", amount: Math.round(outflow * 0.42), dueDate: "In 4 days", daysRemaining: 4, mandatory: true, autoDebit: true, category: "Vendor Payables" },
      { id: "deb_u2", name: "Logistics & Warehousing Bill", amount: Math.round(outflow * 0.28), dueDate: "In 7 days", daysRemaining: 7, mandatory: true, autoDebit: false, category: "Operations" },
      { id: "deb_u3", name: "Working Capital Loan EMI", amount: Math.round(outflow * 0.18), dueDate: "In 11 days", daysRemaining: 11, mandatory: true, autoDebit: true, category: "Debt Service" },
      { id: "deb_u4", name: "Software Tools & Subscriptions", amount: Math.max(1000, Math.round(outflow * 0.12)), dueDate: "In 14 days", daysRemaining: 14, mandatory: false, autoDebit: true, category: "Overheads" }
    ];

    // Synthesize invoices
    const rec = inputs.pending_receivables;
    this.invoices = [
      { id: "inv_u1", client: "Apex Retail Distribution", amount: Math.round(rec * 0.50), dueDate: "In 5 days", daysRemaining: 5, delayProbability: 60, avgDaysToPay: 45, paymentHistory: "12-day turnaround lag", disputeRisk: "low" },
      { id: "inv_u2", client: "Metro Lifestyle Chains", amount: Math.round(rec * 0.35), dueDate: "In 10 days", daysRemaining: 10, delayProbability: 40, avgDaysToPay: 35, paymentHistory: "Clears within credit terms", disputeRisk: "low" },
      { id: "inv_u3", client: "Zenith Boutique Direct", amount: Math.max(1000, Math.round(rec * 0.15)), dueDate: "In 18 days", daysRemaining: 18, delayProbability: 20, avgDaysToPay: 28, paymentHistory: "Consistent prompt payer", disputeRisk: "low" }
    ];

    // Synthesize orders
    const aov = inputs.average_order_value;
    const rto = inputs.rto_rate;
    const highProb = Math.min(95, Math.round(rto * 3.2));
    const lowProb = Math.max(5, Math.round(rto * 0.6));

    this.orders = [
      { id: "ORD-9401", customer: "Priya Sharma", city: "Patna, BR", pincode: "800001", amount: Math.round(aov * 1.2), paymentMode: "COD", rtoProbability: highProb, rtoCost: Math.round(aov * 0.25), riskFactors: ["Tier-3 Pin RTO", "COD Payment Mode", "Unconfirmed Address"], status: "Flagged High Risk" },
      { id: "ORD-9402", customer: "Rahul Verma", city: "Gurugram, HR", pincode: "122002", amount: Math.round(aov * 0.9), paymentMode: "Prepaid", rtoProbability: lowProb, rtoCost: Math.round(aov * 0.25), riskFactors: ["Prepaid Order"], status: "Low Risk" },
      { id: "ORD-9403", customer: "Ananya Iyer", city: "Bengaluru, KA", pincode: "560038", amount: Math.round(aov * 1.5), paymentMode: "COD", rtoProbability: Math.min(85, Math.round(rto * 1.6)), rtoCost: Math.round(aov * 0.25), riskFactors: ["COD Payment Mode"], status: "Attention Required" },
      { id: "ORD-9404", customer: "Karan Mehta", city: "Mumbai, MH", pincode: "400050", amount: Math.round(aov * 0.8), paymentMode: "Prepaid", rtoProbability: lowProb, rtoCost: Math.round(aov * 0.25), riskFactors: ["Verified Repeat Customer"], status: "Low Risk" }
    ];

    this.recomputeAll();
  }

  updateReportSheet(results, inputs) {
    const setTxt = (id, txt) => {
      const el = document.getElementById(id);
      if (el) el.textContent = txt;
    };

    setTxt("repScenarioName", this.activePreset?.name || "Business Scenario");
    setTxt("repGeneratedDate", new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }));
    
    const repBadge = document.getElementById("repStatusBadge");
    if (repBadge) {
      repBadge.className = `health-badge ${results.status_badge_class || 'safe'}`;
      repBadge.textContent = results.status;
    }

    setTxt("repCurrentBal", this.formatCurrency(inputs.current_balance));
    setTxt("repProtectedBal", this.formatCurrency(results.protected_balance));
    setTxt("repProjectedBal", this.formatCurrency(results.projected_balance));
    setTxt("repCashAtRisk", this.formatCurrency(results.cash_at_risk));
    setTxt("repReceivablesAtRisk", this.formatCurrency(results.receivables_at_risk));
    setTxt("repRtoExposure", this.formatCurrency(results.rto_exposure));

    setTxt("repForecastSummaryText", results.ai_cash_insight || "");

    const repActionsList = document.getElementById("repActionsList");
    if (repActionsList && results.top_3_actions) {
      repActionsList.innerHTML = results.top_3_actions.map(act => `
        <li style="margin-bottom:6px;">
          <strong>${act.title}:</strong> ${act.description} <span style="color:var(--safe-color); font-weight:600;">(${act.impact_label})</span>
        </li>
      `).join('');
    }
  }

  renderRiskCenterTables() {
    // 1. RTO Orders Table
    const rtoBody = document.getElementById("rtoOrdersTableBody");
    if (rtoBody && this.orders) {
      rtoBody.innerHTML = this.orders.map(o => `
        <tr>
          <td><strong>${o.id}</strong></td>
          <td>${o.customer} <div style="font-size:11px; color:var(--text-tertiary);">${o.city}</div></td>
          <td>${this.formatCurrency(o.amount || o.value || 1000)}</td>
          <td><span class="action-priority-badge ${o.paymentMode === 'COD' ? 'prio-med' : 'prio-low'}">${o.paymentMode}</span></td>
          <td><strong style="color:${o.rtoProbability >= 50 ? 'var(--risk-color)' : 'var(--safe-color)'};">${o.rtoProbability}%</strong></td>
          <td><span style="font-size:11px; color:var(--text-muted);">${(o.riskFactors || []).join(', ') || 'Normal order'}</span></td>
          <td>
            <button type="button" class="btn-why-rto" data-order-id="${o.id}" style="background:var(--bg-muted); border:1px solid var(--border-medium); border-radius:4px; padding:3px 8px; font-size:11px; cursor:pointer;">
              Why?
            </button>
          </td>
        </tr>
      `).join('');
    }

    // 2. Receivables Table
    const recBody = document.getElementById("receivablesTableBody");
    if (recBody && this.invoices) {
      recBody.innerHTML = this.invoices.map(inv => `
        <tr>
          <td><strong>${inv.id}</strong></td>
          <td>${inv.client}</td>
          <td>${this.formatCurrency(inv.amount)}</td>
          <td>${inv.dueDate || 'In 10 days'}</td>
          <td><strong style="color:${inv.delayProbability >= 50 ? 'var(--warn-color)' : 'var(--safe-color)'};">${inv.delayProbability}%</strong></td>
          <td><span style="font-size:11px; color:var(--text-muted);">${inv.paymentHistory || 'Standard turnaround'}</span></td>
          <td>
            <button type="button" class="btn-trigger-rebate" data-inv-id="${inv.id}" style="background:var(--primary-light); color:var(--primary-color); border:1px solid rgba(37,99,235,0.25); border-radius:4px; padding:3px 8px; font-size:11px; font-weight:600; cursor:pointer;">
              Offer 2% Rebate
            </button>
          </td>
        </tr>
      `).join('');
    }

    // 3. Debits Table
    const debBody = document.getElementById("debitsTableBody");
    if (debBody && this.debits) {
      debBody.innerHTML = this.debits.map(deb => `
        <tr>
          <td><strong>${deb.name}</strong></td>
          <td><span style="font-size:11px; color:var(--text-muted);">${deb.category || 'Disbursement'}</span></td>
          <td>${this.formatCurrency(deb.amount)}</td>
          <td>${deb.dueDate || 'In ' + deb.daysRemaining + ' days'}</td>
          <td>
            <span class="health-badge ${deb.mandatory ? 'risk' : 'safe'}" style="font-size:10px; padding:2px 8px;">
              ${deb.mandatory ? 'Mandatory' : 'Flexible'}
            </span>
          </td>
          <td>
            <div style="display:flex; align-items:center; justify-content:space-between; gap:8px;">
              <span style="font-size:11px; color:var(--text-muted);">${deb.autoDebit ? 'Auto-Debit Mandate' : 'Manual Transfer'}</span>
              <button type="button" class="btn-verify-debit" data-deb-id="${deb.id}">
                <i class="fa-solid fa-calendar-check"></i> Verify
              </button>
            </div>
          </td>
        </tr>
      `).join('');
    }
  }

  initChart() {
    const canvas = document.getElementById("forecastCanvas");
    const tooltip = document.getElementById("chartTooltip");
    if (canvas && tooltip) {
      this.forecastChart = new ForecastChart(canvas, tooltip);
      this.forecastChart.setCurrency(this.currencySymbol);
      if (this.forecastResult) {
        this.forecastChart.updateData(this.forecastResult);
      }
    }
  }

  initSimulator() {
    const simMount = document.getElementById("simulatorMountPoint");
    if (simMount) {
      this.simulator = new WhatIfSimulator(simMount, (appliedParams) => {
        this.handleSimulateBackend(appliedParams);
      });
      this.simulator.setCurrency(this.currencySymbol);
      this.simulator.init();
    }
  }

  initThreeScene() {
    const mount = document.getElementById("threeCanvasMount");
    if (!mount) return;
    try {
      this.threeScene = new ThreeShieldScene(mount);
    } catch (e) {
      console.warn("ThreeScene initialization bypassed:", e);
    }
  }

  bindHeaderEvents() {
    // Preset Selector
    const presetSelect = document.getElementById("presetSelector");
    if (presetSelect) {
      presetSelect.addEventListener("change", (e) => {
        this.loadPreset(e.target.value);
        this.submitCashFlowAnalysis();
      });
    }

    // Currency Switcher
    const currInr = document.getElementById("btnCurrInr");
    const currUsd = document.getElementById("btnCurrUsd");
    if (currInr && currUsd) {
      currInr.addEventListener("click", () => {
        this.currencySymbol = "₹";
        this.currencyRate = 1;
        currInr.classList.add("active");
        currUsd.classList.remove("active");
        this.updateFormCurrencyPrefixes("₹");
        if (this.forecastChart) this.forecastChart.setCurrency("₹");
        if (this.simulator) this.simulator.setCurrency("₹");
        this.submitCashFlowAnalysis();
      });
      currUsd.addEventListener("click", () => {
        this.currencySymbol = "$";
        this.currencyRate = 0.012; // approximate USD conversion
        currUsd.classList.add("active");
        currInr.classList.remove("active");
        this.updateFormCurrencyPrefixes("$");
        if (this.forecastChart) this.forecastChart.setCurrency("$");
        if (this.simulator) this.simulator.setCurrency("$");
        this.submitCashFlowAnalysis();
      });
    }

    // Forecast Horizon Buttons
    document.querySelectorAll(".horizon-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".horizon-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        this.activeHorizon = Number(btn.dataset.horizon);
        if (this.forecastChart) {
          this.forecastChart.setHorizon(this.activeHorizon);
        }
        this.recomputeAll();
      });
    });

    // 3D Matrix View Modal Toggle & Deflect Button
    const btnToggle3D = document.getElementById("btnToggle3DView");
    const modal3D = document.getElementById("threeDModal");
    const btnClose3D = document.getElementById("btnClose3DModal");
    const btnDeflect = document.getElementById("btn3dDeflect");

    if (btnToggle3D && modal3D) {
      btnToggle3D.addEventListener("click", () => {
        modal3D.classList.add("active");
        if (this.threeScene) this.threeScene.onResize();
      });
    }
    if (btnClose3D && modal3D) {
      btnClose3D.addEventListener("click", () => {
        modal3D.classList.remove("active");
      });
    }
    if (btnDeflect) {
      btnDeflect.addEventListener("click", () => {
        if (this.threeScene) {
          this.threeScene.triggerDeflection();
          this.toast.success("Deflection forcefield active! Leaks deflected.");
        }
      });
    }
  }

  bindTabEvents() {
    document.querySelectorAll(".nav-link").forEach(link => {
      link.addEventListener("click", () => {
        document.querySelectorAll(".nav-link").forEach(l => l.classList.remove("active"));
        document.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"));

        link.classList.add("active");
        const targetId = link.dataset.tab;
        const targetPane = document.getElementById(targetId);
        if (targetPane) {
          targetPane.classList.add("active");
        }

        if (targetId === "section-forecast" && this.forecastChart) {
          setTimeout(() => this.forecastChart.render(), 40);
        }
      });
    });
  }

  bindRiskCenterSubtabs() {
    const tabs = [
      { btn: "tabBtnRto", panel: "panelRiskRto" },
      { btn: "tabBtnReceivables", panel: "panelRiskReceivables" },
      { btn: "tabBtnDebits", panel: "panelRiskDebits" }
    ];

    tabs.forEach(t => {
      const btn = document.getElementById(t.btn);
      if (btn) {
        btn.addEventListener("click", () => {
          tabs.forEach(o => {
            document.getElementById(o.btn)?.classList.remove("active");
            const p = document.getElementById(o.panel);
            if (p) p.style.display = "none";
          });
          btn.classList.add("active");
          const activePanel = document.getElementById(t.panel);
          if (activePanel) activePanel.style.display = "block";
        });
      }
    });
  }

  bindStartAnalysisEvents() {
    const btnDemo = document.getElementById("btnStartDemo");
    const btnQuickDemo = document.getElementById("btnQuickDemoHeader");
    const btnManual = document.getElementById("btnStartManual");
    const formWrap = document.getElementById("analysisFormWrapper");
    const form = document.getElementById("cashFlowAnalysisForm");
    const btnAnalyze = document.getElementById("btnAnalyzeCashFlow");

    const loadDemo = () => {
      this.loadDemoPreset("standard");
    };

    if (btnDemo) btnDemo.addEventListener("click", loadDemo);
    if (btnQuickDemo) btnQuickDemo.addEventListener("click", loadDemo);

    if (btnManual && formWrap) {
      btnManual.addEventListener("click", () => {
        btnManual.classList.add("active");
        formWrap.classList.remove("collapsed");
        document.getElementById("inpCurrentBalance")?.focus();
        this.toast.info("Manual Entry: Enter your figures and click 'Analyze Cash Flow'.");
      });
    }

    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        this.submitCashFlowAnalysis();
      });
    }

    if (btnAnalyze) {
      btnAnalyze.addEventListener("click", (e) => {
        e.preventDefault();
        this.submitCashFlowAnalysis();
      });
    }

    // Dismiss Early Warning
    document.getElementById("btnDismissWarning")?.addEventListener("click", () => {
      const banner = document.getElementById("earlyWarningBanner");
      if (banner) banner.style.display = "none";
    });
  }

  bindWhyHealthModalEvents() {
    const modal = document.getElementById("whyHealthModal");
    const btnOpen = document.getElementById("btnExplainHealth");
    const btnClose = document.getElementById("btnCloseWhyHealth");
    const btnAck = document.getElementById("btnAcknowledgeWhy");

    const openModal = () => {
      if (!modal) return;
      const list = document.getElementById("whyFactorsList");
      if (list && this.backendAnalysisResult && this.backendAnalysisResult.why_factors) {
        list.innerHTML = this.backendAnalysisResult.why_factors.map(f => `
          <div style="display:flex; align-items:flex-start; gap:12px; background:var(--bg-muted); border:1px solid var(--border-subtle); border-radius:8px; padding:12px;">
            <div style="font-size:18px; color:${f.status === 'warning' ? 'var(--warn-color)' : 'var(--safe-color)'};">
              <i class="fa-solid ${f.icon}"></i>
            </div>
            <div>
              <strong style="font-size:14px; color:var(--text-primary);">${f.title}</strong>
              <div style="font-size:12px; color:var(--text-secondary); margin-top:2px;">${f.detail}</div>
            </div>
          </div>
        `).join('');
      }
      modal.classList.add("active");
    };

    const closeModal = () => {
      if (modal) modal.classList.remove("active");
    };

    if (btnOpen) btnOpen.addEventListener("click", openModal);
    if (btnClose) btnClose.addEventListener("click", closeModal);
    if (btnAck) btnAck.addEventListener("click", closeModal);
  }

  bindCsvUploadEvents() {
    const modal = document.getElementById("csvUploadModal");
    const btnOpen = document.getElementById("btnOpenCsvModal");
    const btnClose = document.getElementById("btnCloseCsvModal");
    const dropZone = document.getElementById("csvDropZone");
    const fileInput = document.getElementById("csvFileInput");
    const btnSample = document.getElementById("btnLoadSampleCsv");
    const btnProcess = document.getElementById("btnProcessCsv");
    const preview = document.getElementById("csvSamplePreview");

    let currentCsvType = "orders";

    const samples = {
      orders: "Order ID,Amount,Payment,Delivery,Previous RTO\nORD001,1000,COD,Pending,No\nORD002,1500,Online,Delivered,No\nORD003,800,COD,Pending,Yes\nORD004,1200,COD,Pending,No\nORD005,950,Online,Delivered,No",
      invoices: "Invoice,Customer,Amount,Due Date,Status\nINV001,ABC Ltd,50000,25-Sep,Pending\nINV002,XYZ Ltd,80000,28-Sep,Pending\nINV003,Apex Retail,35000,02-Oct,Pending",
      transactions: "Date,Description,Type,Amount,Category\n21-Sep,Supplier A,Debit,50000,Supplier\n22-Sep,EMI,Debit,10000,Loan\n23-Sep,Customer A,Credit,40000,Sales\n24-Sep,Warehouse,Debit,12000,Logistics"
    };

    if (btnOpen && modal) {
      btnOpen.addEventListener("click", () => modal.classList.add("active"));
    }
    if (btnClose && modal) {
      btnClose.addEventListener("click", () => modal.classList.remove("active"));
    }

    // CSV Type tabs
    ["btnCsvTypeOrders", "btnCsvTypeInvoices", "btnCsvTypeTx"].forEach(id => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.addEventListener("click", () => {
          document.querySelectorAll("#csvUploadModal .risk-subtab-btn").forEach(b => b.classList.remove("active"));
          btn.classList.add("active");
          currentCsvType = btn.dataset.csvtype;
          if (preview) preview.textContent = samples[currentCsvType];
        });
      }
    });

    if (dropZone && fileInput) {
      dropZone.addEventListener("click", () => fileInput.click());
      fileInput.addEventListener("change", (e) => {
        if (e.target.files.length > 0) {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onload = (re) => {
            if (preview) preview.textContent = re.target.result;
            this.toast.info(`Loaded file: ${file.name}`);
          };
          reader.readAsText(file);
        }
      });
    }

    if (btnSample && preview) {
      btnSample.addEventListener("click", () => {
        preview.textContent = samples[currentCsvType];
        this.toast.info(`Loaded sample ${currentCsvType} template.`);
      });
    }

    if (btnProcess) {
      btnProcess.addEventListener("click", async () => {
        const text = preview ? preview.textContent : "";
        try {
          const formData = new FormData();
          formData.append("csv_type", currentCsvType);
          formData.append("csv_text", text);

          const res = await fetch("/api/upload-csv", {
            method: "POST",
            body: formData
          });

          if (res.ok) {
            const data = await res.json();
            if (data.summary && data.summary.calculated) {
              const calc = data.summary.calculated;
              if (calc.pending_receivables) document.getElementById("inpPendingReceivables").value = calc.pending_receivables;
              if (calc.monthly_orders) document.getElementById("inpMonthlyOrders").value = calc.monthly_orders;
              if (calc.average_order_value) document.getElementById("inpAov").value = calc.average_order_value;
              if (calc.rto_rate) document.getElementById("inpRtoRate").value = calc.rto_rate;
              if (calc.upcoming_outflows) document.getElementById("inpUpcomingOutflows").value = calc.upcoming_outflows;
              if (calc.expected_inflows) document.getElementById("inpExpectedInflows").value = calc.expected_inflows;

              await this.submitCashFlowAnalysis();
              this.toast.success(data.message);
              if (modal) modal.classList.remove("active");
            }
          }
        } catch (e) {
          console.warn("CSV processing error:", e);
          this.toast.error("Failed to process CSV file.");
        }
      });
    }
  }

  bindReportPrintEvents() {
    const btnPrint = document.getElementById("btnPrintReport");
    if (btnPrint) {
      btnPrint.addEventListener("click", () => {
        window.print();
      });
    }
  }

  bindActionEvents() {
    // Why button on orders table
    document.getElementById("rtoOrdersTableBody")?.addEventListener("click", (e) => {
      const btnWhy = e.target.closest(".btn-why-rto");
      if (btnWhy) {
        const orderId = btnWhy.dataset.orderId;
        const order = this.orders.find(o => o.id === orderId);
        if (order) {
          this.modalCtrl.showRTOExplanation(order, this.currencySymbol);
        }
      }
    });

    // 2% Rebate trigger
    document.getElementById("receivablesTableBody")?.addEventListener("click", (e) => {
      const btnRebate = e.target.closest(".btn-trigger-rebate");
      if (btnRebate) {
        const invId = btnRebate.dataset.invId;
        const inv = this.invoices.find(i => i.id === invId);
        if (inv) {
          inv.delayProbability = 15;
          inv.paymentHistory += " (2% early discount applied; payment released)";
          this.totalCashProtectedByActions += Math.round(inv.amount * 0.98);
          this.recomputeAll();
          this.toast.success(`Dispatched 2% early payment incentive for ${inv.id}. Inflow pulled forward!`);
        }
      }
    });

    // Action Approval handler
    document.getElementById("top3ActionsContainer")?.addEventListener("click", (e) => {
      const btnApprove = e.target.closest(".btn-approve-action");
      if (btnApprove) {
        const rank = btnApprove.dataset.actionRank;
        const title = btnApprove.dataset.actionTitle || "Action";
        btnApprove.outerHTML = `<span class="approved-tag"><i class="fa-solid fa-circle-check"></i> Approved by User</span>`;
        this.toast.success(`Action #${rank} Approved: "${title}" authorized.`);
      }
    });

    // Debit verification handler
    document.getElementById("debitsTableBody")?.addEventListener("click", (e) => {
      const btnVerify = e.target.closest(".btn-verify-debit");
      if (btnVerify) {
        const debId = btnVerify.dataset.debId;
        const deb = this.debits.find(d => d.id === debId);
        btnVerify.outerHTML = `<span class="approved-tag" style="font-size:10px;"><i class="fa-solid fa-check"></i> Verified</span>`;
        this.toast.success(`Mandate verified: ${deb ? deb.name : 'Payment schedule confirmed.'}`);
      }
    });
  }

  async loadDemoPreset(presetType = "standard") {
    let demoData = {
      current_balance: 100000,
      expected_inflows: 40000,
      upcoming_outflows: 70000,
      monthly_orders: 1000,
      average_order_value: 1000,
      rto_rate: 8.0,
      pending_receivables: 50000
    };

    try {
      const res = await fetch(`/api/demo?preset=${presetType}`);
      if (res.ok) {
        const json = await res.json();
        if (json.data) demoData = json.data;
      }
    } catch (e) {
      console.warn("Could not fetch demo from backend, using standard demo:", e);
    }

    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val;
    };
    setVal("inpCurrentBalance", demoData.current_balance);
    setVal("inpExpectedInflows", demoData.expected_inflows);
    setVal("inpUpcomingOutflows", demoData.upcoming_outflows);
    setVal("inpMonthlyOrders", demoData.monthly_orders);
    setVal("inpAov", demoData.average_order_value);
    setVal("inpRtoRate", demoData.rto_rate);
    setVal("inpPendingReceivables", demoData.pending_receivables);

    this.toast.info(`Loaded Fictional Demo Data: ₹${demoData.current_balance.toLocaleString('en-IN')} Balance, ${demoData.rto_rate}% RTO.`);

    await this.submitCashFlowAnalysis();
  }

  updateFormCurrencyPrefixes(symbol) {
    const ids = ["prefixCurrentBalance", "prefixExpectedInflows", "prefixUpcomingOutflows", "prefixAov", "prefixPendingReceivables"];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = symbol;
    });
  }

  async handleSimulateBackend(appliedParams) {
    const payload = {
      current_balance: this.currentBalance,
      expected_inflows: appliedParams.expectedInflows || 40000,
      upcoming_outflows: appliedParams.upcomingOutflows || 70000,
      monthly_orders: appliedParams.monthlyOrders || 1000,
      average_order_value: appliedParams.aov || 1000,
      rto_rate: appliedParams.rtoRate || 8,
      pending_receivables: (this.receivableResult && this.receivableResult.totalReceivables) || 50000,
      currency_symbol: this.currencySymbol
    };

    try {
      const res = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        this.updateDashboardFromAnalysis(data.results, payload);
        this.toast.success(`What-If Simulation recalculated! Balance: ${this.formatCurrency(data.results.projected_balance)} (${data.results.status})`);
      }
    } catch (e) {
      console.warn("Backend simulation error:", e);
      const fallback = this.calculateCashFlowLocally(payload);
      this.updateDashboardFromAnalysis(fallback.results, payload);
      this.toast.success(`Simulation updated: ${this.formatCurrency(fallback.results.projected_balance)}`);
    }
  }

  calculateCashFlowLocally(payload) {
    const cb = Number(payload.current_balance) || 100000;
    const inf = Number(payload.expected_inflows) || 40000;
    const out = Number(payload.upcoming_outflows) || 70000;
    const mo = Number(payload.monthly_orders) || 1000;
    const aov = Number(payload.average_order_value) || 1000;
    const rto = Number(payload.rto_rate) || 8;
    const rec = Number(payload.pending_receivables) || 50000;
    const sym = payload.currency_symbol || "₹";

    const projected_balance = cb + inf - out;
    const estimated_rto_orders = Math.round(mo * (rto / 100));
    const estimated_rto_value = Math.round(estimated_rto_orders * aov);
    const unit_rto_cost = Math.min(650, Math.max(350, aov * 0.25));
    const estimated_rto_loss = Math.round(estimated_rto_orders * unit_rto_cost);

    const safety_buffer = Math.round(out * 0.25) + 15000;
    const protected_balance_requirement = Math.max(0, Math.round(out - inf + safety_buffer));
    const shortfall_gap = Math.max(0, Math.round(protected_balance_requirement - cb));
    const surplus_buffer = Math.max(0, Math.round(cb - protected_balance_requirement));
    const cash_at_risk = Math.round(estimated_rto_loss + (rec * 0.65) + (out * 0.20));

    let status = "Safe";
    let status_tone = "Safe";
    let status_badge_class = "safe";

    if (projected_balance <= 0 || cb < (out * 0.4)) {
      status = "High Risk";
      status_tone = "High Risk";
      status_badge_class = "risk";
    } else if (projected_balance < safety_buffer || (out > (cb + inf * 0.7)) || rto >= 20.0) {
      status = "Watch";
      status_tone = "Watch";
      status_badge_class = "warn";
    }

    const why_factors = [
      { icon: "fa-arrow-up-right-from-square", title: "Upcoming Payments & Debits", detail: `${sym}${out.toLocaleString()} scheduled to leave account`, status: out >= cb * 0.6 ? "warning" : "normal" },
      { icon: "fa-file-invoice-dollar", title: "Pending B2B Receivables", detail: `${sym}${rec.toLocaleString()} tied up in unpaid invoices`, status: rec >= out * 0.5 ? "warning" : "normal" },
      { icon: "fa-rotate-left", title: "RTO Refusal Drag", detail: `${rto}% return rate (${estimated_rto_orders} returned orders, ~${sym}${estimated_rto_loss.toLocaleString()} shipping drag)`, status: rto >= 15 ? "warning" : "normal" },
      { icon: "fa-chart-line", title: "Net Projected Cash Trajectory", detail: `Projected balance of ${sym}${projected_balance.toLocaleString()} (Current ${sym}${cb.toLocaleString()} + Inflows ${sym}${inf.toLocaleString()} - Outflows ${sym}${out.toLocaleString()})`, status: projected_balance <= 0 ? "warning" : "safe" }
    ];

    const ai_cash_insight = status === "High Risk"
      ? `Your projected cash position is under pressure mainly because upcoming payments (${sym}${out.toLocaleString()}) exceed available cash (${sym}${cb.toLocaleString()}) and expected inflows (${sym}${inf.toLocaleString()}), creating a projected deficit of ${sym}${Math.abs(projected_balance).toLocaleString()}.`
      : (status === "Watch"
        ? `Your projected cash position requires close monitoring. While your projected balance remains positive at ${sym}${projected_balance.toLocaleString()}, upcoming payments (${sym}${out.toLocaleString()}) consume a substantial portion of liquid funds.`
        : `Your projected cash position is healthy and stable. Available cash (${sym}${cb.toLocaleString()}) plus expected inflows (${sym}${inf.toLocaleString()}) reliably cover upcoming outflows (${sym}${out.toLocaleString()}), leaving a projected balance of ${sym}${projected_balance.toLocaleString()}.`);

    const top_3_actions = [
      { rank: 1, id: "act_receivables", title: "Follow up on pending receivables", description: `${sym}${rec.toLocaleString()} is currently pending from B2B clients. Offer a 2% early settlement discount to pull forward cash before scheduled debits mature.`, impact_label: `Pulls forward up to ${sym}${Math.round(rec * 0.98).toLocaleString()}`, badge: "Priority 1" },
      { rank: 2, id: "act_rto", title: "Review high-risk COD orders", description: `RTO exposure may increase operational costs by ~${sym}${estimated_rto_loss.toLocaleString()}. Enable automated WhatsApp address verification.`, impact_label: `Saves ~${sym}${Math.round(estimated_rto_loss * 0.55).toLocaleString()} return drag`, badge: "Priority 2" },
      { rank: 3, id: "act_buffer", title: "Maintain an appropriate cash buffer", description: `Upcoming payments of ${sym}${out.toLocaleString()} may reduce available cash. Ensure funds are reserved for scheduled mandatory auto-debits.`, impact_label: `Shields ${sym}${out.toLocaleString()} commitment`, badge: "Priority 3" }
    ];

    const early_warnings = [];
    if (projected_balance <= 0) {
      early_warnings.append({ level: "critical", title: "Cash-Flow Pressure Expected in Next 7-14 Days", message: `Upcoming commitments of ${sym}${out.toLocaleString()} exceed liquid cash and expected inflows by ${sym}${Math.abs(projected_balance).toLocaleString()}.` });
    } else if (out >= cb * 0.7) {
      early_warnings.append({ level: "warning", title: "High Near-Term Outflows", message: `${sym}${out.toLocaleString()} in upcoming payments may reduce your available cash significantly.` });
    }

    const milestones = {
      current: cb,
      day7: Math.round(cb + (inf * 0.25) - (out * 0.45) - (estimated_rto_loss * 0.25)),
      day15: Math.round(cb + (inf * 0.55) - (out * 0.75) - (estimated_rto_loss * 0.50)),
      day30: Math.round(projected_balance - estimated_rto_loss)
    };

    return {
      success: true,
      inputs: payload,
      results: {
        current_balance: cb,
        protected_balance: protected_balance_requirement,
        cash_at_risk,
        receivables_at_risk: rec,
        rto_exposure: estimated_rto_loss,
        rto_exposure_gmv: estimated_rto_value,
        upcoming_7d_payments: out,
        projected_balance,
        estimated_rto_orders,
        safety_buffer,
        shortfall_gap,
        surplus_buffer,
        status,
        status_tone,
        status_badge_class,
        why_factors,
        ai_cash_insight,
        early_warnings,
        top_3_actions,
        milestones
      }
    };
  }
}

// Bootstrap on DOM Ready
document.addEventListener("DOMContentLoaded", () => {
  const app = new CashFlowShieldApp();
  app.init();
  window.cashFlowShieldApp = app;
});
