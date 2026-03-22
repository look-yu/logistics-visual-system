<template>
  <div class="service-request-page">
    <el-card>
      <template #header>
        <div class="filter-bar">
          <el-form :inline="true" :model="queryParams">
            <el-form-item label="请求标题">
              <el-input v-model="queryParams.keyword" placeholder="输入标题或编号" clearable />
            </el-form-item>
            <el-form-item label="请求类型">
              <el-select v-model="queryParams.request_type" placeholder="全部类型" clearable style="width: 150px">
                <el-option label="咨询" value="inquiry" />
                <el-option label="投诉" value="complaint" />
                <el-option label="建议" value="suggestion" />
                <el-option label="其他" value="other" />
              </el-select>
            </el-form-item>
            <el-form-item label="优先级">
              <el-select v-model="queryParams.priority" placeholder="全部优先级" clearable style="width: 150px">
                <el-option label="高" value="high" />
                <el-option label="中" value="normal" />
                <el-option label="低" value="low" />
              </el-select>
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="queryParams.status" placeholder="全部状态" clearable style="width: 150px">
                <el-option label="待处理" value="pending" />
                <el-option label="处理中" value="processing" />
                <el-option label="已解决" value="resolved" />
                <el-option label="已关闭" value="closed" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleQuery">查询</el-button>
              <el-button type="success" @click="openAddDialog">新增请求</el-button>
            </el-form-item>
          </el-form>
        </div>
      </template>

      <el-table :data="requestList" border stripe v-loading="loading">
        <el-table-column prop="request_no" label="请求编号" width="120" />
        <el-table-column prop="customer_name" label="客户名称" width="120" />
        <el-table-column prop="contact_person" label="联系人" width="100" />
        <el-table-column prop="request_title" label="标题" width="200" />
        <el-table-column prop="request_type" label="类型" width="80">
          <template #default="{ row }">
            <el-tag>{{ requestTypeNameMap[row.request_type] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="priority" label="优先级" width="80">
          <template #default="{ row }">
            <el-tag :type="priorityTypeMap[row.priority]">{{ priorityNameMap[row.priority] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="statusTypeMap[row.status]">{{ statusNameMap[row.status] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="handler_name" label="处理人" width="100" />
        <el-table-column prop="response_time" label="响应时间(分)" width="110" />
        <el-table-column prop="customer_satisfaction" label="满意度" width="90">
          <template #default="{ row }">
            <el-rate v-if="row.customer_satisfaction" v-model="row.customer_satisfaction" disabled show-score score-template="{value}" />
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="create_time" label="创建时间" width="160" />
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleDetail(row)">详情</el-button>
            <el-button link type="success" @click="handleProcess(row)" v-if="row.status === 'pending' || row.status === 'processing'">处理</el-button>
            <el-button link type="warning" @click="handleEdit(row)" v-if="row.status === 'pending'">编辑</el-button>
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

    <el-dialog v-model="showAddDialog" :title="isEdit ? '编辑请求' : '新增请求'" width="700px">
      <el-form :model="requestForm" :rules="rules" ref="formRef" label-width="120px">
        <el-form-item label="客户" prop="customer_id">
          <el-select v-model="requestForm.customer_id" placeholder="请选择客户" style="width: 100%" filterable>
            <el-option
              v-for="customer in customerList"
              :key="customer.id"
              :label="customer.customer_name"
              :value="customer.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="请求类型" prop="request_type">
          <el-select v-model="requestForm.request_type" placeholder="请选择请求类型" style="width: 100%">
            <el-option label="咨询" value="inquiry" />
            <el-option label="投诉" value="complaint" />
            <el-option label="建议" value="suggestion" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="标题" prop="request_title">
          <el-input v-model="requestForm.request_title" placeholder="请输入标题" />
        </el-form-item>
        <el-form-item label="优先级" prop="priority">
          <el-select v-model="requestForm.priority" placeholder="请选择优先级" style="width: 100%">
            <el-option label="高" value="high" />
            <el-option label="中" value="normal" />
            <el-option label="低" value="low" />
          </el-select>
        </el-form-item>
        <el-form-item label="内容" prop="request_content">
          <el-input v-model="requestForm.request_content" type="textarea" :rows="5" placeholder="请输入详细内容" />
        </el-form-item>
        <el-form-item label="附件" prop="attachments">
          <el-input v-model="requestForm.attachments" placeholder="请输入附件路径" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showDetailDialog" title="请求详情" width="800px">
      <el-descriptions :column="2" border v-if="currentRequest">
        <el-descriptions-item label="请求编号">{{ currentRequest.request_no }}</el-descriptions-item>
        <el-descriptions-item label="客户名称">{{ currentRequest.customer_name }}</el-descriptions-item>
        <el-descriptions-item label="联系人">{{ currentRequest.contact_person }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ currentRequest.contact_phone }}</el-descriptions-item>
        <el-descriptions-item label="请求类型">
          <el-tag>{{ requestTypeNameMap[currentRequest.request_type] }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="优先级">
          <el-tag :type="priorityTypeMap[currentRequest.priority]">{{ priorityNameMap[currentRequest.priority] }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="statusTypeMap[currentRequest.status]">{{ statusNameMap[currentRequest.status] }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="处理人">{{ currentRequest.handler_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="响应时间">{{ currentRequest.response_time ? `${currentRequest.response_time}分钟` : '-' }}</el-descriptions-item>
        <el-descriptions-item label="解决时间">{{ currentRequest.resolve_time ? `${currentRequest.resolve_time}分钟` : '-' }}</el-descriptions-item>
        <el-descriptions-item label="满意度">
          <el-rate v-if="currentRequest.customer_satisfaction" v-model="currentRequest.customer_satisfaction" disabled show-score score-template="{value}" />
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间" :span="2">{{ currentRequest.create_time }}</el-descriptions-item>
        <el-descriptions-item label="标题" :span="2">{{ currentRequest.request_title }}</el-descriptions-item>
        <el-descriptions-item label="内容" :span="2">{{ currentRequest.request_content }}</el-descriptions-item>
        <el-descriptions-item label="处理结果" :span="2">{{ currentRequest.handle_result || '-' }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button type="primary" @click="showDetailDialog = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showProcessDialog" title="处理请求" width="600px">
      <el-form :model="processForm" :rules="processRules" ref="processFormRef" label-width="120px">
        <el-form-item label="处理人姓名" prop="handler_name">
          <el-input v-model="processForm.handler_name" placeholder="请输入处理人姓名" />
        </el-form-item>
        <el-form-item label="处理结果" prop="handle_result">
          <el-input v-model="processForm.handle_result" type="textarea" :rows="5" placeholder="请输入处理结果" />
        </el-form-item>
        <el-form-item label="客户满意度" prop="customer_satisfaction">
          <el-rate v-model="processForm.customer_satisfaction" show-text />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showProcessDialog = false">取消</el-button>
        <el-button type="primary" @click="handleProcessSave">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const requestList = ref([])
const customerList = ref([])
const total = ref(0)
const showAddDialog = ref(false)
const showDetailDialog = ref(false)
const showProcessDialog = ref(false)
const currentRequest = ref(null)
const isEdit = ref(false)
const formRef = ref(null)
const processFormRef = ref(null)

const queryParams = reactive({
  keyword: '',
  request_type: '',
  priority: '',
  status: '',
  page: 1,
  pageSize: 10
})

const requestForm = reactive({
  customer_id: '',
  request_type: '',
  request_title: '',
  request_content: '',
  priority: 'normal',
  attachments: ''
})

const processForm = reactive({
  handler_id: 1,
  handler_name: '',
  handle_result: '',
  customer_satisfaction: 5
})

const rules = {
  customer_id: [{ required: true, message: '请选择客户', trigger: 'change' }],
  request_type: [{ required: true, message: '请选择请求类型', trigger: 'change' }],
  request_title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  request_content: [{ required: true, message: '请输入内容', trigger: 'blur' }]
}

const processRules = {
  handler_name: [{ required: true, message: '请输入处理人姓名', trigger: 'blur' }],
  handle_result: [{ required: true, message: '请输入处理结果', trigger: 'blur' }],
  customer_satisfaction: [{ required: true, message: '请选择客户满意度', trigger: 'change' }]
}

const requestTypeNameMap = {
  inquiry: '咨询',
  complaint: '投诉',
  suggestion: '建议',
  other: '其他'
}

const priorityNameMap = {
  high: '高',
  normal: '中',
  low: '低'
}

const priorityTypeMap = {
  high: 'danger',
  normal: 'warning',
  low: 'success'
}

const statusNameMap = {
  pending: '待处理',
  processing: '处理中',
  resolved: '已解决',
  closed: '已关闭'
}

const statusTypeMap = {
  pending: 'warning',
  processing: 'primary',
  resolved: 'success',
  closed: 'info'
}

const handleQuery = async () => {
  loading.value = true
  try {
    const res = await axios.get('http://localhost:5001/api/service-requests', {
      params: queryParams
    })
    if (res.data.code === 200) {
      requestList.value = res.data.data.list
      total.value = res.data.data.total
    }
  } catch (err) {
    ElMessage.error('获取服务请求列表失败')
  } finally {
    loading.value = false
  }
}

const loadCustomers = async () => {
  try {
    const res = await axios.get('http://localhost:5001/api/customers')
    if (res.data.code === 200) {
      customerList.value = res.data.data.list
    }
  } catch (err) {
    ElMessage.error('获取客户列表失败')
  }
}

const openAddDialog = () => {
  isEdit.value = false
  Object.assign(requestForm, {
    customer_id: '',
    request_type: '',
    request_title: '',
    request_content: '',
    priority: 'normal',
    attachments: ''
  })
  showAddDialog.value = true
}

const handleSave = async () => {
  try {
    await formRef.value.validate()
    const res = await axios.post('http://localhost:5001/api/service-requests', requestForm)
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
    const res = await axios.get(`http://localhost:5001/api/service-requests/${row.id}`)
    if (res.data.code === 200) {
      currentRequest.value = res.data.data
      showDetailDialog.value = true
    }
  } catch (err) {
    ElMessage.error('获取请求详情失败')
  }
}

const handleEdit = (row) => {
  isEdit.value = true
  Object.assign(requestForm, row)
  showAddDialog.value = true
}

const handleProcess = (row) => {
  currentRequest.value = row
  Object.assign(processForm, {
    handler_id: 1,
    handler_name: '',
    handle_result: '',
    customer_satisfaction: 5
  })
  showProcessDialog.value = true
}

const handleProcessSave = async () => {
  try {
    await processFormRef.value.validate()
    const res = await axios.post(`http://localhost:5001/api/service-requests/${currentRequest.value.id}/handle`, processForm)
    if (res.data.code === 200) {
      ElMessage.success('处理成功')
      showProcessDialog.value = false
      handleQuery()
    }
  } catch (err) {
    if (err !== false) {
      ElMessage.error('处理失败')
    }
  }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该请求吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    const res = await axios.delete(`http://localhost:5001/api/service-requests/${row.id}`)
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
  loadCustomers()
})
</script>

<style scoped>
.service-request-page {
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
