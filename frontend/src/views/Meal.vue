<template>
  <div class="meal-container">
    <el-container>
      <el-header>
        <div class="header-content">
          <h1>约饭功能</h1>
          <el-button @click="$router.push('/home')">返回首页</el-button>
        </div>
      </el-header>
      <el-main>
        <!-- 发布约饭 -->
        <el-card>
          <template #header>
            <span>发布约饭</span>
          </template>
          <el-form :model="form" label-width="100px">
            <el-form-item label="日期" required>
              <el-date-picker
                v-model="form.date"
                type="date"
                placeholder="选择日期"
                style="width: 100%"
                :disabled-date="disabledDate"
              />
            </el-form-item>
            <el-form-item label="用餐类型" required>
              <el-radio-group v-model="form.mealType">
                <el-radio label="breakfast">早餐</el-radio>
                <el-radio label="lunch">午餐</el-radio>
                <el-radio label="dinner">晚餐</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="时间" required>
              <el-select v-model="form.mealTime" placeholder="选择时间" style="width: 100%">
                <el-option
                  v-for="time in getAvailableTimes()"
                  :key="time"
                  :label="time"
                  :value="time"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="校区" required>
              <el-select v-model="form.campus" placeholder="选择校区" style="width: 100%">
                <el-option label="邯郸" value="邯郸" />
                <el-option label="枫林" value="枫林" />
                <el-option label="江湾" value="江湾" />
                <el-option label="张江" value="张江" />
              </el-select>
            </el-form-item>
            <el-form-item label="地点" required>
              <el-input v-model="form.location" placeholder="例如：食堂一楼" />
            </el-form-item>
            <el-form-item label="备注">
              <el-input v-model="form.note" type="textarea" :rows="3" placeholder="可以写一些额外信息" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handlePublish">发布约饭</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 浏览约饭 -->
        <el-card style="margin-top: 20px">
          <template #header>
            <div class="card-header">
              <span>浏览约饭信息</span>
              <div>
                <el-date-picker
                  v-model="filterDate"
                  type="date"
                  placeholder="筛选日期"
                  size="small"
                  style="margin-right: 10px"
                  @change="loadAppointments"
                />
                <el-select
                  v-model="filterCampus"
                  placeholder="筛选校区"
                  size="small"
                  clearable
                  style="width: 120px; margin-right: 10px"
                  @change="loadAppointments"
                >
                  <el-option label="邯郸" value="邯郸" />
                  <el-option label="枫林" value="枫林" />
                  <el-option label="江湾" value="江湾" />
                  <el-option label="张江" value="张江" />
                </el-select>
                <el-button type="primary" size="small" @click="loadAppointments">刷新</el-button>
              </div>
            </div>
          </template>
          <el-table :data="appointments" style="width: 100%">
            <el-table-column label="日期" width="120">
              <template #default="{ row }">
                <div :class="{ 'expired-text': isExpired(row.date) }">
                  {{ formatDate(row.date) }}
                  <el-tag v-if="isExpired(row.date)" type="info" size="small" style="margin-left: 5px">已过期</el-tag>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="类型" width="80">
              <template #default="{ row }">
                {{ getMealTypeText(row.mealType) }}
              </template>
            </el-table-column>
            <el-table-column prop="mealTime" label="时间" width="80" />
            <el-table-column prop="campus" label="校区" width="80" />
            <el-table-column prop="location" label="地点" width="150" />
            <el-table-column prop="note" label="备注" />
            <el-table-column label="发布者" width="120">
              <template #default="{ row }">
                {{ row.userId.username }}
              </template>
            </el-table-column>
            <el-table-column label="联系方式" width="180">
              <template #default="{ row }">
                <div>微信: {{ row.userId.profile.wechat || '-' }}</div>
                <div>邮箱: {{ row.userId.profile.email || '-' }}</div>
              </template>
            </el-table-column>
            <el-table-column label="感兴趣" width="100">
              <template #default="{ row }">
                <el-tag v-if="row.interestedUsers && row.interestedUsers.length > 0" type="success">
                  {{ row.interestedUsers.length }} 人
                </el-tag>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120">
              <template #default="{ row }">
                <el-button
                  v-if="!isMyAppointment(row) && !hasExpressedInterest(row)"
                  type="primary"
                  size="small"
                  @click="handleExpressInterest(row._id)"
                >
                  约一个
                </el-button>
                <el-button
                  v-else-if="!isMyAppointment(row) && hasExpressedInterest(row)"
                  type="info"
                  size="small"
                  @click="handleCancelInterest(row._id)"
                >
                  取消兴趣
                </el-button>
                <el-tag v-else type="info" size="small">我的约饭</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <!-- 我的约饭 -->
        <el-card style="margin-top: 20px">
          <template #header>
            <div class="card-header">
              <span>我的约饭</span>
              <el-button type="primary" size="small" @click="loadMyAppointments">刷新</el-button>
            </div>
          </template>
          <el-table :data="myAppointments" style="width: 100%">
            <el-table-column label="日期" width="120">
              <template #default="{ row }">
                {{ formatDate(row.date) }}
              </template>
            </el-table-column>
            <el-table-column label="类型" width="80">
              <template #default="{ row }">
                {{ getMealTypeText(row.mealType) }}
              </template>
            </el-table-column>
            <el-table-column prop="mealTime" label="时间" width="80" />
            <el-table-column prop="campus" label="校区" width="80" />
            <el-table-column prop="location" label="地点" width="150" />
            <el-table-column prop="note" label="备注" />
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === 'active' ? 'success' : 'info'">
                  {{ row.status === 'active' ? '有效' : '已取消' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="感兴趣的人" width="120">
              <template #default="{ row }">
                <el-button
                  v-if="row.interestedUsers && row.interestedUsers.length > 0"
                  type="success"
                  size="small"
                  @click="showInterestedUsers(row)"
                >
                  {{ row.interestedUsers.length }} 人
                </el-button>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150">
              <template #default="{ row }">
                <el-button
                  v-if="row.status === 'active'"
                  type="warning"
                  size="small"
                  @click="handleCancel(row._id)"
                >
                  取消
                </el-button>
                <el-button
                  type="danger"
                  size="small"
                  @click="handleDelete(row._id)"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-main>
    </el-container>

    <!-- 感兴趣用户对话框 -->
    <el-dialog
      v-model="interestedDialogVisible"
      title="感兴趣的用户"
      width="600px"
    >
      <el-table :data="currentInterestedUsers" style="width: 100%">
        <el-table-column prop="userId.username" label="用户名" width="120" />
        <el-table-column label="性别" width="80">
          <template #default="{ row }">
            {{ row.userId.profile.gender === 'male' ? '男' : row.userId.profile.gender === 'female' ? '女' : '其他' }}
          </template>
        </el-table-column>
        <el-table-column prop="userId.profile.major" label="专业" />
        <el-table-column prop="userId.profile.grade" label="年级" width="100" />
        <el-table-column label="联系方式" width="180">
          <template #default="{ row }">
            <div>微信: {{ row.userId.profile.wechat || '-' }}</div>
            <div>邮箱: {{ row.userId.profile.email || '-' }}</div>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '@/utils/request'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const form = ref({
  date: null,
  mealType: 'lunch',
  mealTime: '',
  campus: '',
  location: '',
  note: ''
})

const appointments = ref([])
const myAppointments = ref([])
const filterDate = ref(null)
const filterCampus = ref('')
const interestedDialogVisible = ref(false)
const currentInterestedUsers = ref([])

const mealTimes = {
  breakfast: ['07:00', '07:30', '08:00'],
  lunch: ['11:00', '11:30', '12:00', '12:30'],
  dinner: ['17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00']
}

const disabledDate = (time) => {
  return time.getTime() < Date.now() - 24 * 60 * 60 * 1000
}

const getAvailableTimes = () => {
  return mealTimes[form.value.mealType] || []
}

const getMealTypeText = (type) => {
  const map = {
    breakfast: '早餐',
    lunch: '午餐',
    dinner: '晚餐'
  }
  return map[type] || type
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('zh-CN')
}

const isExpired = (date) => {
  return new Date(date) < new Date()
}

const handlePublish = async () => {
  if (!form.value.date) {
    ElMessage.warning('请选择日期')
    return
  }
  if (!form.value.mealTime) {
    ElMessage.warning('请选择时间')
    return
  }
  if (!form.value.campus) {
    ElMessage.warning('请选择校区')
    return
  }
  if (!form.value.location) {
    ElMessage.warning('请输入地点')
    return
  }

  try {
    await api.post('/meal', form.value)
    ElMessage.success('发布成功')
    form.value = {
      date: null,
      mealType: 'lunch',
      mealTime: '',
      campus: '',
      location: '',
      note: ''
    }
    loadAppointments()
    loadMyAppointments()
  } catch (error) {
    console.error(error)
  }
}

const loadAppointments = async () => {
  try {
    const params = {}
    if (filterDate.value) {
      params.date = filterDate.value.toISOString().split('T')[0]
    }
    if (filterCampus.value) {
      params.campus = filterCampus.value
    }

    const data = await api.get('/meal/browse', { params })
    appointments.value = data
  } catch (error) {
    console.error(error)
  }
}

const loadMyAppointments = async () => {
  try {
    const data = await api.get('/meal/my')
    // 确保每个约饭都有 interestedUsers 数组
    myAppointments.value = data.map(item => ({
      ...item,
      interestedUsers: item.interestedUsers || []
    }))
  } catch (error) {
    console.error(error)
  }
}

const handleCancel = async (id) => {
  try {
    await api.put(`/meal/${id}/cancel`)
    ElMessage.success('取消成功')
    loadMyAppointments()
    loadAppointments()
  } catch (error) {
    console.error(error)
  }
}

const handleDelete = async (id) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这条约饭信息吗？删除后无法恢复。',
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await api.delete(`/meal/${id}`)
    ElMessage.success('删除成功')
    loadMyAppointments()
    loadAppointments()
  } catch (error) {
    if (error !== 'cancel') {
      console.error(error)
    }
  }
}

// 判断是否是我的约饭
const isMyAppointment = (appointment) => {
  return appointment.userId._id === userStore.user?.id
}

// 判断是否已表达兴趣
const hasExpressedInterest = (appointment) => {
  if (!appointment.interestedUsers) return false
  return appointment.interestedUsers.some(
    item => item.userId._id === userStore.user?.id
  )
}

// 表达兴趣
const handleExpressInterest = async (id) => {
  try {
    await api.post(`/meal/${id}/interest`)
    ElMessage.success('已表达兴趣')
    loadAppointments()
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '操作失败')
  }
}

// 取消兴趣
const handleCancelInterest = async (id) => {
  try {
    await api.delete(`/meal/${id}/interest`)
    ElMessage.success('已取消兴趣')
    loadAppointments()
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '操作失败')
  }
}

// 显示感兴趣的用户
const showInterestedUsers = (appointment) => {
  currentInterestedUsers.value = appointment.interestedUsers || []
  interestedDialogVisible.value = true
}

onMounted(() => {
  loadAppointments()
  loadMyAppointments()
})
</script>

<style scoped>
.meal-container {
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

.expired-text {
  color: #909399;
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
