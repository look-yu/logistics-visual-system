<template>
  <div class="login-container">
    <el-card class="login-card">
      <template #header>
        <div class="login-header">
          <div class="logo-section">
            <el-icon size="50" color="#fff"><Van /></el-icon>
            <h1 class="logo-title">物流可视化系统</h1>
          </div>
          <h2>用户登录</h2>
        </div>
      </template>
      <el-form :model="loginForm" label-position="top">
        <el-form-item label="角色选择">
          <el-radio-group v-model="loginForm.role" size="large" style="width: 100%">
            <el-radio-button value="admin">管理员</el-radio-button>
            <el-radio-button value="customer">客户</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="用户名">
          <el-input v-model="loginForm.username" placeholder="请输入用户名" prefix-icon="User" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" prefix-icon="Lock" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" class="login-btn" @click="handleLogin" :loading="loading">登录</el-button>
        </el-form-item>
      </el-form>
      <div class="login-footer">
        <p v-if="loginForm.role === 'admin'">管理员账号：admin/manager/dispatcher</p>
        <p v-if="loginForm.role === 'admin'">初始密码：123456</p>
        <p v-if="loginForm.role === 'customer'">客户账号：customer1/customer2</p>
        <p v-if="loginForm.role === 'customer'">初始密码：123456</p>
        <el-divider />
        <div v-if="loginForm.role === 'customer'" class="register-link">
          还没有账号？<el-link type="primary" @click="goToRegister">立即注册</el-link>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useDataStore } from '../stores/dataStore'
import { ElMessage } from 'element-plus'
import { User, Lock, Van } from '@element-plus/icons-vue'
import axios from 'axios'

const router = useRouter()
const store = useDataStore()
const loading = ref(false)

const loginForm = reactive({
  role: 'admin',
  username: '',
  password: ''
})

const handleLogin = async () => {
  if (!loginForm.username || !loginForm.password) {
    ElMessage.warning('请输入完整信息')
    return
  }

  loading.value = true
  
  if (loginForm.role === 'customer') {
    try {
      const response = await axios.post('http://localhost:5001/api/auth/login', {
        username: loginForm.username,
        password: loginForm.password
      })

      if (response.data.code === 200) {
        ElMessage.success('登录成功')
        localStorage.setItem('customer', JSON.stringify(response.data.data))
        router.push('/customer-home')
      } else {
        ElMessage.error(response.data.msg || '登录失败')
      }
    } catch (err) {
      console.error('登录错误：', err)
      if (err.response) {
        ElMessage.error(err.response.data.msg || '登录失败')
      } else {
        ElMessage.error('网络错误，请检查后端服务')
      }
    }
  } else {
    const res = await store.login(loginForm.username, loginForm.password, loginForm.role)
    if (res.success) {
      ElMessage.success('登录成功')
      router.push('/')
    } else {
      ElMessage.error(res.msg || '登录失败')
    }
  }
  
  loading.value = false
}

const goToRegister = () => {
  router.push('/customer-register')
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  padding: 20px;
}

.login-card {
  width: 100%;
  max-width: 500px;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.login-header {
  text-align: center;
  padding: 40px 20px 20px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 0;
}

.logo-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  margin-bottom: 20px;
}

.logo-title {
  margin: 0;
  color: #fff;
  font-weight: 700;
  font-size: 36px;
  letter-spacing: 2px;
}

.login-header h2 {
  margin-top: 15px;
  color: #fff;
  font-weight: 600;
  font-size: 28px;
}

.login-btn {
  width: 100%;
  height: 50px;
  font-size: 18px;
  margin-top: 20px;
  padding: 0 40px;
}

.login-footer {
  margin-top: 30px;
  text-align: center;
  font-size: 14px;
  color: #fff;
  padding-bottom: 40px;
}

.register-link {
  margin-top: 20px;
  text-align: center;
  font-size: 16px;
  color: #fff;
}

.register-link .el-link {
  margin-left: 5px;
}
</style>
