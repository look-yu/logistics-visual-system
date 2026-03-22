<template>
  <div class="driver-page">
    <el-card>
      <template #header>
        <div class="filter-bar">
          <el-form :inline="true" :model="queryParams">
            <el-form-item label="司机姓名">
              <el-input v-model="queryParams.keyword" placeholder="输入姓名或电话" clearable />
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="queryParams.status" placeholder="全部状态" clearable style="width: 150px">
                <el-option label="在职" value="active" />
                <el-option label="离职" value="inactive" />
                <el-option label="请假" value="on_leave" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleQuery">查询</el-button>
              <el-button type="success" @click="openAddDialog">新增司机</el-button>
            </el-form-item>
          </el-form>
        </div>
      </template>

      <el-table :data="driverList" border stripe v-loading="loading">
        <el-table-column prop="driver_name" label="司机姓名" width="120" />
        <el-table-column prop="phone" label="联系电话" width="130" />
        <el-table-column prop="id_card" label="身份证号" width="180" />
        <el-table-column prop="license_no" label="驾驶证号" width="150" />
        <el-table-column prop="license_type" label="驾驶证类型" width="100" />
        <el-table-column prop="license_expire_date" label="驾驶证到期日期" width="130" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusTypeMap[row.status]">{{ statusNameMap[row.status] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="current_vehicle" label="当前车辆" width="120" />
        <el-table-column prop="current_task_count" label="当前任务数" width="100" />
        <el-table-column prop="total_orders" label="总订单数" width="100" />
        <el-table-column prop="rating" label="评分" width="80">
          <template #default="{ row }">
            <el-rate v-model="row.rating" disabled show-score text-color="#ff9900" score-template="{value}" />
          </template>
        </el-table-column>
        <el-table-column prop="hire_date" label="入职日期" width="120" />
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleDetail(row)">详情</el-button>
            <el-button link type="success" @click="handleVehicles(row)">车辆</el-button>
            <el-button link type="warning" @click="handleTasks(row)">任务</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="queryParams.page"
          :total="total"
          layout="total, prev, pager, next"
          @current-change="handleQuery"
        />
      </div>
    </el-card>

    <el-dialog v-model="showAddDialog" title="新增司机" width="700px">
      <el-form :model="driverForm" label-width="120px" :rules="driverRules" ref="driverFormRef">
        <el-divider content-position="left">基本信息</el-divider>
        <el-form-item label="司机姓名" prop="driver_name">
          <el-input v-model="driverForm.driver_name" placeholder="请输入司机姓名" />
        </el-form-item>
        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="driverForm.phone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="身份证号" prop="id_card">
          <el-input v-model="driverForm.id_card" placeholder="请输入身份证号" />
        </el-form-item>
        <el-form-item label="家庭住址" prop="address">
          <el-input v-model="driverForm.address" placeholder="请输入家庭住址" />
        </el-form-item>
        <el-divider content-position="left">驾驶证信息</el-divider>
        <el-form-item label="驾驶证号" prop="license_no">
          <el-input v-model="driverForm.license_no" placeholder="请输入驾驶证号" />
        </el-form-item>
        <el-form-item label="驾驶证类型" prop="license_type">
          <el-select v-model="driverForm.license_type" placeholder="请选择驾驶证类型" style="width: 100%">
            <el-option label="A1" value="A1" />
            <el-option label="A2" value="A2" />
            <el-option label="B1" value="B1" />
            <el-option label="B2" value="B2" />
            <el-option label="C1" value="C1" />
          </el-select>
        </el-form-item>
        <el-form-item label="驾驶证到期日期" prop="license_expire_date">
          <el-date-picker v-model="driverForm.license_expire_date" type="date" placeholder="选择到期日期" style="width: 100%" />
        </el-form-item>
        <el-divider content-position="left">紧急联系人</el-divider>
        <el-form-item label="紧急联系人" prop="emergency_contact">
          <el-input v-model="driverForm.emergency_contact" placeholder="请输入紧急联系人姓名" />
        </el-form-item>
        <el-form-item label="紧急联系电话" prop="emergency_phone">
          <el-input v-model="driverForm.emergency_phone" placeholder="请输入紧急联系电话" />
        </el-form-item>
        <el-divider content-position="left">其他信息</el-divider>
        <el-form-item label="入职日期" prop="hire_date">
          <el-date-picker v-model="driverForm.hire_date" type="date" placeholder="选择入职日期" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showDetailDialog" title="司机详情" width="800px">
      <el-descriptions :column="2" border v-if="currentDriver">
        <el-descriptions-item label="司机姓名">{{ currentDriver.driver_name }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ currentDriver.phone }}</el-descriptions-item>
        <el-descriptions-item label="身份证号">{{ currentDriver.id_card }}</el-descriptions-item>
        <el-descriptions-item label="驾驶证号">{{ currentDriver.license_no }}</el-descriptions-item>
        <el-descriptions-item label="驾驶证类型">{{ currentDriver.license_type }}</el-descriptions-item>
        <el-descriptions-item label="驾驶证到期日期">{{ currentDriver.license_expire_date }}</el-descriptions-item>
        <el-descriptions-item label="家庭住址">{{ currentDriver.address }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="statusTypeMap[currentDriver.status]">{{ statusNameMap[currentDriver.status] }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="紧急联系人">{{ currentDriver.emergency_contact }}</el-descriptions-item>
        <el-descriptions-item label="紧急联系电话">{{ currentDriver.emergency_phone }}</el-descriptions-item>
        <el-descriptions-item label="入职日期">{{ currentDriver.hire_date }}</el-descriptions-item>
        <el-descriptions-item label="当前车辆">{{ currentDriver.current_vehicle || '无' }}</el-descriptions-item>
        <el-descriptions-item label="总订单数">{{ currentDriver.total_orders }}</el-descriptions-item>
        <el-descriptions-item label="已完成订单">{{ currentDriver.completed_tasks }}</el-descriptions-item>
        <el-descriptions-item label="进行中订单">{{ currentDriver.active_tasks }}</el-descriptions-item>
        <el-descriptions-item label="总行驶里程">{{ currentDriver.total_mileage }} 公里</el-descriptions-item>
        <el-descriptions-item label="评分" :span="2">
          <el-rate v-model="currentDriver.rating" disabled show-score text-color="#ff9900" score-template="{value}" />
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button type="primary" @click="showDetailDialog = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showVehiclesDialog" title="司机车辆信息" width="900px">
      <el-table :data="vehicleList" border stripe v-loading="vehiclesLoading">
        <el-table-column prop="car_no" label="车牌号" width="120" />
        <el-table-column prop="driver_name" label="司机" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="vehicleStatusTypeMap[row.status]">{{ vehicleStatusNameMap[row.status] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="current_area" label="当前位置" />
        <el-table-column prop="load_capacity" label="载重(吨)" width="100" />
        <el-table-column prop="create_time" label="创建时间" width="180" />
      </el-table>
      <template #footer>
        <el-button type="primary" @click="showVehiclesDialog = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showTasksDialog" title="司机任务列表" width="1000px">
      <el-table :data="taskList" border stripe v-loading="tasksLoading">
        <el-table-column prop="task_no" label="任务编号" width="150" />
        <el-table-column prop="order_no" label="订单号" width="150" />
        <el-table-column prop="customer_name" label="客户" width="120" />
        <el-table-column prop="car_no" label="车辆" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="taskStatusTypeMap[row.status]">{{ taskStatusNameMap[row.status] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="start_time" label="开始时间" width="180" />
        <el-table-column prop="end_time" label="结束时间" width="180" />
        <el-table-column prop="cost" label="费用" width="100" />
      </el-table>
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="taskQueryParams.page"
          :total="taskTotal"
          layout="total, prev, pager, next"
          @current-change="handleQueryTasks"
        />
      </div>
      <template #footer>
        <el-button type="primary" @click="showTasksDialog = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const driverList = ref([])
const total = ref(0)
const showAddDialog = ref(false)
const showDetailDialog = ref(false)
const showVehiclesDialog = ref(false)
const showTasksDialog = ref(false)
const currentDriver = ref(null)
const vehicleList = ref([])
const taskList = ref([])
const vehiclesLoading = ref(false)
const tasksLoading = ref(false)
const taskTotal = ref(0)

const queryParams = reactive({
  keyword: '',
  status: '',
  page: 1
})

const taskQueryParams = reactive({
  page: 1
})

const driverForm = reactive({
  driver_name: '',
  phone: '',
  id_card: '',
  license_no: '',
  license_type: '',
  license_expire_date: '',
  address: '',
  emergency_contact: '',
  emergency_phone: '',
  hire_date: '',
  status: 'active'
})

const driverRules = {
  driver_name: [{ required: true, message: '请输入司机姓名', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入联系电话', trigger: 'blur' }]
}

const statusTypeMap = {
  active: 'success',
  inactive: 'danger',
  on_leave: 'warning'
}

const statusNameMap = {
  active: '在职',
  inactive: '离职',
  on_leave: '请假'
}

const vehicleStatusTypeMap = {
  idle: 'success',
  busy: 'danger',
  maintenance: 'warning'
}

const vehicleStatusNameMap = {
  idle: '空闲',
  busy: '在途',
  maintenance: '维修'
}

const taskStatusTypeMap = {
  pending: 'warning',
  in_transit: 'primary',
  completed: 'success',
  failed: 'danger'
}

const taskStatusNameMap = {
  pending: '待处理',
  in_transit: '运输中',
  completed: '已完成',
  failed: '失败'
}

const handleQuery = async () => {
  loading.value = true
  try {
    const res = await axios.get('http://localhost:5001/api/drivers', {
      params: queryParams
    })
    if (res.data.code === 200) {
      driverList.value = res.data.data.list
      total.value = res.data.data.total
    }
  } catch (error) {
    console.error('获取司机列表失败:', error)
    ElMessage.error('获取司机列表失败')
  } finally {
    loading.value = false
  }
}

const openAddDialog = () => {
  Object.assign(driverForm, {
    driver_name: '',
    phone: '',
    id_card: '',
    license_no: '',
    license_type: '',
    license_expire_date: '',
    address: '',
    emergency_contact: '',
    emergency_phone: '',
    hire_date: '',
    status: 'active'
  })
  showAddDialog.value = true
}

const handleSave = async () => {
  try {
    const res = await axios.post('http://localhost:5001/api/drivers', driverForm)
    if (res.data.code === 200) {
      ElMessage.success('保存成功')
      showAddDialog.value = false
      handleQuery()
    } else {
      ElMessage.error(res.data.msg || '保存失败')
    }
  } catch (error) {
    console.error('保存司机失败:', error)
    ElMessage.error('保存失败')
  }
}

const handleDetail = async (row) => {
  try {
    const res = await axios.get(`http://localhost:5001/api/drivers/${row.id}`)
    if (res.data.code === 200) {
      currentDriver.value = res.data.data
      showDetailDialog.value = true
    }
  } catch (error) {
    console.error('获取司机详情失败:', error)
    ElMessage.error('获取司机详情失败')
  }
}

const handleVehicles = async (row) => {
  vehiclesLoading.value = true
  try {
    const res = await axios.get(`http://localhost:5001/api/drivers/${row.id}/vehicles`)
    if (res.data.code === 200) {
      vehicleList.value = res.data.data
      showVehiclesDialog.value = true
    }
  } catch (error) {
    console.error('获取司机车辆信息失败:', error)
    ElMessage.error('获取司机车辆信息失败')
  } finally {
    vehiclesLoading.value = false
  }
}

const handleTasks = async (row) => {
  tasksLoading.value = true
  try {
    const res = await axios.get(`http://localhost:5001/api/drivers/${row.id}/tasks`, {
      params: taskQueryParams
    })
    if (res.data.code === 200) {
      taskList.value = res.data.data.list
      taskTotal.value = res.data.data.total
      showTasksDialog.value = true
    }
  } catch (error) {
    console.error('获取司机任务列表失败:', error)
    ElMessage.error('获取司机任务列表失败')
  } finally {
    tasksLoading.value = false
  }
}

const handleQueryTasks = async () => {
  if (currentDriver.value) {
    handleTasks(currentDriver.value)
  }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该司机吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const res = await axios.delete(`http://localhost:5001/api/drivers/${row.id}`)
    if (res.data.code === 200) {
      ElMessage.success('删除成功')
      handleQuery()
    } else {
      ElMessage.error(res.data.msg || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除司机失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

onMounted(() => {
  handleQuery()
})
</script>

<style scoped>
.driver-page {
  padding: 20px;
}

.filter-bar {
  display: flex;
  align-items: center;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
