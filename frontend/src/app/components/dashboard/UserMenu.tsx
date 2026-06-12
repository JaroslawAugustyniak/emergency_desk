'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Menu, LogOut, User } from 'lucide-react';
import Swal from 'sweetalert2';
import ProfileEditModal from '@/app/components/profile/ProfileEditModal';
import { useSessionContext } from '@/app/components/providers/SessionProvider';

export default function UserMenu({ isPortalUser }: { isPortalUser: boolean }) {
  const router = useRouter();
  const t = useTranslations('profile');
  const tAuth = useTranslations('auth');
  const { setToken } = useSessionContext();

  const [isOpen, setIsOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [userName, setUserName] = useState<string>('');
  const menuRef = useRef<HTMLDivElement>(null);

  // Get user name from API
  useEffect(() => {
    const loadUserName = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) return;

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://api.starter.localhost'}/api/auth/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          setUserName(data.data?.name || '');
        }
      } catch (error) {
        console.error('Failed to load user name:', error);
      }
    };

    loadUserName();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsOpen(false);

    const result = await Swal.fire({
      title: tAuth('logoutConfirm'),
      text: tAuth('logoutMessage'),
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: tAuth('logoutButton'),
      cancelButtonText: tAuth('cancel'),
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('access_token');
        if (token) {
          await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://api.starter.localhost'}/api/auth/logout`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
        }
      } catch (error) {
        console.error('Logout failed:', error);
      }

      setToken(null);
      router.push('/login');
    }
  };

  const handleEditProfile = () => {
    setIsOpen(false);
    setIsProfileModalOpen(true);
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="user-menu-trigger"
      >
        <span className="user-menu-name">
          {userName}
        </span>
        <Menu size={20} className="user-menu-icon" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="user-menu-dropdown">
          {!isPortalUser && (
            <>
          <button
            onClick={handleEditProfile}
            className="dropdown-item"
          >
            <User size={16} />
            {t('editProfile')}
          </button>

          <div className="dropdown-divider"></div>
          </>
          )}
          <button
            onClick={handleLogout}
            className="dropdown-item-danger"
          >
            <LogOut size={16} />
            {tAuth('logout')}
          </button>
        </div>
      )}

      {/* Profile Edit Modal */}
      <ProfileEditModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
  );
}
