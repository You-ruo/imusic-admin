<template>
  <div>
    <el-card>
      <div class="tb">
        <el-button type="primary" @click="openDialog()">新增 Banner</el-button>
      </div>
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="title" label="标题" />
        <el-table-column label="图片" width="60">
          <template #default="{ row }">
            <el-image v-if="row.image_url" :src="row.image_url" style="width:40px;height:40px" fit="cover" :preview-src-list="[row.image_url]" preview-teleported />
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="link_type" label="跳转类型" width="100" />
        <el-table-column prop="link_id" label="跳转ID" width="80" />
        <el-table-column prop="sort" label="排序" width="80" />
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-switch :model-value="row.status === 1" @change="toggleStatus(row)" />
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

    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑 Banner' : '新增 Banner'" width="500px">
      <el-form label-width="80px">
        <el-form-item label="标题">
          <el-input v-model="form.title" />
        </el-form-item>
        <el-form-item label="图片URL">
          <div style="display:flex;gap:8px;align-items:center">
            <el-input v-model="form.image_url" placeholder="图片 URL" style="flex:1" />
            <el-upload :show-file-list="false" :http-request="(opt) => handleUpload(opt, 'image_url', 'banners')" accept="image/*">
              <el-button :loading="uploading === 'image_url'">上传</el-button>
            </el-upload>
            <img v-if="form.image_url" :src="form.image_url" style="width:60px;height:60px;object-fit:cover;border-radius:4px;border:1px solid #dcdfe6" />
          </div>
        </el-form-item>
        <el-form-item label="跳转类型">
          <el-select v-model="form.link_type">
            <el-option label="专辑" value="album" />
            <el-option label="曲目" value="track" />
            <el-option label="链接" value="url" />
          </el-select>
        </el-form-item>
        <el-form-item label="跳转ID">
          <el-input-number v-model="form.link_id" :min="0" />
        </el-form-item>
        <el-form-item label="跳转URL">
          <el-input v-model="form.link_url" placeholder="当 link_type=url 时填写" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="0" />
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
import { uploadFile } from '@/api/upload'

const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const list = ref([])
const page = ref(1)
const total = ref(0)
const limit = 20

const defaultForm = () => ({ id: 0, title: '', image_url: '', link_type: 'album', link_id: 0, link_url: '', sort: 0, status: 1 })
const form = reactive(defaultForm())

async function fetch() {
  loading.value = true
  try {
    const res = await http.get('/banner/list', { params: { page: page.value, limit } })
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
    Object.assign(form, { ...row, status: row.status ?? 1 })
  } else {
    Object.assign(form, defaultForm())
  }
  dialogVisible.value = true
}

async function save() {
  saving.value = true
  try {
    await http.post('/banner/save', form)
    ElMessage.success('保存成功')
    dialogVisible.value = false
    fetch()
  } finally {
    saving.value = false
  }
}

async function toggleStatus(row) {
  try {
    await http.post('/banner/save', { id: row.id, status: row.status === 1 ? 0 : 1, title: row.title })
    ElMessage.success('状态已更新')
    fetch()
  } catch { /* handled */ }
}

const uploading = ref('')

async function handleUpload(options, field, dir) {
  uploading.value = field
  try {
    const res = await uploadFile(options.file, dir)
    if (res.status === 200 && res.data?.url) {
      form[field] = res.data.url
      ElMessage.success('上传成功')
    }
  } catch { /* handled */ }
  finally { uploading.value = '' }
}

async function del(row) {
  try {
    await ElMessageBox.confirm(`确定删除「${row.title}」吗？此操作不可恢复。`, '警告', { type: 'warning' })
  } catch { return }
  await http.post('/banner/delete', { id: row.id })
  ElMessage.success('已删除')
  fetch()
}

fetch()
</script>

<style scoped>
.tb { margin-bottom: 16px; }
.pager { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
