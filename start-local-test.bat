@echo off
REM Windows 批处理脚本 - 本地测试启动
REM 使用方法：双击运行或在命令提示符中运行 start-local-test.bat

echo ================================
echo 代课匹配系统 - 本地测试启动
echo ================================
echo.

REM 检查是否在项目根目录
if not exist "backend" (
    echo ❌ 错误：请在项目根目录运行此脚本
    pause
    exit /b 1
)

if not exist "frontend" (
    echo ❌ 错误：请在项目根目录运行此脚本
    pause
    exit /b 1
)

echo 📦 检查依赖...

REM 检查后端依赖
if not exist "backend\node_modules" (
    echo 安装后端依赖...
    cd backend
    call npm install
    cd ..
)

REM 检查前端依赖
if not exist "frontend\node_modules" (
    echo 安装前端依赖...
    cd frontend
    call npm install
    cd ..
)

echo.
echo ✅ 依赖检查完成
echo.
echo 🚀 正在启动服务...
echo.
echo 后端服务将在 http://localhost:3000 启动
echo 前端服务将在 http://localhost:5173 启动
echo.

REM 启动后端（在新窗口）
start "后端服务" cmd /k "cd backend && npm run dev"

REM 等待2秒
timeout /t 2 /nobreak >nul

REM 启动前端（在新窗口）
start "前端服务" cmd /k "cd frontend && npm run dev"

echo.
echo ================================
echo ✅ 服务已启动！
echo ================================
echo.
echo 两个新窗口已打开：
echo   - 后端服务窗口
echo   - 前端服务窗口
echo.
echo 请等待服务启动完成后，在浏览器访问：
echo   http://localhost:5173
echo.
echo 测试完成后，关闭两个服务窗口即可停止服务
echo.
pause
