<template>
  <div>
    <el-card>
      <div class="tb">
        <el-input v-model="keyword" placeholder="搜索歌名/艺人/专辑" clearable style="width:240px" @clear="search" @keyup.enter="search" />
        <el-button @click="search">搜索</el-button>
        <el-select v-model="trialFilter" style="width:100px;margin-left:12px" @change="search">
          <el-option label="全部" value="" />
          <el-option label="试听版" :value="1" />
          <el-option label="非试听版" :value="0" />
        </el-select>
        <el-select v-model="sourceFilter" style="width:100px;margin-left:12px" @change="search">
          <el-option label="全部" value="" />
          <el-option label="网易云" value="netease" />
          <el-option label="本地" value="local" />
        </el-select>
        <el-button type="primary" @click="openDialog()">新增曲目</el-button>
      </div>
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="title" label="曲目名" />
        <el-table-column label="封面" width="60">
          <template #default="{ row }">
            <el-image v-if="row.cover" :src="row.cover" style="width:40px;height:40px" fit="cover" :preview-src-list="[row.cover]" preview-teleported />
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="album_title" label="专辑" width="120" />
        <el-table-column prop="artist_name" label="艺人" width="100" />
        <el-table-column prop="track_no" label="序号" width="60" />
        <el-table-column prop="duration_sec" label="时长(s)" width="80" />
        <el-table-column label="试听" width="70">
          <template #default="{ row }">
            <el-tag v-if="row.is_trial === 1" type="danger" size="small">试听</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="来源" width="80">
          <template #default="{ row }">
            <el-tag v-if="row.source === 'netease'" type="warning" size="small">网易云</el-tag>
            <span v-else>本地</span>
          </template>
        </el-table-column>
        <el-table-column prop="play_count" label="播放量" width="100" />
        <el-table-column label="播放" width="70">
          <template #default="{ row }">
            <el-button text type="primary" :disabled="!row.play_path" @click="togglePlay(row)">
              播放
            </el-button>
          </template>
        </el-table-column>
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

    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑曲目' : '新增曲目'" width="500px">
      <el-form label-width="80px">
        <el-form-item label="曲目名">
          <el-input v-model="form.title" />
        </el-form-item>
        <el-form-item label="艺人">
          <el-select v-model="form.artist_id" filterable clearable placeholder="选择艺人" style="width:100%">
            <el-option v-for="a in artists" :key="a.id" :label="a.name" :value="a.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="专辑ID">
          <el-input-number v-model="form.album_id" :min="0" />
        </el-form-item>
        <el-form-item label="序号">
          <el-input-number v-model="form.track_no" :min="0" />
        </el-form-item>
        <el-form-item label="时长(秒)">
          <el-input-number v-model="form.duration_sec" :min="0" />
        </el-form-item>
        <el-form-item label="封面">
          <div style="display:flex;gap:8px;align-items:center">
            <el-input v-model="form.cover" placeholder="封面 URL" style="flex:1" />
            <el-upload :show-file-list="false" :http-request="(opt) => handleUpload(opt, 'cover', 'covers')" accept="image/*">
              <el-button :loading="uploading === 'cover'">上传</el-button>
            </el-upload>
            <img v-if="form.cover" :src="form.cover" style="width:60px;height:60px;object-fit:cover;border-radius:4px;border:1px solid #dcdfe6" />
          </div>
        </el-form-item>
        <el-form-item label="音频文件">
          <div style="display:flex;gap:8px">
            <el-input v-model="form.play_path" placeholder="播放地址(CDN URL)" style="flex:1" />
            <el-upload :show-file-list="false" :http-request="(opt) => handleUpload(opt, 'play_path', 'audio')" accept="audio/*">
              <el-button :loading="uploading === 'play_path'">上传</el-button>
            </el-upload>
          </div>
        </el-form-item>
        <el-form-item label="歌词(LRC)">
          <div style="display:flex;flex-direction:column;gap:6px;width:100%">
            <el-input v-model="form.lyric" type="textarea" :rows="5" />
            <input type="file" accept=".lrc,.txt" style="font-size:12px" @change="handleLrcFile" />
          </div>
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
import { useRouter } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import http from '@/api'
import { uploadFile } from '@/api/upload'

const router = useRouter()

const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const list = ref([])
const page = ref(1)
const total = ref(0)
const limit = 20
const keyword = ref('')
const trialFilter = ref('')
const sourceFilter = ref('')
const artists = ref([])

const defaultForm = () => ({ id: 0, title: '', artist_id: 0, album_id: 0, track_no: 0, duration_sec: 0, cover: '', play_path: '', lyric: '', status: 1 })
const form = reactive(defaultForm())

async function fetchArtists() {
  try {
    const res = await http.get('/artist/list', { params: { page: 1, limit: 200 } })
    if (res.status === 200 && res.data) {
      artists.value = res.data.list || []
    }
  } catch { /* ignore */ }
}

function search() {
  page.value = 1
  fetch()
}

async function fetch() {
  loading.value = true
  try {
    const params = { page: page.value, limit, keyword: keyword.value }
    if (trialFilter.value !== '') params.is_trial = trialFilter.value
    if (sourceFilter.value !== '') params.source = sourceFilter.value
    const res = await http.get('/track/list', { params })
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
    Object.assign(form, { ...row, status: row.status ?? 1, lyric: row.lyric || '' })
  } else {
    Object.assign(form, defaultForm())
  }
  dialogVisible.value = true
}

async function save() {
  saving.value = true
  try {
    await http.post('/track/save', form)
    ElMessage.success('保存成功')
    dialogVisible.value = false
    fetch()
  } finally {
    saving.value = false
  }
}

function togglePlay(row) {
  if (!row.play_path) {
    ElMessage.warning('该曲目没有音频文件')
    return
  }

  const url = router.resolve({ name: 'TrackPlay', params: { id: row.id } }).href
  const win = window.open(url, '_blank')
  if (!win) ElMessage.warning('请允许浏览器打开新窗口')
}

function toggleStatus(row) {
  try {
    await http.post('/track/save', { id: row.id, status: row.status === 1 ? 0 : 1, title: row.title, album_id: row.album_id ?? 0, artist_id: row.artist_id ?? 0 })
    ElMessage.success('状态已更新')
    fetch()
  } catch { /* handled */ }
}

function handleLrcFile(e) {
  const file = e.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    form.lyric = reader.result
    ElMessage.success('歌词文件已加载')
  }
  reader.onerror = () => ElMessage.error('文件读取失败')
  reader.readAsText(file, 'utf-8')
  e.target.value = ''
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
  await http.post('/track/delete', { id: row.id })
  ElMessage.success('已删除')
  fetch()
}

fetch()
fetchArtists()
</script>

<style scoped>
.tb { margin-bottom: 16px; display:flex; gap:8px; align-items:center }
.pager { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
