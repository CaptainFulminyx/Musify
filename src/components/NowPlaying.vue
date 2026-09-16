<template>
  <section class="now-playing">
    <div class="np-art" :class="{ spinning: isPlaying }">
      <div class="art-inner">♫</div>
    </div>
    <div class="np-info">
      <div class="np-label">NOW PLAYING</div>
      <div class="np-title" :title="currentTrack?.name">
        {{ currentTrack?.name || "— no track loaded —" }}
      </div>
      <div class="np-artist">
        {{
          currentTrack?.artist || "drop a file or type `add` to load music"
        }}
      </div>

      <!-- Progress bar -->
      <div class="progress-wrap">
        <div class="progress-bar" @click="onSeekClick" ref="progressEl">
          <span class="progress-fill">[{{ barFilled }}{{ barDot }}{{ barEmpty }}]</span>
        </div>
        <div class="progress-times">
          <span>{{ fmtTime(currentTime) }}</span>
          <span class="dim">/</span>
          <span>{{ fmtTime(duration) }}</span>
          <span class="volume">vol {{ volume }}%</span>
        </div>
      </div>

      <!-- Controls -->
      <div class="controls">
        <button @click="onPrev" title="Previous">⏮</button>
        <button
          @click="onTogglePlay"
          class="play-btn"
          :title="isPlaying ? 'Pause' : 'Play'"
        >
          {{ isPlaying ? "❚❚" : "▶" }}
        </button>
        <button @click="onNext" title="Next">⏭</button>
        <button @click="onShuffle" title="Shuffle">⇄</button>
        <button
          @click="onToggleLoop"
          :class="{ active: loopMode }"
          title="Loop"
        >
          ↻
        </button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from "vue";

const props = defineProps({
  currentTrack: Object,
  isPlaying: Boolean,
  currentTime: Number,
  duration: Number,
  volume: Number,
  loopMode: Boolean,
  fmtTime: Function,
});

const emit = defineEmits([
  "toggle-play",
  "prev",
  "next",
  "shuffle",
  "toggle-loop",
  "seek",
]);

const progressEl = ref(null);

const BAR_WIDTH = 40;
const barFilled = computed(() => {
  if (!props.duration) return "─".repeat(BAR_WIDTH);
  const ratio = props.currentTime / props.duration;
  return "=".repeat(Math.max(0, Math.round(ratio * BAR_WIDTH) - 1));
});

const barDot = computed(() => (props.duration ? ">" : ""));

const barEmpty = computed(() => {
  if (!props.duration) return "";
  const filled = barFilled.value.length + (barDot.value ? 1 : 0);
  return " ".repeat(Math.max(0, BAR_WIDTH - filled));
});

function onSeekClick(e) {
  if (!props.duration || !progressEl.value) return;
  const rect = progressEl.value.getBoundingClientRect();
  const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
  emit("seek", ratio * props.duration);
}

function onTogglePlay() {
  emit("toggle-play");
}

function onPrev() {
  emit("prev");
}

function onNext() {
  emit("next");
}

function onShuffle() {
  emit("shuffle");
}

function onToggleLoop() {
  emit("toggle-loop");
}
</script>

<style scoped>
.now-playing {
  display: flex;
  gap: 1.5rem;
  padding: 1.5rem;
  border-bottom: 1px dashed var(--border);
  background: rgba(0, 0, 0, 0.2);
  flex-shrink: 0;
}

.np-art {
  width: 100px;
  height: 100px;
  border: 1px solid var(--border);
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
}

.np-art.spinning .art-inner {
  animation: spin 4s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.art-inner {
  font-size: 2.4rem;
  color: var(--accent);
}

.np-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.np-label {
  font-size: 0.7rem;
  color: var(--dim);
  letter-spacing: 0.1em;
  margin-bottom: 0.35rem;
}

.np-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--fg);
  margin-bottom: 0.2rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.np-artist {
  font-size: 0.9rem;
  color: var(--dim);
  margin-bottom: 0.8rem;
}

.progress-wrap {
  margin-bottom: 0.8rem;
}

.progress-bar {
  font-family: inherit;
  font-size: 0.75rem;
  color: var(--accent);
  cursor: pointer;
  user-select: none;
  margin-bottom: 0.25rem;
}

.progress-times {
  display: flex;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: var(--dim);
  align-items: center;
}

.volume {
  margin-left: auto;
}

.controls {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.controls button {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--fg);
  font-family: inherit;
  font-size: 0.95rem;
  width: 2.2rem;
  height: 2.2rem;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.controls button:hover {
  box-shadow: 0 0 12px var(--glow);
  border-color: var(--fg);
}

.controls button.active {
  background: var(--fg);
  color: var(--bg);
}

.controls .play-btn {
  background: var(--fg);
  color: var(--bg);
  box-shadow: 0 0 14px var(--glow);
}

.controls .play-btn:hover {
  box-shadow: 0 0 20px var(--glow);
}

@media (max-width: 900px) {
  .now-playing {
    flex-direction: column;
    gap: 1rem;
  }

  .np-art {
    width: 60px;
    height: 60px;
  }

  .art-inner {
    font-size: 1.4rem;
  }
}
</style>
