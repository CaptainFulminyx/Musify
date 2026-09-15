<script setup>
import { ref, onMounted, onUnmounted } from "vue";

/* ---------- Theme ---------- */
const themes = ["green_phosphor", "amber_crt", "ibm_blue"];
const theme = ref("green_phosphor");

/* ---------- Typewriter ---------- */
const commands = [
  "> play midnight_drive",
  "> search lofi beats",
  "> queue artist:kai_engel",
  "> volume 80",
  "> theme amber",
];

const typedText = ref("");
let cmdIndex = 0;
let charIndex = 0;
let deleting = false;
let timeoutId = null;

const tick = () => {
  const current = commands[cmdIndex];
  if (!deleting) {
    typedText.value = current.slice(0, ++charIndex);
    if (charIndex === current.length) {
      deleting = true;
      timeoutId = setTimeout(tick, 1400);
      return;
    }
  } else {
    typedText.value = current.slice(0, --charIndex);
    if (charIndex === 0) {
      deleting = false;
      cmdIndex = (cmdIndex + 1) % commands.length;
    }
  }
  timeoutId = setTimeout(tick, deleting ? 30 : 65);
};

onMounted(() => {
  timeoutId = setTimeout(tick, 400);
});
onUnmounted(() => clearTimeout(timeoutId));

/* ---------- Content ---------- */
const features = [
  {
    id: "01",
    title: "COMMAND-DRIVEN",
    body: 'No mouse required. Control everything with simple, intuitive commands. Type <code>help</code> to see the full list.<br><br><span class="dim">$ play, pause, next, prev, search, queue, theme...</span>',
  },
  {
    id: "02",
    title: "REAL MUSIC",
    body: "Powered by the Jamendo API. Thousands of tracks from independent artists, all Creative Commons licensed. Search by genre, mood, or artist.",
  },
  {
    id: "03",
    title: "CRT AESTHETIC",
    body: "Green phosphor glow. Scanlines. Screen flicker. A love letter to the terminals of the 80s, reimagined for the modern web.",
  },
  {
    id: "04",
    title: "LIVE VISUALIZER",
    body: "Watch your music come alive. Real-time frequency bars rendered with the Web Audio API, styled to match your chosen theme.",
  },
  {
    id: "05",
    title: "REMEMBERS YOU",
    body: "Volume, theme, and last played track saved to your browser. Pick up right where you left off.",
  },
  {
    id: "06",
    title: "KEYBOARD FIRST",
    body: "Space to play. Arrows to seek. Tab to autocomplete. Built for people who live in the terminal.",
  },
];

const themeDescriptions = [
  { name: "green_phosphor", desc: "classic 80s terminal" },
  { name: "amber_crt", desc: "warm and vintage" },
  { name: "ibm_blue", desc: "corporate mainframe chic" },
];

const steps = [
  {
    cmd: "step_1 --open",
    body: "Just open the player. No signup. No download. Your browser is the terminal.",
  },
  {
    cmd: 'step_2 --search "lofi"',
    body: "Type a search command to find music from thousands of independent artists.",
  },
  {
    cmd: "step_3 --play",
    body: "Hit enter. The music plays. The terminal responds. That's it.",
  },
];

const stack = [
  { name: "vue 3", desc: "progressive framework" },
  { name: "vite", desc: "blazing fast build tool" },
  { name: "pinia", desc: "state management" },
  { name: "howler.js", desc: "audio engine" },
  { name: "web audio api", desc: "visualizer + analysis" },
  { name: "jamendo api", desc: "music source" },
];
</script>
<template>
  <div class="landing" :class="`theme-${theme}`">
    <!-- CRT overlay effects -->
    <div class="scanlines" aria-hidden="true"></div>
    <div class="flicker" aria-hidden="true"></div>
    <div class="vignette" aria-hidden="true"></div>

    <!-- Top bar / fake window chrome -->
    <header class="topbar">
      <div class="window-title">guest@tunestream: ~</div>
      <div class="theme-switch">
        <button
          v-for="t in themes"
          :key="t"
          :class="{ active: theme === t }"
          @click="theme = t"
          :title="`Switch to ${t}`"
        >
          {{ t }}
        </button>
      </div>
    </header>

    <!-- HERO -->
    <section class="hero">
      <div class="prompt-line">
        <span class="prompt">$</span>
        <span class="cmd">ssh app@bashtune ~</span>
      </div>

      <h1 class="hero-title">BashTune<span class="cursor">_</span></h1>

      <p class="hero-tagline">
        A terminal-native music player for the web.<br />
        No clicks. No clutter. Just commands.
      </p>

      <p class="hero-description">
        Stream Creative Commons music from around the world, right from your
        browser. Type a command, hit enter, and listen.
      </p>

      <div class="typewriter">
        <span class="prompt">&gt;</span>
        <span class="typed">{{ typedText }}</span>
        <span class="cursor">|</span>
      </div>

      <div class="cta-row">
        <a href="#launch" class="btn primary">&gt; launch_player</a>
        <a href="#docs" class="btn secondary">&gt; read_docs</a>
      </div>
    </section>

    <!-- FEATURES -->

    <!-- FINAL CTA -->
    <section class="section cta-final">
      <h2 class="cta-header">READY_TO_TUNE_IN?</h2>
      <p class="cta-sub">
        No account. No ads. No nonsense.<br />
        Just you, your keyboard, and the music.
      </p>
      <a href="#start" class="btn primary big">$ start_listening --now</a>
      <p class="cta-hint">Free forever. Open source on GitHub.</p>
    </section>

    <!-- FOOTER -->
    <footer class="footer">
      <div class="footer-col">
        <div>TUNESTREAM © 2025</div>
        <div>Built by <span class="accent">Your Name</span></div>
      </div>
      <div class="footer-col">
        <a href="#github">&gt; github</a>
        <a href="#source">&gt; source_code</a>
        <a href="#bug">&gt; report_bug</a>
        <a href="#credits">&gt; credits</a>
      </div>
      <div class="footer-col small">
        <p>
          Music provided by Jamendo under Creative Commons licenses.<br />
          All tracks belong to their artists.
        </p>
      </div>
      <div class="footer-signature">
        $ exit<br />Connection to tunestream closed.
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* ---------- Theme variables ---------- */
.landing {
  --bg: #0a0f0a;
  --fg: #33ff66;
  --dim: #1f8f3f;
  --accent: #7dffa5;
  --glow: rgba(51, 255, 102, 0.35);
  --border: #1f8f3f;
  min-height: 100vh;
  background: var(--bg);
  color: var(--fg);
  font-family:
    "JetBrains Mono", "Fira Code", "IBM Plex Mono", ui-monospace, Menlo,
    Consolas, monospace;
  position: relative;
  overflow-x: hidden;
  transition:
    background 0.4s ease,
    color 0.4s ease;
  line-height: 1.55;
}

.theme-amber_crt {
  --bg: #120a02;
  --fg: #ffb000;
  --dim: #a06a00;
  --accent: #ffd066;
  --glow: rgba(255, 176, 0, 0.35);
  --border: #a06a00;
}

.theme-ibm_blue {
  --bg: #04121c;
  --fg: #6fd7ff;
  --dim: #2d6d8a;
  --accent: #b3ecff;
  --glow: rgba(111, 215, 255, 0.35);
  --border: #2d6d8a;
}

/* ---------- CRT overlays ---------- */
.scanlines,
.flicker,
.vignette {
  pointer-events: none;
  position: fixed;
  inset: 0;
  z-index: 100;
}
.scanlines {
  background: repeating-linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0) 0px,
    rgba(0, 0, 0, 0) 2px,
    rgba(0, 0, 0, 0.18) 3px,
    rgba(0, 0, 0, 0.18) 4px
  );
  mix-blend-mode: multiply;
}
.flicker {
  background: rgba(255, 255, 255, 0.015);
  animation: flicker 0.15s infinite;
}
@keyframes flicker {
  0% {
    opacity: 0.85;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.9;
  }
}
.vignette {
  background: radial-gradient(
    ellipse at center,
    rgba(0, 0, 0, 0) 40%,
    rgba(0, 0, 0, 0.55) 100%
  );
}

/* ---------- Top bar ---------- */
.topbar {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.6rem 1rem;
  border-bottom: 1px solid var(--border);
  background: rgba(0, 0, 0, 0.35);
  position: sticky;
  top: 0;
  backdrop-filter: blur(4px);
  z-index: 50;
}
.window-controls {
  display: flex;
  gap: 0.4rem;
}
.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: inline-block;
  box-shadow: 0 0 6px rgba(0, 0, 0, 0.5) inset;
}
.dot.red {
  background: #ff5f56;
}
.dot.yellow {
  background: #ffbd2e;
}
.dot.green {
  background: #27c93f;
}
.window-title {
  flex: 1;
  text-align: center;
  color: var(--dim);
  font-size: 0.85rem;
  letter-spacing: 0.05em;
}
.theme-switch {
  display: flex;
  gap: 0.25rem;
}
.theme-switch button {
  background: transparent;
  color: var(--dim);
  border: 1px solid var(--border);
  font-family: inherit;
  font-size: 0.7rem;
  padding: 0.25rem 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}
.theme-switch button:hover {
  color: var(--fg);
  border-color: var(--fg);
}
.theme-switch button.active {
  color: var(--bg);
  background: var(--fg);
  border-color: var(--fg);
  box-shadow: 0 0 12px var(--glow);
}

/* ---------- Hero ---------- */
.hero {
  max-width: 900px;
  margin: 0 auto;
  padding: 5rem 1.5rem 4rem;
  text-align: left;
}
.prompt-line {
  color: var(--dim);
  font-size: 0.95rem;
  margin-bottom: 1.5rem;
}
.prompt {
  color: var(--accent);
  margin-right: 0.5rem;
}
.hero-title {
  font-size: clamp(2rem, 7vw, 4.6rem);
  font-weight: 700;
  letter-spacing: 0.02em;
  margin: 0 0 1.2rem;
  text-shadow:
    0 0 8px var(--glow),
    0 0 24px var(--glow);
}
.hero-tagline {
  font-size: clamp(1rem, 2vw, 1.25rem);
  color: var(--fg);
  margin: 0 0 1rem;
}
.hero-description {
  color: var(--dim);
  max-width: 60ch;
  margin: 0 0 2rem;
}
.typewriter {
  color: var(--accent);
  font-size: 1rem;
  margin: 1.5rem 0;
  min-height: 1.6em;
}
.cursor {
  display: inline-block;
  margin-left: 2px;
  animation: blink 1s step-end infinite;
}
@keyframes blink {
  50% {
    opacity: 0;
  }
}

.cta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 2rem;
}
.btn {
  display: inline-block;
  padding: 0.7rem 1.2rem;
  border: 1px solid var(--fg);
  color: var(--fg);
  text-decoration: none;
  font-family: inherit;
  font-size: 0.95rem;
  transition: all 0.2s;
  cursor: pointer;
}
.btn.primary {
  background: var(--fg);
  color: var(--bg);
  box-shadow: 0 0 14px var(--glow);
}
.btn.primary:hover {
  box-shadow: 0 0 22px var(--glow);
  transform: translateY(-1px);
}
.btn.secondary:hover {
  background: rgba(255, 255, 255, 0.05);
  box-shadow: 0 0 12px var(--glow);
}
.btn.big {
  font-size: 1.05rem;
  padding: 0.9rem 1.6rem;
}

/* ---------- Sections ---------- */
.section {
  max-width: 1000px;
  margin: 0 auto;
  padding: 3.5rem 1.5rem;
  border-top: 1px dashed var(--border);
}
.section-header {
  font-size: 1.5rem;
  letter-spacing: 0.05em;
  margin: 0 0 1.5rem;
  color: var(--accent);
  text-shadow: 0 0 10px var(--glow);
}
.section-intro {
  color: var(--dim);
  margin: 0 0 1.5rem;
}

/* Features */
.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}
.feature {
  border: 1px solid var(--border);
  padding: 1.25rem;
  background: rgba(0, 0, 0, 0.2);
  transition: all 0.25s;
}
.feature:hover {
  border-color: var(--fg);
  box-shadow: 0 0 18px var(--glow);
  transform: translateY(-2px);
}
.feature-title {
  font-size: 1rem;
  margin: 0 0 0.6rem;
  color: var(--fg);
  letter-spacing: 0.03em;
}
.feature-title .num {
  color: var(--dim);
}
.feature-body {
  color: var(--dim);
  font-size: 0.92rem;
  margin: 0;
}
.feature-body :deep(code) {
  color: var(--accent);
  background: rgba(255, 255, 255, 0.05);
  padding: 0 0.3em;
  border-radius: 2px;
}
.feature-body :deep(.dim) {
  color: var(--dim);
  font-size: 0.85rem;
}

/* Themes + Stack lists */
.theme-list,
.stack-list {
  list-style: none;
  padding: 0;
  margin: 0;
  font-size: 0.98rem;
}
.theme-list li,
.stack-list li {
  padding: 0.5rem 0;
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  border-bottom: 1px dashed rgba(255, 255, 255, 0.05);
}
.theme-name,
.stack-name {
  min-width: 160px;
  color: var(--fg);
}
.comment {
  color: var(--dim);
  font-style: italic;
}

/* Steps */
.steps {
  list-style: none;
  padding: 0;
  margin: 0;
  counter-reset: step;
}
.steps li {
  padding: 1rem 0;
  border-bottom: 1px dashed rgba(255, 255, 255, 0.08);
}
.step-cmd {
  color: var(--accent);
  font-size: 1rem;
  margin-bottom: 0.4rem;
}
.step-body {
  color: var(--dim);
  margin: 0;
}

/* Final CTA */
.cta-final {
  text-align: center;
  padding: 5rem 1.5rem;
}
.cta-header {
  font-size: clamp(1.8rem, 4vw, 2.6rem);
  letter-spacing: 0.05em;
  margin: 0 0 1rem;
  text-shadow: 0 0 14px var(--glow);
}
.cta-sub {
  color: var(--dim);
  margin: 0 0 2rem;
}
.cta-hint {
  color: var(--dim);
  font-size: 0.85rem;
  margin-top: 1.25rem;
}

/* Footer */
.footer {
  border-top: 1px solid var(--border);
  padding: 2rem 1.5rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  max-width: 1000px;
  margin: 0 auto;
  font-size: 0.85rem;
  color: var(--dim);
}
.footer-col {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.footer-col a {
  color: var(--dim);
  text-decoration: none;
  transition: color 0.2s;
}
.footer-col a:hover {
  color: var(--fg);
  text-shadow: 0 0 8px var(--glow);
}
.footer-col.small p {
  margin: 0;
  line-height: 1.6;
}
.accent {
  color: var(--accent);
}
.footer-signature {
  grid-column: 1 / -1;
  border-top: 1px dashed var(--border);
  padding-top: 1rem;
  color: var(--dim);
  font-size: 0.8rem;
  line-height: 1.6;
}

/* Mobile tweaks */
@media (max-width: 600px) {
  .window-title {
    display: none;
  }
  .hero {
    padding-top: 3rem;
  }
  .theme-switch button {
    font-size: 0.6rem;
    padding: 0.2rem 0.35rem;
  }
}
</style>
