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

let map = null
let driving = null

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
    console.log('========== 开始查询路线 ==========')
    
    // 步骤1: 查询订单
    console.log('步骤1: 查询订单...')
    let order = null
    try {
      const response = await request.get('/orders', { 
        params: { 
          order_no: queryParams.value.order_no, 
          page: 1, 
          size: 1 
        } 
      })
      
      console.log('订单查询结果:', response) 
      
      // 安全判断 
      if (!response || !response.list || response.list.length === 0) { 
        window.ElMessage.error('订单不存在') 
        return 
      } 
      
      order = response.list[0]
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
    } catch (error) {
      console.error('订单查询失败:', error)
      window.ElMessage.error('订单查询失败，请稍后重试')
      return
    }
    
    // 步骤2: 地址解析（核心修复区）
    console.log('步骤2: 地址解析...')
    let origin = null
    let destination = null
    
    try {
      // 解析发货地址
      if (order.sender_address) {
        const originResult = await geocodeAddress(order.sender_address)
        console.log('发货地址解析结果：', originResult)
        
        // 修复：安全判断，不读取 undefined 的属性
        if (!originResult) {
          console.error('发货地址解析失败')
          window.ElMessage.error('发货地址解析失败，请检查地址格式')
          return
        }
        origin = originResult
      }
      
      // 解析收货地址
      if (order.receiver_address) {
        const destResult = await geocodeAddress(order.receiver_address)
        console.log('收货地址解析结果：', destResult)
        
        if (!destResult) {
          console.error('收货地址解析失败')
          window.ElMessage.error('收货地址解析失败，请检查地址格式')
          return
        }
        destination = destResult
      }
      
      console.log('地址解析结果:', { origin, destination })
      
      if (!origin || !destination) {
        console.error('地址解析不完整')
        window.ElMessage.error('地址解析失败，请检查地址格式')
        return
      }
    } catch (error) {
      // 修复：安全访问 error 属性，防止 undefined 报错
      console.error('地址解析过程失败:', error)
      window.ElMessage.error('地址解析失败，请稍后重试')
      return
    }
    
    // 步骤3: 路线查询
    console.log('步骤3: 查询驾车路线...')
    try {
      const routeData = await amapApi.getDrivingRoute(
        { lng: origin.lng, lat: origin.lat },
        { lng: destination.lng, lat: destination.lat }
      )

      console.log('路线查询结果:', routeData)

      if (routeData && routeData.status === '1' && routeData.route && routeData.route.paths && routeData.route.paths.length > 0) {
        displayRoute(routeData.route, origin, destination)
        routeInfo.value = {
          distance: routeData.route.paths[0].distance,
          duration: routeData.route.paths[0].duration,
          origin: order.sender_address,
          destination: order.receiver_address
        }
        window.ElMessage.success('路线查询成功')
        console.log('========== 路线查询成功 ==========')
      } else {
        console.error('路线查询失败，返回数据:', routeData)
        window.ElMessage.error('路线查询失败，请稍后重试')
      }
    } catch (error) {
      console.error('路线查询过程失败:', error)
      window.ElMessage.error('查询失败: 网络或地图服务异常')
    }
  } catch (error) {
    // 最终层安全捕获
    console.error('查询流程异常:', error)
    window.ElMessage.error('查询过程发生异常，请稍后重试')
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
  try {
    console.log('开始显示路线...')
    
    if (!map) {
      console.log('地图未初始化，开始初始化...')
      initMap()
      
      if (!map) {
        console.error('地图初始化失败')
        window.ElMessage.error('地图初始化失败')
        return
      }
    }

    if (driving) {
      driving.clear()
    }

    driving = new AMap.Driving({
      map: map,
      hideMarkers: false,
      showTraffic: false
    })

    const startLngLat = new AMap.LngLat(origin.lng, origin.lat)
    const endLngLat = new AMap.LngLat(destination.lng, destination.lat)

    driving.search(startLngLat, endLngLat, (status, result) => {
      if (status === 'complete') {
        console.log('路线规划成功:', result)
      } else {
        console.error('路线规划失败:', status, result)
        window.ElMessage.error('路线规划失败')
      }
    })
  } catch (error) {
    console.error('显示路线失败:', error)
    console.error('错误详情:', error?.message, error?.stack)
    window.ElMessage.error('显示路线失败，请稍后重试')
  }
}

const initMap = () => {
  try {
    console.log('开始初始化地图...')
    
    if (!window.AMap) {
      console.error('高德地图API未加载')
      throw new Error('高德地图API未加载')
    }
    
    map = new AMap.Map('amap-container', {
      zoom: 11,
      center: [116.397428, 39.90923],
      viewMode: '2D'
    })
    
    console.log('地图初始化完成')

    AMap.plugin(['AMap.Driving'], () => {
      console.log('驾车路线插件加载完成')
      try {
        driving = new AMap.Driving({
          map: map,
          hideMarkers: false,
          showTraffic: false
        })
        console.log('驾车路线实例创建成功')
      } catch (error) {
        console.error('创建驾车路线实例失败:', error)
      }
    })
  } catch (error) {
    console.error('地图初始化失败:', error)
    console.error('错误详情:', error?.message, error?.stack)
    map = null
    driving = null
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
  
  // 配置安全密钥
  window._AMapSecurityConfig = {
    securityJsCode: '4253fb92cc5225316c5311c3749a3e79'
  }
  
  // 检查是否已经加载过地图API
  if (window.AMap) {
    console.log('高德地图API已加载，直接初始化')
    initMap()
    return
  }
  
  // 加载高德地图API
  const script = document.createElement('script')
  script.src = 'https://webapi.amap.com/maps?v=2.0&key=c11762d4a330d10164fd5d41959eb779&plugin=AMap.Driving'
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
  if (map) {
    map.destroy()
    map = null
  }
  if (driving) {
    driving.clear()
    driving = null
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
  min-height: 600px;
  height: 600px;
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
  min-height: 500px;
  width: 100%;
  height: 100%;
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