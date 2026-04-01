<template>
  <div class="welcome-container">
    <div class="welcome-card">
      <div class="welcome-content">
        <div class="welcome-icon">
          <el-icon :size="80" color="#409EFF">
            <ElementPlusIconsVue:Promotion />
          </el-icon>
        </div>
        <h1 class="welcome-title">欢迎使用物流可视化管理系统</h1>
        <p class="welcome-subtitle">Logistics Visualization Management System</p>
        <el-button type="primary" size="large" @click="enterSystem" class="enter-btn">
          <el-icon class="mr-2"><ElementPlusIconsVue:Right /></el-icon>
          进入系统
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

const router = useRouter()

const enterSystem = () => {
  router.push({ name: 'Manager' })
}
</script>

<style scoped>
.welcome-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
}

.welcome-card {
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  padding: 60px 80px;
  text-align: center;
  animation: fadeIn 0.6s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.welcome-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.welcome-icon {
  margin-bottom: 30px;
}

.welcome-title {
  font-size: 36px;
  font-weight: bold;
  color: #2c3e50;
  margin: 0 0 15px 0;
}

.welcome-subtitle {
  font-size: 16px;
  color: #7f8c8d;
  margin: 0 0 40px 0;
  letter-spacing: 1px;
}

.enter-btn {
  padding: 15px 50px;
  font-size: 18px;
  border-radius: 30px;
  transition: all 0.3s;
}

.enter-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(64, 158, 255, 0.3);
}

.mr-2 {
  margin-right: 8px;
}
</style>
