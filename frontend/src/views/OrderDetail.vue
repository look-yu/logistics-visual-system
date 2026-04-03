<template>
  <div class="order-detail-page">
    <el-card class="detail-card">
      <template #header>
        <div class="card-header">
          <div class="logo-section">
            <el-icon size="50" color="#fff"><Van /></el-icon>
            <h1 class="logo-title">物流可视化系统</h1>
          </div>
          <h2>订单详情</h2>
        </div>
      </template>

      <div v-loading="loading">
        <el-empty v-if="!orderDetail" description="订单不存在" />

        <div v-else>
          <el-descriptions :column="2" border class="order-info">
            <el-descriptions-item label="订单号">{{ orderDetail.order_no }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ formatDate(orderDetail.create_time) }}</el-descriptions-item>
            <el-descriptions-item label="客户名称">{{ orderDetail.customer_name }}</el-descriptions-item>
            <el-descriptions-item label="订单状态">
              <el-tag :type="getStatusType(orderDetail.status)">{{ getStatusText(orderDetail.status) }}</el-tag>
            </el-descriptions-item>
          </el-descriptions>

          <el-divider />

          <div class="section-title">货物信息</div>
          <el-descriptions :column="2" border class="goods-info">
            <el-descriptions-item label="货物类型">{{ orderDetail.goods_type }}</el-descriptions-item>
            <el-descriptions-item label="重量">{{ orderDetail.weight }} 公斤</el-descriptions-item>
            <el-descriptions-item label="体积">{{ orderDetail.volume }} 立方米</el-descriptions-item>
            <el-descriptions-item label="运输金额">
              <span class="amount">¥{{ orderDetail.amount }}</span>
            </el-descriptions-item>
          </el-descriptions>

          <el-divider />

          <div class="section-title">地址信息</div>
          <div class="address-info">
            <div class="address-item">
              <el-icon color="#409EFF" :size="20"><Location /></el-icon>
              <div class="address-content">
                <div class="address-label">发货地址</div>
                <div class="address-value">{{ orderDetail.sender_address }}</div>
              </div>
            </div>
            <div class="address-item">
              <el-icon color="#67C23A" :size="20"><Location /></el-icon>
              <div class="address-content">
                <div class="address-label">收货地址</div>
                <div class="address-value">{{ orderDetail.receiver_address }}</div>
              </div>
            </div>
          </div>

          <el-divider />

          <div class="section-title">物流轨迹</div>
          <el-timeline class="timeline">
            <el-timeline-item
              v-for="(item, index) in timelineData"
              :key="index"
              :timestamp="item.time"
              :type="item.type"
              :color="item.color"
            >
              <div class="timeline-content">
                <div class="timeline-title">{{ item.title }}</div>
                <div class="timeline-desc">{{ item.desc }}</div>
              </div>
            </el-timeline-item>
          </el-timeline>



          <el-divider />

          <div class="actions-section">
            <el-button @click="goBack">返回列表</el-button>
            <el-button
              v-if="orderDetail.status === 'delivered'"
              type="primary"
              @click="showSignDialog"
            >
              确认签收
            </el-button>
          </div>
        </div>
      </div>
    </el-card>



    <el-dialog v-model="signDialogVisible" title="确认签收" width="500px">
      <el-form :model="signForm" label-width="80px">
        <el-form-item label="签收人">
          <el-input v-model="signForm.signer" placeholder="请输入签收人姓名" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="signForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息（可选）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="signDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmSign" :loading="signing">
          确认签收
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Van, Location, Phone } from '@element-plus/icons-vue'
import axios from 'axios'

const router = useRouter()
const route = useRoute()
const loading = ref(false)
const orderDetail = ref(null)
const signDialogVisible = ref(false)
const signing = ref(false)

const signForm = reactive({
  signer: '',
  remark: ''
})

const timelineData = computed(() => {
  if (!orderDetail.value) return []

  const status = orderDetail.value.status
  const createTime = formatDate(orderDetail.value.create_time)

  const items = [
    {
      title: '订单创建',
      desc: '订单已创建，等待处理',
      time: createTime,
      type: 'primary',
      color: '#409EFF'
    }
  ]

  if (status === 'pending') {
    items.push({
      title: '待处理',
      desc: '订单等待分配车辆',
      time: '处理中',
      type: 'warning',
      color: '#E6A23C'
    })
  } else if (status === 'assigned') {
    items.push({
      title: '已分配',
      desc: '订单已分配车辆',
      time: '已分配',
      type: 'success',
      color: '#67C23A'
    })
  } else if (status === 'shipping') {
    items.push({
      title: '已分配',
      desc: '订单已分配车辆',
      time: '已分配',
      type: 'success',
      color: '#67C23A'
    })
    items.push({
      title: '运输中',
      desc: '货物正在运输途中',
      time: '运输中',
      type: 'primary',
      color: '#409EFF'
    })
  } else if (status === 'delivered') {
    items.push({
      title: '已分配',
      desc: '订单已分配车辆',
      time: '已分配',
      type: 'success',
      color: '#67C23A'
    })
    items.push({
      title: '运输中',
      desc: '货物正在运输途中',
      time: '运输中',
      type: 'primary',
      color: '#409EFF'
    })
    items.push({
      title: '已送达',
      desc: '货物已送达目的地',
      time: '已送达',
      type: 'success',
      color: '#67C23A'
    })
  } else if (status === 'signed') {
    items.push({
      title: '已分配',
      desc: '订单已分配车辆',
      time: '已分配',
      type: 'success',
      color: '#67C23A'
    })
    items.push({
      title: '运输中',
      desc: '货物正在运输途中',
      time: '运输中',
      type: 'primary',
      color: '#409EFF'
    })
    items.push({
      title: '已送达',
      desc: '货物已送达目的地',
      time: '已送达',
      type: 'success',
      color: '#67C23A'
    })
    items.push({
      title: '已签收',
      desc: '货物已签收',
      time: orderDetail.value.signed_time ? formatDate(orderDetail.value.signed_time) : '已签收',
      type: 'success',
      color: '#67C23A'
    })
  }

  return items
})

onMounted(() => {
  const orderId = route.params.id
  if (orderId) {
    loadOrderDetail(orderId)
  }
})

const loadOrderDetail = async (orderId) => {
  loading.value = true
  try {
    const response = await axios.get(`http://localhost:5001/api/orders/${orderId}`)

    if (response.data.code === 200) {
      orderDetail.value = response.data.data
    } else {
      ElMessage.error(response.data.msg || '获取订单详情失败')
    }
  } catch (err) {
    console.error('获取订单详情失败：', err)
    ElMessage.error('网络错误，请检查后端服务')
  } finally {
    loading.value = false
  }
}





const showSignDialog = () => {
  signDialogVisible.value = true
}

const confirmSign = async () => {
  if (!signForm.signer) {
    ElMessage.warning('请输入签收人姓名')
    return
  }

  signing.value = true
  try {
    const response = await axios.put(`http://localhost:5001/api/orders/${orderDetail.value.id}/sign`, {
      signer: signForm.signer,
      remark: signForm.remark
    })

    if (response.data.code === 200) {
      ElMessage.success('签收成功')
      signDialogVisible.value = false
      loadOrderDetail(orderDetail.value.id)
    } else {
      ElMessage.error(response.data.msg || '签收失败')
    }
  } catch (err) {
    console.error('签收失败：', err)
    ElMessage.error('网络错误，请检查后端服务')
  } finally {
    signing.value = false
  }
}

const getStatusType = (status) => {
  const typeMap = {
    'pending': 'warning',
    'assigned': 'info',
    'shipping': 'primary',
    'delivered': 'success',
    'signed': 'info'
  }
  return typeMap[status] || 'info'
}

const getStatusText = (status) => {
  const textMap = {
    'pending': '待处理',
    'assigned': '已分配',
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

const goBack = () => {
  router.push('/my-orders')
}

onUnmounted(() => {
  const mapElement = document.getElementById('map')
  if (mapElement) {
    mapElement.innerHTML = ''
  }
})
</script>

<style scoped>
.order-detail-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.detail-card {
  width: 100%;
  max-width: 1200px;
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

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 15px;
}

.order-info,
.goods-info {
  margin-bottom: 20px;
}

.address-info {
  padding: 20px;
  background: rgba(102, 126, 234, 0.05);
  border-radius: 8px;
}

.address-item {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  margin-bottom: 20px;
}

.address-item:last-child {
  margin-bottom: 0;
}

.address-content {
  flex: 1;
}

.address-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 5px;
}

.address-value {
  font-size: 16px;
  color: #303133;
  font-weight: 500;
}

.timeline {
  padding: 20px;
  background: rgba(102, 126, 234, 0.05);
  border-radius: 8px;
}

.timeline-content {
  padding-left: 10px;
}

.timeline-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 5px;
}

.timeline-desc {
  font-size: 14px;
  color: #909399;
}

.driver-section {
  margin-top: 20px;
}

.driver-card {
  background: rgba(102, 126, 234, 0.05);
  border: none;
}

.driver-info {
  display: flex;
  align-items: center;
  gap: 20px;
}

.driver-details {
  flex: 1;
}

.driver-name {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 10px;
}

.driver-phone,
.vehicle-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #606266;
  margin-bottom: 5px;
}

.amount {
  color: #E6A23C;
  font-weight: 700;
  font-size: 18px;
}

.penalty-info p {
  margin: 8px 0;
  font-size: 14px;
}

.total-penalty {
  font-size: 16px;
  font-weight: 700;
  color: #F56C6C;
  margin-top: 10px !important;
}

.actions-section {
  padding: 20px;
  text-align: center;
}
</style>
