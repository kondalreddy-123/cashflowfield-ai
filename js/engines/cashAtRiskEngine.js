/**
 * CashFlowShield AI - Cash-at-Risk Engine
 * Prominent signature module calculating clear financial exposure.
 * Principle: Detect -> Predict -> Explain -> Protect -> Act
 * 
 * Transparently distinguishes:
 * 1. Expected Loss (Direct sunk cost: e.g. RTO freight & packaging damage)
 * 2. Cash Exposure / Trapped Cash (Delayed receivables postponing inflows)
 * 3. Upcoming Obligations (Mandatory near-term debits that must be met)
 * 4. Predicted Leakage (Gateway MDR, chargeback buffers, failed transaction fees)
 */

export class CashAtRiskEngine {
  /**
   * Computes the consolidated Cash-at-Risk structure.
   * @param {Object} rtoBatchResult - from RTOEngine.analyzeBatch()
   * @param {Object} receivableBatchResult - from ReceivableEngine.analyzeBatch()
   * @param {Object} debitResult - from BankDebitEngine.analyzeDebits()
   * @param {Number} currentBalance
   * @returns {Object} Cash-at-Risk breakdown and explanations
   */
  static compute(rtoBatchResult, receivableBatchResult, debitResult, currentBalance = 0) {
    // 1. Direct Expected Loss (RTO leakage)
    const rtoExpectedLoss = rtoBatchResult ? rtoBatchResult.totalExpectedLoss : 0;

    // 2. Trapped Cash (Delayed B2B Receivables)
    // Weighted delayed amount or high-risk invoices
    const delayedReceivablesExposure = receivableBatchResult ? receivableBatchResult.totalDelayedExposure : 0;

    // 3. Imminent Essential Obligations (Next 7-day mandatory outflows)
    const upcoming7DayObligations = debitResult ? debitResult.next7DaysTotal : 0;

    // 4. Other Predicted Leakage (Gateway holdback + reverse logistics damage buffers ~ 4% of orders)
    const totalOrderVal = rtoBatchResult ? rtoBatchResult.totalOrderValue : 0;
    const otherPredictedLeakage = Math.round(totalOrderVal * 0.035) + 12000;

    // Total Potential Cash Exposure
    const totalCashExposure = rtoExpectedLoss + delayedReceivablesExposure + upcoming7DayObligations + otherPredictedLeakage;

    // Projected Net Liquidity Shortage
    // Shortage = (Upcoming Obligations + Expected Loss) - (Current Cash + (Total Receivables - Delayed Receivables))
    const reliableInflows = receivableBatchResult ? Math.max(0, receivableBatchResult.totalReceivables - delayedReceivablesExposure) : 0;
    const projectedShortage = Math.max(0, (upcoming7DayObligations + rtoExpectedLoss) - (currentBalance + reliableInflows));

    return {
      totalCashExposure,
      projectedShortage,
      breakdown: [
        {
          id: "rto_loss",
          category: "RTO Expected Loss",
          amount: rtoExpectedLoss,
          type: "Direct Sunk Loss",
          typeClass: "risk",
          icon: "fa-rotate-left",
          iconColor: "icon-rto",
          description: "Calculated as Σ(RTO Probability × Estimated Reverse Logistics Cost). Non-recoverable operational cash leak."
        },
        {
          id: "delayed_receivables",
          category: "Delayed B2B Receivables",
          amount: delayedReceivablesExposure,
          type: "Trapped Working Capital",
          typeClass: "warn",
          icon: "fa-clock",
          iconColor: "icon-invoice",
          description: "Invoiced revenue delayed past due date based on debtor credit history and payment delay probability."
        },
        {
          id: "upcoming_obligations",
          category: "Upcoming 7-Day Debits",
          amount: upcoming7DayObligations,
          type: "Mandatory Outflow",
          typeClass: "primary",
          icon: "fa-credit-card",
          iconColor: "icon-debit",
          description: "Mandatory supplier payables, loan EMIs, and statutory obligations scheduled within the next 7 days."
        },
        {
          id: "other_leakage",
          category: "Other Predicted Leakage",
          amount: otherPredictedLeakage,
          type: "Friction & Settlement Drag",
          typeClass: "leakage",
          icon: "fa-coins",
          iconColor: "icon-leakage",
          description: "Payment gateway MDR holdbacks, transit damage claims, and micro bank processing levies."
        }
      ],
      explanation: {
        title: "Cash-at-Risk Calculation Methodology",
        content: "Cash-at-Risk combines direct sunk losses (RTO freight) with temporarily illiquid working capital (delayed receivables) and committed cash outflows (7-day debits). Unlike simple accounting that only tracks balances after money has left, CashFlowShield highlights money in peril of departing or failing to arrive before committed obligations come due."
      }
    };
  }
}
