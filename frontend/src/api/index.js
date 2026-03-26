// ===================== 新增1：导入axios并封装请求（独立模块，不影响路由） =====================
import axios from 'axios'

// 1. 创建axios实例，适配项目基础配置（和其他代码统一请求基准地址）
const request = axios.create({
  baseURL: '/api', // 使用代理路径
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
    console.log('响应拦截器 - 原始响应:', response)
    console.log('响应拦截器 - 响应数据:', response.data)
    console.log('响应拦截器 - 响应状态:', response.status)
    
    // 假设后端返回格式：{ code: 200, data: {}, msg: '成功' }
    const res = response.data
    
    // 检查响应数据结构
    if (!res || typeof res !== 'object') {
      console.error('响应拦截器 - 数据结构异常:', res)
      if (window.ElMessage) {
        window.ElMessage.error('服务器返回数据格式错误')
      }
      return Promise.reject(new Error('服务器返回数据格式错误'))
    }
    
    // 成功状态（根据你的后端实际码值调整）
    if (res.code === 200 || res.code === 0) {
      console.log('响应拦截器 - 返回数据:', res.data)
      return res.data // 直接返回核心数据，简化组件层调用
    } else {
      // 业务错误提示（适配项目的全局提示组件，比如Element Plus的ElMessage）
      console.error('响应拦截器 - 业务错误:', res)
      if (window.ElMessage) {
        window.ElMessage.error(res.msg || '请求失败')
      }
      return Promise.reject(new Error(res.msg || '请求失败'))
    }
  },
  (error) => {
    // 网络错误/连接拒绝处理（对应你之前的ERR_CONNECTION_REFUSED）
    console.error('响应拦截器 - 网络错误:', error)
    
    let errMsg = '服务器连接失败'
    if (error?.response) {
      // 服务器响应了，但状态码不在2xx范围内
      console.error('响应拦截器 - 响应错误:', error.response)
      errMsg = `服务器错误: ${error.response.status}`
    } else if (error?.request) {
      // 请求已发出，但没有收到响应
      console.error('响应拦截器 - 请求无响应')
      errMsg = '服务器无响应，请检查网络连接'
    } else {
      // 在设置请求时发生了错误
      console.error('响应拦截器 - 其他错误:', error?.message)
      errMsg = error?.message || '请求失败'
    }
    
    if (window.ElMessage) {
      window.ElMessage.error(errMsg)
    }
    
    // 抛出错误，方便组件层捕获并使用兜底数据
    return Promise.reject(error)
  }
)

// 4. 调度相关接口封装（适配调度业务逻辑）
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