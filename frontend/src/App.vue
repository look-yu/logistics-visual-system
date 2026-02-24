<template>
  <el-container style="height: 100vh;">
    <!-- 顶部导航栏 -->
    <el-header style="background-color: #fff; border-bottom: 1px solid #e6e6e6;">
      <div class="header-left">
        <el-icon size="24" color="#1989fa"><Ship /></el-icon>
        <span class="system-name">物流管理数据可视化系统</span>
      </div>
      <div class="header-right">
        <el-tag type="primary" size="small">当前角色：{{ currentRole }}</el-tag>
        <el-button type="text" icon="User">管理员</el-button>
        <el-button type="text" icon="SwitchButton" @click="openRoleDialog">切换角色</el-button>
      </div>
    </el-header>

    <el-container>
      <!-- 左侧侧边栏（修复菜单v-if逻辑，避免循环） -->
      <el-aside width="200px" style="background-color: #fff; border-right: 1px solid #e6e6e6;">
        <el-menu
          :default-active="activeMenu"
          class="el-menu-vertical-demo"
          background-color="#fff"
          text-color="#333"
          active-text-color="#1989fa"
          @select="handleMenuSelect"
        >
          <el-menu-item index="/manager">
            <el-icon><House /></el-icon>
            <template #title>数据大屏</template>
          </el-menu-item>

          <!-- 修复：简化v-if逻辑，避免循环判断 -->
          <el-sub-menu index="dispatcher" v-show="currentRole === 'dispatcher' || currentRole === 'manager'">
            <template #title>
              <el-icon><TruckIcon /></el-icon>
              <span>调度管理</span>
            </template>
            <el-menu-item index="/dispatcher">运输轨迹</el-menu-item>
          </el-sub-menu>

          <el-sub-menu index="warehouse" v-show="currentRole === 'warehouse' || currentRole === 'manager'">
            <template #title>
              <el-icon><BoxIcon /></el-icon>
              <span>仓储管理</span>
            </template>
            <el-menu-item index="/warehouse">库存监控</el-menu-item>
          </el-sub-menu>
        </el-menu>
      </el-aside>

      <el-main style="background-color: #f5f7fa; padding: 20px;">
        <!-- 核心修复：给router-view加key，避免复用导致的循环 -->
        <router-view :key="$route.fullPath" />
      </el-main>
    </el-container>

    <el-dialog title="切换角色" v-model="roleDialogVisible" width="300px">
      <el-select v-model="selectedRole" style="width: 100%;">
        <el-option label="管理层" value="manager" />
        <el-option label="调度人员" value="dispatcher" />
        <el-option label="仓储管理员" value="warehouse" />
      </el-select>
      <template #footer>
        <el-button @click="roleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmRoleChange">确认</el-button>
      </template>
    </el-dialog>
  </el-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()
const currentRole = ref('manager')
const roleDialogVisible = ref(false)
const selectedRole = ref('manager')

// 修复：简化activeMenu计算属性，避免循环依赖
const activeMenu = computed(() => {
  return router.currentRoute.path || '/manager'
})

const openRoleDialog = () => {
  selectedRole.value = currentRole.value
  roleDialogVisible.value = true
}

// 修复：异步函数加try/catch，避免报错导致循环
const confirmRoleChange = async () => {
  try {
    await axios.post('http://localhost:5000/api/change_role', {
      role: selectedRole.value
    })
  } catch (err) {
    console.log('角色切换请求失败：', err)
  }
  currentRole.value = selectedRole.value
  roleDialogVisible.value = false
  // 修复：延迟跳转，避免同步渲染导致的循环
  setTimeout(() => {
    router.push(`/${selectedRole.value}`)
  }, 100)
}

const handleMenuSelect = (key) => {
  if (key.startsWith('/')) {
    // 修复：同样延迟跳转
    setTimeout(() => {
      router.push(key)
    }, 100)
  }
}

// 新增：页面加载时初始化角色
onMounted(() => {
  currentRole.value = localStorage.getItem('role') || 'manager'
})
</script>

<style scoped>
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body, #app { height: 100%; background-color: #f5f7fa; }
.header-left { float: left; display: flex; align-items: center; gap: 10px; font-size: 18px; font-weight: 600; color: #1989fa; }
.header-right { float: right; display: flex; align-items: center; gap: 15px; }
.system-name { font-size: 18px; font-weight: 600; }
.el-header { padding: 0 20px; line-height: 60px; }
.el-aside { color: #333; }
.el-menu-vertical-demo { border-right: none; }
</style>