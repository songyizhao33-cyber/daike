<template>
  <div class="match-container">
    <el-container>
      <el-header>
        <div class="header-content">
          <h1>寻找代课者</h1>
          <el-button @click="$router.push('/home')">返回首页</el-button>
        </div>
      </el-header>
      <el-main>
        <el-card>
          <template #header>
            <span>发布代课需求（选择需要代课的时间）</span>
          </template>
          <ScheduleSelector v-model="selectedSlots" />

          <el-form :model="form" label-width="100px" style="margin-top: 20px">
            <el-form-item label="校区" required>
              <el-select v-model="form.campus" placeholder="请选择校区" style="width: 100%">
                <el-option label="邯郸" value="邯郸" />
                <el-option label="枫林" value="枫林" />
                <el-option label="江湾" value="江湾" />
                <el-option label="张江" value="张江" />
              </el-select>
            </el-form-item>
            <el-form-item label="频率" required>
              <el-radio-group v-model="form.frequencyType">
                <el-radio label="long-term">长期</el-radio>
                <el-radio label="short-term">短期</el-radio>
                <el-radio label="single">单次</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="课程名称">
              <el-input v-model="form.courseInfo.courseName" />
            </el-form-item>
            <el-form-item label="上课地点">
              <el-input v-model="form.courseInfo.location" />
            </el-form-item>
            <el-form-item label="课程描述">
              <el-input v-model="form.courseInfo.description" type="textarea" :rows="3" />
            </el-form-item>
            <el-divider>筛选条件（可选）</el-divider>
            <el-form-item label="性别">
              <el-select v-model="form.filters.gender" clearable placeholder="不限" style="width: 100%">
                <el-option label="男" value="male" />
                <el-option label="女" value="female" />
              </el-select>
            </el-form-item>
            <el-form-item label="专业">
              <el-input v-model="form.filters.major" placeholder="不限" />
            </el-form-item>
            <el-form-item label="年级">
              <el-input v-model="form.filters.grade" placeholder="不限" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleSearch">搜索代课者</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card v-if="matchResult" style="margin-top: 20px">
          <template #header>
            <span>匹配结果（共 {{ matchResult.matchedCount }} 人）</span>
          </template>
          <el-table :data="matchResult.matchRequest.matchedSubstitutes" style="width: 100%">
            <el-table-column prop="userId.username" label="用户名" width="120" />
            <el-table-column label="性别" width="80">
              <template #default="{ row }">
                {{ row.userId.profile.gender === 'male' ? '男' : row.userId.profile.gender === 'female' ? '女' : '其他' }}
              </template>
            </el-table-column>
            <el-table-column prop="userId.profile.major" label="专业" />
            <el-table-column prop="userId.profile.grade" label="年级" width="100" />
            <el-table-column prop="userId.profile.wechat" label="微信号" width="150" />
            <el-table-column prop="userId.profile.email" label="邮箱" width="180" />
            <el-table-column label="匹配度" width="100">
              <template #default="{ row }">
                <el-tag type="success">{{ row.matchScore }}%</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button type="primary" size="small" @click="handleSelect(row.userId._id)">选择</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <el-card style="margin-top: 20px">
          <template #header>
            <div class="card-header">
              <span>我的代课请求</span>
              <el-button type="primary" @click="loadMyRequests">刷新</el-button>
            </div>
          </template>
          <el-table :data="myRequests" style="width: 100%">
            <el-table-column label="星期" width="100">
              <template #default="{ row }">
                {{ getDayText(row.dayOfWeek) }}
              </template>
            </el-table-column>
            <el-table-column label="节次" width="150">
              <template #default="{ row }">
                第 {{ row.periods.join(', ') }} 节
              </template>
            </el-table-column>
            <el-table-column label="时间范围" width="150">
              <template #default="{ row }">
                {{ getTimeRange(row.periods) }}
              </template>
            </el-table-column>
            <el-table-column prop="courseInfo.courseName" label="课程" width="150" />
            <el-table-column prop="campus" label="校区" width="100" />
            <el-table-column label="频率" width="100">
              <template #default="{ row }">
                {{ getFrequencyText(row.frequencyType) }}
              </template>
            </el-table-column>
            <el-table-column label="匹配人数" width="100">
              <template #default="{ row }">
                {{ row.matchedSubstitutes.length }}
              </template>
            </el-table-column>
            <el-table-column label="已选代课者" width="120">
              <template #default="{ row }">
                {{ row.selectedSubstitute?.username || '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)">
                  {{ getStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import api from '@/utils/request'
import ScheduleSelector from '@/components/ScheduleSelector.vue'
import { SCHEDULE_CONFIG, getPeriodsTimeRange } from '@/utils/schedule'

const selectedSlots = ref([])

const form = ref({
  campus: '',
  frequencyType: 'long-term',
  courseInfo: {
    courseName: '',
    location: '',
    description: ''
  },
  filters: {
    gender: '',
    major: '',
    grade: ''
  }
})

const matchResult = ref(null)
const myRequests = ref([])
const currentRequestId = ref(null)

const getDayText = (day) => {
  const dayConfig = SCHEDULE_CONFIG.weekDays.find(d => d.value === day)
  return dayConfig ? dayConfig.label : ''
}

const getTimeRange = (periods) => {
  return getPeriodsTimeRange(periods)
}

const handleSearch = async () => {
  if (selectedSlots.value.length === 0) {
    ElMessage.warning('请先选择需要代课的时间')
    return
  }

  if (!form.value.campus) {
    ElMessage.warning('请选择校区')
    return
  }

  if (!form.value.frequencyType) {
    ElMessage.warning('请选择频率类型')
    return
  }

  // 按星期分组
  const groupedByDay = {}
  selectedSlots.value.forEach(slot => {
    if (!groupedByDay[slot.day]) {
      groupedByDay[slot.day] = []
    }
    if (!groupedByDay[slot.day].includes(slot.period)) {
      groupedByDay[slot.day].push(slot.period)
    }
  })

  try {
    // 为每个星期创建一个匹配请求
    const requests = []
    for (const [day, periods] of Object.entries(groupedByDay)) {
      const data = await api.post('/match', {
        dayOfWeek: parseInt(day),
        periods: periods.sort((a, b) => a - b),
        courseInfo: form.value.courseInfo,
        campus: form.value.campus,
        frequencyType: form.value.frequencyType,
        filters: form.value.filters
      })
      requests.push(data)
    }

    // 显示第一个请求的结果
    if (requests.length > 0) {
      matchResult.value = requests[0]
      currentRequestId.value = requests[0].matchRequest._id
      ElMessage.success(`找到 ${requests[0].matchedCount} 位可用的代课者`)
    }

    loadMyRequests()
  } catch (error) {
    console.error(error)
  }
}

const handleSelect = async (substituteId) => {
  try {
    await api.put(`/match/${currentRequestId.value}/select`, { substituteId })
    ElMessage.success('选择成功，请通过微信或邮箱联系代课者')
    loadMyRequests()
    matchResult.value = null
  } catch (error) {
    console.error(error)
  }
}

const loadMyRequests = async () => {
  try {
    const data = await api.get('/match/my-requests')
    myRequests.value = data
  } catch (error) {
    console.error(error)
  }
}

const getStatusType = (status) => {
  const types = {
    pending: 'warning',
    matched: 'success',
    completed: 'info',
    cancelled: 'danger'
  }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = {
    pending: '待匹配',
    matched: '已匹配',
    completed: '已完成',
    cancelled: '已取消'
  }
  return texts[status] || status
}

const getFrequencyText = (type) => {
  const map = {
    'long-term': '长期',
    'short-term': '短期',
    'single': '单次'
  }
  return map[type] || type
}

onMounted(() => {
  loadMyRequests()
})
</script>

<style scoped>
.match-container {
  min-height: 100vh;
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

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

@media (max-width: 768px) {
  .header-content h1 {
    font-size: 18px;
  }

  .el-form-item__label {
    width: 80px !important;
  }

  .el-table {
    font-size: 12px;
  }

  .el-button {
    padding: 8px 12px;
    font-size: 12px;
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}
</style>