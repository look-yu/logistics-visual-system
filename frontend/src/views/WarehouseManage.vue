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
            <el-form-item label="货物分类">
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
          <el-col :span="8" v-for="(kpi, index) in kpiData" :key="index">
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
          <el-col :span="24">
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
        </el-row>

        <el-row :gutter="20" class="chart-row">
          <el-col :span="24">
            <el-card class="table-card">
              <template #header>
                <div class="table-header">
                  <span>货物出入库数量总记录</span>
                  <el-tag type="info">共 {{ inOutRecordList.length }} 条</el-tag>
                </div>
              </template>
              <el-table :data="inOutRecordList" border stripe max-height="400">
                <el-table-column prop="time" label="时间" width="180" />
                <el-table-column prop="goodsName" label="货物名称" width="150" />
                <el-table-column prop="type" label="类型" width="150">
                  <template #default="{ row }">
                    <el-tag :type="row.type === '订单入库' ? 'success' : 'danger'">{{ row.type }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="num" label="数量" width="100">
                  <template #default="{ row }">
                    <span :style="{ color: row.type === '订单入库' ? '#67C23A' : '#F56C6C' }">
                      {{ row.type === '订单入库' ? '+' : '-' }}{{ row.num }}
                    </span>
                  </template>
                </el-table-column>
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
    value: '¥0.00', 
    trend: '0%', 
    trendType: 'trend-up', 
    icon: Box, 
    iconColor: '#409EFF', 
    bgColor: 'rgba(64, 158, 255, 0.1)' 
  },
  { 
    title: '货物总数', 
    value: '15', 
    trend: '0%', 
    trendType: 'trend-up', 
    icon: ShoppingCart, 
    iconColor: '#67C23A', 
    bgColor: 'rgba(103, 194, 58, 0.1)' 
  },
  { 
    title: '出入库记录', 
    value: '4', 
    trend: '0%', 
    trendType: 'trend-up', 
    icon: DataLine, 
    iconColor: '#F56C6C', 
    bgColor: 'rgba(245, 108, 108, 0.1)' 
  }
])

const categoryData = ref([])

const warningList = ref([])

const inOutRecordList = ref([
  { time: '2026-03-23 10:00', goodsName: '生鲜-蔬菜', type: '订单入库', num: 50, operator: '张三', reason: '采购入库' },
  { time: '2026-03-23 09:30', goodsName: '标品-日用品', type: '处理运输中', num: 20, operator: '李四', reason: '销售出库' },
  { time: '2026-03-23 08:15', goodsName: '大件-家电', type: '订单入库', num: 30, operator: '王五', reason: '调拨入库' },
  { time: '2026-03-23 07:00', goodsName: '耗材-包装', type: '处理运输中', num: 15, operator: '赵六', reason: '报损出库' }
])

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

const fetchData = async () => {
  try {
    const res = await axios.get('http://localhost:5001/api/warehouse/stock', {
      params: queryParams
    })
    if (res.data && res.data.code === 200) {
      const data = res.data.data || {}
      if (data.inOutRecord) {
        inOutRecordList.value = data.inOutRecord.map(item => ({
          time: item.time,
          goodsName: item.goodsName,
          type: item.type === '入库' ? '订单入库' : '处理运输中',
          num: item.num,
          operator: item.operator,
          reason: item.reason
        }))
      }
    }

    const statsRes = await axios.get('http://localhost:5001/api/warehouse/stats')
    if (statsRes.data && statsRes.data.code === 200) {
      const stats = statsRes.data.data || {}
      kpiData.value[0].value = `¥${parseFloat(stats.totalValue || 0).toLocaleString()}`
      kpiData.value[1].value = (parseInt(stats.totalGoods || 0)).toLocaleString()
      kpiData.value[2].value = (parseInt(stats.todayInbound || 0) + parseInt(stats.todayOutbound || 0)).toLocaleString()
      
      if (stats.orderTypeStats && stats.orderTypeStats.length > 0) {
        categoryData.value = stats.orderTypeStats.map(item => ({
          name: item.name,
          value: item.value
        }))
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
