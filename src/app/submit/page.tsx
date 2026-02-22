"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SubmitDealForm from "@/components/SubmitDealForm";

export default function SubmitPage() {
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);
  const [dealId, setDealId] = useState("");

  function handleSuccess(id: string) {
    setDealId(id);
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
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
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-white mb-3">Deal Submitted!</h1>
        <p className="text-gray-400 mb-8">
          Your deal has been added to the community database. Others can now
          compare against it.
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => router.push(`/deal?id=${dealId}`)}
            className="py-2 px-6 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-lg transition-colors"
          >
            View Your Deal
          </button>
          <button
            onClick={() => router.push("/browse")}
            className="py-2 px-6 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
          >
            Browse All Deals
          </button>
          <button
            onClick={() => {
              setSubmitted(false);
              setDealId("");
            }}
            className="py-2 px-6 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
          >
            Submit Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Submit a Deal</h1>
        <p className="text-gray-400">
          Share your lease quote or signed deal with the community. We&apos;ll
          crunch the numbers and grade it so others can compare.
        </p>
      </div>
      <SubmitDealForm onSuccess={handleSuccess} />
    </div>
  );
}
