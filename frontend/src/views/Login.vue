<template>
  <div class="login-container">
    <el-card class="login-card">
      <h2>代课匹配系统</h2>
      <el-form :model="form" :rules="rules" ref="formRef">
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="用户名" prefix-icon="User" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="form.password" type="password" placeholder="密码" prefix-icon="Lock" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleLogin" :loading="loading" style="width: 100%">
            登录
          </el-button>
        </el-form-item>
        <el-form-item>
          <el-button text @click="$router.push('/register')" style="width: 100%">
            还没有账号？立即注册
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 声明弹窗 -->
    <el-dialog v-model="showDisclaimer" title="平台声明" width="500px" :close-on-click-modal="false">
      <div class="disclaimer-content">
        <p>本平台仅供匹配，有意向请通过微信/邮箱联系。</p>
      </div>
      <template #footer>
        <el-button type="primary" @click="showDisclaimer = false">我知道了</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const form = ref({
  username: '',
  password: ''
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const formRef = ref(null)
const loading = ref(false)
const showDisclaimer = ref(false)

onMounted(() => {
  showDisclaimer.value = true
})

const handleLogin = async () => {
  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      const success = await userStore.login(form.value.username, form.value.password)
      loading.value = false
      if (success) {
        router.push('/home')
      }
    }
  })
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  width: 400px;
  padding: 20px;
}

h2 {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
}

.disclaimer-content {
  text-align: center;
  font-size: 16px;
  line-height: 1.8;
  color: #333;
}

.disclaimer-content p {
  margin: 20px 0;
}
</style>
