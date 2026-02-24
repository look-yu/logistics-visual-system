<template>
  <div class="inout-register">
    <div class="page-header">
      <h3>出入库登记</h3>
      <el-button type="primary" icon="Refresh" @click="fetchData">刷新记录</el-button>
    </div>

    <el-row :gutter="20">
      <!-- 登记表单 -->
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <el-radio-group v-model="formType" size="small">
              <el-radio label="in">入库登记</el-radio>
              <el-radio label="out">出库登记</el-radio>
            </el-radio-group>
          </template>
          <el-form 
            :model="inOutForm" 
            label-width="80px" 
            :rules="inOutRules" 
            ref="inOutFormRef"
            label-position="left"
          >
            <el-form-item label="物料名称" prop="goodsId">
              <el-select v-model="inOutForm.goodsId" placeholder="请选择物料" @change="checkStock">
                <el-option 
                  v-for="goods in dataStore.goodsList" 
                  :key="goods.goodsId" 
                  :label="`${goods.goodsName} (当前库存：${goods.currentStock})`" 
                  :value="goods.goodsId"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="数量" prop="num">
              <el-input 
                v-model="inOutForm.num" 
                type="number" 
                min="1" 
                placeholder="请输入数量"
                @blur="checkStock"
              />
              <div v-if="stockWarn" class="stock-warn">{{ stockWarn }}</div>
            </el-form-item>
            <el-form-item label="操作人" prop="operator">
              <el-input v-model="inOutForm.operator" placeholder="请输入操作人姓名" />
            </el-form-item>
            <el-form-item label="出库原因" prop="reason" v-if="formType === 'out'">
              <el-select v-model="inOutForm.reason" placeholder="请选择出库原因">
                <el-option label="订单配送" value="配送" />
                <el-option label="退货" value="退货" />
                <el-option label="盘点调整" value="盘点" />
                <el-option label="其他" value="其他" />
              </el-select>
            </el-form-item>
            <el-form-item label="备注">
              <el-input v-model="inOutForm.remark" type="textarea" rows="2" placeholder="选填" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="submitForm">提交登记</el-button>
              <el-button @click="resetForm">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <!-- 出入库记录 -->
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>近30天出入库记录</span>
              <el-select v-model="recordFilter" placeholder="筛选类型" size="small" style="width: 100px;">
                <el-option label="全部" value="" />
                <el-option label="入库" value="入库" />
                <el-option label="出库" value="出库" />
              </el-select>
            </div>
          </template>
          <el-table :data="filterRecordList" border size="small" v-loading="loading">
            <el-table-column prop="id" label="ID" width="60" />
            <el-table-column prop="time" label="操作时间" width="180" />
            <el-table-column prop="goodsName" label="物料名称" width="150" />
            <el-table-column prop="type" label="操作类型" width="100">
              <template #default="scope">
                <el-tag :type="scope.row.type === '入库' ? 'success' : 'primary'">
                  {{ scope.row.type }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="num" label="数量" width="80" />
            <el-table-column prop="operator" label="操作人" width="120" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useDataStore } from '../../stores/dataStore'
import { submitInOutStock, getStockData } from '../../api/index'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'

// 全局状态
const dataStore = useDataStore()

// 表单类型（in=入库，out=出库）
const formType = ref('in')
// 记录筛选
const recordFilter = ref('')
// 加载状态
const loading = ref(false)
// 库存警告
const stockWarn = ref('')
// 表单引用
const inOutFormRef = ref(null)

// 登记表单数据
const inOutForm = ref({
  goodsId: '',
  num: '',
  operator: '',
  reason: '',
  remark: ''
})

// 表单校验规则
const inOutRules = ref({
  goodsId: [{ required: true, message: '请选择物料', trigger: 'change' }],
  num: [{ required: true, message: '请输入数量', trigger: 'blur' }],
  operator: [{ required: true, message: '请输入操作人', trigger: 'blur' }],
  reason: [{ required: true, message: '请选择出库原因', trigger: 'change' }]
})

// 计算属性：筛选记录列表
const filterRecordList = computed(() => {
  if (!recordFilter.value) return dataStore.inOutRecord
  return dataStore.inOutRecord.filter(item => item.type === recordFilter.value)
})

// 检查库存（出库时）
const checkStock = () => {
  stockWarn.value = ''
  if (formType.value === 'out' && inOutForm.value.goodsId && inOutForm.value.num) {
    const goods = dataStore.goodsList.find(item => item.goodsId === inOutForm.value.goodsId)
    if (goods && Number(inOutForm.value.num) > goods.currentStock) {
      stockWarn.value = `库存不足！当前库存：${goods.currentStock}`
    }
  }
}

// 加载数据
const fetchData = async () => {
  loading.value = true
  try {
    await dataStore.fetchStockData()
    ElMessage.success('数据刷新成功！')
  } catch (err) {
    ElMessage.error('数据刷新失败：' + err.message)
  } finally {
    loading.value = false
  }
}

// 重置表单
const resetForm = () => {
  inOutFormRef.value.resetFields()
  inOutForm.value = {
    goodsId: '',
    num: '',
    operator: '',
    reason: '',
    remark: ''
  }
  stockWarn.value = ''
}

// 提交表单
const submitForm = async () => {
  // 先检查库存
  checkStock()
  if (stockWarn.value) {
    ElMessage.warning(stockWarn.value)
    return
  }

  try {
    // 表单校验
    await inOutFormRef.value.validate()
    
    // 确认提交
    const title = formType.value === 'in' ? '入库登记' : '出库登记'
    await ElMessageBox.confirm(
      `确认${title}？提交后将更新库存数据`,
      '提交确认',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    // 组装数据
    const submitData = {
      ...inOutForm.value,
      type: formType.value === 'in' ? '入库' : '出库',
      time: new Date().toLocaleString()
    }
    
    // 提交请求
    const res = await submitInOutStock(submitData)
    if (res.data.code === 200) {
      // 更新本地库存
      dataStore.updateStock(
        submitData.goodsId, 
        Number(submitData.num), 
        formType.value
      )
      
      // 新增记录
      dataStore.inOutRecord.unshift({
        id: Date.now(),
        ...submitData,
        goodsName: dataStore.goodsList.find(item => item.goodsId === submitData.goodsId)?.goodsName || ''
      })
      
      ElMessage.success(`${submitData.type}登记成功！`)
      // 重置表单
      resetForm()
      // 刷新数据
      fetchData()
    }
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error('登记失败：' + (err.message || '系统异常'))
    }
  }
}

// 页面加载时初始化
onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.inout-register {
  padding: 10px 0;
  width: 100%;
  box-sizing: border-box;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.page-header h3 {
  margin: 0;
  color: #333;
  font-size: 18px;
  font-weight: 600;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.stock-warn {
  color: #f5222d;
  font-size: 12px;
  margin-top: 5px;
}
.el-form {
  --el-form-item-label-color: #666;
}
</style>