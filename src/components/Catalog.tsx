import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, BookOpen, Award, Sparkles, Download, 
  ExternalLink, Eye, Plus, Check, ShieldCheck, Tag, X, Image as ImageIcon,
  RefreshCw
} from 'lucide-react';
import { CatalogItem } from '../types';
import { getLocalCatalogItems, saveCatalogItem } from '../lib/catalogData';
import { downloadImageLocally } from '../lib/download';
import { auth } from '../firebase';
import { GalleryItem } from './Carousel';

interface CatalogProps {
  onOpenPlacementModal: (preselectedImage?: string) => void;
  onOpenInMagazine: (imageUrl: string, quote?: string) => void;
  galleryItems?: GalleryItem[];
  onRemix?: (url: string) => void;
}

export function Catalog({
  onOpenPlacementModal,
  onOpenInMagazine,
  galleryItems = [],
  onRemix
}: CatalogProps) {
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeason, setSelectedSeason] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [filterPlacementOnly, setFilterPlacementOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'spread'>('grid');
  
  // Detail Modal State
  const [activeItemModal, setActiveItemModal] = useState<CatalogItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Add Item form state
  const [newTitle, setNewTitle] = useState('');
  const [newDesigner, setNewDesigner] = useState(auth.currentUser?.displayName || 'Patrick Henry Sweeney');
  const [newBrand, setNewBrand] = useState('Aspen Studio');
  const [newCategory, setNewCategory] = useState('Outerwear');
  const [newSeason, setNewSeason] = useState('Winter 2026');
  const [newPrice, setNewPrice] = useState('$1,950');
  const [newMaterials, setNewMaterials] = useState('Fine Cashmere & Silk');
  const [newDescription, setNewDescription] = useState('Bespoke runway tailored piece.');
  const [newImageUrl, setNewImageUrl] = useState(galleryItems.length > 0 ? galleryItems[0].url : '');

  // Load catalog items and subscribe to updates
  useEffect(() => {
    const loadItems = () => {
      const items = getLocalCatalogItems();
      setCatalogItems(items);
    };

    loadItems();

    const handleUpdate = () => {
      loadItems();
    };

    window.addEventListener('catalog-updated', handleUpdate);
    window.addEventListener('placements-updated', handleUpdate);

    return () => {
      window.removeEventListener('catalog-updated', handleUpdate);
      window.removeEventListener('placements-updated', handleUpdate);
    };
  }, []);

  // Filter items
  const filteredItems = catalogItems.filter(item => {
    const matchesSearch = 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.designer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.brand && item.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.collection && item.collection.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.materials && item.materials.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesSeason = selectedSeason === 'All' || item.season?.includes(selectedSeason);
    const matchesCategory = selectedCategory === 'All' || item.category?.toLowerCase() === selectedCategory.toLowerCase();
    const matchesPlacement = !filterPlacementOnly || item.isPlacement;

    return matchesSearch && matchesSeason && matchesCategory && matchesPlacement;
  });

  const handleCreateCatalogItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newImageUrl || !newTitle || !newDesigner) {
      alert('Please provide a title, designer, and image for the catalog piece.');
      return;
    }

    const newItem: CatalogItem = {
      id: `custom-cat-${Date.now()}`,
      userId: auth.currentUser?.uid || 'guest-creator',
      title: newTitle,
      designer: newDesigner,
      brand: newBrand,
      collection: 'Aspen Studio Curated',
      season: newSeason,
      category: newCategory,
      price: newPrice,
      materials: newMaterials,
      description: newDescription,
      imageUrl: newImageUrl,
      isPlacement: false,
      createdAt: new Date().toISOString()
    };

    await saveCatalogItem(newItem);
    setCatalogItems(prev => [newItem, ...prev]);
    setIsAddModalOpen(false);
    setNotification(`Added "${newTitle}" to the Aspen Fashion Catalog!`);
    setTimeout(() => setNotification(null), 3500);

    // Reset form
    setNewTitle('');
  };

  const handleDownloadSpecSheet = async (item: CatalogItem) => {
    setNotification(`Downloading ${item.title} high-res spec sheet...`);
    const success = await downloadImageLocally(
      item.imageUrl, 
      `aspen-catalog-${item.designer.replace(/\s+/g, '-').toLowerCase()}-${item.title.replace(/\s+/g, '-').toLowerCase()}.jpg`
    );
    if (success) {
      setNotification(`Saved ${item.title} locally!`);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-24 px-4 sm:px-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 right-6 z-50 bg-zinc-900 text-white px-4 py-2.5 rounded shadow-xl text-xs uppercase tracking-widest flex items-center gap-2 border border-zinc-700 animate-fade-in">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Catalog Hero Banner */}
      <div className="bg-zinc-950 text-white p-6 sm:p-10 border border-zinc-800 mb-8 relative overflow-hidden shadow-lg">
        <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-amber-400 text-black text-[10px] font-bold uppercase tracking-widest px-2.5 py-1">
                Official Lookbook & Catalog
              </span>
              <span className="text-zinc-400 text-xs uppercase tracking-wider font-mono">
                Volume 2026 · Issue 01
              </span>
            </div>
            <h1 className="font-serif text-3xl sm:text-5xl font-bold uppercase tracking-wider leading-none">
              Aspen Catalog
            </h1>
            <p className="text-zinc-400 text-sm max-w-2xl mt-3 leading-relaxed">
              Curated luxury lookbook showcasing premier winter couture, high-alpine tailoring, and officially placed designer collections from our editorial editions.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => onOpenPlacementModal()}
              className="py-3 px-5 bg-amber-400 hover:bg-amber-300 text-black font-serif uppercase tracking-widest text-xs font-bold flex items-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer"
            >
              <Award className="w-4 h-4" />
              <span>$50 Editorial Placement</span>
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-white text-xs uppercase font-semibold tracking-wider flex items-center gap-2 border border-zinc-700 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Look to Catalog</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-zinc-200 p-4 mb-8 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search piece, designer, collection, fabric..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-zinc-300 text-xs focus:outline-none focus:border-black"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Season Selector */}
          <select
            value={selectedSeason}
            onChange={(e) => setSelectedSeason(e.target.value)}
            className="px-3 py-2 border border-zinc-300 text-xs bg-white text-zinc-800 font-medium focus:outline-none focus:border-black"
          >
            <option value="All">All Seasons</option>
            <option value="Winter">Winter Alpine</option>
            <option value="Spring">Spring Couture</option>
            <option value="Summer">Summer Vacanza</option>
            <option value="Autumn">Autumn Retrospective</option>
          </select>

          {/* Category Selector */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-zinc-300 text-xs bg-white text-zinc-800 font-medium focus:outline-none focus:border-black"
          >
            <option value="All">All Categories</option>
            <option value="Outerwear">Outerwear</option>
            <option value="Eveningwear">Eveningwear</option>
            <option value="Red Carpet">Red Carpet</option>
            <option value="Streetwear">Streetwear</option>
          </select>

          {/* Verified Placement Toggle */}
          <button
            onClick={() => setFilterPlacementOnly(!filterPlacementOnly)}
            className={`px-3 py-2 text-xs uppercase font-semibold tracking-wider flex items-center gap-1.5 border transition-colors cursor-pointer ${
              filterPlacementOnly 
                ? 'bg-amber-400 text-black border-amber-500 shadow-sm' 
                : 'bg-zinc-50 text-zinc-700 border-zinc-300 hover:bg-zinc-100'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>$50 Placements Only</span>
          </button>

          {/* View Toggle */}
          <div className="flex border border-zinc-300 rounded overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 text-xs uppercase font-semibold transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-black text-white' : 'bg-white text-zinc-600 hover:bg-zinc-50'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('spread')}
              className={`px-3 py-2 text-xs uppercase font-semibold transition-colors cursor-pointer ${
                viewMode === 'spread' ? 'bg-black text-white' : 'bg-white text-zinc-600 hover:bg-zinc-50'
              }`}
            >
              Spread
            </button>
          </div>
        </div>
      </div>

      {/* Catalog Results Header */}
      <div className="flex justify-between items-center mb-4">
        <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">
          Showing {filteredItems.length} {filteredItems.length === 1 ? 'Look' : 'Looks'} in Catalog
        </span>
        {filterPlacementOnly && (
          <span className="text-xs text-amber-700 font-semibold uppercase tracking-wider flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            Filtered by $50 Guaranteed Editorial Placements
          </span>
        )}
      </div>

      {/* GRID VIEW */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-zinc-200 hover:border-zinc-400 transition-all flex flex-col group shadow-sm hover:shadow-md"
            >
              {/* Image Container */}
              <div 
                className="relative aspect-[3/4] bg-zinc-100 overflow-hidden cursor-pointer"
                onClick={() => setActiveItemModal(item)}
              >
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Placement Foil Badge */}
                {item.isPlacement && (
                  <div className="absolute top-3 left-3 bg-amber-400 text-black text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 shadow-md flex items-center gap-1">
                    <Award className="w-3 h-3" />
                    <span>$50 Verified Placement</span>
                  </div>
                )}

                {item.publication && (
                  <div className="absolute top-3 right-3 bg-black/70 text-white text-[9px] uppercase tracking-wider px-2 py-0.5 backdrop-blur-sm">
                    {item.publication}
                  </div>
                )}

                {/* Quick Action Overlay */}
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveItemModal(item);
                    }}
                    className="bg-white text-black px-3 py-1.5 text-xs font-semibold uppercase tracking-wider shadow-lg flex items-center gap-1 hover:bg-zinc-100 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Spec</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadSpecSheet(item);
                    }}
                    className="bg-black text-white px-3 py-1.5 text-xs font-semibold uppercase tracking-wider shadow-lg flex items-center gap-1 hover:bg-zinc-800 cursor-pointer"
                    title="Download high-resolution image"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              </div>

              {/* Card Meta Content */}
              <div className="p-4 flex-1 flex flex-col justify-between bg-white border-t border-zinc-100">
                <div>
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-amber-800">
                      {item.season || '2026 Collection'} · {item.category || 'Runway'}
                    </span>
                    {item.price && (
                      <span className="text-xs font-serif font-bold text-zinc-900">
                        {item.price}
                      </span>
                    )}
                  </div>

                  <h3 className="font-serif text-base font-bold text-zinc-900 leading-snug group-hover:text-amber-900 transition-colors">
                    {item.title}
                  </h3>
                  
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mt-0.5">
                    By {item.designer} {item.brand ? `· ${item.brand}` : ''}
                  </p>

                  {item.materials && (
                    <p className="text-[11px] text-zinc-500 line-clamp-1 mt-2 italic">
                      {item.materials}
                    </p>
                  )}
                </div>

                {/* Card Actions */}
                <div className="pt-3 mt-3 border-t border-zinc-100 flex items-center gap-1.5 flex-wrap">
                  {onRemix && (
                    <button
                      onClick={() => onRemix(item.imageUrl)}
                      className="py-1.5 px-2 bg-zinc-100 hover:bg-black hover:text-white text-zinc-900 text-[10px] uppercase font-semibold tracking-wider flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      title="Remix this look in Studio"
                    >
                      <RefreshCw className="w-3 h-3 text-zinc-700 group-hover:text-white" />
                      <span>Remix</span>
                    </button>
                  )}

                  <button
                    onClick={() => onOpenInMagazine(item.imageUrl, item.description || item.title)}
                    className="flex-1 py-1.5 px-2 bg-zinc-100 hover:bg-zinc-900 hover:text-white text-zinc-900 text-[10px] uppercase font-semibold tracking-wider flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <BookOpen className="w-3 h-3" />
                    <span>Magazine</span>
                  </button>

                  <button
                    onClick={() => onOpenPlacementModal(item.imageUrl)}
                    className="py-1.5 px-2 bg-amber-400 hover:bg-amber-300 text-black text-[10px] uppercase font-bold tracking-wider flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    title="Get $50 Guaranteed Editorial Placement for this piece"
                  >
                    <span>$50 Place</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SPREAD / FLIPBOOK VIEW */}
      {viewMode === 'spread' && (
        <div className="space-y-12">
          {filteredItems.map((item, index) => (
            <div 
              key={item.id}
              className="bg-white border border-zinc-300 shadow-md grid grid-cols-1 md:grid-cols-2 overflow-hidden"
            >
              {/* Left Spread: High-Fashion Bleed Photo */}
              <div className="relative aspect-[3/4] bg-zinc-900 overflow-hidden flex flex-col justify-between p-6">
                <img src={item.imageUrl} alt={item.title} className="absolute inset-0 w-full h-full object-cover" />
                <div className="relative z-10 flex justify-between items-start">
                  <span className="bg-black/80 text-white text-xs uppercase tracking-widest px-3 py-1 font-serif">
                    {item.publication || 'Aspen Fashion Editorial'}
                  </span>
                  {item.isPlacement && (
                    <span className="bg-amber-400 text-black text-xs font-bold uppercase tracking-wider px-2.5 py-1 shadow">
                      $50 Verified Placement
                    </span>
                  )}
                </div>

                <div className="relative z-10 bg-black/75 backdrop-blur-md p-4 border-l-4 border-amber-400">
                  <div className="text-white font-serif uppercase tracking-widest text-lg font-bold">
                    {item.designer}
                  </div>
                  <div className="text-zinc-300 text-xs italic">
                    {item.collection || item.title}
                  </div>
                </div>
              </div>

              {/* Right Spread: Luxury Editorial Spec & Typography */}
              <div className="p-8 sm:p-12 flex flex-col justify-between bg-zinc-50 border-t md:border-t-0 md:border-l border-zinc-200">
                <div>
                  <div className="flex justify-between items-center text-xs pb-3 mb-4 border-b border-zinc-200">
                    <span className="font-mono text-zinc-500 uppercase tracking-widest">
                      LOOKBOOK ENTRY #{String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="font-serif font-bold text-base text-zinc-900">
                      {item.price || '$50 Editorial Placement'}
                    </span>
                  </div>

                  <div className="text-amber-800 text-[10px] font-bold uppercase tracking-widest mb-1">
                    {item.season} · {item.category}
                  </div>

                  <h2 className="font-serif text-2xl sm:text-3xl font-bold uppercase tracking-tight text-zinc-900 leading-tight">
                    {item.title}
                  </h2>

                  <p className="text-xs uppercase tracking-widest text-zinc-600 font-semibold mt-1">
                    By {item.designer} {item.brand ? `· ${item.brand}` : ''}
                  </p>

                  <blockquote className="font-serif italic text-sm text-zinc-700 border-l-2 border-black pl-3 my-4 leading-relaxed">
                    "{item.description || 'A definitive masterwork of alpine couture, balancing architectural structure with tactile softness.'}"
                  </blockquote>

                  <div className="space-y-2 text-xs text-zinc-700 pt-2">
                    {item.materials && (
                      <div>
                        <strong className="uppercase tracking-wider text-zinc-900 text-[11px]">Materials:</strong> {item.materials}
                      </div>
                    )}
                    {item.collection && (
                      <div>
                        <strong className="uppercase tracking-wider text-zinc-900 text-[11px]">Collection:</strong> {item.collection}
                      </div>
                    )}
                    {item.placementReceipt && (
                      <div className="flex items-center gap-1.5 text-emerald-800 font-semibold">
                        <Check className="w-3.5 h-3.5" />
                        <span>Verified Placement Receipt: {item.placementReceipt}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Spread Footer Barcode & Actions */}
                <div className="pt-6 mt-6 border-t border-zinc-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-10 bg-zinc-200 flex items-center justify-center p-0.5">
                      <div className="w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1MCIgaGVpZ2h0PSIyMCI+PHBhdGggZD0iTTAgMGgydjIwaC0yem00IDBoMXYyMGgtMXptMyAwaDF2MjBoLTF6bTIgMGgydjIwaC0yem00IDBoMXYyMGgtMXptMiAwaDN2MjBoLTN6bTQgMGgxdjIwaC0xem0yIDBoMnYyMGgtMnptNCAwaDF2MjBoLTF6IiBmaWxsPSIjMDAwIi8+PC9zdmc+')] bg-repeat-x opacity-80" />
                    </div>
                    <div className="text-[10px] font-mono text-zinc-500 uppercase">
                      Official Press & Buyer Spec
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDownloadSpecSheet(item)}
                      className="py-2 px-3 bg-zinc-900 hover:bg-black text-white text-xs uppercase font-semibold tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                    <button
                      onClick={() => onOpenInMagazine(item.imageUrl, item.description || item.title)}
                      className="py-2 px-3 bg-black hover:bg-zinc-800 text-white text-xs uppercase font-semibold tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Magazine Cover</span>
                    </button>
                    <button
                      onClick={() => onOpenPlacementModal(item.imageUrl)}
                      className="py-2 px-3 bg-amber-400 hover:bg-amber-300 text-black text-xs uppercase font-bold tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span>$50 Placement</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DETAIL MODAL */}
      {activeItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white max-w-2xl w-full p-6 relative rounded-sm shadow-2xl my-auto">
            <button
              onClick={() => setActiveItemModal(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-black p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="aspect-[3/4] bg-zinc-100 overflow-hidden relative border border-zinc-200">
                <img src={activeItemModal.imageUrl} alt={activeItemModal.title} className="w-full h-full object-cover" />
                {activeItemModal.isPlacement && (
                  <div className="absolute top-2 left-2 bg-amber-400 text-black text-[9px] uppercase font-bold tracking-wider px-2 py-0.5">
                    $50 Placed
                  </div>
                )}
              </div>

              <div className="flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-amber-800">
                    {activeItemModal.season} · {activeItemModal.category}
                  </span>
                  <h3 className="font-serif text-xl font-bold uppercase text-zinc-900 mt-1">
                    {activeItemModal.title}
                  </h3>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">
                    By {activeItemModal.designer} {activeItemModal.brand ? `· ${activeItemModal.brand}` : ''}
                  </p>

                  <div className="my-3 py-2 border-y border-zinc-100 text-sm font-serif font-bold text-zinc-900">
                    Retail Price: {activeItemModal.price || 'By Private Appointment'}
                  </div>

                  <p className="text-xs text-zinc-600 leading-relaxed mb-3">
                    {activeItemModal.description}
                  </p>

                  {activeItemModal.materials && (
                    <div className="text-xs text-zinc-700 mb-2">
                      <strong className="text-zinc-900">Materials:</strong> {activeItemModal.materials}
                    </div>
                  )}

                  {activeItemModal.placementReceipt && (
                    <div className="text-[11px] font-mono text-emerald-700 bg-emerald-50 p-2 border border-emerald-200 mt-2">
                      Verified Placement Receipt: {activeItemModal.placementReceipt}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-zinc-200 flex flex-col gap-2">
                  <button
                    onClick={() => {
                      handleDownloadSpecSheet(activeItemModal);
                      setActiveItemModal(null);
                    }}
                    className="w-full py-2 bg-zinc-900 text-white text-xs uppercase font-semibold tracking-wider flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Image Locally</span>
                  </button>
                  <button
                    onClick={() => {
                      onOpenInMagazine(activeItemModal.imageUrl, activeItemModal.description || activeItemModal.title);
                      setActiveItemModal(null);
                    }}
                    className="w-full py-2 bg-black text-white text-xs uppercase font-semibold tracking-wider flex items-center justify-center gap-1.5"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Feature on Magazine Cover</span>
                  </button>
                  <button
                    onClick={() => {
                      const img = activeItemModal.imageUrl;
                      setActiveItemModal(null);
                      onOpenPlacementModal(img);
                    }}
                    className="w-full py-2 bg-amber-400 hover:bg-amber-300 text-black text-xs uppercase font-bold tracking-wider flex items-center justify-center gap-1.5"
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>Get $50 Guaranteed Placement</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD ITEM TO CATALOG MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white max-w-lg w-full p-6 relative rounded-sm shadow-2xl my-auto">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-black p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-serif text-xl font-bold uppercase tracking-wider text-zinc-900 mb-1">
              Add Look to Catalog
            </h3>
            <p className="text-xs text-zinc-500 mb-4">
              Add a designer look to the official Aspen Fashion seasonal lookbook.
            </p>

            <form onSubmit={handleCreateCatalogItem} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-700 mb-1">
                  Select Image Look *
                </label>
                <div className="flex gap-2 overflow-x-auto pb-2 mb-2">
                  {galleryItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setNewImageUrl(item.url)}
                      className={`shrink-0 w-14 h-18 border rounded overflow-hidden cursor-pointer ${
                        newImageUrl === item.url ? 'ring-2 ring-black border-black' : 'border-zinc-200'
                      }`}
                    >
                      <img src={item.url} alt="Option" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="Or paste high-resolution image URL..."
                  required
                  className="w-full px-3 py-1.5 border border-zinc-300 text-xs focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-700 mb-1">
                  Piece Title *
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Alpine Shearling Overcoat"
                  required
                  className="w-full px-3 py-1.5 border border-zinc-300 text-xs focus:outline-none focus:border-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-700 mb-1">
                    Designer Name *
                  </label>
                  <input
                    type="text"
                    value={newDesigner}
                    onChange={(e) => setNewDesigner(e.target.value)}
                    required
                    className="w-full px-3 py-1.5 border border-zinc-300 text-xs focus:outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-700 mb-1">
                    Brand / Atelier
                  </label>
                  <input
                    type="text"
                    value={newBrand}
                    onChange={(e) => setNewBrand(e.target.value)}
                    className="w-full px-3 py-1.5 border border-zinc-300 text-xs focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-700 mb-1">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-1.5 border border-zinc-300 text-xs bg-white focus:outline-none focus:border-black"
                  >
                    <option value="Outerwear">Outerwear</option>
                    <option value="Eveningwear">Eveningwear</option>
                    <option value="Red Carpet">Red Carpet</option>
                    <option value="Streetwear">Streetwear</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-700 mb-1">
                    Price / Availability
                  </label>
                  <input
                    type="text"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="e.g. $2,400"
                    className="w-full px-3 py-1.5 border border-zinc-300 text-xs focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-700 mb-1">
                  Materials
                </label>
                <input
                  type="text"
                  value={newMaterials}
                  onChange={(e) => setNewMaterials(e.target.value)}
                  placeholder="e.g. Double-faced cashmere, silk lining"
                  className="w-full px-3 py-1.5 border border-zinc-300 text-xs focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Styling and cut notes..."
                  className="w-full px-3 py-1.5 border border-zinc-300 text-xs focus:outline-none focus:border-black"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2 border border-zinc-300 text-xs uppercase font-semibold text-zinc-700 hover:bg-zinc-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-black hover:bg-zinc-800 text-white text-xs uppercase font-semibold tracking-wider cursor-pointer"
                >
                  Save to Catalog
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
