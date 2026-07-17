<template>
  <el-container class="layout">
    <el-aside width="220px" class="aside">
      <div class="logo">imusic Admin</div>
      <el-menu
        :default-active="route.path"
        router
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409eff"
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <span>控制台</span>
        </el-menu-item>
        <el-sub-menu index="music">
          <template #title>
            <el-icon><Headset /></el-icon>
            <span>音乐管理</span>
          </template>
          <el-menu-item index="/artist">艺人管理</el-menu-item>
          <el-menu-item index="/album">专辑管理</el-menu-item>
          <el-menu-item index="/track">曲目管理</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="operation">
          <template #title>
            <el-icon><Operation /></el-icon>
            <span>运营管理</span>
          </template>
          <el-menu-item index="/banner">Banner 管理</el-menu-item>
          <el-menu-item index="/recommend">推荐池管理</el-menu-item>
          <el-menu-item index="/message">消息管理</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="system">
          <template #title>
            <el-icon><Setting /></el-icon>
            <span>系统管理</span>
          </template>
          <el-menu-item index="/user">用户管理</el-menu-item>
          <el-menu-item index="/admin-user">管理员账号</el-menu-item>
          <el-menu-item index="/role">角色权限</el-menu-item>
          <el-menu-item index="/audit">审计日志</el-menu-item>
          <el-menu-item index="/third-setting">第三方设置</el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <span class="header-title">{{ route.meta.title }}</span>
        <div class="header-right">
          <span class="admin-name">{{ adminName }}</span>
          <el-button text @click="logout">退出</el-button>
        </div>
      </el-header>
      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const adminName = computed(() => {
  const info = localStorage.getItem('admin_info')
  if (info) {
    try { return JSON.parse(info).username || '' } catch { return '' }
  }
  return ''
})

function logout() {
  localStorage.removeItem('admin_token')
  localStorage.removeItem('admin_info')
  router.push('/login')
}
</script>

<style>
body { margin: 0; }
.layout { height: 100vh; }
.aside { background: #304156; overflow-y: auto; }
.logo { height: 60px; line-height: 60px; text-align: center; color: #fff; font-size: 18px; font-weight: 700; border-bottom: 1px solid rgba(255,255,255,0.1); }
.header { background: #fff; border-bottom: 1px solid #e6e6e6; display: flex; align-items: center; justify-content: space-between; padding: 0 20px; height: 60px; }
.header-title { font-size: 16px; font-weight: 600; }
.header-right { display: flex; align-items: center; gap: 12px; }
.admin-name { font-size: 14px; color: #666; }
.el-main { background: #f0f2f5; }

/* 子菜单项缩进对齐：确保文字起点与父菜单标题文字对齐 */
.el-menu--inline .el-menu-item {
  padding-left: 50px !important;
}
</style>
