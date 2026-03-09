<template>
  <div class="home-container">
    <el-container>
      <el-header>
        <div class="header-content">
          <h1>代课匹配系统</h1>
          <div class="user-info">
            <span>{{ userStore.user?.username }}</span>
            <el-button @click="handleLogout" type="danger" size="small">退出</el-button>
          </div>
        </div>
      </el-header>
      <el-main>
        <!-- 主要功能 -->
        <div class="section-title">主要功能</div>
        <el-row :gutter="20" class="main-features" justify="center">
          <el-col :xs="24" :sm="12" :md="8">
            <el-card shadow="hover" class="feature-card primary" @click="$router.push('/availability')">
              <el-icon :size="50" color="#409eff"><Calendar /></el-icon>
              <h3>空闲时间</h3>
              <p>标记你的空闲时间段</p>
            </el-card>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8">
            <el-card shadow="hover" class="feature-card primary" @click="$router.push('/match')">
              <el-icon :size="50" color="#67c23a"><Search /></el-icon>
              <h3>寻找代课</h3>
              <p>发布需求，匹配代课者</p>
            </el-card>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8">
            <el-card shadow="hover" class="feature-card primary" @click="$router.push('/meal')">
              <el-icon :size="50" color="#e6a23c"><Orange /></el-icon>
              <h3>约饭</h3>
              <p>寻找饭搭子，一起吃饭</p>
            </el-card>
          </el-col>
        </el-row>

        <!-- 其他功能 -->
        <div class="section-title">更多功能</div>
        <el-row :gutter="15" class="other-features" :justify="isAdmin ? 'start' : 'center'">
          <el-col :xs="12" :sm="8" :md="5">
            <el-card shadow="hover" class="feature-card secondary" @click="$router.push('/tarot')">
              <el-icon :size="40"><MagicStick /></el-icon>
              <h4>塔罗占卜</h4>
            </el-card>
          </el-col>
          <el-col :xs="12" :sm="8" :md="5">
            <el-card shadow="hover" class="feature-card secondary" @click="$router.push('/feedback')">
              <el-icon :size="40"><ChatDotRound /></el-icon>
              <h4>反馈信箱</h4>
            </el-card>
          </el-col>
          <el-col :xs="12" :sm="8" :md="5">
            <el-card shadow="hover" class="feature-card secondary" @click="$router.push('/profile')">
              <el-icon :size="40"><User /></el-icon>
              <h4>个人中心</h4>
            </el-card>
          </el-col>
          <el-col v-if="isAdmin" :xs="12" :sm="8" :md="5">
            <el-card shadow="hover" class="feature-card secondary" @click="$router.push('/admin')">
              <el-icon :size="40"><Setting /></el-icon>
              <h4>管理后台</h4>
            </el-card>
          </el-col>
        </el-row>
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
const isAdmin = computed(() => userStore.user?.role === 'admin')

const handleLogout = () => {
  userStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.home-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.el-header {
  background-color: rgba(255, 255, 255, 0.95);
  color: #333;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 15px;
  color: #666;
}

.el-main {
  padding: 40px;
  max-width: 1200px;
  margin: 0 auto;
}

.section-title {
  font-size: 20px;
  font-weight: bold;
  color: white;
  margin-bottom: 20px;
  padding-left: 10px;
  border-left: 4px solid white;
}

.main-features {
  margin-bottom: 40px;
}

.feature-card {
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  border: none;
}

.feature-card.primary {
  padding: 30px 20px;
  background: white;
  height: 200px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.feature-card.primary:hover {
  transform: translateY(-10px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}

.feature-card.primary h3 {
  margin: 15px 0 8px;
  color: #333;
  font-size: 18px;
}

.feature-card.primary p {
  color: #666;
  font-size: 13px;
  margin: 0;
}

.feature-card.secondary {
  padding: 20px 12px;
  background: rgba(255, 255, 255, 0.95);
  min-height: 145px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.feature-card.secondary:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.feature-card.secondary h4 {
  margin: 15px 0 0;
  color: #333;
  font-size: 16px;
}

@media (max-width: 768px) {
  .el-main {
    padding: 20px;
  }

  .section-title {
    font-size: 18px;
  }

  .feature-card.primary {
    padding: 30px 15px;
  }

  .feature-card.primary h3 {
    font-size: 18px;
  }
}
</style>
