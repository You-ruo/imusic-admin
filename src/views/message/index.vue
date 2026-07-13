<template>
  <div>
    <el-card>
      <div class="tb">
        <el-button type="primary" @click="openDialog()">新增消息</el-button>
      </div>
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="title" label="标题" />
        <el-table-column label="正文" show-overflow-tooltip>
          <template #default="{ row }">
            <span style="color:#999">{{ row.content?.substring(0, 60) }}{{ row.content?.length > 60 ? '...' : '' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.create_time) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160">
          <template #default="{ row }">
            <el-button text type="primary" @click="openDialog(row)">编辑</el-button>
            <el-button text type="danger" @click="del(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pager">
        <el-pagination v-model:current-page="page" :total="total" :page-size="limit" layout="total, prev, pager, next" @current-change="fetch" />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑消息' : '新增消息'" width="560px">
      <el-form label-width="80px">
        <el-form-item label="标题">
          <el-input v-model="form.title" placeholder="请输入消息标题" />
        </el-form-item>
        <el-form-item label="正文">
          <el-input v-model="form.content" type="textarea" :rows="5" placeholder="请输入消息正文" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
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
const list = ref([])
const page = ref(1)
const total = ref(0)
const limit = 20

const defaultForm = () => ({ id: 0, title: '', content: '' })
const form = reactive(defaultForm())

async function fetch() {
  loading.value = true
  try {
    const res = await http.get('/message/list', { params: { page: page.value, limit } })
    if (res.status === 200 && res.data) {
      list.value = res.data.list || []
      total.value = res.data.total || 0
    }
  } finally {
    loading.value = false
  }
}

function openDialog(row) {
  if (row) {
    Object.assign(form, { id: row.id, title: row.title, content: row.content })
  } else {
    Object.assign(form, defaultForm())
  }
  dialogVisible.value = true
}

async function save() {
  saving.value = true
  try {
    await http.post('/message/save', form)
    ElMessage.success('保存成功')
    dialogVisible.value = false
    fetch()
  } finally {
    saving.value = false
  }
}

async function del(row) {
  try {
    await ElMessageBox.confirm(`确定删除「${row.title}」吗？此操作不可恢复。`, '警告', { type: 'warning' })
  } catch { return }
  await http.post('/message/delete', { id: row.id })
  ElMessage.success('已删除')
  fetch()
}

function formatTime(ts) {
  const num = Number(ts)
  if (!num) return ''
  const d = new Date(num * 1000)
  if (isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

fetch()
</script>

<style scoped>
.tb { margin-bottom: 16px; }
.pager { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
