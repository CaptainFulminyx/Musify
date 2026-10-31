<template></template>
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
