# AI 任務拆解功能設置指南

## 功能說明
AI 任務拆解功能使用 Google Gemini AI 將大任務自動拆解成多個具體的子任務，幫助您更好地規劃和管理任務。

## 設置步驟

### 1. 安裝 Python 依賴
```bash
pip install -r requirements.txt
```

### 2. 獲取 Gemini API Key
1. 前往 [Google AI Studio](https://makersuite.google.com/app/apikey)
2. 登入您的 Google 帳號
3. 點擊 "Create API Key" 創建新的 API Key
4. 複製您的 API Key

### 3. 配置環境變數
在項目根目錄創建 `.env` 文件，並添加以下內容：

```
GEMINI_API_KEY=your_actual_api_key_here
```

**重要：** 請將 `your_actual_api_key_here` 替換為您實際的 API Key。

### 4. 啟動後端服務器
在項目根目錄運行：
```bash
python server.py
```

服務器將在 `http://localhost:5000` 啟動。

### 5. 啟動前端服務器
在另一個終端窗口運行：
```bash
python -m http.server 8000
```

前端將在 `http://localhost:8000` 啟動。

## 使用方法

1. 打開瀏覽器訪問 `http://localhost:8000/tasks.html`
2. 在「AI 任務拆解」區域輸入一個大任務（例如：「完成專案報告」）
3. 點擊「AI 拆解任務」按鈕
4. 等待 AI 分析並拆解任務
5. 查看拆解結果，可以：
   - 點擊單個子任務的「加入任務」按鈕，將該子任務加入任務列表
   - 點擊「一鍵加入所有子任務」按鈕，將所有子任務一次性加入

## 注意事項

- **API Key 安全**：`.env` 文件已加入 `.gitignore`，不會被提交到版本控制系統
- **後端服務器**：使用 AI 功能時，必須確保後端服務器（`server.py`）正在運行
- **API 限制**：請注意 Google Gemini API 的使用限制和費用

## 故障排除

### 無法連接到後端服務器
- 確認 `server.py` 正在運行
- 檢查端口 5000 是否被其他程序占用
- 確認防火牆設置允許本地連接

### API Key 錯誤
- 確認 `.env` 文件存在且格式正確
- 確認 API Key 沒有多餘的空格或換行
- 確認 API Key 在 Google AI Studio 中有效

### 無法拆解任務
- 檢查瀏覽器控制台是否有錯誤訊息
- 確認後端服務器日誌中的錯誤信息
- 嘗試重新啟動後端服務器

