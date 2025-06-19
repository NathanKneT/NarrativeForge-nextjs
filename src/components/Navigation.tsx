'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Edit, Play, Home, Book } from 'lucide-react';

export const Navigation: React.FC = () => {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Stories', icon: Book },
    { href: '/editor', label: 'Editor', icon: Edit },
  ];

  return (
    <nav className="fixed left-4 top-4 z-50">
      <div className="flex gap-2 rounded-lg bg-gray-800/90 backdrop-blur-sm p-2 shadow-lg border border-gray-700">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-2 rounded px-3 py-2 transition-all duration-200 ${
              pathname === href
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <Icon size={16} />
            <span className="font-medium">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
};