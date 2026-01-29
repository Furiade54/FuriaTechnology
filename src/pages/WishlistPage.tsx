import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDatabase } from '../context/DatabaseContext';
import { useWishlist } from '../context/WishlistContext';
import { useStoreSettings } from '../context/StoreSettingsContext';
import { useCart } from '../context/CartContext';
import ConfirmationModal from '../components/ConfirmationModal';
import type { Product } from '../types';
import { formatCurrency } from '../utils/currency';

const WishlistPage: React.FC = () => {
  const { queries } = useDatabase();
  const { removeFromWishlist } = useWishlist();
  const { addToCart, items: cartItems } = useCart();
  const { getSetting } = useStoreSettings();
  const navigate = useNavigate();
  const [wishlistItems, setWishlistItems] = useState<Product[]>([]);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const currencyLocale = getSetting('currency_locale', 'es-CO');
  const currencyCode = getSetting('currency_code', 'COP');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = await queries.getCurrentUser();
        setCurrentUser(user);
        
        if (user) {
          const items = await queries.getWishlistProducts(user.id);
          setWishlistItems(items);
        }
      } catch (error) {
        console.error("Error fetching wishlist data:", error);
      }
    };
    fetchData();
  }, [queries]);

  const handleRemoveFromWishlist = (productId: string) => {
      if (currentUser) {
          removeFromWishlist(productId);
          setWishlistItems(prev => prev.filter(p => p.id !== productId));
      }
  };

  const handleAddAllToCartClick = () => {
    if (wishlistItems.length === 0) return;
    setIsConfirmModalOpen(true);
  };

  const confirmAddAllToCart = () => {
    wishlistItems.forEach(product => {
      // Check if already in cart to avoid duplicates
      const isInCart = cartItems.some(item => item.id === product.id);
      if (!isInCart) {
        addToCart(product);
      }
    });
    setIsConfirmModalOpen(false);
    navigate('/cart');
  };

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark font-sans pb-24">
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={confirmAddAllToCart}
        title="Agregar al carrito +"
        message="Este proceso añade tus favortios al carrito de compras"
        confirmText="Agregar"
        icon="add_shopping_cart"
      />
      <div className="sticky top-0 z-10 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-sm border-b border-slate-200 dark:border-zinc-800">
        <div className="flex items-center p-4">
          <div className="flex size-12 shrink-0 items-center justify-start">
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center justify-center rounded-full h-10 w-10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <span className="material-symbols-outlined">arrow_back_ios_new</span>
            </button>
          </div>
          <h1 className="text-lg font-bold flex-1 text-center text-slate-900 dark:text-white">
            Favoritos
          </h1>
          <div className="flex size-12 shrink-0 items-center justify-end">
            <div className="w-10" />
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {wishlistItems.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-20 text-slate-500">
             <span className="material-symbols-outlined text-4xl mb-2">favorite_border</span>
             <p>No tienes productos en favoritos.</p>
           </div>
        ) : (
            <div className="space-y-4">
                {wishlistItems.map(product => (
                    <div key={product.id} className="bg-white dark:bg-zinc-900 rounded-2xl p-4 flex gap-4 shadow-sm border border-slate-100 dark:border-zinc-800">
                        <div className="w-24 h-24 bg-slate-100 dark:bg-zinc-800 rounded-xl overflow-hidden shrink-0 cursor-pointer" onClick={() => navigate(`/product/${product.id}`)}>
                            <img src={product.image} className="w-full h-full object-cover" alt={product.name} />
                        </div>
                        <div className="flex-1 flex flex-col justify-between">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 mb-1" onClick={() => navigate(`/product/${product.id}`)}>{product.name}</h3>
                                <p className="text-sm font-semibold text-primary">{formatCurrency(product.price, currencyLocale, currencyCode)}</p>
                            </div>
                            <div className="flex justify-between items-center mt-2">
                                <button
                                  onClick={() => navigate(`/product/${product.id}`)}
                                  className="text-xs text-primary font-medium hover:underline"
                                >
                                  Ver Producto
                                </button>
                                <button
                                  onClick={() => handleRemoveFromWishlist(product.id)}
                                  className="h-8 w-8 flex items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                                  title="Eliminar de favoritos"
                                >
                                  <span className="material-symbols-outlined text-[20px] font-variation-settings-fill">favorite</span>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>

      {wishlistItems.length > 0 && (
        <button
          onClick={handleAddAllToCartClick}
          className="fixed bottom-24 right-6 z-40 flex items-center justify-center w-14 h-14 rounded-full bg-primary text-white shadow-lg shadow-primary/30 transition-transform hover:scale-105 active:scale-95"
          title="Agregar todo al carrito"
        >
          <span className="material-symbols-outlined text-2xl">add_shopping_cart</span>
        </button>
      )}
    </div>
  );
};

export default WishlistPage;
