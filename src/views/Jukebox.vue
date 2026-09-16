<template>
  <div class="jukebox">
    <!-- CRT overlays -->
    <div class="scanlines"></div>
    <div class="flicker"></div>
    <div class="vignette"></div>

    <!-- Top bar / window chrome -->
    <header class="topbar">
      <div class="window-controls">
        <span class="dot red"></span>
        <span class="dot yellow"></span>
        <span class="dot green"></span>
      </div>
      <div class="window-title">
        bashtune — {{ currentTrack?.name || "no track" }} —
        {{ isPlaying ? "▶ playing" : "❚❚ paused" }}
      </div>
      <div class="topbar-right">
        <button
          class="icon-btn"
          @click="cycleTheme"
          :title="`theme: ${currentTheme}`"
        >
          ◐
        </button>
        <button class="icon-btn" @click="showHelp" title="help">?</button>
      </div>
    </header>

    <!-- Main layout -->
    <div class="layout">
      <!-- Main pane -->
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
          @prev="playPrev"
          @next="playNext"
          @shuffle="handleShuffle"
          @toggle-loop="toggleLoop"
          @seek="seek"
        />

        <!-- Visualizer -->
        <Visualizer :is-playing="isPlaying" :get-analyser="getAnalyser" />

        <!-- Terminal -->
        <Terminal
          ref="terminalRef"
          :output-lines="outputLines"
          :command-input="commandInput"
          :on-input-keydown="onInputKeydown"
          @update:command-input="commandInput = $event"
          @command="runCommand"
        />
      </main>

      <!-- Sidebar -->
      <Sidebar
        :queue="queue"
        :library="library"
        :current-track="currentTrack"
        :fmt-time="fmtTime"
        @play-from-queue="playFromQueue"
        @play-track="playTrack"
        @add-files="openFilePicker"
        @clear-library="handleClearLibrary"
      />
    </div>

    <!-- Hidden file input -->
    <input
      ref="fileInput"
      type="file"
      accept="audio/*"
      multiple
      style="display: none"
      @change="handleFiles"
    />

    <!-- Help modal -->
    <div
      v-if="showHelpModal"
      class="modal-backdrop"
      @click.self="showHelpModal = false"
    >
      <div class="modal">
        <div class="modal-header">
          <span>COMMAND REFERENCE</span>
          <button @click="showHelpModal = false">×</button>
        </div>
        <div class="modal-body">
          <div v-for="doc in commandDocs" :key="doc.cmd" class="doc-row">
            <code>{{ doc.cmd }}</code>
            <span class="dim">{{ doc.desc }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from "vue";

import NowPlaying from "$/NowPlaying.vue";
import Sidebar from "$/Sidebar.vue";
import Terminal from "$/Terminal.vue";
import Visualizer from "$/Visualizer.vue";

import { useAudioPlayer } from "../composables/useAudioPlayer";
import { useCommands } from "../composables/useCommands";
import { useTrackLibrary } from "../composables/useTrackLibrary";

// ---------------------------------------------------------------------------
// Composables
// ---------------------------------------------------------------------------
const {
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  volume,
  loadTrack,
  togglePlay,
  seek,
  getAnalyser,
  cleanup,
} = useAudioPlayer();

const {
  queue,
  library,
  loopMode,
  initializeLibrary,
  onFilesSelected,
  clearLibrary,
  shuffleQueue,
  getNextTrack,
  findTrackByNameOrIndex,
  searchLibrary,
} = useTrackLibrary();

const {
  outputLines,
  commandInput,
  commandDocs,
  log,
  parseTime,
  fmtTime,
  onInputKeydown,
  clearTerminal,
} = useCommands();

// ---------------------------------------------------------------------------
// Local state
// ---------------------------------------------------------------------------
const terminalRef = ref(null);
const fileInput = ref(null);
const showHelpModal = ref(false);

const THEMES = ["phosphor", "amber", "iceberg"];
const currentTheme = ref("phosphor");

// ---------------------------------------------------------------------------
// Playback helpers
// ---------------------------------------------------------------------------
function playTrack(track) {
  if (!track) return;
  loadTrack(
    track,
    true,
    (dur) => log(`loaded: ${track.name} (${fmtTime(dur)})`, "ok"),
    () => playNext(), // auto-advance on end
  );
}

function playFromQueue(idx) {
  const track = queue.value[idx];
  if (track) playTrack(track);
}

function playNext() {
  const next = getNextTrack(currentTrack.value);
  if (next) playTrack(next);
  else log("end of queue", "dim");
}

function playPrev() {
  if (!queue.value.length) return;
  const i = queue.value.findIndex((t) => t.id === currentTrack.value?.id);
  const prevIdx = i <= 0 ? queue.value.length - 1 : i - 1;
  playTrack(queue.value[prevIdx]);
}

function handleShuffle() {
  shuffleQueue();
  log("queue shuffled", "ok");
}

function toggleLoop() {
  loopMode.value = !loopMode.value;
  log(`loop ${loopMode.value ? "enabled" : "disabled"}`, "ok");
}

// ---------------------------------------------------------------------------
// File handling
// ---------------------------------------------------------------------------
function openFilePicker() {
  fileInput.value?.click();
}

async function handleFiles(e) {
  const files = Array.from(e.target.files || []);
  if (!files.length) return;

  const added = await onFilesSelected(files);
  if (added.length) {
    log(`added ${added.length} track(s) to library`, "ok");
    // Auto-play the first added track
    playTrack(added[0]);
  } else {
    log("no new tracks added (duplicates?)", "err");
  }
  e.target.value = "";
}

async function handleClearLibrary() {
  await clearLibrary();
  log("user library cleared", "ok");
}

// ---------------------------------------------------------------------------
// Theme handling
// ---------------------------------------------------------------------------
function applyTheme(name) {
  document.documentElement.classList.remove(...THEMES.map((t) => `theme-${t}`));
  document.documentElement.classList.add(`theme-${name}`);
  currentTheme.value = name;
}

function cycleTheme(arg) {
  if (arg && THEMES.includes(arg)) {
    applyTheme(arg);
    return arg;
  }
  const i = THEMES.indexOf(currentTheme.value);
  const next = THEMES[(i + 1) % THEMES.length];
  applyTheme(next);
  return next;
}

// ---------------------------------------------------------------------------
// Command execution
// ---------------------------------------------------------------------------
function runCommand(raw) {
  const [cmd, ...rest] = raw.trim().split(/\s+/);
  const arg = rest.join(" ");
  const cmdLower = cmd.toLowerCase();

  switch (cmdLower) {
    case "help":
      showHelpModal.value = true;
      log("showing command reference", "ok");
      break;

    case "add":
      openFilePicker();
      log("opening file picker…", "ok");
      break;

    case "play":
      if (arg) {
        const track = findTrackByNameOrIndex(arg);
        if (track) {
          playTrack(track);
          log(`playing: ${track.name}`, "ok");
        } else {
          log(`no track found: ${arg}`, "err");
        }
      } else {
        togglePlay();
        log(isPlaying.value ? "resumed" : "paused", "ok");
      }
      break;

    case "pause":
      if (isPlaying.value) {
        togglePlay();
        log("paused", "ok");
      } else {
        log("already paused", "dim");
      }
      break;

    case "stop":
      if (currentTrack.value) {
        loadTrack(currentTrack.value, false);
        log("stopped", "ok");
      } else {
        log("nothing playing", "dim");
      }
      break;

    case "next":
      playNext();
      break;

    case "prev":
      playPrev();
      break;

    case "seek": {
      const secs = parseTime(arg);
      if (secs == null) {
        log("usage: seek <mm:ss> or seek <seconds>", "err");
      } else {
        seek(secs);
        log(`seeked to ${fmtTime(secs)}`, "ok");
      }
      break;
    }

    case "volume": {
      const v = Number(arg);
      if (isNaN(v) || v < 0 || v > 100) {
        log("usage: volume <0-100>", "err");
      } else {
        volume.value = v;
        log(`volume set to ${v}%`, "ok");
      }
      break;
    }

    case "search": {
      if (!arg) {
        log("usage: search <query>", "err");
        break;
      }
      const results = searchLibrary(arg);
      if (!results.length) {
        log(`no matches for "${arg}"`, "dim");
      } else {
        log(`found ${results.length} track(s):`, "ok");
        results.forEach((t, i) =>
          log(
            `  ${String(i + 1).padStart(2, "0")}  ${t.name}  —  ${t.artist}`,
            "out",
          ),
        );
      }
      break;
    }

    case "queue":
      if (!queue.value.length) {
        log("queue is empty", "dim");
      } else {
        log(`queue (${queue.value.length} tracks):`, "ok");
        queue.value.forEach((t, i) => {
          const marker = currentTrack.value?.id === t.id ? "▶" : " ";
          log(
            `${marker} ${String(i + 1).padStart(2, "0")}  ${t.name}  —  ${t.artist}  [${fmtTime(t.duration)}]`,
            "out",
          );
        });
      }
      break;

    case "library":
    case "ls":
      if (!library.value.length) {
        log("library is empty", "dim");
      } else {
        log(`library (${library.value.length} tracks):`, "ok");
        library.value.forEach((t, i) => {
          const badge = t.source === "builtin" ? "♪" : " ";
          log(
            `  ${badge} ${String(i + 1).padStart(2, "0")}  ${t.name}  —  ${t.artist}`,
            "out",
          );
        });
      }
      break;

    case "shuffle":
      handleShuffle();
      break;

    case "loop":
      toggleLoop();
      break;

    case "theme": {
      const t = cycleTheme(arg || null);
      log(`theme set to: ${t}`, "ok");
      break;
    }

    case "clear":
      clearTerminal();
      break;

    case "about":
      log("bashtune v1.0 — a terminal-themed music player", "ok");
      log("built with vue 3 + howler.js", "dim");
      log("type `help` for commands, `add` to load your own files", "dim");
      break;

    default:
      log(`command not found: ${cmd}`, "err");
      log("type `help` for a list of commands", "dim");
  }
}

// ---------------------------------------------------------------------------
// Help modal
// ---------------------------------------------------------------------------
function showHelp() {
  showHelpModal.value = true;
}

// ---------------------------------------------------------------------------
// Keyboard shortcuts (global)
// ---------------------------------------------------------------------------
function handleGlobalKeydown(e) {
  // Ignore if user is typing in an input
  if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

  switch (e.key) {
    case " ":
      e.preventDefault();
      togglePlay();
      break;
    case "ArrowRight":
      e.preventDefault();
      seek(Math.min(duration.value, currentTime.value + 5));
      break;
    case "ArrowLeft":
      e.preventDefault();
      seek(Math.max(0, currentTime.value - 5));
      break;
    case "n":
      playNext();
      break;
    case "p":
      playPrev();
      break;
    case "/":
      e.preventDefault();
      terminalRef.value?.focus();
      break;
  }
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------
onMounted(async () => {
  // Restore theme
  const savedTheme = localStorage.getItem("ts_theme");
  applyTheme(
    savedTheme && THEMES.includes(savedTheme) ? savedTheme : "phosphor",
  );

  // Boot the library
  await initializeLibrary();

  // Welcome banner
  log("bashtune v1.0 — terminal music player", "ok");
  log("────────────────────────────────────────", "dim");
  log(`${library.value.length} track(s) loaded in library`, "out");
  log("type `help` for commands · `add` to load files", "dim");
  log("press SPACE to play/pause · / to focus terminal", "dim");
  log("", "out");

  window.addEventListener("keydown", handleGlobalKeydown);

  // Focus terminal on load
  await nextTick();
  terminalRef.value?.focus();
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleGlobalKeydown);
  cleanup();
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

@media (max-width: 900px) {
  .layout {
    flex-direction: column;
  }
}
</style>
