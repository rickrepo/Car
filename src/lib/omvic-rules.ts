/**
 * OMVIC / Ontario consumer protection rules for vehicle leasing and purchasing.
 *
 * Sources:
 * - OMVIC Mandatory Disclosures (omvic.ca)
 * - Consumer Protection Act, 2002 (CPA) Part VIII, s.14-17
 * - Motor Vehicle Dealers Act (MVDA), O. Reg. 333/08 s.35-36, s.43
 * - O. Reg. 17/05 s.29 (lease disclosure requirements)
 */

export type ViolationSeverity = "serious" | "moderate";

export type ViolationCategory =
  | "disclosure"
  | "pricing"
  | "lease_terms"
  | "sales_practices"
  | "deposits"
  | "trade_in";

export interface OmvicRule {
  id: string;
  category: ViolationCategory;
  question: string;
  /** "yes" means the dealer did this (violation), "no" means they didn't */
  violationAnswer: "yes" | "no";
  severity: ViolationSeverity;
  title: string;
  regulation: string;
  explanation: string;
  remedy: string;
}

/**
 * Auto-detectable violations — these can be flagged from the lease numbers
 * alone, without asking the user.
 */
export interface AutoViolation {
  id: string;
  title: string;
  severity: ViolationSeverity;
  regulation: string;
  explanation: string;
  remedy: string;
}

export function detectAutoViolations(analysis: {
  apr: number;
  hasPaymentDiscrepancy: boolean;
  sellingPriceDiscount: number;
  totalJunkFees: number;
}): AutoViolation[] {
  const violations: AutoViolation[] = [];

  // APR not disclosed or suspiciously high (possible rate markup)
  if (analysis.apr > 10) {
    violations.push({
      id: "auto_extreme_apr",
      title: "Extremely high hidden APR",
      severity: "serious",
      regulation: "CPA s.74 / O. Reg. 17/05 s.29",
      explanation: `Your lease has a hidden APR of ${analysis.apr.toFixed(1)}%. Ontario law requires the APR to be clearly disclosed on the contract with equal prominence to the payment amount. An APR this high may indicate the money factor has been marked up well beyond the buy rate, or that fees have been rolled into the financing without disclosure.`,
      remedy:
        "Check your contract for the APR. If it's missing or doesn't match, file a complaint with OMVIC. The dealer is required by law to disclose it.",
    });
  }

  // Selling above MSRP without clear disclosure
  if (analysis.sellingPriceDiscount < -5) {
    violations.push({
      id: "auto_above_msrp",
      title: "Selling significantly above MSRP",
      severity: "moderate",
      regulation: "O. Reg. 333/08 s.35 (All-in Pricing)",
      explanation: `The selling price is more than 5% above MSRP. While not illegal on its own, any "market adjustment" or "additional dealer markup" must be included in the all-in advertised price under Ontario law. If the advertised price was lower than what you're being charged, that's an all-in pricing violation.`,
      remedy:
        "Compare the price on the contract to what was advertised. If they added fees on top of the advertised price (other than HST and licensing), file an OMVIC complaint.",
    });
  }

  return violations;
}

/** The Q&A checklist — questions the user answers yes/no */
export const OMVIC_RULES: OmvicRule[] = [
  // === PRICING ===
  {
    id: "all_in_pricing",
    category: "pricing",
    question:
      "Did the dealer add fees on top of the advertised or posted price (other than HST and licensing)?",
    violationAnswer: "yes",
    severity: "serious",
    title: "All-in pricing violation",
    regulation: "O. Reg. 333/08 s.35-36",
    explanation:
      "Since 2010, Ontario's all-in pricing law requires the advertised price to include ALL dealer fees — admin, documentation, freight, PDI, OMVIC fee, everything. The ONLY things that can be added on top are HST and government licensing/registration. OMVIC's 2024 mystery shopping found 28% of dealers failed this check.",
    remedy:
      "File an OMVIC complaint (1-800-943-6002 or consumers@omvic.on.ca). The dealer can be fined and must refund the excess fees. Keep a screenshot of the advertisement and a copy of your contract.",
  },
  {
    id: "preinstalled_upcharge",
    category: "pricing",
    question:
      "Did the dealer charge you extra for products already installed on the vehicle (nitrogen tires, VIN etching, paint protection, etc.) that weren't in the advertised price?",
    violationAnswer: "yes",
    severity: "serious",
    title: "Pre-installed products not in advertised price",
    regulation: "O. Reg. 333/08 s.36",
    explanation:
      "If a product is already installed on the vehicle when you see it (nitrogen, VIN etching, paint sealant, wheel locks, etc.), its cost must be included in the advertised all-in price. The dealer cannot install something and then charge you for it on top of the sticker.",
    remedy:
      "File an OMVIC complaint. You should not have to pay above the advertised price for pre-installed items. This is a direct all-in pricing violation.",
  },
  {
    id: "fees_not_disclosed",
    category: "pricing",
    question:
      "Were there fees or charges on the final contract that were not shown to you in writing before you agreed to the deal?",
    violationAnswer: "yes",
    severity: "serious",
    title: "Fees not disclosed before signing",
    regulation: "CPA s.74 / O. Reg. 333/08 s.39-42",
    explanation:
      "All costs must be clearly disclosed in writing before you sign. If fees appeared on the contract that weren't discussed or shown to you beforehand, the dealer violated the Consumer Protection Act. Every fee must also be separately itemized on the bill of sale.",
    remedy:
      "File an OMVIC complaint. You may be able to have the contract rescinded (voided) under the CPA.",
  },

  // === LEASE DISCLOSURE ===
  {
    id: "apr_not_shown",
    category: "lease_terms",
    question:
      "Is the Annual Percentage Rate (APR) missing from your lease contract, or is it buried in fine print while the payment amount is prominent?",
    violationAnswer: "yes",
    severity: "serious",
    title: "APR not properly disclosed",
    regulation: "CPA s.74 / O. Reg. 17/05 s.29",
    explanation:
      "Ontario law requires the APR to be displayed on the lease contract with equal prominence to the payment amount. If it's missing or hidden in fine print, the dealer is not in compliance.",
    remedy:
      "Ask the dealer to provide the APR in writing. If they refuse, file an OMVIC complaint. The missing APR may be grounds to rescind the contract.",
  },
  {
    id: "total_cost_missing",
    category: "lease_terms",
    question:
      "Does your lease contract fail to show the total cost of the lease (total of all payments over the full term)?",
    violationAnswer: "yes",
    severity: "moderate",
    title: "Total lease obligation not disclosed",
    regulation: "O. Reg. 17/05 s.29",
    explanation:
      "The total obligation — the sum of all payments you'll make over the life of the lease — must be clearly stated on the contract.",
    remedy: "Ask the dealer to add this figure. File an OMVIC complaint if they refuse.",
  },
  {
    id: "residual_not_clear",
    category: "lease_terms",
    question:
      "Does your lease fail to clearly state the residual value and whether you can purchase the vehicle at lease end?",
    violationAnswer: "yes",
    severity: "moderate",
    title: "Residual value / purchase option not disclosed",
    regulation: "O. Reg. 17/05 s.29",
    explanation:
      "For option leases, the purchase option price and how to exercise it must be stated. For residual obligation leases, the estimated residual value and estimated residual cash payment must be disclosed.",
    remedy: "Ask the dealer to clarify this in writing before signing.",
  },

  // === SALES PRACTICES ===
  {
    id: "tied_selling",
    category: "sales_practices",
    question:
      "Did the dealer say you must buy additional products (extended warranty, paint protection, coating, etc.) to get the vehicle or the quoted price?",
    violationAnswer: "yes",
    severity: "serious",
    title: "Tied selling (forced add-ons)",
    regulation: "CPA s.14",
    explanation:
      "Dealers cannot require you to purchase additional products or services as a condition of the sale. Saying \"this price is only available with the protection package\" or \"the coating comes pre-applied so you have to pay for it\" is illegal tied selling.",
    remedy:
      "Tell the dealer you want the vehicle without the add-ons. If they refuse, file an OMVIC complaint. The tied product must be removable from the deal.",
  },
  {
    id: "unauthorized_addons",
    category: "sales_practices",
    question:
      "Were there products or charges on the final contract that you did not specifically ask for or agree to?",
    violationAnswer: "yes",
    severity: "serious",
    title: "Unauthorized add-ons (negative option billing)",
    regulation: "CPA s.13",
    explanation:
      "Dealers cannot add products or services that you did not explicitly agree to. If you see charges for paint protection, nitrogen fill, VIN etching, or other products you never asked for, the dealer added them without your consent.",
    remedy:
      "Refuse to sign until they're removed. If you already signed, file an OMVIC complaint — you should not be charged for products you didn't agree to.",
  },
  {
    id: "pressure_tactics",
    category: "sales_practices",
    question:
      "Did the dealer pressure you with false urgency — e.g., \"someone else is coming to buy it today,\" \"this price expires in one hour,\" or \"I can only hold this deal if you sign now\"?",
    violationAnswer: "yes",
    severity: "serious",
    title: "False or misleading representations",
    regulation: "CPA s.14",
    explanation:
      "Making false or misleading representations about the urgency of a purchase is a prohibited unfair practice under Ontario's Consumer Protection Act. High-pressure tactics designed to prevent you from thinking clearly or shopping around are illegal.",
    remedy:
      "Walk away. A legitimate deal will still be available tomorrow. If you already signed under pressure, file an OMVIC complaint — unfair practices can be grounds to void the contract.",
  },
  {
    id: "misrepresentation",
    category: "sales_practices",
    question:
      "Did the dealer make claims about the vehicle (features, condition, history, mileage) that you later found to be untrue?",
    violationAnswer: "yes",
    severity: "serious",
    title: "Misrepresentation of vehicle",
    regulation: "CPA s.14 / O. Reg. 332/08 (Code of Ethics)",
    explanation:
      "Dealers must not make false or misleading representations about the vehicle. This includes claims about features, condition, accident history, mileage, or any other material fact. Under the CPA, you can rescind a contract entered into through unfair practices within 1 year.",
    remedy:
      "Document what was claimed vs. reality (texts, emails, screenshots). File an OMVIC complaint. Misrepresentation is grounds to rescind the contract within 1 year (CPA s.18) and may qualify for the Compensation Fund (up to $45,000).",
  },
  {
    id: "contract_not_explained",
    category: "sales_practices",
    question:
      "Did the dealer push papers in front of you and say \"just sign here\" without explaining the key terms — total cost, interest rate, or your obligations?",
    violationAnswer: "yes",
    severity: "moderate",
    title: "Contract terms not explained before signing",
    regulation: "O. Reg. 332/08 (Code of Ethics)",
    explanation:
      "The Code of Ethics requires the dealer to explain the terms of the contract to you before you sign — including your total financial obligation, interest rate, and any end-of-term responsibilities. \"Just sign here\" is not sufficient.",
    remedy:
      "File an OMVIC complaint. Code of Ethics violations can result in fines up to $25,000 for the dealer. If key terms were hidden, this may also support a CPA unfair practice claim.",
  },

  // === VEHICLE HISTORY DISCLOSURES ===
  {
    id: "no_history_disclosure",
    category: "disclosure",
    question:
      "Did the dealer fail to disclose IN WRITING whether the vehicle was ever a rental/police car, had structural damage, was flood/fire damaged, branded as salvage/rebuilt, or had repairs over $3,000?",
    violationAnswer: "yes",
    severity: "serious",
    title: "Mandatory vehicle history not disclosed",
    regulation: "O. Reg. 333/08 s.42-43 / s.50",
    explanation:
      "Ontario dealers must disclose IN WRITING on the contract: prior rental / police / emergency / taxi use, structural damage or repairs, salvage / rebuilt / irreparable branding, flood or fire damage, out-of-province registration, two or more body panels replaced, repairs exceeding $3,000, non-functional airbags or ABS, and theft recovery. Verbal disclosure does not count — it must be on the bill of sale.",
    remedy:
      "You have a statutory 90-DAY CANCELLATION RIGHT (O. Reg. 333/08 s.50) if the dealer failed to disclose: vehicle branding, prior rental/police/taxi use, or inaccurate odometer. Send written cancellation notice to the dealer. Also file an OMVIC complaint and apply to the Compensation Fund (up to $45,000).",
  },
  {
    id: "odometer_issue",
    category: "disclosure",
    question:
      "Do you suspect the odometer reading is inaccurate, or did the dealer fail to confirm in writing whether the odometer has been replaced or tampered with?",
    violationAnswer: "yes",
    severity: "serious",
    title: "Odometer disclosure issue",
    regulation: "O. Reg. 333/08 s.42 / s.50 / Criminal Code s.380",
    explanation:
      "Dealers must disclose the odometer reading in writing and confirm whether it's believed to be accurate. If the odometer is inaccurate by more than 5% or 1,000 km (whichever is less), you have a 90-day right to cancel the entire contract. Odometer tampering is a criminal offence under the Criminal Code.",
    remedy:
      "You have a 90-DAY CANCELLATION RIGHT if the odometer is inaccurate (O. Reg. 333/08 s.50). File an OMVIC complaint and consider reporting to police if you believe the odometer was deliberately tampered with. The Compensation Fund (up to $45,000) may also apply.",
  },

  // === DEPOSITS ===
  {
    id: "deposit_not_returned",
    category: "deposits",
    question:
      "Did you leave a deposit and then have trouble getting it back when you decided not to proceed (before signing a final binding contract)?",
    violationAnswer: "yes",
    severity: "serious",
    title: "Deposit not returned",
    regulation: "MVDA / CPA / OMVIC guidance",
    explanation:
      "If you left a deposit but no binding contract was signed, the dealer must return your deposit. There is no such thing as a \"non-refundable deposit\" before a binding contract exists. Deposit disputes are OMVIC's #1 complaint category.",
    remedy:
      "Send a written demand by registered mail. File an OMVIC complaint (1-800-943-6002). Apply to the Compensation Fund (up to $45,000) if the dealer won't pay. Small Claims Court (up to $35,000) is also an option.",
  },

  // === TRADE-IN ===
  {
    id: "trade_in_not_itemized",
    category: "trade_in",
    question:
      "If you traded in a vehicle, was the trade-in value missing from the paperwork or rolled into the price rather than shown as a separate line?",
    violationAnswer: "yes",
    severity: "moderate",
    title: "Trade-in value not separately disclosed",
    regulation: "O. Reg. 333/08 s.43(4)",
    explanation:
      "The trade-in value must be clearly shown as a separate line item, not buried in the overall price. Hiding it makes it impossible to verify whether you got a fair deal on both the trade-in and the new vehicle.",
    remedy:
      "Ask for the trade-in value to be shown separately. If the dealer already combined the numbers, request a revised breakdown.",
  },
  {
    id: "trade_in_not_returned",
    category: "trade_in",
    question:
      "Did you ask for your trade-in vehicle back before the deal was finalized, and the dealer refused or said they already sold it?",
    violationAnswer: "yes",
    severity: "serious",
    title: "Trade-in not returned on request",
    regulation: "O. Reg. 333/08 s.38",
    explanation:
      "If you request the return of your trade-in vehicle BEFORE the contract for the new vehicle is complete, the dealer MUST return it immediately. They cannot hold it hostage or claim they already sold it.",
    remedy:
      "File an OMVIC complaint immediately. The dealer is legally required to return your trade-in. If they disposed of it, pursue the value through Small Claims Court and the Compensation Fund.",
  },
  {
    id: "trade_in_bait_switch",
    category: "trade_in",
    question:
      "Did the dealer raise the selling price of the vehicle after you discussed your trade-in, effectively taking back the trade-in value through a higher price?",
    violationAnswer: "yes",
    severity: "serious",
    title: "Trade-in bait and switch",
    regulation: "CPA s.14 (unfair practice)",
    explanation:
      "Inflating the trade-in value while quietly raising the selling price is a deceptive practice. The dealer shows you a generous trade-in number to make you feel good, but you're paying it back through a higher vehicle price. This is an unfair practice under the CPA.",
    remedy:
      "Compare the selling price to what was originally quoted before the trade-in discussion. File an OMVIC complaint if the price was inflated.",
  },
];

export const CATEGORY_LABELS: Record<ViolationCategory, string> = {
  pricing: "Pricing & Fees",
  lease_terms: "Lease Contract Disclosure",
  sales_practices: "Sales Tactics",
  disclosure: "Vehicle History",
  deposits: "Deposits",
  trade_in: "Trade-in",
};

export const CATEGORY_ORDER: ViolationCategory[] = [
  "sales_practices",
  "pricing",
  "lease_terms",
  "disclosure",
  "trade_in",
  "deposits",
];
