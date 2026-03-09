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
        <!-- 统计卡片 -->
        <el-row :gutter="20" style="margin-bottom: 20px;">
          <el-col :xs="24" :sm="12" :md="6">
            <el-card>
              <div class="stat-card">
                <div class="stat-value">{{ stats.totalUsers }}</div>
                <div class="stat-label">总用户数</div>
              </div>
            </el-card>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6">
            <el-card>
              <div class="stat-card">
                <div class="stat-value">{{ stats.newUsersLast7Days }}</div>
                <div class="stat-label">7天新增</div>
              </div>
            </el-card>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6">
            <el-card>
              <div class="stat-card">
                <div class="stat-value">{{ stats.totalMatchRequests }}</div>
                <div class="stat-label">代课请求</div>
              </div>
            </el-card>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6">
            <el-card>
              <div class="stat-card">
                <div class="stat-value">{{ stats.totalMealAppointments }}</div>
                <div class="stat-label">约饭信息</div>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <!-- 标签页 -->
        <el-tabs v-model="mainTab" @tab-change="handleMainTabChange">
          <el-tab-pane label="用户管理" name="users"></tab-pane>
          <el-tab-pane label="空闲时间总表" name="availabilities"></tab-pane>
          <el-tab-pane label="代课请求总表" name="matchRequests"></tab-pane>
          <el-tab-pane label="约饭信息总表" name="mealAppointments"></tab-pane>
        </el-tabs>

        <!-- 用户列表 -->
        <el-card v-show="mainTab === 'users'">
          <template #header>
            <div class="card-header">
              <span>用户管理</span>
              <el-input
                v-model="searchQuery"
                placeholder="搜索用户名"
                style="width: 200px;"
                @input="handleSearch"
                clearable
              />
            </div>
          </template>

          <el-table :data="users" v-loading="loading" stripe>
            <el-table-column prop="username" label="用户名" />
            <el-table-column prop="role" label="角色">
              <template #default="{ row }">
                {{ getRoleText(row.role) }}
              </template>
            </el-table-column>
            <el-table-column prop="profile.gender" label="性别">
              <template #default="{ row }">
                {{ getGenderText(row.profile?.gender) }}
              </template>
            </el-table-column>
            <el-table-column prop="profile.major" label="专业" />
            <el-table-column prop="createdAt" label="注册时间">
              <template #default="{ row }">
                {{ formatDate(row.createdAt) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200">
              <template #default="{ row }">
                <el-button
                  type="primary"
                  size="small"
                  @click="handleViewUser(row)"
                >
                  查看详情
                </el-button>
                <el-button
                  type="danger"
                  size="small"
                  @click="handleDeleteUser(row)"
                  :disabled="row.role === 'admin'"
                >
                  删除
                </el-button>
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

        <!-- 空闲时间总表 -->
        <el-card v-show="mainTab === 'availabilities'">
          <template #header>
            <div class="card-header">
              <span>空闲时间总表</span>
              <div style="display: flex; gap: 10px;">
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
            <el-table-column label="星期" width="80">
              <template #default="{ row }">周{{ ['一','二','三','四','五','六'][row.dayOfWeek - 1] }}</template>
            </el-table-column>
            <el-table-column label="节次" width="200">
              <template #default="{ row }">{{ row.periods.join(', ') }}</template>
            </el-table-column>
            <el-table-column label="校区" width="150">
              <template #default="{ row }">{{ row.campuses.join(', ') }}</template>
            </el-table-column>
            <el-table-column label="频率" width="100">
              <template #default="{ row }">{{ getFrequencyText(row.frequencyType) }}</template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="{ row }">{{ getStatusText(row.status) }}</template>
            </el-table-column>
            <el-table-column label="创建时间" width="180">
              <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
            </el-table-column>
          </el-table>
          <el-pagination
            v-model:current-page="availabilityPage"
            :page-size="15"
            :total="availabilityTotal"
            layout="total, prev, pager, next"
            @current-change="loadAvailabilities"
            style="margin-top: 20px; justify-content: center;"
          />
        </el-card>

        <!-- 代课请求总表 -->
        <el-card v-show="mainTab === 'matchRequests'">
          <template #header>
            <div class="card-header">
              <span>代课请求总表</span>
              <el-select v-model="matchRequestFilters.status" placeholder="状态" clearable @change="loadMatchRequests" style="width: 150px;">
                <el-option label="待匹配" value="pending" />
                <el-option label="已匹配" value="matched" />
                <el-option label="已完成" value="completed" />
                <el-option label="已取消" value="cancelled" />
              </el-select>
            </div>
          </template>
          <el-table :data="matchRequests" v-loading="loadingMatchRequests" stripe>
            <el-table-column label="需求者" width="120">
              <template #default="{ row }">{{ row.requesterId?.username }}</template>
            </el-table-column>
            <el-table-column label="课程信息" width="200">
              <template #default="{ row }">{{ row.courseInfo }}</template>
            </el-table-column>
            <el-table-column label="星期" width="80">
              <template #default="{ row }">周{{ ['一','二','三','四','五','六'][row.dayOfWeek - 1] }}</template>
            </el-table-column>
            <el-table-column label="节次" width="150">
              <template #default="{ row }">{{ row.periods.join(', ') }}</template>
            </el-table-column>
            <el-table-column label="校区" width="100">
              <template #default="{ row }">{{ row.campus }}</template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="{ row }">{{ getMatchStatusText(row.status) }}</template>
            </el-table-column>
            <el-table-column label="匹配数" width="100">
              <template #default="{ row }">{{ row.matchedSubstitutes?.length || 0 }}</template>
            </el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button type="danger" size="small" @click="handleDeleteMatchRequest(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-pagination
            v-model:current-page="matchRequestPage"
            :page-size="15"
            :total="matchRequestTotal"
            layout="total, prev, pager, next"
            @current-change="loadMatchRequests"
            style="margin-top: 20px; justify-content: center;"
          />
        </el-card>

        <!-- 约饭信息总表 -->
        <el-card v-show="mainTab === 'mealAppointments'">
          <template #header>
            <div class="card-header">
              <span>约饭信息总表</span>
              <el-select v-model="mealFilters.status" placeholder="状态" clearable @change="loadMealAppointments" style="width: 150px;">
                <el-option label="活跃" value="active" />
                <el-option label="已取消" value="cancelled" />
              </el-select>
            </div>
          </template>
          <el-table :data="mealAppointments" v-loading="loadingMealAppointments" stripe>
            <el-table-column label="发布者" width="120">
              <template #default="{ row }">{{ row.userId?.username }}</template>
            </el-table-column>
            <el-table-column label="日期" width="120">
              <template #default="{ row }">{{ formatDate(row.date) }}</template>
            </el-table-column>
            <el-table-column label="时间" width="150">
              <template #default="{ row }">{{ row.mealTime }}</template>
            </el-table-column>
            <el-table-column label="类型" width="100">
              <template #default="{ row }">{{ getMealTypeText(row.mealType) }}</template>
            </el-table-column>
            <el-table-column label="校区" width="100">
              <template #default="{ row }">{{ row.campus }}</template>
            </el-table-column>
            <el-table-column label="地点" width="150">
              <template #default="{ row }">{{ row.location }}</template>
            </el-table-column>
            <el-table-column label="感兴趣人数" width="120">
              <template #default="{ row }">{{ row.interestedUsers?.length || 0 }}</template>
            </el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button type="danger" size="small" @click="handleDeleteMealAppointment(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-pagination
            v-model:current-page="mealPage"
            :page-size="15"
            :total="mealTotal"
            layout="total, prev, pager, next"
            @current-change="loadMealAppointments"
            style="margin-top: 20px; justify-content: center;"
          />
        </el-card>
      </el-main>
    </el-container>

    <!-- 用户详情对话框 -->
    <el-dialog
      v-model="userDetailVisible"
      title="用户详情"
      width="800px"
    >
      <el-descriptions :column="2" border v-if="currentUser">
        <el-descriptions-item label="用户名">{{ currentUser.username }}</el-descriptions-item>
        <el-descriptions-item label="角色">{{ getRoleText(currentUser.role) }}</el-descriptions-item>
        <el-descriptions-item label="性别">{{ getGenderText(currentUser.profile?.gender) }}</el-descriptions-item>
        <el-descriptions-item label="专业">{{ currentUser.profile?.major || '-' }}</el-descriptions-item>
        <el-descriptions-item label="年级">{{ currentUser.profile?.grade || '-' }}</el-descriptions-item>
        <el-descriptions-item label="手机">{{ currentUser.profile?.phone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="微信">{{ currentUser.profile?.wechat || '-' }}</el-descriptions-item>
        <el-descriptions-item label="邮箱">{{ currentUser.profile?.email || '-' }}</el-descriptions-item>
        <el-descriptions-item label="注册时间" :span="2">{{ formatDate(currentUser.createdAt) }}</el-descriptions-item>
      </el-descriptions>

      <el-tabs v-model="activeTab" style="margin-top: 20px">
        <el-tab-pane label="活动历史" name="activity">
          <el-table :data="activityLogs" max-height="400">
            <el-table-column prop="actionType" label="操作类型" width="150" />
            <el-table-column prop="description" label="描述" />
            <el-table-column label="时间" width="180">
              <template #default="{ row }">
                {{ formatDateTime(row.createdAt) }}
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="发布内容" name="content">
          <div v-if="contentHistory">
            <h4>空闲时间（{{ contentHistory.availabilities?.length || 0 }}）</h4>
            <h4 style="margin-top: 20px">匹配请求（{{ contentHistory.matchRequests?.length || 0 }}）</h4>
            <h4 style="margin-top: 20px">约饭信息（{{ contentHistory.mealAppointments?.length || 0 }}）</h4>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '@/utils/request'

const stats = ref({
  totalUsers: 0,
  newUsersLast7Days: 0,
  totalMatchRequests: 0,
  totalMealAppointments: 0
})

const mainTab = ref('users')
const users = ref([])
const loading = ref(false)
const searchQuery = ref('')
const currentPage = ref(1)
const total = ref(0)
const userDetailVisible = ref(false)
const currentUser = ref(null)
const activeTab = ref('activity')
const activityLogs = ref([])
const contentHistory = ref(null)

const availabilities = ref([])
const loadingAvailabilities = ref(false)
const availabilityPage = ref(1)
const availabilityTotal = ref(0)
const availabilityFilters = ref({ dayOfWeek: null, campus: null })

const matchRequests = ref([])
const loadingMatchRequests = ref(false)
const matchRequestPage = ref(1)
const matchRequestTotal = ref(0)
const matchRequestFilters = ref({ status: null })

const mealAppointments = ref([])
const loadingMealAppointments = ref(false)
const mealPage = ref(1)
const mealTotal = ref(0)
const mealFilters = ref({ status: null })

onMounted(() => {
  loadStats()
  loadUsers()
})

const handleMainTabChange = (tab) => {
  if (tab === 'availabilities' && availabilities.value.length === 0) {
    loadAvailabilities()
  } else if (tab === 'matchRequests' && matchRequests.value.length === 0) {
    loadMatchRequests()
  } else if (tab === 'mealAppointments' && mealAppointments.value.length === 0) {
    loadMealAppointments()
  }
}

const loadStats = async () => {
  try {
    const data = await api.get('/admin/stats')
    stats.value = data
  } catch (error) {
    console.error(error)
  }
}

const loadUsers = async () => {
  loading.value = true
  try {
    const data = await api.get('/admin/users', {
      params: {
        page: currentPage.value,
        search: searchQuery.value
      }
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
        page: availabilityPage.value,
        dayOfWeek: availabilityFilters.value.dayOfWeek,
        campus: availabilityFilters.value.campus
      }
    })
    availabilities.value = data.items
    availabilityTotal.value = data.total
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
      params: {
        page: matchRequestPage.value,
        status: matchRequestFilters.value.status
      }
    })
    matchRequests.value = data.items
    matchRequestTotal.value = data.total
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
      params: {
        page: mealPage.value,
        status: mealFilters.value.status
      }
    })
    mealAppointments.value = data.items
    mealTotal.value = data.total
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

const handleDeleteMatchRequest = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除此代课请求吗？', '确认删除', {
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
    await ElMessageBox.confirm('确定要删除此约饭记录吗？', '确认删除', {
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
    await ElMessageBox.confirm(
      `确定要删除用户 "${user.username}" 吗？该操作将删除用户的所有数据且无法恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await api.delete(`/admin/users/${user._id}`)
    ElMessage.success('删除成功')
    loadUsers()
    loadStats()
  } catch (error) {
    if (error !== 'cancel') {
      console.error(error)
    }
  }
}

const handleViewUser = async (user) => {
  currentUser.value = user
  userDetailVisible.value = true
  activeTab.value = 'activity'

  // 加载活动历史
  try {
    const data = await api.get(`/admin/users/${user._id}/activity-log`)
    activityLogs.value = data.logs
  } catch (error) {
    console.error(error)
  }

  // 加载发布内容历史
  try {
    const data = await api.get(`/admin/users/${user._id}/content-history`)
    contentHistory.value = data
  } catch (error) {
    console.error(error)
  }
}

const formatDateTime = (date) => {
  return new Date(date).toLocaleString('zh-CN')
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('zh-CN')
}

const getRoleText = (role) => {
  const roleMap = {
    substitute: '代课者',
    requester: '需求者',
    both: '兼具两者',
    admin: '管理员'
  }
  return roleMap[role] || role
}

const getGenderText = (gender) => {
  const genderMap = {
    male: '男',
    female: '女',
    other: '其他'
  }
  return genderMap[gender] || '未填写'
}

const getFrequencyText = (type) => {
  const map = { 'long-term': '长期', 'short-term': '短期', 'single': '单次' }
  return map[type] || type
}

const getStatusText = (status) => {
  const map = { 'available': '可用', 'booked': '已预订', 'cancelled': '已取消' }
  return map[status] || status
}

const getMatchStatusText = (status) => {
  const map = { 'pending': '待匹配', 'matched': '已匹配', 'completed': '已完成', 'cancelled': '已取消' }
  return map[status] || status
}

const getMealTypeText = (type) => {
  const map = { 'breakfast': '早餐', 'lunch': '午餐', 'dinner': '晚餐' }
  return map[type] || type
}
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

@media (max-width: 768px) {
  .header-content h1 {
    font-size: 18px;
  }

  .card-header {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }
}
</style>

