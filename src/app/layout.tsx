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
          <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link href="/" className="text-lg font-bold tracking-tight">
              <span className="text-emerald-400">Deal</span>Check
              <span className="text-gray-500 text-xs font-normal ml-1">
                Canada
              </span>
            </Link>
            <div className="flex gap-5 text-sm">
              <Link
                href="/submit"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Submit
              </Link>
              <Link
                href="/browse"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Browse
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
                Analyze
              </Link>
            </div>
          </div>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
