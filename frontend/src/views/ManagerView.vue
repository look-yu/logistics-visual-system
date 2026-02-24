<template>
  <div class="manager-view">
    <div class="page-header">
      <h2>管理层运营数据大屏</h2>
      <el-divider direction="vertical" style="height: 24px;"></el-divider> <!-- 修复：显式闭合 -->
      <span class="date-text">{{ currentDate }}</span>
    </div>

    <!-- 核心指标卡片（保留原有，无修改） -->
    <el-row :gutter="20" style="margin-bottom: 20px;">
      <el-col :span="6">
        <el-card class="data-card" shadow="hover">
          <div class="card-header">
            <span class="card-title">总订单量</span>
            <el-tag type="primary">4月</el-tag>
          </div>
          <div class="card-value">{{ totalOrderNum }}</div>
          <div class="card-trend trend-up">
            <el-icon><ArrowUp /></el-icon>
            <span>{{ totalOrderTrend }} 较上月</span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="data-card" shadow="hover">
          <div class="card-header">
            <span class="card-title">完成订单量</span>
            <el-tag type="success">今日</el-tag>
          </div>
          <div class="card-value">{{ finishOrderNum }}</div>
          <div class="card-trend trend-up">
            <el-icon><ArrowUp /></el-icon>
            <span>{{ finishOrderTrend }} 较昨日</span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="data-card" shadow="hover">
          <div class="card-header">
            <span class="card-title">异常订单量</span>
            <el-tag type="warning">今日</el-tag>
          </div>
          <div class="card-value">{{ exceptionOrderNum }}</div>
          <div class="card-trend trend-down">
            <el-icon><ArrowDown /></el-icon>
            <span>{{ exceptionOrderTrend }} 较昨日</span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="data-card" shadow="hover">
          <div class="card-header">
            <span class="card-title">平均配送时效</span>
            <el-tag type="info">今日</el-tag>
          </div>
          <div class="card-value">{{ avgDeliveryTime }}</div>
          <div class="card-trend trend-down">
            <el-icon><ArrowDown /></el-icon>
            <span>{{ avgDeliveryTrend }} 较昨日</span>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 新增：管理层专属 - 异常订单TOP5表格 -->
    <el-row :gutter="20" style="margin-bottom: 20px;">
      <el-col :span="24">
        <el-card shadow="hover">
          <template #header>
            <span class="chart-title">异常订单TOP5</span>
          </template>
          <el-table :data="exceptionOrderList" border size="small">
            <el-table-column prop="orderNo" label="订单号" width="180"></el-table-column> <!-- 修复：显式闭合 -->
            <el-table-column prop="reason" label="异常原因" width="200"></el-table-column> <!-- 修复：显式闭合 -->
            <el-table-column prop="area" label="配送区域"></el-table-column> <!-- 修复：显式闭合 -->
            <el-table-column prop="handler" label="处理人" width="120"></el-table-column> <!-- 修复：显式闭合 -->
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域（核心修复：模板结构+组件标签+注释） -->
    <el-row :gutter="20">
      <el-col :span="14">
        <el-card shadow="hover">
          <template #header> <!-- 修复：缺失#header指令 -->
            <span class="chart-title">月度总订单量趋势</span>
          </template>
          <EchartsChart 
            role="manager" 
            title="月度总订单量趋势" 
            :xAxisData="monthOrderXData"  
            :seriesData="monthOrderYData" 
          ></EchartsChart> <!-- 修复：显式闭合组件 -->
        </el-card>
      </el-col>
      <el-col :span="10">
        <el-card shadow="hover">
          <template #header>
            <span class="chart-title">订单类型分布</span>
          </template>
          <EchartsChart 
            role="warehouse" 
            title="订单类型占比" 
            :xAxisData="orderTypeXData"
            :seriesData="orderTypeYData"
          ></EchartsChart> <!-- 修复：显式闭合组件 -->
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
// 保留原有导入 + 新增缺失的图标导入
import { ref, onMounted } from 'vue'
import axios from 'axios'
import EchartsChart from '../components/EchartsChart.vue'
import { ArrowUp, ArrowDown } from '@element-plus/icons-vue' // 修复：新增图标导入

// 保留原有变量
const currentDate = ref(new Date().toLocaleDateString())

// 新增：动态数据变量（替换原有静态值）
const totalOrderNum = ref('2150')
const totalOrderTrend = ref('8.5%')
const finishOrderNum = ref('2080')
const finishOrderTrend = ref('5.2%')
const exceptionOrderNum = ref('70')
const exceptionOrderTrend = ref('3.1%')
const avgDeliveryTime = ref('8.2h')
const avgDeliveryTrend = ref('1.2%')

// 新增：图表动态数据
const monthOrderXData = ref(['1月', '2月', '3月', '4月'])
const monthOrderYData = ref([1200, 1580, 1820, 2150])
const orderTypeXData = ref(['生鲜配送', '标品配送', '大件配送', '耗材配送'])
const orderTypeYData = ref([650, 980, 320, 200])

// 新增：异常订单列表
const exceptionOrderList = ref([])

// 新增：请求后端数据方法（核心修复：容错+超时+详细错误日志）
const fetchManagerData = async () => {
  try {
    // 修复1：添加超时配置，避免请求卡死
    const res = await axios.get('http://localhost:5000/api/get_role_data', {
      params: { role: 'manager' },
      timeout: 10000 // 10秒超时
    })

    // 修复2：严格判空，避免后端返回非预期格式报错
    if (!res.data || res.data.code !== 200) {
      console.warn('后端返回非预期数据：', res.data)
      return
    }

    const data = res.data.data || {} // 修复3：默认空对象，避免undefined

    // 1. 赋值核心指标
    if (data.core_indicators) {
      totalOrderNum.value = data.core_indicators.total_order_num || '2150'
      totalOrderTrend.value = data.core_indicators.total_order_trend || '8.5%'
      finishOrderNum.value = data.core_indicators.finish_order_num || '2080'
      finishOrderTrend.value = data.core_indicators.finish_order_trend || '5.2%'
      exceptionOrderNum.value = data.core_indicators.exception_order_num || '70'
      exceptionOrderTrend.value = data.core_indicators.exception_order_trend || '3.1%'
      avgDeliveryTime.value = data.core_indicators.avg_delivery_time || '8.2h'
      avgDeliveryTrend.value = data.core_indicators.avg_delivery_trend || '1.2%'
    }

    // 2. 赋值异常订单列表（修复：数组判空）
    exceptionOrderList.value = Array.isArray(data.exception_order_top5) ? data.exception_order_top5 : []

    // 3. 赋值图表数据（修复：数组判空）
    if (data.trend_data) {
      monthOrderXData.value = Array.isArray(data.trend_data.xAxis) ? data.trend_data.xAxis : ['1月', '2月', '3月', '4月']
      monthOrderYData.value = Array.isArray(data.trend_data.series) ? data.trend_data.series : [1200, 1580, 1820, 2150]
    }
    if (data.pie_data) {
      orderTypeXData.value = Array.isArray(data.pie_data.xAxis) ? data.pie_data.xAxis : ['生鲜配送', '标品配送', '大件配送', '耗材配送']
      orderTypeYData.value = Array.isArray(data.pie_data.series) ? data.pie_data.series : [650, 980, 320, 200]
    }
  } catch (err) {
    // 修复4：详细打印错误信息，定位后端500原因
    console.error('管理层数据请求失败（使用兜底数据）：', {
      message: err.message,
      response: err.response?.data, // 后端500详情
      status: err.response?.status
    })
    // 失败仍用原有静态值，不影响页面显示
  }
}

// 新增：初始化请求
onMounted(() => {
  fetchManagerData()
})
</script>

<style scoped>
/* 保留所有原有样式，无修改 */
.manager-view {
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
  color: #52c41a; /* Element Plus 2.x成功色 */
}
.trend-down {
  color: #f5222d; /* Element Plus 2.x危险色 */
}
.chart-title {
  font-size: 16px;
  color: #333;
  font-weight: 500;
}
</style>