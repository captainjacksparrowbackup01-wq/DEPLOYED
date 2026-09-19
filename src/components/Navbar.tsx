import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Search, 
  MapPin, 
  ShoppingBag, 
  LogOut, 
  PlusCircle, 
  Store, 
  ArrowLeftRight,
  Menu,
  X,
  Sparkles,
  SlidersHorizontal,
  User as UserIcon,
  Compass,
  LayoutDashboard
} from 'lucide-react';
import { CATEGORIES } from '../data/sampleProducts';

export default function Navbar() {
  const { user, userProfile, role, switchRole, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [navSearch, setNavSearch] = useState('');
  const [searchCategory, setSearchCategory] = useState('All');

  if (!user) return null;

  const isSeller = role === 'seller';
  const pathname = location.pathname;

  const handleToggleRole = () => {
    if (isSeller) {
      switchRole('buyer');
      navigate('/marketplace');
    } else {
      switchRole('seller');
      navigate('/artisan');
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = navSearch.trim();
    setMobileSearchOpen(false);
    if (query) {
      navigate(`/marketplace?search=${encodeURIComponent(query)}`);
    } else {
      navigate('/marketplace');
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 transition">
        
        {/* Top Main Navigation Bar */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Brand Logo & Tag */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <Link 
              to={isSeller ? "/artisan" : "/marketplace"} 
              className="flex items-baseline gap-1 group"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#c25e2e] text-white flex items-center justify-center font-bold text-sm sm:text-base shadow-xs group-hover:scale-105 transition">
                क
              </div>
              <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-stone-900 font-['Playfair_Display'] group-hover:text-[#c25e2e] transition">
                Kirti
              </span>
              <span className="text-[9px] sm:text-[10px] font-bold tracking-widest text-[#c25e2e] uppercase px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200/60 hidden xs:inline-block">
                हस्तशिल्प
              </span>
            </Link>

            {/* Location Tag (Tablet & Desktop) */}
            <div className="hidden lg:flex items-center gap-1 text-xs text-stone-500 pl-2 border-l border-stone-200">
              <MapPin className="w-3.5 h-3.5 text-[#c25e2e] flex-shrink-0" />
              <span className="truncate max-w-[120px] text-stone-700 font-medium">
                {userProfile?.location || 'India'}
              </span>
            </div>
          </div>

          {/* Clean Responsive Search Input (Tablet & Desktop) */}
          <form 
            onSubmit={handleSearchSubmit}
            className="flex-1 max-w-lg hidden md:flex items-center rounded-xl bg-stone-100 hover:bg-stone-150/70 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#c25e2e]/40 border border-stone-200/80 transition"
          >
            <select
              value={searchCategory}
              onChange={(e) => setSearchCategory(e.target.value)}
              className="bg-transparent text-stone-600 text-xs py-2 pl-3 pr-2 outline-none border-r border-stone-200 font-medium cursor-pointer"
            >
              {CATEGORIES.slice(0, 6).map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            
            <input
              type="text"
              placeholder="Search 50+ crafts, Banarasi silk, pottery..."
              value={navSearch}
              onChange={(e) => setNavSearch(e.target.value)}
              className="flex-1 px-3 py-2 text-stone-900 text-xs bg-transparent outline-none placeholder:text-stone-400"
            />

            <button
              type="submit"
              className="p-2 mr-1 text-stone-500 hover:text-[#c25e2e] transition"
              title="Search"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>

          {/* Right Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs">
            
            {/* Mobile Search Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              className="md:hidden p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition"
              title="Search crafts"
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Role Switcher Pill */}
            <button
              type="button"
              onClick={handleToggleRole}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 transition border text-xs ${
                isSeller 
                  ? 'bg-amber-50 text-[#c25e2e] border-amber-200 hover:bg-amber-100' 
                  : 'bg-stone-100 text-stone-700 border-stone-200 hover:bg-stone-200'
              }`}
              title="Switch between Buyer and Artisan mode"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-[#c25e2e]" />
              <span className="hidden sm:inline">
                {isSeller ? 'Artisan Mode' : 'Buyer Mode'}
              </span>
              <span className="sm:hidden text-[11px]">
                {isSeller ? 'Artisan' : 'Buyer'}
              </span>
            </button>

            {/* Quick Context Link (Desktop & Tablet) */}
            {isSeller ? (
              <Link
                to="/artisan/add"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#c25e2e] hover:bg-[#a94f24] text-white font-semibold rounded-xl transition shadow-2xs"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ Add Craft</span>
              </Link>
            ) : (
              <Link
                to="/marketplace"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-stone-700 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition font-medium"
              >
                <ShoppingBag className="w-4 h-4 text-stone-600" />
                <span>Marketplace</span>
              </Link>
            )}

            {/* Profile Button */}
            <Link
              to="/profile"
              className="p-1 sm:px-2.5 sm:py-1.5 rounded-xl text-stone-700 hover:text-stone-900 hover:bg-stone-100 transition flex items-center gap-1.5 text-xs font-medium"
              title="My Profile"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#c25e2e] to-amber-500 text-white flex items-center justify-center font-bold text-[11px] shadow-2xs">
                {userProfile?.displayName ? userProfile.displayName.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="hidden lg:inline truncate max-w-[90px]">
                {userProfile?.displayName || 'Profile'}
              </span>
            </Link>

            {/* Sign Out Button (Tablet & Desktop) */}
            <button
              type="button"
              onClick={logout}
              className="hidden md:flex p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition items-center gap-1 text-xs"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Logout</span>
            </button>
          </div>

        </div>

        {/* Mobile Search Expandable Bar */}
        {mobileSearchOpen && (
          <div className="md:hidden border-t border-stone-200 bg-white px-3 py-2 animate-in fade-in slide-in-from-top-1 duration-200">
            <form onSubmit={handleSearchSubmit} className="flex items-center rounded-xl bg-stone-100 px-3 py-2 border border-stone-200">
              <input
                type="text"
                autoFocus
                placeholder="Search 50+ crafts, silk, pottery..."
                value={navSearch}
                onChange={(e) => setNavSearch(e.target.value)}
                className="flex-1 text-xs bg-transparent outline-none text-stone-800"
              />
              <button type="submit" className="text-stone-500 p-1">
                <Search className="w-4 h-4 text-[#c25e2e]" />
              </button>
              <button 
                type="button" 
                onClick={() => setMobileSearchOpen(false)}
                className="text-stone-400 p-1 ml-1"
              >
                <X className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* Subcategory Strip (Smooth horizontal touch scroll) */}
        <div className="border-t border-stone-100 bg-[#FAF9F5]/90 px-3 sm:px-6 py-1.5 flex items-center gap-2 overflow-x-auto scrollbar-hide text-xs touch-scroll">
          <Link 
            to="/marketplace" 
            className="text-stone-700 hover:text-[#c25e2e] font-semibold whitespace-nowrap px-2.5 py-1 rounded-lg hover:bg-stone-200/50 transition flex-shrink-0"
          >
            All 50+ Crafts
          </Link>
          {['Textiles', 'Pottery', 'Woodcraft', 'Metalcraft', 'Art', 'Leather', 'Jewellery', 'Baskets'].map(cat => (
            <Link
              key={cat}
              to={`/marketplace?category=${encodeURIComponent(cat)}`}
              className="text-stone-500 hover:text-stone-900 whitespace-nowrap px-2.5 py-1 rounded-lg hover:bg-stone-200/50 transition font-normal flex-shrink-0"
            >
              {cat}
            </Link>
          ))}

          {isSeller && (
            <Link 
              to="/artisan" 
              className="ml-auto text-xs font-semibold text-[#c25e2e] hover:underline whitespace-nowrap hidden sm:flex items-center gap-1 flex-shrink-0"
            >
              <Store className="w-3.5 h-3.5" />
              <span>My Studio Dashboard</span>
            </Link>
          )}
        </div>

      </header>

      {/* Mobile Bottom Navigation Bar (Dock) */}
      <nav 
        aria-label="Mobile Bottom Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-stone-200/90 shadow-lg px-2 py-1.5 safe-pb md:hidden transition-all duration-200"
      >
        <div className="grid grid-cols-4 items-center justify-items-center max-w-md mx-auto text-[11px]">
          
          {isSeller ? (
            <>
              {/* Artisan Tab 1: Studio Dashboard */}
              <Link
                to="/artisan"
                className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition ${
                  pathname === '/artisan' 
                    ? 'text-[#c25e2e] font-bold' 
                    : 'text-stone-500 hover:text-stone-900 font-medium'
                }`}
              >
                <LayoutDashboard className={`w-5 h-5 mb-0.5 ${pathname === '/artisan' ? 'stroke-[2.5]' : ''}`} />
                <span>Studio</span>
              </Link>

              {/* Artisan Tab 2: Add Craft (Elevated CTA) */}
              <Link
                to="/artisan/add"
                className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition ${
                  pathname === '/artisan/add' 
                    ? 'text-[#c25e2e] font-bold' 
                    : 'text-stone-700 hover:text-[#c25e2e] font-semibold'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-[#c25e2e] text-white flex items-center justify-center shadow-sm -mt-2 mb-0.5 hover:scale-105 transition">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <span>Add Craft</span>
              </Link>

              {/* Artisan Tab 3: Marketplace View */}
              <Link
                to="/marketplace"
                className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition ${
                  pathname === '/marketplace' || pathname.startsWith('/product/') 
                    ? 'text-[#c25e2e] font-bold' 
                    : 'text-stone-500 hover:text-stone-900 font-medium'
                }`}
              >
                <Compass className={`w-5 h-5 mb-0.5 ${pathname === '/marketplace' ? 'stroke-[2.5]' : ''}`} />
                <span>Market</span>
              </Link>

              {/* Artisan Tab 4: Profile */}
              <Link
                to="/profile"
                className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition ${
                  pathname === '/profile' 
                    ? 'text-[#c25e2e] font-bold' 
                    : 'text-stone-500 hover:text-stone-900 font-medium'
                }`}
              >
                <UserIcon className={`w-5 h-5 mb-0.5 ${pathname === '/profile' ? 'stroke-[2.5]' : ''}`} />
                <span>Profile</span>
              </Link>
            </>
          ) : (
            <>
              {/* Buyer Tab 1: Marketplace Explore */}
              <Link
                to="/marketplace"
                className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition ${
                  pathname === '/marketplace' || pathname.startsWith('/product/') 
                    ? 'text-[#c25e2e] font-bold' 
                    : 'text-stone-500 hover:text-stone-900 font-medium'
                }`}
              >
                <ShoppingBag className={`w-5 h-5 mb-0.5 ${pathname === '/marketplace' ? 'stroke-[2.5]' : ''}`} />
                <span>Explore</span>
              </Link>

              {/* Buyer Tab 2: Search Categories */}
              <button
                type="button"
                onClick={() => {
                  setMobileSearchOpen(true);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="flex flex-col items-center justify-center py-1 px-2 rounded-xl text-stone-500 hover:text-stone-900 font-medium transition"
              >
                <Search className="w-5 h-5 mb-0.5" />
                <span>Search</span>
              </button>

              {/* Buyer Tab 3: Switch to Artisan Studio */}
              <button
                type="button"
                onClick={handleToggleRole}
                className="flex flex-col items-center justify-center py-1 px-2 rounded-xl text-stone-600 hover:text-[#c25e2e] font-medium transition"
              >
                <div className="w-7 h-7 rounded-full bg-amber-100 text-[#c25e2e] flex items-center justify-center mb-0.5">
                  <ArrowLeftRight className="w-4 h-4" />
                </div>
                <span className="text-[10px]">Artisan</span>
              </button>

              {/* Buyer Tab 4: Profile */}
              <Link
                to="/profile"
                className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition ${
                  pathname === '/profile' 
                    ? 'text-[#c25e2e] font-bold' 
                    : 'text-stone-500 hover:text-stone-900 font-medium'
                }`}
              >
                <UserIcon className={`w-5 h-5 mb-0.5 ${pathname === '/profile' ? 'stroke-[2.5]' : ''}`} />
                <span>Profile</span>
              </Link>
            </>
          )}

        </div>
      </nav>
    </>
  );
}

