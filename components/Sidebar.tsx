"use client";

import Link from "next/link";
import { ResourcePanel } from "./ResourcePanel";
import LevelBar from "./LevelBar";

export default function Sidebar() {
  const navItems = [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Store", href: "/store" },
    { name: "Wood Cutting", href: "/woodcutting" },
    { name: "Mining", href: "/mine"},
    { name: "Fishing", href: "/fishing" }
    // Add as many as you want – sidebar will scroll
  ];

  return (
    <aside className="w-64 h-screen bg-gray-900 text-white border-r border-gray-800 flex flex-col">
      {/* Game title */}
      <Link
        className="h-14 px-6 flex items-center font-semibold text-lg border-b border-gray-800"
        href="/"
      >
        Idle Odyssey
      </Link>
      <LevelBar />

      {/* Scrollable nav */}
      <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block rounded px-3 py-2 text-sm hover:bg-gray-800 transition"
          >
            {item.name}
          </Link>
        ))}
      </nav>

      {/* Resource display */}
      <div className="border-t border-gray-800 p-4 text-xs text-gray-400 space-y-1">
        <ResourcePanel />
      </div>
    </aside>
  );
}
