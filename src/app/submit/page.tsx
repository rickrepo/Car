"use client";

import Link from "next/link";

const GITHUB_ISSUE_URL =
  "https://github.com/rickrepo/Car/issues/new?" +
  new URLSearchParams({
    template: "deal-submission.md",
    title: "[Deal] Year Make Model - Province",
    labels: "deal-submission",
  }).toString();

export default function SubmitPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-8 h-8 text-emerald-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-white mb-3">Submit a Deal</h1>
        <p className="text-gray-400">
          Share your lease quote or signed deal with the community. We use
          GitHub Issues to collect submissions — no account or backend needed.
        </p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
        <h2 className="text-white font-semibold mb-4">How it works</h2>
        <ol className="space-y-3 text-sm text-gray-400">
          <li className="flex gap-3">
            <span className="text-emerald-400 font-bold shrink-0">1.</span>
            Click the button below to open a pre-filled GitHub Issue
          </li>
          <li className="flex gap-3">
            <span className="text-emerald-400 font-bold shrink-0">2.</span>
            Fill in your deal details (vehicle, MSRP, payment, term, etc.)
          </li>
          <li className="flex gap-3">
            <span className="text-emerald-400 font-bold shrink-0">3.</span>
            Submit the issue — our scraper will pick it up and add it to the
            database automatically
          </li>
        </ol>
      </div>

      <div className="space-y-4">
        <a
          href={GITHUB_ISSUE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-lg transition-colors text-lg text-center"
        >
          Submit via GitHub Issue
        </a>
        <p className="text-center text-xs text-gray-600">
          Requires a free GitHub account.{" "}
          <Link
            href="/"
            className="text-gray-500 hover:text-gray-300 underline"
          >
            Browse existing deals
          </Link>
        </p>
      </div>

      {/* What to include */}
      <div className="mt-10 bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-white font-semibold mb-4">
          What to include in your submission
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <h3 className="text-emerald-400 font-medium mb-2">Required</h3>
            <ul className="space-y-1 text-gray-400">
              <li>Vehicle year, make, model</li>
              <li>Province</li>
              <li>MSRP</li>
              <li>Selling price</li>
              <li>Monthly/biweekly payment</li>
              <li>Lease term (months)</li>
              <li>Residual value</li>
            </ul>
          </div>
          <div>
            <h3 className="text-gray-500 font-medium mb-2">Optional</h3>
            <ul className="space-y-1 text-gray-400">
              <li>Down payment</li>
              <li>Due on delivery</li>
              <li>Dealership name</li>
              <li>Itemized fees</li>
              <li>Notes / context</li>
              <li>Quote vs. signed deal</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
