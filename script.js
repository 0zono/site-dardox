const toggle = document.querySelector(".sound-toggle");
const progress = document.querySelector(".progress span");
const reveals = [...document.querySelectorAll(".reveal")];

let audioContext;
let soundEnabled = false;
let lastProgressTone = 0;

const initAudio = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume();
  }
};

const playTone = (frequency, duration = 0.2, type = "sine", gainValue = 0.055) => {
  if (!soundEnabled || !audioContext) return;

  const now = audioContext.currentTime;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, now);
  oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.18, now + duration);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(gainValue, now + 0.025);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start(now);
  oscillator.stop(now + duration + 0.03);
};

const playRevealSound = (index) => {
  const notes = [523.25, 659.25, 783.99, 987.77, 880, 739.99, 1046.5];
  playTone(notes[index % notes.length], 0.24, "triangle", 0.05);
  window.setTimeout(() => playTone(notes[(index + 2) % notes.length], 0.16, "sine", 0.032), 80);
};

const updateProgress = () => {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const percent = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
  progress.style.width = `${percent * 100}%`;

  const bucket = Math.floor(percent * 8);
  if (soundEnabled && bucket > lastProgressTone) {
    lastProgressTone = bucket;
    playTone(392 + bucket * 32, 0.12, "sine", 0.02);
  }
};

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      const el = entry.target;
      const index = reveals.indexOf(el);
      el.classList.add("is-visible");

      if (!el.dataset.played) {
        el.dataset.played = "true";
        playRevealSound(index);
      }
    });
  },
  {
    threshold: 0.44,
    rootMargin: "0px 0px -12% 0px",
  },
);

reveals.forEach((el) => observer.observe(el));
updateProgress();
window.addEventListener("scroll", updateProgress, { passive: true });

toggle.classList.add("is-muted");
toggle.addEventListener("click", () => {
  initAudio();
  soundEnabled = !soundEnabled;
  toggle.classList.toggle("is-muted", !soundEnabled);
  toggle.setAttribute("aria-label", soundEnabled ? "Desativar som" : "Ativar som");

  if (soundEnabled) {
    playTone(523.25, 0.12, "triangle", 0.05);
    window.setTimeout(() => playTone(783.99, 0.18, "sine", 0.04), 90);
  }
});
