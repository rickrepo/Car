import Link from "next/link";

export default function HomePage() {
  return (
    <div className="max-w-5xl mx-auto px-4">
      {/* Hero */}
      <section className="py-20 text-center">
        <h1 className="text-4xl sm:text-5xl font-black text-white mb-4 tracking-tight">
          Is your lease deal
          <br />
          <span className="text-emerald-400">actually</span> a good deal?
        </h1>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-8">
          Dealerships hide the real interest rate, pad your quote with junk fees,
          and hope you just look at the monthly payment. We reverse-engineer
          their math and tell you exactly what to push back on.
        </p>
        <Link
          href="/analyze"
          className="inline-block py-3 px-8 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-lg transition-colors text-lg"
        >
          Analyze My Lease Quote
        </Link>
      </section>

      {/* How it works */}
      <section className="py-16 border-t border-gray-800">
        <h2 className="text-2xl font-bold text-white text-center mb-12">
          How It Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Step
            number="1"
            title="Enter Your Numbers"
            description="Type in the key numbers from your lease quote — MSRP, selling price, monthly payment, residual value, and any fees listed."
          />
          <Step
            number="2"
            title="We Do the Math"
            description="We reverse-engineer the hidden money factor (interest rate), verify the dealer's payment calculation, and flag every junk fee."
          />
          <Step
            number="3"
            title="Know What to Negotiate"
            description="Get an A-F grade, specific negotiation scripts, and exactly how much money you can save by pushing back."
          />
        </div>
      </section>

      {/* What we catch */}
      <section className="py-16 border-t border-gray-800">
        <h2 className="text-2xl font-bold text-white text-center mb-12">
          What Dealerships Don&apos;t Want You to Know
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
          <Insight
            title="Hidden Interest Rate"
            detail="The 'money factor' is how dealers charge interest on a lease — and they're not required to tell you the rate. We calculate it from their own numbers."
          />
          <Insight
            title="Marked-Up Rates"
            detail="Dealers get a 'buy rate' from the bank, then mark it up for profit. The difference can cost you $1,000+ over the lease. We expose the markup."
          />
          <Insight
            title="Junk Fee Padding"
            detail="Paint protection, nitrogen tires, VIN etching, fabric guard — $50 worth of product sold for $2,000+. We flag every one."
          />
          <Insight
            title="Payment Manipulation"
            detail="A low monthly payment means nothing if they buried a $5,000 down payment in the fine print. We normalize everything to show the true cost."
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

      {/* CTA */}
      <section className="py-16 border-t border-gray-800 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">
          Don&apos;t sign until you check.
        </h2>
        <p className="text-gray-400 mb-6">Free. Instant. No account needed.</p>
        <Link
          href="/analyze"
          className="inline-block py-3 px-8 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-lg transition-colors text-lg"
        >
          Analyze My Lease Quote
        </Link>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-800 text-center">
        <p className="text-sm text-gray-600">
          LeaseCheck is a free tool. Not financial advice. Always do your own
          research.
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
