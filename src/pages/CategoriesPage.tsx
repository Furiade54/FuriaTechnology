import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDatabase } from '../context/DatabaseContext';
import { CATEGORIES } from '../constants/ui';
import type { Category, Product } from '../types';

const CategoriesPage: React.FC = () => {
  const { queries } = useDatabase();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [allProducts, allCategories] = await Promise.all([
          queries.getProducts(),
          queries.getCategories()
        ]);
        setProducts(allProducts);
        
        if (allCategories.length > 0) {
          setCategories(allCategories);
        } else {
          // Fallback to hardcoded categories if DB is empty
          setCategories(CATEGORIES);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setCategories(CATEGORIES);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [queries]);

  const getProductCount = (categoryName: string) => {
    return products.filter(p => p.category === categoryName && p.isActive !== false).length;
  };

  const filteredCategories = categories.filter(category => 
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-background min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background min-h-screen">
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-zinc-800">
        <div className="flex items-center p-4">
          <div className={`flex shrink-0 items-center justify-start ${isSearchVisible ? 'w-0 overflow-hidden' : 'size-12'}`}>

          </div>
          
          {isSearchVisible ? (
            <div className="flex-1 px-2 animate-fadeIn">
              <input 
                autoFocus
                type="text"
                placeholder="Buscar categorías..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 px-4 rounded-full bg-slate-100 dark:bg-zinc-800 border-none focus:ring-2 focus:ring-primary text-slate-900 dark:text-white placeholder:text-slate-400 outline-none"
              />
            </div>
          ) : (
            <h1 className="text-lg font-bold flex-1 text-center text-slate-900 dark:text-white animate-fadeIn">Categorías de Productos</h1>
          )}

          <div className="flex w-12 items-center justify-end">
            <button 
              onClick={() => {
                if (isSearchVisible) {
                  setIsSearchVisible(false);
                  setSearchQuery('');
                } else {
                  setIsSearchVisible(true);
                }
              }}
              className="flex items-center justify-center rounded-full h-10 w-10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <span className="material-symbols-outlined">{isSearchVisible ? 'close' : 'search'}</span>
            </button>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 p-4 pb-20">
        {filteredCategories.length > 0 ? (
          filteredCategories.map((category) => (
            <Link 
              key={category.id}
              to={`/products?category=${encodeURIComponent(category.name)}`}
              className="flex flex-col gap-3 rounded-xl bg-white dark:bg-zinc-800 p-4 items-center justify-center text-center aspect-square shadow-sm border border-slate-100 dark:border-zinc-700 transition-transform hover:scale-105"
            >
              <div className="flex items-center justify-center size-12 rounded-full bg-primary/10 dark:bg-primary/20">
                <span className="material-symbols-outlined text-primary text-3xl">
                  {category.icon || 'category'}
                </span>
              </div>
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{category.name}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{getProductCount(category.name)} productos</p>
            </Link>
          ))
        ) : (
          <div className="col-span-2 flex flex-col items-center justify-center py-12 text-slate-400 dark:text-slate-500">
            <span className="material-symbols-outlined text-4xl mb-2">search_off</span>
            <p>No se encontraron categorías</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoriesPage;
