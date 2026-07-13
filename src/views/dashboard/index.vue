<template>
  <div>
    <h2>欢迎使用 imusic 管理后台</h2>
    <el-row :gutter="20" style="margin-top:20px">
      <el-col :span="8">
        <el-card shadow="hover">
          <el-statistic title="曲目总数" :value="stats.tracks" />
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <el-statistic title="专辑总数" :value="stats.albums" />
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <el-statistic title="用户总数" :value="stats.users" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { reactive } from 'vue'

const stats = reactive({
  tracks: 0,
  albums: 0,
  users: 0
})
</script>
