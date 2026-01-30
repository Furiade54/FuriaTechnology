import { supabase } from '../supabaseClient';
import type { Product, Category, User, Order, Banner, PaymentMethod, StoreSetting, ProfileSection } from '../types';

// Helper to handle errors uniformly
const handleError = (error: any) => {
  console.error('Supabase Error:', error);
  throw error;
};

export const supabaseQueries = {
  // Products
  getProducts: async (): Promise<Product[]> => {
    const { data, error } = await supabase
      .from('products')
      .select('*');
    
    if (error) handleError(error);
    
    return (data || []).map((row: any) => ({
      id: row.id,
      sku: row.sku,
      name: row.name,
      description: row.description,
      price: Number(row.price),
      category: row.category,
      image: row.image,
      specifications: row.specifications || {},
      isFeatured: row.isFeatured,
      isActive: row.isActive,
      images: row.images || []
    }));
  },

  getProductById: async (id: string): Promise<Product | undefined> => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) return undefined;
    
    return {
      id: data.id,
      sku: data.sku,
      name: data.name,
      description: data.description,
      price: Number(data.price),
      category: data.category,
      image: data.image,
      specifications: data.specifications || {},
      isFeatured: data.isFeatured,
      isActive: data.isActive,
      images: data.images || []
    };
  },

  createProduct: async (product: Omit<Product, 'id'> & { id?: string }): Promise<void> => {
    const id = product.id || crypto.randomUUID();
    const { error } = await supabase.from('products').insert({
      id,
      sku: product.sku,
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      image: product.image,
      specifications: product.specifications,
      isFeatured: product.isFeatured,
      isActive: product.isActive ?? true,
      images: product.images
    });
    
    if (error) handleError(error);
  },

  updateProduct: async (product: Product): Promise<void> => {
    const { error } = await supabase
      .from('products')
      .update({
        sku: product.sku,
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        image: product.image,
        specifications: product.specifications,
        isFeatured: product.isFeatured,
        isActive: product.isActive,
        images: product.images
      })
      .eq('id', product.id);
    
    if (error) handleError(error);
  },

  setProductFeaturedStatus: async (id: string, isFeatured: boolean): Promise<void> => {
    const { error } = await supabase
      .from('products')
      .update({ isFeatured })
      .eq('id', id);
    if (error) handleError(error);
  },

  deleteProduct: async (id: string): Promise<void> => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) handleError(error);
  },

  bulkUpsertProducts: async (products: Product[]): Promise<void> => {
    const { error } = await supabase.from('products').upsert(
      products.map(p => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        description: p.description,
        price: p.price,
        category: p.category,
        image: p.image,
        specifications: p.specifications,
        isFeatured: p.isFeatured,
        isActive: p.isActive,
        images: p.images
      }))
    );
    if (error) handleError(error);
  },

  // Categories
  getCategories: async (): Promise<Category[]> => {
    const { data, error } = await supabase.from('categories').select('*');
    if (error) handleError(error);
    return (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      image: row.image,
      icon: row.icon
    }));
  },

  createCategory: async (category: Omit<Category, 'id'>): Promise<void> => {
    const { error } = await supabase.from('categories').insert({
      id: `cat_${Date.now()}`,
      name: category.name,
      image: category.image,
      icon: category.icon
    });
    if (error) handleError(error);
  },

  updateCategory: async (category: Category): Promise<void> => {
    const { error } = await supabase
      .from('categories')
      .update({
        name: category.name,
        image: category.image,
        icon: category.icon
      })
      .eq('id', category.id);
    if (error) handleError(error);
  },

  deleteCategory: async (id: string): Promise<void> => {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) handleError(error);
  },

  // Users (Custom Auth)
  getUserByEmail: async (email: string): Promise<User | undefined> => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error || !data) return undefined;
    
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      password: data.password,
      avatar: data.avatar,
      phone: data.phone,
      city: data.city,
      isActive: data.isActive,
      role: data.role,
      mustChangePassword: data.mustChangePassword
    };
  },

  getAllUsers: async (): Promise<User[]> => {
    const { data, error } = await supabase
      .from('users')
      .select('*');
    
    if (error) handleError(error);
    
    return (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      password: row.password,
      avatar: row.avatar,
      phone: row.phone,
      city: row.city,
      isActive: row.isActive,
      role: row.role,
      mustChangePassword: row.mustChangePassword
    }));
  },

  loginUser: async (email: string, password: string): Promise<User> => {
    // Note: This matches the insecure plain text password check from db.ts
    // In production, passwords should be hashed.
    const user = await supabaseQueries.getUserByEmail(email);
    
    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    if (user.password !== password) {
      throw new Error('INVALID_PASSWORD');
    }

    if (!user.isActive) {
      throw new Error('USER_INACTIVE');
    }

    return user;
  },

  registerUser: async (email: string, password: string): Promise<User> => {
    const existingUser = await supabaseQueries.getUserByEmail(email);
    if (existingUser) {
      throw new Error('USER_ALREADY_EXISTS');
    }

    const id = `u_${Date.now()}`;
    const name = email.split('@')[0] || 'Nuevo usuario';
    
    const newUser = {
      id,
      name,
      email,
      password,
      avatar: null,
      phone: null,
      city: null,
      isActive: true,
      role: 'user',
      mustChangePassword: false
    };

    const { error } = await supabase.from('users').insert(newUser);
    if (error) handleError(error);

    return {
      ...newUser,
      avatar: undefined,
      phone: undefined,
      city: undefined
    } as User;
  },

  createUserAdmin: async (payload: {
    name: string;
    email: string;
    password?: string;
    avatar?: string | null;
    phone?: string | null;
    city?: string | null;
    role?: 'user' | 'admin';
    isActive?: boolean;
    mustChangePassword?: boolean;
  }): Promise<User> => {
    const id = `u_${Date.now()}`;
    const {
      name,
      email,
      password = '',
      avatar = null,
      phone = null,
      city = null,
      role = 'user',
      isActive = true,
      mustChangePassword = false
    } = payload;

    const newUser = {
      id,
      name,
      email,
      password: password || null,
      avatar,
      phone,
      city,
      isActive,
      role,
      mustChangePassword
    };

    const { error } = await supabase.from('users').insert(newUser);
    if (error) handleError(error);

    return {
      id,
      name,
      email,
      password: password || undefined,
      avatar: avatar ?? undefined,
      phone: phone ?? undefined,
      city: city ?? undefined,
      isActive,
      role,
      mustChangePassword
    };
  },

  getCurrentUser: async (): Promise<User | null> => {
    const userId = localStorage.getItem('currentUserId');
    if (!userId) return null;

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error || !data) return null;

    return {
      id: data.id,
      name: data.name,
      email: data.email,
      password: data.password,
      avatar: data.avatar,
      phone: data.phone,
      city: data.city,
      isActive: data.isActive,
      role: data.role,
      mustChangePassword: data.mustChangePassword
    };
  },

  updateUser: async (user: User): Promise<void> => {
    const { error } = await supabase
      .from('users')
      .update({
        name: user.name,
        phone: user.phone,
        city: user.city,
        avatar: user.avatar,
        email: user.email
      })
      .eq('id', user.id);
    
    if (error) handleError(error);
  },

  updateUserDetails: async (user: User): Promise<void> => {
    const { error } = await supabase
      .from('users')
      .update({
        name: user.name,
        email: user.email,
        phone: user.phone,
        city: user.city,
        avatar: user.avatar,
        isActive: user.isActive,
        role: user.role,
        mustChangePassword: user.mustChangePassword
      })
      .eq('id', user.id);
    
    if (error) handleError(error);
  },

  updateUserRole: async (userId: string, role: 'user' | 'admin'): Promise<void> => {
    const { error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', userId);
    
    if (error) handleError(error);
  },

  updateUserPassword: async (userId: string, newPassword: string): Promise<void> => {
    const { error } = await supabase
      .from('users')
      .update({
        password: newPassword,
        mustChangePassword: false
      })
      .eq('id', userId);
    
    if (error) handleError(error);
  },

  setUserMustChangePassword: async (userId: string, mustChange: boolean): Promise<void> => {
     const { error } = await supabase
      .from('users')
      .update({
        mustChangePassword: mustChange
      })
      .eq('id', userId);
    
    if (error) handleError(error);
  },

  deleteUser: async (userId: string): Promise<void> => {
    // 1. Delete Wishlist
    await supabase.from('wishlist').delete().eq('userId', userId);
    
    // 2. Delete Order Items (indirectly via orders, but let's try to get order IDs first if needed)
    // Actually, if we delete orders, items might need to be deleted first if no cascade.
    // Let's try to find user's orders first.
    const { data: userOrders } = await supabase.from('orders').select('id').eq('userId', userId);
    if (userOrders && userOrders.length > 0) {
      const orderIds = userOrders.map(o => o.id);
      await supabase.from('order_items').delete().in('orderId', orderIds);
      await supabase.from('orders').delete().in('id', orderIds);
    }

    // 3. Delete User
    const { error } = await supabase.from('users').delete().eq('id', userId);
    if (error) handleError(error);
  },

  // Orders
  createOrder: async (userId: string, items: { productId: string; quantity: number; price: number }[], total: number): Promise<string> => {
    const orderId = `ord_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const createdAt = new Date().toISOString();

    // 1. Create Order
    const { error: orderError } = await supabase.from('orders').insert({
      id: orderId,
      userId,
      total,
      status: 'pending',
      created_at: createdAt,
      notes: ''
    });

    if (orderError) handleError(orderError);

    // 2. Create Order Items
    const orderItems = items.map(item => ({
      id: `itm_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      orderId,
      productId: item.productId,
      quantity: item.quantity,
      price: item.price
    }));

    const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
    if (itemsError) handleError(itemsError);

    return orderId;
  },

  getOrders: async (): Promise<Order[]> => {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*, products(name, image))')
      .order('created_at', { ascending: false });

    if (error) handleError(error);

    return (data || []).map((row: any) => ({
      id: row.id,
      userId: row.userId,
      total: Number(row.total),
      status: row.status,
      createdAt: row.created_at,
      notes: row.notes,
      items: row.order_items.map((item: any) => ({
        id: item.id,
        orderId: item.orderId,
        productId: item.productId,
        quantity: item.quantity,
        price: Number(item.price),
        productName: item.products?.name,
        productImage: item.products?.image
      }))
    }));
  },

  getAllOrders: async (): Promise<Order[]> => {
    // Alias to getOrders
    return await supabaseQueries.getOrders();
  },

  getOrdersByUser: async (userId: string): Promise<Order[]> => {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*, products(name, image))')
      .eq('userId', userId)
      .order('created_at', { ascending: false });

    if (error) handleError(error);

    return (data || []).map((row: any) => ({
      id: row.id,
      userId: row.userId,
      total: Number(row.total),
      status: row.status,
      createdAt: row.created_at,
      notes: row.notes,
      items: row.order_items.map((item: any) => ({
        id: item.id,
        orderId: item.orderId,
        productId: item.productId,
        quantity: item.quantity,
        price: Number(item.price),
        productName: item.products?.name,
        productImage: item.products?.image
      }))
    }));
  },

  updateOrderStatus: async (orderId: string, status: Order['status']): Promise<void> => {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);
    if (error) handleError(error);
  },

  updateOrderNotes: async (orderId: string, notes: string): Promise<void> => {
    const { error } = await supabase
      .from('orders')
      .update({ notes })
      .eq('id', orderId);
    if (error) handleError(error);
  },

  deleteOrder: async (orderId: string): Promise<void> => {
    // Delete items first
    await supabase.from('order_items').delete().eq('orderId', orderId);
    
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId);
    if (error) handleError(error);
  },

  // Store Settings
  getStoreSettings: async (): Promise<StoreSetting[]> => {
    const { data, error } = await supabase.from('store_settings').select('*');
    if (error) handleError(error);
    return (data || []).map((row: any) => ({
      key: row.key,
      value: row.value,
      description: row.description
    }));
  },

  getStoreSetting: async (key: string): Promise<string | null> => {
    const { data, error } = await supabase
      .from('store_settings')
      .select('value')
      .eq('key', key)
      .single();
    if (error) return null;
    return data.value;
  },

  updateStoreSetting: async (key: string, value: string): Promise<void> => {
    const { error } = await supabase
      .from('store_settings')
      .upsert({ key, value }); // upsert handles insert or replace
    if (error) handleError(error);
  },

  // Payment Methods
  getPaymentMethods: async (): Promise<PaymentMethod[]> => {
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('isActive', true);
    
    if (error) handleError(error);
    
    return (data || []).map((row: any) => ({
      id: row.id,
      bankName: row.bankName,
      accountType: row.accountType,
      accountNumber: row.accountNumber,
      accountHolder: row.accountHolder,
      phone: row.phone,
      email: row.email,
      isActive: row.isActive,
      instructions: row.instructions
    }));
  },

  getAllPaymentMethods: async (): Promise<PaymentMethod[]> => {
    const { data, error } = await supabase.from('payment_methods').select('*');
    if (error) handleError(error);
    return (data || []).map((row: any) => ({
      id: row.id,
      bankName: row.bankName,
      accountType: row.accountType,
      accountNumber: row.accountNumber,
      accountHolder: row.accountHolder,
      phone: row.phone,
      email: row.email,
      isActive: row.isActive,
      instructions: row.instructions
    }));
  },

  createPaymentMethod: async (method: Omit<PaymentMethod, 'id'>): Promise<void> => {
    const { error } = await supabase.from('payment_methods').insert({
      id: `pm_${Date.now()}`,
      bankName: method.bankName,
      accountType: method.accountType,
      accountNumber: method.accountNumber,
      accountHolder: method.accountHolder,
      phone: method.phone,
      email: method.email,
      isActive: method.isActive,
      instructions: method.instructions
    });
    if (error) handleError(error);
  },

  updatePaymentMethod: async (method: PaymentMethod): Promise<void> => {
    const { error } = await supabase
      .from('payment_methods')
      .update({
        bankName: method.bankName,
        accountType: method.accountType,
        accountNumber: method.accountNumber,
        accountHolder: method.accountHolder,
        phone: method.phone,
        email: method.email,
        isActive: method.isActive,
        instructions: method.instructions
      })
      .eq('id', method.id);
    if (error) handleError(error);
  },

  deletePaymentMethod: async (id: string): Promise<void> => {
    const { error } = await supabase.from('payment_methods').delete().eq('id', id);
    if (error) handleError(error);
  },

  // Banners
  getBanners: async (): Promise<Banner[]> => {
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .eq('isActive', true)
      .order('order', { ascending: true });
    
    if (error) handleError(error);
    
    return (data || []).map((row: any) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      imageUrl: row.imageUrl,
      link: row.link,
      order: row.order,
      isActive: row.isActive,
      style: row.style
    }));
  },

  getAllBanners: async (): Promise<Banner[]> => {
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .order('order', { ascending: true });
    
    if (error) handleError(error);
    
    return (data || []).map((row: any) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      imageUrl: row.imageUrl,
      link: row.link,
      order: row.order,
      isActive: row.isActive,
      style: row.style
    }));
  },

  createBanner: async (banner: Omit<Banner, 'id'>): Promise<void> => {
    const { error } = await supabase.from('banners').insert({
      id: `bn_${Date.now()}`,
      title: banner.title,
      description: banner.description,
      imageUrl: banner.imageUrl,
      link: banner.link,
      order: banner.order,
      isActive: banner.isActive,
      style: banner.style
    });
    if (error) handleError(error);
  },

  updateBanner: async (banner: Banner): Promise<void> => {
    const { error } = await supabase
      .from('banners')
      .update({
        title: banner.title,
        description: banner.description,
        imageUrl: banner.imageUrl,
        link: banner.link,
        order: banner.order,
        isActive: banner.isActive,
        style: banner.style
      })
      .eq('id', banner.id);
    if (error) handleError(error);
  },

  deleteBanner: async (id: string): Promise<void> => {
    const { error } = await supabase.from('banners').delete().eq('id', id);
    if (error) handleError(error);
  },

  // Wishlist
  addToWishlist: async (userId: string, productId: string): Promise<void> => {
    // Check if already exists to avoid unique constraint error if no unique constraint
    // But usually we can just insert and ignore or upsert. 
    // Let's check first to match local db behavior
    const { data } = await supabase
        .from('wishlist')
        .select('id')
        .eq('userId', userId)
        .eq('productId', productId)
        .single();
    
    if (data) return; // Already in wishlist

    const { error } = await supabase.from('wishlist').insert({
      id: `wl_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      userId,
      productId,
      createdAt: new Date().toISOString()
    });
    if (error) handleError(error);
  },

  removeFromWishlist: async (userId: string, productId: string): Promise<void> => {
    const { error } = await supabase
      .from('wishlist')
      .delete()
      .eq('userId', userId)
      .eq('productId', productId);
    if (error) handleError(error);
  },

  getWishlist: async (userId: string): Promise<string[]> => {
    const { data, error } = await supabase
      .from('wishlist')
      .select('productId')
      .eq('userId', userId);
    
    if (error) handleError(error);
    
    return (data || []).map((row: any) => row.productId);
  },

  getWishlistProducts: async (userId: string): Promise<Product[]> => {
    // Supabase join
    const { data, error } = await supabase
      .from('wishlist')
      .select('productId, products(*)')
      .eq('userId', userId)
      .order('createdAt', { ascending: false });

    if (error) handleError(error);

    // Map the joined product data
    return (data || [])
      .filter((row: any) => row.products) // Ensure product exists
      .map((row: any) => {
        const product = row.products;
        return {
          id: product.id,
          sku: product.sku,
          name: product.name,
          description: product.description,
          price: Number(product.price),
          category: product.category,
          image: product.image,
          specifications: product.specifications || {},
          isFeatured: product.isFeatured,
          isActive: product.isActive,
          images: product.images || []
        };
      });
  },

  isInWishlist: async (userId: string, productId: string): Promise<boolean> => {
    const { count, error } = await supabase
      .from('wishlist')
      .select('*', { count: 'exact', head: true })
      .eq('userId', userId)
      .eq('productId', productId);
    
    if (error) handleError(error);
    return (count || 0) > 0;
  },

  // Profile Sections
  getProfileSections: async (): Promise<ProfileSection[]> => {
    const { data, error } = await supabase
      .from('profile_sections')
      .select('*');
    
    if (error) {
       // If table doesn't exist yet, return empty or fallback? 
       // db.local.ts returns empty array if no results.
       // Let's assume it exists or return empty.
       console.warn('Could not fetch profile sections from Supabase', error);
       return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      icon: row.icon,
      title: row.title,
      subtitle: row.subtitle,
      route: row.route
    }));
  },

  // Storage
  uploadFile: async (file: File, bucket: string = 'company-assets'): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);

    if (uploadError) {
      handleError(uploadError);
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return data.publicUrl;
  }
};
