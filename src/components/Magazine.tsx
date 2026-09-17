import { useRef, useState, useEffect } from 'react';
import { 
  Download, Share2, Save, Loader2, Check, Image as ImageIcon, 
  Award, Sparkles, BookOpen, Layers, ShieldCheck, FileText, ExternalLink,
  RefreshCw
} from 'lucide-react';
import { toPng } from 'html-to-image';
import { saveCreation } from '../lib/db';
import { downloadImageLocally } from '../lib/download';
import { getLocalPlacements } from '../lib/catalogData';
import { MagazinePlacement } from '../types';
import { GalleryItem } from './Carousel';

const MAGAZINES = [
  "MEN'S LA VACANZA",
  "ASPEN FASHION",
  "HOTEL JEROME CHRONICLE",
  "MONTE CARLO CASINO REVIEW",
  "MASQUERADE GALA COUTURE",
  "MARDI GRAS CARNIVALE",
  "COLORADO 14ERS SUMMIT",
  "VOGUE",
  "HARPER'S BAZAAR",
  "ELLE",
  "GQ",
  "FLEURISH MAGAZINE",
  "THE COLORADO STATESMAN",
  "THE VILLAGER",
  "WEEKLY REGISTER-CALL",
  "theCorridor.biz"
];

export function Magazine({ 
  generatedImage, 
  coverQuote,
  items = [],
  onOpenPlacementModal,
  onNavigateToCatalog,
  onRemix
}: { 
  generatedImage: string | null; 
  coverQuote?: string | null;
  items?: GalleryItem[];
  onOpenPlacementModal?: (imageUrl?: string) => void;
  onNavigateToCatalog?: () => void;
  onRemix?: (url: string) => void;
}) {
  const coverRef = useRef<HTMLDivElement>(null);
  const spreadRef = useRef<HTMLDivElement>(null);
  const [selectedMagazine, setSelectedMagazine] = useState(MAGAZINES[0]);
  const [selectedLook, setSelectedLook] = useState<string | null>(generatedImage || (items.length > 0 ? items[0].url : null));
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);
  
  // View mode: cover, 2-page spread, or placement history
  const [viewMode, setViewMode] = useState<'cover' | 'spread' | 'placements'>('cover');
  const [showPlacementSeal, setShowPlacementSeal] = useState(true);
  const [userPlacements, setUserPlacements] = useState<MagazinePlacement[]>([]);

  useEffect(() => {
    setUserPlacements(getLocalPlacements());
    const handlePlacementsUpdate = () => {
      setUserPlacements(getLocalPlacements());
    };
    window.addEventListener('placements-updated', handlePlacementsUpdate);
    return () => window.removeEventListener('placements-updated', handlePlacementsUpdate);
  }, []);

  useEffect(() => {
    if (generatedImage) {
      setSelectedLook(generatedImage);
    } else if (!selectedLook && items.length > 0) {
      setSelectedLook(items[0].url);
    }
  }, [generatedImage, items]);

  const currentImage = selectedLook || generatedImage || (items.length > 0 ? items[0].url : null);

  const handleDownloadImage = async (urlToDownload?: string, customName?: string) => {
    const targetUrl = urlToDownload || currentImage;
    if (!targetUrl) return;
    setIsDownloading(true);
    setDownloadNotice("Downloading generated fashion image locally...");
    const fileName = customName || `${selectedMagazine.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-fashion-look.jpg`;
    const ok = await downloadImageLocally(targetUrl, fileName);
    setIsDownloading(false);
    if (ok) {
      setDownloadNotice(`Saved ${fileName} locally!`);
      setTimeout(() => setDownloadNotice(null), 3500);
    }
  };

  const handleDownloadCover = async () => {
    if (!coverRef.current || !currentImage) return;
    setIsDownloading(true);
    setDownloadNotice("Rendering and downloading magazine cover...");
    try {
      const dataUrl = await toPng(coverRef.current, { quality: 0.95 });
      const fileName = `${selectedMagazine.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-cover.png`;
      const ok = await downloadImageLocally(dataUrl, fileName);
      if (ok) {
        setDownloadNotice(`Saved ${fileName} locally!`);
        setTimeout(() => setDownloadNotice(null), 3500);
      }
    } catch (error) {
      console.error('Error downloading magazine cover:', error);
      alert('Could not render cover canvas. Downloading the fashion image directly instead.');
      handleDownloadImage();
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSaveToGallery = async () => {
    if (!coverRef.current) return;
    setIsSaving(true);
    try {
      const dataUrl = await toPng(coverRef.current);
      await saveCreation('magazine', dataUrl, coverQuote || undefined);
      setDownloadNotice('Cover saved to your gallery!');
      setTimeout(() => setDownloadNotice(null), 3500);
    } catch (error) {
      console.error('Error saving to gallery:', error);
      alert('Failed to save to gallery.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = async () => {
    if (!coverRef.current) return;
    if (navigator.share) {
      try {
        const dataUrl = await toPng(coverRef.current);
        const base64Data = dataUrl.split(',')[1];
        const mimeType = dataUrl.split(',')[0].split(':')[1].split(';')[0];
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mimeType });
        
        const file = new File([blob], 'cover.png', { type: 'image/png' });
        await navigator.share({
          title: `${selectedMagazine} Cover`,
          text: `Check out my ${selectedMagazine} magazine cover!`,
          files: [file]
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      alert('Sharing not supported on this browser.');
    }
  };

  const renderCoverContent = () => {
    if (selectedMagazine === 'VOGUE') {
      return (
        <>
          {/* Vogue Masthead */}
          <div className="absolute top-8 left-0 right-0 flex flex-col items-center justify-center z-10">
            <h1 className="text-[8rem] md:text-[10rem] font-serif text-white tracking-widest font-normal opacity-90 leading-none" style={{ fontFamily: '"Playfair Display", Didot, serif', textShadow: '0 4px 20px rgba(0,0,0,0.5)', textAlign: 'center', width: '100%' }}>
              VOGUE
            </h1>
            <p className="text-white" style={{ textAlign: 'center', fontSize: 'small', width: '100%' }}>BY PATRICK HENRY SWEENEY</p>
          </div>
          
          {/* Vogue Left Articles */}
          <div className="absolute top-1/3 left-8 z-10 flex flex-col gap-8 max-w-[200px]">
            <div>
              <h3 className="text-white font-sans font-bold text-xl tracking-widest mb-1" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>THE NEW<br/>AVANT-GARDE</h3>
              <p className="text-white/90 font-serif text-sm italic" style={{ textShadow: '0 1px 5px rgba(0,0,0,0.8)' }}>Redefining luxury for the modern era</p>
            </div>
            <div>
              <h3 className="text-white font-sans font-bold text-xl tracking-widest mb-1" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>BEAUTY<br/>SECRETS</h3>
              <p className="text-white/90 font-serif text-sm italic" style={{ textShadow: '0 1px 5px rgba(0,0,0,0.8)' }}>From the runway to your routine</p>
            </div>
          </div>

          {/* Vogue Right Articles */}
          <div className="absolute top-1/2 right-8 z-10 flex flex-col gap-8 max-w-[180px] text-right">
            <div>
              <h3 className="text-red-500 font-sans font-bold text-lg tracking-widest mb-1" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>EXCLUSIVE</h3>
              <p className="text-white/90 font-serif text-sm italic" style={{ textShadow: '0 1px 5px rgba(0,0,0,0.8)' }}>An intimate look at the season's boldest trends</p>
            </div>
          </div>

          {/* Vogue Quote */}
          <div className="absolute bottom-12 left-8 right-8 z-10 text-center">
            <p className="text-white font-serif text-lg md:text-xl leading-snug italic" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
              {coverQuote || '"A very formal classic enthusiast of Versace, Hugo Boss, Armani, and Louis Vuitton, and an Asian-made critic of high distinction."'}
            </p>
          </div>
        </>
      );
    }

    if (selectedMagazine === "HARPER'S BAZAAR") {
      return (
        <>
          {/* Bazaar Masthead */}
          <div className="absolute top-6 left-0 right-0 flex flex-col items-center z-10">
            <span className="text-white font-serif text-2xl italic tracking-widest mb-[-1rem] z-20" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>Harper's</span>
            <h1 className="text-[5.5rem] md:text-[7.5rem] font-serif text-white tracking-tighter font-bold uppercase leading-none" style={{ fontFamily: '"Playfair Display", Didot, serif', textShadow: '0 4px 20px rgba(0,0,0,0.5)', textAlign: 'center', width: '100%' }}>
              BAZAAR
            </h1>
            <p className="text-white" style={{ textAlign: 'center', fontSize: 'small', width: '100%' }}>BY PATRICK HENRY SWEENEY</p>
          </div>

          {/* Bazaar Left Articles */}
          <div className="absolute top-1/3 left-6 z-10 flex flex-col gap-6 max-w-[220px]">
            <div className="border-l-2 border-white pl-4">
              <h3 className="text-white font-serif text-2xl uppercase tracking-widest leading-tight mb-2" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>Fabulous<br/><span className="italic font-normal text-yellow-300">at Every Age</span></h3>
              <p className="text-white/80 font-sans text-xs uppercase tracking-widest" style={{ textShadow: '0 1px 5px rgba(0,0,0,0.8)' }}>The ultimate style guide</p>
            </div>
            <div className="border-l-2 border-white pl-4">
              <h3 className="text-white font-serif text-xl uppercase tracking-widest leading-tight mb-2" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>The<br/><span className="italic font-normal">New</span><br/>Elegance</h3>
            </div>
          </div>

          {/* Bazaar Right Articles */}
          <div className="absolute bottom-1/3 right-6 z-10 flex flex-col gap-6 max-w-[200px] text-right">
             <div className="border-r-2 border-white pr-4">
              <h3 className="text-white font-serif text-2xl uppercase tracking-widest leading-tight mb-2" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>Spring<br/><span className="italic font-normal text-yellow-300">Fashion</span></h3>
              <p className="text-white/80 font-sans text-xs uppercase tracking-widest" style={{ textShadow: '0 1px 5px rgba(0,0,0,0.8)' }}>100+ Looks to love</p>
            </div>
          </div>

          {/* Bazaar Quote */}
          <div className="absolute bottom-8 left-8 right-8 z-10 bg-white/10 backdrop-blur-md p-4 border border-white/20">
            <p className="text-white font-serif text-sm md:text-base leading-snug text-center uppercase tracking-widest" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
              {coverQuote || 'A very formal classic enthusiast of Versace, Hugo Boss, Armani, and Louis Vuitton, and an Asian-made critic of high distinction.'}
            </p>
          </div>
        </>
      );
    }

    if (selectedMagazine === 'ELLE') {
      return (
        <>
          {/* Elle Masthead */}
          <div className="absolute top-8 left-0 right-0 flex flex-col items-center justify-center z-10">
            <h1 className="text-[7rem] md:text-[9rem] font-sans text-white tracking-tighter font-black leading-none" style={{ textShadow: '0 4px 20px rgba(0,0,0,0.5)', textAlign: 'center', width: '100%' }}>
              ELLE
            </h1>
            <p className="text-white" style={{ textAlign: 'center', fontSize: 'small', width: '100%' }}>BY PATRICK HENRY SWEENEY</p>
          </div>

          {/* Elle Right Articles */}
          <div className="absolute top-12 right-8 z-10 flex flex-col gap-6 max-w-[180px] text-right">
            <div>
              <div className="bg-pink-500 text-white text-xs font-bold px-2 py-1 inline-block mb-2 uppercase tracking-widest shadow-lg">Exclusive</div>
              <h3 className="text-white font-sans font-black text-xl uppercase leading-none mb-1" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>Meet The<br/>New Icon</h3>
            </div>
          </div>

          {/* Elle Left Articles */}
          <div className="absolute bottom-1/3 left-8 z-10 flex flex-col gap-8 max-w-[250px]">
            <div>
              <h3 className="text-pink-400 font-sans font-black text-3xl uppercase leading-none mb-2" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>Style<br/>Reboot</h3>
              <p className="text-white font-sans font-bold text-sm uppercase tracking-wider" style={{ textShadow: '0 1px 5px rgba(0,0,0,0.8)' }}>What to wear right now</p>
            </div>
            <div>
              <h3 className="text-white font-sans font-black text-2xl uppercase leading-none mb-2" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>Beauty<br/>Rules</h3>
              <p className="text-yellow-300 font-sans font-bold text-sm uppercase tracking-wider" style={{ textShadow: '0 1px 5px rgba(0,0,0,0.8)' }}>To break this season</p>
            </div>
          </div>

          {/* Elle Quote */}
          <div className="absolute bottom-12 left-8 right-8 z-10">
            <div className="bg-pink-500 w-12 h-2 mb-4 shadow-lg"></div>
            <p className="text-white font-sans font-bold text-lg md:text-xl leading-tight uppercase" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
              {coverQuote || 'A very formal classic enthusiast of Versace, Hugo Boss, Armani, and Louis Vuitton, and an Asian-made critic of high distinction.'}
            </p>
          </div>
        </>
      );
    }

    // Default Layout (Aspen Fashion, GQ, etc.)
    const renderDefaultMasthead = () => {
      if (selectedMagazine === 'ASPEN FASHION') {
        return (
          <>
            <h1 className="text-7xl md:text-[8rem] font-serif text-white tracking-tighter font-bold opacity-100 leading-[0.8]" style={{ textShadow: '0 10px 30px rgba(0,0,0,0.9), 0 2px 10px rgba(0,0,0,0.8)', textAlign: 'center', width: '100%' }}>
              ASPEN
            </h1>
            <p className="text-white" style={{ textAlign: 'center', fontSize: 'small', width: '100%' }}>BY PATRICK HENRY SWEENEY</p>
            <div className="flex items-center gap-4 mt-4">
              <div className="h-[3px] flex-1 bg-white/80 shadow-lg" />
              <h2 className="text-4xl md:text-5xl font-serif text-white tracking-[0.5em] uppercase font-bold" style={{ textShadow: '0 4px 15px rgba(0,0,0,0.9)' }}>
                FASHION
              </h2>
              <div className="h-[3px] flex-1 bg-white/80 shadow-lg" />
            </div>
          </>
        );
      }

      if (selectedMagazine === 'GQ') {
        return (
          <>
          <h1 className="text-[8rem] md:text-[10rem] font-serif text-white tracking-tighter font-bold opacity-100 leading-[0.8]" style={{ textShadow: '0 10px 30px rgba(0,0,0,0.9), 0 2px 10px rgba(0,0,0,0.8)', textAlign: 'center', width: '100%' }}>
            {selectedMagazine}
          </h1>
          <p className="text-white" style={{ textAlign: 'center', fontSize: 'small', width: '100%' }}>BY PATRICK HENRY SWEENEY</p>
          </>
        );
      }

      if (selectedMagazine === 'theCorridor.biz') {
        return (
          <>
          <h1 className="text-5xl md:text-7xl font-sans text-white tracking-tight font-bold opacity-100 leading-[0.8]" style={{ textShadow: '0 10px 30px rgba(0,0,0,0.9), 0 2px 10px rgba(0,0,0,0.8)', textAlign: 'center', width: '100%' }}>
            {selectedMagazine}
          </h1>
          <p className="text-white" style={{ textAlign: 'center', fontSize: 'small', width: '100%' }}>BY PATRICK HENRY SWEENEY</p>
          </>
        );
      }

      const words = selectedMagazine.split(' ');
      if (words.length > 1) {
        const lastWord = words.pop();
        const firstPart = words.join(' ');
        return (
          <>
            <h1 className="text-5xl md:text-7xl font-serif text-white tracking-tighter font-bold opacity-100 leading-[0.9]" style={{ textShadow: '0 10px 30px rgba(0,0,0,0.9), 0 2px 10px rgba(0,0,0,0.8)', textAlign: 'center', width: '100%' }}>
              {firstPart}
            </h1>
            <p className="text-white" style={{ textAlign: 'center', fontSize: 'small', width: '100%' }}>BY PATRICK HENRY SWEENEY</p>
            <div className="flex items-center gap-4 mt-4">
              <div className="h-[3px] flex-1 bg-white/80 shadow-lg" />
              <h2 className="text-3xl md:text-4xl font-serif text-white tracking-[0.3em] uppercase font-bold" style={{ textShadow: '0 4px 15px rgba(0,0,0,0.9)' }}>
                {lastWord}
              </h2>
              <div className="h-[3px] flex-1 bg-white/80 shadow-lg" />
            </div>
          </>
        );
      }

      return (
        <>
        <h1 className="text-6xl md:text-8xl font-serif text-white tracking-tighter font-bold opacity-100 leading-[0.8]" style={{ textShadow: '0 10px 30px rgba(0,0,0,0.9), 0 2px 10px rgba(0,0,0,0.8)', textAlign: 'center', width: '100%' }}>
          {selectedMagazine}
        </h1>
        <p className="text-white" style={{ textAlign: 'center', fontSize: 'small', width: '100%' }}>BY PATRICK HENRY SWEENEY</p>
        </>
      );
    };

    return (
      <>
        {/* Top Bar: Photo Description */}
        <div className="absolute top-8 left-8 z-10">
          <div className="bg-black/40 backdrop-blur-sm p-3 border-l-2 border-yellow-400 max-w-[200px]">
            <div className="text-white text-[9px] md:text-[10px] uppercase tracking-[0.2em] leading-relaxed" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
              <span className="font-bold text-yellow-400 block mb-1">PHOTO DESCRIPTION:</span>
              Exclusive editorial look capturing the essence of modern elegance and timeless style.
            </div>
          </div>
        </div>
        {/* Centered V2 Block */}
        <div className="absolute top-6 left-0 right-0 flex justify-center z-20">
          <div className="bg-black/60 backdrop-blur-md px-4 py-1 border border-white/30 shadow-2xl">
            <span className="text-white text-[10px] uppercase font-bold tracking-[0.4em]">V2 / EXCLUSIVE</span>
          </div>
        </div>

        {/* Masthead (Moved to Top Center) */}
        <div className="absolute top-20 left-0 right-0 flex flex-col items-center justify-center z-10 select-none text-center">
          {renderDefaultMasthead()}
        </div>

        {/* Left Side: Magazine Titles */}
        <div className="absolute top-1/2 -translate-y-1/2 left-8 z-10 flex flex-col gap-10 max-w-[200px] md:max-w-[250px] mt-16">
          <div className="group/item cursor-default">
            <h3 className="text-white font-serif text-lg md:text-xl leading-tight tracking-tight" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>THE NEW AVANT-GARDE</h3>
            <div className="h-[1px] w-0 group-hover/item:w-full bg-white transition-all duration-300 mt-1" />
            <p className="text-white/80 text-[11px] md:text-sm sans-serif uppercase tracking-[0.15em] mt-2" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>Redefining Luxury</p>
          </div>
          <div className="group/item cursor-default">
            <h3 className="text-white font-serif text-lg md:text-xl leading-tight tracking-tight" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>MIDNIGHT CYBER</h3>
            <div className="h-[1px] w-0 group-hover/item:w-full bg-white transition-all duration-300 mt-1" />
            <p className="text-white/80 text-[11px] md:text-sm sans-serif uppercase tracking-[0.15em] mt-2" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>Neon Trends 2026</p>
          </div>
          <div className="group/item cursor-default">
            <h3 className="text-white font-serif text-lg md:text-xl leading-tight tracking-tight text-yellow-400" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>GOLDEN AGE GLAMOUR</h3>
            <div className="h-[1px] w-0 group-hover/item:w-full bg-yellow-400 transition-all duration-300 mt-1" />
            <p className="text-white/80 text-[11px] md:text-sm sans-serif uppercase tracking-[0.15em] mt-2" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>A Retrospective</p>
          </div>
          <div className="group/item cursor-default">
            <h3 className="text-white font-serif text-lg md:text-xl leading-tight tracking-tight" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>EXCLUSIVE INTERVIEW</h3>
            <div className="h-[1px] w-0 group-hover/item:w-full bg-white transition-all duration-300 mt-1" />
            <p className="text-white/80 text-[11px] md:text-sm sans-serif uppercase tracking-[0.15em] mt-2" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>Patrick Henry Sweeney</p>
          </div>
        </div>

        {/* Quote / Highlight */}
        <div className="absolute bottom-8 left-8 right-24 z-10">
          <div className="border-l-2 border-white/80 pl-4 py-1">
            <p className="text-white/90 font-serif text-xs md:text-sm leading-snug italic" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
              {coverQuote || '"A very formal classic enthusiast of Versace, Hugo Boss, Armani, and Louis Vuitton, and an Asian-made critic of high distinction."'}
            </p>
          </div>
        </div>
        
        {/* Barcode / Issue details */}
        <div className="absolute bottom-8 right-8 z-10 flex flex-col items-end">
          {showPlacementSeal && (
            <div className="mb-2 bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 text-black px-2.5 py-1 rounded-sm shadow-xl border border-yellow-200 text-center flex items-center gap-1">
              <Award className="w-3.5 h-3.5" />
              <span className="text-[9px] font-black uppercase tracking-wider">$50 VERIFIED SPREAD</span>
            </div>
          )}
          <div className="text-white/80 text-[10px] uppercase tracking-widest mb-2">Issue 01</div>
          <div className="w-12 h-12 bg-white/90 flex items-center justify-center p-1">
            <div className="w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1MCIgaGVpZ2h0PSIyMCI+PHBhdGggZD0iTTAgMGgydjIwaC0yem00IDBoMXYyMGgtMXptMyAwaDF2MjBoLTF6bTIgMGgydjIwaC0yem00IDBoMXYyMGgtMXptMiAwaDN2MjBoLTN6bTQgMGgxdjIwaC0xem0yIDBoMnYyMGgtMnptNCAwaDF2MjBoLTF6IiBmaWxsPSIjMDAwIi8+PC9zdmc+')] bg-repeat-x opacity-80" />
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="max-w-5xl mx-auto pb-20 px-4 sm:px-6">
      {downloadNotice && (
        <div className="mb-6 p-3 bg-zinc-900 text-white text-xs uppercase tracking-widest text-center flex items-center justify-center gap-2 shadow-sm rounded">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{downloadNotice}</span>
        </div>
      )}

      {/* $50 Editorial Placement Promotion Bar */}
      <div className="mb-6 bg-zinc-950 text-white p-4 sm:p-5 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 bg-amber-400 text-black rounded-sm shadow shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-sm uppercase tracking-wider text-white">
                $50 Guaranteed Magazine & Catalog Placement
              </span>
              <span className="bg-amber-400/20 text-amber-300 text-[10px] font-mono px-2 py-0.5 border border-amber-400/40 uppercase font-semibold">
                Guaranteed Feature
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Secure a full-page editorial spread in {selectedMagazine} & official permanent entry in the Aspen Fashion Catalog.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onOpenPlacementModal ? onOpenPlacementModal(currentImage || undefined) : null}
            className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-black text-xs font-serif uppercase tracking-widest font-bold flex items-center gap-1.5 shadow transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Place Look for $50</span>
          </button>
          {onNavigateToCatalog && (
            <button
              onClick={onNavigateToCatalog}
              className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs uppercase font-semibold tracking-wider flex items-center gap-1.5 border border-zinc-700 transition-colors cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Catalog</span>
            </button>
          )}
        </div>
      </div>

      {/* View Switcher */}
      <div className="flex border-b border-zinc-200 mb-6 gap-6 text-xs uppercase font-bold tracking-wider">
        <button
          onClick={() => setViewMode('cover')}
          className={`pb-2.5 flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
            viewMode === 'cover' ? 'border-black text-black' : 'border-transparent text-zinc-400 hover:text-zinc-700'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Magazine Cover</span>
        </button>
        <button
          onClick={() => setViewMode('spread')}
          className={`pb-2.5 flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
            viewMode === 'spread' ? 'border-black text-black' : 'border-transparent text-zinc-400 hover:text-zinc-700'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>2-Page Editorial Spread ($50 Layout)</span>
        </button>
        <button
          onClick={() => setViewMode('placements')}
          className={`pb-2.5 flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
            viewMode === 'placements' ? 'border-black text-black' : 'border-transparent text-zinc-400 hover:text-zinc-700'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Verified Placements ({userPlacements.length})</span>
        </button>
      </div>

      {/* Top Toolbar (only for cover and spread) */}
      {viewMode !== 'placements' && (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-serif uppercase tracking-widest">
              {viewMode === 'cover' ? 'The Cover' : 'Editorial Spread'}
            </h2>
            <p className="text-zinc-500 mt-2">
              {viewMode === 'cover' 
                ? `Exclusive editorial feature in ${selectedMagazine}.` 
                : `Print-ready 2-page editorial placement layout for ${selectedMagazine}.`}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center w-full md:w-auto">
            <select 
              value={selectedMagazine}
              onChange={(e) => setSelectedMagazine(e.target.value)}
              className="px-4 py-2 border border-zinc-300 bg-white text-sm font-medium uppercase tracking-wider outline-none focus:border-black"
            >
              {MAGAZINES.map(mag => (
                <option key={mag} value={mag}>{mag}</option>
              ))}
            </select>
            <div className="flex flex-wrap gap-2">
              {viewMode === 'cover' && (
                <button
                  onClick={() => setShowPlacementSeal(!showPlacementSeal)}
                  className={`px-3 py-2 border text-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer ${
                    showPlacementSeal ? 'bg-amber-100 text-amber-950 border-amber-300' : 'bg-white text-zinc-600 border-zinc-300'
                  }`}
                  title="Toggle $50 Placement Gold Seal stamp on cover"
                >
                  Seal: {showPlacementSeal ? 'ON' : 'OFF'}
                </button>
              )}
              <button 
                onClick={handleSaveToGallery}
                disabled={!currentImage || isSaving}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 border border-zinc-300 hover:bg-zinc-50 transition-colors disabled:opacity-50 uppercase tracking-wider text-xs font-medium cursor-pointer"
                title="Save to Gallery"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Save</span>
              </button>
              <button 
                onClick={handleShare}
                disabled={!currentImage}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 border border-zinc-300 hover:bg-zinc-50 transition-colors disabled:opacity-50 uppercase tracking-wider text-xs font-medium cursor-pointer"
                title="Share Magazine Look"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </button>
              {onRemix && (
                <button
                  type="button"
                  onClick={() => currentImage && onRemix(currentImage)}
                  disabled={!currentImage}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 border border-zinc-300 bg-white hover:bg-zinc-100 text-black transition-colors disabled:opacity-50 uppercase tracking-wider text-xs font-semibold cursor-pointer"
                  title="Send this look back to the Studio to remix"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-zinc-700" />
                  <span>Remix in Studio</span>
                </button>
              )}
              <button 
                onClick={() => handleDownloadImage()}
                disabled={!currentImage || isDownloading}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-zinc-100 hover:bg-zinc-200 text-black border border-zinc-300 transition-colors disabled:opacity-50 uppercase tracking-wider text-xs font-semibold cursor-pointer"
                title="Download the generated fashion photo locally"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Image</span>
              </button>
              <button 
                onClick={handleDownloadCover}
                disabled={!currentImage || isDownloading}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-black text-white hover:bg-zinc-800 transition-colors disabled:opacity-50 uppercase tracking-wider text-xs font-semibold cursor-pointer"
                title="Download formatted magazine cover with typography locally"
              >
                {isDownloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                <span>Download Cover</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 1: COVER */}
      {viewMode === 'cover' && (
        <div className="bg-white p-4 sm:p-8 border border-zinc-200 flex justify-center shadow-sm">
          {/* Magazine Cover Container */}
          <div 
            ref={coverRef}
            className="relative w-full max-w-[600px] aspect-[3/4] bg-zinc-100 overflow-hidden shadow-2xl group"
          >
            {currentImage ? (
              <>
                <img 
                  src={currentImage} 
                  alt="Magazine Cover" 
                  className="absolute inset-0 w-full h-full object-cover"
                />
                {/* Quick download image button overlay on hover */}
                <div className="absolute top-4 right-4 z-30 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadImage();
                    }}
                    className="bg-black/70 hover:bg-black text-white px-3 py-1.5 text-xs uppercase tracking-wider font-semibold flex items-center gap-1.5 backdrop-blur-sm shadow-lg cursor-pointer"
                    title="Download Fashion Image Locally"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Image</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-400 p-8 text-center">
                <ImageIcon className="w-12 h-12 stroke-1 mb-3 text-zinc-300" />
                <p className="uppercase tracking-widest text-sm font-medium">No Fashion Image Selected</p>
                <p className="text-xs text-zinc-400 mt-1 max-w-sm normal-case">
                  Generate an image in the Studio or pick a look from the editorial gallery below to create your magazine cover.
                </p>
              </div>
            )}

            {/* Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/60 pointer-events-none" />

            {currentImage && renderCoverContent()}
          </div>
        </div>
      )}

      {/* VIEW MODE 2: 2-PAGE EDITORIAL SPREAD */}
      {viewMode === 'spread' && (
        <div className="bg-zinc-100 p-4 sm:p-8 border border-zinc-300 shadow-sm">
          <div 
            ref={spreadRef}
            className="bg-white border border-zinc-400 shadow-2xl grid grid-cols-1 md:grid-cols-2 overflow-hidden max-w-5xl mx-auto"
          >
            {/* Page 1 (Left): Full Bleed Fashion Look */}
            <div className="relative aspect-[3/4] bg-zinc-950 overflow-hidden flex flex-col justify-between p-6">
              {currentImage ? (
                <img src={currentImage} alt="Spread Left" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-zinc-500">No Image</div>
              )}
              <div className="relative z-10 flex justify-between items-start">
                <span className="bg-black/75 text-white text-xs font-serif uppercase tracking-widest px-3 py-1">
                  {selectedMagazine}
                </span>
                <span className="bg-amber-400 text-black text-xs font-bold uppercase tracking-wider px-2.5 py-1 shadow">
                  $50 Verified Placement
                </span>
              </div>

              <div className="relative z-10 bg-black/80 backdrop-blur-md p-4 border-l-4 border-amber-400">
                <div className="text-white font-serif uppercase tracking-widest text-sm font-bold">
                  HAUTE COUTURE EDITORIAL
                </div>
                <div className="text-zinc-300 text-xs italic mt-0.5">
                  Aspen Winter Solstice Collection 2026
                </div>
              </div>
            </div>

            {/* Page 2 (Right): Luxury Editorial Layout */}
            <div className="p-8 sm:p-12 flex flex-col justify-between bg-zinc-50 border-t md:border-t-0 md:border-l border-zinc-200 text-zinc-900">
              <div>
                <div className="flex justify-between items-center text-xs pb-3 mb-5 border-b border-zinc-200">
                  <span className="font-mono text-zinc-500 uppercase tracking-widest">
                    ISSUE 01 · VOL. 2026
                  </span>
                  <span className="bg-amber-100 text-amber-900 font-bold uppercase text-[10px] px-2 py-0.5 border border-amber-200">
                    Official Placement Proof
                  </span>
                </div>

                <div className="text-amber-800 text-[11px] font-bold uppercase tracking-widest mb-1.5">
                  Editorial Spotlight Feature
                </div>

                <h1 className="font-serif text-3xl sm:text-4xl font-bold uppercase tracking-tight text-zinc-950 leading-tight">
                  High Altitude Elegance
                </h1>

                <p className="text-xs uppercase tracking-widest text-zinc-600 font-semibold mt-1">
                  Curated for {selectedMagazine}
                </p>

                <blockquote className="font-serif italic text-sm text-zinc-700 border-l-2 border-black pl-3 my-5 leading-relaxed">
                  {coverQuote || '"A masterwork in modern silhouette and high mountain contrast. Tailored for those who command the room."'}
                </blockquote>

                <div className="space-y-2 text-xs text-zinc-600 pt-2">
                  <div><strong className="text-zinc-900 uppercase text-[11px]">Designer:</strong> Patrick Henry Sweeney</div>
                  <div><strong className="text-zinc-900 uppercase text-[11px]">Atelier:</strong> Aspen Fashion Publishing House</div>
                  <div><strong className="text-zinc-900 uppercase text-[11px]">Retail / Spec:</strong> $2,850 · Made to Order</div>
                  <div><strong className="text-zinc-900 uppercase text-[11px]">Inclusion:</strong> Full-Page Print Spread & Digital Catalog</div>
                </div>
              </div>

              {/* Bottom Barcode & Placement Stamp */}
              <div className="pt-6 mt-6 border-t border-zinc-200 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-mono uppercase text-emerald-800 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>$50 Verified Editorial Placement</span>
                  </div>
                  <div className="text-[9px] font-mono text-zinc-400 mt-0.5">
                    CATALOG ENTRY SKU #AF-2026-SPREAD
                  </div>
                </div>

                <div className="w-14 h-10 bg-zinc-200 flex items-center justify-center p-0.5">
                  <div className="w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1MCIgaGVpZ2h0PSIyMCI+PHBhdGggZD0iTTAgMGgydjIwaC0yem00IDBoMXYyMGgtMXptMyAwaDF2MjBoLTF6bTIgMGgydjIwaC0yem00IDBoMXYyMGgtMXptMiAwaDN2MjBoLTN6bTQgMGgxdjIwaC0xem0yIDBoMnYyMGgtMnptNCAwaDF2MjBoLTF6IiBmaWxsPSIjMDAwIi8+PC9zdmc+')] bg-repeat-x opacity-80" />
                </div>
              </div>
            </div>
          </div>

          {/* Spread Actions */}
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => handleDownloadImage(currentImage || undefined, `${selectedMagazine.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-spread-photo.jpg`)}
              className="py-2.5 px-4 bg-zinc-900 hover:bg-black text-white text-xs uppercase font-semibold tracking-wider flex items-center gap-2 cursor-pointer shadow"
            >
              <Download className="w-4 h-4" />
              <span>Download Spread Image</span>
            </button>
            <button
              onClick={() => onOpenPlacementModal ? onOpenPlacementModal(currentImage || undefined) : null}
              className="py-2.5 px-4 bg-amber-400 hover:bg-amber-300 text-black text-xs uppercase font-bold tracking-wider flex items-center gap-2 cursor-pointer shadow"
            >
              <Award className="w-4 h-4" />
              <span>Place This Spread ($50)</span>
            </button>
          </div>
        </div>
      )}

      {/* VIEW MODE 3: PLACEMENTS & PROOFS REGISTRY */}
      {viewMode === 'placements' && (
        <div className="bg-white border border-zinc-200 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-zinc-200 gap-3">
            <div>
              <h3 className="font-serif text-xl font-bold uppercase tracking-wider text-zinc-900">
                Verified $50 Editorial Placements
              </h3>
              <p className="text-xs text-zinc-500 mt-1">
                Official register of your purchased magazine editorial spreads and catalog inclusions.
              </p>
            </div>
            <button
              onClick={() => onOpenPlacementModal ? onOpenPlacementModal() : null}
              className="py-2 px-4 bg-amber-400 hover:bg-amber-300 text-black text-xs font-serif uppercase tracking-widest font-bold flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>New $50 Placement</span>
            </button>
          </div>

          {userPlacements.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-zinc-300 bg-zinc-50 p-6">
              <Award className="w-12 h-12 text-zinc-400 mx-auto mb-3 stroke-1" />
              <h4 className="font-serif uppercase text-sm font-bold tracking-wider text-zinc-800">
                No Placements Registered Yet
              </h4>
              <p className="text-xs text-zinc-500 max-w-md mx-auto mt-1 mb-4">
                Secure a guaranteed full-page spread in any of our 15 editorial magazines and the official seasonal Lookbook Catalog for $50.
              </p>
              <button
                onClick={() => onOpenPlacementModal ? onOpenPlacementModal(currentImage || undefined) : null}
                className="py-2 px-4 bg-black text-white text-xs uppercase font-semibold tracking-wider hover:bg-zinc-800 cursor-pointer"
              >
                Submit First Look for $50
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userPlacements.map((p) => (
                <div key={p.id || p.receiptId} className="border border-zinc-200 bg-zinc-50 p-4 flex gap-4 items-start shadow-sm">
                  <img src={p.imageUrl} alt={p.lookTitle} className="w-24 h-32 object-cover border border-zinc-300 shrink-0" />
                  <div className="flex-1 flex flex-col justify-between h-32">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold uppercase text-amber-800 bg-amber-100 px-1.5 py-0.5">
                          {p.receiptId}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-emerald-700">
                          ✓ {p.status.toUpperCase()}
                        </span>
                      </div>
                      <h4 className="font-serif text-sm font-bold uppercase text-zinc-900 mt-1 truncate">
                        {p.lookTitle}
                      </h4>
                      <p className="text-xs text-zinc-500 truncate">
                        {p.designer} · {p.publication}
                      </p>
                      <p className="text-[10px] text-zinc-400 mt-1">
                        Fee Paid: ${p.amountPaid.toFixed(2)} USD
                      </p>
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-zinc-200">
                      <button
                        onClick={() => downloadImageLocally(p.imageUrl, `aspen-placement-${p.receiptId}.jpg`)}
                        className="py-1 px-2 bg-zinc-900 text-white text-[10px] uppercase font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Download className="w-3 h-3" />
                        <span>Download</span>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedLook(p.imageUrl);
                          setSelectedMagazine(p.publication);
                          setViewMode('spread');
                        }}
                        className="py-1 px-2 bg-white border border-zinc-300 text-zinc-800 text-[10px] uppercase font-semibold flex items-center gap-1 cursor-pointer hover:bg-zinc-100"
                      >
                        <Layers className="w-3 h-3" />
                        <span>View Spread</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Generated Looks & Editorial Editions Carousel/Grid */}
      {items && items.length > 0 && (
        <div className="mt-12 bg-white border border-zinc-200 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-zinc-100 gap-2">
            <div>
              <h3 className="font-serif uppercase tracking-widest text-lg text-zinc-900">
                Editorial Looks & Generated Editions
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Browse generated fashion creations. Select any look to feature on the cover or save it locally.
              </p>
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              {items.length} {items.length === 1 ? 'Look' : 'Looks'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {items.map((item) => {
              const isCoverActive = currentImage === item.url;
              return (
                <div 
                  key={item.id} 
                  className={`group relative border flex flex-col bg-zinc-50 transition-all ${
                    isCoverActive ? 'border-black ring-2 ring-black/10' : 'border-zinc-200 hover:border-zinc-400'
                  }`}
                >
                  <div 
                    className="relative aspect-[3/4] cursor-pointer overflow-hidden bg-zinc-200"
                    onClick={() => setSelectedLook(item.url)}
                    title="Click to feature on magazine cover"
                  >
                    <img 
                      src={item.url} 
                      alt={item.user} 
                      className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                    />
                    {isCoverActive && (
                      <div className="absolute top-1.5 left-1.5 bg-black text-white text-[9px] uppercase px-1.5 py-0.5 font-bold tracking-wider shadow">
                        Active Cover
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/95 text-black px-2 py-1 text-[10px] uppercase tracking-wider font-semibold shadow-sm">
                        Use Look
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 flex flex-col gap-2 bg-white border-t border-zinc-100">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-serif uppercase tracking-wider truncate text-zinc-800 font-medium">
                        {item.user}
                      </span>
                      {item.stars > 0 && (
                        <span className="text-[10px] text-zinc-500 font-medium">★ {item.stars}</span>
                      )}
                    </div>
                    
                    {/* Action buttons: Remix & Download */}
                    <div className="grid grid-cols-2 gap-1.5">
                      {onRemix && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemix(item.url);
                          }}
                          className="w-full py-1.5 px-1 bg-white hover:bg-zinc-100 text-zinc-900 border border-zinc-300 text-[9px] uppercase tracking-wider font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                          title="Remix this fashion image in Studio"
                          aria-label={`Remix fashion look by ${item.user} in Studio`}
                        >
                          <RefreshCw className="w-3 h-3 text-zinc-700" />
                          <span>Remix</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadImage(
                            item.url, 
                            `fashion-look-${item.user.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.jpg`
                          );
                        }}
                        className={`w-full py-1.5 px-1 bg-zinc-900 hover:bg-black text-white text-[9px] uppercase tracking-wider font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                          !onRemix ? 'col-span-2' : ''
                        }`}
                        title="Download this generated fashion image locally"
                        aria-label={`Download fashion look by ${item.user} locally`}
                      >
                        <Download className="w-3 h-3" />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

