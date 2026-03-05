<template>
  <div class="schedule-selector">
    <div class="schedule-table">
      <!-- 表头 -->
      <div class="schedule-header">
        <div class="period-column header-cell">节次</div>
        <div
          v-for="day in weekDays"
          :key="day.value"
          class="day-column header-cell"
        >
          {{ day.label }}
        </div>
      </div>

      <!-- 课程格子 -->
      <div
        v-for="period in periods"
        :key="period.period"
        class="schedule-row"
      >
        <div class="period-column period-cell">
          <div class="period-number">{{ period.period }}</div>
          <div class="period-time">{{ period.startTime }}<br>{{ period.endTime }}</div>
        </div>
        <div
          v-for="day in weekDays"
          :key="`${day.value}-${period.period}`"
          class="day-column course-cell"
          :class="{
            'selected': isSelected(day.value, period.period),
            'selecting': isSelecting(day.value, period.period)
          }"
          @mousedown="startSelection(day.value, period.period)"
          @mouseenter="updateSelection(day.value, period.period)"
          @mouseup="endSelection"
        >
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { SCHEDULE_CONFIG } from '@/utils/schedule'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue'])

const weekDays = SCHEDULE_CONFIG.weekDays
const periods = SCHEDULE_CONFIG.periods

const selectedCells = ref(props.modelValue || [])
const isMouseDown = ref(false)
const selectionStart = ref(null)
const selectionEnd = ref(null)
const selectionMode = ref('add') // 'add' or 'remove'

// 检查是否已选中
const isSelected = (day, period) => {
  return selectedCells.value.some(cell => cell.day === day && cell.period === period)
}

// 检查是否在选择范围内
const isSelecting = (day, period) => {
  if (!isMouseDown.value || !selectionStart.value || !selectionEnd.value) return false

  const minDay = Math.min(selectionStart.value.day, selectionEnd.value.day)
  const maxDay = Math.max(selectionStart.value.day, selectionEnd.value.day)
  const minPeriod = Math.min(selectionStart.value.period, selectionEnd.value.period)
  const maxPeriod = Math.max(selectionStart.value.period, selectionEnd.value.period)

  return day >= minDay && day <= maxDay && period >= minPeriod && period <= maxPeriod
}

// 开始选择
const startSelection = (day, period) => {
  isMouseDown.value = true
  selectionStart.value = { day, period }
  selectionEnd.value = { day, period }

  // 判断是添加还是删除模式
  selectionMode.value = isSelected(day, period) ? 'remove' : 'add'
}

// 更新选择范围
const updateSelection = (day, period) => {
  if (!isMouseDown.value) return
  selectionEnd.value = { day, period }
}

// 结束选择
const endSelection = () => {
  if (!isMouseDown.value) return

  const minDay = Math.min(selectionStart.value.day, selectionEnd.value.day)
  const maxDay = Math.max(selectionStart.value.day, selectionEnd.value.day)
  const minPeriod = Math.min(selectionStart.value.period, selectionEnd.value.period)
  const maxPeriod = Math.max(selectionStart.value.period, selectionEnd.value.period)

  const newCells = []
  for (let d = minDay; d <= maxDay; d++) {
    for (let p = minPeriod; p <= maxPeriod; p++) {
      newCells.push({ day: d, period: p })
    }
  }

  if (selectionMode.value === 'add') {
    // 添加模式：合并新选择的格子
    const merged = [...selectedCells.value]
    newCells.forEach(cell => {
      if (!merged.some(c => c.day === cell.day && c.period === cell.period)) {
        merged.push(cell)
      }
    })
    selectedCells.value = merged
  } else {
    // 删除模式：移除选择的格子
    selectedCells.value = selectedCells.value.filter(cell => {
      return !newCells.some(c => c.day === cell.day && c.period === cell.period)
    })
  }

  emit('update:modelValue', selectedCells.value)

  isMouseDown.value = false
  selectionStart.value = null
  selectionEnd.value = null
}

// 监听全局鼠标释放事件
if (typeof window !== 'undefined') {
  window.addEventListener('mouseup', () => {
    if (isMouseDown.value) {
      endSelection()
    }
  })
}
</script>

<style scoped>
.schedule-selector {
  user-select: none;
  overflow-x: auto;
}

.schedule-table {
  display: inline-block;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
}

.schedule-header,
.schedule-row {
  display: flex;
}

.header-cell,
.period-cell,
.course-cell {
  border-right: 1px solid #dcdfe6;
  border-bottom: 1px solid #dcdfe6;
}

.header-cell:last-child,
.course-cell:last-child {
  border-right: none;
}

.schedule-row:last-child .period-cell,
.schedule-row:last-child .course-cell {
  border-bottom: none;
}

.period-column {
  width: 80px;
  min-width: 80px;
}

.day-column {
  width: 100px;
  min-width: 100px;
}

.header-cell {
  background-color: #f5f7fa;
  font-weight: bold;
  padding: 12px 8px;
  text-align: center;
  color: #606266;
}

.period-cell {
  background-color: #fafafa;
  padding: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.period-number {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 4px;
}

.period-time {
  font-size: 11px;
  color: #909399;
  text-align: center;
  line-height: 1.3;
}

.course-cell {
  min-height: 60px;
  cursor: pointer;
  background-color: #fff;
  transition: background-color 0.2s;
}

.course-cell:hover {
  background-color: #f0f9ff;
}

.course-cell.selected {
  background-color: #409eff;
}

.course-cell.selecting {
  background-color: #a0cfff;
}
</style>