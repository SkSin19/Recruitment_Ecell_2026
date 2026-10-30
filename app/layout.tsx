import type { Metadata, Viewport } from "next";
import { Anton, Inter } from "next/font/google";
import "lenis/dist/lenis.css";
import "./globals.css";

const anton = Anton({
  variable: "--font-anton",
  weight: "400",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "DOOMSDAY · KIIT E-Cell Recruitment 2026",
    template: "%s · DOOMSDAY · KIIT E-Cell",
  },
  description: "Eight characters. Eight domains. One mission. KIIT E-Cell recruitment 2026.",
};

export const viewport: Viewport = {
  themeColor: "#090909",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${anton.variable} ${inter.variable} antialiased`}>
      {/* Browser extensions inject attributes on <body>; ignore those diffs. */}
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
