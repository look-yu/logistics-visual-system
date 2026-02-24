import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useDataStore = defineStore('dataStore', () => {
  // 当前角色（静态）
  const currentRole = ref('manager')
  // 静态图表数据（无后端请求）
  const chartData = ref({
    manager: {
      xAxis: ['1月', '2月', '3月', '4月'],
      series: [1200, 1580, 1820, 2150],
      title: '月度总订单量（管理视角）'
    },
    dispatcher: {
      xAxis: ['早班(6-12)', '中班(12-18)', '晚班(18-24)'],
      series: [85, 162, 110],
      title: '今日各时段运输单量（调度视角）'
    },
    warehouse: {
      xAxis: ['库位A(生鲜)', '库位B(标品)', '库位C(大件)', '库位D(耗材)'],
      series: [210, 350, 180, 95],
      title: '当前各库位库存数量（仓储视角）'
    }
  })

  // 切换角色（纯前端）
  const changeRole = (role) => {
    currentRole.value = role
  }

  return { currentRole, chartData, changeRole }
})