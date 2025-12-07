# Render Web Service 設置指南

## 創建 Web Service 時需要填寫的欄位

### 基本設置

1. **Name（名稱）**
   - 填寫：`不廢人生實驗室-api` 或 `nofeelife-api`
   - 這是你服務的唯一標識，會出現在 URL 中

2. **Environment（環境）**
   - 選擇：`Python 3`
   - Render 會自動檢測 Python 項目

3. **Region（地區）**
   - 選擇：`Singapore`（新加坡，離台灣最近）或 `Oregon`（美國西岸）
   - 根據你的用戶位置選擇

4. **Branch（分支）**
   - 選擇：`main` 或 `master`（根據你的 Git 倉庫主分支名稱）

### 構建和啟動命令

5. **Build Command（構建命令）**
   ```
   pip install -r requirements.txt
   ```
   - 這會安裝所有 Python 依賴

6. **Start Command（啟動命令）**
   ```
   gunicorn server:app
   ```
   - 使用 gunicorn 啟動 Flask 應用
   - 注意：如果使用 `python server.py`，需要確保 server.py 中有 `if __name__ == '__main__'` 的判斷

### 計劃選擇

7. **Plan（計劃）**
   - 選擇：`Free`（免費計劃）
   - 免費計劃適合測試和小型應用
   - 注意：免費計劃在 15 分鐘無活動後會休眠

### 環境變數設置

8. **Environment Variables（環境變數）**
   點擊 "Add Environment Variable" 添加：

   **必需變數：**
   - **Key**: `GEMINI_API_KEY`
   - **Value**: 你的 Google Gemini API Key（從 Google AI Studio 獲取）

   **可選變數：**
   - **Key**: `PORT`
   - **Value**: `10000`（Render 會自動設置，但可以明確指定）
   
   - **Key**: `FLASK_DEBUG`
   - **Value**: `False`（生產環境不應啟用調試模式）
   
   - **Key**: `FRONTEND_URL`
   - **Value**: 你的前端 URL（例如：`https://your-frontend.onrender.com`）
   - 用於 CORS 配置

### 高級設置（可選）

9. **Health Check Path（健康檢查路徑）**
   - 填寫：`/health`
   - 這是我們在 server.py 中設置的健康檢查端點

10. **Auto-Deploy（自動部署）**
    - 勾選：`Yes`（當你推送代碼到 GitHub 時自動重新部署）

## 完整設置示例

```
Name: nofeelife-api
Environment: Python 3
Region: Singapore
Branch: main
Build Command: pip install -r requirements.txt
Start Command: gunicorn server:app
Plan: Free

Environment Variables:
  GEMINI_API_KEY = your_actual_api_key_here
  FLASK_DEBUG = False
  PORT = 10000
```

## 部署後

1. **等待構建完成**
   - 通常需要 2-5 分鐘
   - 可以在 Logs 標籤查看構建進度

2. **檢查服務狀態**
   - 訪問 `https://your-app-name.onrender.com/health`
   - 應該返回：`{"status":"ok","gemini_configured":true}`

3. **查看日誌**
   - 在 Dashboard → Logs 查看實時日誌
   - 確認沒有錯誤訊息

## 常見問題

**Q: Build Command 失敗？**
A: 檢查 `requirements.txt` 是否包含所有依賴，確保文件在倉庫根目錄

**Q: Start Command 失敗？**
A: 確認 `server.py` 文件存在，且 `app` 對象已正確定義

**Q: 服務無法啟動？**
A: 檢查環境變數是否正確設置，特別是 `GEMINI_API_KEY`

**Q: 如何查看錯誤日誌？**
A: 在 Render Dashboard → Logs 標籤查看詳細錯誤信息

