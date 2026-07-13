<template>
  <div class="play-page" v-loading="loading">
    <!-- Error -->
    <div v-if="error" class="error-state">
      <p>{{ error }}</p>
      <div style="display:flex;gap:8px;justify-content:center">
        <el-button @click="fetchDetail">重试</el-button>
        <el-button @click="goBack">返回列表</el-button>
      </div>
    </div>

    <!-- No audio -->
    <div v-else-if="!track?.play_path" class="error-state">
      <p>该曲目没有音频文件</p>
      <el-button @click="goBack">返回列表</el-button>
    </div>

    <!-- Content -->
    <template v-else-if="track">
      <div class="header-bar">
        <el-button text @click="goBack">&lt; 返回列表</el-button>
        <span class="page-title">{{ track.title }}</span>
        <span />
      </div>

      <div class="body-area">
        <!-- Left: Cover + Controls -->
        <div class="player-section">
          <div class="cover-wrapper" :class="{ paused: !isPlaying }">
            <div class="vinyl-bg" />
            <img v-if="track.cover" :src="track.cover" class="cover-img" />
            <div v-else class="cover-placeholder">
              <el-icon :size="56"><Headset /></el-icon>
            </div>
          </div>

          <div class="track-meta">
            <h2>{{ track.title }}</h2>
            <p v-if="track.artist_name">{{ track.artist_name }}</p>
            <p v-if="track.album_title" style="color:#909399;font-size:13px">{{ track.album_title }}</p>
          </div>

          <div class="controls">
            <el-button circle size="large" @click="togglePlayPause" class="play-btn">
              <el-icon :size="24"><VideoPause v-if="isPlaying" /><VideoPlay v-else /></el-icon>
            </el-button>
            <div class="progress-row">
              <span class="time">{{ formatTime(currentTime) }}</span>
              <el-slider v-model="progressPercent" :show-tooltip="false" class="progress-slider" @change="seek" />
              <span class="time">{{ formatTime(duration) }}</span>
            </div>
            <div class="volume-row">
              <el-icon><VideoPlay /></el-icon>
              <el-slider v-model="volume" :max="1" :step="0.01" class="volume-slider" @change="setVolume" />
            </div>
          </div>
        </div>

        <!-- Right: Lyrics -->
        <div class="lyrics-section">
          <h3 style="margin:0 0 12px;color:#303133">歌词</h3>
          <div class="lyrics-scroll" ref="lyricsRef">
            <p v-if="parsedLyrics.length === 0" class="no-lyric">暂无歌词</p>
            <template v-else>
              <p
                v-for="(line, i) in parsedLyrics"
                :key="i"
                :data-index="i"
                class="lrc-line"
                :class="{ active: i === currentLineIndex, dim: i < currentLineIndex && currentLineIndex - i > 2 }"
              >{{ line.text }}</p>
            </template>
          </div>
        </div>
      </div>

      <audio
        ref="audioRef"
        @timeupdate="onTimeUpdate"
        @loadedmetadata="onLoaded"
        @play="isPlaying = true"
        @pause="isPlaying = false"
        @ended="onEnded"
        style="display:none"
      />
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { VideoPlay, VideoPause, Headset } from '@element-plus/icons-vue'
import http from '@/api'

const route = useRoute()
const trackId = computed(() => Number(route.params.id))

const loading = ref(true)
const error = ref('')
const track = ref(null)
const audioRef = ref(null)
const lyricsRef = ref(null)
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const volume = ref(1)

const progressPercent = computed({
  get: () => duration.value ? (currentTime.value / duration.value) * 100 : 0,
  set: () => {}
})

const parsedLyrics = computed(() => parseLrc(track.value?.lyric || ''))
const currentLineIndex = ref(-1)

function parseLrc(text) {
  const lines = []
  const regex = /\[(\d{2}):(\d{2})(?:[\.:](\d{2,3}))?\](.*)/
  const raw = (text || '').split('\n')
  for (const line of raw) {
    const m = line.match(regex)
    if (!m) continue
    const mins = parseInt(m[1], 10)
    const secs = parseInt(m[2], 10)
    const centis = m[3] ? parseInt(m[3].padEnd(3, '0'), 10) : 0
    const time = mins * 60 + secs + centis / 1000
    const txt = (m[4] || '').trim()
    if (txt) lines.push({ time, text: txt })
  }
  lines.sort((a, b) => a.time - b.time)
  return lines
}

function onTimeUpdate() {
  if (!audioRef.value) return
  currentTime.value = audioRef.value.currentTime
  const ct = audioRef.value.currentTime
  const parsed = parsedLyrics.value
  let idx = -1
  for (let i = 0; i < parsed.length; i++) {
    if (parsed[i].time <= ct) idx = i
    else break
  }
  if (idx !== currentLineIndex.value) {
    currentLineIndex.value = idx
  }
}

watch(currentLineIndex, (idx) => {
  if (idx < 0 || !lyricsRef.value) return
  const el = lyricsRef.value.querySelector(`[data-index="${idx}"]`)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
})

function onLoaded() {
  if (audioRef.value) duration.value = audioRef.value.duration || 0
}

function onEnded() {
  isPlaying.value = false
  currentTime.value = 0
  currentLineIndex.value = -1
}

async function fetchDetail() {
  loading.value = true
  error.value = ''
  try {
    const res = await http.get('/track/detail', { params: { id: trackId.value } })
    if (res.status === 200 && res.data) {
      track.value = res.data
      if (track.value?.play_path) {
        setTimeout(() => {
          if (audioRef.value) {
            audioRef.value.src = track.value.play_path
            audioRef.value.play().catch(() => {})
          }
        }, 100)
      }
    } else {
      error.value = '获取曲目信息失败'
    }
  } catch (e) {
    error.value = e?.response?.data?.msg || e?.msg || '请求失败'
  } finally {
    loading.value = false
  }
}

function togglePlayPause() {
  if (!audioRef.value) return
  if (isPlaying.value) {
    audioRef.value.pause()
  } else {
    audioRef.value.play().catch(() => { error.value = '播放失败' })
  }
}

function seek(val) {
  if (audioRef.value && duration.value) {
    audioRef.value.currentTime = (val / 100) * duration.value
  }
}

function setVolume(val) {
  if (audioRef.value) audioRef.value.volume = val
}

function formatTime(secs) {
  const s = Math.floor(secs || 0)
  const m = Math.floor(s / 60)
  const ss = String(s % 60).padStart(2, '0')
  return `${m}:${ss}`
}

function goBack() {
  if (window.opener) {
    window.close()
  } else {
    window.location.hash = '#/track'
  }
}

onMounted(fetchDetail)

onUnmounted(() => {
  if (audioRef.value) {
    audioRef.value.pause()
    audioRef.value.src = ''
  }
})
</script>

<style scoped>
.play-page {
  width: 100vw;
  height: 100vh;
  background: #0f0f0f;
  color: #e0e0e0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.error-state {
  text-align: center;
  padding: 120px 20px;
  font-size: 16px;
  color: #999;
}

.header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  border-bottom: 1px solid #222;
  flex-shrink: 0;
}

.header-bar .el-button {
  color: #999;
}
.header-bar .el-button:hover {
  color: #fff;
}

.page-title {
  font-size: 16px;
  font-weight: 600;
  color: #ddd;
}

.body-area {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* ── Left: Player ── */
.player-section {
  width: 480px;
  min-width: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  gap: 20px;
  border-right: 1px solid #222;
}

.cover-wrapper {
  position: relative;
  width: 260px;
  height: 260px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: spin 20s linear infinite;
}
.cover-wrapper.paused {
  animation-play-state: paused;
}

.vinyl-bg {
  position: absolute;
  inset: -8px;
  border-radius: 50%;
  background: conic-gradient(from 0deg, #1a1a1a 0deg, #2a2a2a 45deg, #111 90deg, #2a2a2a 135deg, #1a1a1a 180deg, #2a2a2a 225deg, #111 270deg, #2a2a2a 315deg, #1a1a1a 360deg);
  z-index: 0;
}

.cover-img {
  position: relative;
  z-index: 1;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid #333;
}

.cover-placeholder {
  position: relative;
  z-index: 1;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: #1a1a1a;
  border: 4px solid #333;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #555;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

.track-meta {
  text-align: center;
}
.track-meta h2 {
  margin: 0;
  font-size: 20px;
  color: #eee;
}
.track-meta p {
  margin: 4px 0 0;
  color: #bbb;
  font-size: 14px;
}

.controls {
  width: 100%;
  max-width: 360px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.play-btn {
  width: 48px;
  height: 48px;
  background: #1db954;
  border-color: #1db954;
  color: #fff;
}
.play-btn:hover {
  background: #1ed760;
  border-color: #1ed760;
}

.progress-row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.time {
  font-size: 12px;
  color: #888;
  width: 36px;
  text-align: center;
  flex-shrink: 0;
}

.progress-slider {
  flex: 1;
}

.volume-row {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 140px;
  color: #888;
  font-size: 14px;
}

.volume-slider {
  flex: 1;
}

/* ── Right: Lyrics ── */
.lyrics-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 16px 24px;
  min-width: 0;
}

.lyrics-scroll {
  flex: 1;
  overflow-y: auto;
  scroll-behavior: smooth;
}

.lrc-line {
  padding: 6px 0;
  font-size: 15px;
  color: #666;
  transition: color 0.3s;
  line-height: 1.8;
  cursor: default;
}
.lrc-line.active {
  color: #1db954;
  font-weight: 600;
  font-size: 17px;
}
.lrc-line.dim {
  color: #444;
}

.no-lyric {
  text-align: center;
  color: #555;
  margin-top: 60px;
}

.lyrics-scroll::-webkit-scrollbar {
  width: 4px;
}
.lyrics-scroll::-webkit-scrollbar-thumb {
  background: #333;
  border-radius: 2px;
}
</style>
