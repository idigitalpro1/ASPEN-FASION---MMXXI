import { GoogleGenAI } from '@google/genai';

export interface RunwayVibe {
  id: string;
  name: string;
  bpm: number;
  mood: string;
  instruments: string;
  promptDescription: string;
  accentColor: string;
  tagline: string;
}

export const RUNWAY_VIBES: RunwayVibe[] = [
  {
    id: 'upbeat-house',
    name: 'Upbeat House',
    bpm: 124,
    mood: 'Energetic, glamorous, forward-driving catwalk rhythm',
    instruments: 'Punchy 4-on-the-floor kick, warm analog bassline, French filtered chords, crisp open hi-hats',
    promptDescription: 'High-energy 124 BPM French electronic house track with punchy four-on-the-floor kick, grooving bass, chic synthesized chords, and crisp catwalk rhythm.',
    accentColor: 'from-amber-500 to-orange-500',
    tagline: 'Parisian club runway & high-fashion energy'
  },
  {
    id: 'melancholic-piano',
    name: 'Melancholic Piano',
    bpm: 86,
    mood: 'Emotive, reflective, haute couture drama',
    instruments: 'Solitary concert grand piano, gentle minor arpeggios, subtle warm cello drone, intimate reverb',
    promptDescription: 'Haunting 86 BPM melancholic acoustic grand piano piece with emotional neoclassical arpeggios, intimate chamber strings, and deep haute couture resonance.',
    accentColor: 'from-indigo-400 to-slate-600',
    tagline: 'Reflective haute couture & neoclassical elegance'
  },
  {
    id: 'cinematic-orchestral',
    name: 'Cinematic Orchestral',
    bpm: 110,
    mood: 'Grand, dramatic, royal fashion week finale',
    instruments: 'Staccato symphonic strings, bold French horns, booming concert timpani, shimmering harp glissandi',
    promptDescription: 'Majestic 110 BPM cinematic orchestral movement with soaring violins, dramatic brass fanfares, and thunderous percussion fit for a Paris Grand Palais finale.',
    accentColor: 'from-amber-600 to-yellow-500',
    tagline: 'Grand Palais finale & dramatic symphonic grandeur'
  },
  {
    id: 'deep-tech',
    name: 'Deep Tech Runway',
    bpm: 128,
    mood: 'Dark, hypnotic, industrial luxury',
    instruments: 'Rolling sub-bass, metallic percussion, filtered synth stabs, minimal dub delays',
    promptDescription: 'Hypnotic 128 BPM dark underground minimal techno runway track with heavy rolling sub-bass, industrial metallic stabs, and razor-sharp catwalk groove.',
    accentColor: 'from-emerald-500 to-teal-700',
    tagline: 'Berlin fashion week underground & razor-sharp focus'
  },
  {
    id: 'ethereal-ambient',
    name: 'Ethereal Ambient',
    bpm: 78,
    mood: 'Dreamlike, floating, futuristic resort wear',
    instruments: 'Lush shimmering synth pads, celestial textures, tape delay plucks, gentle modular pulse',
    promptDescription: 'Dreamy 78 BPM ethereal ambient soundscape with crystalline shimmering pads, soft modular synthesizer pulses, and celestial warmth for modern resort wear.',
    accentColor: 'from-cyan-400 to-blue-500',
    tagline: 'Futuristic resort walk & crystalline soundscapes'
  },
  {
    id: 'french-nu-disco',
    name: 'French Nu-Disco',
    bpm: 120,
    mood: 'Chic, sophisticated, Parisian swagger',
    instruments: 'Funky slap bass, Nile Rodgers-style clean guitar chops, analog poly-synths, brass hits',
    promptDescription: 'Sophisticated 120 BPM Parisian nu-disco track featuring funky slap bass guitar, sparkling rhythm guitar chops, and shimmering vintage synthesizer leads.',
    accentColor: 'from-fuchsia-500 to-rose-500',
    tagline: 'Chic Parisian boulevard catwalk & vintage funk groove'
  }
];

/**
 * Encodes an AudioBuffer into standard 16-bit PCM WAV Blob
 */
export function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const numSamples = buffer.length;
  const byteRate = (sampleRate * numChannels * bitDepth) / 8;
  const blockAlign = (numChannels * bitDepth) / 8;
  const dataLength = numSamples * blockAlign;
  const bufferLength = 44 + dataLength;

  const arrayBuffer = new ArrayBuffer(bufferLength);
  const view = new DataView(arrayBuffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  // RIFF identifier
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(8, 'WAVE');

  // fmt subchunk
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);

  // data subchunk
  writeString(36, 'data');
  view.setUint32(40, dataLength, true);

  const leftChannel = buffer.getChannelData(0);
  const rightChannel = numChannels > 1 ? buffer.getChannelData(1) : leftChannel;

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    // Left channel
    let sampleL = Math.max(-1, Math.min(1, leftChannel[i]));
    view.setInt16(offset, sampleL < 0 ? sampleL * 0x8000 : sampleL * 0x7FFF, true);
    offset += 2;

    // Right channel
    if (numChannels > 1) {
      let sampleR = Math.max(-1, Math.min(1, rightChannel[i]));
      view.setInt16(offset, sampleR < 0 ? sampleR * 0x8000 : sampleR * 0x7FFF, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

/**
 * Procedurally synthesize a tailored, high-fidelity 24-second audio track for the given vibe
 * using OfflineAudioContext. Guaranteed to work on all modern browsers without network dependencies.
 */
export async function synthesizeRunwayVibeAudio(vibe: RunwayVibe, durationSec: number = 24): Promise<Blob> {
  const sampleRate = 44100;
  const totalSamples = Math.floor(sampleRate * durationSec);
  // OfflineAudioContext: 2 channels (stereo), totalSamples length, sampleRate
  const OfflineAudioContextClass = window.OfflineAudioContext || (window as any).webkitOfflineAudioContext;
  const actx = new OfflineAudioContextClass(2, totalSamples, sampleRate);

  const masterGain = actx.createGain();
  masterGain.gain.setValueAtTime(0.75, 0);
  // Gentle fade out at the end
  masterGain.gain.setValueAtTime(0.75, durationSec - 1.5);
  masterGain.gain.exponentialRampToValueAtTime(0.001, durationSec);
  masterGain.connect(actx.destination);

  // Reverb simulation using simple feedback / delay network
  const reverbDelay = actx.createDelay();
  reverbDelay.delayTime.value = 0.18;
  const reverbGain = actx.createGain();
  reverbGain.gain.value = 0.28;
  const reverbFilter = actx.createBiquadFilter();
  reverbFilter.type = 'lowpass';
  reverbFilter.frequency.value = 2400;

  reverbDelay.connect(reverbGain);
  reverbGain.connect(reverbFilter);
  reverbFilter.connect(reverbDelay);
  reverbFilter.connect(masterGain);

  const beatSec = 60 / vibe.bpm;

  // Synthesis logic per Vibe
  if (vibe.id === 'upbeat-house') {
    // 1. Kick Drum (4-on-the-floor)
    for (let t = 0; t < durationSec - 0.2; t += beatSec) {
      const osc = actx.createOscillator();
      const gain = actx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(160, t);
      osc.frequency.exponentialRampToValueAtTime(38, t + 0.11);

      gain.gain.setValueAtTime(1.0, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(t);
      osc.stop(t + 0.23);

      // Offbeat Hi-Hat (at t + beatSec / 2)
      const hatTime = t + beatSec * 0.5;
      if (hatTime < durationSec - 0.1) {
        const hatBuffer = actx.createBuffer(1, Math.floor(sampleRate * 0.08), sampleRate);
        const data = hatBuffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sampleRate * 0.02));
        }
        const hatSrc = actx.createBufferSource();
        hatSrc.buffer = hatBuffer;
        const hatFilter = actx.createBiquadFilter();
        hatFilter.type = 'highpass';
        hatFilter.frequency.value = 7500;
        const hatGain = actx.createGain();
        hatGain.gain.setValueAtTime(0.4, hatTime);
        hatGain.gain.exponentialRampToValueAtTime(0.001, hatTime + 0.07);

        hatSrc.connect(hatFilter);
        hatFilter.connect(hatGain);
        hatGain.connect(masterGain);
        hatSrc.start(hatTime);
      }
    }

    // 2. Rolling House Bassline (Am - F - C - G sequence)
    const bassNotes = [55, 55, 65.4, 65.4, 65.4, 43.65, 49.0]; // A1, F1, C2, G1
    let noteIdx = 0;
    for (let t = 0; t < durationSec - 0.3; t += beatSec * 0.5) {
      const freq = bassNotes[noteIdx % bassNotes.length];
      noteIdx++;
      const bassOsc = actx.createOscillator();
      const bassFilter = actx.createBiquadFilter();
      const bassGain = actx.createGain();

      bassOsc.type = 'sawtooth';
      bassOsc.frequency.setValueAtTime(freq, t);

      bassFilter.type = 'lowpass';
      bassFilter.frequency.setValueAtTime(320, t);
      bassFilter.frequency.exponentialRampToValueAtTime(120, t + beatSec * 0.4);

      bassGain.gain.setValueAtTime(0.65, t);
      bassGain.gain.exponentialRampToValueAtTime(0.001, t + beatSec * 0.45);

      bassOsc.connect(bassFilter);
      bassFilter.connect(bassGain);
      bassGain.connect(masterGain);

      bassOsc.start(t);
      bassOsc.stop(t + beatSec * 0.48);
    }

    // 3. Filtered French House Chords on 2nd and 4th eighth notes
    const chords = [
      [220, 261.63, 329.63, 392], // Am7
      [174.61, 220, 261.63, 329.63], // Fmaj7
      [261.63, 329.63, 392, 493.88], // Cmaj7
      [196, 246.94, 293.66, 349.23]  // G7
    ];
    let chordIdx = 0;
    for (let t = 0; t < durationSec - 0.5; t += beatSec * 2) {
      const chord = chords[chordIdx % chords.length];
      chordIdx++;
      chord.forEach((freq) => {
        const chordOsc = actx.createOscillator();
        const chordFilter = actx.createBiquadFilter();
        const chordGain = actx.createGain();

        chordOsc.type = 'sawtooth';
        chordOsc.frequency.setValueAtTime(freq, t + beatSec * 0.5);

        chordFilter.type = 'bandpass';
        chordFilter.frequency.setValueAtTime(1400, t + beatSec * 0.5);
        chordFilter.Q.value = 1.8;

        chordGain.gain.setValueAtTime(0.18, t + beatSec * 0.5);
        chordGain.gain.exponentialRampToValueAtTime(0.001, t + beatSec * 1.8);

        chordOsc.connect(chordFilter);
        chordFilter.connect(chordGain);
        chordGain.connect(masterGain);
        chordGain.connect(reverbDelay);

        chordOsc.start(t + beatSec * 0.5);
        chordOsc.stop(t + beatSec * 1.9);
      });
    }
  } else if (vibe.id === 'melancholic-piano') {
    // Neoclassical piano arpeggios (D minor - Bb - F - C progression)
    const chordProgressions = [
      [146.83, 220, 261.63, 293.66, 349.23, 440, 523.25], // D minor arpeggio
      [116.54, 174.61, 233.08, 293.66, 349.23, 466.16],  // Bb major arpeggio
      [174.61, 220, 261.63, 349.23, 440, 523.25],        // F major arpeggio
      [130.81, 196, 246.94, 261.63, 329.63, 392, 493.88] // C major arpeggio
    ];

    // Cello drone in the bass
    const bassDroneTones = [73.42, 58.27, 87.31, 65.41]; // D2, Bb1, F2, C2
    let progIdx = 0;
    const barDuration = beatSec * 4;

    for (let bar = 0; bar < durationSec; bar += barDuration) {
      const droneFreq = bassDroneTones[progIdx % bassDroneTones.length];
      const progNotes = chordProgressions[progIdx % chordProgressions.length];
      progIdx++;

      // Warm cello sub tone
      const celloOsc = actx.createOscillator();
      const celloFilter = actx.createBiquadFilter();
      const celloGain = actx.createGain();

      celloOsc.type = 'sawtooth';
      celloOsc.frequency.setValueAtTime(droneFreq, bar);
      celloFilter.type = 'lowpass';
      celloFilter.frequency.setValueAtTime(240, bar);

      celloGain.gain.setValueAtTime(0.01, bar);
      celloGain.gain.linearRampToValueAtTime(0.35, bar + 0.8);
      celloGain.gain.setValueAtTime(0.35, bar + barDuration - 0.5);
      celloGain.gain.exponentialRampToValueAtTime(0.01, bar + barDuration);

      celloOsc.connect(celloFilter);
      celloFilter.connect(celloGain);
      celloGain.connect(masterGain);
      celloOsc.start(bar);
      celloOsc.stop(bar + barDuration);

      // Cascading piano notes
      const stepDuration = barDuration / 8;
      for (let s = 0; s < 8; s++) {
        const noteTime = bar + s * stepDuration;
        if (noteTime >= durationSec) break;
        const noteFreq = progNotes[s % progNotes.length];

        // Piano multi-overtone simulation (sine fundamental + triangle 2nd harmonic)
        const pOsc1 = actx.createOscillator();
        const pOsc2 = actx.createOscillator();
        const pGain = actx.createGain();

        pOsc1.type = 'sine';
        pOsc1.frequency.setValueAtTime(noteFreq, noteTime);

        pOsc2.type = 'triangle';
        pOsc2.frequency.setValueAtTime(noteFreq * 2, noteTime);

        const velocity = 0.25 + (s % 2 === 0 ? 0.15 : 0.05);
        pGain.gain.setValueAtTime(velocity, noteTime);
        pGain.gain.exponentialRampToValueAtTime(0.001, noteTime + 2.2);

        pOsc1.connect(pGain);
        pOsc2.connect(pGain);
        pGain.connect(masterGain);
        pGain.connect(reverbDelay);

        pOsc1.start(noteTime);
        pOsc2.start(noteTime);
        pOsc1.stop(noteTime + 2.3);
        pOsc2.stop(noteTime + 2.3);
      }
    }
  } else if (vibe.id === 'cinematic-orchestral') {
    // Grand Orchestral strings + French Horns + Timpani hits
    const stringChords = [
      [110, 164.81, 220, 277.18, 329.63], // A minor
      [98, 146.83, 196, 246.94, 293.66],  // G major
      [87.31, 130.81, 174.61, 220, 261.63], // F major
      [82.41, 123.47, 164.81, 207.65, 246.94] // E major
    ];

    const barLen = beatSec * 4;
    let barCount = 0;

    for (let t = 0; t < durationSec; t += barLen) {
      const chord = stringChords[barCount % stringChords.length];
      barCount++;

      // Timpani hit on downbeat
      const timpaniOsc = actx.createOscillator();
      const timpaniGain = actx.createGain();
      timpaniOsc.type = 'sine';
      timpaniOsc.frequency.setValueAtTime(95, t);
      timpaniOsc.frequency.exponentialRampToValueAtTime(42, t + 0.35);

      timpaniGain.gain.setValueAtTime(0.8, t);
      timpaniGain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);

      timpaniOsc.connect(timpaniGain);
      timpaniGain.connect(masterGain);
      timpaniGain.connect(reverbDelay);
      timpaniOsc.start(t);
      timpaniOsc.stop(t + 1.25);

      // Staccato symphonic string pulses (every beat)
      for (let b = 0; b < 4; b++) {
        const pulseTime = t + b * beatSec;
        if (pulseTime >= durationSec) break;

        chord.forEach((freq, idx) => {
          const strOsc = actx.createOscillator();
          const strFilter = actx.createBiquadFilter();
          const strGain = actx.createGain();

          strOsc.type = 'sawtooth';
          strOsc.frequency.setValueAtTime(freq * (idx > 2 ? 1 : 2), pulseTime);

          strFilter.type = 'bandpass';
          strFilter.frequency.setValueAtTime(900 + idx * 250, pulseTime);
          strFilter.Q.value = 2.0;

          strGain.gain.setValueAtTime(0.14, pulseTime);
          strGain.gain.exponentialRampToValueAtTime(0.001, pulseTime + beatSec * 0.7);

          strOsc.connect(strFilter);
          strFilter.connect(strGain);
          strGain.connect(masterGain);
          strGain.connect(reverbDelay);

          strOsc.start(pulseTime);
          strOsc.stop(pulseTime + beatSec * 0.75);
        });
      }
    }
  } else if (vibe.id === 'deep-tech') {
    // Dark underground minimal techno (128 BPM)
    for (let t = 0; t < durationSec - 0.2; t += beatSec) {
      // Sub-heavy industrial kick
      const kickOsc = actx.createOscillator();
      const kickGain = actx.createGain();
      kickOsc.type = 'triangle';
      kickOsc.frequency.setValueAtTime(130, t);
      kickOsc.frequency.exponentialRampToValueAtTime(32, t + 0.15);

      kickGain.gain.setValueAtTime(1.1, t);
      kickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

      kickOsc.connect(kickGain);
      kickGain.connect(masterGain);
      kickOsc.start(t);
      kickOsc.stop(t + 0.3);

      // Metallic rim/percussion on beat 2 and 4
      if ((Math.round(t / beatSec) % 2) === 1) {
        const rimOsc = actx.createOscillator();
        const rimGain = actx.createGain();
        rimOsc.type = 'sawtooth';
        rimOsc.frequency.setValueAtTime(1200, t);
        rimOsc.frequency.exponentialRampToValueAtTime(300, t + 0.04);

        rimGain.gain.setValueAtTime(0.35, t);
        rimGain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

        rimOsc.connect(rimGain);
        rimGain.connect(masterGain);
        rimGain.connect(reverbDelay);
        rimOsc.start(t);
        rimOsc.stop(t + 0.07);
      }
    }

    // Hypnotic 16th-note sub bass groove
    const subFreqs = [43.65, 43.65, 48.99, 43.65, 51.91, 43.65, 38.89, 43.65];
    let subIdx = 0;
    for (let t = 0; t < durationSec - 0.2; t += beatSec * 0.25) {
      const f = subFreqs[subIdx % subFreqs.length];
      subIdx++;
      const sOsc = actx.createOscillator();
      const sGain = actx.createGain();
      sOsc.type = 'sine';
      sOsc.frequency.setValueAtTime(f, t);

      sGain.gain.setValueAtTime(0.65, t);
      sGain.gain.exponentialRampToValueAtTime(0.001, t + beatSec * 0.22);

      sOsc.connect(sGain);
      sGain.connect(masterGain);
      sOsc.start(t);
      sOsc.stop(t + beatSec * 0.24);
    }
  } else if (vibe.id === 'ethereal-ambient') {
    // Shimmering celestial ambient pads (F# minor9 - Emaj9 - Dmaj7)
    const ambientChords = [
      [185, 220, 277.18, 329.63, 415.3], // F#m9
      [164.81, 207.65, 246.94, 329.63, 392], // Emaj9
      [146.83, 185, 220, 277.18, 370] // Dmaj7
    ];
    const padDuration = beatSec * 8;
    let padCount = 0;

    for (let t = 0; t < durationSec; t += padDuration) {
      const chord = ambientChords[padCount % ambientChords.length];
      padCount++;

      chord.forEach((freq, idx) => {
        const osc = actx.createOscillator();
        const filter = actx.createBiquadFilter();
        const gain = actx.createGain();

        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        // Subtle detune for shimmer
        osc.frequency.setValueAtTime(freq * 1.002, t);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(700, t);
        filter.frequency.linearRampToValueAtTime(1400, t + padDuration * 0.5);
        filter.frequency.linearRampToValueAtTime(600, t + padDuration);

        gain.gain.setValueAtTime(0.01, t);
        gain.gain.linearRampToValueAtTime(0.25, t + 1.8);
        gain.gain.setValueAtTime(0.25, t + padDuration - 1.5);
        gain.gain.exponentialRampToValueAtTime(0.01, t + padDuration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);
        gain.connect(reverbDelay);

        osc.start(t);
        osc.stop(t + padDuration);
      });
    }
  } else {
    // french-nu-disco & default (120 BPM)
    for (let t = 0; t < durationSec - 0.2; t += beatSec) {
      // Punchy Disco Kick
      const kickOsc = actx.createOscillator();
      const kickGain = actx.createGain();
      kickOsc.type = 'sine';
      kickOsc.frequency.setValueAtTime(150, t);
      kickOsc.frequency.exponentialRampToValueAtTime(45, t + 0.12);

      kickGain.gain.setValueAtTime(0.9, t);
      kickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);

      kickOsc.connect(kickGain);
      kickGain.connect(masterGain);
      kickOsc.start(t);
      kickOsc.stop(t + 0.25);

      // Disco Snare on 2 and 4
      if ((Math.round(t / beatSec) % 2) === 1) {
        const snareBuf = actx.createBuffer(1, Math.floor(sampleRate * 0.12), sampleRate);
        const data = snareBuf.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sampleRate * 0.035));
        }
        const sSrc = actx.createBufferSource();
        sSrc.buffer = snareBuf;
        const sGain = actx.createGain();
        sGain.gain.setValueAtTime(0.5, t);
        sGain.gain.exponentialRampToValueAtTime(0.001, t + 0.11);

        sSrc.connect(sGain);
        sGain.connect(masterGain);
        sGain.connect(reverbDelay);
        sSrc.start(t);
      }
    }

    // Funky slap bass pattern (octave pops)
    const discoBassNotes = [55, 110, 55, 98, 55, 110, 65.4, 130.8];
    let dIdx = 0;
    for (let t = 0; t < durationSec - 0.2; t += beatSec * 0.5) {
      const freq = discoBassNotes[dIdx % discoBassNotes.length];
      dIdx++;
      const bOsc = actx.createOscillator();
      const bFilter = actx.createBiquadFilter();
      const bGain = actx.createGain();

      bOsc.type = 'sawtooth';
      bOsc.frequency.setValueAtTime(freq, t);

      bFilter.type = 'lowpass';
      bFilter.frequency.setValueAtTime(1200, t);
      bFilter.frequency.exponentialRampToValueAtTime(250, t + 0.18);

      bGain.gain.setValueAtTime(0.55, t);
      bGain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

      bOsc.connect(bFilter);
      bFilter.connect(bGain);
      bGain.connect(masterGain);

      bOsc.start(t);
      bOsc.stop(t + 0.24);
    }
  }

  const renderedBuffer = await actx.startRendering();
  return audioBufferToWavBlob(renderedBuffer);
}

/**
 * High-level generator that attempts Gemini Lyria model first if API key is present,
 * and seamlessly falls back to high-fidelity Web Audio synthesis.
 */
export async function generateRunwayMusicTrack(
  vibe: RunwayVibe,
  apiKey?: string
): Promise<{ blob: Blob; url: string; source: 'lyria' | 'synthesizer' }> {
  const key = apiKey || (typeof process !== 'undefined' ? (process.env?.API_KEY || process.env?.GEMINI_API_KEY) : '');

  // 1. Try Lyria model if API key is present
  if (key) {
    try {
      const ai = new GoogleGenAI({ apiKey: key });
      const prompt = `Generate a 24-second high-end fashion runway catwalk soundtrack with a ${vibe.name} aesthetic. Mood: ${vibe.mood}. Instruments: ${vibe.instruments}. Tempo: ${vibe.bpm} BPM. Pristine studio production for haute couture runway walk.`;

      const response = await ai.models.generateContentStream({
        model: 'lyria-3-clip-preview',
        contents: prompt,
      });

      let audioBase64 = '';
      let mimeType = 'audio/wav';

      for await (const chunk of response) {
        const parts = chunk.candidates?.[0]?.content?.parts;
        if (!parts) continue;
        for (const part of parts) {
          if (part.inlineData?.data) {
            if (!audioBase64 && part.inlineData.mimeType) {
              mimeType = part.inlineData.mimeType;
            }
            audioBase64 += part.inlineData.data;
          }
        }
      }

      if (audioBase64) {
        const binary = atob(audioBase64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: mimeType });
        const url = URL.createObjectURL(blob);
        return { blob, url, source: 'lyria' };
      }
    } catch (lyriaErr) {
      console.info('Lyria API preview unavailable, proceeding with procedural runway audio synthesis:', lyriaErr);
    }
  }

  // 2. Procedural high-fidelity Web Audio synthesis
  const blob = await synthesizeRunwayVibeAudio(vibe, 24);
  const url = URL.createObjectURL(blob);
  return { blob, url, source: 'synthesizer' };
}

export interface RunwayAudioState {
  isPlaying: boolean;
  isLooping: boolean;
  vibe: RunwayVibe;
  soundtrackUrl: string | null;
  soundtrackBlob: Blob | null;
  source: 'lyria' | 'synthesizer' | null;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isGenerating: boolean;
}

type AudioListener = (state: RunwayAudioState) => void;

class RunwayAudioManager {
  private static instance: RunwayAudioManager;
  private audio: HTMLAudioElement | null = null;
  private listeners: Set<AudioListener> = new Set();
  
  public state: RunwayAudioState = {
    isPlaying: false,
    isLooping: true, // Default to continuous looping
    vibe: RUNWAY_VIBES[0],
    soundtrackUrl: null,
    soundtrackBlob: null,
    source: null,
    currentTime: 0,
    duration: 24,
    volume: 0.85,
    isMuted: false,
    isGenerating: false,
  };

  public getState(): RunwayAudioState {
    return this.state;
  }

  private constructor() {
    if (typeof window !== 'undefined') {
      this.audio = new Audio();
      this.audio.loop = this.state.isLooping;
      this.audio.volume = this.state.volume;

      this.audio.addEventListener('timeupdate', () => {
        if (this.audio) {
          this.state.currentTime = this.audio.currentTime;
          if (this.audio.duration && !isNaN(this.audio.duration)) {
            this.state.duration = this.audio.duration;
          }
          this.notify();
        }
      });

      this.audio.addEventListener('ended', () => {
        if (!this.state.isLooping) {
          this.state.isPlaying = false;
          this.state.currentTime = 0;
          this.notify();
        }
      });

      this.audio.addEventListener('play', () => {
        this.state.isPlaying = true;
        this.notify();
      });

      this.audio.addEventListener('pause', () => {
        this.state.isPlaying = false;
        this.notify();
      });
    }
  }

  public static getInstance(): RunwayAudioManager {
    if (!RunwayAudioManager.instance) {
      RunwayAudioManager.instance = new RunwayAudioManager();
    }
    return RunwayAudioManager.instance;
  }

  public subscribe(listener: AudioListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => listener({ ...this.state }));
  }

  public setLooping(loop: boolean) {
    this.state.isLooping = loop;
    if (this.audio) {
      this.audio.loop = loop;
    }
    this.notify();
  }

  public setVolume(vol: number) {
    this.state.volume = vol;
    if (this.audio && !this.state.isMuted) {
      this.audio.volume = vol;
    }
    this.notify();
  }

  public setMuted(muted: boolean) {
    this.state.isMuted = muted;
    if (this.audio) {
      this.audio.volume = muted ? 0 : this.state.volume;
    }
    this.notify();
  }

  public seek(seconds: number) {
    if (this.audio) {
      this.audio.currentTime = seconds;
      this.state.currentTime = seconds;
      this.notify();
    }
  }

  public setVibe(vibe: RunwayVibe) {
    this.state.vibe = vibe;
    this.notify();
  }

  public async setTrack(url: string, blob: Blob | null, source: 'lyria' | 'synthesizer' | null) {
    this.state.soundtrackUrl = url;
    this.state.soundtrackBlob = blob;
    this.state.source = source;
    if (this.audio) {
      const wasPlaying = this.state.isPlaying;
      this.audio.src = url;
      this.audio.currentTime = 0;
      this.state.currentTime = 0;
      if (wasPlaying) {
        try {
          await this.audio.play();
        } catch (e) {
          console.warn('Auto-playback failed:', e);
        }
      }
    }
    this.notify();
  }

  public async play() {
    if (!this.audio) return;
    if (!this.state.soundtrackUrl) {
      // Generate track for current vibe if not yet generated
      this.state.isGenerating = true;
      this.notify();
      try {
        const res = await generateRunwayMusicTrack(this.state.vibe);
        await this.setTrack(res.url, res.blob, res.source);
      } finally {
        this.state.isGenerating = false;
        this.notify();
      }
    }
    try {
      if (this.audio) {
        this.audio.loop = this.state.isLooping;
        await this.audio.play();
        this.state.isPlaying = true;
        this.notify();
      }
    } catch (err) {
      console.warn('Playback prevented:', err);
    }
  }

  public pause() {
    if (this.audio) {
      this.audio.pause();
      this.state.isPlaying = false;
      this.notify();
    }
  }

  public togglePlay() {
    if (this.state.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }
}

export const runwayAudio = RunwayAudioManager.getInstance();

