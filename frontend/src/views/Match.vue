<template>
  <div class="match-container">
    <el-container>
      <el-header>
        <div class="header-content">
          <h1>寻找代课人</h1>
          <el-button @click="$router.push('/home')">返回首页</el-button>
        </div>
      </el-header>
      <el-main>
        <el-card>
          <template #header>
            <span>发布代课需求</span>
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
            <el-form-item label="课程说明">
              <el-input v-model="form.courseInfo.description" type="textarea" :rows="3" />
            </el-form-item>

            <el-divider>筛选条件</el-divider>

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
              <el-button type="primary" @click="handleSearch">搜索空闲者</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card v-if="matchResult" style="margin-top: 20px">
          <template #header>
            <span>匹配结果（共 {{ matchResult.matchedCount }} 人）</span>
          </template>
          <el-table :data="matchResult.matchRequest.matchedSubstitutes" style="width: 100%">
            <el-table-column prop="userId.username" label="用户" width="120" />
            <el-table-column label="性别" width="80">
              <template #default="{ row }">
                {{ getGenderText(row.userId.profile.gender) }}
              </template>
            </el-table-column>
            <el-table-column prop="userId.profile.major" label="专业" min-width="140" />
            <el-table-column prop="userId.profile.grade" label="年级" width="120" />
            <el-table-column label="匹配度" width="100" align="center">
              <template #default="{ row }">
                <el-tag type="success">{{ row.matchScore }}%</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120" align="center" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" size="small" @click="handleSelect(row.userId._id)">联系对方</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-alert
            title="选择后系统会立即弹出双方资料与联系方式，并给对方发送通知。"
            type="info"
            :closable="false"
            style="margin-top: 16px"
          />
        </el-card>

        <el-card style="margin-top: 20px">
          <template #header>
            <div class="card-header">
              <span>我的代课需求</span>
              <el-button type="primary" @click="loadMyRequests">刷新</el-button>
            </div>
          </template>
          <el-table :data="myRequests" style="width: 100%">
            <el-table-column label="星期" width="90">
              <template #default="{ row }">
                {{ getDayText(row.dayOfWeek) }}
              </template>
            </el-table-column>
            <el-table-column label="节次" width="140">
              <template #default="{ row }">
                第 {{ row.periods.join(', ') }} 节
              </template>
            </el-table-column>
            <el-table-column label="时间范围" width="160">
              <template #default="{ row }">
                {{ getTimeRange(row.periods) }}
              </template>
            </el-table-column>
            <el-table-column prop="courseInfo.courseName" label="课程" min-width="140" />
            <el-table-column prop="campus" label="校区" width="90" />
            <el-table-column label="匹配人数" width="100">
              <template #default="{ row }">
                {{ row.matchedSubstitutes.length }}
              </template>
            </el-table-column>
            <el-table-column label="已选空闲者" min-width="180">
              <template #default="{ row }">
                <span v-if="row.selectedSubstitute">
                  {{ row.selectedSubstitute.username }}
                  <span class="subtext">
                    微信 {{ row.selectedSubstitute.profile?.wechat || '-' }} / 邮箱 {{ row.selectedSubstitute.profile?.email || '-' }}
                  </span>
                </span>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)">
                  {{ getStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="160">
              <template #default="{ row }">
                <el-button
                  v-if="row.selectedSubstitute"
                  type="success"
                  size="small"
                  @click="showContactDialog(row.selectedSubstitute, row)"
                >
                  查看联系方式
                </el-button>
                <el-button type="danger" size="small" @click="handleDeleteRequest(row._id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-main>
    </el-container>

    <el-dialog v-model="contactDialogVisible" title="双方联系信息" width="680px">
      <div v-if="selectedContactInfo" class="contact-dialog">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="对方用户名">{{ selectedContactInfo.username }}</el-descriptions-item>
          <el-descriptions-item label="性别">{{ getGenderText(selectedContactInfo.profile?.gender) }}</el-descriptions-item>
          <el-descriptions-item label="专业">{{ selectedContactInfo.profile?.major || '-' }}</el-descriptions-item>
          <el-descriptions-item label="年级">{{ selectedContactInfo.profile?.grade || '-' }}</el-descriptions-item>
          <el-descriptions-item label="电话">{{ selectedContactInfo.profile?.phone || '-' }}</el-descriptions-item>
          <el-descriptions-item label="微信">{{ selectedContactInfo.profile?.wechat || '-' }}</el-descriptions-item>
          <el-descriptions-item label="邮箱">{{ selectedContactInfo.profile?.email || '-' }}</el-descriptions-item>
          <el-descriptions-item label="课程信息" :span="2">
            {{ selectedContextText }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '@/utils/request'
import ScheduleSelector from '@/components/ScheduleSelector.vue'
import { SCHEDULE_CONFIG, getPeriodsTimeRange } from '@/utils/schedule'

const selectedSlots = ref([])
const matchResult = ref(null)
const myRequests = ref([])
const currentRequestId = ref('')
const contactDialogVisible = ref(false)
const selectedContactInfo = ref(null)
const selectedRequestContext = ref(null)

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

const selectedContextText = computed(() => {
  const request = selectedRequestContext.value
  if (!request) return '-'
  const course = request.courseInfo?.courseName || '未填写课程'
  return `${getDayText(request.dayOfWeek)} 第 ${request.periods?.join(', ') || '-'} 节，${course}，${request.campus || '-'}`
})

const getGenderText = (gender) => {
  const map = { male: '男', female: '女', other: '其他' }
  return map[gender] || '-'
}

const getDayText = (day) => {
  const dayConfig = SCHEDULE_CONFIG.weekDays.find(item => item.value === day)
  return dayConfig ? dayConfig.label : ''
}

const getTimeRange = (periods) => getPeriodsTimeRange(periods)

const resetForm = () => {
  selectedSlots.value = []
  form.value = {
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
  }
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

  const groupedByDay = {}
  selectedSlots.value.forEach(slot => {
    if (!groupedByDay[slot.day]) groupedByDay[slot.day] = []
    if (!groupedByDay[slot.day].includes(slot.period)) groupedByDay[slot.day].push(slot.period)
  })

  try {
    const requests = []
    for (const [day, periods] of Object.entries(groupedByDay)) {
      const data = await api.post('/match', {
        dayOfWeek: Number(day),
        periods: periods.sort((a, b) => a - b),
        courseInfo: form.value.courseInfo,
        campus: form.value.campus,
        frequencyType: form.value.frequencyType,
        filters: form.value.filters
      })
      requests.push(data)
    }

    if (requests.length > 0) {
      matchResult.value = requests[0]
      currentRequestId.value = requests[0].matchRequest._id
      ElMessage.success(`已找到 ${requests[0].matchedCount} 位可联系的空闲者`)
    }

    resetForm()
    loadMyRequests()
  } catch (error) {
    console.error(error)
  }
}

const handleSelect = async (substituteId) => {
  try {
    const data = await api.put(`/match/${currentRequestId.value}/select`, { substituteId })
    selectedContactInfo.value = data.substitute
    selectedRequestContext.value = data.matchRequest
    contactDialogVisible.value = true
    matchResult.value = null
    ElMessage.success('双方信息已开放，请尽快联系')
    loadMyRequests()
  } catch (error) {
    console.error(error)
  }
}

const showContactDialog = (substitute, row) => {
  selectedContactInfo.value = substitute
  selectedRequestContext.value = row
  contactDialogVisible.value = true
}

const loadMyRequests = async () => {
  try {
    myRequests.value = await api.get('/match/my-requests')
  } catch (error) {
    console.error(error)
  }
}

const handleDeleteRequest = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除这条代课需求吗？', '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await api.delete(`/match/${id}`)
    ElMessage.success('删除成功')
    loadMyRequests()
  } catch (error) {
    if (error !== 'cancel') {
      console.error(error)
    }
  }
}

const getStatusType = (status) => {
  const map = { pending: 'warning', matched: 'success', completed: 'info', cancelled: 'danger' }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  const map = { pending: '待匹配', matched: '已匹配', completed: '已完成', cancelled: '已取消' }
  return map[status] || status
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

.subtext {
  display: block;
  color: #909399;
  font-size: 12px;
  margin-top: 4px;
}

.contact-dialog {
  padding-top: 8px;
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
