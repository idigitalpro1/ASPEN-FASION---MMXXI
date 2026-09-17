/**
 * Helper to reliably download and save an image locally to the user's computer/device.
 * Handles data URLs, blob URLs, and remote URLs (with CORS blob fetching and canvas fallback).
 */
export async function downloadImageLocally(
  imageUrl: string,
  suggestedName: string = 'aspen-fashion-look.jpg'
): Promise<boolean> {
  if (!imageUrl) return false;

  // Sanitize filename
  let filename = suggestedName.trim().replace(/[^a-zA-Z0-9._-]/g, '_');
  if (!filename.match(/\.(jpg|jpeg|png|webp)$/i)) {
    filename += '.jpg';
  }

  try {
    // 1. Data URLs or Blob URLs: Direct download via anchor
    if (imageUrl.startsWith('data:') || imageUrl.startsWith('blob:')) {
      const a = document.createElement('a');
      a.href = imageUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return true;
    }

    // 2. Remote URL: Try fetching as blob (avoids browser opening in new tab instead of downloading)
    try {
      const response = await fetch(imageUrl, { mode: 'cors' });
      if (response.ok) {
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
        return true;
      }
    } catch (fetchErr) {
      console.warn('Direct fetch download had CORS issue, trying canvas method:', fetchErr);
    }

    // 3. Canvas draw fallback
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = imageUrl;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = (e) => reject(e);
      });

      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width || 1024;
      canvas.height = img.naturalHeight || img.height || 1024;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const format = filename.endsWith('.png') ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(format, 0.95);
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return true;
      }
    } catch (canvasErr) {
      console.warn('Canvas fallback failed, falling back to direct anchor:', canvasErr);
    }

    // 4. Final fallback
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = filename;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return true;
  } catch (error) {
    console.error('Failed to download image locally:', error);
    return false;
  }
}
