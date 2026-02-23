"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PROVINCES, VEHICLE_MAKES } from "@/lib/canadian-data";
import { formatCurrency, formatPercent } from "@/lib/lease-math";
import {
  DealWithSource,
  loadAllDeals,
  filterDeals,
  computeStats,
} from "@/lib/deals-loader";

const DEALS_PER_PAGE = 25;

const gradeColor: Record<string, string> = {
  A: "text-emerald-400",
  B: "text-blue-400",
  C: "text-yellow-400",
  D: "text-orange-400",
  F: "text-red-400",
};

export default function HomePage() {
  const [allDeals, setAllDeals] = useState<DealWithSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

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

  // Load all deals once on mount
  useEffect(() => {
    loadAllDeals().then((deals) => {
      setAllDeals(deals);
      setLoading(false);
    });
  }, []);

  // Apply filters client-side
  const filtered = filterDeals(allDeals, {
    make,
    model,
    province,
    year,
    dealType,
    grade,
  });
  const stats = computeStats(allDeals);
  const totalCount = filtered.length;
  const totalPages = Math.ceil(totalCount / DEALS_PER_PAGE);
  const pageDeals = filtered.slice(
    page * DEALS_PER_PAGE,
    (page + 1) * DEALS_PER_PAGE
  );

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
      <div className="flex items-baseline justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-baseline gap-4 flex-wrap">
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
      ) : pageDeals.length === 0 ? (
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
                  {pageDeals.map((deal) => {
                    const freqLabel =
                      deal.payment_frequency === "biweekly" ? "/bw" : "/mo";
                    const date = new Date(deal.created_at).toLocaleDateString(
                      "en-CA",
                      { month: "short", day: "numeric" }
                    );
                    const detailUrl = deal.source_url || `/deal?id=${deal.id}`;

                    return (
                      <tr
                        key={deal.id}
                        className="hover:bg-gray-900/50 transition-colors cursor-pointer"
                        onClick={() =>
                          (window.location.href = detailUrl)
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
                          {deal.source_platform && (
                            <div className="text-gray-700 text-xs">
                              via {deal.source_platform}
                            </div>
                          )}
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
