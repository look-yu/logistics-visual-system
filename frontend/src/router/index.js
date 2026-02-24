import { createRouter, createWebHistory } from 'vue-router'
import DispatcherView from '../views/DispatcherView.vue'
import WarehouseView from '../views/WarehouseView.vue'
import ManagerView from '../views/ManagerView.vue'

const routes = [
  { path: '/', redirect: '/manager' },
  { path: '/dispatcher', name: 'Dispatcher', component: DispatcherView, meta: { title: '调度人员视图' } },
  { path: '/warehouse', name: 'Warehouse', component: WarehouseView, meta: { title: '仓储管理员视图' } },
  { path: '/manager', name: 'Manager', component: ManagerView, meta: { title: '管理层视图' } }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// 路由守卫（纯前端）
router.beforeEach((to, from, next) => {
  if (to.meta && to.meta.title) {
    document.title = `${to.meta.title} - 物流管理数据可视化系统`
  } else {
    document.title = '物流管理数据可视化系统'
  }
  next()
})

export default router