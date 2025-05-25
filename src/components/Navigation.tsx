'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Edit, Play } from 'lucide-react';

export const Navigation: React.FC = () => {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Jouer', icon: Play },
    { href: '/editor', label: 'Éditeur', icon: Edit },
  ];

  return (
    <nav className="fixed top-4 left-4 z-50">
      <div className="flex gap-2 bg-gray-800 rounded-lg p-2 shadow-lg">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-2 px-3 py-2 rounded transition-colors ${
              pathname === href
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:text-white hover:bg-gray-700'
            }`}
          >
            <Icon size={16} />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
};