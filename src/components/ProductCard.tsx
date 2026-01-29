import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useDatabase } from '../context/DatabaseContext';
import { useWishlist } from '../context/WishlistContext';
import { useStoreSettings } from '../context/StoreSettingsContext';
import type { Product } from '../types';
import { Link } from 'react-router-dom';
import AuthRequiredModal from './AuthRequiredModal';
import { formatCurrency } from '../utils/currency';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart, items } = useCart();
  const { queries } = useDatabase();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { getSetting } = useStoreSettings();
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  const isLiked = isInWishlist(product.id);
  const currencyLocale = getSetting('currency_locale', 'es-CO');
  const currencyCode = getSetting('currency_code', 'COP');
  
  const cartItem = items.find(item => item.id === product.id);
  const quantity = cartItem?.quantity || 0;

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const currentUser = await queries.getCurrentUser();

    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }

    try {
      if (isLiked) {
        removeFromWishlist(product.id);
      } else {
        addToWishlist(product.id);
      }
    } catch (error) {
      console.error("Error toggling wishlist", error);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Link to={`/product/${product.id}`} className="relative w-full bg-white dark:bg-slate-800 bg-center bg-no-repeat aspect-square bg-contain bg-origin-content p-4 rounded-lg flex flex-col justify-end" 
        data-alt={product.name} 
        style={{ backgroundImage: `url("${product.image}")` }}
      >
        <button 
          onClick={toggleWishlist}
          className={`absolute top-2 right-2 flex items-center justify-center size-8 rounded-full ${isLiked ? 'bg-red-50 dark:bg-red-900/30' : 'bg-black/10 dark:bg-white/10'}`}
        >
          <span className={`material-symbols-outlined text-lg ${isLiked ? 'text-red-500 fill-current' : 'text-slate-900 dark:text-white'}`} style={{ fontVariationSettings: isLiked ? "'FILL' 1" : "'FILL' 0" }}>
            favorite
          </span>
        </button>
      </Link>
      <div>
        <Link 
          to={`/products?category=${encodeURIComponent(product.category)}`} 
          className="text-xs text-slate-500 dark:text-slate-400 hover:text-primary transition-colors mb-0.5 block w-fit"
        >
          {product.category}
        </Link>
        <Link to={`/products?category=${encodeURIComponent(product.category)}`}>
          <p className="text-slate-900 dark:text-slate-100 text-base font-medium leading-normal line-clamp-1">{product.name}</p>
        </Link>
        <div className="flex justify-between items-center">
          <p className="text-slate-900 dark:text-slate-100 text-lg font-bold">{formatCurrency(product.price, currencyLocale, currencyCode)}</p>
          <button 
            onClick={() => addToCart(product)}
            className={`flex items-center gap-1 transition-colors ${quantity > 0 ? 'text-green-600 hover:text-green-700' : 'text-primary hover:text-blue-700'}`}
          >
            {quantity > 0 ? (
              <>
                <span className="text-lg font-bold mr-0.5">{quantity}</span>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>shopping_cart</span>
              </>
            ) : (
              <span className="material-symbols-outlined">add_shopping_cart</span>
            )}
          </button>
        </div>
      </div>
      
      <AuthRequiredModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </div>
  );
};

export default ProductCard;
