<template>
  <div id="app">
    <router-view />

    <el-dialog
      v-model="notificationDialogVisible"
      title="互动通知"
      width="720px"
      @closed="markDialogNotificationsRead"
    >
      <el-empty v-if="dialogNotifications.length === 0" description="暂无新的互动通知" />
      <el-table v-else :data="dialogNotifications" style="width: 100%">
        <el-table-column prop="title" label="通知" min-width="180" />
        <el-table-column label="对方信息" min-width="220">
          <template #default="{ row }">
            <div>{{ getCounterpart(row)?.username || row.fromUserId?.username || '-' }}</div>
            <div>微信: {{ getCounterpart(row)?.profile?.wechat || row.fromUserId?.profile?.wechat || '-' }}</div>
            <div>邮箱: {{ getCounterpart(row)?.profile?.email || row.fromUserId?.profile?.email || '-' }}</div>
          </template>
        </el-table-column>
        <el-table-column label="内容" min-width="220">
          <template #default="{ row }">
            <div>{{ row.content }}</div>
            <div class="notify-context">{{ getContextText(row.payload) }}</div>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/utils/request'

const route = useRoute()
const notificationDialogVisible = ref(false)
const dialogNotifications = ref([])

const getCounterpart = (notification) => {
  const payload = notification.payload || {}
  const ownerId = String(notification.userId || '')
  if (payload.requester && payload.substitute) {
    return ownerId === String(payload.requester.userId || '') ? payload.substitute : payload.requester
  }
  if (payload.publisher && payload.interestedUser) {
    return ownerId === String(payload.publisher.userId || '') ? payload.interestedUser : payload.publisher
  }
  return null
}

const getContextText = (payload = {}) => {
  const context = payload.context || {}
  if (payload.category === 'match') {
    const course = context.courseInfo?.courseName || '未填写课程'
    const periods = Array.isArray(context.periods) ? context.periods.join(', ') : '-'
    return `课程：${course}，校区：${context.campus || '-'}，节次：${periods}`
  }
  if (payload.category === 'meal') {
    return `约饭：${context.mealTime || '-'} ${context.location || '-'} ${context.campus || '-'}`
  }
  return ''
}

const loadNotifications = async () => {
  if (!localStorage.getItem('token')) return
  if (['/login', '/register'].includes(route.path)) return

  try {
    const data = await api.get('/notification')
    const unreadInteractive = (data.notifications || []).filter(item => !item.isRead && item.payload?.category)
    dialogNotifications.value = unreadInteractive
    notificationDialogVisible.value = unreadInteractive.length > 0
  } catch (error) {
    console.error(error)
  }
}

const markDialogNotificationsRead = async () => {
  const targets = dialogNotifications.value.filter(item => !item.isRead)
  if (targets.length === 0) return

  try {
    await Promise.all(targets.map(item => api.put(`/notification/${item._id}/read`)))
    dialogNotifications.value = []
  } catch (error) {
    console.error(error)
  }
}

watch(() => route.fullPath, () => {
  loadNotifications()
})

onMounted(() => {
  loadNotifications()
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  font-family: 'Microsoft YaHei', Arial, sans-serif;
  min-height: 100vh;
  background-color: #f5f7fa;
}

.notify-context {
  color: #909399;
  font-size: 12px;
  margin-top: 4px;
}

@media (max-width: 768px) {
  .el-header {
    height: auto !important;
    padding: 10px !important;
  }

  .header-content h1 {
    font-size: 18px !important;
  }

  .el-main {
    padding: 10px !important;
  }

  .el-card {
    margin-bottom: 15px;
  }

  .el-table {
    font-size: 12px;
  }

  .el-form-item__label {
    font-size: 14px;
  }
}
</style>
