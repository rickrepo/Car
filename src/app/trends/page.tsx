"use client";

import { useState, useEffect } from "react";
import { Deal } from "@/lib/database.types";
import { VEHICLE_MAKES, PROVINCES } from "@/lib/canadian-data";
import { loadAllDeals, filterDeals } from "@/lib/deals-loader";
import {
  AprTrendChart,
  ResidualTrendChart,
  DiscountDistributionChart,
  DealVolumeTrendChart,
} from "@/components/TrendCharts";

interface MonthlyTrend {
  month: string;
  avgApr: number;
  avgResidual: number;
  avgDiscount: number;
  count: number;
}

interface DiscountBucket {
  range: string;
  count: number;
}

interface TopDeal {
  id: string;
  vehicle: string;
  province: string;
  grade: string;
  apr: number;
}

export default function TrendsPage() {
  const [loading, setLoading] = useState(true);
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrend[]>([]);
  const [discountDist, setDiscountDist] = useState<DiscountBucket[]>([]);
  const [topDeals, setTopDeals] = useState<TopDeal[]>([]);
  const [stats, setStats] = useState({
    totalDeals: 0,
    avgApr: 0,
    avgResidual: 0,
    avgDiscount: 0,
  });

  // Filters
  const [make, setMake] = useState("");
  const [province, setProvince] = useState("");

  const selectClass =
    "bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500";

  useEffect(() => {
    fetchTrends();
  }, [make, province]);

  async function fetchTrends() {
    setLoading(true);

    const allDeals = await loadAllDeals();
    const deals = filterDeals(allDeals, {
      make: make || undefined,
      province: province || undefined,
    });

    if (deals.length === 0) {
      setMonthlyTrends([]);
      setDiscountDist([]);
      setTopDeals([]);
      setStats({ totalDeals: 0, avgApr: 0, avgResidual: 0, avgDiscount: 0 });
      setLoading(false);
      return;
    }

    // Compute monthly trends
    const byMonth = new Map<
      string,
      { aprs: number[]; residuals: number[]; discounts: number[] }
    >();

    for (const deal of deals) {
      const date = new Date(deal.created_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (!byMonth.has(key)) {
        byMonth.set(key, { aprs: [], residuals: [], discounts: [] });
      }
      const bucket = byMonth.get(key)!;
      if (deal.apr != null) bucket.aprs.push(deal.apr);
      if (deal.residual_percent != null)
        bucket.residuals.push(deal.residual_percent);
      if (deal.discount_percent != null)
        bucket.discounts.push(deal.discount_percent);
    }

    const trends: MonthlyTrend[] = [];
    const sortedKeys = Array.from(byMonth.keys()).sort();
    for (const key of sortedKeys) {
      const bucket = byMonth.get(key)!;
      const avg = (arr: number[]) =>
        arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

      const [yearStr, monthStr] = key.split("-");
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const label = `${monthNames[parseInt(monthStr) - 1]} ${yearStr.slice(2)}`;

      trends.push({
        month: label,
        avgApr: Math.round(avg(bucket.aprs) * 10) / 10,
        avgResidual: Math.round(avg(bucket.residuals) * 10) / 10,
        avgDiscount: Math.round(avg(bucket.discounts) * 10) / 10,
        count: bucket.aprs.length,
      });
    }

    // Discount distribution
    const discountBuckets: Record<string, number> = {
      "< 0%": 0,
      "0-2%": 0,
      "2-4%": 0,
      "4-6%": 0,
      "6-8%": 0,
      "8%+": 0,
    };
    for (const deal of deals) {
      const d = deal.discount_percent ?? 0;
      if (d < 0) discountBuckets["< 0%"]++;
      else if (d < 2) discountBuckets["0-2%"]++;
      else if (d < 4) discountBuckets["2-4%"]++;
      else if (d < 6) discountBuckets["4-6%"]++;
      else if (d < 8) discountBuckets["6-8%"]++;
      else discountBuckets["8%+"]++;
    }
    const dist = Object.entries(discountBuckets).map(([range, count]) => ({
      range,
      count,
    }));

    // Top deals this month
    const now = new Date();
    const thisMonth = deals
      .filter((d) => {
        const date = new Date(d.created_at);
        return (
          date.getMonth() === now.getMonth() &&
          date.getFullYear() === now.getFullYear()
        );
      })
      .sort((a, b) => {
        const gradeOrder: Record<string, number> = {
          A: 5,
          B: 4,
          C: 3,
          D: 2,
          F: 1,
        };
        return (gradeOrder[b.overall_grade] || 0) - (gradeOrder[a.overall_grade] || 0);
      })
      .slice(0, 5);

    const top = thisMonth.map((d) => ({
      id: d.id,
      vehicle: `${d.vehicle_year} ${d.vehicle_make} ${d.vehicle_model}`,
      province: d.province,
      grade: d.overall_grade,
      apr: d.apr,
    }));

    // Summary stats
    const allAprs = deals.map((d) => d.apr).filter((a): a is number => a != null);
    const allResiduals = deals
      .map((d) => d.residual_percent)
      .filter((r): r is number => r != null);
    const allDiscounts = deals
      .map((d) => d.discount_percent)
      .filter((d): d is number => d != null);

    const avg = (arr: number[]) =>
      arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

    setMonthlyTrends(trends);
    setDiscountDist(dist);
    setTopDeals(top);
    setStats({
      totalDeals: deals.length,
      avgApr: Math.round(avg(allAprs) * 10) / 10,
      avgResidual: Math.round(avg(allResiduals) * 10) / 10,
      avgDiscount: Math.round(avg(allDiscounts) * 10) / 10,
    });
    setLoading(false);
  }

  const gradeColors: Record<string, string> = {
    A: "text-emerald-400",
    B: "text-blue-400",
    C: "text-yellow-400",
    D: "text-orange-400",
    F: "text-red-400",
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Market Trends</h1>
        <p className="text-gray-400">
          Track lease pricing trends across Canada from community-submitted
          deals.
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <select
          className={selectClass}
          value={make}
          onChange={(e) => setMake(e.target.value)}
        >
          <option value="">All Makes</option>
          {VEHICLE_MAKES.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <select
          className={selectClass}
          value={province}
          onChange={(e) => setProvince(e.target.value)}
        >
          <option value="">All Provinces</option>
          {PROVINCES.map((p) => (
            <option key={p.code} value={p.code}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 mt-4">Loading trends...</p>
        </div>
      ) : stats.totalDeals === 0 ? (
        <div className="text-center py-16 bg-gray-900 border border-gray-800 rounded-xl">
          <p className="text-gray-400 mb-2">No data yet</p>
          <p className="text-sm text-gray-500">
            Deals will appear here once the scraper collects data from Reddit
            and Leasehackr.
          </p>
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <StatCard label="Total Deals" value={stats.totalDeals.toString()} />
            <StatCard label="Avg APR" value={`${stats.avgApr}%`} />
            <StatCard label="Avg Residual" value={`${stats.avgResidual}%`} />
            <StatCard label="Avg Discount" value={`${stats.avgDiscount}%`} />
          </div>

          {/* Charts */}
          <div className="space-y-6">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <AprTrendChart data={monthlyTrends} />
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <ResidualTrendChart data={monthlyTrends} />
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <DiscountDistributionChart data={discountDist} />
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <DealVolumeTrendChart data={monthlyTrends} />
            </div>
          </div>

          {/* Top Deals */}
          {topDeals.length > 0 && (
            <div className="mt-8 bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h3 className="text-white font-semibold mb-4">
                Top Deals This Month
              </h3>
              <div className="space-y-3">
                {topDeals.map((deal, i) => (
                  <a
                    key={deal.id}
                    href={`/deal?id=${deal.id}`}
                    className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-3 hover:bg-gray-750 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500 text-sm font-medium w-6">
                        {i + 1}.
                      </span>
                      <span className="text-white text-sm">{deal.vehicle}</span>
                      <span className="text-gray-500 text-xs">
                        {deal.province}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400 text-xs">
                        {deal.apr}% APR
                      </span>
                      <span
                        className={`font-bold ${gradeColors[deal.grade] || "text-gray-400"}`}
                      >
                        {deal.grade}
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}
