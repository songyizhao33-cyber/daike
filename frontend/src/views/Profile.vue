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
            <div class="card-header">
              <span>基本信息</span>
              <el-button v-if="!isEditing" type="primary" @click="startEdit">编辑资料</el-button>
              <div v-else class="header-actions">
                <el-button @click="cancelEdit">取消</el-button>
                <el-button type="primary" @click="saveProfile" :loading="saving">保存</el-button>
              </div>
            </div>
          </template>

          <el-descriptions v-if="!isEditing" :column="1" border>
            <el-descriptions-item label="用户名">{{ userStore.user?.username }}</el-descriptions-item>
            <el-descriptions-item label="角色">{{ getRoleText(userStore.user?.role) }}</el-descriptions-item>
            <el-descriptions-item label="性别">{{ getGenderText(userStore.user?.profile?.gender) }}</el-descriptions-item>
            <el-descriptions-item label="专业">{{ userStore.user?.profile?.major || '未填写' }}</el-descriptions-item>
            <el-descriptions-item label="年级">{{ userStore.user?.profile?.grade || '未填写' }}</el-descriptions-item>
            <el-descriptions-item label="电话">{{ userStore.user?.profile?.phone || '未填写' }}</el-descriptions-item>
            <el-descriptions-item label="微信">{{ userStore.user?.profile?.wechat || '未填写' }}</el-descriptions-item>
            <el-descriptions-item label="邮箱">{{ userStore.user?.profile?.email || '未填写' }}</el-descriptions-item>
          </el-descriptions>

          <el-form v-else :model="editForm" label-width="100px">
            <el-form-item label="用户名">
              <el-input v-model="editForm.username" disabled />
            </el-form-item>
            <el-form-item label="角色">
              <el-select v-model="editForm.role" style="width: 100%">
                <el-option label="空闲者" value="substitute" />
                <el-option label="需求方" value="requester" />
                <el-option label="都可以" value="both" />
              </el-select>
            </el-form-item>
            <el-form-item label="性别">
              <el-select v-model="editForm.profile.gender" style="width: 100%">
                <el-option label="男" value="male" />
                <el-option label="女" value="female" />
                <el-option label="其他" value="other" />
              </el-select>
            </el-form-item>
            <el-form-item label="专业">
              <el-input v-model="editForm.profile.major" />
            </el-form-item>
            <el-form-item label="年级">
              <el-input v-model="editForm.profile.grade" />
            </el-form-item>
            <el-form-item label="电话">
              <el-input v-model="editForm.profile.phone" />
            </el-form-item>
            <el-form-item label="微信">
              <el-input v-model="editForm.profile.wechat" />
            </el-form-item>
            <el-form-item label="邮箱">
              <el-input v-model="editForm.profile.email" />
            </el-form-item>
          </el-form>
        </el-card>

        <el-card class="danger-zone" style="margin-top: 20px; max-width: 760px; margin-left: auto; margin-right: auto;">
          <template #header>
            <span style="color: #f56c6c;">危险操作</span>
          </template>
          <el-button type="danger" @click="handleDeleteAccount">注销账号</el-button>
          <div class="form-tip" style="margin-top: 10px;">注销后，你的空闲、代课、约饭和互动记录都会被删除。</div>
        </el-card>
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '@/utils/request'

const router = useRouter()
const userStore = useUserStore()
const isEditing = ref(false)
const saving = ref(false)

const editForm = ref({
  username: '',
  role: '',
  profile: {
    gender: '',
    major: '',
    grade: '',
    phone: '',
    wechat: '',
    email: ''
  }
})

const getRoleText = (role) => {
  const map = { substitute: '空闲者', requester: '需求方', both: '都可以', admin: '管理员' }
  return map[role] || role
}

const getGenderText = (gender) => {
  const map = { male: '男', female: '女', other: '其他' }
  return map[gender] || '未填写'
}

const startEdit = () => {
  editForm.value = {
    username: userStore.user.username,
    role: userStore.user.role || 'both',
    profile: {
      gender: userStore.user.profile?.gender || '',
      major: userStore.user.profile?.major || '',
      grade: userStore.user.profile?.grade || '',
      phone: userStore.user.profile?.phone || '',
      wechat: userStore.user.profile?.wechat || '',
      email: userStore.user.profile?.email || ''
    }
  }
  isEditing.value = true
}

const cancelEdit = () => {
  isEditing.value = false
}

const saveProfile = async () => {
  if (!editForm.value.profile.wechat && !editForm.value.profile.email) {
    ElMessage.error('微信和邮箱至少填写一项')
    return
  }

  saving.value = true
  try {
    const data = await api.put('/auth/profile', {
      role: editForm.value.role,
      profile: editForm.value.profile
    })
    userStore.user = data.user
    ElMessage.success('保存成功')
    isEditing.value = false
  } catch (error) {
    console.error(error)
  } finally {
    saving.value = false
  }
}

const handleDeleteAccount = async () => {
  try {
    await ElMessageBox.confirm(
      '确认注销账号吗？该操作会删除你的空闲、代课、约饭和互动记录，且无法恢复。',
      '确认注销',
      {
        confirmButtonText: '确认注销',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )

    await api.delete('/auth/account')
    ElMessage.success('账号已注销')
    userStore.logout()
    router.push('/login')
  } catch (error) {
    if (error !== 'cancel') {
      console.error(error)
    }
  }
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

.header-content h1 {
  margin: 0;
  font-size: 24px;
}

.profile-card {
  max-width: 760px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

.danger-zone {
  border: 1px solid #f56c6c;
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
