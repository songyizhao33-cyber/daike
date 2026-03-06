<template>
  <div class="register-container">
    <el-card class="register-card">
      <h2>用户注册</h2>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="form.role" style="width: 100%">
            <el-option label="代课者" value="substitute" />
            <el-option label="需求者" value="requester" />
            <el-option label="两者都是" value="both" />
          </el-select>
        </el-form-item>
        <el-form-item label="性别" prop="gender">
          <el-select v-model="form.profile.gender" style="width: 100%">
            <el-option label="男" value="male" />
            <el-option label="女" value="female" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="专业" prop="major">
          <el-input v-model="form.profile.major" />
        </el-form-item>
        <el-form-item label="年级" prop="grade">
          <el-input v-model="form.profile.grade" />
        </el-form-item>
        <el-form-item label="手机" prop="phone">
          <el-input v-model="form.profile.phone" />
        </el-form-item>
        <el-form-item label="微信号" prop="wechat">
          <el-input v-model="form.profile.wechat" placeholder="微信号和邮箱至少填写一项" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.profile.email" placeholder="微信号和邮箱至少填写一项" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleRegister" :loading="loading">
            注册
          </el-button>
          <el-button @click="$router.push('/login')">
            返回登录
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

const form = ref({
  username: '',
  password: '',
  role: 'both',
  profile: {
    gender: '',
    major: '',
    grade: '',
    phone: '',
    wechat: '',
    email: ''
  }
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }]
}

const formRef = ref(null)
const loading = ref(false)

const handleRegister = async () => {
  // 验证微信号或邮箱至少填写一项
  if (!form.value.profile.wechat && !form.value.profile.email) {
    ElMessage.error('微信号和邮箱至少需要填写一项')
    return
  }

  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      const success = await userStore.register(form.value)
      loading.value = false
      if (success) {
        router.push('/home')
      }
    }
  })
}
</script>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.register-card {
  width: 500px;
  padding: 20px;
}

h2 {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
}

@media (max-width: 768px) {
  .register-card {
    width: 95%;
    max-width: 500px;
    padding: 15px;
  }

  h2 {
    font-size: 20px;
    margin-bottom: 20px;
  }

  .el-form-item__label {
    font-size: 14px;
  }
}
</style>
