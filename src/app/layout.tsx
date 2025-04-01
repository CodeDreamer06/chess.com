import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Chess.com Clone",
  description: "A modern chess platform with real-time gameplay, training features, and social elements.",
  keywords: "chess, online chess, chess game, chess training, chess puzzles",
  authors: [{ name: "Chess.com Clone Team" }],
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full bg-gray-50 dark:bg-gray-900`}>
        {children}
      </body>
    </html>
  );
}
