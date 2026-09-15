<script setup>
import { ref, onMounted, onUnmounted } from "vue";

/* ---------- Theme ---------- */
const themes = ["phosphor", "amber", "iceberg"];
const theme = ref("phosphor");

/* ---------- Typewriter ---------- */
const commands = [
  "> play lofi beats",
  "> to your local music",
  "> be the nerd in the group",
  "> no nonsense",
  "> just you, your keyboard, and the music.",
  "> volume 80",
  `> theme ${theme.value}`,
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
</script>

<template>
  <div class="landing" :class="`theme-${theme}`">
    <div class="scanlines" aria-hidden="true"></div>
    <div class="flicker" aria-hidden="true"></div>
    <div class="vignette" aria-hidden="true"></div>

    <header class="topbar">
      <div class="window-title"></div>
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

    <section class="hero">
      <div class="prompt-line">
        <span class="prompt">$</span>
        <span class="cmd">ssh app@bashtune ~</span>
      </div>

      <h1 class="hero-title">BashTune<span class="cursor">_</span></h1>

      <p class="hero-tagline">A terminal-themed music player in the web.</p>

      <p class="hero-description">Listen to your music files & VIBE.</p>

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
  </div>
</template>

<style scoped>
/* Landing-only layout. Everything else lives in main.css */

.landing {
  min-height: 100vh;
  background: var(--bg);
  color: var(--fg);
  font-family: var(--font-mono);
  position: relative;
  overflow-x: hidden;
  line-height: 1.55;
}

/* ---------- Hero (landing-specific) ---------- */
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
.prompt-line .prompt {
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
.cta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 2rem;
}

/* Landing-specific mobile tweak */
@media (max-width: 600px) {
  .hero {
    padding-top: 3rem;
  }
}
</style>
