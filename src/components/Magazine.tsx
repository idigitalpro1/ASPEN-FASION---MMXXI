import { useRef, useState } from 'react';
import { Download, Share2, Save, Loader2 } from 'lucide-react';
import { toPng } from 'html-to-image';
import { saveCreation } from '../lib/db';

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

export function Magazine({ generatedImage, coverQuote }: { generatedImage: string | null, coverQuote?: string | null }) {
  const coverRef = useRef<HTMLDivElement>(null);
  const [selectedMagazine, setSelectedMagazine] = useState(MAGAZINES[0]);
  const [isSaving, setIsSaving] = useState(false);

  const handleDownload = async () => {
    if (!coverRef.current) return;
    try {
      const dataUrl = await toPng(coverRef.current);
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${selectedMagazine.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-cover.png`;
      a.click();
    } catch (error) {
      console.error('Error downloading:', error);
    }
  };

  const handleSaveToGallery = async () => {
    if (!coverRef.current) return;
    setIsSaving(true);
    try {
      const dataUrl = await toPng(coverRef.current);
      await saveCreation('magazine', dataUrl, coverQuote || undefined);
      alert('Saved to gallery!');
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
          <div className="text-white/80 text-[10px] uppercase tracking-widest mb-2">Issue 01</div>
          <div className="w-12 h-12 bg-white/90 flex items-center justify-center p-1">
            <div className="w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1MCIgaGVpZ2h0PSIyMCI+PHBhdGggZD0iTTAgMGgydjIwaC0yem00IDBoMXYyMGgtMXptMyAwaDF2MjBoLTF6bTIgMGgydjIwaC0yem00IDBoMXYyMGgtMXptMiAwaDN2MjBoLTN6bTQgMGgxdjIwaC0xem0yIDBoMnYyMGgtMnptNCAwaDF2MjBoLTF6IiBmaWxsPSIjMDAwIi8+PC9zdmc+')] bg-repeat-x opacity-80" />
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-serif uppercase tracking-widest text-center">The Cover</h2>
          <p className="text-zinc-500 mt-2 text-center">Your exclusive feature in {selectedMagazine}.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
          <select 
            value={selectedMagazine}
            onChange={(e) => setSelectedMagazine(e.target.value)}
            className="px-4 py-2 border border-zinc-300 bg-white text-sm font-medium uppercase tracking-wider outline-none focus:border-black"
          >
            {MAGAZINES.map(mag => (
              <option key={mag} value={mag}>{mag}</option>
            ))}
          </select>
          <div className="flex gap-4">
            <button 
              onClick={handleSaveToGallery}
              disabled={!generatedImage || isSaving}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 border border-zinc-300 hover:bg-zinc-50 transition-colors disabled:opacity-50 uppercase tracking-wider text-sm font-medium"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save to Gallery
            </button>
            <button 
              onClick={handleShare}
              disabled={!generatedImage}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 border border-zinc-300 hover:bg-zinc-50 transition-colors disabled:opacity-50 uppercase tracking-wider text-sm font-medium"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
            <button 
              onClick={handleDownload}
              disabled={!generatedImage}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-black text-white hover:bg-zinc-800 transition-colors disabled:opacity-50 uppercase tracking-wider text-sm font-medium"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white p-8 border border-zinc-200 flex justify-center">
        {/* Magazine Cover Container */}
        <div 
          ref={coverRef}
          className="relative w-full max-w-[600px] aspect-[3/4] bg-zinc-100 overflow-hidden shadow-2xl group"
        >
          {generatedImage ? (
            <img 
              src={generatedImage} 
              alt="Magazine Cover" 
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-zinc-400 uppercase tracking-widest text-sm">
              Generate an image in the studio first
            </div>
          )}

          {/* Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/60 pointer-events-none" />

          {renderCoverContent()}
        </div>
      </div>
    </div>
  );
}

