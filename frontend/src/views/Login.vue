<template>
  <div class="login-container">
    <el-card class="login-card">
      <template #header>
        <div class="login-header">
          <el-icon size="40" color="#409eff"><Van /></el-icon>
          <h2>物流管理可视化系统</h2>
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
  const res = await store.login(loginForm.username, loginForm.password, loginForm.role)
  loading.value = false

  if (res.success) {
    ElMessage.success('登录成功')
    router.push('/')
  } else {
    ElMessage.error(res.msg || '登录失败')
  }
}
</script>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
}
.login-card {
  width: 400px;
  border-radius: 12px;
}
.login-header {
  text-align: center;
}
.login-header h2 {
  margin-top: 15px;
  color: #303133;
}
.login-btn {
  width: 100%;
  height: 45px;
  font-size: 16px;
  margin-top: 10px;
}
.login-footer {
  margin-top: 20px;
  text-align: center;
  font-size: 12px;
  color: #909399;
}
</style>
