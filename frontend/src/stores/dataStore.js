import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

// 后端 API 基础路径
const API_BASE = 'http://localhost:5001/api'

export const useDataStore = defineStore('dataStore', () => {
  // 1. 认证状态
  const user = ref(JSON.parse(localStorage.getItem('user')) || null)
  const token = ref(localStorage.getItem('token') || '')
  const currentRole = ref(user.value?.role || 'manager')

  // 2. 核心业务数据 (响应式)
  const dashboardData = ref(null)
  const inventoryData = ref([])
  const orderList = ref([])
  const vehicleList = ref([])

  // 3. 计算属性
  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  // 4. 认证动作
  const login = async (username, password, role) => {
    try {
      const res = await axios.post(`${API_BASE}/login`, { username, password, role })
      if (res.data.code === 200) {
        user.value = res.data.data.user
        token.value = res.data.data.token
        currentRole.value = user.value.role
        localStorage.setItem('user', JSON.stringify(user.value))
        localStorage.setItem('token', token.value)
        return { success: true }
      }
      return { success: false, msg: res.data.msg }
    } catch (err) {
      return { success: false, msg: '网络错误，请稍后再试' }
    }
  }

  const logout = () => {
    user.value = null
    token.value = ''
    localStorage.removeItem('user')
    localStorage.removeItem('token')
  }

  // 5. 业务动作 (API 联动)
  const fetchDashboard = async () => {
    const res = await axios.get(`${API_BASE}/reports/dashboard`)
    if (res.data.code === 200) dashboardData.value = res.data.data
  }

  const fetchInventory = async () => {
    const res = await axios.get(`${API_BASE}/inventory`)
    if (res.data.code === 200) inventoryData.value = res.data.data
  }

  const fetchOrders = async (params) => {
    const res = await axios.get(`${API_BASE}/orders`, { params })
    if (res.data.code === 200) orderList.value = res.data.data.list
  }

  const changeRole = (role) => {
    currentRole.value = role
  }

  return { 
    user, token, currentRole, isLoggedIn, isAdmin,
    dashboardData, inventoryData, orderList, vehicleList,
    login, logout, fetchDashboard, fetchInventory, fetchOrders, changeRole 
  }
})
