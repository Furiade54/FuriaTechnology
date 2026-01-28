import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';

const FloatingWishlistButton: React.FC = () => {
  const { wishlistCount } = useWishlist();
  const navigate = useNavigate();
  const location = useLocation();

  // Define allowed paths where the button should appear
  // "Home, Categories, Shop" correspond to these routes based on App.tsx
  const allowedPaths = ['/', '/categories', '/products'];
  
  // Check if current path is in allowed paths
  const isAllowedPath = allowedPaths.includes(location.pathname);

  // Don't show if no items in wishlist or not on allowed pages
  if (wishlistCount === 0 || !isAllowedPath) {
    return null;
  }

  return (
    <button
      onClick={() => navigate('/profile/wishlist')}
      className="fixed bottom-24 right-4 z-40 flex items-center justify-center w-14 h-14 rounded-full bg-red-500 text-white shadow-lg shadow-red-500/30 hover:bg-red-600 transition-all duration-300 hover:scale-110 active:scale-95 animate-in fade-in zoom-in"
      aria-label="Ver favoritos"
    >
      <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
        favorite
      </span>
      <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold text-red-500 shadow-sm border border-red-100">
        {wishlistCount > 99 ? '99+' : wishlistCount}
      </span>
    </button>
  );
};

export default FloatingWishlistButton;
