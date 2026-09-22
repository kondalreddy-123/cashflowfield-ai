/**
 * CashFlowShield AI - What-If Financial Scenario Simulator Component
 * Allows business owners and finance teams to stress-test their unit economics,
 * RTO rates, and payment turnaround in real time.
 */

export class WhatIfSimulator {
  constructor(containerElement, onApplyCallback) {
    this.container = containerElement;
    this.onApplyCallback = onApplyCallback;
    this.currencySymbol = "₹";

    // Baseline parameters (Current)
    this.baseline = {
      rtoRate: 8,
      expectedInflows: 40000,
      upcomingOutflows: 70000,
      monthlyOrders: 1000,
      aov: 1000,
      currentBalance: 100000
    };

    // Simulated scenario parameters
    this.params = { ...this.baseline };
  }

  setCurrency(symbol = "₹") {
    this.currencySymbol = symbol;
    this.updateDisplays();
    this.recalculate();
  }

  setBaseline(newBaseline = {}) {
    this.baseline = { ...this.baseline, ...newBaseline };
    this.params = { ...this.baseline };
    this.syncInputs();
    this.updateDisplays();
    this.recalculate();
  }

  setParams(newParams = {}) {
    this.params = { ...this.params, ...newParams };
    this.syncInputs();
    this.updateDisplays();
    this.recalculate();
  }

  init() {
    this.bindEvents();
    this.syncInputs();
    this.updateDisplays();
    this.recalculate();
  }

  syncInputs() {
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val;
    };
    setVal("inputSimRtoRate", this.params.rtoRate);
    setVal("inputSimInflow", this.params.expectedInflows);
    setVal("inputSimOutflow", this.params.upcomingOutflows);
    setVal("inputSimOrders", this.params.monthlyOrders);
    setVal("inputSimAov", this.params.aov);
  }

  bindEvents() {
    const bindSlider = (id, paramKey, displayId, formatter) => {
      const el = document.getElementById(id);
      const disp = document.getElementById(displayId);
      if (!el) return;

      el.addEventListener('input', (e) => {
        const val = Number(e.target.value);
        this.params[paramKey] = val;
        if (disp) disp.textContent = formatter(val);
        this.recalculate();
      });
    };

    bindSlider("inputSimRtoRate", "rtoRate", "valSimRtoRate", v => `${v}%`);
    bindSlider("inputSimInflow", "expectedInflows", "valSimInflow", v => `${this.currencySymbol}${v.toLocaleString('en-IN')}`);
    bindSlider("inputSimOutflow", "upcomingOutflows", "valSimOutflow", v => `${this.currencySymbol}${v.toLocaleString('en-IN')}`);
    bindSlider("inputSimOrders", "monthlyOrders", "valSimOrders", v => v.toLocaleString('en-IN'));
    bindSlider("inputSimAov", "aov", "valSimAov", v => `${this.currencySymbol}${v.toLocaleString('en-IN')}`);

    const btnReset = document.getElementById("btnResetSim");
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        this.params = { ...this.baseline };
        this.syncInputs();
        this.updateDisplays();
        this.recalculate();
      });
    }

    const btnSimulate = document.getElementById("btnSimulateBackend");
    if (btnSimulate) {
      btnSimulate.addEventListener('click', () => {
        if (typeof this.onApplyCallback === 'function') {
          this.onApplyCallback(this.params);
        }
      });
    }
  }

  updateDisplays() {
    const setTxt = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };
    setTxt("valSimRtoRate", `${this.params.rtoRate}%`);
    setTxt("valSimInflow", `${this.currencySymbol}${(this.params.expectedInflows || 40000).toLocaleString('en-IN')}`);
    setTxt("valSimOutflow", `${this.currencySymbol}${(this.params.upcomingOutflows || 70000).toLocaleString('en-IN')}`);
    setTxt("valSimOrders", (this.params.monthlyOrders || 1000).toLocaleString('en-IN'));
    setTxt("valSimAov", `${this.currencySymbol}${(this.params.aov || 1000).toLocaleString('en-IN')}`);
  }

  recalculate() {
    const formatNum = (v) => {
      if (Math.abs(v) >= 100000) {
        return `${this.currencySymbol}${(v / 100000).toFixed(2)}L`;
      }
      return `${this.currencySymbol}${Math.round(v).toLocaleString('en-IN')}`;
    };

    // 1. Baseline Calculations
    const baseOrders = Number(this.baseline.monthlyOrders || 1000);
    const baseRto = Number(this.baseline.rtoRate || 8);
    const baseAov = Number(this.baseline.aov || 1000);
    const baseReturned = Math.round(baseOrders * (baseRto / 100));
    const baseUnitCost = Math.min(650, Math.max(350, baseAov * 0.25));
    const baseExposure = Math.round(baseReturned * baseUnitCost);

    // 2. Scenario Calculations
    const simOrders = Number(this.params.monthlyOrders || 1000);
    const simRto = Number(this.params.rtoRate || 8);
    const simAov = Number(this.params.aov || 1000);
    const simInflows = Number(this.params.expectedInflows || 40000);
    const simOutflows = Number(this.params.upcomingOutflows || 70000);
    const curBalance = Number(this.params.currentBalance || this.baseline.currentBalance || 100000);

    const simReturned = Math.round(simOrders * (simRto / 100));
    const simUnitCost = Math.min(650, Math.max(350, simAov * 0.25));
    const simExposure = Math.round(simReturned * simUnitCost);

    // 3. Difference
    const diff = simExposure - baseExposure;
    const diffSign = diff > 0 ? "+" : (diff < 0 ? "-" : "");
    const diffAbs = Math.abs(diff);

    // 4. Projected Balance = Current + Inflow - Outflow
    const simProjectedBalance = curBalance + simInflows - simOutflows;

    const setTxt = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    };

    setTxt("statCurrentExposure", formatNum(baseExposure));
    setTxt("statScenarioExposure", formatNum(simExposure));
    
    const diffEl = document.getElementById("statExposureDiff");
    if (diffEl) {
      diffEl.textContent = `${diffSign}${formatNum(diffAbs)}`;
      diffEl.style.color = diff > 0 ? "var(--risk-color)" : (diff < 0 ? "var(--safe-color)" : "var(--primary-color)");
    }

    const projEl = document.getElementById("statSimProjected");
    if (projEl) {
      projEl.textContent = formatNum(simProjectedBalance);
      projEl.style.color = simProjectedBalance > 0 ? "var(--text-primary)" : "var(--risk-color)";
    }

    const summaryEl = document.getElementById("simSummaryDynamicText");
    if (summaryEl) {
      if (diff > 0) {
        summaryEl.textContent = `At an ${simRto}% RTO rate with ${simOrders.toLocaleString('en-IN')} orders, operational return leakage rises by ${formatNum(diffAbs)} above baseline. Upcoming commitments of ${formatNum(simOutflows)} leave a projected balance of ${formatNum(simProjectedBalance)}. Address verification is recommended to shield margin.`;
      } else if (diff < 0) {
        summaryEl.textContent = `Optimizing RTO to ${simRto}% preserves ${formatNum(diffAbs)} in previously lost shipping capital! With ${formatNum(simInflows)} expected inflows and ${formatNum(simOutflows)} obligations, projected cash expands to ${formatNum(simProjectedBalance)}.`;
      } else {
        summaryEl.textContent = `Scenario matches current baseline parameters. Adjust sliders to stress-test how changes in RTO, customer sales inflows, or supplier commitments affect your net cash position.`;
      }
    }
  }
}
