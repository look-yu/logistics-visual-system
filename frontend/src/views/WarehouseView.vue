<template>
  <!-- 仓储管理员数据大屏 -->
  <div class="warehouse-view">
    <div class="page-header">
      <h2>仓储管理员库存数据大屏</h2>
      <el-divider direction="vertical" style="height: 24px;"></el-divider> <!-- 修复：显式闭合标签 -->
      <span class="date-text">{{ currentDate }}</span>
    </div>

    <!-- 核心指标（保留原有，修改为动态数据） -->
    <el-row :gutter="20" style="margin-bottom: 20px;">
      <el-col :span="6">
        <el-card class="data-card" shadow="hover">
          <div class="card-header">
            <span class="card-title">总库存量</span>
            <el-tag type="primary">当前</el-tag>
          </div>
          <div class="card-value">{{ totalStockNum }}</div>
          <div class="card-trend trend-up">
            <el-icon><ArrowUp /></el-icon>
            <span>{{ totalStockTrend }} 较昨日</span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="data-card" shadow="hover">
          <div class="card-header">
            <span class="card-title">待出库量</span>
            <el-tag type="warning">今日</el-tag>
          </div>
          <div class="card-value">{{ pendingOutStockNum }}</div>
          <div class="card-trend trend-up">
            <el-icon><ArrowUp /></el-icon>
            <span>{{ pendingOutStockTrend }} 较昨日</span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="data-card" shadow="hover">
          <div class="card-header">
            <span class="card-title">库存预警</span>
            <el-tag type="danger">低库存</el-tag>
          </div>
          <div class="card-value">{{ warningStockNum }}</div>
          <div class="card-trend trend-down">
            <el-icon><ArrowDown /></el-icon>
            <span>{{ warningStockTrend }} 较昨日</span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="data-card" shadow="hover">
          <div class="card-header">
            <span class="card-title">周转率</span>
            <el-tag type="success">本月</el-tag>
          </div>
          <div class="card-value">{{ stockTurnoverRate }}</div>
          <div class="card-trend trend-up">
            <el-icon><ArrowUp /></el-icon>
            <span>{{ stockTurnoverTrend }} 较上月</span>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 新增：仓储员专属 - 库存明细 + 出入库记录 -->
    <el-row :gutter="20" style="margin-bottom: 20px;">
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <span class="chart-title">库存明细</span>
          </template>
          <el-table :data="stockDetailList" border size="small">
            <el-table-column prop="goodsName" label="物料名称" width="150"></el-table-column> <!-- 修复：显式闭合 -->
            <el-table-column prop="stock" label="当前库存" width="100"></el-table-column> <!-- 修复：显式闭合 -->
            <el-table-column prop="safeStock" label="安全库存" width="100"></el-table-column> <!-- 修复：显式闭合 -->
            <el-table-column prop="status" label="状态" width="100">
              <template #default="scope">
                <el-tag 
                  :type="scope.row.status === '预警' ? 'danger' : 'success'"
                >
                  {{ scope.row.status }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <span class="chart-title">今日出入库记录</span>
          </template>
          <el-table :data="inOutRecordList" border size="small">
            <el-table-column prop="time" label="操作时间" width="180"></el-table-column> <!-- 修复：显式闭合 -->
            <el-table-column prop="type" label="操作类型" width="100">
              <template #default="scope">
                <el-tag 
                  :type="scope.row.type === '入库' ? 'success' : 'primary'"
                >
                  {{ scope.row.type }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="goodsName" label="物料名称" width="150"></el-table-column> <!-- 修复：显式闭合 -->
            <el-table-column prop="num" label="数量" width="80"></el-table-column> <!-- 修复：显式闭合 -->
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域（保留原有，仅优化格式） -->
    <el-card shadow="hover">
      <template #header>
        <span class="chart-title">库位库存分布</span>
      </template>
      <EchartsChart 
        role="warehouse" 
        title="当前各库位库存数量" 
        :xAxisData="warehouseXData"
        :seriesData="warehouseYData"
      ></EchartsChart>
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
const totalStockNum = ref('835')
const totalStockTrend = ref('5.8%')
const pendingOutStockNum = ref('120')
const pendingOutStockTrend = ref('10.2%')
const warningStockNum = ref('15')
const warningStockTrend = ref('20%')
const stockTurnoverRate = ref('85%')
const stockTurnoverTrend = ref('3.5%')

// 新增：图表动态数据
const warehouseXData = ref(['库位A(生鲜)', '库位B(标品)', '库位C(大件)', '库位D(耗材)'])
const warehouseYData = ref([210, 350, 180, 95])

// 新增：仓储员专属数据列表
const stockDetailList = ref([])
const inOutRecordList = ref([])

// 新增：请求后端数据方法（核心优化：容错+超时+详细日志）
const fetchWarehouseData = async () => {
  try {
    // 优化1：添加超时配置，避免请求卡死
    const res = await axios.get('http://localhost:5000/api/get_role_data', {
      params: { role: 'warehouse' },
      timeout: 10000 // 10秒超时
    })

    // 优化2：严格判空，避免后端返回非预期格式报错
    if (!res.data || res.data.code !== 200) {
      console.warn('后端返回非预期数据：', res.data)
      return
    }

    const data = res.data.data || {} // 优化3：默认空对象，避免undefined

    // 1. 赋值核心指标
    if (data.core_indicators) {
      totalStockNum.value = data.core_indicators.total_stock_num || '835'
      totalStockTrend.value = data.core_indicators.total_stock_trend || '5.8%'
      pendingOutStockNum.value = data.core_indicators.pending_out_stock_num || '120'
      pendingOutStockTrend.value = data.core_indicators.pending_out_stock_trend || '10.2%'
      warningStockNum.value = data.core_indicators.warning_stock_num || '15'
      warningStockTrend.value = data.core_indicators.warning_stock_trend || '20%'
      stockTurnoverRate.value = data.core_indicators.stock_turnover_rate || '85%'
      stockTurnoverTrend.value = data.core_indicators.stock_turnover_trend || '3.5%'
    }

    // 2. 赋值专属数据列表（优化4：数组类型校验，避免渲染报错）
    stockDetailList.value = Array.isArray(data.stock_detail) ? data.stock_detail : []
    inOutRecordList.value = Array.isArray(data.in_out_record) ? data.in_out_record : []

    // 3. 赋值图表数据（优化5：数组类型校验）
    if (data.pie_data) {
      warehouseXData.value = Array.isArray(data.pie_data.xAxis) ? data.pie_data.xAxis : ['库位A(生鲜)', '库位B(标品)', '库位C(大件)', '库位D(耗材)']
      warehouseYData.value = Array.isArray(data.pie_data.series) ? data.pie_data.series : [210, 350, 180, 95]
    }
  } catch (err) {
    // 优化6：详细打印错误信息，定位后端500原因
    console.error('仓储员数据请求失败（使用兜底数据）：', {
      message: err.message,
      response: err.response?.data, // 后端500详情
      status: err.response?.status
    })
    // 失败仍用原有静态值，不影响页面显示
  }
}

// 新增：初始化请求
onMounted(() => {
  fetchWarehouseData()
})
</script>

<style scoped>
/* 保留所有原有样式，无修改 */
.warehouse-view {
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