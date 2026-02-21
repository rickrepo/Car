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
  monthlyPayment: number; // What the dealer quoted
  leaseTerm: number; // months
  residualValue: number; // dollar amount
  annualMileage: number;

  // Due at signing (total out-of-pocket at signing)
  dueAtSigning: number;
}

export interface FeeItem {
  name: string;
  amount: number;
}

export interface LeaseAnalysis {
  // Computed values
  grossCapCost: number;
  adjustedCapCost: number;
  depreciation: number;
  depreciationPayment: number;
  rentCharge: number;
  calculatedPayment: number;
  moneyFactor: number;
  apr: number;
  residualPercent: number;
  totalLeaseCost: number;
  effectiveMonthlyCost: number;
  onePercentRule: number; // monthly payment as % of MSRP
  sellingPriceDiscount: number; // % below MSRP

  // Payment discrepancy
  paymentDifference: number; // dealer quote vs our math
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
  potentialSavingsMonthly: number;
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
