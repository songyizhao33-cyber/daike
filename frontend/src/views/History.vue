<template>
  <div class="history-container">
    <el-container>
      <el-header>
        <div class="header-content">
          <h1>信息记录表</h1>
          <el-button @click="$router.push('/home')">返回首页</el-button>
        </div>
      </el-header>
      <el-main>
        <el-card class="history-card">
          <template #header>
            <div class="card-header">
              <span>我的平台记录</span>
              <el-button type="primary" size="small" @click="loadHistory">刷新</el-button>
            </div>
          </template>

          <el-table :data="historyRows" style="width: 100%">
            <el-table-column prop="recordType" label="记录类型" width="140" />
            <el-table-column prop="myRole" label="我的身份" width="120" />
            <el-table-column prop="summary" label="关键信息" min-width="220" />
            <el-table-column label="对方信息" min-width="180">
              <template #default="{ row }">
                <span v-if="row.counterpart">
                  {{ row.counterpart.username }}
                  <span class="subtext">{{ row.counterpart.profile?.major || '-' }} / {{ row.counterpart.profile?.grade || '-' }}</span>
                </span>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column label="联系方式" min-width="200">
              <template #default="{ row }">
                <span v-if="row.counterpart">
                  微信 {{ row.counterpart.profile?.wechat || '-' }} / 邮箱 {{ row.counterpart.profile?.email || '-' }}
                </span>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="120">
              <template #default="{ row }">
                <el-tag :type="row.statusType">{{ row.statusText }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="时间" width="180">
              <template #default="{ row }">
                {{ formatDateTime(row.createdAt) }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useUserStore } from '@/stores/user'
import api from '@/utils/request'

const userStore = useUserStore()
const historyData = ref({
  availabilities: [],
  matchRequests: [],
  mealAppointments: [],
  interactions: []
})

const formatDate = (date) => new Date(date).toLocaleDateString('zh-CN')
const formatDateTime = (date) => new Date(date).toLocaleString('zh-CN')

const historyRows = computed(() => {
  const userId = userStore.user?.id
  const availabilityRows = (historyData.value.availabilities || []).map(item => ({
    id: `availability-${item._id}`,
    recordType: '空闲发布',
    myRole: '发布者',
    summary: `周${item.dayOfWeek} 第 ${item.periods.join(', ')} 节，${item.campuses.join(' / ')}`,
    counterpart: null,
    statusText: item.status === 'available' ? '可用' : item.status === 'booked' ? '已占用' : '已取消',
    statusType: item.status === 'available' ? 'success' : item.status === 'booked' ? 'warning' : 'info',
    createdAt: item.createdAt
  }))

  const matchRows = (historyData.value.matchRequests || []).map(item => ({
    id: `match-${item._id}`,
    recordType: '代课需求',
    myRole: '发布者',
    summary: `${item.courseInfo?.courseName || '未填写课程'}，周${item.dayOfWeek} 第 ${item.periods.join(', ')} 节，${item.campus}`,
    counterpart: item.selectedSubstitute || null,
    statusText: item.status === 'matched' ? '已选空闲者' : item.status === 'pending' ? '待处理' : item.status,
    statusType: item.status === 'matched' ? 'success' : item.status === 'pending' ? 'warning' : 'info',
    createdAt: item.createdAt
  }))

  const mealRows = (historyData.value.mealAppointments || []).map(item => ({
    id: `meal-${item._id}`,
    recordType: '约饭发布',
    myRole: '发布者',
    summary: `${formatDate(item.date)} ${item.mealTime} ${item.location}`,
    counterpart: null,
    statusText: item.status === 'active' ? '进行中' : '已取消',
    statusType: item.status === 'active' ? 'success' : 'info',
    createdAt: item.createdAt
  }))

  const interactionRows = (historyData.value.interactions || []).map(item => {
    const sourceId = item.sourceUserId?._id || item.sourceUserId
    const isSource = String(sourceId) === String(userId)
    const counterpart = isSource ? item.targetSnapshot : item.sourceSnapshot
    const isMatch = item.category === 'match'
    return {
      id: `interaction-${item._id}`,
      recordType: isMatch ? '代课互动' : '约饭互动',
      myRole: isSource ? (isMatch ? '需求方' : '点击者') : (isMatch ? '被选空闲者' : '发布者'),
      summary: isMatch
        ? `${item.context?.courseInfo?.courseName || '未填写课程'}，周${item.context?.dayOfWeek || '-'} 第 ${(item.context?.periods || []).join(', ')} 节`
        : `${formatDate(item.context?.date)} ${item.context?.mealTime || '-'} ${item.context?.location || '-'}`,
      counterpart,
      statusText: item.status === 'active' ? '已开放联系方式' : '已取消',
      statusType: item.status === 'active' ? 'success' : 'info',
      createdAt: item.createdAt
    }
  })

  return [...interactionRows, ...matchRows, ...mealRows, ...availabilityRows]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
})

const loadHistory = async () => {
  historyData.value = await api.get('/history/overview')
}

onMounted(() => {
  loadHistory()
})
</script>

<style scoped>
.history-container {
  min-height: 100vh;
  background-color: #f5f7fa;
}

.el-header {
  background-color: #409eff;
  color: white;
  display: flex;
  align-items: center;
}

.header-content {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-content h1 {
  margin: 0;
  font-size: 24px;
}

.history-card {
  max-width: 1100px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.subtext {
  display: block;
  color: #909399;
  font-size: 12px;
  margin-top: 4px;
}

@media (max-width: 768px) {
  .header-content h1 {
    font-size: 18px;
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}
</style>
