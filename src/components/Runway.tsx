import React, { useState, useEffect, useRef } from 'react';
import { 
  Video, 
  Sparkles, 
  Loader2, 
  Play, 
  Pause, 
  Download, 
  Music, 
  Volume2, 
  VolumeX, 
  Zap, 
  Radio, 
  Disc, 
  Sliders, 
  Headphones, 
  Activity,
  Check,
  Repeat
} from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { saveCreation } from '../lib/db';
import { RUNWAY_VIBES, RunwayVibe, generateRunwayMusicTrack, runwayAudio } from '../lib/runwayAudio';

interface RunwayProps {
  generatedImage: string | null;
}

export function Runway({ generatedImage }: RunwayProps) {
  const [prompt, setPrompt] = useState('A cinematic slow-motion runway walk of a model wearing high-end avant-garde fashion, in a high-end fashion magazine editorial style, with a professional studio backdrop and dramatic lighting');
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>('');

  // Vibe and Background Music States synced with runwayAudio singleton
  const [selectedVibeId, setSelectedVibeId] = useState<string>(runwayAudio.state.vibe.id || 'upbeat-house');
  const [soundtrackUrl, setSoundtrackUrl] = useState<string | null>(runwayAudio.state.soundtrackUrl);
  const [soundtrackBlob, setSoundtrackBlob] = useState<Blob | null>(runwayAudio.state.soundtrackBlob);
  const [isGeneratingMusic, setIsGeneratingMusic] = useState(runwayAudio.state.isGenerating);
  const [isPlayingMusic, setIsPlayingMusic] = useState(runwayAudio.state.isPlaying);
  const [isLoopMusic, setIsLoopMusic] = useState(runwayAudio.state.isLooping);
  const [musicSource, setMusicSource] = useState<'lyria' | 'synthesizer' | null>(runwayAudio.state.source);
  const [musicCurrentTime, setMusicCurrentTime] = useState(runwayAudio.state.currentTime);
  const [musicDuration, setMusicDuration] = useState(runwayAudio.state.duration || 24);
  const [volume, setVolume] = useState(runwayAudio.state.volume);
  const [isMuted, setIsMuted] = useState(runwayAudio.state.isMuted);
  const [syncSoundtrackWithVideo, setSyncSoundtrackWithVideo] = useState(true);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const selectedVibe = RUNWAY_VIBES.find(v => v.id === selectedVibeId) || RUNWAY_VIBES[0];

  // Subscribe to global runwayAudio singleton so music keeps playing continuously across tabs
  useEffect(() => {
    const unsubscribe = runwayAudio.subscribe((state) => {
      setIsPlayingMusic(state.isPlaying);
      setIsLoopMusic(state.isLooping);
      setSoundtrackUrl(state.soundtrackUrl);
      setSoundtrackBlob(state.soundtrackBlob);
      setMusicSource(state.source);
      setMusicCurrentTime(state.currentTime);
      setMusicDuration(state.duration);
      setSelectedVibeId(state.vibe.id);
      setIsGeneratingMusic(state.isGenerating);
      setVolume(state.volume);
      setIsMuted(state.isMuted);
    });
    return unsubscribe;
  }, []);

  // Generate Runway Background Music based on selected vibe
  const handleGenerateSoundtrack = async (targetVibe?: RunwayVibe) => {
    const vibeToUse = targetVibe || selectedVibe;
    setIsGeneratingMusic(true);
    setError(null);

    try {
      const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
      const result = await generateRunwayMusicTrack(vibeToUse, apiKey);
      await runwayAudio.setTrack(result.url, result.blob, result.source);
      return result.url;
    } catch (err: any) {
      console.error('Error generating runway soundtrack:', err);
      setError('Failed to generate runway background music. Please try again.');
      return null;
    } finally {
      setIsGeneratingMusic(false);
    }
  };

  const handleSelectVibe = (vibeId: string) => {
    setSelectedVibeId(vibeId);
    const newVibe = RUNWAY_VIBES.find(v => v.id === vibeId);
    if (newVibe) {
      runwayAudio.setVibe(newVibe);
    }
  };

  const togglePlayMusic = async () => {
    if (!soundtrackUrl) {
      const newUrl = await handleGenerateSoundtrack();
      if (newUrl) {
        await runwayAudio.play();
      }
      return;
    }
    runwayAudio.togglePlay();
  };

  const handleToggleLoopMusic = () => {
    const nextLoop = !isLoopMusic;
    setIsLoopMusic(nextLoop);
    runwayAudio.setLooping(nextLoop);
  };

  const handleSeekMusic = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setMusicCurrentTime(newTime);
    runwayAudio.seek(newTime);
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    runwayAudio.setVolume(newVol);
    if (isMuted && newVol > 0) {
      setIsMuted(false);
      runwayAudio.setMuted(false);
    }
  };

  const handleToggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    runwayAudio.setMuted(nextMute);
  };

  const handleDownloadSoundtrack = () => {
    if (!soundtrackUrl) return;
    const a = document.createElement('a');
    a.href = soundtrackUrl;
    a.download = `runway-${selectedVibe.id}-soundtrack.wav`;
    a.click();
  };

  const handleDownload = () => {
    if (!videoUrl) return;
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = `runway-editorial-${selectedVibe.id}.mp4`;
    a.click();
  };

  // Video play/pause synchronization with soundtrack
  const handleVideoPlay = () => {
    if (syncSoundtrackWithVideo && soundtrackUrl) {
      if (videoRef.current) {
        runwayAudio.seek(videoRef.current.currentTime);
      }
      runwayAudio.play();
    }
  };

  const handleVideoPause = () => {
    // If user has Loop Music ON, let it keep playing even if video is paused
    if (syncSoundtrackWithVideo && isPlayingMusic && !isLoopMusic) {
      runwayAudio.pause();
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setVideoUrl(null);
    setProgress('Initializing video & runway ambiance...');

    // If soundtrack isn't generated yet and sync is requested, kick off soundtrack generation in parallel
    if (!soundtrackUrl) {
      handleGenerateSoundtrack().catch(e => console.warn("Soundtrack generation warning:", e));
    }

    try {
      const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('API key is missing.');
      }

      const ai = new GoogleGenAI({ apiKey });

      let imagePayload = undefined;
      if (generatedImage) {
        const base64Data = generatedImage.split(',')[1];
        const mimeType = generatedImage.split(',')[0].split(':')[1].split(';')[0];
        imagePayload = {
          imageBytes: base64Data,
          mimeType: mimeType,
        };
      }

      // Enrich prompt with subtle tempo and runway aesthetic alignment
      const enrichedPrompt = `${prompt}. Catwalk stride paced smoothly to a ${selectedVibe.name} rhythm (${selectedVibe.bpm} BPM), editorial high-fashion lighting and runway ambiance.`;

      setProgress(`Submitting request to Veo (${selectedVibe.name} mood)...`);
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-lite-generate-preview',
        prompt: enrichedPrompt,
        image: imagePayload,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '9:16'
        }
      });

      setProgress('Generating video... This may take a few minutes.');
      
      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
        setProgress(`Still generating... Crafting the ${selectedVibe.name} runway walk.`);
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      
      if (!downloadLink) {
        throw new Error('Failed to retrieve video URL from the response.');
      }

      setProgress('Downloading generated runway video...');
      
      const response = await fetch(downloadLink, {
        method: 'GET',
        headers: {
          'x-goog-api-key': apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to download video: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setVideoUrl(url);
      setProgress('');
      
      // Save to database
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        const base64data = reader.result as string;
        saveCreation('video', base64data, `${prompt} [Vibe: ${selectedVibe.name}]`);
      };

    } catch (err: any) {
      console.error('Error generating video:', err);
      setError(err.message || 'An error occurred while generating the video.');
      setProgress('');
    } finally {
      setIsGenerating(false);
    }
  };

  const getVibeIcon = (vibeId: string) => {
    switch (vibeId) {
      case 'upbeat-house': return <Zap className="w-3.5 h-3.5" />;
      case 'melancholic-piano': return <Music className="w-3.5 h-3.5" />;
      case 'cinematic-orchestral': return <Sparkles className="w-3.5 h-3.5" />;
      case 'deep-tech': return <Radio className="w-3.5 h-3.5" />;
      case 'ethereal-ambient': return <Headphones className="w-3.5 h-3.5" />;
      case 'french-nu-disco': return <Disc className="w-3.5 h-3.5" />;
      default: return <Music className="w-3.5 h-3.5" />;
    }
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="mb-10 text-center">
        <h2 className="text-4xl font-serif uppercase tracking-widest mb-3">The Runway</h2>
        <p className="text-zinc-500 max-w-2xl mx-auto text-sm sm:text-base">
          Bring your fashion concepts to life. Generate dynamic runway walks scored with bespoke background music tailored to your curated vibe.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
        {/* Controls Column (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Card 1: Runway Soundtrack & Vibe Selection */}
          <div className="bg-white p-6 border border-zinc-200 shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b border-zinc-100 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-zinc-900">
                <Music className="w-4 h-4 text-black" />
                Runway Soundtrack Vibe
              </h3>
              <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider bg-zinc-100 px-2.5 py-0.5 rounded-full">
                {selectedVibe.bpm} BPM Catwalk
              </span>
            </div>

            {/* Dropdown Selector */}
            <div className="mb-4">
              <label htmlFor="runway-vibe-select" className="block text-xs uppercase tracking-widest text-zinc-500 font-semibold mb-1.5">
                Select Soundtrack Vibe
              </label>
              <div className="relative">
                <select
                  id="runway-vibe-select"
                  value={selectedVibeId}
                  onChange={(e) => handleSelectVibe(e.target.value)}
                  className="w-full appearance-none bg-zinc-50 border border-zinc-300 hover:border-black focus:border-black focus:ring-1 focus:ring-black px-3.5 py-2.5 text-sm font-medium text-zinc-900 rounded cursor-pointer transition-colors"
                >
                  {RUNWAY_VIBES.map((vibe) => (
                    <option key={vibe.id} value={vibe.id}>
                      {vibe.name} ({vibe.bpm} BPM) — {vibe.mood}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-zinc-500">
                  <Sliders className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Selection Chip Set */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-medium">Quick Vibe Chips</span>
                <span className="text-[10px] text-zinc-400">Click to preview vibe</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {RUNWAY_VIBES.map((vibe) => {
                  const isSelected = vibe.id === selectedVibeId;
                  return (
                    <button
                      key={vibe.id}
                      type="button"
                      onClick={() => handleSelectVibe(vibe.id)}
                      className={`text-left p-2.5 rounded border transition-all flex flex-col justify-between ${
                        isSelected 
                          ? 'bg-black text-white border-black shadow-sm' 
                          : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-800 border-zinc-200'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className={isSelected ? 'text-amber-300' : 'text-zinc-600'}>
                          {getVibeIcon(vibe.id)}
                        </span>
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                          isSelected ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-200 text-zinc-600'
                        }`}>
                          {vibe.bpm}
                        </span>
                      </div>
                      <span className="text-xs font-semibold tracking-tight truncate w-full">
                        {vibe.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Vibe Details Panel */}
            <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded text-xs space-y-2 mb-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-bold text-zinc-900 uppercase tracking-wider text-[11px]">Acoustic Profile: </span>
                  <span className="text-zinc-700">{selectedVibe.tagline}</span>
                </div>
              </div>
              <div className="text-zinc-500 leading-relaxed">
                <span className="font-medium text-zinc-700">Instrumentation: </span>
                {selectedVibe.instruments}
              </div>
            </div>

            {/* Soundtrack Controls & Player */}
            <div className="bg-zinc-100 p-4 rounded border border-zinc-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={togglePlayMusic}
                    disabled={isGeneratingMusic}
                    className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center hover:bg-zinc-800 transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
                    title={isPlayingMusic ? "Pause Soundtrack" : "Play Runway Soundtrack"}
                  >
                    {isGeneratingMusic ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isPlayingMusic ? (
                      <Pause className="w-4 h-4 fill-current" />
                    ) : (
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    )}
                  </button>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                        {selectedVibe.name} Soundtrack
                      </p>
                      {isPlayingMusic && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded font-medium">
                          <Activity className="w-3 h-3 animate-pulse" /> Playing
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-500">
                      {isGeneratingMusic 
                        ? 'Synthesizing runway track...' 
                        : soundtrackUrl 
                          ? `${formatSeconds(musicCurrentTime)} / ${formatSeconds(musicDuration)} · ${musicSource === 'lyria' ? 'Lyria AI Model' : 'Catwalk Synth Studio'}`
                          : 'Click play to generate track'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleGenerateSoundtrack()}
                    disabled={isGeneratingMusic}
                    className="text-[11px] font-semibold uppercase tracking-wider px-3 py-1.5 bg-white hover:bg-zinc-200 text-zinc-800 border border-zinc-300 rounded transition-colors disabled:opacity-50"
                    title="Regenerate bespoke soundtrack for this vibe"
                  >
                    {isGeneratingMusic ? 'Generating...' : 'Regenerate'}
                  </button>
                  {soundtrackUrl && (
                    <button
                      type="button"
                      onClick={handleDownloadSoundtrack}
                      className="p-1.5 bg-white hover:bg-zinc-200 text-zinc-700 border border-zinc-300 rounded transition-colors"
                      title="Download Soundtrack WAV"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Progress Slider */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] text-zinc-500 font-mono w-7 text-right">
                  {formatSeconds(musicCurrentTime)}
                </span>
                <input
                  type="range"
                  min="0"
                  max={musicDuration || 24}
                  step="0.1"
                  value={musicCurrentTime}
                  onChange={handleSeekMusic}
                  disabled={!soundtrackUrl}
                  className="w-full h-1 bg-zinc-300 rounded-lg appearance-none cursor-pointer accent-black disabled:opacity-50"
                />
                <span className="text-[10px] text-zinc-500 font-mono w-7">
                  {formatSeconds(musicDuration)}
                </span>
              </div>

              {/* Loop Music & Sync Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs pt-3 border-t border-zinc-200/80">
                <div className="flex flex-wrap items-center gap-3">
                  {/* Loop Music Toggle Button */}
                  <button
                    type="button"
                    onClick={handleToggleLoopMusic}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded transition-all cursor-pointer ${
                      isLoopMusic 
                        ? 'bg-amber-400 hover:bg-amber-300 text-black shadow-xs font-bold border border-amber-500' 
                        : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-300'
                    }`}
                    title="Keep your chosen Vibe track playing continuously across tabs while you browse the gallery or magazine"
                  >
                    <Repeat className={`w-3.5 h-3.5 ${isLoopMusic ? 'stroke-[2.5]' : ''}`} />
                    <span>Loop Music: {isLoopMusic ? 'ON' : 'OFF'}</span>
                    {isLoopMusic && (
                      <span className="text-[9px] bg-black text-white px-1.5 py-0.5 rounded font-mono uppercase tracking-wider">
                        Continuous
                      </span>
                    )}
                  </button>

                  <label className="flex items-center gap-2 cursor-pointer text-zinc-700 font-medium text-[11px]">
                    <input
                      type="checkbox"
                      checked={syncSoundtrackWithVideo}
                      onChange={(e) => setSyncSoundtrackWithVideo(e.target.checked)}
                      className="rounded border-zinc-300 text-black focus:ring-black w-3.5 h-3.5 accent-black"
                    />
                    <span>Sync with runway video</span>
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleToggleMute}
                    className="text-zinc-500 hover:text-black transition-colors"
                    title={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="w-20 h-1.5 bg-zinc-300 rounded-lg appearance-none cursor-pointer accent-black"
                  />
                  <span className="text-[10px] font-mono text-zinc-500 w-8 text-right">
                    {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
                  </span>
                </div>
              </div>

              {/* Looping Status Helper Banner */}
              {isLoopMusic && (
                <div className="bg-amber-50/90 border border-amber-200/80 p-2 rounded flex items-center justify-between text-[11px] text-amber-900">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>
                      <strong>Continuous Looping Active:</strong> Your <em>{selectedVibe.name}</em> track will keep playing continuously while you browse the Magazine, Studio, or Catalog!
                    </span>
                  </div>
                  {isPlayingMusic && (
                    <span className="inline-flex items-center gap-1 font-mono text-[10px] text-emerald-700 font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      PLAYING
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Video Direction */}
          <div className="bg-white p-6 border border-zinc-200 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2 text-zinc-900 border-b border-zinc-100 pb-3">
              <Video className="w-4 h-4 text-black" />
              Runway Video Direction
            </h3>
            
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs uppercase tracking-widest text-zinc-500 font-semibold">
                    Scene Description
                  </label>
                  <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">Quick Themes</span>
                </div>
                
                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {[
                    { label: "👙 Swimsuit & Resort", prompt: "A sun-drenched high-fashion runway walk along a pristine luxury Aspen alpine heated pool, featuring avant-garde designer metallic swimsuits, sheer resort coverups, oversized sunglasses, and artisan sandals under crisp mountain sunlight" },
                    { label: "🪞 Haute Lingerie & Silk", prompt: "An intimate and opulent haute couture runway walk featuring sheer Chantilly lace corsets, French silk lingerie slips, cascading velvet robes, and delicate pearl embellishments in dramatic candlelit ambiance" },
                    { label: "Cowboy Chick Couture", prompt: "An avant-garde high-fashion Western runway walk featuring dramatic floating collars, metallic studded leather vests, oversized sculpted silver belt buckles, relaxed-fit denim jeans, and high-end handcrafted artisan Western boots under dramatic runway lighting" },
                    { label: "Relaxed Cowboy Western", prompt: "A cinematic luxury Western runway walk featuring relaxed cowboy couture: tailored suede and leather vests, wide-brim felt cowboy hats, relaxed-fit vintage denim jeans, and statement sculpted silver belt buckles against an Aspen ranch vista" },
                    { label: "Men's La Vacanza", prompt: "A sun-drenched Italian Riviera runway walk featuring Men's La Vacanza designer summer clothes: printed silk resort shirts unbuttoned, tailored linen shorts, statement sunglasses, and models walking past coastal yachts" },
                    { label: "Après-Ski Aspen", prompt: "A slow-motion luxury fashion runway walk in Aspen with models wearing couture shearling and fur puffers against snow-capped peaks" },
                    { label: "Summiting 14ers", prompt: "A cinematic high-fashion runway trek atop a 14,000ft Colorado alpine summit with models in futuristic mountaineering couture" },
                    { label: "Monte Carlo Casino", prompt: "An opulent runway walk inside the Monte Carlo Casino with chandeliers, roulette tables, and models in shimmering black-tie couture" },
                    { label: "Halloween Masks Gala", prompt: "A mysterious haute couture Venetian masquerade runway with intricate gilded masks, dramatic candlelight, and velvet capes" },
                    { label: "Mardi Gras Carnivale", prompt: "A high-energy celebratory runway with feathered emerald-and-gold couture headdresses and New Orleans Carnivale luxury" },
                    { label: "Poolside Hotel Jerome", prompt: "A glamorous resort-wear runway along the historic Hotel Jerome Aspen poolside cabanas with mountain vistas" },
                  ].map(preset => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setPrompt(preset.prompt)}
                      className="text-[10px] bg-zinc-100 hover:bg-black hover:text-white transition-colors px-2 py-1 rounded border border-zinc-200 font-medium"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full h-24 p-3 border border-zinc-200 focus:border-black focus:ring-1 focus:ring-black outline-none resize-none text-sm leading-relaxed"
                  placeholder="Describe the runway walk, lighting, and camera movement..."
                />
              </div>

              {generatedImage && (
                <div className="p-3 bg-zinc-50 border border-zinc-200 flex items-start gap-3 rounded">
                  <img src={generatedImage} alt="Reference" className="w-14 h-14 object-cover border border-zinc-300 rounded" />
                  <div>
                    <p className="text-xs font-bold text-zinc-900 uppercase tracking-wider">Using Studio Image as Look Reference</p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">The runway model will be rendered wearing your generated couture look.</p>
                  </div>
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="w-full bg-black text-white py-4 uppercase tracking-widest text-sm font-bold hover:bg-zinc-800 transition-colors disabled:bg-zinc-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating Runway Show ({selectedVibe.name})...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Runway Video & Music
                  </>
                )}
              </button>

              {error && (
                <div className="p-3.5 bg-red-50 text-red-600 text-xs border border-red-200 rounded">
                  {error}
                </div>
              )}
              
              {isGenerating && progress && (
                <div className="p-3.5 bg-zinc-900 text-white text-xs border border-zinc-800 text-center animate-pulse rounded font-mono">
                  {progress}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Preview Column (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-white p-4 border border-zinc-200 shadow-sm">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-100">
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-800">
                Runway Premiere
              </span>
              <span className="text-[10px] font-mono text-zinc-500 uppercase bg-zinc-100 px-2 py-0.5 rounded">
                9:16 Editorial
              </span>
            </div>

            {/* Video Box */}
            <div className="bg-zinc-900 border border-zinc-300 aspect-[9/16] flex items-center justify-center relative overflow-hidden shadow-inner max-h-[640px] mx-auto w-full rounded">
              {videoUrl ? (
                <div className="relative w-full h-full">
                  <video 
                    ref={videoRef}
                    src={videoUrl} 
                    controls 
                    autoPlay 
                    loop 
                    onPlay={handleVideoPlay}
                    onPause={handleVideoPause}
                    className="w-full h-full object-cover"
                  />
                  {/* Soundtrack indicator pill on top of video */}
                  <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-[10px] font-medium flex items-center gap-1.5 shadow-md">
                    <Music className="w-3 h-3 text-amber-400" />
                    <span>{selectedVibe.name}</span>
                    <span className="text-zinc-400">· {selectedVibe.bpm} BPM</span>
                  </div>
                </div>
              ) : isGenerating ? (
                <div className="text-center p-8 text-white">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-zinc-400" />
                  <p className="text-xs text-zinc-300 uppercase tracking-widest font-semibold mb-1">Rendering Runway Walk</p>
                  <p className="text-[11px] text-zinc-500 font-mono">Scoring with {selectedVibe.name}</p>
                </div>
              ) : (
                <div className="text-center p-8 text-zinc-400">
                  <Play className="w-12 h-12 mx-auto mb-3 opacity-40 text-zinc-300" />
                  <p className="text-xs uppercase tracking-widest text-zinc-300 font-medium">Ready to Generate</p>
                  <p className="text-[11px] text-zinc-500 mt-1 max-w-[200px] mx-auto">
                    Select a vibe & prompt, then click Generate to create the show.
                  </p>
                </div>
              )}
            </div>

            {/* Audio Bar Under Video */}
            <div className="mt-3 p-2.5 bg-zinc-50 border border-zinc-200 rounded flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 truncate">
                <button
                  type="button"
                  onClick={togglePlayMusic}
                  className="p-1.5 bg-black text-white rounded-full hover:bg-zinc-800 transition-colors flex-shrink-0"
                  title={isPlayingMusic ? "Pause Soundtrack" : "Play Runway Soundtrack"}
                >
                  {isPlayingMusic ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current ml-0.5" />}
                </button>
                <div className="truncate">
                  <p className="text-[11px] font-bold text-zinc-800 truncate">
                    ♫ {selectedVibe.name} Soundtrack
                  </p>
                  <p className="text-[10px] text-zinc-500">
                    {soundtrackUrl ? `${selectedVibe.bpm} BPM Catwalk Tempo` : 'Not yet generated'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setIsMuted(!isMuted)}
                  className={`p-1.5 rounded transition-colors ${isMuted ? 'text-red-500 bg-red-50' : 'text-zinc-600 hover:text-black'}`}
                  title={isMuted ? "Soundtrack muted" : "Soundtrack active"}
                >
                  {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
                {soundtrackUrl && (
                  <button
                    type="button"
                    onClick={handleDownloadSoundtrack}
                    className="p-1.5 text-zinc-600 hover:text-black transition-colors"
                    title="Download Soundtrack"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Download Buttons */}
            <div className="mt-3 space-y-2">
              {videoUrl && (
                <button
                  onClick={handleDownload}
                  className="w-full bg-black text-white py-3 uppercase tracking-widest text-xs font-bold hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2 rounded shadow-sm cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Runway Video (MP4)
                </button>
              )}
              {soundtrackUrl && (
                <button
                  onClick={handleDownloadSoundtrack}
                  className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-900 py-2.5 uppercase tracking-widest text-xs font-semibold transition-colors flex items-center justify-center gap-2 rounded border border-zinc-300 cursor-pointer"
                >
                  <Music className="w-3.5 h-3.5" />
                  Download {selectedVibe.name} Soundtrack (WAV)
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

