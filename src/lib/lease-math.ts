import { LeaseInput, LeaseAnalysis } from "@/types/lease";
import { analyzeFees } from "./fee-database";
import { gradeDeal } from "./deal-grader";
import { generateTips } from "./negotiation-engine";

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

  // Reverse-engineer the rent charge (finance charge) from the dealer's quoted payment
  const rentCharge = input.monthlyPayment - depreciationPayment;

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
  // To fairly apply the 1% rule, we need to normalize out any down payment
  const effectiveMonthlyWithoutDown =
    input.downPayment > 0
      ? input.monthlyPayment + input.downPayment / input.leaseTerm
      : input.monthlyPayment;
  const onePercentRule =
    input.msrp > 0 ? (effectiveMonthlyWithoutDown / input.msrp) * 100 : 0;

  // Total cost of the lease
  const totalLeaseCost =
    input.monthlyPayment * input.leaseTerm + input.dueAtSigning;

  // Effective monthly cost (normalizes everything)
  const effectiveMonthlyCost = totalLeaseCost / input.leaseTerm;

  // Payment discrepancy check
  const paymentDifference = Math.abs(input.monthlyPayment - calculatedPayment);
  const hasPaymentDiscrepancy = paymentDifference > 2; // > $2 tolerance for rounding

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

  // Calculate potential savings
  const potentialSavingsMonthly = tips.reduce(
    (sum, t) => sum + t.potentialSavings,
    0
  );
  const potentialSavingsTotal = potentialSavingsMonthly * input.leaseTerm;

  return {
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
    potentialSavingsMonthly,
    potentialSavingsTotal,
  };
}

/** Format a number as currency */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/** Format as currency with cents */
export function formatCurrencyExact(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/** Format a percentage */
export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}
