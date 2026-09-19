import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Search, 
  MapPin, 
  IndianRupee, 
  Filter, 
  ShieldCheck, 
  Star, 
  Check, 
  SlidersHorizontal,
  ChevronDown,
  Sparkles,
  ArrowRight,
  Store,
  RotateCcw,
  Tag
} from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { SAMPLE_PRODUCTS, CATEGORIES, Product } from '../data/sampleProducts';
import { useAuth } from '../context/AuthContext';

export default function Marketplace() {
  const { userProfile, role } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState<Product[]>(SAMPLE_PRODUCTS);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>(searchParams.get('category') || 'All');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedSort, setSelectedSort] = useState<'featured' | 'price-low' | 'price-high' | 'rating'>('featured');
  const [onlyAssured, setOnlyAssured] = useState(false);
  const [priceFilter, setPriceFilter] = useState<'all' | 'under1500' | '1500-3500' | '3500-7000' | 'above7000'>('all');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Sync category & search params if URL changes
  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) setActiveCategory(cat);

    const q = searchParams.get('search');
    if (q !== null) setSearchQuery(q);
  }, [searchParams]);

  // Load products: merge Firestore + localStorage (newly added) + SAMPLE_PRODUCTS (52 items)
  useEffect(() => {
    async function loadAllProducts() {
      setLoading(true);
      let firestoreProducts: Product[] = [];
      let localCreatedProducts: Product[] = [];

      // 1. Read from localStorage for instant offline access to newly added products
      try {
        const stored = localStorage.getItem('kirti_artisan_products');
        if (stored) {
          localCreatedProducts = JSON.parse(stored);
        }
      } catch (err) {
        console.warn('Could not read local artisan products:', err);
      }

      // 2. Read from Firestore
      try {
        const q = query(
          collection(db, 'products'),
          where('status', '==', 'published')
        );
        const snapshot = await getDocs(q);
        firestoreProducts = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title || 'Handcrafted Heritage Item',
            category: data.category || 'Textiles',
            craftType: data.craftType || 'Traditional Weaving',
            material: data.material || 'Natural Materials',
            region: data.region || data.artisanLocation || 'India',
            finalPrice: Number(data.finalPrice) || 2400,
            mrp: Number(data.mrp) || Math.round((Number(data.finalPrice) || 2400) * 1.3),
            rating: data.rating || 5.0,
            reviewsCount: data.reviewsCount || 1,
            isBestSeller: data.isBestSeller ?? true,
            isKirtiAssured: true,
            artisanName: data.artisanName || 'Heritage Guild Artisan',
            imageUrl: data.imageUrl || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
            descriptionEnglish: data.descriptionEnglish || 'Handcrafted with traditional heritage techniques.',
            descriptionHindi: data.descriptionHindi || 'पारंपरिक हस्तशिल्प उत्पाद।',
            craftStory: data.craftStory || ''
          } as Product;
        });
      } catch (err) {
        console.warn('Could not fetch from Firestore, using sample and local products:', err);
      }

      // Merge: Local newly created products + Firestore products + 52 Sample Products (avoid duplicates)
      const idSet = new Set<string>();
      const combined: Product[] = [];

      [...localCreatedProducts, ...firestoreProducts, ...SAMPLE_PRODUCTS].forEach(item => {
        if (!idSet.has(item.id)) {
          idSet.add(item.id);
          combined.push(item);
        }
      });

      setProducts(combined);
      setLoading(false);
    }

    loadAllProducts();
  }, []);

  const handleCategoryClick = (category: string) => {
    setActiveCategory(category);
    if (category === 'All') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', category);
    }
    setSearchParams(searchParams);
  };

  const handleResetFilters = () => {
    setActiveCategory('All');
    setSearchQuery('');
    setPriceFilter('all');
    setOnlyAssured(false);
    setSelectedSort('featured');
    setSearchParams({});
  };

  // Filter & Sort
  const filteredProducts = products
    .filter(p => {
      const matchesCat = activeCategory === 'All' || p.category.toLowerCase() === activeCategory.toLowerCase();
      const matchesSearch = 
        !searchQuery ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.craftType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.region.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.material.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.artisanName.toLowerCase().includes(searchQuery.toLowerCase());

      let matchesPrice = true;
      const price = Number(p.finalPrice || 0);
      if (priceFilter === 'under1500') matchesPrice = price < 1500;
      else if (priceFilter === '1500-3500') matchesPrice = price >= 1500 && price <= 3500;
      else if (priceFilter === '3500-7000') matchesPrice = price > 3500 && price <= 7000;
      else if (priceFilter === 'above7000') matchesPrice = price > 7000;

      const matchesAssured = !onlyAssured || p.isKirtiAssured;

      return matchesCat && matchesSearch && matchesPrice && matchesAssured;
    })
    .sort((a, b) => {
      if (selectedSort === 'price-low') return a.finalPrice - b.finalPrice;
      if (selectedSort === 'price-high') return b.finalPrice - a.finalPrice;
      if (selectedSort === 'rating') return (b.rating || 0) - (a.rating || 0);
      return 0; // 'featured' keeps curated order
    });

  return (
    <div className="min-h-screen bg-[#faf8f5] text-stone-900 pb-24 font-sans">
      
      {/* Clean Minimal Hero Header */}
      <section className="bg-white border-b border-stone-200/80 py-6 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#c25e2e] px-2 py-0.5 rounded bg-amber-50 border border-amber-200/60">
                Direct Artisan Linkage
              </span>
              <span className="text-xs text-stone-500">• 100% Fair Price Payout</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-['Playfair_Display'] text-stone-900">
              Indian Heritage Crafts Directory
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 max-w-2xl">
              Discover authentic handmade creations directly from master weavers, sculptors, and potters across Indian craft clusters.
            </p>
          </div>

          {role === 'seller' && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link
                to="/artisan/add"
                className="px-4 py-2 bg-[#c25e2e] hover:bg-[#a94f24] text-white text-xs font-semibold rounded-xl shadow-2xs transition flex items-center gap-1.5"
              >
                <span>+ List Your Craft</span>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Main Layout Container */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 pt-4 sm:pt-6">
        
        {/* Category Pills Strip */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-2 sm:pb-3 scrollbar-hide text-xs touch-scroll">
          {CATEGORIES.map(cat => {
            const isSelected = activeCategory === cat;
            const count = cat === 'All' 
              ? products.length 
              : products.filter(p => p.category === cat).length;

            return (
              <button
                key={cat}
                type="button"
                onClick={() => handleCategoryClick(cat)}
                className={`px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition flex items-center gap-1.5 flex-shrink-0 text-xs ${
                  isSelected 
                    ? 'bg-stone-900 text-white shadow-2xs' 
                    : 'bg-white hover:bg-stone-100 text-stone-700 border border-stone-200'
                }`}
              >
                <span>{cat}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isSelected ? 'bg-stone-800 text-stone-200' : 'bg-stone-100 text-stone-500'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Results Bar & Filters Toggle */}
        <div className="flex items-center justify-between gap-2 sm:gap-3 py-2.5 sm:py-3 border-y border-stone-200/80 my-2 sm:my-3 text-xs">
          <div className="flex items-center gap-1.5 sm:gap-2 text-stone-600">
            <span className="font-bold text-stone-900">{filteredProducts.length} crafts</span>
            <span className="hidden xs:inline">found</span>
            {searchQuery && (
              <span className="bg-amber-50 text-[#c25e2e] px-2 py-0.5 rounded border border-amber-200/60 font-medium truncate max-w-[120px] sm:max-w-none">
                "{searchQuery}"
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Sort Dropdown */}
            <div className="flex items-center gap-1">
              <span className="text-stone-400 hidden sm:inline">Sort:</span>
              <select
                value={selectedSort}
                onChange={(e) => setSelectedSort(e.target.value as any)}
                className="bg-white border border-stone-200 text-stone-800 text-xs px-2 sm:px-2.5 py-1.5 rounded-lg outline-none font-medium cursor-pointer"
              >
                <option value="featured">Featured Heritage</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>

            {/* Mobile Filter Button */}
            <button
              type="button"
              onClick={() => setMobileFilterOpen(true)}
              className="md:hidden flex items-center gap-1 px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-stone-700 font-semibold text-xs shadow-2xs hover:bg-stone-50"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#c25e2e]" />
              <span>Filter</span>
              {(priceFilter !== 'all' || onlyAssured) && (
                <span className="w-2 h-2 rounded-full bg-[#c25e2e]" />
              )}
            </button>
          </div>
        </div>

        {/* 2-Column Grid on Mobile, 3 on Tablet, 4-5 on PC */}
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6 pt-1 sm:pt-2">
          
          {/* Desktop Filter Sidebar (Sticky) */}
          <aside className="hidden md:block col-span-1 space-y-6">
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs space-y-5 sticky top-28">
              
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-[#c25e2e]" />
                  <span>Filters</span>
                </span>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-[11px] text-stone-400 hover:text-stone-700 font-medium flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              </div>

              {/* Price Ranges */}
              <div className="space-y-2 text-xs">
                <p className="font-bold text-stone-800 text-[11px] uppercase tracking-wider">
                  Price Range
                </p>
                <div className="space-y-1.5">
                  {[
                    { id: 'all', label: 'All Prices' },
                    { id: 'under1500', label: 'Under ₹1,500' },
                    { id: '1500-3500', label: '₹1,500 – ₹3,500' },
                    { id: '3500-7000', label: '₹3,500 – ₹7,000' },
                    { id: 'above7000', label: 'Above ₹7,000' },
                  ].map(p => (
                    <label 
                      key={p.id} 
                      className="flex items-center gap-2 text-stone-600 hover:text-stone-900 cursor-pointer py-0.5"
                    >
                      <input 
                        type="radio" 
                        name="priceFilterDesktop" 
                        checked={priceFilter === p.id}
                        onChange={() => setPriceFilter(p.id as any)}
                        className="text-[#c25e2e] focus:ring-[#c25e2e]"
                      />
                      <span>{p.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Assurance Checkbox */}
              <div className="pt-2 border-t border-stone-100">
                <label className="flex items-center gap-2 text-xs text-stone-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={onlyAssured}
                    onChange={(e) => setOnlyAssured(e.target.checked)}
                    className="rounded text-[#c25e2e] focus:ring-[#c25e2e]"
                  />
                  <div className="leading-tight">
                    <span className="font-bold text-stone-900 block">Kirti Assured Only</span>
                    <span className="text-[10px] text-stone-500">Verified master craft lineage</span>
                  </div>
                </label>
              </div>

              {/* Heritage Commitment Note */}
              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/60 text-[11px] text-stone-600 space-y-1">
                <p className="font-bold text-amber-900 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#c25e2e]" />
                  <span>Fair Trade Guarantee</span>
                </p>
                <p className="text-[10px] text-stone-600 leading-tight">
                  100% of the listed price goes directly to the crafting artisan or collective.
                </p>
              </div>

            </div>
          </aside>

          {/* Products Grid: 2 columns on mobile, 2 on sm, 3 on md, 3 on lg, 4 on xl */}
          <div className="col-span-1 md:col-span-3 lg:col-span-4">
            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 sm:p-12 text-center border border-stone-200 space-y-3">
                <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-stone-400">
                  <Search className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-stone-800">No crafts match your criteria</h3>
                <p className="text-xs text-stone-500 max-w-sm mx-auto">
                  Try clearing your search query or resetting filters to browse all 50+ heritage products.
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-stone-800 transition"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-4 md:gap-4.5">
                {filteredProducts.map(product => {
                  const discountPercent = product.mrp && product.mrp > product.finalPrice
                    ? Math.round(((product.mrp - product.finalPrice) / product.mrp) * 100)
                    : null;

                  return (
                    <article
                      key={product.id}
                      className="bg-white rounded-xl sm:rounded-2xl border border-stone-200/90 overflow-hidden hover:border-stone-400/80 transition duration-200 flex flex-col group shadow-2xs hover:shadow-md"
                    >
                      {/* Product Image Frame */}
                      <Link 
                        to={`/product/${product.id}`}
                        className="relative block aspect-square overflow-hidden bg-stone-100"
                      >
                        <img 
                          src={product.imageUrl} 
                          alt={product.title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500" 
                        />

                        {/* Top Badges */}
                        <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
                          <span className="text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-md bg-stone-900/85 text-white backdrop-blur-xs truncate max-w-[120px]">
                            {product.craftType}
                          </span>
                        </div>

                        {discountPercent && (
                          <div className="absolute top-2 right-2">
                            <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-600 text-white">
                              {discountPercent}% OFF
                            </span>
                          </div>
                        )}
                      </Link>

                      {/* Card Body */}
                      <div className="p-2.5 sm:p-3.5 flex-1 flex flex-col justify-between space-y-2 sm:space-y-3">
                        <div className="space-y-1">
                          {/* Region and Artisan Line */}
                          <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-stone-500">
                            <span className="flex items-center gap-1 truncate max-w-[90px] sm:max-w-[120px]">
                              <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#c25e2e] flex-shrink-0" />
                              <span className="truncate">{product.region}</span>
                            </span>
                            <span className="flex items-center gap-0.5 text-amber-700 font-bold">
                              <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-amber-400 text-amber-400 flex-shrink-0" />
                              <span>{product.rating.toFixed(1)}</span>
                            </span>
                          </div>

                          {/* Product Title */}
                          <Link 
                            to={`/product/${product.id}`}
                            className="block font-bold text-xs sm:text-sm text-stone-900 group-hover:text-[#c25e2e] transition line-clamp-2 leading-tight"
                          >
                            {product.title}
                          </Link>

                          {/* Material specification */}
                          <p className="text-[10px] sm:text-[11px] text-stone-500 truncate hidden xs:block">
                            {product.material}
                          </p>
                        </div>

                        {/* Pricing & CTA */}
                        <div className="pt-1.5 sm:pt-2 border-t border-stone-100 flex items-center justify-between gap-1">
                          <div className="truncate">
                            <div className="flex items-baseline gap-1">
                              <span className="text-xs sm:text-sm font-black text-stone-900">
                                ₹{product.finalPrice.toLocaleString('en-IN')}
                              </span>
                              {product.mrp && product.mrp > product.finalPrice && (
                                <span className="text-[9px] sm:text-[10px] text-stone-400 line-through hidden xs:inline">
                                  ₹{product.mrp.toLocaleString('en-IN')}
                                </span>
                              )}
                            </div>
                            <span className="text-[8px] sm:text-[9px] font-semibold text-emerald-700 block truncate">
                              Fair artisan pay
                            </span>
                          </div>

                          <Link
                            to={`/product/${product.id}`}
                            className="px-2 sm:px-2.5 py-1 sm:py-1.5 bg-stone-900 hover:bg-[#c25e2e] text-white rounded-lg text-[10px] sm:text-xs font-semibold transition flex-shrink-0"
                          >
                            View
                          </Link>
                        </div>
                      </div>

                    </article>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Mobile Filter Modal Bottom Sheet */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileFilterOpen(false)}
          />

          {/* Bottom Sheet Card */}
          <div className="relative bg-white rounded-t-3xl p-5 shadow-2xl max-h-[85vh] overflow-y-auto space-y-5 animate-in slide-in-from-bottom duration-300 z-10 safe-pb">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#c25e2e]" />
                <h3 className="font-bold text-sm text-stone-900">Filter Crafts</h3>
                <span className="text-xs text-stone-500">({filteredProducts.length} results)</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="p-1 rounded-full text-stone-400 hover:text-stone-700"
              >
                ✕
              </button>
            </div>

            {/* Price Ranges */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-stone-800 uppercase tracking-wider block">
                Price Range
              </span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'all', label: 'All Prices' },
                  { id: 'under1500', label: 'Under ₹1,500' },
                  { id: '1500-3500', label: '₹1,500 – ₹3,500' },
                  { id: '3500-7000', label: '₹3,500 – ₹7,000' },
                  { id: 'above7000', label: 'Above ₹7,000' },
                ].map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPriceFilter(p.id as any)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold text-left transition border ${
                      priceFilter === p.id 
                        ? 'bg-amber-50 text-[#c25e2e] border-[#c25e2e]' 
                        : 'bg-stone-50 text-stone-700 border-stone-200'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Assurance Toggle */}
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="font-bold text-xs text-stone-900 block">Kirti Assured Only</span>
                  <span className="text-[10px] text-stone-500">Verified master craft cluster origin</span>
                </div>
                <input
                  type="checkbox"
                  checked={onlyAssured}
                  onChange={(e) => setOnlyAssured(e.target.checked)}
                  className="rounded text-[#c25e2e] focus:ring-[#c25e2e] w-4 h-4"
                />
              </label>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleResetFilters}
                className="w-1/3 py-2.5 rounded-xl border border-stone-200 text-xs font-bold text-stone-700 hover:bg-stone-100 transition"
              >
                Reset All
              </button>
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="w-2/3 py-2.5 rounded-xl bg-[#c25e2e] hover:bg-[#a94f24] text-white text-xs font-bold transition shadow-sm"
              >
                Apply Filters ({filteredProducts.length})
              </button>
            </div>

          </div>
        </div>
      )}


    </div>
  );
}
