"use client";

import { useState } from "react";
import { LeaseInput, FeeItem } from "@/types/lease";
import { COMMON_FEES } from "@/lib/fee-database";

interface Props {
  onAnalyze: (input: LeaseInput) => void;
}

const TOOLTIPS: Record<string, string> = {
  msrp: "The Manufacturer's Suggested Retail Price — the sticker price on the window.",
  sellingPrice:
    'The negotiated price of the vehicle BEFORE any down payment, trade-in, or rebates. Sometimes labeled "Agreed Upon Value" or "Capitalized Cost" on the lease sheet.',
  downPayment:
    'Cash you\'re putting down. Also called "Cap Cost Reduction." WARNING: On a lease, if the car is totaled, you lose this money.',
  tradeInValue: "The amount the dealer is giving you for your trade-in vehicle.",
  rebates:
    "Manufacturer incentives, loyalty bonuses, or lease cash being applied. Check the manufacturer's website to confirm what's available.",
  monthlyPayment: "The monthly payment the dealer is quoting you, BEFORE tax.",
  dueAtSigning:
    'Total amount due at signing (first month, fees, down payment, etc.). Sometimes called "due at inception" or "drive-off."',
  leaseTerm: "Length of the lease in months. 36 months is most common.",
  residualValue:
    'What the car will be worth at lease end, in dollars. This is on your lease paperwork — look for "Residual Value" or "Purchase Option Price at End of Lease."',
  annualMileage: "The annual mileage allowance in the lease. 10K, 12K, or 15K are standard.",
};

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

function NumberInput({
  label,
  tooltip,
  value,
  onChange,
  placeholder,
  prefix = "$",
  required = false,
}: {
  label: string;
  tooltip?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  prefix?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1">
        {label}
        {tooltip && <Tooltip text={tooltip} />}
      </label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
            {prefix}
          </span>
        )}
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => {
            const v = e.target.value.replace(/[^0-9.]/g, "");
            onChange(v);
          }}
          placeholder={placeholder}
          required={required}
          className={`w-full bg-gray-800 border border-gray-700 rounded-lg py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${prefix ? "pl-7 pr-3" : "px-3"}`}
        />
      </div>
    </div>
  );
}

export default function LeaseForm({ onAnalyze }: Props) {
  const [msrp, setMsrp] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [downPayment, setDownPayment] = useState("0");
  const [tradeInValue, setTradeInValue] = useState("0");
  const [rebates, setRebates] = useState("0");
  const [monthlyPayment, setMonthlyPayment] = useState("");
  const [dueAtSigning, setDueAtSigning] = useState("0");
  const [leaseTerm, setLeaseTerm] = useState("36");
  const [residualValue, setResidualValue] = useState("");
  const [annualMileage, setAnnualMileage] = useState("12000");
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
    const parsedPayment = parseFloat(monthlyPayment);
    const parsedResidual = parseFloat(residualValue);
    const parsedTerm = parseInt(leaseTerm);

    if (!parsedMsrp || parsedMsrp <= 0) errs.push("MSRP is required.");
    if (!parsedSelling || parsedSelling <= 0)
      errs.push("Selling price is required.");
    if (!parsedPayment || parsedPayment <= 0)
      errs.push("Monthly payment is required.");
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
      .map((f) => ({
        name: f.name,
        amount: parseFloat(f.amount),
      }));

    const input: LeaseInput = {
      msrp: parsedMsrp,
      sellingPrice: parsedSelling,
      downPayment: parseFloat(downPayment) || 0,
      tradeInValue: parseFloat(tradeInValue) || 0,
      rebates: parseFloat(rebates) || 0,
      fees: parsedFees,
      monthlyPayment: parsedPayment,
      leaseTerm: parsedTerm,
      residualValue: parsedResidual,
      annualMileage: parseInt(annualMileage) || 12000,
      dueAtSigning: parseFloat(dueAtSigning) || 0,
    };

    onAnalyze(input);
  };

  const availableFees = COMMON_FEES.filter(
    (f) => !fees.find((existing) => existing.name === f)
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Vehicle Info */}
      <section>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 text-sm flex items-center justify-center font-bold">
            1
          </span>
          Vehicle Pricing
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <NumberInput
            label="MSRP (Sticker Price)"
            tooltip={TOOLTIPS.msrp}
            value={msrp}
            onChange={setMsrp}
            placeholder="40,000"
            required
          />
          <NumberInput
            label="Selling Price"
            tooltip={TOOLTIPS.sellingPrice}
            value={sellingPrice}
            onChange={setSellingPrice}
            placeholder="37,000"
            required
          />
        </div>
      </section>

      {/* Adjustments */}
      <section>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 text-sm flex items-center justify-center font-bold">
            2
          </span>
          Adjustments
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <NumberInput
            label="Down Payment"
            tooltip={TOOLTIPS.downPayment}
            value={downPayment}
            onChange={setDownPayment}
            placeholder="0"
          />
          <NumberInput
            label="Trade-in Value"
            tooltip={TOOLTIPS.tradeInValue}
            value={tradeInValue}
            onChange={setTradeInValue}
            placeholder="0"
          />
          <NumberInput
            label="Rebates / Incentives"
            tooltip={TOOLTIPS.rebates}
            value={rebates}
            onChange={setRebates}
            placeholder="0"
          />
        </div>
      </section>

      {/* Fees */}
      <section>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 text-sm flex items-center justify-center font-bold">
            3
          </span>
          Fees on the Quote
        </h3>
        <p className="text-sm text-gray-400 mb-3">
          Add any fees listed on your lease quote. We&apos;ll flag the junk ones.
        </p>

        {fees.map((fee, i) => (
          <div key={i} className="flex gap-2 mb-2 items-center">
            <span className="text-sm text-gray-300 w-48 shrink-0 truncate">
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
      </section>

      {/* Lease Terms */}
      <section>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 text-sm flex items-center justify-center font-bold">
            4
          </span>
          Lease Terms
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <NumberInput
            label="Monthly Payment (pre-tax)"
            tooltip={TOOLTIPS.monthlyPayment}
            value={monthlyPayment}
            onChange={setMonthlyPayment}
            placeholder="450"
            required
          />
          <NumberInput
            label="Due at Signing (total)"
            tooltip={TOOLTIPS.dueAtSigning}
            value={dueAtSigning}
            onChange={setDueAtSigning}
            placeholder="2,000"
          />
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Lease Term
              <Tooltip text={TOOLTIPS.leaseTerm} />
            </label>
            <select
              value={leaseTerm}
              onChange={(e) => setLeaseTerm(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="24">24 months</option>
              <option value="27">27 months</option>
              <option value="30">30 months</option>
              <option value="33">33 months</option>
              <option value="36">36 months</option>
              <option value="39">39 months</option>
              <option value="42">42 months</option>
              <option value="48">48 months</option>
            </select>
          </div>
          <NumberInput
            label="Residual Value"
            tooltip={TOOLTIPS.residualValue}
            value={residualValue}
            onChange={setResidualValue}
            placeholder="23,200"
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Annual Mileage
              <Tooltip text={TOOLTIPS.annualMileage} />
            </label>
            <select
              value={annualMileage}
              onChange={(e) => setAnnualMileage(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="7500">7,500 miles/year</option>
              <option value="10000">10,000 miles/year</option>
              <option value="12000">12,000 miles/year</option>
              <option value="15000">15,000 miles/year</option>
            </select>
          </div>
        </div>
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
