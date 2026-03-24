import type {Metadata} from "next";
import {Jost} from "next/font/google";
import Link from "next/link";
import "./globals.css";

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Cat Eye Editor",
  description: "Interactive cat eye editor using Next.js and p5.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={jost.variable}
        suppressHydrationWarning
      >
        {/* Header */}
        <header
          className="w-full flex items-center justify-between py-3 px-4"
          style={{
            position: "sticky",
            top: 0,
            zIndex: 100,
            mixBlendMode: "difference",
            color: "white",
          }}
        >
          <Link
            href="/"
            className="text-lg font-semibold"
            style={{textDecoration: "none", color: "inherit"}}
          >
            Neko Lab Tokyo
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/about"
              className="text-sm font-medium"
              style={{textDecoration: "none", color: "inherit"}}
            >
              ABOUT
            </Link>
            <Link
              href="/member"
              className="text-sm font-medium"
              style={{textDecoration: "none", color: "inherit"}}
            >
              MEMBER
            </Link>
            <Link
              href="/gallery"
              className="text-sm font-medium"
              style={{textDecoration: "none", color: "inherit", marginLeft: "24px"}}
            >
              GALLERY
            </Link>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
