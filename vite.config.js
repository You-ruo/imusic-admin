import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  // 部署路径：独立模式用 '/'，gateway 反代时改为 '/admin/'
  base: '/',
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: parseInt(process.env.VITE_PORT || '5174', 10),
    proxy: {
      // 转发到同源路径 /adminapi/...（ThinkPHP 多应用 app 名为 adminapi，不能去掉前缀）
      '/adminapi': {
        // target: 'http://127.0.0.1:8000',
        // 线上
        target: 'http://81.71.155.61:80',
        changeOrigin: true
      }
    }
  }
})
