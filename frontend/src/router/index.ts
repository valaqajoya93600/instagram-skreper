import { createRouter, createWebHistory } from 'vue-router'
import TaskManager from '@/components/TaskManager.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: TaskManager,
    },
    {
      path: '/tasks',
      name: 'tasks',
      component: TaskManager,
    },
    {
      path: '/scrape',
      name: 'scrape',
      component: () => import('@/components/ScrapeManager.vue'),
    },
  ],
})

export default router