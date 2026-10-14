import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pedrinho Tracker",
  description: "Acompanhamento do Pedrinho - Amamentação, sono e mais",
  manifest: "/manifest.json",
  themeColor: "#6b21a8",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Pedrinho",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} h-full`}>
      <body className="min-h-full bg-zinc-950 text-zinc-50 antialiased">
        {children}
      </body>
    </html>
  );
}
