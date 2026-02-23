import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "DealCheck Canada — See What Canadians Are Paying for Leases",
  description:
    "Community-driven lease deal transparency. Submit your quote, compare against real deals, track trends, and know if you're getting a fair price.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-950 text-gray-100 antialiased">
        <nav className="border-b border-gray-800 bg-gray-950/80 backdrop-blur sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 h-12 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/" className="text-sm font-bold tracking-tight">
                <span className="text-emerald-400">Deal</span>Check
              </Link>
              <div className="flex gap-4 text-sm">
                <Link
                  href="/"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Deals
                </Link>
                <Link
                  href="/trends"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Trends
                </Link>
                <Link
                  href="/analyze"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Analyzer
                </Link>
              </div>
            </div>
            <Link
              href="/submit"
              className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-semibold rounded transition-colors"
            >
              + Submit
            </Link>
          </div>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
