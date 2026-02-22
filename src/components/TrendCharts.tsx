"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

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

interface TrendChartsProps {
  monthlyTrends: MonthlyTrend[];
  discountDistribution: DiscountBucket[];
}

const chartTooltipStyle = {
  backgroundColor: "#1f2937",
  border: "1px solid #374151",
  borderRadius: "8px",
  color: "#e5e7eb",
  fontSize: "13px",
};

export function AprTrendChart({ data }: { data: MonthlyTrend[] }) {
  if (data.length === 0) return <EmptyChart label="APR trend" />;

  return (
    <div>
      <h3 className="text-white font-semibold mb-4">Average APR Over Time</h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
          <YAxis
            stroke="#9ca3af"
            fontSize={12}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip
            contentStyle={chartTooltipStyle}
            formatter={(value) => [`${Number(value).toFixed(1)}%`, "Avg APR"]}
          />
          <Line
            type="monotone"
            dataKey="avgApr"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ fill: "#10b981", r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ResidualTrendChart({ data }: { data: MonthlyTrend[] }) {
  if (data.length === 0) return <EmptyChart label="residual trend" />;

  return (
    <div>
      <h3 className="text-white font-semibold mb-4">
        Average Residual % Over Time
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
          <YAxis
            stroke="#9ca3af"
            fontSize={12}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip
            contentStyle={chartTooltipStyle}
            formatter={(value) => [
              `${Number(value).toFixed(1)}%`,
              "Avg Residual",
            ]}
          />
          <Line
            type="monotone"
            dataKey="avgResidual"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ fill: "#3b82f6", r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DiscountDistributionChart({
  data,
}: {
  data: DiscountBucket[];
}) {
  if (data.length === 0)
    return <EmptyChart label="discount distribution" />;

  return (
    <div>
      <h3 className="text-white font-semibold mb-4">
        Discount off MSRP Distribution
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="range" stroke="#9ca3af" fontSize={12} />
          <YAxis stroke="#9ca3af" fontSize={12} />
          <Tooltip
            contentStyle={chartTooltipStyle}
            formatter={(value) => [`${value} deals`, "Count"]}
          />
          <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DealVolumeTrendChart({ data }: { data: MonthlyTrend[] }) {
  if (data.length === 0) return <EmptyChart label="deal volume" />;

  return (
    <div>
      <h3 className="text-white font-semibold mb-4">Deals Submitted Per Month</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
          <YAxis stroke="#9ca3af" fontSize={12} />
          <Tooltip
            contentStyle={chartTooltipStyle}
            formatter={(value) => [`${value}`, "Deals"]}
          />
          <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
      <p className="text-gray-500">
        Not enough data to show {label} yet. Submit some deals to see trends!
      </p>
    </div>
  );
}

export default function TrendCharts({
  monthlyTrends,
  discountDistribution,
}: TrendChartsProps) {
  return (
    <div className="space-y-8">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <AprTrendChart data={monthlyTrends} />
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <ResidualTrendChart data={monthlyTrends} />
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <DiscountDistributionChart data={discountDistribution} />
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <DealVolumeTrendChart data={monthlyTrends} />
      </div>
    </div>
  );
}
