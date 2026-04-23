import type {Metadata} from "next";
import {Jost} from "next/font/google";
import {HeaderNav} from "./components/HeaderNav";
import {SmoothScroll} from "./components/SmoothScroll";
import {EditorStateProvider} from "./components/EditorStateProvider";
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
        <SmoothScroll />
        <EditorStateProvider>
          <HeaderNav />
          {children}
        </EditorStateProvider>
      </body>
    </html>
  );
}
