/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { getCreationsFromDB } from './lib/indexedDB';
import { ApiKeyWrapper } from './components/ApiKeyWrapper';
import { Studio } from './components/Studio';
import { Magazine } from './components/Magazine';
import { Gallery } from './components/Gallery';
import { Podcast } from './components/Podcast';
import { Runway } from './components/Runway';
import { MusicPlayer } from './components/MusicPlayer';
import { Carousel, GalleryItem } from './components/Carousel';
import { Login } from './components/Login';
import { SubscribeModal } from './components/SubscribeModal';
import { Camera, BookOpen, Image as ImageIcon, Mic, Video } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const INITIAL_GALLERY: GalleryItem[] = [
  {
    id: 1,
    url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop',
    user: 'Patrick Henry Sweeney',
    stars: 124,
    comments: 12,
    commentsList: [],
    quote: '"A masterclass in modern silhouette and daring contrast."'
  },
  {
    id: 2,
    url: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1000&auto=format&fit=crop',
    user: 'Aspen Editorial',
    stars: 89,
    comments: 5,
    commentsList: [],
    quote: '"Redefining the boundaries of street couture."'
  },
  {
    id: 3,
    url: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=1000&auto=format&fit=crop',
    user: 'Guest Critic',
    stars: 256,
    comments: 34,
    commentsList: [],
    quote: '"An absolute triumph of texture and light."'
  },
  {
    id: 4,
    url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1000&auto=format&fit=crop',
    user: 'Paris Runway',
    stars: 412,
    comments: 56,
    commentsList: [],
    quote: '"The epitome of avant-garde elegance."'
  }
];

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<'studio' | 'magazine' | 'gallery' | 'podcast' | 'runway'>('studio');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [coverQuote, setCoverQuote] = useState<string | null>(null);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>(INITIAL_GALLERY);
  const [isSubscribeModalOpen, setIsSubscribeModalOpen] = useState(false);

  // Update the latest gallery item's quote when it becomes available
  useEffect(() => {
    if (coverQuote && galleryItems.length > 0) {
      setGalleryItems(prev => {
        const newItems = [...prev];
        // Assuming the first item is the latest generated one
        if (newItems[0].quote !== coverQuote) {
          newItems[0] = { ...newItems[0], quote: coverQuote };
          return newItems;
        }
        return prev;
      });
    }
  }, [coverQuote]);

  useEffect(() => {
    if (!isLoggedIn) return;

    const loadLocalAndDBCreations = async (dbItems: GalleryItem[] = []) => {
      let localItems: GalleryItem[] = [];
      try {
        const stored = await getCreationsFromDB();
        const sortedStored = [...stored].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        localItems = sortedStored.map((item: any) => ({
          id: item.id || `local-${Date.now()}`,
          url: item.dataUrl,
          user: auth.currentUser?.displayName ? auth.currentUser.displayName : 'Aspen Creator (Local)',
          stars: 0,
          comments: 0,
          commentsList: [],
          quote: item.prompt ? `"${item.prompt.substring(0, 50)}..."` : undefined,
          createdAt: item.createdAt
        }));
      } catch (e) {
        console.error("Failed to load local creations:", e);
      }

      // Merge and remove duplicates by url
      const seenUrls = new Set();
      const merged: GalleryItem[] = [];
      
      // Prioritize database items, then local cached items
      [...dbItems, ...localItems].forEach(item => {
        if (!seenUrls.has(item.url)) {
          seenUrls.add(item.url);
          merged.push(item);
        }
      });

      setGalleryItems([...merged, ...INITIAL_GALLERY]);
    };

    // Initial load of local creations
    loadLocalAndDBCreations();

    // Listen for custom update events (e.g., when saving new items offline)
    const handleLocalUpdate = () => {
      loadLocalAndDBCreations();
    };
    window.addEventListener('creations-updated', handleLocalUpdate);

    // If we have a real non-emulated user, subscribe to Firestore
    let unsubscribe = () => {};
    if (auth.currentUser && !auth.currentUser.uid.startsWith('google-emulated')) {
      try {
        const q = query(
          collection(db, 'creations'),
          where('userId', '==', auth.currentUser?.uid)
        );
        unsubscribe = onSnapshot(q, (snapshot) => {
          const docData = snapshot.docs.map(doc => {
            const data = doc.data();
            const date = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now());
            return { doc, date };
          });
          docData.sort((a, b) => b.date.getTime() - a.date.getTime());

          const dbItems: GalleryItem[] = docData.map(({ doc }) => {
            const data = doc.data();
            return {
              id: doc.id as unknown as number,
              url: data.dataUrl,
              user: auth.currentUser?.displayName || 'Aspen Creator',
              stars: 0,
              comments: 0,
              commentsList: [],
              quote: data.prompt ? `"${data.prompt.substring(0, 50)}..."` : undefined
            };
          });

          loadLocalAndDBCreations(dbItems);
        }, (error) => {
          console.warn("Firestore connection suspended, continuing in offline cache mode:", error);
          loadLocalAndDBCreations();
        });
      } catch (e) {
        console.warn("Firestore listener setup failed, continuing in offline cache mode:", e);
      }
    }

    return () => {
      unsubscribe();
      window.removeEventListener('creations-updated', handleLocalUpdate);
    };
  }, [isLoggedIn]);

  const handleImageGenerated = (url: string) => {
    setGeneratedImage(url);
    setGalleryItems(prev => [
      {
        id: Date.now(),
        url,
        user: 'Patrick Henry Sweeney',
        stars: 0,
        comments: 0,
        commentsList: [],
        quote: coverQuote || undefined
      },
      ...prev
    ]);
  };

  if (!isLoggedIn) {
    return <Login onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <ApiKeyWrapper>
      <div 
        className="min-h-screen text-zinc-900 font-sans flex flex-col bg-cover bg-center bg-fixed relative"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=2000&auto=format&fit=crop')" }}
      >
        <div className="absolute inset-0 bg-white/90 pointer-events-none" />
        <div className="relative z-10 flex flex-col min-h-screen">
          {/* Header */}
          <header className="bg-white/80 backdrop-blur-md border-b border-zinc-200 sticky top-0 z-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
              <div className="flex flex-col justify-center">
                <h1 className="text-xl sm:text-2xl font-serif uppercase tracking-widest font-bold leading-none">ASPEN FASHION</h1>
              </div>
              <MusicPlayer />
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 overflow-hidden">
            <AnimatePresence mode="wait">
              {activeTab === 'studio' && (
                <motion.div
                  key="studio"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                >
                  <Studio onImageGenerated={handleImageGenerated} coverQuote={coverQuote} setCoverQuote={setCoverQuote} />
                </motion.div>
              )}
              {activeTab === 'magazine' && (
                <motion.div
                  key="magazine"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                >
                  <Magazine generatedImage={generatedImage} coverQuote={coverQuote} />
                </motion.div>
              )}
              {activeTab === 'gallery' && (
                <motion.div
                  key="gallery"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                >
                  <Gallery items={galleryItems} setItems={setGalleryItems} />
                </motion.div>
              )}
              {activeTab === 'podcast' && (
                <motion.div
                  key="podcast"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                >
                  <Podcast />
                </motion.div>
              )}
              {activeTab === 'runway' && (
                <motion.div
                  key="runway"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                >
                  <Runway generatedImage={generatedImage} />
                </motion.div>
              )}
            </AnimatePresence>
          </main>

          {/* Bottom Navigation */}
          <nav className="bg-white/80 backdrop-blur-md border-t border-zinc-200 w-full z-20 sm:relative sm:border-none sm:bg-transparent">
            <div className="max-w-md mx-auto sm:max-w-none sm:flex sm:justify-center sm:pb-4">
              <div className="flex justify-around sm:justify-center sm:gap-8 p-4 sm:p-0 flex-wrap">
                <button
                  onClick={() => setActiveTab('studio')}
                  className={`flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-4 py-2 rounded-full transition-colors ${activeTab === 'studio' ? 'text-black sm:bg-white/80 sm:shadow-sm' : 'text-zinc-600 hover:text-black'}`}
                >
                  <Camera className="w-5 h-5" />
                  <span className="text-xs sm:text-sm font-medium uppercase tracking-wider">Studio</span>
                </button>
                <button
                  onClick={() => setActiveTab('runway')}
                  className={`flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-4 py-2 rounded-full transition-colors ${activeTab === 'runway' ? 'text-black sm:bg-white/80 sm:shadow-sm' : 'text-zinc-600 hover:text-black'}`}
                >
                  <Video className="w-5 h-5" />
                  <span className="text-xs sm:text-sm font-medium uppercase tracking-wider">Runway</span>
                </button>
                <button
                  onClick={() => setActiveTab('magazine')}
                  className={`flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-4 py-2 rounded-full transition-colors ${activeTab === 'magazine' ? 'text-black sm:bg-white/80 sm:shadow-sm' : 'text-zinc-600 hover:text-black'}`}
                >
                  <BookOpen className="w-5 h-5" />
                  <span className="text-xs sm:text-sm font-medium uppercase tracking-wider">Magazine</span>
                </button>
                <button
                  onClick={() => setActiveTab('gallery')}
                  className={`flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-4 py-2 rounded-full transition-colors ${activeTab === 'gallery' ? 'text-black sm:bg-white/80 sm:shadow-sm' : 'text-zinc-600 hover:text-black'}`}
                >
                  <ImageIcon className="w-5 h-5" />
                  <span className="text-xs sm:text-sm font-medium uppercase tracking-wider">Gallery</span>
                </button>
                <button
                  onClick={() => setActiveTab('podcast')}
                  className={`flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-4 py-2 rounded-full transition-colors ${activeTab === 'podcast' ? 'text-black sm:bg-white/80 sm:shadow-sm' : 'text-zinc-600 hover:text-black'}`}
                >
                  <Mic className="w-5 h-5" />
                  <span className="text-xs sm:text-sm font-medium uppercase tracking-wider">Podcast</span>
                </button>
              </div>
            </div>
          </nav>

          {/* Bottom Carousel */}
          <Carousel items={galleryItems} setItems={setGalleryItems} onRemix={(url) => {
            setGeneratedImage(url);
            setActiveTab('studio');
          }} />

          {/* Footer Links */}
          <footer className="bg-zinc-950 text-zinc-400 py-4 text-center text-xs uppercase tracking-widest border-t border-zinc-800 flex flex-col sm:flex-row justify-center items-center gap-4">
            <a href="https://aspenfashion.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
              Back to AspenFashion.com
            </a>
            <span className="hidden sm:inline">•</span>
            <button 
              onClick={() => setIsSubscribeModalOpen(true)}
              className="hover:text-white transition-colors font-bold text-white"
            >
              SUBSCRIBE
            </button>
          </footer>
        </div>
      </div>

      <SubscribeModal 
        isOpen={isSubscribeModalOpen} 
        onClose={() => setIsSubscribeModalOpen(false)} 
      />
    </ApiKeyWrapper>
  );
}
