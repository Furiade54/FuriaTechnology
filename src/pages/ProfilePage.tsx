import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDatabase } from '../context/DatabaseContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useStoreSettings } from '../context/StoreSettingsContext';
import { useNotification } from '../context/NotificationContext';
import { formatCurrency } from '../utils/currency';
import { PROFILE_SECTIONS } from '../constants/ui';
import type { User, Order, PaymentMethod } from '../types';

export default function ProfilePage() {
  const { queries } = useDatabase();
  const { clearCart, restoreCart } = useCart();
  const { wishlistCount } = useWishlist();
  const { getSetting } = useStoreSettings();
  const { notificationsEnabled, setNotificationsEnabled, requestPermission } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [orderToEdit, setOrderToEdit] = useState<Order | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  
  const [user, setUser] = useState<User | null>(null);
  const profileSections = PROFILE_SECTIONS;
  const [showPersonalForm, setShowPersonalForm] = useState(false);
  const [showOrders, setShowOrders] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [activeOrdersCount, setActiveOrdersCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const currencyLocale = getSetting('currency_locale', 'es-CO');
  const currencyCode = getSetting('currency_code', 'COP');
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark';
    }
    return false;
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const currentUser = await queries.getCurrentUser();
        setUser(currentUser);
        
        if (currentUser) {
          const userOrders = await queries.getOrdersByUser(currentUser.id);
          setOrders(userOrders);
          const active = userOrders.filter(o => o.status === 'pending').length;
          setActiveOrdersCount(active);
        }
        
        const methods = await queries.getPaymentMethods();
        setPaymentMethods(methods);

      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserData();
  }, [queries]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Update local state when user is loaded
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setCity(user.city || '');
    }
  }, [user]);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [orderToReturn, setOrderToReturn] = useState<Order | null>(null);

  const handleReturnRequest = (order: Order) => {
    setOrderToReturn(order);
    setShowReturnModal(true);
  };

  const processReturnRequest = () => {
    if (!orderToReturn) return;
    
    // Format message for WhatsApp
    const message = `Hola, quisiera solicitar una devolución/garantía para el pedido #${orderToReturn.id.slice(0, 8)}.
    
Motivo: [Escriba aquí el motivo]

Detalles del pedido:
Total: ${formatCurrency(orderToReturn.total, currencyLocale, currencyCode)}
Fecha: ${new Date(orderToReturn.createdAt).toLocaleDateString()}
`;
    
    const phoneNumber = getSetting('contact_whatsapp', import.meta.env.VITE_WHATSAPP_NUMBER || '573000000000');
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    setShowReturnModal(false);
    setOrderToReturn(null);
  };


  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    try {
      setIsUploadingAvatar(true);
      // @ts-ignore - dynamic method added to queries
      const url = await queries.uploadFile(file, 'company-assets');
      
      const updatedUser = { ...user, avatar: url };
      await queries.updateUser(updatedUser);
      setUser(updatedUser);
    } catch (error) {
      console.error("Error uploading avatar:", error);
      alert("Error al subir el avatar. Inténtalo de nuevo.");
    } finally {
      setIsUploadingAvatar(false);
      // Reset input value to allow selecting the same file again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const updatedUser = {
        ...user,
        name,
        phone,
        city
      };
      
      await queries.updateUser(updatedUser);
      setUser(updatedUser);
      alert('Perfil actualizado correctamente');
      setShowPersonalForm(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Error al actualizar el perfil");
    }
  };

  const onDelete = async (orderId: string) => {
    setOrderToDelete(orderId);
  };

  const onRestore = async (order: Order) => {
    setOrderToEdit(order);
  };

  useEffect(() => {
    if (user) {
      // Logic for navigation state
      if (location.state?.openOrders) {
        setShowOrders(true);
        setShowPersonalForm(false);
        // Orders are already fetched in the main useEffect
        window.history.replaceState({}, document.title);
      } else if (location.state?.openWishlist) {
        navigate('/profile/wishlist');
      }
    } else if (!isLoading) {
      navigate('/login');
    }
  }, [location.state, user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-zinc-950">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    // This will handle the redirect in useEffect, but return null/loader here to prevent flash
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark font-sans pb-24">
      <div className="sticky top-0 z-10 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-sm border-b border-slate-200 dark:border-zinc-800">
        <div className="flex items-center p-4">
          <h1 className="text-lg font-bold flex-1 text-center text-slate-900 dark:text-white">Perfil</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        <div className="flex flex-col items-center gap-4 py-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-slate-200 dark:bg-zinc-800 overflow-hidden border-4 border-white dark:border-zinc-700 shadow-sm flex items-center justify-center relative">
              {user.avatar ? (
                <img 
                  src={user.avatar}
                  alt="Avatar de Usuario" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-4xl font-bold text-slate-400 dark:text-slate-500 uppercase">
                  {user.name.charAt(0)}
                </span>
              )}
              {isUploadingAvatar && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
                </div>
              )}
            </div>
            <button 
              className="absolute bottom-0 right-0 p-1.5 bg-primary text-white rounded-full shadow-lg hover:bg-primary/90 transition-colors z-20"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingAvatar}
              aria-label="Cambiar foto de perfil"
            >
              <span className="material-symbols-outlined text-sm">edit</span>
            </button>
            <input 
              type="file" 
              ref={fileInputRef}
              className="hidden" 
              accept="image/*"
              onChange={handleAvatarUpload}
            />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{user.name}</h2>
            <p className="text-slate-500 dark:text-slate-400">{user.email}</p>
          </div>
        </div>

        <div className="space-y-3">
          {profileSections.map((section) => {
            const isPersonalInfo = section.route === '/profile/info';
            const isOrders = section.route === '/profile/orders';
            const isWishlist = section.route === '/profile/wishlist';
            const isPaymentMethods = section.route === '/profile/payment-methods';
            const isSettings = section.route === '/settings';

            const showFormHere = isPersonalInfo && showPersonalForm;
            const showOrdersHere = isOrders && showOrders;
            const showPaymentMethodsHere = isPaymentMethods && showPaymentMethods;
            const showSettingsHere = isSettings && showSettings;

            return (
              <div
                key={section.id}
                className={(showFormHere || showOrdersHere || showSettingsHere || showPaymentMethodsHere) ? 'space-y-3' : undefined}
              >
                <button
                  type="button"
                  onClick={() => {
                    if (isPersonalInfo) {
                      setShowPersonalForm(!showPersonalForm);
                      setShowOrders(false);
                      setShowSettings(false);
                      setShowPaymentMethods(false);
                    } else if (isOrders) {
                      setShowOrders(!showOrders);
                      setShowPersonalForm(false);
                      setShowSettings(false);
                      setShowPaymentMethods(false);
                      // Refresh orders
                      if (user) {
                        queries.getOrdersByUser(user.id).then(setOrders);
                      }
                    } else if (isWishlist) {
                      navigate('/profile/wishlist');
                    } else if (isPaymentMethods) {
                      setShowPaymentMethods(!showPaymentMethods);
                      setShowPersonalForm(false);
                      setShowOrders(false);
                      setShowSettings(false);
                    } else if (isSettings) {
                        setShowSettings(!showSettings);
                        setShowPersonalForm(false);
                        setShowOrders(false);
                        setShowPaymentMethods(false);
                    }
                  }}
                  className="w-full flex items-center gap-4 p-4 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-slate-100 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800/80 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined">{section.icon}</span>
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold text-slate-900 dark:text-white">{section.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{section.subtitle}</p>
                  </div>
                  
                  {isOrders && activeOrdersCount > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                      {activeOrdersCount}
                    </span>
                  )}

                  {isWishlist && wishlistCount > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                      {wishlistCount}
                    </span>
                  )}

                  <span className={`material-symbols-outlined text-slate-400 transition-transform duration-300 ${
                    showFormHere || showOrdersHere || showSettingsHere || showPaymentMethodsHere ? 'rotate-90' : ''
                  }`}>
                    chevron_right
                  </span>
                </button>

                {showPaymentMethodsHere && (
                  <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-slate-100 dark:border-zinc-800 space-y-4">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Cuentas para Consignar</h3>
                    <p className="text-xs text-slate-500 mb-4">Utiliza estas cuentas para realizar pagos directos al vendedor.</p>
                    
                    <div className="space-y-3">
                      {paymentMethods.length > 0 ? (
                        paymentMethods.map((method) => (
                          <div key={method.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-zinc-800/50 rounded-xl border border-slate-100 dark:border-zinc-800">
                            <div className="w-10 h-10 rounded-full bg-white dark:bg-zinc-700 flex items-center justify-center shrink-0 shadow-sm">
                              <span className={`material-symbols-outlined ${
                                method.bankName.toLowerCase().includes('bancolombia') ? 'text-yellow-500' :
                                method.bankName.toLowerCase().includes('davivienda') ? 'text-red-600' :
                                method.bankName.toLowerCase().includes('nequi') ? 'text-purple-600' :
                                method.bankName.toLowerCase().includes('breb') ? 'text-blue-600' :
                                'text-slate-600 dark:text-slate-300'
                              }`}>
                                {method.bankName.toLowerCase().includes('bancolombia') ? 'account_balance' : 
                                 method.bankName.toLowerCase().includes('nequi') ? 'smartphone' :
                                 method.bankName.toLowerCase().includes('davivienda') ? 'home_work' : 
                                 method.bankName.toLowerCase().includes('breb') ? 'key' : 'credit_card'}
                              </span>
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-slate-900 dark:text-white text-sm">{method.bankName} {method.accountType ? `- ${method.accountType}` : ''}</p>
                              <div className="flex items-center gap-2">
                                <code className="text-xs bg-white dark:bg-zinc-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-zinc-700 font-mono text-slate-600 dark:text-slate-300">
                                  {method.accountNumber}
                                </code>
                                <button 
                                  onClick={() => {
                                    navigator.clipboard.writeText(method.accountNumber);
                                    // Could add a toast here
                                  }}
                                  className="text-primary hover:text-primary-dark"
                                  title="Copiar"
                                >
                                  <span className="material-symbols-outlined text-[16px]">content_copy</span>
                                </button>
                              </div>
                              {method.accountHolder && (
                                <p className="text-xs text-slate-500 mt-1">Titular: {method.accountHolder}</p>
                              )}
                              {method.instructions && (
                                <p className="text-xs text-slate-400 mt-1 italic">{method.instructions}</p>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500 text-center py-4">No hay métodos de pago disponibles.</p>
                      )}
                    </div>
                  </div>
                )}

                {showSettingsHere && (
                    <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-slate-100 dark:border-zinc-800 space-y-4">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Preferencias</h3>
                        
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300">
                                    <span className="material-symbols-outlined text-[20px]">{isDarkMode ? 'dark_mode' : 'light_mode'}</span>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-900 dark:text-white">Modo Oscuro</p>
                                    <p className="text-xs text-slate-500">Cambiar apariencia</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsDarkMode(!isDarkMode)}
                                className={`w-12 h-6 rounded-full transition-colors relative ${isDarkMode ? 'bg-primary' : 'bg-slate-200 dark:bg-zinc-700'}`}
                            >
                                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${isDarkMode ? 'left-7' : 'left-1'}`} />
                            </button>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300">
                                    <span className="material-symbols-outlined text-[20px]">notifications</span>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-900 dark:text-white">Notificaciones</p>
                                    <p className="text-xs text-slate-500">Alertas de pedidos</p>
                                </div>
                            </div>
                            <button 
                                onClick={async () => {
                                    if (!notificationsEnabled) {
                                        await requestPermission();
                                    } else {
                                        setNotificationsEnabled(false);
                                    }
                                }}
                                className={`w-12 h-6 rounded-full transition-colors relative ${notificationsEnabled ? 'bg-primary' : 'bg-slate-200 dark:bg-zinc-700'}`}
                            >
                                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${notificationsEnabled ? 'left-7' : 'left-1'}`} />
                            </button>
                        </div>

                        <div className="flex items-center justify-between">
                             <div className="flex items-center gap-3">
                                <div className="p-2 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300">
                                    <span className="material-symbols-outlined text-[20px]">language</span>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-900 dark:text-white">Idioma</p>
                                    <p className="text-xs text-slate-500">Español</p>
                                </div>
                            </div>
                            <span className="text-xs text-slate-500 font-medium">ES</span>
                        </div>
                    </div>
                )}

                {showOrdersHere && (
                  <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-slate-100 dark:border-zinc-800 space-y-4">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Mis Pedidos ({orders.length})</h3>
                    {orders.length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-4">No tienes pedidos aún.</p>
                    ) : (
                        <div className="space-y-4">
                            {orders.map(order => (
                                <OrderItem 
                                    key={order.id}
                                    order={order}
                                    currencyLocale={currencyLocale}
                                    currencyCode={currencyCode}
                                    onRestore={onRestore}
                                    onDelete={onDelete}
                                    onReturnRequest={handleReturnRequest}
                                />
                            ))}
                        </div>
                    )}
                  </div>
                )}

                {showFormHere && (
                  <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-slate-100 dark:border-zinc-800 space-y-4">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Información Personal</h3>
                    <form
                      className="space-y-4"
                      onSubmit={handleUpdateProfile}
                    >
                      <div className="space-y-1">
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                          Nombre
                        </label>
                        <input
                          value={name}
                          onChange={(event) => setName(event.target.value)}
                          className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                          placeholder="Tu nombre"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                          Teléfono
                        </label>
                        <input
                          value={phone}
                          onChange={(event) => setPhone(event.target.value)}
                          className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                          placeholder="+57 300 000 0000"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                          Ciudad
                        </label>
                        <input
                          value={city}
                          onChange={(event) => setCity(event.target.value)}
                          className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                          placeholder="Tu ciudad"
                        />
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowPersonalForm(false)}
                          className="flex-1 h-10 rounded-xl border border-slate-200 dark:border-zinc-700 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-zinc-800/80 transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="flex-1 h-10 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors"
                        >
                          Guardar
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button 
          onClick={() => setShowLogoutModal(true)}
          className="w-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
        >
          <span className="material-symbols-outlined">logout</span>
          Cerrar Sesión
        </button>
      </div>
      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-2xl">logout</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">¿Cerrar Sesión?</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                ¿Estás seguro de que quieres cerrar sesión? Tendrás que volver a ingresar tus datos para acceder a tu cuenta.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem('currentUserId');
                  clearCart();
                  navigate('/login');
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-colors text-sm shadow-sm shadow-red-200 dark:shadow-none"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {orderToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-2xl">warning</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">¿Eliminar pedido?</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Esta acción no se puede deshacer. El pedido será eliminado permanentemente de tu historial.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setOrderToDelete(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  try {
                    queries.deleteOrder(orderToDelete);
                    setOrders(orders.filter(o => o.id !== orderToDelete));
                    // Check if the deleted order was pending to update badge
                    const deletedOrder = orders.find(o => o.id === orderToDelete);
                    if (deletedOrder?.status === 'pending') {
                      setActiveOrdersCount(prev => Math.max(0, prev - 1));
                    }
                    setOrderToDelete(null);
                  } catch (e) {
                    alert('Error al eliminar el pedido');
                  }
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-colors text-sm shadow-sm shadow-red-200 dark:shadow-none"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Confirmation Modal */}
      {orderToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-2xl">edit_note</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">¿Editar Pedido?</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Este proceso eliminará la orden actual y le permitirá realizar los cambios. 
                <span className="block mt-2 font-medium text-slate-700 dark:text-slate-300">
                  Debe volver a dar clic en el botón de WhatsApp para volver a montar el pedido con los cambios realizados.
                </span>
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setOrderToEdit(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  try {
                    const cartItems = orderToEdit.items?.map(i => ({ id: i.productId, quantity: i.quantity })) || [];
                    if (cartItems.length > 0) {
                      restoreCart(cartItems);
                      queries.deleteOrder(orderToEdit.id);
                      setOrders(orders.filter(o => o.id !== orderToEdit.id));
                      navigate('/cart');
                    } else {
                      alert('No se pudieron recuperar los items del pedido');
                    }
                  } catch (e) {
                    alert('Error al procesar la solicitud');
                  }
                  setOrderToEdit(null);
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors text-sm shadow-sm shadow-blue-200 dark:shadow-none"
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return Request Modal */}
      {showReturnModal && orderToReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-2xl">assignment_return</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Solicitar Devolución</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Serás redirigido a WhatsApp para procesar tu solicitud de devolución o garantía para el pedido #{orderToReturn.id.slice(-8).toUpperCase()}.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setShowReturnModal(false);
                  setOrderToReturn(null);
                }}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={processReturnRequest}
                className="flex-1 px-4 py-2.5 rounded-xl bg-green-600 text-white font-medium hover:bg-green-700 transition-colors text-sm shadow-sm shadow-green-200 dark:shadow-none flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">chat</span>
                WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const canEditOrDelete = (status: string) => {
  return ['pending', 'on_hold', 'received'].includes(status);
};

const canRequestReturn = (status: string) => {
  return ['delivered', 'completed'].includes(status);
};

const OrderItem = ({ 
  order, 
  currencyLocale, 
  currencyCode, 
  onRestore, 
  onDelete,
  onReturnRequest
}: { 
  order: Order; 
  currencyLocale: string; 
  currencyCode: string; 
  onRestore: (order: Order) => void; 
  onDelete: (orderId: string) => void;
  onReturnRequest: (order: Order) => void;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const itemCount = order.items?.reduce((acc, item) => acc + item.quantity, 0) || 0;

  return (
    <div className="border-b border-slate-100 dark:border-zinc-800 last:border-0 pb-4 last:pb-0">
      <div 
        className="flex flex-col gap-2 cursor-pointer" 
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                Pedido #{order.id.slice(-8).toUpperCase()}
                </p>
                <span className={`material-symbols-outlined text-lg transition-transform duration-300 text-slate-400 ${isExpanded ? 'rotate-180' : ''}`}>
                    expand_more
                </span>
            </div>
            <p className="text-xs text-slate-500">
              {new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString()}
            </p>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full ${
            ({
              pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
              received: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
              processing: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
              on_hold: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
              shipped: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
              delivered: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
              completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
              cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
              issue: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
            } as Record<string, string>)[order.status]
          }`}>
            {({
              pending: 'Pendiente',
              received: 'Recibido',
              processing: 'Procesando',
              on_hold: 'En espera',
              shipped: 'Enviado',
              delivered: 'Entregado',
              completed: 'Completado',
              cancelled: 'Cancelado',
              issue: 'Con incidencia'
            } as Record<string, string>)[order.status]}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
            <p className="text-xs text-slate-500">
                {itemCount} {itemCount === 1 ? 'producto' : 'productos'}
            </p>
            <p className="text-sm font-bold text-slate-900 dark:text-white">
                {formatCurrency(order.total, currencyLocale, currencyCode)}
            </p>
        </div>
      </div>

      <div className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100 mt-4' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
            {order.notes && (
                <div className="mb-3 p-2 rounded-lg bg-slate-50 dark:bg-zinc-800 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                <span className="material-symbols-outlined text-slate-500 dark:text-slate-400 text-sm">info</span>
                <p className="flex-1">{order.notes}</p>
                </div>
            )}
            
            <div className="space-y-2 mb-4">
                {order.items?.map(item => (
                    <div key={item.id} className="flex gap-2 text-xs">
                        <img src={item.productImage} className="w-8 h-8 rounded bg-slate-100 object-cover" alt="" />
                        <div className="flex-1">
                            <p className="text-slate-900 dark:text-slate-200 line-clamp-1">{item.productName}</p>
                            <p className="text-slate-500">{item.quantity} x ${item.price}</p>
                        </div>
                    </div>
                ))}
            </div>

                {canEditOrDelete(order.status) && (
                  <div className="flex border-t border-slate-100 dark:border-zinc-800 p-2 gap-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onRestore(order);
                        }}
                        className="flex-1 text-xs text-blue-600 hover:text-blue-800 font-medium px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors flex items-center justify-center gap-1"
                    >
                        <span className="material-symbols-outlined text-[16px]">edit</span>
                        Editar Pedido
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(order.id);
                        }}
                        className="flex-1 text-xs text-red-500 hover:text-red-700 font-medium px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors flex items-center justify-center gap-1"
                    >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                        Eliminar
                    </button>
                  </div>
                )}
                
                {canRequestReturn(order.status) && (
                   <div className="flex border-t border-slate-100 dark:border-zinc-800 p-2 gap-2">
                     <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onReturnRequest(order);
                        }}
                        className="flex-1 text-xs text-amber-600 hover:text-amber-800 font-medium px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors flex items-center justify-center gap-1"
                    >
                        <span className="material-symbols-outlined text-[16px]">assignment_return</span>
                        Solicitar Devolución
                    </button>
                   </div>
                )}
        </div>
      </div>
    </div>
  );
};
