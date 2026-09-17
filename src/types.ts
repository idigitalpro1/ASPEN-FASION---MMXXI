export interface MagazinePlacement {
  id?: string;
  userId: string;
  userEmail?: string;
  designer: string;
  brand?: string;
  lookTitle: string;
  publication: string;
  category?: string;
  price?: string;
  materials?: string;
  season?: string;
  quote?: string;
  imageUrl: string;
  amountPaid: number; // 50
  receiptId: string;
  status: 'placed' | 'pending' | 'published';
  createdAt: any;
}

export interface CatalogItem {
  id: string;
  userId: string;
  title: string;
  designer: string;
  brand?: string;
  collection?: string;
  season?: string;
  category?: string;
  price?: string;
  materials?: string;
  description?: string;
  imageUrl: string;
  isPlacement?: boolean;
  placementReceipt?: string;
  publication?: string;
  createdAt: any;
}
