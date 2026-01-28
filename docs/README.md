# Documentación del Proyecto - TechStore PWA

Bienvenido a la documentación oficial de TechStore PWA. Este directorio contiene información detallada sobre la arquitectura, funcionalidades y guías de uso de la aplicación.

## Estructura de la Documentación

- **[Características y Funcionalidades](FEATURES.md)**: Descripción detallada de las capacidades de la aplicación (Offline, Checkout por WhatsApp, etc.).
- **[Guía de Administración](ADMIN_GUIDE.md)**: Manual para el uso del Panel de Administración (Gestión de Productos, Categorías, Banners).
- **[Formato de Importación CSV](CSV_FORMAT.md)**: Especificaciones técnicas para la carga masiva de productos.
- **[Arquitectura Técnica](ARCHITECTURE.md)**: Detalles sobre el stack tecnológico, manejo de estado y estrategias offline.

## Visión General

TechStore es una Progressive Web App (PWA) diseñada con un enfoque "Mobile-First", construida con React, TypeScript y TailwindCSS. Utiliza Supabase como backend para la persistencia de datos y autenticación, e implementa una robusta estrategia "Offline-First" mediante IndexedDB para garantizar la funcionalidad sin conexión a internet.
