<template>
  <div class="customer-page">
    <el-card>
      <template #header>
        <div class="page-header">
          <h2>客户中心</h2>
          <el-tag type="success">欢迎，{{ user?.real_name }}</el-tag>
        </div>
      </template>

      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="我的订单" name="orders">
          <div class="action-bar">
            <el-button type="primary" @click="openAddDialog">新建订单</el-button>
          </div>
          <div class="search-bar">
            <el-form :inline="true" :model="queryParams">
              <el-form-item label="订单号">
                <el-input v-model="queryParams.order_no" placeholder="输入订单号" clearable style="width: 200px" />
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
                <el-button @click="resetQuery">重置</el-button>
              </el-form-item>
            </el-form>
          </div>
          <el-table :data="orderList" border stripe v-loading="loading">
            <el-table-column prop="order_no" label="订单号" width="180" />
            <el-table-column prop="status" label="状态" width="120">
              <template #default="{ row }">
                <el-tag :type="statusTypeMap[row.status]">{{ statusNameMap[row.status] }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="receiver_address" label="收货地址" show-overflow-tooltip />
            <el-table-column prop="goods_type" label="货物类型" width="120" />
            <el-table-column prop="amount" label="金额" width="100">
              <template #default="{ row }">¥{{ row.amount }}</template>
            </el-table-column>
            <el-table-column prop="create_time" label="创建时间" width="180" />
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" @click="handleDetail(row)">详情</el-button>
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
        </el-tab-pane>

        <el-tab-pane label="服务请求" name="requests">
          <div class="action-bar">
            <el-button type="primary" @click="openRequestDialog">新建请求</el-button>
          </div>
          <el-table :data="requestList" border stripe v-loading="requestLoading">
            <el-table-column prop="request_no" label="请求编号" width="120" />
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
            <el-table-column prop="create_time" label="创建时间" width="160" />
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" @click="handleRequestDetail(row)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination-container">
            <el-pagination
              v-model:current-page="requestQueryParams.page"
              :total="requestTotal"
              layout="total, prev, pager, next"
              @current-change="handleRequestQuery"
            />
          </div>
        </el-tab-pane>

        <el-tab-pane label="运输路线查询" name="routes">
          <div class="search-bar">
            <el-form :inline="true" :model="routeQueryParams">
              <el-form-item label="订单号">
                <el-input v-model="routeQueryParams.order_no" placeholder="输入订单号" clearable style="width: 200px" />
              </el-form-item>
              <el-form-item label="出发地">
                <el-input v-model="routeQueryParams.sender_address" placeholder="输入出发地" clearable style="width: 200px" />
              </el-form-item>
              <el-form-item label="目的地">
                <el-input v-model="routeQueryParams.receiver_address" placeholder="输入目的地" clearable style="width: 200px" />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="handleRouteQuery">查询</el-button>
                <el-button @click="resetRouteQuery">重置</el-button>
              </el-form-item>
            </el-form>
          </div>
          <el-table :data="routeList" border stripe v-loading="routeLoading">
            <el-table-column prop="order_no" label="订单号" width="180" />
            <el-table-column prop="sender_address" label="出发地" width="200" />
            <el-table-column prop="receiver_address" label="目的地" width="200" />
            <el-table-column prop="goods_type" label="货物类型" width="120" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="statusTypeMap[row.status]">{{ statusNameMap[row.status] }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="create_time" label="创建时间" width="180" />
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" @click="handleRouteDetail(row)">查看路线</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination-container">
            <el-pagination
              v-model:current-page="routeQueryParams.page"
              :total="routeTotal"
              layout="total, prev, pager, next"
              @current-change="handleRouteQuery"
            />
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <el-dialog v-model="showAddDialog" title="新建订单" width="600px">
      <el-form :model="orderForm" label-width="100px" :rules="orderRules" ref="orderFormRef">
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
        <el-descriptions-item label="发货地址">{{ currentOrder.sender_address }}</el-descriptions-item>
        <el-descriptions-item label="收货地址">{{ currentOrder.receiver_address }}</el-descriptions-item>
        <el-descriptions-item label="商品类型">{{ currentOrder.goods_type }}</el-descriptions-item>
        <el-descriptions-item label="重量">{{ currentOrder.weight }}kg</el-descriptions-item>
        <el-descriptions-item label="金额" :span="2">¥{{ currentOrder.amount }}</el-descriptions-item>
        <el-descriptions-item label="下单时间" :span="2">{{ formatDate(currentOrder.create_time) }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="showDetailDialog = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showRequestDialog" title="新建服务请求" width="600px">
      <el-form :model="requestForm" :rules="requestRules" ref="requestFormRef" label-width="120px">
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

    <el-dialog v-model="showRouteDetailDialog" title="运输路线详情" width="1000px">
      <div v-if="currentRoute">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="订单号">{{ currentRoute.order_no }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="statusTypeMap[currentRoute.status]">{{ statusNameMap[currentRoute.status] }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="出发地">{{ currentRoute.sender_address }}</el-descriptions-item>
          <el-descriptions-item label="目的地">{{ currentRoute.receiver_address }}</el-descriptions-item>
          <el-descriptions-item label="货物类型">{{ currentRoute.goods_type }}</el-descriptions-item>
          <el-descriptions-item label="重量">{{ currentRoute.weight }}kg</el-descriptions-item>
          <el-descriptions-item label="金额">¥{{ currentRoute.amount }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDate(currentRoute.create_time) }}</el-descriptions-item>
        </el-descriptions>
        
        <div class="route-info" style="margin-top: 20px;">
          <h4>路线地图</h4>
          <div class="map-container" style="height: 500px; border: 1px solid #e6e6e6; border-radius: 4px;">
            <AMapView 
              v-if="showRouteDetailDialog"
              :points="routePoints"
              :center="mapCenter"
              :zoom="5"
            />
          </div>
          <div style="margin-top: 15px;">
            <el-alert v-if="currentRoute.status === 'shipping'" type="success" :closable="false">
              订单正在运输中，预计到达时间：2-3天
            </el-alert>
            <el-alert v-else-if="currentRoute.status === 'delivered'" type="success" :closable="false">
              订单已送达
            </el-alert>
            <el-alert v-else type="info" :closable="false">
              订单待分配车辆
            </el-alert>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button type="primary" @click="showRouteDetailDialog = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, nextTick } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useDataStore } from '../stores/dataStore'
import AMapView from '../components/AMapView.vue'

const API_BASE = 'http://localhost:5001/api'
const store = useDataStore()
const user = computed(() => store.user)

const loading = ref(false)
const submitLoading = ref(false)
const requestSubmitLoading = ref(false)
const routeLoading = ref(false)
const showAddDialog = ref(false)
const showDetailDialog = ref(false)
const showRequestDialog = ref(false)
const showRequestDetailDialog = ref(false)
const showRouteDetailDialog = ref(false)
const orderList = ref([])
const total = ref(0)
const currentOrder = ref(null)
const orderFormRef = ref(null)
const requestFormRef = ref(null)
const activeTab = ref('orders')

const queryParams = reactive({ page: 1, size: 10, customer_name: '', order_no: '', status: '' })
const routeQueryParams = reactive({ page: 1, size: 10, customer_name: '', order_no: '', sender_address: '', receiver_address: '' })
const routeList = ref([])
const routeTotal = ref(0)
const currentRoute = ref(null)
const routePoints = ref([])
const mapCenter = ref([116.397428, 39.90923])

const cityCoordMap = {
  '北京': [116.397428, 39.90923],
  '上海': [121.473701, 31.230416],
  '广州': [113.264434, 23.129162],
  '深圳': [114.085947, 22.547],
  '杭州': [120.153576, 30.287459],
  '南京': [118.767413, 32.041544],
  '武汉': [114.305393, 30.593099],
  '成都': [104.065735, 30.659462],
  '重庆': [106.551556, 29.563009],
  '西安': [108.948024, 34.263161],
  '天津': [117.190182, 39.125596],
  '苏州': [120.619585, 31.299379],
  '郑州': [113.625368, 34.746599],
  '长沙': [112.938814, 28.228209],
  '沈阳': [123.429096, 41.796767],
  '青岛': [120.38264, 36.067082],
  '大连': [121.618622, 38.91459],
  '厦门': [118.089425, 24.479833],
  '福州': [119.306239, 26.074508],
  '济南': [117.120128, 36.651039],
  '石家庄': [114.51486, 38.042307],
  '太原': [112.548879, 37.87059],
  '合肥': [117.227239, 31.820587],
  '南昌': [115.857972, 28.682894],
  '南宁': [108.366098, 22.817221],
  '昆明': [102.832891, 24.880095],
  '贵阳': [106.630153, 26.647661],
  '兰州': [103.834303, 36.06108],
  '乌鲁木齐': [87.616848, 43.825592],
  '拉萨': [91.117212, 29.646922],
  '呼和浩特': [111.74918, 40.842585],
  '哈尔滨': [126.534967, 45.803775],
  '长春': [125.323544, 43.817072],
  '海口': [110.199889, 20.017377],
  '三亚': [109.511909, 18.252847],
  '银川': [106.230909, 38.487193],
  '西宁': [101.778228, 36.617144],
  '襄阳': [112.144146, 32.009704],
  '莫斯科': [37.617298, 55.755825]
}
const orderForm = reactive({ 
  sender_address: '', 
  receiver_address: '',
  goods_type: '普通货物',
  weight: 1.0,
  volume: 0.1,
  base_price: 100.0
})

const weightFee = ref(0)
const volumeFee = ref(0)
const goodsTypeFee = ref(0)
const totalAmount = ref(0)

const statusNameMap = { pending: '待处理', assigned: '已分配', shipping: '运输中', delivered: '已送达' }
const statusTypeMap = { pending: 'info', assigned: 'primary', shipping: 'warning', delivered: 'success' }

const orderRules = {
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
    const res = await axios.get(`${API_BASE}/orders`, { params: { ...queryParams, customer_name: user.value?.real_name } })
    orderList.value = res.data.data.list
    total.value = res.data.data.total
  } catch (err) { ElMessage.error('获取订单列表失败') }
  loading.value = false
}

const resetQuery = () => {
  queryParams.order_no = ''
  queryParams.status = ''
  handleQuery()
}

const handleRouteQuery = async () => {
  routeLoading.value = true
  try {
    const res = await axios.get(`${API_BASE}/orders`, { params: { ...routeQueryParams, customer_name: user.value?.real_name } })
    routeList.value = res.data.data.list
    routeTotal.value = res.data.data.total
  } catch (err) { ElMessage.error('获取路线列表失败') }
  routeLoading.value = false
}

const resetRouteQuery = () => {
  routeQueryParams.order_no = ''
  routeQueryParams.sender_address = ''
  routeQueryParams.receiver_address = ''
  handleRouteQuery()
}

const handleRouteDetail = (row) => {
  currentRoute.value = row
  
  const fromCity = extractCity(row.sender_address)
  const toCity = extractCity(row.receiver_address)
  
  const fromCoord = cityCoordMap[fromCity] || [116.397428, 39.90923]
  const toCoord = cityCoordMap[toCity] || [121.473701, 31.230416]
  
  routePoints.value = [{
    order_no: row.order_no,
    fromCoord: fromCoord,
    toCoord: toCoord,
    status: row.status
  }]
  
  mapCenter.value = [((fromCoord[0] + toCoord[0]) / 2), ((fromCoord[1] + toCoord[1]) / 2)]
  
  showRouteDetailDialog.value = true
}

const extractCity = (address) => {
  for (const city in cityCoordMap) {
    if (address.includes(city)) {
      return city
    }
  }
  return '北京'
}

const submitOrder = async () => {
  if (!orderFormRef.value) return
  
  await orderFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    submitLoading.value = true
    try {
      const orderData = {
        ...orderForm,
        customer_name: user.value?.real_name,
        amount: parseFloat(totalAmount.value)
      }
      await axios.post(`${API_BASE}/orders`, orderData)
      ElMessage.success('下单成功')
      showAddDialog.value = false
      resetOrderForm()
      handleQuery()
    } catch (err) { 
      console.error('下单失败：', err)
      ElMessage.error('下单失败：' + (err.response?.data?.msg || err.message)) 
    }
    submitLoading.value = false
  })
}

const resetOrderForm = () => {
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
    ElMessage.error(err.response?.data?.msg || '获取订单详情失败')
  }
}

const formatDate = (d) => new Date(d).toLocaleString()

const requestLoading = ref(false)
const requestList = ref([])
const requestTotal = ref(0)
const currentRequest = ref(null)

const requestQueryParams = reactive({ page: 1, size: 10, customer_name: '' })
const requestForm = reactive({
  request_type: '',
  request_title: '',
  priority: 'normal',
  request_content: ''
})

const requestRules = {
  request_type: [{ required: true, message: '请选择请求类型', trigger: 'change' }],
  request_title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  priority: [{ required: true, message: '请选择优先级', trigger: 'change' }],
  request_content: [{ required: true, message: '请输入内容', trigger: 'blur' }]
}

const requestTypeNameMap = { inquiry: '咨询', complaint: '投诉', suggestion: '建议', other: '其他' }
const requestStatusNameMap = { pending: '待处理', processing: '处理中', resolved: '已解决', closed: '已关闭' }
const requestStatusTypeMap = { pending: 'info', processing: 'warning', resolved: 'success', closed: 'info' }
const priorityNameMap = { high: '高', normal: '中', low: '低' }
const priorityTypeMap = { high: 'danger', normal: 'warning', low: 'info' }

const handleRequestQuery = async () => {
  requestLoading.value = true
  try {
    const res = await axios.get(`${API_BASE}/service-requests`, { params: { ...requestQueryParams, customer_name: user.value?.real_name } })
    requestList.value = res.data.data.list
    requestTotal.value = res.data.data.total
  } catch (err) { ElMessage.error('获取服务请求列表失败') }
  requestLoading.value = false
}

const openRequestDialog = () => {
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
      await axios.post(`${API_BASE}/service-requests`, {
        ...requestForm,
        customer_id: user.value?.id
      })
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

onMounted(() => {
  handleQuery()
})
</script>

<style scoped>
.customer-page { padding: 20px; }
.page-header { display: flex; justify-content: space-between; align-items: center; }
.page-header h2 { margin: 0; }
.action-bar { margin-bottom: 20px; }
.search-bar { margin-bottom: 20px; padding: 15px; background: #f5f7fa; border-radius: 4px; }
.pagination-container { margin-top: 20px; display: flex; justify-content: flex-end; }
</style>
