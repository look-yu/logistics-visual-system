<template>
  <div class="order-page">
    <el-card>
      <template #header>
        <el-tabs v-model="activeTab">
          <el-tab-pane label="订单管理" name="orders">
            <div class="filter-bar">
              <el-form :inline="true" :model="queryParams">
                <el-form-item label="订单号">
                  <el-input v-model="queryParams.order_no" placeholder="输入订单号查询" clearable style="width: 250px" />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="handleSearchByOrderNo">查询</el-button>
                  <el-button @click="handleReset">重置</el-button>
                </el-form-item>
              </el-form>
            </div>
          </el-tab-pane>
        </el-tabs>
      </template>

      <el-table :data="orderList" border stripe v-loading="loading">
        <el-table-column prop="order_no" label="订单号" width="180" />
        <el-table-column prop="customer_name" label="客户" width="120" />
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="statusTypeMap[row.status]">{{ statusNameMap[row.status] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="receiver_address" label="收货地址" show-overflow-tooltip />
        <el-table-column prop="create_time" label="创建时间" width="180" />
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleDetail(row)">详情</el-button>
            <el-button link type="warning" @click="handleUpdateStatus(row)" v-if="row.status !== 'delivered' && row.status !== 'signed'">更新状态</el-button>
            <el-button link type="success" @click="handleSignOrder(row)" v-if="row.status === 'delivered'">签收</el-button>
            <el-tag type="success" size="small" v-if="row.status === 'signed'">已签收</el-tag>
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

    <el-dialog v-model="showDetailDialog" title="订单详情" width="600px">
      <el-descriptions :column="2" border v-if="currentOrder">
        <el-descriptions-item label="订单号">{{ currentOrder.order_no }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="statusTypeMap[currentOrder.status]">{{ statusNameMap[currentOrder.status] }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="客户名称">{{ currentOrder.customer_name }}</el-descriptions-item>
        <el-descriptions-item label="商品类型">{{ currentOrder.goods_type }}</el-descriptions-item>
        <el-descriptions-item label="发货地址">{{ currentOrder.sender_address }}</el-descriptions-item>
        <el-descriptions-item label="收货地址">{{ currentOrder.receiver_address }}</el-descriptions-item>
        <el-descriptions-item label="重量">{{ currentOrder.weight }}kg</el-descriptions-item>
        <el-descriptions-item label="金额">¥{{ currentOrder.amount }}</el-descriptions-item>
        <el-descriptions-item label="下单时间" :span="2">{{ formatDate(currentOrder.create_time) }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="showDetailDialog = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showStatusDialog" title="更新订单状态" width="500px">
      <el-form :model="statusForm" label-width="100px">
        <el-form-item label="订单号">{{ statusForm.order_no }}</el-form-item>
        <el-form-item label="新状态" required>
          <el-select v-model="statusForm.status" placeholder="请选择状态" style="width: 100%">
            <el-option label="待处理" value="pending" />
            <el-option label="已分配" value="assigned" />
            <el-option label="运输中" value="shipping" />
            <el-option label="已送达" value="delivered" />
            <el-option label="已签收" value="signed" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注原因">
          <el-input v-model="statusForm.reason" type="textarea" :rows="3" placeholder="请输入备注原因（可选）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showStatusDialog = false">取消</el-button>
        <el-button type="primary" @click="submitStatusUpdate" :loading="statusLoading">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showSignDialog" title="订单签收" width="500px">
      <el-form :model="signForm" label-width="100px">
        <el-form-item label="订单号">{{ signForm.order_no }}</el-form-item>
        <el-form-item label="签收人" required>
          <el-input v-model="signForm.signer" placeholder="请输入签收人姓名" />
        </el-form-item>
        <el-form-item label="签收备注">
          <el-input v-model="signForm.remark" type="textarea" :rows="3" placeholder="请输入签收备注（可选）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showSignDialog = false">取消</el-button>
        <el-button type="primary" @click="submitSignOrder" :loading="statusLoading">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'

const API_BASE = 'http://localhost:5001/api'
const loading = ref(false)
const statusLoading = ref(false)
const showDetailDialog = ref(false)
const showStatusDialog = ref(false)
const showSignDialog = ref(false)
const orderList = ref([])
const total = ref(0)
const currentOrder = ref(null)
const activeTab = ref('orders')

const queryParams = reactive({ page:1, size: 10, order_no: '', status: '' })
const statusForm = reactive({ id: '', order_no: '', status: '', reason: '' })
const signForm = reactive({ id: '', order_no: '', signer: '', remark: '' })

const statusNameMap = { pending: '待处理', assigned: '已分配', shipping: '运输中', delivered: '已送达', signed: '已签收' }
const statusTypeMap = { pending: 'info', assigned: 'primary', shipping: 'warning', delivered: 'success', signed: 'success' }

const handleQuery = async () => {
  loading.value = true
  try {
    const res = await axios.get(`${API_BASE}/orders`, { params: queryParams })
    orderList.value = res.data.data.list
    total.value = res.data.data.total
  } catch (err) { ElMessage.error('获取订单列表失败') }
  loading.value = false
}

const handleSearchByOrderNo = async () => {
  loading.value = true
  try {
    const res = await axios.get(`${API_BASE}/orders`, { 
      params: { 
        order_no: queryParams.order_no || undefined, 
        page: 1, 
        size: 10 
      }
    })
    orderList.value = res.data.data.list
    total.value = res.data.data.total
    if (queryParams.order_no && res.data.data.list.length === 0) {
      ElMessage.info('未找到该订单号')
    }
  } catch (err) { 
    ElMessage.error('查询订单失败')
  }
  loading.value = false
}

const handleReset = () => {
  queryParams.order_no = ''
  queryParams.status = ''
  handleSearchByOrderNo()
}

const handleDetail = async (row) => {
  console.log('查看订单详情，订单ID：', row.id)
  try {
    const response = await axios.get(`${API_BASE}/orders/${row.id}`)
    if (response.data.code === 200) {
      currentOrder.value = response.data.data
      showDetailDialog.value = true
    } else {
      ElMessage.error(response.data.msg || '获取订单详情失败')
    }
  } catch (err) {
    console.error('获取订单详情错误：', err)
    if (err.response) {
      ElMessage.error(err.response.data.msg || '获取订单详情失败')
    } else if (err.request) {
      ElMessage.error('网络错误，请检查后端服务')
    } else {
      ElMessage.error('请求失败：' + err.message)
    }
  }
}

const handleUpdateStatus = (row) => {
  console.log('当前订单信息：', row)
  statusForm.id = row.id
  statusForm.order_no = row.order_no
  statusForm.status = row.status
  statusForm.reason = ''
  showStatusDialog.value = true
}

const submitStatusUpdate = async () => {
  if (!statusForm.status) return ElMessage.warning('请选择新状态')
  statusLoading.value = true
  try {
    const response = await axios.put(`${API_BASE}/orders/${statusForm.id}/status`, {
      status: statusForm.status,
      reason: statusForm.reason
    })
    if (response.data.code === 200) {
      ElMessage.success('状态更新成功')
      showStatusDialog.value = false
      handleQuery()
    } else {
      ElMessage.error(response.data.msg || '状态更新失败')
    }
  } catch (err) {
    console.error('更新状态错误：', err)
    if (err.response) {
      ElMessage.error(err.response.data.msg || '状态更新失败')
    } else if (err.request) {
      ElMessage.error('网络错误，请检查后端服务')
    } else {
      ElMessage.error('请求失败：' + err.message)
    }
  }
  statusLoading.value = false
}

const handleSignOrder = (row) => {
  console.log('当前订单信息：', row)
  signForm.id = row.id
  signForm.order_no = row.order_no
  signForm.signer = ''
  signForm.remark = ''
  showSignDialog.value = true
}

const submitSignOrder = async () => {
  if (!signForm.signer) return ElMessage.warning('请输入签收人')
  statusLoading.value = true
  try {
    const response = await axios.put(`${API_BASE}/orders/${signForm.id}/sign`, {
      signer: signForm.signer,
      remark: signForm.remark
    })
    if (response.data.code === 200) {
      ElMessage.success('签收成功')
      showSignDialog.value = false
      handleQuery()
    } else {
      ElMessage.error(response.data.msg || '签收失败')
    }
  } catch (err) {
    console.error('签收错误：', err)
    if (err.response) {
      ElMessage.error(err.response.data.msg || '签收失败')
    } else if (err.request) {
      ElMessage.error('网络错误，请检查后端服务')
    } else {
      ElMessage.error('请求失败：' + err.message)
    }
  }
  statusLoading.value = false
}

const formatDate = (d) => new Date(d).toLocaleString()

onMounted(() => {
  handleQuery()
})
</script>

<style scoped>
.order-page { padding: 20px; }
.pagination-container { margin-top: 20px; display: flex; justify-content: flex-end; }
</style>
