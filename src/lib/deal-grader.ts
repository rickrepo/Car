import { Grade, GradeLetter } from "@/types/lease";

function makeGrade(
  letter: GradeLetter,
  label: string,
  description: string
): Grade {
  return { letter, label, description };
}

const GRADE_SCORES: Record<GradeLetter, number> = {
  A: 4,
  B: 3,
  C: 2,
  D: 1,
  F: 0,
};

export const gradeDeal = {
  /**
   * Grade the APR / money factor.
   * Subsidized rates (0-2%) = A, typical good rates (2-4%) = B, etc.
   */
  moneyFactor(apr: number): Grade {
    if (apr <= 2)
      return makeGrade("A", "Excellent Rate", "This APR is subsidized or very low. Great financing terms.");
    if (apr <= 4)
      return makeGrade("B", "Good Rate", "This APR is reasonable for a lease. Close to typical buy rates.");
    if (apr <= 6)
      return makeGrade("C", "Average Rate", "This APR is average. The dealer may have marked up the money factor.");
    if (apr <= 8)
      return makeGrade("D", "High Rate", "This APR is above average. The dealer is likely marking up the money factor significantly.");
    return makeGrade("F", "Very High Rate", "This APR is very high. The dealer is almost certainly marking up the money factor well above the buy rate.");
  },

  /**
   * Grade the selling price discount from MSRP.
   * Positive = below MSRP (good), negative = above MSRP (markup).
   */
  sellingPrice(discountPercent: number): Grade {
    if (discountPercent >= 8)
      return makeGrade("A", "Great Price", "Excellent discount off MSRP. Strong negotiation.");
    if (discountPercent >= 5)
      return makeGrade("B", "Good Price", "Solid discount below MSRP.");
    if (discountPercent >= 2)
      return makeGrade("C", "Fair Price", "Modest discount. There may be room to negotiate further.");
    if (discountPercent >= 0)
      return makeGrade("D", "MSRP or Near", "You're paying at or near sticker price. Try to negotiate lower.");
    return makeGrade("F", "Above MSRP", "You're paying ABOVE sticker price (dealer markup/market adjustment). Walk away unless this is a very high-demand vehicle.");
  },

  /**
   * Grade the residual value as a % of MSRP.
   * Higher residual = less depreciation = lower payment.
   * Benchmarks shift with lease term.
   */
  residual(residualPercent: number, term: number): Grade {
    // Adjust thresholds based on term length
    const adj = term <= 24 ? 5 : term <= 36 ? 0 : -5;

    if (residualPercent >= 60 + adj)
      return makeGrade("A", "Strong Residual", "This vehicle holds its value well. Less depreciation means lower payments.");
    if (residualPercent >= 55 + adj)
      return makeGrade("B", "Good Residual", "Above-average residual value. Reasonable depreciation.");
    if (residualPercent >= 50 + adj)
      return makeGrade("C", "Average Residual", "Typical residual for this term length.");
    if (residualPercent >= 45 + adj)
      return makeGrade("D", "Below Average", "Lower residual means more depreciation and higher payments.");
    return makeGrade("F", "Poor Residual", "This vehicle depreciates heavily. Your monthly payments will be high relative to the car's value.");
  },

  /**
   * Grade using the 1% rule.
   * Monthly payment (normalized to $0 down) as % of MSRP.
   * <= 1% is good.
   */
  onePercent(percent: number): Grade {
    if (percent <= 0.8)
      return makeGrade("A", "Exceptional Deal", "Well under the 1% rule. This is an outstanding lease deal.");
    if (percent <= 1.0)
      return makeGrade("B", "Good Deal", "Meets the 1% rule. This is a good lease deal.");
    if (percent <= 1.2)
      return makeGrade("C", "Fair Deal", "Slightly above the 1% rule. Decent but there's room for improvement.");
    if (percent <= 1.5)
      return makeGrade("D", "Below Average", "Noticeably above the 1% rule. You're likely overpaying.");
    return makeGrade("F", "Poor Deal", "Well above the 1% rule. This deal needs significant improvement.");
  },

  /**
   * Compute an overall grade from the component grades.
   * Weighted: 1% rule (35%), money factor (30%), selling price (20%), residual (15%).
   * Junk fees penalty applied on top.
   */
  overall(
    mfGrade: Grade,
    priceGrade: Grade,
    residualGrade: Grade,
    onePercentGrade: Grade,
    totalJunkFees: number
  ): Grade {
    const weighted =
      GRADE_SCORES[onePercentGrade.letter] * 0.35 +
      GRADE_SCORES[mfGrade.letter] * 0.3 +
      GRADE_SCORES[priceGrade.letter] * 0.2 +
      GRADE_SCORES[residualGrade.letter] * 0.15;

    // Penalize for junk fees: -0.5 per $500 in junk fees
    const feePenalty = Math.min(totalJunkFees / 1000, 1.5);
    const finalScore = Math.max(weighted - feePenalty, 0);

    if (finalScore >= 3.5)
      return makeGrade("A", "Great Deal", "This lease is well-structured with competitive terms across the board.");
    if (finalScore >= 2.5)
      return makeGrade("B", "Good Deal", "This is a solid lease deal. Minor areas could be improved.");
    if (finalScore >= 1.5)
      return makeGrade("C", "Fair Deal", "This deal is average. Several areas could be negotiated for better terms.");
    if (finalScore >= 0.75)
      return makeGrade("D", "Below Average", "This deal has significant issues. You should negotiate before signing.");
    return makeGrade("F", "Bad Deal", "This deal has major problems. Do not sign without substantial changes.");
  },
};
