<template>
  <div class="feedback-container">
    <el-card class="feedback-card">
      <template #header>
        <div class="card-header">
          <span>反馈信箱</span>
          <el-button @click="$router.push('/home')" size="small">返回首页</el-button>
        </div>
      </template>

      <el-tabs v-model="activeTab">
        <!-- 提交反馈 -->
        <el-tab-pane label="提交反馈" name="submit">
          <el-form :model="form" label-width="100px" style="max-width: 600px">
            <el-form-item label="反馈类型" required>
              <el-select v-model="form.type" placeholder="选择类型" style="width: 100%">
                <el-option label="Bug反馈" value="bug" />
                <el-option label="功能建议" value="feature" />
                <el-option label="使用建议" value="suggestion" />
                <el-option label="其他" value="other" />
              </el-select>
            </el-form-item>

            <el-form-item label="标题" required>
              <el-input
                v-model="form.title"
                placeholder="简要描述问题或建议"
                maxlength="100"
                show-word-limit
              />
            </el-form-item>

            <el-form-item label="详细内容" required>
              <el-input
                v-model="form.content"
                type="textarea"
                :rows="6"
                placeholder="请详细描述您的问题或建议"
                maxlength="1000"
                show-word-limit
              />
            </el-form-item>

            <el-form-item label="联系方式">
              <el-input
                v-model="form.contactInfo"
                placeholder="如需回复，请留下联系方式（可选）"
              />
            </el-form-item>

            <el-form-item>
              <el-button type="primary" @click="handleSubmit" :loading="submitting">
                提交反馈
              </el-button>
              <el-button @click="resetForm">重置</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 我的反馈 -->
        <el-tab-pane label="我的反馈" name="my">
          <el-button
            type="primary"
            size="small"
            @click="loadMyFeedbacks"
            style="margin-bottom: 15px"
          >
            刷新
          </el-button>

          <el-table :data="myFeedbacks" v-loading="loading">
            <el-table-column prop="title" label="标题" />
            <el-table-column label="类型" width="100">
              <template #default="{ row }">
                {{ getTypeText(row.type) }}
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)">
                  {{ getStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="提交时间" width="180">
              <template #default="{ row }">
                {{ formatDate(row.createdAt) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button
                  type="primary"
                  size="small"
                  @click="viewDetail(row)"
                >
                  查看
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 详情对话框 -->
    <el-dialog
      v-model="detailVisible"
      title="反馈详情"
      width="600px"
    >
      <div v-if="currentFeedback">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="类型">
            {{ getTypeText(currentFeedback.type) }}
          </el-descriptions-item>
          <el-descriptions-item label="标题">
            {{ currentFeedback.title }}
          </el-descriptions-item>
          <el-descriptions-item label="内容">
            {{ currentFeedback.content }}
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(currentFeedback.status)">
              {{ getStatusText(currentFeedback.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="提交时间">
            {{ formatDate(currentFeedback.createdAt) }}
          </el-descriptions-item>
        </el-descriptions>

        <div v-if="currentFeedback.adminReply" class="admin-reply">
          <h4>管理员回复</h4>
          <p>{{ currentFeedback.adminReply.content }}</p>
          <p class="reply-time">
            回复时间：{{ formatDate(currentFeedback.adminReply.repliedAt) }}
          </p>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '../utils/request'

const activeTab = ref('submit')
const form = ref({
  type: 'suggestion',
  title: '',
  content: '',
  contactInfo: ''
})

const submitting = ref(false)
const loading = ref(false)
const myFeedbacks = ref([])
const detailVisible = ref(false)
const currentFeedback = ref(null)

const handleSubmit = async () => {
  if (!form.value.type || !form.value.title || !form.value.content) {
    ElMessage.warning('请填写所有必填项')
    return
  }

  submitting.value = true
  try {
    await request.post('/api/feedback', form.value)
    ElMessage.success('反馈提交成功，感谢您的反馈！')
    resetForm()
    activeTab.value = 'my'
    loadMyFeedbacks()
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '提交失败')
  } finally {
    submitting.value = false
  }
}

const resetForm = () => {
  form.value = {
    type: 'suggestion',
    title: '',
    content: '',
    contactInfo: ''
  }
}

const loadMyFeedbacks = async () => {
  loading.value = true
  try {
    const data = await request.get('/api/feedback/my')
    myFeedbacks.value = data
  } catch (error) {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

const viewDetail = (feedback) => {
  currentFeedback.value = feedback
  detailVisible.value = true
}

const getTypeText = (type) => {
  const map = {
    bug: 'Bug反馈',
    feature: '功能建议',
    suggestion: '使用建议',
    other: '其他'
  }
  return map[type] || type
}

const getStatusText = (status) => {
  const map = {
    pending: '待处理',
    read: '已读',
    replied: '已回复',
    resolved: '已解决'
  }
  return map[status] || status
}

const getStatusType = (status) => {
  const map = {
    pending: 'info',
    read: 'warning',
    replied: 'success',
    resolved: 'success'
  }
  return map[status] || 'info'
}

const formatDate = (date) => {
  return new Date(date).toLocaleString('zh-CN')
}

onMounted(() => {
  loadMyFeedbacks()
})
</script>

<style scoped>
.feedback-container {
  max-width: 1000px;
  margin: 20px auto;
  padding: 20px;
}

.feedback-card {
  min-height: 500px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 18px;
  font-weight: bold;
}

.admin-reply {
  margin-top: 20px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 8px;
}

.admin-reply h4 {
  margin-top: 0;
  color: #409eff;
}

.reply-time {
  margin-top: 10px;
  font-size: 12px;
  color: #909399;
}

@media (max-width: 768px) {
  .feedback-container {
    padding: 10px;
  }
}
</style>
