import type {Metadata} from "next";
import {Jost, Zen_Kaku_Gothic_New} from "next/font/google";
import {HeaderNav} from "./components/HeaderNav";
import {SmoothScroll} from "./components/SmoothScroll";
import {EditorStateProvider} from "./components/EditorStateProvider";
import {LadybugAnimation, LadybugProvider} from "./components/LadybugAnimation";
import {LadybugTrailText} from "./components/LadybugTrailText";
import "./globals.css";

const zenKakuGothicNew = Zen_Kaku_Gothic_New({
  variable: "--font-zen-kaku",
  subsets: ["latin"],
  weight: ["500"],
});

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});


export const metadata: Metadata = {
  title: "Neko Lab Tokyo",
  description: "Interactive cat eye editor using Next.js and p5.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${jost.variable} ${zenKakuGothicNew.variable}`} suppressHydrationWarning>
        <SmoothScroll />
        <EditorStateProvider>
          <LadybugProvider>
            <HeaderNav />
            {children}
            <LadybugAnimation />
            <LadybugTrailText />
          </LadybugProvider>
        </EditorStateProvider>
      </body>
    </html>
  );
}
