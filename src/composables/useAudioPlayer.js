import { ref, watch } from "vue";
import { Howl, Howler } from "howler";

export function useAudioPlayer() {
  let sound = null;
  let progressRaf = null;
  let audioCtx = null;
  let analyser = null;
  let vizRaf = null;

  const currentTrack = ref(null);
  const isPlaying = ref(false);
  const currentTime = ref(0);
  const duration = ref(0);
  const volume = ref(Number(localStorage.getItem("ts_volume")) || 70);

  // Persist volume
  watch(volume, (v) => {
    localStorage.setItem("ts_volume", v);
    if (sound) sound.volume(v / 100);
  });

  function initAudioContext() {
    if (audioCtx) return;
    
    audioCtx = Howler.ctx;
  }

  function attachAnalyser() {
    if (!audioCtx || !sound) return;
    try {
      const masterGain = Howler.masterGain;
      if (!masterGain) return;
      if (!analyser) {
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 128;
        analyser.smoothingTimeConstant = 0.8;
        masterGain.connect(analyser);
        analyser.connect(audioCtx.destination);

        
      }
    } catch (e) {
      // Silent — visualizer just won't render
    }
  }

  function loadTrack(track, autoplay = true, onLoaded, onEnded) {
    if (!track) return;
    if (sound) {
      sound.unload();
      sound = null;
    }

    currentTrack.value = track;
    isPlaying.value = false;
    currentTime.value = 0;
    duration.value = track.duration || 0;

    // 🐛 FIX: Use html5: true for Blob URLs (user files)
    // Built-in tracks are URLs, user tracks are Blobs → Object URLs
    const src =
      track.source === "user" ? URL.createObjectURL(track.blob) : track.file;
    const useHtml5 = track.source === "user"; // Blob URLs work better with HTML5

    sound = new Howl({
      src: [src],
      html5: useHtml5, // ✅ FIX: Allow HTML5 fallback for user files
      volume: volume.value / 100,
      onload: () => {
        duration.value = sound.duration();
        if (track.source === "user") track.duration = duration.value;
        onLoaded?.(duration.value);
      },
      onplay: () => {
        initAudioContext();
        if (audioCtx?.state === "suspended") audioCtx.resume();
        attachAnalyser();
        isPlaying.value = true;
        startProgressLoop();
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
        onEnded?.();
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

  function seek(secs) {
    if (!sound) return;
    sound.seek(secs);
    currentTime.value = secs;
  }

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

  function stopVisualizer() {
    if (vizRaf) cancelAnimationFrame(vizRaf);
    vizRaf = null;
  }

  function getAnalyser() {
    return analyser;
    if (sound) sound.unload();
    stopProgressLoop();
    stopVisualizer();
    if (audioCtx) audioCtx.close();
  }


function cleanup() {
  if (sound) sound.unload();
  stopProgressLoop();
  stopVisualizer();
  if (audioCtx) audioCtx.close();
}

  return {
    // State
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,

    // Audio methods
    loadTrack,
    togglePlay,
    seek,
    startProgressLoop,
    stopProgressLoop,
    stopVisualizer,
    getAnalyser,

    // Lifecycle
    cleanup,

    // Internals (for visualizer setup)
    audioCtx: () => audioCtx,
  };
}
