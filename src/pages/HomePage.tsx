import React from 'react';
import Header from '../components/Header';
import SearchBar from '../components/SearchBar';
import HeroSection from '../components/HeroSection';
import CategoryChips from '../components/CategoryChips';
import ProductCard from '../components/ProductCard';
import PromoBanner from '../components/PromoBanner';
import { useDatabase } from '../context/DatabaseContext';
import type { Product } from '../types';

const HomePage: React.FC = () => {
  const { queries } = useDatabase();
  const [featuredProducts, setFeaturedProducts] = React.useState<Product[]>([]);

  React.useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        const allProducts = await queries.getProducts();
        setFeaturedProducts(allProducts.filter(p => p.isFeatured && p.isActive !== false));
      } catch (error) {
        console.error("Failed to fetch featured products", error);
      }
    };
    fetchFeaturedProducts();
  }, [queries]);

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col group/design-root overflow-x-hidden bg-background-light dark:bg-background-dark font-display pb-20">
      <Header />
      <SearchBar />
      <HeroSection />
      
      <CategoryChips />
      
      <h3 className="text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-6">Today's Top Deals</h3>
      <div className="grid grid-cols-2 gap-4 p-4">
        {featuredProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      
      <PromoBanner />
      
      <div className="h-24 bg-background-light dark:bg-background-dark"></div>
    </div>
  );
};

export default HomePage;
