import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useDatabase } from '../context/DatabaseContext';
import { CATEGORIES } from '../constants/ui';
import type { Category } from '../types';

interface CategoryChipsProps {
  showTitle?: boolean;
}

const CategoryChips: React.FC<CategoryChipsProps> = ({ showTitle = true }) => {
  const { queries } = useDatabase();
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchParams] = useSearchParams();
  const currentCategory = searchParams.get('category');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const fetchedCategories = await queries.getCategories();
        if (fetchedCategories.length > 0) {
          setCategories(fetchedCategories);
        } else {
           // Fallback to hardcoded categories if DB is empty
           setCategories(CATEGORIES);
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
        setCategories(CATEGORIES);
      }
    };
    fetchCategories();
  }, [queries]);

  return (
    <>
      {showTitle && (
        <h3 className="text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">
          Comprar por Categoría
        </h3>
      )}
      <div className="flex gap-3 px-4 py-2 overflow-x-auto [-ms-scrollbar-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Link 
          to="/products"
          className={`flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-full pl-3 pr-4 cursor-pointer ${
            !currentCategory 
              ? 'bg-primary text-white' 
              : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100'
          }`}
        >
          <span className={`material-symbols-outlined ${currentCategory && 'text-slate-900 dark:text-slate-100'}`}>
            apps
          </span>
          <p className={`text-sm font-medium leading-normal ${currentCategory && 'text-slate-900 dark:text-slate-100'}`}>
            Todos
          </p>
        </Link>
        {categories.map((cat) => (
          <Link 
            key={cat.id}
            to={`/products?category=${encodeURIComponent(cat.name)}`}
            className={`flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-full pl-3 pr-4 cursor-pointer ${
              currentCategory === cat.name 
                ? 'bg-primary text-white' 
                : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100'
            }`}
          >
            <span className={`material-symbols-outlined ${currentCategory !== cat.name && 'text-slate-900 dark:text-slate-100'}`}>
              {cat.icon || 'category'}
            </span>
            <p className={`text-sm font-medium leading-normal ${currentCategory !== cat.name && 'text-slate-900 dark:text-slate-100'}`}>
              {cat.name}
            </p>
          </Link>
        ))}
      </div>
    </>
  );
};

export default CategoryChips;
