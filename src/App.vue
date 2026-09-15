<script setup>
import { RouterLink, RouterView } from "vue-router";
//import LandingPage from "vue-router";
</script>

<template>
  <!--  <nav>
    <RouterLink to="/">Home</RouterLink>
  </nav>-->
  <div class="scanlines" aria-hidden="true"></div>

  <div class="vignette" aria-hidden="true"></div>
  <RouterView />
</template>
