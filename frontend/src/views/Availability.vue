<template>
  <div class="availability-container">
    <el-container>
      <el-header>
        <div class="header-content">
          <h1>管理空闲时间</h1>
          <el-button @click="$router.push('/home')">返回首页</el-button>
        </div>
      </el-header>
      <el-main>
        <!-- 添加空闲时间 -->
        <el-card>
          <template #header>
            <div class="card-header">
              <span>添加空闲时间</span>
            </div>
          </template>

          <el-steps :active="currentStep" finish-status="success" style="margin-bottom: 30px">
            <el-step title="选择校区和频率" />
            <el-step title="选择时间段" />
            <el-step title="确认保存" />
          </el-steps>

          <!-- 步骤 1: 选择校区和频率 -->
          <div v-show="currentStep === 0">
            <el-form :model="form" label-width="100px">
              <el-form-item label="校区" required>
                <el-checkbox-group v-model="form.campuses">
                  <el-checkbox label="邯郸">邯郸</el-checkbox>
                  <el-checkbox label="枫林">枫林</el-checkbox>
                  <el-checkbox label="江湾">江湾</el-checkbox>
                  <el-checkbox label="张江">张江</el-checkbox>
                </el-checkbox-group>
                <div class="form-tip">选择你可以代课的校区（可多选）</div>
              </el-form-item>
              <el-form-item label="频率类型" required>
                <el-radio-group v-model="form.frequencyType">
                  <el-radio label="long-term">长期（整学期有效）</el-radio>
                  <el-radio label="short-term">短期（几周内有效）</el-radio>
                  <el-radio label="single">单次（仅一次）</el-radio>
                </el-radio-group>
                <div class="form-tip">选择这个时间安排的有效期</div>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="nextStep">下一步</el-button>
              </el-form-item>
            </el-form>
          </div>

          <!-- 步骤 2: 选择时间段 -->
          <div v-show="currentStep === 1">
            <div class="step-instruction">
              <el-alert
                title="操作提示"
                type="info"
                :closable="false"
                style="margin-bottom: 20px"
              >
                <p>• 点击或拖动鼠标选择你的空闲时间段</p>
                <p>• 再次点击已选中的格子可以取消选择</p>
                <p>• 可以选择多个不连续的时间段</p>
              </el-alert>
            </div>
            <ScheduleSelector v-model="selectedSlots" />
            <div class="selected-info" v-if="selectedSlots.length > 0">
              <el-tag type="success">已选择 {{ selectedSlots.length }} 个时间段</el-tag>
            </div>
            <div style="margin-top: 20px">
              <el-button @click="prevStep">上一步</el-button>
              <el-button type="primary" @click="nextStep" :disabled="selectedSlots.length === 0">
                下一步
              </el-button>
            </div>
          </div>

          <!-- 步骤 3: 确认保存 -->
          <div v-show="currentStep === 2">
            <el-alert
              title="请确认以下信息"
              type="warning"
              :closable="false"
              style="margin-bottom: 20px"
            >
              保存后将覆盖之前的所有空闲时间设置
            </el-alert>
            <el-descriptions :column="1" border>
              <el-descriptions-item label="校区">
                {{ form.campuses.join('、') }}
              </el-descriptions-item>
              <el-descriptions-item label="频率类型">
                {{ getFrequencyText(form.frequencyType) }}
              </el-descriptions-item>
              <el-descriptions-item label="时间段数量">
                {{ selectedSlots.length }} 个
              </el-descriptions-item>
            </el-descriptions>
            <div style="margin-top: 20px">
              <el-button @click="prevStep">上一步</el-button>
              <el-button type="primary" @click="handleSave" :loading="saving">
                确认保存
              </el-button>
            </div>
          </div>
        </el-card>

        <!-- 我的空闲时间列表 -->
        <el-card style="margin-top: 20px">
          <template #header>
            <div class="card-header">
              <span>我的空闲时间</span>
              <el-button type="primary" @click="loadAvailabilities">刷新</el-button>
            </div>
          </template>
          <el-empty v-if="availabilities.length === 0" description="还没有添加空闲时间" />
          <el-table v-else :data="availabilities" style="width: 100%">
            <el-table-column label="星期" width="100">
              <template #default="{ row }">
                {{ getDayText(row.dayOfWeek) }}
              </template>
            </el-table-column>
            <el-table-column label="节次" width="150">
              <template #default="{ row }">
                第 {{ row.periods.join(', ') }} 节
              </template>
            </el-table-column>
            <el-table-column label="时间范围" width="150">
              <template #default="{ row }">
                {{ getTimeRange(row.periods) }}
              </template>
            </el-table-column>
            <el-table-column label="校区" width="150">
              <template #default="{ row }">
                {{ row.campuses.join(', ') }}
              </template>
            </el-table-column>
            <el-table-column label="频率" width="120">
              <template #default="{ row }">
                {{ getFrequencyText(row.frequencyType) }}
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === 'available' ? 'success' : 'info'">
                  {{ row.status === 'available' ? '可用' : row.status }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button type="danger" size="small" @click="handleDelete(row._id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '@/utils/request'
import ScheduleSelector from '@/components/ScheduleSelector.vue'
import { SCHEDULE_CONFIG, getPeriodsTimeRange } from '@/utils/schedule'

const selectedSlots = ref([])
const availabilities = ref([])
const saving = ref(false)
const currentStep = ref(0)

const form = ref({
  campuses: [],
  frequencyType: 'long-term'
})

const getDayText = (day) => {
  const dayConfig = SCHEDULE_CONFIG.weekDays.find(d => d.value === day)
  return dayConfig ? dayConfig.label : ''
}

const getTimeRange = (periods) => {
  return getPeriodsTimeRange(periods)
}

const getFrequencyText = (type) => {
  const map = {
    'long-term': '长期（整学期）',
    'short-term': '短期（几周）',
    'single': '单次'
  }
  return map[type] || type
}

const nextStep = () => {
  if (currentStep.value === 0) {
    if (form.value.campuses.length === 0) {
      ElMessage.warning('请至少选择一个校区')
      return
    }
    if (!form.value.frequencyType) {
      ElMessage.warning('请选择频率类型')
      return
    }
  }
  if (currentStep.value === 1) {
    if (selectedSlots.value.length === 0) {
      ElMessage.warning('请至少选择一个时间段')
      return
    }
  }
  currentStep.value++
}

const prevStep = () => {
  currentStep.value--
}

const loadAvailabilities = async () => {
  try {
    const data = await api.get('/availability/my')
    availabilities.value = data

    // 将已有的空闲时间加载到选择器中
    selectedSlots.value = []
    data.forEach(item => {
      item.periods.forEach(period => {
        selectedSlots.value.push({
          day: item.dayOfWeek,
          period: period
        })
      })
    })

    // 如果有数据，也加载校区和频率信息
    if (data.length > 0) {
      form.value.campuses = data[0].campuses || []
      form.value.frequencyType = data[0].frequencyType || 'long-term'
    }
  } catch (error) {
    console.error(error)
  }
}

const handleSave = async () => {
  try {
    await ElMessageBox.confirm(
      '保存后将覆盖之前的所有空闲时间设置，是否继续？',
      '确认保存',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
  } catch {
    return
  }

  saving.value = true
  try {
    // 按星期分组
    const groupedByDay = {}
    selectedSlots.value.forEach(slot => {
      if (!groupedByDay[slot.day]) {
        groupedByDay[slot.day] = []
      }
      if (!groupedByDay[slot.day].includes(slot.period)) {
        groupedByDay[slot.day].push(slot.period)
      }
    })

    // 先删除所有旧的空闲时间
    await api.delete('/availability/all')

    // 保存新的空闲时间
    for (const [day, periods] of Object.entries(groupedByDay)) {
      await api.post('/availability', {
        dayOfWeek: parseInt(day),
        periods: periods.sort((a, b) => a - b),
        isRecurring: true,
        campuses: form.value.campuses,
        frequencyType: form.value.frequencyType
      })
    }

    ElMessage.success('保存成功')
    currentStep.value = 0
    loadAvailabilities()
  } catch (error) {
    console.error(error)
  } finally {
    saving.value = false
  }
}

const handleDelete = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除这条空闲时间吗？', '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await api.delete(`/availability/${id}`)
    ElMessage.success('删除成功')
    loadAvailabilities()
  } catch (error) {
    if (error !== 'cancel') {
      console.error(error)
    }
  }
}

onMounted(() => {
  loadAvailabilities()
})
</script>

<style scoped>
.availability-container {
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

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.selected-info {
  margin-top: 20px;
  text-align: center;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

.step-instruction {
  margin-bottom: 20px;
}

.step-instruction p {
  margin: 5px 0;
}

@media (max-width: 768px) {
  .header-content h1 {
    font-size: 18px;
  }

  .el-form-item__label {
    width: 80px !important;
  }

  .el-table {
    font-size: 12px;
  }

  .el-button {
    padding: 8px 12px;
    font-size: 12px;
  }

  .el-steps {
    font-size: 12px;
  }
}
</style>