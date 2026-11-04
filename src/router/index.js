import { createRouter, createWebHistory } from 'vue-router'
import LandingPage from '#/LandingPage.vue'
import Jukebox from '#/Jukebox.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/lan',
      name: 'x',
     component: LandingPage,
    },
    {
      path: '/',
      name: 'home',
     component: Jukebox,
    },
    
  ],
})

export default router
