<template>
  <div class="shipment-plan-page">
    <el-card>
      <template #header>
        <div class="filter-bar">
          <el-form :inline="true" :model="queryParams">
            <el-form-item label="计划名称">
              <el-input v-model="queryParams.keyword" placeholder="输入名称或编号" clearable />
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="queryParams.status" placeholder="全部状态" clearable style="width: 150px">
                <el-option label="草稿" value="draft" />
                <el-option label="已确认" value="confirmed" />
                <el-option label="运输中" value="in_transit" />
                <el-option label="已完成" value="completed" />
                <el-option label="已取消" value="cancelled" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleQuery">查询</el-button>
              <el-button type="success" @click="openAddDialog">新增计划</el-button>
            </el-form-item>
          </el-form>
        </div>
      </template>

      <el-table :data="planList" border stripe v-loading="loading">
        <el-table-column prop="plan_no" label="计划编号" width="120" />
        <el-table-column prop="plan_name" label="计划名称" width="180" />
        <el-table-column prop="customer_name" label="客户名称" width="120" />
        <el-table-column prop="goods_name" label="货物名称" width="150" />
        <el-table-column prop="goods_quantity" label="数量" width="80" />
        <el-table-column prop="goods_weight" label="重量(吨)" width="90" />
        <el-table-column prop="goods_volume" label="体积(立方米)" width="100" />
        <el-table-column prop="pickup_address" label="提货地址" width="150" show-overflow-tooltip />
        <el-table-column prop="delivery_address" label="送货地址" width="150" show-overflow-tooltip />
        <el-table-column prop="pickup_date" label="提货日期" width="110" />
        <el-table-column prop="delivery_date" label="送达日期" width="110" />
        <el-table-column prop="driver_name" label="司机" width="100" />
        <el-table-column prop="car_no" label="车辆" width="100" />
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="statusTypeMap[row.status]">{{ statusNameMap[row.status] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="progress" label="进度" width="100">
          <template #default="{ row }">
            <el-progress :percentage="row.progress" :status="getProgressStatus(row)" />
          </template>
        </el-table-column>
        <el-table-column prop="estimated_cost" label="预估成本" width="100">
          <template #default="{ row }">
            ¥{{ row.estimated_cost ? row.estimated_cost.toFixed(2) : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="350" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleDetail(row)">详情</el-button>
            <el-button link type="success" @click="handleEdit(row)" v-if="row.status === 'draft'">编辑</el-button>
            <el-button link type="warning" @click="handleConfirm(row)" v-if="row.status === 'draft'">确认</el-button>
            <el-button link type="primary" @click="handleStart(row)" v-if="row.status === 'confirmed'">开始</el-button>
            <el-button link type="success" @click="handleComplete(row)" v-if="row.status === 'in_transit'">完成</el-button>
            <el-button link type="danger" @click="handleDelete(row)" v-if="row.status === 'draft'">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="queryParams.page"
          v-model:page-size="queryParams.pageSize"
          :total="total"
          layout="total, prev, pager, next"
          @current-change="handleQuery"
          @size-change="handleQuery"
        />
      </div>
    </el-card>

    <el-dialog v-model="showAddDialog" :title="isEdit ? '编辑计划' : '新增计划'" width="800px">
      <el-form :model="planForm" :rules="rules" ref="formRef" label-width="120px">
        <el-divider content-position="left">基本信息</el-divider>
        <el-form-item label="计划名称" prop="plan_name">
          <el-input v-model="planForm.plan_name" placeholder="请输入计划名称" />
        </el-form-item>
        <el-form-item label="客户" prop="customer_id">
          <el-select v-model="planForm.customer_id" placeholder="请选择客户" style="width: 100%" filterable>
            <el-option
              v-for="customer in customerList"
              :key="customer.id"
              :label="customer.customer_name"
              :value="customer.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="关联订单" prop="order_id">
          <el-select v-model="planForm.order_id" placeholder="请选择订单" style="width: 100%" clearable filterable>
            <el-option
              v-for="order in orderList"
              :key="order.id"
              :label="order.order_no"
              :value="order.id"
            />
          </el-select>
        </el-form-item>
        <el-divider content-position="left">货物信息</el-divider>
        <el-form-item label="货物类型" prop="goods_type">
          <el-input v-model="planForm.goods_type" placeholder="请输入货物类型" />
        </el-form-item>
        <el-form-item label="货物名称" prop="goods_name">
          <el-input v-model="planForm.goods_name" placeholder="请输入货物名称" />
        </el-form-item>
        <el-form-item label="货物数量" prop="goods_quantity">
          <el-input-number v-model="planForm.goods_quantity" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="货物重量(吨)" prop="goods_weight">
          <el-input-number v-model="planForm.goods_weight" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="货物体积(立方米)" prop="goods_volume">
          <el-input-number v-model="planForm.goods_volume" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-divider content-position="left">运输信息</el-divider>
        <el-form-item label="提货地址" prop="pickup_address">
          <el-input v-model="planForm.pickup_address" placeholder="请输入提货地址" />
        </el-form-item>
        <el-form-item label="送货地址" prop="delivery_address">
          <el-input v-model="planForm.delivery_address" placeholder="请输入送货地址" />
        </el-form-item>
        <el-form-item label="提货日期" prop="pickup_date">
          <el-date-picker v-model="planForm.pickup_date" type="date" placeholder="选择提货日期" style="width: 100%" />
        </el-form-item>
        <el-form-item label="送达日期" prop="delivery_date">
          <el-date-picker v-model="planForm.delivery_date" type="date" placeholder="选择送达日期" style="width: 100%" />
        </el-form-item>
        <el-form-item label="运输方式" prop="transport_mode">
          <el-select v-model="planForm.transport_mode" placeholder="请选择运输方式" style="width: 100%">
            <el-option label="公路" value="road" />
            <el-option label="铁路" value="rail" />
            <el-option label="航空" value="air" />
            <el-option label="海运" value="sea" />
          </el-select>
        </el-form-item>
        <el-form-item label="车辆类型" prop="vehicle_type">
          <el-input v-model="planForm.vehicle_type" placeholder="请输入车辆类型" />
        </el-form-item>
        <el-form-item label="司机" prop="driver_id">
          <el-select v-model="planForm.driver_id" placeholder="请选择司机" style="width: 100%" clearable filterable>
            <el-option
              v-for="driver in driverList"
              :key="driver.id"
              :label="driver.driver_name"
              :value="driver.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="预估成本" prop="estimated_cost">
          <el-input-number v-model="planForm.estimated_cost" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="特殊要求" prop="special_requirements">
          <el-input v-model="planForm.special_requirements" type="textarea" :rows="3" placeholder="请输入特殊要求" />
        </el-form-item>
        <el-form-item label="备注" prop="remarks">
          <el-input v-model="planForm.remarks" type="textarea" :rows="2" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showDetailDialog" title="计划详情" width="900px">
      <el-descriptions :column="2" border v-if="currentPlan">
        <el-descriptions-item label="计划编号">{{ currentPlan.plan_no }}</el-descriptions-item>
        <el-descriptions-item label="计划名称">{{ currentPlan.plan_name }}</el-descriptions-item>
        <el-descriptions-item label="客户名称">{{ currentPlan.customer_name }}</el-descriptions-item>
        <el-descriptions-item label="联系人">{{ currentPlan.contact_person }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ currentPlan.contact_phone }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="statusTypeMap[currentPlan.status]">{{ statusNameMap[currentPlan.status] }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="货物类型">{{ currentPlan.goods_type }}</el-descriptions-item>
        <el-descriptions-item label="货物名称">{{ currentPlan.goods_name }}</el-descriptions-item>
        <el-descriptions-item label="货物数量">{{ currentPlan.goods_quantity }}</el-descriptions-item>
        <el-descriptions-item label="货物重量">{{ currentPlan.goods_weight }} 吨</el-descriptions-item>
        <el-descriptions-item label="货物体积">{{ currentPlan.goods_volume }} 立方米</el-descriptions-item>
        <el-descriptions-item label="提货地址" :span="2">{{ currentPlan.pickup_address }}</el-descriptions-item>
        <el-descriptions-item label="送货地址" :span="2">{{ currentPlan.delivery_address }}</el-descriptions-item>
        <el-descriptions-item label="提货日期">{{ currentPlan.pickup_date }}</el-descriptions-item>
        <el-descriptions-item label="送达日期">{{ currentPlan.delivery_date }}</el-descriptions-item>
        <el-descriptions-item label="运输方式">{{ transportModeNameMap[currentPlan.transport_mode] }}</el-descriptions-item>
        <el-descriptions-item label="车辆类型">{{ currentPlan.vehicle_type || '-' }}</el-descriptions-item>
        <el-descriptions-item label="司机">{{ currentPlan.driver_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="车辆">{{ currentPlan.car_no || '-' }}</el-descriptions-item>
        <el-descriptions-item label="预估成本">¥{{ currentPlan.estimated_cost ? currentPlan.estimated_cost.toFixed(2) : '-' }}</el-descriptions-item>
        <el-descriptions-item label="实际成本">¥{{ currentPlan.actual_cost ? currentPlan.actual_cost.toFixed(2) : '-' }}</el-descriptions-item>
        <el-descriptions-item label="进度" :span="2">
          <el-progress :percentage="currentPlan.progress" :status="getProgressStatus(currentPlan)" />
        </el-descriptions-item>
        <el-descriptions-item label="特殊要求" :span="2">{{ currentPlan.special_requirements || '-' }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ currentPlan.remarks || '-' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间" :span="2">{{ currentPlan.create_time }}</el-descriptions-item>
      </el-descriptions>

      <el-divider content-position="left">运输任务</el-divider>
      <el-table :data="currentPlan.tasks || []" border stripe size="small" max-height="200">
        <el-table-column prop="task_no" label="任务编号" width="120" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="start_time" label="开始时间" width="150" />
        <el-table-column prop="end_time" label="结束时间" width="150" />
        <el-table-column prop="cost" label="费用" width="100" />
      </el-table>

      <template #footer>
        <el-button type="primary" @click="showDetailDialog = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showCompleteDialog" title="完成装运" width="500px">
      <el-form :model="completeForm" :rules="completeRules" ref="completeFormRef" label-width="120px">
        <el-form-item label="实际成本" prop="actual_cost">
          <el-input-number v-model="completeForm.actual_cost" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCompleteDialog = false">取消</el-button>
        <el-button type="primary" @click="handleCompleteSave">完成</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const planList = ref([])
const customerList = ref([])
const orderList = ref([])
const driverList = ref([])
const total = ref(0)
const showAddDialog = ref(false)
const showDetailDialog = ref(false)
const showCompleteDialog = ref(false)
const currentPlan = ref(null)
const isEdit = ref(false)
const formRef = ref(null)
const completeFormRef = ref(null)

const queryParams = reactive({
  keyword: '',
  status: '',
  page: 1,
  pageSize: 10
})

const planForm = reactive({
  plan_name: '',
  customer_id: '',
  order_id: '',
  goods_type: '',
  goods_name: '',
  goods_quantity: 0,
  goods_weight: 0,
  goods_volume: 0,
  pickup_address: '',
  delivery_address: '',
  pickup_date: '',
  delivery_date: '',
  transport_mode: 'road',
  vehicle_type: '',
  driver_id: '',
  estimated_cost: 0,
  special_requirements: '',
  remarks: ''
})

const completeForm = reactive({
  actual_cost: 0
})

const rules = {
  plan_name: [{ required: true, message: '请输入计划名称', trigger: 'blur' }],
  customer_id: [{ required: true, message: '请选择客户', trigger: 'change' }],
  goods_type: [{ required: true, message: '请输入货物类型', trigger: 'blur' }],
  goods_name: [{ required: true, message: '请输入货物名称', trigger: 'blur' }],
  goods_quantity: [{ required: true, message: '请输入货物数量', trigger: 'blur' }],
  goods_weight: [{ required: true, message: '请输入货物重量', trigger: 'blur' }],
  goods_volume: [{ required: true, message: '请输入货物体积', trigger: 'blur' }],
  pickup_address: [{ required: true, message: '请输入提货地址', trigger: 'blur' }],
  delivery_address: [{ required: true, message: '请输入送货地址', trigger: 'blur' }],
  pickup_date: [{ required: true, message: '请选择提货日期', trigger: 'change' }],
  delivery_date: [{ required: true, message: '请选择送达日期', trigger: 'change' }]
}

const completeRules = {
  actual_cost: [{ required: true, message: '请输入实际成本', trigger: 'blur' }]
}

const statusNameMap = {
  draft: '草稿',
  confirmed: '已确认',
  in_transit: '运输中',
  completed: '已完成',
  cancelled: '已取消'
}

const statusTypeMap = {
  draft: 'info',
  confirmed: 'warning',
  in_transit: 'primary',
  completed: 'success',
  cancelled: 'danger'
}

const transportModeNameMap = {
  road: '公路',
  rail: '铁路',
  air: '航空',
  sea: '海运'
}

const getProgressStatus = (row) => {
  if (row.progress === 100) return 'success'
  if (row.status === 'in_transit') return ''
  return 'exception'
}

const handleQuery = async () => {
  loading.value = true
  try {
    const res = await axios.get('http://localhost:5001/api/shipment-plans', {
      params: queryParams
    })
    if (res.data.code === 200) {
      planList.value = res.data.data.list
      total.value = res.data.data.total
    }
  } catch (err) {
    ElMessage.error('获取装运计划列表失败')
  } finally {
    loading.value = false
  }
}

const loadReferenceData = async () => {
  try {
    const [customersRes, ordersRes, driversRes] = await Promise.all([
      axios.get('http://localhost:5001/api/customers'),
      axios.get('http://localhost:5001/api/orders'),
      axios.get('http://localhost:5001/api/drivers')
    ])
    
    if (customersRes.data.code === 200) {
      customerList.value = customersRes.data.data.list
    }
    if (ordersRes.data.code === 200) {
      orderList.value = ordersRes.data.data.list
    }
    if (driversRes.data.code === 200) {
      driverList.value = driversRes.data.data.list
    }
  } catch (err) {
    ElMessage.error('加载参考数据失败')
  }
}

const openAddDialog = () => {
  isEdit.value = false
  Object.assign(planForm, {
    plan_name: '',
    customer_id: '',
    order_id: '',
    goods_type: '',
    goods_name: '',
    goods_quantity: 0,
    goods_weight: 0,
    goods_volume: 0,
    pickup_address: '',
    delivery_address: '',
    pickup_date: '',
    delivery_date: '',
    transport_mode: 'road',
    vehicle_type: '',
    driver_id: '',
    estimated_cost: 0,
    special_requirements: '',
    remarks: ''
  })
  showAddDialog.value = true
}

const handleSave = async () => {
  try {
    await formRef.value.validate()
    const res = await axios.post('http://localhost:5001/api/shipment-plans', planForm)
    if (res.data.code === 200) {
      ElMessage.success('保存成功')
      showAddDialog.value = false
      handleQuery()
    }
  } catch (err) {
    if (err !== false) {
      ElMessage.error('保存失败')
    }
  }
}

const handleDetail = async (row) => {
  try {
    const res = await axios.get(`http://localhost:5001/api/shipment-plans/${row.id}`)
    if (res.data.code === 200) {
      currentPlan.value = res.data.data
      showDetailDialog.value = true
    }
  } catch (err) {
    ElMessage.error('获取计划详情失败')
  }
}

const handleEdit = (row) => {
  isEdit.value = true
  Object.assign(planForm, row)
  showAddDialog.value = true
}

const handleConfirm = async (row) => {
  try {
    await ElMessageBox.confirm('确定要确认该装运计划吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    const res = await axios.post(`http://localhost:5001/api/shipment-plans/${row.id}/confirm`)
    if (res.data.code === 200) {
      ElMessage.success('确认成功')
      handleQuery()
    }
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error('确认失败')
    }
  }
}

const handleStart = async (row) => {
  try {
    await ElMessageBox.confirm('确定要开始装运吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    const res = await axios.post(`http://localhost:5001/api/shipment-plans/${row.id}/start`)
    if (res.data.code === 200) {
      ElMessage.success('开始装运成功')
      handleQuery()
    }
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error('开始装运失败')
    }
  }
}

const handleComplete = (row) => {
  currentPlan.value = row
  Object.assign(completeForm, {
    actual_cost: row.estimated_cost || 0
  })
  showCompleteDialog.value = true
}

const handleCompleteSave = async () => {
  try {
    await completeFormRef.value.validate()
    const res = await axios.post(`http://localhost:5001/api/shipment-plans/${currentPlan.value.id}/complete`, completeForm)
    if (res.data.code === 200) {
      ElMessage.success('完成装运成功')
      showCompleteDialog.value = false
      handleQuery()
    }
  } catch (err) {
    if (err !== false) {
      ElMessage.error('完成装运失败')
    }
  }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该装运计划吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    const res = await axios.delete(`http://localhost:5001/api/shipment-plans/${row.id}`)
    if (res.data.code === 200) {
      ElMessage.success('删除成功')
      handleQuery()
    }
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

onMounted(() => {
  handleQuery()
  loadReferenceData()
})
</script>

<style scoped>
.shipment-plan-page {
  padding: 20px;
}

.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
