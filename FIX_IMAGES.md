# 修復圖片顯示問題

## 問題診斷

如果部署後圖片沒有顯示，請檢查以下幾點：

### 1. 確認圖片文件在 Git 倉庫中

在本地執行以下命令檢查：

```bash
git ls-files images/
```

應該看到：
- images/gatcha.jpg
- images/hero-bg.jpg
- images/memes/1.jpg
- images/memes/2.jpg
- ... 等等

如果沒有看到這些文件，需要添加：

```bash
git add images/
git commit -m "Add images"
git push
```

### 2. 檢查圖片路徑

在生產環境中，圖片路徑可能需要使用絕對路徑（從根目錄開始）。

## 解決方案

### 方案 1: 確保圖片在 Git 中（最常見問題）

1. **檢查圖片是否被追蹤**
   ```bash
   git status images/
   ```

2. **如果圖片未追蹤，添加它們**
   ```bash
   git add images/
   git commit -m "Add image files"
   git push
   ```

3. **在 Render 重新部署**
   - Render 會自動檢測到新的提交並重新部署

### 方案 2: 修改為絕對路徑

如果圖片在 Git 中但還是不顯示，可能需要使用絕對路徑。

修改以下文件：

**app.css** - 將相對路徑改為絕對路徑：
```css
/* 原本 */
background-image: url('images/gatcha.jpg');

/* 改為 */
background-image: url('/images/gatcha.jpg');
```

**style.css** - 同樣修改：
```css
/* 原本 */
background-image: url('images/hero-bg.jpg');

/* 改為 */
background-image: url('/images/hero-bg.jpg');
```

**fun.html** - JavaScript 中的路徑：
```javascript
// 原本
'images/memes/1.jpg'

// 改為
'/images/memes/1.jpg'
```

## 快速修復步驟

1. **確認圖片在 Git 中**
   ```bash
   git add images/
   git commit -m "Add images"
   git push
   ```

2. **如果還是不行，修改路徑為絕對路徑**
   - 在所有 CSS 和 JS 文件中，將 `images/` 改為 `/images/`

3. **重新部署**
   - Render 會自動重新部署

## 檢查清單

- [ ] 圖片文件已添加到 Git
- [ ] 圖片文件已推送到 GitHub
- [ ] Render 已重新部署
- [ ] 圖片路徑使用絕對路徑（從 `/` 開始）
- [ ] 瀏覽器控制台沒有 404 錯誤

## 調試方法

1. **在瀏覽器中檢查**
   - 按 F12 打開開發者工具
   - 查看 Network 標籤
   - 重新加載頁面
   - 查看哪些圖片請求失敗（顯示 404）

2. **檢查圖片 URL**
   - 在瀏覽器中直接訪問圖片 URL
   - 例如：`https://your-site.onrender.com/images/gatcha.jpg`
   - 如果顯示 404，說明圖片路徑或文件有問題

3. **查看 Render 日誌**
   - 在 Render Dashboard → Logs
   - 查看是否有相關錯誤

