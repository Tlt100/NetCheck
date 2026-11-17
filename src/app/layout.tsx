import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NetCheck",
  description:
    "See which New Jersey health plans your local hospitals actually take.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={geistSans.variable}>
      <body>
        <header className="site-header">
          <div className="container">
            <Link href="/" className="site-name">
              NetCheck
            </Link>
            <span className="site-tag">
              See which plans your local hospitals actually take.
            </span>
          </div>
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          <div className="container">
            <nav aria-label="More information" className="footer-links">
              <Link href="/plan-types">Plan types explained</Link>
              <Link href="/pediatricians">Find pediatricians</Link>
              <Link href="/about-the-data">About the data</Link>
              <Link href="/terms">Terms and privacy</Link>
            </nav>
            <p>
              Network data can change. Confirm with the plan and the hospital
              before enrolling.
            </p>
            <p>
              NetCheck gives information only. It does not sell insurance,
              enroll anyone, or give legal, financial or medical advice. It
              does not ask for or keep personal or health information.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
