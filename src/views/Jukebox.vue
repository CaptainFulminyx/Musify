<script setup>
import { useThemeStore } from "@/stores/theme";
import Terminal from "$/Terminal.vue";

const themeStore = useThemeStore();
</script>
<template>
  <header class="topbar">
    <div class="window-title"></div>
    <div class="theme-switch">
      <button class="theme-btn" @click="themeStore.cycle()">
        ${{ themeStore.theme.slice(0, 1) }}
      </button>
    </div>
  </header>
  <section>
    <Terminal />
    <div class="tools"></div>
  </section>

  <section>
    <div class="sidebar"></div>
  </section>
</template>
