/**
 * CashFlowShield AI - 🛡️ Protected Balance Engine
 * Signature Feature: Estimates required liquidity buffer to avert projected shortfalls.
 * Principle: Detect -> Predict -> Explain -> Protect -> Act
 * 
 * Formula:
 * Protected Balance Requirement = Upcoming Essential Obligations - Reliable Expected Inflows + Safety Buffer
 */

export class ProtectedBalanceEngine {
  /**
   * Calculates the Protected Balance Requirement and safety coverage status.
   * @param {Object} options
   * @param {Number} options.currentBalance - Currently liquid cash in bank accounts
   * @param {Number} options.essentialObligations - Mandatory scheduled debits in near term (e.g. 7-14 days)
   * @param {Number} options.reliableInflows - Expected receivables discounted for delay probability
   * @param {Number} options.safetyBuffer - Custom buffer based on daily burn rate * buffer days
   * @param {Number} options.safetyBufferDays - Number of operating days buffer
   * @returns {Object} Protected balance analysis
   */
  static calculate({
    currentBalance = 0,
    essentialObligations = 0,
    reliableInflows = 0,
    safetyBuffer = 50000,
    safetyBufferDays = 14
  }) {
    // Formula: Upcoming Essential Obligations - Reliable Inflows + Safety Buffer
    const netObligationGap = essentialObligations - reliableInflows;
    const requirement = Math.max(0, netObligationGap + safetyBuffer);

    // Current Cash vs Protected Balance Requirement
    const difference = currentBalance - requirement;
    const isProtected = difference >= 0;
    const shortfallGap = isProtected ? 0 : Math.abs(difference);
    const surplusBuffer = isProtected ? difference : 0;

    // Coverage Ratio (%)
    const coverageRatio = requirement > 0 ? Math.round((currentBalance / requirement) * 100) : 100;

    // Formatted Human-Readable Advice
    let statusTone = "safe";
    let statusTitle = "Protected • Adequate Buffer";
    let advice = `Available cash meets the AI-recommended liquidity target for the next ${safetyBufferDays} days.`;

    if (!isProtected) {
      if (coverageRatio < 60) {
        statusTone = "critical";
        statusTitle = "High Shortfall Alert";
      } else {
        statusTone = "warning";
        statusTitle = "Shortfall Vulnerability";
      }
      advice = `Maintain approximately ₹${requirement.toLocaleString('en-IN')} of available cash to reduce projected shortfall risk (Gap: ₹${shortfallGap.toLocaleString('en-IN')}).`;
    }

    return {
      currentBalance,
      essentialObligations,
      reliableInflows,
      safetyBuffer,
      safetyBufferDays,
      requirement,
      difference,
      isProtected,
      shortfallGap,
      surplusBuffer,
      coverageRatio,
      statusTone,
      statusTitle,
      advice,
      disclaimer: "AI risk-buffer estimate for operational cash-flow planning. Not legal or banking financial advice."
    };
  }
}
