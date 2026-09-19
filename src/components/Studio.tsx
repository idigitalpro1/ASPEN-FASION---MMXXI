import React, { useState, useRef, useEffect } from 'react';
import { Upload, Sparkles, Volume2, Loader2, Download, Undo2, Redo2, Crop as CropIcon, Layers, Check, X, ShieldAlert, Sparkle, RefreshCw, User, Users } from 'lucide-react';
import { GoogleGenAI, Modality } from '@google/genai';
import Markdown from 'react-markdown';
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Watermark } from './Watermark';
import { saveCreation } from '../lib/db';

export const BACKDROP_CATEGORIES = [
  {
    category: "Outdoor Activities & Alpine",
    items: [
      "Summiting 14ers (Colorado 14,000ft Peak Alpine Adventure)",
      "Après-Ski Aspen with Models (Alpine Lounge & Fur Couture)",
      "Poolside Hotel Jerome (Aspen Historic Luxury Sunbed & Cabana)",
      "Aspen Heritage Ranch (Relaxed Western Cowboy Mountain Vista)",
      "Sun-Drenched Amalfi Coast (Summer Luxury)",
      "Monaco Harbor Yacht Deck (Riviera)",
      "Modern Men: Safari Adventure (Khaki & Linen)"
    ]
  },
  {
    category: "La Vacanza & Summer Luxury",
    items: [
      "Men's La Vacanza: Designer Summer Clothes (Italian Riviera Resort & Sun-Kissed Villa)",
      "Men's La Vacanza: Mediterranean Yacht Deck (Azure Sea & Golden Hour)",
      "Men's La Vacanza: Capri Poolside Lounge (Baroque Silk & Cabana Living)"
    ]
  },
  {
    category: "Swimwear & Intimates Luxury",
    items: [
      "Aspen Heated Alpine Poolside (Steaming Azure Water, Snow-Capped Mountain Vista & Fur Sunbed)",
      "Capri Clifftop Infinity Pool (Mediterranean Sea Horizon & Luxury White Cabana)",
      "Milano Penthouse Boudoir (Mulberry Silk Drapes, Velvet Chaise & Soft Golden Sunlight)",
      "St. Tropez Private Beach Club (White Teak Cabana, Turquoise Waves & Champagne Bar)",
      "Amalfi Coast Private Grotto (Limestone Cliff Sun Deck & Emerald Ocean)"
    ]
  },
  {
    category: "Galas, Festivities & Casino",
    items: [
      "Monte Carlo Casino (High Stakes Black-Tie & Golden Glamour)",
      "Halloween Masks Gala (Venetian Haute Couture Masquerade)",
      "Mardi Gras (Carnivale Celebration & Feathered Couture)",
      "The Iconic Met Gala Steps (Avant-Garde)",
      "Vintage 1950s Oscars Gala (Golden Age)",
      "Classic Hollywood Red Carpet (1930s Glamour)",
      "Modern Blockbuster Premiere (Paparazzi Flashes)"
    ]
  },
  {
    category: "High Fashion & City Luxury",
    items: [
      "Neon-Lit Tokyo Streets (Midnight Cyber)",
      "Private Jet Interior (Ultra Luxury)",
      "Gucci Storefront Wall Art",
      "Prada Marfa Installation",
      "Chanel Paris Boutique Exterior",
      "Louis Vuitton Monogram Wall",
      "Dior Floral Runway Backdrop",
      "Versace Gold Medusa Wall",
      "Custom Upload..."
    ]
  }
];

export const BACKDROPS = BACKDROP_CATEGORIES.flatMap(c => c.items);

const PERIODS = [
  "None (Preserve Original Style)",
  "Cowboy Chick: Floating Collars, Studded Vests, Large Buckle, Relaxed Jeans & High-End Boots",
  "Relaxed Cowboy Western (Vest, Hat, Jeans & Belt Buckle)",
  "Men's La Vacanza: Designer Summer Clothes (Silk Resort Shirts, Linen Shorts & Loafers)",
  "Men's La Vacanza: Baroque Italian Riviera (Printed Silk, Gold Chain & Tailored Trousers)",
  "Men's La Vacanza: Coastal Summer Knitwear (Crochet Polo, Tailored Swim Shorts & Sunglasses)",
  "Haute Couture Swimsuit: Metallic Designer Bikini, Sheer Silk Pareo & Resort Gold Body Jewelry",
  "Alpine Heated Pool Swimwear: High-Neck Sculptural One-Piece, Oversized Shades & Faux Fur Wrap",
  "Men's Riviera Swimwear: Italian Tailored Swim Trunks, Open Linen Shirt & Classic Loafers",
  "Haute Lingerie & Silk Loungewear: French Chantilly Lace Corset, Satin Slip Dress & Sheer Robe",
  "Boudoir Atelier Lingerie: Embroidered Bralette, High-Waist Sheer Details & Delicate Robe",
  "1880s Western Gunslinger (Outlaw Chic)",
  "1920s Roaring Flapper (Gatsby Style)",
  "1950s Golden Age Glamour (Audrey Vibe)",
  "1970s Studio 54 Disco (Sequin & Flare)",
  "1990s Seattle Grunge (Flannel & Denim)",
  "Modern Men: Yachting (Riviera Style)",
  "Modern Men: Classic Tuxedo (Black Tie)",
  "Modern Men: Old Money (Quiet Luxury)",
  "Modern Men: Urban Streetwear (Hypebeast)",
  "Modern Men: Safari Adventure (Khaki & Linen)",
  "Modern Men: Avant-Garde (Architectural)"
];

const AGES = [
  "None (Current Age)",
  "10 Years Younger (Fresh Faced)",
  "20 Years Younger (Youthful Glow)",
  "10 Years Older (Distinguished)",
  "20 Years Older (Silver Fox)",
  "Childhood (Nostalgic Youth)",
  "Elderly (Wise & Timeless)"
];

const SIZES = ["1K (Free)", "2K ($2)", "4K ($4)"];

export function Studio({ 
  onImageGenerated, 
  coverQuote, 
  setCoverQuote,
  remixImage,
  onClearRemix
}: { 
  onImageGenerated: (url: string) => void,
  coverQuote: string | null,
  setCoverQuote: (quote: string | null) => void,
  remixImage?: string | null,
  onClearRemix?: () => void
}) {
  const [historyData, setHistoryData] = useState({
    history: [{
      selectedFile: null as File | null,
      previewUrl: remixImage || null as string | null,
      backdrop: BACKDROPS[0],
      selectedBackdrops: [BACKDROPS[0]] as string[],
      isMultiSelect: false,
      modelMode: 'solo' as 'solo' | 'models',
      menModelsCount: 0,
      womenModelsCount: 0,
      period: PERIODS[0],
      age: AGES[0],
      imageSize: SIZES[0],
      customBackdropFile: null as File | null,
      customBackdropPreviewUrl: null as string | null,
      generatedImageUrl: null as string | null,
      analysis: null as any | null,
      coverQuote: coverQuote
    }],
    index: 0
  });

  // Handle incoming remix image
  useEffect(() => {
    if (remixImage) {
      pushState({
        previewUrl: remixImage,
        selectedFile: null,
        generatedImageUrl: null,
        analysis: null
      });
    }
  }, [remixImage]);

  const pushState = (newStatePatch: Partial<typeof historyData.history[0]>) => {
    setHistoryData(prev => {
      const current = prev.history[prev.index];
      const newState = { ...current, ...newStatePatch };
      const newHistory = prev.history.slice(0, prev.index + 1);
      newHistory.push(newState);
      return { history: newHistory, index: newHistory.length - 1 };
    });
    
    if ('coverQuote' in newStatePatch) {
      setCoverQuote(newStatePatch.coverQuote || null);
    }
  };

  const undo = () => {
    if (historyData.index > 0) {
      const nextIndex = historyData.index - 1;
      setCoverQuote(historyData.history[nextIndex].coverQuote || null);
      setHistoryData(prev => ({ ...prev, index: nextIndex }));
    }
  };

  const redo = () => {
    if (historyData.index < historyData.history.length - 1) {
      const nextIndex = historyData.index + 1;
      setCoverQuote(historyData.history[nextIndex].coverQuote || null);
      setHistoryData(prev => ({ ...prev, index: nextIndex }));
    }
  };

  const {
    selectedFile,
    previewUrl,
    backdrop,
    selectedBackdrops = [BACKDROPS[0]],
    isMultiSelect = false,
    modelMode = 'solo',
    menModelsCount = 0,
    womenModelsCount = 0,
    period,
    age,
    imageSize,
    customBackdropFile,
    customBackdropPreviewUrl,
    generatedImageUrl,
    analysis
  } = historyData.history[historyData.index];

  const setModelMode = (val: 'solo' | 'models') => pushState({ modelMode: val });
  const setMenModelsCount = (val: number) => pushState({ menModelsCount: val });
  const setWomenModelsCount = (val: number) => pushState({ womenModelsCount: val });

  const setBackdrop = (val: string) => {
    pushState({ 
      backdrop: val,
      selectedBackdrops: [val]
    });
  };

  const toggleBackdropMulti = (item: string) => {
    const current = selectedBackdrops || [];
    let updated: string[];
    if (current.includes(item)) {
      updated = current.filter(i => i !== item);
      if (updated.length === 0) {
        updated = [BACKDROPS[0]];
      }
    } else {
      updated = [...current, item];
    }
    pushState({ 
      selectedBackdrops: updated,
      backdrop: updated[0] || BACKDROPS[0]
    });
  };

  const setIsMultiSelect = (val: boolean) => {
    pushState({ isMultiSelect: val });
  };

  const setPeriod = (val: string) => pushState({ period: val });
  const setAge = (val: string) => pushState({ age: val });
  const setImageSize = (val: string) => pushState({ imageSize: val });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCart, setShowCart] = useState(false);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [cropState, setCropState] = useState<{
    isOpen: boolean;
    type: 'original' | 'generated';
    url: string;
  }>({ isOpen: false, type: 'original', url: '' });

  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const getCroppedImg = (image: HTMLImageElement, crop: PixelCrop): Promise<string> => {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return Promise.reject(new Error('No 2d context'));
    }

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas is empty'));
            return;
          }
          resolve(URL.createObjectURL(blob));
        },
        'image/jpeg',
        1
      );
    });
  };

  const handleCropComplete = async () => {
    if (completedCrop && completedCrop.width > 0 && completedCrop.height > 0 && imgRef.current) {
      try {
        const croppedImageUrl = await getCroppedImg(imgRef.current, completedCrop);
        if (cropState.type === 'original') {
          const blob = await fetch(croppedImageUrl).then(r => r.blob());
          const file = new File([blob], "cropped_original.jpg", { type: "image/jpeg" });
          pushState({
            selectedFile: file,
            previewUrl: croppedImageUrl,
            generatedImageUrl: null,
            analysis: null,
            coverQuote: null
          });
        } else if (cropState.type === 'generated') {
          pushState({
            generatedImageUrl: croppedImageUrl,
          });
        }
      } catch (e) {
        console.error("Failed to crop image", e);
      }
    }
    setCropState({ isOpen: false, type: 'original', url: '' });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      pushState({
        selectedFile: file,
        previewUrl: URL.createObjectURL(file),
        generatedImageUrl: null,
        analysis: null,
        coverQuote: null
      });
    }
  };

  const handleCustomBackdropChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      pushState({
        customBackdropFile: file,
        customBackdropPreviewUrl: URL.createObjectURL(file)
      });
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result.split(',')[1]);
        }
      };
      reader.onerror = error => reject(error);
    });
  };

  const getImageData = async (file: File | null, url: string | null): Promise<{ base64: string; mimeType: string }> => {
    if (file) {
      const base64 = await fileToBase64(file);
      return { base64, mimeType: file.type || 'image/jpeg' };
    }
    if (url) {
      if (url.startsWith('data:')) {
        const commaIndex = url.indexOf(',');
        const mimeMatch = url.substring(0, commaIndex).match(/:(.*?);/);
        const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
        const base64 = url.substring(commaIndex + 1);
        return { base64, mimeType };
      }
      // Remote URL - fetch blob and read as base64
      const res = await fetch(url);
      const blob = await res.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            const parts = reader.result.split(',');
            resolve({ base64: parts[1], mimeType: blob.type || 'image/jpeg' });
          } else {
            reject(new Error("Failed to process remix image"));
          }
        };
        reader.onerror = reject;
      });
    }
    throw new Error("No image file or URL available to generate");
  };

  const generateImage = async () => {
    if (!selectedFile && !previewUrl) return;
    setIsGenerating(true);
    try {
      // @ts-ignore
      const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
      const ai = new GoogleGenAI({ apiKey });
      
      const { base64: base64Data, mimeType } = await getImageData(selectedFile, previewUrl);
      
      const activeBackdrops = isMultiSelect && selectedBackdrops && selectedBackdrops.length > 0 
        ? selectedBackdrops 
        : [backdrop || BACKDROPS[0]];

      let backdropDetails = "";
      if (activeBackdrops.length > 1) {
        backdropDetails = `a multi-scene luxury fusion seamlessly blending: ${activeBackdrops.join(', ')}`;
      } else {
        backdropDetails = `${activeBackdrops[0]} backdrop`;
      }

      // Composition / Models specification
      let modelInstructions = "";
      if (modelMode === 'solo' || (menModelsCount === 0 && womenModelsCount === 0)) {
        modelInstructions = "Solo photo shoot composition: feature ONLY this single person alone in the frame (solo high-fashion portrait/look, single subject, clean centered composition, absolutely NO background people, extra faces, or other models).";
      } else {
        const modelCountsList: string[] = [];
        if (menModelsCount > 0) {
          modelCountsList.push(`${menModelsCount} male fashion model${menModelsCount > 1 ? 's' : ''}`);
        }
        if (womenModelsCount > 0) {
          modelCountsList.push(`${womenModelsCount} female fashion model${womenModelsCount > 1 ? 's' : ''}`);
        }
        const modelsText = modelCountsList.join(' and ');
        modelInstructions = `Group fashion editorial composition: include high-fashion models posing naturally alongside the subject in the scene (${modelsText}). The accompanying models should be dressed in complementary haute couture runway styling, interacting cohesively in a luxury magazine editorial spread.`;
      }

      let prompt = `A high-fashion editorial photo. ${modelInstructions} Place the subject in ${backdropDetails}.`;

      // Specific scene atmosphere enhancements based on selections
      if (activeBackdrops.some(b => b.includes("Après-Ski Aspen") || b.includes("with Models"))) {
        prompt += ` Feature high-fashion models surrounding the subject in Aspen luxury après-ski designer winterwear, luxury shearling coats, cashmere, and snow lodge elegance.`;
      }
      if (activeBackdrops.some(b => b.includes("Summiting 14"))) {
        prompt += ` Frame with dramatic 14,000-foot Rocky Mountain peak summits, crisp alpine air, alpine mountaineering couture, and golden sunlight over rugged peaks.`;
      }
      if (activeBackdrops.some(b => b.includes("Monte Carlo Casino"))) {
        prompt += ` Integrate iconic Beaux-Arts Monte Carlo casino architectural glamour, high-stakes luxury, chandeliers, and black-tie elegance.`;
      }
      if (activeBackdrops.some(b => b.includes("Halloween Masks Gala"))) {
        prompt += ` Incorporate couture Venetian masquerade masks, ornate gilded filigree, dramatic ballroom candlelight, and gothic-glam haute couture.`;
      }
      if (activeBackdrops.some(b => b.includes("Mardi Gras"))) {
        prompt += ` Infuse vibrant New Orleans Carnivale energy, lavish gold and emerald feathered headdresses, beaded couture, and celebratory luxury.`;
      }
      if (activeBackdrops.some(b => b.includes("Hotel Jerome") || b.includes("Poolside"))) {
        prompt += ` Set by the heated alpine pool terrace of historic Hotel Jerome Aspen, with luxury loungers, cabanas, and snowy mountain peaks in the background.`;
      }
      if (activeBackdrops.some(b => b.includes("Ranch") || b.includes("Cowboy") || (b.includes("Western") && b.includes("Vista")))) {
        prompt += ` Frame the scene in an authentic Rocky Mountain high-country ranch at golden hour with rustic timber split-rail fences, sweeping golden sagebrush pastures, snow-dusted peaks, and warm Western ranch atmosphere.`;
      }
      if (activeBackdrops.some(b => b.includes("La Vacanza") || b.includes("Summer Clothes"))) {
        prompt += ` Frame in an opulent Mediterranean summer vacation atmosphere with terracotta sun decks, azure coastal waters, luxury yacht docks, and sun-kissed Italian Riviera elegance.`;
      }

      const parts: any[] = [
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType || 'image/jpeg',
          },
        }
      ];

      if (activeBackdrops.includes("Custom Upload...") && customBackdropFile) {
        const customBackdropBase64 = await fileToBase64(customBackdropFile);
        parts.push({
          inlineData: {
            data: customBackdropBase64,
            mimeType: customBackdropFile.type,
          }
        });
        prompt = `A high-fashion editorial photo. ${modelInstructions} Place the person from the first image onto the background shown in the second image. Add a subtle background blur (bokeh) effect to the backdrop image to create depth of field.`;
      }

      if (period !== "None (Preserve Original Style)") {
        if (period.includes("Cowboy Chick") || period.includes("Floating Collars") || period.includes("Studded Vests")) {
          prompt += ` Style them in high-fashion Cowboy Chick luxury runway attire: dramatic architectural floating collars that stand away gracefully from the collarbone, a lavishly studded leather or suede vest embellished with silver and brass metallic studs and rivets, relaxed-fit vintage-washed selvedge denim jeans with effortless drape and stacking, an oversized ornate carved silver Western trophy buckle as a striking centerpiece, and luxury high-end handcrafted exotic leather Western boots with artisanal tooling and sculptural heels, fusing edgy avant-garde couture with authentic rugged Western glamour while keeping their face and pose.`;
        } else if (period.includes("Relaxed Cowboy") || (period.includes("Cowboy") && period.includes("Vest"))) {
          prompt += ` Style them in high-fashion Relaxed Cowboy Western attire: a tailored relaxed suede, leather, or shearling vest layered effortlessly over a rolled-sleeve chambray or pearl-snap shirt, a structured wide-brim felt cowboy hat, relaxed-fit vintage washed denim jeans with clean stacking over artisanal leather cowboy boots, and an eye-catching sculpted sterling silver Western belt buckle, radiating effortless rustic Americana and luxury Aspen ranch charm while maintaining their face and pose.`;
        } else if (period.includes("La Vacanza")) {
          prompt += ` Style them in high-fashion Men's La Vacanza designer summer clothes: luxurious flowing baroque or pastel printed silk button-down shirt unbuttoned at the neckline, tailored crisp pleated linen shorts or breezy linen trousers, woven leather loafers or designer slides, gold jewelry, and statement luxury sunglasses, exuding effortless Mediterranean resort luxury.`;
        } else {
          prompt += ` Change their outfit to ${period} fashion style while keeping their face and pose.`;
        }
      }
      if (age !== "None (Current Age)") {
        prompt += ` Make the person look ${age.toLowerCase()}.`;
      }

      parts.push({ text: prompt });

      const sizeMap: Record<string, string> = {
        "1K (Free)": "1K",
        "2K ($2)": "2K",
        "4K ($4)": "4K"
      };

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: {
          parts: parts,
        },
        config: {
          // @ts-ignore
          imageConfig: {
            aspectRatio: "3:4",
            imageSize: sizeMap[imageSize] || "1K"
          }
        }
      });

      let newImageUrl = null;
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          newImageUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }

      if (newImageUrl) {
        pushState({ generatedImageUrl: newImageUrl });
        onImageGenerated(newImageUrl);
        // Save to database
        saveCreation('image', newImageUrl, prompt);
        // Run analysis in advance
        analyzeOutfit(newImageUrl);
      } else {
        alert("Failed to generate image.");
      }
    } catch (error) {
      console.error("Error generating image:", error);
      alert("Error generating image. Please check console.");
    } finally {
      setIsGenerating(false);
    }
  };

  const analyzeOutfit = async (imageUrl?: string) => {
    const targetUrl = imageUrl || generatedImageUrl || previewUrl;
    if (!targetUrl) return;
    setIsAnalyzing(true);
    setCoverQuote("Analyzing style...");
    try {
      // @ts-ignore
      const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
      const ai = new GoogleGenAI({ apiKey });
      
      const base64Data = targetUrl.split(',')[1];
      
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: [
          {
            inlineData: { data: base64Data, mimeType: 'image/png' }
          },
          "Analyze this outfit. Return a JSON object with the following structure: { \"quote\": \"A short, punchy 1-sentence high-fashion editorial quote describing the vibe\", \"headline\": \"A 2-3 word catchy headline\", \"subheadline\": \"A slightly longer subheadline\", \"review\": \"A 2-3 paragraph detailed review of the outfit, style, and accessories\", \"criticQuotes\": [ { \"quote\": \"A short quote\", \"source\": \"A fictional or real fashion magazine\" } ], \"shopLinks\": [ { \"name\": \"Product name\", \"url\": \"URL to buy\" } ] }. Use the googleSearch tool to find real 'buy now' links for the shopLinks."
        ],
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
        }
      });
      
      const text = response.text || "{}";
      try {
        const data = JSON.parse(text);
        if (data.quote) {
          pushState({ analysis: data, coverQuote: `"${data.quote}"` });
        } else {
          pushState({ analysis: data });
        }
      } catch (e) {
        console.error("Failed to parse JSON", e);
        pushState({ analysis: { review: text } });
      }
    } catch (error) {
      console.error("Error analyzing:", error);
      setCoverQuote("A visionary approach to modern elegance.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const speakAnalysis = async () => {
    if (!analysis || !analysis.review) return;
    setIsSpeaking(true);
    try {
      // @ts-ignore
      const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
      const ai = new GoogleGenAI({ apiKey });
      
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: analysis.review }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Zephyr' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const binary = atob(base64Audio);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'audio/pcm;rate=24000' }); // TTS returns PCM usually, wait, let's use audio/wav or let browser guess. Actually TTS returns raw PCM, we might need to wrap it in WAV.
        // Wait, the docs say: "These models return encoded audio (e.g., WAV). Use atob and Blob for playback." for Lyria, but for TTS it says: "decode and play audio with sample rate 24000".
        // Let's try audio/wav first, if it fails we might need AudioContext.
        
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const audioBuffer = audioCtx.createBuffer(1, bytes.length / 2, 24000);
        const channelData = audioBuffer.getChannelData(0);
        const dataView = new DataView(bytes.buffer);
        for (let i = 0; i < channelData.length; i++) {
          channelData[i] = dataView.getInt16(i * 2, true) / 32768;
        }
        const source = audioCtx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioCtx.destination);
        source.onended = () => setIsSpeaking(false);
        source.start();
      }
    } catch (error) {
      console.error("Error speaking:", error);
      setIsSpeaking(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-20">
      {/* Top Hero Section */}
      <div className="bg-white p-6 border border-zinc-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-serif uppercase tracking-widest">1. Original Photo</h2>
          {previewUrl && !selectedFile && (
            <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded bg-amber-500/15 border border-amber-500/30 text-amber-900">
              <RefreshCw className="w-3.5 h-3.5 text-amber-700 animate-spin-slow" />
              Remix Mode Active
            </span>
          )}
        </div>

        {previewUrl && !selectedFile && (
          <div className="mb-4 flex items-center justify-between bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Remixing Image:</strong> Loaded into Studio! Pick Solo or add Models (Men & Women), select your backdrop or fashion era, and click Generate.
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                pushState({ previewUrl: null, selectedFile: null });
                if (onClearRemix) onClearRemix();
              }}
              className="ml-3 text-zinc-600 hover:text-black font-semibold uppercase tracking-wider text-[10px] underline cursor-pointer shrink-0"
            >
              Clear
            </button>
          </div>
        )}

        {!previewUrl ? (
          <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-zinc-300 border-dashed hover:bg-zinc-50 transition-colors cursor-pointer">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-10 h-10 mb-4 text-zinc-400" />
              <p className="mb-2 text-lg text-zinc-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
              <p className="text-sm text-zinc-400">PNG, JPG up to 10MB</p>
            </div>
            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
          </label>
        ) : (
          <div className="relative w-full h-[50vh] md:h-[60vh] bg-zinc-100 flex items-center justify-center overflow-hidden border border-zinc-200">
            <img src={previewUrl} alt="Original" className="w-full h-full object-contain" />
            <div className="absolute bottom-6 right-6 flex gap-4">
              <button 
                onClick={() => setCropState({ isOpen: true, type: 'original', url: previewUrl })}
                className="bg-black text-white px-6 py-3 cursor-pointer hover:bg-zinc-800 transition-colors uppercase tracking-widest text-sm font-medium shadow-lg flex items-center gap-2"
              >
                <CropIcon className="w-4 h-4" />
                Crop
              </button>
              <label className="bg-black text-white px-6 py-3 cursor-pointer hover:bg-zinc-800 transition-colors uppercase tracking-widest text-sm font-medium shadow-lg">
                Change Photo
                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
              </label>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Controls */}
        <div className="space-y-8">
          <div className="bg-white p-6 border border-zinc-200 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-serif uppercase tracking-widest">2. Set the Scene</h2>
              <div className="flex gap-2">
                <button onClick={undo} disabled={historyData.index === 0} className="p-2 border border-zinc-300 rounded hover:bg-zinc-50 disabled:opacity-50" title="Undo">
                  <Undo2 className="w-4 h-4" />
                </button>
                <button onClick={redo} disabled={historyData.index === historyData.history.length - 1} className="p-2 border border-zinc-300 rounded hover:bg-zinc-50 disabled:opacity-50" title="Redo">
                  <Redo2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-zinc-700 uppercase tracking-wider">
                  Backdrops & Outdoor Activities
                </label>
                <button
                  type="button"
                  onClick={() => setIsMultiSelect(!isMultiSelect)}
                  className={`text-xs px-3 py-1 uppercase tracking-wider font-semibold border transition-all flex items-center gap-1.5 ${
                    isMultiSelect 
                      ? 'bg-black text-white border-black shadow-sm' 
                      : 'bg-zinc-100 text-zinc-700 border-zinc-300 hover:bg-zinc-200'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  {isMultiSelect ? 'Admin Multi-Pick: ON' : 'Multi-Pick: OFF'}
                </button>
              </div>

              {!isMultiSelect ? (
                <>
                  <select 
                    value={backdrop} 
                    onChange={e => setBackdrop(e.target.value)}
                    className="w-full border border-zinc-300 p-3 bg-white focus:ring-black focus:border-black font-medium text-sm"
                  >
                    {BACKDROP_CATEGORIES.map(cat => (
                      <optgroup key={cat.category} label={cat.category}>
                        {cat.items.map(b => <option key={b} value={b}>{b}</option>)}
                      </optgroup>
                    ))}
                  </select>
                </>
              ) : (
                <div className="space-y-4 bg-zinc-50 p-4 border border-zinc-200">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 pb-3">
                    <div className="text-xs text-zinc-600 font-medium">
                      Selected ({selectedBackdrops.length} scenes active)
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const vacanzaItems = BACKDROP_CATEGORIES[1].items;
                          const newSelection = Array.from(new Set([...selectedBackdrops, ...vacanzaItems]));
                          pushState({ selectedBackdrops: newSelection });
                        }}
                        className="text-[10px] bg-white border border-zinc-300 px-2 py-1 uppercase tracking-wider hover:bg-zinc-100 font-semibold text-amber-900"
                      >
                        + All La Vacanza
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const ranchItem = "Aspen Heritage Ranch (Relaxed Western Cowboy Mountain Vista)";
                          const newSelection = Array.from(new Set([...selectedBackdrops, ranchItem]));
                          pushState({ 
                            selectedBackdrops: newSelection,
                            period: "Relaxed Cowboy Western (Vest, Hat, Jeans & Belt Buckle)"
                          });
                        }}
                        className="text-[10px] bg-amber-50 border border-amber-300 px-2 py-1 uppercase tracking-wider hover:bg-amber-100 font-semibold text-amber-950"
                      >
                        🤠 + Western Ranch
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const outdoorItems = BACKDROP_CATEGORIES[0].items;
                          const newSelection = Array.from(new Set([...selectedBackdrops, ...outdoorItems]));
                          pushState({ selectedBackdrops: newSelection });
                        }}
                        className="text-[10px] bg-white border border-zinc-300 px-2 py-1 uppercase tracking-wider hover:bg-zinc-100 font-semibold"
                      >
                        + All Outdoor / Aspen
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const galaItems = BACKDROP_CATEGORIES[2].items;
                          const newSelection = Array.from(new Set([...selectedBackdrops, ...galaItems]));
                          pushState({ selectedBackdrops: newSelection });
                        }}
                        className="text-[10px] bg-white border border-zinc-300 px-2 py-1 uppercase tracking-wider hover:bg-zinc-100 font-semibold"
                      >
                        + All Galas / Casino
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          pushState({ selectedBackdrops: [BACKDROPS[0]], backdrop: BACKDROPS[0] });
                        }}
                        className="text-[10px] text-zinc-500 hover:text-black uppercase tracking-wider font-semibold"
                      >
                        Reset
                      </button>
                    </div>
                  </div>

                  {/* Active Chips */}
                  <div className="flex flex-wrap gap-1.5 min-h-[32px]">
                    {selectedBackdrops.map(item => (
                      <span 
                        key={item} 
                        className="inline-flex items-center gap-1 bg-black text-white text-xs px-2.5 py-1 rounded-full font-medium"
                      >
                        {item.split('(')[0].trim()}
                        <button
                          type="button"
                          onClick={() => toggleBackdropMulti(item)}
                          className="hover:text-red-300 ml-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>

                  {/* Category Sections */}
                  <div className="space-y-3 pt-2">
                    {BACKDROP_CATEGORIES.map(cat => (
                      <div key={cat.category} className="space-y-1.5">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                          {cat.category}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {cat.items.map(item => {
                            const isSelected = selectedBackdrops.includes(item);
                            return (
                              <button
                                key={item}
                                type="button"
                                onClick={() => toggleBackdropMulti(item)}
                                className={`text-left text-xs p-2 rounded border transition-colors flex items-center justify-between gap-2 ${
                                  isSelected
                                    ? 'bg-zinc-900 text-white border-zinc-900 font-medium'
                                    : 'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-400'
                                }`}
                              >
                                <span className="line-clamp-1">{item}</span>
                                {isSelected && <Check className="w-3.5 h-3.5 flex-shrink-0 text-white" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {(backdrop === "Custom Upload..." || (isMultiSelect && selectedBackdrops.includes("Custom Upload..."))) && (
                <div className="mt-4">
                  {!customBackdropPreviewUrl ? (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-zinc-300 border-dashed hover:bg-zinc-50 transition-colors cursor-pointer">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                        <Upload className="w-6 h-6 mb-2 text-zinc-400" />
                        <p className="text-sm text-zinc-500">Upload Custom Backdrop</p>
                      </div>
                      <input type="file" className="hidden" accept="image/*" onChange={handleCustomBackdropChange} />
                    </label>
                  ) : (
                    <div className="relative w-full h-32 bg-zinc-100 flex items-center justify-center overflow-hidden border border-zinc-200">
                      <img src={customBackdropPreviewUrl} alt="Custom Backdrop" className="w-full h-full object-cover blur-[2px] scale-105" />
                      <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                        <span className="text-white text-sm uppercase tracking-widest font-medium">Change</span>
                        <input type="file" className="hidden" accept="image/*" onChange={handleCustomBackdropChange} />
                      </label>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Solo Pic or Accompanying Models Section */}
            <div className="border-t border-zinc-200 pt-6">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-zinc-800 uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-zinc-700" />
                  <span>Models & Shot Composition</span>
                </label>
                <span className="text-[11px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 border border-zinc-200">
                  {modelMode === 'solo' || (menModelsCount === 0 && womenModelsCount === 0) 
                    ? 'Solo Pic (1 Subject)' 
                    : `Group: ${womenModelsCount} Women, ${menModelsCount} Men`}
                </span>
              </div>

              {/* Composition Mode Selector */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => {
                    setModelMode('solo');
                    setMenModelsCount(0);
                    setWomenModelsCount(0);
                  }}
                  className={`p-3 border text-xs uppercase tracking-wider font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    modelMode === 'solo' && menModelsCount === 0 && womenModelsCount === 0
                      ? 'bg-black text-white border-black shadow-sm'
                      : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border-zinc-300'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>Solo Pic</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModelMode('models');
                    if (menModelsCount === 0 && womenModelsCount === 0) {
                      setWomenModelsCount(1);
                    }
                  }}
                  className={`p-3 border text-xs uppercase tracking-wider font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    modelMode === 'models' || menModelsCount > 0 || womenModelsCount > 0
                      ? 'bg-black text-white border-black shadow-sm'
                      : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border-zinc-300'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>With Models</span>
                </button>
              </div>

              {/* Mode Selection Dropdown */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-1.5">
                  Composition Mode
                </label>
                <select
                  value={modelMode}
                  onChange={e => {
                    const mode = e.target.value as 'solo' | 'models';
                    setModelMode(mode);
                    if (mode === 'solo') {
                      setMenModelsCount(0);
                      setWomenModelsCount(0);
                    } else if (menModelsCount === 0 && womenModelsCount === 0) {
                      setWomenModelsCount(1);
                    }
                  }}
                  className="w-full border border-zinc-300 p-2.5 bg-white text-sm focus:ring-black focus:border-black font-medium"
                >
                  <option value="solo">Solo Pic — Subject Alone (No Other Models)</option>
                  <option value="models">With Models — High-Fashion Group Editorial</option>
                </select>
              </div>

              {/* Model Number Dropdowns (Men & Women) */}
              <div className="bg-zinc-50 border border-zinc-200 p-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Women Models Dropdown */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                      <span>Women Models</span>
                      <span className="text-[10px] text-zinc-500 lowercase font-normal">{womenModelsCount} chosen</span>
                    </label>
                    <select
                      value={womenModelsCount}
                      onChange={e => {
                        const val = parseInt(e.target.value, 10) || 0;
                        setWomenModelsCount(val);
                        if (val > 0 || menModelsCount > 0) {
                          setModelMode('models');
                        } else {
                          setModelMode('solo');
                        }
                      }}
                      className="w-full border border-zinc-300 p-2.5 bg-white text-sm focus:ring-black focus:border-black font-medium"
                    >
                      <option value={0}>0 Women (None)</option>
                      <option value={1}>1 Female Model</option>
                      <option value={2}>2 Female Models</option>
                      <option value={3}>3 Female Models</option>
                      <option value={4}>4 Female Models</option>
                      <option value={5}>5 Female Models</option>
                    </select>
                  </div>

                  {/* Men Models Dropdown */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                      <span>Men Models</span>
                      <span className="text-[10px] text-zinc-500 lowercase font-normal">{menModelsCount} chosen</span>
                    </label>
                    <select
                      value={menModelsCount}
                      onChange={e => {
                        const val = parseInt(e.target.value, 10) || 0;
                        setMenModelsCount(val);
                        if (val > 0 || womenModelsCount > 0) {
                          setModelMode('models');
                        } else {
                          setModelMode('solo');
                        }
                      }}
                      className="w-full border border-zinc-300 p-2.5 bg-white text-sm focus:ring-black focus:border-black font-medium"
                    >
                      <option value={0}>0 Men (None)</option>
                      <option value={1}>1 Male Model</option>
                      <option value={2}>2 Male Models</option>
                      <option value={3}>3 Male Models</option>
                      <option value={4}>4 Male Models</option>
                      <option value={5}>5 Male Models</option>
                    </select>
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="pt-2 border-t border-zinc-200">
                  <span className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-2 font-semibold">Quick Model Presets</span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setModelMode('solo');
                        setMenModelsCount(0);
                        setWomenModelsCount(0);
                      }}
                      className={`text-[11px] px-2.5 py-1 border rounded-full transition-colors cursor-pointer ${
                        modelMode === 'solo' && menModelsCount === 0 && womenModelsCount === 0
                          ? 'bg-black text-white border-black'
                          : 'bg-white text-zinc-700 border-zinc-300 hover:border-black'
                      }`}
                    >
                      Solo Pic (0)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setModelMode('models');
                        setWomenModelsCount(1);
                        setMenModelsCount(0);
                      }}
                      className={`text-[11px] px-2.5 py-1 border rounded-full transition-colors cursor-pointer ${
                        modelMode === 'models' && womenModelsCount === 1 && menModelsCount === 0
                          ? 'bg-black text-white border-black'
                          : 'bg-white text-zinc-700 border-zinc-300 hover:border-black'
                      }`}
                    >
                      +1 Woman
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setModelMode('models');
                        setMenModelsCount(1);
                        setWomenModelsCount(0);
                      }}
                      className={`text-[11px] px-2.5 py-1 border rounded-full transition-colors cursor-pointer ${
                        modelMode === 'models' && menModelsCount === 1 && womenModelsCount === 0
                          ? 'bg-black text-white border-black'
                          : 'bg-white text-zinc-700 border-zinc-300 hover:border-black'
                      }`}
                    >
                      +1 Man
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setModelMode('models');
                        setMenModelsCount(1);
                        setWomenModelsCount(1);
                      }}
                      className={`text-[11px] px-2.5 py-1 border rounded-full transition-colors cursor-pointer ${
                        modelMode === 'models' && menModelsCount === 1 && womenModelsCount === 1
                          ? 'bg-black text-white border-black'
                          : 'bg-white text-zinc-700 border-zinc-300 hover:border-black'
                      }`}
                    >
                      Couples (1M + 1W)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setModelMode('models');
                        setMenModelsCount(1);
                        setWomenModelsCount(2);
                      }}
                      className={`text-[11px] px-2.5 py-1 border rounded-full transition-colors cursor-pointer ${
                        modelMode === 'models' && menModelsCount === 1 && womenModelsCount === 2
                          ? 'bg-black text-white border-black'
                          : 'bg-white text-zinc-700 border-zinc-300 hover:border-black'
                      }`}
                    >
                      Trio (1M + 2W)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setModelMode('models');
                        setMenModelsCount(2);
                        setWomenModelsCount(2);
                      }}
                      className={`text-[11px] px-2.5 py-1 border rounded-full transition-colors cursor-pointer ${
                        modelMode === 'models' && menModelsCount === 2 && womenModelsCount === 2
                          ? 'bg-black text-white border-black'
                          : 'bg-white text-zinc-700 border-zinc-300 hover:border-black'
                      }`}
                    >
                      Entourage (2M + 2W)
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-zinc-700 uppercase tracking-wider">Fashion Period / Wardrobe Remix</label>
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Featured Looks</span>
              </div>

              {/* Quick Wardrobe Selection Chips */}
              <div className="flex flex-wrap gap-1.5 mb-2.5">
                <button
                  type="button"
                  onClick={() => setPeriod("Cowboy Chick: Floating Collars, Studded Vests, Large Buckle, Relaxed Jeans & High-End Boots")}
                  className={`text-[11px] px-2.5 py-1 rounded border transition-all cursor-pointer flex items-center gap-1 ${
                    period.includes("Cowboy Chick")
                      ? 'bg-amber-950 text-amber-200 border-amber-900 font-bold shadow-xs'
                      : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 font-medium'
                  }`}
                  title="Cowboy Chick: Floating Collars, Studded Vests, Large Buckle, Relaxed Jeans & High-End Boots"
                >
                  <span>⭐ Cowboy Chick (Floating Collars + Studded Vest + Boots)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPeriod("Relaxed Cowboy Western (Vest, Hat, Jeans & Belt Buckle)")}
                  className={`text-[11px] px-2.5 py-1 rounded border transition-all cursor-pointer flex items-center gap-1 ${
                    period.includes("Relaxed Cowboy")
                      ? 'bg-amber-950 text-amber-200 border-amber-900 font-bold shadow-xs'
                      : 'bg-zinc-100 text-zinc-700 border-zinc-200 hover:bg-zinc-200 font-medium'
                  }`}
                  title="Relaxed Cowboy Western: Vest, Hat, Jeans & Belt Buckle"
                >
                  <span>🤠 Relaxed Cowboy</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPeriod("Men's La Vacanza: Designer Summer Clothes (Silk Resort Shirts, Linen Shorts & Loafers)")}
                  className={`text-[11px] px-2.5 py-1 rounded border transition-colors cursor-pointer ${
                    period.includes("La Vacanza")
                      ? 'bg-black text-white border-black font-semibold'
                      : 'bg-zinc-100 text-zinc-700 border-zinc-200 hover:bg-zinc-200'
                  }`}
                >
                  La Vacanza Summer
                </button>
                <button
                  type="button"
                  onClick={() => setPeriod("Modern Men: Old Money (Quiet Luxury)")}
                  className={`text-[11px] px-2.5 py-1 rounded border transition-colors cursor-pointer ${
                    period.includes("Old Money")
                      ? 'bg-black text-white border-black font-semibold'
                      : 'bg-zinc-100 text-zinc-700 border-zinc-200 hover:bg-zinc-200'
                  }`}
                >
                  Old Money
                </button>
                <button
                  type="button"
                  onClick={() => setPeriod("1880s Western Gunslinger (Outlaw Chic)")}
                  className={`text-[11px] px-2.5 py-1 rounded border transition-colors cursor-pointer ${
                    period.includes("Gunslinger")
                      ? 'bg-black text-white border-black font-semibold'
                      : 'bg-zinc-100 text-zinc-700 border-zinc-200 hover:bg-zinc-200'
                  }`}
                >
                  1880s Gunslinger
                </button>
              </div>

              <select 
                value={period} 
                onChange={e => setPeriod(e.target.value)}
                className="w-full border border-zinc-300 p-3 bg-white focus:ring-black focus:border-black"
              >
                {PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2 uppercase tracking-wider">Age Adjustment</label>
              <select 
                value={age} 
                onChange={e => setAge(e.target.value)}
                className="w-full border border-zinc-300 p-3 bg-white focus:ring-black focus:border-black"
              >
                {AGES.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2 uppercase tracking-wider">Image Quality</label>
              <select 
                value={imageSize} 
                onChange={e => setImageSize(e.target.value)}
                className="w-full border border-zinc-300 p-3 bg-white focus:ring-black focus:border-black"
              >
                {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <button
            onClick={() => {
              if (imageSize !== "1K (Free)") {
                setShowCart(true);
              } else {
                generateImage();
              }
            }}
            disabled={(!selectedFile && !previewUrl) || isGenerating || (backdrop === "Custom Upload..." && !customBackdropFile)}
            className="mt-6 w-full flex items-center justify-center gap-2 bg-black text-white p-4 uppercase tracking-widest font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            {isGenerating ? 'Generating Magic...' : imageSize === "1K (Free)" ? 'Step onto the Red Carpet' : `Add to Cart - ${imageSize.includes('2K') ? '$2' : '$4'}`}
          </button>
        </div>
      </div>

      {showCart && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 max-w-md w-full">
            <h2 className="text-2xl font-serif uppercase tracking-widest mb-4">Checkout</h2>
            <div className="border-t border-b border-zinc-200 py-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-zinc-600">High-Res Generation ({imageSize.split(' ')[0]})</span>
                <span className="font-medium">{imageSize.includes('2K') ? '$2.00' : '$4.00'}</span>
              </div>
              <div className="flex justify-between items-center text-sm text-zinc-500">
                <span>Processing Fee</span>
                <span>$0.00</span>
              </div>
            </div>
            <div className="flex justify-between items-center mb-8 text-lg font-medium">
              <span>Total</span>
              <span>{imageSize.includes('2K') ? '$2.00' : '$4.00'}</span>
            </div>
            <div className="space-y-3">
              <button 
                onClick={() => {
                  setShowCart(false);
                  generateImage();
                }}
                className="w-full py-3 bg-black text-white uppercase tracking-widest text-sm font-medium hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Pay via Secure Link & Generate
              </button>
              <div className="text-center text-xs text-zinc-500 uppercase tracking-widest mt-2 mb-4">
                * Watermark removed on paid generations
              </div>
              <button 
                onClick={() => setShowCart(false)}
                className="w-full py-3 border border-zinc-300 uppercase tracking-widest text-sm font-medium hover:bg-zinc-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview & Analysis */}
      <div className="space-y-8">
        <div className="bg-white p-6 border border-zinc-200 min-h-[600px] flex flex-col">
          <h2 className="text-xl font-serif uppercase tracking-widest mb-6">The Result</h2>
          
          <div className="flex-1 flex items-center justify-center bg-zinc-100 border border-zinc-200 overflow-hidden relative min-h-[400px] w-full max-w-[500px] mx-auto aspect-[3/4] shadow-xl">
            {generatedImageUrl ? (
              <>
                <img src={generatedImageUrl} alt="Generated" className="absolute inset-0 w-full h-full object-cover" />
                
                {/* Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/60 pointer-events-none" />

                {imageSize === "1K (Free)" && <Watermark />}

                {/* Top Bar: Volume (Centered V2 Block) */}
                <div className="absolute top-6 left-0 right-0 flex justify-center z-20">
                  <div className="bg-black/60 backdrop-blur-md px-4 py-1 border border-white/20 shadow-2xl">
                    <span className="text-white text-[10px] uppercase font-bold tracking-[0.4em]">V2 / EXCLUSIVE</span>
                  </div>
                </div>

                {/* Left Side: Magazine Titles */}
                <div className="absolute top-1/2 -translate-y-1/2 left-4 z-10 flex flex-col gap-6 max-w-[140px] md:max-w-[180px]">
                  <div>
                    <h3 className="text-white font-serif text-sm md:text-base leading-tight" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>THE NEW AVANT-GARDE</h3>
                    <p className="text-white/80 text-[8px] md:text-[10px] sans-serif uppercase tracking-wider mt-1" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>Redefining Luxury</p>
                  </div>
                  <div>
                    <h3 className="text-white font-serif text-sm md:text-base leading-tight" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>MIDNIGHT CYBER</h3>
                    <p className="text-white/80 text-[8px] md:text-[10px] sans-serif uppercase tracking-wider mt-1" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>Neon Trends 2026</p>
                  </div>
                  <div>
                    <h3 className="text-white font-serif text-sm md:text-base leading-tight text-yellow-400" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>{analysis?.headline || "GOLDEN AGE GLAMOUR"}</h3>
                    <p className="text-white/80 text-[8px] md:text-[10px] sans-serif uppercase tracking-wider mt-1" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>{analysis?.subheadline || "A Retrospective"}</p>
                  </div>
                  <div>
                    <h3 className="text-white font-serif text-sm md:text-base leading-tight" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>EXCLUSIVE INTERVIEW</h3>
                    <p className="text-white/80 text-[8px] md:text-[10px] sans-serif uppercase tracking-wider mt-1" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>Patrick Henry Sweeney</p>
                  </div>
                </div>

                {/* Masthead (Moved to Top Center) */}
                <div className="absolute top-16 left-0 right-0 flex flex-col items-center justify-center z-10 select-none text-center">
                  <h1 className="text-5xl md:text-6xl font-serif text-white tracking-tighter opacity-95 font-bold" style={{ textShadow: '0 4px 12px rgba(0,0,0,0.8)' }}>
                    ASPEN
                  </h1>
                  <h2 className="text-xl md:text-2xl font-serif text-white tracking-[0.3em] uppercase mt-[-8px] font-bold" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
                    FASHION
                  </h2>
                  <p className="text-[10px] md:text-[12px] font-sans text-white tracking-[0.3em] uppercase mt-2 font-bold" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                    by PATRICK HENRY SWEENEY
                  </p>
                </div>

                {/* Crop Button (Moved to Bottom Right) */}
                <div className="absolute bottom-20 right-6 z-20">
                  <button 
                    onClick={() => setCropState({ isOpen: true, type: 'generated', url: generatedImageUrl })}
                    className="bg-black/60 backdrop-blur-sm text-white px-3 py-1 cursor-pointer hover:bg-black transition-colors uppercase tracking-widest text-[10px] font-medium shadow-lg flex items-center gap-1"
                  >
                    <CropIcon className="w-3 h-3" />
                    Crop
                  </button>
                </div>

                {/* Quote / Highlight / Review Snippet */}
                <div className="absolute bottom-6 left-6 right-20 z-10">
                  <div className="border-l-2 border-white/80 pl-3 py-1 bg-black/30 backdrop-blur-sm">
                    <p className="text-white/90 font-serif text-[10px] md:text-xs leading-snug italic" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                      {analysis?.review ? analysis.review.substring(0, 120) + '...' : (coverQuote || '"A very formal classic enthusiast of Versace, Hugo Boss, Armani, and Louis Vuitton, and an Asian-made critic of high distinction."')}
                    </p>
                  </div>
                </div>
                
                {/* Barcode / Issue details */}
                <div className="absolute bottom-6 right-4 z-10 flex flex-col items-end">
                  <div className="text-white/80 text-[8px] uppercase tracking-widest mb-1">Issue 01</div>
                  <div className="w-10 h-10 bg-white/90 flex items-center justify-center p-1">
                    <div className="w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1MCIgaGVpZ2h0PSIyMCI+PHBhdGggZD0iTTAgMGgydjIwaC0yem00IDBoMXYyMGgtMXptMyAwaDF2MjBoLTF6bTIgMGgydjIwaC0yem00IDBoMXYyMGgtMXptMiAwaDN2MjBoLTN6bTQgMGgxdjIwaC0xem0yIDBoMnYyMGgtMnptNCAwaDF2MjBoLTF6IiBmaWxsPSIjMDAwIi8+PC9zdmc+')] bg-repeat-x opacity-80" />
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center text-zinc-400 p-8 text-center">
                <Sparkles className="w-12 h-12 mb-4 opacity-20" />
                <p className="uppercase tracking-widest text-sm">
                  {previewUrl ? "Ready to generate your new look" : "Upload a photo to begin"}
                </p>
              </div>
            )}
          </div>

          {generatedImageUrl && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  pushState({
                    previewUrl: generatedImageUrl,
                    selectedFile: null,
                    generatedImageUrl: null,
                    analysis: null
                  });
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="w-full py-3 bg-zinc-900 hover:bg-black text-white uppercase tracking-wider text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
                title="Send this generated look back into Step 1 to remix with new models, backdrops, or fashion eras"
              >
                <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                <span>Remix Look in Studio</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const a = document.createElement('a');
                  a.href = generatedImageUrl;
                  a.download = `aspen-fashion-${Date.now()}.png`;
                  a.click();
                }}
                className="w-full py-3 border border-zinc-400 hover:border-black text-black bg-white hover:bg-zinc-50 uppercase tracking-wider text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                title="Download this generated look"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Look</span>
              </button>
            </div>
          )}

          {(generatedImageUrl || previewUrl) && (
            <div className="mt-3">
              <button
                onClick={() => analyzeOutfit()}
                disabled={isAnalyzing}
                className="w-full border-2 border-black text-black p-3 uppercase tracking-widest font-medium hover:bg-zinc-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                {isAnalyzing ? 'Analyzing...' : 'Analyze Outfit & Shop'}
              </button>
            </div>
          )}
        </div>

        {analysis && (
          <div className="bg-[#e5e5e5] p-4 sm:p-8 border border-zinc-300 relative overflow-hidden" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cream-dust.png")' }}>
            {/* Background Damask Pattern (simulated with CSS/SVG or just a subtle texture) */}
            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/damask-seamless.png')] mix-blend-multiply" />
            
            <div className="relative z-10 max-w-3xl mx-auto bg-white/40 backdrop-blur-sm p-6 sm:p-10 shadow-2xl border border-white/50">
              {/* Header */}
              <div className="text-center mb-8 border-b-2 border-zinc-800 pb-6 relative">
                <div className="absolute top-0 right-0">
                  <button 
                    onClick={speakAnalysis}
                    disabled={isSpeaking}
                    className="p-2 bg-zinc-900 text-white hover:bg-zinc-800 rounded-full transition-colors disabled:opacity-50 shadow-lg"
                    title="Listen to review"
                  >
                    {isSpeaking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                </div>
                <div className="bg-zinc-900 text-white py-2 px-6 inline-block mb-6 shadow-md">
                  <h3 className="text-xl sm:text-2xl font-serif uppercase tracking-widest">Fashion Critics' Review</h3>
                </div>
                <h2 className="text-4xl sm:text-6xl font-serif uppercase tracking-widest mb-2 text-zinc-900">ASPEN FASHION</h2>
                <div className="flex items-center justify-center gap-4">
                  <div className="h-[1px] w-12 bg-zinc-800"></div>
                  <span className="uppercase tracking-[0.3em] text-sm font-medium text-zinc-800">PARIS</span>
                  <div className="h-[1px] w-12 bg-zinc-800"></div>
                </div>
              </div>

              {/* Two Column Layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* Left Column: Image */}
                <div className="flex flex-col">
                  <div className="border-4 border-white shadow-lg bg-zinc-100 aspect-[3/4] relative overflow-hidden">
                    <img src={generatedImageUrl || previewUrl || ''} alt="Review Subject" className="w-full h-full object-cover grayscale contrast-125" />
                  </div>
                  <div className="text-center mt-2 border-b border-zinc-400 pb-1">
                    <span className="font-serif italic text-sm text-zinc-700">Photo Available</span>
                  </div>
                </div>

                {/* Right Column: Text */}
                <div className="flex flex-col justify-center">
                  <div className="border-b border-zinc-400 pb-4 mb-4">
                    <h4 className="text-2xl sm:text-3xl font-serif uppercase tracking-wider text-zinc-900 mb-2 leading-tight">
                      {analysis.headline || "ELEGANTLY EXQUISITE"}
                    </h4>
                    <p className="font-serif italic text-lg text-zinc-700">
                      {analysis.subheadline || "A Stunning Debut in the Rockies"}
                    </p>
                  </div>
                  
                  <div className="prose prose-zinc prose-sm sm:prose-base max-w-none font-serif leading-relaxed text-zinc-800 mb-6">
                    <Markdown>{analysis.review}</Markdown>
                  </div>

                  {analysis.criticQuotes && analysis.criticQuotes.length > 0 && (
                    <div className="border-t border-zinc-400 pt-6 mt-auto space-y-4">
                      {analysis.criticQuotes.map((q: any, i: number) => (
                        <div key={i} className="text-right">
                          <p className="font-serif italic text-lg sm:text-xl text-zinc-900 mb-1">"{q.quote}"</p>
                          <p className="text-sm uppercase tracking-widest text-zinc-600">— {q.source}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Shop Links */}
              {analysis.shopLinks && analysis.shopLinks.length > 0 && (
                <div className="border-t-2 border-zinc-800 pt-6 mb-8 text-center">
                  <h4 className="font-serif uppercase tracking-widest text-sm mb-4 text-zinc-600">Shop The Look</h4>
                  <div className="flex flex-wrap justify-center gap-4">
                    {analysis.shopLinks.map((link: any, i: number) => (
                      <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="text-xs uppercase tracking-wider border border-zinc-400 px-4 py-2 hover:bg-zinc-900 hover:text-white transition-colors">
                        {link.name}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Publish Link */}
              <div className="mt-8 mb-8 text-center flex flex-col sm:flex-row items-center justify-center gap-4">
                <button 
                  onClick={() => {
                    const a = document.createElement('a');
                    a.href = generatedImageUrl || previewUrl || '';
                    a.download = `${analysis.headline || 'editorial'}.jpg`;
                    a.click();
                  }}
                  className="inline-flex items-center justify-center bg-black text-white font-serif uppercase tracking-[0.15em] px-6 py-4 hover:bg-zinc-800 transition-colors shadow-2xl border border-zinc-700 text-sm sm:text-base w-full sm:w-auto"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Editorial .JPG
                </button>
                <a href="https://aspenfashion.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center bg-white text-black font-serif uppercase tracking-[0.15em] px-6 py-4 hover:bg-zinc-100 transition-colors shadow-2xl border border-zinc-300 text-sm sm:text-base w-full sm:w-auto">
                  Publish Live on Aspen Fashion — $50
                </a>
                <button 
                  onClick={() => {
                    pushState({
                      generatedImageUrl: null,
                      previewUrl: null,
                      selectedFile: null,
                      analysis: null,
                      coverQuote: null
                    });
                  }}
                  className="inline-flex items-center justify-center bg-red-600 text-white font-serif uppercase tracking-[0.15em] px-6 py-4 hover:bg-red-700 transition-colors shadow-2xl border border-red-800 text-sm sm:text-base w-full sm:w-auto"
                >
                  Delete / Start Over
                </button>
              </div>

              {/* Footer */}
              <div className="border-t-2 border-b-2 border-zinc-800 py-3 text-center">
                <p className="font-serif uppercase tracking-[0.2em] text-sm sm:text-base text-zinc-900">
                  WHERE ALPINE GLAMOUR MEETS HAUTE COUTURE
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    
      {/* Crop Modal */}
      {cropState.isOpen && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4">
          <div className="bg-white p-4 w-full max-w-4xl max-h-[90vh] flex flex-col gap-4 rounded-sm shadow-2xl">
            <div className="flex justify-between items-center bg-zinc-100 p-2 border border-zinc-200">
              <h3 className="font-serif uppercase tracking-widest text-lg ml-2">Crop Image</h3>
              <div className="flex gap-2">
                <button 
                  onClick={() => setCropState({ isOpen: false, type: 'original', url: '' })}
                  className="px-4 py-2 border border-zinc-300 uppercase tracking-widest text-sm hover:bg-zinc-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCropComplete}
                  className="px-4 py-2 bg-black text-white uppercase tracking-widest text-sm hover:bg-zinc-800 transition-colors"
                >
                  Apply Crop
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto bg-black flex items-center justify-center border border-zinc-200 p-4 min-h-[50vh]">
              <ReactCrop
                crop={crop}
                onChange={c => setCrop(c)}
                onComplete={c => setCompletedCrop(c)}
              >
                <img 
                  ref={imgRef}
                  src={cropState.url} 
                  alt="Crop preview" 
                  className="max-h-[65vh] object-contain"
                  crossOrigin="anonymous"
                />
              </ReactCrop>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
