# 部署指南

## 部署選項

### 選項 1: Render (推薦)

Render 是一個簡單易用的部署平台，支持 Flask 應用。

#### 步驟：

1. **註冊 Render 帳號**
   - 訪問 https://render.com
   - 使用 GitHub 帳號登錄

2. **準備 GitHub 倉庫**
   - 將代碼推送到 GitHub
   - 確保包含所有必要文件

3. **在 Render 創建 Web Service**
   - 點擊 "New +" → "Web Service"
   - 連接你的 GitHub 倉庫
   - 設置：
     - **Name**: 不廢人生實驗室
     - **Environment**: Python 3
     - **Build Command**: `pip install -r requirements.txt`
     - **Start Command**: `python server.py`
     - **Plan**: Free

4. **設置環境變數**
   - 在 Render Dashboard → Environment
   - 添加以下環境變數：
     - `GEMINI_API_KEY`: 你的 Gemini API Key
     - `PORT`: 10000 (Render 自動設置，但可以明確指定)
     - `FLASK_DEBUG`: False
     - `FRONTEND_URL`: 你的前端 URL（如果前端也在 Render 部署）

5. **部署前端**
   - 在 Render 創建 Static Site
   - 連接同一個 GitHub 倉庫
   - 設置：
     - **Build Command**: (留空)
     - **Publish Directory**: (留空，因為是靜態文件)

### 選項 2: Railway

Railway 是另一個簡單的部署平台。

#### 步驟：

1. **註冊 Railway 帳號**
   - 訪問 https://railway.app
   - 使用 GitHub 帳號登錄

2. **部署**
   - 點擊 "New Project"
   - 選擇 "Deploy from GitHub repo"
   - 選擇你的倉庫

3. **設置環境變數**
   - 在 Variables 標籤添加：
     - `GEMINI_API_KEY`
     - `PORT` (Railway 會自動設置)

4. **部署前端**
   - Railway 會自動檢測並部署

### 選項 3: Heroku

#### 步驟：

1. **安裝 Heroku CLI**
   ```bash
   # Windows
   # 下載並安裝 https://devcenter.heroku.com/articles/heroku-cli
   ```

2. **登錄 Heroku**
   ```bash
   heroku login
   ```

3. **創建應用**
   ```bash
   heroku create your-app-name
   ```

4. **設置環境變數**
   ```bash
   heroku config:set GEMINI_API_KEY=your_api_key
   ```

5. **部署**
   ```bash
   git push heroku main
   ```

### 選項 4: Vercel (僅前端) + 獨立後端

如果使用 Vercel 部署前端，後端需要單獨部署。

#### 前端部署到 Vercel：

1. **安裝 Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **部署**
   ```bash
   vercel
   ```

#### 後端部署：

後端可以部署到 Render、Railway 或其他平台，然後更新前端的 API_BASE_URL。

## 環境變數設置

### 必需環境變數：
- `GEMINI_API_KEY`: Google Gemini API 密鑰

### 可選環境變數：
- `PORT`: 服務器端口（默認 5000）
- `FLASK_DEBUG`: 是否啟用調試模式（默認 False）
- `FRONTEND_URL`: 前端 URL（用於 CORS）
- `ALLOWED_ORIGINS`: 允許的來源（用逗號分隔）

## 本地測試部署配置

在部署前，可以在本地測試生產配置：

```bash
# 設置環境變數
export GEMINI_API_KEY=your_api_key
export FLASK_DEBUG=False
export PORT=5000

# 運行服務器
python server.py
```

## 注意事項

1. **API Key 安全**
   - 永遠不要將 `.env` 文件提交到 Git
   - 使用環境變數存儲敏感信息

2. **CORS 配置**
   - 確保 `FRONTEND_URL` 或 `ALLOWED_ORIGINS` 設置正確
   - 生產環境應該只允許你的前端域名

3. **靜態文件**
   - 確保 `images/` 資料夾中的所有圖片都包含在部署中

4. **依賴管理**
   - 確保 `requirements.txt` 包含所有必需的 Python 包

## 故障排除

### 後端無法啟動
- 檢查環境變數是否正確設置
- 查看日誌確認錯誤信息
- 確認 `requirements.txt` 中的依賴已安裝

### CORS 錯誤
- 檢查 `FRONTEND_URL` 或 `ALLOWED_ORIGINS` 設置
- 確認前端 URL 在允許列表中

### API 調用失敗
- 檢查後端服務器是否運行
- 確認 API_BASE_URL 設置正確
- 查看瀏覽器控制台的錯誤信息

