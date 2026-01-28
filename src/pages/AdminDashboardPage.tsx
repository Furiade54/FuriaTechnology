import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDatabase } from '../context/DatabaseContext';
import { useStoreSettings } from '../context/StoreSettingsContext';
import ConfirmationModal from '../components/ConfirmationModal';
import Modal from '../components/Modal';
import type { User, Order, Product, Category, Banner, PaymentMethod } from '../types';
import { formatCurrency } from '../utils/currency';

const AVAILABLE_ICONS = [
  { value: 'category', label: 'General' },
  { value: 'smartphone', label: 'Celulares' },
  { value: 'laptop', label: 'Computadoras' },
  { value: 'headphones', label: 'Audio' },
  { value: 'watch', label: 'Relojes' },
  { value: 'checkroom', label: 'Ropa' },
  { value: 'styler', label: 'Moda' },
  { value: 'home', label: 'Hogar' },
  { value: 'chair', label: 'Muebles' },
  { value: 'kitchen', label: 'Cocina' },
  { value: 'fitness_center', label: 'Deportes' },
  { value: 'sports_soccer', label: 'Fútbol' },
  { value: 'directions_bike', label: 'Ciclismo' },
  { value: 'face', label: 'Belleza' },
  { value: 'spa', label: 'Cuidado Personal' },
  { value: 'videogame_asset', label: 'Videojuegos' },
  { value: 'toys', label: 'Juguetes' },
  { value: 'pets', label: 'Mascotas' },
  { value: 'local_offer', label: 'Ofertas' },
  { value: 'restaurant', label: 'Restaurante' },
  { value: 'local_cafe', label: 'Café' },
  { value: 'fastfood', label: 'Comida Rápida' },
  { value: 'menu_book', label: 'Libros' },
  { value: 'auto_stories', label: 'Educación' },
  { value: 'school', label: 'Escuela' },
  { value: 'work', label: 'Trabajo' },
  { value: 'flight', label: 'Viajes' },
  { value: 'local_shipping', label: 'Envíos' },
];

const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { queries, isReady } = useDatabase();
  const { getSetting, refreshSettings } = useStoreSettings();
  const currencyLocale = getSetting('currency_locale', 'es-CO');
  const currencyCode = getSetting('currency_code', 'COP');

  const [activeTab, setActiveTab] = useState<'users' | 'orders' | 'products' | 'categories' | 'banners' | 'top-deals' | 'payment-methods' | 'settings'>('users');
  const [settingsForm, setSettingsForm] = useState({
    store_name: '',
    primary_color: '',
    currency_code: '',
    currency_locale: '',
    contact_whatsapp: ''
  });
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const userMap = React.useMemo(() => {
    const map = new Map<string, User>();
    users.forEach(u => map.set(u.id, u));
    return map;
  }, [users]);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUser, setNewUser] = useState<Partial<User> & { password?: string; role?: 'user' | 'admin' }>({
    name: '',
    email: '',
    phone: '',
    city: '',
    role: 'user',
    password: ''
  });
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<User>>({});
  const [resetPasswordModalOpen, setResetPasswordModalOpen] = useState(false);
  const [resetPasswordTargetId, setResetPasswordTargetId] = useState<string | null>(null);
  
  const [manualResetUserId, setManualResetUserId] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState('');

  const [tempSpecs, setTempSpecs] = useState<{key: string, value: string}[]>([]);
  const [orderNotesDraft, setOrderNotesDraft] = useState<Record<string, string>>({});

  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState<Partial<Product>>({
    sku: '',
    name: '',
    description: '',
    price: 0,
    category: '',
    image: '',
    specifications: {},
    isFeatured: false,
    isActive: true
  });

  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryForm, setCategoryForm] = useState<Partial<Category>>({
    name: '',
    image: '',
    icon: ''
  });

  const [isAddingBanner, setIsAddingBanner] = useState(false);
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);
  const [bannerForm, setBannerForm] = useState<Partial<Banner>>({
    title: '',
    description: '',
    imageUrl: '',
    link: '',
    order: 0,
    isActive: true,
    style: 'split'
  });

  const [isAddingPaymentMethod, setIsAddingPaymentMethod] = useState(false);
  const [editingPaymentMethodId, setEditingPaymentMethodId] = useState<string | null>(null);
  const [paymentMethodForm, setPaymentMethodForm] = useState<Partial<PaymentMethod>>({
    bankName: '',
    accountType: 'Ahorros',
    accountNumber: '',
    accountHolder: '',
    phone: '',
    email: '',
    isActive: true,
    instructions: ''
  });

  useEffect(() => {
    const checkUser = async () => {
      if (isReady) {
        try {
          const user = await queries.getCurrentUser();
          setCurrentUser(user);
          
          if (!user) {
            navigate('/login');
          } else if (!location.state?.secretAccess) {
            navigate('/');
          }
        } catch (error) {
          console.error("Error checking user:", error);
        }
      }
    };
    checkUser();
  }, [isReady, navigate, queries, location]);

  useEffect(() => {
    if (isReady && currentUser && location.state?.secretAccess) {
      refreshData();
    }
  }, [isReady, currentUser, activeTab, location]);

  const refreshData = async () => {
    try {
      const allUsers = await queries.getAllUsers();
      setUsers(allUsers);
      const allOrders = await queries.getAllOrders();
      setOrders(allOrders);
      const allProducts = await queries.getProducts();
      setProducts(allProducts);
      const allCategories = await queries.getCategories();
      setCategories(allCategories);
      const allBanners = await queries.getAllBanners ? await queries.getAllBanners() : await queries.getBanners();
      setBanners(allBanners);
      const allPaymentMethods = await queries.getAllPaymentMethods();
      setPaymentMethods(allPaymentMethods);
      
      // Fetch settings
      const fetchedSettings = await queries.getStoreSettings();
      const settingsMap: Record<string, string> = {};
      fetchedSettings.forEach(s => settingsMap[s.key] = s.value);
      setSettingsForm({
        store_name: settingsMap['store_name'] || '',
        primary_color: settingsMap['primary_color'] || '',
        currency_code: settingsMap['currency_code'] || 'COP',
        currency_locale: settingsMap['currency_locale'] || 'es-CO',
        contact_whatsapp: settingsMap['contact_whatsapp'] || ''
      });
    } catch (error) {
      console.error("Error fetching admin data:", error);
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'user' | 'admin') => {
    try {
      await queries.updateUserRole(userId, newRole);
      refreshData();
    } catch (error) {
      console.error("Error updating role:", error);
    }
  };

  const handleCreateUser = async () => {
    try {
      if (!newUser.name || !newUser.email) return;
      await queries.createUserAdmin({
        name: newUser.name!,
        email: newUser.email!,
        password: newUser.password || '',
        phone: newUser.phone || null,
        city: newUser.city || null,
        role: newUser.role || 'user',
        avatar: null,
        isActive: true
      });
      setIsAddingUser(false);
      setNewUser({ name: '', email: '', phone: '', city: '', role: 'user', password: '' });
      refreshData();
    } catch (error) {
      console.error("Error creating user:", error);
    }
  };

  const startEditUser = (u: User) => {
    setEditingUserId(u.id);
    setEditForm({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      city: u.city,
      avatar: u.avatar,
      isActive: u.isActive,
      role: u.role
    });
  };

  const handleUpdateUser = async () => {
    if (!editingUserId) return;
    try {
      await queries.updateUserDetails({
        id: editForm.id!,
        name: editForm.name || '',
        email: editForm.email || '',
        phone: editForm.phone,
        city: editForm.city,
        avatar: editForm.avatar,
        isActive: editForm.isActive ?? true,
        role: (editForm as any).role || 'user'
      });
      setEditingUserId(null);
      setEditForm({});
      refreshData();
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      if (!confirm("¿Eliminar este usuario y sus datos asociados?")) return;
      await queries.deleteUser(userId);
      refreshData();
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  const handleRequestPasswordChange = (userId: string) => {
    setResetPasswordTargetId(userId);
    setResetPasswordModalOpen(true);
  };

  const confirmPasswordChangeRequest = async () => {
    if (!resetPasswordTargetId) return;
    try {
      await queries.setUserMustChangePassword(resetPasswordTargetId, true);
      refreshData();
      setResetPasswordModalOpen(false);
      setResetPasswordTargetId(null);
    } catch (error) {
      console.error("Error requesting password change:", error);
    }
  };

  const handleManualPasswordReset = async () => {
    if (!manualResetUserId || !tempPassword || tempPassword.length < 6) return;
    try {
      // 1. Set the new password
      await queries.updateUserPassword(manualResetUserId, tempPassword);
      // 2. Force change on next login
      await queries.setUserMustChangePassword(manualResetUserId, true);
      
      refreshData();
      setManualResetUserId(null);
      setTempPassword('');
      alert('Contraseña actualizada correctamente. El usuario deberá cambiarla al iniciar sesión.');
    } catch (error) {
      console.error("Error manually resetting password:", error);
      alert('Error al actualizar la contraseña');
    }
  };

  const handleOrderStatusChange = async (orderId: string, newStatus: Order['status']) => {
    try {
      await queries.updateOrderStatus(orderId, newStatus);
      refreshData();
    } catch (error) {
      console.error("Error updating order status:", error);
    }
  };

  const handleCreateProduct = async () => {
    try {
      if (!productForm.name || !productForm.price) return;
      
      const specifications = tempSpecs.reduce((acc, curr) => {
        if (curr.key.trim()) acc[curr.key] = curr.value;
        return acc;
      }, {} as Record<string, string>);

      await queries.createProduct({
        sku: productForm.sku || `SKU-${Date.now()}`,
        name: productForm.name,
        description: productForm.description || '',
        price: Number(productForm.price),
        category: productForm.category || 'General',
        image: productForm.image || (productForm.images && productForm.images.length > 0 ? productForm.images[0] : ''),
        images: productForm.images || [],
        specifications: specifications,
        isFeatured: productForm.isFeatured,
        isActive: productForm.isActive
      });
      setIsAddingProduct(false);
      setProductForm({ sku: '', name: '', description: '', price: 0, category: '', image: '', specifications: {}, isFeatured: false, isActive: true, images: [] });
      setTempSpecs([]);
      refreshData();
    } catch (error) {
      console.error("Error creating product:", error);
    }
  };

  const startEditProduct = (p: Product) => {
    setEditingProductId(p.id);
    const images = (p.images && p.images.length > 0) ? p.images : (p.image ? [p.image] : []);
    setProductForm({ ...p, images });
    setTempSpecs(Object.entries(p.specifications || {}).map(([key, value]) => ({ key, value })));
  };

  const handleUpdateProduct = async () => {
    if (!editingProductId) return;
    try {
      const specifications = tempSpecs.reduce((acc, curr) => {
        if (curr.key.trim()) acc[curr.key] = curr.value;
        return acc;
      }, {} as Record<string, string>);

      await queries.updateProduct({
        id: editingProductId,
        sku: productForm.sku || '',
        name: productForm.name || '',
        description: productForm.description || '',
        price: Number(productForm.price),
        category: productForm.category || '',
        image: productForm.image || (productForm.images && productForm.images.length > 0 ? productForm.images[0] : ''),
        images: productForm.images || [],
        specifications: specifications,
        isFeatured: productForm.isFeatured,
        isActive: productForm.isActive
      });
      setEditingProductId(null);
      setProductForm({ sku: '', name: '', description: '', price: 0, category: '', image: '', specifications: {}, isFeatured: false, isActive: true, images: [] });
      setTempSpecs([]);
      refreshData();
    } catch (error) {
      console.error("Error updating product:", error);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("¿Eliminar este producto?")) return;
    try {
      await queries.deleteProduct(productId);
      refreshData();
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  const parseCSVLine = (line: string) => {
      const values: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
              if (i + 1 < line.length && line[i + 1] === '"') {
                  current += '"';
                  i++;
              } else {
                  inQuotes = !inQuotes;
              }
          } else if (char === ',' && !inQuotes) {
              values.push(current);
              current = '';
          } else {
              current += char;
          }
      }
      values.push(current);
      return values;
  };

  const processCSV = async (csvText: string) => {
    const lines = csvText.split(/\r?\n/);
    if (lines.length < 2) return; // Header + 1 row minimum

    const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase());
    const headerMap: Record<string, number> = {};
    headers.forEach((h, i) => headerMap[h] = i);

    const productsToUpsert: Product[] = [];
    let updatedCount = 0;
    let createdCount = 0;

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = parseCSVLine(line);
        // We need at least ID or Name to do something meaningful
        if (values.length < 2) continue;

        const getValue = (key: string) => {
            const index = headerMap[key];
            return index !== undefined ? values[index] : undefined;
        };

        const id = getValue('id');
        const sku = getValue('sku') || '';
        const name = getValue('name') || '';
        const description = getValue('description') || '';
        const price = parseFloat(getValue('price') || '0');
        const category = getValue('category') || '';
        const image = getValue('image') || '';
        
        let specifications = {};
        try {
            const specStr = getValue('specifications');
            if (specStr) specifications = JSON.parse(specStr.replace(/""/g, '"'));
        } catch (e) {}

        let images: string[] = [];
        try {
             const imgsStr = getValue('images');
             if (imgsStr) images = JSON.parse(imgsStr.replace(/""/g, '"'));
        } catch (e) {}

        const isFeatured = getValue('isfeatured') === 'true';
        const isActive = getValue('isactive') !== 'false';

        // If no ID is provided in CSV, generate one
        const finalId = id || `p_${Date.now()}_${Math.floor(Math.random() * 10000)}_${i}`;

        if (id && products.find(p => p.id === id)) {
            updatedCount++;
        } else {
            createdCount++;
        }
        
        const productData: Product = {
            id: finalId, 
            sku,
            name,
            description,
            price,
            category,
            image,
            specifications,
            isFeatured,
            isActive,
            images
        };

        productsToUpsert.push(productData);
    }
    
    try {
        if (productsToUpsert.length > 0) {
            await queries.bulkUpsertProducts(productsToUpsert);
            alert(`Importación completada: ${productsToUpsert.length} productos procesados.`);
            refreshData();
        }
    } catch (e) {
        console.error("Error processing CSV:", e);
        alert("Error al procesar la importación.");
    }
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      processCSV(text);
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleDownloadCSV = () => {
    // Define headers
    const headers = ['ID', 'SKU', 'Name', 'Description', 'Price', 'Category', 'Image', 'Images', 'Specifications', 'IsFeatured', 'IsActive'];
    
    // Convert products to CSV rows
    const rows = products.map(product => [
      product.id,
      product.sku,
      `"${(product.name || '').replace(/"/g, '""')}"`, // Escape quotes
      `"${(product.description || '').replace(/"/g, '""')}"`,
      product.price,
      `"${(product.category || '').replace(/"/g, '""')}"`,
      `"${(product.image || '').replace(/"/g, '""')}"`,
      `"${(JSON.stringify(product.images || [])).replace(/"/g, '""')}"`,
      `"${(JSON.stringify(product.specifications || {})).replace(/"/g, '""')}"`,
      product.isFeatured ? 'true' : 'false',
      product.isActive !== false ? 'true' : 'false'
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create a Blob and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `products_export_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateCategory = async () => {
    try {
      if (!categoryForm.name) return;
      await queries.createCategory({
        name: categoryForm.name,
        image: categoryForm.image || '',
        icon: categoryForm.icon || 'category'
      });
      setIsAddingCategory(false);
      setCategoryForm({ name: '', image: '', icon: '' });
      refreshData();
    } catch (error) {
      console.error("Error creating category:", error);
    }
  };

  const startEditCategory = (c: Category) => {
    setEditingCategoryId(c.id);
    setCategoryForm({ ...c });
  };

  const handleUpdateCategory = async () => {
    if (!editingCategoryId) return;
    try {
      await queries.updateCategory({
        id: editingCategoryId,
        name: categoryForm.name || '',
        image: categoryForm.image || '',
        icon: categoryForm.icon || 'category'
      });
      setEditingCategoryId(null);
      setCategoryForm({ name: '', image: '', icon: '' });
      refreshData();
    } catch (error) {
      console.error("Error updating category:", error);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm("¿Eliminar esta categoría?")) return;
    try {
      await queries.deleteCategory(categoryId);
      refreshData();
    } catch (error) {
      console.error("Error deleting category:", error);
    }
  };

  const handleCreateBanner = async () => {
    try {
      if (!bannerForm.title || !bannerForm.imageUrl) return;
      await queries.createBanner({
        title: bannerForm.title,
        description: bannerForm.description || '',
        imageUrl: bannerForm.imageUrl,
        link: bannerForm.link || '#',
        order: Number(bannerForm.order),
        isActive: bannerForm.isActive,
        style: bannerForm.style || 'split'
      });
      setIsAddingBanner(false);
      setBannerForm({ title: '', description: '', imageUrl: '', link: '', order: 0, isActive: true, style: 'split' });
      refreshData();
    } catch (error) {
      console.error("Error creating banner:", error);
    }
  };

  const startEditBanner = (b: Banner) => {
    setEditingBannerId(b.id);
    setBannerForm({ ...b });
  };

  const handleUpdateBanner = async () => {
    if (!editingBannerId) return;
    try {
      await queries.updateBanner({
        id: editingBannerId,
        title: bannerForm.title || '',
        description: bannerForm.description || '',
        imageUrl: bannerForm.imageUrl || '',
        link: bannerForm.link || '',
        order: Number(bannerForm.order),
        isActive: bannerForm.isActive,
        style: bannerForm.style || 'split'
      });
      setEditingBannerId(null);
      setBannerForm({ title: '', description: '', imageUrl: '', link: '', order: 0, isActive: true, style: 'split' });
      refreshData();
    } catch (error) {
      console.error("Error updating banner:", error);
    }
  };

  const handleDeleteBanner = async (id: string) => {
    if (!confirm("¿Eliminar este banner?")) return;
    try {
      await queries.deleteBanner(id);
      refreshData();
    } catch (error) {
      console.error("Error deleting banner:", error);
    }
  };

  const handleCreatePaymentMethod = async () => {
    try {
      if (!paymentMethodForm.bankName || !paymentMethodForm.accountNumber) return;
      await queries.createPaymentMethod({
        bankName: paymentMethodForm.bankName,
        accountType: paymentMethodForm.accountType || 'Ahorros',
        accountNumber: paymentMethodForm.accountNumber,
        accountHolder: paymentMethodForm.accountHolder,
        phone: paymentMethodForm.phone,
        email: paymentMethodForm.email,
        isActive: paymentMethodForm.isActive ?? true,
        instructions: paymentMethodForm.instructions
      });
      setIsAddingPaymentMethod(false);
      setPaymentMethodForm({ bankName: '', accountType: 'Ahorros', accountNumber: '', accountHolder: '', phone: '', email: '', isActive: true, instructions: '' });
      refreshData();
    } catch (error) {
      console.error("Error creating payment method:", error);
    }
  };

  const startEditPaymentMethod = (pm: PaymentMethod) => {
    setEditingPaymentMethodId(pm.id);
    setPaymentMethodForm({ ...pm });
  };

  const handleUpdatePaymentMethod = async () => {
    if (!editingPaymentMethodId) return;
    try {
      await queries.updatePaymentMethod({
        id: editingPaymentMethodId,
        bankName: paymentMethodForm.bankName || '',
        accountType: paymentMethodForm.accountType || 'Ahorros',
        accountNumber: paymentMethodForm.accountNumber || '',
        accountHolder: paymentMethodForm.accountHolder,
        phone: paymentMethodForm.phone,
        email: paymentMethodForm.email,
        isActive: paymentMethodForm.isActive ?? true,
        instructions: paymentMethodForm.instructions
      });
      setEditingPaymentMethodId(null);
      setPaymentMethodForm({ bankName: '', accountType: 'Ahorros', accountNumber: '', accountHolder: '', phone: '', email: '', isActive: true, instructions: '' });
      refreshData();
    } catch (error) {
      console.error("Error updating payment method:", error);
    }
  };

  const handleDeletePaymentMethod = async (id: string) => {
    if (!confirm("¿Eliminar este método de pago?")) return;
    try {
      await queries.deletePaymentMethod(id);
      refreshData();
    } catch (error) {
      console.error("Error deleting payment method:", error);
    }
  };

  const handleSaveSettings = async () => {
    try {
      await queries.updateStoreSetting('store_name', settingsForm.store_name);
      await queries.updateStoreSetting('primary_color', settingsForm.primary_color);
      await queries.updateStoreSetting('currency_code', settingsForm.currency_code);
      await queries.updateStoreSetting('currency_locale', settingsForm.currency_locale);
      await queries.updateStoreSetting('contact_whatsapp', settingsForm.contact_whatsapp);
      
      await refreshSettings();
      refreshData();
      alert('Configuración guardada correctamente');
    } catch (error) {
      console.error("Error saving settings:", error);
      alert('Error al guardar la configuración');
    }
  };

  const handleSetProductFeaturedStatus = (id: string, isFeatured: boolean) => {
    try {
      queries.setProductFeaturedStatus(id, isFeatured);
      refreshData();
    } catch (error) {
      console.error("Error updating product featured status:", error);
    }
  };

  if (!isReady || !currentUser || !location.state?.secretAccess) {
    return null;
  }

  return (
    <>
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 pb-24 pt-safe-top">
        {/* Header */}
        <div className="sticky top-0 z-30 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-zinc-800">
            <div className="px-4 h-14 flex items-center justify-between">
                <h1 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-indigo-600">admin_panel_settings</span>
                    Admin Dashboard
                </h1>
                <button onClick={() => navigate('/')} className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full">
                    <span className="material-symbols-outlined text-slate-600 dark:text-slate-400">close</span>
                </button>
            </div>
            
            {/* Tabs */}
            <div className="flex px-4 gap-4 overflow-x-auto no-scrollbar">
                <button 
                    onClick={() => setActiveTab('users')}
                    className={`pb-3 text-sm font-medium transition-colors relative whitespace-nowrap ${
                        activeTab === 'users' 
                        ? 'text-indigo-600 dark:text-indigo-400' 
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                >
                    Usuarios
                    {activeTab === 'users' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-t-full" />
                    )}
                </button>
                <button 
                    onClick={() => setActiveTab('orders')}
                    className={`pb-3 text-sm font-medium transition-colors relative whitespace-nowrap ${
                        activeTab === 'orders' 
                        ? 'text-indigo-600 dark:text-indigo-400' 
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                >
                    Pedidos
                    {activeTab === 'orders' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-t-full" />
                    )}
                </button>
                <button 
                    onClick={() => setActiveTab('products')}
                    className={`pb-3 text-sm font-medium transition-colors relative whitespace-nowrap ${
                        activeTab === 'products' 
                        ? 'text-indigo-600 dark:text-indigo-400' 
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                >
                    Productos
                    {activeTab === 'products' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-t-full" />
                    )}
                </button>
                <button 
                    onClick={() => setActiveTab('categories')}
                    className={`pb-3 text-sm font-medium transition-colors relative whitespace-nowrap ${
                        activeTab === 'categories' 
                        ? 'text-indigo-600 dark:text-indigo-400' 
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                >
                    Categorías
                    {activeTab === 'categories' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-t-full" />
                    )}
                </button>
                <button 
                    onClick={() => setActiveTab('banners')}
                    className={`pb-3 text-sm font-medium transition-colors relative whitespace-nowrap ${
                        activeTab === 'banners' 
                        ? 'text-indigo-600 dark:text-indigo-400' 
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                >
                    Banners
                    {activeTab === 'banners' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-t-full" />
                    )}
                </button>
                <button 
                    onClick={() => setActiveTab('top-deals')}
                    className={`pb-3 text-sm font-medium transition-colors relative whitespace-nowrap ${
                        activeTab === 'top-deals' 
                        ? 'text-indigo-600 dark:text-indigo-400' 
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                >
                    Top Deals
                    {activeTab === 'top-deals' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-t-full" />
                    )}
                </button>
                <button 
                    onClick={() => setActiveTab('payment-methods')}
                    className={`pb-3 text-sm font-medium transition-colors relative whitespace-nowrap ${
                        activeTab === 'payment-methods' 
                        ? 'text-indigo-600 dark:text-indigo-400' 
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                >
                    Métodos de Pago
                    {activeTab === 'payment-methods' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-t-full" />
                    )}
                </button>
                <button 
                    onClick={() => setActiveTab('settings')}
                    className={`pb-3 text-sm font-medium transition-colors relative whitespace-nowrap ${
                        activeTab === 'settings' 
                        ? 'text-indigo-600 dark:text-indigo-400' 
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                >
                    Configuración
                    {activeTab === 'settings' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-t-full" />
                    )}
                </button>
            </div>
        </div>

        <div className="p-4 space-y-4">
            {activeTab === 'users' && (
                <div className="space-y-4">
                    <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
                      {!isAddingUser ? (
                        <button 
                          onClick={() => setIsAddingUser(true)}
                          className="w-full py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
                        >
                          Agregar Usuario
                        </button>
                      ) : (
                        <div className="space-y-3">
                          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Nuevo Usuario</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <input className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-800 text-sm" placeholder="Nombre" value={newUser.name || ''} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} />
                            <input className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-800 text-sm" placeholder="Email" value={newUser.email || ''} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
                            <input className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-800 text-sm" placeholder="Teléfono" value={newUser.phone || ''} onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })} />
                            <input className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-800 text-sm" placeholder="Ciudad" value={newUser.city || ''} onChange={(e) => setNewUser({ ...newUser, city: e.target.value })} />
                            <input className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-800 text-sm" placeholder="Contraseña (opcional)" type="password" value={newUser.password || ''} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} />
                            <select className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-800 text-sm" value={newUser.role || 'user'} onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'user' | 'admin' })}>
                              <option value="user">Usuario</option>
                              <option value="admin">Admin</option>
                            </select>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={handleCreateUser} className="flex-1 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-blue-700 transition-colors">Guardar</button>
                            <button onClick={() => { setIsAddingUser(false); setNewUser({ name: '', email: '', phone: '', city: '', role: 'user', password: '' }); }} className="flex-1 py-2 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors">Cancelar</button>
                          </div>
                        </div>
                      )}
                    </div>

                <div className="space-y-4">
                    {users.map(u => (
                        <div key={u.id} className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden">
                                    {u.avatar ? (
                                        <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="material-symbols-outlined text-slate-400">person</span>
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-medium text-slate-900 dark:text-white">{u.name}</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{u.email}</p>
                                </div>
                                {u.mustChangePassword && (
                                    <div className="hidden sm:flex px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 items-center gap-1">
                                        <span className="material-symbols-outlined text-[14px]">lock_reset</span>
                                        Reset
                                    </div>
                                )}
                                <div className={`ml-auto px-2 py-1 rounded-full text-xs font-medium ${
                                    u.role === 'admin' 
                                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' 
                                    : 'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-slate-400'
                                }`}>
                                    {u.role || 'user'}
                                </div>
                            </div>
                            {editingUserId === u.id ? (
                              <div className="space-y-3">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <input className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-800 text-sm" placeholder="Nombre" value={editForm.name || ''} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                                  <input className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-800 text-sm" placeholder="Email" value={editForm.email || ''} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
                                  <input className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-800 text-sm" placeholder="Teléfono" value={editForm.phone || ''} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
                                  <input className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-800 text-sm" placeholder="Ciudad" value={editForm.city || ''} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} />
                                  <select className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-800 text-sm" value={(editForm as any).role || 'user'} onChange={(e) => setEditForm({ ...editForm, role: e.target.value as any })}>
                                    <option value="user">Usuario</option>
                                    <option value="admin">Admin</option>
                                  </select>
                                  <select className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-800 text-sm" value={editForm.isActive ? '1' : '0'} onChange={(e) => setEditForm({ ...editForm, isActive: e.target.value === '1' })}>
                                    <option value="1">Activo</option>
                                    <option value="0">Inactivo</option>
                                  </select>
                                </div>
                                <div className="flex gap-2">
                                  <button onClick={handleUpdateUser} className="flex-1 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-blue-700 transition-colors">Guardar</button>
                                  <button onClick={() => { setEditingUserId(null); setEditForm({}); }} className="flex-1 py-2 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors">Cancelar</button>
                                </div>
                              </div>
                            ) : (<>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => handleRoleChange(u.id, u.role === 'admin' ? 'user' : 'admin')}
                                    className="flex-1 py-2 rounded-lg bg-slate-50 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors"
                                >
                                    {u.role === 'admin' ? 'Degradar a Usuario' : 'Promover a Admin'}
                                </button>
                                <button 
                                    onClick={() => startEditUser(u)}
                                    className="flex-1 py-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-medium hover:bg-indigo-100 dark:hover:bg-indigo-800 transition-colors"
                                >
                                    Editar
                                </button>
                                <button 
                                    onClick={() => handleDeleteUser(u.id)}
                                    className="flex-1 py-2 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs font-medium hover:bg-red-100 dark:hover:bg-red-800 transition-colors"
                                >
                                    Eliminar
                                </button>
                            </div>
                            <div className="flex gap-2 mt-2">
                            <button
                                onClick={() => handleRequestPasswordChange(u.id)}
                                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-2 ${
                                  u.mustChangePassword 
                                  ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 cursor-not-allowed opacity-70'
                                  : 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-800'
                                }`}
                                disabled={u.mustChangePassword === true}
                            >
                                <span className="material-symbols-outlined text-[16px]">lock_reset</span>
                                {u.mustChangePassword ? 'Solicitado' : 'Solicitar cambio'}
                            </button>
                            <button
                                onClick={() => setManualResetUserId(u.id)}
                                className="flex-1 py-2 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined text-[16px]">key</span>
                                Asignar Temporal
                            </button>
                            </div>
                            </>
                            )}
                        </div>
                    ))}
                </div>
              </div>
            )}

            {activeTab === 'categories' && (
                <div className="space-y-4">
                  <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
                      <button 
                        onClick={() => setIsAddingCategory(true)}
                        className="w-full py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
                      >
                        Agregar Categoría
                      </button>
                  </div>
                  
                  <Modal
                    isOpen={isAddingCategory || !!editingCategoryId}
                    onClose={() => {
                        setIsAddingCategory(false); 
                        setEditingCategoryId(null);
                        setCategoryForm({ name: '', image: '', icon: '' });
                    }}
                    title={isAddingCategory ? 'Nueva Categoría' : 'Editar Categoría'}
                  >
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 gap-3">
                          <input className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-800 text-sm" placeholder="Nombre" value={categoryForm.name || ''} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} />
                          <div className="relative">
                            <select 
                              className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-800 text-sm appearance-none pr-10" 
                              value={categoryForm.icon || 'category'} 
                              onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
                            >
                              {AVAILABLE_ICONS.map(icon => (
                                <option key={icon.value} value={icon.value}>
                                  {icon.label}
                                </option>
                              ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-500">
                              <span className="material-symbols-outlined text-[20px]">{categoryForm.icon || 'category'}</span>
                            </div>
                          </div>
                          {/* Image URL input removed as per requirement */}
                        </div>
                        <div className="flex gap-2 pt-4">
                          <button onClick={isAddingCategory ? handleCreateCategory : handleUpdateCategory} className="flex-1 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-blue-700 transition-colors">Guardar</button>
                          <button onClick={() => { 
                            setIsAddingCategory(false); 
                            setEditingCategoryId(null);
                            setCategoryForm({ name: '', image: '', icon: '' }); 
                          }} className="flex-1 py-2 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors">Cancelar</button>
                        </div>
                      </div>
                  </Modal>

                  <div className="grid grid-cols-2 gap-3">
                    {categories.map(category => (
                        <div key={category.id} className={`bg-white dark:bg-zinc-900 p-3 rounded-xl border shadow-sm flex flex-col gap-2 ${
                            editingCategoryId === category.id ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-slate-200 dark:border-zinc-800'
                        }`}>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                    <span className="material-symbols-outlined">{category.icon || 'category'}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-sm font-medium text-slate-900 dark:text-white line-clamp-1">{category.name}</h3>
                                </div>
                            </div>
                            
                            {/* Image preview removed */}

                            <div className="flex gap-2 mt-auto pt-2">
                                <button 
                                    onClick={() => startEditCategory(category)}
                                    className="flex-1 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-medium hover:bg-indigo-100 dark:hover:bg-indigo-800 transition-colors"
                                >
                                    Editar
                                </button>
                                <button 
                                    onClick={() => handleDeleteCategory(category.id)}
                                    className="flex-1 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs font-medium hover:bg-red-100 dark:hover:bg-red-800 transition-colors"
                                >
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    ))}
                  </div>
                </div>
            )}

            {activeTab === 'settings' && (
                <div className="space-y-4">
                  <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">settings</span>
                        Configuración de la Tienda
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre de la Tienda</label>
                            <input 
                              type="text" 
                              value={settingsForm.store_name} 
                              onChange={(e) => setSettingsForm({...settingsForm, store_name: e.target.value})}
                              className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-800 border-none focus:ring-2 focus:ring-primary/50 text-sm"
                              placeholder="Ej. Mi Tienda"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Color Principal (Hex)</label>
                            <div className="flex gap-2">
                              <input 
                                type="color" 
                                value={settingsForm.primary_color} 
                                onChange={(e) => setSettingsForm({...settingsForm, primary_color: e.target.value})}
                                className="h-10 w-10 rounded-lg cursor-pointer border-none p-0 bg-transparent"
                              />
                              <input 
                                type="text" 
                                value={settingsForm.primary_color} 
                                onChange={(e) => setSettingsForm({...settingsForm, primary_color: e.target.value})}
                                className="flex-1 px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-800 border-none focus:ring-2 focus:ring-primary/50 text-sm uppercase"
                                placeholder="#000000"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Código de Moneda</label>
                            <input 
                              type="text" 
                              value={settingsForm.currency_code} 
                              onChange={(e) => setSettingsForm({...settingsForm, currency_code: e.target.value})}
                              className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-800 border-none focus:ring-2 focus:ring-primary/50 text-sm uppercase"
                              placeholder="Ej. COP"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Locale (Idioma-País)</label>
                            <input 
                              type="text" 
                              value={settingsForm.currency_locale} 
                              onChange={(e) => setSettingsForm({...settingsForm, currency_locale: e.target.value})}
                              className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-800 border-none focus:ring-2 focus:ring-primary/50 text-sm"
                              placeholder="Ej. es-CO"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">WhatsApp de Contacto</label>
                            <input 
                              type="text" 
                              value={settingsForm.contact_whatsapp} 
                              onChange={(e) => setSettingsForm({...settingsForm, contact_whatsapp: e.target.value})}
                              className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-800 border-none focus:ring-2 focus:ring-primary/50 text-sm"
                              placeholder="Ej. 573001234567"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-zinc-800 flex justify-end">
                        <button 
                          onClick={handleSaveSettings}
                          className="px-6 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
                        >
                          Guardar Cambios
                        </button>
                      </div>
                  </div>
                </div>
            )}

            {activeTab === 'top-deals' && (
              <div className="space-y-4">
                <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Select Featured Products</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {products.map(product => (
                      <div key={product.id} className={`bg-white dark:bg-zinc-900 p-3 rounded-xl border shadow-sm flex flex-col gap-2 ${
                        product.isActive === false ? 'opacity-60' : ''
                      }`}>
                        <div className="aspect-square rounded-lg bg-slate-100 dark:bg-zinc-800 overflow-hidden relative group">
                          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                          {product.isFeatured && (
                            <span className="absolute top-1 right-1 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-1.5 py-0.5 rounded">★</span>
                          )}
                          {product.isActive === false && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">Inactivo</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-slate-900 dark:text-white line-clamp-1">{product.name}</h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{formatCurrency(product.price, currencyLocale, currencyCode)}</p>
                        </div>
                        <div className="flex items-center gap-2 mt-auto">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={product.isFeatured || false} 
                              onChange={(e) => handleSetProductFeaturedStatus(product.id, e.target.checked)} 
                              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-sm text-slate-700 dark:text-slate-300">Destacado</span>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'banners' && (
                <div className="space-y-4">
                  <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
                      <button 
                        onClick={() => setIsAddingBanner(true)}
                        className="w-full py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
                      >
                        Agregar Banner
                      </button>
                  </div>
                  
                  <Modal
                    isOpen={isAddingBanner || !!editingBannerId}
                    onClose={() => {
                        setIsAddingBanner(false); 
                        setEditingBannerId(null);
                        setBannerForm({ title: '', description: '', imageUrl: '', link: '', order: 0, isActive: true, style: 'split' });
                    }}
                    title={isAddingBanner ? 'Nuevo Banner' : 'Editar Banner'}
                  >
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 gap-3">
                          <input className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-800 text-sm" placeholder="Título" value={bannerForm.title || ''} onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })} />
                          <input className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-800 text-sm" placeholder="Descripción" value={bannerForm.description || ''} onChange={(e) => setBannerForm({ ...bannerForm, description: e.target.value })} />
                          <input className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-800 text-sm" placeholder="URL de Imagen" value={bannerForm.imageUrl || ''} onChange={(e) => setBannerForm({ ...bannerForm, imageUrl: e.target.value })} />
                          <input className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-800 text-sm" placeholder="Enlace (Link)" value={bannerForm.link || ''} onChange={(e) => setBannerForm({ ...bannerForm, link: e.target.value })} />
                          <input type="number" className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-800 text-sm" placeholder="Orden" value={bannerForm.order ?? 0} onChange={(e) => setBannerForm({ ...bannerForm, order: parseInt(e.target.value) })} />
                          <select className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-800 text-sm" value={bannerForm.style || 'split'} onChange={(e) => setBannerForm({ ...bannerForm, style: e.target.value as 'split' | 'cover' })}>
                            <option value="split">Split (Texto izq, Img der)</option>
                            <option value="cover">Cover (Img fondo, Texto sobre)</option>
                          </select>
                          <select className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-800 text-sm" value={bannerForm.isActive ? '1' : '0'} onChange={(e) => setBannerForm({ ...bannerForm, isActive: e.target.value === '1' })}>
                            <option value="1">Activo</option>
                            <option value="0">Inactivo</option>
                          </select>
                        </div>
                        <div className="flex gap-2 pt-4">
                          <button onClick={isAddingBanner ? handleCreateBanner : handleUpdateBanner} className="flex-1 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-blue-700 transition-colors">Guardar</button>
                          <button onClick={() => { 
                            setIsAddingBanner(false); 
                            setEditingBannerId(null);
                            setBannerForm({ title: '', description: '', imageUrl: '', link: '', order: 0, isActive: true, style: 'split' }); 
                          }} className="flex-1 py-2 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors">Cancelar</button>
                        </div>
                      </div>
                  </Modal>

                  <div className="space-y-4">
                    {banners.map(banner => (
                        <div key={banner.id} className={`bg-white dark:bg-zinc-900 p-4 rounded-xl border shadow-sm ${
                            editingBannerId === banner.id ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-slate-200 dark:border-zinc-800'
                        }`}>
                            <div className="flex gap-4">
                                <div className="w-24 h-24 rounded-lg bg-slate-100 dark:bg-zinc-800 overflow-hidden flex-shrink-0">
                                    <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-medium text-slate-900 dark:text-white line-clamp-1">{banner.title}</h3>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                            banner.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-slate-400'
                                        }`}>
                                            {banner.isActive ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{banner.description}</p>
                                    <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                                        <span className="bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded">Orden: {banner.order}</span>
                                        <span className="bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded">Estilo: {banner.style || 'split'}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-zinc-800">
                                <button 
                                    onClick={() => startEditBanner(banner)}
                                    className="flex-1 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-medium hover:bg-indigo-100 dark:hover:bg-indigo-800 transition-colors"
                                >
                                    Editar
                                </button>
                                <button 
                                    onClick={() => handleDeleteBanner(banner.id)}
                                    className="flex-1 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs font-medium hover:bg-red-100 dark:hover:bg-red-800 transition-colors"
                                >
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    ))}
                  </div>
                </div>
            )}


            {activeTab === 'orders' && (
                <div className="space-y-4">
                     {orders.map(order => (
                        <div key={order.id} className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-mono text-slate-500 dark:text-slate-400">#{order.id.slice(-8).toUpperCase()}</span>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
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
                                          } as Record<Order['status'], string>)[order.status]
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
                                          } as Record<Order['status'], string>)[order.status]}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">
                                        {new Date(order.createdAt).toLocaleDateString()} • {new Date(order.createdAt).toLocaleTimeString()}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-0.5">User ID: {order.userId}</p>
                                    <p className="text-xs text-slate-500 mt-0.5">Nombre: {userMap.get(order.userId)?.name || '—'}</p>
                                    <p className="text-xs text-slate-500 mt-0.5">Correo: {userMap.get(order.userId)?.email || '—'}</p>
                                    <p className="text-xs text-slate-500 mt-0.5">Teléfono: {userMap.get(order.userId)?.phone || '—'}</p>
                                </div>
                                <span className="font-bold text-slate-900 dark:text-white">
                                    ${order.total.toLocaleString()}
                                </span>
                            </div>

                            {/* Order Items */}
                            {order.items && order.items.length > 0 && (
                                <div className="mt-3 space-y-2 border-t border-slate-100 dark:border-zinc-800 pt-3">
                                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Productos:</p>
                                    {order.items.map((item, index) => (
                                        <div key={index} className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded bg-slate-100 dark:bg-zinc-800 flex-shrink-0 overflow-hidden flex items-center justify-center">
                                                {item.productImage ? (
                                                    <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="material-symbols-outlined text-slate-400 text-lg">image</span>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-medium text-slate-900 dark:text-white truncate">{item.productName || 'Producto desconocido'}</p>
                                                <p className="text-[10px] text-slate-500">
                                                    {item.quantity} x {formatCurrency(item.price, currencyLocale, currencyCode)}
                                                </p>
                                            </div>
                                            <p className="font-medium text-slate-900 dark:text-white">
                                                {formatCurrency(item.quantity * item.price, currencyLocale, currencyCode)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-zinc-800">
                                <select 
                                    value={order.status}
                                    onChange={(e) => handleOrderStatusChange(order.id, e.target.value as Order['status'])}
                                    className="flex-1 bg-slate-50 dark:bg-zinc-800 border-none rounded-lg text-xs py-2 px-3 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="pending">Pendiente</option>
                                    <option value="received">Recibido</option>
                                    <option value="processing">Procesando</option>
                                    <option value="on_hold">En espera</option>
                                    <option value="shipped">Enviado</option>
                                    <option value="delivered">Entregado</option>
                                    <option value="completed">Completado</option>
                                    <option value="cancelled">Cancelado</option>
                                    <option value="issue">Con incidencia</option>
                                </select>
                                <div className="flex-1 flex items-center gap-2">
                                  <input
                                    value={orderNotesDraft[order.id] ?? (order.notes ?? '')}
                                    onChange={(e) => setOrderNotesDraft({ ...orderNotesDraft, [order.id]: e.target.value })}
                                    placeholder="Notas para el cliente (visible)"
                                    className="flex-1 bg-slate-50 dark:bg-zinc-800 border-none rounded-lg text-xs py-2 px-3 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500"
                                  />
                                  <button
                                    onClick={() => {
                                      try {
                                        queries.updateOrderNotes(order.id, orderNotesDraft[order.id] ?? '');
                                        refreshData();
                                      } catch (error) {
                                        console.error("Error updating order notes:", error);
                                      }
                                    }}
                                    className="flex-none px-3 py-2 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
                                  >
                                    Guardar nota
                                  </button>
                                </div>
                            </div>
                        </div>
                     ))}
                </div>
            )}

            {activeTab === 'products' && (
                <div className="space-y-4">
                  <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm flex gap-2">
                      <button 
                        onClick={() => setIsAddingProduct(true)}
                        className="flex-1 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
                      >
                        Agregar Producto
                      </button>
                      <button 
                        onClick={handleDownloadCSV}
                        className="flex-none px-4 py-2 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm font-medium hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-lg">download</span>
                        CSV
                      </button>
                      <button 
                        onClick={handleImportClick}
                        className="flex-none px-4 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-lg">upload</span>
                        Importar
                      </button>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        accept=".csv" 
                        className="hidden" 
                      />
                  </div>

                  <Modal
                    isOpen={isAddingProduct || !!editingProductId}
                    onClose={() => { 
                      setIsAddingProduct(false); 
                      setEditingProductId(null);
                      setProductForm({ sku: '', name: '', description: '', price: 0, category: '', image: '', specifications: {}, isFeatured: false, isActive: true, images: [] }); 
                      setTempSpecs([]);
                    }}
                    title={isAddingProduct ? 'Nuevo Producto' : 'Editar Producto'}
                  >
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <input className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-800 text-sm" placeholder="SKU" value={productForm.sku || ''} onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })} />
                          <input className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-800 text-sm" placeholder="Nombre" value={productForm.name || ''} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} />
                          <input className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-800 text-sm" placeholder="Precio" type="number" value={productForm.price || ''} onChange={(e) => setProductForm({ ...productForm, price: parseFloat(e.target.value) })} />
                          <select 
                            className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-800 text-sm text-slate-900 dark:text-white" 
                            value={productForm.category || ''} 
                            onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                          >
                            <option value="">Seleccionar Categoría</option>
                            {categories.map(cat => (
                              <option key={cat.id} value={cat.name}>{cat.name}</option>
                            ))}
                          </select>
                          <div className="col-span-1 sm:col-span-2 space-y-2">
                            <label className="text-sm font-medium text-slate-900 dark:text-white">Imágenes</label>
                            <div className="space-y-2">
                              {(productForm.images && productForm.images.length > 0 ? productForm.images : (productForm.image ? [productForm.image] : [''])).map((img, index) => (
                                <div key={index} className="flex gap-2">
                                  <input 
                                    className="flex-1 px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-800 text-sm" 
                                    placeholder="URL de Imagen" 
                                    value={img} 
                                    onChange={(e) => {
                                      const currentImages = (productForm.images && productForm.images.length > 0) ? productForm.images : (productForm.image ? [productForm.image] : ['']);
                                      const newImages = [...currentImages];
                                      newImages[index] = e.target.value;
                                      
                                      const updates: any = { images: newImages };
                                      if (index === 0) updates.image = e.target.value;
                                      setProductForm({ ...productForm, ...updates });
                                    }} 
                                  />
                                  {index > 0 && (
                                    <button 
                                      onClick={() => {
                                        const currentImages = (productForm.images && productForm.images.length > 0) ? productForm.images : (productForm.image ? [productForm.image] : ['']);
                                        const newImages = currentImages.filter((_, i) => i !== index);
                                        setProductForm({ ...productForm, images: newImages });
                                      }}
                                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                    >
                                      <span className="material-symbols-outlined text-lg">delete</span>
                                    </button>
                                  )}
                                </div>
                              ))}
                              <button 
                                onClick={() => {
                                    const currentImages = (productForm.images && productForm.images.length > 0) ? productForm.images : (productForm.image ? [productForm.image] : ['']);
                                    setProductForm({ ...productForm, images: [...currentImages, ''] });
                                }}
                                className="text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:underline flex items-center gap-1"
                              >
                                <span className="material-symbols-outlined text-lg">add</span>
                                Agregar Imagen
                              </button>
                            </div>
                          </div>
                          <textarea className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-800 text-sm col-span-1 sm:col-span-2" placeholder="Descripción" value={productForm.description || ''} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} />
                          
                          <div className="col-span-1 sm:col-span-2 space-y-2">
                            <label className="text-sm font-medium text-slate-900 dark:text-white">Especificaciones</label>
                            <div className="space-y-2">
                              {tempSpecs.map((spec, index) => (
                                <div key={index} className="flex gap-2">
                                  <input 
                                    className="flex-1 px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-800 text-sm" 
                                    placeholder="Característica (ej. Color)" 
                                    value={spec.key} 
                                    onChange={(e) => {
                                      const newSpecs = [...tempSpecs];
                                      newSpecs[index].key = e.target.value;
                                      setTempSpecs(newSpecs);
                                    }} 
                                  />
                                  <input 
                                    className="flex-1 px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-800 text-sm" 
                                    placeholder="Valor (ej. Rojo)" 
                                    value={spec.value} 
                                    onChange={(e) => {
                                      const newSpecs = [...tempSpecs];
                                      newSpecs[index].value = e.target.value;
                                      setTempSpecs(newSpecs);
                                    }} 
                                  />
                                  <button 
                                    onClick={() => {
                                      const newSpecs = tempSpecs.filter((_, i) => i !== index);
                                      setTempSpecs(newSpecs);
                                    }}
                                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                  >
                                    <span className="material-symbols-outlined text-lg">delete</span>
                                  </button>
                                </div>
                              ))}
                              <button 
                                onClick={() => setTempSpecs([...tempSpecs, { key: '', value: '' }])}
                                className="text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:underline flex items-center gap-1"
                              >
                                <span className="material-symbols-outlined text-lg">add</span>
                                Agregar Especificación
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 col-span-1 sm:col-span-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={productForm.isFeatured || false} 
                                onChange={(e) => setProductForm({ ...productForm, isFeatured: e.target.checked })} 
                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                              />
                              <span className="text-sm text-slate-700 dark:text-slate-300">Destacado</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={productForm.isActive !== false} 
                                onChange={(e) => setProductForm({ ...productForm, isActive: e.target.checked })} 
                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                              />
                              <span className="text-sm text-slate-700 dark:text-slate-300">Activo</span>
                            </label>
                          </div>
                        </div>
                        <div className="flex gap-2 pt-4">
                          <button onClick={isAddingProduct ? handleCreateProduct : handleUpdateProduct} className="flex-1 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-blue-700 transition-colors">Guardar</button>
                          <button onClick={() => { 
                            setIsAddingProduct(false); 
                            setEditingProductId(null);
                            setProductForm({ sku: '', name: '', description: '', price: 0, category: '', image: '', specifications: {}, isFeatured: false, isActive: true }); 
                          }} className="flex-1 py-2 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors">Cancelar</button>
                        </div>
                      </div>
                  </Modal>

                  <div className="grid grid-cols-2 gap-3">
                    {products.map(product => (
                        <div key={product.id} className={`bg-white dark:bg-zinc-900 p-3 rounded-xl border shadow-sm flex flex-col gap-2 ${
                            editingProductId === product.id ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-slate-200 dark:border-zinc-800'
                        } ${product.isActive === false ? 'opacity-60' : ''}`}>
                            <div className="aspect-square rounded-lg bg-slate-100 dark:bg-zinc-800 overflow-hidden relative group">
                                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                {product.isFeatured && (
                                    <span className="absolute top-1 right-1 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-1.5 py-0.5 rounded">★</span>
                                )}
                                {product.isActive === false && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">Inactivo</span>
                                    </div>
                                )}
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-slate-900 dark:text-white line-clamp-1">{product.name}</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{formatCurrency(product.price, currencyLocale, currencyCode)}</p>
                            </div>
                            <div className="flex gap-2 mt-auto pt-2">
                                <button 
                                    onClick={() => startEditProduct(product)}
                                    className="flex-1 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-medium hover:bg-indigo-100 dark:hover:bg-indigo-800 transition-colors"
                                >
                                    Editar
                                </button>
                                <button 
                                    onClick={() => handleDeleteProduct(product.id)}
                                    className="flex-1 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs font-medium hover:bg-red-100 dark:hover:bg-red-800 transition-colors"
                                >
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    ))}
                  </div>
                </div>
            )}

            {activeTab === 'payment-methods' && (
                <div className="space-y-4">
                  <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
                      <button 
                        onClick={() => setIsAddingPaymentMethod(true)}
                        className="w-full py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
                      >
                        Agregar Método de Pago
                      </button>
                  </div>
                  
                  <Modal
                    isOpen={isAddingPaymentMethod || !!editingPaymentMethodId}
                    onClose={() => {
                        setIsAddingPaymentMethod(false); 
                        setEditingPaymentMethodId(null);
                        setPaymentMethodForm({ bankName: '', accountType: 'Ahorros', accountNumber: '', accountHolder: '', phone: '', email: '', isActive: true, instructions: '' });
                    }}
                    title={isAddingPaymentMethod ? 'Nuevo Método de Pago' : 'Editar Método de Pago'}
                  >
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 gap-3">
                          <input className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-800 text-sm" placeholder="Banco / Entidad" value={paymentMethodForm.bankName || ''} onChange={(e) => setPaymentMethodForm({ ...paymentMethodForm, bankName: e.target.value })} />
                          <select className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-800 text-sm" value={paymentMethodForm.accountType || 'Ahorros'} onChange={(e) => setPaymentMethodForm({ ...paymentMethodForm, accountType: e.target.value })}>
                            <option value="Ahorros">Ahorros</option>
                            <option value="Corriente">Corriente</option>
                            <option value="Nequi">Nequi</option>
                            <option value="Daviplata">Daviplata</option>
                            <option value="Mish">Mish</option>
                            <option value="Otro">Otro</option>
                          </select>
                          <input className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-800 text-sm" placeholder="Número de Cuenta / Celular" value={paymentMethodForm.accountNumber || ''} onChange={(e) => setPaymentMethodForm({ ...paymentMethodForm, accountNumber: e.target.value })} />
                          <input className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-800 text-sm" placeholder="Titular de la cuenta" value={paymentMethodForm.accountHolder || ''} onChange={(e) => setPaymentMethodForm({ ...paymentMethodForm, accountHolder: e.target.value })} />
                          <input className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-800 text-sm" placeholder="Teléfono de contacto (opcional)" value={paymentMethodForm.phone || ''} onChange={(e) => setPaymentMethodForm({ ...paymentMethodForm, phone: e.target.value })} />
                          <input className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-800 text-sm" placeholder="Email de notificación (opcional)" value={paymentMethodForm.email || ''} onChange={(e) => setPaymentMethodForm({ ...paymentMethodForm, email: e.target.value })} />
                          <textarea className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-800 text-sm" placeholder="Instrucciones adicionales (opcional)" value={paymentMethodForm.instructions || ''} onChange={(e) => setPaymentMethodForm({ ...paymentMethodForm, instructions: e.target.value })} />
                          <select className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-800 text-sm" value={paymentMethodForm.isActive ? '1' : '0'} onChange={(e) => setPaymentMethodForm({ ...paymentMethodForm, isActive: e.target.value === '1' })}>
                            <option value="1">Activo</option>
                            <option value="0">Inactivo</option>
                          </select>
                        </div>
                        <div className="flex gap-2 pt-4">
                          <button onClick={isAddingPaymentMethod ? handleCreatePaymentMethod : handleUpdatePaymentMethod} className="flex-1 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-blue-700 transition-colors">Guardar</button>
                          <button onClick={() => { 
                            setIsAddingPaymentMethod(false); 
                            setEditingPaymentMethodId(null);
                            setPaymentMethodForm({ bankName: '', accountType: 'Ahorros', accountNumber: '', accountHolder: '', phone: '', email: '', isActive: true, instructions: '' }); 
                          }} className="flex-1 py-2 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors">Cancelar</button>
                        </div>
                      </div>
                  </Modal>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {paymentMethods.map(pm => (
                        <div key={pm.id} className={`bg-white dark:bg-zinc-900 p-4 rounded-xl border shadow-sm ${
                            editingPaymentMethodId === pm.id ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-slate-200 dark:border-zinc-800'
                        }`}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                                        {pm.bankName}
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                            pm.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-slate-400'
                                        }`}>
                                            {pm.isActive ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{pm.accountType} - {pm.accountNumber}</p>
                                    {pm.accountHolder && <p className="text-xs text-slate-500 mt-0.5">Titular: {pm.accountHolder}</p>}
                                    {pm.phone && <p className="text-xs text-slate-500 mt-0.5">Tel: {pm.phone}</p>}
                                    {pm.email && <p className="text-xs text-slate-500 mt-0.5">Email: {pm.email}</p>}
                                    {pm.instructions && <p className="text-xs text-slate-400 mt-2 italic border-t border-slate-100 dark:border-zinc-800 pt-2">{pm.instructions}</p>}
                                </div>
                                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-500">
                                    <span className="material-symbols-outlined">account_balance</span>
                                </div>
                            </div>
                            
                            <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-zinc-800">
                                <button 
                                    onClick={() => startEditPaymentMethod(pm)}
                                    className="flex-1 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-medium hover:bg-indigo-100 dark:hover:bg-indigo-800 transition-colors"
                                >
                                    Editar
                                </button>
                                <button 
                                    onClick={() => handleDeletePaymentMethod(pm.id)}
                                    className="flex-1 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs font-medium hover:bg-red-100 dark:hover:bg-red-800 transition-colors"
                                >
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    ))}
                  </div>
                </div>
            )}
        </div>
    </div>

    {/* Manual Password Reset Modal */}
    {manualResetUserId && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" style={{ animation: 'fadeIn 0.2s ease-out' }}>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-sm p-6 transform transition-all" style={{ animation: 'scaleIn 0.2s ease-out' }}>
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-4 text-primary">
              <span className="material-symbols-outlined text-2xl">key</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Asignar contraseña temporal
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-4 text-sm">
              Ingresa una nueva contraseña para este usuario. Deberás comunicársela para que pueda iniciar sesión.
            </p>
            
            <input
              type="text"
              value={tempPassword}
              onChange={(e) => setTempPassword(e.target.value)}
              placeholder="Nueva contraseña"
              className="w-full px-4 py-2 mb-6 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white"
            />

            <div className="flex gap-3 w-full">
              <button
                onClick={() => {
                  setManualResetUserId(null);
                  setTempPassword('');
                }}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleManualPasswordReset}
                disabled={tempPassword.length < 6}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-primary hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    <ConfirmationModal
        isOpen={resetPasswordModalOpen}
        onClose={() => setResetPasswordModalOpen(false)}
        onConfirm={confirmPasswordChangeRequest}
        title="Solicitar cambio de contraseña"
        message="¿Estás seguro de que deseas solicitar un cambio de contraseña para este usuario? Se le pedirá que cree una nueva contraseña en su próximo inicio de sesión."
        confirmText="Solicitar"
        icon="lock_reset"
    />
    </>
  );
};

export default AdminDashboardPage;
