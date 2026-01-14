'use client';

import Link from 'next/link';


// If you have more nav items, add them here using { name, href } format
const navItems = [
  { name: 'Dashboard', href: '/dashboard' },
  // Add as many as you want – sidebar will scroll
];

export default function Sidebar() {
  return (
    <aside className="w-64 h-screen bg-gray-900 text-white border-r border-gray-800 flex flex-col">
      {/* Game title */}
      <Link className="h-14 px-6 flex items-center font-semibold text-lg border-b border-gray-800" href="/">
        Idle Odyssey 
      </Link>

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

      {/* Bottom status (optional) */}
      <div className="border-t border-gray-800 p-4 text-xs text-gray-400">
        Gold: 0<br />
      </div>
    </aside>
  );
}
