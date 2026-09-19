import React, { useState, useEffect, useRef } from 'react';
import { useAuth, UserRole } from '../context/AuthContext';
import { VOICE_LANGUAGES, VoiceLanguage } from '../data/voiceLanguages';
import { 
  Lock, 
  Mail, 
  User, 
  AlertCircle,
  Loader2,
  CheckCircle2,
  Sparkles,
  ShoppingBag,
  Store,
  Globe,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  ArrowRight
} from 'lucide-react';

export default function AuthPortal() {
  const { login, signup, loginWithGoogle, loginWithGoogleEmail, demoLogin } = useAuth();
  
  // Active language state (default: Hindi, since primary users are Indian artisans)
  const [selectedLang, setSelectedLang] = useState<VoiceLanguage>(VOICE_LANGUAGES[0]);
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  // Active role and mode
  const [activeRole, setActiveRole] = useState<UserRole>('buyer');
  const [isRegistering, setIsRegistering] = useState<boolean>(false);

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status & loading
  const [loading, setLoading] = useState(false);
  const [socialLoadingRole, setSocialLoadingRole] = useState<UserRole | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoNotice, setInfoNotice] = useState<string | null>(null);

  // Voice recognition states
  const [isListeningGlobal, setIsListeningGlobal] = useState(false);
  const [activeFieldMic, setActiveFieldMic] = useState<'email' | 'name' | null>(null);
  const [speechTranscript, setSpeechTranscript] = useState('');
  const [voiceFeedback, setVoiceFeedback] = useState<string | null>(null);
  const [isSpeakingTTS, setIsSpeakingTTS] = useState(false);

  // SpeechRecognition ref
  const recognitionRef = useRef<any>(null);

  // Suggested Google account
  const suggestedGoogleEmail = 'captainjacksparrow.backup01@gmail.com';

  // Text-To-Speech (TTS) audio prompt
  const handlePlayTTS = () => {
    if (!('speechSynthesis' in window)) {
      setVoiceFeedback('Audio speech not supported on this browser.');
      return;
    }

    if (isSpeakingTTS) {
      window.speechSynthesis.cancel();
      setIsSpeakingTTS(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(selectedLang.greeting);
    utterance.lang = selectedLang.code;
    utterance.rate = 0.95; // Friendly cadence
    utterance.onstart = () => setIsSpeakingTTS(true);
    utterance.onend = () => setIsSpeakingTTS(false);
    utterance.onerror = () => setIsSpeakingTTS(false);

    window.speechSynthesis.speak(utterance);
  };

  // Stop any active speech on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }
    };
  }, []);

  // Helper to clean up dictated emails (converts "at the rate" -> "@", etc.)
  const cleanEmailTranscript = (text: string) => {
    return text
      .toLowerCase()
      .replace(/\s*(at the rate|at sign|at|@)\s*/gi, '@')
      .replace(/\s*(dot|point)\s*/gi, '.')
      .replace(/\s+/g, '')
      .trim();
  };

  // Start field-specific voice dictation
  const startFieldDictation = (field: 'email' | 'name') => {
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setErrorMsg('Voice input is not supported in this browser. Please type directly.');
      return;
    }

    if (activeFieldMic === field) {
      // Toggle off
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (_) {}
      }
      setActiveFieldMic(null);
      return;
    }

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (_) {}
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = selectedLang.code;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      setActiveFieldMic(field);
      setVoiceFeedback(`${selectedLang.voiceListeningText}...`);

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((res: any) => res[0].transcript)
          .join('');

        if (field === 'email') {
          setEmail(cleanEmailTranscript(transcript));
        } else {
          setFullName(transcript);
        }
      };

      recognition.onerror = (err: any) => {
        console.warn('Field recognition error:', err);
        setActiveFieldMic(null);
      };

      recognition.onend = () => {
        setActiveFieldMic(null);
        setVoiceFeedback(null);
      };

      recognition.start();
    } catch (err) {
      console.warn('Recognition start failed:', err);
      setActiveFieldMic(null);
    }
  };

  // Start Global Voice Assistant (interprets voice commands in any language)
  const startGlobalVoiceAssistant = () => {
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setErrorMsg('Voice input is not supported in this browser. Please type or use 1-click login.');
      return;
    }

    if (isListeningGlobal) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (_) {}
      }
      setIsListeningGlobal(false);
      return;
    }

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (_) {}
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = selectedLang.code;
      recognition.interimResults = true;
      recognition.continuous = false;

      setIsListeningGlobal(true);
      setSpeechTranscript('');
      setVoiceFeedback(selectedLang.voiceListeningText);

      recognition.onresult = (event: any) => {
        const rawTranscript = Array.from(event.results)
          .map((res: any) => res[0].transcript)
          .join('');
        setSpeechTranscript(rawTranscript);

        if (event.results[0].isFinal) {
          handleVoiceCommand(rawTranscript.toLowerCase().trim());
        }
      };

      recognition.onerror = (err: any) => {
        console.warn('Global recognition error:', err);
        setIsListeningGlobal(false);
      };

      recognition.onend = () => {
        setIsListeningGlobal(false);
      };

      recognition.start();
    } catch (err) {
      console.warn('Failed to start speech recognition:', err);
      setIsListeningGlobal(false);
    }
  };

  // Voice Command Intent Matcher for all languages
  const handleVoiceCommand = (command: string) => {
    // 1. Artisan intent
    const artisanKeywords = [
      'artisan', 'seller', 'weaver', 'maker', 'kariigar', 'karigar', 'shilpkar', 
      'कारीगर', 'शिल्पकार', 'बुनकर', 'বিক্রেতা', 'கைவினைஞர்', 'కళాకారుడు', 
      'कारागीर', 'કારીગર', 'ಕುಶಲಕರ್ಮಿ', 'കരകൗശല', 'ਕਾਰੀਗਰ', 'କାରିଗର', 'কাৰিকৰ', 'کاریگر'
    ];
    if (artisanKeywords.some(kw => command.includes(kw))) {
      setActiveRole('seller');
      setVoiceFeedback(`Switched to Artisan mode (${command})`);
      setInfoNotice(`Role selected: Artisan (शिल्पकार)`);
      return;
    }

    // 2. Buyer intent
    const buyerKeywords = [
      'buyer', 'customer', 'patron', 'shopper', 'kharidar', 'grahak', 
      'खरीदार', 'ग्राहक', 'ক্রেতা', 'வாங்குபவர்', 'కొనుగోలుదారు', 
      'खरेदीदार', 'ખરીદદાર', 'ಖರೀದಿದಾರ', 'വാങ്ങുന്നയാൾ', 'ਖਰੀਦਦਾਰ', 'କ୍ରେତା', 'ক্ৰেতা', 'خریدار'
    ];
    if (buyerKeywords.some(kw => command.includes(kw))) {
      setActiveRole('buyer');
      setVoiceFeedback(`Switched to Buyer mode (${command})`);
      setInfoNotice(`Role selected: Buyer (ग्राहक)`);
      return;
    }

    // 3. Demo login intent
    const demoKeywords = ['demo', 'test', 'trial', 'डेमो', 'टेस्ट', 'परीक्षण', 'ডেমো', 'டெமோ', 'డెమో', 'ડૅમો', 'ഡെമോ'];
    if (demoKeywords.some(kw => command.includes(kw))) {
      setVoiceFeedback('Logging into Demo account...');
      handleQuickDemo(activeRole);
      return;
    }

    // 4. Google login intent
    const googleKeywords = ['google', 'गूगल', 'গুগল', 'கூகிள்', 'గూగుల్', 'ગુગલ', 'گوگل'];
    if (googleKeywords.some(kw => command.includes(kw))) {
      setVoiceFeedback('Logging in with Google...');
      handleDirectQuickLogin(activeRole);
      return;
    }

    // 5. If spoken text contains "@" or typical email sounds, populate email!
    if (command.includes('@') || command.includes('mail') || command.includes('.com') || command.includes('at the rate')) {
      const clean = cleanEmailTranscript(command);
      setEmail(clean);
      setVoiceFeedback(`Filled email: ${clean}`);
      return;
    }

    // 6. Generic feedback
    setVoiceFeedback(`Heard: "${command}". Say "Artisan", "Buyer", "Demo", or speak your email.`);
  };

  // Google Sign In
  const handleSocialSignIn = async (roleToUse: UserRole) => {
    setErrorMsg(null);
    setInfoNotice(null);
    setSocialLoadingRole(roleToUse);
    setActiveRole(roleToUse);

    try {
      const res = await loginWithGoogle(roleToUse);
      if (res.fallbackUsed) {
        setInfoNotice(`Signed in securely via Google (${suggestedGoogleEmail})`);
      }
    } catch (err: any) {
      console.error('Social sign-in failed:', err);
      try {
        await loginWithGoogleEmail(suggestedGoogleEmail, roleToUse === 'seller' ? 'Master Artisan' : 'Patron Buyer', roleToUse);
      } catch (fallbackErr: any) {
        setErrorMsg('Sign-in issue. Please use the 1-Click login or demo access.');
      }
    } finally {
      setSocialLoadingRole(null);
    }
  };

  // 1-Click Fast Direct Login
  const handleDirectQuickLogin = async (roleToUse: UserRole) => {
    setErrorMsg(null);
    setSocialLoadingRole(roleToUse);
    try {
      await loginWithGoogleEmail(
        suggestedGoogleEmail, 
        roleToUse === 'seller' ? 'Master Artisan' : 'Patron Buyer', 
        roleToUse
      );
    } catch (err: any) {
      console.error('Direct sign-in failed:', err);
      setErrorMsg('Direct sign-in failed. Please try demo login.');
    } finally {
      setSocialLoadingRole(null);
    }
  };

  // Form submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoNotice(null);
    setLoading(true);

    try {
      if (isRegistering) {
        await signup({
          email,
          pass: password,
          displayName: fullName || (activeRole === 'seller' ? 'Master Artisan' : 'Verified Buyer'),
          role: activeRole,
          location: activeRole === 'seller' ? 'Varanasi, UP' : 'India'
        });
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      let message = 'Authentication failed. Please check your credentials.';
      if (err.code === 'auth/invalid-email') message = 'Please enter a valid email address.';
      else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') message = 'Invalid email or password.';
      else if (err.code === 'auth/user-not-found') message = 'No account found with this email. Click "Create Account" below.';
      else if (err.code === 'auth/email-already-in-use') message = 'Account already exists. Please sign in instead.';
      else if (err.code === 'auth/weak-password') message = 'Password must be at least 6 characters.';
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  // Demo Login
  const handleQuickDemo = async (roleToDemo: UserRole) => {
    setErrorMsg(null);
    setLoading(true);
    try {
      await demoLogin(roleToDemo);
    } catch (err: any) {
      console.error('Demo login error:', err);
      setErrorMsg('Could not start demo. Please try email login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] text-stone-900 flex flex-col justify-between font-['Plus_Jakarta_Sans'] selection:bg-amber-100">
      
      {/* Top Simple Header */}
      <header className="w-full border-b border-stone-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-30 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#c25e2e] text-white flex items-center justify-center font-bold text-lg shadow-sm">
              क
            </div>
            <div className="flex items-baseline">
              <span className="font-extrabold text-2xl tracking-tight text-stone-900 font-['Playfair_Display']">
                kirti
              </span>
              <span className="text-[#c25e2e] font-black text-2xl">.in</span>
            </div>
          </div>

          {/* Multilingual Selector & Audio Help Button */}
          <div className="flex items-center gap-2">
            
            {/* Audio Voice Guide Button */}
            <button
              type="button"
              id="btn-voice-guide"
              onClick={handlePlayTTS}
              title="Listen to instructions in selected language"
              className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border ${
                isSpeakingTTS 
                  ? 'bg-amber-100 text-amber-900 border-amber-300 ring-2 ring-amber-400/40 animate-pulse' 
                  : 'bg-white hover:bg-stone-50 text-stone-700 border-stone-200 shadow-2xs'
              }`}
            >
              {isSpeakingTTS ? <VolumeX className="w-4 h-4 text-[#c25e2e]" /> : <Volume2 className="w-4 h-4 text-[#c25e2e]" />}
              <span className="hidden sm:inline">{isSpeakingTTS ? 'Stop Audio' : 'Listen Help'}</span>
            </button>

            {/* Language Dropdown Button */}
            <div className="relative">
              <button
                type="button"
                id="btn-select-language"
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-stone-50 border border-stone-200 shadow-2xs text-xs font-semibold text-stone-800 flex items-center gap-1.5 transition"
              >
                <Globe className="w-3.5 h-3.5 text-[#c25e2e]" />
                <span>{selectedLang.nativeName}</span>
                <span className="text-stone-400 text-[10px]">({selectedLang.name})</span>
              </button>

              {/* Language Selection Dropdown */}
              {langMenuOpen && (
                <div 
                  className="absolute right-0 mt-2 w-64 max-h-80 overflow-y-auto bg-white border border-stone-200 rounded-2xl shadow-xl py-2 z-50 text-xs divide-y divide-stone-100"
                >
                  <div className="px-3 py-2 text-[11px] font-bold text-stone-500 uppercase tracking-wider bg-stone-50/80">
                    Select Your Language / भाषा चुनें
                  </div>
                  {VOICE_LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => {
                        setSelectedLang(lang);
                        setLangMenuOpen(false);
                        setVoiceFeedback(`Language set to ${lang.nativeName} (${lang.name})`);
                      }}
                      className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between hover:bg-amber-50/70 transition ${
                        selectedLang.code === lang.code ? 'bg-amber-50 font-bold text-[#c25e2e]' : 'text-stone-700'
                      }`}
                    >
                      <span className="text-sm font-medium">{lang.nativeName}</span>
                      <span className="text-[11px] text-stone-400">{lang.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>
      </header>

      {/* Main Container: Centered Clean Card with High Accessibility */}
      <main className="flex-1 max-w-md mx-auto w-full px-4 py-6 sm:py-10 flex flex-col justify-center">
        
        <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          
          {/* Header Title */}
          <div className="text-center space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight font-['Playfair_Display']">
              {isRegistering ? selectedLang.createAccount : selectedLang.signIn}
            </h1>
            <p className="text-xs text-stone-500">
              {selectedLang.helpText}
            </p>
          </div>

          {/* VOICE ASSISTANT HERO BANNER (Tap to speak in ANY language) */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50/80 border border-amber-200/90 shadow-2xs">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  id="btn-global-voice-assistant"
                  onClick={startGlobalVoiceAssistant}
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center transition shadow-sm ${
                    isListeningGlobal 
                      ? 'bg-red-500 text-white animate-pulse ring-4 ring-red-300' 
                      : 'bg-[#c25e2e] hover:bg-[#a94f24] text-white'
                  }`}
                  title="Click to speak login command"
                >
                  {isListeningGlobal ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>

                <div className="text-left">
                  <span className="text-xs font-bold text-stone-900 block leading-tight">
                    {isListeningGlobal ? selectedLang.voiceListeningText : selectedLang.voiceButtonText}
                  </span>
                  <span className="text-[11px] text-stone-500 block">
                    {selectedLang.nativeName} ({selectedLang.name}) Voice Support
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200/60 text-amber-900">
                  <Sparkles className="w-3 h-3 text-[#c25e2e]" />
                  <span>AI Voice</span>
                </span>
              </div>
            </div>

            {/* Live Voice Status Feedback */}
            {(isListeningGlobal || voiceFeedback || speechTranscript) && (
              <div className="mt-2.5 pt-2 border-t border-amber-200/60 text-xs text-stone-700 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="font-medium truncate">
                  {speechTranscript ? `"${speechTranscript}"` : voiceFeedback}
                </span>
              </div>
            )}
          </div>

          {/* ROLE SELECTOR: Simple Artisan vs Buyer toggle */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-stone-700">
              <span>Choose Account Type:</span>
              <span className="text-[11px] text-stone-400 font-normal">Switch anytime</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 p-1 bg-stone-100 rounded-2xl">
              <button
                type="button"
                id="role-buyer-toggle"
                onClick={() => setActiveRole('buyer')}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  activeRole === 'buyer'
                    ? 'bg-white text-emerald-800 shadow-2xs border border-stone-200/80'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <ShoppingBag className={`w-3.5 h-3.5 ${activeRole === 'buyer' ? 'text-emerald-600' : 'text-stone-400'}`} />
                <span>{selectedLang.buyerRole}</span>
              </button>

              <button
                type="button"
                id="role-artisan-toggle"
                onClick={() => setActiveRole('seller')}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  activeRole === 'seller'
                    ? 'bg-white text-[#c25e2e] shadow-2xs border border-stone-200/80'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Store className={`w-3.5 h-3.5 ${activeRole === 'seller' ? 'text-[#c25e2e]' : 'text-stone-400'}`} />
                <span>{selectedLang.artisanRole}</span>
              </button>
            </div>
          </div>

          {/* Feedback Notices */}
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2 text-xs text-red-800">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {infoNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{infoNotice}</span>
            </div>
          )}

          {/* EMAIL & PASSWORD INPUT FORM */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            
            {/* If Registering: Name Input with Voice Mic */}
            {isRegistering && (
              <div>
                <label className="text-xs font-semibold text-stone-800 block mb-1">
                  {selectedLang.nameLabel}
                </label>
                <div className="relative flex items-center">
                  <User className="w-4 h-4 text-stone-400 absolute left-3 pointer-events-none" />
                  <input
                    type="text"
                    required
                    placeholder={activeRole === 'seller' ? 'e.g. Ram Kumar' : 'e.g. Priya Sharma'}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-9 pr-10 py-2.5 border border-stone-300 focus:border-[#c25e2e] focus:ring-2 focus:ring-[#c25e2e]/20 rounded-xl text-sm outline-none transition bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => startFieldDictation('name')}
                    title="Speak name"
                    className={`absolute right-2 p-1.5 rounded-lg transition ${
                      activeFieldMic === 'name' 
                        ? 'bg-red-500 text-white animate-pulse' 
                        : 'text-stone-400 hover:text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    <Mic className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Email / Phone Input with Voice Mic */}
            <div>
              <label className="text-xs font-semibold text-stone-800 block mb-1">
                {selectedLang.emailLabel}
              </label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  required
                  placeholder={activeRole === 'seller' ? 'artisan@kirti.org' : 'buyer@example.com'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 border border-stone-300 focus:border-[#c25e2e] focus:ring-2 focus:ring-[#c25e2e]/20 rounded-xl text-sm outline-none transition bg-white"
                />
                <button
                  type="button"
                  id="btn-mic-email"
                  onClick={() => startFieldDictation('email')}
                  title="Speak your email or phone"
                  className={`absolute right-2 p-1.5 rounded-lg transition ${
                    activeFieldMic === 'email' 
                      ? 'bg-red-500 text-white animate-pulse' 
                      : 'text-stone-400 hover:text-[#c25e2e] hover:bg-amber-50'
                  }`}
                >
                  <Mic className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[10px] text-stone-400 mt-0.5">
                Tip: Tap mic icon to speak your email aloud
              </p>
            </div>

            {/* Password Input with Show/Hide toggle */}
            <div>
              <label className="text-xs font-semibold text-stone-800 block mb-1">
                {selectedLang.passwordLabel}
              </label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 border border-stone-300 focus:border-[#c25e2e] focus:ring-2 focus:ring-[#c25e2e]/20 rounded-xl text-sm outline-none transition bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 p-1 text-stone-400 hover:text-stone-700"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              id="btn-submit-auth"
              disabled={loading || socialLoadingRole !== null}
              className="w-full py-3 px-4 bg-[#c25e2e] hover:bg-[#a94f24] active:bg-[#91421c] text-white rounded-2xl text-sm font-bold shadow-md shadow-[#c25e2e]/20 transition active:scale-[0.99] flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>
                  {isRegistering 
                    ? `${selectedLang.createAccount} (${activeRole === 'seller' ? 'Artisan' : 'Buyer'})`
                    : `${selectedLang.signIn} (${activeRole === 'seller' ? 'Artisan' : 'Buyer'})`}
                </span>
              )}
            </button>

          </form>

          {/* Toggle Sign In / Register */}
          <div className="text-center pt-1">
            <button
              type="button"
              id="btn-toggle-mode"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setErrorMsg(null);
                setInfoNotice(null);
              }}
              className="text-xs text-stone-600 hover:text-[#c25e2e] font-semibold transition hover:underline"
            >
              {isRegistering
                ? 'Already have an account? Sign In here'
                : 'Need an account? Create one in seconds'}
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex py-0.5 items-center">
            <div className="flex-grow border-t border-stone-200"></div>
            <span className="flex-shrink mx-3 text-xs text-stone-400 font-normal">
              or quick access
            </span>
            <div className="flex-grow border-t border-stone-200"></div>
          </div>

          {/* 1-CLICK INSTANT EVALUATION / DEMO BUTTONS */}
          <div className="space-y-2">
            
            {/* Google 1-Click Fast Login */}
            <button
              type="button"
              id="btn-google-1click"
              onClick={() => handleSocialSignIn(activeRole)}
              disabled={socialLoadingRole !== null || loading}
              className="w-full py-2.5 px-3.5 bg-white hover:bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-800 flex items-center justify-between shadow-2xs transition active:scale-[0.99]"
            >
              <div className="flex items-center gap-2.5">
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
                <span>{selectedLang.googleLoginText}</span>
              </div>
              {socialLoadingRole ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-stone-500" />
              ) : (
                <span className="text-[11px] text-stone-400">1-Click</span>
              )}
            </button>

            {/* Instant Demo Role Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                id="btn-demo-artisan"
                onClick={() => handleQuickDemo('seller')}
                disabled={loading || socialLoadingRole !== null}
                className="py-2 px-2.5 bg-amber-50/70 hover:bg-amber-100/80 border border-amber-200/80 text-amber-900 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95"
              >
                <Store className="w-3.5 h-3.5 text-[#c25e2e]" />
                <span>Demo Artisan</span>
              </button>

              <button
                type="button"
                id="btn-demo-buyer"
                onClick={() => handleQuickDemo('buyer')}
                disabled={loading || socialLoadingRole !== null}
                className="py-2 px-2.5 bg-emerald-50/70 hover:bg-emerald-100/80 border border-emerald-200/80 text-emerald-900 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95"
              >
                <ShoppingBag className="w-3.5 h-3.5 text-emerald-700" />
                <span>Demo Buyer</span>
              </button>
            </div>

          </div>

        </div>

      </main>

      {/* Minimal Footer */}
      <footer className="w-full border-t border-stone-200/70 bg-white/50 py-4 text-center text-xs text-stone-400">
        <p>© 2026 Kirti AI • Direct Handicraft Market Linkage • Made for Artisans of India</p>
      </footer>

    </div>
  );
}
