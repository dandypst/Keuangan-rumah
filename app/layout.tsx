import "./globals.css";
import type { Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";

const font = Plus_Jakarta_Sans({ subsets: ["latin"] });

export const metadata = { title: "Keuangan Rumah" };
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className={font.className}>{children}</body>
    </html>
  );
}
