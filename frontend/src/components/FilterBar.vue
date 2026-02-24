<!-- 大屏顶部筛选栏组件，整合时间选择器、区域下拉框、重置按钮，统一筛选交互逻辑 -->
<template>
  <div class="filter-bar" style="padding: 10px; background: #fff; border-radius: 8px; margin-bottom: 20px; display: flex; gap: 15px; align-items: center;">
    <!-- 时间筛选 -->
    <div class="filter-item">
      <label style="margin-right: 8px;">时间范围：</label>
      <el-date-picker
        v-model="timeRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        @change="handleFilterChange"
        style="width: 300px;"
      />
    </div>

    <!-- 区域筛选 -->
    <div class="filter-item">
      <label style="margin-right: 8px;">配送区域：</label>
      <el-select v-model="area" placeholder="请选择区域" @change="handleFilterChange" style="width: 200px;">
        <el-option label="全国" value="all" />
        <el-option label="朝阳区" value="朝阳区" />
        <el-option label="海淀区" value="海淀区" />
        <el-option label="丰台区" value="丰台区" />
        <el-option label="东城区" value="东城区" />
      </el-select>
    </div>

    <!-- 重置按钮 -->
    <el-button type="default" @click="handleReset">重置</el-button>

    <!-- 下钻层级展示 + 返回上一级 -->
    <div v-if="drillDownLevel" style="margin-left: auto; display: flex; gap: 10px;">
      <span>当前维度：{{ drillDownLevel === 'month' ? '月度' : drillDownLevel === 'day' ? '日度' : '区域总览' }}</span>
      <el-button type="text" @click="handleDrillBack">返回上一级</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, defineEmits } from 'vue';
import { ElMessage } from 'element-plus';

// 定义事件，向父组件传递筛选参数（仅传递核心参数，适配原有接口）
const emit = defineEmits(['filter-change', 'drill-back']);

// 筛选参数（默认值，避免空值）
const timeRange = ref([]);
const area = ref('all');
const drillDownLevel = ref(''); // 下钻层级：month/day/''

// 筛选条件变化触发（参数格式适配原有后端接口）
const handleFilterChange = () => {
  // 拼接参数，和后端已有接口的参数格式对齐
  const filterParams = {
    timeRange: timeRange.value.length ? timeRange.value.map(item => item.format('YYYY-MM-DD')).join('~') : '',
    area: area.value,
    drillDownLevel: drillDownLevel.value,
    drillDimension: '' // 下钻维度值，由图表点击后补充
  };
  emit('filter-change', filterParams);
};

// 重置筛选条件
const handleReset = () => {
  timeRange.value = [];
  area.value = 'all';
  drillDownLevel.value = '';
  emit('filter-change', {
    timeRange: '',
    area: 'all',
    drillDownLevel: '',
    drillDimension: ''
  });
};

// 返回上一级下钻
const handleDrillBack = () => {
  drillDownLevel.value = '';
  emit('drill-back');
  handleFilterChange();
};

// 接收父组件传递的下钻层级（仅更新展示，不新增逻辑）
const setDrillDownLevel = (level) => {
  drillDownLevel.value = level;
  ElMessage.success(`已切换至${level === 'month' ? '月度' : '日度'}维度`);
};

// 暴露方法给父组件（仅必要方法）
defineExpose({
  setDrillDownLevel
});
</script>

<style scoped>
.filter-bar {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}
.filter-item {
  display: flex;
  align-items: center;
}
</style>