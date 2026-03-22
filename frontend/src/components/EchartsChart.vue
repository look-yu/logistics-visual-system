<template>
  <!-- 修复1：清理冗余DOM嵌套，统一包裹容器 -->
  <div class="echarts-chart-wrapper" style="width: 100%; height: 100%;">
    <!-- 保留核心图表容器，点击事件+指针样式 -->
    <div 
      ref="chartRef" 
      id="echarts-container" 
      style="width: 100%; height: 100%; cursor: pointer;"
      @click="openFullscreen"
    ></div>

    <!-- 图表放大弹窗 -->
    <el-dialog 
      v-model="fullscreenVisible" 
      title="图表详情" 
      width="90%" 
      :close-on-click-modal="false"
      destroy-on-close
      @closed="handleDialogClosed" 
    >
      <div 
        ref="fullscreenChartRef" 
        id="fullscreen-echarts-container" 
        style="width: 100%; height: 600px;"
      ></div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'
// 引入中国地图JSON（路径匹配项目public/map/china.json）
import chinaJson from '@/map/china.json';  // @ = src 根目录
echarts.registerMap('china', chinaJson);

// 修复2：完善props类型校验，增加容错默认值
const props = defineProps({
  role: { 
    type: String, 
    default: 'manager',
    validator: (val) => ['manager', 'dispatcher', 'warehouse', 'track'].includes(val)
  },
  title: { type: String, default: '物流数据可视化' },
  xAxisData: { type: Array, default: () => [] },
  seriesData: { type: Array, default: () => [] },
  seriesName: { type: String, default: '订单量' },
  trackPoints: { 
    type: Array, 
    default: () => [],
    validator: (val) => {
      return val.every(item => {
        return item && (item.fromCoord || item.toCoord)
      })
    }
  }
})

// 定义错误事件，适配父组件错误捕获
const emit = defineEmits(['chart-error'])

// 修复3：用ref管理图表实例（更符合Vue3规范）
const chartRef = ref(null)
const myChart = ref(null)
const fullscreenVisible = ref(false)
const fullscreenChartRef = ref(null)
const fullscreenChart = ref(null)

// 修复4：地图只注册一次，避免重复警告
let mapRegistered = false
const registerMapIfNeeded = () => {
  if (props.role === 'track' && !mapRegistered) {
    echarts.registerMap('china', chinaJson)
    mapRegistered = true
  }
}

// 修复5：封装resize处理函数，方便移除监听
const handleResize = () => {
  if (myChart.value) myChart.value.resize()
  if (fullscreenChart.value) fullscreenChart.value.resize()
}

// 核心：初始化普通图表
const initChart = () => {
  // 先销毁旧实例
  if (myChart.value) {
    myChart.value.dispose()
    myChart.value = null
  }
  if (!chartRef.value) return
  
  try {
    myChart.value = echarts.init(chartRef.value)
    registerMapIfNeeded() // 按需注册地图
    updateChart(myChart.value)
  } catch (err) {
    emit('chart-error', err)
    console.error('图表初始化失败：', err)
  }
}

// 初始化全屏图表
const initFullscreenChart = () => {
  if (fullscreenChart.value) {
    fullscreenChart.value.dispose()
    fullscreenChart.value = null
  }
  if (!fullscreenChartRef.value) return
  
  try {
    fullscreenChart.value = echarts.init(fullscreenChartRef.value)
    registerMapIfNeeded()
    updateChart(fullscreenChart.value)
  } catch (err) {
    console.error('全屏图表初始化失败：', err)
  }
}

// 修复6：增加无数据兜底，完善track分支容错
const updateChart = (chartInstance) => {
  if (!chartInstance) return

  // 通用无数据配置
  const noDataOption = {
    title: { text: props.title, left: 'center', textStyle: { color: '#333' } },
    graphic: [{
      type: 'text',
      left: 'center',
      top: '50%',
      style: {
        text: '暂无数据',
        fontSize: 16,
        color: '#999'
      }
    }]
  }

  let option = {}
  
  // 管理层：折线图（增加无数据兜底）
  if (props.role === 'manager') {
    if (props.xAxisData.length === 0 || props.seriesData.length === 0) {
      option = noDataOption
    } else {
      option = {
        title: { text: props.title, left: 'center', textStyle: { color: '#333' } },
        tooltip: { trigger: 'axis' },
        grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
        xAxis: { type: 'category', data: props.xAxisData, axisLabel: { color: '#666' } },
        yAxis: { type: 'value', axisLabel: { color: '#666' } },
        series: [{
          name: props.seriesName || '订单量',
          type: 'line',
          data: props.seriesData || [],
          smooth: true,
          itemStyle: { color: '#1989fa' },
          areaStyle: { 
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(25, 137, 250, 0.3)' },
              { offset: 1, color: 'rgba(25, 137, 250, 0.0)' }
            ])
          }
        }]
      }
    }
  }

  // 调度人员：柱状图（增加无数据兜底）
  if (props.role === 'dispatcher') {
    if (props.xAxisData.length === 0 || props.seriesData.length === 0) {
      option = noDataOption
    } else {
      option = {
        title: { text: props.title, left: 'center', textStyle: { color: '#333' } },
        tooltip: { trigger: 'axis' },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: { type: 'category', data: props.xAxisData, axisLabel: { color: '#666' } },
        yAxis: { type: 'value', axisLabel: { color: '#666' } },
        series: [{
          name: '运输单量',
          type: 'bar',
          data: props.seriesData,
          itemStyle: { color: '#52c41a' },
          barWidth: '60%'
        }]
      }
    }
  }

  // 仓储管理员：饼图（增加无数据兜底）
  if (props.role === 'warehouse') {
    if (props.xAxisData.length === 0 || props.seriesData.length === 0) {
      option = noDataOption
    } else {
      option = {
        title: { text: props.title, left: 'center', textStyle: { color: '#333' } },
        tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
        legend: { 
          bottom: '0%', 
          left: 'center', 
          textStyle: { color: '#666', fontSize: 11 },
          itemWidth: 10,
          itemHeight: 10,
          padding: [5, 10]
        },
        series: [{
          name: '业务占比',
          type: 'pie',
          radius: ['35%', '60%'], // 缩小半径，给标签留空间
          center: ['50%', '45%'], // 中心点上移，给底部图例留空间
          roseType: 'radius', // 使用玫瑰图，增加错落感，减少拥挤
          data: props.xAxisData.map((name, index) => ({
            name,
            value: props.seriesData[index]
          })),
          itemStyle: {
            borderRadius: 8,
            borderColor: '#fff',
            borderWidth: 2,
            color: (params) => {
              const colorList = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399']
              return colorList[params.dataIndex % colorList.length]
            }
          },
          label: {
            show: true,
            position: 'outside',
            formatter: '{b}\n{d}%',
            fontSize: 10,
            color: '#666'
          },
          labelLine: {
            show: true,
            length: 10,
            length2: 10,
            smooth: true
          }
        }]
      }
    }
  }

  // 轨迹地图：增加数据容错，过滤无效坐标
  if (props.role === 'track') {
    // 过滤有效轨迹点（排除coords为[0,0]的情况）
    const validTrackPoints = props.trackPoints.filter(point => {
      const validFrom = point.fromCoord && point.fromCoord.every(num => num !== 0)
      const validTo = point.toCoord && point.toCoord.every(num => num !== 0)
      return validFrom || validTo
    })

    if (validTrackPoints.length === 0) {
      option = noDataOption
    } else {
      option = {
        backgroundColor: '#fff',
        title: { 
          text: props.title, 
          left: 'center', 
          textStyle: { color: '#333', fontSize: 16 } 
        },
        tooltip: { 
          trigger: 'item',
          backgroundColor: 'rgba(0,0,0,0.7)',
          borderColor: '#409EFF',
          textStyle: { color: '#fff' },
          formatter: (params) => {
            if (params.seriesType === 'lines') {
              return `<b>${params.name}</b><br/>状态：运输中<br/>预计到达：2小时后`
            }
            return `节点：${params.name}<br/>坐标：${params.value.join(',')}`
          }
        },
        geo: {
          map: 'china',
          roam: true,
          label: { 
            show: false, 
            fontSize: 10,
            color: '#999' 
          },
          itemStyle: {
            areaColor: '#f5f7fa',
            borderColor: '#dcdfe6',
            borderWidth: 1
          },
          emphasis: { 
            itemStyle: { areaColor: '#ecf5ff' },
            label: { show: true, color: '#409EFF' }
          },
          center: [105.07, 36.03],
          zoom: 1.2
        },
        series: [
          // 1. 静态轨迹线
          {
            name: '轨迹线',
            type: 'lines',
            coordinateSystem: 'geo',
            polyline: true, // 支持多点路径
            zlevel: 1,
            data: validTrackPoints.map(point => ({
              name: `${point.from} -> ${point.to}`,
              coords: point.pathCoords || [point.fromCoord, point.toCoord],
              lineStyle: { color: point.urgent ? '#F56C6C' : '#409EFF', width: 2, opacity: 0.4, curveness: point.pathCoords ? 0 : 0.2 }
            }))
          },
          // 2. 动态流向效果 (飞线)
          {
            name: '动态流向',
            type: 'lines',
            coordinateSystem: 'geo',
            polyline: true, // 支持多点路径
            zlevel: 2,
            effect: {
              show: true,
              period: 4, // 动画时间
              trailLength: 0.4, // 拖尾长度
              symbol: 'arrow', // 符号类型
              symbolSize: 6,
              color: '#fff'
            },
            data: validTrackPoints.map(point => ({
              coords: point.pathCoords || [point.fromCoord, point.toCoord],
              lineStyle: {
                color: point.urgent ? '#F56C6C' : '#409EFF',
                width: 0,
                curveness: point.pathCoords ? 0 : 0.2
              }
            }))
          },
          // 3. 散点标记 (起点和终点)
          {
            name: '物流节点',
            type: 'effectScatter',
            coordinateSystem: 'geo',
            zlevel: 3,
            rippleEffect: { brushType: 'stroke', scale: 3 },
            label: {
              show: true,
              position: 'right',
              formatter: '{b}',
              fontSize: 10,
              color: '#333'
            },
            symbolSize: (val) => 8,
            itemStyle: {
              color: (params) => {
                // 起点蓝色，终点红色
                return params.dataIndex % 2 === 0 ? '#409EFF' : '#67C23A';
              }
            },
            data: validTrackPoints.flatMap(point => [
              { name: point.from, value: [...point.fromCoord, 100] },
              { name: point.to, value: [...point.toCoord, 100] }
            ])
          }
        ]
      }
    }
  }

  chartInstance.setOption(option)
}

// 打开全屏弹窗
const openFullscreen = () => {
  fullscreenVisible.value = true
  nextTick(() => {
    initFullscreenChart()
  })
}

// 修复7：弹窗关闭后销毁全屏图表，避免内存泄漏
const handleDialogClosed = () => {
  if (fullscreenChart.value) {
    fullscreenChart.value.dispose()
    fullscreenChart.value = null
  }
}

// 修复8：修改watch为deep: true，监听数组深层变化
watch(
  [() => props.role, () => props.xAxisData, () => props.seriesData, () => props.trackPoints], 
  () => {
    if (myChart.value) updateChart(myChart.value)
    if (fullscreenChart.value) updateChart(fullscreenChart.value)
  }, 
  { deep: true } // 监听对象/数组深层变化
)

// 生命周期：初始化+监听resize
onMounted(() => {
  initChart()
  window.addEventListener('resize', handleResize)
})

// 修复9：卸载时移除resize监听，销毁所有实例
onUnmounted(() => {
  window.removeEventListener('resize', handleResize) // 移除resize监听
  if (myChart.value) {
    myChart.value.dispose()
    myChart.value = null
  }
  if (fullscreenChart.value) {
    fullscreenChart.value.dispose()
    fullscreenChart.value = null
  }
})
</script>

<style scoped>
/* 基础容器样式 */
.echarts-chart-wrapper {
  width: 100%;
  height: 100%;
}
#echarts-container {
  width: 100%;
  height: 100%;
}
#fullscreen-echarts-container {
  width: 100%;
  height: 600px;
}

/* 修复10：穿透scoped样式，适配Echarts内部元素（地图文字） */
:deep(.echarts-map-label) {
  color: #666 !important;
  font-size: 12px !important;
}
:deep(.echarts-legend-text) {
  color: #666 !important;
}
</style>