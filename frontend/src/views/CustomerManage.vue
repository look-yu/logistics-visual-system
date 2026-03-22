<template>
  <div class="customer-page">
    <el-card>
      <template #header>
        <div class="filter-bar">
          <el-form :inline="true" :model="queryParams">
            <el-form-item label="客户名称">
              <el-input v-model="queryParams.keyword" placeholder="输入名称或编号" clearable />
            </el-form-item>
            <el-form-item label="客户类型">
              <el-select v-model="queryParams.customer_type" placeholder="全部类型" clearable style="width: 150px">
                <el-option label="普通客户" value="regular" />
                <el-option label="VIP客户" value="vip" />
                <el-option label="战略客户" value="strategic" />
              </el-select>
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="queryParams.status" placeholder="全部状态" clearable style="width: 150px">
                <el-option label="活跃" value="active" />
                <el-option label="停用" value="inactive" />
                <el-option label="冻结" value="blocked" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleQuery">查询</el-button>
              <el-button type="success" @click="openAddDialog">新增客户</el-button>
            </el-form-item>
          </el-form>
        </div>
      </template>

      <el-table :data="customerList" border stripe v-loading="loading">
        <el-table-column prop="customer_code" label="客户编号" width="120" />
        <el-table-column prop="customer_name" label="客户名称" width="150" />
        <el-table-column prop="contact_person" label="联系人" width="100" />
        <el-table-column prop="contact_phone" label="联系电话" width="130" />
        <el-table-column prop="contact_email" label="联系邮箱" width="180" />
        <el-table-column prop="customer_type" label="客户类型" width="100">
          <template #default="{ row }">
            <el-tag :type="customerTypeTypeMap[row.customer_type]">{{ customerTypeNameMap[row.customer_type] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="credit_rating" label="信用等级" width="90">
          <template #default="{ row }">
            <el-tag :type="creditRatingTypeMap[row.credit_rating]">{{ row.credit_rating }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="credit_limit" label="信用额度" width="100">
          <template #default="{ row }">
            ¥{{ row.credit_limit.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="total_orders" label="总订单数" width="90" />
        <el-table-column prop="total_amount" label="总交易额" width="120">
          <template #default="{ row }">
            ¥{{ row.total_amount.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="statusTypeMap[row.status]">{{ statusNameMap[row.status] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleDetail(row)">详情</el-button>
            <el-button link type="warning" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
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

    <el-dialog v-model="showAddDialog" title="新增客户" width="700px">
      <el-form :model="customerForm" :rules="rules" ref="formRef" label-width="120px">
        <el-divider content-position="left">基本信息</el-divider>
        <el-form-item label="客户编号" prop="customer_code">
          <el-input v-model="customerForm.customer_code" placeholder="请输入客户编号" />
        </el-form-item>
        <el-form-item label="客户名称" prop="customer_name">
          <el-input v-model="customerForm.customer_name" placeholder="请输入客户名称" />
        </el-form-item>
        <el-form-item label="联系人" prop="contact_person">
          <el-input v-model="customerForm.contact_person" placeholder="请输入联系人" />
        </el-form-item>
        <el-form-item label="联系电话" prop="contact_phone">
          <el-input v-model="customerForm.contact_phone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="联系邮箱" prop="contact_email">
          <el-input v-model="customerForm.contact_email" placeholder="请输入联系邮箱" />
        </el-form-item>
        <el-form-item label="公司地址" prop="company_address">
          <el-input v-model="customerForm.company_address" type="textarea" :rows="2" placeholder="请输入公司地址" />
        </el-form-item>
        <el-divider content-position="left">业务信息</el-divider>
        <el-form-item label="客户类型" prop="customer_type">
          <el-select v-model="customerForm.customer_type" placeholder="请选择客户类型" style="width: 100%">
            <el-option label="普通客户" value="regular" />
            <el-option label="VIP客户" value="vip" />
            <el-option label="战略客户" value="strategic" />
          </el-select>
        </el-form-item>
        <el-form-item label="信用等级" prop="credit_rating">
          <el-select v-model="customerForm.credit_rating" placeholder="请选择信用等级" style="width: 100%">
            <el-option label="A-优秀" value="A" />
            <el-option label="B-良好" value="B" />
            <el-option label="C-一般" value="C" />
            <el-option label="D-较差" value="D" />
          </el-select>
        </el-form-item>
        <el-form-item label="信用额度" prop="credit_limit">
          <el-input-number v-model="customerForm.credit_limit" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="备注" prop="remarks">
          <el-input v-model="customerForm.remarks" type="textarea" :rows="3" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showDetailDialog" title="客户详情" width="900px">
      <el-descriptions :column="2" border v-if="currentCustomer">
        <el-descriptions-item label="客户编号">{{ currentCustomer.customer_code }}</el-descriptions-item>
        <el-descriptions-item label="客户名称">{{ currentCustomer.customer_name }}</el-descriptions-item>
        <el-descriptions-item label="联系人">{{ currentCustomer.contact_person }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ currentCustomer.contact_phone }}</el-descriptions-item>
        <el-descriptions-item label="联系邮箱">{{ currentCustomer.contact_email || '-' }}</el-descriptions-item>
        <el-descriptions-item label="公司地址">{{ currentCustomer.company_address || '-' }}</el-descriptions-item>
        <el-descriptions-item label="客户类型">
          <el-tag :type="customerTypeTypeMap[currentCustomer.customer_type]">{{ customerTypeNameMap[currentCustomer.customer_type] }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="信用等级">
          <el-tag :type="creditRatingTypeMap[currentCustomer.credit_rating]">{{ currentCustomer.credit_rating }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="信用额度">¥{{ currentCustomer.credit_limit.toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="总订单数">{{ currentCustomer.total_orders }}</el-descriptions-item>
        <el-descriptions-item label="总交易额">¥{{ currentCustomer.total_amount.toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="最后下单日期">{{ currentCustomer.last_order_date || '-' }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="statusTypeMap[currentCustomer.status]">{{ statusNameMap[currentCustomer.status] }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ currentCustomer.create_time }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ currentCustomer.remarks || '-' }}</el-descriptions-item>
      </el-descriptions>

      <el-divider content-position="left">最近订单</el-divider>
      <el-table :data="currentCustomer.recent_orders || []" border stripe size="small" max-height="200">
        <el-table-column prop="order_no" label="订单编号" width="120" />
        <el-table-column prop="start_city" label="出发地" width="100" />
        <el-table-column prop="end_city" label="目的地" width="100" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="create_time" label="创建时间" width="150" />
      </el-table>

      <el-divider content-position="left">服务请求</el-divider>
      <el-table :data="currentCustomer.recent_requests || []" border stripe size="small" max-height="200">
        <el-table-column prop="request_no" label="请求编号" width="120" />
        <el-table-column prop="request_title" label="标题" width="150" />
        <el-table-column prop="request_type" label="类型" width="80" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="create_time" label="创建时间" width="150" />
      </el-table>

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
const customerList = ref([])
const total = ref(0)
const showAddDialog = ref(false)
const showDetailDialog = ref(false)
const currentCustomer = ref(null)
const formRef = ref(null)

const queryParams = reactive({
  keyword: '',
  customer_type: '',
  status: '',
  page: 1,
  pageSize: 10
})

const customerForm = reactive({
  customer_code: '',
  customer_name: '',
  contact_person: '',
  contact_phone: '',
  contact_email: '',
  company_address: '',
  customer_type: 'regular',
  credit_rating: 'A',
  credit_limit: 0,
  remarks: ''
})

const rules = {
  customer_code: [{ required: true, message: '请输入客户编号', trigger: 'blur' }],
  customer_name: [{ required: true, message: '请输入客户名称', trigger: 'blur' }],
  contact_person: [{ required: true, message: '请输入联系人', trigger: 'blur' }],
  contact_phone: [{ required: true, message: '请输入联系电话', trigger: 'blur' }]
}

const customerTypeNameMap = {
  regular: '普通客户',
  vip: 'VIP客户',
  strategic: '战略客户'
}

const customerTypeTypeMap = {
  regular: '',
  vip: 'warning',
  strategic: 'danger'
}

const creditRatingTypeMap = {
  A: 'success',
  B: '',
  C: 'warning',
  D: 'danger'
}

const statusNameMap = {
  active: '活跃',
  inactive: '停用',
  blocked: '冻结'
}

const statusTypeMap = {
  active: 'success',
  inactive: 'info',
  blocked: 'danger'
}

const handleQuery = async () => {
  loading.value = true
  try {
    const res = await axios.get('http://localhost:5001/api/customers', {
      params: queryParams
    })
    if (res.data.code === 200) {
      customerList.value = res.data.data.list
      total.value = res.data.data.total
    }
  } catch (err) {
    ElMessage.error('获取客户列表失败')
  } finally {
    loading.value = false
  }
}

const openAddDialog = () => {
  Object.assign(customerForm, {
    customer_code: '',
    customer_name: '',
    contact_person: '',
    contact_phone: '',
    contact_email: '',
    company_address: '',
    customer_type: 'regular',
    credit_rating: 'A',
    credit_limit: 0,
    remarks: ''
  })
  showAddDialog.value = true
}

const handleSave = async () => {
  try {
    await formRef.value.validate()
    const res = await axios.post('http://localhost:5001/api/customers', customerForm)
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
    const res = await axios.get(`http://localhost:5001/api/customers/${row.id}`)
    if (res.data.code === 200) {
      currentCustomer.value = res.data.data
      showDetailDialog.value = true
    }
  } catch (err) {
    ElMessage.error('获取客户详情失败')
  }
}

const handleEdit = (row) => {
  Object.assign(customerForm, row)
  showAddDialog.value = true
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该客户吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    const res = await axios.delete(`http://localhost:5001/api/customers/${row.id}`)
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
})
</script>

<style scoped>
.customer-page {
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
