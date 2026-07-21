<template>
  <div>
    <el-card>
      <div class="tb">
        <el-radio-group v-model="listType" @change="fetch">
          <el-radio-button value="daily">日榜</el-radio-button>
          <el-radio-button value="weekly">周榜</el-radio-button>
          <el-radio-button value="monthly">月榜</el-radio-button>
        </el-radio-group>
        <el-button type="primary" @click="fetch" style="margin-left:16px">刷新</el-button>
      </div>
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column label="排名" width="70">
          <template #default="{ row }">
            <el-tag v-if="row.rank === 1" type="warning" size="large">🥇</el-tag>
            <el-tag v-else-if="row.rank === 2" type="danger" size="large">🥈</el-tag>
            <el-tag v-else-if="row.rank === 3" type="info" size="large">🥉</el-tag>
            <span v-else>#{{ row.rank }}</span>
          </template>
        </el-table-column>
        <el-table-column label="封面" width="60">
          <template #default="{ row }">
            <el-image v-if="row.cover" :src="row.cover" style="width:44px;height:44px" fit="cover" :preview-src-list="[row.cover]" preview-teleported />
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="曲目名" min-width="150" />
        <el-table-column prop="artist_name" label="艺人" width="120" />
        <el-table-column prop="album_title" label="专辑" width="120" />
        <el-table-column prop="score" label="播放量" width="100" sortable />
      </el-table>
      <div class="pager">
        <span style="color:#909399;font-size:12px">共 {{ total }} 条</span>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import http from '@/api'

const loading = ref(false)
const listType = ref('daily')
const list = ref([])
const total = ref(0)

async function fetch() {
  loading.value = true
  try {
    const res = await http.get('/rank/list', { params: { list: listType.value, limit: 50 } })
    if (res.status === 200 && res.data) {
      list.value = res.data.list || []
      total.value = res.data.total || 0
    }
  } catch (e) {
    ElMessage.error('获取排行榜数据失败')
  } finally {
    loading.value = false
  }
}

fetch()
</script>

<style scoped>
.tb { margin-bottom: 16px; display: flex; align-items: center; }
.pager { margin-top: 16px; }
</style>
