import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useDatabase } from '../context/DatabaseContext';
import ProductCard from '../components/ProductCard';
import CategoryChips from '../components/CategoryChips';
import BrandChips from '../components/BrandChips';
import type { Product } from '../types';

const ProductListPage: React.FC = () => {
  const { queries } = useDatabase();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchParams] = useSearchParams();
  const categoryFilter = searchParams.get('category');
  const brandFilter = searchParams.get('brand');
  const initialSearchQuery = searchParams.get('search') || '';
  const navigate = useNavigate();
  const [isFilterOpen, setIsFilterOpen] = React.useState(false);
  const [sortBy, setSortBy] = React.useState<'default' | 'price-asc' | 'price-desc'>('default');
  const [isSearchVisible, setIsSearchVisible] = React.useState(!!initialSearchQuery);
  const [searchQuery, setSearchQuery] = React.useState(initialSearchQuery);
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
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

  const productsInCategory = React.useMemo(() => {
    return categoryFilter
      ? products.filter(p => p.category === categoryFilter)
      : products;
  }, [categoryFilter, products]);

  const availableBrands = React.useMemo(() => {
    const brands = new Set<string>();
    productsInCategory.forEach(p => {
      if (p.brand) brands.add(p.brand);
    });
    return Array.from(brands).sort();
  }, [productsInCategory]);

  const filteredProducts = React.useMemo(() => {
    let result = [...productsInCategory];

    if (brandFilter) {
      result = result.filter(p => p.brand === brandFilter);
    }

    if (minPrice) {
      result = result.filter(p => p.price >= Number(minPrice));
    }
    if (maxPrice) {
      result = result.filter(p => p.price <= Number(maxPrice));
    }

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
  }, [categoryFilter, brandFilter, sortBy, products, searchQuery, minPrice, maxPrice]);

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
              <div className="absolute top-12 right-0 w-64 bg-white dark:bg-zinc-800 rounded-lg shadow-xl border border-slate-100 dark:border-zinc-700 overflow-hidden z-20">
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

                  <div className="border-t border-slate-100 dark:border-zinc-700 my-2"></div>
                  <div className="flex justify-between items-center px-3 py-2">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Precio</p>
                    {(minPrice || maxPrice) && (
                      <button 
                        onClick={() => { setMinPrice(''); setMaxPrice(''); }}
                        className="text-xs text-primary hover:text-primary-dark font-medium transition-colors"
                      >
                        Limpiar
                      </button>
                    )}
                  </div>
                  <div className="px-3 pb-2 flex gap-2 items-center">
                    <div className="relative w-full">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">$</span>
                      <input
                        type="number"
                        placeholder="Min"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()}
                        className="w-full pl-5 pr-2 py-1.5 text-sm border rounded-md bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 focus:ring-1 focus:ring-primary outline-none"
                      />
                    </div>
                    <span className="text-slate-400">-</span>
                    <div className="relative w-full">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">$</span>
                      <input
                        type="number"
                        placeholder="Max"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()}
                        className="w-full pl-5 pr-2 py-1.5 text-sm border rounded-md bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 focus:ring-1 focus:ring-primary outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Category Chips for easy filtering */}
        <div className="pb-2">
          <CategoryChips showTitle={false} />
        </div>

        {/* Brand Chips */}
        {availableBrands.length > 0 && (
          <div className="pb-2">
            <BrandChips brands={availableBrands} />
          </div>
        )}
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
