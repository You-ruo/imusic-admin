<template>
  <div>
    <el-card>
      <div class="tb">
        <el-input v-model="keyword" placeholder="搜索账号/昵称" clearable style="width:240px" @change="fetch" />
        <el-select v-model="statusFilter" style="width:120px;margin-left:12px" @change="fetch">
          <el-option label="全部" value="" />
          <el-option label="正常" :value="1" />
          <el-option label="封禁" :value="0" />
        </el-select>
      </div>
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="uid" label="UID" width="80" />
        <el-table-column prop="account" label="账号" />
        <el-table-column prop="nickname" label="昵称" />
        <el-table-column prop="phone" label="手机" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">{{ row.status === 1 ? '正常' : '封禁' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="add_time" label="注册时间" width="180">
          <template #default="{ row }">{{ tsToDate(row.add_time) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="160">
          <template #default="{ row }">
            <el-button v-if="row.status === 1" text type="danger" @click="toggleUser(row, 0)">封禁</el-button>
            <el-button v-else text type="success" @click="toggleUser(row, 1)">解封</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pager">
        <el-pagination v-model:current-page="page" :total="total" :page-size="limit" layout="total, prev, pager, next" @current-change="fetch" />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import http from '@/api'

const loading = ref(false)
const keyword = ref('')
const statusFilter = ref('')
const list = ref([])
const page = ref(1)
const total = ref(0)
const limit = 20

async function fetch() {
  loading.value = true
  try {
    const params = { page: page.value, limit }
    if (keyword.value) params.keyword = keyword.value
    if (statusFilter.value !== '') params.status = statusFilter.value
    const res = await http.get('/user/list', { params })
    if (res.status === 200 && res.data) {
      list.value = res.data.list || []
      total.value = res.data.total || 0
    }
  } finally {
    loading.value = false
  }
}

async function toggleUser(row, status) {
  await http.post('/user/toggleStatus', { uid: row.uid, status })
  ElMessage.success(status === 1 ? '已解封' : '已封禁')
  fetch()
}

function tsToDate(ts) {
  if (!ts) return ''
  const d = new Date(ts * 1000)
  return d.toLocaleString('zh-CN')
}

fetch()
</script>

<style scoped>
.tb { margin-bottom: 16px; display: flex; }
.pager { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
