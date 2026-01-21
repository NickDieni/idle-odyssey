import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Sidebar from "../components/Sidebar";
import "./globals.css";
import GameTicker from "@/components/GameTicker";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Idle Odyssey",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-white">
        <GameTicker />
        <div className="flex">
          <Sidebar />

          {/* Main content area */}
          <main className="flex-1 min-h-screen p-6 overflow-y-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
