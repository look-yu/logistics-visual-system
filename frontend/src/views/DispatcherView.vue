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

    <!-- 今日任务进度 -->
    <el-row :gutter="20" class="main-row">
      <el-col :span="24">
        <el-card class="progress-card" shadow="hover">
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

    <!-- 底部区域：待分配运单 + 运输趋势 -->
    <el-row :gutter="20">
      <el-col :span="12">
        <el-card shadow="hover" class="table-card">
          <template #header>
            <div class="card-header">
              <span class="title-with-dot">待调度运单队列</span>
              <el-button type="primary" link>查看全部</el-button>
            </div>
          </template>
          <el-table :data="waitAllocateOrderList" border size="default" stripe>
            <el-table-column prop="orderNo" label="订单号" width="150" show-overflow-tooltip></el-table-column>
            <el-table-column prop="area" label="配送区域"></el-table-column>
            <el-table-column prop="goodsType" label="货物类型"></el-table-column>
            <el-table-column prop="urgent" label="优先级" width="100">
              <template #default="scope">
                <el-tag :type="scope.row.urgent === '紧急' ? 'danger' : 'info'" effect="light">
                  {{ scope.row.urgent }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <span class="title-with-dot">各时段运输压力分析</span>
          </template>
          <div class="chart-container">
            <EchartsChart 
              role="dispatcher" 
              title="" 
              :xAxisData="timeSlotXData"
              :seriesData="timeSlotYData"
            />
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import EchartsChart from '../components/EchartsChart.vue'
import { 
  ArrowUp, ArrowDown, Monitor, Refresh, 
  Van, Timer, List, Warning 
} from '@element-plus/icons-vue'

const currentDate = ref(new Date().toLocaleString())
const loading = ref(false)

// KPI 数据
const todayTransportNum = ref('357')
const todayTransportTrend = ref('12.3%')
const unfinishedOrderNum = ref('28')
const unfinishedOrderTrend = ref('8.7%')
const avgDeliveryTime = ref('4.5h')
const avgDeliveryTrend = ref('2.1%')
const activeVehicles = ref('142')

const kpiCards = computed(() => [
  { title: '今日运输单量', value: todayTransportNum.value, trend: todayTransportTrend.value, trendType: 'trend-up', icon: Van, iconColor: '#409EFF', bgColor: 'rgba(64, 158, 255, 0.1)' },
  { title: '待调度运单', value: unfinishedOrderNum.value, trend: unfinishedOrderTrend.value, trendType: 'trend-down', icon: List, iconColor: '#E6A23C', bgColor: 'rgba(230, 162, 60, 0.1)' },
  { title: '平均配送时效', value: avgDeliveryTime.value, trend: avgDeliveryTrend.value, trendType: 'trend-down', icon: Timer, iconColor: '#67C23A', bgColor: 'rgba(103, 194, 58, 0.1)' },
  { title: '在途车辆数', value: activeVehicles.value, trend: '5.4%', trendType: 'trend-up', icon: Warning, iconColor: '#F56C6C', bgColor: 'rgba(245, 108, 108, 0.1)' },
])

// 图表数据
const timeSlotXData = ref(['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'])
const timeSlotYData = ref([45, 32, 120, 185, 156, 98])

// 任务进度
const taskProgress = ref([
  { name: '同城配送', percentage: 75, color: '#409EFF' },
  { name: '跨省长途', percentage: 45, color: '#67C23A' },
  { name: '冷链物流', percentage: 90, color: '#F56C6C' },
  { name: '危险品运输', percentage: 60, color: '#E6A23C' }
])

const waitAllocateOrderList = ref([])

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
        todayTransportNum.value = data.core_indicators.today_transport_num || '357'
        todayTransportTrend.value = data.core_indicators.today_transport_trend || '12.3%'
        unfinishedOrderNum.value = data.core_indicators.unfinished_order_num || '28'
        unfinishedOrderTrend.value = data.core_indicators.unfinished_order_trend || '8.7%'
        avgDeliveryTime.value = data.core_indicators.avg_delivery_time || '4.5h'
        avgDeliveryTrend.value = data.core_indicators.avg_delivery_trend || '2.1%'
      }

      waitAllocateOrderList.value = Array.isArray(data.wait_allocate_order) ? data.wait_allocate_order : []

      if (data.trend_data) {
        timeSlotXData.value = data.trend_data.xAxis || timeSlotXData.value
        timeSlotYData.value = data.trend_data.series || timeSlotYData.value
      }
    }
  } catch (err) {
    console.error('获取调度数据失败:', err)
  } finally {
    loading.value = false
  }
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
  height: 250px;
}

.mini-chart {
  height: 200px;
}

.map-container {
  height: 420px;
  cursor: pointer;
}

.map-container:hover {
  opacity: 0.95;
}

/* 进度列表样式 */
.progress-list {
  padding: 5px 0;
}

.progress-item {
  margin-bottom: 12px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 13px;
  color: #606266;
}

/* 表格卡片样式 */
.table-card, .chart-card {
  height: 320px;
}

:deep(.el-dialog__body) {
  padding: 10px 20px 20px;
}

:deep(.el-table) {
  --el-table-header-bg-color: #f5f7fa;
}
</style>