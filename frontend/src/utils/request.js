import axios from 'axios'
import { ElMessage } from 'element-plus'

// 关键修改：直接配置后端URL，同时保留环境变量（开发时可通过.env文件覆盖）
const api = axios.create({
  // 优先用环境变量（本地开发），没有则用线上后端URL
  baseURL: import.meta.env.VITE_API_URL || 'https://daike.onrender.com', 
  timeout: 10000,
  withCredentials: true // 配合后端cors的credentials，可选（如果需要传cookie）
})

// 请求拦截器：携带token（原逻辑不变，无需修改）
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器：统一处理返回值和错误（原逻辑不变，无需修改）
api.interceptors.response.use(
  response => response.data,
  error => {
    const message = error.response?.data?.message || '请求失败'
    ElMessage.error(message)
    return Promise.reject(error)
  }
)

export default api