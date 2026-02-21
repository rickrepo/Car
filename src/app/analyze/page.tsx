"use client";

import { useState, useRef } from "react";
import LeaseForm from "@/components/LeaseForm";
import LeaseResults from "@/components/LeaseResults";
import { LeaseInput, LeaseAnalysis } from "@/types/lease";
import { analyzeLease } from "@/lib/lease-math";

export default function AnalyzePage() {
  const [analysis, setAnalysis] = useState<LeaseAnalysis | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleAnalyze = (input: LeaseInput) => {
    const result = analyzeLease(input);
    setAnalysis(result);
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleReset = () => {
    setAnalysis(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Analyze Your Lease
        </h1>
        <p className="text-gray-400">
          Enter the numbers from your lease quote. We&apos;ll reverse-engineer the
          hidden interest rate, flag junk fees, and tell you exactly what to
          negotiate.
        </p>
      </div>

      {!analysis && <LeaseForm onAnalyze={handleAnalyze} />}

      {analysis && (
        <div ref={resultsRef}>
          <LeaseResults analysis={analysis} onReset={handleReset} />
        </div>
      )}
    </div>
  );
}
