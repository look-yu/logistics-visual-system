<template>
  <div class="report-dashboard">
    <div class="dashboard-header">
      <div class="header-title">
        <el-icon class="title-icon"><DataLine /></el-icon>
        <h2>物流大数据分析看板</h2>
        <span class="subtitle">实时业务分析与决策支持系统</span>
      </div>
      <div class="header-actions">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          size="small"
          class="date-picker"
        />
        <el-button type="primary" size="small" @click="fetchData">
          <el-icon><Refresh /></el-icon>同步数据
        </el-button>
      </div>
    </div>

    <!-- KPI 核心指标 -->
    <el-row :gutter="20" class="kpi-row">
      <el-col :span="6" v-for="kpi in kpis" :key="kpi.title">
        <el-card class="kpi-card" shadow="hover">
          <div class="kpi-wrapper">
            <div class="kpi-icon" :style="{ color: kpi.color, backgroundColor: kpi.bgColor }">
              <el-icon><component :is="kpi.icon" /></el-icon>
            </div>
            <div class="kpi-main">
              <div class="kpi-label">{{ kpi.title }}</div>
              <div class="kpi-value">
                <span class="unit">{{ kpi.unit }}</span>
                {{ kpi.value }}
              </div>
              <div class="kpi-trend" :class="kpi.trend > 0 ? 'up' : 'down'">
                {{ Math.abs(kpi.trend) }}%
                <el-icon><component :is="kpi.trend > 0 ? CaretTop : CaretBottom" /></el-icon>
                <span class="trend-text">环比上周</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 第一排图表：趋势 + 分布 -->
    <el-row :gutter="20" class="chart-row">
      <el-col :span="16">
        <el-card class="chart-card main-chart" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="header-dot">订单量与营收增长趋势</span>
              <el-radio-group v-model="trendType" size="small" :disabled="loading">
                <el-radio-button label="count">订单量</el-radio-button>
                <el-radio-button label="amount">营收额</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <el-skeleton :loading="false" animated>
            <template #template>
              <el-skeleton-item variant="image" style="height: 350px;" />
            </template>
            <template #default>
              <div ref="trendChartRef" class="chart-box"></div>
            </template>
          </el-skeleton>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <span class="header-dot">业务类型分布</span>
          </template>
          <el-skeleton :loading="false" animated>
            <template #template>
              <el-skeleton-item variant="image" style="height: 350px;" />
            </template>
            <template #default>
              <div ref="businessTypeChartRef" class="chart-box"></div>
            </template>
          </el-skeleton>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import * as echarts from 'echarts'
import axios from 'axios'
import { 
  DataLine, Refresh, Money, ShoppingCart, 
  TrendCharts, Timer, CaretTop, CaretBottom 
} from '@element-plus/icons-vue'

const API_BASE = 'http://localhost:5001/api'
const dateRange = ref([])
const trendType = ref('count')
const loading = ref(false)

// 图表引用
const trendChartRef = ref(null)
const businessTypeChartRef = ref(null)

let chartInstances = []

// 数据状态
const kpis = ref([
  { title: '总营业收入', value: '1,284,500', unit: '¥', icon: Money, color: '#F56C6C', bgColor: 'rgba(245, 108, 108, 0.1)', trend: 12.5 },
  { title: '总订单数量', value: '2,150', unit: '', icon: ShoppingCart, color: '#409EFF', bgColor: 'rgba(64, 158, 255, 0.1)', trend: 8.4 },
  { title: '平均物流时效', value: '8.2', unit: 'h', icon: Timer, color: '#67C23A', bgColor: 'rgba(103, 194, 58, 0.1)', trend: -2.1 },
  { title: '准时交付率', value: '98.5', unit: '%', icon: TrendCharts, color: '#E6A23C', bgColor: 'rgba(230, 162, 60, 0.1)', trend: 0.5 },
])

// 初始化趋势图
const initTrendChart = (data) => {
  const chart = echarts.init(trendChartRef.value)
  const isCount = trendType.value === 'count'
  
  const option = {
    tooltip: { trigger: 'axis', backgroundColor: 'rgba(255, 255, 255, 0.9)', textStyle: { color: '#666' } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { 
      type: 'category', 
      data: data.map(i => i.date),
      axisLine: { lineStyle: { color: '#eee' } },
      axisLabel: { color: '#999' }
    },
    yAxis: { 
      type: 'value',
      axisLine: { show: false },
      axisLabel: { color: '#999' },
      splitLine: { lineStyle: { type: 'dashed', color: '#eee' } }
    },
    series: [{
      name: isCount ? '订单量' : '营收额',
      data: data.map(i => isCount ? i.count : i.total_amount),
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      itemStyle: { color: isCount ? '#409EFF' : '#F56C6C' },
      areaStyle: {
        color: isCount ? 'rgba(64, 158, 255, 0.3)' : 'rgba(245, 108, 108, 0.3)'
      },
      lineStyle: { width: 3 }
    }]
  }
  chart.setOption(option)
  chartInstances.push(chart)
}

// 初始化业务分布图
const initBusinessChart = (data) => {
  const chart = echarts.init(businessTypeChartRef.value)
  const option = {
    tooltip: { trigger: 'item' },
    legend: { bottom: '5%', left: 'center', itemWidth: 10, itemHeight: 10, textStyle: { color: '#999', fontSize: 11 } },
    series: [{
      type: 'pie',
      radius: ['35%', '60%'],
      center: ['50%', '45%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
      label: { show: false, position: 'center' },
      emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
      labelLine: { show: false },
      data: data.map(i => ({ name: i.car_type, value: i.total_cost }))
    }]
  }
  chart.setOption(option)
  chartInstances.push(chart)
}

const fetchData = async () => {
  console.log('开始获取报表数据...')
  loading.value = true
  try {
    const res = await axios.get(`${API_BASE}/reports/dashboard`)
    console.log('报表数据响应：', res.data)
    if (res.data.code === 200) {
      const data = res.data.data
      console.log('解析后的数据：', data)
      
      await nextTick()
      
      chartInstances.forEach(c => {
        try {
          c.dispose()
        } catch (e) {
          console.warn('图表销毁失败：', e)
        }
      })
      chartInstances = []
      
      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 300))
      
      console.log('开始初始化图表...')
      console.log('trendChartRef:', trendChartRef.value)
      console.log('businessTypeChartRef:', businessTypeChartRef.value)
      
      try {
        if (trendChartRef.value) {
          console.log('初始化趋势图')
          initTrendChart(data.orderTrend)
        }
        if (businessTypeChartRef.value) {
          console.log('初始化业务分布图')
          initBusinessChart(data.transportCosts)
        }
        
        console.log('图表初始化完成，关闭loading')
        loading.value = false
        
        await nextTick()
        chartInstances.forEach(c => {
          if (c && c.resize) {
            c.resize()
          }
        })
      } catch (e) {
        console.error('图表初始化失败：', e)
        loading.value = false
      }
      
      const totalRevenue = data.orderTrend.reduce((sum, item) => sum + Number(item.total_amount || 0), 0)
      const totalOrders = data.orderTrend.reduce((sum, item) => sum + item.count, 0)
      kpis.value[0].value = totalRevenue.toLocaleString()
      kpis.value[1].value = totalOrders.toLocaleString()
    } else {
      console.error('获取报表失败：', res.data.msg)
      loading.value = false
    }
  } catch (err) {
    console.error('获取报表失败：', err)
    if (err.response) {
      console.error('响应错误：', err.response.data)
    } else if (err.request) {
      console.error('网络错误，请检查后端服务')
    } else {
      console.error('请求失败：', err.message)
    }
    loading.value = false
  }
}

watch(trendType, () => {
  console.log('trendType变化，重新获取数据')
  fetchData()
})

const handleResize = () => {
  chartInstances.forEach(c => c.resize())
}

onMounted(() => {
  fetchData()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chartInstances.forEach(c => c.dispose())
})
</script>

<style scoped>
.report-dashboard {
  padding: 24px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header-title {
  display: flex;
  flex-direction: column;
}

.header-title h2 {
  margin: 0;
  font-size: 24px;
  color: #1f2f3d;
  display: flex;
  align-items: center;
  gap: 10px;
}

.kpi-row { margin-bottom: 24px; }

.subtitle {
  font-size: 13px;
  color: #909399;
  margin-top: 4px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.date-picker {
  width: 240px !important;
}

/* KPI 样式 */
.kpi-row {
  margin-bottom: 24px;
}

.kpi-card {
  border: none;
  border-radius: 12px;
}

.kpi-wrapper {
  display: flex;
  align-items: center;
  gap: 16px;
}

.kpi-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 28px;
}

.kpi-main {
  flex: 1;
}

.kpi-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 4px;
}

.kpi-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  line-height: 1.2;
}

.unit {
  font-size: 14px;
  margin-right: 2px;
}

.kpi-trend {
  font-size: 12px;
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 2px;
}

.kpi-trend.up { color: #F56C6C; }
.kpi-trend.down { color: #67C23A; }

.trend-text {
  color: #C0C4CC;
  margin-left: 4px;
}

/* 图表区域 */
.chart-row {
  margin-bottom: 24px;
}

.chart-card {
  border-radius: 12px;
  border: none;
}

.chart-box {
  height: 350px;
  width: 100%;
  min-width: 300px;
  position: relative;
  display: block;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-dot {
  position: relative;
  padding-left: 12px;
  font-weight: 600;
  color: #303133;
}

.header-dot::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 4px;
  background-color: #409EFF;
  border-radius: 50%;
}
</style>
