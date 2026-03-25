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
        <el-table-column prop="hire_date" label="入职日期" width="120" />
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleDetail(row)">详情</el-button>
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
        <el-form-item label="司机姓名" prop="driver_name">
          <el-input v-model="driverForm.driver_name" placeholder="请输入司机姓名" />
        </el-form-item>
        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="driverForm.phone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="身份证号" prop="id_card">
          <el-input v-model="driverForm.id_card" placeholder="请输入身份证号" />
        </el-form-item>
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
        <el-form-item label="入职日期" prop="hire_date">
          <el-date-picker v-model="driverForm.hire_date" type="date" placeholder="选择入职日期" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showDetailDialog" title="司机详情" width="600px">
      <el-descriptions :column="2" border v-if="currentDriver">
        <el-descriptions-item label="司机姓名">{{ currentDriver.driver_name }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ currentDriver.phone }}</el-descriptions-item>
        <el-descriptions-item label="身份证号">{{ currentDriver.id_card }}</el-descriptions-item>
        <el-descriptions-item label="驾驶证号">{{ currentDriver.license_no }}</el-descriptions-item>
        <el-descriptions-item label="驾驶证类型">{{ currentDriver.license_type }}</el-descriptions-item>
        <el-descriptions-item label="入职日期">{{ currentDriver.hire_date }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button type="primary" @click="showDetailDialog = false">关闭</el-button>
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
const currentDriver = ref(null)

const queryParams = reactive({
  keyword: '',
  status: '',
  page: 1
})

const driverForm = reactive({
  driver_name: '',
  phone: '',
  id_card: '',
  license_no: '',
  license_type: '',
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
    hire_date: '',
    status: 'active'
  })
  showAddDialog.value = true
}

const handleSave = async () => {
  try {
    const formData = {
      driver_name: driverForm.driver_name || null,
      phone: driverForm.phone || null,
      id_card: driverForm.id_card || null,
      license_no: driverForm.license_no || null,
      license_type: driverForm.license_type || null,
      hire_date: null
    }
    
    if (driverForm.hire_date && driverForm.hire_date instanceof Date) {
      const year = driverForm.hire_date.getFullYear()
      const month = String(driverForm.hire_date.getMonth() + 1).padStart(2, '0')
      const day = String(driverForm.hire_date.getDate()).padStart(2, '0')
      formData.hire_date = `${year}-${month}-${day}`
    }
    
    console.log('提交的司机数据:', formData)
    
    const res = await axios.post('http://localhost:5001/api/drivers', formData)
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

const handleDetail = (row) => {
  currentDriver.value = row
  showDetailDialog.value = true
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
