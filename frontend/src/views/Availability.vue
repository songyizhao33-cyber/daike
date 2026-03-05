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
        <el-card>
          <template #header>
            <div class="card-header">
              <span>选择空闲时间（点击或拖动选择课程格子）</span>
              <el-button type="primary" @click="handleSave" :loading="saving">保存</el-button>
            </div>
          </template>
          <ScheduleSelector v-model="selectedSlots" />
          <div class="selected-info" v-if="selectedSlots.length > 0">
            <el-tag type="success">已选择 {{ selectedSlots.length }} 个时间段</el-tag>
          </div>
        </el-card>

        <el-card style="margin-top: 20px">
          <template #header>
            <div class="card-header">
              <span>我的空闲时间</span>
              <el-button type="primary" @click="loadAvailabilities">刷新</el-button>
            </div>
          </template>
          <el-table :data="availabilities" style="width: 100%">
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
            <el-table-column label="时间范围">
              <template #default="{ row }">
                {{ getTimeRange(row.periods) }}
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
import { ElMessage } from 'element-plus'
import api from '@/utils/request'
import ScheduleSelector from '@/components/ScheduleSelector.vue'
import { SCHEDULE_CONFIG, getPeriodsTimeRange } from '@/utils/schedule'

const selectedSlots = ref([])
const availabilities = ref([])
const saving = ref(false)

const getDayText = (day) => {
  const dayConfig = SCHEDULE_CONFIG.weekDays.find(d => d.value === day)
  return dayConfig ? dayConfig.label : ''
}

const getTimeRange = (periods) => {
  return getPeriodsTimeRange(periods)
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
  } catch (error) {
    console.error(error)
  }
}

const handleSave = async () => {
  if (selectedSlots.value.length === 0) {
    ElMessage.warning('请先选择空闲时间')
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
        isRecurring: true
      })
    }

    ElMessage.success('保存成功')
    loadAvailabilities()
  } catch (error) {
    console.error(error)
  } finally {
    saving.value = false
  }
}

const handleDelete = async (id) => {
  try {
    await api.delete(`/availability/${id}`)
    ElMessage.success('删除成功')
    loadAvailabilities()
  } catch (error) {
    console.error(error)
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
</style>