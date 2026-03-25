<template>
  <div class="manager-view">
    <div class="dashboard-header">
      <div class="left">
        <h2 class="title">运营决策中心</h2>
        <p class="subtitle">实时物流运营指标监控与决策分析</p>
      </div>
      <div class="right">
        <el-tag type="info" effect="plain">{{ currentDate }}</el-tag>
        <el-button type="primary" icon="Refresh" circle @click="fetchManagerData" />
      </div>
    </div>

    <!-- 核心KPI指标行 -->
    <el-row :gutter="20" class="kpi-row">
      <el-col :span="6" v-for="kpi in kpiCards" :key="kpi.title">
        <el-card class="kpi-card" shadow="hover" :body-style="{ padding: '20px' }">
          <div class="kpi-content">
            <div class="kpi-info">
              <div class="kpi-title">{{ kpi.title }}</div>
              <div class="kpi-value">{{ kpi.value }}</div>
              <div class="kpi-trend" :class="kpi.trendType">
                <el-icon><component :is="kpi.trendIcon" /></el-icon>
                <span>{{ kpi.trendValue }} {{ kpi.trendText }}</span>
              </div>
            </div>
            <div class="kpi-icon-wrapper" :style="{ backgroundColor: kpi.bgColor }">
              <el-icon :style="{ color: kpi.iconColor }"><component :is="kpi.icon" /></el-icon>
            </div>
          </div>
          <el-progress :percentage="kpi.progress" :color="kpi.iconColor" :show-text="false" :stroke-width="4" />
        </el-card>
      </el-col>
    </el-row>

    <!-- 中间数据层：趋势分析 -->
    <el-row :gutter="20" class="chart-row">
      <el-col :span="24">
        <el-card shadow="hover" class="main-chart-card">
          <template #header>
            <div class="card-header">
              <div class="header-left">
                <span class="card-title">月度订单增长趋势</span>
                <el-date-picker
                  v-model="selectedMonth"
                  type="month"
                  placeholder="选择月份"
                  size="small"
                  style="width: 130px; margin-left: 15px;"
                  @change="handleMonthChange"
                />
              </div>
              <el-radio-group v-model="trendDimension" size="small">
                <el-radio-button value="order">订单量</el-radio-button>
                <el-radio-button value="amount">交易额</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div class="chart-container">
            <EchartsChart 
              role="manager" 
              :title="trendTitle" 
              :xAxisData="monthOrderXData"  
              :seriesData="monthOrderYData"
              :seriesName="trendSeriesName"
            />
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import axios from 'axios'
import EchartsChart from '../components/EchartsChart.vue'
import { 
  ArrowUp, ArrowDown, ShoppingCart, Check, Warning, Timer, 
  Refresh, TrendCharts, List 
} from '@element-plus/icons-vue'

const currentDate = ref(new Date().toLocaleString())
const selectedMonth = ref(new Date())
const trendDimension = ref('order')

const trendTitle = computed(() => {
  const monthStr = (selectedMonth.value.getMonth() + 1) + '月'
  const typeStr = trendDimension.value === 'order' ? '订单量趋势' : '交易额趋势'
  return `${monthStr}${typeStr}`
})

const trendSeriesName = computed(() => {
  return trendDimension.value === 'order' ? '订单量' : '交易额(千元)'
})

const handleMonthChange = (val) => {
  if (val) {
    fetchManagerData()
  }
}

// 核心指标数据
const totalOrderNum = ref('2,150')
const totalOrderTrend = ref('8.5%')
const finishOrderNum = ref('2,080')
const finishOrderTrend = ref('5.2%')
const exceptionOrderNum = ref('70')
const exceptionOrderTrend = ref('3.1%')
const avgDeliveryTime = ref('8.2h')
const avgDeliveryTrend = ref('1.2%')

const kpiCards = computed(() => [
  {
    title: '总订单量',
    value: totalOrderNum.value,
    trendValue: totalOrderTrend.value,
    trendText: '较上月',
    trendType: 'trend-up',
    trendIcon: ArrowUp,
    icon: ShoppingCart,
    iconColor: '#409eff',
    bgColor: 'rgba(64, 158, 255, 0.1)',
    progress: 85
  },
  {
    title: '已完成订单',
    value: finishOrderNum.value,
    trendValue: finishOrderTrend.value,
    trendText: '较昨日',
    trendType: 'trend-up',
    trendIcon: ArrowUp,
    icon: Check,
    iconColor: '#67c23a',
    bgColor: 'rgba(103, 194, 58, 0.1)',
    progress: 96
  },
  {
    title: '异常待处理',
    value: exceptionOrderNum.value,
    trendValue: exceptionOrderTrend.value,
    trendText: '较昨日',
    trendType: 'trend-down',
    trendIcon: ArrowDown,
    icon: Warning,
    iconColor: '#f56c6c',
    bgColor: 'rgba(245, 108, 108, 0.1)',
    progress: 12
  },
  {
    title: '平均配送时效',
    value: avgDeliveryTime.value,
    trendValue: avgDeliveryTrend.value,
    trendText: '较昨日',
    trendType: 'trend-down',
    trendIcon: ArrowDown,
    icon: Timer,
    iconColor: '#e6a23c',
    bgColor: 'rgba(230, 162, 60, 0.1)',
    progress: 78
  }
])

// 图表数据
const monthOrderXData = ref(['1月', '2月', '3月', '4月'])
const monthOrderYData = ref([1200, 1580, 1820, 2150])
const orderTypeXData = ref(['普通货物', '生鲜食品', '电子产品', '危险品', '贵重物品', '大件货物'])
const orderTypeYData = ref([35, 25, 20, 10, 5, 5])

const fetchManagerData = async () => {
  try {
    const res = await axios.get('http://localhost:5001/api/get_role_data', {
      params: { 
        role: 'manager',
        month: selectedMonth.value.getMonth() + 1,
        dimension: trendDimension.value
      },
      timeout: 10000
    })

    if (res.data && res.data.code === 200) {
      const data = res.data.data || {}
      
      // 更新核心指标
      if (data.core_indicators) {
        totalOrderNum.value = data.core_indicators.total_order_num || '2,150'
        totalOrderTrend.value = data.core_indicators.total_order_trend || '8.5%'
        finishOrderNum.value = data.core_indicators.finish_order_num || '2,080'
        finishOrderTrend.value = data.core_indicators.finish_order_trend || '5.2%'
        exceptionOrderNum.value = data.core_indicators.exception_order_num || '70'
        exceptionOrderTrend.value = data.core_indicators.exception_order_trend || '3.1%'
        avgDeliveryTime.value = data.core_indicators.avg_delivery_time || '8.2h'
        avgDeliveryTrend.value = data.core_indicators.avg_delivery_trend || '1.2%'
      }

      if (data.trend_data) {
        monthOrderXData.value = data.trend_data.xAxis || monthOrderXData.value
        monthOrderYData.value = data.trend_data.series || monthOrderYData.value
        console.log('ManagerView: 图表数据已更新', {
          dimension: trendDimension.value,
          xAxis: monthOrderXData.value,
          series: monthOrderYData.value
        })
      }
      if (data.pie_data) {
        orderTypeXData.value = data.pie_data.xAxis || orderTypeXData.value
        orderTypeYData.value = data.pie_data.series || orderTypeYData.value
      }
    }
  } catch (err) {
    console.error('获取管理层数据失败:', err)
  }
}

watch(trendDimension, () => {
  fetchManagerData()
})

onMounted(fetchManagerData)
</script>

<style scoped>
.manager-view {
  padding: 20px;
  background-color: #f0f2f5;
  min-height: calc(100vh - 60px);
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  background: #fff;
  padding: 16px 24px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.05);
}

.dashboard-header .title {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  color: #1f2f3d;
}

.dashboard-header .subtitle {
  margin: 4px 0 0;
  font-size: 14px;
  color: #909399;
}

.kpi-row {
  margin-bottom: 24px;
}

.kpi-card {
  border: none;
  border-radius: 8px;
  transition: all 0.3s;
}

.kpi-card:hover {
  transform: translateY(-4px);
}

.kpi-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.kpi-title {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.kpi-value {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 8px;
}

.kpi-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
}

.trend-up { color: #f56c6c; }
.trend-down { color: #67c23a; }

.kpi-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.chart-row {
  margin-bottom: 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.chart-container {
  height: 300px;
}

:deep(.el-card__header) {
  padding: 15px 20px;
  border-bottom: 1px solid #f0f2f5;
}
</style>