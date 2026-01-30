import initSqlJs from 'sql.js';
import type { Database, SqlValue } from 'sql.js';
import localforage from 'localforage';
import type { Product, Category, User, ProfileSection, Order, Banner, PaymentMethod, StoreSetting } from '../types';

let db: Database | null = null;
const DB_NAME = 'ecommerce_db';

type ProductRow = [string, string, string, string, number, string, string, string, number, number, string | null];
type CategoryRow = [string, string, string, string];
type UserRow = [string, string, string, string | null, string | null, string | null, string | null, number, string, number];
type ProfileSectionRow = [string, string, string, string, string | null];
type OrderRow = [string, string, number, string, string, string | null];
type OrderItemRow = [string, string, string, number, number, string, string];
type BannerRow = [string, string, string, string, string, number, number, string];
type PaymentMethodRow = [string, string, string, string, string | null, string | null, string | null, number, string | null];
type StoreSettingRow = [string, string, string | null];

const INITIAL_SEED_PAYMENT_METHODS = [
  {
    id: '1',
    bankName: 'Bancolombia',
    accountType: 'Ahorros',
    accountNumber: '1234567890',
    accountHolder: 'Tienda Online S.A.S',
    isActive: 1,
    instructions: 'Enviar comprobante al WhatsApp'
  },
  {
    id: '2',
    bankName: 'Nequi',
    accountType: 'Depósito',
    accountNumber: '3001234567',
    accountHolder: 'Tienda Online',
    isActive: 1,
    instructions: 'Recuerda poner tu número de pedido en la referencia'
  }
];

const INITIAL_SEED_STORE_SETTINGS = [
  { key: 'store_name', value: 'Tienda Online', description: 'Nombre de la tienda' },
  { key: 'currency_code', value: 'COP', description: 'Código de moneda ISO 4217' },
  { key: 'currency_locale', value: 'es-CO', description: 'Locale para formato de moneda' },
  { key: 'primary_color', value: '#3270a9', description: 'Color principal de la marca' },
  { key: 'contact_whatsapp', value: '+573000000000', description: 'Número de WhatsApp para pedidos' }
];

const INITIAL_SEED_BANNERS = [
  {
    id: '1',
    title: 'New iPhone 15 Pro',
    description: 'The ultimate iPhone experience.',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC5PAVsson3z1yvaAGNPMcYuMU6NL9AG-vcQlHHfsTWakHQPwU5QHdC2pYnAJQu0mw9msktoWWDhQ77Nd5S_0wepI4qrej0UtkJ1XbeH9Y--sYHDBkTjFGoBKvU89rT_ZjKV7976zUVm6tlq7sTU_pmVWQZbHn_7UWLRUOouxPOrhKafhKr6STAh9y0e7u98m7SqXvfb0u7-RRHGzTWHI_WXq95wg99K0Y8smts-UAbFgkI7HSNfSK8hEVA-OzhPMiBN4KgGtn235k',
    link: '/products?category=Celulares%20y%20Tables',
    order: 1,
    isActive: 1,
    style: 'split'
  },
  {
    id: '2',
    title: 'Flash Sale: 40% Off',
    description: 'Limited time offer on top laptops.',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBFdxZAZnYYZlApBxPEh-YksdFWzzb22pfFu1Zk6Sz1emKl4dUbuL4ndun5np-jaLU_VRa7GheuPu_Fic3SNLHoTWzDnmV250IP_W4-53FqPNKYlJaHE1_7EbL588mVjZ8l2Iud6VJoOHQkfYpQb7y6AwRFwkBNGoDnOd-Y2IIuwltMbUzgpa_1SXNvIjKWI_CIwWDM4n70S7T6LSRn0HXwnauEFwLcWfABsd0jSviuVUOV8qtFOBLATUDb3sdKpXtoTAXSdJ8E72c',
    link: '/products?category=Computadores',
    order: 2,
    isActive: 1,
    style: 'cover'
  }
];

const INITIAL_SEED_CATEGORIES = [
  { id: '1', name: 'Celulares y Tables', icon: 'smartphone' },
  { id: '2', name: 'Computadores', icon: 'computer' },
  { id: '3', name: 'Impresoras Scaners', icon: 'print' },
  { id: '4', name: 'Redes', icon: 'router' },
  { id: '5', name: 'Perifericos', icon: 'mouse' },
  { id: '6', name: 'Almacenamiento', icon: 'sd_storage' },
  { id: '7', name: 'Pantalla y Televisores', icon: 'tv' },
  { id: '8', name: 'Dispositivos de Sonido', icon: 'headphones' },
  { id: '9', name: 'Componentes', icon: 'memory' },
  { id: '10', name: 'Dispositivos de carga', icon: 'battery_charging_full' },
  { id: '11', name: 'Morrales', icon: 'backpack' }
];

const INITIAL_SEED_PRODUCTS = [
  // Celulares y Tables
  { id: '101', sku: 'CEL-001', name: 'iPhone 15 Pro', description: 'El último iPhone con chip A17 Pro y diseño de titanio.', price: 4000000, category: 'Celulares y Tables', image: 'https://picsum.photos/seed/iphone15/400/400', specifications: '{"Marca": "Apple", "Almacenamiento": "256GB"}', isFeatured: 1 },
  { id: '102', sku: 'TAB-001', name: 'Samsung Galaxy Tab S9', description: 'Tablet Android de alto rendimiento con S Pen incluido.', price: 3200000, category: 'Celulares y Tables', image: 'https://picsum.photos/seed/tabs9/400/400', specifications: '{"Marca": "Samsung", "Pantalla": "11 pulgadas"}', isFeatured: 1 },
  
  // Computadores
  { id: '201', sku: 'LAP-001', name: 'MacBook Air M2', description: 'Potencia y portabilidad con el chip M2 de Apple.', price: 4800000, category: 'Computadores', image: 'https://picsum.photos/seed/macbook/400/400', specifications: '{"Marca": "Apple", "Procesador": "M2", "RAM": "8GB"}', isFeatured: 1 },
  { id: '202', sku: 'PC-001', name: 'Dell XPS 15', description: 'Laptop premium con pantalla InfinityEdge y alto rendimiento.', price: 6000000, category: 'Computadores', image: 'https://picsum.photos/seed/dellxps/400/400', specifications: '{"Marca": "Dell", "Procesador": "Intel i7", "RAM": "16GB"}', isFeatured: 0 },

  // Impresoras Scaners
  { id: '301', sku: 'IMP-001', name: 'Epson EcoTank L3250', description: 'Impresora multifuncional con sistema de tanque de tinta.', price: 920000, category: 'Impresoras Scaners', image: 'https://picsum.photos/seed/epson/400/400', specifications: '{"Marca": "Epson", "Tipo": "Inyección de tinta"}', isFeatured: 0 },
  
  // Redes
  { id: '401', sku: 'NET-001', name: 'TP-Link Archer AX50', description: 'Router Wi-Fi 6 de doble banda para alta velocidad.', price: 520000, category: 'Redes', image: 'https://picsum.photos/seed/router/400/400', specifications: '{"Marca": "TP-Link", "Velocidad": "AX3000"}', isFeatured: 0 },
  
  // Perifericos
  { id: '501', sku: 'PER-001', name: 'Logitech MX Master 3S', description: 'El ratón de productividad definitivo con clic silencioso.', price: 400000, category: 'Perifericos', image: 'https://picsum.photos/seed/mouse/400/400', specifications: '{"Marca": "Logitech", "Conexión": "Bluetooth"}', isFeatured: 1 },
  { id: '502', sku: 'PER-002', name: 'Teclado Keychron K2', description: 'Teclado mecánico inalámbrico compacto.', price: 360000, category: 'Perifericos', image: 'https://picsum.photos/seed/keyboard/400/400', specifications: '{"Marca": "Keychron", "Switch": "Brown"}', isFeatured: 0 },

  // Almacenamiento
  { id: '601', sku: 'STO-001', name: 'Samsung T7 Shield 1TB', description: 'SSD portátil resistente y rápido.', price: 440000, category: 'Almacenamiento', image: 'https://picsum.photos/seed/ssd/400/400', specifications: '{"Marca": "Samsung", "Capacidad": "1TB"}', isFeatured: 1 },
  
  // Pantalla y Televisores
  { id: '701', sku: 'MON-001', name: 'LG UltraGear 27"', description: 'Monitor gaming con 144Hz y 1ms de respuesta.', price: 1200000, category: 'Pantalla y Televisores', image: 'https://picsum.photos/seed/monitor/400/400', specifications: '{"Marca": "LG", "Resolución": "QHD"}', isFeatured: 1 },
  
  // Dispositivos de Sonido
  { id: '801', sku: 'AUD-001', name: 'Sony WH-1000XM5', description: 'Auriculares con la mejor cancelación de ruido del mercado.', price: 1400000, category: 'Dispositivos de Sonido', image: 'https://picsum.photos/seed/sonywh/400/400', specifications: '{"Marca": "Sony", "Batería": "30h"}', isFeatured: 1 },
  
  // Componentes
  { id: '901', sku: 'CMP-001', name: 'AMD Ryzen 7 7800X3D', description: 'El mejor procesador para gaming.', price: 1800000, category: 'Componentes', image: 'https://picsum.photos/seed/ryzen/400/400', specifications: '{"Marca": "AMD", "Núcleos": "8"}', isFeatured: 1 },
  
  // Dispositivos de carga
  { id: '1001', sku: 'PWR-001', name: 'Anker 737 Power Bank', description: 'Batería externa de alta capacidad con carga rápida.', price: 600000, category: 'Dispositivos de carga', image: 'https://picsum.photos/seed/anker/400/400', specifications: '{"Marca": "Anker", "Capacidad": "24000mAh"}', isFeatured: 0 },
  
  // Morrales
  { id: '1101', sku: 'BAG-001', name: 'Mochila Antirrobo', description: 'Mochila impermeable con puerto de carga USB.', price: 185000, category: 'Morrales', image: 'https://picsum.photos/seed/backpack/400/400', specifications: '{"Marca": "Generic", "Color": "Gris"}', isFeatured: 0 }
];


export const initDB = async () => {
  if (db) return db;

  try {
    const savedDb = await localforage.getItem<Uint8Array>(DB_NAME);
    
    const SQL = await initSqlJs({
      locateFile: (file: string) => `/${file}`
    });

    if (savedDb) {
      db = new SQL.Database(savedDb);
      console.log('Database loaded from storage');
      
      // Migration: Ensure isActive column exists for existing databases
      try {
        db.run("ALTER TABLE users ADD COLUMN isActive INTEGER DEFAULT 1");
        console.log("Migrated: Added isActive column to users table");
        saveDB();
      } catch (e) {
        // Column likely already exists, ignore
      }

      // Migration: Ensure role column exists for existing databases
      try {
        db.run("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'");
        // Set the first user as admin if no admin exists
        const result = db.exec("SELECT count(*) FROM users WHERE role = 'admin'");
        if (result[0].values[0][0] === 0) {
           db.run("UPDATE users SET role = 'admin' WHERE id = (SELECT id FROM users ORDER BY rowid LIMIT 1)");
           console.log("Migrated: Set first user as admin");
        }
        console.log("Migrated: Added role column to users table");
        saveDB();
      } catch (e) {
        // Column likely already exists, ignore
      }

      // Migration: Ensure mustChangePassword column exists
      try {
        db.run("ALTER TABLE users ADD COLUMN mustChangePassword INTEGER DEFAULT 0");
        console.log("Migrated: Added mustChangePassword column to users table");
        saveDB();
      } catch (e) {
        // Column likely already exists, ignore
      }

      // Migration: Ensure isActive column exists for products
      try {
        db.run("ALTER TABLE products ADD COLUMN isActive INTEGER DEFAULT 1");
        console.log("Migrated: Added isActive column to products table");
        saveDB();
      } catch (e) {
        // Column likely already exists, ignore
      }

      // Migration: Ensure images column exists for products
      try {
        db.run("ALTER TABLE products ADD COLUMN images TEXT");
        console.log("Migrated: Added images column to products table");
        saveDB();
      } catch (e) {
        // Column likely already exists, ignore
      }

      // Migration: Ensure orders tables exist
      try {
        db.run(`
          CREATE TABLE IF NOT EXISTS orders (
            id TEXT PRIMARY KEY,
            userId TEXT,
            total REAL,
            status TEXT,
            createdAt TEXT,
            notes TEXT,
            FOREIGN KEY(userId) REFERENCES users(id)
          );
          CREATE TABLE IF NOT EXISTS order_items (
            id TEXT PRIMARY KEY,
            orderId TEXT,
            productId TEXT,
            quantity INTEGER,
            price REAL,
            FOREIGN KEY(orderId) REFERENCES orders(id),
            FOREIGN KEY(productId) REFERENCES products(id)
          );
        `);
        console.log("Migrated: Ensure orders tables exist");
        saveDB();
      } catch (e) {
        console.error("Migration orders failed", e);
      }

      // Migration: Add notes column to orders if missing
      try {
        db.run("ALTER TABLE orders ADD COLUMN notes TEXT");
        console.log("Migrated: Added notes column to orders table");
        saveDB();
      } catch (e) {
        // Column likely already exists, ignore
      }

      // Migration: Ensure wishlist table exists
      try {
        db.run(`
          CREATE TABLE IF NOT EXISTS wishlist (
            userId TEXT,
            productId TEXT,
            createdAt TEXT,
            PRIMARY KEY (userId, productId),
            FOREIGN KEY(userId) REFERENCES users(id),
            FOREIGN KEY(productId) REFERENCES products(id)
          );
        `);
        console.log("Migrated: Ensure wishlist table exists");
        saveDB();
      } catch (e) {
        console.error("Migration wishlist failed", e);
      }

      // Migration: Ensure banners table exists
      try {
        db.run(`
          CREATE TABLE IF NOT EXISTS banners (
            id TEXT PRIMARY KEY,
            title TEXT,
            description TEXT,
            imageUrl TEXT,
            link TEXT,
            "order" INTEGER,
            isActive INTEGER DEFAULT 1,
            style TEXT DEFAULT 'split'
          );
        `);
        // Check if table is empty, if so, seed it
        const result = db.exec("SELECT count(*) FROM banners");
        if (result[0].values[0][0] === 0) {
             const insertBanner = db.prepare("INSERT INTO banners (id, title, description, imageUrl, link, `order`, isActive, style) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
             INITIAL_SEED_BANNERS.forEach(b => {
                insertBanner.run([b.id, b.title, b.description, b.imageUrl, b.link, b.order, b.isActive, b.style]);
             });
             insertBanner.free();
             console.log("Migrated: Seeded banners table");
        }
        
        // Ensure style column exists (for previously created table without it)
        try {
            db.run("ALTER TABLE banners ADD COLUMN style TEXT DEFAULT 'split'");
            saveDB();
        } catch (e) {
            // Ignore if column exists
        }

        console.log("Migrated: Ensure banners table exists");
        saveDB();
      } catch (e) {
        console.error("Migration banners failed", e);
      }

      // Migration: Ensure store_settings table exists
      try {
        db.run(`
          CREATE TABLE IF NOT EXISTS store_settings (
            key TEXT PRIMARY KEY,
            value TEXT,
            description TEXT
          );
        `);
        const result = db.exec("SELECT count(*) FROM store_settings");
        if (result[0].values[0][0] === 0) {
             const insertSetting = db.prepare("INSERT INTO store_settings (key, value, description) VALUES (?, ?, ?)");
             INITIAL_SEED_STORE_SETTINGS.forEach(s => {
                insertSetting.run([s.key, s.value, s.description]);
             });
             insertSetting.free();
             console.log("Migrated: Seeded store_settings table");
        }
        saveDB();
      } catch (e) {
        console.error("Migration store_settings failed", e);
      }

      // Migration: Ensure payment_methods table exists
      try {
        db.run(`
          CREATE TABLE IF NOT EXISTS payment_methods (
            id TEXT PRIMARY KEY,
            bankName TEXT,
            accountType TEXT,
            accountNumber TEXT,
            accountHolder TEXT,
            phone TEXT,
            email TEXT,
            isActive INTEGER DEFAULT 1,
            instructions TEXT
          );
        `);
        const result = db.exec("SELECT count(*) FROM payment_methods");
        if (result[0].values[0][0] === 0) {
             const insertMethod = db.prepare("INSERT INTO payment_methods (id, bankName, accountType, accountNumber, accountHolder, phone, email, isActive, instructions) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
             INITIAL_SEED_PAYMENT_METHODS.forEach(m => {
                insertMethod.run([m.id, m.bankName, m.accountType, m.accountNumber, m.accountHolder, null, null, m.isActive, m.instructions]);
             });
             insertMethod.free();
             console.log("Migrated: Seeded payment_methods table");
        }
        saveDB();
      } catch (e) {
        console.error("Migration payment_methods failed", e);
      }

    } else {
      console.log('Creating new database...');
      db = new SQL.Database();
      seedDB(db);
    }

    return db;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
};

const seedDB = (database: Database) => {
  database.run(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      sku TEXT,
      name TEXT,
      description TEXT,
      price REAL,
      category TEXT,
      image TEXT,
      specifications TEXT,
      isFeatured INTEGER,
      isActive INTEGER DEFAULT 1,
      images TEXT
    );
    
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT,
      image TEXT,
      icon TEXT
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT,
      password TEXT,
      avatar TEXT,
      phone TEXT,
      city TEXT,
      isActive INTEGER DEFAULT 1,
      role TEXT DEFAULT 'user',
      mustChangePassword INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS profile_sections (
      id TEXT PRIMARY KEY,
      icon TEXT,
      title TEXT,
      subtitle TEXT,
      route TEXT
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      userId TEXT,
      total REAL,
      status TEXT,
      createdAt TEXT,
      notes TEXT,
      FOREIGN KEY(userId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      orderId TEXT,
      productId TEXT,
      quantity INTEGER,
      price REAL,
      FOREIGN KEY(orderId) REFERENCES orders(id),
      FOREIGN KEY(productId) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS wishlist (
      userId TEXT,
      productId TEXT,
      createdAt TEXT,
      PRIMARY KEY (userId, productId),
      FOREIGN KEY(userId) REFERENCES users(id),
      FOREIGN KEY(productId) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS banners (
      id TEXT PRIMARY KEY,
      title TEXT,
      description TEXT,
      imageUrl TEXT,
      link TEXT,
      "order" INTEGER,
      isActive INTEGER DEFAULT 1,
      style TEXT DEFAULT 'split'
    );

    CREATE TABLE IF NOT EXISTS store_settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS payment_methods (
      id TEXT PRIMARY KEY,
      bankName TEXT,
      accountType TEXT,
      accountNumber TEXT,
      accountHolder TEXT,
      phone TEXT,
      email TEXT,
      isActive INTEGER DEFAULT 1,
      instructions TEXT
    );

    INSERT INTO categories (id, name, image, icon) VALUES 
    ${INITIAL_SEED_CATEGORIES.map(c => `('${c.id}', '${c.name}', 'https://picsum.photos/seed/cat${c.id}/200/200', '${c.icon}')`).join(',\n    ')};

    INSERT INTO banners (id, title, description, imageUrl, link, "order", isActive, style) VALUES
    ${INITIAL_SEED_BANNERS.map(b => `('${b.id}', '${b.title}', '${b.description}', '${b.imageUrl}', '${b.link}', ${b.order}, ${b.isActive}, '${b.style}')`).join(',\n    ')};

    INSERT INTO store_settings (key, value, description) VALUES
    ${INITIAL_SEED_STORE_SETTINGS.map(s => `('${s.key}', '${s.value}', '${s.description}')`).join(',\n    ')};

    INSERT INTO payment_methods (id, bankName, accountType, accountNumber, accountHolder, phone, email, isActive, instructions) VALUES
    ${INITIAL_SEED_PAYMENT_METHODS.map(m => `('${m.id}', '${m.bankName}', '${m.accountType}', '${m.accountNumber}', '${m.accountHolder}', NULL, NULL, ${m.isActive}, '${m.instructions}')`).join(',\n    ')};

    INSERT INTO products (id, sku, name, description, price, category, image, specifications, isFeatured, isActive, images) VALUES
    ${INITIAL_SEED_PRODUCTS.map(p => `('${p.id}', '${p.sku}', '${p.name}', '${p.description}', ${p.price}, '${p.category}', '${p.image}', '${p.specifications}', ${p.isFeatured}, 1, '[]')`).join(',\n    ')};

    INSERT INTO users (id, name, email, password, avatar, phone, city, isActive, role, mustChangePassword) VALUES
    ('u1', 'Juan Pérez', 'juan.perez@example.com', 'password123', 'https://picsum.photos/seed/user1/100/100', '+34 600 000 000', 'Madrid', 1, 'admin', 0);

    INSERT INTO profile_sections (id, icon, title, subtitle, route) VALUES
    ('1', 'person', 'Información Personal', 'Gestiona tus datos personales', '/profile/info'),
    ('2', 'shopping_bag', 'Mis Pedidos', 'Revisa el estado de tus compras', '/profile/orders'),
    ('3', 'favorite', 'Lista de Deseos', 'Tus productos favoritos', '/profile/wishlist'),
    ('4', 'credit_card', 'Métodos de Pago', 'Cuentas para consignar', '/profile/payment-methods'),
    ('5', 'settings', 'Configuración', 'Preferencias de la aplicación', '/settings');
  `);

  try {
    saveDB();
    console.log('Database initialized with seed data');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

export const saveDB = async () => {
  if (!db) return;
  const data = db.export();
  await localforage.setItem(DB_NAME, data);
};

export const getDB = () => {
  if (!db) throw new Error("Database not initialized");
  return db;
};

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const SIMULATED_LATENCY = 300;

// Helper functions for queries
export const dbQuery = {
  getProducts: async (): Promise<Product[]> => {
    await delay(SIMULATED_LATENCY);
    const db = getDB();
    const result = db.exec("SELECT * FROM products");
    if (result.length === 0) return [];
    
    const rows = result[0].values as ProductRow[];
    return rows.map((row) => ({
      id: row[0],
      sku: row[1],
      name: row[2],
      description: row[3],
      price: row[4],
      category: row[5],
      image: row[6],
      specifications: JSON.parse(row[7]),
      isFeatured: row[8] === 1,
      isActive: row[9] === 1,
      images: row[10] ? JSON.parse(row[10]) : []
    }));
  },

  createProduct: async (product: Omit<Product, 'id'> & { id?: string }): Promise<void> => {
    await delay(SIMULATED_LATENCY);
    const db = getDB();
    const id = product.id || `p_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const stmt = db.prepare(
      "INSERT INTO products (id, sku, name, description, price, category, image, specifications, isFeatured, isActive, images) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    stmt.run([
      id,
      product.sku,
      product.name,
      product.description,
      product.price,
      product.category,
      product.image,
      JSON.stringify(product.specifications),
      product.isFeatured ? 1 : 0,
      product.isActive !== false ? 1 : 0,
      JSON.stringify(product.images || [])
    ]);
    stmt.free();
    await saveDB();
  },

  updateProduct: async (product: Product): Promise<void> => {
    await delay(SIMULATED_LATENCY);
    const db = getDB();
    const stmt = db.prepare("UPDATE products SET sku = ?, name = ?, description = ?, price = ?, category = ?, image = ?, specifications = ?, isFeatured = ?, isActive = ?, images = ? WHERE id = ?");
    stmt.run([
      product.sku,
      product.name,
      product.description,
      product.price,
      product.category,
      product.image,
      JSON.stringify(product.specifications),
      product.isFeatured ? 1 : 0,
      product.isActive !== false ? 1 : 0,
      JSON.stringify(product.images || []),
      product.id
    ]);
    stmt.free();
    await saveDB();
  },

  bulkUpsertProducts: async (products: Product[]): Promise<void> => {
    await delay(SIMULATED_LATENCY);
    const db = getDB();
    const stmt = db.prepare(
      "INSERT OR REPLACE INTO products (id, sku, name, description, price, category, image, specifications, isFeatured, isActive, images) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    
    db.exec("BEGIN TRANSACTION");
    try {
        for (const p of products) {
             stmt.run([
              p.id,
              p.sku,
              p.name,
              p.description,
              p.price,
              p.category,
              p.image,
              JSON.stringify(p.specifications),
              p.isFeatured ? 1 : 0,
              p.isActive !== false ? 1 : 0,
              JSON.stringify(p.images || [])
            ]);
        }
        db.exec("COMMIT");
    } catch (e) {
        db.exec("ROLLBACK");
        stmt.free();
        throw e;
    }
    stmt.free();
    await saveDB();
  },

  setProductFeaturedStatus: async (id: string, isFeatured: boolean): Promise<void> => {
    await delay(SIMULATED_LATENCY);
    const db = getDB();
    const stmt = db.prepare("UPDATE products SET isFeatured = ? WHERE id = ?");
    stmt.run([isFeatured ? 1 : 0, id]);
    stmt.free();
    await saveDB();
  },

  deleteProduct: async (id: string): Promise<void> => {
    await delay(SIMULATED_LATENCY);
    const db = getDB();
    const stmt = db.prepare("DELETE FROM products WHERE id = ?");
    stmt.run([id]);
    stmt.free();
    await saveDB();
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
    await delay(SIMULATED_LATENCY);
    const db = getDB();
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

    const insertStmt = db.prepare(
      "INSERT INTO users (id, name, email, password, avatar, phone, city, isActive, role, mustChangePassword) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    insertStmt.run([id, name, email, password || null, avatar, phone, city, isActive ? 1 : 0, role, mustChangePassword ? 1 : 0]);
    insertStmt.free();
    await saveDB();

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

  updateUserDetails: async (user: User): Promise<void> => {
    await delay(SIMULATED_LATENCY);
    const db = getDB();
    const stmt = db.prepare("UPDATE users SET name = ?, email = ?, phone = ?, city = ?, avatar = ?, isActive = ?, role = ?, mustChangePassword = ? WHERE id = ?");
    stmt.run([
      user.name,
      user.email,
      (user.phone ?? null) as SqlValue,
      (user.city ?? null) as SqlValue,
      (user.avatar ?? null) as SqlValue,
      user.isActive ? 1 : 0,
      (user.role ?? 'user'),
      user.mustChangePassword ? 1 : 0,
      user.id
    ]);
    stmt.free();
    await saveDB();
  },

  deleteUser: async (userId: string): Promise<void> => {
    await delay(SIMULATED_LATENCY);
    const db = getDB();
    // delete wishlist
    const delWishlist = db.prepare("DELETE FROM wishlist WHERE userId = ?");
    delWishlist.run([userId]);
    delWishlist.free();
    // delete order items for user's orders
    const delOrderItems = db.prepare("DELETE FROM order_items WHERE orderId IN (SELECT id FROM orders WHERE userId = ?)");
    delOrderItems.run([userId]);
    delOrderItems.free();
    // delete orders
    const delOrders = db.prepare("DELETE FROM orders WHERE userId = ?");
    delOrders.run([userId]);
    delOrders.free();
    // delete user
    const delUser = db.prepare("DELETE FROM users WHERE id = ?");
    delUser.run([userId]);
    delUser.free();
    await saveDB();
  },

  getProductById: async (id: string): Promise<Product | undefined> => {
    await delay(SIMULATED_LATENCY);
    const db = getDB();
    const stmt = db.prepare("SELECT * FROM products WHERE id = ?");
    stmt.bind([id]);
    
    if (stmt.step()) {
      const row = stmt.get() as ProductRow;
      stmt.free();
      return {
        id: row[0],
        sku: row[1],
        name: row[2],
        description: row[3],
        price: row[4],
        category: row[5],
        image: row[6],
        specifications: JSON.parse(row[7]),
        isFeatured: row[8] === 1,
        isActive: row[9] === 1,
        images: row[10] ? JSON.parse(row[10]) : []
      };
    }
    stmt.free();
    return undefined;
  },

  getCategories: async (): Promise<Category[]> => {
    await delay(SIMULATED_LATENCY);
    const db = getDB();
    const result = db.exec("SELECT * FROM categories");
    if (result.length === 0) return [];
    
    const rows = result[0].values as CategoryRow[];
    return rows.map(([id, name, image, icon]) => ({
      id,
      name,
      image,
      icon
    }));
  },

  createCategory: async (category: Omit<Category, 'id'> & { id?: string }): Promise<void> => {
    await delay(SIMULATED_LATENCY);
    const db = getDB();
    const id = category.id || `cat-${Date.now()}`;
    const stmt = db.prepare("INSERT INTO categories (id, name, image, icon) VALUES (?, ?, ?, ?)");
    stmt.bind([id, category.name, category.image, category.icon || 'category']);
    stmt.step();
    stmt.free();
    await saveDB();
  },

  updateCategory: async (category: Category): Promise<void> => {
    await delay(SIMULATED_LATENCY);
    const db = getDB();
    const stmt = db.prepare("UPDATE categories SET name = ?, image = ?, icon = ? WHERE id = ?");
    stmt.bind([category.name, category.image, category.icon || 'category', category.id]);
    stmt.step();
    stmt.free();
    await saveDB();
  },

  deleteCategory: async (id: string): Promise<void> => {
    await delay(SIMULATED_LATENCY);
    const db = getDB();
    const stmt = db.prepare("DELETE FROM categories WHERE id = ?");
    stmt.bind([id]);
    stmt.step();
    stmt.free();
    await saveDB();
  },

  getUserByEmail: async (email: string): Promise<User | undefined> => {
    await delay(SIMULATED_LATENCY);
    const db = getDB();
    const stmt = db.prepare("SELECT * FROM users WHERE email = ? LIMIT 1");
    stmt.bind([email]);
    
    if (stmt.step()) {
      const row = stmt.get() as UserRow;
      stmt.free();
      return {
        id: row[0],
        name: row[1],
        email: row[2],
        password: row[3] ?? undefined,
        avatar: row[4] ?? undefined,
        phone: row[5] ?? undefined,
        city: row[6] ?? undefined,
        isActive: row[7] === 1,
        role: (row[8] as 'user' | 'admin') || 'user',
        mustChangePassword: row[9] === 1
      };
    }
    stmt.free();
    return undefined;
  },

  getAllUsers: async (): Promise<User[]> => {
    await delay(SIMULATED_LATENCY);
    const db = getDB();
    const result = db.exec("SELECT * FROM users");
    if (result.length === 0) return [];
    
    const rows = result[0].values as UserRow[];
    return rows.map(row => ({
      id: row[0],
      name: row[1],
      email: row[2],
      password: row[3] ?? undefined,
      avatar: row[4] ?? undefined,
      phone: row[5] ?? undefined,
      city: row[6] ?? undefined,
      isActive: row[7] === 1,
      role: (row[8] as 'user' | 'admin') || 'user',
      mustChangePassword: row[9] === 1
    }));
  },

  updateUserRole: async (userId: string, role: 'user' | 'admin'): Promise<void> => {
    await delay(SIMULATED_LATENCY);
    const db = getDB();
    const stmt = db.prepare("UPDATE users SET role = ? WHERE id = ?");
    stmt.run([role, userId]);
    stmt.free();
    await saveDB();
  },

  loginUser: async (email: string, password: string): Promise<User> => {
    await delay(SIMULATED_LATENCY);
    const db = getDB();

    const selectStmt = db.prepare("SELECT * FROM users WHERE email = ? LIMIT 1");
    selectStmt.bind([email]);

    let existingRow: UserRow | null = null;
    if (selectStmt.step()) {
      existingRow = selectStmt.get() as UserRow;
    }
    selectStmt.free();

    if (!existingRow) {
      throw new Error('USER_NOT_FOUND');
    }

    const storedPassword = existingRow[3];
    if (storedPassword && storedPassword !== password) {
      throw new Error('INVALID_PASSWORD');
    }

    if (!storedPassword) {
       throw new Error('INVALID_PASSWORD'); 
    }

    return {
      id: existingRow[0],
      name: existingRow[1],
      email: existingRow[2],
      password: storedPassword,
      avatar: existingRow[4] ?? undefined,
      phone: existingRow[5] ?? undefined,
      city: existingRow[6] ?? undefined,
      isActive: existingRow[7] === 1,
      role: (existingRow[8] as 'user' | 'admin') || 'user',
      mustChangePassword: existingRow[9] === 1
    };
  },

  registerUser: async (email: string, password: string): Promise<User> => {
    await delay(SIMULATED_LATENCY);
    const db = getDB();
    
    // Check if user already exists
    const selectStmt = db.prepare("SELECT 1 FROM users WHERE email = ? LIMIT 1");
    selectStmt.bind([email]);
    const exists = selectStmt.step();
    selectStmt.free();

    if (exists) {
      throw new Error('USER_ALREADY_EXISTS');
    }

    const id = `u_${Date.now()}`;
    const name = email.split('@')[0] || 'Nuevo usuario';

    const insertStmt = db.prepare(
      "INSERT INTO users (id, name, email, password, avatar, phone, city, isActive, role, mustChangePassword) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    // Default role is user. Logic to make first user admin is in initDB/migration, but here we can't easily check count efficiently without extra query.
    // Let's stick to 'user' for new registrations.
    insertStmt.run([id, name, email, password, null, null, null, 1, 'user', 0]);
    insertStmt.free();

    await saveDB();

    return {
      id,
      name,
      email,
      password,
      avatar: undefined,
      phone: undefined,
      city: undefined,
      isActive: true,
      role: 'user',
      mustChangePassword: false
    };
  },

  updateUser: async (user: User): Promise<void> => {
    await delay(SIMULATED_LATENCY);
    const db = getDB();
    const stmt = db.prepare("UPDATE users SET name = ?, phone = ?, city = ? WHERE id = ?");
    stmt.run([
      user.name,
      (user.phone ?? null) as SqlValue,
      (user.city ?? null) as SqlValue,
      user.id
    ]);
    stmt.free();
    await saveDB();
  },

  updateUserPassword: async (userId: string, newPassword: string): Promise<void> => {
    await delay(SIMULATED_LATENCY);
    const db = getDB();
    const stmt = db.prepare("UPDATE users SET password = ?, mustChangePassword = 0 WHERE id = ?");
    stmt.run([newPassword, userId]);
    stmt.free();
    await saveDB();
  },

  setUserMustChangePassword: async (userId: string, mustChange: boolean): Promise<void> => {
    await delay(SIMULATED_LATENCY);
    const db = getDB();
    const stmt = db.prepare("UPDATE users SET mustChangePassword = ? WHERE id = ?");
    stmt.run([mustChange ? 1 : 0, userId]);
    stmt.free();
    await saveDB();
  },

  getCurrentUser: async (): Promise<User | null> => {
    await delay(SIMULATED_LATENCY);
    const userId = localStorage.getItem('currentUserId');
    if (!userId) return null;

    const db = getDB();
    const stmt = db.prepare("SELECT * FROM users WHERE id = ?");
    stmt.bind([userId]);
    
    if (stmt.step()) {
      const row = stmt.get() as UserRow;
      stmt.free();
      return {
        id: row[0],
        name: row[1],
        email: row[2],
        password: row[3] ?? undefined,
        avatar: row[4] ?? undefined,
        phone: row[5] ?? undefined,
        city: row[6] ?? undefined,
        isActive: row[7] === 1,
        role: (row[8] as 'user' | 'admin') || 'user'
      };
    }
    stmt.free();
    return null;
  },

  createOrder: async (userId: string, items: { productId: string; quantity: number; price: number }[], total: number): Promise<string> => {
    await delay(SIMULATED_LATENCY);
    const db = getDB();
    const orderId = `ord_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const createdAt = new Date().toISOString();

    try {
      // Create Order
      const insertOrder = db.prepare("INSERT INTO orders (id, userId, total, status, createdAt, notes) VALUES (?, ?, ?, ?, ?, ?)");
      insertOrder.run([orderId, userId, total, 'pending', createdAt, '']);
      insertOrder.free();

      // Create Order Items
      const insertItem = db.prepare("INSERT INTO order_items (id, orderId, productId, quantity, price) VALUES (?, ?, ?, ?, ?)");
      
      for (const item of items) {
        const itemId = `itm_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        insertItem.run([itemId, orderId, item.productId, item.quantity, item.price]);
      }
      insertItem.free();
      await saveDB();
      return orderId;
    } catch (error) {
      console.error("Error creating order:", error);
      throw error;
    }
  },

  getPaymentMethods: async (): Promise<PaymentMethod[]> => {
    await delay(SIMULATED_LATENCY);
    const db = getDB();
    const result = db.exec("SELECT * FROM payment_methods WHERE isActive = 1");
    if (result.length === 0) return [];
    
    const rows = result[0].values as PaymentMethodRow[];
    return rows.map(row => ({
      id: row[0],
      bankName: row[1],
      accountType: row[2],
      accountNumber: row[3],
      accountHolder: row[4] ?? undefined,
      phone: row[5] ?? undefined,
      email: row[6] ?? undefined,
      isActive: row[7] === 1,
      instructions: row[8] ?? undefined
    }));
  },

  getStoreSettings: async (): Promise<StoreSetting[]> => {
    await delay(SIMULATED_LATENCY);
    const db = getDB();
    const result = db.exec("SELECT * FROM store_settings");
    if (result.length === 0) return [];
    
    const rows = result[0].values as StoreSettingRow[];
    return rows.map(row => ({
      key: row[0],
      value: row[1],
      description: row[2] ?? undefined
    }));
  },
  
  getStoreSetting: async (key: string): Promise<string | null> => {
     await delay(SIMULATED_LATENCY);
     const db = getDB();
     const stmt = db.prepare("SELECT value FROM store_settings WHERE key = ?");
     stmt.bind([key]);
     let value: string | null = null;
     if (stmt.step()) {
         value = stmt.get()[0] as string;
     }
     stmt.free();
     return value;
  },

  getBanners: async (): Promise<Banner[]> => {
    await delay(SIMULATED_LATENCY);
    const db = getDB();
    const result = db.exec("SELECT * FROM banners WHERE isActive = 1 ORDER BY `order` ASC");
    if (result.length === 0) return [];
    
    const rows = result[0].values as BannerRow[];
    return rows.map(row => ({
      id: row[0],
      title: row[1],
      description: row[2],
      imageUrl: row[3],
      link: row[4],
      order: row[5],
      isActive: row[6] === 1,
      style: (row[7] as 'split' | 'cover') || 'split'
    }));
  },

  updateStoreSetting: async (key: string, value: string): Promise<void> => {
    await delay(SIMULATED_LATENCY);
    const db = getDB();
    const stmt = db.prepare("INSERT OR REPLACE INTO store_settings (key, value) VALUES (?, ?)");
    stmt.run([key, value]);
    stmt.free();
    await saveDB();
  },

  getAllPaymentMethods: async (): Promise<PaymentMethod[]> => {
    // For admin, returns all including inactive
    await delay(SIMULATED_LATENCY);
    const db = getDB();
    const result = db.exec("SELECT * FROM payment_methods");
    if (result.length === 0) return [];
    
    const rows = result[0].values as PaymentMethodRow[];
    return rows.map(row => ({
      id: row[0],
      bankName: row[1],
      accountType: row[2],
      accountNumber: row[3],
      accountHolder: row[4] ?? undefined,
      phone: row[5] ?? undefined,
      email: row[6] ?? undefined,
      isActive: row[7] === 1,
      instructions: row[8] ?? undefined
    }));
  },

  updatePaymentMethod: async (method: PaymentMethod): Promise<void> => {
    await delay(SIMULATED_LATENCY);
    const db = getDB();
    const stmt = db.prepare("UPDATE payment_methods SET bankName = ?, accountType = ?, accountNumber = ?, accountHolder = ?, phone = ?, email = ?, isActive = ?, instructions = ? WHERE id = ?");
    stmt.run([
        method.bankName,
        method.accountType,
        method.accountNumber,
        method.accountHolder || null,
        method.phone || null,
        method.email || null,
        method.isActive ? 1 : 0,
        method.instructions || null,
        method.id
    ]);
    stmt.free();
    await saveDB();
  },
  
  createPaymentMethod: async (method: Omit<PaymentMethod, 'id'>): Promise<void> => {
    await delay(SIMULATED_LATENCY);
    const db = getDB();
    const id = `pm_${Date.now()}`;
    const stmt = db.prepare("INSERT INTO payment_methods (id, bankName, accountType, accountNumber, accountHolder, phone, email, isActive, instructions) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
    stmt.run([
        id,
        method.bankName,
        method.accountType,
        method.accountNumber,
        method.accountHolder || null,
        method.phone || null,
        method.email || null,
        method.isActive ? 1 : 0,
        method.instructions || null
    ]);
    stmt.free();
    await saveDB();
  },
  
  deletePaymentMethod: async (id: string): Promise<void> => {
    await delay(SIMULATED_LATENCY);
    const db = getDB();
    const stmt = db.prepare("DELETE FROM payment_methods WHERE id = ?");
    stmt.run([id]);
    stmt.free();
    await saveDB();
  },

  getAllBanners: async (): Promise<Banner[]> => {
     // For admin
     await delay(SIMULATED_LATENCY);
     const db = getDB();
     const result = db.exec("SELECT * FROM banners ORDER BY `order` ASC");
     if (result.length === 0) return [];
     
     const rows = result[0].values as BannerRow[];
     return rows.map(row => ({
       id: row[0],
       title: row[1],
       description: row[2],
       imageUrl: row[3],
       link: row[4],
       order: row[5],
       isActive: row[6] === 1,
       style: (row[7] as 'split' | 'cover') || 'split'
     }));
  },

  updateBanner: async (banner: Banner): Promise<void> => {
    await delay(SIMULATED_LATENCY);
    const db = getDB();
    const stmt = db.prepare("UPDATE banners SET title = ?, description = ?, imageUrl = ?, link = ?, `order` = ?, isActive = ?, style = ? WHERE id = ?");
    stmt.run([
        banner.title,
        banner.description,
        banner.imageUrl,
        banner.link,
        banner.order || 0,
        banner.isActive ? 1 : 0,
        banner.style || 'split',
        banner.id
    ]);
    stmt.free();
    await saveDB();
  },

  createBanner: async (banner: Omit<Banner, 'id'>): Promise<void> => {
    await delay(SIMULATED_LATENCY);
    const db = getDB();
    const id = `bn_${Date.now()}`;
    const stmt = db.prepare("INSERT INTO banners (id, title, description, imageUrl, link, `order`, isActive, style) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    stmt.run([
        id,
        banner.title,
        banner.description,
        banner.imageUrl,
        banner.link,
        banner.order || 0,
        banner.isActive ? 1 : 0,
        banner.style || 'split'
    ]);
    stmt.free();
    await saveDB();
  },

  deleteBanner: async (id: string): Promise<void> => {
    await delay(SIMULATED_LATENCY);
    const db = getDB();
    const stmt = db.prepare("DELETE FROM banners WHERE id = ?");
    stmt.run([id]);
    stmt.free();
    await saveDB();
  },
  
  getOrdersByUser: async (userId: string): Promise<Order[]> => {
    await delay(SIMULATED_LATENCY);
    const db = getDB();
    const stmt = db.prepare("SELECT * FROM orders WHERE userId = ? ORDER BY createdAt DESC");
    stmt.bind([userId]);
    
    const orders: Order[] = [];
    
    while (stmt.step()) {
      const row = stmt.get() as OrderRow;
      orders.push({
        id: row[0],
        userId: row[1],
        total: row[2],
        status: row[3] as Order['status'],
        createdAt: row[4],
        notes: row[5] ?? undefined,
        items: []
      });
    }
    stmt.free();

    // Populate items for each order
    for (const order of orders) {
      const itemStmt = db.prepare(`
        SELECT oi.*, p.name, p.image 
        FROM order_items oi 
        JOIN products p ON oi.productId = p.id 
        WHERE oi.orderId = ?
      `);
      itemStmt.bind([order.id]);
      
      while (itemStmt.step()) {
        const row = itemStmt.get() as OrderItemRow;
        order.items?.push({
          id: row[0],
          orderId: row[1],
          productId: row[2],
          quantity: row[3],
          price: row[4],
          productName: row[5],
          productImage: row[6]
        });
      }
      itemStmt.free();
    }

    return orders;
  },

  getAllOrders: async (): Promise<Order[]> => {
    await delay(SIMULATED_LATENCY);
    const db = getDB();
    const stmt = db.prepare("SELECT * FROM orders ORDER BY createdAt DESC");
    
    const orders: Order[] = [];
    
    while (stmt.step()) {
      const row = stmt.get() as OrderRow;
      orders.push({
        id: row[0],
        userId: row[1],
        total: row[2],
        status: row[3] as Order['status'],
        createdAt: row[4],
        notes: row[5] ?? undefined,
        items: []
      });
    }
    stmt.free();

    // Populate items for each order
    for (const order of orders) {
      const itemStmt = db.prepare(`
        SELECT oi.*, p.name, p.image 
        FROM order_items oi 
        JOIN products p ON oi.productId = p.id 
        WHERE oi.orderId = ?
      `);
      itemStmt.bind([order.id]);
      
      while (itemStmt.step()) {
        const row = itemStmt.get() as OrderItemRow;
        order.items?.push({
          id: row[0],
          orderId: row[1],
          productId: row[2],
          quantity: row[3],
          price: row[4],
          productName: row[5],
          productImage: row[6]
        });
      }
      itemStmt.free();
    }

    return orders;
  },

  updateOrderStatus: async (orderId: string, status: Order['status']): Promise<void> => {
    await delay(SIMULATED_LATENCY);
    const db = getDB();
    const stmt = db.prepare("UPDATE orders SET status = ? WHERE id = ?");
    stmt.run([status, orderId]);
    stmt.free();
    await saveDB();
  },

  updateOrderNotes: async (orderId: string, notes: string): Promise<void> => {
    await delay(SIMULATED_LATENCY);
    const db = getDB();
    const stmt = db.prepare("UPDATE orders SET notes = ? WHERE id = ?");
    stmt.run([notes, orderId]);
    stmt.free();
    await saveDB();
  },

  deleteOrder: async (orderId: string): Promise<void> => {
    await delay(SIMULATED_LATENCY);
    const db = getDB();
    try {
      // Delete order items first (foreign key constraint usually handles this if set to CASCADE, 
      // but good to be explicit or if CASCADE isn't set)
      const deleteItems = db.prepare("DELETE FROM order_items WHERE orderId = ?");
      deleteItems.run([orderId]);
      deleteItems.free();

      // Delete order
      const deleteOrder = db.prepare("DELETE FROM orders WHERE id = ?");
      deleteOrder.run([orderId]);
      deleteOrder.free();

      await saveDB();
    } catch (error) {
      console.error("Failed to delete order", error);
      throw error;
    }
  },

  addToWishlist: async (userId: string, productId: string): Promise<void> => {
    await delay(SIMULATED_LATENCY);
    const db = getDB();
    const createdAt = new Date().toISOString();
    try {
      const stmt = db.prepare("INSERT OR IGNORE INTO wishlist (userId, productId, createdAt) VALUES (?, ?, ?)");
      stmt.run([userId, productId, createdAt]);
      stmt.free();
      await saveDB();
    } catch (error) {
      console.error("Failed to add to wishlist", error);
      throw error;
    }
  },

  removeFromWishlist: async (userId: string, productId: string): Promise<void> => {
    await delay(SIMULATED_LATENCY);
    const db = getDB();
    try {
      const stmt = db.prepare("DELETE FROM wishlist WHERE userId = ? AND productId = ?");
      stmt.run([userId, productId]);
      stmt.free();
      await saveDB();
    } catch (error) {
      console.error("Failed to remove from wishlist", error);
      throw error;
    }
  },

  getWishlist: async (userId: string): Promise<string[]> => {
    await delay(SIMULATED_LATENCY);
    const db = getDB();
    const stmt = db.prepare("SELECT productId FROM wishlist WHERE userId = ?");
    stmt.bind([userId]);
    
    const productIds: string[] = [];
    while (stmt.step()) {
      const row = stmt.get();
      productIds.push(row[0] as string);
    }
    stmt.free();
    return productIds;
  },

  getWishlistProducts: async (userId: string): Promise<Product[]> => {
    await delay(SIMULATED_LATENCY);
    const db = getDB();
    const stmt = db.prepare(`
      SELECT p.* 
      FROM wishlist w
      JOIN products p ON w.productId = p.id
      WHERE w.userId = ?
      ORDER BY w.createdAt DESC
    `);
    stmt.bind([userId]);
    
    const products: Product[] = [];
    while (stmt.step()) {
      const row = stmt.get() as ProductRow;
      products.push({
        id: row[0],
        sku: row[1],
        name: row[2],
        description: row[3],
        price: row[4],
        category: row[5],
        image: row[6],
        specifications: JSON.parse(row[7]),
        isFeatured: row[8] === 1,
        isActive: row[9] === 1
      });
    }
    stmt.free();
    return products;
  },

  isInWishlist: async (userId: string, productId: string): Promise<boolean> => {
    await delay(SIMULATED_LATENCY);
    const db = getDB();
    const stmt = db.prepare("SELECT 1 FROM wishlist WHERE userId = ? AND productId = ?");
    stmt.bind([userId, productId]);
    const exists = stmt.step();
    stmt.free();
    return exists;
  },

  getProfileSections: async (): Promise<ProfileSection[]> => {
    await delay(SIMULATED_LATENCY);
    const db = getDB();
    const result = db.exec("SELECT * FROM profile_sections");
    if (result.length === 0) return [];
    
    const rows = result[0].values as ProfileSectionRow[];
    return rows.map(([id, icon, title, subtitle, route]) => ({
      id,
      icon,
      title,
      subtitle,
      route: route ?? undefined
    }));
  },

  // Storage (Mock)
  uploadFile: async (file: File, bucket: string = 'settings'): Promise<string> => {
    // In a real local-first app, we might save the file to IndexedDB/Blob storage.
    // For now, since we rely on Supabase Storage for public URLs, we'll throw a clearer error
    // or return a placeholder if we wanted to support "offline" uploads that sync later.
    console.warn('File upload is not supported in offline/local-only mode.');
    throw new Error('La carga de archivos requiere conexión a internet y acceso al servidor.');
  }
};
