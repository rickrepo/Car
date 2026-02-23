import { Deal } from "../src/lib/database.types";

/**
 * Parses deal information from free-text posts (Reddit, forums).
 * Extracts vehicle info, MSRP, payment, APR, residual, term, etc.
 * Returns a partial Deal object (or null if not enough data was found).
 */

interface ParsedDeal {
  vehicle_year: number | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_trim: string | null;
  province: string | null;
  deal_type: "quote" | "purchase";
  msrp: number | null;
  selling_price: number | null;
  payment_amount: number | null;
  payment_frequency: "monthly" | "biweekly";
  term_months: number | null;
  residual_value: number | null;
  residual_percent: number | null;
  down_payment: number;
  apr: number | null;
  discount_percent: number | null;
  source_url: string;
  source_platform: string;
  raw_title: string;
  raw_body: string;
  posted_at: string;
}

// Common vehicle makes for matching
const MAKES = [
  "Acura", "Alfa Romeo", "Audi", "BMW", "Buick", "Cadillac", "Chevrolet",
  "Chevy", "Chrysler", "Dodge", "Fiat", "Ford", "Genesis", "GMC", "Honda",
  "Hyundai", "Infiniti", "Jaguar", "Jeep", "Kia", "Land Rover", "Lexus",
  "Lincoln", "Mazda", "Mercedes", "Mercedes-Benz", "MINI", "Mitsubishi",
  "Nissan", "Porsche", "Ram", "Subaru", "Tesla", "Toyota", "Volkswagen",
  "VW", "Volvo",
];

// Province patterns
const PROVINCE_PATTERNS: Record<string, RegExp> = {
  ON: /\b(ontario|ON|GTA|toronto|ottawa|mississauga|brampton|hamilton)\b/i,
  BC: /\b(british columbia|BC|vancouver|victoria|surrey)\b/i,
  AB: /\b(alberta|AB|calgary|edmonton)\b/i,
  QC: /\b(quebec|QC|montreal|québec|laval|gatineau)\b/i,
  MB: /\b(manitoba|MB|winnipeg)\b/i,
  SK: /\b(saskatchewan|SK|regina|saskatoon)\b/i,
  NS: /\b(nova scotia|NS|halifax)\b/i,
  NB: /\b(new brunswick|NB|fredericton|moncton)\b/i,
  NL: /\b(newfoundland|NL|st\.?\s*john'?s)\b/i,
  PE: /\b(prince edward island|PEI|PE|charlottetown)\b/i,
  NT: /\b(northwest territories|NT|yellowknife)\b/i,
  YT: /\b(yukon|YT|whitehorse)\b/i,
  NU: /\b(nunavut|NU|iqaluit)\b/i,
};

/**
 * Parse a Leasehackr-style deal title.
 * Format: "SIGNED! 2026 Rubicon X - $72k MSRP, $314/mo, $340 DAS 24/10k"
 */
export function parseLeasehackrTitle(title: string): Partial<ParsedDeal> {
  const result: Partial<ParsedDeal> = {};

  // Deal type
  if (/signed|purchased|got it|picked up/i.test(title)) {
    result.deal_type = "purchase";
  } else {
    result.deal_type = "quote";
  }

  // Year (2020-2027)
  const yearMatch = title.match(/\b(202[0-7])\b/);
  if (yearMatch) result.vehicle_year = parseInt(yearMatch[1]);

  // MSRP - "$72k MSRP" or "$72,000 MSRP" or "MSRP $72k"
  const msrpMatch = title.match(
    /\$?([\d,]+\.?\d*)\s*k?\s*MSRP|MSRP\s*\$?([\d,]+\.?\d*)\s*k?/i
  );
  if (msrpMatch) {
    const raw = msrpMatch[1] || msrpMatch[2];
    result.msrp = parseMoneyValue(raw, title);
  }

  // Monthly payment - "$314/mo" or "$314/month" or "$314 per month"
  const paymentMatch = title.match(
    /\$?([\d,]+\.?\d*)\s*\/?\s*(mo|month|per\s*month)/i
  );
  if (paymentMatch) {
    result.payment_amount = parseFloat(paymentMatch[1].replace(/,/g, ""));
    result.payment_frequency = "monthly";
  }

  // Biweekly payment
  const bwMatch = title.match(
    /\$?([\d,]+\.?\d*)\s*\/?\s*(bw|biweekly|bi-weekly|every\s*2\s*weeks)/i
  );
  if (bwMatch) {
    result.payment_amount = parseFloat(bwMatch[1].replace(/,/g, ""));
    result.payment_frequency = "biweekly";
  }

  // DAS (Due at Signing) — maps to down_payment
  const dasMatch = title.match(/\$?([\d,]+\.?\d*)\s*k?\s*DAS/i);
  if (dasMatch) {
    result.down_payment = parseMoneyValue(dasMatch[1], title);
  }

  // Term/mileage — "24/10k" or "36/12k" or "36 months"
  const termMileageMatch = title.match(/\b(\d{2})\s*\/\s*\d+k?\b/);
  if (termMileageMatch) {
    result.term_months = parseInt(termMileageMatch[1]);
  } else {
    const termMatch = title.match(/(\d{2})\s*(?:mo|month|months)/i);
    if (termMatch) result.term_months = parseInt(termMatch[1]);
  }

  // Selling price — "$29,200" or "$29.2k" before MSRP mention
  const priceMatch = title.match(
    /(?:selling|sale|price|paid)\s*(?:price)?\s*:?\s*\$?([\d,]+\.?\d*)\s*k?/i
  );
  if (priceMatch) {
    result.selling_price = parseMoneyValue(priceMatch[1], title);
  }

  // APR
  const aprMatch = title.match(/([\d.]+)\s*%?\s*(?:APR|interest|rate|MF)/i);
  if (aprMatch) {
    const val = parseFloat(aprMatch[1]);
    // If it looks like a money factor (< 0.01), convert to APR
    if (val < 0.01) {
      result.apr = val * 2400;
    } else {
      result.apr = val;
    }
  }

  // Residual
  const residualMatch = title.match(
    /([\d.]+)\s*%?\s*(?:residual|RV)/i
  );
  if (residualMatch) {
    result.residual_percent = parseFloat(residualMatch[1]);
  }

  return result;
}

/**
 * Parse deal information from a Reddit post (title + body).
 * More free-form text, so we use broader patterns.
 */
export function parseRedditPost(
  title: string,
  body: string
): Partial<ParsedDeal> {
  const text = `${title}\n${body}`;
  const result: Partial<ParsedDeal> = {};

  // Deal type
  if (
    /signed|purchased|bought|picked up|just got|just leased|closed on/i.test(
      text
    )
  ) {
    result.deal_type = "purchase";
  } else {
    result.deal_type = "quote";
  }

  // Year
  const yearMatch = text.match(/\b(202[0-7])\b/);
  if (yearMatch) result.vehicle_year = parseInt(yearMatch[1]);

  // Vehicle make
  for (const make of MAKES) {
    const regex = new RegExp(`\\b${make}\\b`, "i");
    if (regex.test(text)) {
      result.vehicle_make = make === "Chevy" ? "Chevrolet" : make === "VW" ? "Volkswagen" : make;
      // Try to get model — word(s) after make
      const modelMatch = text.match(
        new RegExp(`${make}\\s+([A-Z][a-z]+(?:\\s+[A-Z0-9][a-z0-9]*)?)`, "i")
      );
      if (modelMatch) result.vehicle_model = modelMatch[1].trim();
      break;
    }
  }

  // Province
  for (const [code, pattern] of Object.entries(PROVINCE_PATTERNS)) {
    if (pattern.test(text)) {
      result.province = code;
      break;
    }
  }

  // MSRP
  const msrpPatterns = [
    /MSRP\s*(?:of|is|was|:)?\s*\$?([\d,]+\.?\d*)\s*k?/i,
    /\$?([\d,]+\.?\d*)\s*k?\s*MSRP/i,
    /sticker\s*(?:price)?\s*(?:of|is|was|:)?\s*\$?([\d,]+\.?\d*)\s*k?/i,
  ];
  for (const pattern of msrpPatterns) {
    const match = text.match(pattern);
    if (match) {
      result.msrp = parseMoneyValue(match[1], text);
      break;
    }
  }

  // Payment
  const paymentPatterns = [
    /\$?([\d,]+\.?\d*)\s*\/?\s*(?:per\s+)?(?:mo|month)\b/i,
    /(?:payment|paying)\s*(?:of|is|:)?\s*\$?([\d,]+\.?\d*)/i,
    /(?:monthly)\s*(?:payment)?\s*(?:of|is|:)?\s*\$?([\d,]+\.?\d*)/i,
  ];
  for (const pattern of paymentPatterns) {
    const match = text.match(pattern);
    if (match) {
      const val = parseFloat((match[1] || match[2]).replace(/,/g, ""));
      if (val > 50 && val < 5000) {
        result.payment_amount = val;
        result.payment_frequency = "monthly";
      }
      break;
    }
  }

  // Biweekly
  const bwPatterns = [
    /\$?([\d,]+\.?\d*)\s*\/?\s*(?:per\s+)?(?:bw|biweekly|bi-weekly)\b/i,
    /(?:biweekly|bi-weekly)\s*(?:payment)?\s*(?:of|is|:)?\s*\$?([\d,]+\.?\d*)/i,
  ];
  for (const pattern of bwPatterns) {
    const match = text.match(pattern);
    if (match) {
      const val = parseFloat((match[1] || match[2]).replace(/,/g, ""));
      if (val > 30 && val < 3000) {
        result.payment_amount = val;
        result.payment_frequency = "biweekly";
      }
      break;
    }
  }

  // APR / interest rate
  const aprPatterns = [
    /(?:APR|interest\s*rate|rate)\s*(?:of|is|was|:)?\s*([\d.]+)\s*%/i,
    /([\d.]+)\s*%\s*(?:APR|interest|rate)/i,
    /(?:money\s*factor|MF)\s*(?:of|is|was|:)?\s*([\d.]+)/i,
  ];
  for (const pattern of aprPatterns) {
    const match = text.match(pattern);
    if (match) {
      const val = parseFloat(match[1]);
      if (val < 0.01) {
        result.apr = val * 2400;
      } else if (val <= 20) {
        result.apr = val;
      }
      break;
    }
  }

  // Residual
  const residualPatterns = [
    /(?:residual|RV)\s*(?:of|is|was|:)?\s*([\d.]+)\s*%/i,
    /([\d.]+)\s*%\s*(?:residual|RV)/i,
    /(?:residual|RV)\s*(?:of|is|was|:)?\s*\$?([\d,]+)/i,
  ];
  for (const pattern of residualPatterns) {
    const match = text.match(pattern);
    if (match) {
      const val = parseFloat(match[1].replace(/,/g, ""));
      if (val > 100) {
        // Dollar amount
        result.residual_value = val;
      } else {
        // Percentage
        result.residual_percent = val;
      }
      break;
    }
  }

  // Term
  const termPatterns = [
    /(\d{2,3})\s*(?:mo|month|months)\b/i,
    /(?:term|lease)\s*(?:of|is|was|:)?\s*(\d{2,3})\s*(?:mo|month|months)?/i,
  ];
  for (const pattern of termPatterns) {
    const match = text.match(pattern);
    if (match) {
      const val = parseInt(match[1]);
      if (val >= 12 && val <= 84) {
        result.term_months = val;
        break;
      }
    }
  }

  // Selling price
  const sellPatterns = [
    /(?:selling|sale|negotiated|agreed)\s*(?:price)?\s*(?:of|is|was|:)?\s*\$?([\d,]+\.?\d*)\s*k?/i,
    /(?:paid|got it for|price)\s*(?:of|is|was|:)?\s*\$?([\d,]+\.?\d*)\s*k?/i,
  ];
  for (const pattern of sellPatterns) {
    const match = text.match(pattern);
    if (match) {
      const val = parseMoneyValue(match[1], text);
      // Sanity check — should be in car price range
      if (val > 10000 && val < 200000) {
        result.selling_price = val;
        break;
      }
    }
  }

  // Down payment
  const downPatterns = [
    /(?:down|DAS|due at signing|drive off)\s*(?:payment)?\s*(?:of|is|was|:)?\s*\$?([\d,]+\.?\d*)\s*k?/i,
    /\$?([\d,]+\.?\d*)\s*k?\s*(?:down|DAS)\b/i,
  ];
  for (const pattern of downPatterns) {
    const match = text.match(pattern);
    if (match) {
      result.down_payment = parseMoneyValue(match[1], text);
      break;
    }
  }

  // Discount
  const discountMatch = text.match(
    /([\d.]+)\s*%\s*(?:off|below|under|discount)\s*(?:MSRP|sticker)?/i
  );
  if (discountMatch) {
    result.discount_percent = parseFloat(discountMatch[1]);
  }

  return result;
}

/**
 * Parse a money value, handling "k" suffix (e.g., "72k" → 72000).
 */
function parseMoneyValue(raw: string, context: string): number {
  const cleaned = raw.replace(/,/g, "");
  const num = parseFloat(cleaned);

  // Check if followed by "k" in the original context
  const kPattern = new RegExp(`${raw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*k\\b`, "i");
  if (kPattern.test(context)) {
    return num * 1000;
  }

  // If the number seems too small for a car price (< 1000), assume it's in thousands
  if (num > 0 && num < 200 && context.toLowerCase().includes("msrp")) {
    return num * 1000;
  }

  return num;
}

/**
 * Determine if a parsed deal has enough data to be useful.
 * We need at minimum: vehicle info + at least 2 financial data points.
 */
export function isDealViable(parsed: Partial<ParsedDeal>): boolean {
  const hasVehicle = parsed.vehicle_year != null;
  const financialFields = [
    parsed.msrp,
    parsed.payment_amount,
    parsed.apr,
    parsed.residual_percent ?? parsed.residual_value,
    parsed.selling_price,
  ].filter((v) => v != null);

  return hasVehicle && financialFields.length >= 2;
}

/**
 * Compute derived fields from parsed data.
 */
export function enrichParsedDeal(parsed: Partial<ParsedDeal>): Partial<ParsedDeal> {
  const enriched = { ...parsed };

  // Compute residual_percent from residual_value + MSRP
  if (enriched.residual_percent == null && enriched.residual_value && enriched.msrp) {
    enriched.residual_percent = (enriched.residual_value / enriched.msrp) * 100;
  }

  // Compute residual_value from residual_percent + MSRP
  if (enriched.residual_value == null && enriched.residual_percent && enriched.msrp) {
    enriched.residual_value = (enriched.residual_percent / 100) * enriched.msrp;
  }

  // Compute discount_percent from selling_price + MSRP
  if (enriched.discount_percent == null && enriched.selling_price && enriched.msrp) {
    enriched.discount_percent =
      ((enriched.msrp - enriched.selling_price) / enriched.msrp) * 100;
  }

  // Default selling_price to MSRP if not specified
  if (enriched.selling_price == null && enriched.msrp) {
    enriched.selling_price = enriched.msrp;
  }

  // Default down_payment to 0
  if (enriched.down_payment == null) {
    enriched.down_payment = 0;
  }

  return enriched;
}
