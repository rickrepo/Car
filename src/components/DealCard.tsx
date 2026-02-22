import Link from "next/link";
import { Deal } from "@/lib/database.types";
import { getProvinceLabel } from "@/lib/canadian-data";
import { formatCurrency, formatPercent } from "@/lib/lease-math";

const gradeColors: Record<string, string> = {
  A: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  B: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  C: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  D: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  F: "bg-red-500/20 text-red-400 border-red-500/30",
};

export default function DealCard({ deal }: { deal: Deal }) {
  const gradeClass = gradeColors[deal.overall_grade] || gradeColors.C;
  const date = new Date(deal.created_at).toLocaleDateString("en-CA", {
    month: "short",
    year: "numeric",
  });
  const freqLabel = deal.payment_frequency === "biweekly" ? "biweekly" : "mo";

  return (
    <Link
      href={`/deal?id=${deal.id}`}
      className="block bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-600 transition-colors"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-white font-semibold">
            {deal.vehicle_year} {deal.vehicle_make} {deal.vehicle_model}
            {deal.vehicle_trim ? ` ${deal.vehicle_trim}` : ""}
          </h3>
          <p className="text-sm text-gray-500">
            {getProvinceLabel(deal.province)} &middot;{" "}
            <span className="capitalize">{deal.deal_type}</span> &middot; {date}
          </p>
        </div>
        <div
          className={`w-10 h-10 rounded-lg border flex items-center justify-center text-lg font-bold ${gradeClass}`}
        >
          {deal.overall_grade}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 text-center">
        <div>
          <p className="text-xs text-gray-500">MSRP</p>
          <p className="text-sm font-medium text-white">
            {formatCurrency(deal.msrp)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Payment</p>
          <p className="text-sm font-medium text-white">
            {formatCurrency(deal.payment_amount)}/{freqLabel}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">APR</p>
          <p className="text-sm font-medium text-white">
            {formatPercent(deal.apr)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Residual</p>
          <p className="text-sm font-medium text-white">
            {formatPercent(deal.residual_percent)}
          </p>
        </div>
      </div>

      {deal.discount_percent > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-800">
          <span className="text-xs text-emerald-400">
            {formatPercent(deal.discount_percent)} below MSRP
          </span>
        </div>
      )}
    </Link>
  );
}
