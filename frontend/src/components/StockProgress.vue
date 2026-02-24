<!-- 	库存进度条组件：接收当前库存 / 安全库存，计算进度并按阈值切换颜色（黄 / 红） -->
    <template>
  <div class="stock-progress" style="display: flex; align-items: center; gap: 8px; width: 100%;">
    <!-- 进度条 -->
    <el-progress
      :percentage="progress"
      :status="progressStatus"
      :stroke-width="8"
      style="flex: 1;"
    />
    <!-- 数值展示 -->
    <span class="stock-value" style="min-width: 60px; text-align: right; font-size: 12px;">
      {{ currentStock }}/{{ safeStock }}
    </span>
    <!-- 状态标签 -->
    <StatusTag :status="stockStatusKey" type="stock" />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import StatusTag from './StatusTag.vue';
import { STOCK_STATUS } from '../constants/StatusEnum';

const props = defineProps({
  // 当前库存
  currentStock: {
    type: Number,
    required: true
  },
  // 安全库存阈值
  safeStock: {
    type: Number,
    required: true,
    validator: (val) => val > 0 // 安全库存必须大于0
  }
});

// 计算进度（百分比）
const progress = computed(() => {
  const percent = Math.round((props.currentStock / props.safeStock) * 100);
  return Math.min(percent, 100); // 最大100%
});

// 进度条状态（element-plus内置：success/warning/exception）
const progressStatus = computed(() => {
  if (progress.value >= 80) return 'success'; // ≥80% 安全
  if (progress.value >= 50) return 'warning'; // 50%-80% 预警
  return 'exception'; // <50% 危险
});

// 库存状态key（匹配StockEnum）
const stockStatusKey = computed(() => {
  if (progress.value >= 80) return 'SAFE';
  if (progress.value >= 50) return 'WARNING';
  return props.currentStock === 0 ? 'OUT_OF_STOCK' : 'DANGER';
});
</script>

<style scoped>
.stock-progress {
  padding: 0 4px;
}
.stock-value {
  color: #666;
}
</style>