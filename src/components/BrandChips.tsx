import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';

interface BrandChipsProps {
  brands: string[];
}

const BrandChips: React.FC<BrandChipsProps> = ({ brands }) => {
  const [searchParams] = useSearchParams();
  const currentBrand = searchParams.get('brand');

  const getLink = (brand: string | null) => {
    const newParams = new URLSearchParams(searchParams);
    if (brand) {
      newParams.set('brand', brand);
    } else {
      newParams.delete('brand');
    }
    return `/products?${newParams.toString()}`;
  };

  if (brands.length === 0) return null;

  return (
    <div className="flex gap-2 px-4 pb-2 overflow-x-auto [-ms-scrollbar-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <Link 
        to={getLink(null)}
        className={`flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-full px-4 cursor-pointer border transition-colors ${
          !currentBrand 
            ? 'bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-900 dark:border-slate-100' 
            : 'bg-transparent text-slate-600 dark:text-slate-300 border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800'
        }`}
      >
        <p className="text-xs font-medium leading-normal">
          Todas
        </p>
      </Link>
      {brands.map((brand) => (
        <Link 
          key={brand}
          to={getLink(brand)}
          className={`flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-full px-4 cursor-pointer border transition-colors ${
            currentBrand === brand 
              ? 'bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-900 dark:border-slate-100' 
              : 'bg-transparent text-slate-600 dark:text-slate-300 border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800'
          }`}
        >
          <p className="text-xs font-medium leading-normal">
            {brand}
          </p>
        </Link>
      ))}
    </div>
  );
};

export default BrandChips;
