-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Products Table
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  sku TEXT,
  name TEXT,
  description TEXT,
  price NUMERIC,
  category TEXT,
  image TEXT,
  specifications JSONB DEFAULT '{}'::jsonb,
  "isFeatured" BOOLEAN DEFAULT false,
  "isActive" BOOLEAN DEFAULT true,
  images JSONB DEFAULT '[]'::jsonb,
  brand TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  name TEXT,
  image TEXT,
  icon TEXT
);

-- Users Table (Custom, not Supabase Auth)
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE,
  password TEXT,
  avatar TEXT,
  phone TEXT,
  city TEXT,
  address TEXT,
  "zipCode" TEXT,
  "isActive" BOOLEAN DEFAULT true,
  role TEXT DEFAULT 'user',
  "mustChangePassword" BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Profile Sections Table
CREATE TABLE IF NOT EXISTS public.profile_sections (
  id TEXT PRIMARY KEY,
  icon TEXT,
  title TEXT,
  subtitle TEXT,
  route TEXT
);

-- Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  "userId" TEXT REFERENCES public.users(id),
  total NUMERIC,
  status TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Order Items Table
CREATE TABLE IF NOT EXISTS public.order_items (
  id TEXT PRIMARY KEY,
  "orderId" TEXT REFERENCES public.orders(id) ON DELETE CASCADE,
  "productId" TEXT REFERENCES public.products(id),
  quantity INTEGER,
  price NUMERIC
);

-- Wishlist Table
CREATE TABLE IF NOT EXISTS public.wishlist (
  "userId" TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  "productId" TEXT REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY ("userId", "productId")
);

-- Banners Table
CREATE TABLE IF NOT EXISTS public.banners (
  id TEXT PRIMARY KEY,
  title TEXT,
  description TEXT,
  "imageUrl" TEXT,
  link TEXT,
  "order" INTEGER,
  "isActive" BOOLEAN DEFAULT true,
  style TEXT DEFAULT 'split'
);

-- Store Settings Table
CREATE TABLE IF NOT EXISTS public.store_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  description TEXT
);

-- Payment Methods Table
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id TEXT PRIMARY KEY,
  "bankName" TEXT,
  "accountType" TEXT,
  "accountNumber" TEXT,
  "accountHolder" TEXT,
  phone TEXT,
  email TEXT,
  "isActive" BOOLEAN DEFAULT true,
  instructions TEXT
);

-- Row Level Security (RLS) Policies
-- Allow public read access to most tables so the app works without Supabase Auth login
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public products are viewable by everyone" ON public.products FOR SELECT USING (true);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public categories are viewable by everyone" ON public.categories FOR SELECT USING (true);

ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public banners are viewable by everyone" ON public.banners FOR SELECT USING (true);

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Store settings are viewable by everyone" ON public.store_settings FOR SELECT USING (true);

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Payment methods are viewable by everyone" ON public.payment_methods FOR SELECT USING (true);

-- For Users/Orders, typically you'd want restriction, but since we manage auth manually:
-- We allow ALL operations for the service role (backend) but here we might need
-- to allow public access if the frontend calls Supabase directly for these tables.
-- CAUTION: This allows anyone with the Anon Key to read/write users/orders.
-- Ideally, you should use Supabase Auth or backend proxy.
-- For this migration step, to keep it simple and working like SQLite (local app has full access):
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for all users" ON public.users FOR ALL USING (true);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for all users" ON public.orders FOR ALL USING (true);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for all users" ON public.order_items FOR ALL USING (true);

ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for all users" ON public.wishlist FOR ALL USING (true);

ALTER TABLE public.profile_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for all users" ON public.profile_sections FOR ALL USING (true);
