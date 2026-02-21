export type PaymentFrequency = "monthly" | "biweekly";

export interface LeaseInput {
  // Vehicle
  msrp: number;
  sellingPrice: number;

  // Cap cost adjustments
  downPayment: number;
  tradeInValue: number;
  rebates: number;

  // Fees (itemized)
  fees: FeeItem[];

  // Lease terms
  paymentFrequency: PaymentFrequency;
  paymentAmount: number; // What the dealer quoted (per period)
  leaseTerm: number; // months
  residualValue: number; // dollar amount
  annualKm: number; // annual kilometre allowance

  // Amount due on delivery (total out-of-pocket upfront)
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
  paymentDifference: number; // dealer quote vs our math (in per-period amount)
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
