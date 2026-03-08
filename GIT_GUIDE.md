# Git 提交和推送脚本

## 首次设置

如果您还没有将代码推送到 GitHub，请按以下步骤操作：

### 1. 在 GitHub 创建新仓库

1. 访问 https://github.com/new
2. 仓库名称：`substitute-matching`（或您喜欢的名称）
3. 选择 "Private" 或 "Public"
4. **不要**勾选 "Initialize this repository with a README"
5. 点击 "Create repository"

### 2. 初始化本地仓库并推送

在项目根目录（D:\代课匹配）打开 Git Bash 或命令行，执行：

```bash
# 初始化 git 仓库（如果还没有）
git init

# 添加所有文件
git add .

# 创建首次提交
git commit -m "完整功能实现：代课匹配、约饭、塔罗牌、信箱、回访"

# 添加远程仓库（替换为您的 GitHub 仓库地址）
git remote add origin https://github.com/你的用户名/substitute-matching.git

# 推送到 GitHub
git branch -M main
git push -u origin main
```

## 后续更新

每次修改代码后，执行以下命令推送更新：

```bash
# 查看修改的文件
git status

# 添加所有修改
git add .

# 创建提交（修改提交信息）
git commit -m "描述您的修改"

# 推送到 GitHub
git push origin main
```

## 常用 Git 命令

```bash
# 查看当前状态
git status

# 查看提交历史
git log --oneline

# 查看远程仓库
git remote -v

# 拉取最新代码
git pull origin main

# 创建新分支
git checkout -b feature-name

# 切换分支
git checkout main

# 合并分支
git merge feature-name

# 删除分支
git branch -d feature-name
```

## .gitignore 文件

确保项目根目录有 `.gitignore` 文件，内容如下：

```
# 依赖
node_modules/
package-lock.json

# 环境变量
.env
.env.local
.env.production

# 构建输出
frontend/dist/
frontend/.vite/

# 日志
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# 编辑器
.vscode/
.idea/
*.swp
*.swo
*~

# 操作系统
.DS_Store
Thumbs.db

# 临时文件
*.tmp
*.temp
