import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useDatabase } from '../context/DatabaseContext';
import { useNotification } from '../context/NotificationContext';
import { useWishlist } from '../context/WishlistContext';
import { useStoreSettings } from '../context/StoreSettingsContext';
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
  const { unreadCount, activeOrdersCount, clearUnreadCount } = useNotification();
  const { wishlistCount } = useWishlist();
  const { getSetting } = useStoreSettings();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);

  // Total count for the bell notification badge
  // Sums up: Active Orders (pending) + Wishlist Items + Unread System Notifications
  const badgeCount = (activeOrdersCount || 0) + (wishlistCount || 0) + (unreadCount || 0);
  
  const logoUrl = getSetting('logo_url');
  const storeName = getSetting('store_name') || 'Mi Tienda';

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
    <div className="flex flex-col gap-4 bg-background-light dark:bg-background-dark p-4 pb-2 sticky top-0 z-10 shadow-sm border-b border-slate-100 dark:border-zinc-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <img src={logoUrl} alt="Store Logo" className="h-10 w-auto object-contain max-w-[120px]" />
          ) : (
            <h1 className="text-xl font-bold text-primary tracking-tight">{storeName}</h1>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleNotificationClick}
            className="relative p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
            aria-label="Notificaciones"
          >
            <span className="material-symbols-outlined text-[24px]">notifications</span>
            {badgeCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white border-2 border-white dark:border-zinc-900">
                {badgeCount}
              </span>
            )}
          </button>
          
          <Link 
            to="/cart" 
            className="relative p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
            aria-label="Carrito de compras"
          >
            <span className="material-symbols-outlined text-[24px]">shopping_cart</span>
            {totalItems > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-white border-2 border-white dark:border-zinc-900">
                {totalItems}
              </span>
            )}
          </Link>

          <Link to={user ? "/profile" : "/login"} className="ml-1 size-9 rounded-full overflow-hidden border border-slate-200 dark:border-zinc-700 block cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all">
            {displayAvatar && displayAvatar.trim() !== '' ? (
              <img 
                src={displayAvatar} 
                alt={`Perfil de ${displayName}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-500 dark:text-slate-400">
                <span className="text-sm font-bold uppercase">
                  {displayName.charAt(0)}
                </span>
              </div>
            )}
          </Link>
        </div>
      </div>
      
      <div className="px-1">
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-0.5">Bienvenido de nuevo,</p>
        <p className="text-slate-900 dark:text-white text-2xl font-bold leading-tight tracking-tight truncate">
          {displayName}
        </p>
      </div>
    </div>
  );
};

export default Header;
