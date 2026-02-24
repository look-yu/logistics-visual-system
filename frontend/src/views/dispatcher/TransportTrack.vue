<template>
  <div class="transport-track">
    <div class="page-header">
      <h3>运输轨迹监控</h3>
      <!-- 新增：筛选框加载状态 + 禁用 -->
      <el-select 
        v-model="selectedOrderId" 
        placeholder="选择订单号" 
        style="width: 200px;" 
        @change="fetchTrack"
        :loading="selectLoading"
        :disabled="loading"
      >
        <el-option label="全部订单" value="" />
        <el-option 
          v-for="track in dataStore.trackData" 
          :key="track.orderId" 
          :label="`${track.orderId} (${track.status})`" 
          :value="track.orderId"
        />
      </el-select>
    </div>

    <!-- 轨迹地图 -->
    <el-card shadow="hover" style="margin-bottom: 20px; height: 500px;">
      <template #header>
        <span>配送轨迹地图</span>
      </template>
      <!-- 新增：地图加载错误兜底 -->
      <div v-if="!mapLoadError" style="width: 100%; height: calc(100% - 40px);">
        <EchartsChart 
          role="track" 
          title="物流配送轨迹" 
          :trackPoints="currentTrackPoints"
          style="width: 100%; height: 100%;"
          @chart-error="handleMapError"
        />
      </div>
      <div v-else class="map-error" style="width: 100%; height: calc(100% - 40px); display: flex; align-items: center; justify-content: center; color: #f56c6c;">
        <div>
          <el-icon size="24" color="#f56c6c"><Warning /></el-icon>
          <p style="margin: 10px 0 0 0;">地图加载失败，请检查地图资源或网络！</p>
        </div>
      </div>
      <!-- 新增：地图无轨迹数据提示 -->
      <div v-if="!mapLoadError && currentTrackPoints.length === 0 && !loading" class="map-empty" style="width: 100%; height: calc(100% - 40px); display: flex; align-items: center; justify-content: center; color: #999;">
        暂无轨迹数据，请选择其他订单
      </div>
    </el-card>

    <!-- 轨迹详情 -->
    <el-card shadow="hover">
      <template #header>
        <span>轨迹详情</span>
      </template>
      <el-table :data="currentTrackDetail" border size="small" v-loading="loading">
        <el-table-column prop="time" label="操作时间" width="180" />
        <el-table-column prop="node" label="轨迹节点" width="150" />
        <el-table-column prop="status" label="状态" width="120">
          <template #default="scope">
            <el-tag 
              :type="scope.row.status === '配送中' ? 'warning' : scope.row.status === '已完成' ? 'success' : 'danger'"
            >
              {{ scope.row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="operator" label="操作人" width="120" />
        <el-table-column prop="remark" label="备注" />
        <!-- 新增：无数据兜底行 -->
        <el-table-column v-if="currentTrackDetail.length === 0 && !loading" label="备注">
          <template #default>暂无轨迹详情数据</template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onErrorCaptured } from 'vue'
import { useDataStore } from '../../stores/dataStore'
import { getTrackData } from '../../api/index'
import EchartsChart from '../../components/EchartsChart.vue'
import { ElMessage, ElIcon, Warning } from 'element-plus'

// 全局状态
const dataStore = useDataStore()

// 筛选条件
const selectedOrderId = ref('')
const loading = ref(false)
// 新增：筛选框加载状态（区分表格/筛选加载）
const selectLoading = ref(false)
// 新增：地图加载错误标记
const mapLoadError = ref(false)
const currentTrackDetail = ref([])

// 计算属性：当前轨迹点
const currentTrackPoints = computed(() => {
  if (!selectedOrderId.value) {
    // 全部订单轨迹
    return dataStore.trackData.flatMap(track => track.points || [])
  } else {
    // 选中订单轨迹
    const track = dataStore.trackData.find(item => item.orderId === selectedOrderId.value)
    return track ? track.points : []
  }
})

// 处理地图加载错误
const handleMapError = () => {
  mapLoadError.value = true
  ElMessage.error('地图组件初始化失败！')
}

// 捕获Echarts组件错误（兜底）
onErrorCaptured((err) => {
  if (err.message.includes('echarts') || err.message.includes('map')) {
    mapLoadError.value = true
    ElMessage.error('地图加载异常：' + err.message.substring(0, 50))
    return false // 阻止错误冒泡
  }
})

// 获取轨迹数据（补全：加载状态拆分 + 容错 + 提示）
const fetchTrack = async () => {
  // 防止重复触发
  if (loading.value) return
  loading.value = true
  selectLoading.value = true
  mapLoadError.value = false // 重置地图错误状态
  try {
    const res = await getTrackData(selectedOrderId.value)
    if (res.data.code === 200) {
      // 兜底：确保数据是数组
      dataStore.trackData = res.data.data?.tracks || []
      // 更新轨迹详情（补全：容错）
      if (selectedOrderId.value) {
        const track = dataStore.trackData.find(item => item.orderId === selectedOrderId.value)
        currentTrackDetail.value = track?.detail || []
        // 新增：无数据提示
        if (currentTrackDetail.value.length === 0) {
          ElMessage.info(`订单${selectedOrderId.value}暂无轨迹详情`)
        }
      } else {
        currentTrackDetail.value = []
        ElMessage.info('已加载全部订单轨迹，暂无具体详情')
      }
    } else {
      // 新增：接口非200提示
      ElMessage.error('轨迹加载失败：' + (res.data.msg || '接口返回异常'))
      currentTrackDetail.value = []
      dataStore.trackData = []
    }
  } catch (err) {
    // 新增：错误提示兜底
    const errMsg = err.message || '网络异常'
    ElMessage.error(`轨迹数据加载失败：${errMsg.substring(0, 50)}`)
    currentTrackDetail.value = []
    dataStore.trackData = []
  } finally {
    loading.value = false
    selectLoading.value = false
  }
}

// 页面加载时初始化（补全：首次加载提示）
onMounted(async () => {
  await fetchTrack()
  if (dataStore.trackData.length === 0) {
    ElMessage.info('暂无任何订单轨迹数据')
  }
})
</script>

<style scoped>
.transport-track {
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
.el-card {
  --el-card-header-text-color: #333;
  --el-card-border-color: #e5e7eb;
}
/* 新增：地图错误/空数据样式优化 */
.map-error, .map-empty {
  font-size: 14px;
}
</style>