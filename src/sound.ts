type AudioContextCtor = typeof AudioContext;

let ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
  try {
    if (!ctx) {
      const Ctor: AudioContextCtor | undefined =
        window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
    }
    return ctx;
  } catch {
    return null;
  }
}

function fireChime(audio: AudioContext) {
  const now = audio.currentTime;
  [660, 880].forEach((freq, i) => {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    const start = now + i * 0.1;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.5, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.28);
    osc.connect(gain).connect(audio.destination);
    osc.start(start);
    osc.stop(start + 0.3);
  });
}

/** Short ascending two-tone "ding" — synthesized, no audio file needed.
    Must be called directly inside a user-gesture handler (a click), or
    iOS/Safari will silently refuse to unlock the audio context. */
export function playCompleteChime() {
  const audio = getContext();
  if (!audio) return;
  if (audio.state === "suspended") {
    audio.resume().then(() => fireChime(audio), () => {});
  } else {
    fireChime(audio);
  }
}
