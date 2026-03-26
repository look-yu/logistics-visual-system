<template>
  <div class="route-query">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>运输路线查询</span>
          <el-button type="primary" size="small" @click="fetchOrders">
            <el-icon><Refresh /></el-icon>刷新订单
          </el-button>
        </div>
      </template>

      <div class="content-layout">
        <div class="query-bar">
          <el-form :inline="true" :model="queryParams">
            <el-form-item label="订单号">
              <el-input v-model="queryParams.order_no" placeholder="输入订单号" clearable style="width: 200px" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleQueryRouteByOrderNo" :loading="loading">查询路线</el-button>
            </el-form-item>
          </el-form>
        </div>

        <div class="map-container">
          <div class="map-header">
            <span>路线地图</span>
            <el-tag v-if="selectedOrder" type="info">{{ selectedOrder.order_no }}</el-tag>
          </div>
          <div id="amap-container" class="amap"></div>
          
          <div v-if="routeInfo" class="route-info">
            <el-descriptions :column="2" border size="small">
              <el-descriptions-item label="总距离">
                {{ formatDistance(routeInfo.distance) }}
              </el-descriptions-item>
              <el-descriptions-item label="预计用时">
                {{ formatDuration(routeInfo.duration) }}
              </el-descriptions-item>
              <el-descriptions-item label="起点">
                {{ routeInfo.origin }}
              </el-descriptions-item>
              <el-descriptions-item label="终点">
                {{ routeInfo.destination }}
              </el-descriptions-item>
            </el-descriptions>
          </div>

          <div v-if="!selectedOrder" class="empty-state">
            <el-empty description="请输入订单号查询路线" />
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import amapApi from '../api/amap'
import { request } from '../api/index'

const loading = ref(false)
const selectedOrder = ref(null)
const routeInfo = ref(null)
const map = ref(null)
const driving = ref(null)

const queryParams = ref({
  order_no: ''
})

const handleQueryRouteByOrderNo = async () => {
  if (!queryParams.value.order_no) {
    window.ElMessage.warning('请输入订单号')
    return
  }

  loading.value = true
  try {
    console.log('开始查询订单，订单号:', queryParams.value.order_no)
    const response = await request.get('/orders', { 
      params: { 
        order_no: queryParams.value.order_no,
        page: 1,
        size: 1
      }
    })
    
    console.log('订单查询结果:', response)
    
    if (!response.list || response.list.length === 0) {
      window.ElMessage.error('订单不存在')
      return
    }
    
    const order = response.list[0]
    console.log('订单信息:', order)
    
    if (order.status !== 'assigned' && order.status !== 'shipping') {
      window.ElMessage.warning('只能查询待运输和运输中的订单')
      return
    }
    
    selectedOrder.value = order
    
    if (!order.sender_address || !order.receiver_address) {
      window.ElMessage.warning('订单地址信息不完整')
      return
    }

    console.log('开始地址解析...')
    const origin = await geocodeAddress(order.sender_address)
    const destination = await geocodeAddress(order.receiver_address)

    console.log('地址解析结果:', { origin, destination })

    if (!origin || !destination) {
      window.ElMessage.error('地址解析失败，请检查地址格式')
      return
    }

    console.log('开始查询驾车路线...')
    const routeData = await amapApi.getDrivingRoute(
      { lng: origin.lng, lat: origin.lat },
      { lng: destination.lng, lat: destination.lat }
    )

    console.log('路线查询结果:', routeData)

    if (routeData.status === '1' && routeData.route) {
      displayRoute(routeData.route, origin, destination)
      routeInfo.value = {
        distance: routeData.route.paths[0].distance,
        duration: routeData.route.paths[0].duration,
        origin: order.sender_address,
        destination: order.receiver_address
      }
      window.ElMessage.success('路线查询成功')
    } else {
      console.error('路线查询失败，返回数据:', routeData)
      window.ElMessage.error('路线查询失败')
    }
  } catch (error) {
    console.error('路线查询失败:', error)
    console.error('错误详情:', error?.message, error?.code)
    
    if (error?.response) {
      console.error('响应错误:', error.response.status, error.response.data)
      window.ElMessage.error(`服务器错误: ${error.response.status}`)
    } else if (error?.request) {
      console.error('请求错误，无响应')
      window.ElMessage.error('服务器无响应，请检查后端服务')
    } else {
      console.error('其他错误:', error?.message)
      window.ElMessage.error(`查询失败: ${error?.message || '未知错误'}`)
    }
  } finally {
    loading.value = false
  }
}

const geocodeAddress = async (address) => {
  try {
    const result = await amapApi.geocode(address)
    if (result.status === '1' && result.geocodes && result.geocodes.length > 0) {
      const location = result.geocodes[0].location
      return {
        lng: parseFloat(location.split(',')[0]),
        lat: parseFloat(location.split(',')[1])
      }
    }
    return null
  } catch (error) {
    console.error('地址解析失败:', error)
    return null
  }
}

const displayRoute = (route, origin, destination) => {
  if (!map.value) {
    initMap()
  }

  if (driving.value) {
    driving.value.clear()
  }

  driving.value = new AMap.Driving({
    map: map.value,
    hideMarkers: false,
    showTraffic: false
  })

  const startLngLat = new AMap.LngLat(origin.lng, origin.lat)
  const endLngLat = new AMap.LngLat(destination.lng, destination.lat)

  driving.value.search(startLngLat, endLngLat, (status, result) => {
    if (status === 'complete') {
      console.log('路线规划成功:', result)
    }
  })
}

const initMap = () => {
  try {
    if (!window.AMap) {
      console.error('高德地图API未加载')
      return
    }
    
    console.log('开始初始化地图...')
    map.value = new AMap.Map('amap-container', {
      zoom: 11,
      center: [116.397428, 39.90923],
      viewMode: '2D'
    })
    
    console.log('地图初始化完成')

    AMap.plugin(['AMap.Driving'], () => {
      console.log('驾车路线插件加载完成')
      driving.value = new AMap.Driving({
        map: map.value,
        hideMarkers: false,
        showTraffic: false
      })
    })
  } catch (error) {
    console.error('地图初始化失败:', error)
  }
}

const formatDistance = (meters) => {
  if (meters >= 1000) {
    return (meters / 1000).toFixed(2) + ' 公里'
  }
  return meters + ' 米'
}

const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (hours > 0) {
    return `${hours}小时${minutes}分钟`
  }
  return `${minutes}分钟`
}

onMounted(() => {
  console.log('组件挂载，开始加载高德地图API')
  
  // 检查是否已经加载过地图API
  if (window.AMap) {
    console.log('高德地图API已加载，直接初始化')
    initMap()
    return
  }
  
  // 加载高德地图API
  const script = document.createElement('script')
  script.src = 'https://webapi.amap.com/maps?v=2.0&key=a6551652c0cbafd673698c551d15bb52'
  script.onerror = () => {
    console.error('高德地图API加载失败')
  }
  script.onload = () => {
    console.log('高德地图API加载成功')
    // 等待一小段时间确保AMap对象完全加载
    setTimeout(() => {
      initMap()
    }, 500)
  }
  document.head.appendChild(script)
})

onUnmounted(() => {
  if (map.value) {
    map.value.destroy()
    map.value = null
  }
  if (driving.value) {
    driving.value.clear()
    driving.value = null
  }
})
</script>

<style scoped>
.route-query {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.content-layout {
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: calc(100vh - 200px);
}

.query-bar {
  padding: 15px;
  background: #f5f7fa;
  border-radius: 4px;
}

.map-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  border: 1px solid #e6e6e6;
  border-radius: 4px;
  overflow: hidden;
  min-height: 500px;
}

.map-header {
  padding: 15px;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f5f7fa;
}

.amap {
  flex: 1;
  min-height: 400px;
}

.route-info {
  padding: 15px;
  border-top: 1px solid #e6e6e6;
  background: #fff;
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}
</style>