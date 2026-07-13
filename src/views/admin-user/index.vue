<template>
  <div>
    <el-card>
      <div class="tb">
        <el-button type="primary" @click="openDialog()">新增管理员</el-button>
      </div>
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="用户名" />
        <el-table-column prop="role_id" label="角色ID" width="80" />
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">{{ row.status === 1 ? '正常' : '停用' }}</el-tag>
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

    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑管理员' : '新增管理员'" width="500px">
      <el-form label-width="80px">
        <el-form-item label="用户名">
          <el-input v-model="form.username" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="form.password" type="password" :placeholder="form.id ? '不修改请留空' : '请输入密码'" show-password />
        </el-form-item>
        <el-form-item label="角色ID">
          <el-input-number v-model="form.role_id" :min="0" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch :model-value="form.status === 1" @change="val => form.status = val ? 1 : 0" />
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

const defaultForm = () => ({ id: 0, username: '', password: '', role_id: 0, status: 1 })
const form = reactive(defaultForm())

async function fetch() {
  loading.value = true
  try {
    const res = await http.get('/admin_user/list', { params: { page: page.value, limit } })
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
    Object.assign(form, { ...row, password: '', status: row.status ?? 1 })
  } else {
    Object.assign(form, defaultForm())
  }
  dialogVisible.value = true
}

async function save() {
  saving.value = true
  try {
    await http.post('/admin_user/save', form)
    ElMessage.success('保存成功')
    dialogVisible.value = false
    fetch()
  } finally {
    saving.value = false
  }
}

async function del(row) {
  try {
    await ElMessageBox.confirm(`确定删除管理员「${row.username}」吗？`, '提示', { type: 'warning' })
  } catch { return }
  await http.post('/admin_user/delete', { id: row.id })
  ElMessage.success('已删除')
  fetch()
}

fetch()
</script>

<style scoped>
.tb { margin-bottom: 16px; }
.pager { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
