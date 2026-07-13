<template>
  <div>
    <el-card>
      <div class="tb">
        <el-select v-model="filterAdminId" placeholder="管理员" clearable style="width:160px" @change="fetch">
          <el-option label="全部" :value="0" />
          <el-option v-for="a in admins" :key="a.id" :label="a.username" :value="a.id" />
        </el-select>
        <el-select v-model="filterAction" placeholder="操作类型" clearable style="width:160px;margin-left:12px" @change="fetch">
          <el-option label="全部" value="" />
          <el-option label="admin.login" value="admin.login" />
          <el-option label="admin.logout" value="admin.logout" />
          <el-option label="track.create" value="track.create" />
          <el-option label="track.update" value="track.update" />
          <el-option label="artist.create" value="artist.create" />
          <el-option label="artist.update" value="artist.update" />
          <el-option label="album.create" value="album.create" />
          <el-option label="album.update" value="album.update" />
          <el-option label="banner.create" value="banner.create" />
          <el-option label="banner.update" value="banner.update" />
          <el-option label="user.enable" value="user.enable" />
          <el-option label="user.disable" value="user.disable" />
        </el-select>
      </div>
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="admin_id" label="管理员ID" width="100" />
        <el-table-column prop="action" label="操作" width="150" />
        <el-table-column prop="target" label="目标" />
        <el-table-column prop="ip" label="IP" width="140" />
        <el-table-column prop="create_time" label="时间" width="180">
          <template #default="{ row }">{{ tsToDate(row.create_time) }}</template>
        </el-table-column>
      </el-table>
      <div class="pager">
        <el-pagination v-model:current-page="page" :total="total" :page-size="limit" layout="total, prev, pager, next" @current-change="fetch" />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import http from '@/api'

const loading = ref(false)
const filterAdminId = ref(0)
const filterAction = ref('')
const list = ref([])
const admins = ref([])
const page = ref(1)
const total = ref(0)
const limit = 20

async function fetch() {
  loading.value = true
  try {
    const params = { page: page.value, limit }
    if (filterAdminId.value > 0) params.admin_id = filterAdminId.value
    if (filterAction.value) params.action = filterAction.value
    const res = await http.get('/audit/list', { params })
    if (res.status === 200 && res.data) {
      list.value = res.data.list || []
      total.value = res.data.total || 0
    }
  } finally {
    loading.value = false
  }
}

async function loadAdmins() {
  try {
    const res = await http.get('/admin_user/list', { params: { page: 1, limit: 100 } })
    if (res.status === 200 && res.data) {
      admins.value = res.data.list || []
    }
  } catch { /* optional */ }
}

function tsToDate(ts) {
  if (!ts) return ''
  const d = new Date(ts * 1000)
  return d.toLocaleString('zh-CN')
}

onMounted(() => {
  loadAdmins()
  fetch()
})
</script>

<style scoped>
.tb { margin-bottom: 16px; display: flex; }
.pager { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
