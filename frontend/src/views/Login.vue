<template>
  <div class="login-container">
    <el-card class="login-card">
      <h2>代课匹配系统</h2>
      <el-form :model="form" :rules="rules" ref="formRef">
        <el-form-item prop="identifier">
          <el-input v-model="form.identifier" placeholder="用户名 / 微信号 / 邮箱" prefix-icon="User" />
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
    <el-dialog v-model="showDisclaimer" title="平台使用声明与免责条款" width="600px" :close-on-click-modal="false">
      <div class="disclaimer-content">
        <h3>一、平台性质</h3>
        <p>本平台仅作为信息匹配工具，为用户提供代课需求和空闲时间的匹配服务。平台不参与任何实际交易或服务提供。</p>

        <h3>二、用户责任</h3>
        <p>1. 用户应确保提供的个人信息真实、准确、完整</p>
        <p>2. 用户应自行核实匹配对象的身份和资质</p>
        <p>3. 用户之间的所有交易、协议和纠纷由双方自行协商解决</p>
        <p>4. 用户应遵守学校相关规定，不得从事违规违纪行为</p>

        <h3>三、平台免责</h3>
        <p>1. 平台不对用户提供信息的真实性、准确性负责</p>
        <p>2. 平台不对用户之间的交易结果、服务质量承担责任</p>
        <p>3. 平台不对因使用本服务产生的任何直接或间接损失负责</p>
        <p>4. 平台不对第三方侵权行为承担责任</p>

        <h3>四、隐私保护</h3>
        <p>1. 联系方式仅在用户主动选择代课者后显示</p>
        <p>2. 请勿将他人联系方式用于骚扰、诈骗等不当用途</p>
        <p>3. 平台会记录联系方式查看日志，防止滥用</p>

        <h3>五、风险提示</h3>
        <p>1. 请通过平台提供的联系方式（微信/邮箱）进行沟通</p>
        <p>2. 谨防诈骗，不要轻易转账或提供敏感信息</p>
        <p>3. 建议面对面确认身份后再进行交易</p>
        <p>4. 如遇纠纷，请及时向学校相关部门反映</p>

        <p style="margin-top: 20px; font-weight: bold;">使用本平台即表示您已阅读并同意以上条款</p>
      </div>
      <template #footer>
        <el-button type="primary" @click="showDisclaimer = false">我已阅读并同意</el-button>
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
  identifier: '',
  password: ''
})

const rules = {
  identifier: [{ required: true, message: '请输入用户名/微信号/邮箱', trigger: 'blur' }],
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
      const success = await userStore.login(form.value.identifier, form.value.password)
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
  font-size: 14px;
  line-height: 1.8;
  color: #333;
  max-height: 60vh;
  overflow-y: auto;
}

.disclaimer-content h3 {
  margin-top: 15px;
  margin-bottom: 10px;
  color: #409eff;
  font-size: 16px;
}

.disclaimer-content p {
  margin: 8px 0;
  padding-left: 10px;
}

@media (max-width: 768px) {
  .login-card {
    width: 90%;
    max-width: 400px;
    padding: 15px;
  }

  h2 {
    font-size: 20px;
    margin-bottom: 20px;
  }

  .el-dialog {
    width: 90% !important;
  }
}
</style>
