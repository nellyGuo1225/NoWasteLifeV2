# 快速部署指南

## 最簡單的部署方式：Render

### 1. 準備工作
- [ ] 確保代碼已推送到 GitHub
- [ ] 準備好 Gemini API Key

### 2. 部署後端（5分鐘）

1. 訪問 https://render.com 並註冊
2. 點擊 "New +" → "Web Service"
3. 連接 GitHub 倉庫
4. 設置：
   - **Name**: 不廢人生實驗室-api
   - **Environment**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn server:app`
5. 添加環境變數：
   - `GEMINI_API_KEY`: 你的 API Key
6. 點擊 "Create Web Service"
7. 等待部署完成，記下你的後端 URL（例如：`https://your-app.onrender.com`）

### 3. 部署前端（5分鐘）

1. 在 Render 點擊 "New +" → "Static Site"
2. 連接同一個 GitHub 倉庫
3. 設置：
   - **Name**: 不廢人生實驗室
   - **Build Command**: (留空)
   - **Publish Directory**: `.`（必填，表示根目錄）
4. 點擊 "Create Static Site"
5. 等待部署完成

### 4. 更新前端 API 配置

如果前端和後端不在同一個域名，需要更新 `app.js`：

```javascript
// 在 app.js 開頭，將 API_BASE_URL 改為你的後端 URL
const API_BASE_URL = 'https://your-app.onrender.com';
```

### 5. 完成！

訪問你的前端 URL，開始使用！

## 其他部署平台

詳細說明請查看 `DEPLOY.md`

## 常見問題

**Q: 後端部署後無法訪問？**
A: 檢查環境變數是否正確設置，特別是 `GEMINI_API_KEY`

**Q: 前端調用 API 失敗？**
A: 檢查 CORS 設置，確保 `FRONTEND_URL` 環境變數設置正確

**Q: 圖片無法顯示？**
A: 確保 `images/` 資料夾中的所有文件都包含在 Git 倉庫中

