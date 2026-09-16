<template>
  <section class="visualizer-wrap">
    <canvas ref="vizCanvas" class="visualizer"></canvas>
  </section>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch} from "vue";

const props = defineProps({
  isPlaying: Boolean,
  getAnalyser: Function,
});

const vizCanvas = ref(null);
let vizRaf = null;

function startVisualizer() {
  if (!vizCanvas.value || !props.getAnalyser?.()) return;

  const canvas = vizCanvas.value;
  const ctx = canvas.getContext("2d");
  const analyser = props.getAnalyser();
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  const resize = () => {
    canvas.width = canvas.clientWidth * window.devicePixelRatio;
    canvas.height = canvas.clientHeight * window.devicePixelRatio;
  };

  resize();
  const resizeListener = () => resize();
  window.addEventListener("resize", resizeListener);

  const draw = () => {
    vizRaf = requestAnimationFrame(draw);

    analyser.getByteFrequencyData(dataArray);
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const fg = getComputedStyle(canvas).color;
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

  return () => {
    window.removeEventListener("resize", resizeListener);
    stopVisualizer();
  };
}

function stopVisualizer() {
  if (vizRaf) cancelAnimationFrame(vizRaf);
  vizRaf = null;
}

onMounted(() => {
  if (props.isPlaying) startVisualizer();
});

onUnmounted(() => {
  stopVisualizer();
});

watch(
  () => props.isPlaying,
  (playing) => {
    if (playing) {
      startVisualizer();
    } else {
      stopVisualizer();
    }
  },
);
</script>

<style scoped>
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

@media (max-width: 900px) {
  .visualizer-wrap {
    height: 60px;
  }
}
</style>
