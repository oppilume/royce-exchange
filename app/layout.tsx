import type { Metadata } from "next";
import { DM_Sans, Space_Grotesk } from "next/font/google";

import { AppShell } from "@/components/app-shell";
import "./globals.css";

const body = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body"
});

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display"
});

export const metadata: Metadata = {
  title: "Jayhawk Gems",
  description:
    "A school-specific prediction market where students trade artificial YES/NO markets on what teachers will say in class."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${body.variable} ${display.variable}`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
