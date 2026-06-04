// @ts-nocheck
// components/common/Navbar-example.tsx
// Example Navbar component for navigation

'use client';

import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    return user.role === 'farmer' ? '/farmer/dashboard' : '/customer/dashboard';
  };

  return (
    <nav className="bg-primary text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="text-2xl font-bold">
          🌱 Organic Farm
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center gap-6">
          {isAuthenticated ? (
            <>
              {/* User Role Badge */}
              <span className="text-sm bg-opacity-20 bg-white px-3 py-1 rounded">
                {user?.role === 'farmer' ? '👨‍🌾 Farmer' : '👤 Customer'}
              </span>

              {/* Dashboard Link */}
              <Link
                href={getDashboardLink()}
                className="hover:opacity-90 transition"
              >
                Dashboard
              </Link>

              {/* User Menu */}
              <div className="flex items-center gap-3">
                <span className="text-sm">{user?.name}</span>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded transition"
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="hover:opacity-90">
                Login
              </Link>
              <Link
                href="/auth/register"
                className="bg-secondary px-4 py-2 rounded hover:opacity-90"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
