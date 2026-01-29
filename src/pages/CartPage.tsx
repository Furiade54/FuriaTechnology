import React from 'react';
import { useCart } from '../context/CartContext';
import { useDatabase } from '../context/DatabaseContext';
import { useStoreSettings } from '../context/StoreSettingsContext';
import { useNavigate } from 'react-router-dom';
import MessageModal from '../components/MessageModal';
import AuthRequiredModal from '../components/AuthRequiredModal';
import { formatCurrency } from '../utils/currency';

const CartPage: React.FC = () => {
  const { items, removeFromCart, updateQuantity, totalPrice, clearCart, addToCart } = useCart();
  const { queries } = useDatabase();
  const { getSetting } = useStoreSettings();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isCheckingOut, setIsCheckingOut] = React.useState(false);
  const [isImporting, setIsImporting] = React.useState(false);
  const [showAuthModal, setShowAuthModal] = React.useState(false);
  const [messageModal, setMessageModal] = React.useState({
    isOpen: false,
    title: '',
    message: '',
    isError: false
  });

  const currencyLocale = getSetting('currency_locale', 'es-CO');
  const currencyCode = getSetting('currency_code', 'COP');
  const format = (amount: number) => formatCurrency(amount, currencyLocale, currencyCode);

  const handleImportWishlist = async () => {
    try {
      const currentUser = await queries.getCurrentUser();
      
      if (!currentUser) {
        setShowAuthModal(true);
        return;
      }

      setIsImporting(true);
      const wishlistProducts = await queries.getWishlistProducts(currentUser.id);
      
      if (wishlistProducts.length === 0) {
        setMessageModal({
          isOpen: true,
          title: 'Sin Favoritos',
          message: 'No tienes productos en tu lista de favoritos.',
          isError: false
        });
        setIsImporting(false);
        return;
      }

      let addedCount = 0;
      wishlistProducts.forEach(product => {
        // Check if already in cart to avoid duplicates
        const isInCart = items.some(item => item.id === product.id);
        if (!isInCart) {
          addToCart(product);
          addedCount++;
        }
      });

      if (addedCount > 0) {
        setMessageModal({
          isOpen: true,
          title: 'Importamos tus favoritos!',
          message: `Se han importado ${addedCount} productos nuevos al carrito.`,
          isError: false
        });
      } else {
        setMessageModal({
          isOpen: true,
          title: 'Sin cambios',
          message: 'Todos tus favoritos ya estaban en el carrito.',
          isError: false
        });
      }
      setIsMenuOpen(false);
      
    } catch (error) {
      console.error("Error importing wishlist", error);
      setMessageModal({
        isOpen: true,
        title: 'Error',
        message: 'Hubo un error al importar tus favoritos.',
        isError: true
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleCheckout = async () => {
    if (items.length === 0) return;

    setIsCheckingOut(true);

    try {
      const currentUser = await queries.getCurrentUser();
      const phoneNumber = getSetting('contact_whatsapp', import.meta.env.VITE_WHATSAPP_NUMBER || '573000000000');
      const productsList = items.map(item => 
        `Product: ${item.quantity} x ${item.name} (${format(item.price)})`
      ).join('\n');

      if (currentUser) {
        // User logged in: Create order in DB
        const orderItems = items.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price
        }));

        const orderId = await queries.createOrder(currentUser.id, orderItems, totalPrice);
        
        console.log('Order created:', orderId);
        
        // Notification Logic
        if (localStorage.getItem('notifications') === 'true' && Notification.permission === 'granted') {
             try {
                new Notification('Pedido Recibido', { 
                    body: `Tu pedido #${orderId.slice(-8).toUpperCase()} ha sido registrado correctamente.`,
                    icon: '/pwa-192x192.png'
                });
             } catch (e) {
                 console.error("Error showing notification:", e);
             }
        }

        // Clear cart
        clearCart();
        
        const message = `Hola, soy ${currentUser.name}. He realizado el pedido #${orderId} en la app:\n\n${productsList}\n\nTotal: ${format(totalPrice)} Quiero verificar disponibilidad y tiempo de entrega`;
        
        const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');

        // Navigate to profile to see orders
        navigate('/profile', { state: { openOrders: true } });
      } else {
        // Guest user: Direct WhatsApp without DB storage
        const message = `Hola, me gustaría realizar el siguiente pedido:\n\n${productsList}\n\nTotal: ${format(totalPrice)}\n\nQuedo atento a disponibilidad y detalles de pago.`;
        
        const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
      }

    } catch (error) {
      console.error('Checkout error:', error);
      alert('Hubo un error al procesar el pedido.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark font-sans pb-24">
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
          <h1 className="text-lg font-bold flex-1 text-center text-slate-900 dark:text-white">Carrito de Compras</h1>
          <div className="flex items-center justify-end relative gap-1">
            <button 
              onClick={() => navigate('/profile', { state: { openWishlist: true } })}
              className="flex items-center justify-center rounded-full h-10 w-10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <span className="material-symbols-outlined">favorite</span>
            </button>

            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`flex items-center justify-center rounded-full h-10 w-10 transition-colors ${isMenuOpen ? 'bg-primary/10 text-primary' : 'text-slate-600 dark:text-slate-300'}`}
            >
              <span className="material-symbols-outlined">more_vert</span>
            </button>
            
            {isMenuOpen && (
              <div className="absolute top-12 right-0 w-48 bg-white dark:bg-zinc-800 rounded-lg shadow-xl border border-slate-100 dark:border-zinc-700 overflow-hidden z-20">
                <div className="p-2 space-y-1">
                  <button 
                    onClick={handleImportWishlist}
                    disabled={isImporting}
                    className="w-full text-left px-3 py-2 text-sm rounded-md text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-zinc-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined text-lg text-red-500" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                    <span className="material-symbols-outlined text-lg">move_to_inbox</span>
                    Importar Favoritos
                  </button>
                  <button 
                    onClick={() => { clearCart(); setIsMenuOpen(false); }}
                    disabled={items.length === 0}
                    className="w-full text-left px-3 py-2 text-sm rounded-md text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined text-lg">delete_sweep</span>
                    Vaciar Carrito
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[50vh] text-slate-500 dark:text-slate-400">
            <span className="material-symbols-outlined text-6xl mb-4 opacity-50">shopping_cart_off</span>
            <h2 className="text-xl font-semibold mb-2">Tu carrito está vacío</h2>
            <p>Empieza a comprar para agregar productos.</p>
            <div className="flex flex-col gap-3 mt-6 w-full max-w-xs px-4">
              <button 
                onClick={() => navigate('/')}
                className="w-full px-6 py-2 bg-primary text-white rounded-full font-medium hover:bg-primary/90 transition-colors"
              >
                Explorar Productos
              </button>
              <button 
                onClick={handleImportWishlist}
                disabled={isImporting}
                className="w-full px-6 py-2 bg-white dark:bg-zinc-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-zinc-700 rounded-full font-medium hover:bg-slate-50 dark:hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm text-red-500" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                <span className="material-symbols-outlined text-sm">move_to_inbox</span>
                Importar desde Favoritos
              </button>
            </div>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="bg-white dark:bg-zinc-900 rounded-2xl p-4 flex gap-4 shadow-sm border border-slate-100 dark:border-zinc-800">
              <div className="w-24 h-24 bg-slate-100 dark:bg-zinc-800 rounded-xl overflow-hidden shrink-0 cursor-pointer" onClick={() => navigate(`/product/${item.id}`)}>
                {item.image && item.image.trim() !== '' ? (
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-200 dark:bg-zinc-700">
                    <span className="material-symbols-outlined text-slate-400">image</span>
                  </div>
                )}
              </div>
              
              <div className="flex-1 flex flex-col justify-between py-1">
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-semibold text-slate-900 dark:text-white line-clamp-2 text-sm">{item.name}</h3>
                  <button 
                    onClick={() => removeFromCart(item.id)}
                    className="text-slate-400 hover:text-red-500 transition-colors -mr-2 -mt-2 p-2"
                  >
                    <span className="material-symbols-outlined text-xl">delete</span>
                  </button>
                </div>
                
                <div className="flex justify-between items-end mt-2">
                  <div className="flex flex-col">
                    <p className="font-bold text-lg text-slate-900 dark:text-white">
                      {format(item.price)}
                    </p>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Total: <span className="text-primary">{format(item.price * item.quantity)}</span>
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3 bg-slate-50 dark:bg-zinc-800 rounded-lg p-1">
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-7 h-7 flex items-center justify-center rounded-md bg-white dark:bg-zinc-700 shadow-sm text-slate-600 dark:text-slate-300 hover:text-primary active:scale-95 transition-all"
                    >
                      <span className="material-symbols-outlined text-sm">remove</span>
                    </button>
                    <span className="w-4 text-center font-semibold text-slate-900 dark:text-white text-sm">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-7 h-7 flex items-center justify-center rounded-md bg-white dark:bg-zinc-700 shadow-sm text-slate-600 dark:text-slate-300 hover:text-primary active:scale-95 transition-all"
                    >
                      <span className="material-symbols-outlined text-sm">add</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {items.length > 0 && (
        <div className="sticky bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border-t border-slate-200 dark:border-zinc-800 mb-16 lg:mb-0">
          <div className="flex flex-col gap-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 dark:text-slate-400">Subtotal (Precios Unitarios)</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {format(items.reduce((sum, item) => sum + item.price, 0))}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-slate-900 dark:text-white">Total</span>
                <span className="text-2xl font-bold text-primary">{format(totalPrice)}</span>
              </div>
            </div>
            <button 
              onClick={handleCheckout}
              disabled={isCheckingOut}
              className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-bold py-4 rounded-xl text-lg flex items-center justify-center gap-2 transition-colors shadow-lg shadow-[#25D366]/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCheckingOut ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
                  Procesando...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
                  </svg>
                  Completar en WhatsApp
                </>
              )}
            </button>
          </div>
        </div>
      )}
      
      <MessageModal 
        isOpen={messageModal.isOpen}
        title={messageModal.title}
        message={messageModal.message}
        isError={messageModal.isError}
        onClose={() => setMessageModal(prev => ({ ...prev, isOpen: false }))}
      />

      <AuthRequiredModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
};

export default CartPage;
