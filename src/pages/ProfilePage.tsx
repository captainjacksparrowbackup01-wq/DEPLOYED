import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { 
  User as UserIcon, 
  MapPin, 
  Phone, 
  Mail, 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck, 
  Save, 
  Store,
  ShoppingBag,
  CreditCard,
  Award,
  AlertCircle,
  Package,
  MessageSquare
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function ProfilePage() {
  const { user, userProfile, role, switchRole, updateUserProfile } = useAuth();
  const navigate = useNavigate();

  const isSeller = role === 'seller';

  const handleToggleRole = () => {
    if (isSeller) {
      switchRole('buyer');
      navigate('/marketplace');
    } else {
      switchRole('seller');
      navigate('/artisan');
    }
  };

  // Form states initialized from userProfile
  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [workshopName, setWorkshopName] = useState(userProfile?.workshopName || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [location, setLocation] = useState(userProfile?.location || 'Varanasi, Uttar Pradesh');
  const [craftSpecialty, setCraftSpecialty] = useState(userProfile?.craftSpecialty || 'Banarasi Silk & Brocade Weaving');
  const [bio, setBio] = useState(userProfile?.bio || '');
  const [upiId, setUpiId] = useState(userProfile?.upiId || '');
  const [experienceYears, setExperienceYears] = useState(userProfile?.experienceYears?.toString() || '15');
  const [organization, setOrganization] = useState(userProfile?.organization || '');

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Stats for this user
  const [stats, setStats] = useState<{
    productsCount: number;
    enquiriesCount: number;
  }>({
    productsCount: 0,
    enquiriesCount: 0
  });

  // Sync state whenever userProfile loads or updates
  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || '');
      setWorkshopName(userProfile.workshopName || '');
      setPhone(userProfile.phone || '');
      setLocation(userProfile.location || 'Varanasi, Uttar Pradesh');
      setCraftSpecialty(userProfile.craftSpecialty || 'Banarasi Silk & Brocade Weaving');
      setBio(userProfile.bio || '');
      setUpiId(userProfile.upiId || '');
      setExperienceYears(userProfile.experienceYears?.toString() || '15');
      setOrganization(userProfile.organization || '');
    }
  }, [userProfile]);

  // Load user stats safely
  useEffect(() => {
    async function loadUserStats() {
      if (!user) return;
      try {
        const userProdsSnap = await getDocs(collection(db, 'users', user.uid, 'products'));
        const userEnqsSnap = await getDocs(collection(db, 'users', user.uid, 'enquiries'));
        
        let pCount = userProdsSnap.size;
        let eCount = userEnqsSnap.size;

        if (pCount === 0) {
          try {
            const local = JSON.parse(localStorage.getItem('kirti_artisan_products') || '[]');
            pCount = local.length;
          } catch (e) {}
        }
        if (eCount === 0) {
          try {
            const local = JSON.parse(localStorage.getItem('kirti_enquiries') || '[]');
            eCount = local.length;
          } catch (e) {}
        }

        setStats({
          productsCount: pCount,
          enquiriesCount: eCount
        });
      } catch (err) {
        console.warn('Could not read user stats:', err);
      }
    }

    loadUserStats();
  }, [user, userProfile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    setErrorMsg('');
    setSaveSuccess(false);

    try {
      await updateUserProfile({
        displayName: displayName.trim() || 'Master Artisan',
        workshopName: workshopName.trim(),
        phone: phone.trim(),
        location: location.trim(),
        craftSpecialty: craftSpecialty.trim(),
        bio: bio.trim(),
        upiId: upiId.trim(),
        experienceYears: Number(experienceYears) || 0,
        organization: organization.trim(),
        kycStatus: 'verified'
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-stone-900 pb-20 font-sans">
      
      {/* Top Profile Header */}
      <div className="bg-white border-b border-stone-200/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#c25e2e] text-white flex items-center justify-center font-bold text-2xl shadow-sm flex-shrink-0">
                {displayName ? displayName.charAt(0).toUpperCase() : 'A'}
              </div>
              
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold font-['Playfair_Display'] text-stone-900">
                    {displayName || (isSeller ? 'Artisan Profile' : 'Buyer Profile')}
                  </h1>
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                    isSeller 
                      ? 'bg-amber-100 text-[#c25e2e]' 
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {isSeller ? 'Artisan Account' : 'Buyer Account'}
                  </span>
                  <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Verified & Active
                  </span>
                </div>
                
                <p className="text-xs text-stone-500 mt-1 flex items-center gap-3 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-stone-400" />
                    {user?.email || 'Logged in'}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#c25e2e]" />
                    {location}
                  </span>
                </p>
              </div>
            </div>

            {/* Mode Switcher & Quick Navigation */}
            <div className="flex items-center gap-2 self-stretch sm:self-auto">
              <button
                type="button"
                onClick={handleToggleRole}
                className="flex-1 sm:flex-initial px-3.5 py-2 text-xs font-semibold rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 transition flex items-center justify-center gap-1.5"
              >
                {isSeller ? <ShoppingBag className="w-3.5 h-3.5" /> : <Store className="w-3.5 h-3.5" />}
                <span>Switch to {isSeller ? 'Buyer View' : 'Artisan View'}</span>
              </button>
              {isSeller && (
                <Link
                  to="/artisan"
                  className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-[#c25e2e] hover:bg-[#a94f24] text-white transition flex items-center gap-1.5 shadow-2xs"
                >
                  <Store className="w-3.5 h-3.5" />
                  <span>Artisan Dashboard</span>
                </Link>
              )}
            </div>
          </div>

          {/* Simple summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-stone-100 text-xs">
            <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/60">
              <div className="flex items-center gap-2 text-stone-500 font-medium">
                {isSeller ? <Package className="w-4 h-4 text-[#c25e2e]" /> : <ShoppingBag className="w-4 h-4 text-[#c25e2e]" />}
                <span>{isSeller ? 'Listed Crafts' : 'Heritage Catalog'}</span>
              </div>
              <p className="text-xl font-bold text-stone-900 mt-1">
                {isSeller ? stats.productsCount : '50+ Items'}
              </p>
            </div>

            <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/60">
              <div className="flex items-center gap-2 text-stone-500 font-medium">
                <MessageSquare className="w-4 h-4 text-[#c25e2e]" />
                <span>{isSeller ? 'Inquiries Received' : 'Inquiries & Orders'}</span>
              </div>
              <p className="text-xl font-bold text-stone-900 mt-1">{stats.enquiriesCount}</p>
            </div>

            <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/60 col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2 text-stone-500 font-medium">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span>Direct Payments</span>
              </div>
              <p className="text-xs font-bold text-stone-900 mt-1 truncate">
                {upiId ? upiId : (isSeller ? 'Add UPI ID below' : 'UPI Direct Active')}
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Main Form Area */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6">
        
        {/* Simple Alerts */}
        {saveSuccess && (
          <div className="p-3.5 mb-5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <p className="font-semibold">Profile details saved successfully!</p>
          </div>
        )}

        {errorMsg && (
          <div className="p-3.5 mb-5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <p>{errorMsg}</p>
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-6">
          
          {/* Section 1: Basic Information */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
            <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2 border-b border-stone-100 pb-3">
              <UserIcon className="w-4 h-4 text-[#c25e2e]" />
              <span>Basic Information</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-stone-700 font-semibold mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Ram Kumar"
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:border-[#c25e2e] outline-none bg-stone-50 focus:bg-white text-stone-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">
                  {isSeller ? 'Workshop / Studio Name' : 'Organization Name'}
                </label>
                <input
                  type="text"
                  value={isSeller ? workshopName : organization}
                  onChange={(e) => isSeller ? setWorkshopName(e.target.value) : setOrganization(e.target.value)}
                  placeholder={isSeller ? "e.g. Ganga Silk Weavers Guild" : "e.g. Heritage Emporium"}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:border-[#c25e2e] outline-none bg-stone-50 focus:bg-white text-stone-900"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">
                  Contact Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:border-[#c25e2e] outline-none bg-stone-50 focus:bg-white text-stone-900"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">
                  City & State <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Varanasi, Uttar Pradesh"
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:border-[#c25e2e] outline-none bg-stone-50 focus:bg-white text-stone-900"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Craft Heritage (for artisans) */}
          {isSeller && (
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
              <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2 border-b border-stone-100 pb-3">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Craft Specialty & Heritage</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">
                    Primary Craft Form
                  </label>
                  <input
                    type="text"
                    value={craftSpecialty}
                    onChange={(e) => setCraftSpecialty(e.target.value)}
                    placeholder="e.g. Banarasi Silk Handloom Weaving"
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:border-[#c25e2e] outline-none bg-stone-50 focus:bg-white text-stone-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">
                    Years of Experience
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="80"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:border-[#c25e2e] outline-none bg-stone-50 focus:bg-white text-stone-900 font-medium"
                  />
                </div>
              </div>

              <div className="text-xs">
                <label className="block text-stone-700 font-semibold mb-1">
                  About Your Craft & Workshop
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Share a short story about your craftsmanship, traditional tools, and heritage techniques..."
                  className="w-full p-3 rounded-xl border border-stone-200 focus:border-[#c25e2e] outline-none bg-stone-50 focus:bg-white text-stone-900 leading-relaxed resize-none"
                />
              </div>
            </div>
          )}

          {/* Section 3: Payments */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
            <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2 border-b border-stone-100 pb-3">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <span>Direct Payment Details</span>
            </h2>

            <div className="text-xs">
              <label className="block text-stone-700 font-semibold mb-1">
                UPI ID (for Direct Customer & Wholesale Payments)
              </label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="e.g. artisan@upi or 9876543210@paytm"
                className="w-full max-w-md px-3 py-2 rounded-xl border border-stone-200 focus:border-[#c25e2e] outline-none bg-stone-50 focus:bg-white text-stone-900 font-medium"
              />
              <p className="text-[11px] text-stone-400 mt-1">
                Buyers can send advance tokens or payments straight to your UPI without intermediaries.
              </p>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-1 flex items-center justify-between">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-[#c25e2e] hover:bg-[#a94f24] text-white font-bold text-xs flex items-center gap-2 shadow-sm transition disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
            <span className="text-xs text-stone-400">All updates save instantly</span>
          </div>

        </form>

      </div>

    </div>
  );
}

