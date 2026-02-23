import { Deal } from "./database.types";
import { supabase, isSupabaseConfigured } from "./supabase";

export interface DealWithSource extends Deal {
  source_url?: string;
  source_platform?: string;
}

/**
 * Load deals from all available sources:
 * 1. Static JSON file (from scraper) — always available
 * 2. Supabase (user submissions) — if configured
 *
 * Returns merged, deduplicated, sorted array.
 */
export async function loadAllDeals(): Promise<DealWithSource[]> {
  const [scraped, submitted] = await Promise.all([
    loadScrapedDeals(),
    loadSupabaseDeals(),
  ]);

  // Merge (submitted deals first since they're user-submitted)
  const all = [...submitted, ...scraped];

  // Sort by date, newest first
  all.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return all;
}

async function loadScrapedDeals(): Promise<DealWithSource[]> {
  try {
    const res = await fetch("/data/deals.json");
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function loadSupabaseDeals(): Promise<DealWithSource[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const { data, error } = await supabase
      .from("deals")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);

    if (error || !data) return [];
    return data as DealWithSource[];
  } catch {
    return [];
  }
}

/**
 * Filter deals client-side.
 */
export function filterDeals(
  deals: DealWithSource[],
  filters: {
    make?: string;
    model?: string;
    province?: string;
    year?: string;
    dealType?: string;
    grade?: string;
  }
): DealWithSource[] {
  return deals.filter((d) => {
    if (filters.make && d.vehicle_make !== filters.make) return false;
    if (
      filters.model &&
      !d.vehicle_model.toLowerCase().includes(filters.model.toLowerCase())
    )
      return false;
    if (filters.province && d.province !== filters.province) return false;
    if (filters.year && d.vehicle_year !== parseInt(filters.year)) return false;
    if (filters.dealType && d.deal_type !== filters.dealType) return false;
    if (filters.grade && d.overall_grade !== filters.grade) return false;
    return true;
  });
}

/**
 * Compute aggregate stats from a deal array.
 */
export function computeStats(deals: DealWithSource[]) {
  const avg = (arr: number[]) =>
    arr.length > 0
      ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10
      : 0;

  const aprs = deals.map((d) => d.apr).filter((v): v is number => v != null);
  const residuals = deals
    .map((d) => d.residual_percent)
    .filter((v): v is number => v != null);
  const discounts = deals
    .map((d) => d.discount_percent)
    .filter((v): v is number => v != null);

  return {
    totalDeals: deals.length,
    avgApr: avg(aprs),
    avgResidual: avg(residuals),
    avgDiscount: avg(discounts),
  };
}
