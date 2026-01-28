import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDatabase } from '../context/DatabaseContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useStoreSettings } from '../context/StoreSettingsContext';
import AuthRequiredModal from '../components/AuthRequiredModal';
import { formatCurrency } from '../utils/currency';
import type { Product, User } from '../types';

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { queries } = useDatabase();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { getSetting } = useStoreSettings();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [product, setProduct] = useState<Product | undefined>(undefined);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const currencyLocale = getSetting('currency_locale', 'es-CO');
  const currencyCode = getSetting('currency_code', 'COP');

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (id) {
          const fetchedProduct = await queries.getProductById(id);
          setProduct(fetchedProduct);
        }
        const user = await queries.getCurrentUser();
        setCurrentUser(user);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, queries]);

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null); // Reset touch end
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      nextImage();
    }
    if (isRightSwipe) {
      prevImage();
    }
  };

  const onMouseDown = (e: React.MouseEvent) => {
    setTouchEnd(null);
    setTouchStart(e.clientX);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (touchStart !== null) { // Only track if mouse is down
        setTouchEnd(e.clientX);
    }
  };

  const onMouseUp = () => {
    if (!touchStart || !touchEnd) {
        setTouchStart(null);
        setTouchEnd(null);
        return;
    }
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      nextImage();
    }
    if (isRightSwipe) {
      prevImage();
    }
    
    // Reset
    setTouchStart(null);
    setTouchEnd(null);
  };

  const onMouseLeave = () => {
     // Cancel swipe if mouse leaves the area
     setTouchStart(null);
     setTouchEnd(null);
  };

  const nextImage = () => {
    if (currentImageIndex < displayImages.length - 1) {
      setCurrentImageIndex(prev => prev + 1);
    } else {
        // Loop back to start (optional, standard behavior is usually loop or stop)
        // Let's loop for better UX
        setCurrentImageIndex(0);
    }
  };

  const prevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(prev => prev - 1);
    } else {
        // Loop to end
        setCurrentImageIndex(displayImages.length - 1);
    }
  };
  
  const displayImages = useMemo(() => {
    if (!product) return [];
    return (product.images && product.images.length > 0) ? product.images : [product.image];
  }, [product]);

  useEffect(() => {
    setCurrentImageIndex(0);
  }, [id]);

  const isLiked = product ? isInWishlist(product.id) : false;

  const toggleWishlist = () => {
    if (!product) return;

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background-light dark:bg-background-dark">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!product || product.isActive === false) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-white gap-4">
        <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-zinc-700">inventory_2</span>
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Producto No Disponible</h2>
          <p className="text-slate-500 dark:text-slate-400">Este producto no está disponible en este momento.</p>
        </div>
        <button 
          onClick={() => navigate(-1)}
          className="px-6 py-2 bg-primary text-white rounded-full font-medium hover:bg-primary/90 transition-colors"
        >
          Volver
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark font-sans pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-sm">
        <div className="flex items-center p-4">
          <div className="flex size-12 shrink-0 items-center justify-start">
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center justify-center rounded-full h-10 w-10 text-zinc-900 dark:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <span className="material-symbols-outlined">arrow_back_ios_new</span>
            </button>
          </div>
          <h1 className="text-lg font-bold flex-1 text-center text-zinc-900 dark:text-white">Product Details</h1>
          <div className="flex w-12 items-center justify-end">
            <button 
              onClick={toggleWishlist}
              className={`flex items-center justify-center rounded-full h-10 w-10 transition-colors ${isLiked ? 'bg-red-50 dark:bg-red-900/30 text-red-500' : 'text-zinc-900 dark:text-white hover:bg-slate-100 dark:hover:bg-zinc-800'}`}
            >
              <span 
                className="material-symbols-outlined" 
                style={{ fontVariationSettings: isLiked ? "'FILL' 1" : "'FILL' 0" }}
              >
                favorite
              </span>
            </button>
          </div>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto">
        <div className="bg-white dark:bg-zinc-900 p-4">
          <div 
            className="relative aspect-square touch-pan-y"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseLeave}
            style={{ cursor: displayImages.length > 1 ? 'grab' : 'default' }}
          >
            <img 
              alt={`${product.name} - View ${currentImageIndex + 1}`} 
              className="w-full h-full object-cover rounded-2xl shadow-sm select-none pointer-events-none" 
              src={displayImages[currentImageIndex]} 
            />
            
            {/* Image Counter Badge */}
            {displayImages.length > 1 && (
              <div className="absolute top-4 left-4 bg-white/90 dark:bg-black/50 backdrop-blur-md px-3 py-1 rounded-full shadow-sm z-10 border border-slate-200 dark:border-zinc-700">
                <span className="text-xs font-semibold text-slate-900 dark:text-white">
                  {currentImageIndex + 1} / {displayImages.length}
                </span>
              </div>
            )}
            
            {/* Dots Navigation */}
            {displayImages.length > 1 && (
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10">
                {displayImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex(index);
                    }}
                    className={`w-2 h-2 rounded-full transition-all shadow-sm ${
                      currentImageIndex === index 
                        ? 'bg-primary scale-125 w-4' 
                        : 'bg-slate-300 dark:bg-zinc-600 hover:bg-slate-400'
                    }`}
                    aria-label={`View image ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-t-3xl -mt-6 relative z-0 border-t border-slate-100 dark:border-zinc-800">
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">{product.name}</h2>
              <p className="text-2xl font-bold text-primary mt-2">{formatCurrency(product.price, currencyLocale, currencyCode)}</p>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400">
              <span>SKU: {product.sku}</span>
              <span className="h-4 border-l border-zinc-300 dark:border-zinc-700"></span>
              <span>Category: {product.category}</span>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">Description</h3>
              <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">
                {product.description}
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-3">Technical Specifications</h3>
              <div className="space-y-3">
                {Object.entries(product.specifications).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center text-sm border-b border-slate-50 dark:border-zinc-800 pb-2 last:border-0">
                    <span className="font-medium text-zinc-500 dark:text-zinc-400">{key}</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-100">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-20 p-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border-t border-zinc-200 dark:border-zinc-800 mb-16 lg:mb-0">
        <button 
          onClick={() => addToCart(product)}
          className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl text-lg flex items-center justify-center gap-2 transition-colors shadow-lg shadow-primary/20"
        >
          <span className="material-symbols-outlined">add_shopping_cart</span>
          Add to Cart
        </button>
      </div>
      
      <AuthRequiredModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </div>
  );
};

export default ProductDetailPage;
