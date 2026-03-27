import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import ManagerView from '../views/ManagerView.vue'
import DispatcherView from '../views/DispatcherView.vue'
import OrderManage from '../views/OrderManage.vue'
import CustomerManage from '../views/CustomerManage.vue'
import ServiceRequestManage from '../views/ServiceRequestManage.vue'
import ShipmentPlanManage from '../views/ShipmentPlanManage.vue'
import CustomerView from '../views/CustomerView.vue'
import InboundOutboundManage from '../views/InboundOutboundManage.vue'
import WarehouseManage from '../views/WarehouseManage.vue'
import CustomerRegister from '../views/CustomerRegister.vue'
import CustomerLogin from '../views/CustomerLogin.vue'
import CustomerOrder from '../views/CustomerOrder.vue'
import CustomerHome from '../views/CustomerHome.vue'
import MyOrders from '../views/MyOrders.vue'
import Profile from '../views/Profile.vue'
import OrderDetail from '../views/OrderDetail.vue'
import RouteQuery from '../views/RouteQuery.vue'

const routes = [
  { path: '/login', name: 'Login', component: Login, meta: { title: '用户登录', hideMenu: true } },
  { path: '/customer-register', name: 'CustomerRegister', component: CustomerRegister, meta: { title: '客户注册', hideMenu: true } },
  { path: '/customer-home', name: 'CustomerHome', component: CustomerHome, meta: { title: '客户首页', hideMenu: true } },
  { path: '/customer-order', name: 'CustomerOrder', component: CustomerOrder, meta: { title: '客户下单', hideMenu: true } },
  { path: '/my-orders', name: 'MyOrders', component: MyOrders, meta: { title: '我的订单', hideMenu: true } },
  { path: '/profile', name: 'Profile', component: Profile, meta: { title: '个人中心', hideMenu: true } },
  { path: '/order-detail/:id', name: 'OrderDetail', component: OrderDetail, meta: { title: '订单详情', hideMenu: true } },
  { 
    path: '/', 
    redirect: '/manager',
    children: [
      { path: 'manager', name: 'Manager', component: ManagerView, meta: { title: '管理决策中心' } },
      { path: 'dispatcher', name: 'Dispatcher', component: DispatcherView, meta: { title: '运输调度监控' } },
      { path: 'orders', name: 'Orders', component: OrderManage, meta: { title: '订单全流程管理' } },
      { path: 'route-query', name: 'RouteQuery', component: RouteQuery, meta: { title: '运输路线查询' } },
      { path: 'customers', name: 'Customers', component: CustomerManage, meta: { title: '客户管理' } },
      { path: 'service-requests', name: 'ServiceRequests', component: ServiceRequestManage, meta: { title: '服务请求管理' } },
      { path: 'shipment-plans', name: 'ShipmentPlans', component: ShipmentPlanManage, meta: { title: '装运计划管理' } },
      { path: 'customer', name: 'Customer', component: CustomerView, meta: { title: '客户中心' } },
      { path: 'inbound-outbound', name: 'InboundOutbound', component: InboundOutboundManage, meta: { title: '出入库管理' } },
      { path: 'warehouse', name: 'Warehouse', component: WarehouseManage, meta: { title: '仓储管理' } }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  const userStr = localStorage.getItem('user')
  const user = userStr ? JSON.parse(userStr) : null
  const customerStr = localStorage.getItem('customer')
  const customer = customerStr ? JSON.parse(customerStr) : null
  
  const customerRoutes = ['CustomerRegister', 'CustomerHome', 'CustomerOrder', 'MyOrders', 'Profile', 'OrderDetail']
  
  if (customerRoutes.includes(to.name)) {
    if (to.name === 'CustomerHome' && !customer) {
      next({ name: 'Login' })
    } else if ((to.name === 'MyOrders' || to.name === 'Profile' || to.name === 'OrderDetail') && !customer) {
      next({ name: 'Login' })
    } else {
      next()
    }
  } else if (to.name !== 'Login' && !token) {
    next({ name: 'Login' })
  } else if (to.name !== 'Login' && token && user) {
    // 客户角色只能访问客户专属页面
    if (user.role === 'customer') {
      if (to.path === '/customer') {
        next()
      } else {
        next({ name: 'Customer' })
      }
    } else {
      // 管理员角色可以访问所有页面
      if (to.meta && to.meta.title) {
        document.title = `${to.meta.title} - 物流可视化系统`
      }
      next()
    }
  } else if (to.name === 'Login' && token && user) {
    // 已登录用户访问登录页，根据角色跳转
    if (user.role === 'customer') {
      next({ name: 'Customer' })
    } else {
      next({ name: 'Manager' })
    }
  } else {
    if (to.meta && to.meta.title) {
      document.title = `${to.meta.title} - 物流可视化系统`
    }
    next()
  }
})

export default router
