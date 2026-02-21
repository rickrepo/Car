import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "LeaseCheck — Is Your Lease Deal Any Good?",
  description:
    "Instantly analyze your car lease quote. Uncover hidden fees, reverse-engineer the money factor, and get specific negotiation tips.",
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
              <span className="text-emerald-400">Lease</span>Check
            </Link>
            <div className="flex gap-6 text-sm">
              <Link
                href="/analyze"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Analyze a Lease
              </Link>
            </div>
          </div>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
