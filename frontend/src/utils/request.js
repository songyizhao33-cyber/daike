import axios from 'axios'
import { ElMessage } from 'element-plus'

// 配置后端 API 地址
// 生产环境：使用后端服务的 URL
// 开发环境：使用本地代理（通过 vite.config.js 配置）
const api = axios.create({
  baseURL: import.meta.env.DEV ? '/api' : 'https://daike.onrender.com/api',
  timeout: 10000,
  withCredentials: false, // 改为 false，避免 CORS 复杂化
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器：携带token
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

// 响应拦截器：统一处理返回值和错误
api.interceptors.response.use(
  response => {
    // 处理 204 No Content 等没有响应体的情况
    return response.data || {}
  },
  error => {
    const message = error.response?.data?.message || '请求失败'
    ElMessage.error(message)
    return Promise.reject(error)
  }
)

export default api