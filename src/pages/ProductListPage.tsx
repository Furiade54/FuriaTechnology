import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useDatabase } from '../context/DatabaseContext';
import ProductCard from '../components/ProductCard';
import CategoryChips from '../components/CategoryChips';
import type { Product } from '../types';

const ProductListPage: React.FC = () => {
  const { queries } = useDatabase();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchParams] = useSearchParams();
  const categoryFilter = searchParams.get('category');
  const initialSearchQuery = searchParams.get('search') || '';
  const navigate = useNavigate();
  const [isFilterOpen, setIsFilterOpen] = React.useState(false);
  const [sortBy, setSortBy] = React.useState<'default' | 'price-asc' | 'price-desc'>('default');
  const [isSearchVisible, setIsSearchVisible] = React.useState(!!initialSearchQuery);
  const [searchQuery, setSearchQuery] = React.useState(initialSearchQuery);
  const filterMenuRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    }

    if (isFilterOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isFilterOpen]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const allProducts = await queries.getProducts();
        setProducts(allProducts.filter(p => p.isActive !== false));
      } catch (error) {
        console.error("Failed to fetch products", error);
      }
    };
    fetchProducts();
  }, [queries]);

  const filteredProducts = React.useMemo(() => {
    let result = categoryFilter
      ? products.filter(p => p.category === categoryFilter)
      : [...products];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.description?.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
      );
    }

    if (sortBy === 'price-asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => b.price - a.price);
    }
    
    return result;
  }, [categoryFilter, sortBy, products, searchQuery]);

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark font-sans pb-24">
      <div className="sticky top-0 z-10 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-sm border-b border-slate-200 dark:border-zinc-800">
        <div className="flex items-center p-4">
          <div className={`flex shrink-0 items-center justify-start ${isSearchVisible ? 'w-0 overflow-hidden' : 'size-12'}`}>
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center justify-center rounded-full h-10 w-10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <span className="material-symbols-outlined">arrow_back_ios_new</span>
            </button>
          </div>
          
          {isSearchVisible ? (
            <div className="flex-1 px-2 animate-fadeIn">
              <input 
                autoFocus
                type="text"
                placeholder="Buscar productos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 px-4 rounded-full bg-slate-100 dark:bg-zinc-800 border-none focus:ring-2 focus:ring-primary text-slate-900 dark:text-white placeholder:text-slate-400 outline-none"
              />
            </div>
          ) : (
            <h1 className="text-lg font-bold flex-1 text-center text-slate-900 dark:text-white animate-fadeIn">
              {categoryFilter ? categoryFilter : 'Todos los Productos'}
            </h1>
          )}

          <div className="flex shrink-0 items-center justify-end gap-1 relative" ref={filterMenuRef}>
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

            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`flex items-center justify-center rounded-full h-10 w-10 transition-colors ${isFilterOpen ? 'bg-primary/10 text-primary' : 'text-slate-600 dark:text-slate-300'}`}
            >
              <span className="material-symbols-outlined">filter_list</span>
            </button>
            
            {isFilterOpen && (
              <div className="absolute top-12 right-0 w-48 bg-white dark:bg-zinc-800 rounded-lg shadow-xl border border-slate-100 dark:border-zinc-700 overflow-hidden z-20">
                <div className="p-2">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-3 py-2 uppercase tracking-wider">Ordenar Por</p>
                  <button 
                    onClick={() => { setSortBy('default'); setIsFilterOpen(false); }}
                    className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${sortBy === 'default' ? 'bg-primary/10 text-primary font-medium' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-zinc-700'}`}
                  >
                    Destacados
                  </button>
                  <button 
                    onClick={() => { setSortBy('price-asc'); setIsFilterOpen(false); }}
                    className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${sortBy === 'price-asc' ? 'bg-primary/10 text-primary font-medium' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-zinc-700'}`}
                  >
                    Precio: Menor a Mayor
                  </button>
                  <button 
                    onClick={() => { setSortBy('price-desc'); setIsFilterOpen(false); }}
                    className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${sortBy === 'price-desc' ? 'bg-primary/10 text-primary font-medium' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-zinc-700'}`}
                  >
                    Precio: Mayor a Menor
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Category Chips for easy filtering */}
        <div className="pb-2">
          <CategoryChips showTitle={false} />
        </div>
      </div>
      
      <div className="p-4 grid grid-cols-2 gap-4">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))
        ) : (
          <div className="col-span-2 flex flex-col items-center justify-center py-12 text-slate-400 dark:text-slate-500">
            <span className="material-symbols-outlined text-4xl mb-2">search_off</span>
            <p>No se encontraron productos</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductListPage;
