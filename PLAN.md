# Lease Analyzer - Feasibility & Implementation Plan

## Problem Statement

Car dealerships obscure the true cost of leases through:
- Marking up the money factor (interest rate) without disclosure
- Padding the capitalized cost with junk fees (paint protection, VIN etching, nitrogen tires, etc.)
- Quoting low monthly payments that hide large down payments or extended terms
- Burying unfavorable residual values
- Rolling in accessories/add-ons at inflated prices

Most consumers see "monthly payment fits my budget" and sign — never realizing they're overpaying by thousands.

**This tool solves that** by letting users quickly input or photograph their lease quote, then instantly breaking down whether the deal is good, bad, or ugly — and exactly what to push back on.

---

## Feasibility Assessment

### Input Methods

| Method | Feasibility | Cost | Accuracy |
|--------|------------|------|----------|
| **Photo upload + Claude Vision** | High | ~$0.01-0.05/image (Claude API) | Very good for printed docs |
| **Manual form input** | High | Free (compute only) | Perfect (user-verified) |
| **Free OCR (Tesseract.js)** | Medium | Free | Poor on complex dealer worksheets |

**Recommendation:** Start with **manual form input** (Phase 1) and add **photo upload via Claude Vision** (Phase 2). Manual input is free, reliable, and lets us ship faster. Photo upload is a strong upgrade once the core analysis logic is proven.

### Analysis Engine — What We Calculate

From the user's input, we can determine:

1. **Depreciation Fee** = (Adj. Cap Cost - Residual) / Term
2. **Rent Charge** = (Adj. Cap Cost + Residual) x Money Factor
3. **Calculated Monthly Payment** = Depreciation + Rent Charge (verify against dealer's quote)
4. **Money Factor → APR** = MF x 2,400
5. **1% Rule Check** = Monthly Payment / MSRP (good if ≤ 1.0%, with $0 down)
6. **Effective Monthly Cost** = Total Lease Cost / Term (normalizes down payments)
7. **Selling Price Discount** = % below MSRP
8. **Fee Breakdown** = Flag each fee as legitimate, negotiable, or junk

### Deal Rating System

| Component | How We Rate It |
|-----------|---------------|
| **Money Factor** | Compare to typical buy rates; flag if APR > 5% |
| **Selling Price** | Should be at or below MSRP; flag markups |
| **Residual %** | Benchmark: 55-60% is good for 36mo; below 45% is poor |
| **1% Rule** | < 1.0% = great, 1.0-1.2% = good, > 1.5% = poor |
| **Junk Fees** | Auto-flag known dealer add-ons (paint protection, fabric guard, dealer prep, etc.) |
| **Down Payment** | Warn users: never put money down on a lease (total loss risk) |
| **Overall Grade** | A through F based on weighted composite score |

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Framework** | Next.js 14 (App Router) | Full-stack React, API routes, free Vercel deployment |
| **Styling** | Tailwind CSS | Fast to build, responsive out of the box |
| **AI (Phase 2)** | Claude API (Vision) | Best-in-class document understanding for photo analysis |
| **Hosting** | Vercel (free tier) | Zero-config deployment, generous free tier |
| **Database** | None (Phase 1) / Supabase (Phase 2) | Keep it simple; add persistence later if needed |

**Estimated cost to run:** $0/month on free tiers for Phase 1 (all computation is client-side math). Phase 2 adds Claude API cost (~$0.01-0.05 per photo analyzed).

---

## Phase 1 — Manual Input Lease Analyzer (MVP)

### User Flow

```
1. User lands on homepage
2. Clicks "Analyze My Lease"
3. Fills out form with key numbers from their quote:
   - MSRP
   - Selling Price (negotiated price)
   - Down Payment / Cap Cost Reduction
   - Trade-in Value (if any)
   - Rebates / Incentives
   - Additional Fees (itemized: doc fee, acquisition fee, dealer add-ons)
   - Monthly Payment (what the dealer quoted)
   - Lease Term (months)
   - Residual Value or Residual %
   - Money Factor (if known) or APR
   - Annual Mileage Allowance
4. Clicks "Analyze This Deal"
5. Gets instant results:
   - Overall Grade (A-F)
   - 1% Rule result
   - Payment verification (our math vs. dealer's quote — flags discrepancies)
   - Money factor / APR assessment
   - Residual value assessment
   - Fee-by-fee breakdown (legitimate vs. junk)
   - Specific negotiation tips (e.g., "Ask the dealer to match the buy rate of 0.00100")
   - How much you could save with recommended changes
```

### Pages / Components

```
/                          → Landing page (hero, value prop, CTA)
/analyze                   → Lease input form + results
/learn                     → Educational content (what is money factor, etc.)
```

### Key Features (Phase 1)

- [ ] Responsive lease input form with smart defaults and tooltips
- [ ] Client-side lease math engine (all calculations run in browser — no API needed)
- [ ] Deal grading algorithm (A-F score with breakdown)
- [ ] Fee flagging system (known junk fees database)
- [ ] Negotiation recommendations (specific, actionable tips)
- [ ] Payment discrepancy detection (our calculation vs. quoted payment)
- [ ] Educational tooltips explaining each field
- [ ] Mobile-first design (users will often be at the dealership on their phone)

---

## Phase 2 — Photo Upload + AI Analysis

### User Flow (Addition)

```
1. User takes photo of lease worksheet at dealership
2. Uploads to site
3. Claude Vision API extracts all numbers automatically
4. Pre-fills the form for user verification
5. User confirms/corrects any values
6. Same analysis as Phase 1
```

### Technical Implementation

- Upload image via Next.js API route
- Send to Claude Vision API with a structured extraction prompt
- Return extracted fields as JSON
- Pre-fill the analysis form
- User reviews and submits

---

## Phase 3 — Future Enhancements

- **Market data integration**: Pull current incentives/residuals from manufacturer sites
- **Deal comparison**: Save and compare multiple quotes side by side
- **Dealer inventory matching**: Find better deals on similar vehicles
- **Lease transfer analysis**: Evaluate Swapalease/LeaseTrader deals
- **Purchase vs. lease calculator**: Should you even lease this car?
- **User accounts**: Save deal history
- **Community ratings**: Aggregate anonymized deal data by make/model/region

---

## Project Structure

```
Car/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout with nav
│   │   ├── page.tsx                # Landing page
│   │   ├── analyze/
│   │   │   └── page.tsx            # Lease analyzer (form + results)
│   │   ├── learn/
│   │   │   └── page.tsx            # Educational content
│   │   └── api/
│   │       └── analyze-image/
│   │           └── route.ts        # Phase 2: Claude Vision API endpoint
│   ├── components/
│   │   ├── LeaseForm.tsx           # Input form
│   │   ├── LeaseResults.tsx        # Analysis results display
│   │   ├── DealGrade.tsx           # A-F grade badge
│   │   ├── FeeBreakdown.tsx        # Fee-by-fee analysis
│   │   ├── NegotiationTips.tsx     # Actionable recommendations
│   │   ├── PaymentVerifier.tsx     # Our math vs. dealer's quote
│   │   └── Tooltip.tsx             # Educational hover tips
│   ├── lib/
│   │   ├── lease-math.ts           # Core lease calculation engine
│   │   ├── deal-grader.ts          # Grading algorithm
│   │   ├── fee-database.ts         # Known fees and their legitimacy
│   │   └── negotiation-engine.ts   # Generates specific tips
│   └── types/
│       └── lease.ts                # TypeScript interfaces
├── public/
│   └── ...                         # Static assets
├── tailwind.config.ts
├── next.config.js
├── tsconfig.json
├── package.json
└── PLAN.md                         # This file
```

---

## Known Junk Fees Database (Built-In)

| Fee Name | Legitimate? | Typical Cost | Notes |
|----------|------------|--------------|-------|
| Acquisition Fee | Yes | $595-$1,095 | Set by bank, not negotiable |
| Documentation Fee | Mostly | $0-$500 | Varies by state; some states cap it |
| Registration/Title/License | Yes | Varies | Government fee, legitimate |
| Disposition Fee | Yes | $300-$495 | Due at lease end if you return the car |
| Dealer Preparation | No | $200-$1,000 | Already covered by manufacturer |
| Paint Protection | No | $300-$1,500 | Typically a cheap sealant worth $30 |
| Fabric Protection | No | $200-$800 | Scotchguard worth $10 |
| VIN Etching | No | $200-$500 | DIY kit costs $20 |
| Nitrogen Tire Fill | No | $100-$300 | Air is 78% nitrogen already |
| Pinstriping | No | $200-$500 | Worth $20-50 if you even want it |
| Market Adjustment / ADM | Negotiable | $1,000-$10,000+ | Pure dealer profit on high-demand cars |
| GAP Insurance | Check | $300-$800 | Often included free in leases |
| Wheel/Tire Protection | Optional | $500-$1,500 | Can be worth it on low-profile tires |
| Maintenance Package | Optional | $500-$2,000 | Compare to paying per-service |

---

## Implementation Order

1. **Project setup** — Next.js, Tailwind, TypeScript, project structure
2. **Core math engine** — lease-math.ts with all calculations + unit tests
3. **Deal grading algorithm** — deal-grader.ts with scoring logic
4. **Fee database** — fee-database.ts with known fees
5. **Negotiation engine** — negotiation-engine.ts
6. **Lease input form** — LeaseForm.tsx with validation and tooltips
7. **Results display** — LeaseResults.tsx with grade, breakdown, tips
8. **Landing page** — Compelling hero section explaining the value
9. **Learn page** — Educational content about lease mechanics
10. **Mobile optimization** — Test and polish on phone-sized screens
11. **Deploy to Vercel** — Production deployment
