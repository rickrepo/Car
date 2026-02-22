"use client";

import { useState } from "react";
import { PROVINCES, VEHICLE_MAKES } from "@/lib/canadian-data";
import { analyzeLease } from "@/lib/lease-math";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { DealInsert } from "@/lib/database.types";
import { LeaseInput, FeeItem, PaymentFrequency } from "@/types/lease";

interface SubmitDealFormProps {
  onSuccess?: (dealId: string) => void;
}

export default function SubmitDealForm({ onSuccess }: SubmitDealFormProps) {
  // Vehicle info
  const [vehicleYear, setVehicleYear] = useState(new Date().getFullYear());
  const [vehicleMake, setVehicleMake] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehicleTrim, setVehicleTrim] = useState("");

  // Location & type
  const [province, setProvince] = useState("");
  const [dealType, setDealType] = useState<"quote" | "purchase">("quote");

  // Core numbers
  const [msrp, setMsrp] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentFrequency, setPaymentFrequency] =
    useState<PaymentFrequency>("monthly");
  const [termMonths, setTermMonths] = useState("36");
  const [residualValue, setResidualValue] = useState("");

  // Reductions
  const [downPayment, setDownPayment] = useState("");
  const [otherCredits, setOtherCredits] = useState("");
  const [dueOnDelivery, setDueOnDelivery] = useState("");

  // Fees
  const [fees, setFees] = useState<FeeItem[]>([]);
  const [newFeeName, setNewFeeName] = useState("");
  const [newFeeAmount, setNewFeeAmount] = useState("");

  // Optional
  const [dealershipName, setDealershipName] = useState("");
  const [notes, setNotes] = useState("");

  // State
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 4 }, (_, i) => currentYear + 1 - i);

  function addFee() {
    if (newFeeName && newFeeAmount) {
      setFees([...fees, { name: newFeeName, amount: parseFloat(newFeeAmount) }]);
      setNewFeeName("");
      setNewFeeAmount("");
    }
  }

  function removeFee(index: number) {
    setFees(fees.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Validate required fields
    if (!vehicleMake || !vehicleModel || !province) {
      setError("Please fill in all required vehicle and location fields.");
      return;
    }

    const msrpNum = parseFloat(msrp);
    const sellingPriceNum = parseFloat(sellingPrice);
    const paymentNum = parseFloat(paymentAmount);
    const termNum = parseInt(termMonths);
    const residualNum = parseFloat(residualValue);

    if (
      isNaN(msrpNum) ||
      isNaN(sellingPriceNum) ||
      isNaN(paymentNum) ||
      isNaN(termNum) ||
      isNaN(residualNum)
    ) {
      setError("Please fill in all required number fields.");
      return;
    }

    // Run through our analysis engine
    const leaseInput: LeaseInput = {
      msrp: msrpNum,
      sellingPrice: sellingPriceNum,
      paymentFrequency,
      paymentAmount: paymentNum,
      leaseTerm: termNum,
      residualValue: residualNum,
      downPayment: parseFloat(downPayment) || 0,
      otherCredits: parseFloat(otherCredits) || 0,
      fees,
      dueOnDelivery: parseFloat(dueOnDelivery) || 0,
    };

    const analysis = analyzeLease(leaseInput);

    const deal: DealInsert = {
      vehicle_year: vehicleYear,
      vehicle_make: vehicleMake,
      vehicle_model: vehicleModel,
      vehicle_trim: vehicleTrim || null,
      province,
      deal_type: dealType,
      msrp: msrpNum,
      selling_price: sellingPriceNum,
      payment_amount: paymentNum,
      payment_frequency: paymentFrequency,
      term_months: termNum,
      residual_value: residualNum,
      down_payment: parseFloat(downPayment) || 0,
      other_credits: parseFloat(otherCredits) || 0,
      due_on_delivery: parseFloat(dueOnDelivery) || 0,
      fees,
      apr: Math.round(analysis.apr * 100) / 100,
      money_factor: Math.round(analysis.moneyFactor * 1000000) / 1000000,
      residual_percent: Math.round(analysis.residualPercent * 10) / 10,
      discount_percent: Math.round(analysis.sellingPriceDiscount * 10) / 10,
      one_percent_rule: Math.round(analysis.onePercentRule * 100) / 100,
      overall_grade: analysis.overallGrade.letter,
      total_junk_fees: analysis.totalJunkFees,
      dealership_name: dealershipName || null,
      notes: notes || null,
    };

    if (!isSupabaseConfigured()) {
      setError(
        "Database not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
      );
      return;
    }

    setSubmitting(true);
    const { data, error: dbError } = await supabase
      .from("deals")
      .insert(deal)
      .select("id")
      .single();

    setSubmitting(false);

    if (dbError) {
      setError(`Failed to submit: ${dbError.message}`);
      return;
    }

    if (data?.id && onSuccess) {
      onSuccess(data.id);
    }
  }

  const inputClass =
    "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500";
  const selectClass =
    "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500";
  const labelClass = "block text-sm font-medium text-gray-300 mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Vehicle Info */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-4 pb-2 border-b border-gray-800">
          Vehicle Information
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className={labelClass}>Year</label>
            <select
              className={selectClass}
              value={vehicleYear}
              onChange={(e) => setVehicleYear(parseInt(e.target.value))}
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Make *</label>
            <select
              className={selectClass}
              value={vehicleMake}
              onChange={(e) => setVehicleMake(e.target.value)}
              required
            >
              <option value="">Select...</option>
              {VEHICLE_MAKES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Model *</label>
            <input
              type="text"
              className={inputClass}
              placeholder="e.g. Civic"
              value={vehicleModel}
              onChange={(e) => setVehicleModel(e.target.value)}
              required
            />
          </div>
          <div>
            <label className={labelClass}>Trim</label>
            <input
              type="text"
              className={inputClass}
              placeholder="e.g. LX, Sport"
              value={vehicleTrim}
              onChange={(e) => setVehicleTrim(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Location & Deal Type */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-4 pb-2 border-b border-gray-800">
          Location & Deal Type
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Province *</label>
            <select
              className={selectClass}
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              required
            >
              <option value="">Select province...</option>
              {PROVINCES.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Deal Type *</label>
            <div className="flex gap-3 mt-1">
              <button
                type="button"
                onClick={() => setDealType("quote")}
                className={`flex-1 py-2 px-4 rounded-lg border text-sm font-medium transition-colors ${
                  dealType === "quote"
                    ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                    : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600"
                }`}
              >
                Quote
              </button>
              <button
                type="button"
                onClick={() => setDealType("purchase")}
                className={`flex-1 py-2 px-4 rounded-lg border text-sm font-medium transition-colors ${
                  dealType === "purchase"
                    ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                    : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600"
                }`}
              >
                Signed / Purchased
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Core Numbers */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-4 pb-2 border-b border-gray-800">
          Deal Numbers
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>MSRP *</label>
            <input
              type="number"
              className={inputClass}
              placeholder="e.g. 35000"
              value={msrp}
              onChange={(e) => setMsrp(e.target.value)}
              required
              min="0"
              step="any"
            />
          </div>
          <div>
            <label className={labelClass}>
              Selling Price *{" "}
              <span className="text-gray-500 font-normal">
                (Agreed / Capitalized Cost)
              </span>
            </label>
            <input
              type="number"
              className={inputClass}
              placeholder="e.g. 33000"
              value={sellingPrice}
              onChange={(e) => setSellingPrice(e.target.value)}
              required
              min="0"
              step="any"
            />
          </div>
          <div>
            <label className={labelClass}>Payment Amount (pre-tax) *</label>
            <div className="flex gap-2">
              <input
                type="number"
                className={inputClass}
                placeholder="e.g. 389"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                required
                min="0"
                step="any"
              />
              <select
                className={`${selectClass} w-32 shrink-0`}
                value={paymentFrequency}
                onChange={(e) =>
                  setPaymentFrequency(e.target.value as PaymentFrequency)
                }
              >
                <option value="monthly">/ month</option>
                <option value="biweekly">/ biweekly</option>
              </select>
            </div>
          </div>
          <div>
            <label className={labelClass}>Lease Term (months) *</label>
            <select
              className={selectClass}
              value={termMonths}
              onChange={(e) => setTermMonths(e.target.value)}
            >
              <option value="24">24 months</option>
              <option value="36">36 months</option>
              <option value="39">39 months</option>
              <option value="42">42 months</option>
              <option value="48">48 months</option>
              <option value="60">60 months</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>
              Residual Value *{" "}
              <span className="text-gray-500 font-normal">($ amount)</span>
            </label>
            <input
              type="number"
              className={inputClass}
              placeholder="e.g. 18200"
              value={residualValue}
              onChange={(e) => setResidualValue(e.target.value)}
              required
              min="0"
              step="any"
            />
          </div>
        </div>
      </section>

      {/* Reductions */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-4 pb-2 border-b border-gray-800">
          Down Payment & Credits
          <span className="text-sm font-normal text-gray-500 ml-2">
            (optional)
          </span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Down Payment</label>
            <input
              type="number"
              className={inputClass}
              placeholder="0"
              value={downPayment}
              onChange={(e) => setDownPayment(e.target.value)}
              min="0"
              step="any"
            />
          </div>
          <div>
            <label className={labelClass}>
              Trade-in / Rebates / Credits
            </label>
            <input
              type="number"
              className={inputClass}
              placeholder="0"
              value={otherCredits}
              onChange={(e) => setOtherCredits(e.target.value)}
              min="0"
              step="any"
            />
          </div>
          <div>
            <label className={labelClass}>Due on Delivery (total)</label>
            <input
              type="number"
              className={inputClass}
              placeholder="0"
              value={dueOnDelivery}
              onChange={(e) => setDueOnDelivery(e.target.value)}
              min="0"
              step="any"
            />
          </div>
        </div>
      </section>

      {/* Fees */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-4 pb-2 border-b border-gray-800">
          Itemized Fees
          <span className="text-sm font-normal text-gray-500 ml-2">
            (optional — helps us flag junk fees)
          </span>
        </h2>
        {fees.length > 0 && (
          <div className="space-y-2 mb-4">
            {fees.map((fee, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2"
              >
                <span className="text-white text-sm">{fee.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-gray-300 text-sm">
                    ${fee.amount.toFixed(2)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFee(i)}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            className={`${inputClass} flex-1`}
            placeholder="Fee name (e.g. Doc fee)"
            value={newFeeName}
            onChange={(e) => setNewFeeName(e.target.value)}
          />
          <input
            type="number"
            className={`${inputClass} w-28`}
            placeholder="Amount"
            value={newFeeAmount}
            onChange={(e) => setNewFeeAmount(e.target.value)}
            min="0"
            step="any"
          />
          <button
            type="button"
            onClick={addFee}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors shrink-0"
          >
            Add
          </button>
        </div>
      </section>

      {/* Optional Info */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-4 pb-2 border-b border-gray-800">
          Additional Info
          <span className="text-sm font-normal text-gray-500 ml-2">
            (optional)
          </span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Dealership Name</label>
            <input
              type="text"
              className={inputClass}
              placeholder="e.g. Oakville Toyota"
              value={dealershipName}
              onChange={(e) => setDealershipName(e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Notes</label>
            <input
              type="text"
              className={inputClass}
              placeholder="Any context about the deal"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/50 text-black font-bold rounded-lg transition-colors text-lg"
      >
        {submitting ? "Submitting..." : "Submit Deal"}
      </button>
    </form>
  );
}
