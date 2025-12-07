# Render Static Site 設置指南

## 創建 Static Site 時需要填寫的欄位

### 基本設置

1. **Name（名稱）**
   - 填寫：`不廢人生實驗室` 或 `nofeelife`
   - 這是你網站的名稱，會出現在 URL 中
   - 例如：`https://nofeelife.onrender.com`

2. **Repository（倉庫）**
   - 選擇：連接你的 GitHub 倉庫
   - 確保倉庫已推送到 GitHub

3. **Branch（分支）**
   - 選擇：`main` 或 `master`（根據你的 Git 倉庫主分支名稱）

4. **Root Directory（根目錄）**
   - **留空** 或 填寫：`.`（表示倉庫根目錄）
   - 因為所有 HTML 文件都在根目錄

### 構建設置

5. **Build Command（構建命令）**
   - **留空**（因為是靜態文件，不需要構建）
   - 或者填寫：`echo "No build needed"`

6. **Publish Directory（發布目錄）**
   - **必填**：填寫 `.`（表示根目錄/當前目錄）
   - 因為所有 HTML、CSS、JS 文件都在倉庫根目錄

### 計劃選擇

7. **Plan（計劃）**
   - 選擇：`Free`（免費計劃）
   - 免費計劃完全足夠靜態網站使用

### 環境變數（可選）

8. **Environment Variables（環境變數）**
   - 通常不需要設置環境變數
   - 但如果需要，可以添加：
     - **Key**: `API_BASE_URL`
     - **Value**: 你的後端 API URL（例如：`https://nofeelife-api.onrender.com`）
   - 注意：這需要在代碼中讀取，目前 `app.js` 會自動檢測

### 高級設置（可選）

9. **Headers（HTTP 標頭）**
   - 通常不需要設置
   - 如果需要 CORS 或其他標頭，可以在這裡添加

10. **Redirects/Rewrites（重定向/重寫）**
    - 通常不需要設置
    - 如果需要 SPA（單頁應用）路由，可以添加：
      ```
      /*    /index.html   200
      ```

11. **Auto-Deploy（自動部署）**
    - 勾選：`Yes`（當你推送代碼到 GitHub 時自動重新部署）

## 完整設置示例

```
Name: nofeelife
Repository: [你的 GitHub 倉庫]
Branch: main
Root Directory: (留空)
Build Command: (留空)
Publish Directory: .
Plan: Free
Auto-Deploy: Yes
```

## 部署後

1. **等待部署完成**
   - 通常需要 1-2 分鐘
   - 可以在 Logs 標籤查看部署進度

2. **訪問網站**
   - 訪問 `https://your-site-name.onrender.com`
   - 應該能看到首頁

3. **檢查功能**
   - 測試各個頁面是否正常
   - 檢查圖片是否正常顯示
   - 測試 API 調用是否正常

## 重要注意事項

### 如果前端和後端分開部署

如果後端部署在不同的 URL（例如：`https://nofeelife-api.onrender.com`），需要更新 `app.js`：

```javascript
// 在 app.js 開頭（約第 3 行）
const API_BASE_URL = 'https://nofeelife-api.onrender.com';
```

或者使用環境變數（需要在 Render 設置環境變數，並在構建時注入）。

### 文件結構檢查

確保以下文件都在 Git 倉庫中：
- ✅ `index.html`
- ✅ `tasks.html`
- ✅ `fun.html`
- ✅ `ai-breakdown.html`
- ✅ `ai-diagnosis.html`
- ✅ `rewards.html`
- ✅ `gacha.html`
- ✅ `app.html`
- ✅ `app.js`
- ✅ `app.css`
- ✅ `style.css`
- ✅ `script.js`
- ✅ `images/` 資料夾及其所有內容

### 常見問題

**Q: 網站顯示 404 錯誤？**
A: 檢查 `Publish Directory` 是否正確設置，確保 HTML 文件在正確的位置

**Q: 圖片無法顯示？**
A: 確保 `images/` 資料夾中的所有文件都包含在 Git 倉庫中，並且路徑正確

**Q: API 調用失敗？**
A: 檢查 `app.js` 中的 `API_BASE_URL` 是否設置正確，以及後端 CORS 配置

**Q: 樣式沒有加載？**
A: 檢查 CSS 文件路徑是否正確，確保所有 CSS 文件都在倉庫中

**Q: 如何更新網站？**
A: 推送代碼到 GitHub，Render 會自動重新部署（如果啟用了 Auto-Deploy）

## 部署流程總結

1. **後端部署**（Web Service）
   - 設置環境變數 `GEMINI_API_KEY`
   - 記下後端 URL

2. **前端部署**（Static Site）
   - 設置如上所述
   - 如果需要，更新 `app.js` 中的 `API_BASE_URL`

3. **測試**
   - 訪問前端 URL
   - 測試所有功能
   - 檢查 API 調用

4. **完成！**
   - 你的應用已經上線！

