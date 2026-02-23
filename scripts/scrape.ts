#!/usr/bin/env npx tsx
/**
 * DealCheck Canada — Deal Scraper Pipeline
 *
 * Fetches lease deal data from Reddit and Leasehackr, parses it,
 * runs it through the grading engine, and saves to public/data/deals.json.
 *
 * Usage:
 *   npx tsx scripts/scrape.ts
 *
 * The output file is read by the Next.js frontend at page load.
 */

import { writeFileSync, mkdirSync, existsSync, readFileSync } from "fs";
import { join } from "path";
import { scrapeLeasehackrDeals } from "./scrape-leasehackr";
import { scrapeRedditDeals } from "./scrape-reddit";
import { analyzeLease } from "../src/lib/lease-math";
import { LeaseInput } from "../src/types/lease";

interface ScrapedDeal {
  id: string;
  created_at: string;
  vehicle_year: number;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_trim: string | null;
  province: string;
  deal_type: "quote" | "purchase";
  msrp: number;
  selling_price: number;
  payment_amount: number;
  payment_frequency: "monthly" | "biweekly";
  term_months: number;
  residual_value: number;
  down_payment: number;
  other_credits: number;
  due_on_delivery: number;
  fees: { name: string; amount: number }[];
  apr: number;
  money_factor: number;
  residual_percent: number;
  discount_percent: number;
  one_percent_rule: number;
  overall_grade: string;
  total_junk_fees: number;
  dealership_name: string | null;
  notes: string | null;
  source_url: string;
  source_platform: string;
}

const OUTPUT_DIR = join(process.cwd(), "public", "data");
const OUTPUT_FILE = join(OUTPUT_DIR, "deals.json");

function generateId(source: string, url: string): string {
  // Simple hash from source URL
  let hash = 0;
  const str = `${source}:${url}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `scraped-${Math.abs(hash).toString(36)}`;
}

function buildDealFromParsed(parsed: Record<string, unknown>): ScrapedDeal | null {
  // We need at minimum: year, make, msrp, payment, term
  const year = parsed.vehicle_year as number | null;
  const make = parsed.vehicle_make as string | null;
  const model = parsed.vehicle_model as string | null;
  const msrp = parsed.msrp as number | null;
  const payment = parsed.payment_amount as number | null;
  const term = parsed.term_months as number | null;

  if (!year || !make || !msrp || !payment || !term) return null;

  const sellingPrice = (parsed.selling_price as number) || msrp;
  const residualPercent = (parsed.residual_percent as number) || 55;
  const residualValue = (parsed.residual_value as number) || (msrp * residualPercent) / 100;
  const downPayment = (parsed.down_payment as number) || 0;
  const paymentFreq = (parsed.payment_frequency as "monthly" | "biweekly") || "monthly";

  // Run through our analysis engine
  const leaseInput: LeaseInput = {
    msrp,
    sellingPrice,
    paymentFrequency: paymentFreq,
    paymentAmount: payment,
    leaseTerm: term,
    residualValue,
    downPayment,
    otherCredits: 0,
    fees: [],
    dueOnDelivery: 0,
  };

  try {
    const analysis = analyzeLease(leaseInput);

    // Sanity checks — skip deals with unreasonable numbers
    if (analysis.apr < -5 || analysis.apr > 30) return null;
    if (analysis.onePercentRule > 5) return null;

    return {
      id: generateId(
        parsed.source_platform as string,
        parsed.source_url as string
      ),
      created_at: (parsed.posted_at as string) || new Date().toISOString(),
      vehicle_year: year,
      vehicle_make: make,
      vehicle_model: model || "Unknown",
      vehicle_trim: (parsed.vehicle_trim as string) || null,
      province: (parsed.province as string) || "ON",
      deal_type: (parsed.deal_type as "quote" | "purchase") || "quote",
      msrp,
      selling_price: sellingPrice,
      payment_amount: payment,
      payment_frequency: paymentFreq,
      term_months: term,
      residual_value: residualValue,
      down_payment: downPayment,
      other_credits: 0,
      due_on_delivery: 0,
      fees: [],
      apr: Math.round(analysis.apr * 100) / 100,
      money_factor: Math.round(analysis.moneyFactor * 1000000) / 1000000,
      residual_percent: Math.round(analysis.residualPercent * 10) / 10,
      discount_percent: Math.round(analysis.sellingPriceDiscount * 10) / 10,
      one_percent_rule: Math.round(analysis.onePercentRule * 100) / 100,
      overall_grade: analysis.overallGrade.letter,
      total_junk_fees: 0,
      dealership_name: null,
      notes: (parsed.raw_title as string) || null,
      source_url: parsed.source_url as string,
      source_platform: parsed.source_platform as string,
    };
  } catch {
    return null;
  }
}

async function main() {
  console.log("=== DealCheck Canada Scraper ===\n");

  // Load existing deals to avoid losing them
  let existingDeals: ScrapedDeal[] = [];
  if (existsSync(OUTPUT_FILE)) {
    try {
      existingDeals = JSON.parse(readFileSync(OUTPUT_FILE, "utf-8"));
      console.log(`Loaded ${existingDeals.length} existing deals.\n`);
    } catch {
      console.log("Could not load existing deals, starting fresh.\n");
    }
  }

  const existingIds = new Set(existingDeals.map((d) => d.id));

  // Scrape sources
  const [leasehackrRaw, redditRaw] = await Promise.all([
    scrapeLeasehackrDeals(3).catch((err) => {
      console.error("[Leasehackr] Fatal error:", err);
      return [];
    }),
    scrapeRedditDeals().catch((err) => {
      console.error("[Reddit] Fatal error:", err);
      return [];
    }),
  ]);

  console.log(
    `\nRaw results: ${leasehackrRaw.length} from Leasehackr, ${redditRaw.length} from Reddit`
  );

  // Build deal objects
  const allRaw = [...leasehackrRaw, ...redditRaw];
  let newCount = 0;

  for (const raw of allRaw) {
    const deal = buildDealFromParsed(raw as unknown as Record<string, unknown>);
    if (deal && !existingIds.has(deal.id)) {
      existingDeals.push(deal);
      existingIds.add(deal.id);
      newCount++;
    }
  }

  // Sort by date, newest first
  existingDeals.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // Write output
  mkdirSync(OUTPUT_DIR, { recursive: true });
  writeFileSync(OUTPUT_FILE, JSON.stringify(existingDeals, null, 2));

  console.log(`\n=== Done ===`);
  console.log(`New deals added: ${newCount}`);
  console.log(`Total deals: ${existingDeals.length}`);
  console.log(`Output: ${OUTPUT_FILE}`);
}

main().catch(console.error);
