<template>
  <div class="admin-container">
    <el-container>
      <el-header>
        <div class="header-content">
          <h1>管理员后台</h1>
          <el-button @click="$router.push('/home')">返回首页</el-button>
        </div>
      </el-header>
      <el-main>
        <el-row :gutter="20" style="margin-bottom: 20px;">
          <el-col :xs="24" :sm="12" :md="6">
            <el-card><div class="stat-card"><div class="stat-value">{{ stats.totalUsers }}</div><div class="stat-label">用户数</div></div></el-card>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6">
            <el-card><div class="stat-card"><div class="stat-value">{{ stats.newUsersLast7Days }}</div><div class="stat-label">7 天新增</div></div></el-card>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6">
            <el-card><div class="stat-card"><div class="stat-value">{{ stats.totalMatchRequests }}</div><div class="stat-label">代课需求</div></div></el-card>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6">
            <el-card><div class="stat-card"><div class="stat-value">{{ stats.totalInteractions || 0 }}</div><div class="stat-label">互动记录</div></div></el-card>
          </el-col>
        </el-row>

        <el-tabs v-model="mainTab" @tab-change="handleMainTabChange">
          <el-tab-pane label="用户管理" name="users" />
          <el-tab-pane label="空闲总表" name="availabilities" />
          <el-tab-pane label="代课需求总表" name="matchRequests" />
          <el-tab-pane label="约饭总表" name="mealAppointments" />
        </el-tabs>

        <el-card v-show="mainTab === 'users'">
          <template #header>
            <div class="card-header">
              <span>用户管理</span>
              <el-input
                v-model="searchQuery"
                placeholder="搜索用户名/邮箱/微信"
                style="width: 240px;"
                @input="handleSearch"
                clearable
              />
            </div>
          </template>

          <el-table :data="users" v-loading="loading" stripe>
            <el-table-column prop="username" label="用户名" />
            <el-table-column label="角色">
              <template #default="{ row }">{{ getRoleText(row.role) }}</template>
            </el-table-column>
            <el-table-column label="性别">
              <template #default="{ row }">{{ getGenderText(row.profile?.gender) }}</template>
            </el-table-column>
            <el-table-column prop="profile.major" label="专业" />
            <el-table-column label="注册时间">
              <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="200">
              <template #default="{ row }">
                <el-button type="primary" size="small" @click="handleViewUser(row)">查看详情</el-button>
                <el-button type="danger" size="small" :disabled="row.role === 'admin'" @click="handleDeleteUser(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>

          <el-pagination
            v-model:current-page="currentPage"
            :page-size="20"
            :total="total"
            layout="total, prev, pager, next"
            @current-change="loadUsers"
            style="margin-top: 20px; justify-content: center;"
          />
        </el-card>

        <el-card v-show="mainTab === 'availabilities'">
          <template #header>
            <div class="card-header">
              <span>空闲总表</span>
              <div class="filters">
                <el-select v-model="availabilityFilters.dayOfWeek" placeholder="星期" clearable @change="loadAvailabilities" style="width: 120px;">
                  <el-option label="周一" :value="1" />
                  <el-option label="周二" :value="2" />
                  <el-option label="周三" :value="3" />
                  <el-option label="周四" :value="4" />
                  <el-option label="周五" :value="5" />
                  <el-option label="周六" :value="6" />
                </el-select>
                <el-select v-model="availabilityFilters.campus" placeholder="校区" clearable @change="loadAvailabilities" style="width: 120px;">
                  <el-option label="邯郸" value="邯郸" />
                  <el-option label="枫林" value="枫林" />
                  <el-option label="江湾" value="江湾" />
                  <el-option label="张江" value="张江" />
                </el-select>
              </div>
            </div>
          </template>
          <el-table :data="availabilities" v-loading="loadingAvailabilities" stripe>
            <el-table-column label="用户" width="120">
              <template #default="{ row }">{{ row.userId?.username }}</template>
            </el-table-column>
            <el-table-column label="联系方式" min-width="180">
              <template #default="{ row }">
                <div>微信: {{ row.userId?.profile?.wechat || '-' }}</div>
                <div>邮箱: {{ row.userId?.profile?.email || '-' }}</div>
              </template>
            </el-table-column>
            <el-table-column label="星期" width="80">
              <template #default="{ row }">{{ getWeekText(row.dayOfWeek) }}</template>
            </el-table-column>
            <el-table-column label="节次" width="160">
              <template #default="{ row }">{{ row.periods.join(', ') }}</template>
            </el-table-column>
            <el-table-column label="校区" min-width="150">
              <template #default="{ row }">{{ row.campuses.join(', ') }}</template>
            </el-table-column>
            <el-table-column label="频率" width="100">
              <template #default="{ row }">{{ getFrequencyText(row.frequencyType) }}</template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="{ row }">{{ getAvailabilityStatusText(row.status) }}</template>
            </el-table-column>
          </el-table>
        </el-card>

        <el-card v-show="mainTab === 'matchRequests'">
          <template #header>
            <div class="card-header">
              <span>代课需求总表</span>
              <el-select v-model="matchRequestFilters.status" placeholder="状态" clearable @change="loadMatchRequests" style="width: 150px;">
                <el-option label="待匹配" value="pending" />
                <el-option label="已匹配" value="matched" />
                <el-option label="已完成" value="completed" />
                <el-option label="已取消" value="cancelled" />
              </el-select>
            </div>
          </template>
          <el-table :data="matchRequests" v-loading="loadingMatchRequests" stripe>
            <el-table-column label="需求方" width="120">
              <template #default="{ row }">{{ row.requesterId?.username }}</template>
            </el-table-column>
            <el-table-column label="需求方联系方式" min-width="180">
              <template #default="{ row }">
                <div>微信: {{ row.requesterId?.profile?.wechat || '-' }}</div>
                <div>邮箱: {{ row.requesterId?.profile?.email || '-' }}</div>
              </template>
            </el-table-column>
            <el-table-column label="课程" min-width="160">
              <template #default="{ row }">{{ row.courseInfo?.courseName || '-' }}</template>
            </el-table-column>
            <el-table-column label="星期" width="80">
              <template #default="{ row }">{{ getWeekText(row.dayOfWeek) }}</template>
            </el-table-column>
            <el-table-column label="节次" width="120">
              <template #default="{ row }">{{ row.periods.join(', ') }}</template>
            </el-table-column>
            <el-table-column label="已选空闲者" min-width="160">
              <template #default="{ row }">
                <span v-if="row.selectedSubstitute">
                  {{ row.selectedSubstitute.username }}
                  <span class="subtext">微信 {{ row.selectedSubstitute.profile?.wechat || '-' }}</span>
                </span>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="{ row }">{{ getMatchStatusText(row.status) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="180">
              <template #default="{ row }">
                <el-button type="primary" size="small" @click="openMatchDetail(row)">详情</el-button>
                <el-button type="danger" size="small" @click="handleDeleteMatchRequest(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <el-card v-show="mainTab === 'mealAppointments'">
          <template #header>
            <div class="card-header">
              <span>约饭总表</span>
              <el-select v-model="mealFilters.status" placeholder="状态" clearable @change="loadMealAppointments" style="width: 150px;">
                <el-option label="有效" value="active" />
                <el-option label="已取消" value="cancelled" />
              </el-select>
            </div>
          </template>
          <el-table :data="mealAppointments" v-loading="loadingMealAppointments" stripe>
            <el-table-column label="发布者" width="120">
              <template #default="{ row }">{{ row.userId?.username }}</template>
            </el-table-column>
            <el-table-column label="发布者联系方式" min-width="180">
              <template #default="{ row }">
                <div>微信: {{ row.userId?.profile?.wechat || '-' }}</div>
                <div>邮箱: {{ row.userId?.profile?.email || '-' }}</div>
              </template>
            </el-table-column>
            <el-table-column label="日期" width="120">
              <template #default="{ row }">{{ formatDate(row.date) }}</template>
            </el-table-column>
            <el-table-column prop="mealTime" label="时间" width="90" />
            <el-table-column label="类型" width="90">
              <template #default="{ row }">{{ getMealTypeText(row.mealType) }}</template>
            </el-table-column>
            <el-table-column prop="location" label="地点" min-width="140" />
            <el-table-column label="点击人数" width="100">
              <template #default="{ row }">{{ row.interestedUsers?.length || 0 }}</template>
            </el-table-column>
            <el-table-column label="操作" width="180">
              <template #default="{ row }">
                <el-button type="primary" size="small" @click="openMealDetail(row)">详情</el-button>
                <el-button type="danger" size="small" @click="handleDeleteMealAppointment(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-main>
    </el-container>

    <el-dialog v-model="userDetailVisible" title="用户详情" width="880px">
      <el-descriptions :column="2" border v-if="currentUser">
        <el-descriptions-item label="用户名">{{ currentUser.username }}</el-descriptions-item>
        <el-descriptions-item label="角色">{{ getRoleText(currentUser.role) }}</el-descriptions-item>
        <el-descriptions-item label="性别">{{ getGenderText(currentUser.profile?.gender) }}</el-descriptions-item>
        <el-descriptions-item label="专业">{{ currentUser.profile?.major || '-' }}</el-descriptions-item>
        <el-descriptions-item label="年级">{{ currentUser.profile?.grade || '-' }}</el-descriptions-item>
        <el-descriptions-item label="电话">{{ currentUser.profile?.phone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="微信">{{ currentUser.profile?.wechat || '-' }}</el-descriptions-item>
        <el-descriptions-item label="邮箱">{{ currentUser.profile?.email || '-' }}</el-descriptions-item>
      </el-descriptions>

      <el-tabs v-model="activeTab" style="margin-top: 20px">
        <el-tab-pane label="活动日志" name="activity">
          <el-table :data="activityLogs" max-height="360">
            <el-table-column prop="actionType" label="类型" width="160" />
            <el-table-column prop="description" label="描述" min-width="240" />
            <el-table-column label="时间" width="180">
              <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="发布与互动" name="content">
          <div class="content-summary" v-if="contentHistory">
            <el-tag>空闲 {{ contentHistory.availabilities?.length || 0 }}</el-tag>
            <el-tag type="warning">代课需求 {{ contentHistory.matchRequests?.length || 0 }}</el-tag>
            <el-tag type="success">约饭 {{ contentHistory.mealAppointments?.length || 0 }}</el-tag>
            <el-tag type="info">互动 {{ contentHistory.interactions?.length || 0 }}</el-tag>
          </div>
          <el-table :data="contentInteractionRows" max-height="360" style="margin-top: 16px">
            <el-table-column prop="type" label="类型" width="120" />
            <el-table-column prop="summary" label="摘要" min-width="240" />
            <el-table-column prop="counterpart" label="对方" width="140" />
            <el-table-column label="时间" width="180">
              <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>

    <el-dialog v-model="matchDetailVisible" title="代课需求详情" width="960px">
      <div v-if="matchDetail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="需求方">{{ matchDetail.requesterId?.username }}</el-descriptions-item>
          <el-descriptions-item label="需求方联系方式">
            微信 {{ matchDetail.requesterId?.profile?.wechat || '-' }} / 邮箱 {{ matchDetail.requesterId?.profile?.email || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="课程">{{ matchDetail.courseInfo?.courseName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="校区">{{ matchDetail.campus }}</el-descriptions-item>
          <el-descriptions-item label="节次">{{ matchDetail.periods.join(', ') }}</el-descriptions-item>
          <el-descriptions-item label="已选空闲者">
            <span v-if="matchDetail.selectedSubstitute">
              {{ matchDetail.selectedSubstitute.username }}，微信 {{ matchDetail.selectedSubstitute.profile?.wechat || '-' }}
            </span>
            <span v-else>-</span>
          </el-descriptions-item>
        </el-descriptions>

        <h4 class="section-heading">匹配到的空闲者</h4>
        <el-table :data="matchDetail.matchedSubstitutes || []" max-height="220">
          <el-table-column prop="userId.username" label="用户名" width="120" />
          <el-table-column label="联系方式" min-width="180">
            <template #default="{ row }">
              <div>微信: {{ row.userId?.profile?.wechat || '-' }}</div>
              <div>邮箱: {{ row.userId?.profile?.email || '-' }}</div>
            </template>
          </el-table-column>
          <el-table-column label="专业" min-width="140">
            <template #default="{ row }">{{ row.userId?.profile?.major || '-' }}</template>
          </el-table-column>
          <el-table-column label="匹配分" width="100">
            <template #default="{ row }">{{ row.matchScore }}</template>
          </el-table-column>
        </el-table>

        <h4 class="section-heading">已发生互动</h4>
        <el-table :data="matchInteractions" max-height="220">
          <el-table-column label="需求方" width="120">
            <template #default="{ row }">{{ row.sourceSnapshot?.username }}</template>
          </el-table-column>
          <el-table-column label="空闲者" width="120">
            <template #default="{ row }">{{ row.targetSnapshot?.username }}</template>
          </el-table-column>
          <el-table-column label="双方联系方式" min-width="220">
            <template #default="{ row }">
              <div>需求方微信: {{ row.sourceSnapshot?.profile?.wechat || '-' }}</div>
              <div>空闲者微信: {{ row.targetSnapshot?.profile?.wechat || '-' }}</div>
            </template>
          </el-table-column>
          <el-table-column label="时间" width="180">
            <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>

    <el-dialog v-model="mealDetailVisible" title="约饭详情" width="960px">
      <div v-if="mealDetail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="发布者">{{ mealDetail.userId?.username }}</el-descriptions-item>
          <el-descriptions-item label="发布者联系方式">
            微信 {{ mealDetail.userId?.profile?.wechat || '-' }} / 邮箱 {{ mealDetail.userId?.profile?.email || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="时间">{{ formatDate(mealDetail.date) }} {{ mealDetail.mealTime }}</el-descriptions-item>
          <el-descriptions-item label="地点">{{ mealDetail.location }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">{{ mealDetail.note || '-' }}</el-descriptions-item>
        </el-descriptions>

        <h4 class="section-heading">点击约一下的人</h4>
        <el-table :data="mealDetail.interestedUsers || []" max-height="220">
          <el-table-column prop="userId.username" label="用户名" width="120" />
          <el-table-column label="联系方式" min-width="200">
            <template #default="{ row }">
              <div>微信: {{ row.userId?.profile?.wechat || '-' }}</div>
              <div>邮箱: {{ row.userId?.profile?.email || '-' }}</div>
            </template>
          </el-table-column>
          <el-table-column label="专业" min-width="140">
            <template #default="{ row }">{{ row.userId?.profile?.major || '-' }}</template>
          </el-table-column>
        </el-table>

        <h4 class="section-heading">互动记录</h4>
        <el-table :data="mealInteractions" max-height="220">
          <el-table-column label="点击者" width="120">
            <template #default="{ row }">{{ row.sourceSnapshot?.username }}</template>
          </el-table-column>
          <el-table-column label="发布者" width="120">
            <template #default="{ row }">{{ row.targetSnapshot?.username }}</template>
          </el-table-column>
          <el-table-column label="联系方式" min-width="220">
            <template #default="{ row }">
              <div>点击者微信: {{ row.sourceSnapshot?.profile?.wechat || '-' }}</div>
              <div>发布者微信: {{ row.targetSnapshot?.profile?.wechat || '-' }}</div>
            </template>
          </el-table-column>
          <el-table-column label="时间" width="180">
            <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '@/utils/request'

const stats = ref({
  totalUsers: 0,
  newUsersLast7Days: 0,
  totalMatchRequests: 0,
  totalMealAppointments: 0,
  totalInteractions: 0
})

const mainTab = ref('users')
const users = ref([])
const loading = ref(false)
const searchQuery = ref('')
const currentPage = ref(1)
const total = ref(0)

const availabilities = ref([])
const loadingAvailabilities = ref(false)
const availabilityFilters = ref({ dayOfWeek: null, campus: null })

const matchRequests = ref([])
const loadingMatchRequests = ref(false)
const matchRequestFilters = ref({ status: null })

const mealAppointments = ref([])
const loadingMealAppointments = ref(false)
const mealFilters = ref({ status: null })

const userDetailVisible = ref(false)
const currentUser = ref(null)
const activeTab = ref('activity')
const activityLogs = ref([])
const contentHistory = ref(null)

const matchDetailVisible = ref(false)
const matchDetail = ref(null)
const matchInteractions = ref([])

const mealDetailVisible = ref(false)
const mealDetail = ref(null)
const mealInteractions = ref([])

const contentInteractionRows = computed(() => {
  const interactions = contentHistory.value?.interactions || []
  return interactions.map(item => ({
    type: item.category === 'match' ? '代课互动' : '约饭互动',
    summary: item.category === 'match'
      ? `${item.context?.courseInfo?.courseName || '未填写课程'} / 周${item.context?.dayOfWeek || '-'}`
      : `${formatDate(item.context?.date)} ${item.context?.mealTime || '-'} ${item.context?.location || '-'}`,
    counterpart: item.sourceSnapshot?.username === currentUser.value?.username
      ? item.targetSnapshot?.username
      : item.sourceSnapshot?.username,
    createdAt: item.createdAt
  }))
})

const getRoleText = (role) => {
  const map = { substitute: '空闲者', requester: '需求方', both: '都可以', admin: '管理员' }
  return map[role] || role
}

const getGenderText = (gender) => {
  const map = { male: '男', female: '女', other: '其他' }
  return map[gender] || '-'
}

const getFrequencyText = (type) => {
  const map = { 'long-term': '长期', 'short-term': '短期', single: '单次' }
  return map[type] || type
}

const getAvailabilityStatusText = (status) => {
  const map = { available: '可用', booked: '已占用', cancelled: '已取消' }
  return map[status] || status
}

const getMatchStatusText = (status) => {
  const map = { pending: '待匹配', matched: '已匹配', completed: '已完成', cancelled: '已取消' }
  return map[status] || status
}

const getMealTypeText = (type) => {
  const map = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐' }
  return map[type] || type
}

const getWeekText = (day) => `周${['一', '二', '三', '四', '五', '六'][day - 1] || ''}`
const formatDateTime = (date) => new Date(date).toLocaleString('zh-CN')
const formatDate = (date) => new Date(date).toLocaleDateString('zh-CN')

const handleMainTabChange = (tab) => {
  if (tab === 'availabilities' && availabilities.value.length === 0) loadAvailabilities()
  if (tab === 'matchRequests' && matchRequests.value.length === 0) loadMatchRequests()
  if (tab === 'mealAppointments' && mealAppointments.value.length === 0) loadMealAppointments()
}

const loadStats = async () => {
  try {
    stats.value = await api.get('/admin/stats')
  } catch (error) {
    console.error(error)
  }
}

const loadUsers = async () => {
  loading.value = true
  try {
    const data = await api.get('/admin/users', {
      params: { page: currentPage.value, search: searchQuery.value }
    })
    users.value = data.users
    total.value = data.total
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const loadAvailabilities = async () => {
  loadingAvailabilities.value = true
  try {
    const data = await api.get('/admin/overview/availabilities', {
      params: {
        dayOfWeek: availabilityFilters.value.dayOfWeek,
        campus: availabilityFilters.value.campus
      }
    })
    availabilities.value = data.items
  } catch (error) {
    console.error(error)
  } finally {
    loadingAvailabilities.value = false
  }
}

const loadMatchRequests = async () => {
  loadingMatchRequests.value = true
  try {
    const data = await api.get('/admin/overview/match-requests', {
      params: { status: matchRequestFilters.value.status }
    })
    matchRequests.value = data.items
  } catch (error) {
    console.error(error)
  } finally {
    loadingMatchRequests.value = false
  }
}

const loadMealAppointments = async () => {
  loadingMealAppointments.value = true
  try {
    const data = await api.get('/admin/overview/meal-appointments', {
      params: { status: mealFilters.value.status }
    })
    mealAppointments.value = data.items
  } catch (error) {
    console.error(error)
  } finally {
    loadingMealAppointments.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  loadUsers()
}

const handleViewUser = async (user) => {
  currentUser.value = user
  userDetailVisible.value = true
  activeTab.value = 'activity'
  try {
    const [logs, content] = await Promise.all([
      api.get(`/admin/users/${user._id}/activity-log`),
      api.get(`/admin/users/${user._id}/content-history`)
    ])
    activityLogs.value = logs.logs
    contentHistory.value = content
  } catch (error) {
    console.error(error)
  }
}

const openMatchDetail = async (row) => {
  try {
    const data = await api.get(`/admin/overview/match-requests/${row._id}`)
    matchDetail.value = data.matchRequest
    matchInteractions.value = data.interactions
    matchDetailVisible.value = true
  } catch (error) {
    console.error(error)
  }
}

const openMealDetail = async (row) => {
  try {
    const data = await api.get(`/admin/overview/meal-appointments/${row._id}`)
    mealDetail.value = data.mealAppointment
    mealInteractions.value = data.interactions
    mealDetailVisible.value = true
  } catch (error) {
    console.error(error)
  }
}

const handleDeleteMatchRequest = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除这条代课需求吗？', '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await api.delete(`/admin/match-requests/${row._id}`)
    ElMessage.success('删除成功')
    loadMatchRequests()
    loadStats()
  } catch (error) {
    if (error !== 'cancel') console.error(error)
  }
}

const handleDeleteMealAppointment = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除这条约饭记录吗？', '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await api.delete(`/admin/meal-appointments/${row._id}`)
    ElMessage.success('删除成功')
    loadMealAppointments()
    loadStats()
  } catch (error) {
    if (error !== 'cancel') console.error(error)
  }
}

const handleDeleteUser = async (user) => {
  try {
    await ElMessageBox.confirm(`确定要删除用户 "${user.username}" 吗？`, '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await api.delete(`/admin/users/${user._id}`)
    ElMessage.success('删除成功')
    loadUsers()
    loadStats()
  } catch (error) {
    if (error !== 'cancel') console.error(error)
  }
}

onMounted(() => {
  loadStats()
  loadUsers()
})
</script>

<style scoped>
.admin-container {
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

.stat-card {
  text-align: center;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #409eff;
}

.stat-label {
  font-size: 14px;
  color: #666;
  margin-top: 10px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filters {
  display: flex;
  gap: 10px;
}

.subtext {
  display: block;
  color: #909399;
  font-size: 12px;
  margin-top: 4px;
}

.content-summary {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.section-heading {
  margin: 18px 0 12px;
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

  .filters {
    width: 100%;
    flex-wrap: wrap;
  }
}
</style>
