"use client";

import { useState } from "react";
import { LeaseInput, FeeItem, PaymentFrequency } from "@/types/lease";
import { COMMON_FEES } from "@/lib/fee-database";

interface Props {
  onAnalyze: (input: LeaseInput) => void;
}

function Tooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-block ml-1">
      <button
        type="button"
        className="w-4 h-4 rounded-full bg-gray-700 text-gray-400 text-xs leading-none hover:bg-gray-600 hover:text-white transition-colors"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
        aria-label="More info"
      >
        ?
      </button>
      {show && (
        <span className="absolute z-10 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 text-xs text-gray-200 bg-gray-800 border border-gray-700 rounded-lg shadow-lg">
          {text}
        </span>
      )}
    </span>
  );
}

function DollarInput({
  label,
  tooltip,
  value,
  onChange,
  placeholder,
  required = false,
}: {
  label: string;
  tooltip?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1">
        {label}
        {tooltip && <Tooltip text={tooltip} />}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
          $
        </span>
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, ""))}
          placeholder={placeholder}
          required={required}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 pl-7 pr-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        />
      </div>
    </div>
  );
}

export default function LeaseForm({ onAnalyze }: Props) {
  // Required fields
  const [msrp, setMsrp] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [paymentFrequency, setPaymentFrequency] =
    useState<PaymentFrequency>("biweekly");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [leaseTerm, setLeaseTerm] = useState("48");
  const [residualValue, setResidualValue] = useState("");

  // Optional — collapsed by default
  const [showMore, setShowMore] = useState(false);
  const [downPayment, setDownPayment] = useState("");
  const [otherCredits, setOtherCredits] = useState("");
  const [dueOnDelivery, setDueOnDelivery] = useState("");
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

  const paymentLabel =
    paymentFrequency === "biweekly" ? "Biweekly Payment" : "Monthly Payment";

  const hasOptionalData =
    downPayment || otherCredits || dueOnDelivery || fees.length > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Core lease numbers — everything on the paperwork */}
      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-white mb-1">
            Your Lease Quote
          </h3>
          <p className="text-sm text-gray-500">
            These 6 numbers are on every lease worksheet.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DollarInput
            label="MSRP (Sticker Price)"
            tooltip="The Manufacturer's Suggested Retail Price — the sticker price on the window."
            value={msrp}
            onChange={setMsrp}
            placeholder="50,000"
            required
          />
          <DollarInput
            label="Selling Price"
            tooltip='The negotiated vehicle price. On your paperwork this may be called "Agreed Upon Value," "Lease Vehicle Amount," or "Capitalized Cost."'
            value={sellingPrice}
            onChange={setSellingPrice}
            placeholder="46,000"
            required
          />
        </div>

        {/* Payment frequency + amount */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Payment Frequency
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPaymentFrequency("biweekly")}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  paymentFrequency === "biweekly"
                    ? "bg-emerald-500 text-black"
                    : "bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700"
                }`}
              >
                Biweekly
              </button>
              <button
                type="button"
                onClick={() => setPaymentFrequency("monthly")}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  paymentFrequency === "monthly"
                    ? "bg-emerald-500 text-black"
                    : "bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700"
                }`}
              >
                Monthly
              </button>
            </div>
          </div>
          <DollarInput
            label={`${paymentLabel} (pre-tax)`}
            tooltip="The payment amount the dealer quoted, before tax."
            value={paymentAmount}
            onChange={setPaymentAmount}
            placeholder={paymentFrequency === "biweekly" ? "210" : "450"}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Lease Term
              <Tooltip text="Length of the lease in months. 36 or 48 months are most common in Canada." />
            </label>
            <select
              value={leaseTerm}
              onChange={(e) => setLeaseTerm(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="24">24 months</option>
              <option value="36">36 months</option>
              <option value="39">39 months</option>
              <option value="48">48 months</option>
              <option value="60">60 months</option>
            </select>
          </div>
          <DollarInput
            label="Residual Value"
            tooltip='What the car is worth at lease end. Look for "Residual Value," "Buyback Price," "Guaranteed Future Value," or "Purchase Option Price" on your paperwork.'
            value={residualValue}
            onChange={setResidualValue}
            placeholder="25,000"
            required
          />
        </div>
      </section>

      {/* Optional details — expand for deeper analysis */}
      <section>
        <button
          type="button"
          onClick={() => setShowMore(!showMore)}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <span
            className={`transition-transform ${showMore ? "rotate-90" : ""}`}
          >
            &#9654;
          </span>
          {showMore ? "Hide" : "Add"} down payment, fees, &amp; more details
          {hasOptionalData && !showMore && (
            <span className="text-emerald-400 text-xs">(has data)</span>
          )}
        </button>

        {showMore && (
          <div className="mt-4 space-y-6 pl-4 border-l-2 border-gray-800">
            {/* Reductions */}
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-3">
                Cap Cost Reductions
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DollarInput
                  label="Down Payment"
                  tooltip="Cash you're putting down. WARNING: On a lease, if the car is totaled you lose this money."
                  value={downPayment}
                  onChange={setDownPayment}
                  placeholder="0"
                />
                <DollarInput
                  label="Trade-in / Rebates / Incentives"
                  tooltip="Combined total of trade-in value plus any manufacturer rebates, loyalty bonuses, or lease cash."
                  value={otherCredits}
                  onChange={setOtherCredits}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Due on delivery */}
            <DollarInput
              label="Amount Due on Delivery"
              tooltip='Total upfront amount when you pick up the vehicle — first payment, fees, down payment, etc. Sometimes called "Due at Signing."'
              value={dueOnDelivery}
              onChange={setDueOnDelivery}
              placeholder="0"
            />

            {/* Fees */}
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-1">
                Fees on the Quote
              </h4>
              <p className="text-xs text-gray-500 mb-3">
                Add fees from your quote and we&apos;ll flag the junk ones.
              </p>

              {fees.map((fee, i) => (
                <div key={i} className="flex gap-2 mb-2 items-center">
                  <span className="text-sm text-gray-300 w-44 shrink-0 truncate">
                    {fee.name}
                  </span>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                      $
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={fee.amount}
                      onChange={(e) => updateFeeAmount(i, e.target.value)}
                      placeholder="0"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 pl-7 pr-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFee(i)}
                    className="text-gray-500 hover:text-red-400 transition-colors px-2"
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
                  className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  + Add a fee
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
          </div>
        )}
      </section>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
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
        className="w-full py-3 px-6 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-lg transition-colors text-lg"
      >
        Analyze This Deal
      </button>
    </form>
  );
}
