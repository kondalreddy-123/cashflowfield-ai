/**
 * CashFlowShield AI - Comprehensive Financial Mock Data & Multi-Scenario Presets
 * Covers: D2C Orders, B2B Invoices, Scheduled Bank Debits, Customer Behavior Profiles
 */

export const BUSINESS_PRESETS = {
  aurathreads: {
    id: "aurathreads",
    name: "AuraThreads Apparel (D2C Fashion)",
    category: "D2C E-Commerce",
    description: "High COD volume (72%), aggressive social ad acquisition, seasonal festive surge, high RTO vulnerability.",
    currency: "INR",
    currentBalance: 420000,
    safetyBufferDays: 14,
    dailyBurnRate: 15000,
    simDefaults: {
      monthlyOrders: 2800,
      rtoRate: 28,
      aov: 1450,
      rtoCost: 550,
      receivableDelayRate: 15,
      avgDso: 35
    },
    orders: [
      {
        id: "ORD-9821",
        customer: "Vikram Rathore",
        phone: "+91 98211 44*** ",
        city: "Bareilly, UP",
        pincode: "243001",
        value: 2899,
        paymentMethod: "COD",
        rtoProbability: 74,
        rtoCost: 580,
        riskTier: "high",
        riskFactors: ["COD Order", "Previous 2 Failed Attempts", "Missing House Number / Incomplete Address", "WhatsApp Unconfirmed"],
        distanceTier: "Interstate (>900km)",
        status: "Pending Dispatch",
        recommendedAction: "Request ₹200 Prepaid Commitment or WhatsApp Address Confirmation"
      },
      {
        id: "ORD-9822",
        customer: "Sneha Mukherjee",
        phone: "+91 97188 23*** ",
        city: "Kolkata, WB",
        pincode: "700029",
        value: 1750,
        paymentMethod: "COD",
        rtoProbability: 48,
        rtoCost: 540,
        riskTier: "med",
        riskFactors: ["COD Order", "First-time Buyer", "High Courier Congestion Zone"],
        distanceTier: "Interstate (>1200km)",
        status: "Pending Dispatch",
        recommendedAction: "Send WhatsApp Delivery Confirmation Link with ₹50 Prepaid Incentive"
      },
      {
        id: "ORD-9823",
        customer: "Pooja Sharma",
        phone: "+91 98450 11*** ",
        city: "Bengaluru, KA",
        pincode: "560034",
        value: 3499,
        paymentMethod: "Prepaid (UPI)",
        rtoProbability: 8,
        rtoCost: 450,
        riskTier: "low",
        riskFactors: ["Prepaid Verified", "Repeat Customer (4 Completed)", "Complete Landmark Address"],
        distanceTier: "Local Hub",
        status: "Dispatched",
        recommendedAction: "Standard Fast Dispatch via Bluedart"
      },
      {
        id: "ORD-9824",
        customer: "Arjun Verma",
        phone: "+91 88720 90*** ",
        city: "Patna, BR",
        pincode: "800001",
        value: 4199,
        paymentMethod: "COD",
        rtoProbability: 68,
        rtoCost: 650,
        riskTier: "high",
        riskFactors: ["High Order Value COD", "High Historical Pincode RTO (38%)", "Address Ambiguity"],
        distanceTier: "Interstate (>1100km)",
        status: "Pending Dispatch",
        recommendedAction: "Hold Dispatch for Telephonic Address Verification"
      },
      {
        id: "ORD-9825",
        customer: "Rohit Deshmukh",
        phone: "+91 99201 67*** ",
        city: "Pune, MH",
        pincode: "411038",
        value: 1299,
        paymentMethod: "Prepaid (Card)",
        rtoProbability: 11,
        rtoCost: 480,
        riskTier: "low",
        riskFactors: ["Prepaid Verified", "Accurate Digital Address"],
        distanceTier: "Regional Hub",
        status: "In Transit",
        recommendedAction: "Standard Automated Tracking SMS"
      },
      {
        id: "ORD-9826",
        customer: "Kavita Nair",
        phone: "+91 94471 33*** ",
        city: "Ernakulam, KL",
        pincode: "682016",
        value: 2150,
        paymentMethod: "COD",
        rtoProbability: 56,
        rtoCost: 560,
        riskTier: "high",
        riskFactors: ["COD Order", "Customer Ignored 1st Verification Call", "Remote Suburb Pincode"],
        distanceTier: "Interstate (>1400km)",
        status: "Verification Pending",
        recommendedAction: "Automated IVR Call Confirmation before Logistics Pickup"
      },
      {
        id: "ORD-9827",
        customer: "Aman Gupta",
        phone: "+91 98110 55*** ",
        city: "New Delhi, DL",
        pincode: "110019",
        value: 1850,
        paymentMethod: "COD",
        rtoProbability: 29,
        rtoCost: 450,
        riskTier: "med",
        riskFactors: ["COD Order", "Metro Hub Location", "Partial Landmark Info"],
        distanceTier: "Local Hub",
        status: "Pending Dispatch",
        recommendedAction: "WhatsApp 1-Click Confirmation Prompt"
      }
    ],
    invoices: [
      {
        id: "INV-2041",
        client: "Lifestyle Retail Chain (B2B Consignment)",
        amount: 180000,
        dueDate: "2026-09-27",
        daysRemaining: 6,
        delayProbability: 72,
        riskTier: "high",
        paymentHistory: "Chronic 25-day delays; quarterly reconciliation pending",
        statutoryStatus: "Covered under MSMED Act (Section 15)",
        recommendedAction: "Send formal statement of accounts & offer 2% instant settlement rebate"
      },
      {
        id: "INV-2042",
        client: "Boutique Trendz Hub",
        amount: 75000,
        dueDate: "2026-09-25",
        daysRemaining: 4,
        delayProbability: 40,
        riskTier: "med",
        paymentHistory: "Usually pays within 7 days of due date",
        statutoryStatus: "Standard B2B Terms (30 Days)",
        recommendedAction: "Trigger automated friendly payment reminder with payment link"
      },
      {
        id: "INV-2043",
        client: "Nykaa Partner Warehouse Settlement",
        amount: 220000,
        dueDate: "2026-09-30",
        daysRemaining: 9,
        delayProbability: 12,
        riskTier: "low",
        paymentHistory: "Institutional buyer with automated weekly payouts",
        statutoryStatus: "Enterprise SLA",
        recommendedAction: "Routine tracking, no urgent intervention required"
      }
    ],
    debits: [
      {
        id: "DEB-101",
        name: "Fabric Mill Raw Material PO (Textile Vendor)",
        category: "Supplier Payments",
        amount: 140000,
        dueDate: "2026-09-26",
        daysRemaining: 5,
        mandatory: true,
        autoDebit: true,
        riskImpact: "Critical - Fabric delivery hold if bounced"
      },
      {
        id: "DEB-102",
        name: "Working Capital Term Loan EMI (HDFC Bank)",
        category: "Loan EMI",
        amount: 45000,
        dueDate: "2026-09-28",
        daysRemaining: 7,
        mandatory: true,
        autoDebit: true,
        riskImpact: "Severe - CIBIL credit score impact and ₹1,500 bounce fee"
      },
      {
        id: "DEB-103",
        name: "Shopify Plus & Klaviyo Subscriptions",
        category: "SaaS & Cloud",
        amount: 18500,
        dueDate: "2026-09-29",
        daysRemaining: 8,
        mandatory: false,
        autoDebit: true,
        riskImpact: "Moderate - Storefront marketing tools"
      },
      {
        id: "DEB-104",
        name: "Delhivery & Shiprocket Freight Invoices",
        category: "Logistics",
        amount: 62000,
        dueDate: "2026-10-02",
        daysRemaining: 11,
        mandatory: true,
        autoDebit: false,
        riskImpact: "High - Carrier shipping credits might get frozen"
      },
      {
        id: "DEB-105",
        name: "GST Monthly Filing (GSTR-3B Outflow)",
        category: "Statutory & Taxes",
        amount: 48000,
        dueDate: "2026-10-05",
        daysRemaining: 14,
        mandatory: true,
        autoDebit: false,
        riskImpact: "Statutory mandate with penalty interest"
      }
    ]
  },

  zenith_msme: {
    id: "zenith_msme",
    name: "Zenith Precision Tools (Engineering MSME)",
    category: "B2B Manufacturing",
    description: "Tier-2 CNC parts maker. High invoice amounts (₹3L-₹10L), extended credit terms (60-90D), vulnerable to delayed Tier-1 OEM payouts.",
    currency: "INR",
    currentBalance: 780000,
    safetyBufferDays: 21,
    dailyBurnRate: 35000,
    simDefaults: {
      monthlyOrders: 150,
      rtoRate: 4,
      aov: 85000,
      rtoCost: 2500,
      receivableDelayRate: 42,
      avgDso: 68
    },
    orders: [
      {
        id: "ORD-M501",
        customer: "Apex Heavy Auto Ltd",
        phone: "+91 20 2740****",
        city: "Pune MIDC, MH",
        pincode: "411018",
        value: 125000,
        paymentMethod: "B2B Dispatch Terms",
        rtoProbability: 6,
        rtoCost: 3200,
        riskTier: "low",
        riskFactors: ["Approved Purchase Order", "Direct Industrial Freight"],
        distanceTier: "Industrial Corridor (80km)",
        status: "Dispatched",
        recommendedAction: "Monitor Gate Receipt confirmation"
      },
      {
        id: "ORD-M502",
        customer: "Vanguard Gear Systems",
        phone: "+91 124 456****",
        city: "Gurugram, HR",
        pincode: "122016",
        value: 185000,
        paymentMethod: "B2B Dispatch Terms",
        rtoProbability: 32,
        rtoCost: 4500,
        riskTier: "med",
        riskFactors: ["Quality Inspection Stage Delay", "Carrier Detention Risk"],
        distanceTier: "Interstate Freight (>1200km)",
        status: "Pending Dispatch",
        recommendedAction: "Obtain pre-dispatch inspection signoff to prevent rejection"
      }
    ],
    invoices: [
      {
        id: "INV-7011",
        client: "Bharat Heavy Forge Corp",
        amount: 480000,
        dueDate: "2026-09-24",
        daysRemaining: 3,
        delayProbability: 82,
        riskTier: "high",
        paymentHistory: "Average payment DSO is 78 days against 45-day MSME agreement",
        statutoryStatus: "MSMED Act Section 16 penal interest applicable (3x RBI bank rate)",
        recommendedAction: "Issue formal intimation referencing MSMED Act Section 15 timeline"
      },
      {
        id: "INV-7012",
        client: "Delta Electric Motors Pvt Ltd",
        amount: 320000,
        dueDate: "2026-09-29",
        daysRemaining: 8,
        delayProbability: 45,
        riskTier: "med",
        paymentHistory: "Partial payments customary (50% upfront, 50% 3 weeks late)",
        statutoryStatus: "Contractual milestone terms",
        recommendedAction: "Follow up with procurement officer for first tranche release"
      },
      {
        id: "INV-7013",
        client: "Tata AutoComp Systems Partner",
        amount: 550000,
        dueDate: "2026-10-04",
        daysRemaining: 13,
        delayProbability: 18,
        riskTier: "low",
        paymentHistory: "Reliable electronic RTGS turnaround",
        statutoryStatus: "Standard Enterprise Terms",
        recommendedAction: "Confirm automated invoice processing in SAP portal"
      }
    ],
    debits: [
      {
        id: "DEB-201",
        name: "Special Alloy Steel Ingot PO (Tata Steel BSL)",
        category: "Supplier Payments",
        amount: 380000,
        dueDate: "2026-09-27",
        daysRemaining: 6,
        mandatory: true,
        autoDebit: true,
        riskImpact: "Critical - Supply freeze blocks CNC line operation"
      },
      {
        id: "DEB-202",
        name: "Factory CNC Machine Lease EMI (SIDBI MSME Loan)",
        category: "Loan EMI",
        amount: 95000,
        dueDate: "2026-09-30",
        daysRemaining: 9,
        mandatory: true,
        autoDebit: true,
        riskImpact: "Severe - Regulatory MSME concession eligibility at risk"
      },
      {
        id: "DEB-203",
        name: "State Electricity Distribution Discom (HT Power Bill)",
        category: "Utilities & Factory",
        amount: 82000,
        dueDate: "2026-10-02",
        daysRemaining: 11,
        mandatory: true,
        autoDebit: true,
        riskImpact: "Critical - Factory power disconnection penalty"
      },
      {
        id: "DEB-204",
        name: "Machinists & Engineering Payroll Advances",
        category: "Payroll",
        amount: 160000,
        dueDate: "2026-10-05",
        daysRemaining: 14,
        mandatory: true,
        autoDebit: false,
        riskImpact: "Factory worker strike risk if delayed"
      }
    ]
  },

  nexal_export: {
    id: "nexal_export",
    name: "Nexal Global Handicrafts (Exporter)",
    category: "Cross-Border & Export",
    description: "Handmade lifestyle exports to EU/US. Foreign exchange swings, port demurrage exposure, 60-day LC realization windows.",
    currency: "INR",
    currentBalance: 950000,
    safetyBufferDays: 25,
    dailyBurnRate: 28000,
    simDefaults: {
      monthlyOrders: 420,
      rtoRate: 9,
      aov: 24000,
      rtoCost: 4500,
      receivableDelayRate: 35,
      avgDso: 55
    },
    orders: [
      {
        id: "EXP-1092",
        customer: "Maison Living GmbH",
        phone: "+49 30 901****",
        city: "Hamburg, Germany",
        pincode: "20457",
        value: 240000,
        paymentMethod: "Letter of Credit (90D)",
        rtoProbability: 14,
        rtoCost: 18000,
        riskTier: "low",
        riskFactors: ["Customs Documentation Cleared", "Insured Marine Cargo"],
        distanceTier: "International Sea Freight",
        status: "At Port of Loading",
        recommendedAction: "Track Bill of Lading transmission to buyer's bank"
      },
      {
        id: "EXP-1093",
        customer: "Nordic Bohemian Imports",
        phone: "+46 8 123****",
        city: "Stockholm, Sweden",
        pincode: "11122",
        value: 165000,
        paymentMethod: "Open Account (45D)",
        rtoProbability: 41,
        rtoCost: 22000,
        riskTier: "med",
        riskFactors: ["EU Import VAT Documentation Revision Requested", "Port Demurrage Window Running"],
        distanceTier: "International Air Freight",
        status: "Customs Hold",
        recommendedAction: "Provide revised certificate of origin within 48h to avoid storage fines"
      }
    ],
    invoices: [
      {
        id: "INV-EX81",
        client: "Artisan Living UK Ltd",
        amount: 390000,
        dueDate: "2026-09-28",
        daysRemaining: 7,
        delayProbability: 65,
        riskTier: "high",
        paymentHistory: "Buyer delayed last 3 remittances due to local port backlogs",
        statutoryStatus: "RBI EDPMS Export Realization Window (9 Months max)",
        recommendedAction: "Engage freight forwarder confirmation & issue swift reminder"
      },
      {
        id: "INV-EX82",
        client: "Solstice Home Designs (California, USA)",
        amount: 450000,
        dueDate: "2026-10-06",
        daysRemaining: 15,
        delayProbability: 25,
        riskTier: "low",
        paymentHistory: "Reliable wire transfer payer",
        statutoryStatus: "Direct Wire Terms",
        recommendedAction: "Monitor USD/INR exchange forward hedge"
      }
    ],
    debits: [
      {
        id: "DEB-EX01",
        name: "Maersk Line Ocean Freight & Container Booking",
        category: "Logistics",
        amount: 210000,
        dueDate: "2026-09-26",
        daysRemaining: 5,
        mandatory: true,
        autoDebit: true,
        riskImpact: "Container release blocked if unpaid"
      },
      {
        id: "DEB-EX02",
        name: "Export Credit Guarantee Corp (ECGC Insurance Premium)",
        category: "Insurance & Statutory",
        amount: 35000,
        dueDate: "2026-09-29",
        daysRemaining: 8,
        mandatory: true,
        autoDebit: true,
        riskImpact: "Loss of export insurance coverage"
      },
      {
        id: "DEB-EX03",
        name: "Artisan Cluster Master Weaver Advance",
        category: "Supplier Payments",
        amount: 175000,
        dueDate: "2026-10-03",
        daysRemaining: 12,
        mandatory: true,
        autoDebit: false,
        riskImpact: "Next consignment production delay"
      }
    ]
  },

  cash_crunch: {
    id: "cash_crunch",
    name: "HyperPulse Nutrition (Cash-Crunch D2C)",
    category: "High-Burn D2C Startup",
    description: "Rapidly scaling supplement brand. Heavy Meta/Google ad spend, tight runway, ₹1.4L deficit expected in 6 days if unmitigated!",
    currency: "INR",
    currentBalance: 165000,
    safetyBufferDays: 10,
    dailyBurnRate: 32000,
    simDefaults: {
      monthlyOrders: 4200,
      rtoRate: 34,
      aov: 1850,
      rtoCost: 590,
      receivableDelayRate: 30,
      avgDso: 40
    },
    orders: [
      {
        id: "ORD-CR01",
        customer: "Deepak Choudhary",
        phone: "+91 98765 41*** ",
        city: "Meerut, UP",
        pincode: "250001",
        value: 3200,
        paymentMethod: "COD",
        rtoProbability: 82,
        rtoCost: 610,
        riskTier: "high",
        riskFactors: ["COD Order", "Customer Cancelled 2 Prior Shipments", "Suspicious Bulk Quantity"],
        distanceTier: "Interstate",
        status: "Pending Dispatch",
        recommendedAction: "Convert to Prepaid with 10% bonus shaker gift or cancel"
      },
      {
        id: "ORD-CR02",
        customer: "Simran Kaur",
        phone: "+91 98144 92*** ",
        city: "Ludhiana, PB",
        pincode: "141001",
        value: 2450,
        paymentMethod: "COD",
        rtoProbability: 61,
        rtoCost: 570,
        riskTier: "high",
        riskFactors: ["COD Order", "Incomplete Street Address", "No Landmark"],
        distanceTier: "Interstate",
        status: "Pending Dispatch",
        recommendedAction: "Request WhatsApp address pinpoint"
      },
      {
        id: "ORD-CR03",
        customer: "Aditya Roy",
        phone: "+91 99300 11*** ",
        city: "Mumbai, MH",
        pincode: "400050",
        value: 4600,
        paymentMethod: "COD",
        rtoProbability: 54,
        rtoCost: 580,
        riskTier: "med",
        riskFactors: ["High COD Basket Size", "First-time Buyer"],
        distanceTier: "Local Hub",
        status: "Pending Dispatch",
        recommendedAction: "OTP phone confirmation required"
      }
    ],
    invoices: [
      {
        id: "INV-CR11",
        client: "Modern Bazaar Retail Shelf Placement",
        amount: 85000,
        dueDate: "2026-09-25",
        daysRemaining: 4,
        delayProbability: 78,
        riskTier: "high",
        paymentHistory: "Delayed by 15-20 days consistently due to audit delays",
        statutoryStatus: "Standard B2B Terms",
        recommendedAction: "Demand immediate wire transfer citing cash allocation"
      }
    ],
    debits: [
      {
        id: "DEB-CR01",
        name: "Meta Ads Automated Threshold Charge",
        category: "Marketing & Ads",
        amount: 120000,
        dueDate: "2026-09-26",
        daysRemaining: 5,
        mandatory: true,
        autoDebit: true,
        riskImpact: "Disaster - Ad accounts paused, revenue stops instantly"
      },
      {
        id: "DEB-CR02",
        name: "Whey Protein Co-Packer Packaging Advance",
        category: "Supplier Payments",
        amount: 95000,
        dueDate: "2026-09-27",
        daysRemaining: 6,
        mandatory: true,
        autoDebit: true,
        riskImpact: "Severe - Batch manufacturing delayed by 3 weeks"
      }
    ]
  }
};
