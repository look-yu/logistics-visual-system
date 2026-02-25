// ===================== 新增1：导入axios并封装请求（独立模块，不影响路由） =====================
import axios from 'axios'

// 1. 创建axios实例，适配项目基础配置（和其他代码统一请求基准地址）
const request = axios.create({
  baseURL: 'http://localhost:5000/api', // 对应你之前报错的5000端口后端接口
  timeout: 10000, // 请求超时时间
  headers: {
    'Content-Type': 'application/json;charset=UTF-8' // 通用请求头
  }
})

// 2. 请求拦截器（处理token、请求头、加载状态等，适配项目全局逻辑）
request.interceptors.request.use(
  (config) => {
    // 示例：如果项目有登录态，添加token（根据你的项目实际情况调整）
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    // 请求错误的通用处理
    console.error('请求发送失败：', error)
    return Promise.reject(error)
  }
)

// 3. 响应拦截器（统一处理后端返回格式、错误码，适配你之前的「兜底数据」逻辑）
request.interceptors.response.use(
  (response) => {
    // 假设后端返回格式：{ code: 200, data: {}, msg: '成功' }
    const res = response.data
    // 成功状态（根据你的后端实际码值调整）
    if (res.code === 200 || res.code === 0) {
      return res.data // 直接返回核心数据，简化组件层调用
    } else {
      // 业务错误提示（适配项目的全局提示组件，比如Element Plus的ElMessage）
      if (window.ElMessage) {
        window.ElMessage.error(res.msg || '请求失败')
      }
      return Promise.reject(res)
    }
  },
  (error) => {
    // 网络错误/连接拒绝处理（对应你之前的ERR_CONNECTION_REFUSED）
    const errMsg = error.message || '服务器连接失败'
    if (window.ElMessage) {
      window.ElMessage.error(errMsg)
    }
    // 抛出错误，方便组件层捕获并使用兜底数据
    return Promise.reject(error)
  }
)

// 4. 仓储相关接口封装（适配仓储看板的所有数据请求）
export const warehouseApi = {
  // 获取管理层仓储数据
  getManagerWarehouseData: () => request.get('/get_role_data?role=manager'),
  // 获取调度员仓储数据
  getDispatcherWarehouseData: () => request.get('/get_role_data?role=dispatcher'),
  // 获取实时库存数据
  getRealTimeStock: () => request.get('/warehouse/stock'),
  // 获取库存设备状态
  getEquipmentStatus: () => request.get('/warehouse/equipment'),
  // 获取库龄分布数据
  getStockAgeDistribution: () => request.get('/warehouse/stock_age'),
  // 获取区域库存占比
  getAreaStockRatio: () => request.get('/warehouse/area_ratio'),
  // 获取设备预警信息
  getEquipmentWarning: () => request.get('/warehouse/equipment_warning'),
  // 获取年度库存走势
  getYearStockTrend: () => request.get('/warehouse/year_stock_trend')
}

// 5. 调度相关接口封装（适配调度业务逻辑）
export const dispatchApi = {
  // 角色切换接口（对应你之前的角色切换请求）
  changeRole: (role) => request.post('/change_role', { role }),
  // 获取调度任务列表
  getDispatchTasks: (params) => request.get('/dispatch/tasks', { params }),
  // 提交调度任务
  submitDispatchTask: (data) => request.post('/dispatch/submit', data),
  // 获取调度员待处理任务
  getPendingTasks: (userId) => request.get(`/dispatch/pending/${userId}`),
  // 确认调度任务完成
  confirmTaskComplete: (taskId) => request.put(`/dispatch/complete/${taskId}`)
}

// 6. 导出通用请求实例（方便其他自定义接口复用拦截器配置）
export { request }

// ===================== 原有路由逻辑（仅补充运力调度面板+角色权限，不修改原有） =====================
import { createRouter, createWebHistory } from 'vue-router'
import DispatcherView from '../views/DispatcherView.vue'
import WarehouseView from '../views/WarehouseView.vue'
import ManagerView from '../views/ManagerView.vue'
// 新增2：导入运力调度面板组件（确保路径和你实际文件一致）
import CapacityDispatch from '../views/CapacityDispatch.vue'

const routes = [
  { path: '/', redirect: '/manager' },
  // 调度人员视图 - 补充角色权限meta（不修改原有逻辑，仅加roles）
  { 
    path: '/dispatcher', 
    name: 'Dispatcher', 
    component: DispatcherView, 
    meta: { 
      title: '调度人员视图',
      roles: ['dispatcher'] // 仅调度人员可访问
    } 
  },
  // 仓储管理员视图 - 补充角色权限meta（不修改原有逻辑，仅加roles）
  { 
    path: '/warehouse', 
    name: 'Warehouse', 
    component: WarehouseView, 
    meta: { 
      title: '仓储管理员视图',
      roles: ['warehouse'] // 仅仓储管理员可访问
    } 
  },
  // 管理层视图 - 补充角色权限meta（不修改原有逻辑，仅加roles）
  { 
    path: '/manager', 
    name: 'Manager', 
    component: ManagerView, 
    meta: { 
      title: '管理层视图',
      roles: ['manager'] // 仅管理层可访问
    } 
  },
  // 新增3：运力调度面板路由（独立页面，不影响原有路由）
  { 
    path: '/capacity-dispatch', 
    name: 'CapacityDispatch', 
    component: CapacityDispatch, 
    meta: { 
      title: '运力调度面板',
      roles: ['dispatcher', 'manager'] // 调度人员+管理层可访问，仓储管理员不可
    } 
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// 新增4：角色权限路由守卫（核心：控制不同角色访问对应页面，不冲突原有守卫）
router.beforeEach((to, from, next) => {
  // 1. 原有标题设置逻辑（完全保留，不修改）
  if (to.meta && to.meta.title) {
    document.title = `${to.meta.title} - 物流管理数据可视化系统`
  } else {
    document.title = '物流管理数据可视化系统'
  }

  // 2. 新增角色权限校验逻辑（兼容无roles的路由，不影响原有页面访问）
  const hasRoles = to.meta && to.meta.roles && to.meta.roles.length > 0
  if (!hasRoles) {
    // 无角色限制的路由，直接放行
    next()
    return
  }

  // 获取当前登录角色（从localStorage读取，适配你的角色切换逻辑）
  const currentRole = localStorage.getItem('currentRole') || 'manager' // 默认管理层
  if (to.meta.roles.includes(currentRole)) {
    // 角色匹配，放行
    next()
  } else {
    // 角色不匹配，跳转到对应角色的默认页面
    if (currentRole === 'dispatcher') {
      next('/dispatcher')
    } else if (currentRole === 'warehouse') {
      next('/warehouse')
    } else {
      next('/manager')
    }
    // 提示无权限（可选，根据需要开启）
    if (window.ElMessage) {
      window.ElMessage.warning(`无权限访问【${to.meta.title}】，已跳转到您的角色专属页面`)
    }
  }
})

export default router