# 如何查看服務器錯誤訊息

## 方法 1: 查看運行服務器的終端窗口

如果您是在終端中運行 `python server.py`，錯誤訊息會直接顯示在終端中。

## 方法 2: 檢查服務器日誌輸出

服務器運行時會輸出詳細的錯誤訊息，包括：
- Python 異常堆棧
- Gemini API 錯誤
- JSON 解析錯誤

## 方法 3: 使用 PowerShell 查看進程輸出

```powershell
# 查看 Python 進程
Get-Process python | Where-Object {$_.Path -like "*python*"}
```

## 方法 4: 添加更詳細的日誌記錄

服務器已經配置了 debug=True，會顯示詳細錯誤。

## 方法 5: 直接測試 API 並查看錯誤

在 PowerShell 中運行：
```powershell
$body = @{ task = "測試任務" } | ConvertTo-Json
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/breakdown-task" -Method POST -Body $body -ContentType "application/json"
    $response.Content
} catch {
    $_.Exception.Response.StatusCode
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $reader.ReadToEnd()
}
```

