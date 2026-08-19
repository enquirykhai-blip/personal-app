let ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
  try {
    if (!ctx) ctx = new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

/** Short ascending two-tone "ding" — synthesized, no audio file needed. */
export function playCompleteChime() {
  const audio = getContext();
  if (!audio) return;
  const now = audio.currentTime;
  [660, 880].forEach((freq, i) => {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    const start = now + i * 0.09;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.2, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.18);
    osc.connect(gain).connect(audio.destination);
    osc.start(start);
    osc.stop(start + 0.2);
  });
}
