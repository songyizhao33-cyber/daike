import CryptoJS from 'crypto-js'

// 使用 SHA256 对密码进行哈希
export function hashPassword(password) {
  return CryptoJS.SHA256(password).toString()
}

// 注意：这只是客户端哈希，主要目的是避免明文传输
// 服务器端仍然会使用 bcrypt 进行二次加密存储
