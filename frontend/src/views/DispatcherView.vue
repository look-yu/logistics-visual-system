<template>
  <!-- 调度人员数据大屏 -->
  <div class="dispatcher-view">
    <div class="page-header">
      <h2>调度人员运输数据大屏</h2>
      <el-divider direction="vertical" style="height: 24px;"></el-divider> <!-- 修复：显式闭合标签 -->
      <span class="date-text">{{ currentDate }}</span>
    </div>

    <!-- 核心指标（保留原有，修改为动态数据） -->
    <el-row :gutter="20" style="margin-bottom: 20px;">
      <el-col :span="8">
        <el-card class="data-card" shadow="hover">
          <div class="card-header">
            <span class="card-title">今日运输单量</span>
            <el-tag type="primary">总计</el-tag>
          </div>
          <div class="card-value">{{ todayTransportNum }}</div>
          <div class="card-trend trend-up">
            <el-icon><ArrowUp /></el-icon>
            <span>{{ todayTransportTrend }} 较昨日</span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="data-card" shadow="hover">
          <div class="card-header">
            <span class="card-title">未完成订单</span>
            <el-tag type="warning">待调度</el-tag>
          </div>
          <div class="card-value">{{ unfinishedOrderNum }}</div>
          <div class="card-trend trend-down">
            <el-icon><ArrowDown /></el-icon>
            <span>{{ unfinishedOrderTrend }} 较昨日</span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="data-card" shadow="hover">
          <div class="card-header">
            <span class="card-title">平均配送时效</span>
            <el-tag type="success">今日</el-tag>
          </div>
          <div class="card-value">{{ avgDeliveryTime }}</div>
          <div class="card-trend trend-down">
            <el-icon><ArrowDown /></el-icon>
            <span>{{ avgDeliveryTrend }} 较昨日</span>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 新增：调度员专属 - 车辆状态 + 待分配运单 -->
    <el-row :gutter="20" style="margin-bottom: 20px;">
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <span class="chart-title">车辆状态监控</span>
          </template>
          <el-table :data="carStatusList" border size="small">
            <el-table-column prop="carNo" label="车牌号" width="120"></el-table-column> <!-- 修复：显式闭合 -->
            <el-table-column prop="status" label="状态" width="100">
              <template #default="scope">
                <el-tag 
                  :type="scope.row.status === '空闲' ? 'success' : scope.row.status === '在途' ? 'warning' : 'danger'"
                >
                  {{ scope.row.status }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="driver" label="司机"></el-table-column> <!-- 修复：显式闭合 -->
            <el-table-column prop="phone" label="联系电话" width="130"></el-table-column> <!-- 修复：显式闭合 -->
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <span class="chart-title">待分配运单</span>
          </template>
          <el-table :data="waitAllocateOrderList" border size="small">
            <el-table-column prop="orderNo" label="订单号" width="180"></el-table-column> <!-- 修复：显式闭合 -->
            <el-table-column prop="area" label="配送区域" width="120"></el-table-column> <!-- 修复：显式闭合 -->
            <el-table-column prop="goodsType" label="货物类型" width="120"></el-table-column> <!-- 修复：显式闭合 -->
            <el-table-column prop="urgent" label="优先级" width="100">
              <template #default="scope">
                <el-tag type="danger" v-if="scope.row.urgent === '紧急'">紧急</el-tag>
                <el-tag type="info" v-else>普通</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域（修复：组件自闭合标签 + 规范格式） -->
    <el-card shadow="hover">
      <template #header>
        <span class="chart-title">各时段运输单量</span>
      </template>
      <EchartsChart 
        role="dispatcher" 
        title="今日各时段运输单量" 
        :xAxisData="timeSlotXData"
        :seriesData="timeSlotYData"
      ></EchartsChart> <!-- 修复：显式闭合组件标签 -->
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import EchartsChart from '../components/EchartsChart.vue'
import { ArrowUp, ArrowDown } from '@element-plus/icons-vue'

// 保留原有变量
const currentDate = ref(new Date().toLocaleDateString())

// 新增：动态数据变量（替换原有静态值）
const todayTransportNum = ref('357')
const todayTransportTrend = ref('12.3%')
const unfinishedOrderNum = ref('28')
const unfinishedOrderTrend = ref('8.7%')
const avgDeliveryTime = ref('4.5h')
const avgDeliveryTrend = ref('2.1%')

// 新增：图表动态数据
const timeSlotXData = ref(['早班(6-12)', '中班(12-18)', '晚班(18-24)'])
const timeSlotYData = ref([85, 162, 110])

// 新增：调度员专属数据列表
const carStatusList = ref([])
const waitAllocateOrderList = ref([])

// 新增：请求后端数据方法（核心修复：错误捕获+数据判空+接口容错）
const fetchDispatcherData = async () => {
  try {
    // 修复1：添加超时配置，避免请求卡死
    const res = await axios.get('http://localhost:5000/api/get_role_data', {
      params: { role: 'dispatcher' },
      timeout: 10000 // 10秒超时
    })

    // 修复2：严格判空，避免后端返回非预期格式导致报错
    if (!res.data || res.data.code !== 200) {
      console.warn('后端返回非预期数据：', res.data)
      return
    }

    const data = res.data.data || {} // 修复3：默认空对象，避免data为undefined

    // 1. 赋值核心指标（动态替换静态值）
    if (data.core_indicators) {
      todayTransportNum.value = data.core_indicators.today_transport_num || '357'
      todayTransportTrend.value = data.core_indicators.today_transport_trend || '12.3%'
      unfinishedOrderNum.value = data.core_indicators.unfinished_order_num || '28'
      unfinishedOrderTrend.value = data.core_indicators.unfinished_order_trend || '8.7%'
      avgDeliveryTime.value = data.core_indicators.avg_delivery_time || '4.5h'
      avgDeliveryTrend.value = data.core_indicators.avg_delivery_trend || '2.1%'
    }

    // 2. 赋值专属数据列表（修复：默认空数组，避免渲染报错）
    carStatusList.value = Array.isArray(data.car_status) ? data.car_status : []
    waitAllocateOrderList.value = Array.isArray(data.wait_allocate_order) ? data.wait_allocate_order : []

    // 3. 赋值图表数据
    if (data.trend_data) {
      timeSlotXData.value = Array.isArray(data.trend_data.xAxis) ? data.trend_data.xAxis : ['早班(6-12)', '中班(12-18)', '晚班(18-24)']
      timeSlotYData.value = Array.isArray(data.trend_data.series) ? data.trend_data.series : [85, 162, 110]
    }
  } catch (err) {
    // 修复4：详细打印错误信息，方便定位后端问题
    console.error('调度员数据请求失败（使用兜底数据）：', {
      message: err.message,
      response: err.response?.data, // 打印后端返回的500错误详情
      status: err.response?.status
    })
    // 失败仍用原有静态值，不影响页面显示
  }
}

// 新增：初始化请求
onMounted(() => {
  fetchDispatcherData()
})
</script>

<style scoped>
/* 保留所有原有样式，无修改 */
.dispatcher-view {
  width: 100%;
  height: 100%;
}
.page-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}
.page-header h2 {
  margin: 0;
  color: #333;
  font-size: 20px;
}
.date-text {
  color: #666;
  font-size: 14px;
}
.data-card {
  height: 100%;
  box-sizing: border-box;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}
.card-title {
  font-size: 14px;
  color: #666;
}
.card-value {
  font-size: 28px;
  font-weight: 700;
  color: #333;
  margin-bottom: 10px;
}
.card-trend {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
}
.trend-up {
  color: #52c41a;
}
.trend-down {
  color: #f5222d;
}
.chart-title {
  font-size: 16px;
  color: #333;
  font-weight: 500;
}
</style>