<template>
  <div>
    <el-card>
      <el-tabs v-model="activeGroup" @tab-change="handleTabChange">
        <el-tab-pane label="通用" name="general" />
        <el-tab-pane label="七牛云" name="qiniu" />
      </el-tabs>

      <el-form
        v-if="formItems.length"
        label-width="160px"
        style="max-width: 600px; margin-top: 20px"
        v-loading="loading"
      >
        <el-form-item
          v-for="item in formItems"
          :key="item.key"
          :label="item.label"
        >
          <el-input
            v-if="item.type === 'text'"
            v-model="formData[item.key]"
            :placeholder="'请输入' + item.label"
          />
          <el-input
            v-else-if="item.type === 'password'"
            v-model="formData[item.key]"
            type="password"
            show-password
            :placeholder="'请输入' + item.label"
          />
          <el-input
            v-else
            v-model="formData[item.key]"
            :placeholder="'请输入' + item.label"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getGroup, saveGroup } from '@/api/setting'

const activeGroup = ref('qiniu')
const loading = ref(false)
const saving = ref(false)
const formItems = ref([])
const formData = reactive({})

onMounted(() => {
  fetchGroup(activeGroup.value)
})

function handleTabChange(name) {
  fetchGroup(name)
}

async function fetchGroup(group) {
  loading.value = true
  try {
    const res = await getGroup(group)
    formItems.value = res.data.items || []
    const data = {}
    formItems.value.forEach(item => {
      data[item.key] = item.value
    })
    Object.assign(formData, data)
  } finally {
    loading.value = false
  }
}

async function handleSave() {
  saving.value = true
  try {
    const items = {}
    formItems.value.forEach(item => {
      items[item.key] = formData[item.key] || ''
    })
    await saveGroup(activeGroup.value, items)
    ElMessage.success('保存成功')
    await fetchGroup(activeGroup.value)
  } finally {
    saving.value = false
  }
}
</script>
