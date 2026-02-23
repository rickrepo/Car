"use client";

import { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { Deal } from "@/lib/database.types";
import { PROVINCES, VEHICLE_MAKES } from "@/lib/canadian-data";
import DealCard from "@/components/DealCard";

const DEALS_PER_PAGE = 20;

export default function BrowsePage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);

  // Filters
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [province, setProvince] = useState("");
  const [year, setYear] = useState("");
  const [dealType, setDealType] = useState("");
  const [grade, setGrade] = useState("");

  const selectClass =
    "bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500";
  const inputClass =
    "bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-emerald-500";

  useEffect(() => {
    fetchDeals();
  }, [page, make, model, province, year, dealType, grade]);

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

  const totalPages = Math.ceil(totalCount / DEALS_PER_PAGE);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 4 }, (_, i) => currentYear + 1 - i);
  const hasFilters = make || model || province || year || dealType || grade;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Browse Deals</h1>
        <p className="text-gray-400">
          See what Canadians are paying for leases. Filter by vehicle, province,
          or grade.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <select
            className={selectClass}
            value={make}
            onChange={(e) => {
              setMake(e.target.value);
              setPage(0);
            }}
          >
            <option value="">All Makes</option>
            {VEHICLE_MAKES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <input
            type="text"
            className={inputClass}
            placeholder="Model..."
            value={model}
            onChange={(e) => {
              setModel(e.target.value);
              setPage(0);
            }}
          />

          <select
            className={selectClass}
            value={province}
            onChange={(e) => {
              setProvince(e.target.value);
              setPage(0);
            }}
          >
            <option value="">All Provinces</option>
            {PROVINCES.map((p) => (
              <option key={p.code} value={p.code}>
                {p.name}
              </option>
            ))}
          </select>

          <select
            className={selectClass}
            value={year}
            onChange={(e) => {
              setYear(e.target.value);
              setPage(0);
            }}
          >
            <option value="">All Years</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          <select
            className={selectClass}
            value={dealType}
            onChange={(e) => {
              setDealType(e.target.value);
              setPage(0);
            }}
          >
            <option value="">All Types</option>
            <option value="quote">Quotes</option>
            <option value="purchase">Purchases</option>
          </select>

          <select
            className={selectClass}
            value={grade}
            onChange={(e) => {
              setGrade(e.target.value);
              setPage(0);
            }}
          >
            <option value="">All Grades</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="D">D</option>
            <option value="F">F</option>
          </select>
        </div>

        {hasFilters && (
          <div className="mt-3 flex items-center justify-between">
            <p className="text-sm text-gray-400">
              {totalCount} deal{totalCount !== 1 ? "s" : ""} found
            </p>
            <button
              onClick={resetFilters}
              className="text-sm text-emerald-400 hover:text-emerald-300"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 mt-4">Loading deals...</p>
        </div>
      ) : !isSupabaseConfigured() ? (
        <div className="text-center py-16 bg-gray-900 border border-gray-800 rounded-xl">
          <p className="text-gray-400 mb-2">Database not connected</p>
          <p className="text-sm text-gray-500">
            Configure Supabase environment variables to see community deals.
          </p>
        </div>
      ) : deals.length === 0 ? (
        <div className="text-center py-16 bg-gray-900 border border-gray-800 rounded-xl">
          <p className="text-gray-400 mb-2">No deals found</p>
          <p className="text-sm text-gray-500">
            {hasFilters
              ? "Try adjusting your filters."
              : "Be the first to submit a deal!"}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {deals.map((deal) => (
              <DealCard key={deal.id} deal={deal} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:hover:bg-gray-800 text-white rounded-lg text-sm transition-colors"
              >
                Previous
              </button>
              <span className="text-sm text-gray-400">
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:hover:bg-gray-800 text-white rounded-lg text-sm transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Summary stats */}
      {!loading && totalCount > 0 && !hasFilters && (
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Showing {deals.length} of {totalCount} total deals
          </p>
        </div>
      )}
    </div>
  );
}
