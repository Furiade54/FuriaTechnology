# Guía de Administración

Esta guía describe cómo utilizar las funcionalidades del Panel de Administración.

## Acceso
El panel de administración es accesible solo para usuarios con rol de administrador. Se encuentra en la ruta `/admin` o a través del menú de perfil si se tienen los permisos adecuados.

## Funcionalidades

### 1. Gestión de Productos
- **Listado**: Vista tabular de todos los productos con búsqueda y paginación.
- **Crear/Editar**: Formulario para gestionar detalles del producto:
  - Nombre, SKU, Precio (COP).
  - Descripción y Especificaciones (formato JSON).
  - Imágenes (URLs).
  - Categoría y Estado (Activo/Inactivo/Destacado).
- **Carga Masiva (CSV)**: Importación de múltiples productos desde un archivo CSV. Ver [Formato CSV](CSV_FORMAT.md) para más detalles.

### 2. Gestión de Categorías
- **Listado**: Visualización de categorías activas.
- **Crear/Editar**: Gestión de nombre e icono de la categoría.
  - *Nota*: Las categorías se representan mediante iconos (Material Symbols). El campo de imagen ha sido deprecado en la interfaz de usuario.
- **Eliminar**: Borrado lógico o físico de categorías.

### 3. Gestión de Banners
- **Control Dinámico**: Los banners de la página de inicio (Hero Section) son totalmente administrables.
- **Tipos de Banner**:
  - `split`: Diseño dividido (texto a un lado, imagen al otro).
  - `cover`: Imagen de fondo completo con texto superpuesto.
- **Ordenamiento**: Campo `display_order` para controlar la secuencia de aparición.

### 4. Seguridad
- **Roles**: La protección de rutas asegura que solo usuarios autorizados puedan realizar cambios.
- **Validaciones**: El sistema valida la integridad de los datos antes de guardarlos (ej. unicidad de SKU).
