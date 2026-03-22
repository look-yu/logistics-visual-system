<template>
  <div class="inbound-outbound-manage">
    <el-row :gutter="20">
      <el-col :span="16">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>出入库记录</span>
              <el-button type="primary" size="small" @click="openAddDialog">新增记录</el-button>
            </div>
          </template>

          <div class="search-bar">
            <el-form :inline="true" :model="queryParams">
              <el-form-item label="记录类型">
                <el-select v-model="queryParams.record_type" placeholder="全部类型" clearable style="width: 120px">
                  <el-option label="入库" value="inbound" />
                  <el-option label="出库" value="outbound" />
                </el-select>
              </el-form-item>
              <el-form-item label="状态">
                <el-select v-model="queryParams.status" placeholder="全部状态" clearable style="width: 120px">
                  <el-option label="待处理" value="pending" />
                  <el-option label="处理中" value="processing" />
                  <el-option label="已完成" value="completed" />
                  <el-option label="已取消" value="cancelled" />
                </el-select>
              </el-form-item>
              <el-form-item label="记录编号">
                <el-input v-model="queryParams.record_no" placeholder="输入记录编号" clearable style="width: 180px" />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="handleQuery">查询</el-button>
                <el-button @click="resetQuery">重置</el-button>
              </el-form-item>
            </el-form>
          </div>

          <el-table :data="recordList" border stripe v-loading="loading" height="400">
            <el-table-column prop="record_no" label="记录编号" width="140" />
            <el-table-column prop="record_type" label="类型" width="80">
              <template #default="{ row }">
                <el-tag :type="row.record_type === 'inbound' ? 'success' : 'warning'">
                  {{ row.record_type === 'inbound' ? '入库' : '出库' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="goods_name" label="货物名称" width="150" />
            <el-table-column prop="goods_type" label="货物类型" width="100" />
            <el-table-column prop="quantity" label="数量" width="80" />
            <el-table-column prop="unit" label="单位" width="60" />
            <el-table-column prop="weight" label="重量" width="80">
              <template #default="{ row }">{{ row.weight }}kg</template>
            </el-table-column>
            <el-table-column prop="warehouse_name" label="仓库名称" width="120" />
            <el-table-column prop="operator" label="操作员" width="80" />
            <el-table-column prop="status" label="状态" width="90">
              <template #default="{ row }">
                <el-tag :type="statusTypeMap[row.status]">{{ statusNameMap[row.status] }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="create_time" label="创建时间" width="160" />
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" @click="handleDetail(row)">详情</el-button>
                <el-button link type="danger" @click="handleDelete(row.id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination-container">
            <el-pagination
              v-model:current-page="queryParams.page"
              :total="recordTotal"
              layout="total, prev, pager, next"
              @current-change="handleQuery"
            />
          </div>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card shadow="hover" style="margin-bottom: 20px;">
          <template #header>
            <span>出入库统计</span>
          </template>
          <div class="chart-container" style="height: 300px;">
            <EchartsChart 
              role="warehouse" 
              title="出入库统计" 
              :xAxisData="chartXAxisData"
              :seriesData="chartSeriesData"
            />
          </div>
        </el-card>

        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>运输队列</span>
              <el-button type="primary" size="small" @click="openQueueAddDialog">新增队列</el-button>
            </div>
          </template>

          <div class="search-bar">
            <el-form :inline="true" :model="queueQueryParams">
              <el-form-item label="状态">
                <el-select v-model="queueQueryParams.status" placeholder="全部状态" clearable style="width: 120px">
                  <el-option label="等待中" value="waiting" />
                  <el-option label="已分配" value="assigned" />
                  <el-option label="运输中" value="in_transit" />
                  <el-option label="已完成" value="completed" />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="handleQueueQuery">查询</el-button>
              </el-form-item>
            </el-form>
          </div>

          <el-table :data="queueList" border stripe v-loading="queueLoading" height="300">
            <el-table-column prop="queue_no" label="队列编号" width="120" />
            <el-table-column prop="goods_name" label="货物名称" width="120" />
            <el-table-column prop="priority" label="优先级" width="80">
              <template #default="{ row }">
                <el-tag :type="priorityTypeMap[row.priority]">{{ priorityNameMap[row.priority] }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="90">
              <template #default="{ row }">
                <el-tag :type="queueStatusTypeMap[row.status]">{{ queueStatusNameMap[row.status] }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="driver_name" label="司机" width="80" />
            <el-table-column prop="vehicle_no" label="车牌号" width="100" />
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" @click="handleQueueDetail(row)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination-container">
            <el-pagination
              v-model:current-page="queueQueryParams.page"
              :total="queueTotal"
              layout="total, prev, pager, next"
              @current-change="handleQueueQuery"
            />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="showAddDialog" title="新增出入库记录" width="600px">
      <el-form :model="recordForm" :rules="recordRules" ref="recordFormRef" label-width="120px">
        <el-form-item label="记录类型" prop="record_type">
          <el-radio-group v-model="recordForm.record_type">
            <el-radio value="inbound">入库</el-radio>
            <el-radio value="outbound">出库</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="关联订单" prop="order_no">
          <el-input v-model="recordForm.order_no" placeholder="请输入订单号" />
        </el-form-item>
        <el-form-item label="货物名称" prop="goods_name">
          <el-input v-model="recordForm.goods_name" placeholder="请输入货物名称" />
        </el-form-item>
        <el-form-item label="货物类型" prop="goods_type">
          <el-select v-model="recordForm.goods_type" placeholder="请选择货物类型" style="width: 100%">
            <el-option label="普通货物" value="普通货物" />
            <el-option label="生鲜食品" value="生鲜食品" />
            <el-option label="电子产品" value="电子产品" />
            <el-option label="危险品" value="危险品" />
            <el-option label="贵重物品" value="贵重物品" />
          </el-select>
        </el-form-item>
        <el-form-item label="数量" prop="quantity">
          <el-input-number v-model="recordForm.quantity" :min="0.01" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="单位" prop="unit">
          <el-input v-model="recordForm.unit" placeholder="件/箱/桶等" />
        </el-form-item>
        <el-form-item label="重量" prop="weight">
          <el-input-number v-model="recordForm.weight" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="仓库名称" prop="warehouse_name">
          <el-input v-model="recordForm.warehouse_name" placeholder="请输入仓库名称" />
        </el-form-item>
        <el-form-item label="仓库位置" prop="warehouse_location">
          <el-input v-model="recordForm.warehouse_location" placeholder="请输入仓库位置" />
        </el-form-item>
        <el-form-item label="操作员" prop="operator">
          <el-input v-model="recordForm.operator" placeholder="请输入操作员" />
        </el-form-item>
        <el-form-item label="车牌号" prop="vehicle_no">
          <el-input v-model="recordForm.vehicle_no" placeholder="请输入车牌号" />
        </el-form-item>
        <el-form-item label="司机姓名" prop="driver_name">
          <el-input v-model="recordForm.driver_name" placeholder="请输入司机姓名" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="recordForm.remark" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="submitRecord" :loading="submitLoading">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showDetailDialog" title="出入库记录详情" width="600px">
      <el-descriptions :column="2" border v-if="currentRecord">
        <el-descriptions-item label="记录编号">{{ currentRecord.record_no }}</el-descriptions-item>
        <el-descriptions-item label="类型">
          <el-tag :type="currentRecord.record_type === 'inbound' ? 'success' : 'warning'">
            {{ currentRecord.record_type === 'inbound' ? '入库' : '出库' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="关联订单">{{ currentRecord.order_no || '-' }}</el-descriptions-item>
        <el-descriptions-item label="货物名称">{{ currentRecord.goods_name }}</el-descriptions-item>
        <el-descriptions-item label="货物类型">{{ currentRecord.goods_type }}</el-descriptions-item>
        <el-descriptions-item label="数量">{{ currentRecord.quantity }} {{ currentRecord.unit }}</el-descriptions-item>
        <el-descriptions-item label="重量">{{ currentRecord.weight }}kg</el-descriptions-item>
        <el-descriptions-item label="仓库名称">{{ currentRecord.warehouse_name }}</el-descriptions-item>
        <el-descriptions-item label="仓库位置">{{ currentRecord.warehouse_location }}</el-descriptions-item>
        <el-descriptions-item label="操作员">{{ currentRecord.operator }}</el-descriptions-item>
        <el-descriptions-item label="车牌号">{{ currentRecord.vehicle_no }}</el-descriptions-item>
        <el-descriptions-item label="司机姓名">{{ currentRecord.driver_name }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="statusTypeMap[currentRecord.status]">{{ statusNameMap[currentRecord.status] }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatDate(currentRecord.create_time) }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ currentRecord.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button type="primary" @click="showDetailDialog = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showQueueAddDialog" title="新增运输队列" width="600px">
      <el-form :model="queueForm" :rules="queueRules" ref="queueFormRef" label-width="120px">
        <el-form-item label="队列编号" prop="queue_no">
          <el-input v-model="queueForm.queue_no" placeholder="自动生成" disabled />
        </el-form-item>
        <el-form-item label="关联订单" prop="order_no">
          <el-input v-model="queueForm.order_no" placeholder="请输入订单号" />
        </el-form-item>
        <el-form-item label="优先级" prop="priority">
          <el-radio-group v-model="queueForm.priority">
            <el-radio value="high">高</el-radio>
            <el-radio value="normal">中</el-radio>
            <el-radio value="low">低</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="货物名称" prop="goods_name">
          <el-input v-model="queueForm.goods_name" placeholder="请输入货物名称" />
        </el-form-item>
        <el-form-item label="货物类型" prop="goods_type">
          <el-select v-model="queueForm.goods_type" placeholder="请选择货物类型" style="width: 100%">
            <el-option label="普通货物" value="普通货物" />
            <el-option label="生鲜食品" value="生鲜食品" />
            <el-option label="电子产品" value="电子产品" />
            <el-option label="危险品" value="危险品" />
            <el-option label="贵重物品" value="贵重物品" />
          </el-select>
        </el-form-item>
        <el-form-item label="数量" prop="quantity">
          <el-input-number v-model="queueForm.quantity" :min="0.01" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="重量" prop="weight">
          <el-input-number v-model="queueForm.weight" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="发货地址" prop="sender_address">
          <el-input v-model="queueForm.sender_address" placeholder="请输入发货地址" />
        </el-form-item>
        <el-form-item label="收货地址" prop="receiver_address">
          <el-input v-model="queueForm.receiver_address" placeholder="请输入收货地址" />
        </el-form-item>
        <el-form-item label="司机ID" prop="driver_id">
          <el-input-number v-model="queueForm.driver_id" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="司机姓名" prop="driver_name">
          <el-input v-model="queueForm.driver_name" placeholder="请输入司机姓名" />
        </el-form-item>
        <el-form-item label="车牌号" prop="vehicle_no">
          <el-input v-model="queueForm.vehicle_no" placeholder="请输入车牌号" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showQueueAddDialog = false">取消</el-button>
        <el-button type="primary" @click="submitQueue" :loading="queueSubmitLoading">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import EchartsChart from '../components/EchartsChart.vue'

const API_BASE = 'http://localhost:5001/api'

const loading = ref(false)
const queueLoading = ref(false)
const submitLoading = ref(false)
const queueSubmitLoading = ref(false)
const showAddDialog = ref(false)
const showDetailDialog = ref(false)
const showQueueAddDialog = ref(false)
const recordList = ref([])
const queueList = ref([])
const recordTotal = ref(0)
const queueTotal = ref(0)
const currentRecord = ref(null)
const recordFormRef = ref(null)
const queueFormRef = ref(null)

const queryParams = reactive({ page: 1, size: 10, record_type: '', status: '', record_no: '' })
const queueQueryParams = reactive({ page: 1, size: 10, status: '' })

const recordForm = reactive({
  record_type: 'inbound',
  order_no: '',
  goods_name: '',
  goods_type: '普通货物',
  quantity: 1.0,
  unit: '件',
  weight: 0.0,
  warehouse_name: '',
  warehouse_location: '',
  operator: '',
  vehicle_no: '',
  driver_name: '',
  remark: ''
})

const queueForm = reactive({
  queue_no: '',
  order_no: '',
  priority: 'normal',
  goods_name: '',
  goods_type: '普通货物',
  quantity: 1.0,
  weight: 0.0,
  sender_address: '',
  receiver_address: '',
  driver_id: null,
  driver_name: '',
  vehicle_no: ''
})

const statusNameMap = { pending: '待处理', processing: '处理中', completed: '已完成', cancelled: '已取消' }
const statusTypeMap = { pending: 'info', processing: 'warning', completed: 'success', cancelled: 'danger' }
const priorityNameMap = { high: '高', normal: '中', low: '低' }
const priorityTypeMap = { high: 'danger', normal: 'primary', low: 'info' }
const queueStatusNameMap = { waiting: '等待中', assigned: '已分配', in_transit: '运输中', completed: '已完成', cancelled: '已取消' }
const queueStatusTypeMap = { waiting: 'info', assigned: 'primary', in_transit: 'warning', completed: 'success', cancelled: 'danger' }

const recordRules = {
  record_type: [{ required: true, message: '请选择记录类型', trigger: 'change' }],
  goods_name: [{ required: true, message: '请输入货物名称', trigger: 'blur' }],
  goods_type: [{ required: true, message: '请选择货物类型', trigger: 'change' }],
  quantity: [{ required: true, message: '请输入数量', trigger: 'blur' }],
  unit: [{ required: true, message: '请输入单位', trigger: 'blur' }],
  warehouse_name: [{ required: true, message: '请输入仓库名称', trigger: 'blur' }],
  operator: [{ required: true, message: '请输入操作员', trigger: 'blur' }]
}

const queueRules = {
  order_no: [{ required: true, message: '请输入订单号', trigger: 'blur' }],
  priority: [{ required: true, message: '请选择优先级', trigger: 'change' }],
  goods_name: [{ required: true, message: '请输入货物名称', trigger: 'blur' }],
  goods_type: [{ required: true, message: '请选择货物类型', trigger: 'change' }],
  quantity: [{ required: true, message: '请输入数量', trigger: 'blur' }],
  sender_address: [{ required: true, message: '请输入发货地址', trigger: 'blur' }],
  receiver_address: [{ required: true, message: '请输入收货地址', trigger: 'blur' }]
}

const chartXAxisData = ref(['已完成', '处理中', '待处理', '已取消'])
const chartSeriesData = ref([1048, 735, 580, 120])

const handleQuery = async () => {
  loading.value = true
  try {
    const res = await axios.get(`${API_BASE}/inbound-outbound`, { params: queryParams })
    recordList.value = res.data.data.list
    recordTotal.value = res.data.data.total
    
    const statsRes = await axios.get(`${API_BASE}/inbound-outbound/stats`)
    if (statsRes.data.code === 200 && statsRes.data.data) {
      const stats = statsRes.data.data
      chartXAxisData.value = ['已完成', '处理中', '待处理', '已取消']
      chartSeriesData.value = [
        stats.completed || 0,
        stats.processing || 0,
        stats.pending || 0,
        stats.cancelled || 0
      ]
    }
  } catch (err) {
    ElMessage.error('获取出入库记录失败')
  }
  loading.value = false
}

const resetQuery = () => {
  queryParams.record_type = ''
  queryParams.status = ''
  queryParams.record_no = ''
  handleQuery()
}

const handleQueueQuery = async () => {
  queueLoading.value = true
  try {
    const res = await axios.get(`${API_BASE}/transport-queue`, { params: queueQueryParams })
    queueList.value = res.data.data.list
    queueTotal.value = res.data.data.total
  } catch (err) {
    ElMessage.error('获取运输队列失败')
  }
  queueLoading.value = false
}

const openAddDialog = () => {
  showAddDialog.value = true
}

const openQueueAddDialog = () => {
  queueForm.queue_no = `Q${Date.now()}`
  showQueueAddDialog.value = true
}

const handleDetail = (row) => {
  currentRecord.value = row
  showDetailDialog.value = true
}

const handleQueueDetail = (row) => {
  ElMessageBox.alert(`
    队列编号：${row.queue_no}
    订单号：${row.order_no}
    货物名称：${row.goods_name}
    优先级：${priorityNameMap[row.priority]}
    状态：${queueStatusNameMap[row.status]}
    司机：${row.driver_name || '-'}
    车牌号：${row.vehicle_no || '-'}
  `, '运输队列详情')
}

const handleDelete = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除这条记录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await axios.delete(`${API_BASE}/inbound-outbound/${id}`)
    ElMessage.success('删除成功')
    handleQuery()
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const submitRecord = async () => {
  if (!recordFormRef.value) return
  
  await recordFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    submitLoading.value = true
    try {
      recordForm.record_no = recordForm.record_type === 'inbound' ? `IN${Date.now()}` : `OUT${Date.now()}`
      await axios.post(`${API_BASE}/inbound-outbound`, recordForm)
      ElMessage.success('添加成功')
      showAddDialog.value = false
      resetRecordForm()
      handleQuery()
    } catch (err) {
      ElMessage.error('添加失败')
    }
    submitLoading.value = false
  })
}

const submitQueue = async () => {
  if (!queueFormRef.value) return
  
  await queueFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    queueSubmitLoading.value = true
    try {
      await axios.post(`${API_BASE}/transport-queue`, queueForm)
      ElMessage.success('添加成功')
      showQueueAddDialog.value = false
      resetQueueForm()
      handleQueueQuery()
    } catch (err) {
      ElMessage.error('添加失败')
    }
    queueSubmitLoading.value = false
  })
}

const resetRecordForm = () => {
  recordForm.record_type = 'inbound'
  recordForm.order_no = ''
  recordForm.goods_name = ''
  recordForm.goods_type = '普通货物'
  recordForm.quantity = 1.0
  recordForm.unit = '件'
  recordForm.weight = 0.0
  recordForm.warehouse_name = ''
  recordForm.warehouse_location = ''
  recordForm.operator = ''
  recordForm.vehicle_no = ''
  recordForm.driver_name = ''
  recordForm.remark = ''
}

const resetQueueForm = () => {
  queueForm.queue_no = ''
  queueForm.order_no = ''
  queueForm.priority = 'normal'
  queueForm.goods_name = ''
  queueForm.goods_type = '普通货物'
  queueForm.quantity = 1.0
  queueForm.weight = 0.0
  queueForm.sender_address = ''
  queueForm.receiver_address = ''
  queueForm.driver_id = null
  queueForm.driver_name = ''
  queueForm.vehicle_no = ''
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}

onMounted(() => {
  handleQuery()
  handleQueueQuery()
})
</script>

<style scoped>
.inbound-outbound-manage { padding: 20px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.search-bar { margin-bottom: 20px; padding: 15px; background: #f5f7fa; border-radius: 4px; }
.pagination-container { margin-top: 20px; display: flex; justify-content: flex-end; }
.chart-container { width: 100%; }
</style>
