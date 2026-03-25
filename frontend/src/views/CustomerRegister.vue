<template>
  <div class="register-page">
    <el-card class="register-card">
      <template #header>
        <div class="card-header">
          <div class="logo-section">
            <el-icon size="50" color="#fff"><Van /></el-icon>
            <h1 class="logo-title">物流可视化系统</h1>
          </div>
          <h2>客户注册</h2>
        </div>
      </template>

      <el-form :model="registerForm" :rules="registerRules" ref="registerFormRef" label-width="120px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="registerForm.username" placeholder="请输入用户名" />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input v-model="registerForm.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>

        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="registerForm.confirmPassword" type="password" placeholder="请再次输入密码" show-password />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleRegister" :loading="loading" style="width: 100%">注册</el-button>
        </el-form-item>

        <el-form-item>
          <div class="login-link">
            已有账号？<el-link type="primary" @click="goToLogin">立即登录</el-link>
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
import { Van } from '@element-plus/icons-vue'
import axios from 'axios'

const router = useRouter()
const registerFormRef = ref(null)
const loading = ref(false)

const registerForm = reactive({
  username: '',
  password: '',
  confirmPassword: ''
})

const validateConfirmPassword = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== registerForm.password) {
    callback(new Error('两次输入密码不一致'))
  } else {
    callback()
  }
}

const registerRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于 6 个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

const handleRegister = async () => {
  if (!registerFormRef.value) return

  await registerFormRef.value.validate(async (valid) => {
    if (!valid) return

    loading.value = true
    try {
      const response = await axios.post('http://localhost:5001/api/auth/register', {
                username: registerForm.username,
                password: registerForm.password
              })

      if (response.data.code === 200) {
        ElMessage.success('注册成功！请登录')
        router.push('/login')
      } else {
        ElMessage.error(response.data.msg || '注册失败')
      }
    } catch (err) {
      console.error('注册错误：', err)
      if (err.response) {
        ElMessage.error(err.response.data.msg || '注册失败')
      } else {
        ElMessage.error('网络错误，请检查后端服务')
      }
    }
    loading.value = false
  })
}

const goToLogin = () => {
  router.push('/login')
}
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 0;
  margin: 0;
}

.register-card {
  width: 100%;
  min-height: 100vh;
  border-radius: 0;
  box-shadow: none;
  border: none;
}

.card-header {
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

.card-header h2 {
  margin: 0;
  color: #fff;
  font-weight: 600;
  font-size: 28px;
}

.login-link {
  text-align: center;
  width: 100%;
  font-size: 16px;
  color: #fff;
  padding-bottom: 40px;
}

.login-link .el-link {
  margin-left: 5px;
}
</style>
