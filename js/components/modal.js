/**
 * CashFlowShield AI - Interactive Modal & Root-Cause Explainer Controllers
 * Handles AI Root-Cause explanation modals, Custom Order/Invoice simulation, and Regulatory drawers.
 * Principle: Detect -> Predict -> Explain -> Protect -> Act
 */

export class ModalController {
  constructor() {
    this.overlay = null;
    this.initContainers();
  }

  initContainers() {
    let overlay = document.getElementById("globalModalOverlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "globalModalOverlay";
      overlay.className = "modal-overlay";
      document.body.appendChild(overlay);
    }
    this.overlay = overlay;

    this.overlay.addEventListener("click", (e) => {
      if (e.target === this.overlay) {
        this.close();
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.overlay.classList.contains("active")) {
        this.close();
      }
    });
  }

  close() {
    if (this.overlay) {
      this.overlay.classList.remove("active");
      this.overlay.innerHTML = "";
    }
  }

  /**
   * Explains WHY an order is categorized at high or medium RTO risk.
   * @param {Object} order
   * @param {String} currencySymbol
   */
  showRTOExplanation(order, currencySymbol = "₹") {
    const formatNum = (v) => `${currencySymbol}${Number(v || 0).toLocaleString('en-IN')}`;

    const rtoProb = Number(order.rtoProbability || 0);
    const riskBadgeClass = rtoProb >= 50 ? "risk" : (rtoProb >= 25 ? "warn" : "safe");
    const riskBadgeText = rtoProb >= 50 ? "High Risk" : (rtoProb >= 25 ? "Watch" : "Safe");

    const val = order.value !== undefined ? order.value : (order.amount || 1000);
    const expLoss = order.expectedLoss !== undefined ? order.expectedLoss : (order.rtoCost || Math.round(val * 0.25));

    let factorsHtml = '';
    if (order.factorBreakdown && order.factorBreakdown.length > 0) {
      factorsHtml = order.factorBreakdown.map(f => `
        <div style="background:var(--bg-muted); border:1px solid var(--border-subtle); border-radius:var(--radius-sm); padding:10px 12px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <strong style="color:var(--text-primary); font-size:13px;"><i class="fa-solid fa-circle-dot" style="color:var(--primary-color); font-size:10px; margin-right:6px;"></i>${f.factor}</strong>
            <span style="font-size:11px; font-weight:700; color:var(--warn-color); background:var(--bg-subtle); padding:2px 6px; border-radius:4px;">${f.weight || '+15%'}</span>
          </div>
          <p style="font-size:12px; color:var(--text-secondary); margin:0; line-height:1.4;">${f.explanation}</p>
        </div>
      `).join('');
    } else if (order.riskFactors && order.riskFactors.length > 0) {
      factorsHtml = order.riskFactors.map(rf => `
        <div style="background:var(--bg-muted); border:1px solid var(--border-subtle); border-radius:var(--radius-sm); padding:10px 12px; margin-bottom:6px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <strong style="color:var(--text-primary); font-size:13px;"><i class="fa-solid fa-triangle-exclamation" style="color:var(--warn-color); font-size:11px; margin-right:6px;"></i>${rf}</strong>
            <span class="health-badge warn" style="font-size:10px; padding:2px 6px;">Flagged</span>
          </div>
          <p style="font-size:12px; color:var(--text-secondary); margin:4px 0 0 0;">Identified risk anomaly contributing to elevated RTO refusal probability.</p>
        </div>
      `).join('');
    } else {
      factorsHtml = '<p style="color:var(--text-muted); font-size:13px;">No elevated risk anomalies detected for this order.</p>';
    }

    this.overlay.innerHTML = `
      <div class="modal-clean-box">
        <div class="modal-header-clean">
          <div style="font-size:1.1rem; font-weight:700; display:flex; align-items:center; gap:0.5rem; color:var(--text-primary);">
            <i class="fa-solid fa-rotate-left" style="color:var(--primary-color);"></i>
            <span>Order Risk Breakdown: ${order.id}</span>
          </div>
          <button type="button" class="modal-close-btn" id="modalCloseBtn">&times;</button>
        </div>

        <div style="display:flex; flex-direction:column; gap:1rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-muted); padding:12px 14px; border-radius:var(--radius-sm); border:1px solid var(--border-subtle);">
            <div>
              <div style="font-size:11px; color:var(--text-muted); text-transform:uppercase; font-weight:600;">Customer & Destination</div>
              <strong style="font-size:14px; color:var(--text-primary);">${order.customer || 'Customer'}</strong>
              <div style="font-size:12px; color:var(--text-secondary);">${order.city || 'Standard Area'} ${order.pincode ? '(PIN: ' + order.pincode + ')' : ''}</div>
            </div>
            <div style="text-align:right;">
              <span class="health-badge ${riskBadgeClass}">${riskBadgeText} (${rtoProb}%)</span>
              <div style="font-size:12px; margin-top:4px; color:var(--text-secondary);">Order Value: <strong>${formatNum(val)}</strong></div>
              <div style="font-size:11px; color:var(--risk-color); font-weight:600;">Potential Loss: ${formatNum(expLoss)}</div>
            </div>
          </div>

          <div>
            <h4 style="font-size:12px; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-muted); margin-bottom:8px;">
              Contributing Risk Factors:
            </h4>
            <div style="display:flex; flex-direction:column; gap:8px;">
              ${factorsHtml}
            </div>
          </div>

          <div style="background:var(--safe-bg); border:1px solid rgba(5,150,105,0.25); border-radius:var(--radius-sm); padding:12px;">
            <strong style="color:var(--safe-color); font-size:13px;"><i class="fa-solid fa-shield-check"></i> Recommended Mitigation:</strong>
            <p style="font-size:12px; color:var(--text-secondary); margin:4px 0 0 0; line-height:1.45;">
              Verify customer address and phone confirmation via automated WhatsApp/SMS before dispatch, or offer a 5% prepayment discount to convert from COD.
            </p>
          </div>
        </div>

        <div style="border-top:1px solid var(--border-subtle); padding-top:0.75rem; text-align:right;">
          <button type="button" class="btn-analyze-main" id="modalDismissBtn" style="padding:0.5rem 1.25rem; font-size:0.85rem;">
            Close
          </button>
        </div>
      </div>
    `;

    this.overlay.classList.add("active");
    document.getElementById("modalCloseBtn")?.addEventListener("click", () => this.close());
    document.getElementById("modalDismissBtn")?.addEventListener("click", () => this.close());
  }

  /**
   * Explains WHY a projected Cash Shortage risk is projected in the forecast.
   * @param {Object} forecastData
   * @param {Object} debitResult
   * @param {Object} rtoResult
   * @param {Object} receivableResult
   * @param {String} currencySymbol
   */
  showCashShortageExplanation({ forecastData, debitResult, rtoResult, receivableResult, currencySymbol = "₹" }) {
    const formatNum = (v) => `${currencySymbol}${v.toLocaleString('en-IN')}`;

    this.overlay.innerHTML = `
      <div class="modal-container">
        <div class="modal-header">
          <div class="modal-title" style="color:#FDA4AF;">
            <i class="fa-solid fa-triangle-exclamation" style="color:var(--accent-risk);"></i>
            AI Root-Cause: Projected Cash Shortage
          </div>
          <button class="modal-close" id="modalCloseBtn"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <div class="modal-body">
          <div style="background:rgba(244,63,94,0.1); border:1px solid rgba(244,63,94,0.3); border-radius:10px; padding:14px;">
            <div style="font-size:12px; color:#FDA4AF; text-transform:uppercase; font-weight:700;">Projected Inflexion Point</div>
            <div style="font-size:18px; font-weight:700; color:#FFE4E6; margin-top:2px;">
              Cash balance dips to ${formatNum(forecastData.lowestBaseline)} on Day ${forecastData.lowestDay}
            </div>
            <div style="font-size:12px; color:#CBD5E1; margin-top:4px;">
              Violates the minimum recommended safety threshold buffer (${formatNum(forecastData.safetyBuffer)}).
            </div>
          </div>

          <div>
            <h4 style="font-size:13px; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-secondary); margin-bottom:8px;">
              Primary Contributing Factors (Waterfall Breakdown):
            </h4>
            <div style="display:flex; flex-direction:column; gap:8px;">
              <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-subtle); border-radius:8px; padding:12px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <strong style="color:#F1F5F9; font-size:13px;">1. Imminent Essential Debits</strong>
                  <span style="font-weight:700; color:#FDA4AF;">${formatNum(debitResult.next7DaysTotal)}</span>
                </div>
                <p style="font-size:12px; color:#94A3B8; margin-top:4px;">
                  High mandatory outflows including supplier payables and loan EMIs mature within 7 days.
                </p>
              </div>

              <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-subtle); border-radius:8px; padding:12px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <strong style="color:#F1F5F9; font-size:13px;">2. Delayed B2B Inflows</strong>
                  <span style="font-weight:700; color:#FCD34D;">${formatNum(receivableResult.totalDelayedExposure)} Trapped</span>
                </div>
                <p style="font-size:12px; color:#94A3B8; margin-top:4px;">
                  ${receivableResult.highRiskCount} high-risk invoice(s) have overdue turnaround cycles, postponing expected liquidity.
                </p>
              </div>

              <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-subtle); border-radius:8px; padding:12px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <strong style="color:#F1F5F9; font-size:13px;">3. D2C Return-to-Origin Leakage</strong>
                  <span style="font-weight:700; color:#FDA4AF;">-${formatNum(rtoResult.totalExpectedLoss)} Sunk</span>
                </div>
                <p style="font-size:12px; color:#94A3B8; margin-top:4px;">
                  Non-recoverable freight and return handling costs from high-probability unverified COD orders.
                </p>
              </div>
            </div>
          </div>

          <div style="background:rgba(16,185,129,0.08); border:1px solid rgba(16,185,129,0.3); border-radius:8px; padding:12px;">
            <strong style="color:#34D399; font-size:13px;"><i class="fa-solid fa-shield-check"></i> How to Avert This Deficit:</strong>
            <ul style="margin:6px 0 0 16px; font-size:12px; color:#E2E8F0; line-height:1.5;">
              <li>Incentivize 2% early settlement on high-risk B2B invoices to pull forward cash before Day ${forecastData.lowestDay}.</li>
              <li>Verify high-risk COD orders via WhatsApp before dispatch to stop reverse freight losses.</li>
              <li>Reschedule non-mandatory software/recurring expenses past Day 12.</li>
            </ul>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-primary" id="modalAvertBtn"><i class="fa-solid fa-bolt"></i> View Recommended Action Queue</button>
          <button class="btn-secondary" id="modalDismissBtn">Dismiss</button>
        </div>
      </div>
    `;

    this.overlay.classList.add("active");
    document.getElementById("modalCloseBtn")?.addEventListener("click", () => this.close());
    document.getElementById("modalDismissBtn")?.addEventListener("click", () => this.close());
    document.getElementById("modalAvertBtn")?.addEventListener("click", () => {
      this.close();
      const actionsTab = document.querySelector('[data-tab="tab-overview"]');
      if (actionsTab) actionsTab.click();
      const actionSection = document.getElementById("actionQueueSection");
      if (actionSection) actionSection.scrollIntoView({ behavior: 'smooth' });
    });
  }

  /**
   * Modal to add a new custom D2C order to test the AI engine.
   * @param {Function} onSubmitCallback
   */
  showAddOrderModal(onSubmitCallback) {
    this.overlay.innerHTML = `
      <div class="modal-container">
        <div class="modal-header">
          <div class="modal-title">
            <i class="fa-solid fa-cart-plus" style="color:var(--accent-cyan);"></i>
            Test New D2C Order Risk
          </div>
          <button class="modal-close" id="modalCloseBtn"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Customer Name</label>
            <input type="text" class="form-input" id="newOrderCustomer" placeholder="e.g. Rahul Sharma" value="Rahul Verma">
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
            <div class="form-group">
              <label class="form-label">Order Value (₹)</label>
              <input type="number" class="form-input" id="newOrderValue" value="2499">
            </div>
            <div class="form-group">
              <label class="form-label">Payment Method</label>
              <select class="form-input" id="newOrderPayment">
                <option value="COD">Cash on Delivery (COD)</option>
                <option value="Prepaid (UPI)">Prepaid (UPI / Card)</option>
              </select>
            </div>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
            <div class="form-group">
              <label class="form-label">Delivery City & State</label>
              <input type="text" class="form-input" id="newOrderCity" placeholder="e.g. Lucknow, UP" value="Varanasi, UP">
            </div>
            <div class="form-group">
              <label class="form-label">Pincode</label>
              <input type="text" class="form-input" id="newOrderPincode" placeholder="e.g. 221001" value="221001">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Address Completeness</label>
            <select class="form-input" id="newOrderAddressQuality">
              <option value="incomplete">Incomplete / Missing House No / No Landmark (+20% RTO Risk)</option>
              <option value="complete">Complete Detailed Landmark Address (Verified)</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Buyer History</label>
            <select class="form-input" id="newOrderBuyerHistory">
              <option value="failed">Has Previous Failed Delivery / Cancellation Record</option>
              <option value="new">First Time Buyer (Neutral)</option>
              <option value="repeat">Repeat Buyer with 3+ Successful Deliveries</option>
            </select>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-secondary" id="modalDismissBtn">Cancel</button>
          <button class="btn-primary" id="btnSubmitOrder"><i class="fa-solid fa-wand-magic-sparkles"></i> Predict RTO Risk</button>
        </div>
      </div>
    `;

    this.overlay.classList.add("active");
    document.getElementById("modalCloseBtn")?.addEventListener("click", () => this.close());
    document.getElementById("modalDismissBtn")?.addEventListener("click", () => this.close());

    document.getElementById("btnSubmitOrder")?.addEventListener("click", () => {
      const customer = document.getElementById("newOrderCustomer").value || "Anonymous Buyer";
      const value = Number(document.getElementById("newOrderValue").value) || 1500;
      const paymentMethod = document.getElementById("newOrderPayment").value;
      const city = document.getElementById("newOrderCity").value || "Delhi, DL";
      const pincode = document.getElementById("newOrderPincode").value || "110001";
      const addressQuality = document.getElementById("newOrderAddressQuality").value;
      const buyerHistory = document.getElementById("newOrderBuyerHistory").value;

      // Compute dynamic RTO probability based on inputs
      let rtoProbability = 15;
      const riskFactors = [];

      if (paymentMethod === "COD") {
        rtoProbability += 30;
        riskFactors.push("COD Order");
      } else {
        rtoProbability -= 10;
        riskFactors.push("Prepaid UPI Verified");
      }

      if (addressQuality === "incomplete") {
        rtoProbability += 22;
        riskFactors.push("Incomplete Landmark Address");
      }

      if (buyerHistory === "failed") {
        rtoProbability += 25;
        riskFactors.push("Previous Non-Delivery Event");
      } else if (buyerHistory === "repeat") {
        rtoProbability -= 15;
        riskFactors.push("Verified Repeat Customer");
      }

      rtoProbability = Math.max(5, Math.min(95, rtoProbability));

      const newOrder = {
        id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
        customer,
        phone: "+91 98*** ****",
        city,
        pincode,
        value,
        paymentMethod,
        rtoProbability,
        rtoCost: 550,
        riskFactors,
        distanceTier: "Interstate (>800km)",
        status: "Pending Dispatch",
        recommendedAction: rtoProbability > 50 ? "Request WhatsApp Location Confirmation" : "Standard Dispatch"
      };

      this.close();
      if (typeof onSubmitCallback === "function") {
        onSubmitCallback(newOrder);
      }
    });
  }

  /**
   * Modal to display legal / MSME statutory reference documentation.
   */
  showRegulatoryReference() {
    this.overlay.innerHTML = `
      <div class="modal-container">
        <div class="modal-header">
          <div class="modal-title">
            <i class="fa-solid fa-scale-balanced" style="color:var(--accent-primary);"></i>
            Regulatory Information: MSMED Act 2006 Reference
          </div>
          <button class="modal-close" id="modalCloseBtn"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <div class="modal-body" style="font-size:0.88rem; line-height:1.6; color:#CBD5E1;">
          <div style="background:rgba(99,102,241,0.1); border:1px solid rgba(99,102,241,0.3); border-radius:8px; padding:12px; margin-bottom:12px;">
            <strong style="color:#A5B4FC;">Statutory Framework for Delayed Payments to MSMEs</strong>
            <p style="margin:4px 0 0 0; font-size:12px; color:#CBD5E1;">
              Enacted by the Government of India under the Micro, Small and Medium Enterprises Development (MSMED) Act, 2006.
            </p>
          </div>

          <h4 style="color:#F8FAFC; margin-bottom:4px;">Section 15: Liability of Buyer to Make Payment</h4>
          <p style="margin-bottom:12px;">
            Where any supplier supplies any goods or renders any services to any buyer, the buyer shall make payment therefor on or before the date agreed upon between him and the supplier in writing or, where there is no agreement before the appointed day: 
            <strong>Provided that in no case the period agreed upon between the supplier and the buyer in writing shall exceed forty-five (45) days</strong> from the day of acceptance or the day of deemed acceptance.
          </p>

          <h4 style="color:#F8FAFC; margin-bottom:4px;">Section 16: Date from Which and Rate at Which Interest is Payable</h4>
          <p style="margin-bottom:12px;">
            Where any buyer fails to make payment of the amount to the supplier, he shall, notwithstanding anything contained in any agreement, be liable to pay <strong>compound interest with monthly rests at three (3) times of the Bank Rate</strong> notified by the Reserve Bank of India.
          </p>

          <h4 style="color:#F8FAFC; margin-bottom:4px;">MSME Samadhaan Portal</h4>
          <p>
            MSME enterprises registered with a valid Udyam Registration Certificate can file digital dispute claims against defaulting buyers on the Ministry of MSME's official Samadhaan portal.
          </p>

          <div style="background:rgba(245,158,11,0.1); border:1px solid rgba(245,158,11,0.3); border-radius:8px; padding:10px; font-size:11px; color:#FCD34D; margin-top:8px;">
            <strong>Important Legal Disclaimer:</strong> The information displayed in CashFlowShield AI is for informational, reference, and cash-flow estimation purposes only and does not constitute formal legal counsel.
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-primary" id="modalDismissBtn">Understood</button>
        </div>
      </div>
    `;

    this.overlay.classList.add("active");
    document.getElementById("modalCloseBtn")?.addEventListener("click", () => this.close());
    document.getElementById("modalDismissBtn")?.addEventListener("click", () => this.close());
  }

  /**
   * Modal to add a new custom B2B invoice to test delay exposure.
   * @param {Function} onSubmitCallback
   */
  showAddInvoiceModal(onSubmitCallback) {
    this.overlay.innerHTML = `
      <div class="modal-container">
        <div class="modal-header">
          <div class="modal-title">
            <i class="fa-solid fa-file-circle-plus" style="color:var(--accent-cyan);"></i>
            Simulate New B2B Invoice
          </div>
          <button class="modal-close" id="modalCloseBtn"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Client / Buyer Enterprise</label>
            <input type="text" class="form-input" id="newInvClient" placeholder="e.g. Acme Industrial Corp" value="Paramount Engineering Ltd">
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
            <div class="form-group">
              <label class="form-label">Invoice Amount (₹)</label>
              <input type="number" class="form-input" id="newInvAmount" value="250000">
            </div>
            <div class="form-group">
              <label class="form-label">Days to Due Date</label>
              <input type="number" class="form-input" id="newInvDays" value="7">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Buyer Track Record & Delay Probability</label>
            <select class="form-input" id="newInvRiskTier">
              <option value="high">Chronic Delay / Disputes Expected (~75% delay risk)</option>
              <option value="med" selected>Average B2B Payment (10-15 days grace expected, ~40% delay risk)</option>
              <option value="low">Prompt Blue-Chip Enterprise / Auto-RTGS (~15% delay risk)</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Statutory Status</label>
            <select class="form-input" id="newInvStatutory">
              <option value="Covered under MSMED Act (Section 15)">Covered under MSMED Act (Section 15 - 45 Day Mandate)</option>
              <option value="Contractual 60-Day Terms">Contractual 60-Day Corporate Terms</option>
            </select>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-secondary" id="modalDismissBtn">Cancel</button>
          <button class="btn-primary" id="btnSubmitInvoice"><i class="fa-solid fa-plus"></i> Add to Receivables Engine</button>
        </div>
      </div>
    `;

    this.overlay.classList.add("active");
    document.getElementById("modalCloseBtn")?.addEventListener("click", () => this.close());
    document.getElementById("modalDismissBtn")?.addEventListener("click", () => this.close());

    document.getElementById("btnSubmitInvoice")?.addEventListener("click", () => {
      const client = document.getElementById("newInvClient").value || "New Enterprise Client";
      const amount = Number(document.getElementById("newInvAmount").value) || 100000;
      const daysRemaining = Number(document.getElementById("newInvDays").value) || 7;
      const riskTierVal = document.getElementById("newInvRiskTier").value;
      const statutoryStatus = document.getElementById("newInvStatutory").value;

      let delayProbability = 40;
      let paymentHistory = "Standard terms";
      if (riskTierVal === "high") {
        delayProbability = 75;
        paymentHistory = "Extended payment approval cycle";
      } else if (riskTierVal === "low") {
        delayProbability = 15;
        paymentHistory = "Consistently settles on or before due date";
      }

      const dueD = new Date(2026, 8, 21 + daysRemaining);
      const dueDate = dueD.toISOString().split("T")[0];

      const newInvoice = {
        id: `INV-${Math.floor(2000 + Math.random() * 8000)}`,
        client,
        amount,
        dueDate,
        daysRemaining,
        delayProbability,
        paymentHistory,
        statutoryStatus,
        recommendedAction: delayProbability >= 50 ? "Issue early-payment incentive" : "Standard payment tracking"
      };

      this.close();
      if (typeof onSubmitCallback === "function") {
        onSubmitCallback(newInvoice);
      }
    });
  }

  /**
   * Modal to add a scheduled debit to test outflow impacts.
   * @param {Function} onSubmitCallback
   */
  showAddDebitModal(onSubmitCallback) {
    this.overlay.innerHTML = `
      <div class="modal-container">
        <div class="modal-header">
          <div class="modal-title">
            <i class="fa-solid fa-credit-card" style="color:var(--accent-primary);"></i>
            Schedule New Outflow Commitment
          </div>
          <button class="modal-close" id="modalCloseBtn"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Payee / Obligation Name</label>
            <input type="text" class="form-input" id="newDebitName" placeholder="e.g. Cloud Hosting & Servers" value="AWS & Google Cloud Infrastructure">
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
            <div class="form-group">
              <label class="form-label">Amount (₹)</label>
              <input type="number" class="form-input" id="newDebitAmount" value="35000">
            </div>
            <div class="form-group">
              <label class="form-label">Days to Due Date</label>
              <input type="number" class="form-input" id="newDebitDays" value="5">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Category</label>
            <select class="form-input" id="newDebitCategory">
              <option value="SaaS & Cloud">SaaS & Cloud Subscriptions</option>
              <option value="Supplier Payments">Supplier Raw Materials / PO</option>
              <option value="Loan EMI">Working Capital Loan / Machinery EMI</option>
              <option value="Statutory & Taxes">Statutory Taxes (GST / TDS)</option>
              <option value="Payroll">Salaries & Contractor Disbursements</option>
            </select>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
            <div class="form-group">
              <label class="form-label">Priority</label>
              <select class="form-input" id="newDebitMandatory">
                <option value="true">Mandatory (Critical)</option>
                <option value="false">Flexible / Negotiable</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Mandate Type</label>
              <select class="form-input" id="newDebitAuto">
                <option value="true">Auto-Debit e-NACH Mandate</option>
                <option value="false">Manual Wire Transfer</option>
              </select>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-secondary" id="modalDismissBtn">Cancel</button>
          <button class="btn-primary" id="btnSubmitDebit"><i class="fa-solid fa-plus"></i> Add Scheduled Outflow</button>
        </div>
      </div>
    `;

    this.overlay.classList.add("active");
    document.getElementById("modalCloseBtn")?.addEventListener("click", () => this.close());
    document.getElementById("modalDismissBtn")?.addEventListener("click", () => this.close());

    document.getElementById("btnSubmitDebit")?.addEventListener("click", () => {
      const name = document.getElementById("newDebitName").value || "New Outflow";
      const amount = Number(document.getElementById("newDebitAmount").value) || 20000;
      const daysRemaining = Number(document.getElementById("newDebitDays").value) || 5;
      const category = document.getElementById("newDebitCategory").value;
      const mandatory = document.getElementById("newDebitMandatory").value === "true";
      const autoDebit = document.getElementById("newDebitAuto").value === "true";

      const dueD = new Date(2026, 8, 21 + daysRemaining);
      const dueDate = dueD.toISOString().split("T")[0];

      const newDebit = {
        id: `DEB-${Math.floor(300 + Math.random() * 700)}`,
        name,
        category,
        amount,
        dueDate,
        daysRemaining,
        mandatory,
        autoDebit,
        riskImpact: mandatory ? "Critical commitment" : "Flexible recurring cost"
      };

      this.close();
      if (typeof onSubmitCallback === "function") {
        onSubmitCallback(newDebit);
      }
    });
  }
}

