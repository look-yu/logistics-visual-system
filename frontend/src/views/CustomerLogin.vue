<template>
  <div class="login-page">
    <el-card class="login-card">
      <template #header>
        <div class="card-header">
          <h2>客户登录</h2>
        </div>
      </template>

      <el-form :model="loginForm" :rules="loginRules" ref="loginFormRef" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="loginForm.username" placeholder="请输入用户名" />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleLogin" :loading="loading" style="width: 100%">登录</el-button>
        </el-form-item>

        <el-form-item>
          <div class="register-link">
            还没有账号？<el-link type="primary" @click="goToRegister">立即注册</el-link>
          </div>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const router = useRouter()
const loginFormRef = ref(null)
const loading = ref(false)

const loginForm = reactive({
  username: '',
  password: ''
})

const loginRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  if (!loginFormRef.value) return

  try {
    await loginFormRef.value.validate()

    loading.value = true
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
  } finally {
    loading.value = false
  }
}

const goToRegister = () => {
  router.push('/customer-register')
}
</script>

<style scoped>
.login-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-card {
  width: 100%;
  max-width: 400px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.card-header {
  text-align: center;
}

.card-header h2 {
  margin: 0;
  color: #409EFF;
  font-weight: 600;
}

.register-link {
  text-align: center;
  width: 100%;
  font-size: 14px;
  color: #606266;
}

.register-link .el-link {
  margin-left: 5px;
}
</style>
