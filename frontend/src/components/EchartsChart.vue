
<template>

  <!-- 保留原有id和样式，仅调整高度适配轨迹地图 -->
  <!-- 新增：点击事件 + 鼠标指针样式 -->
  <div 
    ref="chartRef" 
    id="echarts-container" 
    style="width: 100%; height: 100%; cursor: pointer;"
    @click="openFullscreen"
  ></div>

  <!-- 新增：图表放大弹窗 -->
   
  <div> <!-- 包裹整个组件内容 -->
    <el-dialog 
      v-model="fullscreenVisible" 
      title="图表详情" 
      width="90%" 
      :close-on-click-modal="false"
      destroy-on-close
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
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue' // 新增：nextTick
import * as echarts from 'echarts'
// 新增：引入中国地图JSON（路径匹配你项目树的public/map/china.json）
import chinaJson from '@/../public/map/china.json'

const props = defineProps({
  role: { type: String, default: 'manager' },
  title: { type: String, default: '物流数据可视化' },
  xAxisData: { type: Array, default: () => ['1月', '2月', '3月', '4月'] },
  seriesData: { type: Array, default: () => [1200, 1580, 1820, 2150] },
  // 新增：轨迹点props，适配TransportTrack.vue的轨迹渲染
  trackPoints: { type: Array, default: () => [] }
})

// 新增：定义错误事件，适配TransportTrack.vue的错误捕获
const emit = defineEmits(['chart-error'])

const chartRef = ref(null)
let myChart = null

// 新增：全屏图表相关变量
const fullscreenVisible = ref(false) // 弹窗显示状态
const fullscreenChartRef = ref(null) // 全屏图表容器
let fullscreenChart = null // 全屏图表实例

// 保留原有初始化逻辑，仅新增track分支的地图注册
const initChart = () => {
  if (myChart) {
    myChart.dispose() // 保留原有销毁逻辑
  }
  if (!chartRef.value) return
  
  try {
    myChart = echarts.init(chartRef.value)
    // 新增：如果是轨迹地图，先注册中国地图
    if (props.role === 'track') {
      echarts.registerMap('china', chinaJson)
    }
    updateChart(myChart) // 修改：传入图表实例
  } catch (err) {
    // 新增：捕获初始化错误，抛出给父组件
    emit('chart-error', err)
    console.error('图表初始化失败：', err)
  }
}

// 新增：初始化全屏图表（复用原有配置逻辑）
const initFullscreenChart = () => {
  if (fullscreenChart) {
    fullscreenChart.dispose() // 销毁旧实例
  }
  if (!fullscreenChartRef.value) return
  
  try {
    fullscreenChart = echarts.init(fullscreenChartRef.value)
    if (props.role === 'track') {
      echarts.registerMap('china', chinaJson)
    }
    updateChart(fullscreenChart) // 复用更新逻辑
  } catch (err) {
    console.error('全屏图表初始化失败：', err)
  }
}

// 修改：接收图表实例参数，适配普通/全屏图表
const updateChart = (chartInstance) => {
  let option = {}
  
  // 保留原有manager分支（折线图）
  if (props.role === 'manager') {
    option = {
      title: { text: props.title, left: 'center', textStyle: { color: '#333' } },
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: props.xAxisData, axisLabel: { color: '#666' } },
      yAxis: { type: 'value', axisLabel: { color: '#666' } },
      series: [{
        name: '订单量',
        type: 'line',
        data: props.seriesData,
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

  // 保留原有dispatcher分支（柱状图）
  if (props.role === 'dispatcher') {
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

  // 保留原有warehouse分支（饼图）
  if (props.role === 'warehouse') {
    option = {
      title: { text: props.title, left: 'center', textStyle: { color: '#333' } },
      tooltip: { trigger: 'item' },
      legend: { orient: 'vertical', left: 'left', textStyle: { color: '#666' } },
      series: [{
        name: '库存数量',
        type: 'pie',
        radius: ['40%', '70%'],
        data: props.xAxisData.map((name, index) => ({
          name,
          value: props.seriesData[index]
        })),
        itemStyle: {
          color: (params) => {
            const colorList = ['#1989fa', '#52c41a', '#faad14', '#f5222d']
            return colorList[params.dataIndex % colorList.length]
          }
        },
        label: {
          show: true,
          formatter: '{b}: {c} ({d}%)',
          color: '#333'
        }
      }]
    }
  }

  // 新增：track分支（轨迹地图），适配运输轨迹监控
  if (props.role === 'track') {
    option = {
      title: { 
        text: props.title, 
        left: 'center', 
        textStyle: { color: '#333', fontSize: 16 } 
      },
      tooltip: { 
        trigger: 'item',
        formatter: (params) => {
          if (params.seriesType === 'lines') {
            return `${params.name}<br/>起点：${params.data.coords[0].join(',')}<br/>终点：${params.data.coords[1].join(',')}`
          }
          return `坐标：${params.value.join(',')}`
        }
      },
      // 地图核心配置
      geo: {
        map: 'china', // 使用注册的中国地图
        roam: true, // 支持缩放/拖拽
        label: { 
          show: true, 
          fontSize: 12,
          color: '#666' 
        },
        emphasis: { 
          areaColor: '#e0e0e0' 
        },
        // 默认聚焦到中国中部，适配所有区域轨迹
        center: [105.07, 36.03],
        zoom: 4
      },
      series: [
        // 轨迹线
        {
          type: 'lines',
          coordinateSystem: 'geo',
          data: props.trackPoints.map(point => ({
            name: `${point.from || '起点'}→${point.to || '终点'}`,
            coords: [point.fromCoord || [0,0], point.toCoord || [0,0]]
          })),
          lineStyle: { 
            color: '#1989fa', 
            width: 3, 
            type: 'solid',
            opacity: 0.8 
          },
          emphasis: { 
            lineStyle: { width: 5 } 
          }
        },
        // 轨迹节点（起点/终点）
        {
          type: 'scatter',
          coordinateSystem: 'geo',
          data: props.trackPoints.flatMap(point => [
            { value: point.fromCoord || [0,0], name: point.from || '起点' },
            { value: point.toCoord || [0,0], name: point.to || '终点' }
          ]),
          symbolSize: 10,
          itemStyle: { 
            color: '#f5222d',
            opacity: 0.9 
          },
          emphasis: { 
            symbolSize: 15 
          }
        }
      ]
    }
  }

  // 保留原有setOption逻辑
  if (chartInstance) { // 修改：使用传入的实例
    chartInstance.setOption(option)
  }
}

// 新增：打开全屏弹窗方法
const openFullscreen = () => {
  fullscreenVisible.value = true
  // 等待弹窗DOM渲染完成后初始化全屏图表
  nextTick(() => {
    initFullscreenChart()
  })
}

// 保留原有监听逻辑，新增trackPoints监听（适配轨迹数据变化）
// 修改：同时更新普通图表和全屏图表
watch([() => props.role, () => props.xAxisData, () => props.seriesData, () => props.trackPoints], () => {
  if (myChart) updateChart(myChart)
  if (fullscreenChart) updateChart(fullscreenChart) // 新增：更新全屏图表
}, { deep: false })

// 保留原有生命周期逻辑
onMounted(() => {
  initChart()
  window.addEventListener('resize', () => {
    if (myChart) myChart.resize()
    if (fullscreenChart) fullscreenChart.resize() // 新增：全屏图表自适应
  })
})

onUnmounted(() => {
  if (myChart) {
    myChart.dispose()
    myChart = null
  }
  // 新增：销毁全屏图表实例，避免内存泄漏
  if (fullscreenChart) {
    fullscreenChart.dispose()
    fullscreenChart = null
  }
})
</script>

<style scoped>
/* 保留原有样式，删除无关的全局样式（避免污染） */
#echarts-container {
  width: 100%;
  height: 100%;
}
/* 新增：全屏图表容器样式 */
#fullscreen-echarts-container {
  width: 100%;
  height: 600px;
}
</style>