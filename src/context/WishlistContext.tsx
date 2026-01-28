import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useDatabase } from './DatabaseContext';

interface WishlistContextType {
  wishlistCount: number;
  isInWishlist: (productId: string) => boolean;
  addToWishlist: (productId: string) => void;
  removeFromWishlist: (productId: string) => void;
  refreshWishlist: () => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { queries } = useDatabase();
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  
  // Helper to get current user ID safely
  const getCurrentUserId = useCallback(() => {
    return localStorage.getItem('currentUserId');
  }, []);

  const refreshWishlist = useCallback(async () => {
    const userId = getCurrentUserId();
    if (userId) {
      try {
        const ids = await queries.getWishlist(userId);
        setWishlistIds(new Set(ids));
      } catch (error) {
        console.error("Error fetching wishlist:", error);
      }
    } else {
      setWishlistIds(new Set());
    }
  }, [queries, getCurrentUserId]);

  useEffect(() => {
    refreshWishlist();
    
    // Listen for storage events to sync across tabs/components if needed
    // or just rely on the fact that we use this context for mutations
  }, [refreshWishlist]);

  const isInWishlist = useCallback((productId: string) => {
    return wishlistIds.has(productId);
  }, [wishlistIds]);

  const addToWishlist = useCallback(async (productId: string) => {
    const userId = getCurrentUserId();
    if (!userId) return;

    try {
      await queries.addToWishlist(userId, productId);
      setWishlistIds(prev => {
        const next = new Set(prev);
        next.add(productId);
        return next;
      });
    } catch (error) {
      console.error("Error adding to wishlist:", error);
    }
  }, [queries, getCurrentUserId]);

  const removeFromWishlist = useCallback(async (productId: string) => {
    const userId = getCurrentUserId();
    if (!userId) return;

    try {
      await queries.removeFromWishlist(userId, productId);
      setWishlistIds(prev => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    } catch (error) {
      console.error("Error removing from wishlist:", error);
    }
  }, [queries, getCurrentUserId]);

  return (
    <WishlistContext.Provider value={{
      wishlistCount: wishlistIds.size,
      isInWishlist,
      addToWishlist,
      removeFromWishlist,
      refreshWishlist
    }}>
      {children}
    </WishlistContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
