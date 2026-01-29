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
  const { addToCart, items } = useCart();
  const { queries } = useDatabase();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { getSetting } = useStoreSettings();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [product, setProduct] = useState<Product | undefined>(undefined);

  const cartItem = useMemo(() => items.find(item => item.id === product?.id), [items, product]);
  const quantity = cartItem?.quantity || 0;
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

  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialPinchDist, setInitialPinchDist] = useState<number | null>(null);
  const [initialScale, setInitialScale] = useState(1);

  // Reset zoom when image changes or viewer closes
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [currentImageIndex, isViewerOpen]);

  // Main Image Handlers (Tap to Open + Swipe)
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null); // Reset touch end
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart) return;
    
    // Tap detection (no move or very small move)
    if (!touchEnd || Math.abs(touchStart - touchEnd) < 5) {
      setIsViewerOpen(true);
      setTouchStart(null);
      setTouchEnd(null);
      return;
    }
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      nextImage();
    } else if (isRightSwipe) {
      prevImage();
    }
    
    setTouchStart(null);
    setTouchEnd(null);
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
    if (!touchStart) {
        setTouchStart(null);
        setTouchEnd(null);
        return;
    }
    
    // Click detection
    if (!touchEnd || Math.abs(touchStart - touchEnd) < 5) {
        setIsViewerOpen(true);
        setTouchStart(null);
        setTouchEnd(null);
        return;
    }
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      nextImage();
    } else if (isRightSwipe) {
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

  // Viewer Handlers (Zoom + Pan + Swipe)
  const onViewerWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    const delta = -Math.sign(e.deltaY) * 0.5;
    const newScale = Math.min(Math.max(1, scale + delta), 4);
    setScale(newScale);
    if (newScale === 1) setPosition({ x: 0, y: 0 });
  };

  const onViewerTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (e.touches.length === 2) {
      // Pinch Start
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      setInitialPinchDist(dist);
      setInitialScale(scale);
    } else if (e.touches.length === 1) {
      // Pan/Swipe Start
      setTouchStart(e.touches[0].clientX);
      setDragStart({ x: e.touches[0].clientX - position.x, y: e.touches[0].clientY - position.y });
      setIsDragging(true);
    }
  };

  const onViewerTouchMove = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (e.touches.length === 2 && initialPinchDist !== null) {
      // Pinch Move
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const delta = dist - initialPinchDist;
      const newScale = Math.min(Math.max(1, initialScale + delta * 0.01), 4);
      setScale(newScale);
      if (newScale === 1) setPosition({ x: 0, y: 0 });
    } else if (e.touches.length === 1 && isDragging) {
      if (scale > 1) {
        // Pan
        setPosition({
          x: e.touches[0].clientX - dragStart.x,
          y: e.touches[0].clientY - dragStart.y
        });
      } else {
        // Swipe tracking
        setTouchEnd(e.touches[0].clientX);
      }
    }
  };

  const onViewerTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    setIsDragging(false);
    setInitialPinchDist(null);

    if (scale > 1) return; // Don't swipe if zoomed in

    if (touchStart && touchEnd) {
      const distance = touchStart - touchEnd;
      if (distance > minSwipeDistance) nextImage();
      else if (distance < -minSwipeDistance) prevImage();
    }
    setTouchStart(null);
    setTouchEnd(null);
  };

  const onViewerMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    setTouchStart(e.clientX); // For swipe detection logic reuse
  };

  const onViewerMouseMove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isDragging) return;

    if (scale > 1) {
        setPosition({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y
        });
    } else {
        setTouchEnd(e.clientX);
    }
  };

  const onViewerMouseUp = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDragging(false);
    
    if (scale > 1) return;

    if (touchStart && touchEnd) {
        const distance = touchStart - touchEnd;
        if (distance > minSwipeDistance) nextImage();
        else if (distance < -minSwipeDistance) prevImage();
    }
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
    const images = (product.images && product.images.length > 0) ? product.images : (product.image ? [product.image] : []);
    return images.filter(img => img && img.trim() !== '');
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
          <h1 className="text-lg font-bold flex-1 text-center text-zinc-900 dark:text-white">Detalles del Producto</h1>
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
            style={{ cursor: displayImages.length > 1 ? 'grab' : 'zoom-in' }}
          >
            <img 
              alt={`${product.name} - View ${currentImageIndex + 1}`} 
              className="w-full h-full object-contain rounded-2xl shadow-sm select-none pointer-events-none" 
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
                    aria-label={`Ver imagen ${index + 1}`}
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
              <span>Categoría: {product.category}</span>
            </div>
            
            <div className="flex flex-col gap-2">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Descripción</h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {product.description}
              </p>
            </div>

            {product.specifications && Object.keys(product.specifications).length > 0 && (
              <div className="flex flex-col gap-2">
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Especificaciones Técnicas</h2>
                <div className="grid grid-cols-1 gap-2">
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                      <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <span className="text-sm font-semibold text-zinc-900 dark:text-white">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-20 p-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border-t border-zinc-200 dark:border-zinc-800 mb-16 lg:mb-0">
        <button 
          onClick={() => addToCart(product)}
          className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl text-lg flex items-center justify-center gap-2 transition-colors shadow-lg shadow-primary/20"
        >
          {quantity > 0 ? (
            <>
              <span className="text-2xl font-bold mr-1">{quantity}</span>
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>shopping_cart</span>
            </>
          ) : (
            <span className="material-symbols-outlined">add_shopping_cart</span>
          )}
          Agregar al Carrito
        </button>
      </div>
      
      <AuthRequiredModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />

      {/* Full Screen Image Viewer */}
      {isViewerOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsViewerOpen(false)}>
          <button 
            onClick={() => setIsViewerOpen(false)}
            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white transition-colors z-[110]"
          >
            <span className="material-symbols-outlined text-4xl">close</span>
          </button>
          
          <div className="relative w-full h-full flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()} onWheel={onViewerWheel}>
            {displayImages.length > 1 && (
                <button 
                    onClick={(e) => { e.stopPropagation(); prevImage(); }}
                    className="absolute left-2 md:left-8 p-2 rounded-full bg-black/20 text-white/70 hover:text-white hover:bg-black/40 transition-all z-[110]"
                >
                    <span className="material-symbols-outlined text-4xl md:text-6xl">chevron_left</span>
                </button>
            )}

            {displayImages.length > 0 ? (
              <img 
                src={displayImages[currentImageIndex]} 
                alt={product.name} 
                className="max-w-full max-h-full object-contain select-none"
                onTouchStart={onViewerTouchStart}
                onTouchMove={onViewerTouchMove}
                onTouchEnd={onViewerTouchEnd}
                onMouseDown={onViewerMouseDown}
                onMouseMove={onViewerMouseMove}
                onMouseUp={onViewerMouseUp}
                onMouseLeave={onViewerMouseUp}
                style={{ 
                  cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
                  transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                  transition: isDragging ? 'none' : 'transform 0.2s ease-out',
                  touchAction: 'none'
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="material-symbols-outlined text-6xl text-white/50">image_not_supported</span>
              </div>
            )}
            
            {displayImages.length > 1 && (
                <button 
                    onClick={(e) => { e.stopPropagation(); nextImage(); }}
                    className="absolute right-2 md:right-8 p-2 rounded-full bg-black/20 text-white/70 hover:text-white hover:bg-black/40 transition-all z-[110]"
                >
                    <span className="material-symbols-outlined text-4xl md:text-6xl">chevron_right</span>
                </button>
            )}

            {/* Viewer Dots */}
            {displayImages.length > 1 && (
              <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-3 z-[110] pointer-events-none">
                {displayImages.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all shadow-sm ${
                      currentImageIndex === index 
                        ? 'bg-white scale-150' 
                        : 'bg-white/30'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetailPage;
