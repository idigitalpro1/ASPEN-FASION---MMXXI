import { collection, addDoc, getDocs, query, orderBy, serverTimestamp, where } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { CatalogItem, MagazinePlacement } from '../types';

export const INITIAL_CATALOG_ITEMS: CatalogItem[] = [
  {
    id: 'cat-1',
    userId: 'editor-aspen-01',
    title: 'Alpine Cashmere Cocoon Coat',
    designer: 'Patrick Henry Sweeney',
    brand: 'Aspen Atelier',
    collection: 'Winter Solstice High Alpine',
    season: 'Winter 2026',
    category: 'Outerwear',
    price: '$2,850',
    materials: 'Double-faced Mongolian Cashmere, Italian Silk Lining, Horn Buttons',
    description: 'Sculptural silhouette designed for Aspen evenings. Features architectural drop shoulders and an exaggerated funnel neck.',
    imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop',
    isPlacement: true,
    placementReceipt: 'AF-2026-9810',
    publication: 'Aspen Fashion (Official)',
    createdAt: new Date('2026-01-15').toISOString()
  },
  {
    id: 'cat-2',
    userId: 'editor-aspen-02',
    title: 'St. Moritz Midnight Velvet Tuxedo',
    designer: 'Elena Rostova',
    brand: 'Rostova Couture',
    collection: 'Grand Gala Aspen',
    season: 'Winter 2026',
    category: 'Eveningwear',
    price: '$3,400',
    materials: 'Silk Satin Lapels, Midnight Indigo Cotton Velvet, Mother of Pearl Finishes',
    description: 'Hand-tailored dinner jacket engineered with structured shoulder pads and satin side-striping trousers.',
    imageUrl: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1000&auto=format&fit=crop',
    isPlacement: true,
    placementReceipt: 'AF-2026-9421',
    publication: "MEN'S LA VACANZA",
    createdAt: new Date('2026-02-01').toISOString()
  },
  {
    id: 'cat-3',
    userId: 'editor-aspen-03',
    title: 'Glacier Silver Metallic Trench',
    designer: 'Kaelen Vance',
    brand: 'Vance Neo-Luxury',
    collection: 'Avant Sub-Zero',
    season: 'Resort 2026',
    category: 'Outerwear',
    price: '$1,950',
    materials: 'Water-resistant Laminated Silk, Thermal Insulation Mesh, Polished Chrome Buckles',
    description: 'A luminous statement outerwear piece combining reflective tech-fabric with dramatic sweeping length.',
    imageUrl: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1000&auto=format&fit=crop',
    isPlacement: false,
    publication: 'Vogue Aspen',
    createdAt: new Date('2026-02-14').toISOString()
  },
  {
    id: 'cat-4',
    userId: 'editor-aspen-04',
    title: 'Alabaster Draped Crepe Gala Gown',
    designer: 'Genevieve Du Maurier',
    brand: 'Maison Du Maurier',
    collection: 'Snow Queen Haute Couture',
    season: 'Spring 2026',
    category: 'Red Carpet',
    price: '$4,200',
    materials: 'Heavy Silk Crepe de Chine, Hand-sewn Swarovski Crystal Trim',
    description: 'Fluid bias-cut evening gown with a plunging open back and removable flowing capelet for red carpet entries.',
    imageUrl: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=1000&auto=format&fit=crop',
    isPlacement: true,
    placementReceipt: 'AF-2026-8902',
    publication: 'theCorridor.biz',
    createdAt: new Date('2026-02-28').toISOString()
  },
  {
    id: 'cat-5',
    userId: 'editor-aspen-05',
    title: 'Monochrome Aspen Quilted Shearling Aviator',
    designer: 'Marcus Cruz',
    brand: 'Cruz Heritage',
    collection: 'Alpine Patrol Exclusive',
    season: 'Winter 2026',
    category: 'Outerwear',
    price: '$3,100',
    materials: 'Merino Shearling, Vegetable-tanned Tuscan Leather, Heavy Brass Hardware',
    description: 'Rugged yet refined shearling jacket built to endure high mountain temperatures with effortless runway flair.',
    imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop',
    isPlacement: false,
    publication: 'GQ Editorial',
    createdAt: new Date('2026-03-01').toISOString()
  },
  {
    id: 'cat-6',
    userId: 'editor-aspen-06',
    title: 'Emerald Silk Slip & Cashmere Cardigan Ensemble',
    designer: 'Aria Chen',
    brand: 'Chen Studio',
    collection: 'Aspen Lodge Loungewear',
    season: 'Autumn 2026',
    category: 'Streetwear',
    price: '$1,650',
    materials: '100% 22-Momme Mulberry Silk, Grade-A Scottish Cashmere',
    description: 'Effortless luxury pairing a jewel-toned midi slip dress with an oversized cable knit cashmere cardigan.',
    imageUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1000&auto=format&fit=crop',
    isPlacement: true,
    placementReceipt: 'AF-2026-9118',
    publication: "Harper's Bazaar",
    createdAt: new Date('2026-03-10').toISOString()
  }
];

const LOCAL_STORAGE_PLACEMENTS_KEY = 'aspen_magazine_placements';
const LOCAL_STORAGE_CATALOG_KEY = 'aspen_catalog_items';

/**
 * Save a $50 Magazine Placement to Firestore and local cache
 */
export async function saveMagazinePlacement(placement: Omit<MagazinePlacement, 'id'>): Promise<{ id: string; receiptId: string }> {
  const currentUserId = auth.currentUser?.uid || 'guest-user-' + Date.now();
  const fullPlacement: MagazinePlacement = {
    ...placement,
    userId: currentUserId,
    createdAt: new Date().toISOString()
  };

  let assignedId = `placement-${Date.now()}`;

  // 1. Save to Local Cache
  try {
    const existing = getLocalPlacements();
    existing.unshift({ ...fullPlacement, id: assignedId });
    localStorage.setItem(LOCAL_STORAGE_PLACEMENTS_KEY, JSON.stringify(existing));
  } catch (e) {
    console.warn('Local placement caching failed:', e);
  }

  // 2. Try Firestore sync
  if (auth.currentUser && !auth.currentUser.uid.startsWith('google-emulated')) {
    try {
      const docRef = await addDoc(collection(db, 'magazine_placements'), {
        ...placement,
        userId: auth.currentUser.uid,
        createdAt: serverTimestamp()
      });
      assignedId = docRef.id;
    } catch (err) {
      console.warn('Firestore placement save skipped/failed, keeping in local cache:', err);
    }
  }

  // 3. Automatically add this placed look into the Catalog
  const catalogEntry: CatalogItem = {
    id: `catalog-placed-${Date.now()}`,
    userId: currentUserId,
    title: placement.lookTitle || `${placement.designer}'s Editorial Look`,
    designer: placement.designer,
    brand: placement.brand || 'Featured Designer',
    collection: `${placement.publication} Feature`,
    season: placement.season || 'Current Season',
    category: placement.category || 'Editorial Placement',
    price: placement.price || '$50 Editorial Placement',
    materials: placement.materials || 'Designer Signature Fabrics',
    description: placement.quote || 'Official $50 verified editorial placement in Aspen Fashion publication.',
    imageUrl: placement.imageUrl,
    isPlacement: true,
    placementReceipt: placement.receiptId,
    publication: placement.publication,
    createdAt: new Date().toISOString()
  };

  await saveCatalogItem(catalogEntry);

  // Dispatch event for UI updates
  window.dispatchEvent(new CustomEvent('placements-updated', { detail: fullPlacement }));
  window.dispatchEvent(new CustomEvent('catalog-updated', { detail: catalogEntry }));

  return { id: assignedId, receiptId: placement.receiptId };
}

/**
 * Save an item to the Catalog
 */
export async function saveCatalogItem(item: CatalogItem): Promise<string> {
  const currentUserId = auth.currentUser?.uid || 'guest-user-' + Date.now();
  const fullItem = { ...item, userId: currentUserId };

  // 1. Local Cache
  try {
    const existing = getLocalCatalogItems();
    const filtered = existing.filter(i => i.id !== item.id);
    filtered.unshift(fullItem);
    localStorage.setItem(LOCAL_STORAGE_CATALOG_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.warn('Local catalog caching failed:', e);
  }

  // 2. Firestore Sync
  if (auth.currentUser && !auth.currentUser.uid.startsWith('google-emulated')) {
    try {
      const docRef = await addDoc(collection(db, 'catalog_items'), {
        userId: auth.currentUser.uid,
        title: item.title,
        designer: item.designer,
        imageUrl: item.imageUrl,
        createdAt: serverTimestamp(),
        brand: item.brand || null,
        collection: item.collection || null,
        season: item.season || null,
        category: item.category || null,
        price: item.price || null,
        materials: item.materials || null,
        description: item.description || null,
        isPlacement: !!item.isPlacement,
        placementReceipt: item.placementReceipt || null,
        publication: item.publication || null
      });
      return docRef.id;
    } catch (err) {
      console.warn('Firestore catalog save skipped/failed, keeping local:', err);
    }
  }

  return item.id;
}

/**
 * Read local placements
 */
export function getLocalPlacements(): MagazinePlacement[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PLACEMENTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed reading local placements:', e);
  }
  return [];
}

/**
 * Read local catalog items
 */
export function getLocalCatalogItems(): CatalogItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_CATALOG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed reading local catalog items:', e);
  }
  return INITIAL_CATALOG_ITEMS;
}
