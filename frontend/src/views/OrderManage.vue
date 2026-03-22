<template>
  <div class="order-page">
    <el-card>
      <template #header>
        <el-tabs v-model="activeTab" @tab-change="handleTabChange">
          <el-tab-pane label="订单管理" name="orders">
            <div class="filter-bar">
              <el-form :inline="true" :model="queryParams">
                <el-form-item label="订单号">
                  <el-input v-model="queryParams.order_no" placeholder="输入订单号" clearable />
                </el-form-item>
                <el-form-item label="状态">
                  <el-select v-model="queryParams.status" placeholder="全部状态" clearable style="width: 150px">
                    <el-option label="待处理" value="pending" />
                    <el-option label="已分配" value="assigned" />
                    <el-option label="运输中" value="shipping" />
                    <el-option label="已送达" value="delivered" />
                  </el-select>
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="handleQuery">查询</el-button>
                  <el-button type="success" @click="openAddDialog">新增订单</el-button>
                </el-form-item>
              </el-form>
            </div>
          </el-tab-pane>
          <el-tab-pane label="服务请求" name="requests">
            <div class="filter-bar">
              <el-form :inline="true" :model="requestQueryParams">
                <el-form-item label="请求标题">
                  <el-input v-model="requestQueryParams.keyword" placeholder="输入标题或编号" clearable />
                </el-form-item>
                <el-form-item label="请求类型">
                  <el-select v-model="requestQueryParams.request_type" placeholder="全部类型" clearable style="width: 150px">
                    <el-option label="咨询" value="inquiry" />
                    <el-option label="投诉" value="complaint" />
                    <el-option label="建议" value="suggestion" />
                    <el-option label="其他" value="other" />
                  </el-select>
                </el-form-item>
                <el-form-item label="状态">
                  <el-select v-model="requestQueryParams.status" placeholder="全部状态" clearable style="width: 150px">
                    <el-option label="待处理" value="pending" />
                    <el-option label="处理中" value="processing" />
                    <el-option label="已解决" value="resolved" />
                    <el-option label="已关闭" value="closed" />
                  </el-select>
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="handleRequestQuery">查询</el-button>
                  <el-button type="success" @click="openRequestDialog">新增请求</el-button>
                </el-form-item>
              </el-form>
            </div>
          </el-tab-pane>
        </el-tabs>
      </template>

      <el-table :data="orderList" border stripe v-loading="loading" v-if="activeTab === 'orders'">
        <el-table-column prop="order_no" label="订单号" width="180" />
        <el-table-column prop="customer_name" label="客户" width="120" />
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="statusTypeMap[row.status]">{{ statusNameMap[row.status] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="receiver_address" label="收货地址" show-overflow-tooltip />
        <el-table-column prop="create_time" label="创建时间" width="180" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleDetail(row)">详情</el-button>
            <el-button link type="warning" @click="handleUpdateStatus(row)">更新状态</el-button>
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

    <el-table :data="requestList" border stripe v-loading="requestLoading" v-if="activeTab === 'requests'">
      <el-table-column prop="request_no" label="请求编号" width="120" />
      <el-table-column prop="customer_name" label="客户名称" width="120" />
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
          <el-tag :type="requestStatusTypeMap[row.status]">{{ requestStatusNameMap[row.status] }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="handler_name" label="处理人" width="100" />
      <el-table-column prop="create_time" label="创建时间" width="160" />
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="handleRequestDetail(row)">详情</el-button>
          <el-button link type="success" @click="handleProcessRequest(row)" v-if="row.status === 'pending' || row.status === 'processing'">处理</el-button>
          <el-button link type="danger" @click="handleDeleteRequest(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-container" v-if="activeTab === 'requests'">
      <el-pagination
        v-model:current-page="requestQueryParams.page"
        :total="requestTotal"
        layout="total, prev, pager, next"
        @current-change="handleRequestQuery"
      />
    </div>
    </el-card>

    <el-dialog v-model="showAddDialog" title="录入新订单" width="600px">
      <el-form :model="orderForm" label-width="100px" :rules="orderRules" ref="orderFormRef">
        <el-form-item label="客户名称" prop="customer_name">
          <el-input v-model="orderForm.customer_name" placeholder="请输入客户名称" />
        </el-form-item>
        <el-form-item label="发货地址" prop="sender_address">
          <el-input v-model="orderForm.sender_address" placeholder="请输入发货地址" />
        </el-form-item>
        <el-form-item label="收货地址" prop="receiver_address">
          <el-input v-model="orderForm.receiver_address" placeholder="请输入收货地址" />
        </el-form-item>
        <el-divider content-position="left">货物信息</el-divider>
        <el-form-item label="货物类型" prop="goods_type">
          <el-select v-model="orderForm.goods_type" placeholder="请选择货物类型" style="width: 100%" @change="calculatePrice">
            <el-option label="普通货物" value="普通货物" />
            <el-option label="生鲜食品" value="生鲜食品" />
            <el-option label="电子产品" value="电子产品" />
            <el-option label="危险品" value="危险品" />
            <el-option label="贵重物品" value="贵重物品" />
            <el-option label="大件货物" value="大件货物" />
          </el-select>
        </el-form-item>
        <el-form-item label="重量" prop="weight">
          <el-input-number v-model="orderForm.weight" :min="0.1" :max="10000" :precision="2" :step="0.5" style="width: 100%" @change="calculatePrice" />
          <span style="margin-left: 10px; color: #909399;">公斤</span>
        </el-form-item>
        <el-form-item label="体积" prop="volume">
          <el-input-number v-model="orderForm.volume" :min="0.01" :max="1000" :precision="2" :step="0.1" style="width: 100%" @change="calculatePrice" />
          <span style="margin-left: 10px; color: #909399;">立方米</span>
        </el-form-item>
        <el-divider content-position="left">价格信息</el-divider>
        <el-form-item label="基础运费" prop="base_price">
          <el-input-number v-model="orderForm.base_price" :min="0" :precision="2" :step="10" style="width: 100%" @change="calculatePrice" />
          <span style="margin-left: 10px; color: #909399;">元</span>
        </el-form-item>
        <el-form-item label="重量附加费">
          <el-input v-model="weightFee" disabled style="width: 100%">
            <template #append>元</template>
          </el-input>
        </el-form-item>
        <el-form-item label="体积附加费">
          <el-input v-model="volumeFee" disabled style="width: 100%">
            <template #append>元</template>
          </el-input>
        </el-form-item>
        <el-form-item label="货物类型附加费">
          <el-input v-model="goodsTypeFee" disabled style="width: 100%">
            <template #append>元</template>
          </el-input>
        </el-form-item>
        <el-form-item label="总金额">
          <el-input v-model="totalAmount" disabled style="width: 100%; font-weight: bold; font-size: 16px;">
            <template #append>元</template>
          </el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="submitOrder" :loading="submitLoading">确定</el-button>
      </template>
    </el-dialog>

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

    <el-dialog v-model="showRequestDialog" title="新增服务请求" width="600px">
      <el-form :model="requestForm" :rules="requestRules" ref="requestFormRef" label-width="120px">
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
      </el-form>
      <template #footer>
        <el-button @click="showRequestDialog = false">取消</el-button>
        <el-button type="primary" @click="submitRequest" :loading="requestSubmitLoading">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showRequestDetailDialog" title="请求详情" width="700px">
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
          <el-tag :type="requestStatusTypeMap[currentRequest.status]">{{ requestStatusNameMap[currentRequest.status] }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="处理人">{{ currentRequest.handler_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="响应时间">{{ currentRequest.response_time ? `${currentRequest.response_time}分钟` : '-' }}</el-descriptions-item>
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
        <el-button type="primary" @click="showRequestDetailDialog = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showProcessRequestDialog" title="处理请求" width="500px">
      <el-form :model="processRequestForm" :rules="processRequestRules" ref="processRequestFormRef" label-width="120px">
        <el-form-item label="处理人姓名" prop="handler_name">
          <el-input v-model="processRequestForm.handler_name" placeholder="请输入处理人姓名" />
        </el-form-item>
        <el-form-item label="处理结果" prop="handle_result">
          <el-input v-model="processRequestForm.handle_result" type="textarea" :rows="5" placeholder="请输入处理结果" />
        </el-form-item>
        <el-form-item label="客户满意度" prop="customer_satisfaction">
          <el-rate v-model="processRequestForm.customer_satisfaction" show-text />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showProcessRequestDialog = false">取消</el-button>
        <el-button type="primary" @click="submitProcessRequest" :loading="processRequestLoading">提交</el-button>
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
const submitLoading = ref(false)
const statusLoading = ref(false)
const showAddDialog = ref(false)
const showDetailDialog = ref(false)
const showStatusDialog = ref(false)
const orderList = ref([])
const total = ref(0)
const currentOrder = ref(null)
const orderFormRef = ref(null)
const activeTab = ref('orders')

const queryParams = reactive({ page: 1, size: 10, order_no: '', status: '' })
const orderForm = reactive({ 
  customer_name: '', 
  sender_address: '', 
  receiver_address: '',
  goods_type: '普通货物',
  weight: 1.0,
  volume: 0.1,
  base_price: 100.0
})
const statusForm = reactive({ id: '', order_no: '', status: '', reason: '' })

const weightFee = ref(0)
const volumeFee = ref(0)
const goodsTypeFee = ref(0)
const totalAmount = ref(0)

const statusNameMap = { pending: '待处理', assigned: '已分配', shipping: '运输中', delivered: '已送达' }
const statusTypeMap = { pending: 'info', assigned: 'primary', shipping: 'warning', delivered: 'success' }

const orderRules = {
  customer_name: [{ required: true, message: '请输入客户名称', trigger: 'blur' }],
  sender_address: [{ required: true, message: '请输入发货地址', trigger: 'blur' }],
  receiver_address: [{ required: true, message: '请输入收货地址', trigger: 'blur' }],
  goods_type: [{ required: true, message: '请选择货物类型', trigger: 'change' }],
  weight: [{ required: true, message: '请输入重量', trigger: 'blur' }],
  volume: [{ required: true, message: '请输入体积', trigger: 'blur' }],
  base_price: [{ required: true, message: '请输入基础运费', trigger: 'blur' }]
}

const goodsTypePriceMap = {
  '普通货物': 1.0,
  '生鲜食品': 1.5,
  '电子产品': 1.3,
  '危险品': 2.0,
  '贵重物品': 2.5,
  '大件货物': 1.8
}

const calculatePrice = () => {
  const weightPrice = orderForm.weight * 2
  const volumePrice = orderForm.volume * 50
  const goodsTypeMultiplier = goodsTypePriceMap[orderForm.goods_type] || 1.0
  const goodsTypePrice = orderForm.base_price * (goodsTypeMultiplier - 1)
  
  weightFee.value = weightPrice.toFixed(2)
  volumeFee.value = volumePrice.toFixed(2)
  goodsTypeFee.value = goodsTypePrice.toFixed(2)
  
  const total = parseFloat(orderForm.base_price) + weightPrice + volumePrice + goodsTypePrice
  totalAmount.value = total.toFixed(2)
}

const handleTabChange = (tab) => {
  if (tab === 'orders') {
    handleQuery()
  } else if (tab === 'requests') {
    handleRequestQuery()
  }
}

const handleQuery = async () => {
  loading.value = true
  try {
    const res = await axios.get(`${API_BASE}/orders`, { params: queryParams })
    orderList.value = res.data.data.list
    total.value = res.data.data.total
  } catch (err) { ElMessage.error('获取订单列表失败') }
  loading.value = false
}

const submitOrder = async () => {
  if (!orderFormRef.value) return
  
  await orderFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    submitLoading.value = true
    try {
      const orderData = {
        ...orderForm,
        amount: parseFloat(totalAmount.value)
      }
      await axios.post(`${API_BASE}/orders`, orderData)
      ElMessage.success('录入成功')
      showAddDialog.value = false
      resetOrderForm()
      handleQuery()
    } catch (err) { 
      console.error('录入失败：', err)
      ElMessage.error('录入失败：' + (err.response?.data?.msg || err.message)) 
    }
    submitLoading.value = false
  })
}

const resetOrderForm = () => {
  orderForm.customer_name = ''
  orderForm.sender_address = ''
  orderForm.receiver_address = ''
  orderForm.goods_type = '普通货物'
  orderForm.weight = 1.0
  orderForm.volume = 0.1
  orderForm.base_price = 100.0
  weightFee.value = 0
  volumeFee.value = 0
  goodsTypeFee.value = 0
  totalAmount.value = 0
  if (orderFormRef.value) {
    orderFormRef.value.clearValidate()
  }
}

const openAddDialog = () => {
  resetOrderForm()
  calculatePrice()
  showAddDialog.value = true
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

const formatDate = (d) => new Date(d).toLocaleString()

const requestLoading = ref(false)
const requestSubmitLoading = ref(false)
const processRequestLoading = ref(false)
const showRequestDialog = ref(false)
const showRequestDetailDialog = ref(false)
const showProcessRequestDialog = ref(false)
const requestList = ref([])
const requestTotal = ref(0)
const currentRequest = ref(null)
const customerList = ref([])
const requestFormRef = ref(null)
const processRequestFormRef = ref(null)

const requestQueryParams = reactive({ page: 1, size: 10, keyword: '', request_type: '', status: '' })
const requestForm = reactive({
  customer_id: '',
  request_type: '',
  request_title: '',
  priority: 'normal',
  request_content: ''
})
const processRequestForm = reactive({
  id: '',
  handler_name: '',
  handle_result: '',
  customer_satisfaction: 5
})

const requestRules = {
  customer_id: [{ required: true, message: '请选择客户', trigger: 'change' }],
  request_type: [{ required: true, message: '请选择请求类型', trigger: 'change' }],
  request_title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  priority: [{ required: true, message: '请选择优先级', trigger: 'change' }],
  request_content: [{ required: true, message: '请输入内容', trigger: 'blur' }]
}

const processRequestRules = {
  handler_name: [{ required: true, message: '请输入处理人姓名', trigger: 'blur' }],
  handle_result: [{ required: true, message: '请输入处理结果', trigger: 'blur' }]
}

const requestTypeNameMap = { inquiry: '咨询', complaint: '投诉', suggestion: '建议', other: '其他' }
const requestStatusNameMap = { pending: '待处理', processing: '处理中', resolved: '已解决', closed: '已关闭' }
const requestStatusTypeMap = { pending: 'info', processing: 'warning', resolved: 'success', closed: 'info' }
const priorityNameMap = { high: '高', normal: '中', low: '低' }
const priorityTypeMap = { high: 'danger', normal: 'warning', low: 'info' }

const loadCustomers = async () => {
  try {
    const res = await axios.get(`${API_BASE}/customers`)
    if (res.data.code === 200) {
      customerList.value = res.data.data.list || []
    }
  } catch (err) {
    console.error('获取客户列表失败：', err)
  }
}

const handleRequestQuery = async () => {
  requestLoading.value = true
  try {
    const res = await axios.get(`${API_BASE}/service-requests`, { params: requestQueryParams })
    requestList.value = res.data.data.list
    requestTotal.value = res.data.data.total
  } catch (err) { ElMessage.error('获取服务请求列表失败') }
  requestLoading.value = false
}

const openRequestDialog = () => {
  requestForm.customer_id = ''
  requestForm.request_type = ''
  requestForm.request_title = ''
  requestForm.priority = 'normal'
  requestForm.request_content = ''
  if (requestFormRef.value) {
    requestFormRef.value.clearValidate()
  }
  showRequestDialog.value = true
}

const submitRequest = async () => {
  if (!requestFormRef.value) return
  
  await requestFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    requestSubmitLoading.value = true
    try {
      await axios.post(`${API_BASE}/service-requests`, requestForm)
      ElMessage.success('创建成功')
      showRequestDialog.value = false
      handleRequestQuery()
    } catch (err) { 
      console.error('创建失败：', err)
      ElMessage.error('创建失败：' + (err.response?.data?.msg || err.message)) 
    }
    requestSubmitLoading.value = false
  })
}

const handleRequestDetail = async (row) => {
  try {
    const response = await axios.get(`${API_BASE}/service-requests/${row.id}`)
    if (response.data.code === 200) {
      currentRequest.value = response.data.data
      showRequestDetailDialog.value = true
    } else {
      ElMessage.error(response.data.msg || '获取请求详情失败')
    }
  } catch (err) {
    console.error('获取请求详情错误：', err)
    ElMessage.error(err.response?.data?.msg || '获取请求详情失败')
  }
}

const handleProcessRequest = (row) => {
  processRequestForm.id = row.id
  processRequestForm.handler_name = ''
  processRequestForm.handle_result = ''
  processRequestForm.customer_satisfaction = 5
  if (processRequestFormRef.value) {
    processRequestFormRef.value.clearValidate()
  }
  showProcessRequestDialog.value = true
}

const submitProcessRequest = async () => {
  if (!processRequestFormRef.value) return
  
  await processRequestFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    processRequestLoading.value = true
    try {
      await axios.put(`${API_BASE}/service-requests/${processRequestForm.id}/process`, processRequestForm)
      ElMessage.success('处理成功')
      showProcessRequestDialog.value = false
      handleRequestQuery()
    } catch (err) { 
      console.error('处理失败：', err)
      ElMessage.error('处理失败：' + (err.response?.data?.msg || err.message)) 
    }
    processRequestLoading.value = false
  })
}

const handleDeleteRequest = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该请求吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await axios.delete(`${API_BASE}/service-requests/${row.id}`)
    ElMessage.success('删除成功')
    handleRequestQuery()
  } catch (err) {
    if (err !== 'cancel') {
      console.error('删除失败：', err)
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
.order-page { padding: 20px; }
.pagination-container { margin-top: 20px; display: flex; justify-content: flex-end; }
</style>
