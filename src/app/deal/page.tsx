"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Deal } from "@/lib/database.types";
import { getProvinceLabel } from "@/lib/canadian-data";
import { formatCurrency, formatPercent } from "@/lib/lease-math";
import { analyzeLease } from "@/lib/lease-math";
import { LeaseInput } from "@/types/lease";
import { findDealById, findSimilarDeals, DealWithSource } from "@/lib/deals-loader";

const gradeColors: Record<string, string> = {
  A: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  B: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  C: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  D: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  F: "bg-red-500/20 text-red-400 border-red-500/30",
};

function DealDetailContent() {
  const searchParams = useSearchParams();
  const dealId = searchParams.get("id");

  const [deal, setDeal] = useState<DealWithSource | null>(null);
  const [loading, setLoading] = useState(true);
  const [similarDeals, setSimilarDeals] = useState<DealWithSource[]>([]);

  useEffect(() => {
    if (dealId) fetchDeal(dealId);
  }, [dealId]);

  async function fetchDeal(id: string) {
    const d = await findDealById(id);
    if (d) {
      setDeal(d);
      const similar = await findSimilarDeals(
        d.vehicle_make,
        d.vehicle_model,
        id
      );
      setSimilarDeals(similar);
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="inline-block w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 mt-4">Loading deal...</p>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-400 mb-4">Deal not found</p>
        <Link
          href="/browse"
          className="text-emerald-400 hover:text-emerald-300"
        >
          Browse all deals
        </Link>
      </div>
    );
  }

  // Run full analysis for detailed breakdown
  const leaseInput: LeaseInput = {
    msrp: deal.msrp,
    sellingPrice: deal.selling_price,
    paymentFrequency: deal.payment_frequency,
    paymentAmount: deal.payment_amount,
    leaseTerm: deal.term_months,
    residualValue: deal.residual_value,
    downPayment: deal.down_payment,
    otherCredits: deal.other_credits,
    fees: deal.fees || [],
    dueOnDelivery: deal.due_on_delivery,
  };
  const analysis = analyzeLease(leaseInput);

  const gradeClass = gradeColors[deal.overall_grade] || gradeColors.C;
  const date = new Date(deal.created_at).toLocaleDateString("en-CA", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const freqLabel =
    deal.payment_frequency === "biweekly" ? "biweekly" : "month";

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <Link
            href="/browse"
            className="text-sm text-gray-500 hover:text-gray-300 mb-2 inline-block"
          >
            &larr; Back to Browse
          </Link>
          <h1 className="text-3xl font-bold text-white">
            {deal.vehicle_year} {deal.vehicle_make} {deal.vehicle_model}
            {deal.vehicle_trim ? ` ${deal.vehicle_trim}` : ""}
          </h1>
          <p className="text-gray-400 mt-1">
            {getProvinceLabel(deal.province)} &middot;{" "}
            <span className="capitalize">{deal.deal_type}</span> &middot;{" "}
            {date}
            {deal.dealership_name && ` \u00b7 ${deal.dealership_name}`}
          </p>
        </div>
        <div
          className={`w-16 h-16 rounded-xl border-2 flex items-center justify-center text-2xl font-bold ${gradeClass}`}
        >
          {deal.overall_grade}
        </div>
      </div>

      {/* Key Numbers */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <NumberCard
          label="MSRP"
          value={formatCurrency(deal.msrp)}
        />
        <NumberCard
          label="Selling Price"
          value={formatCurrency(deal.selling_price)}
          subtext={
            deal.discount_percent > 0
              ? `${formatPercent(deal.discount_percent)} below MSRP`
              : deal.discount_percent < 0
                ? `${formatPercent(Math.abs(deal.discount_percent))} above MSRP`
                : "At MSRP"
          }
          subtextColor={deal.discount_percent > 0 ? "text-emerald-400" : deal.discount_percent < 0 ? "text-red-400" : "text-gray-500"}
        />
        <NumberCard
          label="Payment"
          value={`${formatCurrency(deal.payment_amount)}/${freqLabel}`}
        />
        <NumberCard
          label="Term"
          value={`${deal.term_months} months`}
        />
      </div>

      {/* Analysis Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm text-gray-500 mb-3">Hidden Numbers</h3>
          <div className="space-y-3">
            <AnalysisRow label="APR (reverse-engineered)" value={formatPercent(deal.apr)} />
            <AnalysisRow
              label="Money Factor"
              value={deal.money_factor?.toFixed(6) || "N/A"}
            />
            <AnalysisRow
              label="Residual %"
              value={formatPercent(deal.residual_percent)}
            />
            <AnalysisRow
              label="Residual Value"
              value={formatCurrency(deal.residual_value)}
            />
            <AnalysisRow
              label="1% Rule"
              value={formatPercent(deal.one_percent_rule)}
            />
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm text-gray-500 mb-3">Cost Breakdown</h3>
          <div className="space-y-3">
            <AnalysisRow
              label="Gross Cap Cost"
              value={formatCurrency(analysis.grossCapCost)}
            />
            <AnalysisRow
              label="Adjusted Cap Cost"
              value={formatCurrency(analysis.adjustedCapCost)}
            />
            <AnalysisRow
              label="Total Lease Cost"
              value={formatCurrency(analysis.totalLeaseCost)}
            />
            <AnalysisRow
              label="Effective Monthly Cost"
              value={`${formatCurrency(analysis.effectiveMonthlyCost)}/mo`}
            />
            {deal.down_payment > 0 && (
              <AnalysisRow
                label="Down Payment"
                value={formatCurrency(deal.down_payment)}
              />
            )}
          </div>
        </div>
      </div>

      {/* Component Grades */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-8">
        <h3 className="text-sm text-gray-500 mb-4">Component Grades</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <GradeCard
            label="Money Factor"
            grade={analysis.moneyFactorGrade.letter}
            detail={analysis.moneyFactorGrade.label}
          />
          <GradeCard
            label="Selling Price"
            grade={analysis.sellingPriceGrade.letter}
            detail={analysis.sellingPriceGrade.label}
          />
          <GradeCard
            label="Residual"
            grade={analysis.residualGrade.letter}
            detail={analysis.residualGrade.label}
          />
          <GradeCard
            label="1% Rule"
            grade={analysis.onePercentGrade.letter}
            detail={analysis.onePercentGrade.label}
          />
        </div>
      </div>

      {/* Fee Breakdown */}
      {analysis.feeAnalysis.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-8">
          <h3 className="text-sm text-gray-500 mb-4">Fee Breakdown</h3>
          <div className="space-y-2">
            {analysis.feeAnalysis.map((fee, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      fee.legitimacy === "legitimate"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : fee.legitimacy === "negotiable"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {fee.legitimacy}
                  </span>
                  <span className="text-white text-sm">{fee.name}</span>
                </div>
                <span className="text-gray-300 text-sm">
                  {formatCurrency(fee.amount)}
                </span>
              </div>
            ))}
          </div>
          {deal.total_junk_fees > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-800">
              <span className="text-red-400 text-sm font-medium">
                Total Junk Fees: {formatCurrency(deal.total_junk_fees)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Negotiation Tips */}
      {analysis.tips.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-8">
          <h3 className="text-sm text-gray-500 mb-4">Negotiation Tips</h3>
          <div className="space-y-3">
            {analysis.tips.map((tip, i) => (
              <div
                key={i}
                className="bg-gray-800 rounded-lg p-4"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded ${
                      tip.priority === "high"
                        ? "bg-red-500/20 text-red-400"
                        : tip.priority === "medium"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-gray-700 text-gray-400"
                    }`}
                  >
                    {tip.priority}
                  </span>
                  <span className="text-white text-sm font-medium">
                    {tip.title}
                  </span>
                </div>
                <p className="text-gray-400 text-sm">{tip.detail}</p>
                {tip.potentialSavings > 0 && (
                  <p className="text-emerald-400 text-xs mt-1">
                    Potential savings: {formatCurrency(tip.potentialSavings)}/mo
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {deal.notes && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-8">
          <h3 className="text-sm text-gray-500 mb-2">Notes from Submitter</h3>
          <p className="text-gray-300 text-sm">{deal.notes}</p>
        </div>
      )}

      {/* Similar Deals */}
      {similarDeals.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">
            Similar Deals ({deal.vehicle_make} {deal.vehicle_model})
          </h3>
          <div className="space-y-3">
            {similarDeals.map((similar) => {
              const sDate = new Date(similar.created_at).toLocaleDateString(
                "en-CA",
                { month: "short", year: "numeric" }
              );
              const sFreq =
                similar.payment_frequency === "biweekly" ? "biweekly" : "mo";
              return (
                <a
                  key={similar.id}
                  href={`/deal?id=${similar.id}`}
                  className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 hover:border-gray-600 transition-colors"
                >
                  <div>
                    <span className="text-white text-sm">
                      {similar.vehicle_year} {similar.vehicle_make}{" "}
                      {similar.vehicle_model}
                    </span>
                    <span className="text-gray-500 text-xs ml-2">
                      {getProvinceLabel(similar.province)} &middot; {sDate}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-gray-300 text-sm">
                      {formatCurrency(similar.payment_amount)}/{sFreq}
                    </span>
                    <span className="text-gray-400 text-xs">
                      {formatPercent(similar.apr)} APR
                    </span>
                    <span
                      className={`font-bold text-sm ${
                        gradeColors[similar.overall_grade]
                          ? gradeColors[similar.overall_grade].split(" ")[1]
                          : "text-gray-400"
                      }`}
                    >
                      {similar.overall_grade}
                    </span>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

export default function DealPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Suspense
        fallback={
          <div className="text-center py-16">
            <div className="inline-block w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400 mt-4">Loading...</p>
          </div>
        }
      >
        <DealDetailContent />
      </Suspense>
    </div>
  );
}

function NumberCard({
  label,
  value,
  subtext,
  subtextColor,
}: {
  label: string;
  value: string;
  subtext?: string;
  subtextColor?: string;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-lg font-bold text-white">{value}</p>
      {subtext && (
        <p className={`text-xs mt-1 ${subtextColor || "text-gray-500"}`}>
          {subtext}
        </p>
      )}
    </div>
  );
}

function AnalysisRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-400 text-sm">{label}</span>
      <span className="text-white text-sm font-medium">{value}</span>
    </div>
  );
}

function GradeCard({
  label,
  grade,
  detail,
}: {
  label: string;
  grade: string;
  detail: string;
}) {
  const gradeClass = gradeColors[grade] || gradeColors.C;
  return (
    <div className="text-center">
      <div
        className={`w-10 h-10 rounded-lg border flex items-center justify-center text-lg font-bold mx-auto mb-2 ${gradeClass}`}
      >
        {grade}
      </div>
      <p className="text-white text-sm font-medium">{label}</p>
      <p className="text-gray-500 text-xs">{detail}</p>
    </div>
  );
}
