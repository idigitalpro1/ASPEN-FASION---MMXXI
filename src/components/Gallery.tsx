import { useState } from 'react';
import { Star, MessageCircle, Share2, Award, Download, X, Trash2, Copy, Check, Send, Globe, Mail, Sparkles, ExternalLink } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { GalleryItem } from './Carousel';
import { Watermark } from './Watermark';

interface ShareModalProps {
  item: GalleryItem;
  onClose: () => void;
}

function ShareModal({ item, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [isSharingNative, setIsSharingNative] = useState(false);
  const shareTitle = `Fleurish Studio Look by ${item.user}`;
  const shareText = item.quote 
    ? `${item.quote} — Discover this luxury fashion look on Fleurish Studio` 
    : `Check out this luxury fashion look created by ${item.user} on Fleurish Studio!`;
  
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const input = document.createElement('input');
        input.value = shareUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleNativeShare = async () => {
    setIsSharingNative(true);
    try {
      if (navigator.share) {
        if (item.url.startsWith('data:image')) {
          try {
            const res = await fetch(item.url);
            const blob = await res.blob();
            const file = new File([blob], `fleurish-look-${item.id}.png`, { type: blob.type || 'image/png' });
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
              await navigator.share({
                title: shareTitle,
                text: shareText,
                files: [file],
              });
              setIsSharingNative(false);
              return;
            }
          } catch (e) {
            console.warn('File share fallback to text/url:', e);
          }
        }
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
      } else {
        handleCopyLink();
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.warn('Share error:', err);
      }
    } finally {
      setIsSharingNative(false);
    }
  };

  const socialLinks = [
    {
      name: 'X / Twitter',
      color: 'bg-black hover:bg-zinc-800 text-white border-zinc-700',
      icon: <span className="font-bold text-xs">𝕏</span>,
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`
    },
    {
      name: 'Pinterest',
      color: 'bg-red-600 hover:bg-red-700 text-white border-red-600',
      icon: <span className="font-bold text-xs">P</span>,
      url: `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(shareUrl)}&media=${encodeURIComponent(item.url.startsWith('http') ? item.url : shareUrl)}&description=${encodeURIComponent(shareText)}`
    },
    {
      name: 'Facebook',
      color: 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600',
      icon: <span className="font-bold text-xs">f</span>,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
    },
    {
      name: 'WhatsApp',
      color: 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600',
      icon: <Send className="w-3.5 h-3.5" />,
      url: `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`
    },
    {
      name: 'LinkedIn',
      color: 'bg-sky-700 hover:bg-sky-800 text-white border-sky-700',
      icon: <Globe className="w-3.5 h-3.5" />,
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
    },
    {
      name: 'Email',
      color: 'bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700',
      icon: <Mail className="w-3.5 h-3.5" />,
      url: `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(shareText + '\n\n' + shareUrl)}`
    }
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-zinc-950 border border-zinc-800 text-white w-full max-w-md p-6 shadow-2xl rounded-none relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 transition-colors"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-yellow-500" />
          <h3 className="font-serif text-lg uppercase tracking-widest text-white">Broadcast Fashion Look</h3>
        </div>
        <p className="text-xs text-zinc-400 mb-5">Share this couture creation across social platforms or your device.</p>

        {/* Thumbnail Preview */}
        <div className="flex gap-4 p-3 bg-zinc-900 border border-zinc-800 mb-5">
          <img 
            src={item.url} 
            alt={item.user} 
            className="w-16 h-20 object-cover border border-zinc-700 flex-shrink-0"
          />
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <div className="text-xs font-serif uppercase tracking-wider text-yellow-500 font-bold truncate">
              {item.user}
            </div>
            <p className="text-[11px] text-zinc-300 italic line-clamp-2 mt-1">
              {item.quote || '"Avant-garde red carpet luxury look."'}
            </p>
            <div className="flex items-center gap-3 mt-2 text-[10px] text-zinc-400">
              <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-500 fill-yellow-500" /> {item.stars}</span>
              <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3 text-zinc-400" /> {item.comments}</span>
              {item.award && <span className="text-yellow-400 uppercase tracking-widest">{item.award}</span>}
            </div>
          </div>
        </div>

        {/* Primary Native Web Share */}
        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <button
            onClick={handleNativeShare}
            disabled={isSharingNative}
            className="w-full py-3 mb-4 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-colors shadow-md"
          >
            <Share2 className="w-4 h-4" />
            {isSharingNative ? 'Opening Share Menu...' : 'Share via Device (AirDrop, IG, SMS)'}
          </button>
        )}

        {/* Social Platforms Grid */}
        <div className="space-y-2 mb-5">
          <div className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">Broadcast to Social Platforms</div>
          <div className="grid grid-cols-3 gap-2">
            {socialLinks.map((social) => (
              <a
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center justify-center gap-1.5 py-2.5 px-2 text-[11px] font-medium border transition-colors ${social.color}`}
              >
                {social.icon}
                <span className="truncate">{social.name}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Copy Shareable Link Bar */}
        <div className="space-y-1.5">
          <div className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">Shareable Link</div>
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 p-1.5">
            <input 
              type="text" 
              readOnly 
              value={shareUrl}
              className="bg-transparent text-xs text-zinc-300 flex-1 px-2 outline-none truncate font-mono"
            />
            <button
              onClick={handleCopyLink}
              className={`px-3 py-1.5 text-[11px] uppercase tracking-wider font-semibold transition-all flex items-center gap-1.5 ${
                copied 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-white text-black hover:bg-zinc-200'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy Link
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function GalleryCard({ 
  item, 
  handleStar, 
  handlePost, 
  handleDownload, 
  handleDelete,
  onShare,
  inputs, 
  setInputs,
  isStarred = false
}: { 
  item: GalleryItem, 
  handleStar: (id: number) => void, 
  handlePost: (id: number) => void, 
  handleDownload: (url: string, user: string, tier: string) => void, 
  handleDelete?: (id: number) => void,
  onShare: (item: GalleryItem) => void,
  inputs: Record<number, string>, 
  setInputs: (inputs: Record<number, string>) => void,
  isStarred?: boolean
}) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div className="relative group w-full h-[600px]" style={{ perspective: '1000px' }}>
      <div 
        className="w-full h-full transition-transform duration-700 relative"
        style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
      >
        {/* Front */}
        <div 
          className="absolute inset-0 bg-white border border-zinc-200 flex flex-col cursor-pointer shadow-sm hover:shadow-md transition-shadow overflow-hidden"
          style={{ backfaceVisibility: 'hidden' }}
          onClick={() => setIsFlipped(true)}
        >
          <div className="relative flex-1 overflow-hidden bg-zinc-100">
            <img 
              src={item.url} 
              alt={`Fashion by ${item.user}`}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/60 pointer-events-none" />
            
            {/* Top Bar: Volume */}
            <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10 pointer-events-none">
              <div className="flex gap-2 pointer-events-auto">
                {handleDelete && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(item.id);
                    }}
                    className="bg-black/60 hover:bg-red-600 text-white p-2 rounded-full transition-colors backdrop-blur-sm"
                    title="Delete from Gallery"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 pointer-events-auto">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onShare(item);
                  }}
                  className="bg-black/60 hover:bg-yellow-500 hover:text-black text-white p-2 rounded-full transition-all backdrop-blur-sm shadow-md flex items-center justify-center"
                  title="Share Look"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <div className="text-white/90 text-[8px] uppercase tracking-widest text-right pointer-events-none" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                  VOL 4. / EXCLUSIVE
                </div>
              </div>
            </div>

            {/* Left Side: Magazine Titles */}
            <div className="absolute top-1/2 -translate-y-1/2 left-4 z-10 flex flex-col gap-4 max-w-[120px] pointer-events-none">
              <div>
                <h3 className="text-white font-serif text-xs leading-tight" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>THE NEW AVANT-GARDE</h3>
                <p className="text-white/80 text-[7px] sans-serif uppercase tracking-wider mt-0.5" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>Redefining Luxury</p>
              </div>
              <div>
                <h3 className="text-white font-serif text-xs leading-tight" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>MIDNIGHT CYBER</h3>
                <p className="text-white/80 text-[7px] sans-serif uppercase tracking-wider mt-0.5" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>Neon Trends 2026</p>
              </div>
              <div>
                <h3 className="text-white font-serif text-xs leading-tight text-yellow-400" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>GOLDEN AGE GLAMOUR</h3>
              </div>
            </div>

            {/* Quote / Highlight */}
            <div className="absolute bottom-16 left-4 right-16 z-10 pointer-events-none">
              <div className="border-l-2 border-white/80 pl-2 py-1">
                <p className="text-white/90 font-serif text-[8px] leading-snug italic" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                  {item.quote || '"A very formal classic enthusiast of Versace, Hugo Boss, Armani, and Louis Vuitton, and an Asian-made critic of high distinction."'}
                </p>
              </div>
            </div>

            <Watermark />
            {item.award && (
              <div className="absolute top-16 right-4 bg-black text-white px-3 py-1 text-xs uppercase tracking-widest font-medium flex items-center gap-1 shadow-lg z-30">
                <Award className="w-3 h-3" />
                {item.award}
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 text-black px-4 py-2 text-xs uppercase tracking-widest font-medium shadow-lg backdrop-blur-sm">
                View Details & Award
              </div>
            </div>
          </div>
          <div className="p-4 flex justify-between items-center bg-white z-10 border-t border-zinc-100">
            <span className="font-serif uppercase tracking-widest text-sm truncate mr-2">{item.user}</span>
            <div className="flex gap-3 shrink-0 items-center">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onShare(item);
                }}
                className="text-zinc-400 hover:text-black transition-colors p-1 flex items-center gap-1 text-xs uppercase tracking-wider font-semibold"
                title="Share Look"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Share</span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleStar(item.id);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
                  isStarred 
                    ? 'text-yellow-600 bg-yellow-500/15 border border-yellow-500/30' 
                    : 'text-zinc-600 hover:text-yellow-600 hover:bg-yellow-500/10 border border-transparent hover:border-yellow-500/20'
                }`}
                title="Star this look (+1)"
                aria-label={`Star look by ${item.user}, currently ${item.stars} stars`}
              >
                <Star className={`w-4 h-4 transition-transform hover:scale-110 active:scale-125 ${
                  isStarred ? 'fill-yellow-500 text-yellow-500' : 'hover:fill-yellow-500'
                }`} />
                <span className="text-sm font-medium">{item.stars}</span>
              </button>
              <div className="flex items-center gap-1 text-zinc-500">
                <MessageCircle className="w-4 h-4" />
                <span className="text-sm font-medium">{item.comments}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Back */}
        <div 
          className="absolute inset-0 bg-zinc-950 text-white border border-zinc-800 flex flex-col p-6 overflow-hidden shadow-xl"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <button 
            onClick={(e) => { e.stopPropagation(); setIsFlipped(false); }} 
            className="absolute top-4 right-4 text-zinc-400 hover:text-white p-2"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="text-center mb-6 mt-2">
            <h3 className="text-2xl font-serif uppercase tracking-widest text-yellow-500 mb-2">"You Got The Look"</h3>
            <div className="text-xs tracking-widest uppercase text-zinc-400">Award Page</div>
          </div>

          <div className="flex justify-center gap-6 mb-6">
            <button
              type="button"
              onClick={() => handleStar(item.id)}
              className="flex flex-col items-center gap-2 cursor-pointer group/rate hover:scale-105 transition-transform"
              title="Click to Star (+1)"
            >
              <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-inner group-hover/rate:border-yellow-500/50">
                <Star className={`w-5 h-5 text-yellow-500 transition-transform ${isStarred ? 'fill-yellow-500' : 'group-hover/rate:fill-yellow-500'}`} />
              </div>
              <span className="text-[9px] uppercase tracking-widest text-zinc-400 group-hover/rate:text-yellow-500 text-center">Top Rated ({item.stars})</span>
            </button>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-inner">
                <Award className="w-5 h-5 text-yellow-500" />
              </div>
              <span className="text-[9px] uppercase tracking-widest text-zinc-500 text-center">Editor's Pick</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-inner">
                <MessageCircle className="w-5 h-5 text-yellow-500" />
              </div>
              <span className="text-[9px] uppercase tracking-widest text-zinc-500 text-center">Trending</span>
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto space-y-2 pr-2 mb-4 text-sm text-zinc-300 scrollbar-hide">
              {item.commentsList?.map((comment, idx) => (
                <div key={idx} className="bg-zinc-900 p-3 rounded border border-zinc-800 text-sm">
                  {comment}
                </div>
              ))}
              {(!item.commentsList || item.commentsList.length === 0) && (
                <div className="text-center text-zinc-600 italic mt-8 text-sm">No comments yet. Be the first!</div>
              )}
            </div>

            <div className="flex gap-2 mb-6">
              <input 
                type="text" 
                value={inputs[item.id] || ''}
                onChange={(e) => setInputs({ ...inputs, [item.id]: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handlePost(item.id)}
                placeholder="Add a comment..." 
                className="flex-1 border-b border-zinc-700 py-2 text-sm focus:outline-none focus:border-yellow-500 bg-transparent text-white placeholder-zinc-600"
              />
              <button 
                onClick={() => handlePost(item.id)}
                disabled={!inputs[item.id]?.trim()}
                className="text-xs uppercase tracking-widest font-medium text-yellow-500 hover:text-yellow-400 disabled:opacity-50"
              >
                Post
              </button>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-zinc-800">
            <div className="flex gap-2">
              <button 
                type="button"
                onClick={() => handleStar(item.id)}
                className="flex-1 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-colors hover:text-yellow-500 cursor-pointer"
              >
                <Star className={`w-4 h-4 text-yellow-500 ${isStarred ? 'fill-yellow-500' : ''}`} /> Star ({item.stars})
              </button>
              <button 
                onClick={() => onShare(item)}
                className="flex-1 py-2.5 bg-zinc-900 hover:bg-yellow-500 hover:text-black border border-zinc-800 hover:border-yellow-500 text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all font-semibold"
              >
                <Share2 className="w-4 h-4" /> Share
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button 
                onClick={() => handleDownload(item.url, item.user, '1K')}
                className="py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[9px] sm:text-[10px] uppercase tracking-widest flex flex-col items-center justify-center gap-1 transition-colors"
              >
                <Download className="w-3 h-3" />
                <span>1K (Free)</span>
              </button>
              <button 
                onClick={() => handleDownload(item.url, item.user, '2K')}
                className="py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[9px] sm:text-[10px] uppercase tracking-widest flex flex-col items-center justify-center gap-1 transition-colors text-yellow-500"
              >
                <Download className="w-3 h-3" />
                <span>2K ($2)</span>
              </button>
              <button 
                onClick={() => handleDownload(item.url, item.user, '4K')}
                className="py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[9px] sm:text-[10px] uppercase tracking-widest flex flex-col items-center justify-center gap-1 transition-colors text-yellow-500"
              >
                <Download className="w-3 h-3" />
                <span>4K ($4)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Gallery({ items, setItems }: { items: GalleryItem[], setItems: (items: GalleryItem[]) => void }) {
  const [inputs, setInputs] = useState<Record<number, string>>({});
  const [sharingItem, setSharingItem] = useState<GalleryItem | null>(null);
  const [starredIds, setStarredIds] = useState<Set<number>>(new Set());
  const [starNotice, setStarNotice] = useState<string | null>(null);

  const handleStar = async (id: number) => {
    const targetItem = items.find(item => item.id === id);
    if (!targetItem) return;

    const newStars = (targetItem.stars || 0) + 1;

    // Optimistically update the gallery state
    setItems(items.map(item => 
      item.id === id ? { ...item, stars: newStars } : item
    ));

    // Mark as starred in session
    setStarredIds(prev => new Set(prev).add(id));

    // Toast feedback
    setStarNotice(`★ Starred look by ${targetItem.user} (${newStars} stars)`);
    setTimeout(() => {
      setStarNotice(prev => (prev?.includes(`${newStars} stars`) ? null : prev));
    }, 3000);

    // Save interaction to Firestore for the logged-in user
    try {
      const currentUserId = auth.currentUser?.uid || 'guest-user';
      const currentUserEmail = auth.currentUser?.email || null;
      const currentUserName = auth.currentUser?.displayName || 'Aspen Fashion Member';

      await addDoc(collection(db, 'star_interactions'), {
        userId: currentUserId,
        userEmail: currentUserEmail,
        userName: currentUserName,
        itemId: String(id),
        itemUser: targetItem.user || 'Editorial Look',
        stars: newStars,
        type: 'star',
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.warn("Firestore star interaction save notice:", error);
      try {
        handleFirestoreError(error, OperationType.CREATE, 'star_interactions');
      } catch (err) {
        console.error("Firestore error logged:", err);
      }
    }
  };

  const handlePost = (id: number) => {
    const text = inputs[id];
    if (!text || !text.trim()) return;
    
    setItems(items.map(item => 
      item.id === id ? { 
        ...item, 
        comments: item.comments + 1,
        commentsList: [...(item.commentsList || []), text.trim()]
      } : item
    ));
    
    setInputs({ ...inputs, [id]: '' });
  };

  const handleDelete = (id: number) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleShare = (item: GalleryItem) => {
    setSharingItem(item);
  };

  const handleDownload = async (url: string, user: string, tier: string) => {
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = url;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        
        // Only add watermark for 1K (Free) tier
        if (tier === '1K') {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
          ctx.shadowBlur = 6;
          
          // Aspen Fashion (Moved to bottom left)
          ctx.font = `bold ${Math.max(24, img.height * 0.04)}px serif`;
          ctx.fillText('ASPEN FASHION', img.width * 0.03, img.height - img.height * 0.08);
          
          // Patrick Henry Sweeney (Directly under Fashion)
          ctx.font = `${Math.max(10, img.height * 0.015)}px sans-serif`;
          ctx.fillText('PATRICK HENRY SWEENEY', img.width * 0.03, img.height - img.height * 0.05);
        }
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `aspen-fashion-${user.replace(/\s+/g, '-').toLowerCase()}-${tier}.jpg`;
        a.click();
      }
    } catch (error) {
      console.error('Error downloading image:', error);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aspen-fashion-${user.replace(/\s+/g, '-').toLowerCase()}-${tier}.jpg`;
      a.target = '_blank';
      a.click();
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-20">
      <div className="mb-12 text-center">
        <h2 className="text-4xl font-serif uppercase tracking-widest mb-4">The Gallery</h2>
        <p className="text-zinc-500 max-w-2xl mx-auto">
          Discover the most stunning red carpet looks generated by our community. Rate, comment, and share to elevate your favorites to the top.
        </p>
      </div>

      {items.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((item) => (
            <GalleryCard 
              key={item.id}
              item={item}
              handleStar={handleStar}
              handlePost={handlePost}
              handleDownload={handleDownload}
              handleDelete={handleDelete}
              onShare={handleShare}
              inputs={inputs}
              setInputs={setInputs}
              isStarred={starredIds.has(item.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 border-2 border-dashed border-zinc-200 bg-white/50">
          <Award className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
          <h3 className="text-xl font-serif uppercase tracking-widest text-zinc-400">Gallery is Empty</h3>
          <p className="text-zinc-500 mt-2">Be the first to create a masterpiece in the Studio!</p>
        </div>
      )}

      {/* Luxury feedback toast for star interactions */}
      {starNotice && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-950/95 text-white border border-yellow-500/40 px-4 py-3 shadow-2xl backdrop-blur-md rounded-none flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <div className="w-7 h-7 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center shrink-0">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-yellow-500">Interaction Saved</p>
            <p className="text-xs text-zinc-300">{starNotice}</p>
          </div>
          <button 
            type="button"
            onClick={() => setStarNotice(null)}
            className="text-zinc-500 hover:text-white ml-2 p-1"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {sharingItem && (
        <ShareModal 
          item={sharingItem} 
          onClose={() => setSharingItem(null)} 
        />
      )}
    </div>
  );
}

