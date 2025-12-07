# 如何將 images 資料夾上傳到 GitHub

## 方法 1: 使用 Git 命令（推薦）

如果你已經安裝了 Git 並且已經初始化了倉庫：

### 步驟：

1. **打開終端/命令提示符**
   - Windows: 按 `Win + R`，輸入 `cmd` 或 `powershell`
   - 或者使用 VS Code 的終端

2. **進入項目目錄**
   ```bash
   cd "C:\不廢人生實驗室"
   ```

3. **檢查 images 資料夾狀態**
   ```bash
   git status images/
   ```

4. **添加 images 資料夾到 Git**
   ```bash
   git add images/
   ```

5. **提交更改**
   ```bash
   git commit -m "Add images folder"
   ```

6. **推送到 GitHub**
   ```bash
   git push
   ```

## 方法 2: 使用 GitHub 網頁界面

如果 Git 命令不可用，可以直接在 GitHub 網頁上傳：

### 步驟：

1. **訪問你的 GitHub 倉庫**
   - 打開瀏覽器，訪問你的 GitHub 倉庫頁面

2. **進入 images 資料夾**
   - 如果 images 資料夾不存在，點擊 "Add file" → "Create new file"
   - 輸入路徑：`images/gatcha.jpg`
   - 或者直接點擊 "Upload files"

3. **上傳圖片文件**
   - 點擊 "Add file" → "Upload files"
   - 將 `images/` 資料夾中的所有文件拖拽到頁面
   - 或者點擊 "choose your files" 選擇文件

4. **提交更改**
   - 在頁面底部輸入提交訊息：`Add images folder`
   - 點擊 "Commit changes"

## 方法 3: 使用 GitHub Desktop（圖形界面）

如果你安裝了 GitHub Desktop：

1. **打開 GitHub Desktop**
2. **選擇你的倉庫**
3. **在左側文件列表中，右鍵點擊 `images/` 資料夾**
4. **選擇 "Stage All Changes"**
5. **在底部輸入提交訊息：`Add images folder`**
6. **點擊 "Commit to main"**
7. **點擊 "Push origin"**

## 需要上傳的圖片文件

確保以下所有文件都上傳：

```
images/
├── gatcha.jpg          (扭蛋機圖片)
├── hero-bg.jpg         (首頁背景圖)
└── memes/
    ├── 1.jpg
    ├── 2.jpg
    ├── 3.jpg
    ├── 4.jpg
    ├── 5.jpg
    └── 6.jpg
```

## 檢查是否成功

上傳後，在 GitHub 網頁上檢查：

1. **訪問你的倉庫**
2. **點擊 `images/` 資料夾**
3. **確認所有圖片文件都在**

或者使用命令檢查：

```bash
git ls-files images/
```

應該看到所有圖片文件列表。

## 常見問題

**Q: 圖片文件太大，無法上傳？**
A: GitHub 單個文件限制是 100MB。如果圖片太大，可以：
- 壓縮圖片
- 使用圖片優化工具減小文件大小

**Q: 上傳後圖片還是不顯示？**
A: 
1. 確認文件路徑正確
2. 確認已推送到 GitHub
3. 在 Render 重新部署（會自動觸發）
4. 檢查圖片路徑是否使用絕對路徑（`/images/...`）

**Q: 如何確認圖片已上傳？**
A: 在 GitHub 倉庫頁面，點擊 `images/` 資料夾，應該能看到所有圖片文件。

## 快速檢查清單

- [ ] 所有圖片文件都在 `images/` 資料夾中
- [ ] 圖片已添加到 Git（`git add images/`）
- [ ] 已提交更改（`git commit`）
- [ ] 已推送到 GitHub（`git push`）
- [ ] 在 GitHub 網頁確認文件存在
- [ ] Render 已自動重新部署
- [ ] 檢查網站圖片是否顯示

