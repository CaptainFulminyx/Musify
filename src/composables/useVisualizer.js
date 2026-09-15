import { watch } from "vue";

export function useVisualizer(vizCanvasRef, isPlayingRef, getAnalyserFn) {
  let vizRaf = null;

  function startVisualizer() {
    if (!vizCanvasRef.value || !getAnalyserFn()) return;

    const canvas = vizCanvasRef.value;
    const ctx = canvas.getContext("2d");
    const analyser = getAnalyserFn();
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

      const fg = getComputedStyle(vizCanvasRef.value).color;

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

  // Auto-start/stop based on playing state
  watch(isPlayingRef, (playing) => {
    if (playing) {
      startVisualizer();
    } else {
      stopVisualizer();
    }
  });

  return {
    startVisualizer,
    stopVisualizer,
  };
}