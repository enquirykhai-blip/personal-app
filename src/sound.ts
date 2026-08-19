/** Renders a set of short sine-wave notes into a 16-bit PCM WAV, returned as
    a data: URI. Played through a plain <audio> element rather than a live
    AudioContext oscillator — far fewer "unlock" quirks across mobile
    browsers, since it's the same code path as any other <audio> playback. */
function synthWav(notes: { freq: number; start: number; dur: number }[], totalDur: number): string {
  const sampleRate = 8000;
  const numSamples = Math.ceil(totalDur * sampleRate);
  const samples = new Float32Array(numSamples);

  for (const { freq, start, dur } of notes) {
    const startSample = Math.floor(start * sampleRate);
    const durSamples = Math.floor(dur * sampleRate);
    for (let i = 0; i < durSamples; i++) {
      const idx = startSample + i;
      if (idx >= numSamples) break;
      const t = i / sampleRate;
      const attack = Math.min(1, i / (sampleRate * 0.01));
      const envelope = attack * Math.exp(-6 * t);
      samples[idx] += Math.sin(2 * Math.PI * freq * t) * envelope * 0.7;
    }
  }

  const dataSize = numSamples * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  const writeStr = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
  };
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return `data:audio/wav;base64,${btoa(binary)}`;
}

let completeUri: string | null = null;
let skipUri: string | null = null;
let fanfareUri: string | null = null;

function play(uri: string) {
  try {
    const audio = new Audio(uri);
    void audio.play().catch(() => {});
  } catch {
    // Audio unavailable in this environment; fail silently.
  }
}

/** Ascending two-tone "ding" for finishing a step. */
export function playCompleteChime() {
  completeUri ??= synthWav(
    [
      { freq: 660, start: 0, dur: 0.28 },
      { freq: 880, start: 0.1, dur: 0.28 },
    ],
    0.4,
  );
  play(completeUri);
}

/** Single short, lower "tock" for skipping a step. */
export function playSkipSound() {
  skipUri ??= synthWav([{ freq: 320, start: 0, dur: 0.14 }], 0.16);
  play(skipUri);
}

/** Four-note rising fanfare for finishing an entire task — the "brain
    reward" moment, bigger and brighter than the per-step ding. */
export function playCelebrationFanfare() {
  fanfareUri ??= synthWav(
    [
      { freq: 523.25, start: 0, dur: 0.2 }, // C5
      { freq: 659.25, start: 0.12, dur: 0.2 }, // E5
      { freq: 783.99, start: 0.24, dur: 0.22 }, // G5
      { freq: 1046.5, start: 0.38, dur: 0.5 }, // C6, held
    ],
    0.9,
  );
  play(fanfareUri);
}
