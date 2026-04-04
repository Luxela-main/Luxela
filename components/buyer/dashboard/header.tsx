'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useProfile } from '@/context/ProfileContext';
import { useCallback } from 'react';

export default function Header() {
  const router = useRouter();
  const { logout } = useAuth();
  const { profile } = useProfile();

  const profileDisplayName = profile?.fullName || profile?.username || profile?.name || 'User';
  const profileInitial = profileDisplayName?.[0]?.toUpperCase() || 'U';
  const profilePictureSrc = profile?.profilePicture ? `${profile.profilePicture}?v=${Date.now()}` : undefined;

  const handleLogout = useCallback(async () => {
    await logout();
  }, [logout, router]);

  const handleProfileClick = useCallback(() => {
    router.push('/buyer/profile');
  }, [router]);

  return (
    <header className="bg-[#1a1a1a] border-b-2 border-[#E5E7EB] px-6 py-4">
      <div className="flex justify-between items-center">
        <h1 className="text-white text-2xl font-bold">Dashboard</h1>
        
        <div className="flex items-center gap-4">
          <button
            onClick={handleProfileClick}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-600 flex-shrink-0">
              {profilePictureSrc ? (
                <img
                  key={profilePictureSrc}
                  src={profilePictureSrc}
                  alt="Profile"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/images/seller/sparkles.svg';
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-sm">
                  {profileInitial}
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-white font-medium text-sm">
                {profileDisplayName}
              </span>
              <span className="text-gray-400 text-xs">Profile</span>
            </div>
          </button>

          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium cursor-pointer"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}