import { FeeItem, FeeAnalysisItem } from "@/types/lease";

interface FeeRule {
  patterns: string[];
  legitimacy: "legitimate" | "negotiable" | "junk";
  explanation: string;
}

const FEE_RULES: FeeRule[] = [
  // Legitimate fees — government or leasing company mandated
  {
    patterns: ["acquisition", "bank fee", "lender admin"],
    legitimacy: "legitimate",
    explanation:
      "Set by the leasing company to originate the lease. Typically $0-$595. Not negotiable but legitimate.",
  },
  {
    patterns: ["registration", "title", "license", "plate", "tag"],
    legitimacy: "legitimate",
    explanation:
      "Government fee required for vehicle registration. Legitimate cost.",
  },
  {
    patterns: ["disposition"],
    legitimacy: "legitimate",
    explanation:
      "Charged at lease end if you return the vehicle. Typically $300-$495. Set by the leasing company.",
  },
  {
    patterns: ["tax", "sales tax", "hst", "gst", "pst"],
    legitimacy: "legitimate",
    explanation: "Required by provincial/federal government. Legitimate cost.",
  },
  {
    patterns: ["freight", "pdi", "pre-delivery inspection"],
    legitimacy: "legitimate",
    explanation:
      "Freight and Pre-Delivery Inspection. Set by the manufacturer — same at every dealer. Legitimate cost.",
  },
  {
    patterns: ["ppsa", "personal property security"],
    legitimacy: "legitimate",
    explanation:
      "Provincial Personal Property Security Act registration fee. Required to register the lien. Typically $30-$90.",
  },
  {
    patterns: ["a/c tax", "air conditioning tax", "ac tax", "excise"],
    legitimacy: "legitimate",
    explanation:
      "Federal excise tax on vehicles with air conditioning ($100). Legitimate government charge.",
  },
  {
    patterns: ["omvic", "amvic", "tire recycling", "tire levy", "tire stewardship"],
    legitimacy: "legitimate",
    explanation:
      "Provincial regulatory or environmental levy. Small amount, legitimate.",
  },

  // Negotiable fees — common but not fixed
  {
    patterns: ["doc", "documentation", "document", "admin"],
    legitimacy: "negotiable",
    explanation:
      "Dealer processing fee. Ranges widely by dealer. Not regulated in most provinces — negotiate it down or ask to waive.",
  },
  {
    patterns: ["dealer fee", "dealer handling"],
    legitimacy: "negotiable",
    explanation:
      "Generic dealer fee. Often inflated. Push back or ask them to reduce/waive it.",
  },
  {
    patterns: ["market adjustment", "adm", "addendum", "markup"],
    legitimacy: "negotiable",
    explanation:
      "Pure dealer profit added above MSRP. On most vehicles this can be negotiated away. Walk away if they won't budge.",
  },
  {
    patterns: ["maintenance", "service contract", "warranty", "extended"],
    legitimacy: "negotiable",
    explanation:
      "Optional product. On a lease, manufacturer warranty typically covers the full term. Usually unnecessary.",
  },
  {
    patterns: ["gap", "gap insurance"],
    legitimacy: "negotiable",
    explanation:
      "GAP coverage is often INCLUDED free by captive lease companies (Honda, Toyota, BMW Financial, etc.). Verify before paying extra.",
  },
  {
    patterns: ["wheel", "tire protection", "tire & wheel", "tire and wheel"],
    legitimacy: "negotiable",
    explanation:
      "Optional protection. Can be worth it on vehicles with expensive low-profile tires, but price is often inflated.",
  },
  {
    patterns: ["security deposit"],
    legitimacy: "negotiable",
    explanation:
      "Refundable at lease end. Some brands (BMW) allow multiple security deposits (MSDs) to buy down the rate — this can actually save you money.",
  },

  // Junk fees — dealer profit centers with little value
  {
    patterns: ["paint protection", "paint sealant", "clear coat", "clearcoat"],
    legitimacy: "junk",
    explanation:
      "Typically a cheap sealant worth $30 being sold for $300-$1,500. Modern car paint doesn't need this. Remove it.",
  },
  {
    patterns: ["fabric protection", "interior protection", "scotchguard", "stain"],
    legitimacy: "junk",
    explanation:
      "A can of Scotchguard costs $10. You're being charged $200-$800 for essentially the same thing. Remove it.",
  },
  {
    patterns: ["vin etch", "vin etching", "theft deterrent", "anti-theft etch"],
    legitimacy: "junk",
    explanation:
      "VIN etching kits cost $20 online. Dealers charge $200-$500. Provides negligible theft protection. Remove it.",
  },
  {
    patterns: ["nitrogen", "nitro fill", "nitrogen tire"],
    legitimacy: "junk",
    explanation:
      "Air is already 78% nitrogen. No meaningful benefit for passenger vehicles. Remove it.",
  },
  {
    patterns: ["pinstripe", "pin stripe", "striping"],
    legitimacy: "junk",
    explanation:
      "Worth $20-50 at most, but dealers charge $200-$500. Remove unless you specifically want it.",
  },
  {
    patterns: ["dealer prep", "dealer preparation"],
    legitimacy: "junk",
    explanation:
      "The manufacturer already pays the dealer for vehicle preparation (that's what Freight/PDI covers). This is double-dipping. Remove it.",
  },
  {
    patterns: ["advertising", "ad fee", "regional ad"],
    legitimacy: "junk",
    explanation:
      "The dealer's advertising cost is their business expense, not yours. Remove it.",
  },
  {
    patterns: ["compliance", "environmental fee"],
    legitimacy: "junk",
    explanation:
      "Vague fee with no basis. Not a real regulatory charge. Remove it.",
  },
  {
    patterns: ["electronic filing", "e-filing", "efiling"],
    legitimacy: "junk",
    explanation:
      "Filing paperwork electronically costs the dealer nothing extra. Remove it.",
  },
  {
    patterns: ["lojack", "lo jack", "tracking", "gps tracking"],
    legitimacy: "junk",
    explanation:
      "Pre-installed tracking device. Often marked up enormously. On a lease, you don't own the car. Remove it.",
  },
  {
    patterns: ["protection package", "appearance package", "dealer package", "accessory package"],
    legitimacy: "junk",
    explanation:
      "Bundled dealer add-ons (often paint + fabric + VIN etch combined). Typically $50 worth of product for $1,000+. Remove it.",
  },
];

/**
 * Analyze each fee item against the known fee database.
 * Uses fuzzy matching on fee names.
 */
export function analyzeFees(fees: FeeItem[]): FeeAnalysisItem[] {
  return fees.map((fee) => {
    const nameLower = fee.name.toLowerCase().trim();
    const matchedRule = FEE_RULES.find((rule) =>
      rule.patterns.some((pattern) => nameLower.includes(pattern))
    );

    if (matchedRule) {
      return {
        name: fee.name,
        amount: fee.amount,
        legitimacy: matchedRule.legitimacy,
        explanation: matchedRule.explanation,
      };
    }

    // Unknown fee — flag as negotiable by default
    return {
      name: fee.name,
      amount: fee.amount,
      legitimacy: "negotiable" as const,
      explanation:
        "We don't recognize this fee. Ask the dealer to explain exactly what it covers and whether it can be removed.",
    };
  });
}

/** Common fee presets for the form — Canadian lease fees */
export const COMMON_FEES = [
  "Freight & PDI",
  "PPSA Fee",
  "A/C Tax",
  "OMVIC / Tire Levy",
  "Lender Admin Fee",
  "Acquisition Fee",
  "Documentation Fee",
  "Registration / Licensing",
  "Dealer Preparation",
  "Paint Protection",
  "Fabric Protection",
  "VIN Etching",
  "GAP Insurance",
  "Wheel & Tire Protection",
  "Market Adjustment",
  "Protection Package",
];
