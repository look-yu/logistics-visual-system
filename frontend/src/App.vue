<template>
  <el-config-provider :locale="zhCn">
    <div class="app-wrapper">
      <el-container v-if="!$route.meta.hideMenu">
        <el-aside width="200px" v-if="user?.role !== 'customer'">
          <div class="logo">
            <el-icon><Van /></el-icon>
            <span>物流管理系统</span>
          </div>
          <el-menu
            :default-active="$route.path"
            router
            background-color="#001529"
            text-color="#fff"
            active-text-color="#409eff"
          >
            <el-menu-item index="/manager">
              <el-icon><Monitor /></el-icon>
              <span>决策中心</span>
            </el-menu-item>
            <el-menu-item index="/dispatcher">
              <el-icon><Location /></el-icon>
              <span>运输调度</span>
            </el-menu-item>
            <el-menu-item index="/orders">
              <el-icon><Document /></el-icon>
              <span>订单管理</span>
            </el-menu-item>
            <el-menu-item index="/route-query">
              <el-icon><Location /></el-icon>
              <span>路线查询</span>
            </el-menu-item>
            <el-menu-item index="/customers">
              <el-icon><User /></el-icon>
              <span>客户管理</span>
            </el-menu-item>
            <el-menu-item index="/warehouse">
              <el-icon><Box /></el-icon>
              <span>仓储管理</span>
            </el-menu-item>
            <el-menu-item index="/reports">
              <el-icon><PieChart /></el-icon>
              <span>分析看板</span>
            </el-menu-item>
          </el-menu>
        </el-aside>
        
        <el-container>
          <el-header>
            <div class="header-left">{{ user?.role === 'customer' ? '客户中心' : $route.meta.title }}</div>
            <div class="header-right">
              <div class="user-info">
                <el-avatar :size="32" src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" />
                <span class="user-name">{{ user?.real_name || '管理员' }}</span>
                <el-button type="danger" size="small" @click="handleLogout" class="logout-btn">
                  退出登录
                </el-button>
              </div>
            </div>
          </el-header>
          
          <el-main>
            <router-view v-slot="{ Component }">
              <transition name="fade-transform" mode="out-in">
                <component :is="Component" />
              </transition>
            </router-view>
          </el-main>
        </el-container>
      </el-container>
      
      <router-view v-else />
    </div>
  </el-config-provider>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useDataStore } from './stores/dataStore'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import { Monitor, Location, Document, PieChart, User, Files, Van, Service, Box } from '@element-plus/icons-vue'

const router = useRouter()
const store = useDataStore()
const user = computed(() => store.user)

const handleLogout = () => {
  store.logout()
  router.push('/login')
}
</script>

<style>
body { margin: 0; font-family: "Helvetica Neue",Helvetica,"PingFang SC","Hiragino Sans GB","Microsoft YaHei","微软雅黑",Arial,sans-serif; }
.app-wrapper { height: 100vh; display: flex; flex-direction: column; }
.el-aside { background-color: #001529; color: #fff; transition: width 0.3s; }
.logo { height: 60px; display: flex; align-items: center; justify-content: center; gap: 10px; font-size: 18px; font-weight: bold; background: #002140; }
.el-header { background: #fff; border-bottom: 1px solid #e6e6e6; display: flex; align-items: center; justify-content: space-between; padding: 0 20px; box-shadow: 0 1px 4px rgba(0,21,41,.08); height: 60px; }
.header-left { font-size: 16px; font-weight: 500; }
.user-info { display: flex; align-items: center; gap: 12px; }
.user-name { font-size: 14px; color: #303133; }
.logout-btn { margin-left: 10px; }
.el-main { background-color: #f0f2f5; padding: 20px; overflow-y: auto; }

/* Transition Animation */
.fade-transform-enter-active, .fade-transform-leave-active { transition: all .3s; }
.fade-transform-enter-from { opacity: 0; transform: translateX(-30px); }
.fade-transform-leave-to { opacity: 0; transform: translateX(30px); }
</style>
