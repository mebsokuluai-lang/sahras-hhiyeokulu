'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        
        {/* Brand */}
        <Link href="/" className="navbar-brand">
          <span>📡</span>
          <span>Sahra Sıhhiye Okulu</span>
        </Link>

        {/* Mobile Menu Toggle Button */}
        <button
          className="mobile-menu-toggle"
          onClick={toggleMobileMenu}
          aria-label="Menü"
        >
          ☰
        </button>

        {/* Desktop & Mobile Menu Navigation */}
        <div className={`navbar-nav ${isMobileMenuOpen ? 'active' : ''}`} id="navbar-nav">
          <Link
            href="/"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`nav-link ${pathname === '/' ? 'active' : ''}`}
          >
            📰 Haberler
          </Link>

          <Link
            href="/ilk-yardim"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`nav-link ${pathname === '/ilk-yardim' ? 'active' : ''}`}
          >
            🚑 İlk Yardım
          </Link>

          <Link
            href="/hesaplayicilar"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`nav-link ${pathname === '/hesaplayicilar' ? 'active' : ''}`}
          >
            📊 Hesaplayıcı
          </Link>

          <Link
            href="/nobetci-eczaneler"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`nav-link ${pathname === '/nobetci-eczaneler' ? 'active' : ''}`}
          >
            💊 Nöbetçi Eczane
          </Link>

          <Link
            href="/quiz"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`nav-link ${pathname === '/quiz' ? 'active' : ''}`}
          >
            💡 Quiz
          </Link>

          <div className="user-info">
            <Link
              href="/admin"
              onClick={() => setIsMobileMenuOpen(false)}
              className="btn btn-outline"
            >
              🔒 Admin Panel
            </Link>
          </div>
        </div>

      </div>
    </nav>
  );
}
