<script setup></script>
<template>
  <div class="section">
    <img src="../assets/hero.svg" />
    <p class="header">Musify</p>
  </div>
</template>

<style scoped>
.section {
  width: 100vw;
  height: 100vw;
  background: #000;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

.section img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.header {
  position: absolute;
  color: #0f0;
  font-size: 40px;
  background: #000;
  padding: 15px;
  top: 63%;
  left: 63%;
  transform: translate(-50%, -50%);
  z-index: 10;
}
</style>
