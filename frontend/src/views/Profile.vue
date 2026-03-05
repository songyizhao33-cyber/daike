<template>
  <div class="profile-container">
    <el-container>
      <el-header>
        <div class="header-content">
          <h1>个人中心</h1>
          <el-button @click="$router.push('/home')">返回首页</el-button>
        </div>
      </el-header>
      <el-main>
        <el-card class="profile-card">
          <template #header>
            <span>基本信息</span>
          </template>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="用户名">{{ userStore.user?.username }}</el-descriptions-item>
            <el-descriptions-item label="角色">{{ getRoleText(userStore.user?.role) }}</el-descriptions-item>
            <el-descriptions-item label="性别">{{ getGenderText(userStore.user?.profile?.gender) }}</el-descriptions-item>
            <el-descriptions-item label="专业">{{ userStore.user?.profile?.major || '未填写' }}</el-descriptions-item>
            <el-descriptions-item label="年级">{{ userStore.user?.profile?.grade || '未填写' }}</el-descriptions-item>
            <el-descriptions-item label="联系电话">{{ userStore.user?.profile?.phone || '未填写' }}</el-descriptions-item>
            <el-descriptions-item label="微信号">{{ userStore.user?.profile?.wechat || '未填写' }}</el-descriptions-item>
            <el-descriptions-item label="邮箱">{{ userStore.user?.profile?.email || '未填写' }}</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const getRoleText = (role) => {
  if (role === 'substitute') return '代课者'
  if (role === 'requester') return '需求者'
  return '兼具两者'
}

const getGenderText = (gender) => {
  if (gender === 'male') return '男'
  if (gender === 'female') return '女'
  return '未填写'
}
</script>

<style scoped>
.profile-container {
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
.profile-card {
  max-width: 600px;
  margin: 0 auto;
}
</style>