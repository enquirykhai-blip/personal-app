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

/** Runs `fire` once the context is actually running — scheduling into a
    still-"suspended" context (common on the first tap of an iOS session)
    plays into silence, so this waits for resume() to resolve first. */
function withContext(fire: (audio: AudioContext) => void) {
  const audio = getContext();
  if (!audio) return;
  if (audio.state === "suspended") {
    audio.resume().then(() => fire(audio), () => {});
  } else {
    fire(audio);
  }
}

function tone(audio: AudioContext, start: number, freq: number, duration: number, peak: number, type: OscillatorType) {
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(peak, start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain).connect(audio.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

/** Ascending two-tone "ding" for finishing a step. */
export function playCompleteChime() {
  withContext((audio) => {
    const now = audio.currentTime;
    [660, 880].forEach((freq, i) => tone(audio, now + i * 0.1, freq, 0.28, 0.5, "sine"));
  });
}

/** Single short, lower "tock" for skipping a step — deliberately flatter and
    quieter than the completion chime so the two are never confused. */
export function playSkipSound() {
  withContext((audio) => {
    tone(audio, audio.currentTime, 320, 0.12, 0.3, "triangle");
  });
}
