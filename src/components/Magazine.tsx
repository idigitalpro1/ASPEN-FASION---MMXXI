import { useRef, useState, useEffect } from 'react';
import { 
  Download, Share2, Save, Loader2, Check, Image as ImageIcon, 
  Award, Sparkles, BookOpen, Layers, ShieldCheck, FileText, ExternalLink,
  RefreshCw, Twitter, Pin, Copy, X as CloseIcon, Printer, ArrowLeft, Scissors,
  Edit3, Type, Calendar, RotateCcw, ChevronDown, ChevronUp,
  Sliders, Zap, Crosshair, Filter
} from 'lucide-react';
import { toPng } from 'html-to-image';
import { saveCreation } from '../lib/db';
import { downloadImageLocally } from '../lib/download';
import { getLocalPlacements } from '../lib/catalogData';
import { MagazinePlacement } from '../types';
import { GalleryItem } from './Carousel';

export type LayoutOverlayMode = 'Editorial' | 'Street Style' | 'Avant-Garde';

export interface LayoutOverlayOption {
  id: LayoutOverlayMode;
  label: string;
  tag: string;
  description: string;
}

export const LAYOUT_OVERLAY_OPTIONS: LayoutOverlayOption[] = [
  { 
    id: 'Editorial', 
    label: 'Editorial', 
    tag: 'Haute Couture', 
    description: 'Refined double hairline borders, metallic gold corner accents, and luxury fashion capital ribbon' 
  },
  { 
    id: 'Street Style', 
    label: 'Street Style', 
    tag: 'Urban Raw', 
    description: 'Neon tape labels, industrial stencil brackets, GPS coordinates, and gritty rubber stamps' 
  },
  { 
    id: 'Avant-Garde', 
    label: 'Avant-Garde', 
    tag: 'Conceptual', 
    description: 'Architectural crosshairs, vertical typographic code marquee, and geometric framing grids' 
  },
];

const MAGAZINES = [
  "COWBOY CHICK",
  "MEN'S LA VACANZA",
  "WESTERN COWBOY CHIC",
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

interface MagazineHeadlines {
  headline: string;
  subheadline: string;
  secondaryHeadline: string;
  secondarySubheadline: string;
  tertiaryHeadline: string;
  tertiarySubheadline: string;
  quaternaryHeadline: string;
  quaternarySubheadline: string;
}

function getMagazineDefaultHeadlines(magazine: string): MagazineHeadlines {
  if (magazine === 'COWBOY CHICK' || magazine === 'WESTERN COWBOY CHIC') {
    return {
      headline: 'FLOATING COLLARS',
      subheadline: 'Sculptural Western Luxe',
      secondaryHeadline: 'STUDDED VESTS',
      secondarySubheadline: 'Hand-Riveted Metalwork',
      tertiaryHeadline: 'LARGE BUCKLES',
      tertiarySubheadline: 'Chiseled Sterling Trophies',
      quaternaryHeadline: 'RELAXED JEANS & BOOTS',
      quaternarySubheadline: 'High-End Runway Silhouette'
    };
  }
  if (magazine === 'VOGUE') {
    return {
      headline: 'THE NEW AVANT-GARDE',
      subheadline: 'Redefining luxury for the modern era',
      secondaryHeadline: 'BEAUTY SECRETS',
      secondarySubheadline: 'From the runway to your routine',
      tertiaryHeadline: 'EXCLUSIVE RUNWAY',
      tertiarySubheadline: 'Intimate look at seasonal trends',
      quaternaryHeadline: 'THE MET GALA LOOK',
      quaternarySubheadline: 'Haute couture retrospective'
    };
  }
  if (magazine === "HARPER'S BAZAAR") {
    return {
      headline: 'FABULOUS AT EVERY AGE',
      subheadline: 'The ultimate style guide',
      secondaryHeadline: 'THE NEW ELEGANCE',
      secondarySubheadline: 'Modern couture collection',
      tertiaryHeadline: 'SPRING FASHION',
      tertiarySubheadline: '100+ Looks to love',
      quaternaryHeadline: 'BAZAAR ICON',
      quaternarySubheadline: 'Exclusive editorial portfolio'
    };
  }
  if (magazine === 'ELLE') {
    return {
      headline: 'STYLE REBOOT',
      subheadline: 'What to wear right now',
      secondaryHeadline: 'BEAUTY RULES',
      secondarySubheadline: 'To break this season',
      tertiaryHeadline: 'MEET THE NEW ICON',
      tertiarySubheadline: 'Exclusive cover story',
      quaternaryHeadline: 'FRENCH COUTURE',
      quaternarySubheadline: 'Paris fashion week preview'
    };
  }
  return {
    headline: 'THE NEW AVANT-GARDE',
    subheadline: 'Redefining Luxury',
    secondaryHeadline: 'MIDNIGHT CYBER',
    secondarySubheadline: 'Neon Trends 2026',
    tertiaryHeadline: 'GOLDEN AGE GLAMOUR',
    tertiarySubheadline: 'A Retrospective',
    quaternaryHeadline: 'EXCLUSIVE INTERVIEW',
    quaternarySubheadline: 'Patrick Henry Sweeney'
  };
}

/**
 * Click-to-edit inline text element for headlines, subheadlines, and dates
 */
function InlineEditableText({
  value,
  onChange,
  className = '',
  style = {},
  tag = 'span',
  placeholder = 'Click to edit...',
  title = 'Click to edit',
  isInlineEditingAllowed = true,
}: {
  value: string;
  onChange: (val: string) => void;
  className?: string;
  style?: React.CSSProperties;
  tag?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span' | 'div';
  placeholder?: string;
  title?: string;
  isInlineEditingAllowed?: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempVal, setTempVal] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTempVal(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleCommit = () => {
    setIsEditing(false);
    if (tempVal.trim()) {
      onChange(tempVal.trim());
    } else {
      setTempVal(value);
    }
  };

  const Tag = tag as any;

  if (isEditing) {
    return (
      <span className="inline-block relative z-30 max-w-full print:border-none print:bg-transparent">
        <input
          ref={inputRef}
          type="text"
          value={tempVal}
          onChange={(e) => setTempVal(e.target.value)}
          onBlur={handleCommit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleCommit();
            if (e.key === 'Escape') {
              setTempVal(value);
              setIsEditing(false);
            }
          }}
          className={`bg-black/90 text-white border-2 border-amber-400 outline-none px-2 py-0.5 rounded shadow-2xl ${className}`}
          style={{ ...style, width: 'auto', minWidth: '140px' }}
          placeholder={placeholder}
          onClick={(e) => e.stopPropagation()}
        />
      </span>
    );
  }

  return (
    <Tag
      onClick={(e: React.MouseEvent) => {
        if (isInlineEditingAllowed) {
          e.stopPropagation();
          setIsEditing(true);
        }
      }}
      title={isInlineEditingAllowed ? `${title} (Click to edit text)` : undefined}
      className={`group/editable cursor-pointer transition-all duration-150 inline-block ${className} ${
        isInlineEditingAllowed ? 'hover:outline-1 hover:outline-dashed hover:outline-amber-300/90 rounded-xs' : ''
      }`}
      style={style}
    >
      {value || placeholder}
      {isInlineEditingAllowed && (
        <span className="no-print print:hidden opacity-0 group-hover/editable:opacity-100 transition-opacity ml-1.5 inline-flex items-center text-amber-300 text-[9px] font-sans font-normal tracking-normal align-middle bg-black/70 px-1 py-0.5 rounded border border-amber-400/50 pointer-events-none">
          ✏️ Edit
        </span>
      )}
    </Tag>
  );
}

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
  const [layoutOverlay, setLayoutOverlay] = useState<LayoutOverlayMode>('Editorial');
  const [userPlacements, setUserPlacements] = useState<MagazinePlacement[]>([]);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isPrintReadyMode, setIsPrintReadyMode] = useState(false);
  const [showCropMarks, setShowCropMarks] = useState(true);

  // Inline Text Editor & Customization State
  const [isInlineEditorOpen, setIsInlineEditorOpen] = useState(false);
  const [isInlineEditingAllowed, setIsInlineEditingAllowed] = useState(true);
  const [hasCustomizedText, setHasCustomizedText] = useState(false);

  // Initialize with selected magazine defaults
  const initialDefaults = getMagazineDefaultHeadlines(selectedMagazine);
  const [headlineText, setHeadlineText] = useState(initialDefaults.headline);
  const [subheadlineText, setSubheadlineText] = useState(initialDefaults.subheadline);
  const [secondaryHeadline, setSecondaryHeadline] = useState(initialDefaults.secondaryHeadline);
  const [secondarySubheadline, setSecondarySubheadline] = useState(initialDefaults.secondarySubheadline);
  const [tertiaryHeadline, setTertiaryHeadline] = useState(initialDefaults.tertiaryHeadline);
  const [tertiarySubheadline, setTertiarySubheadline] = useState(initialDefaults.tertiarySubheadline);
  const [quaternaryHeadline, setQuaternaryHeadline] = useState(initialDefaults.quaternaryHeadline);
  const [quaternarySubheadline, setQuaternarySubheadline] = useState(initialDefaults.quaternarySubheadline);
  const [coverDate, setCoverDate] = useState("AUTUMN 2026");
  const [issueNumber, setIssueNumber] = useState("ISSUE 01");
  const [bylineText, setBylineText] = useState("BY PATRICK HENRY SWEENEY");

  // Reset text back to magazine presets
  const resetToMagazineDefaults = (magName: string = selectedMagazine) => {
    const defs = getMagazineDefaultHeadlines(magName);
    setHeadlineText(defs.headline);
    setSubheadlineText(defs.subheadline);
    setSecondaryHeadline(defs.secondaryHeadline);
    setSecondarySubheadline(defs.secondarySubheadline);
    setTertiaryHeadline(defs.tertiaryHeadline);
    setTertiarySubheadline(defs.tertiarySubheadline);
    setQuaternaryHeadline(defs.quaternaryHeadline);
    setQuaternarySubheadline(defs.quaternarySubheadline);
    setCoverDate("AUTUMN 2026");
    setIssueNumber("ISSUE 01");
    setBylineText("BY PATRICK HENRY SWEENEY");
    setHasCustomizedText(false);
  };

  // When selectedMagazine changes, automatically update default headlines if user hasn't explicitly customized
  useEffect(() => {
    if (!hasCustomizedText) {
      const defs = getMagazineDefaultHeadlines(selectedMagazine);
      setHeadlineText(defs.headline);
      setSubheadlineText(defs.subheadline);
      setSecondaryHeadline(defs.secondaryHeadline);
      setSecondarySubheadline(defs.secondarySubheadline);
      setTertiaryHeadline(defs.tertiaryHeadline);
      setTertiarySubheadline(defs.tertiarySubheadline);
      setQuaternaryHeadline(defs.quaternaryHeadline);
      setQuaternarySubheadline(defs.quaternarySubheadline);
    }
  }, [selectedMagazine, hasCustomizedText]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isPrintReadyMode) {
        setIsPrintReadyMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPrintReadyMode]);

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

  const getShareText = () => {
    const cleanQuote = coverQuote ? ` "${coverQuote.replace(/^["']|["']$/g, '').trim()}"` : '';
    const cleanMagTag = selectedMagazine.replace(/[^a-zA-Z0-9]/g, '');
    return `Check out my exclusive ${selectedMagazine} cover editorial on Fleurish Studio! ✨${cleanQuote}\n\n#HighFashion #MagazineCover #HauteCouture #${cleanMagTag}`;
  };

  const getTwitterShareUrl = () => {
    const text = getShareText();
    const url = typeof window !== 'undefined' ? window.location.href : 'https://aspenfashion.com';
    return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
  };

  const getPinterestShareUrl = () => {
    const url = typeof window !== 'undefined' ? window.location.href : 'https://aspenfashion.com';
    // Pinterest requires an absolute HTTP or HTTPS URL for image media
    const mediaUrl = currentImage && currentImage.startsWith('http')
      ? currentImage
      : 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop';
    const description = `${selectedMagazine} Cover Editorial - ${coverQuote || 'High Altitude Elegance, Aspen Fashion Publishing House 2026'}`;
    return `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&media=${encodeURIComponent(mediaUrl)}&description=${encodeURIComponent(description)}`;
  };

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
      } else {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = window.location.href;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (err) {
      console.error('Error copying link:', err);
    }
  };

  const handleNativeDeviceShare = async () => {
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
        
        const fileName = `${selectedMagazine.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-cover.png`;
        const file = new File([blob], fileName, { type: 'image/png' });
        await navigator.share({
          title: `${selectedMagazine} Cover`,
          text: `Check out my ${selectedMagazine} cover on Fleurish Studio!`,
          files: [file]
        });
      } catch (error) {
        if ((error as Error)?.name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  // Helper to render byline and date below any masthead
  const renderMastheadBylineAndDate = () => (
    <p className="text-white flex items-center justify-center gap-2 flex-wrap mt-1 z-20" style={{ textAlign: 'center', fontSize: 'small', width: '100%' }}>
      <InlineEditableText
        value={bylineText}
        onChange={(v) => { setBylineText(v); setHasCustomizedText(true); }}
        placeholder="Byline"
        title="Click to edit byline"
        tag="span"
        className="tracking-wider opacity-90"
        isInlineEditingAllowed={isInlineEditingAllowed}
      />
      <span className="opacity-40">·</span>
      <InlineEditableText
        value={coverDate}
        onChange={(v) => { setCoverDate(v); setHasCustomizedText(true); }}
        placeholder="Cover Date"
        title="Click to edit issue date"
        tag="span"
        className="font-semibold text-amber-200 uppercase tracking-wider"
        isInlineEditingAllowed={isInlineEditingAllowed}
      />
    </p>
  );

  // The inline text editor panel (used above the cover and inside the print proof stage)
  const renderInlineTextEditorBar = (isDarkProof = false) => {
    const datePresets = [
      "AUTUMN 2026",
      "WINTER 2026",
      "SPRING 2027",
      "SUMMER 2027",
      "FALL SPECIAL",
      "COLLECTOR'S EDITION"
    ];

    return (
      <div 
        className={`w-full transition-all duration-200 no-print print:hidden mb-6 p-4 sm:p-5 rounded-lg border shadow-lg ${
          isDarkProof 
            ? 'bg-zinc-900/95 border-zinc-700 text-white' 
            : 'bg-zinc-50 border-zinc-200 text-zinc-900'
        }`}
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-400 text-black rounded-sm shadow-xs">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-serif uppercase tracking-widest font-bold">
                Inline Cover Text & Date Editor
              </h4>
              <p className="text-[11px] text-zinc-500">
                Customize headlines and publication date before printing or exporting. Click on cover elements to edit in-place.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {hasCustomizedText && (
              <span className="text-[10px] px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono font-bold uppercase rounded border border-amber-500/20">
                Customized
              </span>
            )}
            <button
              type="button"
              onClick={() => resetToMagazineDefaults()}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-zinc-600 dark:text-zinc-300 hover:text-black dark:hover:text-white bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded transition-colors cursor-pointer"
              title="Revert headlines and dates back to original magazine defaults"
            >
              <RotateCcw className="w-3 h-3 text-zinc-500" />
              <span>Reset Defaults</span>
            </button>
            <button
              type="button"
              onClick={() => setIsInlineEditorOpen(false)}
              className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
              title="Close Editor"
            >
              <CloseIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Grid of Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
          {/* Lead Headline */}
          <div>
            <label className="block text-[10px] uppercase font-bold tracking-wider text-zinc-500 mb-1 flex items-center gap-1">
              <Type className="w-3 h-3 text-amber-500" />
              <span>Primary Headline</span>
            </label>
            <input
              type="text"
              value={headlineText}
              onChange={(e) => { setHeadlineText(e.target.value); setHasCustomizedText(true); }}
              placeholder="e.g. FLOATING COLLARS"
              className="w-full px-3 py-1.5 text-xs font-serif font-bold uppercase tracking-wider bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded outline-none focus:border-amber-400"
            />
          </div>

          {/* Lead Subheadline */}
          <div>
            <label className="block text-[10px] uppercase font-bold tracking-wider text-zinc-500 mb-1">
              Subheadline / Tagline
            </label>
            <input
              type="text"
              value={subheadlineText}
              onChange={(e) => { setSubheadlineText(e.target.value); setHasCustomizedText(true); }}
              placeholder="e.g. Sculptural Western Luxe"
              className="w-full px-3 py-1.5 text-xs bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded outline-none focus:border-amber-400"
            />
          </div>

          {/* Publication Date */}
          <div>
            <label className="block text-[10px] uppercase font-bold tracking-wider text-zinc-500 mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-amber-500" />
              <span>Cover Date</span>
            </label>
            <input
              type="text"
              value={coverDate}
              onChange={(e) => { setCoverDate(e.target.value); setHasCustomizedText(true); }}
              placeholder="e.g. AUTUMN 2026"
              className="w-full px-3 py-1.5 text-xs uppercase font-semibold tracking-wider bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded outline-none focus:border-amber-400"
            />
          </div>

          {/* Secondary Headline */}
          <div>
            <label className="block text-[10px] uppercase font-bold tracking-wider text-zinc-500 mb-1">
              Feature Headline 2
            </label>
            <input
              type="text"
              value={secondaryHeadline}
              onChange={(e) => { setSecondaryHeadline(e.target.value); setHasCustomizedText(true); }}
              placeholder="e.g. STUDDED VESTS"
              className="w-full px-3 py-1.5 text-xs font-serif uppercase tracking-wider bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded outline-none focus:border-amber-400"
            />
          </div>

          {/* Secondary Subheadline */}
          <div>
            <label className="block text-[10px] uppercase font-bold tracking-wider text-zinc-500 mb-1">
              Feature Subhead 2
            </label>
            <input
              type="text"
              value={secondarySubheadline}
              onChange={(e) => { setSecondarySubheadline(e.target.value); setHasCustomizedText(true); }}
              placeholder="e.g. Hand-Riveted Metalwork"
              className="w-full px-3 py-1.5 text-xs bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded outline-none focus:border-amber-400"
            />
          </div>

          {/* Issue Number & Byline */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] uppercase font-bold tracking-wider text-zinc-500 mb-1">
                Issue #
              </label>
              <input
                type="text"
                value={issueNumber}
                onChange={(e) => { setIssueNumber(e.target.value); setHasCustomizedText(true); }}
                placeholder="e.g. ISSUE 01"
                className="w-full px-3 py-1.5 text-xs uppercase font-medium bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold tracking-wider text-zinc-500 mb-1">
                Byline
              </label>
              <input
                type="text"
                value={bylineText}
                onChange={(e) => { setBylineText(e.target.value); setHasCustomizedText(true); }}
                placeholder="e.g. BY PATRICK HENRY SWEENEY"
                className="w-full px-3 py-1.5 text-xs uppercase font-medium bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded outline-none focus:border-amber-400"
              />
            </div>
          </div>
        </div>

        {/* Date Presets Row */}
        <div className="mt-3.5 pt-3 border-t border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] uppercase font-bold text-zinc-400 mr-1 flex items-center gap-1">
            <Calendar className="w-3 h-3" /> Quick Dates:
          </span>
          {datePresets.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => { setCoverDate(preset); setHasCustomizedText(true); }}
              className={`px-2 py-0.5 text-[10px] uppercase tracking-wider rounded border transition-colors cursor-pointer ${
                coverDate === preset
                  ? 'bg-amber-400 text-black border-amber-500 font-bold'
                  : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-300 dark:border-zinc-700 hover:border-amber-400'
              }`}
            >
              {preset}
            </button>
          ))}
          <span className="text-[10px] text-zinc-400 italic ml-auto hidden md:inline">
            💡 Click directly on any text on the cover below to edit in-place
          </span>
        </div>
      </div>
    );
  };

  // Render visual layout overlay (Editorial, Street Style, or Avant-Garde)
  const renderLayoutOverlayGraphic = (mode: LayoutOverlayMode, isSpread: boolean = false) => {
    if (mode === 'Editorial') {
      return (
        <div className="absolute inset-0 pointer-events-none z-10 select-none overflow-hidden">
          {/* Subtle editorial vignette */}
          <div className="absolute inset-0 bg-radial from-transparent via-transparent to-black/35 pointer-events-none" />

          {/* Double hairline luxury frame */}
          <div className="absolute inset-3 sm:inset-4 border border-white/20 pointer-events-none" />
          <div className="absolute inset-4 sm:inset-5 border border-amber-300/25 pointer-events-none" />

          {/* Corner metallic star accents */}
          <div className="absolute top-2.5 left-2.5 text-amber-200/60 text-[9px] font-serif font-light leading-none">✦</div>
          <div className="absolute top-2.5 right-2.5 text-amber-200/60 text-[9px] font-serif font-light leading-none">✦</div>
          <div className="absolute bottom-2.5 left-2.5 text-amber-200/60 text-[9px] font-serif font-light leading-none">✦</div>
          <div className="absolute bottom-2.5 right-2.5 text-amber-200/60 text-[9px] font-serif font-light leading-none">✦</div>

          {/* Luxury Fashion Capitals Ribbon (Top) */}
          <div className="absolute top-2 inset-x-0 flex justify-center pointer-events-none">
            <span className="text-[7px] sm:text-[8px] tracking-[0.28em] font-serif text-amber-100/90 uppercase bg-black/45 px-2.5 py-0.5 backdrop-blur-xs border border-amber-200/20 shadow-xs">
              PARIS • MILANO • LONDON • NEW YORK
            </span>
          </div>

          {/* Lower Editorial Archive Folio */}
          {!isSpread && (
            <div className="absolute bottom-3 left-4.5 pointer-events-none flex items-center gap-1.5 opacity-80">
              <span className="text-[7.5px] font-serif tracking-[0.22em] text-white/80 uppercase">
                HAUTE COUTURE ÉDITION · ARCHIVE N° 26
              </span>
            </div>
          )}
        </div>
      );
    }

    if (mode === 'Street Style') {
      return (
        <div className="absolute inset-0 pointer-events-none z-10 select-none overflow-hidden">
          {/* Dynamic street gradient tone */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/25 pointer-events-none" />

          {/* Tilted Caution / Neon Yellow Tape Label */}
          <div className="absolute top-6 -left-1 rotate-[-3.5deg] z-20 shadow-xl pointer-events-none">
            <div className="bg-yellow-400 text-black px-3 py-0.5 sm:px-3.5 sm:py-1 text-[8.5px] sm:text-[9.5px] font-mono font-black tracking-widest uppercase border-y border-black flex items-center gap-1.5 shadow-md">
              <Zap className="w-2.5 h-2.5 fill-black shrink-0" />
              <span>STREET STYLE REPORT // DROP 01</span>
            </div>
          </div>

          {/* Industrial Corner Stencil Brackets */}
          <div className="absolute top-2.5 left-2.5 w-3.5 h-3.5 border-t-2 border-l-2 border-yellow-400/90 pointer-events-none" />
          <div className="absolute top-2.5 right-2.5 w-3.5 h-3.5 border-t-2 border-r-2 border-yellow-400/90 pointer-events-none" />
          <div className="absolute bottom-2.5 left-2.5 w-3.5 h-3.5 border-b-2 border-l-2 border-yellow-400/90 pointer-events-none" />
          <div className="absolute bottom-2.5 right-2.5 w-3.5 h-3.5 border-b-2 border-r-2 border-yellow-400/90 pointer-events-none" />

          {/* Urban District Coordinates & Timestamp */}
          <div className="absolute top-3 right-3 pointer-events-none z-20">
            <div className="bg-black/85 border border-zinc-700/80 px-2 py-0.5 text-[7.5px] sm:text-[8px] font-mono text-zinc-300 tracking-wider flex flex-col items-end backdrop-blur-xs shadow-md">
              <span className="text-yellow-400 font-bold">LOC: 40.7128° N, 74.0060° W</span>
              <span className="text-zinc-400">NYC SO-HO · 22:45 EST</span>
            </div>
          </div>

          {/* Streetwear Rubber Stamp Badge */}
          <div className="absolute bottom-24 sm:bottom-28 right-4 pointer-events-none z-20 rotate-[-12deg] opacity-90">
            <div className="border-2 border-dashed border-yellow-400 text-yellow-400 px-2 py-0.5 text-[8px] font-mono font-black tracking-widest uppercase bg-black/70 backdrop-blur-xs shadow-md">
              VERIFIED STREET LOOK
            </div>
          </div>

          {/* Off-Schedule Serial Stripe */}
          {!isSpread && (
            <div className="absolute bottom-3 left-4 pointer-events-none z-20 flex items-center gap-1.5">
              <span className="bg-white text-black font-mono text-[7px] font-bold px-1.5 py-0.5 tracking-widest">
                OFF-SCHEDULE
              </span>
              <span className="text-[7px] font-mono text-zinc-300 tracking-widest bg-black/70 px-1.5 py-0.5 border border-zinc-700">
                SERIAL: NYC-STW-2026-X89
              </span>
            </div>
          )}
        </div>
      );
    }

    if (mode === 'Avant-Garde') {
      return (
        <div className="absolute inset-0 pointer-events-none z-10 select-none overflow-hidden">
          {/* Architectural Axis Lines */}
          <div className="absolute top-1/2 inset-x-0 h-[1px] bg-cyan-400/25 pointer-events-none" />
          <div className="absolute left-1/2 inset-y-0 w-[1px] bg-cyan-400/25 pointer-events-none" />

          {/* Target Center Focus Mark */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border border-cyan-400/35 flex items-center justify-center pointer-events-none">
            <div className="w-1.5 h-1.5 bg-cyan-400/80 rounded-full" />
          </div>

          {/* Experimental Architectural Asymmetric Lines */}
          <div className="absolute top-2.5 right-2.5 w-10 h-10 border-t-2 border-r-2 border-cyan-400/70 pointer-events-none" />
          <div className="absolute bottom-2.5 left-2.5 w-10 h-10 border-b-2 border-l-2 border-cyan-400/70 pointer-events-none" />

          {/* Vertical Deconstructed Runway Marquee */}
          <div className="absolute top-1/3 left-2 -rotate-90 origin-top-left pointer-events-none z-20">
            <span className="text-[7px] font-mono tracking-[0.3em] text-cyan-300 uppercase bg-black/85 px-2 py-0.5 border-l-2 border-cyan-400 shadow-sm whitespace-nowrap">
              [01 // FORM + VOID + DECONSTRUCTION]
            </span>
          </div>

          {/* Conceptual Experiment Code Tag (Top Left) */}
          <div className="absolute top-2.5 left-3 pointer-events-none z-20 flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5 text-[7.5px] font-mono text-cyan-300 font-bold uppercase bg-black/85 px-2 py-0.5 border border-cyan-500/40 backdrop-blur-xs shadow-md">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>EXP. NO. 07 // AVANT-GARDE</span>
            </div>
            <span className="text-[6.5px] font-mono text-cyan-100/70 pl-1 tracking-wider bg-black/60 inline-block px-1">
              RADICAL SILHOUETTE PROTOCOL
            </span>
          </div>

          {/* Camera Calibration & Aspect Ratio Stamp (Bottom Right) */}
          <div className="absolute bottom-3 right-3.5 pointer-events-none z-20 text-right">
            <div className="text-[7px] font-mono text-cyan-200 tracking-widest uppercase bg-black/80 px-2 py-0.5 border border-cyan-400/30 backdrop-blur-xs">
              ASPECT: 3:4 · ISO 400 · 45MM · F/1.4
            </div>
          </div>
        </div>
      );
    }

    return null;
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
            {renderMastheadBylineAndDate()}
          </div>
          
          {/* Vogue Left Articles */}
          <div className="absolute top-1/3 left-8 z-10 flex flex-col gap-8 max-w-[200px]">
            <div>
              <InlineEditableText
                value={headlineText}
                onChange={(v) => { setHeadlineText(v); setHasCustomizedText(true); }}
                tag="h3"
                className="text-white font-sans font-bold text-xl tracking-widest mb-1 leading-tight"
                style={{ textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}
                placeholder="Headline"
                title="Click to edit headline"
                isInlineEditingAllowed={isInlineEditingAllowed}
              />
              <InlineEditableText
                value={subheadlineText}
                onChange={(v) => { setSubheadlineText(v); setHasCustomizedText(true); }}
                tag="p"
                className="text-white/90 font-serif text-sm italic"
                style={{ textShadow: '0 1px 5px rgba(0,0,0,0.8)' }}
                placeholder="Subheadline"
                title="Click to edit subheadline"
                isInlineEditingAllowed={isInlineEditingAllowed}
              />
            </div>
            <div>
              <InlineEditableText
                value={secondaryHeadline}
                onChange={(v) => { setSecondaryHeadline(v); setHasCustomizedText(true); }}
                tag="h3"
                className="text-white font-sans font-bold text-xl tracking-widest mb-1 leading-tight"
                style={{ textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}
                placeholder="Feature 2"
                title="Click to edit feature headline"
                isInlineEditingAllowed={isInlineEditingAllowed}
              />
              <InlineEditableText
                value={secondarySubheadline}
                onChange={(v) => { setSecondarySubheadline(v); setHasCustomizedText(true); }}
                tag="p"
                className="text-white/90 font-serif text-sm italic"
                style={{ textShadow: '0 1px 5px rgba(0,0,0,0.8)' }}
                placeholder="Feature 2 Subhead"
                title="Click to edit subheadline"
                isInlineEditingAllowed={isInlineEditingAllowed}
              />
            </div>
          </div>

          {/* Vogue Right Articles */}
          <div className="absolute top-1/2 right-8 z-10 flex flex-col gap-8 max-w-[180px] text-right">
            <div>
              <InlineEditableText
                value={tertiaryHeadline}
                onChange={(v) => { setTertiaryHeadline(v); setHasCustomizedText(true); }}
                tag="h3"
                className="text-red-500 font-sans font-bold text-lg tracking-widest mb-1 leading-tight"
                style={{ textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}
                placeholder="Feature 3"
                title="Click to edit feature headline"
                isInlineEditingAllowed={isInlineEditingAllowed}
              />
              <InlineEditableText
                value={tertiarySubheadline}
                onChange={(v) => { setTertiarySubheadline(v); setHasCustomizedText(true); }}
                tag="p"
                className="text-white/90 font-serif text-sm italic"
                style={{ textShadow: '0 1px 5px rgba(0,0,0,0.8)' }}
                placeholder="Feature 3 Subhead"
                title="Click to edit subheadline"
                isInlineEditingAllowed={isInlineEditingAllowed}
              />
            </div>
          </div>

          {/* Vogue Quote */}
          <div className="absolute bottom-12 left-8 right-8 z-10 text-center">
            <p className="text-white font-serif text-lg md:text-xl leading-snug italic" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
              {coverQuote || '"A very formal classic enthusiast of Versace, Hugo Boss, Armani, and Louis Vuitton, and an Asian-made critic of high distinction."'}
            </p>
          </div>

          {/* Vogue Barcode / Issue details */}
          <div className="absolute bottom-6 right-6 z-10 flex flex-col items-end">
            <div className="flex items-center gap-1.5 text-white/90 text-[10px] uppercase tracking-widest mb-1.5 font-medium">
              <InlineEditableText
                value={coverDate}
                onChange={(v) => { setCoverDate(v); setHasCustomizedText(true); }}
                placeholder="Cover Date"
                title="Click to edit date"
                tag="span"
                className="hover:text-amber-300 font-semibold"
                isInlineEditingAllowed={isInlineEditingAllowed}
              />
              <span className="opacity-40">·</span>
              <InlineEditableText
                value={issueNumber}
                onChange={(v) => { setIssueNumber(v); setHasCustomizedText(true); }}
                placeholder="Issue #"
                title="Click to edit issue number"
                tag="span"
                className="hover:text-amber-300"
                isInlineEditingAllowed={isInlineEditingAllowed}
              />
            </div>
            <div className="w-10 h-10 bg-white/90 flex items-center justify-center p-1">
              <div className="w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1MCIgaGVpZ2h0PSIyMCI+PHBhdGggZD0iTTAgMGgydjIwaC0yem00IDBoMXYyMGgtMXptMyAwaDF2MjBoLTF6bTIgMGgydjIwaC0yem00IDBoMXYyMGgtMXptMiAwaDN2MjBoLTN6bTQgMGgxdjIwaC0xem0yIDBoMnYyMGgtMnptNCAwaDF2MjBoLTF6IiBmaWxsPSIjMDAwIi8+PC9zdmc+')] bg-repeat-x opacity-80" />
            </div>
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
            {renderMastheadBylineAndDate()}
          </div>

          {/* Bazaar Left Articles */}
          <div className="absolute top-1/3 left-6 z-10 flex flex-col gap-6 max-w-[220px]">
            <div className="border-l-2 border-white pl-4">
              <InlineEditableText
                value={headlineText}
                onChange={(v) => { setHeadlineText(v); setHasCustomizedText(true); }}
                tag="h3"
                className="text-white font-serif text-2xl uppercase tracking-widest leading-tight mb-1"
                style={{ textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}
                placeholder="Headline"
                title="Click to edit headline"
                isInlineEditingAllowed={isInlineEditingAllowed}
              />
              <InlineEditableText
                value={subheadlineText}
                onChange={(v) => { setSubheadlineText(v); setHasCustomizedText(true); }}
                tag="p"
                className="text-white/80 font-sans text-xs uppercase tracking-widest"
                style={{ textShadow: '0 1px 5px rgba(0,0,0,0.8)' }}
                placeholder="Subheadline"
                title="Click to edit subheadline"
                isInlineEditingAllowed={isInlineEditingAllowed}
              />
            </div>
            <div className="border-l-2 border-white pl-4">
              <InlineEditableText
                value={secondaryHeadline}
                onChange={(v) => { setSecondaryHeadline(v); setHasCustomizedText(true); }}
                tag="h3"
                className="text-white font-serif text-xl uppercase tracking-widest leading-tight mb-1"
                style={{ textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}
                placeholder="Feature 2"
                title="Click to edit feature headline"
                isInlineEditingAllowed={isInlineEditingAllowed}
              />
              <InlineEditableText
                value={secondarySubheadline}
                onChange={(v) => { setSecondarySubheadline(v); setHasCustomizedText(true); }}
                tag="p"
                className="text-white/80 font-sans text-xs uppercase tracking-widest"
                style={{ textShadow: '0 1px 5px rgba(0,0,0,0.8)' }}
                placeholder="Feature 2 Subhead"
                title="Click to edit subheadline"
                isInlineEditingAllowed={isInlineEditingAllowed}
              />
            </div>
          </div>

          {/* Bazaar Right Articles */}
          <div className="absolute bottom-1/3 right-6 z-10 flex flex-col gap-6 max-w-[200px] text-right">
             <div className="border-r-2 border-white pr-4">
              <InlineEditableText
                value={tertiaryHeadline}
                onChange={(v) => { setTertiaryHeadline(v); setHasCustomizedText(true); }}
                tag="h3"
                className="text-white font-serif text-2xl uppercase tracking-widest leading-tight mb-1"
                style={{ textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}
                placeholder="Feature 3"
                title="Click to edit feature headline"
                isInlineEditingAllowed={isInlineEditingAllowed}
              />
              <InlineEditableText
                value={tertiarySubheadline}
                onChange={(v) => { setTertiarySubheadline(v); setHasCustomizedText(true); }}
                tag="p"
                className="text-white/80 font-sans text-xs uppercase tracking-widest"
                style={{ textShadow: '0 1px 5px rgba(0,0,0,0.8)' }}
                placeholder="Feature 3 Subhead"
                title="Click to edit subheadline"
                isInlineEditingAllowed={isInlineEditingAllowed}
              />
            </div>
          </div>

          {/* Bazaar Quote */}
          <div className="absolute bottom-8 left-8 right-8 z-10 bg-white/10 backdrop-blur-md p-4 border border-white/20">
            <p className="text-white font-serif text-sm md:text-base leading-snug text-center uppercase tracking-widest" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
              {coverQuote || 'A very formal classic enthusiast of Versace, Hugo Boss, Armani, and Louis Vuitton, and an Asian-made critic of high distinction.'}
            </p>
          </div>

          {/* Bazaar Barcode / Issue details */}
          <div className="absolute bottom-6 right-6 z-10 flex flex-col items-end">
            <div className="flex items-center gap-1.5 text-white/90 text-[10px] uppercase tracking-widest mb-1.5 font-medium">
              <InlineEditableText
                value={coverDate}
                onChange={(v) => { setCoverDate(v); setHasCustomizedText(true); }}
                placeholder="Cover Date"
                title="Click to edit date"
                tag="span"
                className="hover:text-amber-300 font-semibold"
                isInlineEditingAllowed={isInlineEditingAllowed}
              />
              <span className="opacity-40">·</span>
              <InlineEditableText
                value={issueNumber}
                onChange={(v) => { setIssueNumber(v); setHasCustomizedText(true); }}
                placeholder="Issue #"
                title="Click to edit issue number"
                tag="span"
                className="hover:text-amber-300"
                isInlineEditingAllowed={isInlineEditingAllowed}
              />
            </div>
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
            {renderMastheadBylineAndDate()}
          </div>

          {/* Elle Right Articles */}
          <div className="absolute top-12 right-8 z-10 flex flex-col gap-6 max-w-[180px] text-right">
            <div>
              <div className="bg-pink-500 text-white text-xs font-bold px-2 py-1 inline-block mb-2 uppercase tracking-widest shadow-lg">Exclusive</div>
              <InlineEditableText
                value={tertiaryHeadline}
                onChange={(v) => { setTertiaryHeadline(v); setHasCustomizedText(true); }}
                tag="h3"
                className="text-white font-sans font-black text-xl uppercase leading-none mb-1 block"
                style={{ textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}
                placeholder="Feature Headline"
                title="Click to edit headline"
                isInlineEditingAllowed={isInlineEditingAllowed}
              />
            </div>
          </div>

          {/* Elle Left Articles */}
          <div className="absolute bottom-1/3 left-8 z-10 flex flex-col gap-8 max-w-[250px]">
            <div>
              <InlineEditableText
                value={headlineText}
                onChange={(v) => { setHeadlineText(v); setHasCustomizedText(true); }}
                tag="h3"
                className="text-pink-400 font-sans font-black text-3xl uppercase leading-none mb-1 block"
                style={{ textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}
                placeholder="Headline"
                title="Click to edit headline"
                isInlineEditingAllowed={isInlineEditingAllowed}
              />
              <InlineEditableText
                value={subheadlineText}
                onChange={(v) => { setSubheadlineText(v); setHasCustomizedText(true); }}
                tag="p"
                className="text-white font-sans font-bold text-sm uppercase tracking-wider block"
                style={{ textShadow: '0 1px 5px rgba(0,0,0,0.8)' }}
                placeholder="Subheadline"
                title="Click to edit subheadline"
                isInlineEditingAllowed={isInlineEditingAllowed}
              />
            </div>
            <div>
              <InlineEditableText
                value={secondaryHeadline}
                onChange={(v) => { setSecondaryHeadline(v); setHasCustomizedText(true); }}
                tag="h3"
                className="text-white font-sans font-black text-2xl uppercase leading-none mb-1 block"
                style={{ textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}
                placeholder="Feature 2"
                title="Click to edit headline"
                isInlineEditingAllowed={isInlineEditingAllowed}
              />
              <InlineEditableText
                value={secondarySubheadline}
                onChange={(v) => { setSecondarySubheadline(v); setHasCustomizedText(true); }}
                tag="p"
                className="text-yellow-300 font-sans font-bold text-sm uppercase tracking-wider block"
                style={{ textShadow: '0 1px 5px rgba(0,0,0,0.8)' }}
                placeholder="Feature 2 Subhead"
                title="Click to edit subheadline"
                isInlineEditingAllowed={isInlineEditingAllowed}
              />
            </div>
          </div>

          {/* Elle Quote */}
          <div className="absolute bottom-12 left-8 right-8 z-10">
            <div className="bg-pink-500 w-12 h-2 mb-4 shadow-lg"></div>
            <p className="text-white font-sans font-bold text-lg md:text-xl leading-tight uppercase" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
              {coverQuote || 'A very formal classic enthusiast of Versace, Hugo Boss, Armani, and Louis Vuitton, and an Asian-made critic of high distinction.'}
            </p>
          </div>

          {/* Elle Barcode / Issue details */}
          <div className="absolute bottom-6 right-6 z-10 flex flex-col items-end">
            <div className="flex items-center gap-1.5 text-white/90 text-[10px] uppercase tracking-widest mb-1.5 font-medium">
              <InlineEditableText
                value={coverDate}
                onChange={(v) => { setCoverDate(v); setHasCustomizedText(true); }}
                placeholder="Cover Date"
                title="Click to edit date"
                tag="span"
                className="hover:text-amber-300 font-semibold"
                isInlineEditingAllowed={isInlineEditingAllowed}
              />
              <span className="opacity-40">·</span>
              <InlineEditableText
                value={issueNumber}
                onChange={(v) => { setIssueNumber(v); setHasCustomizedText(true); }}
                placeholder="Issue #"
                title="Click to edit issue number"
                tag="span"
                className="hover:text-amber-300"
                isInlineEditingAllowed={isInlineEditingAllowed}
              />
            </div>
          </div>
        </>
      );
    }

    // Default Layout (Aspen Fashion, GQ, Cowboy Chick, etc.)
    const renderDefaultMasthead = () => {
      if (selectedMagazine === 'ASPEN FASHION') {
        return (
          <>
            <h1 className="text-7xl md:text-[8rem] font-serif text-white tracking-tighter font-bold opacity-100 leading-[0.8]" style={{ textShadow: '0 10px 30px rgba(0,0,0,0.9), 0 2px 10px rgba(0,0,0,0.8)', textAlign: 'center', width: '100%' }}>
              ASPEN
            </h1>
            {renderMastheadBylineAndDate()}
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
          {renderMastheadBylineAndDate()}
          </>
        );
      }

      if (selectedMagazine === 'theCorridor.biz') {
        return (
          <>
          <h1 className="text-5xl md:text-7xl font-sans text-white tracking-tight font-bold opacity-100 leading-[0.8]" style={{ textShadow: '0 10px 30px rgba(0,0,0,0.9), 0 2px 10px rgba(0,0,0,0.8)', textAlign: 'center', width: '100%' }}>
            {selectedMagazine}
          </h1>
          {renderMastheadBylineAndDate()}
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
            {renderMastheadBylineAndDate()}
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
        {renderMastheadBylineAndDate()}
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

        {/* Left Side: Magazine Titles with Direct Inline Editing */}
        <div className="absolute top-1/2 -translate-y-1/2 left-8 z-10 flex flex-col gap-8 max-w-[200px] md:max-w-[250px] mt-16">
          <div className="group/item cursor-default">
            <InlineEditableText
              value={headlineText}
              onChange={(v) => { setHeadlineText(v); setHasCustomizedText(true); }}
              tag="h3"
              className="text-white font-serif text-lg md:text-xl leading-tight tracking-tight block"
              style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}
              placeholder="Headline 1"
              title="Click to edit headline"
              isInlineEditingAllowed={isInlineEditingAllowed}
            />
            <div className="h-[1px] w-0 group-hover/item:w-full bg-white transition-all duration-300 mt-1" />
            <InlineEditableText
              value={subheadlineText}
              onChange={(v) => { setSubheadlineText(v); setHasCustomizedText(true); }}
              tag="p"
              className="text-white/80 text-[11px] md:text-sm sans-serif uppercase tracking-[0.15em] mt-1.5 block"
              style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
              placeholder="Subheadline 1"
              title="Click to edit subheadline"
              isInlineEditingAllowed={isInlineEditingAllowed}
            />
          </div>

          <div className="group/item cursor-default">
            <InlineEditableText
              value={secondaryHeadline}
              onChange={(v) => { setSecondaryHeadline(v); setHasCustomizedText(true); }}
              tag="h3"
              className="text-white font-serif text-lg md:text-xl leading-tight tracking-tight text-amber-300 block"
              style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}
              placeholder="Headline 2"
              title="Click to edit headline"
              isInlineEditingAllowed={isInlineEditingAllowed}
            />
            <div className="h-[1px] w-0 group-hover/item:w-full bg-amber-300 transition-all duration-300 mt-1" />
            <InlineEditableText
              value={secondarySubheadline}
              onChange={(v) => { setSecondarySubheadline(v); setHasCustomizedText(true); }}
              tag="p"
              className="text-white/80 text-[11px] md:text-sm sans-serif uppercase tracking-[0.15em] mt-1.5 block"
              style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
              placeholder="Subheadline 2"
              title="Click to edit subheadline"
              isInlineEditingAllowed={isInlineEditingAllowed}
            />
          </div>

          <div className="group/item cursor-default">
            <InlineEditableText
              value={tertiaryHeadline}
              onChange={(v) => { setTertiaryHeadline(v); setHasCustomizedText(true); }}
              tag="h3"
              className="text-white font-serif text-lg md:text-xl leading-tight tracking-tight block"
              style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}
              placeholder="Headline 3"
              title="Click to edit headline"
              isInlineEditingAllowed={isInlineEditingAllowed}
            />
            <div className="h-[1px] w-0 group-hover/item:w-full bg-white transition-all duration-300 mt-1" />
            <InlineEditableText
              value={tertiarySubheadline}
              onChange={(v) => { setTertiarySubheadline(v); setHasCustomizedText(true); }}
              tag="p"
              className="text-white/80 text-[11px] md:text-sm sans-serif uppercase tracking-[0.15em] mt-1.5 block"
              style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
              placeholder="Subheadline 3"
              title="Click to edit subheadline"
              isInlineEditingAllowed={isInlineEditingAllowed}
            />
          </div>

          <div className="group/item cursor-default">
            <InlineEditableText
              value={quaternaryHeadline}
              onChange={(v) => { setQuaternaryHeadline(v); setHasCustomizedText(true); }}
              tag="h3"
              className="text-white font-serif text-lg md:text-xl leading-tight tracking-tight text-yellow-400 block"
              style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}
              placeholder="Headline 4"
              title="Click to edit headline"
              isInlineEditingAllowed={isInlineEditingAllowed}
            />
            <div className="h-[1px] w-0 group-hover/item:w-full bg-yellow-400 transition-all duration-300 mt-1" />
            <InlineEditableText
              value={quaternarySubheadline}
              onChange={(v) => { setQuaternarySubheadline(v); setHasCustomizedText(true); }}
              tag="p"
              className="text-white/80 text-[11px] md:text-sm sans-serif uppercase tracking-[0.15em] mt-1.5 block"
              style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
              placeholder="Subheadline 4"
              title="Click to edit subheadline"
              isInlineEditingAllowed={isInlineEditingAllowed}
            />
          </div>
        </div>

        {/* Quote / Highlight */}
        <div className="absolute bottom-8 left-8 right-24 z-10">
          <div className="border-l-2 border-white/80 pl-4 py-1">
            <p className="text-white/90 font-serif text-xs md:text-sm leading-snug italic" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
              {coverQuote || (selectedMagazine === 'COWBOY CHICK' 
                ? '"Floating collars and studded vests redefine western swagger with relaxed selvedge denim and high-end artisan boots."'
                : '"A very formal classic enthusiast of Versace, Hugo Boss, Armani, and Louis Vuitton, and an Asian-made critic of high distinction."'
              )}
            </p>
          </div>
        </div>
        
        {/* Barcode / Issue details with Interactive Date & Issue Number */}
        <div className="absolute bottom-8 right-8 z-10 flex flex-col items-end">
          {showPlacementSeal && (
            <div className="mb-2 bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 text-black px-2.5 py-1 rounded-sm shadow-xl border border-yellow-200 text-center flex items-center gap-1">
              <Award className="w-3.5 h-3.5" />
              <span className="text-[9px] font-black uppercase tracking-wider">$50 VERIFIED SPREAD</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-white/90 text-[10px] uppercase tracking-widest mb-2 font-medium">
            <InlineEditableText
              value={coverDate}
              onChange={(v) => { setCoverDate(v); setHasCustomizedText(true); }}
              placeholder="Cover Date"
              title="Click to edit issue date"
              tag="span"
              className="hover:text-amber-300 font-semibold"
              isInlineEditingAllowed={isInlineEditingAllowed}
            />
            <span className="opacity-40">·</span>
            <InlineEditableText
              value={issueNumber}
              onChange={(v) => { setIssueNumber(v); setHasCustomizedText(true); }}
              placeholder="Issue #"
              title="Click to edit issue number"
              tag="span"
              className="hover:text-amber-300"
              isInlineEditingAllowed={isInlineEditingAllowed}
            />
          </div>
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

            {/* Layout Overlay Filter / Selector */}
            <div className="flex items-center bg-zinc-100 p-1 border border-zinc-300 rounded-sm">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 pl-2 pr-1.5 font-semibold flex items-center gap-1">
                <Sliders className="w-3 h-3 text-zinc-600" />
                <span className="hidden sm:inline">Overlay:</span>
              </span>
              {LAYOUT_OVERLAY_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setLayoutOverlay(opt.id)}
                  className={`px-2.5 py-1 text-xs uppercase tracking-wider font-semibold transition-all cursor-pointer rounded-xs flex items-center gap-1.5 ${
                    layoutOverlay === opt.id
                      ? 'bg-black text-white shadow-xs font-bold'
                      : 'text-zinc-600 hover:text-black hover:bg-zinc-200/70'
                  }`}
                  title={`${opt.label} Overlay: ${opt.description}`}
                >
                  {opt.id === 'Editorial' && <Sparkles className="w-3 h-3 text-amber-400" />}
                  {opt.id === 'Street Style' && <Zap className="w-3 h-3 text-yellow-400" />}
                  {opt.id === 'Avant-Garde' && <Crosshair className="w-3 h-3 text-cyan-400" />}
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {viewMode === 'cover' && (
                <>
                  <button
                    type="button"
                    onClick={() => setIsInlineEditorOpen(!isInlineEditorOpen)}
                    className={`px-3 py-2 border text-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                      isInlineEditorOpen 
                        ? 'bg-amber-400 text-black border-amber-500 font-bold shadow-xs' 
                        : 'bg-white hover:bg-zinc-50 text-zinc-800 border-zinc-300'
                    }`}
                    title="Customize headlines, date, and text on cover"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                    <span>{isInlineEditorOpen ? 'Hide Text Editor' : 'Edit Text & Date'}</span>
                  </button>
                  <button
                    onClick={() => setShowPlacementSeal(!showPlacementSeal)}
                    className={`px-3 py-2 border text-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer ${
                      showPlacementSeal ? 'bg-amber-100 text-amber-950 border-amber-300' : 'bg-white text-zinc-600 border-zinc-300'
                    }`}
                    title="Toggle $50 Placement Gold Seal stamp on cover"
                  >
                    Seal: {showPlacementSeal ? 'ON' : 'OFF'}
                  </button>
                </>
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
              <a
                href={getTwitterShareUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-black hover:bg-zinc-800 text-white transition-colors uppercase tracking-wider text-xs font-semibold cursor-pointer shadow-sm ${!currentImage ? 'pointer-events-none opacity-50' : ''}`}
                title="Share cover on X (Twitter)"
                aria-label="Share on X (Twitter)"
              >
                <Twitter className="w-3.5 h-3.5 fill-current" />
                <span className="hidden sm:inline">X / Twitter</span>
                <span className="sm:hidden">X</span>
              </a>
              <a
                href={getPinterestShareUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-[#E60023] hover:bg-[#b80018] text-white transition-colors uppercase tracking-wider text-xs font-semibold cursor-pointer shadow-sm ${!currentImage ? 'pointer-events-none opacity-50' : ''}`}
                title="Pin cover to Pinterest"
                aria-label="Pin on Pinterest"
              >
                <Pin className="w-3.5 h-3.5 fill-white" />
                <span className="hidden sm:inline">Pinterest</span>
                <span className="sm:hidden">Pin</span>
              </a>
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
                onClick={() => {
                  setViewMode('cover');
                  setIsPrintReadyMode(true);
                }}
                disabled={!currentImage}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-zinc-900 hover:bg-black text-white transition-colors disabled:opacity-50 uppercase tracking-wider text-xs font-semibold cursor-pointer shadow-sm border border-zinc-800"
                title="Print Magazine (Hides navigation & UI for clean print-ready layout)"
              >
                <Printer className="w-3.5 h-3.5 text-amber-400" />
                <span>Print Magazine</span>
              </button>
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
        <div className="bg-white p-4 sm:p-8 border border-zinc-200 flex flex-col items-center justify-center shadow-sm">
          {/* Quick Helper Banner for Layout Overlay & Inline Text Editor */}
          <div className="w-full max-w-[600px] mb-4 p-3 bg-zinc-50 border border-zinc-200 text-xs rounded-sm shadow-xs flex flex-col gap-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              {/* Overlay Selector Pills */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-700 flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5 text-zinc-600" />
                  <span>Overlay:</span>
                </span>
                <div className="inline-flex rounded-sm p-0.5 bg-zinc-200/80 border border-zinc-300">
                  {LAYOUT_OVERLAY_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setLayoutOverlay(opt.id)}
                      className={`px-2 py-0.5 text-[11px] uppercase tracking-wider font-semibold transition-all cursor-pointer rounded-xs flex items-center gap-1 ${
                        layoutOverlay === opt.id
                          ? 'bg-white text-zinc-950 font-bold shadow-xs'
                          : 'text-zinc-600 hover:text-black'
                      }`}
                      title={opt.description}
                    >
                      {opt.id === 'Editorial' && <Sparkles className="w-3 h-3 text-amber-500" />}
                      {opt.id === 'Street Style' && <Zap className="w-3 h-3 text-yellow-600" />}
                      {opt.id === 'Avant-Garde' && <Crosshair className="w-3 h-3 text-cyan-600" />}
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Editor Drawer Toggle & Reset */}
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsInlineEditorOpen(!isInlineEditorOpen)}
                  className="text-amber-700 hover:text-amber-800 font-bold underline underline-offset-2 cursor-pointer text-xs flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>{isInlineEditorOpen ? 'Hide Editor Panel' : 'Edit Text'}</span>
                </button>
                {hasCustomizedText && (
                  <button
                    type="button"
                    onClick={() => resetToMagazineDefaults()}
                    className="text-zinc-500 hover:text-red-600 text-[11px] uppercase tracking-wider font-semibold cursor-pointer border-l border-zinc-300 pl-2.5 flex items-center gap-1"
                    title="Reset cover text back to default publication headlines"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            </div>

            {/* Description of active layout overlay */}
            <div className="text-[11px] text-zinc-500 font-mono flex items-center gap-1.5 border-t border-zinc-200/80 pt-1.5">
              <span className="font-bold text-zinc-700 uppercase tracking-wider">
                [{layoutOverlay} Overlay]:
              </span>
              <span className="text-zinc-600">
                {LAYOUT_OVERLAY_OPTIONS.find(o => o.id === layoutOverlay)?.description}
              </span>
            </div>
          </div>

          {/* Centralized Text & Date Customization Panel */}
          {isInlineEditorOpen && (
            <div className="w-full max-w-[600px] mb-6">
              {renderInlineTextEditorBar(true)}
            </div>
          )}

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
                  className={`absolute inset-0 w-full h-full object-cover transition-all duration-300 ${
                    layoutOverlay === 'Street Style' 
                      ? 'contrast-[1.06] saturate-[1.04]' 
                      : layoutOverlay === 'Avant-Garde'
                      ? 'contrast-[1.08] brightness-[0.98]'
                      : 'contrast-[1.02]'
                  }`}
                />
                {/* Quick action buttons overlay on hover */}
                <div className="absolute top-4 right-4 z-30 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                  <a
                    href={getTwitterShareUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="bg-black/80 hover:bg-black text-white p-2 text-xs flex items-center justify-center backdrop-blur-sm shadow-lg cursor-pointer transition-colors"
                    title="Share Cover to Twitter / X"
                  >
                    <Twitter className="w-3.5 h-3.5 fill-white" />
                  </a>
                  <a
                    href={getPinterestShareUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="bg-[#E60023]/90 hover:bg-[#b80018] text-white p-2 text-xs flex items-center justify-center backdrop-blur-sm shadow-lg cursor-pointer transition-colors"
                    title="Pin Cover to Pinterest"
                  >
                    <Pin className="w-3.5 h-3.5 fill-white" />
                  </a>
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
                    <span>Download</span>
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

            {/* Visual Layout Overlay (Editorial, Street Style, or Avant-Garde) */}
            {currentImage && renderLayoutOverlayGraphic(layoutOverlay)}

            {currentImage && renderCoverContent()}
          </div>

          {/* Social Media Sharing Strip Under Cover */}
          {currentImage && (
            <div className="mt-6 p-4 bg-zinc-50 border border-zinc-200 max-w-[600px] w-full flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
              <div className="text-center sm:text-left">
                <span className="text-xs uppercase tracking-widest font-bold text-zinc-900 block">
                  Share Your {selectedMagazine} Cover
                </span>
                <span className="text-[11px] text-zinc-500">
                  Publish directly to social feeds or pin to moodboards
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-center">
                <a
                  href={getTwitterShareUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-black hover:bg-zinc-800 text-white text-xs font-semibold tracking-wider uppercase flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                  title="Share Cover on Twitter / X"
                >
                  <Twitter className="w-3.5 h-3.5 fill-current" />
                  <span>X / Twitter</span>
                </a>
                <a
                  href={getPinterestShareUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-[#E60023] hover:bg-[#b80018] text-white text-xs font-semibold tracking-wider uppercase flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                  title="Pin Cover to Pinterest"
                >
                  <Pin className="w-3.5 h-3.5 fill-white" />
                  <span>Pinterest</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('cover');
                    setIsPrintReadyMode(true);
                  }}
                  className="px-3 py-1.5 bg-zinc-900 hover:bg-black text-white text-xs font-semibold tracking-wider uppercase flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                  title="Print Magazine (Hides UI for Print-Ready Layout)"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-400" />
                  <span>Print Magazine</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(true)}
                  className="px-2.5 py-1.5 bg-white hover:bg-zinc-100 text-zinc-800 text-xs font-semibold tracking-wider uppercase flex items-center gap-1 border border-zinc-300 transition-colors cursor-pointer"
                  title="More Sharing Options"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>More</span>
                </button>
              </div>
            </div>
          )}
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
              {/* Visual Layout Overlay on Spread */}
              {currentImage && renderLayoutOverlayGraphic(layoutOverlay, true)}
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
          <div className="mt-6 flex flex-wrap justify-center items-center gap-3">
            <button
              onClick={() => handleDownloadImage(currentImage || undefined, `${selectedMagazine.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-spread-photo.jpg`)}
              className="py-2.5 px-4 bg-zinc-900 hover:bg-black text-white text-xs uppercase font-semibold tracking-wider flex items-center gap-2 cursor-pointer shadow"
            >
              <Download className="w-4 h-4" />
              <span>Download Spread Image</span>
            </button>
            <a
              href={getTwitterShareUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-4 bg-black hover:bg-zinc-800 text-white text-xs uppercase font-semibold tracking-wider flex items-center gap-2 cursor-pointer shadow"
              title="Share Spread to Twitter / X"
            >
              <Twitter className="w-4 h-4 fill-current" />
              <span>Share Spread on X</span>
            </a>
            <a
              href={getPinterestShareUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-4 bg-[#E60023] hover:bg-[#b80018] text-white text-xs uppercase font-semibold tracking-wider flex items-center gap-2 cursor-pointer shadow"
              title="Pin Spread to Pinterest"
            >
              <Pin className="w-4 h-4 fill-white" />
              <span>Pin Spread to Pinterest</span>
            </a>
            <button
              onClick={() => {
                setViewMode('cover');
                setIsPrintReadyMode(true);
              }}
              className="py-2.5 px-4 bg-zinc-900 hover:bg-black text-white text-xs uppercase font-semibold tracking-wider flex items-center gap-2 cursor-pointer shadow"
              title="Print Magazine (Hides UI for Print-Ready Layout)"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>Print Magazine</span>
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

      {/* SOCIAL MEDIA SHARING MODAL */}
      {isShareModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsShareModalOpen(false)}
        >
          <div 
            className="bg-white max-w-md w-full p-6 sm:p-8 shadow-2xl border border-zinc-200 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setIsShareModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-black transition-colors p-1 cursor-pointer"
              aria-label="Close share modal"
            >
              <CloseIcon className="w-5 h-5" />
            </button>

            {/* Modal Title & Info */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-zinc-100 flex items-center justify-center text-zinc-900 border border-zinc-200">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-serif uppercase tracking-wider text-zinc-950 font-bold">
                  Share Magazine Cover
                </h3>
                <p className="text-xs text-zinc-500 uppercase tracking-wider">
                  {selectedMagazine} · Editorial Feature
                </p>
              </div>
            </div>

            {/* Preview Banner */}
            <div className="flex gap-3.5 p-3 bg-zinc-50 border border-zinc-200 mb-5 items-center">
              {currentImage && (
                <div className="w-12 h-16 bg-zinc-200 flex-shrink-0 overflow-hidden border border-zinc-300 shadow-xs">
                  <img src={currentImage} alt="Cover Preview" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold font-serif uppercase tracking-wider text-zinc-900 truncate">
                  {selectedMagazine}
                </div>
                <div className="text-[11px] text-zinc-600 italic line-clamp-2 mt-0.5">
                  {coverQuote || '"A masterclass in modern silhouette and high altitude elegance."'}
                </div>
                <div className="text-[10px] text-emerald-800 font-semibold tracking-wider uppercase mt-1">
                  Ready to publish to social media
                </div>
              </div>
            </div>

            {/* Social Action Grid */}
            <div className="space-y-2.5">
              {/* Twitter / X */}
              <a
                href={getTwitterShareUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 bg-black hover:bg-zinc-800 text-white font-semibold text-xs uppercase tracking-wider flex items-center justify-between transition-colors shadow-sm group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-zinc-900 flex items-center justify-center group-hover:bg-zinc-800">
                    <Twitter className="w-4 h-4 fill-white text-white" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold">Share to X (Twitter)</div>
                    <div className="text-[10px] text-zinc-400 font-normal normal-case">Post with hashtags & cover headline</div>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
              </a>

              {/* Pinterest */}
              <a
                href={getPinterestShareUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 bg-[#E60023] hover:bg-[#b80018] text-white font-semibold text-xs uppercase tracking-wider flex items-center justify-between transition-colors shadow-sm group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#ad081b] flex items-center justify-center">
                    <Pin className="w-4 h-4 fill-white text-white" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold">Pin to Pinterest</div>
                    <div className="text-[10px] text-red-100 font-normal normal-case">Save to fashion & editorial boards</div>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-red-200 group-hover:text-white transition-colors" />
              </a>

              {/* Copy Direct Link */}
              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full py-3 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-semibold text-xs uppercase tracking-wider flex items-center justify-between transition-colors border border-zinc-300 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center border border-zinc-300">
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-zinc-700" />}
                  </div>
                  <div className="text-left">
                    <div className="font-bold">
                      {copiedLink ? 'Link Copied to Clipboard!' : 'Copy Direct Studio Link'}
                    </div>
                    <div className="text-[10px] text-zinc-500 font-normal normal-case">
                      {copiedLink ? 'Ready to paste anywhere' : 'Share link with friends or clients'}
                    </div>
                  </div>
                </div>
                <span className={`text-[10px] font-bold ${copiedLink ? 'text-emerald-700' : 'text-zinc-500'}`}>
                  {copiedLink ? 'COPIED' : 'COPY'}
                </span>
              </button>

              {/* Native Device Share */}
              {typeof navigator !== 'undefined' && navigator.share && (
                <button
                  type="button"
                  onClick={handleNativeDeviceShare}
                  className="w-full py-2.5 px-4 bg-white hover:bg-zinc-50 text-zinc-700 font-medium text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors border border-zinc-200 cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Device System Share</span>
                </button>
              )}
            </div>

            {/* Helpful Tip */}
            <div className="mt-5 pt-3.5 border-t border-zinc-200 text-[11px] text-zinc-500 flex items-start gap-2">
              <Download className="w-4 h-4 text-zinc-400 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Tip:</strong> Tap <strong>Download Cover</strong> on the Magazine toolbar to save the high-res typography graphics to attach directly to your tweet or pin!
              </span>
            </div>
          </div>
        </div>
      )}

      {/* SIMULATED PRINT-READY LAYOUT STAGE */}
      {isPrintReadyMode && (
        <div 
          id="print-magazine-root"
          className="fixed inset-0 z-50 bg-[#0e0e10] text-zinc-900 overflow-y-auto flex flex-col items-center justify-start py-4 sm:py-8 px-2 sm:px-6 print:p-0 print:m-0 print:bg-white print:static print:inset-auto print:overflow-visible print:w-full print:h-auto"
        >
          {/* Top Floating Utility Bar - Hidden during actual print */}
          <div className="no-print print:hidden sticky top-2 z-50 w-full max-w-4xl bg-zinc-900/95 backdrop-blur-md border border-zinc-800 px-4 py-3 mb-6 flex flex-wrap items-center justify-between gap-3 text-white shadow-2xl rounded-md">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsPrintReadyMode(false)}
                className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer border border-zinc-700"
                title="Exit print layout and return to editor (Esc)"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Exit Print Mode</span>
              </button>
              <div className="hidden sm:block">
                <div className="text-xs font-serif font-bold uppercase tracking-widest text-white">
                  {selectedMagazine} · Print-Ready Layout
                </div>
                <div className="text-[11px] text-zinc-400">
                  Navigation and UI hidden · Standard 8.5" × 11" Editorial Trim Proof
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Layout Overlay Selector in Print Mode */}
              <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded p-0.5 text-xs">
                <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 pl-2 pr-1 font-bold flex items-center gap-1">
                  <Sliders className="w-3 h-3 text-zinc-400" />
                  <span className="hidden md:inline">Overlay:</span>
                </span>
                {LAYOUT_OVERLAY_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setLayoutOverlay(opt.id)}
                    className={`px-2 py-1 text-[11px] uppercase tracking-wider font-semibold rounded-xs transition-colors cursor-pointer flex items-center gap-1 ${
                      layoutOverlay === opt.id
                        ? 'bg-amber-400 text-black font-bold shadow-xs'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                    title={opt.description}
                  >
                    {opt.id === 'Editorial' && <Sparkles className="w-2.5 h-2.5" />}
                    {opt.id === 'Street Style' && <Zap className="w-2.5 h-2.5" />}
                    {opt.id === 'Avant-Garde' && <Crosshair className="w-2.5 h-2.5" />}
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setShowCropMarks(!showCropMarks)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs uppercase tracking-wider font-medium border transition-colors cursor-pointer ${
                  showCropMarks 
                    ? 'bg-zinc-800 border-zinc-600 text-amber-300' 
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
                title="Toggle printer trim & crop alignment marks"
              >
                <Scissors className="w-3.5 h-3.5" />
                <span>{showCropMarks ? 'Crop Marks: On' : 'Crop Marks: Off'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsInlineEditorOpen(!isInlineEditorOpen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs uppercase tracking-wider font-medium border transition-colors cursor-pointer ${
                  isInlineEditorOpen
                    ? 'bg-amber-400 border-amber-500 text-black font-bold'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white'
                }`}
                title="Edit headlines and date on the print proof"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isInlineEditorOpen ? 'Hide Editor' : 'Edit Text'}</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-400 hover:bg-amber-300 text-black font-serif uppercase tracking-widest text-xs font-bold rounded shadow-lg transition-all cursor-pointer"
                title="Print magazine cover or export to high-res PDF"
              >
                <Printer className="w-4 h-4 text-black" />
                <span>Print / Save PDF</span>
              </button>

              <button
                type="button"
                onClick={() => setIsPrintReadyMode(false)}
                className="p-1.5 text-zinc-400 hover:text-white rounded hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Close Print Mode (Esc)"
                aria-label="Close Print Mode"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Inline Editor Drawer in Print Mode (Hidden in actual print output) */}
          {isInlineEditorOpen && (
            <div className="no-print print:hidden w-full max-w-4xl mb-6">
              {renderInlineTextEditorBar(true)}
            </div>
          )}

          {/* Simulated Print Proof Canvas */}
          <div className="w-full max-w-[700px] flex flex-col items-center print:w-full print:max-w-none print:m-0">
            {/* The Print Sheet (Simulating real heavy matte archival paper) */}
            <div className="bg-white p-6 sm:p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.9)] relative w-full border border-zinc-300/40 print:border-none print:p-0 print:shadow-none print:w-full print:m-0">
              
              {/* Printer's Crop Marks & Bleed Indicators */}
              {showCropMarks && (
                <div className="no-print print:hidden">
                  {/* Top-Left Corner Crop Marks */}
                  <div className="absolute top-3 left-3 pointer-events-none">
                    <div className="w-5 h-[1px] bg-black" />
                    <div className="w-[1px] h-5 bg-black" />
                  </div>
                  {/* Top-Right Corner Crop Marks */}
                  <div className="absolute top-3 right-3 pointer-events-none flex flex-col items-end">
                    <div className="w-5 h-[1px] bg-black" />
                    <div className="w-[1px] h-5 bg-black" />
                  </div>
                  {/* Bottom-Left Corner Crop Marks */}
                  <div className="absolute bottom-3 left-3 pointer-events-none flex flex-col justify-end">
                    <div className="w-[1px] h-5 bg-black" />
                    <div className="w-5 h-[1px] bg-black" />
                  </div>
                  {/* Bottom-Right Corner Crop Marks */}
                  <div className="absolute bottom-3 right-3 pointer-events-none flex flex-col items-end justify-end">
                    <div className="w-[1px] h-5 bg-black" />
                    <div className="w-5 h-[1px] bg-black" />
                  </div>

                  {/* Top Margin: CMYK Density Swatches & Print Calibration */}
                  <div className="flex items-center justify-between mb-4 px-1 text-[9px] font-mono text-zinc-500 uppercase tracking-wider">
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center gap-0.5">
                        <span className="w-3.5 h-3.5 bg-[#00A3E0] inline-block border border-black/20" title="Cyan 100%" />
                        <span className="w-3.5 h-3.5 bg-[#EC008C] inline-block border border-black/20" title="Magenta 100%" />
                        <span className="w-3.5 h-3.5 bg-[#FFD100] inline-block border border-black/20" title="Yellow 100%" />
                        <span className="w-3.5 h-3.5 bg-[#000000] inline-block border border-black/20" title="Key / Black 100%" />
                      </div>
                      <span className="text-[10px] text-zinc-700 font-bold tracking-tight">CMYK PROOF</span>
                    </div>
                    <div className="text-[10px] text-zinc-500 hidden sm:block font-mono">
                      TRIM: 8.5" × 11" · 300 DPI · HIGH-GLOSS COAT
                    </div>
                    <div className="text-[10px] text-zinc-500 font-mono">
                      BLEED: 0.125"
                    </div>
                  </div>
                </div>
              )}

              {/* Pure Magazine Cover (Contains ONLY the generated cover image and its details) */}
              <div 
                className="relative w-full aspect-[3/4] bg-zinc-950 overflow-hidden shadow-lg border border-zinc-200/50 print:border-none print:shadow-none print:w-full print:h-auto print:aspect-[3/4]"
              >
                {currentImage && (
                  <img 
                    src={currentImage} 
                    alt={`${selectedMagazine} Print Cover`} 
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}
                {/* Dark Vignette Overlay for Crisp Typography Legibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/60 pointer-events-none" />

                {/* Visual Layout Overlay (Editorial, Street Style, or Avant-Garde) */}
                {currentImage && renderLayoutOverlayGraphic(layoutOverlay)}

                {/* Editorial Details: Masthead, Articles, Quotes, Barcode, Issue, Seal */}
                {currentImage && renderCoverContent()}
              </div>

              {/* Bottom Bleed Margin: Publication Slug & Approval Line */}
              {showCropMarks && (
                <div className="no-print print:hidden mt-4 pt-2.5 border-t border-dashed border-zinc-300 flex flex-wrap items-center justify-between text-[10px] font-mono text-zinc-500">
                  <span className="font-bold text-zinc-700 uppercase">
                    {selectedMagazine} · ISSUE 01 · VOL. XXIV
                  </span>
                  <span className="hidden sm:inline">
                    FLEURISH & ASPEN FASHION PUBLISHING HOUSE
                  </span>
                  <span className="text-emerald-700 font-semibold uppercase">
                    PRESS OK: APPROVED PRINT PROOF
                  </span>
                </div>
              )}
            </div>

            {/* Informational Guidance */}
            <div className="no-print print:hidden text-zinc-400 text-xs text-center mt-4 max-w-lg px-2">
              <p>
                <strong>Print-Ready Layout Mode:</strong> All application navigation, menus, tabs, and interactive buttons have been hidden to simulate a true-to-life editorial magazine proof. Click <strong>Print / Save PDF</strong> to output directly to your printer or save as a PDF.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

