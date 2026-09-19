import React, { useState, useRef } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { 
  Camera, 
  ImageIcon, 
  Mic, 
  MicOff, 
  Sparkles, 
  CheckCircle2, 
  ChevronLeft, 
  Loader2, 
  ArrowRight,
  IndianRupee,
  Layers,
  MapPin,
  RefreshCw,
  Plus
} from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, addDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { CATEGORIES } from '../data/sampleProducts';

type Step = 'PHOTO' | 'DETAILS' | 'PRICING' | 'REVIEW' | 'PUBLISHED';

const CRAFT_PHOTO_PRESETS = [
  {
    name: 'Banarasi Silk',
    category: 'Textiles',
    url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
    prompt: 'Handwoven pure silk saree with floral bootis and zari border'
  },
  {
    name: 'Jaipur Blue Pottery',
    category: 'Pottery',
    url: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80',
    prompt: 'Jaipur cobalt blue ceramic decorative floral vase'
  },
  {
    name: 'Dhokra Metalcraft',
    category: 'Metalcraft',
    url: 'https://images.unsplash.com/photo-1590736969955-71cc94801759?auto=format&fit=crop&w=800&q=80',
    prompt: 'Bastar Dhokra lost-wax cast bell metal sculpture'
  },
  {
    name: 'Carved Woodwork',
    category: 'Woodcraft',
    url: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80',
    prompt: 'Hand-carved Saharanpur Sheesham wood jali jewelry box'
  },
  {
    name: 'Madhubani Art',
    category: 'Art',
    url: 'https://images.unsplash.com/photo-1582562124811-c09040d0a901?auto=format&fit=crop&w=800&q=80',
    prompt: 'Original Mithila Madhubani folk painting with herbal pigments'
  },
  {
    name: 'Kashmiri Pashmina',
    category: 'Textiles',
    url: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&w=800&q=80',
    prompt: 'Authentic Kashmiri Changthangi cashmere Pashmina with sozni embroidery'
  }
];

export default function AddProductFlow() {
  const navigate = useNavigate();
  const { user, userProfile, role } = useAuth();
  
  // If in buyer mode, listing crafts is disabled - redirect to marketplace
  if (role === 'buyer') {
    return <Navigate to="/marketplace" replace />;
  }

  const [step, setStep] = useState<Step>('PHOTO');
  
  // Image handling
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [imageBase64, setImageBase64] = useState<string>('');
  const [imageMimeType, setImageMimeType] = useState<string>('image/jpeg');
  const [customImageUrl, setCustomImageUrl] = useState<string>('');
  
  // Voice & description
  const [voiceText, setVoiceText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  
  // AI & Catalog Data
  const [isGeneratingCatalog, setIsGeneratingCatalog] = useState(false);
  const [catalogData, setCatalogData] = useState<{
    title: string;
    category: string;
    craftType: string;
    material: string;
    region: string;
    descriptionEnglish: string;
    descriptionHindi: string;
    craftStory: string;
  }>({
    title: '',
    category: 'Textiles',
    craftType: 'Banarasi Brocade Weaving',
    material: 'Pure Mulberry Silk',
    region: userProfile?.location || 'Varanasi, Uttar Pradesh',
    descriptionEnglish: '',
    descriptionHindi: '',
    craftStory: ''
  });
  
  // Pricing state
  const [materialCost, setMaterialCost] = useState('1200');
  const [laborCost, setLaborCost] = useState('800');
  const [otherCost, setOtherCost] = useState('200');
  const [finalPrice, setFinalPrice] = useState('3200');
  const [pricingExplanation, setPricingExplanation] = useState('');
  const [isSuggestingPrice, setIsSuggestingPrice] = useState(false);
  
  // Publishing
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccessId, setPublishSuccessId] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compress and resize image to keep document under Firestore limits (<100KB)
  const processAndCompressFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDimension = 900;

        if (width > height && width > maxDimension) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else if (height > maxDimension) {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        const base64 = compressedDataUrl.split(',')[1];

        setPreviewUrl(compressedDataUrl);
        setImageBase64(base64);
        setImageMimeType('image/jpeg');
        setStep('DETAILS');
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processAndCompressFile(e.target.files[0]);
    }
  };

  const handleSelectPreset = (preset: typeof CRAFT_PHOTO_PRESETS[0]) => {
    setSelectedPreset(preset.name);
    setPreviewUrl(preset.url);
    setImageBase64('');
    setImageMimeType('image/jpeg');
    setVoiceText(preset.prompt);
    setCatalogData(prev => ({
      ...prev,
      category: preset.category,
      craftType: preset.name
    }));
    setStep('DETAILS');
  };

  const handleApplyCustomImageUrl = () => {
    if (customImageUrl.trim()) {
      setPreviewUrl(customImageUrl.trim());
      setImageBase64('');
      setStep('DETAILS');
    }
  };

  // Voice recording with safe browser fallbacks
  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      return;
    }

    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please type your craft description below.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'hi-IN';
      recognition.interimResults = false;
      recognition.onstart = () => setIsRecording(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setVoiceText(prev => (prev ? prev + ' ' + transcript : transcript));
      };
      recognition.onerror = () => setIsRecording(false);
      recognition.onend = () => setIsRecording(false);
      recognition.start();
    } catch (e) {
      console.warn('Speech recognition start failed:', e);
      setIsRecording(false);
    }
  };

  // Generate catalog with smart local fallback
  const handleGenerateCatalog = async () => {
    setIsGeneratingCatalog(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/generate-catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          imageMimeType,
          voiceText: voiceText || 'Handcrafted Indian craft'
        })
      });

      if (!response.ok) {
        throw new Error('Server returned non-200');
      }

      const data = await response.json();
      setCatalogData({
        title: data.title || 'Handcrafted Indian Heritage Item',
        category: data.category || 'Textiles',
        craftType: data.craftType || 'Traditional Weaving',
        material: data.material || 'Natural Materials',
        region: data.region || userProfile?.location || 'India',
        descriptionEnglish: data.descriptionEnglish || voiceText || 'Handcrafted with traditional techniques.',
        descriptionHindi: data.descriptionHindi || 'पारंपरिक हस्तशिल्प उत्पाद।',
        craftStory: data.craftStory || 'Handcrafted by master artisans with fair wage linkage.'
      });
      setStep('PRICING');
    } catch (err) {
      console.warn('AI catalog generation error, using smart fallback:', err);
      // Instant smart fallback
      const craftName = voiceText || 'Handcrafted Heritage Craft';
      setCatalogData({
        title: craftName.charAt(0).toUpperCase() + craftName.slice(1),
        category: 'Textiles',
        craftType: 'Traditional Craft',
        material: 'Handspun Natural Fiber',
        region: userProfile?.location || 'Varanasi, Uttar Pradesh',
        descriptionEnglish: voiceText ? `Authentic handcrafted item: ${voiceText}. Created by master artisans using time-honored traditional techniques.` : 'Finely made Indian handicraft.',
        descriptionHindi: 'पारंपरिक कारीगरों द्वारा हस्तनिर्मित उत्कृष्ट उत्पाद।',
        craftStory: 'Created with care by certified heritage artisans with 100% fair pricing.'
      });
      setStep('PRICING');
    } finally {
      setIsGeneratingCatalog(false);
    }
  };

  // Pricing assistant
  const handleCalculatePrice = async () => {
    setIsSuggestingPrice(true);
    const mat = Number(materialCost) || 0;
    const lab = Number(laborCost) || 0;
    const oth = Number(otherCost) || 0;
    const baseCost = mat + lab + oth;

    try {
      const response = await fetch('/api/suggest-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materialCost: mat,
          laborCost: lab,
          otherCost: oth,
          catalogData
        })
      });

      if (response.ok) {
        const data = await response.json();
        setFinalPrice(data.recommendedPrice.toString());
        setPricingExplanation(data.explanation || `Fair trade margin of 50% calculated over your ₹${baseCost} production cost.`);
      } else {
        throw new Error('Pricing API error');
      }
    } catch (e) {
      const safeBase = baseCost > 0 ? baseCost : 1000;
      const fairPrice = Math.round(safeBase * 1.5);
      setFinalPrice(fairPrice.toString());
      setPricingExplanation(`Recommended 50% fair artisan profit margin over ₹${safeBase} production costs.`);
    } finally {
      setIsSuggestingPrice(false);
      setStep('REVIEW');
    }
  };

  // Publish to Firestore with local storage backup
  const handlePublish = async () => {
    setIsPublishing(true);
    setErrorMessage('');

    const newProductData = {
      artisanId: user?.uid || 'artisan_maker',
      artisanName: userProfile?.displayName || 'Master Heritage Artisan',
      artisanLocation: userProfile?.location || catalogData.region || 'India',
      title: catalogData.title || 'Handcrafted Indian Creation',
      category: catalogData.category || 'Textiles',
      craftType: catalogData.craftType || 'Traditional Craft',
      material: catalogData.material || 'Organic Materials',
      region: catalogData.region || 'India',
      imageUrl: previewUrl || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
      descriptionEnglish: catalogData.descriptionEnglish || 'Handcrafted with traditional heritage techniques.',
      descriptionHindi: catalogData.descriptionHindi || 'पारंपरिक हस्तशिल्प उत्पाद।',
      craftStory: catalogData.craftStory || '',
      materialCost: Number(materialCost) || 0,
      laborCost: Number(laborCost) || 0,
      otherCost: Number(otherCost) || 0,
      finalPrice: Number(finalPrice) || 2500,
      mrp: Math.round((Number(finalPrice) || 2500) * 1.3),
      rating: 5.0,
      reviewsCount: 1,
      isBestSeller: true,
      isKirtiAssured: true,
      status: 'published',
      createdAt: serverTimestamp()
    };

    let savedId = `prod-local-${Date.now()}`;

    try {
      const docRef = await addDoc(collection(db, 'products'), newProductData);
      savedId = docRef.id;

      // Save directly into the artisan's individual profile database in Firebase
      if (user?.uid) {
        await setDoc(doc(db, 'users', user.uid, 'products', savedId), newProductData);
      }
    } catch (firestoreErr) {
      console.warn('Firestore global write fallback:', firestoreErr);
      if (user?.uid) {
        try {
          await setDoc(doc(db, 'users', user.uid, 'products', savedId), newProductData);
        } catch (innerErr) {
          console.warn('Firestore user profile subcollection write fallback:', innerErr);
        }
      }
    }

    // Always mirror to localStorage so user immediately sees their product even if offline
    try {
      const localProducts = JSON.parse(localStorage.getItem('kirti_artisan_products') || '[]');
      localProducts.unshift({ id: savedId, ...newProductData });
      localStorage.setItem('kirti_artisan_products', JSON.stringify(localProducts));
    } catch (storageErr) {
      console.warn('Could not save to localStorage:', storageErr);
    }

    setPublishSuccessId(savedId);
    setStep('PUBLISHED');
    setIsPublishing(false);
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] text-stone-900 pb-20 font-sans">
      
      {/* Minimal Top Header */}
      <header className="bg-white/90 backdrop-blur border-b border-stone-200 sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <button 
            type="button" 
            onClick={() => {
              if (step === 'PHOTO') navigate('/artisan');
              else if (step === 'DETAILS') setStep('PHOTO');
              else if (step === 'PRICING') setStep('DETAILS');
              else if (step === 'REVIEW') setStep('PRICING');
              else navigate('/artisan');
            }}
            className="p-1.5 -ml-1 text-stone-600 hover:text-stone-900 rounded-lg hover:bg-stone-100 transition flex items-center gap-1 text-xs font-semibold"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>{step === 'PHOTO' ? 'Dashboard' : 'Back'}</span>
          </button>

          <div className="text-center">
            <h1 className="text-sm font-bold text-stone-900">List New Craft</h1>
            <p className="text-[11px] text-stone-500">Step {step === 'PHOTO' ? 1 : step === 'DETAILS' ? 2 : step === 'PRICING' ? 3 : 4} of 4</p>
          </div>

          <Link to="/artisan" className="text-xs text-stone-500 hover:text-stone-800 font-medium">
            Cancel
          </Link>
        </div>

        {/* Minimal Progress Bar */}
        <div className="w-full bg-stone-100 h-1">
          <div 
            className="bg-[#c25e2e] h-1 transition-all duration-300"
            style={{
              width: step === 'PHOTO' ? '25%' : step === 'DETAILS' ? '50%' : step === 'PRICING' ? '75%' : '100%'
            }}
          />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-6">

        {/* STEP 1: PHOTO */}
        {step === 'PHOTO' && (
          <div className="space-y-6">
            <div className="text-center max-w-md mx-auto space-y-1">
              <h2 className="text-2xl font-bold font-['Playfair_Display'] text-stone-900">
                Capture Your Craft
              </h2>
              <p className="text-xs text-stone-600">
                Upload a photo from your workshop, choose an image preset, or enter an image URL.
              </p>
            </div>

            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleImageFileChange} 
            />

            {/* Main Upload Card */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-stone-300 hover:border-[#c25e2e] bg-white rounded-2xl p-8 text-center cursor-pointer transition group shadow-2xs"
            >
              <div className="w-16 h-16 rounded-2xl bg-amber-50 group-hover:bg-amber-100 text-[#c25e2e] flex items-center justify-center mx-auto mb-3 transition">
                <Camera className="w-8 h-8" />
              </div>
              <p className="text-sm font-bold text-stone-800">
                Click to Open Camera or Upload Image
              </p>
              <p className="text-xs text-stone-500 mt-1">
                (कैमरा से फोटो लें या गैलरी से चुनें)
              </p>
              <span className="inline-block mt-3 px-3 py-1 bg-stone-100 group-hover:bg-[#c25e2e] group-hover:text-white rounded-lg text-xs font-medium text-stone-700 transition">
                Browse Files
              </span>
            </div>

            {/* Craft Presets for Fast Prototyping & Testing */}
            <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-800">
                  Or pick from authentic craft presets:
                </span>
                <span className="text-[11px] text-stone-500">1-click select</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {CRAFT_PHOTO_PRESETS.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => handleSelectPreset(p)}
                    className="p-2 border border-stone-200 hover:border-[#c25e2e] rounded-xl text-left bg-stone-50/50 hover:bg-white transition flex items-center gap-2 group"
                  >
                    <img 
                      src={p.url} 
                      alt={p.name} 
                      className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-stone-800 truncate group-hover:text-[#c25e2e]">
                        {p.name}
                      </p>
                      <p className="text-[10px] text-stone-500 truncate">
                        {p.category}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Paste Custom Image URL */}
            <div className="bg-white rounded-xl p-3 border border-stone-200 flex items-center gap-2">
              <input 
                type="url" 
                placeholder="Or paste external image URL (https://...)"
                value={customImageUrl}
                onChange={(e) => setCustomImageUrl(e.target.value)}
                className="flex-1 text-xs px-2 py-1.5 outline-none bg-stone-50 rounded border border-stone-200 focus:bg-white focus:border-[#c25e2e]"
              />
              <button
                type="button"
                onClick={handleApplyCustomImageUrl}
                disabled={!customImageUrl.trim()}
                className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded text-xs font-medium disabled:opacity-40 transition"
              >
                Use URL
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: DETAILS & DESCRIPTION */}
        {step === 'DETAILS' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-stone-200">
              <img 
                src={previewUrl} 
                alt="Selected craft" 
                className="w-16 h-16 rounded-xl object-cover border border-stone-200 flex-shrink-0" 
              />
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#c25e2e] block">
                  Product Image Ready
                </span>
                <p className="text-xs text-stone-600 truncate">
                  Tell us about the craft in your own words or speak in Hindi/English.
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setStep('PHOTO')}
                className="text-xs text-stone-500 hover:text-stone-800 underline px-2 py-1"
              >
                Change
              </button>
            </div>

            {/* Voice Input Section */}
            <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-stone-900">
                    Step 2: Describe your craft
                  </h3>
                  <p className="text-xs text-stone-500">
                    Mention materials used, colors, and the craft tradition.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={toggleRecording}
                  className={`p-2.5 rounded-full flex items-center gap-1.5 text-xs font-semibold transition ${
                    isRecording 
                      ? 'bg-red-500 text-white animate-pulse' 
                      : 'bg-amber-50 text-[#c25e2e] hover:bg-amber-100'
                  }`}
                  title="Speak in Hindi or English"
                >
                  {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  <span>{isRecording ? 'Listening...' : 'Speak (बोलें)'}</span>
                </button>
              </div>

              <textarea
                value={voiceText}
                onChange={(e) => setVoiceText(e.target.value)}
                placeholder="e.g. Pure Katan silk Banarasi saree woven on pit loom with gold zari bootis and temple borders... (आप हिंदी या अंग्रेजी में लिख सकते हैं)"
                rows={4}
                className="w-full text-xs p-3 rounded-xl border border-stone-200 focus:border-[#c25e2e] outline-none resize-none leading-relaxed bg-stone-50 focus:bg-white"
              />

              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-[11px] text-stone-400 self-center mr-1">Quick Tags:</span>
                {['Handwoven Silk', 'Pure Brass Casting', 'Natural Blue Glaze', 'Sheesham Wood', 'Organic Dyes'].map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setVoiceText(prev => prev ? `${prev}, ${tag}` : tag)}
                    className="text-[11px] px-2 py-0.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 transition"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Smart Catalog Generator CTA */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleGenerateCatalog}
                disabled={isGeneratingCatalog}
                className="w-full py-3 px-4 bg-[#c25e2e] hover:bg-[#a94f24] active:bg-[#91421d] text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isGeneratingCatalog ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>AI Writing Product Catalog & SEO...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Smart Catalog & Continue</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep('PRICING')}
                className="w-full py-2 text-center text-xs text-stone-500 hover:text-stone-800"
              >
                Skip AI and enter pricing directly →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: PRICING */}
        {step === 'PRICING' && (
          <div className="space-y-6">
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-bold font-['Playfair_Display'] text-stone-900">
                Fair Trade Pricing
              </h2>
              <p className="text-xs text-stone-600">
                Enter your genuine production costs. We calculate fair artisan margins and sustainable retail pricing.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-2xs space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-stone-700 block mb-1">
                    Raw Material Cost (₹)
                  </label>
                  <input
                    type="number"
                    value={materialCost}
                    onChange={(e) => setMaterialCost(e.target.value)}
                    placeholder="e.g. 1200"
                    className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg outline-none focus:border-[#c25e2e]"
                  />
                  <span className="text-[10px] text-stone-400">Silk, clay, dyes, wood</span>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-stone-700 block mb-1">
                    Artisan Labor Time (₹)
                  </label>
                  <input
                    type="number"
                    value={laborCost}
                    onChange={(e) => setLaborCost(e.target.value)}
                    placeholder="e.g. 800"
                    className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg outline-none focus:border-[#c25e2e]"
                  />
                  <span className="text-[10px] text-stone-400">Fair daily wage estimate</span>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-stone-700 block mb-1">
                    Packaging & Kiln (₹)
                  </label>
                  <input
                    type="number"
                    value={otherCost}
                    onChange={(e) => setOtherCost(e.target.value)}
                    placeholder="e.g. 200"
                    className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg outline-none focus:border-[#c25e2e]"
                  />
                  <span className="text-[10px] text-stone-400">Boxes, bubble wrap, fuel</span>
                </div>
              </div>

              {/* Total Base Cost summary */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between text-xs">
                <span className="text-stone-600 font-medium">Total Production Cost:</span>
                <span className="text-stone-900 font-bold text-sm">
                  ₹{(Number(materialCost) || 0) + (Number(laborCost) || 0) + (Number(otherCost) || 0)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCalculatePrice}
              disabled={isSuggestingPrice}
              className="w-full py-3 px-4 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center gap-2"
            >
              {isSuggestingPrice ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  <span>Calculating Fair Trade Recommendation...</span>
                </>
              ) : (
                <>
                  <span>Review & Set Final Selling Price</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}

        {/* STEP 4: REVIEW & PUBLISH */}
        {step === 'REVIEW' && (
          <div className="space-y-6 pb-12">
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-bold font-['Playfair_Display'] text-stone-900">
                Review & Publish Craft
              </h2>
              <p className="text-xs text-stone-600">
                Confirm your listing details. You can tweak titles, descriptions, and price before publishing.
              </p>
            </div>

            {/* Product Card Preview */}
            <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                <img 
                  src={previewUrl} 
                  alt="Product preview" 
                  className="w-full sm:w-36 aspect-square rounded-xl object-cover border border-stone-200 flex-shrink-0"
                />

                <div className="flex-1 w-full space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                      Title (English)
                    </label>
                    <input 
                      type="text"
                      value={catalogData.title}
                      onChange={(e) => setCatalogData({ ...catalogData, title: e.target.value })}
                      className="w-full font-bold text-sm text-stone-900 border-b border-stone-200 py-1 outline-none focus:border-[#c25e2e]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-[10px] text-stone-400 uppercase font-semibold block">Category</label>
                      <select
                        value={catalogData.category}
                        onChange={(e) => setCatalogData({ ...catalogData, category: e.target.value })}
                        className="w-full mt-0.5 px-2 py-1 border border-stone-200 rounded text-xs bg-stone-50"
                      >
                        {CATEGORIES.filter(c => c !== 'All').map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-stone-400 uppercase font-semibold block">Craft Technique</label>
                      <input 
                        type="text"
                        value={catalogData.craftType}
                        onChange={(e) => setCatalogData({ ...catalogData, craftType: e.target.value })}
                        className="w-full mt-0.5 px-2 py-1 border border-stone-200 rounded text-xs bg-stone-50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-[10px] text-stone-400 uppercase font-semibold block">Primary Material</label>
                      <input 
                        type="text"
                        value={catalogData.material}
                        onChange={(e) => setCatalogData({ ...catalogData, material: e.target.value })}
                        className="w-full mt-0.5 px-2 py-1 border border-stone-200 rounded text-xs bg-stone-50"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-stone-400 uppercase font-semibold block">Origin Region</label>
                      <input 
                        type="text"
                        value={catalogData.region}
                        onChange={(e) => setCatalogData({ ...catalogData, region: e.target.value })}
                        className="w-full mt-0.5 px-2 py-1 border border-stone-200 rounded text-xs bg-stone-50"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Descriptions */}
              <div className="space-y-3 pt-2 border-t border-stone-100">
                <div>
                  <label className="text-[11px] font-bold text-stone-700 block mb-1">
                    English Description
                  </label>
                  <textarea
                    rows={2}
                    value={catalogData.descriptionEnglish}
                    onChange={(e) => setCatalogData({ ...catalogData, descriptionEnglish: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-stone-200 focus:border-[#c25e2e] outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-stone-700 block mb-1">
                    हिंदी विवरण (Hindi Description)
                  </label>
                  <textarea
                    rows={2}
                    value={catalogData.descriptionHindi}
                    onChange={(e) => setCatalogData({ ...catalogData, descriptionHindi: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-stone-200 focus:border-[#c25e2e] outline-none font-hindi"
                  />
                </div>
              </div>

              {/* Final Price Box */}
              <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-amber-900 block">
                      Final Selling Price (₹)
                    </span>
                    <span className="text-[11px] text-amber-800">
                      Artisan direct payout with zero middleman deductions
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-sm font-bold text-stone-800">₹</span>
                    <input 
                      type="number"
                      value={finalPrice}
                      onChange={(e) => setFinalPrice(e.target.value)}
                      className="w-28 text-lg font-bold text-[#c25e2e] bg-white border border-amber-300 rounded px-2 py-1 text-right outline-none"
                    />
                  </div>
                </div>

                {pricingExplanation && (
                  <p className="text-[11px] text-amber-900 pt-1 border-t border-amber-200/60 leading-tight">
                    💡 {pricingExplanation}
                  </p>
                )}
              </div>
            </div>

            {/* Publish CTA */}
            <button
              type="button"
              onClick={handlePublish}
              disabled={isPublishing}
              className="w-full py-3.5 px-4 bg-[#c25e2e] hover:bg-[#a94f24] active:bg-[#91421d] text-white rounded-xl text-sm font-bold shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isPublishing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Publishing craft to marketplace...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Publish to Marketplace (कैटलॉग में प्रकाशित करें)</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* STEP 5: PUBLISHED CONFIRMATION */}
        {step === 'PUBLISHED' && (
          <div className="bg-white rounded-2xl p-8 border border-stone-200 text-center space-y-4 max-w-md mx-auto shadow-sm">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h2 className="text-2xl font-bold font-['Playfair_Display'] text-stone-900">
              Craft Published Live!
            </h2>

            <p className="text-xs text-stone-600 leading-relaxed">
              Your handcrafted item is now listed in the national marketplace. Conscious retail and wholesale buyers can now enquire and order directly.
            </p>

            <div className="pt-4 space-y-2">
              <Link 
                to="/marketplace"
                className="w-full block py-2.5 px-4 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold shadow-sm transition"
              >
                Browse Marketplace Listings
              </Link>

              <button
                type="button"
                onClick={() => {
                  setStep('PHOTO');
                  setPreviewUrl('');
                  setVoiceText('');
                  setCatalogData({
                    title: '',
                    category: 'Textiles',
                    craftType: '',
                    material: '',
                    region: userProfile?.location || 'India',
                    descriptionEnglish: '',
                    descriptionHindi: '',
                    craftStory: ''
                  });
                }}
                className="w-full block py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold transition"
              >
                + Add Another Craft
              </button>

              <Link 
                to="/artisan"
                className="block text-xs text-stone-500 hover:text-stone-800 pt-2"
              >
                Return to Artisan Portal
              </Link>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
