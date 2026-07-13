<template>
  <div>
    <el-card>
      <div class="tb">
        <el-radio-group v-model="poolType" @change="fetch">
          <el-radio-button value="hot">热门推荐</el-radio-button>
          <el-radio-button value="new">新歌速递</el-radio-button>
        </el-radio-group>
        <el-button type="primary" @click="dialogVisible = true" style="margin-left:16px">添加曲目</el-button>
      </div>
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="track_id" label="曲目ID" width="80" />
        <el-table-column prop="sort" label="排序" width="80" />
        <el-table-column label="操作">
          <template #default="{ row }">
            <el-button text type="danger" @click="remove(row)">移除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pager">
        <el-pagination v-model:current-page="page" :total="total" :page-size="limit" layout="total, prev, pager, next" @current-change="fetch" />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" title="添加曲目到推荐池" width="400px">
      <el-form>
        <el-form-item label="曲目ID">
          <el-input-number v-model="addForm.track_id" :min="1" style="width:100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="addTrack">添加</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import http from '@/api'

const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const poolType = ref('hot')
const list = ref([])
const page = ref(1)
const total = ref(0)
const limit = 20
const addForm = reactive({ track_id: 0 })

async function fetch() {
  loading.value = true
  try {
    const res = await http.get('/recommend/list', { params: { pool_type: poolType.value, page: page.value, limit } })
    if (res.status === 200 && res.data) {
      list.value = res.data.list || []
      total.value = res.data.total || 0
    }
  } finally {
    loading.value = false
  }
}

async function addTrack() {
  if (addForm.track_id < 1) {
    ElMessage.warning('请输入曲目ID')
    return
  }
  saving.value = true
  try {
    await http.post('/recommend/add', { pool_type: poolType.value, track_id: addForm.track_id })
    ElMessage.success('添加成功')
    dialogVisible.value = false
    addForm.track_id = 0
    fetch()
  } finally {
    saving.value = false
  }
}

async function remove(row) {
  try {
    await ElMessageBox.confirm('确定移除此曲目吗？', '提示', { type: 'warning' })
  } catch { return }
  await http.post('/recommend/remove', { id: row.id })
  ElMessage.success('已移除')
  fetch()
}

fetch()
</script>

<style scoped>
.tb { margin-bottom: 16px; display: flex; align-items: center; }
.pager { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
