"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { Deal } from "@/lib/database.types";
import { PROVINCES, VEHICLE_MAKES } from "@/lib/canadian-data";
import { formatCurrency, formatPercent } from "@/lib/lease-math";

const DEALS_PER_PAGE = 25;

const gradeColor: Record<string, string> = {
  A: "text-emerald-400",
  B: "text-blue-400",
  C: "text-yellow-400",
  D: "text-orange-400",
  F: "text-red-400",
};

export default function HomePage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [stats, setStats] = useState({
    totalDeals: 0,
    avgApr: 0,
    avgResidual: 0,
    avgDiscount: 0,
  });

  // Filters
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [province, setProvince] = useState("");
  const [year, setYear] = useState("");
  const [dealType, setDealType] = useState("");
  const [grade, setGrade] = useState("");

  const selectClass =
    "bg-gray-900 border border-gray-800 rounded px-2.5 py-1.5 text-white text-sm focus:outline-none focus:border-emerald-500";
  const inputClass =
    "bg-gray-900 border border-gray-800 rounded px-2.5 py-1.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-emerald-500";

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 4 }, (_, i) => currentYear + 1 - i);
  const hasFilters = make || model || province || year || dealType || grade;
  const totalPages = Math.ceil(totalCount / DEALS_PER_PAGE);

  useEffect(() => {
    fetchDeals();
  }, [page, make, model, province, year, dealType, grade]);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    if (!isSupabaseConfigured()) return;

    const { data } = await supabase
      .from("deals")
      .select("apr, residual_percent, discount_percent");

    if (data && data.length > 0) {
      const avg = (arr: number[]) =>
        arr.length > 0
          ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10
          : 0;

      setStats({
        totalDeals: data.length,
        avgApr: avg(data.map((d) => d.apr).filter((v): v is number => v != null)),
        avgResidual: avg(
          data.map((d) => d.residual_percent).filter((v): v is number => v != null)
        ),
        avgDiscount: avg(
          data.map((d) => d.discount_percent).filter((v): v is number => v != null)
        ),
      });
    }
  }

  async function fetchDeals() {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    setLoading(true);

    let query = supabase
      .from("deals")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(page * DEALS_PER_PAGE, (page + 1) * DEALS_PER_PAGE - 1);

    if (make) query = query.eq("vehicle_make", make);
    if (model) query = query.ilike("vehicle_model", `%${model}%`);
    if (province) query = query.eq("province", province);
    if (year) query = query.eq("vehicle_year", parseInt(year));
    if (dealType) query = query.eq("deal_type", dealType);
    if (grade) query = query.eq("overall_grade", grade);

    const { data, count, error } = await query;

    if (!error && data) {
      setDeals(data as Deal[]);
      setTotalCount(count || 0);
    }
    setLoading(false);
  }

  function resetFilters() {
    setMake("");
    setModel("");
    setProvince("");
    setYear("");
    setDealType("");
    setGrade("");
    setPage(0);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-5">
      {/* Compact header with inline stats */}
      <div className="flex items-baseline justify-between mb-4">
        <div className="flex items-baseline gap-4">
          <h1 className="text-xl font-bold text-white">
            Canadian Lease Deals
          </h1>
          {stats.totalDeals > 0 && (
            <div className="flex gap-4 text-xs text-gray-500">
              <span>
                <span className="text-white font-medium">
                  {stats.totalDeals.toLocaleString()}
                </span>{" "}
                deals
              </span>
              <span>
                avg{" "}
                <span className="text-white font-medium">{stats.avgApr}%</span>{" "}
                APR
              </span>
              <span>
                avg{" "}
                <span className="text-white font-medium">
                  {stats.avgResidual}%
                </span>{" "}
                residual
              </span>
              <span>
                avg{" "}
                <span className="text-white font-medium">
                  {stats.avgDiscount}%
                </span>{" "}
                off MSRP
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <select
          className={selectClass}
          value={make}
          onChange={(e) => { setMake(e.target.value); setPage(0); }}
        >
          <option value="">Make</option>
          {VEHICLE_MAKES.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        <input
          type="text"
          className={`${inputClass} w-28`}
          placeholder="Model"
          value={model}
          onChange={(e) => { setModel(e.target.value); setPage(0); }}
        />

        <select
          className={selectClass}
          value={province}
          onChange={(e) => { setProvince(e.target.value); setPage(0); }}
        >
          <option value="">Province</option>
          {PROVINCES.map((p) => (
            <option key={p.code} value={p.code}>{p.code}</option>
          ))}
        </select>

        <select
          className={selectClass}
          value={year}
          onChange={(e) => { setYear(e.target.value); setPage(0); }}
        >
          <option value="">Year</option>
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        <select
          className={selectClass}
          value={dealType}
          onChange={(e) => { setDealType(e.target.value); setPage(0); }}
        >
          <option value="">Type</option>
          <option value="quote">Quote</option>
          <option value="purchase">Purchase</option>
        </select>

        <select
          className={selectClass}
          value={grade}
          onChange={(e) => { setGrade(e.target.value); setPage(0); }}
        >
          <option value="">Grade</option>
          <option value="A">A</option>
          <option value="B">B</option>
          <option value="C">C</option>
          <option value="D">D</option>
          <option value="F">F</option>
        </select>

        {hasFilters && (
          <>
            <span className="text-xs text-gray-500 ml-1">
              {totalCount} result{totalCount !== 1 ? "s" : ""}
            </span>
            <button
              onClick={resetFilters}
              className="text-xs text-emerald-400 hover:text-emerald-300 ml-1"
            >
              Clear
            </button>
          </>
        )}
      </div>

      {/* Data table */}
      {loading ? (
        <div className="text-center py-20">
          <div className="inline-block w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !isSupabaseConfigured() ? (
        <div className="text-center py-20">
          <p className="text-gray-500 text-sm mb-1">Database not connected</p>
          <p className="text-gray-600 text-xs">
            Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to see deals.
          </p>
        </div>
      ) : deals.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500 text-sm mb-2">
            {hasFilters ? "No deals match your filters." : "No deals yet."}
          </p>
          {!hasFilters && (
            <Link
              href="/submit"
              className="text-emerald-400 hover:text-emerald-300 text-sm"
            >
              Be the first to submit a deal
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="border border-gray-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-900/80 text-gray-500 text-xs uppercase tracking-wider">
                    <th className="text-left py-2.5 px-3 font-medium">Vehicle</th>
                    <th className="text-left py-2.5 px-3 font-medium hidden sm:table-cell">Province</th>
                    <th className="text-left py-2.5 px-3 font-medium hidden md:table-cell">Type</th>
                    <th className="text-right py-2.5 px-3 font-medium">MSRP</th>
                    <th className="text-right py-2.5 px-3 font-medium">Payment</th>
                    <th className="text-right py-2.5 px-3 font-medium">APR</th>
                    <th className="text-right py-2.5 px-3 font-medium hidden sm:table-cell">Residual</th>
                    <th className="text-right py-2.5 px-3 font-medium hidden lg:table-cell">Discount</th>
                    <th className="text-center py-2.5 px-3 font-medium">Grade</th>
                    <th className="text-right py-2.5 px-3 font-medium hidden md:table-cell">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {deals.map((deal) => {
                    const freqLabel =
                      deal.payment_frequency === "biweekly" ? "/bw" : "/mo";
                    const date = new Date(deal.created_at).toLocaleDateString(
                      "en-CA",
                      { month: "short", day: "numeric" }
                    );

                    return (
                      <tr
                        key={deal.id}
                        className="hover:bg-gray-900/50 transition-colors cursor-pointer"
                        onClick={() =>
                          (window.location.href = `/deal?id=${deal.id}`)
                        }
                      >
                        <td className="py-2.5 px-3">
                          <div className="text-white font-medium">
                            {deal.vehicle_year} {deal.vehicle_make}{" "}
                            {deal.vehicle_model}
                          </div>
                          {deal.vehicle_trim && (
                            <div className="text-gray-600 text-xs">
                              {deal.vehicle_trim}
                            </div>
                          )}
                          <div className="text-gray-600 text-xs sm:hidden">
                            {deal.province} &middot;{" "}
                            <span className="capitalize">{deal.deal_type}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-gray-400 hidden sm:table-cell">
                          {deal.province}
                        </td>
                        <td className="py-2.5 px-3 hidden md:table-cell">
                          <span
                            className={`text-xs px-1.5 py-0.5 rounded ${
                              deal.deal_type === "purchase"
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-gray-800 text-gray-400"
                            }`}
                          >
                            {deal.deal_type === "purchase" ? "Signed" : "Quote"}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right text-gray-300 tabular-nums">
                          {formatCurrency(deal.msrp)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-white font-medium tabular-nums">
                          {formatCurrency(deal.payment_amount)}
                          <span className="text-gray-500 font-normal">
                            {freqLabel}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums">
                          <span
                            className={
                              deal.apr <= 3
                                ? "text-emerald-400"
                                : deal.apr <= 5
                                  ? "text-yellow-400"
                                  : "text-red-400"
                            }
                          >
                            {formatPercent(deal.apr)}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right text-gray-300 tabular-nums hidden sm:table-cell">
                          {formatPercent(deal.residual_percent)}
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums hidden lg:table-cell">
                          {deal.discount_percent > 0 ? (
                            <span className="text-emerald-400">
                              {formatPercent(deal.discount_percent)}
                            </span>
                          ) : deal.discount_percent < 0 ? (
                            <span className="text-red-400">
                              +{formatPercent(Math.abs(deal.discount_percent))}
                            </span>
                          ) : (
                            <span className="text-gray-500">0%</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`font-bold ${gradeColor[deal.overall_grade] || "text-gray-400"}`}
                          >
                            {deal.overall_grade}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right text-gray-500 text-xs hidden md:table-cell">
                          {date}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <p className="text-xs text-gray-500">
              {page * DEALS_PER_PAGE + 1}&ndash;
              {Math.min((page + 1) * DEALS_PER_PAGE, totalCount)} of{" "}
              {totalCount}
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="px-3 py-1 bg-gray-900 border border-gray-800 hover:border-gray-700 disabled:opacity-30 text-white rounded text-xs transition-colors"
                >
                  Prev
                </button>
                <span className="text-xs text-gray-500">
                  {page + 1} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-3 py-1 bg-gray-900 border border-gray-800 hover:border-gray-700 disabled:opacity-30 text-white rounded text-xs transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
