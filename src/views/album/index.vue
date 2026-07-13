<template>
  <div>
    <el-card>
      <div class="tb">
        <el-button type="primary" @click="openDialog()">新增专辑</el-button>
        <el-input v-model="keyword" placeholder="搜索专辑名 / 艺人" clearable style="width:240px;margin-left:12px" @keyup.enter="search" @clear="search" />
      </div>
      <el-table :data="list" v-loading="loading" stripe @sort-change="onSortChange">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="封面" width="60">
          <template #default="{ row }">
            <el-image v-if="row.cover" :src="row.cover" style="width:40px;height:40px" fit="cover" :preview-src-list="[row.cover]" preview-teleported />
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="专辑名" />
        <el-table-column label="艺人" width="160">
          <template #default="{ row }">
            <div style="display:flex;align-items:center;gap:6px">
              <el-image v-if="row.artist_avatar" :src="row.artist_avatar" style="width:24px;height:24px;border-radius:50%" fit="cover" />
              <span>{{ row.artist_name || '-' }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="release_date" label="发行日期" width="120" />
        <el-table-column prop="play_count" label="播放量" width="120" sortable="custom" />
        <el-table-column label="操作" width="180">
          <template #default="{ row }">
            <el-button text type="primary" @click="openDialog(row)">编辑</el-button>
            <el-button text type="success" @click="openDetail(row)">详情</el-button>
            <el-button text type="danger" @click="del(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pager">
        <el-pagination v-model:current-page="page" :total="total" :page-size="limit" layout="total, prev, pager, next" @current-change="fetch" />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑专辑' : '新增专辑'" width="500px">
      <el-form label-width="80px">
        <el-form-item label="专辑名">
          <el-input v-model="form.title" />
        </el-form-item>
        <el-form-item label="艺人ID">
          <el-input-number v-model="form.artist_id" :min="0" />
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
        <el-form-item label="发行日期">
          <el-input v-model="form.release_date" placeholder="如 2024-01-01" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="2" />
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

    <el-dialog v-model="detailVisible" title="专辑详情" width="850px" @closed="detailTracks = []; detailAlbum = null">
      <template v-if="detailAlbum">
        <div style="display:flex;gap:16px;margin-bottom:20px;padding:16px;background:#f5f7fa;border-radius:8px">
          <el-image v-if="detailAlbum.cover" :src="detailAlbum.cover" style="width:120px;height:120px;border-radius:6px" fit="cover" :preview-src-list="[detailAlbum.cover]" preview-teleported />
          <div style="flex:1">
            <h3 style="margin:0 0 8px">{{ detailAlbum.title }}</h3>
            <p style="margin:4px 0;color:#666">艺人：{{ detailAlbum.artist_name || '-' }}</p>
            <p style="margin:4px 0;color:#666">发行日期：{{ detailAlbum.release_date || '-' }}</p>
            <p style="margin:4px 0;color:#666" v-if="detailAlbum.description">简介：{{ detailAlbum.description }}</p>
          </div>
        </div>

        <div style="margin-bottom:12px;display:flex;align-items:center;gap:12px">
          <span style="font-weight:bold">曲目列表 ({{ detailTracks.length }})</span>
          <el-button size="small" @click="detailSelectAll">全选 / 取消全选</el-button>
          <el-button size="small" type="success" @click="batchTrackStatus(1)">批量上架</el-button>
          <el-button size="small" type="warning" @click="batchTrackStatus(0)">批量下架</el-button>
          <el-button size="small" type="primary" @click="openTrackImport">从 iTunes 导入歌曲</el-button>
        </div>

        <el-table ref="detailTableRef" :data="detailTracks" row-key="id" @selection-change="onDetailSelectionChange" max-height="350" stripe>
          <el-table-column type="selection" />
          <el-table-column label="封面" width="60">
            <template #default="{ row }">
              <el-image v-if="row.cover" :src="row.cover" style="width:36px;height:36px" fit="cover" />
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="title" label="歌名" />
          <el-table-column label="时长" width="80">
            <template #default="{ row }">
              {{ row.duration_sec ? Math.floor(row.duration_sec / 60) + ':' + String(row.duration_sec % 60).padStart(2, '0') : '-' }}
            </template>
          </el-table-column>
          <el-table-column label="播放" width="70">
            <template #default="{ row }">
              <el-button text size="small" :type="currentTrack === row.id ? 'warning' : 'primary'" :disabled="!row.play_path" @click="togglePlay(row)">
                {{ currentTrack === row.id ? '暂停' : '播放' }}
              </el-button>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="80">
            <template #default="{ row }">
              <el-switch :model-value="row.status === 1" size="small" @change="toggleTrackStatus(row)" />
            </template>
          </el-table-column>
        </el-table>
      </template>
      <el-empty v-else description="加载中..." />
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="trackImportVisible" :title="`从 iTunes 导入歌曲 — ${detailAlbum?.title || ''}`" width="700px" @closed="itunesTracks = []; selectedItunesTracks = []">
      <div v-if="trackImportLoading" v-loading="trackImportLoading" style="text-align:center;padding:40px">
        <p style="color:#999">正在从 iTunes 查询...</p>
      </div>
      <template v-else-if="itunesTracks.length">
        <div style="margin-bottom:12px;display:flex;align-items:center;gap:12px">
          <el-button size="small" @click="toggleSelectAllTracks">全选 / 取消全选</el-button>
          <span style="color:#999">已选 {{ selectedItunesTracks.length }} / {{ itunesTracks.length }} 首</span>
        </div>
        <el-table ref="itunesTrackTableRef" :data="itunesTracks" row-key="title" @selection-change="onItunesTrackSelectionChange" max-height="400">
          <el-table-column type="selection" :selectable="(row) => !row.existing" />
          <el-table-column label="封面" width="60">
            <template #default="{ row }">
              <el-image v-if="row.cover" :src="row.cover" style="width:36px;height:36px" fit="cover" />
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="title" label="歌名" />
          <el-table-column prop="track_no" label="序号" width="70" />
          <el-table-column label="时长" width="80">
            <template #default="{ row }">
              {{ row.duration_sec ? Math.floor(row.duration_sec / 60) + ':' + String(row.duration_sec % 60).padStart(2, '0') : '-' }}
            </template>
          </el-table-column>
          <el-table-column label="" width="80">
            <template #default="{ row }">
              <el-tag v-if="row.existing" type="info" size="small">已存在</el-tag>
            </template>
          </el-table-column>
        </el-table>
      </template>
      <el-empty v-else description="iTunes 未返回曲目数据" />
      <template #footer>
        <el-button @click="trackImportVisible = false">取消</el-button>
        <el-button type="primary" :disabled="selectedItunesTracks.length === 0" :loading="trackImporting" @click="importSelectedTracks">
          导入选中 ({{ selectedItunesTracks.length }})
        </el-button>
      </template>
    </el-dialog>

    <audio ref="audioRef" @ended="onAudioEnded" style="display:none" />
  </div>
</template>

<script setup>
import { ref, reactive, onUnmounted } from 'vue'
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
const sortBy = ref('')
const sortDir = ref('')

const defaultForm = () => ({ id: 0, title: '', artist_id: 0, cover: '', release_date: '', description: '', sort: 0, status: 1 })
const form = reactive(defaultForm())

async function fetch() {
  loading.value = true
  try {
    const params = { page: page.value, limit }
    if (keyword.value) params.keyword = keyword.value
    if (sortBy.value) {
      params.sort_by = sortBy.value
      params.sort_dir = sortDir.value
    }
    const res = await http.get('/album/list', { params })
    if (res.status === 200 && res.data) {
      list.value = res.data.list || []
      total.value = res.data.total || 0
    }
  } finally {
    loading.value = false
  }
}

function search() {
  page.value = 1
  fetch()
}

function onSortChange({ prop, order }) {
  if (prop === 'play_count') {
    sortBy.value = 'al.play_count'
  } else {
    sortBy.value = ''
    sortDir.value = ''
    return
  }
  sortDir.value = order === 'ascending' ? 'asc' : 'desc'
  fetch()
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
    await http.post('/album/save', form)
    ElMessage.success('保存成功')
    dialogVisible.value = false
    fetch()
  } finally {
    saving.value = false
  }
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
    await ElMessageBox.confirm(`确定删除专辑「${row.title}」吗？专辑下的曲目也将一并删除。`, '警告', { type: 'warning' })
  } catch { return }
  try {
    await http.post('/album/delete', { id: row.id })
    ElMessage.success('已删除')
    fetch()
  } catch { /* handled */ }
}

// ── 详情弹窗 ──
const detailVisible = ref(false)
const detailAlbum = ref(null)
const detailTracks = ref([])
const detailTableRef = ref(null)
const detailSelected = ref([])

function onDetailSelectionChange(val) {
  detailSelected.value = val
}

function detailSelectAll() {
  if (detailSelected.value.length === detailTracks.value.length) {
    detailTableRef.value?.clearSelection()
  } else {
    detailTracks.value.forEach(row => detailTableRef.value?.toggleRowSelection(row, true))
  }
}

async function openDetail(row) {
  detailAlbum.value = null
  detailTracks.value = []
  detailSelected.value = []
  detailVisible.value = true
  try {
    const res = await http.get('/album/detail', { params: { id: row.id } })
    if (res.status === 200 && res.data) {
      detailAlbum.value = res.data.album
      detailTracks.value = res.data.tracks || []
    }
  } catch { /* handled */ }
}

async function toggleTrackStatus(track) {
  try {
    await http.post('/track/save', { id: track.id, status: track.status === 1 ? 0 : 1, title: track.title })
    track.status = track.status === 1 ? 0 : 1
    ElMessage.success('状态已更新')
  } catch { /* handled */ }
}

async function batchTrackStatus(status) {
  const ids = detailSelected.value.map(t => t.id)
  if (ids.length === 0) {
    ElMessage.warning('请先选择曲目')
    return
  }
  try {
    await http.post('/track/batch-status', { ids, status })
    detailSelected.value.forEach(t => { t.status = status })
    ElMessage.success(`已${status === 1 ? '上架' : '下架'} ${ids.length} 首曲目`)
  } catch { /* handled */ }
}

// ── iTunes 曲目导入 ──
const trackImportVisible = ref(false)
const trackImportLoading = ref(false)
const trackImporting = ref(false)
const itunesTracks = ref([])
const selectedItunesTracks = ref([])
const itunesTrackTableRef = ref(null)

function onItunesTrackSelectionChange(val) {
  selectedItunesTracks.value = val
}

function toggleSelectAllTracks() {
  const selectable = itunesTracks.value.filter(t => !t.existing)
  if (selectedItunesTracks.value.length === selectable.length) {
    itunesTrackTableRef.value?.clearSelection()
  } else {
    selectable.forEach(row => itunesTrackTableRef.value?.toggleRowSelection(row, true))
  }
}

async function openTrackImport() {
  itunesTracks.value = []
  selectedItunesTracks.value = []
  trackImportVisible.value = true
  trackImportLoading.value = true
  try {
    const res = await http.post('/track/fetch-itunes', {
      artist_name: detailAlbum.value.artist_name || '',
      album_title: detailAlbum.value.title || '',
      album_id: detailAlbum.value.id
    })
    if (res.status === 200 && res.data) {
      itunesTracks.value = res.data.tracks || []
    }
  } catch { /* handled */ }
  finally { trackImportLoading.value = false }
}

async function importSelectedTracks() {
  if (selectedItunesTracks.value.length === 0) return
  trackImporting.value = true
  try {
    const tracks = selectedItunesTracks.value.map(t => ({
      title: t.title, track_no: t.track_no, duration_sec: t.duration_sec, cover: t.cover
    }))
    const res = await http.post('/track/import-itunes', {
      album_id: detailAlbum.value.id,
      artist_id: detailAlbum.value.artist_id || 0,
      tracks
    })
    if (res.status === 200 && res.data) {
      ElMessage.success(`成功导入 ${res.data.created} 首曲目`)
      trackImportVisible.value = false
      // 刷新详情中的曲目列表
      const refRes = await http.get('/album/detail', { params: { id: detailAlbum.value.id } })
      if (refRes.status === 200 && refRes.data) {
        detailTracks.value = refRes.data.tracks || []
      }
    }
  } catch { /* handled */ }
  finally { trackImporting.value = false }
}

// ── 音频播放 ──
const currentTrack = ref(0)
const audioRef = ref(null)

function togglePlay(row) {
  if (!row.play_path) {
    ElMessage.warning('该曲目没有音频文件')
    return
  }
  if (currentTrack.value === row.id) {
    audioRef.value.pause()
    audioRef.value.currentTime = 0
    currentTrack.value = 0
    return
  }
  audioRef.value.src = row.play_path
  audioRef.value.play().catch(() => ElMessage.error('播放失败'))
  currentTrack.value = row.id

  const url = router.resolve({ name: 'TrackPlay', params: { id: row.id } }).href
  const win = window.open(url, '_blank')
  if (!win) ElMessage.warning('请允许浏览器打开新窗口')
}

function onAudioEnded() {
  currentTrack.value = 0
}

onUnmounted(() => {
  if (audioRef.value) {
    audioRef.value.pause()
    audioRef.value.src = ''
  }
})

fetch()
</script>

<style scoped>
.tb { margin-bottom: 16px; display:flex; align-items:center; gap: 12px; }
.pager { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
