import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { CartItem, Product } from '../types';
import { useDatabase } from './DatabaseContext';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  restoreCart: (items: { id: string; quantity: number }[]) => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartEntry {
  id: string;
  quantity: number;
}

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { queries, isReady } = useDatabase();
  const [cartEntries, setCartEntries] = useState<CartEntry[]>(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart) as Array<{ id: string; quantity?: number }>;
        return parsed.map(item => ({
          id: item.id,
          quantity: item.quantity ?? 1
        }));
      } catch {
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartEntries));
  }, [cartEntries]);

  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (isReady) {
      const fetchProducts = async () => {
        try {
          const allProducts = await queries.getProducts();
          setProducts(allProducts);
        } catch (error) {
          console.error("Error fetching products for cart:", error);
        }
      };
      fetchProducts();
    }
  }, [isReady, queries]);

  const items = useMemo<CartItem[]>(() => {
    if (!isReady || products.length === 0) return [];
    
    try {
      return cartEntries.map(entry => {
        const product = products.find(p => p.id === entry.id);
        if (product && product.isActive !== false) {
          return { ...product, quantity: entry.quantity };
        }
        return null;
      }).filter((item): item is CartItem => item !== null);
    } catch (error) {
      console.error("Error generating cart items:", error);
      return [];
    }
  }, [cartEntries, products, isReady]);

  const addToCart = (product: Product) => {
    if (product.isActive === false) return;
    setCartEntries(prev => {
      const existing = prev.find(entry => entry.id === product.id);
      if (existing) {
        return prev.map(entry =>
          entry.id === product.id
            ? { ...entry, quantity: entry.quantity + 1 }
            : entry
        );
      }
      return [...prev, { id: product.id, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCartEntries(prev => prev.filter(entry => entry.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartEntries(prev =>
      prev.map(entry =>
        entry.id === productId ? { ...entry, quantity } : entry
      )
    );
  };

  const clearCart = () => {
    setCartEntries([]);
  };

  const restoreCart = (items: { id: string; quantity: number }[]) => {
    setCartEntries(items.map(item => ({ id: item.id, quantity: item.quantity })));
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity,
    clearCart,
    restoreCart,
    totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
