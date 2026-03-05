// 课表配置
export const SCHEDULE_CONFIG = {
  // 星期配置
  weekDays: [
    { value: 1, label: '周一' },
    { value: 2, label: '周二' },
    { value: 3, label: '周三' },
    { value: 4, label: '周四' },
    { value: 5, label: '周五' },
    { value: 6, label: '周六' }
  ],

  // 节次配置（根据课表图片）
  periods: [
    { period: 1, startTime: '08:00', endTime: '08:45' },
    { period: 2, startTime: '08:55', endTime: '09:40' },
    { period: 3, startTime: '09:55', endTime: '10:40' },
    { period: 4, startTime: '10:50', endTime: '11:35' },
    { period: 5, startTime: '11:45', endTime: '12:30' },
    { period: 6, startTime: '13:30', endTime: '14:15' },
    { period: 7, startTime: '14:25', endTime: '15:10' },
    { period: 8, startTime: '15:25', endTime: '16:10' },
    { period: 9, startTime: '16:20', endTime: '17:05' },
    { period: 10, startTime: '17:15', endTime: '18:00' },
    { period: 11, startTime: '18:30', endTime: '19:15' },
    { period: 12, startTime: '19:25', endTime: '20:10' },
    { period: 13, startTime: '20:20', endTime: '21:05' },
    { period: 14, startTime: '21:15', endTime: '22:00' }
  ]
}

// 获取节次时间范围文本
export function getPeriodTimeText(period) {
  const config = SCHEDULE_CONFIG.periods.find(p => p.period === period)
  return config ? `${config.startTime}-${config.endTime}` : ''
}

// 获取多个节次的时间范围
export function getPeriodsTimeRange(periods) {
  if (!periods || periods.length === 0) return ''
  const sortedPeriods = [...periods].sort((a, b) => a - b)
  const firstPeriod = SCHEDULE_CONFIG.periods.find(p => p.period === sortedPeriods[0])
  const lastPeriod = SCHEDULE_CONFIG.periods.find(p => p.period === sortedPeriods[sortedPeriods.length - 1])
  return `${firstPeriod.startTime}-${lastPeriod.endTime}`
}
