"use client";

import { useState } from "react";
import { LeaseInput, FeeItem, PaymentFrequency } from "@/types/lease";
import { COMMON_FEES } from "@/lib/fee-database";

interface Props {
  onAnalyze: (input: LeaseInput) => void;
}

/**
 * Dotted-underline dollar input that looks like filling in a blank on paperwork.
 */
function WorksheetField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative inline-flex items-baseline">
      <span className="text-gray-500 mr-0.5 text-sm">$</span>
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, ""))}
        placeholder={placeholder}
        className="bg-transparent border-b-2 border-dotted border-gray-600 text-white font-mono text-sm w-28 py-0.5 px-1 placeholder-gray-700 focus:outline-none focus:border-emerald-500 transition-colors"
      />
    </div>
  );
}

export default function LeaseForm({ onAnalyze }: Props) {
  // Core fields (on every lease worksheet)
  const [msrp, setMsrp] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [paymentFrequency, setPaymentFrequency] =
    useState<PaymentFrequency>("biweekly");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [leaseTerm, setLeaseTerm] = useState("48");
  const [residualValue, setResidualValue] = useState("");

  // Due at signing section
  const [downPayment, setDownPayment] = useState("");
  const [otherCredits, setOtherCredits] = useState("");
  const [dueOnDelivery, setDueOnDelivery] = useState("");

  // Fees
  const [fees, setFees] = useState<{ name: string; amount: string }[]>([]);
  const [showFeeDropdown, setShowFeeDropdown] = useState(false);

  const [errors, setErrors] = useState<string[]>([]);

  const addFee = (name: string) => {
    if (!fees.find((f) => f.name === name)) {
      setFees([...fees, { name, amount: "" }]);
    }
    setShowFeeDropdown(false);
  };

  const removeFee = (index: number) => {
    setFees(fees.filter((_, i) => i !== index));
  };

  const updateFeeAmount = (index: number, amount: string) => {
    const updated = [...fees];
    updated[index].amount = amount.replace(/[^0-9.]/g, "");
    setFees(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: string[] = [];

    const parsedMsrp = parseFloat(msrp);
    const parsedSelling = parseFloat(sellingPrice);
    const parsedPayment = parseFloat(paymentAmount);
    const parsedResidual = parseFloat(residualValue);
    const parsedTerm = parseInt(leaseTerm);

    if (!parsedMsrp || parsedMsrp <= 0) errs.push("MSRP is required.");
    if (!parsedSelling || parsedSelling <= 0)
      errs.push("Selling price is required.");
    if (!parsedPayment || parsedPayment <= 0)
      errs.push("Payment amount is required.");
    if (!parsedResidual || parsedResidual <= 0)
      errs.push("Residual value is required.");
    if (!parsedTerm || parsedTerm <= 0) errs.push("Lease term is required.");

    if (errs.length > 0) {
      setErrors(errs);
      return;
    }

    setErrors([]);

    const parsedFees: FeeItem[] = fees
      .filter((f) => f.amount && parseFloat(f.amount) > 0)
      .map((f) => ({ name: f.name, amount: parseFloat(f.amount) }));

    const input: LeaseInput = {
      msrp: parsedMsrp,
      sellingPrice: parsedSelling,
      paymentFrequency,
      paymentAmount: parsedPayment,
      leaseTerm: parsedTerm,
      residualValue: parsedResidual,
      downPayment: parseFloat(downPayment) || 0,
      otherCredits: parseFloat(otherCredits) || 0,
      fees: parsedFees,
      dueOnDelivery: parseFloat(dueOnDelivery) || 0,
    };

    onAnalyze(input);
  };

  const availableFees = COMMON_FEES.filter(
    (f) => !fees.find((existing) => existing.name === f)
  );

  return (
    <form onSubmit={handleSubmit}>
      {/* The "worksheet" — looks like the actual lease paperwork */}
      <div className="bg-gray-950 border border-gray-700 rounded-xl shadow-2xl overflow-hidden">
        {/* Document header */}
        <div className="bg-gray-900 border-b border-gray-700 px-6 py-4 text-center">
          <h2 className="text-sm font-bold tracking-[0.2em] uppercase text-gray-300">
            Vehicle Lease Worksheet
          </h2>
          <p className="text-xs text-gray-600 mt-1">
            Fill in the numbers from your quote — look for these exact labels on
            your paperwork
          </p>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* === VEHICLE === */}
          <section>
            <SectionLabel>Vehicle</SectionLabel>
            <div className="space-y-3 mt-3">
              <WorksheetRow
                label="MSRP"
                altNames="Sticker Price"
              >
                <WorksheetField
                  value={msrp}
                  onChange={setMsrp}
                  placeholder="50,000"
                />
              </WorksheetRow>
              <WorksheetRow
                label="Selling Price"
                altNames="Agreed Upon Value / Capitalized Cost / Lease Vehicle Amount"
              >
                <WorksheetField
                  value={sellingPrice}
                  onChange={setSellingPrice}
                  placeholder="46,000"
                />
              </WorksheetRow>
            </div>
          </section>

          {/* === LEASE TERMS === */}
          <section>
            <SectionLabel>Lease Terms</SectionLabel>
            <div className="space-y-3 mt-3">
              <WorksheetRow label="Term">
                <select
                  value={leaseTerm}
                  onChange={(e) => setLeaseTerm(e.target.value)}
                  className="bg-transparent border-b-2 border-dotted border-gray-600 text-white font-mono text-sm py-0.5 px-1 focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
                >
                  <option value="24" className="bg-gray-900">24 months</option>
                  <option value="36" className="bg-gray-900">36 months</option>
                  <option value="39" className="bg-gray-900">39 months</option>
                  <option value="48" className="bg-gray-900">48 months</option>
                  <option value="60" className="bg-gray-900">60 months</option>
                </select>
              </WorksheetRow>

              <WorksheetRow
                label={
                  paymentFrequency === "biweekly"
                    ? "Biweekly Payment"
                    : "Monthly Payment"
                }
                altNames="pre-tax"
              >
                <div className="flex items-center gap-3">
                  <WorksheetField
                    value={paymentAmount}
                    onChange={setPaymentAmount}
                    placeholder={
                      paymentFrequency === "biweekly" ? "210" : "450"
                    }
                  />
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setPaymentFrequency("biweekly")}
                      className={`text-xs px-2 py-0.5 rounded transition-colors ${
                        paymentFrequency === "biweekly"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                          : "text-gray-600 hover:text-gray-400"
                      }`}
                    >
                      Bi-wk
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentFrequency("monthly")}
                      className={`text-xs px-2 py-0.5 rounded transition-colors ${
                        paymentFrequency === "monthly"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                          : "text-gray-600 hover:text-gray-400"
                      }`}
                    >
                      Mo
                    </button>
                  </div>
                </div>
              </WorksheetRow>

              <WorksheetRow
                label="Residual Value"
                altNames="Buyback Price / Purchase Option Price / Guaranteed Future Value"
              >
                <WorksheetField
                  value={residualValue}
                  onChange={setResidualValue}
                  placeholder="25,000"
                />
              </WorksheetRow>
            </div>
          </section>

          {/* === DUE AT SIGNING === */}
          <section>
            <SectionLabel>Due at Signing / Delivery</SectionLabel>
            <p className="text-xs text-gray-600 mt-1 mb-3">
              Leave blank if $0 or not applicable
            </p>
            <div className="space-y-3">
              <WorksheetRow
                label="Down Payment"
                altNames="Cap Cost Reduction"
              >
                <WorksheetField
                  value={downPayment}
                  onChange={setDownPayment}
                  placeholder="0"
                />
              </WorksheetRow>
              <WorksheetRow
                label="Trade-in / Rebates / Incentives"
                altNames="Trade Allowance / Lease Cash / Loyalty Bonus"
              >
                <WorksheetField
                  value={otherCredits}
                  onChange={setOtherCredits}
                  placeholder="0"
                />
              </WorksheetRow>
              <WorksheetRow
                label="Total Due on Delivery"
                altNames="Due at Signing / Amount Due at Lease Inception"
              >
                <WorksheetField
                  value={dueOnDelivery}
                  onChange={setDueOnDelivery}
                  placeholder="0"
                />
              </WorksheetRow>
            </div>
          </section>

          {/* === FEES === */}
          <section>
            <SectionLabel>Itemized Fees</SectionLabel>
            <p className="text-xs text-gray-600 mt-1 mb-3">
              Add any fees listed separately on your quote — we&apos;ll flag the
              junk ones
            </p>
            <div className="space-y-2">
              {fees.map((fee, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-sm text-gray-400 w-40 shrink-0 truncate">
                    {fee.name}
                  </span>
                  <span className="text-gray-700 flex-1 border-b border-dotted border-gray-800" />
                  <div className="relative inline-flex items-baseline">
                    <span className="text-gray-500 mr-0.5 text-sm">$</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={fee.amount}
                      onChange={(e) => updateFeeAmount(i, e.target.value)}
                      placeholder="0"
                      className="bg-transparent border-b-2 border-dotted border-gray-600 text-white font-mono text-sm w-24 py-0.5 px-1 placeholder-gray-700 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFee(i)}
                    className="text-gray-700 hover:text-red-400 transition-colors text-sm"
                    aria-label="Remove fee"
                  >
                    &times;
                  </button>
                </div>
              ))}

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowFeeDropdown(!showFeeDropdown)}
                  className="text-xs text-emerald-500/70 hover:text-emerald-400 transition-colors"
                >
                  + Add a fee from your quote
                </button>
                {showFeeDropdown && (
                  <div className="absolute z-20 mt-1 w-72 max-h-60 overflow-y-auto bg-gray-800 border border-gray-700 rounded-lg shadow-xl">
                    {availableFees.map((name) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => addFee(name)}
                        className="block w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                      >
                        {name}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const custom = prompt("Enter fee name:");
                        if (custom && custom.trim()) addFee(custom.trim());
                      }}
                      className="block w-full text-left px-3 py-2 text-sm text-emerald-400 hover:bg-gray-700 border-t border-gray-700"
                    >
                      + Custom fee...
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mt-4">
          {errors.map((err, i) => (
            <p key={i} className="text-sm text-red-400">
              {err}
            </p>
          ))}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        className="w-full mt-6 py-3 px-6 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-lg transition-colors text-lg"
      >
        Analyze This Deal
      </button>
    </form>
  );
}

/** Section divider label — mimics a form section header */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <h3 className="text-xs font-bold tracking-[0.15em] uppercase text-gray-500 shrink-0">
        {children}
      </h3>
      <div className="flex-1 border-t border-gray-800" />
    </div>
  );
}

/**
 * A single row in the worksheet: label on the left, dotted leader, input on the right.
 * altNames shows the other names this field goes by on different paperwork.
 */
function WorksheetRow({
  label,
  altNames,
  children,
}: {
  label: string;
  altNames?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline gap-2">
        <span className="text-sm text-gray-300 shrink-0">{label}</span>
        <span className="flex-1 border-b border-dotted border-gray-800 min-w-4" />
        {children}
      </div>
      {altNames && (
        <p className="text-xs text-gray-700 mt-0.5 ml-0.5 italic">
          also: {altNames}
        </p>
      )}
    </div>
  );
}
