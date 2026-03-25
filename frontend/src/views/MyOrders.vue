<template>
  <div class="my-orders-page">
    <el-card class="orders-card">
      <template #header>
        <div class="card-header">
          <div class="logo-section">
            <el-icon size="50" color="#fff"><Van /></el-icon>
            <h1 class="logo-title">物流可视化系统</h1>
          </div>
          <h2>我的订单</h2>
        </div>
      </template>

      <div class="search-section">
        <el-form :inline="true" :model="searchForm">
          <el-form-item label="订单号">
            <el-input v-model="searchForm.order_no" placeholder="请输入订单号" clearable @clear="handleSearch" />
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="searchForm.status" placeholder="请选择状态" clearable @change="handleSearch">
              <el-option label="全部" value="" />
              <el-option label="待处理" value="pending" />
              <el-option label="运输中" value="shipping" />
              <el-option label="已送达" value="delivered" />
              <el-option label="已签收" value="signed" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">搜索</el-button>
          </el-form-item>
        </el-form>
      </div>

      <el-divider />

      <div class="orders-list" v-loading="loading">
        <el-empty v-if="orders.length === 0" description="暂无订单" />

        <el-card v-for="order in orders" :key="order.id" class="order-item" shadow="hover">
          <div class="order-header">
            <div class="order-no">
              <span class="label">订单号：</span>
              <span class="value">{{ order.order_no }}</span>
            </div>
            <el-tag :type="getStatusType(order.status)">{{ getStatusText(order.status) }}</el-tag>
          </div>

          <el-descriptions :column="2" border>
            <el-descriptions-item label="客户名称">{{ order.customer_name }}</el-descriptions-item>
            <el-descriptions-item label="货物类型">{{ order.goods_type }}</el-descriptions-item>
            <el-descriptions-item label="重量">{{ order.weight }} 公斤</el-descriptions-item>
            <el-descriptions-item label="体积">{{ order.volume }} 立方米</el-descriptions-item>
            <el-descriptions-item label="金额">
              <span class="amount">¥{{ order.amount }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ formatDate(order.create_time) }}</el-descriptions-item>
          </el-descriptions>

          <el-divider />

          <div class="order-address">
            <div class="address-item">
              <el-icon color="#409EFF"><Location /></el-icon>
              <span class="label">发货地址：</span>
              <span class="value">{{ order.sender_address }}</span>
            </div>
            <div class="address-item">
              <el-icon color="#67C23A"><Location /></el-icon>
              <span class="label">收货地址：</span>
              <span class="value">{{ order.receiver_address }}</span>
            </div>
          </div>

          <div class="order-actions">
            <el-button type="primary" size="small" @click="viewDetail(order)">查看详情</el-button>
          </div>
        </el-card>
      </div>

      <div class="pagination-section" v-if="total > 0">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>

      <div class="back-section">
        <el-button @click="goBack">返回首页</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Van, Location } from '@element-plus/icons-vue'
import axios from 'axios'

const router = useRouter()
const loading = ref(false)
const orders = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

const searchForm = reactive({
  order_no: '',
  status: ''
})

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

  customerInfo.value = JSON.parse(customer)
  loadOrders()
})

const loadOrders = async () => {
  loading.value = true
  try {
    const response = await axios.get('http://localhost:5001/api/orders', {
      params: {
        page: currentPage.value,
        size: pageSize.value,
        order_no: searchForm.order_no || undefined,
        status: searchForm.status || undefined,
        customer_id: customerInfo.value.id
      }
    })

    if (response.data.code === 200) {
      orders.value = response.data.data.list || []
      total.value = response.data.data.total || 0
    } else {
      ElMessage.error(response.data.msg || '获取订单列表失败')
    }
  } catch (err) {
    console.error('获取订单列表失败：', err)
    ElMessage.error('网络错误，请检查后端服务')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  loadOrders()
}

const handleSizeChange = (val) => {
  pageSize.value = val
  loadOrders()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  loadOrders()
}

const getStatusType = (status) => {
  const typeMap = {
    'pending': 'warning',
    'shipping': 'primary',
    'delivered': 'success',
    'signed': 'info'
  }
  return typeMap[status] || 'info'
}

const getStatusText = (status) => {
  const textMap = {
    'pending': '待处理',
    'shipping': '运输中',
    'delivered': '已送达',
    'signed': '已签收'
  }
  return textMap[status] || status
}

const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

const viewDetail = (order) => {
  router.push(`/order-detail/${order.id}`)
}

const goBack = () => {
  router.push('/customer-home')
}
</script>

<style scoped>
.my-orders-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.orders-card {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
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

.search-section {
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  margin-bottom: 20px;
}

.orders-list {
  margin-top: 20px;
}

.order-item {
  margin-bottom: 20px;
  transition: all 0.3s;
}

.order-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: rgba(102, 126, 234, 0.05);
  border-radius: 8px;
  margin-bottom: 15px;
}

.order-no {
  display: flex;
  align-items: center;
  gap: 10px;
}

.order-no .label {
  color: #909399;
  font-size: 14px;
}

.order-no .value {
  color: #303133;
  font-weight: 600;
  font-size: 16px;
}

.order-address {
  padding: 15px;
  background: rgba(102, 126, 234, 0.05);
  border-radius: 8px;
}

.address-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.address-item:last-child {
  margin-bottom: 0;
}

.address-item .label {
  color: #909399;
  font-size: 14px;
}

.address-item .value {
  color: #303133;
  font-weight: 500;
  font-size: 15px;
}

.amount {
  color: #E6A23C;
  font-weight: 700;
  font-size: 18px;
}

.order-actions {
  padding: 15px;
  text-align: right;
}

.pagination-section {
  padding: 20px;
  text-align: center;
}

.back-section {
  padding: 20px;
  text-align: center;
}
</style>
