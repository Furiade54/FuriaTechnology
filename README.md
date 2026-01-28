# TechStore PWA

A modern mobile-first Progressive Web App for selling technology products, built with React, TypeScript, and Tailwind CSS.

## Features

- **Mobile-First Design**: Optimized for mobile devices with a bottom navigation bar.
- **PWA Support**: Installable as a native-like app with offline capabilities.
- **Product Catalog**: Browse categories and products with detailed specifications.
- **Shopping Cart**: Manage items and view totals.
- **Mock Data**: Pre-populated with sample products and categories.

## Tech Stack

- React 19
- TypeScript
- Tailwind CSS v4
- Vite
- React Router DOM
- Vite PWA Plugin
- Lucide React (Icons)

## Getting Started

1.  **Install dependencies**:
    ```bash
    npm install
    ```

2.  **Run development server**:
    ```bash
    npm run dev
    ```

3.  **Build for production**:
    ```bash
    npm run build
    ```

4.  **Preview production build**:
    ```bash
    npm run preview
    ```

## Project Structure

- `src/components`: Reusable UI components.
- `src/context`: Global state management (CartContext).
- `src/data`: Mock data for products and categories.
- `src/layouts`: Layout components (MainLayout).
- `src/pages`: Application views (Home, Categories, Products, etc.).
- `src/types`: TypeScript definitions.

## Future Improvements

- Integrate MongoDB for real data persistence.
- Add user authentication.
- Implement checkout process.
