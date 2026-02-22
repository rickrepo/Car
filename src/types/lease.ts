export type PaymentFrequency = "monthly" | "biweekly";

export interface LeaseInput {
  // Vehicle (always on the paperwork)
  msrp: number;
  sellingPrice: number;

  // Lease terms (always on the paperwork)
  paymentFrequency: PaymentFrequency;
  paymentAmount: number; // What the dealer quoted (per period, pre-tax)
  leaseTerm: number; // months
  residualValue: number; // dollar amount

  // Reductions (default 0 if none)
  downPayment: number;
  otherCredits: number; // trade-in + rebates + incentives combined

  // Fees (optional — enables junk fee analysis)
  fees: FeeItem[];

  // Due on delivery (optional — for total cost calc only)
  dueOnDelivery: number;
}

export interface FeeItem {
  name: string;
  amount: number;
}

export interface LeaseAnalysis {
  // Input context
  paymentFrequency: PaymentFrequency;
  dueOnDelivery: number;

  // Computed values (all internally monthly)
  grossCapCost: number;
  adjustedCapCost: number;
  depreciation: number;
  depreciationPayment: number; // monthly
  rentCharge: number; // monthly
  calculatedPayment: number; // monthly
  moneyFactor: number;
  apr: number;
  residualPercent: number;
  totalLeaseCost: number;
  effectiveMonthlyCost: number;
  onePercentRule: number; // monthly payment as % of MSRP
  sellingPriceDiscount: number; // % below MSRP

  // Per-period display values (converted to user's chosen frequency)
  perPeriodDepreciation: number;
  perPeriodRentCharge: number;
  perPeriodCalculatedPayment: number;
  perPeriodEffectiveCost: number;

  // Payment discrepancy
  paymentDifference: number;
  hasPaymentDiscrepancy: boolean;

  // Fee analysis
  feeAnalysis: FeeAnalysisItem[];
  totalJunkFees: number;

  // Grades
  overallGrade: Grade;
  moneyFactorGrade: Grade;
  sellingPriceGrade: Grade;
  residualGrade: Grade;
  onePercentGrade: Grade;

  // Negotiation tips
  tips: NegotiationTip[];

  // Potential savings
  potentialSavingsPerPeriod: number;
  potentialSavingsTotal: number;
}

export type GradeLetter = "A" | "B" | "C" | "D" | "F";

export interface Grade {
  letter: GradeLetter;
  label: string;
  description: string;
}

export interface FeeAnalysisItem {
  name: string;
  amount: number;
  legitimacy: "legitimate" | "negotiable" | "junk";
  explanation: string;
}

export interface NegotiationTip {
  priority: "high" | "medium" | "low";
  title: string;
  detail: string;
  potentialSavings: number; // monthly savings
}
