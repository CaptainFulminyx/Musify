<template>
  <div class="jukebox" :class="themeStore.themeClass">
    <div class="scanlines" aria-hidden="true"></div>
    <div class="flicker" aria-hidden="true"></div>
    <div class="vignette" aria-hidden="true"></div>

    <!-- Top bar -->
    <header class="topbar">
      <div class="window-controls">
        <span class="dot red"></span>
        <span class="dot yellow"></span>
        <span class="dot green"></span>
      </div>
      <div class="window-title">
        {{
          currentTrack
            ? `♪ ${currentTrack.name} — ${currentTrack.artist}`
            : "guest@tunestream: ~/player"
        }}
      </div>
      <div class="topbar-right">
        <button class="icon-btn" @click="pickFiles" title="Add music">+</button>
        <button class="icon-btn" @click="showHelp = true" title="Help">
          ?
        </button>
        <button class="icon-btn" @click="cycleTheme" title="Theme">◐</button>
      </div>
    </header>

    <div class="layout">
      <!-- MAIN -->
      <main class="main-pane">
        <!-- Now Playing -->
        <NowPlaying
          :current-track="currentTrack"
          :is-playing="isPlaying"
          :current-time="currentTime"
          :duration="duration"
          :volume="volume"
          :loop-mode="loopMode"
          :fmt-time="fmtTime"
          @toggle-play="togglePlay"
          @prev="prev"
          @next="next"
          @shuffle="shuffleQueue"
          @toggle-loop="loopMode = !loopMode"
          @seek="seek"
        />

        <!-- Visualizer -->
        <Visualizer :is-playing="isPlaying" :get-analyser="getAnalyser" />

        <!-- Terminal -->
        <Terminal
          :output-lines="outputLines"
          v-model:commandInput="cmd.commandInput.value"
          :on-input-keydown="onInputKeydown"
          @command="runCommand"
        />
      </main>

      <!-- SIDEBAR -->
      <Sidebar
        :queue="queue"
        :library="library.library.value"
        :current-track="currentTrack"
        :fmt-time="fmtTime"
        @play-from-queue="playFromQueue"
        @play-track="playTrack"
        @add-files="pickFiles"
        @clear-library="clearLibrary"
      />
    </div>

    <!-- Hidden file input -->
    <input
      ref="fileInputEl"
      type="file"
      accept="audio/*,.mp3,.m4a,.wav,.ogg,.flac,.aac,.mp4"
      multiple
      @change="onFilesSelected"
      style="display: none"
    />

    <!-- Help modal -->
    <div v-if="showHelp" class="modal-backdrop" @click.self="showHelp = false">
      <div class="modal">
        <div class="modal-header">
          <span>## COMMAND_REFERENCE</span>
          <button @click="showHelp = false">×</button>
        </div>
        <div class="modal-body">
          <div v-for="c in commandDocs" :key="c.cmd" class="doc-row">
            <code>{{ c.cmd }}</code>
            <span class="dim">{{ c.desc }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useThemeStore } from "@/stores/theme";
import { useAudioPlayer } from "@/composables/useAudioPlayer";
import { useTrackLibrary } from "@/composables/useTrackLibrary";
import { useCommands } from "@/composables/useCommands";
import NowPlaying from "@/components/NowPlaying.vue";
import Visualizer from "@/components/Visualizer.vue";
import Terminal from "@/components/Terminal.vue";
import Sidebar from "@/components/Sidebar.vue";

// Stores & Composables
const themeStore = useThemeStore();
const audio = useAudioPlayer();
const library = useTrackLibrary();
const cmd = useCommands();

// Local state
const showHelp = ref(false);
const fileInputEl = ref(null);

// Audio State Aliases
const currentTrack = audio.currentTrack;
const isPlaying = audio.isPlaying;
const currentTime = audio.currentTime;
const duration = audio.duration;
const volume = audio.volume;

// Library & Terminal State
const queue = library.queue;
const loopMode = library.loopMode;
const outputLines = cmd.outputLines;
const commandDocs = cmd.commandDocs;

function cycleTheme() {
  themeStore.cycle();
  cmd.log(`theme set to ${themeStore.theme}`, "ok");
}

function fmtTime(s) {
  return cmd.fmtTime(s);
}

function onInputKeydown(e) {
  return cmd.onInputKeydown(e);
}

async function onFilesSelected(e) {
  const files = Array.from(e.target.files || []);
  if (!files.length) return;

  const added = await library.onFilesSelected(files);

  cmd.log(
    `loaded ${added.length} file${added.length === 1 ? "" : "s"} into library`,
    "ok",
  );

  e.target.value = "";

  if (!currentTrack.value && added.length) {
    audio.loadTrack(added[0], true, null, onTrackEnded);
  }
}

function onTrackEnded() {
  next();
}

function playTrack(track) {
  if (!queue.value.find((t) => t.id === track.id)) queue.value.push(track);
  audio.loadTrack(track, true, null, onTrackEnded);
}

function playFromQueue(idx) {
  const t = queue.value[idx];
  if (!t) return;
  audio.loadTrack(t, true, null, onTrackEnded);
}

function togglePlay() {
  audio.togglePlay();
}

function seek(secs) {
  audio.seek(secs);
}

function next() {
  const t = library.getNextTrack(currentTrack.value);
  if (t) audio.loadTrack(t, true, null, onTrackEnded);
}

function prev() {
  if (queue.value.length < 2) return;
  const i = queue.value.findIndex((t) => t.id === currentTrack.value?.id);
  const prevIdx = (i - 1 + queue.value.length) % queue.value.length;
  audio.loadTrack(queue.value[prevIdx], true, null, onTrackEnded);
}

function shuffleQueue() {
  library.shuffleQueue();
  cmd.log("queue shuffled", "ok");
}

function clearLibrary() {
  library.clearLibrary();
  cmd.log("cleared all user files from library", "ok");
}

function pickFiles() {
  fileInputEl.value?.click();
}

function getAnalyser() {
  return audio.getAnalyser();
}

function runCommand(raw) {
  const [cmdName, ...args] = raw.split(/\s+/);
  const arg = args.join(" ");

  switch (cmdName.toLowerCase()) {
    case "help":
      showHelp.value = true;
      cmd.log("opening command reference…", "ok");
      break;

    case "add":
      pickFiles();
      break;

    case "play":
      if (arg) playByNameOrIndex(arg);
      else togglePlay();
      break;

    case "pause":
      if (audio.isPlaying.value) audio.togglePlay();
      break;

    case "stop":
      audio.seek(0);
      break;

    case "next":
      next();
      break;

    case "prev":
      prev();
      break;

    case "seek": {
      const secs = cmd.parseTime(arg);
      if (secs != null) {
        seek(secs);
        cmd.log(`seeked to ${fmtTime(secs)}`, "ok");
      } else {
        cmd.log("usage: seek <mm:ss>", "err");
      }
      break;
    }

    case "volume":
    case "vol": {
      const v = Number(arg);
      if (isNaN(v) || v < 0 || v > 100) {
        cmd.log("usage: volume <0-100>", "err");
      } else {
        volume.value = v;
        cmd.log(`volume set to ${v}%`, "ok");
      }
      break;
    }

    case "search":
    case "find": {
      if (!arg) {
        cmd.log("usage: search <query>", "err");
        break;
      }
      const results = library.searchLibrary(arg);
      if (!results.length) {
        cmd.log(`no matches for "${arg}"`, "err");
      } else {
        cmd.log(
          `found ${results.length} track${results.length === 1 ? "" : "s"}:`,
          "ok",
        );
        results.slice(0, 20).forEach((t, i) => {
          cmd.log(`  [${i}] ${t.name} — ${t.artist}`);
        });
      }
      break;
    }

    case "queue": {
      if (!queue.value.length) {
        cmd.log("queue is empty", "out");
      } else {
        queue.value.forEach((t, i) => {
          cmd.log(`  [${i}] ${t.name} — ${t.artist} (${fmtTime(t.duration)})`);
        });
      }
      break;
    }

    case "library":
    case "ls": {
      if (!library.library.value.length) {
        cmd.log("library is empty", "out");
      } else {
        library.library.value.forEach((t, i) => {
          cmd.log(`  [${i}] ${t.name} — ${t.artist}`);
        });
      }
      break;
    }

    case "shuffle":
      shuffleQueue();
      break;

    case "loop":
      loopMode.value = !loopMode.value;
      cmd.log(`loop ${loopMode.value ? "on" : "off"}`, "ok");
      break;

    case "theme": {
      if (arg && themeStore.themes.includes(arg)) {
        themeStore.setTheme(arg);
        cmd.log(`theme set to ${arg}`, "ok");
      } else if (!arg) {
        cycleTheme();
      } else {
        cmd.log(
          `unknown theme "${arg}". options: ${themeStore.themes.join(", ")}`,
          "err",
        );
      }
      break;
    }

    case "clear":
      cmd.clearTerminal();
      break;

    case "about":
      cmd.log("tunestream — a terminal-themed local music player.", "ok");
      cmd.log(
        "built with vue 3, vite, howler.js, and the web audio api.",
        "ok",
      );
      cmd.log("your files never leave your device.", "ok");
      break;

    default:
      cmd.log(
        `command not found: ${cmdName}. type \`help\` for a list.`,
        "err",
      );
  }
}

function playByNameOrIndex(arg) {
  const track = library.findTrackByNameOrIndex(arg);
  if (track) {
    playTrack(track);
  } else {
    cmd.log(`no track matches "${arg}"`, "err");
  }
}

function onGlobalKeydown(e) {
  const tag = document.activeElement?.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA") return;

  if (e.code === "Space") {
    e.preventDefault();
    togglePlay();
  } else if (e.key === "ArrowRight") {
    audio.seek(Math.min(duration.value, currentTime.value + 5));
  } else if (e.key === "ArrowLeft") {
    audio.seek(Math.max(0, currentTime.value - 5));
  } else if (e.key.toLowerCase() === "m") {
    volume.value = volume.value === 0 ? 70 : 0;
  }
}

onMounted(async () => {
  await library.initializeLibrary();

  cmd.log("tunestream v1.0 — type `help` to see commands", "ok");
  cmd.log("tip: press `add` or the + button to load music from your device");

  window.addEventListener("keydown", onGlobalKeydown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", onGlobalKeydown);
  audio.cleanup();
});
</script>

<style scoped>
.jukebox {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  position: relative;
  background: var(--bg);
  color: var(--fg);
  transition:
    background 0.3s,
    color 0.3s;
  font-size: 14px;
}

.topbar {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.55rem 1rem;
  border-bottom: 1px solid var(--border);
  background: rgba(0, 0, 0, 0.4);
  z-index: 50;
  flex-shrink: 0;
}

.window-controls {
  display: flex;
  gap: 0.5rem;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
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
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.topbar-right {
  display: flex;
  gap: 0.5rem;
}

.icon-btn {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--dim);
  font-family: inherit;
  font-size: 1rem;
  width: 28px;
  height: 28px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.icon-btn:hover {
  color: var(--fg);
  border-color: var(--fg);
  box-shadow: 0 0 8px var(--glow);
}

.layout {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.main-pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.modal {
  border: 1px solid var(--fg);
  background: var(--bg);
  box-shadow: 0 0 30px var(--glow);
  max-width: 560px;
  width: 100%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border);
  color: var(--accent);
  font-size: 0.85rem;
  letter-spacing: 0.1em;
}

.modal-header button {
  background: transparent;
  border: none;
  color: var(--dim);
  font-family: inherit;
  font-size: 1.4rem;
  cursor: pointer;
  line-height: 1;
}

.modal-header button:hover {
  color: var(--fg);
}

.modal-body {
  padding: 0.75rem 1rem;
  overflow-y: auto;
  font-size: 0.82rem;
}

.doc-row {
  display: flex;
  gap: 1rem;
  padding: 0.35rem 0;
  border-bottom: 1px dashed rgba(255, 255, 255, 0.05);
}

.doc-row code {
  color: var(--accent);
  min-width: 150px;
}

.doc-row .dim {
  color: var(--dim);
}

@media (max-width: 900px) {
  .layout {
    flex-direction: column;
  }
}
</style>
