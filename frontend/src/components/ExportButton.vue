<!-- 复用型导出按钮：内置 loading、防抖、失败提示，可在大屏 / 图表旁全局使用 -->
 <template>
  <el-button
    :type="type"
    :icon="icon || Download"
    :loading="isLoading"
    :disabled="disabled"
    @click="handleClick"
    v-bind="$attrs" 
  >
    {{ text || '导出Excel' }}
  </el-button>
</template>

<script setup>
import { ref } from 'vue'
import { Download } from '@element-plus/icons-vue'
import { downloadExcel } from '../utils/ExcelDownload.js'
import { debounce } from 'lodash' // 需安装lodash：npm i lodash -S

/**
 * 组件Props：支持自定义配置，适配不同场景
 */
const props = defineProps({
  // 导出接口方法（必传，如exportCapacityExcel）
  api: {
    type: Function,
    required: true
  },
  // 导出接口参数（如筛选/下钻参数）
  params: {
    type: Object,
    default: () => ({})
  },
  // 下载文件名称前缀
  fileNamePrefix: {
    type: String,
    default: '导出数据'
  },
  // 无数据校验：数组/函数（如[carList, orderList]）
  checkData: {
    type: [Array, Function],
    default: null
  },
  // 按钮文字
  text: {
    type: String,
    default: '导出Excel'
  },
  // 按钮类型（Element Plus按钮类型）
  type: {
    type: String,
    default: 'success'
  },
  // 按钮图标（默认Download）
  icon: {
    type: Object,
    default: null
  },
  // 是否禁用
  disabled: {
    type: Boolean,
    default: false
  },
  // 防抖时间（默认500ms，避免重复点击）
  debounceTime: {
    type: Number,
    default: 500
  }
})

// 按钮加载状态
const isLoading = ref(false)

/**
 * 点击事件：防抖 + 调用导出工具类 + 控制loading
 */
const handleClick = debounce(async () => {
  if (isLoading.value) return
  isLoading.value = true

  // 调用导出工具类
  await downloadExcel({
    api: props.api,
    params: props.params,
    fileNamePrefix: props.fileNamePrefix,
    checkData: props.checkData
  })

  isLoading.value = false
}, props.debounceTime)

// 暴露组件方法（可选，方便父组件主动触发）
defineExpose({
  handleClick
})
</script>

<style scoped>
/* 兼容不同场景的按钮样式，无全局污染 */
.el-button {
  --el-button-padding: 8px 16px;
  border-radius: 4px;
}
</style>