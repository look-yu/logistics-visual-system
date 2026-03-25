<template>
  <div class="dispatcher-view">
    <div class="page-header">
      <div class="header-left">
        <el-icon class="header-icon"><Monitor /></el-icon>
        <h2>运输调度决策中心</h2>
        <el-tag type="success" effect="dark" class="status-tag">实时监控中</el-tag>
      </div>
      <div class="header-right">
        <span class="date-text">{{ currentDate }}</span>
        <el-button type="primary" size="small" @click="fetchDispatcherData" :loading="loading">
          <el-icon><Refresh /></el-icon>刷新数据
        </el-button>
      </div>
    </div>

    <!-- KPI 指标卡片 -->
    <el-row :gutter="20" class="kpi-row">
      <el-col :span="6" v-for="card in kpiCards" :key="card.title">
        <el-card class="kpi-card" shadow="hover" :body-style="{ padding: '20px' }">
          <div class="kpi-content">
            <div class="kpi-info">
              <div class="kpi-title">{{ card.title }}</div>
              <div class="kpi-value">{{ card.value }}</div>
              <div class="kpi-footer">
                <span :class="['trend-tag', card.trendType]">
                  <el-icon><component :is="card.trendType === 'trend-up' ? ArrowUp : ArrowDown" /></el-icon>
                  {{ card.trend }}
                </span>
                <span class="trend-label">较昨日</span>
              </div>
            </div>
            <div class="kpi-icon-wrapper" :style="{ backgroundColor: card.bgColor }">
              <el-icon :style="{ color: card.iconColor }"><component :is="card.icon" /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 中间区域：地图 + 车辆状态 -->
    <el-row :gutter="20" class="main-row">
      <el-col :span="16">
        <el-card class="map-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <div class="header-left">
                <div class="header-title-group">
                  <span class="title-with-dot">实时运输轨迹监控</span>
                </div>
                <el-radio-group v-model="mapType" size="small">
                  <el-radio-button label="all">全部</el-radio-button>
                  <el-radio-button label="urgent">紧急</el-radio-button>
                </el-radio-group>
              </div>
              <div class="header-right">
                <el-input
                  v-model="searchOrderNo"
                  placeholder="请输入订单号"
                  size="small"
                  style="width: 200px;"
                  clearable
                  @clear="clearSearch"
                >
                  <template #prefix>
                    <el-icon><Search /></el-icon>
                  </template>
                  <template #append>
                    <el-button 
                      :icon="Search" 
                      @click="searchOrderByNo"
                      :disabled="!searchOrderNo"
                    />
                  </template>
                </el-input>
              </div>
            </div>
          </template>
          <div class="chart-container map-container">
            <AMapView 
              :points="filteredTrackPoints"
              :zoom="5"
              :highlight-order="searchedOrder"
            />
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="progress-card" shadow="hover" style="height: 100%;">
          <template #header>
            <span class="title-with-dot">今日任务进度</span>
          </template>
          <div class="progress-list">
            <div v-for="item in taskProgress" :key="item.name" class="progress-item">
              <div class="progress-info">
                <span>{{ item.name }}</span>
                <span>{{ item.percentage }}%</span>
              </div>
              <el-progress :percentage="item.percentage" :color="item.color" :show-text="false" />
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import EchartsChart from '../components/EchartsChart.vue'
import AMapView from '../components/AMapView.vue'
import { 
  ArrowUp, ArrowDown, Monitor, Refresh, 
  Van, Timer, Warning, Search 
} from '@element-plus/icons-vue'

const currentDate = ref(new Date().toLocaleString())
const loading = ref(false)
const mapType = ref('all')
const searchOrderNo = ref('')
const searchedOrder = ref(null)

const router = useRouter()

// KPI 数据
const todayTransportNum = ref('0')
const todayTransportTrend = ref('0%')
const unfinishedOrderNum = ref('0')
const unfinishedOrderTrend = ref('0%')
const avgDeliveryTime = ref('0h')
const avgDeliveryTrend = ref('0%')
const activeVehicles = ref('0')

const kpiCards = computed(() => [
  { title: '今日运输单量', value: todayTransportNum.value, trend: todayTransportTrend.value, trendType: 'trend-up', icon: Van, iconColor: '#409EFF', bgColor: 'rgba(64, 158, 255, 0.1)' },
  { title: '待调度运单', value: unfinishedOrderNum.value, trend: unfinishedOrderTrend.value, trendType: 'trend-down', icon: Monitor, iconColor: '#E6A23C', bgColor: 'rgba(230, 162, 60, 0.1)' },
  { title: '平均配送时效', value: avgDeliveryTime.value, trend: avgDeliveryTrend.value, trendType: 'trend-down', icon: Timer, iconColor: '#67C23A', bgColor: 'rgba(103, 194, 58, 0.1)' },
  { title: '在途车辆数', value: activeVehicles.value, trend: '0%', trendType: 'trend-up', icon: Warning, iconColor: '#F56C6C', bgColor: 'rgba(245, 108, 108, 0.1)' },
])

// 任务进度
const taskProgress = ref([])

// 模拟轨迹数据
const trackPoints = ref([])

const filteredTrackPoints = computed(() => {
  let points = trackPoints.value
  
  if (mapType.value === 'urgent') {
    points = points.filter(p => p.urgent)
  }
  
  if (searchOrderNo.value) {
    points = points.filter(p => p.orderNo.toLowerCase().includes(searchOrderNo.value.toLowerCase()))
  }
  
  return points
})

const fetchDispatcherData = async () => {
  loading.value = true
  try {
    const res = await axios.get('http://localhost:5001/api/get_role_data', {
      params: { role: 'dispatcher' },
      timeout: 10000
    })

    if (res.data && res.data.code === 200) {
      const data = res.data.data || {}
      
      if (data.core_indicators) {
        todayTransportNum.value = data.core_indicators.today_transport_num || '0'
        todayTransportTrend.value = data.core_indicators.today_transport_trend || '0%'
        unfinishedOrderNum.value = data.core_indicators.unfinished_order_num || '0'
        unfinishedOrderTrend.value = data.core_indicators.unfinished_order_trend || '0%'
        avgDeliveryTime.value = data.core_indicators.avg_delivery_time || '0h'
        avgDeliveryTrend.value = data.core_indicators.avg_delivery_trend || '0%'
      }
      
      if (data.active_vehicles) {
        activeVehicles.value = data.active_vehicles
      }
      
      if (data.task_progress && Array.isArray(data.task_progress)) {
        taskProgress.value = data.task_progress
      }
    }
    
    await fetchOrderTrackData()
  } catch (err) {
    console.error('获取调度数据失败:', err)
    await fetchOrderTrackData()
  } finally {
    loading.value = false
  }
}

const fetchOrderTrackData = async () => {
  console.log('DispatcherView: 开始获取订单轨迹数据...')
  try {
    const res = await axios.get('http://localhost:5001/api/orders', {
      params: { page: 1, size: 50 }
    })
    
    console.log('DispatcherView: 订单API响应：', res.data)
    
    if (res.data && res.data.data && res.data.data.list) {
      const orders = res.data.data.list
      console.log('DispatcherView: 获取到订单数量：', orders.length)
      
      const filteredOrders = orders.filter(order => {
        const isNotPending = order.status !== 'pending'
        console.log(`订单 ${order.order_no}: 非pending=${isNotPending}`)
        return isNotPending
      })
      
      console.log('DispatcherView: 过滤后订单数量：', filteredOrders.length)
      
      trackPoints.value = filteredOrders.map(order => {
        // 处理坐标格式：可能是字符串或数组
        let fromCoord = null
        let toCoord = null
        
        if (order.sender_coord) {
          if (typeof order.sender_coord === 'string') {
            const coords = order.sender_coord.split(',').map(Number)
            if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1]) && coords[0] !== 0 && coords[1] !== 0) {
              fromCoord = coords
            }
          } else if (Array.isArray(order.sender_coord) && order.sender_coord.length === 2) {
            if (!isNaN(order.sender_coord[0]) && !isNaN(order.sender_coord[1]) && order.sender_coord[0] !== 0 && order.sender_coord[1] !== 0) {
              fromCoord = order.sender_coord
            }
          }
        }
        
        if (order.receiver_coord) {
          if (typeof order.receiver_coord === 'string') {
            const coords = order.receiver_coord.split(',').map(Number)
            if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1]) && coords[0] !== 0 && coords[1] !== 0) {
              toCoord = coords
            }
          } else if (Array.isArray(order.receiver_coord) && order.receiver_coord.length === 2) {
            if (!isNaN(order.receiver_coord[0]) && !isNaN(order.receiver_coord[1]) && order.receiver_coord[0] !== 0 && order.receiver_coord[1] !== 0) {
              toCoord = order.receiver_coord
            }
          }
        }
        
        return {
          from: order.sender_address ? order.sender_address.split('市')[0] + '市' : '未知',
          to: order.receiver_address ? order.receiver_address.split('市')[0] + '市' : '未知',
          fromCoord: fromCoord,
          toCoord: toCoord,
          pathCoords: [fromCoord, toCoord],
          urgent: order.status === 'shipping',
          orderNo: order.order_no,
          customerName: order.customer_name,
          goodsType: order.goods_type
        }
      }).filter(point => point.fromCoord && point.toCoord)
      
      console.log('DispatcherView: 地图轨迹数据已更新，共', trackPoints.value.length, '条轨迹')
      console.log('DispatcherView: 轨迹数据：', trackPoints.value)
    } else {
      console.warn('DispatcherView: 订单数据格式不正确')
    }
  } catch (err) {
    console.error('DispatcherView: 获取订单轨迹数据失败:', err)
  }
}

const searchOrderByNo = () => {
  if (!searchOrderNo.value) {
    ElMessage.warning('请输入订单号')
    return
  }
  
  console.log('搜索订单号：', searchOrderNo.value)
  console.log('当前trackPoints数量：', trackPoints.value.length)
  console.log('当前trackPoints：', trackPoints.value.map(t => ({ orderNo: t.orderNo, hasCoords: !!(t.fromCoord && t.toCoord) })))
  
  // 支持模糊匹配和精确匹配
  const found = trackPoints.value.find(t => 
    t.orderNo.toLowerCase().includes(searchOrderNo.value.toLowerCase())
  )
  
  console.log('搜索结果：', found)
  
  if (found) {
    searchedOrder.value = found
    ElMessage.success(`找到订单：${found.orderNo} (${found.from} -> ${found.to})`)
    mapType.value = 'all'
  } else {
    ElMessage.warning('未找到该订单，请检查订单号是否正确')
    searchedOrder.value = null
  }
}

const clearSearch = () => {
  searchOrderNo.value = ''
  searchedOrder.value = null
  console.log('已清空搜索')
}

onMounted(() => {
  fetchDispatcherData()
  // 每隔5分钟自动刷新
  setInterval(fetchDispatcherData, 300000)
})
</script>

<style scoped>
.dispatcher-view {
  padding: 20px;
  background-color: #f0f2f5;
  min-height: calc(100vh - 100px);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon {
  font-size: 24px;
  color: #409EFF;
}

.header-left h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #1f2f3d;
}

.status-tag {
  border-radius: 4px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.date-text {
  color: #909399;
  font-size: 14px;
}

/* KPI 卡片样式 */
.kpi-row {
  margin-bottom: 15px;
}

.kpi-card :deep(.el-card__body) {
  padding: 15px !important;
}

.kpi-card {
  border: none;
  border-radius: 8px;
  transition: all 0.3s;
}

.kpi-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.kpi-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.kpi-title {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.kpi-value {
  font-size: 20px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 4px;
}

.kpi-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.trend-tag {
  display: flex;
  align-items: center;
  font-weight: 500;
}

.trend-up { color: #67C23A; }
.trend-down { color: #F56C6C; }

.trend-label {
  color: #C0C4CC;
}

.kpi-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 24px;
}

/* 主区域样式 */
.main-row {
  margin-bottom: 15px;
}

.map-card {
  height: 700px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title-with-dot {
  position: relative;
  padding-left: 15px;
  font-weight: 600;
  color: #303133;
}

.title-with-dot::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 16px;
  background-color: #409EFF;
  border-radius: 2px;
}

.header-title-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.zoom-tip-icon {
  font-size: 16px;
  color: #909399;
  cursor: help;
}

.chart-container {
  height: 100%;
  width: 100%;
  position: relative;
}

.mini-chart {
  height: 280px;
}

.map-container {
  height: 100%;
  width: 100%;
  cursor: pointer;
  position: relative;
}

.map-container:hover {
  opacity: 0.95;
}

/* 进度列表样式 */
.progress-list {
  padding: 20px 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
}

.progress-item {
  margin-bottom: 30px;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
  font-size: 16px;
  color: #606266;
  font-weight: 500;
}

.progress-item :deep(.el-progress) {
  height: 30px;
}

:deep(.el-dialog__body) {
  padding: 10px 20px 20px;
}

:deep(.el-table) {
  --el-table-header-bg-color: #f5f7fa;
}
</style>