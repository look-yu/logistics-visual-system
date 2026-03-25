<template>
  <div class="warehouse-page">
    <el-card>
      <template #header>
        <div class="filter-bar">
          <el-form :inline="true" :model="queryParams">
            <el-form-item label="时间范围">
              <el-date-picker
                v-model="queryParams.dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                @change="handleQuery"
              />
            </el-form-item>
            <el-form-item label="商品分类">
              <el-select v-model="queryParams.category" placeholder="全部" clearable @change="handleQuery">
                <el-option label="全部" value="" />
                <el-option label="生鲜" value="生鲜" />
                <el-option label="标品" value="标品" />
                <el-option label="大件" value="大件" />
                <el-option label="耗材" value="耗材" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleQuery">查询</el-button>
              <el-button type="success" @click="handleRefresh">刷新</el-button>
            </el-form-item>
          </el-form>
        </div>
      </template>

      <div v-loading="loading">
        <el-row :gutter="20" class="kpi-row">
          <el-col :span="6" v-for="(kpi, index) in kpiData" :key="index">
            <div class="kpi-card" :style="{ background: kpi.bgColor }">
              <div class="kpi-icon">
                <el-icon :size="32" :color="kpi.iconColor">
                  <component :is="kpi.icon" />
                </el-icon>
              </div>
              <div class="kpi-content">
                <div class="kpi-title">{{ kpi.title }}</div>
                <div class="kpi-value">{{ kpi.value }}</div>
                <div class="kpi-trend" :class="kpi.trendType">
                  <el-icon><component :is="kpi.trendType === 'trend-up' ? ArrowUp : ArrowDown" /></el-icon>
                  {{ kpi.trend }}
                </div>
              </div>
            </div>
          </el-col>
        </el-row>

        <el-row :gutter="20" class="chart-row">
          <el-col :span="12">
            <el-card class="chart-card">
              <template #header>
                <span>库存趋势</span>
              </template>
              <EchartsChart
                role="manager"
                chartType="line"
                title="库存趋势"
                :xAxisData="trendData.xAxis"
                :seriesData="trendData.series[0].data"
                seriesName="库存总量"
              />
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card class="chart-card">
              <template #header>
                <span>出入库对比</span>
              </template>
              <EchartsChart
                role="dispatcher"
                chartType="bar"
                title="出入库对比"
                :xAxisData="inOutData.xAxis"
                :seriesData="inOutData.series[0].data"
              />
            </el-card>
          </el-col>
        </el-row>

        <el-row :gutter="20" class="chart-row">
          <el-col :span="8">
            <el-card class="chart-card">
              <template #header>
                <span>库存分类占比</span>
              </template>
              <EchartsChart
                role="warehouse"
                chartType="pie"
                title="库存分类占比"
                :xAxisData="categoryData.map(item => item.name)"
                :seriesData="categoryData.map(item => item.value)"
              />
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card class="chart-card">
              <template #header>
                <span>库位分布</span>
              </template>
              <EchartsChart
                role="warehouse"
                chartType="pie"
                title="分类分布"
                :xAxisData="categoryData.map(item => item.name)"
                :seriesData="categoryData.map(item => item.value)"
              />
            </el-card>
          </el-col>
        </el-row>

        <el-row :gutter="20" class="chart-row">
          <el-col :span="24">
            <el-card class="table-card">
              <template #header>
                <div class="table-header">
                  <span>库存预警列表</span>
                  <el-tag type="danger">共 {{ warningList.length }} 项</el-tag>
                </div>
              </template>
              <el-table :data="warningList" border stripe>
                <el-table-column prop="goodsName" label="商品名称" width="150" />
                <el-table-column prop="category" label="分类" width="100" />
                <el-table-column prop="currentStock" label="当前库存" width="100" />
                <el-table-column prop="safeStock" label="安全库存" width="100" />
                <el-table-column prop="warehouse" label="库位" width="100" />
                <el-table-column prop="status" label="状态" width="100">
                  <template #default="{ row }">
                    <el-tag :type="getStatusType(row.status)">{{ row.status }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="stockRate" label="库存占比" width="120">
                  <template #default="{ row }">
                    <el-progress 
                      :percentage="row.stockRate" 
                      :color="getProgressColor(row.stockRate)"
                      :stroke-width="8"
                    />
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="150">
                  <template #default="{ row }">
                    <el-button link type="primary" @click="handleReplenish(row)">补货提醒</el-button>
                    <el-button link type="success" @click="handleDetail(row)">详情</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-card>
          </el-col>
        </el-row>

        <el-row :gutter="20" class="chart-row">
          <el-col :span="24">
            <el-card class="table-card">
              <template #header>
                <div class="table-header">
                  <span>今日出入库记录</span>
                  <el-tag type="info">共 {{ inOutRecordList.length }} 条</el-tag>
                </div>
              </template>
              <el-table :data="inOutRecordList" border stripe max-height="400">
                <el-table-column prop="time" label="时间" width="180" />
                <el-table-column prop="goodsName" label="商品名称" width="150" />
                <el-table-column prop="type" label="类型" width="100">
                  <template #default="{ row }">
                    <el-tag :type="row.type === '入库' ? 'success' : 'danger'">{{ row.type }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="num" label="数量" width="100">
                  <template #default="{ row }">
                    <span :style="{ color: row.type === '入库' ? '#67C23A' : '#F56C6C' }">
                      {{ row.type === '入库' ? '+' : '-' }}{{ row.num }}
                    </span>
                  </template>
                </el-table-column>
                <el-table-column prop="operator" label="操作人" width="120" />
                <el-table-column prop="reason" label="原因" />
              </el-table>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Box, ShoppingCart, Warning, ArrowUp, ArrowDown, DataLine, PieChart } from '@element-plus/icons-vue'
import axios from 'axios'
import EchartsChart from '@/components/EchartsChart.vue'

const loading = ref(false)
const queryParams = reactive({
  dateRange: [],
  category: ''
})

const kpiData = ref([
  { 
    title: '库存总值', 
    value: '¥1,234,567', 
    trend: '12.3%', 
    trendType: 'trend-up', 
    icon: Box, 
    iconColor: '#409EFF', 
    bgColor: 'rgba(64, 158, 255, 0.1)' 
  },
  { 
    title: '商品总数', 
    value: '2,345', 
    trend: '5.2%', 
    trendType: 'trend-up', 
    icon: ShoppingCart, 
    iconColor: '#67C23A', 
    bgColor: 'rgba(103, 194, 58, 0.1)' 
  },
  { 
    title: '预警商品', 
    value: '23', 
    trend: '3.1%', 
    trendType: 'trend-down', 
    icon: Warning, 
    iconColor: '#E6A23C', 
    bgColor: 'rgba(230, 162, 60, 0.1)' 
  },
  { 
    title: '今日出入库', 
    value: '156', 
    trend: '8.7%', 
    trendType: 'trend-up', 
    icon: DataLine, 
    iconColor: '#F56C6C', 
    bgColor: 'rgba(245, 108, 108, 0.1)' 
  }
])

const trendData = ref({
  xAxis: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
  series: [
    {
      name: '库存总量',
      data: [1200, 1320, 1010, 1340, 1290, 1330, 1320]
    }
  ]
})

const inOutData = ref({
  xAxis: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
  series: [
    {
      name: '入库',
      data: [120, 132, 101, 134, 90, 230, 210]
    },
    {
      name: '出库',
      data: [80, 102, 91, 94, 80, 150, 140]
    }
  ]
})

const categoryData = ref([
  { name: '生鲜', value: 435, color: '#F56C6C' },
  { name: '标品', value: 310, color: '#409EFF' },
  { name: '大件', value: 245, color: '#67C23A' },
  { name: '耗材', value: 155, color: '#E6A23C' }
])

const warningList = ref([
  { goodsName: '生鲜-蔬菜', category: '生鲜', currentStock: 30, safeStock: 100, warehouse: '库位A', status: '预警', stockRate: 30 },
  { goodsName: '生鲜-水果', category: '生鲜', currentStock: 15, safeStock: 80, warehouse: '库位A', status: '缺货', stockRate: 19 },
  { goodsName: '标品-日用品', category: '标品', currentStock: 45, safeStock: 50, warehouse: '库位B', status: '预警', stockRate: 90 },
  { goodsName: '大件-家电', category: '大件', currentStock: 20, safeStock: 50, warehouse: '库位C', status: '缺货', stockRate: 40 },
  { goodsName: '耗材-包装', category: '耗材', currentStock: 80, safeStock: 200, warehouse: '库位D', status: '缺货', stockRate: 40 }
])

const inOutRecordList = ref([
  { time: '2026-03-23 10:00', goodsName: '生鲜-蔬菜', type: '入库', num: 50, operator: '张三', reason: '采购入库' },
  { time: '2026-03-23 09:30', goodsName: '标品-日用品', type: '出库', num: 20, operator: '李四', reason: '销售出库' },
  { time: '2026-03-23 08:15', goodsName: '大件-家电', type: '入库', num: 30, operator: '王五', reason: '调拨入库' },
  { time: '2026-03-23 07:00', goodsName: '耗材-包装', type: '出库', num: 15, operator: '赵六', reason: '报损出库' }
])

const getStatusType = (status) => {
  const typeMap = {
    '正常': 'success',
    '预警': 'warning',
    '缺货': 'danger',
    '补货中': 'info'
  }
  return typeMap[status] || 'info'
}

const getProgressColor = (rate) => {
  if (rate >= 100) return '#67C23A'
  if (rate >= 50) return '#E6A23C'
  return '#F56C6C'
}

const handleQuery = async () => {
  loading.value = true
  try {
    await fetchData()
  } catch (error) {
    ElMessage.error('查询失败')
  } finally {
    loading.value = false
  }
}

const handleRefresh = async () => {
  loading.value = true
  try {
    await fetchData()
    ElMessage.success('刷新成功')
  } catch (error) {
    ElMessage.error('刷新失败')
  } finally {
    loading.value = false
  }
}

const handleReplenish = (row) => {
  ElMessage.success(`已发送补货提醒：${row.goodsName}`)
}

const handleDetail = (row) => {
  ElMessage.info(`查看商品详情：${row.goodsName}`)
}

const fetchData = async () => {
  try {
    const res = await axios.get('http://localhost:5001/api/warehouse/stock', {
      params: queryParams
    })
    if (res.data && res.data.code === 200) {
      const data = res.data.data || {}
      if (data.goods) {
        warningList.value = data.goods.map(item => ({
          goodsName: item.goodsName,
          category: item.goodsName.split('-')[0] || '其他',
          currentStock: item.currentStock,
          safeStock: item.safeStock,
          warehouse: item.warehouse,
          status: item.status,
          stockRate: Math.round((item.currentStock / item.safeStock) * 100)
        }))
      }
      if (data.inOutRecord) {
        inOutRecordList.value = data.inOutRecord
      }
    }
  } catch (error) {
    console.error('获取仓储数据失败:', error)
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.warehouse-page {
  padding: 20px;
}

.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.kpi-row {
  margin-bottom: 20px;
}

.kpi-card {
  display: flex;
  align-items: center;
  padding: 20px;
  border-radius: 8px;
  transition: all 0.3s;
}

.kpi-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.kpi-icon {
  margin-right: 20px;
}

.kpi-content {
  flex: 1;
}

.kpi-title {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.kpi-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 8px;
}

.kpi-trend {
  display: flex;
  align-items: center;
  font-size: 14px;
}

.kpi-trend.trend-up {
  color: #67C23A;
}

.kpi-trend.trend-down {
  color: #F56C6C;
}

.chart-row {
  margin-bottom: 20px;
}

.chart-card {
  height: 400px;
}

.table-card {
  margin-bottom: 20px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
