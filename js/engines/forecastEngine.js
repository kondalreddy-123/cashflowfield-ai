/**
 * CashFlowShield AI - Future Cash-Balance Forecast Engine
 * Generates day-by-day projected cash balance curves across 7D, 15D, 30D, and 90D horizons.
 * Principle: Detect -> Predict -> Explain -> Protect -> Act
 */

export class ForecastEngine {
  /**
   * Generates forecasting points for a given horizon.
   * @param {Object} params
   * @param {Number} params.currentBalance
   * @param {Array} params.debits
   * @param {Array} params.invoices
   * @param {Object} params.rtoMetrics
   * @param {Number} params.horizonDays - 7, 15, 30, or 90
   * @param {Number} params.safetyBuffer
   * @param {Boolean} params.actionsApplied - whether AI recommendations are active
   * @returns {Object} forecast dataset
   */
  static generate({
    currentBalance = 400000,
    debits = [],
    invoices = [],
    rtoMetrics = { totalExpectedLoss: 35000, avgProbability: 25 },
    horizonDays = 30,
    safetyBuffer = 100000,
    actionsApplied = false
  }) {
    const points = [];
    const baseDate = new Date(2026, 8, 21); // 21 Sep 2026

    let runningBaseline = currentBalance;
    let runningAtRisk = currentBalance;
    let runningProtected = currentBalance;

    // Daily distribution helpers
    const dailyRtoLoss = Math.round(rtoMetrics.totalExpectedLoss / Math.min(horizonDays, 14));
    const mitigatedDailyRtoLoss = Math.round(dailyRtoLoss * 0.35); // 65% reduction if mitigated

    // Daily operational inflow baseline (D2C daily settlements ~ ₹25,000 to ₹40,000)
    const baseDailyD2CInflow = 22000;

    for (let day = 0; day <= horizonDays; day++) {
      const pointDate = new Date(baseDate);
      pointDate.setDate(baseDate.getDate() + day);

      const dateStr = pointDate.toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric"
      });

      if (day === 0) {
        points.push({
          day: 0,
          dateStr: "Today (" + dateStr + ")",
          baseline: currentBalance,
          atRisk: currentBalance,
          protected: currentBalance,
          threshold: safetyBuffer,
          inflows: 0,
          outflows: 0,
          events: ["Initial Available Balance"]
        });
        continue;
      }

      // 1. Gather scheduled debits maturing on this exact day
      let dayOutflows = 0;
      const dayEvents = [];

      debits.forEach(d => {
        if (d.daysRemaining === day) {
          dayOutflows += d.amount;
          dayEvents.push(`Debit: ${d.name} (-₹${(d.amount / 1000).toFixed(1)}k)`);
        }
      });

      // Daily D2C returns impact on days 1 to 14
      if (day <= 14) {
        dayOutflows += dailyRtoLoss;
      }

      // 2. Gather incoming invoices maturing on this day
      let dayInflows = baseDailyD2CInflow;
      let delayedInflowLoss = 0;

      invoices.forEach(inv => {
        if (inv.daysRemaining === day) {
          dayInflows += inv.amount;
          dayEvents.push(`Receivable: ${inv.client} (+₹${(inv.amount / 1000).toFixed(1)}k)`);
          
          if (inv.delayProbability >= 50) {
            // under stress scenario, this invoice gets pushed out
            delayedInflowLoss += inv.amount;
          }
        }
      });

      // Update Baseline
      runningBaseline = runningBaseline + dayInflows - dayOutflows;

      // Update At-Risk Scenario (Receivables delayed, full RTO leakage hits)
      const stressOutflows = dayOutflows + (day <= 14 ? Math.round(dailyRtoLoss * 0.4) : 0);
      const stressInflows = Math.max(0, dayInflows - delayedInflowLoss);
      runningAtRisk = runningAtRisk + stressInflows - stressOutflows;

      // Update Protected Scenario (Prepaid conversions, 2% early settlement discount pulls cash forward)
      const protectedOutflows = dayOutflows - (day <= 14 ? (dailyRtoLoss - mitigatedDailyRtoLoss) : 0);
      const protectedInflows = dayInflows + (day === 3 || day === 5 ? 45000 : 0); // liquidity pulled forward
      runningProtected = runningProtected + protectedInflows - protectedOutflows;

      points.push({
        day,
        dateStr,
        baseline: Math.round(runningBaseline),
        atRisk: Math.round(runningAtRisk),
        protected: Math.round(runningProtected),
        threshold: safetyBuffer,
        inflows: Math.round(dayInflows),
        outflows: Math.round(dayOutflows),
        events: dayEvents
      });
    }

    // Key milestone balances summary
    const milestones = {
      today: currentBalance,
      day7: points[Math.min(7, points.length - 1)]?.baseline || currentBalance,
      day15: points[Math.min(15, points.length - 1)]?.baseline || currentBalance,
      day30: points[Math.min(30, points.length - 1)]?.baseline || currentBalance,
      day90: points[points.length - 1]?.baseline || currentBalance
    };

    // Find lowest projected dip
    let lowestBaseline = currentBalance;
    let lowestDay = 0;
    points.forEach(p => {
      if (p.baseline < lowestBaseline) {
        lowestBaseline = p.baseline;
        lowestDay = p.day;
      }
    });

    return {
      points,
      milestones,
      lowestBaseline,
      lowestDay,
      horizonDays,
      safetyBuffer,
      hasShortfall: lowestBaseline < safetyBuffer
    };
  }
}
