import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { 
  ChevronLeft, 
  MapPin, 
  IndianRupee, 
  ShieldCheck, 
  Loader2,
  CheckCircle2,
  Star,
  Truck,
  RotateCcw,
  Sparkles,
  Share2,
  Send,
  Store,
  Layers
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SAMPLE_PRODUCTS, Product } from '../data/sampleProducts';

export default function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'english' | 'hindi'>('english');
  
  // Enquiry form state
  const [buyerName, setBuyerName] = useState(userProfile?.displayName || '');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerEmail, setBuyerEmail] = useState(user?.email || '');
  const [quantity, setQuantity] = useState('1');
  const [customNotes, setCustomNotes] = useState('');
  const [isSubmittingEnquiry, setIsSubmittingEnquiry] = useState(false);
  const [enquirySuccess, setEnquirySuccess] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      if (!id) return;
      setLoading(true);

      // 1. Check in SAMPLE_PRODUCTS
      const foundInSample = SAMPLE_PRODUCTS.find(p => p.id === id);
      if (foundInSample) {
        setProduct(foundInSample);
        setLoading(false);
        return;
      }

      // 2. Check in localStorage (for newly published products)
      try {
        const localItems = JSON.parse(localStorage.getItem('kirti_artisan_products') || '[]');
        const foundInLocal = localItems.find((p: any) => p.id === id);
        if (foundInLocal) {
          setProduct(foundInLocal);
          setLoading(false);
          return;
        }
      } catch (e) {
        console.warn('Local storage parse error:', e);
      }

      // 3. Check in Firestore
      try {
        const docRef = doc(db, 'products', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProduct({
            id: docSnap.id,
            title: data.title || 'Handcrafted Heritage Item',
            category: data.category || 'Textiles',
            craftType: data.craftType || 'Traditional Weaving',
            material: data.material || 'Natural Materials',
            region: data.region || data.artisanLocation || 'India',
            finalPrice: Number(data.finalPrice) || 2500,
            mrp: Number(data.mrp) || Math.round((Number(data.finalPrice) || 2500) * 1.3),
            rating: data.rating || 5.0,
            reviewsCount: data.reviewsCount || 1,
            isBestSeller: data.isBestSeller ?? true,
            isKirtiAssured: true,
            artisanName: data.artisanName || 'Heritage Guild Artisan',
            imageUrl: data.imageUrl || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
            descriptionEnglish: data.descriptionEnglish || 'Handcrafted with traditional heritage techniques.',
            descriptionHindi: data.descriptionHindi || 'पारंपरिक हस्तशिल्प उत्पाद।',
            craftStory: data.craftStory || ''
          } as Product);
        }
      } catch (err) {
        console.warn('Firestore fetch failed, product not found:', err);
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [id, user, userProfile]);

  const handleSubmitEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    setIsSubmittingEnquiry(true);

    const enquiryData = {
      productId: product.id,
      productTitle: product.title,
      productPrice: product.finalPrice,
      artisanId: product.artisanId || '',
      artisanName: product.artisanName,
      buyerId: user?.uid || '',
      buyerName: buyerName.trim() || userProfile?.displayName || 'Conscious Buyer',
      buyerPhone: buyerPhone.trim() || userProfile?.phone || '',
      buyerEmail: buyerEmail.trim() || user?.email || '',
      quantity: Number(quantity) || 1,
      customNotes: customNotes.trim(),
      totalEstimatedCost: (product.finalPrice * (Number(quantity) || 1)),
      status: 'pending',
      createdAt: serverTimestamp()
    };

    try {
      const docRef = await addDoc(collection(db, 'enquiries'), enquiryData);
      
      // Also write directly into the artisan's individual profile database in Firebase
      if (product.artisanId) {
        try {
          await addDoc(collection(db, 'users', product.artisanId, 'enquiries'), enquiryData);
        } catch (subErr) {
          console.warn('Could not mirror to artisan enquiries subcollection:', subErr);
        }
      }

      // Also write into the buyer's individual profile database
      if (user?.uid) {
        try {
          await addDoc(collection(db, 'users', user.uid, 'enquiries'), enquiryData);
        } catch (subErr) {
          console.warn('Could not mirror to buyer enquiries subcollection:', subErr);
        }
      }
    } catch (err) {
      console.warn('Firestore enquiry write fallback to local storage:', err);
    }

    // Mirror to localStorage
    try {
      const localEnquiries = JSON.parse(localStorage.getItem('kirti_enquiries') || '[]');
      localEnquiries.unshift({ id: `enq-${Date.now()}`, ...enquiryData });
      localStorage.setItem('kirti_enquiries', JSON.stringify(localEnquiries));
    } catch (storageErr) {
      console.warn('Could not save enquiry to localStorage:', storageErr);
    }

    setIsSubmittingEnquiry(false);
    setEnquirySuccess(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3 text-stone-500 text-xs">
          <Loader2 className="w-6 h-6 animate-spin text-[#c25e2e]" />
          <span>Retrieving craft details...</span>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-bold font-['Playfair_Display'] text-stone-900">Craft Not Found</h2>
        <p className="text-xs text-stone-500 mt-1 max-w-sm">
          The requested handicraft listing could not be found or has been removed.
        </p>
        <Link 
          to="/marketplace" 
          className="mt-4 px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-stone-800 transition"
        >
          Return to Marketplace
        </Link>
      </div>
    );
  }

  // Related crafts from the same category
  const relatedCrafts = SAMPLE_PRODUCTS
    .filter(p => p.id !== product.id && p.category === product.category)
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-[#faf8f5] text-stone-900 pb-24 font-sans">
      
      {/* Navigation Breadcrumb */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between text-xs">
          <Link 
            to="/marketplace"
            className="flex items-center gap-1 text-stone-500 hover:text-stone-900 font-medium transition"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to All Crafts</span>
          </Link>

          <span className="text-stone-400">
            {product.category} &gt; <span className="text-stone-700 font-medium">{product.craftType}</span>
          </span>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        
        {/* Main 2-Column Product Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left: Product Image & Trust Badges (Sticky on PC) */}
          <div className="lg:col-span-6 space-y-4 lg:sticky lg:top-24 self-start">
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200 overflow-hidden shadow-2xs">
              <img 
                src={product.imageUrl} 
                alt={product.title}
                className="w-full aspect-square object-cover" 
              />
            </div>

            {/* Fair trade trust badges */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center">
              <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-stone-200 space-y-0.5 shadow-2xs">
                <ShieldCheck className="w-4 h-4 text-[#c25e2e] mx-auto" />
                <p className="text-[10px] sm:text-[11px] font-bold text-stone-800">100% Authentic</p>
                <p className="text-[9px] sm:text-[10px] text-stone-400">Certified guild</p>
              </div>

              <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-stone-200 space-y-0.5 shadow-2xs">
                <Truck className="w-4 h-4 text-[#c25e2e] mx-auto" />
                <p className="text-[10px] sm:text-[11px] font-bold text-stone-800">Direct Dispatch</p>
                <p className="text-[9px] sm:text-[10px] text-stone-400">Workshop shipped</p>
              </div>

              <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-stone-200 space-y-0.5 shadow-2xs">
                <IndianRupee className="w-4 h-4 text-[#c25e2e] mx-auto" />
                <p className="text-[10px] sm:text-[11px] font-bold text-stone-800">Fair Payout</p>
                <p className="text-[9px] sm:text-[10px] text-stone-400">Zero middleman cut</p>
              </div>
            </div>
          </div>

          {/* Right: Product Specifications & Order Box */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Title & Origin Header */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-stone-900 text-white uppercase tracking-wider">
                  {product.craftType}
                </span>
                <span className="text-xs text-stone-500 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#c25e2e]" />
                  <span>{product.region}</span>
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold font-['Playfair_Display'] text-stone-900 leading-tight">
                {product.title}
              </h1>

              <div className="flex items-center gap-3 text-xs text-stone-600">
                <span className="font-semibold text-stone-800">
                  By {product.artisanName}
                </span>
                <span>•</span>
                <div className="flex items-center gap-1 text-amber-700 font-semibold">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{product.rating.toFixed(1)}</span>
                  <span className="text-stone-400 font-normal">({product.reviewsCount} verified reviews)</span>
                </div>
              </div>
            </div>

            {/* Price Box */}
            <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-2xs space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-stone-900">
                  ₹{product.finalPrice.toLocaleString('en-IN')}
                </span>
                {product.mrp && product.mrp > product.finalPrice && (
                  <span className="text-sm text-stone-400 line-through">
                    ₹{product.mrp.toLocaleString('en-IN')}
                  </span>
                )}
                {product.mrp && product.mrp > product.finalPrice && (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    Save ₹{(product.mrp - product.finalPrice).toLocaleString('en-IN')}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-stone-500">
                Inclusive of direct artisan remuneration, packaging, and standard national transit.
              </p>
            </div>

            {/* Specifications Table */}
            <div className="bg-white rounded-2xl border border-stone-200 p-4 space-y-2 text-xs">
              <div className="grid grid-cols-2 py-1.5 border-b border-stone-100">
                <span className="text-stone-400">Craft Technique</span>
                <span className="text-stone-800 font-medium">{product.craftType}</span>
              </div>
              <div className="grid grid-cols-2 py-1.5 border-b border-stone-100">
                <span className="text-stone-400">Primary Material</span>
                <span className="text-stone-800 font-medium">{product.material}</span>
              </div>
              <div className="grid grid-cols-2 py-1.5 border-b border-stone-100">
                <span className="text-stone-400">Craft Cluster</span>
                <span className="text-stone-800 font-medium">{product.region}</span>
              </div>
              <div className="grid grid-cols-2 py-1.5">
                <span className="text-stone-400">Artisan Guild</span>
                <span className="text-stone-800 font-medium">{product.artisanName}</span>
              </div>
            </div>

            {/* Dual Language Heritage Story */}
            <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                <span className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                  Heritage Craft Story
                </span>
                <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded-lg text-xs">
                  <button
                    type="button"
                    onClick={() => setActiveTab('english')}
                    className={`px-2 py-0.5 rounded font-medium transition ${
                      activeTab === 'english' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500'
                    }`}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('hindi')}
                    className={`px-2 py-0.5 rounded font-medium transition ${
                      activeTab === 'hindi' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500'
                    }`}
                  >
                    हिंदी
                  </button>
                </div>
              </div>

              {activeTab === 'english' ? (
                <div className="text-xs text-stone-600 leading-relaxed space-y-2">
                  <p>{product.descriptionEnglish}</p>
                  {product.craftStory && (
                    <p className="text-stone-500 italic pt-1 border-t border-stone-100">
                      "{product.craftStory}"
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-xs text-stone-700 leading-relaxed space-y-2 font-hindi">
                  <p>{product.descriptionHindi || 'पारंपरिक हस्तशिल्प उत्पाद।'}</p>
                </div>
              )}
            </div>

            {/* Direct Order / Enquiry Box */}
            <div id="enquiry-box" className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-5 shadow-2xs space-y-4 scroll-mt-24">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-stone-900">
                    Direct Artisan Order / Enquiry
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Connect directly for individual purchases or bulk wholesale pricing.
                  </p>
                </div>
                <span className="p-2 rounded-xl bg-amber-50 text-[#c25e2e]">
                  <Send className="w-4 h-4" />
                </span>
              </div>

              {/* Direct WhatsApp Option */}
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Namaste ${product.artisanName}, I am interested in ordering "${product.title}" (₹${product.finalPrice}) listed on Kirti.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs"
              >
                <span>💬 Quick WhatsApp Enquiry to Artisan</span>
              </a>

              <div className="flex items-center gap-2 text-[10px] text-stone-400 uppercase font-bold text-center">
                <span className="flex-1 border-t border-stone-200" />
                <span>Or send formal portal message</span>
                <span className="flex-1 border-t border-stone-200" />
              </div>

              {enquirySuccess ? (
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-center space-y-1.5">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                  <p className="text-xs font-bold text-emerald-900">
                    Enquiry Sent to {product.artisanName}!
                  </p>
                  <p className="text-[11px] text-emerald-800">
                    The artisan collective has received your request. They will confirm availability and dispatch terms directly.
                  </p>
                  <button
                    type="button"
                    onClick={() => setEnquirySuccess(false)}
                    className="mt-2 text-xs font-semibold text-emerald-700 hover:underline"
                  >
                    Send another enquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitEnquiry} className="space-y-3 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-stone-400 uppercase font-semibold block mb-0.5">
                        Your Full Name
                      </label>
                      <input 
                        type="text"
                        required
                        value={buyerName}
                        onChange={(e) => setBuyerName(e.target.value)}
                        placeholder="e.g. Ananya Sharma"
                        className="w-full px-3 py-2 border border-stone-200 rounded-lg outline-none focus:border-[#c25e2e]"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-stone-400 uppercase font-semibold block mb-0.5">
                        Phone / WhatsApp
                      </label>
                      <input 
                        type="tel"
                        required
                        value={buyerPhone}
                        onChange={(e) => setBuyerPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full px-3 py-2 border border-stone-200 rounded-lg outline-none focus:border-[#c25e2e]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="text-[10px] text-stone-400 uppercase font-semibold block mb-0.5">
                        Email Address
                      </label>
                      <input 
                        type="email"
                        value={buyerEmail}
                        onChange={(e) => setBuyerEmail(e.target.value)}
                        placeholder="buyer@example.com"
                        className="w-full px-3 py-2 border border-stone-200 rounded-lg outline-none focus:border-[#c25e2e]"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-stone-400 uppercase font-semibold block mb-0.5">
                        Quantity
                      </label>
                      <input 
                        type="number"
                        min="1"
                        max="500"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        className="w-full px-3 py-2 border border-stone-200 rounded-lg outline-none focus:border-[#c25e2e]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-stone-400 uppercase font-semibold block mb-0.5">
                      Notes / Customization Request (Optional)
                    </label>
                    <textarea 
                      rows={2}
                      value={customNotes}
                      onChange={(e) => setCustomNotes(e.target.value)}
                      placeholder="e.g. Need gift packaging, delivery to Mumbai by Friday, or asking for bulk wholesale discount..."
                      className="w-full px-3 py-2 border border-stone-200 rounded-lg outline-none focus:border-[#c25e2e] resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingEnquiry}
                    className="w-full py-2.5 sm:py-3 bg-[#c25e2e] hover:bg-[#a94f24] active:bg-[#91421d] text-white rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    {isSubmittingEnquiry ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sending to Artisan...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit Direct Enquiry (₹{(product.finalPrice * (Number(quantity) || 1)).toLocaleString('en-IN')})</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

          </div>

        </div>

        {/* Mobile Sticky Bottom Action Bar */}
        <div className="fixed bottom-14 left-0 right-0 z-30 bg-white/95 backdrop-blur-md p-3 border-t border-stone-200 shadow-xl flex items-center justify-between gap-3 md:hidden">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-base font-extrabold text-stone-900">
                ₹{product.finalPrice.toLocaleString('en-IN')}
              </span>
              {product.mrp && product.mrp > product.finalPrice && (
                <span className="text-[10px] text-stone-400 line-through">
                  ₹{product.mrp.toLocaleString('en-IN')}
                </span>
              )}
            </div>
            <span className="text-[9px] font-bold text-emerald-700 block">
              Direct Artisan Handcrafted
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('enquiry-box');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="px-4 py-2 bg-[#c25e2e] text-white text-xs font-bold rounded-xl shadow-sm hover:bg-[#a94f24] transition flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Enquire Now</span>
          </button>
        </div>

        {/* Related Crafts Row */}
        {relatedCrafts.length > 0 && (
          <section className="mt-16 pt-8 border-t border-stone-200 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold font-['Playfair_Display'] text-stone-900">
                  More in {product.category}
                </h3>
                <p className="text-xs text-stone-500">
                  Explore other authentic creations in this craft discipline.
                </p>
              </div>

              <Link 
                to={`/marketplace?category=${encodeURIComponent(product.category)}`}
                className="text-xs font-semibold text-[#c25e2e] hover:underline"
              >
                View all {product.category} →
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {relatedCrafts.map(rel => (
                <Link
                  key={rel.id}
                  to={`/product/${rel.id}`}
                  className="bg-white rounded-xl border border-stone-200 overflow-hidden hover:border-stone-400 transition group p-2.5 block"
                >
                  <img 
                    src={rel.imageUrl} 
                    alt={rel.title}
                    className="w-full aspect-square rounded-lg object-cover group-hover:scale-102 transition duration-300"
                  />
                  <p className="text-[10px] text-stone-400 mt-2 uppercase font-semibold">{rel.craftType}</p>
                  <p className="text-xs font-bold text-stone-900 truncate group-hover:text-[#c25e2e]">{rel.title}</p>
                  <p className="text-xs font-bold text-stone-800 mt-1">₹{rel.finalPrice.toLocaleString('en-IN')}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

      </main>

    </div>
  );
}
