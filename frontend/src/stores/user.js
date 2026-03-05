import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/utils/request'
import { ElMessage } from 'element-plus'

export const useUserStore = defineStore('user', () => {
  const user = ref(null)
  const token = ref(localStorage.getItem('token') || '')

  const login = async (username, password) => {
    try {
      const data = await api.post('/auth/login', { username, password })
      token.value = data.token
      user.value = data.user
      localStorage.setItem('token', data.token)
      ElMessage.success('登录成功')
      return true
    } catch (error) {
      return false
    }
  }

  const register = async (formData) => {
    try {
      const data = await api.post('/auth/register', formData)
      token.value = data.token
      user.value = data.user
      localStorage.setItem('token', data.token)
      ElMessage.success('注册成功')
      return true
    } catch (error) {
      return false
    }
  }

  const logout = () => {
    user.value = null
    token.value = ''
    localStorage.removeItem('token')
    ElMessage.success('已退出登录')
  }

  return { user, token, login, register, logout }
})
