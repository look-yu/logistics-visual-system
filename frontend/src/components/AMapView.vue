<template>
  <div class="amap-container" ref="mapRef"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import AMapLoader from '@amap/amap-jsapi-loader'

const props = defineProps({
  points: { type: Array, default: () => [] },
  center: { type: Array, default: () => [116.397428, 39.90923] },
  zoom: { type: Number, default: 5 }
})

const mapRef = ref(null)
let map = null
let AMapInstance = null // 保存 AMap 构造函数

// 请在这里替换为您申请的 Key
const AMAP_KEY = 'a6551652c0cbafd673698c551d15bb52'
// 如果您在高德控制台配置了安全密钥，请在此填写。
const AMAP_SECURITY_CODE = '1eb337536e5623c73354862b716c8923' 

const initMap = async () => {
  if (AMAP_KEY === 'YOUR_AMAP_KEY' || !AMAP_KEY) {
    console.error('请替换为您申请的高德地图Key!')
    if (mapRef.value) {
      mapRef.value.innerHTML = '<div style="text-align: center; padding-top: 50px; font-size: 16px; color: #f00;">请提供高德地图Key以加载地图</div>'
    }
    return
  }

  // 设置安全密钥（高德API 2.0 强制要求，必须在 load 之前设置）
  window._AMapSecurityConfig = {
    securityJsCode: AMAP_SECURITY_CODE,
  }

  try {
    AMapInstance = await AMapLoader.load({
      key: AMAP_KEY,
      version: '2.0',
      plugins: ['AMap.Driving', 'AMap.MoveAnimation', 'AMap.Marker', 'AMap.Polyline'],
    })

    map = new AMapInstance.Map(mapRef.value, {
      zoom: props.zoom,
      center: props.center,
      mapStyle: 'amap://styles/whitesmoke',
    })

    // 首次加载时绘制路线
    if (props.points && props.points.length > 0) {
      drawRoutes(props.points)
    }

  } catch (e) {
    console.error('高德地图加载失败:', e)
    if (mapRef.value) {
      mapRef.value.innerHTML = `<div style="text-align: center; padding-top: 50px; font-size: 16px; color: #f00;">地图加载失败: ${e.message}</div>`
    }
  }
}

const drawRoutes = (routes) => {
  console.log('AMapView: 开始绘制路线，路线数量：', routes ? routes.length : 0)
  console.log('AMapView: 路线数据：', routes)
  
  if (!map || !routes || !AMapInstance) {
    console.warn('AMapView: 无法绘制路线 - map:', !!map, 'routes:', !!routes, 'AMapInstance:', !!AMapInstance)
    return
  }
  
  map.clearMap() // 清除旧标记和路线
  console.log('AMapView: 地图已清空')

  // 限制同时调用的路线数量，避免API限流
  const maxConcurrentRoutes = 3
  const routesToDraw = routes.slice(0, maxConcurrentRoutes)
  
  if (routes.length > maxConcurrentRoutes) {
    console.warn(`AMapView: 路线数量超过限制，只绘制前${maxConcurrentRoutes}条路线`)
  }

  routesToDraw.forEach((route, index) => {
    console.log(`AMapView: 处理路线 ${index + 1}/${routesToDraw.length}`, route)
    
    // 添加延迟，避免API限流
    setTimeout(() => {
      if (!map || !AMapInstance) return
      
      // 检查坐标格式，如果是字符串则转换为数组
      let fromCoord = route.fromCoord
      let toCoord = route.toCoord
      
      if (typeof fromCoord === 'string') {
        fromCoord = fromCoord.split(',').map(Number)
      }
      if (typeof toCoord === 'string') {
        toCoord = toCoord.split(',').map(Number)
      }
      
      // 检查坐标是否有效
      if (!fromCoord || !toCoord || fromCoord.length !== 2 || toCoord.length !== 2) {
        console.error(`AMapView: 路线 ${index + 1} 坐标无效`, route)
        return
      }
      
      const driving = new AMapInstance.Driving({
        policy: AMapInstance.DrivingPolicy.LEAST_TIME,
        showTraffic: false,
        autoFitView: false // 禁用自动调整视野，防止页面跳动
      })

      const origin = new AMapInstance.LngLat(fromCoord[0], fromCoord[1])
      const destination = new AMapInstance.LngLat(toCoord[0], toCoord[1])
      
      console.log(`AMapView: 路线 ${index + 1} 起点:`, origin, '终点:', destination)

      driving.search(origin, destination, (status, result) => {
        console.log(`AMapView: 路线 ${index + 1} 规划结果:`, status)
        
        if (status === 'complete') {
          // 检查是否有路线数据
          if (!result || !result.routes || result.routes.length === 0) {
            console.error(`AMapView: 路线 ${index + 1} 规划失败 - 无路线数据`, result)
            return
          }
          
          //1. 获取规划出的路径经纬度数组
          const path = result.routes[0].steps.reduce((prev, step) => {
            return prev.concat(step.path)
          }, [])

          console.log(`AMapView: 路线 ${index + 1} 路径点数量:`, path.length)

          //2. 使用Polyline绘制路线
          const polyline = new AMapInstance.Polyline({
            path: path,
            strokeColor: '#FF0000', // 路线颜色（红色）
            strokeOpacity: 0.8, // 路线透明度
            strokeWeight: 5, // 路线宽度
            strokeStyle: 'solid', // 路线样式
            lineJoin: 'round', // 线条连接处样式
            lineCap: 'round', // 线条端点样式
            map: map
          })

          //3. 自定义起点标记
          const startMarker = new AMapInstance.Marker({
            position: path[0],
            content: `<div style="background-color: #FF0000; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>`,
            anchor: 'center',
            map: map
          })

          //4. 自定义终点标记
          const endMarker = new AMapInstance.Marker({
            position: path[path.length - 1],
            content: `<div style="background-color: #FF0000; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>`,
            anchor: 'center',
            map: map
          })

          //5. 点击标记显示信息窗体
          const infoWindow = new AMapInstance.InfoWindow({
            offset: new AMapInstance.Pixel(0, -30)
          })

          endMarker.on('click', (e) => {
            infoWindow.setContent(`
              <div style="padding: 10px; font-size: 12px; min-width: 150px;">
                <h4 style="margin: 0 0 5px 0; color: #FF0000;">运输任务: ${route.from} -> ${route.to}</h4>
                <p style="margin: 3px 0;">状态: <span style="color: #67C23A;">在途监控中</span></p>
                <p style="margin: 3px 0;">优先级: <span style="color: ${route.urgent ? '#F56C6C' : '#909399'}; font-weight: bold;">${route.urgent ? '紧急' : '普通'}</span></p>
              </div>
            `)
            infoWindow.open(map, e.target.getPosition())
          })

        } else {
          console.error(`AMapView: 路线 ${index + 1} 规划失败:`, result)
        }
      })
    }, index * 500) // 每条路线间隔500ms
  })
}

watch(() => props.points, (newPoints) => {
  drawRoutes(newPoints)
}, { deep: true })

onMounted(() => {
  initMap()
})

onUnmounted(() => {
  if (map) {
    map.destroy()
  }
})
</script>

<style scoped>
.amap-container {
  width: 100%;
  height: 100%;
}
</style>
