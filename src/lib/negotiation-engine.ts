import { NegotiationTip, FeeAnalysisItem } from "@/types/lease";
import { LeaseInput } from "@/types/lease";

interface PartialAnalysis {
  apr: number;
  moneyFactor: number;
  sellingPriceDiscount: number;
  residualPercent: number;
  onePercentRule: number;
  totalJunkFees: number;
  feeAnalysis: FeeAnalysisItem[];
  rentCharge: number;
  depreciationPayment: number;
  adjustedCapCost: number;
  effectiveMonthlyCost: number;
  input: LeaseInput;
}

/**
 * Generate specific, actionable negotiation tips based on the analysis.
 * Each tip includes estimated monthly savings.
 */
export function generateTips(analysis: PartialAnalysis): NegotiationTip[] {
  const tips: NegotiationTip[] = [];
  const { input } = analysis;

  // 1. Money factor is too high
  if (analysis.apr > 4) {
    // Estimate savings if they got a reasonable 3% APR
    const targetMF = 3 / 2400;
    const currentRent = analysis.rentCharge;
    const betterRent =
      (analysis.adjustedCapCost + input.residualValue) * targetMF;
    const savings = Math.max(currentRent - betterRent, 0);

    tips.push({
      priority: "high",
      title: "Negotiate the money factor (hidden interest rate)",
      detail: `Your hidden APR is ${analysis.apr.toFixed(1)}%. The dealer is likely marking up the base rate. Ask: "What is the buy rate money factor from the bank?" Then say: "I'd like the lease at the buy rate, not a marked-up rate." This alone could save you $${Math.round(savings)}/month.`,
      potentialSavings: Math.round(savings),
    });
  } else if (analysis.apr > 2) {
    const targetMF = 1.5 / 2400;
    const betterRent =
      (analysis.adjustedCapCost + input.residualValue) * targetMF;
    const savings = Math.max(analysis.rentCharge - betterRent, 0);

    if (savings > 5) {
      tips.push({
        priority: "medium",
        title: "Ask about manufacturer lease specials",
        detail: `Your APR of ${analysis.apr.toFixed(1)}% is okay but not great. Many manufacturers offer subsidized rates as low as 0-2%. Ask: "Are there any manufacturer lease incentives or special money factors available right now?"`,
        potentialSavings: Math.round(savings),
      });
    }
  }

  // 2. Selling price is at or above MSRP
  if (analysis.sellingPriceDiscount < 3) {
    const targetDiscount = 0.06; // aim for 6% off
    const currentPrice = input.sellingPrice;
    const targetPrice = input.msrp * (1 - targetDiscount);
    const priceDiff = currentPrice - targetPrice;
    const monthlySavings = priceDiff / input.leaseTerm;

    if (monthlySavings > 5) {
      tips.push({
        priority: "high",
        title: "Negotiate the selling price down",
        detail:
          analysis.sellingPriceDiscount < 0
            ? `You're paying ABOVE MSRP (dealer markup). Unless this is a very scarce vehicle, negotiate the selling price down to at least MSRP, ideally below. Get competing quotes from other dealers.`
            : `You're paying near sticker price. Most vehicles can be negotiated 5-8% below MSRP. Get quotes from 3+ dealers and use them as leverage. Email dealers for internet pricing.`,
        potentialSavings: Math.round(monthlySavings),
      });
    }
  }

  // 3. Junk fees
  const junkFees = analysis.feeAnalysis.filter((f) => f.legitimacy === "junk");
  if (junkFees.length > 0) {
    const totalJunk = junkFees.reduce((s, f) => s + f.amount, 0);
    const monthlySavings = totalJunk / input.leaseTerm;
    const feeNames = junkFees.map((f) => f.name).join(", ");

    tips.push({
      priority: "high",
      title: "Remove junk fees",
      detail: `These fees are dealer add-ons with little to no value: ${feeNames}. Tell the dealer: "I want these removed from the deal." They may push back — stand firm. These are profit centers, not required costs.`,
      potentialSavings: Math.round(monthlySavings),
    });
  }

  // 4. Negotiable fees
  const negotiableFees = analysis.feeAnalysis.filter(
    (f) => f.legitimacy === "negotiable"
  );
  if (negotiableFees.length > 0) {
    const totalNegotiable = negotiableFees.reduce((s, f) => s + f.amount, 0);
    // Assume you can negotiate about half off
    const monthlySavings = (totalNegotiable * 0.5) / input.leaseTerm;

    if (monthlySavings > 3) {
      tips.push({
        priority: "medium",
        title: "Negotiate optional fees",
        detail: `These fees may be negotiable: ${negotiableFees.map((f) => f.name).join(", ")}. Ask the dealer to justify each one and push for reductions.`,
        potentialSavings: Math.round(monthlySavings),
      });
    }
  }

  // 5. Down payment warning
  if (input.downPayment > 500) {
    tips.push({
      priority: "high",
      title: "Reconsider your down payment",
      detail: `You're putting $${input.downPayment.toLocaleString()} down. On a lease, if the car is totaled or stolen, you LOSE your down payment — insurance pays the leasing company, not you. Keep your down payment at $0 and accept a higher payment instead. It's safer.`,
      potentialSavings: 0, // Not a monthly savings, but risk reduction
    });
  }

  // 6. 1% rule is bad
  if (analysis.onePercentRule > 1.3 && tips.length < 5) {
    tips.push({
      priority: "medium",
      title: "Overall deal is above the 1% benchmark",
      detail: `Your effective payment (normalized to $0 down) is ${analysis.onePercentRule.toFixed(1)}% of MSRP. A good lease deal is at or below 1%. This means the combination of price, rate, residual, and fees isn't competitive. Consider shopping other brands/models with better lease programs.`,
      potentialSavings: 0,
    });
  }

  // Sort by priority then by savings
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  tips.sort((a, b) => {
    const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (pDiff !== 0) return pDiff;
    return b.potentialSavings - a.potentialSavings;
  });

  return tips;
}
