<template>
  <div class="capacity-dispatch">
    <div class="page-header">
      <h3>运力调度面板</h3>
      <!-- 原有：按钮组容器 -->
      <div class="header-buttons">
        <!-- 原有：刷新按钮 -->
        <el-button type="primary" icon="Refresh" @click="fetchData" :loading="isFetchLoading" style="margin-right: 10px;">
          刷新数据
        </el-button>
        <!-- 替换：复用型导出按钮（移除原有el-button导出按钮） -->
        <ExportButton
          :api="exportCapacityExcel"
          :params="currentFilterParams"
          fileNamePrefix="运力数据"
          :checkData="[dataStore.carList, dataStore.orderList]"
          text="导出Excel"
          size="default"
        />
      </div>
    </div>

    <!-- 原有：筛选栏组件 -->
    <FilterBar 
      @filter-change="handleFilterChange" 
      @drill-back="handleDrillBack"
      ref="filterBarRef"
      style="margin-bottom: 20px;"
    />

    <el-row :gutter="20">
      <!-- 原有：车辆/司机列表 -->
      <el-col :span="14">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>车辆/司机状态</span>
              <el-select v-model="carStatusFilter" placeholder="筛选状态" size="small" style="width: 120px;">
                <el-option label="全部" value="" />
                <el-option label="空闲" value="空闲" />
                <el-option label="在途" value="在途" />
                <el-option label="维修" value="维修" />
                <el-option label="已分配" value="已分配" />
              </el-select>
            </div>
          </template>
          <el-table :data="filterCarList" border size="small" v-loading="isTableLoading">
            <el-table-column prop="id" label="ID" width="60" />
            <el-table-column prop="carNo" label="车牌号" width="100" />
            <el-table-column prop="driver" label="司机姓名" width="100" />
            <el-table-column prop="phone" label="联系电话" width="130" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="scope">
                <StatusTag :status="scope.row.status" type="car" />
              </template>
            </el-table-column>
            <el-table-column prop="area" label="所属区域" width="120" />
            <el-table-column prop="load" label="载重(吨)" width="100" />
          </el-table>
        </el-card>
      </el-col>

      <!-- 原有：待分配运单 + 分配表单 -->
      <el-col :span="10">
        <el-card shadow="hover">
          <template #header>
            <span>待分配运单</span>
          </template>
          <el-table :data="orderList" border size="small" v-loading="isTableLoading">
            <el-table-column prop="orderId" label="订单号" width="180" />
            <el-table-column prop="goodsType" label="货物类型" width="100" />
            <el-table-column prop="weight" label="重量(吨)" width="100" />
            <el-table-column prop="area" label="配送区域" width="120" />
            <el-table-column prop="urgent" label="优先级" width="100">
              <template #default="scope">
                <el-tag type="danger" v-if="scope.row.urgent === '紧急'">紧急</el-tag>
                <el-tag type="info" v-else>普通</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="订单状态" width="100">
              <template #default="scope">
                <StatusTag :status="scope.row.status" type="order" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80">
              <template #default="scope">
                <el-button 
                  type="primary" 
                  size="small" 
                  @click="openAllocateDialog(scope.row)"
                  :disabled="scope.row.status === '已分配'"
                >
                  分配
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <!-- 原有：分配运单弹窗 -->
    <el-dialog title="分配运单" v-model="allocateDialogVisible" width="400px" :close-on-click-modal="false">
      <el-form :model="allocateForm" label-width="80px" :rules="allocateRules" ref="allocateFormRef">
        <el-form-item label="订单号" prop="orderId">
          <el-input v-model="allocateForm.orderId" disabled />
        </el-form-item>
        <el-form-item label="选择车辆" prop="carId">
          <el-select v-model="allocateForm.carId" placeholder="请选择空闲车辆">
            <el-option 
              v-for="car in carList.filter(item => item.status === '空闲')" 
              :key="car.id" 
              :label="`${car.carNo} (${car.driver})`" 
              :value="car.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="预计送达" prop="arriveTime">
          <el-date-picker 
            v-model="allocateForm.arriveTime" 
            type="datetime" 
            placeholder="选择预计送达时间" 
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="allocateForm.remark" type="textarea" rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="allocateDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAllocate" :loading="isSubmitLoading">
          确认分配
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useDataStore } from '../../stores/dataStore'
import { getCapacityData, allocateOrder } from '../../api/index'
import FilterBar from '../../components/FilterBar.vue'
import DrillDownHandler from '../../utils/DrillDownHandler.js'
import { getFilteredCapacityData } from '../../api/FilterApi.js'
import StatusTag from '../../components/StatusTag.vue'
import { ORDER_STATUS, CAR_STATUS } from '../../constants/StatusEnum.js'

// 替换：引入复用型导出按钮组件（移除原有Download图标/exportExcel方法相关导入）
import ExportButton from '../../components/ExportButton.vue'
import { exportCapacityExcel } from '../../api/ExportApi.js'

// 移除：Download图标导入（ExportButton内部已封装）
import { Refresh } from '@element-plus/icons-vue'

import { ElMessage, ElMessageBox } from 'element-plus'

// 全局状态
const dataStore = useDataStore()

// 原有：筛选条件
const carStatusFilter = ref('')
const currentFilterParams = ref({})
const filterBarRef = ref(null)

// 原有：弹窗控制
const allocateDialogVisible = ref(false)
const allocateFormRef = ref(null)

// 原有：加载状态（移除isExportLoading，ExportButton内置loading）
const isFetchLoading = ref(false)
const isSubmitLoading = ref(false)
const isTableLoading = ref(false)

// 原有：分配表单数据
const allocateForm = ref({
  orderId: '',
  carId: '',
  arriveTime: '',
  remark: ''
})

// 原有：表单校验规则
const allocateRules = ref({
  carId: [{ required: true, message: '请选择空闲车辆', trigger: 'change' }],
  arriveTime: [{ required: true, message: '请选择预计送达时间', trigger: 'change' }]
})

// 原有：计算属性
const filterCarList = computed(() => {
  if (!carStatusFilter.value) return dataStore.carList
  return dataStore.carList.filter(item => item.status === carStatusFilter.value)
})
const orderList = computed(() => dataStore.orderList)
const carList = computed(() => dataStore.carList)

// 原有：加载运力数据
const fetchData = async (params = {}) => {
  if (isFetchLoading.value) return
  isFetchLoading.value = true
  isTableLoading.value = true
  try {
    let res
    if (Object.keys(params).length > 0) {
      res = await getFilteredCapacityData(params)
    } else {
      res = await getCapacityData()
    }
    if (res.data.code === 200) {
      dataStore.setCarList(res.data.data.cars)
      dataStore.setOrderList(res.data.data.orders)
      ElMessage.success('数据刷新成功！')
    } else {
      ElMessage.error('数据刷新失败：' + res.data.msg)
    }
  } catch (err) {
    ElMessage.error('数据刷新失败：' + (err.message || '网络异常'))
  } finally {
    isFetchLoading.value = false
    isTableLoading.value = false
  }
}

// 原有：筛选条件变化处理
const handleFilterChange = (params) => {
  currentFilterParams.value = params
  fetchData(params)
}

// 原有：下钻返回上一级
const handleDrillBack = () => {
  currentFilterParams.value = {
    timeRange: '',
    area: 'all',
    drillDownLevel: '',
    drillDimension: ''
  }
  fetchData(currentFilterParams.value)
}

// 原有：图表下钻处理
const handleChartDrill = (echartsParams) => {
  const drillParams = DrillDownHandler.parseEchartsClick(echartsParams)
  if (drillParams.drillDownLevel) {
    const finalParams = DrillDownHandler.mergeParams(currentFilterParams.value, drillParams)
    filterBarRef.value.setDrillDownLevel(drillParams.drillDownLevel)
    fetchData(finalParams)
  }
}

// 原有：打开分配弹窗
const openAllocateDialog = (order) => {
  if (allocateFormRef.value) {
    allocateFormRef.value.clearValidate()
  }
  allocateForm.value = {
    orderId: order.orderId,
    carId: '',
    arriveTime: new Date(),
    remark: ''
  }
  allocateDialogVisible.value = true
}

// 原有：提交分配运单
const submitAllocate = async () => {
  if (isSubmitLoading.value) return
  isSubmitLoading.value = true
  try {
    await allocateFormRef.value.validate()
    await ElMessageBox.confirm(
      '确认分配该运单？分配后车辆状态将变为"已分配"',
      '分配确认',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    const res = await allocateOrder(allocateForm.value)
    if (res.data.code === 200) {
      const targetCar = dataStore.carList.find(item => item.id === allocateForm.value.carId)
      if (targetCar) {
        dataStore.updateCarStatus(allocateForm.value.carId, '已分配')
      } else {
        ElMessage.warning('未找到对应车辆，状态更新失败')
      }
      const targetOrder = dataStore.orderList.find(item => item.orderId === allocateForm.value.orderId)
      if (targetOrder) {
        targetOrder.status = '已分配'
      } else {
        ElMessage.warning('未找到对应订单，状态更新失败')
      }
      ElMessage.success('运单分配成功！')
      allocateDialogVisible.value = false
      fetchData(currentFilterParams.value)
      allocateForm.value = { orderId: '', carId: '', arriveTime: '', remark: '' }
    } else {
      ElMessage.error('分配失败：' + (res.data.msg || '接口返回异常'))
    }
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error('分配失败：' + (err.message || '系统异常'))
    }
  } finally {
    isSubmitLoading.value = false
  }
}


// 原有：页面加载时获取数据
onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.capacity-dispatch {
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
/* 原有：按钮组样式 */
.page-header .header-buttons {
  display: flex;
  align-items: center;
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
.el-table {
  --el-table-header-text-color: #666;
  --el-table-row-hover-bg-color: #f8f9fa;
}
:deep(.filter-bar) {
  background: #fff;
  padding: 10px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}
:deep(.el-tag) {
  font-size: 12px;
  --el-tag-padding: 2px 8px;
  border-radius: 4px;
}
/* 适配ExportButton组件样式，与原有按钮统一 */
:deep(.el-button--success) {
  --el-button-padding: 8px 16px;
  border-radius: 4px;
}
</style>