import { ref, computed, watchEffect } from "vue";
import { defineStore } from "pinia";

export const THEMES = ["phosphor", "amber", "iceberg"];
const STORAGE_KEY = "bashtune:theme";

export const useThemeStore = defineStore("theme", () => {
  /* ---------- state ---------- */
  const theme = ref(localStorage.getItem(STORAGE_KEY) || "phosphor");

  /* ---------- getters ---------- */
  const themes = computed(() => THEMES);
  const themeClass = computed(() => `theme-${theme.value}`);
  const isActive = (t) => theme.value === t; 
  const isActiveRef = (t) => computed(() => theme.value === t);

  /* ---------- actions ---------- */
  function setTheme(t) {
    if (!THEMES.includes(t)) return;
    theme.value = t;
  }

  function cycle() {
    const i = THEMES.indexOf(theme.value);
    setTheme(THEMES[(i + 1) % THEMES.length]);
  }

  /* ---------- persistence + global DOM sync ---------- */
  // 1. Persist choice
  watchEffect(() => {
    localStorage.setItem(STORAGE_KEY, theme.value);
  });

  // 2. Reflect the theme on <html> so it applies to the whole app (portals, modals, body bg, etc.)
  watchEffect(() => {
    const root = document.documentElement;
    THEMES.forEach((t) => root.classList.remove(`theme-${t}`));
    root.classList.add(`theme-${theme.value}`);
  });

  // 3. Global command palette-ish "> theme X" helper
  const themeCommand = computed(() => `> theme ${theme.value}`);

  return {
    theme,
    themes,
    themeClass,
    isActive,
    isActiveRef,
    themeCommand,
    setTheme,
    cycle,
  };
});