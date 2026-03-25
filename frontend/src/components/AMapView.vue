<template>
  <div class="amap-container" ref="mapRef"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, toRaw } from 'vue'

const props = defineProps({
  points: { type: Array, default: () => [] },
  center: { type: Array, default: () => [116.397428, 39.90923] },
  zoom: { type: Number, default: 5 },
  highlightOrder: { type: Object, default: null }
})

const mapRef = ref(null)
let map = null

const initMap = () => {
  console.log('AMapView: 开始初始化地图')
  console.log('AMapView: mapRef.value:', mapRef.value)
  console.log('AMapView: mapRef.value.offsetWidth:', mapRef.value?.offsetWidth)
  console.log('AMapView: mapRef.value.offsetHeight:', mapRef.value?.offsetHeight)
  console.log('AMapView: mapRef.value.clientHeight:', mapRef.value?.clientHeight)
  console.log('AMapView: T 对象是否存在:', typeof T !== 'undefined')
  console.log('AMapView: T 对象内容:', typeof T !== 'undefined' ? Object.keys(T) : 'N/A')
  console.log('AMapView: T.DrivingRoute 是否存在:', typeof T.DrivingRoute !== 'undefined')
  
  if (typeof T === 'undefined') {
    console.error('天地图未加载，请检查 index.html 中的地图脚本')
    if (mapRef.value) {
      mapRef.value.innerHTML = '<div style="text-align: center; padding-top: 50px; font-size: 16px; color: #f00;">地图加载失败，请刷新页面重试<br>天地图SDK未正确加载</div>'
    }
    return
  }

  // 强制设置地图容器高度
  if (mapRef.value) {
    mapRef.value.style.height = '700px'
    mapRef.value.style.width = '100%'
    mapRef.value.style.position = 'relative'
    console.log('AMapView: 已强制设置地图容器尺寸为 700px x 100%')
    console.log('AMapView: 设置后的容器尺寸:', mapRef.value.offsetWidth, 'x', mapRef.value.offsetHeight)
  }

  try {
    console.log('AMapView: 准备创建地图对象，容器:', mapRef.value)
    console.log('AMapView: 容器尺寸:', mapRef.value?.offsetWidth, 'x', mapRef.value?.offsetHeight)
    
    map = new T.Map(mapRef.value)
    console.log('AMapView: 地图对象创建成功')
    console.log('AMapView: 地图容器尺寸:', mapRef.value.offsetWidth, 'x', mapRef.value.offsetHeight)
    
    const centerPoint = new T.LngLat(props.center[0], props.center[1])
    console.log('AMapView: 中心点坐标:', centerPoint)
    
    map.centerAndZoom(centerPoint, props.zoom)
    console.log('AMapView: 地图中心点和缩放设置完成')

    // 添加一个测试标记，确保地图显示
    try {
      const testMarker = new T.Marker(centerPoint)
      map.addOverLay(testMarker)
      console.log('AMapView: 已添加测试标记')
    } catch (e) {
      console.error('AMapView: 添加测试标记失败:', e)
    }

    // 添加测试线
    try {
      const testPath = [
        new T.LngLat(props.center[0] - 5, props.center[1] - 5),
        new T.LngLat(props.center[0] + 5, props.center[1] + 5)
      ]
      const testPolyline = new T.Polyline(testPath, {
        color: '#FF0000',
        opacity: 1,
        weight: 5,
        map: map
      })
      console.log('AMapView: 已添加测试线')
    } catch (e) {
      console.error('AMapView: 添加测试线失败:', e)
    }

    if (props.points && props.points.length > 0) {
      console.log('AMapView: 开始绘制路线，路线数量:', props.points.length)
      console.log('AMapView: 路线数据:', props.points)
      setTimeout(() => drawRoutes(props.points), 1000) // 延迟1秒绘制路线
    } else {
      console.log('AMapView: 没有路线数据需要绘制')
    }

  } catch (e) {
    console.error('天地图初始化失败:', e)
    console.error('错误堆栈:', e.stack)
    if (mapRef.value) {
      mapRef.value.innerHTML = `<div style="text-align: center; padding-top: 50px; font-size: 16px; color: #f00;">地图初始化失败: ${e.message}<br>${e.stack}</div>`
    }
  }
}

const drawRoutes = (routes) => {
  console.log('AMapView: 开始绘制路线，路线数量：', routes ? routes.length : 0)
  console.log('AMapView: 路线数据：', routes)
  
  if (!map || !routes) {
    console.warn('AMapView: 无法绘制路线 - map:', !!map, 'routes:', !!routes)
    return
  }
  
  map.clearOverLays() // 清除旧标记和路线
  console.log('AMapView: 地图已清空')

  // 限制同时调用的路线数量，避免API限流
  const maxConcurrentRoutes = 3
  const routesToDraw = routes.slice(0, maxConcurrentRoutes)
  
  if (routes.length > maxConcurrentRoutes) {
    console.warn(`AMapView: 路线数量超过限制，只绘制前${maxConcurrentRoutes}条路线`)
  }

  routesToDraw.forEach((route, index) => {
    // 使用 toRaw 解构 Vue 响应式对象
    const rawRoute = toRaw(route)
    console.log(`AMapView: 处理路线 ${index + 1}/${routesToDraw.length}`, rawRoute)
    
    // 添加延迟，避免API限流
    setTimeout(() => {
      if (!map) return
      
      // 检查坐标格式，如果是字符串则转换为数组
      let fromCoord = rawRoute.fromCoord
      let toCoord = rawRoute.toCoord
      
      console.log(`AMapView: 路线 ${index + 1} 原始坐标 fromCoord:`, fromCoord, 'toCoord:', toCoord)
      
      if (typeof fromCoord === 'string') {
        fromCoord = fromCoord.split(',').map(Number)
        console.log(`AMapView: 路线 ${index + 1} 转换后 fromCoord:`, fromCoord)
      }
      if (typeof toCoord === 'string') {
        toCoord = toCoord.split(',').map(Number)
        console.log(`AMapView: 路线 ${index + 1} 转换后 toCoord:`, toCoord)
      }
      
      // 检查坐标是否有效
      const isValidCoord = (coord) => {
        return coord && 
               Array.isArray(coord) && 
               coord.length === 2 && 
               !isNaN(coord[0]) && 
               !isNaN(coord[1]) &&
               coord[0] !== 0 && 
               coord[1] !== 0
      }
      
      const fromValid = isValidCoord(fromCoord)
      const toValid = isValidCoord(toCoord)
      console.log(`AMapView: 路线 ${index + 1} 坐标有效性: from=${fromValid}, to=${toValid}`)
      
      if (!fromValid || !toValid) {
        console.error(`AMapView: 路线 ${index + 1} 坐标无效`, rawRoute)
        return
      }
      
      const startPoint = new T.LngLat(fromCoord[0], fromCoord[1])
      const endPoint = new T.LngLat(toCoord[0], toCoord[1])
      
      console.log(`AMapView: 路线 ${index + 1} 起点:`, startPoint, '终点:', endPoint)
      
      // 检查天地图驾车路线规划是否可用
      if (typeof T.DrivingRoute === 'function') {
        console.log(`AMapView: 使用天地图驾车路线规划`)
        const driving = new T.DrivingRoute(map, {
          policy: 0
        })
        
        driving.search(startPoint, endPoint, (result) => {
          console.log(`AMapView: 路线 ${index + 1} 搜索回调执行`)
          console.log(`AMapView: 路线 ${index + 1} 搜索结果对象:`, result)
          console.log(`AMapView: 路线 ${index + 1} 规划结果状态码:`, result.getStatus())
          
          if (result.getStatus() === 0) {
            console.log(`AMapView: 路线 ${index + 1} 规划成功`)
            
            // 检查是否有路线数据
            if (!result || !result.getPlan(0)) {
              console.error(`AMapView: 路线 ${index + 1} 规划失败 - 无路线数据`, result)
              return
            }
            
            //1. 获取规划出的路径经纬度数组
            const route = result.getPlan(0).getRoute(0)
            let path = route.getPath()

            console.log(`AMapView: 路线 ${index + 1} 路径点数量:`, path.length)
            console.log(`AMapView: 路线 ${index + 1} 路径点前3个:`, path.slice(0, 3))

            // 路径点过多时进行采样，避免渲染失败
            const maxPathPoints = 500
            if (path.length > maxPathPoints) {
              console.warn(`AMapView: 路线 ${index + 1} 路径点过多(${path.length})，进行采样到${maxPathPoints}个点`)
              const step = Math.floor(path.length / maxPathPoints)
              path = path.filter((_, i) => i % step === 0)
            }

            //2. 使用Polyline绘制路线
            const isHighlighted = props.highlightOrder && props.highlightOrder.orderNo === rawRoute.orderNo
            const polyline = new T.Polyline(path, {
              color: isHighlighted ? '#00FF00' : '#FF0000',
              opacity: isHighlighted ? 1.0 : 0.3,
              weight: isHighlighted ? 8 : 5,
              map: map
            })

            //3. 自定义起点标记
            const startMarker = new T.Marker(path[0], {
              title: '起点'
            })
            map.addOverLay(startMarker)

            //4. 自定义终点标记
            const endMarker = new T.Marker(path[path.length - 1], {
              title: '终点'
            })
            map.addOverLay(endMarker)

            //5. 点击标记显示信息窗体
            const infoWindow = new T.InfoWindow('', {
              width: 200,
              height: 100,
              title: '运输任务信息'
            })

            endMarker.addEventListener('click', () => {
              infoWindow.setContent(`
                <div style="padding: 10px; font-size: 12px; min-width: 150px;">
                  <h4 style="margin: 0 0 5px 0; color: #FF0000;">运输任务: ${rawRoute.from} -> ${rawRoute.to}</h4>
                  <p style="margin: 3px 0;">状态: <span style="color: #67C23A;">在途监控中</span></p>
                  <p style="margin: 3px 0;">优先级: <span style="color: ${rawRoute.urgent ? '#F56C6C' : '#909399'}; font-weight: bold;">${rawRoute.urgent ? '紧急' : '普通'}</span></p>
                </div>
              `)
              map.openInfoWindow(infoWindow, endMarker.getLngLat())
            })

          } else {
            console.error(`AMapView: 路线 ${index + 1} 规划失败:`, result.getStatus())
            console.error(`AMapView: 路线 ${index + 1} 完整结果对象:`, result)
            console.error(`AMapView: 路线 ${index + 1} 结果类型:`, typeof result)
            
            // 尝试直接绘制起点和终点的连线
            try {
              const simplePath = [startPoint, endPoint]
              const polyline = new T.Polyline(simplePath, {
                color: '#FF0000',
                opacity: 0.5,
                weight: 3,
                map: map
              })
              console.log(`AMapView: 路线 ${index + 1} 已绘制简单连线`)
            } catch (e) {
              console.error(`AMapView: 路线 ${index + 1} 绘制简单连线失败:`, e)
            }
          }
        })
      } else {
        console.warn(`AMapView: 天地图驾车路线规划不可用，直接绘制简单连线`)
        // 直接绘制起点和终点的连线
        try {
          const simplePath = [startPoint, endPoint]
          const isHighlighted = props.highlightOrder && props.highlightOrder.orderNo === rawRoute.orderNo
          const polyline = new T.Polyline(simplePath, {
            color: isHighlighted ? '#00FF00' : '#FF0000',
            opacity: isHighlighted ? 1.0 : 0.5,
            weight: isHighlighted ? 8 : 3,
            map: map
          })
          
          // 添加起点标记
          const startMarker = new T.Marker(startPoint, {
            title: '起点'
          })
          map.addOverLay(startMarker)
          
          // 添加终点标记
          const endMarker = new T.Marker(endPoint, {
            title: '终点'
          })
          map.addOverLay(endMarker)
          
          // 添加信息窗体
          const infoWindow = new T.InfoWindow('', {
            width: 200,
            height: 100,
            title: '运输任务信息'
          })
          
          endMarker.addEventListener('click', () => {
            infoWindow.setContent(`
              <div style="padding: 10px; font-size: 12px; min-width: 150px;">
                <h4 style="margin: 0 0 5px 0; color: #FF0000;">运输任务: ${rawRoute.from} -> ${rawRoute.to}</h4>
                <p style="margin: 3px 0;">状态: <span style="color: #67C23A;">在途监控中</span></p>
                <p style="margin: 3px 0;">优先级: <span style="color: ${rawRoute.urgent ? '#F56C6C' : '#909399'}; font-weight: bold;">${rawRoute.urgent ? '紧急' : '普通'}</span></p>
              </div>
            `)
            map.openInfoWindow(infoWindow, endMarker.getLngLat())
          })
          
          console.log(`AMapView: 路线 ${index + 1} 已绘制简单连线`)
        } catch (e) {
          console.error(`AMapView: 路线 ${index + 1} 绘制简单连线失败:`, e)
        }
      }
    }, index * 500) // 每条路线间隔500ms
  })
}

watch(() => props.points, (newPoints) => {
  drawRoutes(newPoints)
}, { deep: true })

watch(() => props.highlightOrder, (newOrder) => {
  if (newOrder) {
    drawRoutes([newOrder])
  } else {
    drawRoutes(props.points)
  }
}, { deep: true })

onMounted(() => {
  initMap()
})

onUnmounted(() => {
  if (map) {
    map = null
  }
})
</script>

<style scoped>
.amap-container {
  width: 100%;
  height: 100%;
  min-height: 700px;
  position: relative;
}
</style>
