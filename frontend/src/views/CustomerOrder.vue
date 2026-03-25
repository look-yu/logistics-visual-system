<template>
  <div class="customer-order-page">
    <el-card class="order-card">
      <template #header>
        <div class="card-header">
          <div class="logo-section">
            <el-icon size="50" color="#fff"><Van /></el-icon>
            <h1 class="logo-title">物流可视化系统</h1>
          </div>
          <h2>客户下单</h2>
        </div>
      </template>

      <el-form :model="orderForm" :rules="orderRules" ref="orderFormRef" label-width="120px">
        <el-divider content-position="left">客户信息</el-divider>
        <el-form-item label="客户名称">
          <el-input v-model="customerInfo.customer_name" disabled />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="customerInfo.contact_phone" disabled />
        </el-form-item>

        <el-divider content-position="left">订单信息</el-divider>
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

        <el-divider content-position="left">价格明细（系统自动计算）</el-divider>
        <el-form-item label="基础运费">
          <el-input v-model="priceBreakdown.base_price" disabled style="width: 100%">
            <template #append>元</template>
          </el-input>
        </el-form-item>

        <el-form-item label="重量附加费">
          <el-input v-model="priceBreakdown.weight_price" disabled style="width: 100%">
            <template #append>元</template>
          </el-input>
        </el-form-item>

        <el-form-item label="体积附加费">
          <el-input v-model="priceBreakdown.volume_price" disabled style="width: 100%">
            <template #append>元</template>
          </el-input>
        </el-form-item>

        <el-form-item label="货物类型附加费">
          <el-input v-model="priceBreakdown.goods_type_price" disabled style="width: 100%">
            <template #append>元</template>
          </el-input>
        </el-form-item>

        <el-form-item label="总金额">
          <el-input v-model="priceBreakdown.total" disabled style="width: 100%; font-weight: bold; font-size: 18px; color: #F56C6C;">
            <template #append>元</template>
          </el-input>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSubmit" :loading="loading" style="width: 100%; font-size: 16px; padding: 12px;">提交订单</el-button>
        </el-form-item>

        <el-form-item>
          <div class="logout-link">
            <el-link type="danger" @click="handleLogout">退出登录</el-link>
          </div>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Van } from '@element-plus/icons-vue'
import axios from 'axios'

const router = useRouter()
const orderFormRef = ref(null)
const loading = ref(false)

const customerInfo = reactive({
  id: '',
  customer_code: '',
  username: '',
  customer_name: '',
  contact_person: '',
  contact_phone: '',
  contact_email: '',
  company_address: ''
})

const orderForm = reactive({
  customer_id: '',
  customer_name: '',
  sender_address: '',
  receiver_address: '',
  goods_type: '普通货物',
  weight: 1.0,
  volume: 0.1
})

const priceBreakdown = reactive({
  base_price: 0,
  weight_price: 0,
  volume_price: 0,
  goods_type_price: 0,
  total: 0
})

const orderRules = {
  sender_address: [
    { required: true, message: '请输入发货地址', trigger: 'blur' }
  ],
  receiver_address: [
    { required: true, message: '请输入收货地址', trigger: 'blur' }
  ],
  goods_type: [
    { required: true, message: '请选择货物类型', trigger: 'change' }
  ],
  weight: [
    { required: true, message: '请输入重量', trigger: 'blur' }
  ],
  volume: [
    { required: true, message: '请输入体积', trigger: 'blur' }
  ]
}

onMounted(() => {
  const customer = localStorage.getItem('customer')
  if (!customer) {
    ElMessage.warning('请先登录')
    router.push('/customer-login')
    return
  }

  const customerData = JSON.parse(customer)
  Object.assign(customerInfo, customerData)
  orderForm.customer_id = customerData.id
  orderForm.customer_name = customerData.customer_name

  calculatePrice()
})

const calculatePrice = async () => {
  try {
    const goodsTypeMap = {
      '普通货物': 'normal',
      '生鲜食品': 'fresh',
      '电子产品': 'electronics',
      '危险品': 'dangerous',
      '贵重物品': 'valuable',
      '大件货物': 'large'
    }

    const response = await axios.post('http://localhost:5001/api/price/calculate', {
      goods_type: goodsTypeMap[orderForm.goods_type] || 'normal',
      weight: orderForm.weight,
      volume: orderForm.volume
    })

    if (response.data.code === 200) {
      const data = response.data.data
      priceBreakdown.base_price = data.base_price
      priceBreakdown.weight_price = data.weight_fee
      priceBreakdown.volume_price = data.volume_fee
      priceBreakdown.goods_type_price = data.goods_type_fee
      priceBreakdown.total = data.total_amount
    }
  } catch (err) {
    console.error('计算价格失败：', err)
  }
}

const handleSubmit = async () => {
  if (!orderFormRef.value) return

  await orderFormRef.value.validate(async (valid) => {
    if (!valid) return

    loading.value = true
    try {
      const response = await axios.post('http://localhost:5001/api/orders/customer', {
        customer_id: orderForm.customer_id,
        customer_name: orderForm.customer_name,
        sender_address: orderForm.sender_address,
        receiver_address: orderForm.receiver_address,
        goods_type: orderForm.goods_type,
        weight: orderForm.weight,
        volume: orderForm.volume
      })

      if (response.data.code === 200) {
        ElMessageBox.alert(
          `订单提交成功！\n订单号：${response.data.data.order_no}\n订单金额：¥${response.data.data.amount}`,
          '下单成功',
          {
            confirmButtonText: '确定',
            type: 'success'
          }
        ).then(() => {
          router.push('/customer-home')
        })
      } else {
        ElMessage.error(response.data.msg || '下单失败')
      }
    } catch (err) {
      console.error('下单错误：', err)
      if (err.response) {
        ElMessage.error(err.response.data.msg || '下单失败')
      } else {
        ElMessage.error('网络错误，请检查后端服务')
      }
    }
    loading.value = false
  })
}

const handleLogout = () => {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    localStorage.removeItem('customer')
    ElMessage.success('已退出登录')
    router.push('/customer-login')
  }).catch(() => {})
}
</script>

<style scoped>
.customer-order-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 0;
  margin: 0;
}

.order-card {
  width: 100%;
  min-height: 100vh;
  border-radius: 0;
  box-shadow: none;
  border: none;
}

.card-header {
  text-align: center;
  padding: 40px 20px 20px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 0;
}

.logo-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  margin-bottom: 20px;
}

.logo-title {
  margin: 0;
  color: #fff;
  font-weight: 700;
  font-size: 36px;
  letter-spacing: 2px;
}

.card-header h2 {
  margin: 0;
  color: #fff;
  font-weight: 600;
  font-size: 28px;
}

.logout-link {
  text-align: center;
  width: 100%;
  padding-bottom: 40px;
}
</style>
