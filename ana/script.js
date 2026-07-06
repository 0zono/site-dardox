const toggles = [...document.querySelectorAll(".sound-toggle")];
const progress = document.querySelector(".progress span");
const reveals = [...document.querySelectorAll(".reveal")];

let audioContext;
let soundEnabled = false;
let jingleTimer;

const lockHorizontalScroll = () => {
  if (window.scrollX !== 0) {
    window.scrollTo(0, window.scrollY);
  }
};

const initAudio = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume();
  }
};

const envelope = (gain, now, peak, duration) => {
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(peak, now + 0.018);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
};

const playTone = ({
  frequency,
  duration = 0.2,
  type = "sine",
  gainValue = 0.04,
  start = 0,
  bend = 1,
}) => {
  if (!soundEnabled || !audioContext) return;

  const now = audioContext.currentTime + start;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, now);
  oscillator.frequency.exponentialRampToValueAtTime(frequency * bend, now + duration);

  envelope(gain, now, gainValue, duration);
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start(now);
  oscillator.stop(now + duration + 0.03);
};

const playNoise = ({ duration = 0.08, gainValue = 0.018, start = 0 }) => {
  if (!soundEnabled || !audioContext) return;

  const now = audioContext.currentTime + start;
  const buffer = audioContext.createBuffer(1, audioContext.sampleRate * duration, audioContext.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < data.length; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  }

  const source = audioContext.createBufferSource();
  const gain = audioContext.createGain();
  const filter = audioContext.createBiquadFilter();

  filter.type = "highpass";
  filter.frequency.value = 1200;
  envelope(gain, now, gainValue, duration);

  source.buffer = buffer;
  source.connect(filter);
  filter.connect(gain);
  gain.connect(audioContext.destination);
  source.start(now);
};

const chime = (notes, gainValue = 0.035) => {
  notes.forEach((note, i) => {
    playTone({
      frequency: note,
      duration: 0.28,
      type: i % 2 ? "sine" : "triangle",
      gainValue,
      start: i * 0.075,
      bend: 1.02,
    });
  });
};

const romanticJingle = () => {
  chime([261.63, 329.63, 392, 523.25], 0.014);
  playTone({
    frequency: 659.25,
    duration: 0.9,
    type: "sine",
    gainValue: 0.012,
    start: 0.42,
    bend: 0.995,
  });
  playTone({
    frequency: 392,
    duration: 1.1,
    type: "triangle",
    gainValue: 0.01,
    start: 0.58,
    bend: 1.005,
  });
};

const startJingle = () => {
  if (jingleTimer) return;
  romanticJingle();
  jingleTimer = window.setInterval(romanticJingle, 5200);
};

const stopJingle = () => {
  window.clearInterval(jingleTimer);
  jingleTimer = undefined;
};

const soundMap = {
  typing: () => {
    playNoise({ duration: 0.035, gainValue: 0.012 });
    playNoise({ duration: 0.028, gainValue: 0.01, start: 0.075 });
    playTone({ frequency: 880, duration: 0.05, type: "square", gainValue: 0.01, start: 0.03 });
  },
  paper: () => {
    playNoise({ duration: 0.16, gainValue: 0.022 });
    playTone({ frequency: 330, duration: 0.12, type: "triangle", gainValue: 0.018, start: 0.05, bend: 0.92 });
  },
  warm: () => chime([392, 493.88, 587.33], 0.027),
  birthday: () => chime([523.25, 659.25, 783.99, 1046.5, 1318.51], 0.045),
  wonder: () => chime([440, 554.37, 659.25], 0.03),
  stars: () => chime([987.77, 1318.51, 1567.98], 0.024),
  heart: () => {
    playTone({ frequency: 196, duration: 0.18, type: "sine", gainValue: 0.03 });
    playTone({ frequency: 392, duration: 0.22, type: "triangle", gainValue: 0.025, start: 0.18 });
  },
  plan: () => chime([349.23, 440, 523.25], 0.026),
  memory: () => chime([329.63, 392, 493.88], 0.024),
  promise: () => chime([261.63, 392, 523.25], 0.03),
  admire: () => chime([659.25, 783.99, 987.77], 0.026),
  love: () => {
    playTone({ frequency: 220, duration: 0.22, type: "sine", gainValue: 0.034 });
    playTone({ frequency: 440, duration: 0.24, type: "triangle", gainValue: 0.03, start: 0.16 });
    playTone({ frequency: 660, duration: 0.34, type: "sine", gainValue: 0.025, start: 0.34 });
  },
  celebrate: () => chime([523.25, 659.25, 880], 0.034),
  smile: () => chime([392, 523.25, 659.25], 0.026),
  gift: () => {
    playNoise({ duration: 0.09, gainValue: 0.018 });
    chime([587.33, 739.99, 987.77, 1174.66], 0.038);
  },
};

const playRevealSound = (el) => {
  const sound = el.dataset.sound || "warm";
  soundMap[sound]?.();
};

const updateProgress = () => {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const percent = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
  progress.style.width = `${percent * 100}%`;
};

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      const el = entry.target;
      el.classList.add("is-visible");

      if (!el.dataset.played) {
        el.dataset.played = "true";
        playRevealSound(el);
      }
    });
  },
  {
    threshold: 0.52,
    rootMargin: "0px 0px -10% 0px",
  },
);

reveals.forEach((el) => observer.observe(el));
updateProgress();
window.addEventListener("scroll", updateProgress, { passive: true });
window.addEventListener("scroll", lockHorizontalScroll, { passive: true });
window.addEventListener("resize", lockHorizontalScroll);

const syncToggleState = () => {
  toggles.forEach((toggle) => {
    toggle.classList.toggle("is-muted", !soundEnabled);
    toggle.classList.toggle("is-sound-on", soundEnabled);
    toggle.setAttribute("aria-label", soundEnabled ? "Desativar som" : "Ativar som");

    const label = toggle.querySelector("span");
    if (label) label.textContent = soundEnabled ? "Trilha ligada" : "Ativar trilha";
  });
};

syncToggleState();
toggles.forEach((toggle) => toggle.addEventListener("click", () => {
  initAudio();
  soundEnabled = !soundEnabled;
  syncToggleState();

  if (soundEnabled) {
    startJingle();
    chime([392, 523.25, 659.25], 0.032);
  } else {
    stopJingle();
  }
}));
