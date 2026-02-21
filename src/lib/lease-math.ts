import { LeaseInput, LeaseAnalysis, PaymentFrequency } from "@/types/lease";
import { analyzeFees } from "./fee-database";
import { gradeDeal } from "./deal-grader";
import { generateTips } from "./negotiation-engine";

/**
 * Convert a per-period payment to monthly equivalent.
 * Biweekly: 26 payments/year → monthly = biweekly × 26 / 12
 */
function toMonthly(amount: number, freq: PaymentFrequency): number {
  return freq === "biweekly" ? (amount * 26) / 12 : amount;
}

/**
 * Convert a monthly amount to the user's chosen payment frequency.
 * Monthly → biweekly: monthly × 12 / 26
 */
function toPerPeriod(monthly: number, freq: PaymentFrequency): number {
  return freq === "biweekly" ? (monthly * 12) / 26 : monthly;
}

/**
 * Get the total number of payments over the lease term.
 */
function totalPayments(termMonths: number, freq: PaymentFrequency): number {
  if (freq === "biweekly") {
    return Math.round((termMonths / 12) * 26);
  }
  return termMonths;
}

/**
 * Core lease calculation engine.
 *
 * The key insight: dealers hide the money factor, but we can reverse-engineer
 * it from the numbers they DO show on the paperwork.
 *
 * Monthly Payment = Depreciation + Rent Charge
 * Depreciation = (Adj Cap Cost - Residual) / Term
 * Rent Charge = (Adj Cap Cost + Residual) × Money Factor
 *
 * Solving for Money Factor:
 * Rent Charge = Monthly Payment - Depreciation
 * Money Factor = Rent Charge / (Adj Cap Cost + Residual)
 * APR = Money Factor × 2,400
 */
export function analyzeLease(input: LeaseInput): LeaseAnalysis {
  const totalFees = input.fees.reduce((sum, f) => sum + f.amount, 0);

  // Gross cap cost = selling price + all fees rolled in
  const grossCapCost = input.sellingPrice + totalFees;

  // Adjusted cap cost = gross - reductions (down payment, trade-in, rebates)
  const adjustedCapCost =
    grossCapCost - input.downPayment - input.tradeInValue - input.rebates;

  // Depreciation over the lease term
  const depreciation = adjustedCapCost - input.residualValue;

  // Monthly depreciation payment
  const depreciationPayment = depreciation / input.leaseTerm;

  // Convert user's quoted payment to monthly for internal math
  const monthlyPayment = toMonthly(input.paymentAmount, input.paymentFrequency);

  // Reverse-engineer the rent charge (finance charge) from the dealer's quoted payment
  const rentCharge = monthlyPayment - depreciationPayment;

  // Reverse-engineer the money factor
  const moneyFactor =
    adjustedCapCost + input.residualValue > 0
      ? rentCharge / (adjustedCapCost + input.residualValue)
      : 0;

  // Convert to APR
  const apr = moneyFactor * 2400;

  // What the payment SHOULD be based on our math (sanity check)
  const calculatedPayment = depreciationPayment + rentCharge;

  // Residual as percentage of MSRP
  const residualPercent =
    input.msrp > 0 ? (input.residualValue / input.msrp) * 100 : 0;

  // Selling price discount from MSRP
  const sellingPriceDiscount =
    input.msrp > 0
      ? ((input.msrp - input.sellingPrice) / input.msrp) * 100
      : 0;

  // 1% rule: monthly payment as percentage of MSRP (with $0 down normalization)
  const effectiveMonthlyWithoutDown =
    input.downPayment > 0
      ? monthlyPayment + input.downPayment / input.leaseTerm
      : monthlyPayment;
  const onePercentRule =
    input.msrp > 0 ? (effectiveMonthlyWithoutDown / input.msrp) * 100 : 0;

  // Total cost of the lease
  const numPayments = totalPayments(input.leaseTerm, input.paymentFrequency);
  const totalLeaseCost =
    input.paymentAmount * numPayments + input.dueOnDelivery;

  // Effective monthly cost (normalizes everything)
  const effectiveMonthlyCost = totalLeaseCost / input.leaseTerm;

  // Payment discrepancy check (compare in per-period amounts)
  const perPeriodCalculated = toPerPeriod(
    calculatedPayment,
    input.paymentFrequency
  );
  const paymentDifference = Math.abs(input.paymentAmount - perPeriodCalculated);
  const hasPaymentDiscrepancy = paymentDifference > 2; // > $2 tolerance for rounding

  // Per-period display values
  const perPeriodDepreciation = toPerPeriod(
    depreciationPayment,
    input.paymentFrequency
  );
  const perPeriodRentCharge = toPerPeriod(rentCharge, input.paymentFrequency);
  const perPeriodEffectiveCost = toPerPeriod(
    effectiveMonthlyCost,
    input.paymentFrequency
  );

  // Fee analysis
  const feeAnalysis = analyzeFees(input.fees);
  const totalJunkFees = feeAnalysis
    .filter((f) => f.legitimacy === "junk")
    .reduce((sum, f) => sum + f.amount, 0);

  // Grade the deal
  const moneyFactorGrade = gradeDeal.moneyFactor(apr);
  const sellingPriceGrade = gradeDeal.sellingPrice(sellingPriceDiscount);
  const residualGrade = gradeDeal.residual(residualPercent, input.leaseTerm);
  const onePercentGrade = gradeDeal.onePercent(onePercentRule);
  const overallGrade = gradeDeal.overall(
    moneyFactorGrade,
    sellingPriceGrade,
    residualGrade,
    onePercentGrade,
    totalJunkFees
  );

  // Build partial analysis for tip generation
  const partialAnalysis = {
    apr,
    moneyFactor,
    sellingPriceDiscount,
    residualPercent,
    onePercentRule,
    totalJunkFees,
    feeAnalysis,
    rentCharge,
    depreciationPayment,
    adjustedCapCost,
    effectiveMonthlyCost,
    input,
  };

  const tips = generateTips(partialAnalysis);

  // Calculate potential savings (per-period)
  const potentialSavingsMonthly = tips.reduce(
    (sum, t) => sum + t.potentialSavings,
    0
  );
  const potentialSavingsPerPeriod = toPerPeriod(
    potentialSavingsMonthly,
    input.paymentFrequency
  );
  const potentialSavingsTotal = potentialSavingsMonthly * input.leaseTerm;

  return {
    paymentFrequency: input.paymentFrequency,
    dueOnDelivery: input.dueOnDelivery,
    grossCapCost,
    adjustedCapCost,
    depreciation,
    depreciationPayment,
    rentCharge,
    calculatedPayment,
    moneyFactor,
    apr,
    residualPercent,
    totalLeaseCost,
    effectiveMonthlyCost,
    onePercentRule,
    sellingPriceDiscount,
    perPeriodDepreciation,
    perPeriodRentCharge,
    perPeriodCalculatedPayment: perPeriodCalculated,
    perPeriodEffectiveCost,
    paymentDifference,
    hasPaymentDiscrepancy,
    feeAnalysis,
    totalJunkFees,
    overallGrade,
    moneyFactorGrade,
    sellingPriceGrade,
    residualGrade,
    onePercentGrade,
    tips,
    potentialSavingsPerPeriod,
    potentialSavingsTotal,
  };
}

/** Format a number as currency (CAD) */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/** Format as currency with cents (CAD) */
export function formatCurrencyExact(value: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/** Format a percentage */
export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/** Get the display label for a payment frequency */
export function frequencyLabel(freq: PaymentFrequency): string {
  return freq === "biweekly" ? "biweekly" : "month";
}
