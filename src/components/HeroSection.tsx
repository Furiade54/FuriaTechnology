import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDatabase } from '../context/DatabaseContext';
import { BANNERS } from '../constants/ui';
import type { Banner } from '../types';

const HeroSection: React.FC = () => {
  const { queries, isReady } = useDatabase();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  useEffect(() => {
    if (isReady) {
      const fetchBanners = async () => {
        try {
          const fetchedBanners = await queries.getBanners();
          if (fetchedBanners.length > 0) {
            setBanners(fetchedBanners);
          } else {
            // Fallback to hardcoded banners if DB is empty (seed data removed)
            setBanners(BANNERS);
          }
        } catch (error) {
          console.error("Failed to fetch banners:", error);
          // Fallback on error too
          setBanners(BANNERS);
        } finally {
          setLoading(false);
        }
      };
      fetchBanners();
    }
  }, [isReady, queries]);

  const totalSlides = banners.length;

  useEffect(() => {
    if (totalSlides <= 1) return;
    const interval = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % totalSlides);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [totalSlides, activeIndex]); // Reset timer on slide change (including manual swipe)

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      // Next slide
      setActiveIndex((prev) => (prev + 1) % totalSlides);
    }
    if (isRightSwipe) {
      // Previous slide
      setActiveIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
    }
  };

  if (loading) {
    return (
      <div className="px-4">
        <div className="relative overflow-hidden rounded-3xl h-44 bg-slate-200 dark:bg-slate-800 animate-pulse"></div>
      </div>
    );
  }

  if (banners.length === 0) return null;

  return (
    <div 
      className="relative px-4"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div className="relative overflow-hidden rounded-3xl h-44">
        {banners.map((banner, index) => (
          <Link
            key={banner.id}
            to={banner.link}
            className={`absolute inset-0 transition-opacity duration-500 ${
              activeIndex === index ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            {banner.style === 'split' ? (
               <div className="flex h-full flex-col gap-3 bg-primary/20 dark:bg-primary/30 p-4 relative h-full">
                  <div className="flex flex-col gap-2 z-10 pr-20">
                    <p className="text-slate-900 dark:text-white text-xl font-bold leading-tight">{banner.title}</p>
                    <p className="text-slate-600 dark:text-slate-300 text-xs font-normal leading-snug">{banner.description}</p>
                    <span className="mt-3 w-fit bg-primary text-white font-semibold py-2 px-5 rounded-full text-xs cursor-pointer hover:bg-primary/90 transition-colors">Shop Now</span>
                  </div>
                  <div
                    className="w-40 h-40 bg-center bg-no-repeat bg-contain absolute right-0 bottom-0 z-0"
                    style={{ backgroundImage: `url("${banner.imageUrl}")` }}
                  ></div>
               </div>
            ) : (
               <div className="flex h-full flex-col gap-3 bg-slate-200 dark:bg-slate-800 p-4 relative overflow-hidden group h-full">
                  <div
                    className="w-full h-full bg-center bg-no-repeat bg-cover rounded-xl flex flex-col transition-transform duration-700 group-hover:scale-105 absolute inset-0"
                    style={{ backgroundImage: `url("${banner.imageUrl}")` }}
                  ></div>
                  <div className="absolute bottom-4 left-4 bg-black/50 p-2 rounded-lg backdrop-blur-sm z-10">
                    <p className="text-white text-lg font-bold leading-normal">{banner.title}</p>
                    <p className="text-slate-200 text-sm font-normal leading-normal">{banner.description}</p>
                  </div>
               </div>
            )}
          </Link>
        ))}
      </div>

      <div className="mt-3 flex justify-center gap-2">
        {Array.from({ length: totalSlides }).map((_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => setActiveIndex(index)}
            className={`h-1.5 rounded-full transition-all ${
              activeIndex === index ? 'w-6 bg-primary' : 'w-2 bg-slate-300 dark:bg-slate-700'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroSection;
