# Características y Funcionalidades

## Funcionalidades Principales

### 1. Experiencia de Usuario (Cliente)
- **Diseño Mobile-First**: Interfaz optimizada para dispositivos móviles con navegación inferior intuitiva.
- **Soporte PWA**: Instalable como aplicación nativa, con soporte para funcionamiento offline.
- **Catálogo de Productos**: Exploración por categorías, búsqueda en tiempo real y filtrado.
- **Detalles de Producto**: Vistas ricas con especificaciones, galería de imágenes y productos relacionados.
- **Carrito de Compras**: Gestión de ítems persistente (LocalStorage).
- **Lista de Deseos (Wishlist)**: Guardado de productos favoritos (requiere autenticación).

### 2. Proceso de Compra (Checkout)
- **Pedido por WhatsApp (Guest Checkout)**: Permite a usuarios no autenticados enviar su pedido directamente a través de WhatsApp sin necesidad de registro.
- **Gestión de Sesión**: El carrito no se borra automáticamente para invitados, previniendo pérdida de datos.

### 3. Autenticación y Perfil
- **Inicio de Sesión / Registro**: Integración segura con Supabase Auth.
- **Perfil de Usuario**: Gestión de información personal y métodos de pago.
- **Historial de Pedidos**: Visualización de compras anteriores.

### 4. Soporte Offline (Sin Conexión)
- **Sincronización de Datos**: Los productos, categorías y banners se sincronizan localmente usando IndexedDB.
- **Indicadores de Estado**: La UI informa al usuario si está viendo datos en vivo o cacheados ("Offline" vs "Cached").
- **Resiliencia**: Si la red falla o es lenta, la aplicación sirve datos locales instantáneamente.

### 5. Panel de Administración
- **Dashboard Seguro**: Acceso restringido a administradores.
- **Gestión de Banners**: Configuración dinámica de banners promocionales en la Home.
- **Gestión de Categorías**: Creación, edición y eliminación de categorías.
- **Gestión de Productos**: CRUD completo de productos, incluyendo carga masiva vía CSV.
