import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import { Providers } from "@/composition/Providers";
import "./globals.css";

const plex = IBM_Plex_Sans({
  variable: "--font-plex",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

// cover: lets the bottom nav use the phone's safe-area inset instead of being cut by the home indicator
export const viewport: Viewport = { viewportFit: "cover" };

export const metadata: Metadata = {
  title: "NutriFlow",
  description: "Voice-first cooking and nutrition companion",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${plex.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col"><Providers>{children}</Providers></body>
    </html>
  );
}
