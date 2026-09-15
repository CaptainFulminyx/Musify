<template>
  <div class="jukebox" :class="`theme-${theme}`">
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
                currentTrack?.artist ||
                "drop a file or type `add` to load music"
              }}
            </div>

            <!-- ASCII Progress -->
            <div class="progress-wrap">
              <div class="progress-bar" @click="seekFromClick" ref="progressEl">
                <span class="progress-fill"
                  >[{{ barFilled }}{{ barDot }}{{ barEmpty }}]</span
                >
              </div>
              <div class="progress-times">
                <span>{{ fmtTime(currentTime) }}</span>
                <span class="dim">/</span>
                <span>{{ fmtTime(duration) }}</span>
                <span class="volume">vol {{ volume }}%</span>
              </div>
            </div>

            <div class="controls">
              <button @click="prev" title="Previous">⏮</button>
              <button
                @click="togglePlay"
                class="play-btn"
                :title="isPlaying ? 'Pause' : 'Play'"
              >
                {{ isPlaying ? "❚❚" : "▶" }}
              </button>
              <button @click="next" title="Next">⏭</button>
              <button @click="shuffleQueue" title="Shuffle">⇄</button>
              <button
                @click="loopMode = !loopMode"
                :class="{ active: loopMode }"
                title="Loop"
              >
                ↻
              </button>
            </div>
          </div>
        </section>

        <!-- Visualizer -->
        <section class="visualizer-wrap">
          <canvas ref="vizCanvas" class="visualizer"></canvas>
        </section>

        <!-- Terminal Output -->
        <section class="terminal" ref="terminalEl">
          <div
            v-for="(line, i) in outputLines"
            :key="i"
            class="term-line"
            :class="line.type"
          >
            <span v-if="line.type === 'input'" class="prompt">$</span>
            <span v-else-if="line.type === 'err'" class="prompt err">!</span>
            <span v-else-if="line.type === 'ok'" class="prompt ok">✓</span>
            <span v-else class="prompt dim">&gt;</span>
            <span class="term-text" v-html="line.text"></span>
          </div>
        </section>

        <!-- Input -->
        <section class="input-bar">
          <span class="prompt">$</span>
          <input
            ref="inputEl"
            v-model="commandInput"
            type="text"
            spellcheck="false"
            autocomplete="off"
            placeholder="type a command… (try `help`)"
            @keydown="onInputKeydown"
          />
        </section>
      </main>

      <!-- SIDE: Queue + Library -->
      <aside class="side-pane">
        <div class="pane-header">
          <span>QUEUE</span>
          <span class="dim">{{ queue.length }}</span>
        </div>
        <ul class="queue-list">
          <li
            v-for="(track, idx) in queue"
            :key="track.id"
            :class="{ active: currentTrack && track.id === currentTrack.id }"
            @click="playFromQueue(idx)"
          >
            <span class="q-idx">{{ String(idx + 1).padStart(2, "0") }}</span>
            <span class="q-name" :title="track.name">{{ track.name }}</span>
            <span class="q-artist">{{ track.artist }}</span>
            <span class="q-dur">{{ fmtTime(track.duration) }}</span>
          </li>
          <li v-if="!queue.length" class="empty">queue is empty</li>
        </ul>

        <div class="pane-header library-header">
          <span>LIBRARY</span>
          <span class="dim">{{ library.length }}</span>
          <button class="mini-btn" @click="pickFiles" title="Add files">
            + add
          </button>
        </div>
        <ul class="queue-list library-list">
          <li
            v-for="track in library"
            :key="'lib-' + track.id"
            @click="playTrack(track)"
            :class="{ active: currentTrack && track.id === currentTrack.id }"
          >
            <span class="q-name" :title="track.name">
              <span v-if="track.source === 'builtin'" class="badge">♪</span>
              {{ track.name }}
            </span>
            <span class="q-artist">{{ track.artist }}</span>
          </li>
          <li v-if="!library.length" class="empty">library is empty</li>
        </ul>

        <div class="side-footer">
          <button
            class="mini-btn danger"
            @click="clearLibrary"
            v-if="library.some((t) => t.source === 'user')"
          >
            clear user files
          </button>
        </div>
      </aside>
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
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from "vue";
import { Howl, Howler } from "howler";
import { get, set, del } from "idb-keyval";

/* ================================================================
   STATE
================================================================ */
const themes = ["green_phosphor", "amber_crt", "ibm_blue"];
const theme = ref(localStorage.getItem("ts_theme") || "green_phosphor");
const volume = ref(Number(localStorage.getItem("ts_volume")) || 70);
const loopMode = ref(false);

const currentTrack = ref(null);
const queue = ref([]);
const library = ref([]);
const isPlaying = ref(false);
const currentTime = ref(0);
const duration = ref(0);
const commandInput = ref("");
const outputLines = ref([]);
const history = ref([]);
const historyIdx = ref(-1);
const showHelp = ref(false);

const inputEl = ref(null);
const fileInputEl = ref(null);
const terminalEl = ref(null);
const vizCanvas = ref(null);
const progressEl = ref(null);

let sound = null;
let progressRaf = null;
let audioCtx = null;
let analyser = null;
let sourceNode = null;
let vizRaf = null;

/* ================================================================
   BUILT-IN LOFI TRACKS
   Put your 3-4 lofi files in /public/lofi/ and list them here.
================================================================ */
const BUILTIN_TRACKS = [
  {
    id: "builtin-1",
    name: "midnight_drive",
    artist: "lofi_sessions",
    file: "/lofi/midnight-drive.mp3",
    source: "builtin",
  },
  {
    id: "builtin-2",
    name: "rainy_window",
    artist: "lofi_sessions",
    file: "/lofi/rainy-window.mp3",
    source: "builtin",
  },
  {
    id: "builtin-3",
    name: "coffee_shop",
    artist: "lofi_sessions",
    file: "/lofi/coffee-shop.mp3",
    source: "builtin",
  },
  {
    id: "builtin-4",
    name: "late_night_study",
    artist: "lofi_sessions",
    file: "/lofi/late-night-study.mp3",
    source: "builtin",
  },
];

/* ================================================================
   PERSISTENCE
================================================================ */
watch(theme, (v) => localStorage.setItem("ts_theme", v));
watch(volume, (v) => {
  localStorage.setItem("ts_volume", v);
  if (sound) sound.volume(v / 100);
});

/* ================================================================
   TERMINAL LOG
================================================================ */
function log(text, type = "out") {
  outputLines.value.push({ text, type });
  if (outputLines.value.length > 300) outputLines.value.shift();
  nextTick(() => {
    if (terminalEl.value)
      terminalEl.value.scrollTop = terminalEl.value.scrollHeight;
  });
}

/* ================================================================
   FORMATTING
================================================================ */
const fmtTime = (s) => {
  if (!s || !isFinite(s)) return "00:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};

const BAR_WIDTH = 40;
const barFilled = computed(() => {
  if (!duration.value) return "─".repeat(BAR_WIDTH);
  const ratio = currentTime.value / duration.value;
  return "=".repeat(Math.max(0, Math.round(ratio * BAR_WIDTH) - 1));
});
const barDot = computed(() => (duration.value ? ">" : ""));
const barEmpty = computed(() => {
  if (!duration.value) return "";
  const filled = barFilled.value.length + (barDot.value ? 1 : 0);
  return " ".repeat(Math.max(0, BAR_WIDTH - filled));
});

/* ================================================================
   AUDIO ENGINE
================================================================ */
function initAudioContext() {
  if (audioCtx) return;
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  } catch (e) {
    log("web audio API not available — visualizer disabled", "err");
  }
}

function attachAnalyser() {
  if (!audioCtx || !sound) return;
  try {
    // Howler exposes its master gain node
    const masterGain = Howler.masterGain;
    if (!masterGain) return;
    if (!analyser) {
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.8;
      masterGain.connect(analyser);
      // Optionally connect to destination if not already
    }
  } catch (e) {
    // Silent — visualizer just won't render
  }
}

function loadTrack(track, autoplay = true) {
  if (!track) return;
  if (sound) {
    sound.unload();
    sound = null;
  }

  currentTrack.value = track;
  isPlaying.value = false;
  currentTime.value = 0;
  duration.value = track.duration || 0;

  const src =
    track.source === "user" ? URL.createObjectURL(track.blob) : track.file;

  sound = new Howl({
    src: [src],
    html5: true, // use Web Audio for analyser access
    volume: volume.value / 100,
    onload: () => {
      duration.value = sound.duration();
      if (track.source === "user") track.duration = duration.value;
    },
    onplay: () => {
      isPlaying.value = true;
      initAudioContext();
      if (audioCtx?.state === "suspended") audioCtx.resume();
      attachAnalyser();
      startProgressLoop();
      startVisualizer();
    },
    onpause: () => {
      isPlaying.value = false;
      stopProgressLoop();
    },
    onstop: () => {
      isPlaying.value = false;
      stopProgressLoop();
    },
    onend: () => {
      isPlaying.value = false;
      stopProgressLoop();
      handleTrackEnd();
    },
  });

  if (autoplay) sound.play();
}

function togglePlay() {
  if (!sound) {
    if (currentTrack.value) loadTrack(currentTrack.value);
    return;
  }
  if (sound.playing()) sound.pause();
  else sound.play();
}

function playTrack(track) {
  loadTrack(track);
  // ensure it's in queue
  if (!queue.value.find((t) => t.id === track.id)) queue.value.push(track);
}

function playFromQueue(idx) {
  const t = queue.value[idx];
  if (!t) return;
  loadTrack(t);
}

function next() {
  const t = getNextTrack();
  if (t) loadTrack(t);
}

function prev() {
  if (queue.value.length < 2) return;
  const i = queue.value.findIndex((t) => t.id === currentTrack.value?.id);
  const prevIdx = (i - 1 + queue.value.length) % queue.value.length;
  loadTrack(queue.value[prevIdx]);
}

function getNextTrack() {
  if (!queue.value.length) return null;
  if (!currentTrack.value) return queue.value[0];
  const i = queue.value.findIndex((t) => t.id === currentTrack.value.id);
  if (loopMode.value && i === queue.value.length - 1) return queue.value[0];
  return queue.value[(i + 1) % queue.value.length] || null;
}

function handleTrackEnd() {
  const t = getNextTrack();
  if (t) loadTrack(t);
}

/* ================================================================
   PROGRESS + VISUALIZER LOOPS
================================================================ */
function startProgressLoop() {
  stopProgressLoop();
  const tick = () => {
    if (sound && sound.playing()) {
      currentTime.value = sound.seek() || 0;
      progressRaf = requestAnimationFrame(tick);
    }
  };
  tick();
}
function stopProgressLoop() {
  if (progressRaf) cancelAnimationFrame(progressRaf);
  progressRaf = null;
}

function startVisualizer() {
  if (!vizCanvas.value || !analyser) return;
  const canvas = vizCanvas.value;
  const ctx = canvas.getContext("2d");
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  const resize = () => {
    canvas.width = canvas.clientWidth * window.devicePixelRatio;
    canvas.height = canvas.clientHeight * window.devicePixelRatio;
  };
  resize();
  window.addEventListener("resize", resize);

  const draw = () => {
    vizRaf = requestAnimationFrame(draw);
    analyser.getByteFrequencyData(dataArray);
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const css = getComputedStyle(document.documentElement);
    const fg = getComputedStyle(vizCanvas.value).color;

    const barWidth = w / bufferLength;
    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 255;
      const barHeight = v * h;
      ctx.fillStyle = fg;
      ctx.globalAlpha = 0.35 + v * 0.65;
      ctx.fillRect(i * barWidth, h - barHeight, barWidth - 2, barHeight);
    }
    ctx.globalAlpha = 1;
  };
  draw();
}

function stopVisualizer() {
  if (vizRaf) cancelAnimationFrame(vizRaf);
  vizRaf = null;
}

/* ================================================================
   FILE PICKING
================================================================ */
function pickFiles() {
  fileInputEl.value?.click();
}

async function onFilesSelected(e) {
  const files = Array.from(e.target.files || []);
  if (!files.length) return;
  const added = [];
  for (const file of files) {
    const id = `user-${file.name}-${file.size}-${file.lastModified}`;
    if (library.value.find((t) => t.id === id)) continue;
    const track = {
      id,
      name: file.name.replace(/\.[^.]+$/, ""),
      artist: "local file",
      blob: file,
      source: "user",
      duration: 0,
    };
    library.value.push(track);
    queue.value.push(track);
    added.push(track);
    try {
      await set(id, file);
    } catch (err) {
      /* quota */
    }
  }
  await set(
    "ts_library_meta",
    library.value
      .filter((t) => t.source === "user")
      .map(({ id, name, artist }) => ({ id, name, artist })),
  );
  log(
    `loaded ${added.length} file${added.length === 1 ? "" : "s"} into library`,
    "ok",
  );
  e.target.value = "";
  if (!currentTrack.value && added.length) loadTrack(added[0]);
}

async function restoreLibrary() {
  try {
    const meta = await get("ts_library_meta");
    if (!meta || !meta.length) return;
    for (const m of meta) {
      const file = await get(m.id);
      if (file) {
        library.value.push({
          id: m.id,
          name: m.name,
          artist: m.artist,
          blob: file,
          source: "user",
          duration: 0,
        });
      }
    }
    if (library.value.length)
      log(
        `restored ${library.value.length} saved file(s) from your last session`,
        "ok",
      );
  } catch (e) {
    /* ignore */
  }
}

async function clearLibrary() {
  const userTracks = library.value.filter((t) => t.source === "user");
  for (const t of userTracks) await del(t.id);
  await del("ts_library_meta");
  library.value = library.value.filter((t) => t.source !== "user");
  queue.value = queue.value.filter((t) => t.source !== "user");
  log("cleared all user files from library", "ok");
}

/* ================================================================
   SEEK
================================================================ */
function seekFromClick(e) {
  if (!sound || !duration.value) return;
  const rect = progressEl.value.getBoundingClientRect();
  const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
  sound.seek(ratio * duration.value);
  currentTime.value = ratio * duration.value;
}

/* ================================================================
   THEME
================================================================ */
function cycleTheme() {
  const i = themes.indexOf(theme.value);
  theme.value = themes[(i + 1) % themes.length];
  log(`theme set to ${theme.value}`, "ok");
}

/* ================================================================
   COMMAND PARSER
================================================================ */
const commandDocs = [
  { cmd: "help", desc: "show this reference" },
  { cmd: "add", desc: "open file picker" },
  { cmd: "play", desc: "resume current track" },
  { cmd: "pause", desc: "pause playback" },
  { cmd: "stop", desc: "stop and reset" },
  { cmd: "next / prev", desc: "navigate queue" },
  { cmd: "seek <mm:ss>", desc: "jump to a time" },
  { cmd: "volume <0-100>", desc: "set master volume" },
  { cmd: "search <query>", desc: "filter library by name/artist" },
  { cmd: "play <index|name>", desc: "play from library" },
  { cmd: "queue", desc: "list queue" },
  { cmd: "library / ls", desc: "list library" },
  { cmd: "shuffle", desc: "shuffle the queue" },
  { cmd: "loop", desc: "toggle loop mode" },
  { cmd: "theme [name]", desc: "cycle or set theme" },
  { cmd: "clear", desc: "clear terminal output" },
  { cmd: "about", desc: "about this project" },
];

function onInputKeydown(e) {
  if (e.key === "Enter") {
    const raw = commandInput.value.trim();
    if (!raw) return;
    log(raw, "input");
    history.value.push(raw);
    historyIdx.value = history.value.length;
    runCommand(raw);
    commandInput.value = "";
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    if (!history.value.length) return;
    historyIdx.value = Math.max(0, historyIdx.value - 1);
    commandInput.value = history.value[historyIdx.value] || "";
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    if (!history.value.length) return;
    historyIdx.value = Math.min(history.value.length, historyIdx.value + 1);
    commandInput.value = history.value[historyIdx.value] || "";
  } else if (e.key === "Tab") {
    e.preventDefault();
    autocomplete();
  }
}

function autocomplete() {
  const partial = commandInput.value.trim().toLowerCase();
  if (!partial) return;
  const matches = commandDocs
    .map((c) => c.cmd.split(" ")[0])
    .filter((c) => c.startsWith(partial));
  if (matches.length === 1) commandInput.value = matches[0] + " ";
  else if (matches.length > 1)
    log("did you mean: " + matches.join(", "), "out");
}

function runCommand(raw) {
  const [cmd, ...args] = raw.split(/\s+/);
  const arg = args.join(" ");
  switch (cmd.toLowerCase()) {
    case "help":
      showHelp.value = true;
      log("opening command reference…", "ok");
      break;
    case "add":
      pickFiles();
      break;
    case "play":
      if (arg) playByNameOrIndex(arg);
      else togglePlay();
      break;
    case "pause":
      if (sound?.playing()) sound.pause();
      break;
    case "stop":
      if (sound) {
        sound.stop();
        currentTime.value = 0;
      }
      break;
    case "next":
      next();
      break;
    case "prev":
      prev();
      break;
    case "seek": {
      const secs = parseTime(arg);
      if (secs != null && sound) {
        sound.seek(secs);
        currentTime.value = secs;
        log(`seeked to ${fmtTime(secs)}`, "ok");
      } else log("usage: seek <mm:ss>", "err");
      break;
    }
    case "volume":
    case "vol": {
      const v = Number(arg);
      if (isNaN(v) || v < 0 || v > 100) log("usage: volume <0-100>", "err");
      else {
        volume.value = v;
        log(`volume set to ${v}%`, "ok");
      }
      break;
    }
    case "search":
    case "find": {
      if (!arg) {
        log("usage: search <query>", "err");
        break;
      }
      const q = arg.toLowerCase();
      const results = library.value.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.artist.toLowerCase().includes(q),
      );
      if (!results.length) log(`no matches for "${arg}"`, "err");
      else {
        log(
          `found ${results.length} track${results.length === 1 ? "" : "s"}:`,
          "ok",
        );
        results
          .slice(0, 20)
          .forEach((t, i) => log(`  [${i}] ${t.name} — ${t.artist}`));
      }
      break;
    }
    case "queue": {
      if (!queue.value.length) log("queue is empty", "out");
      else
        queue.value.forEach((t, i) =>
          log(`  [${i}] ${t.name} — ${t.artist} (${fmtTime(t.duration)})`),
        );
      break;
    }
    case "library":
    case "ls": {
      if (!library.value.length) log("library is empty", "out");
      else
        library.value.forEach((t, i) =>
          log(`  [${i}] ${t.name} — ${t.artist}`),
        );
      break;
    }
    case "shuffle":
      shuffleQueue();
      break;
    case "loop":
      loopMode.value = !loopMode.value;
      log(`loop ${loopMode.value ? "on" : "off"}`, "ok");
      break;
    case "theme": {
      if (arg && themes.includes(arg)) {
        theme.value = arg;
        log(`theme set to ${arg}`, "ok");
      } else if (!arg) cycleTheme();
      else log(`unknown theme "${arg}". options: ${themes.join(", ")}`, "err");
      break;
    }
    case "clear":
      outputLines.value = [];
      break;
    case "about":
      log("tunestream — a terminal-themed local music player.", "ok");
      log("built with vue 3, vite, howler.js, and the web audio api.");
      log("your files never leave your device.");
      break;
    default:
      log(`command not found: ${cmd}. type \`help\` for a list.`, "err");
  }
}

function parseTime(str) {
  if (!str) return null;
  if (/^\d+(\.\d+)?$/.test(str)) return Number(str);
  const m = str.match(/^(\d+):(\d{1,2})$/);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

function playByNameOrIndex(arg) {
  const n = Number(arg);
  if (!isNaN(n) && library.value[n]) return playTrack(library.value[n]);
  const q = arg.toLowerCase();
  const track = library.value.find((t) => t.name.toLowerCase().includes(q));
  if (track) playTrack(track);
  else log(`no track matches "${arg}"`, "err");
}

function shuffleQueue() {
  for (let i = queue.value.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [queue.value[i], queue.value[j]] = [queue.value[j], queue.value[i]];
  }
  log("queue shuffled", "ok");
}

/* ================================================================
   LIFECYCLE
================================================================ */
function onGlobalKeydown(e) {
  const tag = document.activeElement?.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA") return;
  if (e.code === "Space") {
    e.preventDefault();
    togglePlay();
  } else if (e.key === "ArrowRight" && sound) {
    sound.seek(Math.min(duration.value, currentTime.value + 5));
  } else if (e.key === "ArrowLeft" && sound) {
    sound.seek(Math.max(0, currentTime.value - 5));
  } else if (e.key.toLowerCase() === "m") {
    volume.value = volume.value === 0 ? 70 : 0;
  }
}

onMounted(async () => {
  // load built-ins
  library.value.push(...BUILTIN_TRACKS);
  queue.value.push(...BUILTIN_TRACKS);

  await restoreLibrary();
  const savedTheme = theme.value;
  theme.value = savedTheme;

  log("tunestream v1.0 — type `help` to see commands", "ok");
  log("tip: press `add` or the + button to load music from your device");

  window.addEventListener("keydown", onGlobalKeydown);
  inputEl.value?.focus();
});

onUnmounted(() => {
  window.removeEventListener("keydown", onGlobalKeydown);
  if (sound) sound.unload();
  stopProgressLoop();
  stopVisualizer();
  if (audioCtx) audioCtx.close();
});
</script>

<style scoped>
/* ================================================================
   THEME VARS
================================================================ */
.jukebox {
  --bg: #0a0f0a;
  --fg: #33ff66;
  --dim: #1f8f3f;
  --accent: #7dffa5;
  --glow: rgba(51, 255, 102, 0.35);
  --border: #1f8f3f;
  --panel: rgba(0, 0, 0, 0.25);
  height: 100vh;
  background: var(--bg);
  color: var(--fg);
  font-family:
    "JetBrains Mono", "Fira Code", ui-monospace, Menlo, Consolas, monospace;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  transition:
    background 0.3s,
    color 0.3s;
  font-size: 14px;
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
    transparent 0px,
    transparent 2px,
    rgba(0, 0, 0, 0.16) 3px,
    rgba(0, 0, 0, 0.16) 4px
  );
  mix-blend-mode: multiply;
}
.flicker {
  background: rgba(255, 255, 255, 0.012);
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
    transparent 40%,
    rgba(0, 0, 0, 0.55) 100%
  );
}

/* ================================================================
   TOP BAR
================================================================ */
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
  gap: 0.35rem;
}
.dot {
  width: 11px;
  height: 11px;
  border-radius: 50%;
  display: inline-block;
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
  font-size: 0.8rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.topbar-right {
  display: flex;
  gap: 0.3rem;
}
.icon-btn {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--dim);
  width: 26px;
  height: 26px;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.icon-btn:hover {
  color: var(--fg);
  border-color: var(--fg);
  box-shadow: 0 0 10px var(--glow);
}

/* ================================================================
   LAYOUT
================================================================ */
.layout {
  flex: 1;
  display: flex;
  overflow: hidden;
}
.main-pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 1rem;
  gap: 1rem;
  overflow: hidden;
}
.side-pane {
  width: 320px;
  flex-shrink: 0;
  border-left: 1px solid var(--border);
  background: rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ================================================================
   NOW PLAYING
================================================================ */
.now-playing {
  display: flex;
  gap: 1.25rem;
  align-items: center;
  padding: 1rem;
  border: 1px solid var(--border);
  background: var(--panel);
  flex-shrink: 0;
}
.np-art {
  width: 90px;
  height: 90px;
  flex-shrink: 0;
  border: 1px solid var(--border);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.06),
    transparent 70%
  );
  box-shadow: 0 0 20px var(--glow) inset;
  transition: transform 0.3s;
}
.np-art.spinning {
  animation: spin 8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.art-inner {
  font-size: 2rem;
  color: var(--accent);
  text-shadow: 0 0 12px var(--glow);
}
.np-info {
  flex: 1;
  min-width: 0;
}
.np-label {
  font-size: 0.7rem;
  color: var(--dim);
  letter-spacing: 0.15em;
  margin-bottom: 0.25rem;
}
.np-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--fg);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.np-artist {
  color: var(--dim);
  font-size: 0.85rem;
  margin-bottom: 0.75rem;
}

.progress-wrap {
  margin-bottom: 0.75rem;
}
.progress-bar {
  cursor: pointer;
  user-select: none;
  font-size: 0.95rem;
  letter-spacing: 0.02em;
  color: var(--accent);
  white-space: pre;
  overflow: hidden;
}
.progress-fill {
  display: inline-block;
}
.progress-times {
  display: flex;
  gap: 0.75rem;
  font-size: 0.75rem;
  color: var(--dim);
  margin-top: 0.25rem;
}
.progress-times .volume {
  margin-left: auto;
}

.controls {
  display: flex;
  gap: 0.4rem;
  align-items: center;
}
.controls button {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--fg);
  width: 36px;
  height: 36px;
  cursor: pointer;
  font-family: inherit;
  font-size: 1rem;
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

/* ================================================================
   VISUALIZER
================================================================ */
.visualizer-wrap {
  height: 90px;
  border: 1px solid var(--border);
  background: rgba(0, 0, 0, 0.3);
  flex-shrink: 0;
  overflow: hidden;
}
.visualizer {
  width: 100%;
  height: 100%;
  color: var(--fg);
}

/* ================================================================
   TERMINAL
================================================================ */
.terminal {
  flex: 1;
  overflow-y: auto;
  padding: 0.75rem 1rem;
  border: 1px solid var(--border);
  background: rgba(0, 0, 0, 0.35);
  font-size: 0.85rem;
  line-height: 1.6;
  min-height: 0;
}
.terminal::-webkit-scrollbar {
  width: 6px;
}
.terminal::-webkit-scrollbar-track {
  background: transparent;
}
.terminal::-webkit-scrollbar-thumb {
  background: var(--border);
}
.term-line {
  white-space: pre-wrap;
  word-break: break-word;
}
.term-line .prompt {
  color: var(--accent);
  margin-right: 0.4rem;
}
.term-line .prompt.err {
  color: #ff6b6b;
}
.term-line .prompt.ok {
  color: var(--accent);
}
.term-line .prompt.dim {
  color: var(--dim);
}
.term-line.err .term-text {
  color: #ff6b6b;
}
.term-line.input .term-text {
  color: var(--fg);
}

/* ================================================================
   INPUT
================================================================ */
.input-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: 1px solid var(--border);
  background: rgba(0, 0, 0, 0.5);
  padding: 0.55rem 0.75rem;
  flex-shrink: 0;
}
.input-bar input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--fg);
  font-family: inherit;
  font-size: 0.9rem;
  caret-color: var(--accent);
}
.input-bar input::placeholder {
  color: var(--dim);
  opacity: 0.6;
}
.input-bar .prompt {
  color: var(--accent);
  font-size: 0.95rem;
}

/* ================================================================
   SIDE PANE
================================================================ */
.pane-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.6rem 0.75rem;
  background: rgba(0, 0, 0, 0.4);
  border-bottom: 1px solid var(--border);
  font-size: 0.75rem;
  letter-spacing: 0.15em;
  color: var(--accent);
  flex-shrink: 0;
}
.library-header {
  border-top: 1px solid var(--border);
}
.mini-btn {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--dim);
  font-family: inherit;
  font-size: 0.65rem;
  padding: 0.15rem 0.45rem;
  cursor: pointer;
}
.mini-btn:hover {
  color: var(--fg);
  border-color: var(--fg);
}
.mini-btn.danger:hover {
  color: #ff6b6b;
  border-color: #ff6b6b;
}

.queue-list {
  list-style: none;
  margin: 0;
  padding: 0;
  overflow-y: auto;
}
.queue-list.library-list {
  flex: 1;
}
.queue-list li {
  display: grid;
  grid-template-columns: 28px 1fr 32px;
  gap: 0.5rem;
  padding: 0.45rem 0.75rem;
  border-bottom: 1px dashed rgba(255, 255, 255, 0.05);
  cursor: pointer;
  font-size: 0.8rem;
  transition: background 0.15s;
  align-items: center;
}
.library-list li {
  grid-template-columns: 1fr auto;
}
.queue-list li:hover {
  background: rgba(255, 255, 255, 0.04);
}
.queue-list li.active {
  background: rgba(255, 255, 255, 0.08);
  box-shadow: inset 3px 0 0 var(--accent);
}
.queue-list li.empty {
  grid-template-columns: 1fr;
  color: var(--dim);
  font-style: italic;
  cursor: default;
  padding: 1rem 0.75rem;
}
.q-idx {
  color: var(--dim);
  font-size: 0.7rem;
}
.q-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--fg);
}
.q-artist {
  color: var(--dim);
  font-size: 0.72rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.q-dur {
  color: var(--dim);
  font-size: 0.72rem;
  text-align: right;
}
.badge {
  color: var(--accent);
  margin-right: 0.25rem;
}

.side-footer {
  border-top: 1px solid var(--border);
  padding: 0.5rem 0.75rem;
  flex-shrink: 0;
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

/* ================================================================
   RESPONSIVE
================================================================ */
@media (max-width: 900px) {
  .layout {
    flex-direction: column;
  }
  .side-pane {
    width: 100%;
    max-height: 200px;
    border-left: none;
    border-top: 1px solid var(--border);
  }
  .visualizer-wrap {
    height: 60px;
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
