import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import NavBar from "@/components/layout/NavBar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ChessClone",
  description: "A clone of Chess.com built with Next.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900`}>
        <Providers>
          <NavBar />
          <main className="flex-grow container mx-auto px-4 py-8">
            {children}
          </main>
          {/* Optional Footer Here */}
          {/* <footer className="bg-gray-700 p-4 text-center text-xs text-gray-400">
            ChessClone © 2024
          </footer> */}
        </Providers>
      </body>
    </html>
  );
}
