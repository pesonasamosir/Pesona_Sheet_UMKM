import type { Metadata, Viewport } from "next";
import type { CSSProperties, ReactNode } from "react";
import { Figtree, Fraunces } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
});

export const metadata: Metadata = {
  title: "PESONA — Inventori & Finansial UMKM",
  description:
    "Aplikasi inventori & finansial UMKM yang berjalan privat di perangkat Anda. Data tidak pernah dibagikan antar pengguna.",
  applicationName: "PESONA",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#1e3a24",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const fontVars = {
    ["--font-sans"]: "var(--font-figtree), ui-sans-serif, system-ui, sans-serif",
    ["--font-display"]: "var(--font-fraunces), Georgia, serif",
  } as CSSProperties;

  return (
    <html
      lang="id"
      className={`${figtree.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full" style={fontVars}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
