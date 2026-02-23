"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { Deal } from "@/lib/database.types";
import DealCard from "@/components/DealCard";

export default function HomePage() {
  const [recentDeals, setRecentDeals] = useState<Deal[]>([]);
  const [stats, setStats] = useState({
    totalDeals: 0,
    avgResidual: 0,
    avgApr: 0,
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoaded(true);
      return;
    }

    async function load() {
      // Fetch recent deals
      const { data: recent } = await supabase
        .from("deals")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(4);

      if (recent) setRecentDeals(recent as Deal[]);

      // Fetch aggregate stats
      const { data: allDeals } = await supabase
        .from("deals")
        .select("apr, residual_percent");

      if (allDeals && allDeals.length > 0) {
        const aprs = allDeals
          .map((d) => d.apr)
          .filter((a): a is number => a != null);
        const residuals = allDeals
          .map((d) => d.residual_percent)
          .filter((r): r is number => r != null);
        const avg = (arr: number[]) =>
          arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

        setStats({
          totalDeals: allDeals.length,
          avgApr: Math.round(avg(aprs) * 10) / 10,
          avgResidual: Math.round(avg(residuals) * 10) / 10,
        });
      }

      setLoaded(true);
    }

    load();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4">
      {/* Hero */}
      <section className="py-20 text-center">
        <h1 className="text-4xl sm:text-5xl font-black text-white mb-4 tracking-tight">
          Stop Guessing.
          <br />
          <span className="text-emerald-400">Start Comparing.</span>
        </h1>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-8">
          See what Canadians are actually paying for leases. Submit your quote
          or purchase and compare against real community data. Know if
          you&apos;re getting a fair deal before you sign.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href="/submit"
            className="inline-block py-3 px-8 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-lg transition-colors text-lg"
          >
            Submit Your Deal
          </Link>
          <Link
            href="/browse"
            className="inline-block py-3 px-8 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors text-lg border border-gray-700"
          >
            Browse Deals
          </Link>
        </div>
      </section>

      {/* Live Stats */}
      {loaded && stats.totalDeals > 0 && (
        <section className="pb-16">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center">
              <p className="text-3xl font-bold text-white">
                {stats.totalDeals.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500 mt-1">Deals Shared</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center">
              <p className="text-3xl font-bold text-white">
                {stats.avgResidual}%
              </p>
              <p className="text-sm text-gray-500 mt-1">Avg Residual</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center">
              <p className="text-3xl font-bold text-white">
                {stats.avgApr}%
              </p>
              <p className="text-sm text-gray-500 mt-1">Avg APR</p>
            </div>
          </div>
        </section>
      )}

      {/* Recent Submissions */}
      {recentDeals.length > 0 && (
        <section className="pb-16 border-t border-gray-800 pt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">
              Recent Submissions
            </h2>
            <Link
              href="/browse"
              className="text-sm text-emerald-400 hover:text-emerald-300"
            >
              See all deals &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentDeals.map((deal) => (
              <DealCard key={deal.id} deal={deal} />
            ))}
          </div>
        </section>
      )}

      {/* How it works */}
      <section className="py-16 border-t border-gray-800">
        <h2 className="text-2xl font-bold text-white text-center mb-12">
          How It Works
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          <Step
            number="1"
            title="Submit Your Deal"
            description="Enter the numbers from your lease quote or signed deal — MSRP, payment, residual, fees."
          />
          <Step
            number="2"
            title="We Crunch the Numbers"
            description="Our engine reverse-engineers the hidden APR, grades your deal A-F, and flags junk fees."
          />
          <Step
            number="3"
            title="Compare Against Others"
            description="See how your deal stacks up against what others are paying for the same vehicle in your area."
          />
          <Step
            number="4"
            title="Track Trends"
            description="Watch how lease rates, residuals, and discounts change over time across Canada."
          />
        </div>
      </section>

      {/* What we show you */}
      <section className="py-16 border-t border-gray-800">
        <h2 className="text-2xl font-bold text-white text-center mb-12">
          What You&apos;ll See
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
          <Insight
            title="Real APR / Money Factor"
            detail="Dealers hide the interest rate. We reverse-engineer it from their numbers so you can see the actual cost of financing."
          />
          <Insight
            title="Residual Value Trends"
            detail="Track how residual percentages change month-to-month across different makes and models."
          />
          <Insight
            title="What Others Paid"
            detail="Compare your quote against signed deals for the same vehicle. Know if your price is competitive."
          />
          <Insight
            title="Junk Fee Detection"
            detail="We flag paint protection, VIN etching, nitrogen fills, and 30+ other common junk fees."
          />
        </div>
      </section>

      {/* 1% Rule */}
      <section className="py-16 border-t border-gray-800">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-white mb-4">The 1% Rule</h2>
          <p className="text-gray-400 mb-6">
            A quick benchmark: your pre-tax monthly payment (with $0 down)
            should be at or below{" "}
            <span className="text-emerald-400 font-semibold">
              1% of the vehicle&apos;s MSRP
            </span>
            .
          </p>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-sm text-gray-500">$35,000 MSRP</p>
              <p className="text-xl font-bold text-white">$350/mo</p>
              <p className="text-xs text-gray-500">or less</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-sm text-gray-500">$45,000 MSRP</p>
              <p className="text-xl font-bold text-white">$450/mo</p>
              <p className="text-xs text-gray-500">or less</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-sm text-gray-500">$60,000 MSRP</p>
              <p className="text-xl font-bold text-white">$600/mo</p>
              <p className="text-xs text-gray-500">or less</p>
            </div>
          </div>
        </div>
      </section>

      {/* Lease Analyzer CTA */}
      <section className="py-16 border-t border-gray-800">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">
            Already signed? Analyze your lease.
          </h2>
          <p className="text-gray-400 mb-6 max-w-lg mx-auto">
            Our lease analyzer reverse-engineers your deal&apos;s hidden
            numbers, grades it A-F, and gives you specific negotiation tips.
          </p>
          <Link
            href="/analyze"
            className="inline-block py-3 px-8 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transition-colors"
          >
            Analyze a Lease
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 border-t border-gray-800 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">
          Help others get a fair deal.
        </h2>
        <p className="text-gray-400 mb-6">
          Every submission helps build a transparent picture of the Canadian
          lease market. Free. Anonymous. No account needed.
        </p>
        <Link
          href="/submit"
          className="inline-block py-3 px-8 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-lg transition-colors text-lg"
        >
          Submit Your Deal
        </Link>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-800 text-center">
        <p className="text-sm text-gray-600">
          DealCheck Canada is a free community tool. Not financial advice.
          Always do your own research.
        </p>
      </footer>
    </div>
  );
}

function Step({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 text-xl font-bold flex items-center justify-center mx-auto mb-4">
        {number}
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-400">{description}</p>
    </div>
  );
}

function Insight({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <h3 className="text-white font-semibold mb-1">{title}</h3>
      <p className="text-sm text-gray-400">{detail}</p>
    </div>
  );
}
