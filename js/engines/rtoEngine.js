/**
 * CashFlowShield AI - D2C Return-to-Origin (RTO) Risk Engine
 * Principle: Detect -> Predict -> Explain -> Protect -> Act
 */

export class RTOEngine {
  /**
   * Evaluates an individual order's RTO risk, expected leakage, and risk factors.
   * @param {Object} order
   * @returns {Object} enriched order analysis
   */
  static analyzeOrder(order) {
    const rtoCost = order.rtoCost || 550; // default estimated freight + handling + packaging loss
    const probability = Math.min(100, Math.max(0, order.rtoProbability || 15));
    const expectedLoss = Math.round((probability / 100) * rtoCost);
    
    // Risk categorization
    let riskTier = "low";
    if (probability >= 50) {
      riskTier = "high";
    } else if (probability >= 25) {
      riskTier = "med";
    }

    // Root-cause factor weights for transparent AI explanation
    const factorBreakdown = [];
    if (order.paymentMethod === "COD") {
      factorBreakdown.push({
        factor: "Cash on Delivery (COD) Payment",
        weight: "+28% Risk",
        impact: "high",
        explanation: "No upfront buyer financial commitment. COD orders suffer 3.4x higher refusal rates than prepaid orders."
      });
    } else {
      factorBreakdown.push({
        factor: "Prepaid Payment Verified",
        weight: "-25% Risk",
        impact: "positive",
        explanation: "Buyer already completed UPI/Card payment, reducing non-acceptance risk by ~80%."
      });
    }

    if (order.riskFactors && order.riskFactors.some(f => f.toLowerCase().includes("failed") || f.toLowerCase().includes("cancelled"))) {
      factorBreakdown.push({
        factor: "Buyer Delivery History Deficit",
        weight: "+22% Risk",
        impact: "high",
        explanation: "Customer records indicate 1 or more previous non-delivery or rejection events within the logistics network."
      });
    }

    if (order.riskFactors && order.riskFactors.some(f => f.toLowerCase().includes("address") || f.toLowerCase().includes("missing"))) {
      factorBreakdown.push({
        factor: "Incomplete Address / Missing Landmark",
        weight: "+18% Risk",
        impact: "high",
        explanation: "Last-mile courier navigation failure risk. Street, house number, or landmark information is incomplete."
      });
    }

    if (order.distanceTier && (order.distanceTier.includes("Interstate") || order.distanceTier.includes(">"))) {
      factorBreakdown.push({
        factor: "High Transit Distance & Hub Hops",
        weight: "+12% Risk",
        impact: "med",
        explanation: "Longer transit time (3-5 days) increases customer change-of-mind and impulsive order cancellation."
      });
    }

    if (order.riskFactors && order.riskFactors.some(f => f.toLowerCase().includes("unconfirmed") || f.toLowerCase().includes("ignored"))) {
      factorBreakdown.push({
        factor: "No Real-Time Customer Verification",
        weight: "+15% Risk",
        impact: "med",
        explanation: "Customer has not acknowledged automated WhatsApp prompt or SMS confirmation."
      });
    }

    // Recommended Protective Actions
    const protectiveActions = [];
    if (riskTier === "high") {
      protectiveActions.push({
        actionId: `act_rto_wa_${order.id}`,
        title: `Verify Address via WhatsApp for ${order.id}`,
        description: `Send 1-click WhatsApp location ping to ${order.customer} (${order.phone}). If verified, RTO risk drops from ${probability}% to ~22%.`,
        potentialSavings: Math.round(expectedLoss * 0.65),
        type: "verification"
      });
      if (order.paymentMethod === "COD") {
        protectiveActions.push({
          actionId: `act_rto_prepaid_${order.id}`,
          title: `Incentivize Prepaid Conversion (₹50 OFF)`,
          description: `Offer instant ₹50 UPI cashback to convert Order ${order.id} (₹${order.value.toLocaleString('en-IN')}) to prepaid before dispatch.`,
          potentialSavings: Math.round(expectedLoss * 0.85),
          type: "prepaid_conversion"
        });
      }
    } else if (riskTier === "med") {
      protectiveActions.push({
        actionId: `act_rto_call_${order.id}`,
        title: `Dispatch Confirmation SMS/IVR`,
        description: `Automated 2-way SMS confirmation before handing over to courier partner.`,
        potentialSavings: Math.round(expectedLoss * 0.4),
        type: "notification"
      });
    }

    return {
      ...order,
      expectedLoss,
      riskTier,
      factorBreakdown,
      protectiveActions
    };
  }

  /**
   * Analyzes a collection of orders and computes aggregate RTO metrics.
   * @param {Array} orders
   * @returns {Object} aggregate analysis
   */
  static analyzeBatch(orders = []) {
    let totalOrderValue = 0;
    let totalExpectedLoss = 0;
    let highRiskCount = 0;
    let medRiskCount = 0;
    let lowRiskCount = 0;
    let codCount = 0;
    let weightedProbabilitySum = 0;

    const analyzedOrders = orders.map(order => {
      const analyzed = this.analyzeOrder(order);
      totalOrderValue += (analyzed.value || 0);
      totalExpectedLoss += analyzed.expectedLoss;
      weightedProbabilitySum += (analyzed.rtoProbability || 0) * (analyzed.value || 0);

      if (analyzed.riskTier === "high") highRiskCount++;
      else if (analyzed.riskTier === "med") medRiskCount++;
      else lowRiskCount++;

      if (analyzed.paymentMethod === "COD") codCount++;

      return analyzed;
    });

    const avgProbability = totalOrderValue > 0 
      ? Math.round(weightedProbabilitySum / totalOrderValue)
      : (orders.length > 0 ? Math.round(orders.reduce((acc, o) => acc + (o.rtoProbability || 0), 0) / orders.length) : 0);

    return {
      orders: analyzedOrders,
      totalOrders: orders.length,
      totalOrderValue,
      totalExpectedLoss,
      avgProbability,
      highRiskCount,
      medRiskCount,
      lowRiskCount,
      codRatio: orders.length > 0 ? Math.round((codCount / orders.length) * 100) : 0
    };
  }
}
