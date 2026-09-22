/**
 * CashFlowShield AI - B2B Receivable Risk Engine
 * Principle: Detect -> Predict -> Explain -> Protect -> Act
 * Incorporates MSMED Act Section 15 reference information.
 */

export class ReceivableEngine {
  /**
   * Analyzes an individual invoice for payment delay probability and cash exposure.
   * @param {Object} invoice
   * @returns {Object} enriched invoice analysis
   */
  static analyzeInvoice(invoice) {
    const amount = invoice.amount || 0;
    const delayProb = Math.min(100, Math.max(0, invoice.delayProbability || 20));
    
    // Potential cash exposure is the amount delayed beyond scheduled due date
    // Cash-at-Risk exposure = amount * (delayProb / 100)
    const expectedDelayExposure = Math.round(amount * (delayProb / 100));

    let riskTier = "low";
    let collectionPriority = "Standard Tracking";
    if (delayProb >= 60) {
      riskTier = "high";
      collectionPriority = "Urgent Intervention (Priority 1)";
    } else if (delayProb >= 30) {
      riskTier = "med";
      collectionPriority = "Active Follow-up (Priority 2)";
    }

    // Root-cause factors for transparent AI explanation
    const factorBreakdown = [];
    if (invoice.daysRemaining <= 5 && delayProb >= 50) {
      factorBreakdown.push({
        factor: "Imminent Due Date with High Delay Probability",
        weight: "High Urgency",
        explanation: `Invoice due in ${invoice.daysRemaining} days, but debtor payment turnaround averages significantly longer.`
      });
    }

    if (invoice.paymentHistory) {
      factorBreakdown.push({
        factor: "Debtor Historical Payment Track Record",
        weight: "Behavioral Metric",
        explanation: invoice.paymentHistory
      });
    }

    if (invoice.statutoryStatus && invoice.statutoryStatus.includes("MSMED")) {
      factorBreakdown.push({
        factor: "MSME Statutory Protection (Section 15)",
        weight: "Regulatory Context",
        explanation: "Buyer is legally obligated under MSMED Act 2006 to settle within agreed period (maximum 45 days). Failure attracts compound interest at 3x RBI Bank Rate."
      });
    }

    // Recommended protective collection actions
    const protectiveActions = [];
    if (riskTier === "high") {
      protectiveActions.push({
        actionId: `act_inv_early_${invoice.id}`,
        title: `Offer 2% Instant Settlement Discount on ${invoice.id}`,
        description: `Incentivize ${invoice.client} to pay ₹${amount.toLocaleString('en-IN')} early for a 2% discount (saves ₹${Math.round(amount * 0.02).toLocaleString('en-IN')} in working capital holding costs).`,
        potentialCashPulledForward: Math.round(amount * 0.98),
        type: "discount_incentive"
      });
      protectiveActions.push({
        actionId: `act_inv_notice_${invoice.id}`,
        title: `Send Formal Statement of Account & Due Date Reminder`,
        description: `Dispatch automated formal reconciliation ledger with due date alert to accounts payable team.`,
        potentialCashPulledForward: amount,
        type: "formal_notice"
      });
    } else if (riskTier === "med") {
      protectiveActions.push({
        actionId: `act_inv_remind_${invoice.id}`,
        title: `Send Friendly WhatsApp/Email Due Date Ping`,
        description: `Polite reminder sent 4 days prior to due date with 1-click digital payment link.`,
        potentialCashPulledForward: amount,
        type: "soft_reminder"
      });
    }

    return {
      ...invoice,
      riskTier,
      collectionPriority,
      expectedDelayExposure,
      factorBreakdown,
      protectiveActions
    };
  }

  /**
   * Analyzes an array of B2B invoices and computes aggregate receivables metrics.
   * @param {Array} invoices
   * @returns {Object} aggregate analysis
   */
  static analyzeBatch(invoices = []) {
    let totalReceivables = 0;
    let highRiskAmount = 0;
    let medRiskAmount = 0;
    let lowRiskAmount = 0;
    let totalDelayedExposure = 0;
    let highRiskCount = 0;

    const analyzedInvoices = invoices.map(inv => {
      const analyzed = this.analyzeInvoice(inv);
      totalReceivables += (analyzed.amount || 0);
      totalDelayedExposure += analyzed.expectedDelayExposure;

      if (analyzed.riskTier === "high") {
        highRiskAmount += analyzed.amount;
        highRiskCount++;
      } else if (analyzed.riskTier === "med") {
        medRiskAmount += analyzed.amount;
      } else {
        lowRiskAmount += analyzed.amount;
      }

      return analyzed;
    });

    const averageDelayRisk = totalReceivables > 0
      ? Math.round((totalDelayedExposure / totalReceivables) * 100)
      : 0;

    return {
      invoices: analyzedInvoices,
      totalInvoices: invoices.length,
      totalReceivables,
      totalDelayedExposure,
      highRiskAmount,
      medRiskAmount,
      lowRiskAmount,
      highRiskCount,
      averageDelayRisk,
      regulatoryReference: {
        act: "Micro, Small and Medium Enterprises Development (MSMED) Act, 2006",
        section15: "Mandates buyer payment within agreed terms not exceeding 45 days from acceptance date.",
        section16: "Imposes compound interest with monthly rests at 3 times the Bank Rate notified by RBI for defaulted duration.",
        disclaimer: "Reference purpose only. CashFlowShield AI does not provide formal legal counsel. Verify specific contract terms with your legal advisor."
      }
    };
  }
}
