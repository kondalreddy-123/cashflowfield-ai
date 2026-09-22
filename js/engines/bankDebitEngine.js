/**
 * CashFlowShield AI - Bank Debit Prediction Engine
 * Principle: Detect -> Predict -> Explain -> Protect -> Act
 * Categorizes and forecasts predictable outflows (Supplier, EMI, Subscriptions, Taxes, Payroll).
 */

export class BankDebitEngine {
  /**
   * Analyzes an array of upcoming debits and groups them by horizon and category.
   * @param {Array} debits
   * @param {Number} currentCashBalance
   * @returns {Object} debit forecast analysis
   */
  static analyzeDebits(debits = [], currentCashBalance = 0) {
    let totalAllDebits = 0;
    let next7DaysTotal = 0;
    let next15DaysTotal = 0;
    let next30DaysTotal = 0;
    let mandatoryTotal = 0;
    let autoDebitTotal = 0;

    const categoryBreakdown = {};

    const enrichedDebits = debits.map(debit => {
      const amount = debit.amount || 0;
      const days = debit.daysRemaining ?? 7;
      totalAllDebits += amount;

      if (days <= 7) next7DaysTotal += amount;
      if (days <= 15) next15DaysTotal += amount;
      if (days <= 30) next30DaysTotal += amount;

      if (debit.mandatory) mandatoryTotal += amount;
      if (debit.autoDebit) autoDebitTotal += amount;

      const cat = debit.category || "General";
      categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + amount;

      return {
        ...debit,
        isImminent: days <= 7,
        urgencyTier: days <= 3 ? "urgent" : (days <= 7 ? "warning" : "normal")
      };
    });

    // Sort by chronological urgency (closest days first)
    enrichedDebits.sort((a, b) => a.daysRemaining - b.daysRemaining);

    // Bounce Risk Assessment: Check if 7-day debits exceed current available cash
    const sevenDayCashDeficit = Math.max(0, next7DaysTotal - currentCashBalance);
    const hasBounceRisk = sevenDayCashDeficit > 0;

    return {
      debits: enrichedDebits,
      totalDebits: debits.length,
      totalAllDebits,
      next7DaysTotal,
      next15DaysTotal,
      next30DaysTotal,
      mandatoryTotal,
      autoDebitTotal,
      categoryBreakdown,
      hasBounceRisk,
      sevenDayCashDeficit
    };
  }
}
