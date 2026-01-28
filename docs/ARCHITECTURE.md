# Arquitectura Técnica

## Tech Stack

- **Frontend**: React 18+ (Vite)
- **Lenguaje**: TypeScript
- **Estilos**: TailwindCSS v3
- **Backend (BaaS)**: Supabase (PostgreSQL, Auth, Storage)
- **PWA**: Vite PWA Plugin (Service Workers, Manifest)
- **Iconos**: Material Symbols (Google Fonts)

## Estrategia de Datos (Offline-First)

La aplicación implementa una estrategia robusta para funcionar en entornos de conectividad inestable o nula.

### 1. Persistencia Local (IndexedDB)
Utilizamos `idb` para interactuar con IndexedDB en el navegador. Mantenemos réplicas locales de tablas críticas:
- `products`
- `categories`
- `banners`
- `user_profile`
- `payment_methods`

### 2. Flujo de Sincronización
El patrón general para la obtención de datos (`services/*.ts`) es:

1.  **Network-First con Fallback**: Intentar obtener datos frescos de Supabase.
    - **Éxito**: Guardar datos en IndexedDB y retornarlos a la UI.
    - **Fallo/Timeout**: Capturar el error y retornar los datos almacenados en IndexedDB.
    - **Indicador**: La UI recibe una bandera `isCached` o similar para informar al usuario si los datos no son en tiempo real.

### 3. Autenticación y Estado
- El estado de autenticación se gestiona con `Supabase Auth`.
- El carrito de compras (`CartContext`) persiste en `LocalStorage` para sobrevivir a recargas de página.
- La sesión de usuario se valida al inicio; si no hay red, se asume el estado de la última sesión válida o se permite navegación limitada.

## Estructura de Directorios Clave

- `/src/services`: Lógica de negocio y llamadas a API (Supabase + IndexedDB).
- `/src/context`: Estados globales (Auth, Cart, Theme).
- `/src/components`: Componentes UI reutilizables.
- `/src/pages`: Vistas principales (rutas).
- `/src/types`: Definiciones de tipos TypeScript compartidos.
