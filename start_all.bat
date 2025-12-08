@echo off
echo ========================================
echo 啟動本地前後端服務器
echo ========================================
echo.

REM 檢查 .env 文件是否存在
if not exist .env (
    echo [警告] 未找到 .env 文件！
    echo 請創建 .env 文件並添加您的 GEMINI_API_KEY
    echo 範例：GEMINI_API_KEY=your_api_key_here
    echo.
    pause
    exit /b 1
)

REM 檢查是否已安裝 Python 依賴
python -c "import flask" 2>nul
if errorlevel 1 (
    echo [提示] 正在安裝 Python 依賴...
    pip install -r requirements.txt
    echo.
)

echo ========================================
echo 正在啟動服務器...
echo ========================================
echo.
echo 後端服務器：http://localhost:5000
echo 前端服務器：http://localhost:8000
echo.
echo 按 Ctrl+C 停止所有服務器
echo ========================================
echo.

REM 在新的命令窗口中啟動後端
start "後端服務器 (端口 5000)" cmd /k "python server.py"

REM 等待 2 秒讓後端啟動
timeout /t 2 /nobreak >nul

REM 在新的命令窗口中啟動前端
start "前端服務器 (端口 8000)" cmd /k "python -m http.server 8000"

echo.
echo ✅ 服務器已啟動！
echo.
echo 後端：http://localhost:5000
echo 前端：http://localhost:8000
echo.
echo 請在瀏覽器中訪問：http://localhost:8000
echo.
echo 要停止服務器，請關閉對應的命令窗口
echo.
pause

