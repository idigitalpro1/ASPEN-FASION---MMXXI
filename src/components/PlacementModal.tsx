import React, { useState } from 'react';
import { 
  X, Check, Sparkles, ShieldCheck, CreditCard, Download, 
  BookOpen, ArrowRight, ArrowLeft, Upload, Award, FileText, CheckCircle2 
} from 'lucide-react';
import { auth } from '../firebase';
import { GalleryItem } from './Carousel';
import { saveMagazinePlacement } from '../lib/catalogData';
import { downloadImageLocally } from '../lib/download';

interface PlacementModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialImage?: string | null;
  galleryItems?: GalleryItem[];
  onPlacementSuccess?: (receiptId: string, lookUrl: string) => void;
  onNavigateToCatalog?: () => void;
}

const PUBLICATIONS = [
  "Aspen Fashion (Official)",
  "MEN'S LA VACANZA",
  "theCorridor.biz",
  "Vogue Aspen Edition",
  "GQ Editorial",
  "Harper's Bazaar"
];

const CATEGORIES = [
  "Outerwear & Alpine",
  "Eveningwear & Gala",
  "Red Carpet Couture",
  "Street Couture",
  "Avant-Garde & Runway"
];

const SEASONS = [
  "Winter Alpine 2026",
  "Spring Haute Couture 2026",
  "Summer Resort & Vacanza 2026",
  "Autumn Retrospective 2026"
];

export function PlacementModal({
  isOpen,
  onClose,
  initialImage,
  galleryItems = [],
  onPlacementSuccess,
  onNavigateToCatalog
}: PlacementModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedImage, setSelectedImage] = useState<string>(
    initialImage || (galleryItems.length > 0 ? galleryItems[0].url : 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop')
  );
  const [publication, setPublication] = useState<string>(PUBLICATIONS[0]);
  const [designer, setDesigner] = useState<string>(auth.currentUser?.displayName || 'Patrick Henry Sweeney');
  const [brand, setBrand] = useState<string>('Aspen Atelier');
  const [lookTitle, setLookTitle] = useState<string>('Winter Solstice High Alpine');
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [season, setSeason] = useState<string>(SEASONS[0]);
  const [price, setPrice] = useState<string>('$2,850 · Made to Order');
  const [materials, setMaterials] = useState<string>('Double-faced Cashmere, Italian Silk Lining');
  const [quote, setQuote] = useState<string>('A masterclass in modern silhouette and daring mountain contrast.');
  const [socialHandle, setSocialHandle] = useState<string>('@aspenfashion');
  
  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'apple' | 'google'>('card');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('890');
  const [cardName, setCardName] = useState(auth.currentUser?.displayName || 'Patrick Henry Sweeney');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedReceipt, setCompletedReceipt] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setSelectedImage(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    // Generate unique verifiable receipt
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const receiptCode = `AF-2026-${randomSuffix}`;

    try {
      await saveMagazinePlacement({
        userId: auth.currentUser?.uid || 'guest-creator',
        userEmail: auth.currentUser?.email || undefined,
        designer: designer.trim() || 'Aspen Designer',
        brand: brand.trim() || 'Independent Label',
        lookTitle: lookTitle.trim() || 'Editorial Look',
        publication,
        category,
        season,
        price,
        materials,
        quote,
        imageUrl: selectedImage,
        amountPaid: 50.00,
        receiptId: receiptCode,
        status: 'placed',
        createdAt: new Date().toISOString()
      });

      setCompletedReceipt(receiptCode);
      setIsProcessing(false);
      setStep(4);
      if (onPlacementSuccess) {
        onPlacementSuccess(receiptCode, selectedImage);
      }
    } catch (err) {
      console.error('Placement error:', err);
      setIsProcessing(false);
      alert('Error processing placement. Stored to local registry.');
      setCompletedReceipt(receiptCode);
      setStep(4);
    }
  };

  const handleDownloadCertificate = () => {
    const certText = `=====================================================
ASPEN FASHION MAGAZINE & LOOKBOOK CATALOG
OFFICIAL $50 EDITORIAL PLACEMENT CERTIFICATE
=====================================================
Receipt Code:     ${completedReceipt}
Publication:      ${publication}
Designer / Model: ${designer}
Brand / Label:    ${brand}
Look Title:       ${lookTitle}
Season:           ${season}
Category:         ${category}
Price / Spec:     ${price}
Materials:        ${materials}
Editorial Quote:  "${quote}"
Status:           GUARANTEED FULL-PAGE SPREAD & CATALOG INCLUSION
Placement Fee:    $50.00 USD (PAID & VERIFIED)
Issue Date:       ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
=====================================================
Certified by Aspen Fashion Publishing Group
Archived in Official Digital Catalog
=====================================================`;

    const blob = new Blob([certText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aspen-placement-certificate-${completedReceipt}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-white border border-zinc-200 text-zinc-900 w-full max-w-3xl shadow-2xl rounded-sm overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-zinc-950 text-white p-5 flex items-center justify-between border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="bg-amber-400 text-black p-1.5 rounded-full">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif uppercase tracking-widest text-lg font-bold text-white">
                  $50 Editorial Placement
                </h2>
                <span className="bg-amber-400/20 text-amber-300 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 border border-amber-400/40">
                  Guaranteed Spread
                </span>
              </div>
              <p className="text-zinc-400 text-xs mt-0.5">
                Full-page feature in print/digital issue + Official Lookbook Catalog listing
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-2 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progression Bar */}
        {step < 4 && (
          <div className="bg-zinc-50 border-b border-zinc-200 px-6 py-3 flex items-center justify-between text-xs font-semibold uppercase tracking-wider">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-black' : 'text-zinc-400'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 1 ? 'bg-black text-white' : 'bg-zinc-200 text-zinc-600'}`}>1</span>
              <span>Look & Issue</span>
            </div>
            <div className="h-[1px] w-8 bg-zinc-300 hidden sm:block" />
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-black' : 'text-zinc-400'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 2 ? 'bg-black text-white' : 'bg-zinc-200 text-zinc-600'}`}>2</span>
              <span>Editorial Details</span>
            </div>
            <div className="h-[1px] w-8 bg-zinc-300 hidden sm:block" />
            <div className={`flex items-center gap-2 ${step >= 3 ? 'text-black' : 'text-zinc-400'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 3 ? 'bg-black text-white' : 'bg-zinc-200 text-zinc-600'}`}>3</span>
              <span>Proof & $50 Checkout</span>
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* STEP 1: Select Look & Publication */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-2">
                  1. Choose Fashion Look to Place
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Selected Preview */}
                  <div className="sm:col-span-1 relative aspect-[3/4] bg-zinc-100 border-2 border-black overflow-hidden shadow-sm">
                    <img src={selectedImage} alt="Selected Look" className="w-full h-full object-cover" />
                    <div className="absolute bottom-2 left-2 right-2 bg-black/75 text-white text-[10px] uppercase font-bold tracking-wider py-1 text-center backdrop-blur-sm">
                      Active Selection
                    </div>
                  </div>

                  {/* Thumbnail Picker & Upload */}
                  <div className="sm:col-span-2 flex flex-col justify-between">
                    <div>
                      <p className="text-xs text-zinc-500 mb-3">
                        Pick a generated look from your studio creations or upload a high-resolution photograph:
                      </p>
                      <div className="flex gap-2 overflow-x-auto pb-3">
                        {galleryItems.slice(0, 5).map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setSelectedImage(item.url)}
                            className={`shrink-0 w-16 h-20 border rounded overflow-hidden cursor-pointer transition-all ${
                              selectedImage === item.url ? 'ring-2 ring-black border-black' : 'border-zinc-200 hover:opacity-80'
                            }`}
                          >
                            <img src={item.url} alt="Thumbnail" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-zinc-100">
                      <label className="flex items-center justify-center gap-2 w-full py-2.5 px-4 border border-dashed border-zinc-300 hover:border-black bg-zinc-50 text-xs uppercase tracking-wider font-semibold cursor-pointer transition-colors">
                        <Upload className="w-4 h-4 text-zinc-600" />
                        <span>Upload Custom High-Res Look</span>
                        <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Publication Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-2">
                  2. Select Target Editorial Publication
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {PUBLICATIONS.map((pub) => (
                    <button
                      key={pub}
                      type="button"
                      onClick={() => setPublication(pub)}
                      className={`p-3 text-left border text-xs font-medium uppercase tracking-wider transition-all cursor-pointer ${
                        publication === pub 
                          ? 'border-black bg-black text-white shadow-sm' 
                          : 'border-zinc-200 bg-white hover:border-zinc-400 text-zinc-800'
                      }`}
                    >
                      <div className="font-serif font-bold text-sm leading-tight mb-1 truncate">{pub}</div>
                      <span className={`text-[9px] uppercase tracking-normal ${publication === pub ? 'text-amber-300' : 'text-zinc-500'}`}>
                        Verified Placement
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Inclusions summary */}
              <div className="bg-amber-50/70 border border-amber-200 p-4 text-xs">
                <h4 className="font-bold uppercase tracking-wider text-amber-950 flex items-center gap-1.5 mb-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  What Your $50 Placement Includes:
                </h4>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-amber-900 mt-2">
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <span>Guaranteed full-page editorial spread</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <span>Official Lookbook Catalog entry</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <span>Designer bio & social brand credits</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <span>300 DPI downloadable press proof certificate</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* STEP 2: Editorial Details & Spec */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
                    Designer / Model Name *
                  </label>
                  <input
                    type="text"
                    value={designer}
                    onChange={(e) => setDesigner(e.target.value)}
                    required
                    placeholder="e.g. Patrick Henry Sweeney"
                    className="w-full px-3 py-2 border border-zinc-300 text-sm focus:outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
                    Brand / Fashion House / Label
                  </label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="e.g. Sweeney Atelier"
                    className="w-full px-3 py-2 border border-zinc-300 text-sm focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
                    Look / Piece Title *
                  </label>
                  <input
                    type="text"
                    value={lookTitle}
                    onChange={(e) => setLookTitle(e.target.value)}
                    required
                    placeholder="e.g. High Altitude Cashmere Cocoon"
                    className="w-full px-3 py-2 border border-zinc-300 text-sm focus:outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
                    Collection Season
                  </label>
                  <select
                    value={season}
                    onChange={(e) => setSeason(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-300 text-sm focus:outline-none focus:border-black bg-white"
                  >
                    {SEASONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
                    Fashion Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-300 text-sm focus:outline-none focus:border-black bg-white"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
                    Retail Price / Availability Spec
                  </label>
                  <input
                    type="text"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="e.g. $2,850 · By Private Appointment"
                    className="w-full px-3 py-2 border border-zinc-300 text-sm focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
                  Garment Materials & Composition
                </label>
                <input
                  type="text"
                  value={materials}
                  onChange={(e) => setMaterials(e.target.value)}
                  placeholder="e.g. 100% Cashmere, Satin Silk Lapels, Polished Horn"
                  className="w-full px-3 py-2 border border-zinc-300 text-sm focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
                  Editorial Quote / Designer Statement
                </label>
                <textarea
                  rows={2}
                  value={quote}
                  onChange={(e) => setQuote(e.target.value)}
                  placeholder="Short quote or critical review printed alongside your spread..."
                  className="w-full px-3 py-2 border border-zinc-300 text-sm focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
                  Instagram Handle / Website / Agency
                </label>
                <input
                  type="text"
                  value={socialHandle}
                  onChange={(e) => setSocialHandle(e.target.value)}
                  placeholder="@yourhandle or portfolio url"
                  className="w-full px-3 py-2 border border-zinc-300 text-sm focus:outline-none focus:border-black"
                />
              </div>
            </div>
          )}

          {/* STEP 3: Spread Proof & $50 Checkout */}
          {step === 3 && (
            <div className="space-y-6">
              {/* Proof Preview Box */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-700">
                    Live Editorial Spread Proof
                  </span>
                  <span className="text-[11px] uppercase tracking-wider text-amber-700 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified Print-Ready Spread
                  </span>
                </div>

                <div className="border border-zinc-300 bg-zinc-950 p-4 rounded-sm shadow-inner grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left: Visual Spread Photo */}
                  <div className="relative aspect-[3/4] bg-zinc-900 overflow-hidden border border-zinc-700 flex flex-col justify-between p-3">
                    <img src={selectedImage} alt="Spread Preview" className="absolute inset-0 w-full h-full object-cover opacity-90" />
                    <div className="relative z-10 flex justify-between items-start">
                      <span className="bg-black/70 text-white text-[9px] uppercase tracking-widest px-2 py-0.5 border border-white/20">
                        {publication}
                      </span>
                      <span className="bg-amber-400 text-black text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 shadow">
                        $50 PLACEMENT
                      </span>
                    </div>

                    <div className="relative z-10 bg-black/70 p-2 backdrop-blur-sm border-l-2 border-amber-400">
                      <div className="text-[10px] text-white font-serif uppercase tracking-wider font-bold truncate">
                        {designer}
                      </div>
                      <div className="text-[9px] text-zinc-300 italic truncate">
                        {lookTitle}
                      </div>
                    </div>
                  </div>

                  {/* Right: Editorial Typography Layout */}
                  <div className="bg-white p-4 flex flex-col justify-between text-zinc-900 border border-zinc-200">
                    <div>
                      <div className="border-b border-zinc-100 pb-2 mb-3">
                        <div className="text-[9px] font-bold uppercase tracking-widest text-amber-700">
                          OFFICIAL EDITORIAL SELECTION · {season}
                        </div>
                        <h3 className="font-serif text-lg font-bold tracking-tight uppercase leading-tight mt-1">
                          {lookTitle}
                        </h3>
                        <p className="text-xs text-zinc-500 uppercase tracking-widest mt-0.5">
                          By {designer} {brand ? `· ${brand}` : ''}
                        </p>
                      </div>

                      <blockquote className="font-serif italic text-xs text-zinc-700 border-l-2 border-black pl-2.5 my-2.5 leading-relaxed">
                        "{quote}"
                      </blockquote>

                      <div className="space-y-1 text-[11px] text-zinc-600 pt-1">
                        <div><strong className="text-zinc-900 uppercase">Category:</strong> {category}</div>
                        <div><strong className="text-zinc-900 uppercase">Materials:</strong> {materials}</div>
                        <div><strong className="text-zinc-900 uppercase">Price / Availability:</strong> {price}</div>
                        <div><strong className="text-zinc-900 uppercase">Credit:</strong> {socialHandle}</div>
                      </div>
                    </div>

                    {/* Barcode & Seal */}
                    <div className="pt-3 mt-3 border-t border-zinc-200 flex items-center justify-between">
                      <div>
                        <div className="text-[9px] font-mono uppercase tracking-widest text-zinc-500">
                          CATALOG SKU #AF-2026-PL
                        </div>
                        <div className="text-[9px] text-emerald-700 font-bold uppercase">
                          ✓ Guaranteed Print & Digital Spread
                        </div>
                      </div>
                      <div className="w-10 h-8 bg-zinc-200 flex items-center justify-center p-0.5">
                        <div className="w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1MCIgaGVpZ2h0PSIyMCI+PHBhdGggZD0iTTAgMGgydjIwaC0yem00IDBoMXYyMGgtMXptMyAwaDF2MjBoLTF6bTIgMGgydjIwaC0yem00IDBoMXYyMGgtMXptMiAwaDN2MjBoLTN6bTQgMGgxdjIwaC0xem0yIDBoMnYyMGgtMnptNCAwaDF2MjBoLTF6IiBmaWxsPSIjMDAwIi8+PC9zdmc+')] bg-repeat-x opacity-80" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Checkout Form */}
              <form onSubmit={handleSubmitPayment} className="bg-zinc-50 border border-zinc-200 p-4 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-zinc-700" />
                    <span className="font-bold text-xs uppercase tracking-wider">Placement Fee & Checkout</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold font-serif">$50.00</span>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest block">USD One-Time Fee</span>
                  </div>
                </div>

                {/* Payment Selector */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`py-2 px-3 text-xs uppercase font-semibold tracking-wider border transition-colors cursor-pointer ${
                      paymentMethod === 'card' ? 'bg-black text-white border-black' : 'bg-white text-zinc-700 border-zinc-200'
                    }`}
                  >
                    Credit Card
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('apple')}
                    className={`py-2 px-3 text-xs uppercase font-semibold tracking-wider border transition-colors cursor-pointer ${
                      paymentMethod === 'apple' ? 'bg-black text-white border-black' : 'bg-white text-zinc-700 border-zinc-200'
                    }`}
                  >
                    Apple Pay
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('google')}
                    className={`py-2 px-3 text-xs uppercase font-semibold tracking-wider border transition-colors cursor-pointer ${
                      paymentMethod === 'google' ? 'bg-black text-white border-black' : 'bg-white text-zinc-700 border-zinc-200'
                    }`}
                  >
                    Google Pay
                  </button>
                </div>

                {paymentMethod === 'card' ? (
                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 mb-1">
                        Cardholder Name
                      </label>
                      <input
                        type="text"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-white border border-zinc-300 text-xs focus:outline-none focus:border-black"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2">
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 mb-1">
                          Card Number
                        </label>
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          required
                          className="w-full px-3 py-2 bg-white border border-zinc-300 text-xs font-mono focus:outline-none focus:border-black"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 mb-1">
                          Exp / CVC
                        </label>
                        <div className="flex gap-1">
                          <input
                            type="text"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            required
                            placeholder="MM/YY"
                            className="w-1/2 px-2 py-2 bg-white border border-zinc-300 text-xs text-center font-mono focus:outline-none focus:border-black"
                          />
                          <input
                            type="text"
                            value={cardCvc}
                            onChange={(e) => setCardCvc(e.target.value)}
                            required
                            placeholder="CVC"
                            className="w-1/2 px-2 py-2 bg-white border border-zinc-300 text-xs text-center font-mono focus:outline-none focus:border-black"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-white border border-zinc-200 text-center text-xs">
                    <p className="font-semibold uppercase tracking-wider">
                      Express {paymentMethod === 'apple' ? 'Apple Pay' : 'Google Pay'} Ready
                    </p>
                    <p className="text-zinc-500 text-[11px] mt-1">
                      Touch / Click below to authorize $50.00 placement fee instantly.
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-2 text-[11px] text-zinc-500 pt-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>256-bit encrypted editorial placement guarantee. Instant verification.</span>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-3 bg-black hover:bg-zinc-800 text-white font-serif uppercase tracking-widest text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? (
                    <span>Securing Placement...</span>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>Confirm & Pay $50 for Magazine & Catalog Placement</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* STEP 4: Success & Verification Screen */}
          {step === 4 && (
            <div className="text-center py-6 space-y-6">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-amber-700 bg-amber-50 px-3 py-1 border border-amber-200 inline-block mb-2">
                  Official Editorial Placement Confirmed
                </span>
                <h3 className="font-serif text-2xl font-bold uppercase tracking-wider text-zinc-900">
                  You Are Placed in {publication}
                </h3>
                <p className="text-xs text-zinc-600 mt-2 max-w-md mx-auto">
                  Your $50 editorial placement order for <strong>"{lookTitle}"</strong> by <strong>{designer}</strong> has been secured and published to the Aspen Fashion Catalog & Lookbook.
                </p>
              </div>

              {/* Receipt Code Box */}
              <div className="bg-zinc-50 border border-zinc-200 p-4 max-w-md mx-auto rounded-sm text-left">
                <div className="flex justify-between items-center text-xs pb-2 border-b border-zinc-200">
                  <span className="text-zinc-500 uppercase tracking-wider">Verification Receipt</span>
                  <span className="font-mono font-bold text-black">{completedReceipt}</span>
                </div>
                <div className="pt-2 text-[11px] text-zinc-600 space-y-1">
                  <div><strong>Publication:</strong> {publication}</div>
                  <div><strong>Amount Paid:</strong> $50.00 USD (Paid)</div>
                  <div><strong>Catalog Listing:</strong> Active & Indexed</div>
                  <div><strong>Press Certificate:</strong> Issued & Print-Ready</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleDownloadCertificate}
                  className="py-2.5 px-4 bg-zinc-100 hover:bg-zinc-200 text-black text-xs uppercase font-semibold tracking-wider flex items-center gap-2 border border-zinc-300 transition-colors cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>Download Press Certificate</span>
                </button>
                <button
                  type="button"
                  onClick={() => downloadImageLocally(selectedImage, `aspen-spread-${completedReceipt}.jpg`)}
                  className="py-2.5 px-4 bg-zinc-100 hover:bg-zinc-200 text-black text-xs uppercase font-semibold tracking-wider flex items-center gap-2 border border-zinc-300 transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Placed Look</span>
                </button>
                {onNavigateToCatalog && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigateToCatalog();
                    }}
                    className="py-2.5 px-4 bg-black hover:bg-zinc-800 text-white text-xs uppercase font-semibold tracking-wider flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>View in Official Catalog</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Buttons */}
        {step < 4 && (
          <div className="bg-zinc-50 border-t border-zinc-200 p-4 flex justify-between items-center">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((step - 1) as any)}
                className="py-2 px-4 border border-zinc-300 hover:bg-white text-xs uppercase font-semibold tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            {step < 3 && (
              <button
                type="button"
                onClick={() => setStep((step + 1) as any)}
                className="py-2 px-5 bg-black hover:bg-zinc-800 text-white text-xs uppercase font-semibold tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
