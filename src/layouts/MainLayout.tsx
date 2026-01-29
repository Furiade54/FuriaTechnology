import React, { useEffect, useRef } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const MainLayout: React.FC = () => {
  const { totalItems } = useCart();
  const { pathname } = useLocation();
  const mainRef = useRef<HTMLDivElement>(null);

  // Reset scroll position when route changes
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [pathname]);

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col font-sans">
      <main ref={mainRef} className="flex-1 overflow-y-auto pb-16">
        <Outlet />
      </main>
      
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm border-t border-slate-200 dark:border-zinc-800 flex justify-around items-center h-16 px-2 z-50">
        <NavLink 
          to="/" 
          className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full ${isActive ? 'text-primary' : 'text-slate-500 dark:text-slate-400'}`}
        >
          {({ isActive }) => (
            <>
              <span className="material-symbols-outlined text-2xl" style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>home</span>
              <span className={`text-[10px] mt-1 ${isActive ? 'font-semibold' : 'font-medium'}`}>Inicio</span>
            </>
          )}
        </NavLink>
        
        <NavLink 
          to="/categories" 
          className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full ${isActive ? 'text-primary' : 'text-slate-500 dark:text-slate-400'}`}
        >
          {({ isActive }) => (
            <>
              <span className="material-symbols-outlined text-2xl" style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>grid_view</span>
              <span className={`text-[10px] mt-1 ${isActive ? 'font-semibold' : 'font-medium'}`}>Categorías</span>
            </>
          )}
        </NavLink>
        
        <NavLink 
          to="/products" 
          className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full ${isActive ? 'text-primary' : 'text-slate-500 dark:text-slate-400'}`}
        >
          {({ isActive }) => (
            <>
              <span className="material-symbols-outlined text-2xl" style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>storefront</span>
              <span className={`text-[10px] mt-1 ${isActive ? 'font-semibold' : 'font-medium'}`}>Productos</span>
            </>
          )}
        </NavLink>
        
        <NavLink 
          to="/cart" 
          className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full relative ${isActive ? 'text-primary' : 'text-slate-500 dark:text-slate-400'}`}
        >
          {({ isActive }) => (
            <>
              <span className="material-symbols-outlined text-2xl" style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>shopping_cart</span>
              {totalItems > 0 && (
                <span className="absolute top-2 right-4 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center border-2 border-white dark:border-zinc-900">
                  {totalItems}
                </span>
              )}
              <span className={`text-[10px] mt-1 ${isActive ? 'font-semibold' : 'font-medium'}`}>Carrito</span>
            </>
          )}
        </NavLink>
        
        <NavLink 
          to="/profile" 
          className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full ${isActive ? 'text-primary' : 'text-slate-500 dark:text-slate-400'}`}
        >
          {({ isActive }) => (
            <>
              <span className="material-symbols-outlined text-2xl" style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>person</span>
              <span className={`text-[10px] mt-1 ${isActive ? 'font-semibold' : 'font-medium'}`}>Perfil</span>
            </>
          )}
        </NavLink>
      </nav>
    </div>
  );
};

export default MainLayout;
