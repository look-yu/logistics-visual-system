<template>
  <div class="customer-home-page">
    <el-card class="welcome-card">
      <template #header>
        <div class="card-header">
          <div class="logo-section">
            <el-icon size="50" color="#fff"><Van /></el-icon>
            <h1 class="logo-title">物流可视化系统</h1>
          </div>
          <h2>欢迎，{{ customerInfo.customer_name }}</h2>
        </div>
      </template>

      <div class="welcome-content">
        <p class="welcome-text">感谢您使用物流可视化系统</p>
        
        <el-divider />

        <div class="menu-grid">
          <el-card class="menu-card" shadow="hover" @click="goToOrder">
            <div class="menu-icon">
              <el-icon :size="40" color="#409EFF"><Box /></el-icon>
            </div>
            <div class="menu-title">我要下单</div>
            <div class="menu-desc">创建新的物流订单</div>
          </el-card>

          <el-card class="menu-card" shadow="hover" @click="goToMyOrders">
            <div class="menu-icon">
              <el-icon :size="40" color="#67C23A"><Document /></el-icon>
            </div>
            <div class="menu-title">我的订单</div>
            <div class="menu-desc">查看订单状态和历史</div>
          </el-card>

          <el-card class="menu-card" shadow="hover" @click="goToProfile">
            <div class="menu-icon">
              <el-icon :size="40" color="#E6A23C"><User /></el-icon>
            </div>
            <div class="menu-title">个人中心</div>
            <div class="menu-desc">管理个人信息</div>
          </el-card>
        </div>

        <el-divider />

        <div class="logout-section">
          <el-button type="danger" @click="handleLogout">退出登录</el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Box, Document, User, Van } from '@element-plus/icons-vue'

const router = useRouter()
const customerInfo = ref({
  id: '',
  customer_code: '',
  username: '',
  customer_name: '',
  contact_person: '',
  contact_phone: '',
  contact_email: '',
  company_address: ''
})

onMounted(() => {
  const customer = localStorage.getItem('customer')
  if (!customer) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }

  const customerData = JSON.parse(customer)
  customerInfo.value = customerData
})

const goToOrder = () => {
  router.push('/customer-order')
}

const goToMyOrders = () => {
  router.push('/my-orders')
}

const goToProfile = () => {
  router.push('/profile')
}

const handleLogout = () => {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    localStorage.removeItem('customer')
    ElMessage.success('已退出登录')
    router.push('/login')
  }).catch(() => {})
}
</script>

<style scoped>
.customer-home-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 0;
  margin: 0;
}

.welcome-card {
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

.welcome-content {
  padding: 40px 60px;
  max-width: 1400px;
  margin: 0 auto;
}

.welcome-text {
  text-align: center;
  font-size: 24px;
  color: #fff;
  margin: 30px 0;
  font-weight: 300;
}

.menu-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
  margin: 50px 0;
}

.menu-card {
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  border-radius: 16px;
  padding: 40px 20px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
}

.menu-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.menu-icon {
  margin: 20px 0;
}

.menu-title {
  font-size: 22px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 10px;
}

.menu-desc {
  font-size: 16px;
  color: #909399;
}

.logout-section {
  text-align: center;
  margin-top: 50px;
  padding-bottom: 40px;
}

.logout-section .el-button {
  padding: 15px 40px;
  font-size: 16px;
}
</style>
