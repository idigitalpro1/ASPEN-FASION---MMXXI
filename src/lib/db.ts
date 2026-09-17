import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from './firebase';
import { addCreationToDB } from './indexedDB';

export async function saveCreation(type: 'image' | 'video' | 'magazine', dataUrl: string, prompt?: string) {
  const currentUserId = auth.currentUser?.uid || 'guest-user-google-12345';
  
  const localItem = {
    id: `local-${Date.now()}`,
    type,
    dataUrl,
    prompt: prompt || null,
    createdAt: new Date().toISOString(),
    userId: currentUserId
  };

  // 1. Always save to IndexedDB as an instant, fail-proof persistence layer with unlimited storage quota
  try {
    await addCreationToDB(localItem);
    
    // Dispatch a custom event to notify components to reload creations immediately
    window.dispatchEvent(new CustomEvent('creations-updated'));
  } catch (err) {
    console.error("IndexedDB save failed:", err);
  }

  // 2. If Firestore is mock or suspended, handle gracefully. Otherwise, attempt sync to Firestore
  if (auth.currentUser && !auth.currentUser.uid.startsWith('google-emulated')) {
    const path = 'creations';
    try {
      await addDoc(collection(db, path), {
        userId: auth.currentUser.uid,
        type,
        dataUrl,
        prompt: prompt || null,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.warn("Firestore save skipped/failed, using local storage cache:", error);
    }
  }
}

