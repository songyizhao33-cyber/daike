<template>
  <div class="home-container">
    <el-container>
      <el-header>
        <div class="header-content">
          <h1>代课匹配系统</h1>
          <div class="user-info">
            <span>欢迎，{{ userStore.user?.username }}</span>
            <el-button @click="handleLogout" type="danger" size="small">退出</el-button>
          </div>
        </div>
      </el-header>
      <el-main>
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12" :md="6">
            <el-card shadow="hover" class="menu-card" @click="$router.push('/availability')">
              <el-icon :size="50"><Calendar /></el-icon>
              <h3>管理空闲时间</h3>
              <p>标记和管理你的空闲时间段</p>
            </el-card>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6">
            <el-card shadow="hover" class="menu-card" @click="$router.push('/match')">
              <el-icon :size="50"><Search /></el-icon>
              <h3>寻找代课者</h3>
              <p>发布代课需求，匹配合适的代课者</p>
            </el-card>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6">
            <el-card shadow="hover" class="menu-card" @click="$router.push('/meal')">
              <el-icon :size="50"><Orange /></el-icon>
              <h3>约饭功能</h3>
              <p>发布约饭信息，寻找饭搭子</p>
            </el-card>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6">
            <el-card shadow="hover" class="menu-card" @click="$router.push('/profile')">
              <el-icon :size="50"><User /></el-icon>
              <h3>个人中心</h3>
              <p>查看和编辑个人信息</p>
            </el-card>
          </el-col>
          <el-col v-if="userStore.user?.role === 'admin'" :xs="24" :sm="12" :md="6">
            <el-card shadow="hover" class="menu-card" @click="$router.push('/admin')">
              <el-icon :size="50"><Setting /></el-icon>
              <h3>管理后台</h3>
              <p>管理用户和查看统计数据</p>
            </el-card>
          </el-col>
        </el-row>
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const handleLogout = () => {
  userStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.home-container {
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

.user-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.el-main {
  padding: 40px;
}

.menu-card {
  text-align: center;
  cursor: pointer;
  transition: transform 0.3s;
  padding: 30px;
}

.menu-card:hover {
  transform: translateY(-5px);
}

.menu-card h3 {
  margin: 20px 0 10px;
  color: #333;
}

.menu-card p {
  color: #666;
  font-size: 14px;
}
</style>

