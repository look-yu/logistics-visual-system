import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 5173, // 固定端口，避免冲突
    open: true, // 启动后自动打开浏览器
    cors: true // 允许跨域
  },
  // 适配 Node.js 18 的构建配置
  build: {
    target: 'es2020',
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          vue: ['vue'],
          echarts: ['echarts'],
          elementPlus: ['element-plus']
        }
      }
    }
  }
})