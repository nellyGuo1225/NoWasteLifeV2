@echo off
echo ========================================
echo 啟動 AI 任務拆解後端服務器
echo ========================================
echo.

REM 檢查 .env 文件是否存在
if not exist .env (
    echo [警告] 未找到 .env 文件！
    echo 請創建 .env 文件並添加您的 GEMINI_API_KEY
    echo 範例：GEMINI_API_KEY=your_api_key_here
    echo.
    pause
)

REM 檢查是否已安裝依賴
python -c "import flask" 2>nul
if errorlevel 1 (
    echo [提示] 正在安裝 Python 依賴...
    pip install -r requirements.txt
    echo.
)

echo 正在啟動服務器...
echo 服務器將在 http://localhost:5000 運行
echo 按 Ctrl+C 停止服務器
echo.
python server.py

