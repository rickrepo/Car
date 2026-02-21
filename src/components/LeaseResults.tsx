"use client";

import { LeaseAnalysis, GradeLetter } from "@/types/lease";
import {
  formatCurrency,
  formatCurrencyExact,
  formatPercent,
} from "@/lib/lease-math";

interface Props {
  analysis: LeaseAnalysis;
  onReset: () => void;
}

const GRADE_COLORS: Record<GradeLetter, string> = {
  A: "text-emerald-400 border-emerald-400 bg-emerald-400/10",
  B: "text-lime-400 border-lime-400 bg-lime-400/10",
  C: "text-yellow-400 border-yellow-400 bg-yellow-400/10",
  D: "text-orange-400 border-orange-400 bg-orange-400/10",
  F: "text-red-400 border-red-400 bg-red-400/10",
};

const GRADE_BG: Record<GradeLetter, string> = {
  A: "from-emerald-500/20 to-emerald-500/5",
  B: "from-lime-500/20 to-lime-500/5",
  C: "from-yellow-500/20 to-yellow-500/5",
  D: "from-orange-500/20 to-orange-500/5",
  F: "from-red-500/20 to-red-500/5",
};

const LEGITIMACY_STYLES = {
  legitimate: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
  negotiable: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
  junk: "text-red-400 bg-red-400/10 border-red-400/30",
};

const LEGITIMACY_LABELS = {
  legitimate: "Legitimate",
  negotiable: "Negotiable",
  junk: "Junk Fee",
};

const PRIORITY_STYLES = {
  high: "border-red-500/40 bg-red-500/5",
  medium: "border-yellow-500/40 bg-yellow-500/5",
  low: "border-gray-600 bg-gray-800",
};

function GradeBadge({
  letter,
  size = "small",
}: {
  letter: GradeLetter;
  size?: "large" | "small";
}) {
  const sizeClasses =
    size === "large"
      ? "w-20 h-20 text-4xl border-4"
      : "w-10 h-10 text-lg border-2";
  return (
    <div
      className={`${sizeClasses} ${GRADE_COLORS[letter]} rounded-full flex items-center justify-center font-black`}
    >
      {letter}
    </div>
  );
}

export default function LeaseResults({ analysis, onReset }: Props) {
  return (
    <div className="space-y-8">
      {/* Overall Grade Hero */}
      <div
        className={`bg-gradient-to-br ${GRADE_BG[analysis.overallGrade.letter]} rounded-2xl p-8 text-center border border-gray-800`}
      >
        <p className="text-sm text-gray-400 uppercase tracking-wide mb-3">
          Overall Deal Grade
        </p>
        <div className="flex justify-center mb-4">
          <GradeBadge letter={analysis.overallGrade.letter} size="large" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-1">
          {analysis.overallGrade.label}
        </h2>
        <p className="text-gray-400 max-w-lg mx-auto">
          {analysis.overallGrade.description}
        </p>
      </div>

      {/* Potential Savings */}
      {analysis.potentialSavingsTotal > 0 && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6 text-center">
          <p className="text-sm text-emerald-300 uppercase tracking-wide mb-1">
            Potential Savings If You Negotiate
          </p>
          <p className="text-3xl font-black text-emerald-400">
            {formatCurrency(analysis.potentialSavingsTotal)}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            ({formatCurrencyExact(analysis.potentialSavingsMonthly)}/month over
            the life of the lease)
          </p>
        </div>
      )}

      {/* The Hidden Numbers */}
      <section>
        <h3 className="text-lg font-semibold text-white mb-4">
          The Numbers They Don&apos;t Want You to See
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            label="Hidden APR"
            value={formatPercent(analysis.apr)}
            grade={analysis.moneyFactorGrade}
          />
          <StatCard
            label="Money Factor"
            value={analysis.moneyFactor.toFixed(6)}
            sublabel="(the dealer's secret)"
          />
          <StatCard
            label="1% Rule"
            value={formatPercent(analysis.onePercentRule)}
            grade={analysis.onePercentGrade}
          />
          <StatCard
            label="Price vs MSRP"
            value={
              analysis.sellingPriceDiscount >= 0
                ? `-${formatPercent(analysis.sellingPriceDiscount)}`
                : `+${formatPercent(Math.abs(analysis.sellingPriceDiscount))}`
            }
            grade={analysis.sellingPriceGrade}
          />
        </div>
      </section>

      {/* Payment Breakdown */}
      <section>
        <h3 className="text-lg font-semibold text-white mb-4">
          Payment Breakdown
        </h3>
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <Row
            label="Depreciation (value you use)"
            value={formatCurrencyExact(analysis.depreciationPayment)}
            sublabel="/month"
          />
          <Row
            label="Rent Charge (finance cost)"
            value={formatCurrencyExact(analysis.rentCharge)}
            sublabel="/month"
            highlight={analysis.rentCharge > analysis.depreciationPayment * 0.3}
          />
          <Row
            label="Calculated Payment"
            value={formatCurrencyExact(analysis.calculatedPayment)}
            sublabel="/month"
            bold
          />
          {analysis.hasPaymentDiscrepancy && (
            <div className="px-4 py-3 bg-red-500/10 border-t border-red-500/30">
              <p className="text-sm text-red-400">
                Payment discrepancy of{" "}
                {formatCurrencyExact(analysis.paymentDifference)} detected.
                The dealer&apos;s quoted payment doesn&apos;t match the math — ask them
                to explain the difference.
              </p>
            </div>
          )}
          <div className="border-t border-gray-700" />
          <Row
            label="Total Lease Cost"
            value={formatCurrency(analysis.totalLeaseCost)}
            sublabel="(payments + due at signing)"
          />
          <Row
            label="Effective Monthly Cost"
            value={formatCurrencyExact(analysis.effectiveMonthlyCost)}
            sublabel="/month (true cost)"
            bold
          />
        </div>
      </section>

      {/* Component Grades */}
      <section>
        <h3 className="text-lg font-semibold text-white mb-4">
          Grade Breakdown
        </h3>
        <div className="space-y-3">
          <GradeRow
            label="Interest Rate (APR)"
            grade={analysis.moneyFactorGrade}
            detail={`${formatPercent(analysis.apr)} APR (Money Factor: ${analysis.moneyFactor.toFixed(6)})`}
          />
          <GradeRow
            label="Selling Price"
            grade={analysis.sellingPriceGrade}
            detail={analysis.sellingPriceGrade.description}
          />
          <GradeRow
            label="Residual Value"
            grade={analysis.residualGrade}
            detail={`${formatPercent(analysis.residualPercent)} of MSRP — ${analysis.residualGrade.description.toLowerCase()}`}
          />
          <GradeRow
            label="1% Rule"
            grade={analysis.onePercentGrade}
            detail={`${formatPercent(analysis.onePercentRule)} of MSRP (target: ≤ 1.0%)`}
          />
        </div>
      </section>

      {/* Fee Analysis */}
      {analysis.feeAnalysis.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold text-white mb-4">
            Fee Analysis
          </h3>
          {analysis.totalJunkFees > 0 && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 mb-3">
              <p className="text-sm text-red-400 font-semibold">
                {formatCurrency(analysis.totalJunkFees)} in junk fees detected
              </p>
            </div>
          )}
          <div className="space-y-2">
            {analysis.feeAnalysis.map((fee, i) => (
              <div
                key={i}
                className="bg-gray-900 border border-gray-800 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-white">{fee.name}</span>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full border ${LEGITIMACY_STYLES[fee.legitimacy]}`}
                    >
                      {LEGITIMACY_LABELS[fee.legitimacy]}
                    </span>
                    <span className="text-white font-semibold">
                      {formatCurrency(fee.amount)}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-400">{fee.explanation}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Negotiation Tips */}
      {analysis.tips.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold text-white mb-4">
            What to Negotiate
          </h3>
          <div className="space-y-3">
            {analysis.tips.map((tip, i) => (
              <div
                key={i}
                className={`border rounded-xl p-4 ${PRIORITY_STYLES[tip.priority]}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-xs uppercase font-bold tracking-wider ${
                          tip.priority === "high"
                            ? "text-red-400"
                            : tip.priority === "medium"
                              ? "text-yellow-400"
                              : "text-gray-400"
                        }`}
                      >
                        {tip.priority} priority
                      </span>
                    </div>
                    <h4 className="text-white font-semibold mb-1">
                      {tip.title}
                    </h4>
                    <p className="text-sm text-gray-400">{tip.detail}</p>
                  </div>
                  {tip.potentialSavings > 0 && (
                    <div className="text-right shrink-0">
                      <p className="text-xs text-gray-500">Save</p>
                      <p className="text-emerald-400 font-bold">
                        {formatCurrency(tip.potentialSavings)}/mo
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Reset */}
      <button
        onClick={onReset}
        className="w-full py-3 px-6 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
      >
        Analyze Another Deal
      </button>
    </div>
  );
}

function StatCard({
  label,
  value,
  sublabel,
  grade,
}: {
  label: string;
  value: string;
  sublabel?: string;
  grade?: { letter: GradeLetter };
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
        {label}
      </p>
      <div className="flex items-center gap-2">
        <p className="text-xl font-bold text-white">{value}</p>
        {grade && <GradeBadge letter={grade.letter} size="small" />}
      </div>
      {sublabel && <p className="text-xs text-gray-500 mt-1">{sublabel}</p>}
    </div>
  );
}

function Row({
  label,
  value,
  sublabel,
  bold,
  highlight,
}: {
  label: string;
  value: string;
  sublabel?: string;
  bold?: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between px-4 py-3 ${highlight ? "bg-orange-500/5" : ""}`}
    >
      <span
        className={`text-sm ${bold ? "text-white font-semibold" : "text-gray-400"}`}
      >
        {label}
      </span>
      <span className="text-right">
        <span
          className={`${bold ? "text-white font-semibold" : "text-white"} ${highlight ? "text-orange-400" : ""}`}
        >
          {value}
        </span>
        {sublabel && (
          <span className="text-xs text-gray-500 ml-1">{sublabel}</span>
        )}
      </span>
    </div>
  );
}

function GradeRow({
  label,
  grade,
  detail,
}: {
  label: string;
  grade: { letter: GradeLetter; label: string };
  detail: string;
}) {
  return (
    <div className="flex items-center gap-4 bg-gray-900 border border-gray-800 rounded-xl p-4">
      <GradeBadge letter={grade.letter} size="small" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-white font-medium">{label}</span>
          <span className="text-xs text-gray-500">— {grade.label}</span>
        </div>
        <p className="text-sm text-gray-400 truncate">{detail}</p>
      </div>
    </div>
  );
}
