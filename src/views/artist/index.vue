<template>
  <div>
    <el-card>
      <div class="tb">
        <el-button type="primary" @click="openDialog()">新增艺人</el-button>
      </div>
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="艺人名" />
        <el-table-column prop="slug" label="标识" />
        <el-table-column label="头像" width="60">
          <template #default="{ row }">
            <el-image v-if="row.avatar" :src="row.avatar" style="width:40px;height:40px" fit="cover" :preview-src-list="[row.avatar]" preview-teleported />
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="80" />
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-switch :model-value="row.status === 1" @change="toggleStatus(row)" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="260">
          <template #default="{ row }">
            <el-button text type="primary" @click="openDialog(row)">编辑</el-button>
            <el-button text type="danger" @click="del(row)">删除</el-button>
            <el-button text type="success" @click="openItunesDialog(row)">获取专辑</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pager">
        <el-pagination v-model:current-page="page" :total="total" :page-size="limit" layout="total, prev, pager, next" @current-change="fetch" />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑艺人' : '新增艺人'" width="500px">
      <el-form label-width="80px">
        <el-form-item label="名称">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="标识(slug)">
          <el-input v-model="form.slug" placeholder="英文标识，如 jay-chou" />
        </el-form-item>
        <el-form-item label="头像">
          <div style="display:flex;gap:8px;align-items:center">
            <el-input v-model="form.avatar" placeholder="头像 URL" style="flex:1" />
            <el-upload :show-file-list="false" :http-request="(opt) => handleUpload(opt, 'avatar', 'covers')" accept="image/*">
              <el-button :loading="uploading === 'avatar'">上传</el-button>
            </el-upload>
            <img v-if="form.avatar" :src="form.avatar" style="width:60px;height:60px;object-fit:cover;border-radius:4px;border:1px solid #dcdfe6" />
          </div>
        </el-form-item>
        <el-form-item label="简介">
          <el-input v-model="form.bio" type="textarea" :rows="3" />
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

    <el-dialog v-model="itunesVisible" :title="`从 iTunes 获取专辑 — ${itunesArtistName}`" width="750px" @closed="itunesAlbums = []; selectedAlbums = []">
      <div v-if="itunesLoading" style="text-align:center;padding:40px" v-loading="itunesLoading">
        <p style="margin-top:12px;color:#999">正在从 iTunes 查询...</p>
      </div>
      <template v-else-if="itunesAlbums.length">
        <div style="margin-bottom:12px;display:flex;align-items:center;gap:12px">
          <el-button size="small" @click="toggleSelectAll">全选 / 取消全选</el-button>
          <span style="color:#999">已选 {{ selectedAlbums.length }} / {{ itunesAlbums.length }} 张</span>
        </div>
        <el-table ref="itunesTableRef" :data="itunesAlbums" row-key="title" @selection-change="onSelectionChange" max-height="400">
          <el-table-column type="selection" :selectable="(row) => !row.existing" />
          <el-table-column type="expand">
            <template #default="{ row }">
              <div v-if="row.tracks?.length" style="padding:0 20px 12px">
                <el-tag v-for="(t, i) in row.tracks" :key="i" style="margin:4px">{{ t.no }}. {{ t.title }}</el-tag>
              </div>
              <span v-else style="color:#999">-</span>
            </template>
          </el-table-column>
          <el-table-column label="封面" width="60">
            <template #default="{ row }">
              <el-image v-if="row.cover" :src="row.cover" style="width:40px;height:40px" fit="cover" />
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="title" label="专辑名称" />
          <el-table-column prop="release_date" label="发行日期" width="120" />
          <el-table-column label="" width="80">
            <template #default="{ row }">
              <el-tag v-if="row.existing" type="info" size="small">已存在</el-tag>
            </template>
          </el-table-column>
        </el-table>
      </template>
      <el-empty v-else description="iTunes 未返回专辑数据" />
      <template #footer>
        <el-button @click="itunesVisible = false">取消</el-button>
        <el-button type="primary" :disabled="selectedAlbums.length === 0" :loading="importing" @click="importSelected">
          导入选中 ({{ selectedAlbums.length }})
        </el-button>
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

const defaultForm = () => ({ id: 0, name: '', slug: '', avatar: '', bio: '', sort: 0, status: 1 })
const form = reactive(defaultForm())

async function fetch() {
  loading.value = true
  try {
    const res = await http.get('/artist/list', { params: { page: page.value, limit } })
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
    await http.post('/artist/save', form)
    ElMessage.success('保存成功')
    dialogVisible.value = false
    fetch()
  } finally {
    saving.value = false
  }
}

async function toggleStatus(row) {
  try {
    await http.post('/artist/save', { id: row.id, status: row.status === 1 ? 0 : 1, name: row.name })
    ElMessage.success('状态已更新')
    fetch()
  } catch { /* handled by interceptor */ }
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
    await ElMessageBox.confirm(`确定删除「${row.name}」吗？`, '提示', { type: 'warning' })
  } catch { return }
  await http.post('/artist/save', { id: row.id, status: 0, name: row.name })
  ElMessage.success('已删除')
  fetch()
}

// ── iTunes 专辑弹窗 ──
const itunesVisible = ref(false)
const itunesLoading = ref(false)
const importing = ref(false)
const itunesArtistName = ref('')
const itunesAlbums = ref([])
const selectedAlbums = ref([])
const itunesTableRef = ref(null)
const currentArtistId = ref(0)

function onSelectionChange(val) {
  selectedAlbums.value = val
}

function toggleSelectAll() {
  const selectable = itunesAlbums.value.filter(a => !a.existing)
  if (selectedAlbums.value.length === selectable.length) {
    itunesTableRef.value?.clearSelection()
  } else {
    selectable.forEach(row => itunesTableRef.value?.toggleRowSelection(row, true))
  }
}

async function openItunesDialog(row) {
  currentArtistId.value = row.id
  itunesArtistName.value = row.name
  itunesAlbums.value = []
  selectedAlbums.value = []
  itunesVisible.value = true
  itunesLoading.value = true
  try {
    const res = await http.post('/album/fetch-itunes', { artist_id: row.id })
    if (res.status === 200 && res.data) {
      itunesAlbums.value = res.data.albums || []
    }
  } catch { /* handled */ }
  finally { itunesLoading.value = false }
}

async function importSelected() {
  if (selectedAlbums.value.length === 0) return
  importing.value = true
  try {
    const albums = selectedAlbums.value.map(a => ({
      title: a.title, cover: a.cover, release_date: a.release_date
    }))
    const res = await http.post('/album/batch-create', { artist_id: currentArtistId.value, albums })
    if (res.status === 200 && res.data) {
      ElMessage.success(`成功导入 ${res.data.created} 张专辑`)
      itunesVisible.value = false
    }
  } catch { /* handled */ }
  finally { importing.value = false }
}

fetch()
</script>

<style scoped>
.tb { margin-bottom: 16px; }
.pager { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
