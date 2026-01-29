import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useDatabase } from '../context/DatabaseContext';
import { useNotification } from '../context/NotificationContext';
import { Link, useNavigate } from 'react-router-dom';
import type { User } from '../types';

interface HeaderProps {
  userName?: string;
  userAvatar?: string;
}

const Header: React.FC<HeaderProps> = ({ 
  userName, 
  userAvatar
}) => {
  const { totalItems } = useCart();
  const { queries } = useDatabase();
  const { unreadCount, clearUnreadCount } = useNotification();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await queries.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error("Failed to fetch user", error);
      }
    };
    fetchUser();
  }, [queries]);

  const handleNotificationClick = () => {
    clearUnreadCount();
    if (user) {
        navigate('/profile');
    } else {
        navigate('/login');
    }
  };

  const displayName = userName || user?.name || "Invitado";
  const displayAvatar = userAvatar || user?.avatar;

  return (
    <div className="flex flex-col gap-2 bg-background-light dark:bg-background-dark p-4 pb-2 sticky top-0 z-10">
      <div className="flex items-center h-12 justify-between">
        <div className="flex size-12 shrink-0 items-center">
          <Link to={user ? "/profile" : "/login"} className="size-10 rounded-full overflow-hidden border border-slate-200 dark:border-zinc-700 block cursor-pointer hover:opacity-80 transition-opacity">
            {displayAvatar && displayAvatar.trim() !== '' ? (
              <img 
                src={displayAvatar} 
                alt={`User profile picture of ${displayName}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-slate-200 dark:bg-zinc-800 flex items-center justify-center">
                <span className="text-lg font-bold text-slate-500 dark:text-slate-400 uppercase">
                  {displayName.charAt(0)}
                </span>
              </div>
            )}
          </Link>
        </div>
        <div className="flex w-auto items-center justify-end gap-2">
          <button 
            onClick={handleNotificationClick}
            className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-12 bg-transparent text-slate-900 dark:text-slate-100 gap-2 text-base font-bold leading-normal tracking-[0.015em] min-w-0 p-2 relative"
          >
            <span className="material-symbols-outlined text-slate-900 dark:text-slate-100">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                {unreadCount}
              </span>
            )}
          </button>
          <Link to="/cart" className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-12 bg-transparent text-slate-900 dark:text-slate-100 gap-2 text-base font-bold leading-normal tracking-[0.015em] min-w-0 p-2 relative">
            <span className="material-symbols-outlined text-slate-900 dark:text-slate-100">shopping_cart</span>
            {totalItems > 0 && (
              <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-white">
                {totalItems}
              </span>
            )}
          </Link>
        </div>
      </div>
      <p className="text-slate-900 dark:text-slate-100 tracking-light text-[28px] font-bold leading-tight">Hola {displayName}</p>
    </div>
  );
};

export default Header;
