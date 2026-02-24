<!-- 通用状态标签组件：接收状态值（如待分拣）自动匹配颜色（蓝 / 红）和文案 -->
 <template>
  <el-tag 
    :type="tagType" 
    :style="{ backgroundColor: tagColor, color: '#fff' }"
    size="small"
    effect="plain"
  >
    {{ tagText }}
  </el-tag>
</template>

<script setup>
import { computed } from 'vue';
import { ORDER_STATUS, CAR_STATUS, STOCK_STATUS, STATUS_MAPPER } from '../constants/StatusEnum';

const props = defineProps({
  // 状态值（如：待分配/空闲/异常）
  status: {
    type: String,
    required: true
  },
  // 状态类型（order/car/stock）
  type: {
    type: String,
    required: true,
    validator: (val) => ['order', 'car', 'stock'].includes(val)
  }
});

// 匹配状态枚举
const getStatusEnum = computed(() => {
  const statusKey = STATUS_MAPPER[props.status] || props.status;
  switch (props.type) {
    case 'order':
      return ORDER_STATUS[statusKey] || { text: props.status, type: 'info', color: '#909399' };
    case 'car':
      return CAR_STATUS[statusKey] || { text: props.status, type: 'info', color: '#909399' };
    case 'stock':
      return STOCK_STATUS[statusKey] || { text: props.status, type: 'info', color: '#909399' };
    default:
      return { text: props.status, type: 'info', color: '#909399' };
  }
});

// 标签文本
const tagText = computed(() => getStatusEnum.value.text);
// 标签类型（element-plus）
const tagType = computed(() => getStatusEnum.value.type);
// 标签颜色
const tagColor = computed(() => getStatusEnum.value.color);
</script>

<style scoped>
/* 适配原有样式，无额外样式冲突 */
.el-tag {
  --el-tag-padding: 2px 8px;
  border-radius: 4px;
}
</style>