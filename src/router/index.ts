import { createRouter, createWebHistory } from 'vue-router'
import { useSesion } from '@/composables/useSesion'
import { registrarExpiracionSesion } from '@/services/http'
import CatalogoView from '@/views/CatalogoView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(_to, _from, posicionGuardada) {
    return posicionGuardada ?? { top: 0 }
  },
  routes: [
    { path: '/', name: 'catalogo', component: CatalogoView },
    {
      path: '/producto/:id',
      name: 'producto',
      component: () => import('@/views/ProductoView.vue'),
    },
    {
      path: '/admin/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { zona: 'admin' },
    },
    {
      path: '/admin',
      component: () => import('@/views/admin/PanelView.vue'),
      meta: { zona: 'admin', requiereAdmin: true },
      children: [
        { path: '', redirect: { name: 'admin-productos' } },
        {
          path: 'productos',
          name: 'admin-productos',
          component: () => import('@/views/admin/AdminProductosView.vue'),
        },
        {
          path: 'categorias',
          name: 'admin-categorias',
          component: () => import('@/views/admin/AdminCategoriasView.vue'),
        },
      ],
    },

    { path: '/:pathMatch(.*)*', name: 'no-encontrado', component: () => import('@/views/NoEncontradoView.vue') },
  ],
})

router.beforeEach(async (to) => {
  if (to.name === 'login') {
    const activa = await useSesion().verificar()
    return activa ? { name: 'admin-productos' } : true
  }
  if (!to.meta.requiereAdmin) return true
  const activa = await useSesion().verificar()
  return activa ? true : { name: 'login', query: { volver: to.fullPath } }
})

registrarExpiracionSesion(() => {
  useSesion().expirar()
  const actual = router.currentRoute.value
  if (actual.meta.requiereAdmin) router.replace({ name: 'login', query: { volver: actual.fullPath, expirada: '1' } })
})

export default router
