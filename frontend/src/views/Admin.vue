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
                <div class="stat-value">{{ stats.totalMealAppointments }}</div>
                <div class="stat-label">约饭信息</div>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <!-- 用户列表 -->
        <el-card>
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
            <el-table-column label="操作" width="150">
              <template #default="{ row }">
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
      </el-main>
    </el-container>
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

const users = ref([])
const loading = ref(false)
const searchQuery = ref('')
const currentPage = ref(1)
const total = ref(0)

onMounted(() => {
  loadStats()
  loadUsers()
})

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

const handleSearch = () => {
  currentPage.value = 1
  loadUsers()
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

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('zh-CN')
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

