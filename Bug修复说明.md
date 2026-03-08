# Bug 修复说明

## 修复时间
2026-03-08

## 修复的问题

### 1. 塔罗牌功能 Bug

**问题描述：**
- 点击"抽取塔罗牌"按钮后出现"请求失败"和"抽取失败"的错误提示
- 无法正常抽取塔罗牌

**问题原因：**
- API 路径错误：使用了 `/api/tarot/draw` 而不是 `/tarot/draw`
- 响应数据结构理解错误：`request.js` 的响应拦截器已经返回了 `response.data`，所以不需要再访问 `.data.tarot`

**修复方案：**
```javascript
// 修复前
const response = await request.post('/api/tarot/draw');
drawnCard.value = response.data.tarot;

// 修复后
const data = await request.post('/tarot/draw');
drawnCard.value = data.tarot;
```

**修复文件：**
- `frontend/src/views/Tarot.vue`

### 2. 首页卡片高度不一致

**问题描述：**
- "约饭"卡片比"空闲时间"和"寻找代课"卡片略短
- 视觉上不够整齐美观

**问题原因：**
- "约饭"卡片的描述文字较短（"寻找饭搭子"），导致卡片内容高度不一致
- 没有设置最小高度约束

**修复方案：**
1. 为主要功能卡片添加 `min-height: 220px`
2. 使用 `display: flex` 和 `justify-content: center` 使内容垂直居中
3. 增加"约饭"卡片的描述文字长度

```css
/* 修复前 */
.feature-card.primary {
  padding: 40px 20px;
  background: white;
}

/* 修复后 */
.feature-card.primary {
  padding: 40px 20px;
  background: white;
  min-height: 220px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
```

```html
<!-- 修复前 -->
<h3>约饭</h3>
<p>寻找饭搭子</p>

<!-- 修复后 -->
<h3>约饭</h3>
<p>寻找饭搭子，一起吃饭</p>
```

**修复文件：**
- `frontend/src/views/Home.vue`

### 3. 塔罗牌页面用户体验优化

**优化内容：**
- 添加"返回首页"按钮，方便用户导航
- 调整卡片头部布局，使标题和按钮左右对齐

**修复文件：**
- `frontend/src/views/Tarot.vue`

## 测试建议

### 测试塔罗牌功能
1. 启动前端和后端服务
2. 登录系统
3. 进入"塔罗占卜"页面
4. 点击"抽取塔罗牌"按钮
5. 验证：
   - 能够成功抽取塔罗牌
   - 显示塔罗牌图片
   - 显示正位/逆位
   - 显示牌意解释
   - 星辰正位显示特殊消息

### 测试首页卡片
1. 访问首页
2. 验证：
   - 三张主要功能卡片高度一致
   - 卡片内容垂直居中
   - 悬停动画正常
   - 响应式布局正常

## 相关文件

- `frontend/src/views/Tarot.vue` - 塔罗牌页面
- `frontend/src/views/Home.vue` - 首页
- `frontend/src/utils/request.js` - API 请求工具（未修改，仅供参考）

## 注意事项

1. **API 路径规范**：
   - 在 `request.js` 中已经配置了 `baseURL: '/api'`
   - 所以在调用 API 时，路径应该是 `/tarot/draw` 而不是 `/api/tarot/draw`
   - 完整路径会自动拼接为 `/api/tarot/draw`

2. **响应数据结构**：
   - `request.js` 的响应拦截器返回 `response.data`
   - 所以 `await request.post()` 直接返回的就是后端的响应数据
   - 不需要再访问 `.data` 属性

3. **卡片高度统一**：
   - 使用 `min-height` 确保卡片最小高度
   - 使用 `flex` 布局使内容垂直居中
   - 保持描述文字长度相近

## 后续建议

1. **统一 API 调用方式**：检查其他页面的 API 调用，确保都遵循相同的模式
2. **添加错误边界**：在塔罗牌页面添加更详细的错误提示
3. **加载状态优化**：考虑添加骨架屏或更好的加载动画
4. **响应式优化**：测试不同屏幕尺寸下的显示效果

---

**修复状态：** ✅ 已完成
**测试状态：** 待测试
