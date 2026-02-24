// 仅保留核心必要代码，无冗余，解决createPinia未定义+初始化顺序问题
import { createApp } from 'vue'
import { createPinia } from 'pinia' // 必引，且位置靠前
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import axios from 'axios' // 确保axios引入（接口请求用）

// 核心组件/路由
import App from './App.vue'
import router from './router'

// 1. 创建Pinia实例（解决createPinia未定义）
const pinia = createPinia()

// 2. 创建App实例 + 挂载核心插件（顺序不能乱）
const app = createApp(App)
app.use(pinia) // 先挂载Pinia
app.use(ElementPlus) // 再挂载ElementPlus
app.use(router) // 最后挂载路由

// 3. 全局注册axios（避免页面中重复引入）
app.config.globalProperties.$axios = axios

// 4. 挂载App（确保页面不空白的核心）
app.mount('#app')