<template>
  <div class="stock-monitor">
    <div class="page-header">
      <h3>库存监控预警</h3>
      <el-button type="primary" icon="Refresh" @click="fetchData">刷新库存</el-button>
    </div>

    <!-- 核心指标 -->
    <el-row :gutter="20" style="margin-bottom: 20px;">
      <el-col :span="6">
        <el-card class="data-card" shadow="hover">
          <div class="card-value">{{ totalStock }}</div>
          <div class="card-title">总库存量</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="data-card" shadow="hover">
          <div class="card-value" style="color: #f5222d;">{{ warningStockCount }}</div>
          <div class="card-title">预警物料数</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="data-card" shadow="hover">
          <div class="card-value">{{ todayReplenish }}</div>
          <div class="card-title">今日补货数</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="data-card" shadow="hover">
          <div class="card-value">{{ stockTurnover }}%</div>
          <div class="card-title">本月周转率</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 库存明细 -->
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span>库存明细（预警物料标红）</span>
          <el-select v-model="stockStatusFilter" placeholder="筛选状态" size="small" style="width: 120px;">
            <el-option label="全部" value="" />
            <el-option label="正常" value="正常" />
            <el-option label="预警" value="预警" />
            <el-option label="补货中" value="补货中" />
          </el-select>
        </div>
      </template>
      <el-table :data="filterStockList" border size="small" v-loading="loading">
        <el-table-column prop="goodsId" label="物料ID" width="80" />
        <el-table-column prop="goodsName" label="物料名称" width="150">
          <template #default="scope">
            <span :style="{ color: scope.row.status === '预警' ? '#f5222d' : '#333' }">
              {{ scope.row.goodsName }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="currentStock" label="当前库存" width="100">
          <template #default="scope">
            <span :style="{ color: scope.row.status === '预警' ? '#f5222d' : '#333', fontWeight: scope.row.status === '预警' ? '600' : 'normal' }">
              {{ scope.row.currentStock }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="safeStock" label="安全库存" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag 
              :type="scope.row.status === '预警' ? 'danger' : scope.row.status === '补货中' ? 'warning' : 'success'"
            >
              {{ scope.row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="warehouse" label="所属库位" width="120" />
        <el-table-column label="操作" width="120">
          <template #default="scope">
            <el-button 
              type="warning" 
              size="small" 
              @click="openReplenishDialog(scope.row)"
              :disabled="scope.row.status !== '预警'"
              icon="Bell"
            >
              补货提醒
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 补货提醒弹窗 -->
    <el-dialog title="补货提醒" v-model="replenishDialogVisible" width="400px">
      <el-form :model="replenishForm" label-width="80px" :rules="replenishRules" ref="replenishFormRef">
        <el-form-item label="物料名称" prop="goodsName">
          <el-input v-model="replenishForm.goodsName" disabled />
        </el-form-item>
        <el-form-item label="当前库存" prop="currentStock">
          <el-input v-model="replenishForm.currentStock" disabled />
        </el-form-item>
        <el-form-item label="安全库存" prop="safeStock">
          <el-input v-model="replenishForm.safeStock" disabled />
        </el-form-item>
        <el-form-item label="建议补货量" prop="replenishNum">
          <el-input v-model="replenishForm.replenishNum" type="number" min="1" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="replenishForm.remark" type="textarea" rows="2" placeholder="选填" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="replenishDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitReplenish">发送提醒</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useDataStore } from '../../stores/dataStore'
import { getStockData, replenishStock } from '../../api/index'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Bell } from '@element-plus/icons-vue'

// 全局状态
const dataStore = useDataStore()

// 筛选条件
const stockStatusFilter = ref('')
// 加载状态
const loading = ref(false)
// 弹窗控制
const replenishDialogVisible = ref(false)
const replenishFormRef = ref(null)

// 核心指标
const todayReplenish = ref(0)
const stockTurnover = ref(85)

// 补货表单
const replenishForm = ref({
  goodsId: '',
  goodsName: '',
  currentStock: '',
  safeStock: '',
  replenishNum: '',
  remark: ''
})

// 表单校验规则
const replenishRules = ref({
  replenishNum: [{ required: true, message: '请输入补货量', trigger: 'blur' }]
})

// 计算属性：核心指标
const totalStock = computed(() => {
  return dataStore.stockList.reduce((sum, item) => sum + item.currentStock, 0)
})

const warningStockCount = computed(() => {
  return dataStore.stockList.filter(item => item.status === '预警').length
})

// 筛选库存列表
const filterStockList = computed(() => {
  if (!stockStatusFilter.value) return dataStore.stockList
  return dataStore.stockList.filter(item => item.status === stockStatusFilter.value)
})

// 加载数据
const fetchData = async () => {
  loading.value = true
  try {
    await dataStore.fetchStockData()
    // 模拟今日补货数
    todayReplenish.value = Math.floor(Math.random() * 10) + 1
    ElMessage.success('库存数据刷新成功！')
  } catch (err) {
    ElMessage.error('库存数据加载失败：' + err.message)
  } finally {
    loading.value = false
  }
}

// 打开补货弹窗
const openReplenishDialog = (stock) => {
  replenishForm.value = {
    goodsId: stock.goodsId,
    goodsName: stock.goodsName,
    currentStock: stock.currentStock,
    safeStock: stock.safeStock,
    replenishNum: stock.safeStock - stock.currentStock,
    remark: ''
  }
  replenishDialogVisible.value = true
}

// 提交补货提醒
const submitReplenish = async () => {
  try {
    // 表单校验
    await replenishFormRef.value.validate()
    
    // 确认发送
    await ElMessageBox.confirm(
      '确认发送补货提醒？该物料状态将变为"补货中"',
      '提醒确认',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    // 调用接口
    const res = await replenishStock(replenishForm.value)
    if (res.data.code === 200) {
      // 更新物料状态
      const targetStock = dataStore.stockList.find(item => item.goodsId === replenishForm.value.goodsId)
      if (targetStock) {
        targetStock.status = '补货中'
        // 更新今日补货数
        todayReplenish.value += 1
      }
      
      ElMessage.success('补货提醒已发送！')
      replenishDialogVisible.value = false
    }
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error('发送失败：' + (err.message || '系统异常'))
    }
  }
}

// 页面加载时初始化
onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.stock-monitor {
  padding: 10px 0;
  width: 100%;
  box-sizing: border-box;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.page-header h3 {
  margin: 0;
  color: #333;
  font-size: 18px;
  font-weight: 600;
}
.data-card {
  text-align: center;
  height: 100%;
}
.card-value {
  font-size: 28px;
  font-weight: 700;
  color: #333;
  margin-bottom: 5px;
  line-height: 1.2;
}
.card-title {
  font-size: 14px;
  color: #666;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.el-table {
  --el-table-header-text-color: #666;
  --el-table-row-hover-bg-color: #f8f9fa;
}
</style>