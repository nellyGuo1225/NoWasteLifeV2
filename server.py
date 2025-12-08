from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
import re
import traceback
from dotenv import load_dotenv
import google.generativeai as genai
from pathlib import Path

# 獲取項目根目錄
BASE_DIR = Path(__file__).resolve().parent
ENV_FILE = BASE_DIR / '.env'

# 載入環境變數（明確指定路徑）
if ENV_FILE.exists():
    load_dotenv(dotenv_path=ENV_FILE)
    print(f"✅ 已載入 .env 文件: {ENV_FILE}")
else:
    print(f"⚠️  未找到 .env 文件: {ENV_FILE}")
    # 嘗試從當前目錄載入
    load_dotenv()

app = Flask(__name__)

# 獲取環境變數，支持生產環境
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:8000')
ALLOWED_ORIGINS_ENV = os.getenv('ALLOWED_ORIGINS', '')

# 構建允許的來源列表
ALLOWED_ORIGINS = []
if ALLOWED_ORIGINS_ENV:
    ALLOWED_ORIGINS.extend([origin.strip() for origin in ALLOWED_ORIGINS_ENV.split(',')])
else:
    # 如果沒有設置，允許常見的本地和生產環境
    ALLOWED_ORIGINS = [
        FRONTEND_URL,
        'http://127.0.0.1:8000',
        'http://localhost:8000',
        'https://nowastelife.onrender.com',
        'https://nowastelifev2.onrender.com',
        # 允許所有 onrender.com 子域名（用於開發和測試）
        'https://*.onrender.com'
    ]

# 配置 CORS，支持開發和生產環境
# 使用更寬鬆的 CORS 配置，允許所有 onrender.com 域名
CORS(app, resources={
    r"/api/*": {
        "origins": "*",  # 允許所有來源（生產環境可以根據需要限制）
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    },
    r"/health": {
        "origins": "*",  # 健康檢查端點允許所有來源
        "methods": ["GET", "OPTIONS"]
    }
})

# 從環境變數獲取 API key
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')

if not GEMINI_API_KEY:
    print("❌ 警告: 未找到 GEMINI_API_KEY 環境變數")
    print(f"   當前工作目錄: {os.getcwd()}")
    print(f"   .env 文件路徑: {ENV_FILE}")
    print(f"   .env 文件存在: {ENV_FILE.exists()}")
else:
    print(f"✅ Gemini API Key 已載入 (長度: {len(GEMINI_API_KEY)} 字元)")

# 配置 Gemini API
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

@app.route('/api/breakdown-task', methods=['POST'])
def breakdown_task():
    """將任務拆解成多個子任務"""
    try:
        print(f"\n[API] 收到請求: {request.method} {request.path}")
        print(f"[API] 請求來源: {request.origin if hasattr(request, 'origin') else 'N/A'}")
        
        data = request.json
        if not data:
            print("[ERROR] 請求數據為空")
            return jsonify({'error': '請提供有效的 JSON 數據'}), 400
        
        task_title = data.get('task', '').strip()
        print(f"[API] 任務內容: {task_title}")
        
        if not task_title:
            print("[ERROR] 任務名稱為空")
            return jsonify({'error': '請提供任務名稱'}), 400
        
        if not GEMINI_API_KEY:
            print("[ERROR] Gemini API Key 未配置")
            return jsonify({'error': '服務器未配置 Gemini API Key'}), 500
        
        print("[API] 開始調用 Gemini API...")
        # 使用 Gemini API 拆解任務
        # 先嘗試列出可用模型
        model = None
        try:
            print("[API] 列出可用模型...")
            models = genai.list_models()
            available_models = []
            for m in models:
                if 'generateContent' in m.supported_generation_methods:
                    # 獲取模型名稱（去掉 'models/' 前綴）
                    model_name = m.name.split('/')[-1] if '/' in m.name else m.name
                    available_models.append(model_name)
                    print(f"[API] 找到可用模型: {model_name}")
            
            if available_models:
                # 優先使用 flash，然後 pro
                preferred_order = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro']
                selected_model = None
                for pref in preferred_order:
                    if pref in available_models:
                        selected_model = pref
                        break
                
                # 如果沒有偏好的模型，使用第一個可用的
                if not selected_model:
                    selected_model = available_models[0]
                
                print(f"[API] 選擇使用模型: {selected_model}")
                model = genai.GenerativeModel(selected_model)
            else:
                raise Exception("沒有找到支持 generateContent 的模型")
        except Exception as e:
            print(f"[WARNING] 列出模型失敗: {str(e)[:200]}")
            print("[API] 嘗試直接使用常見模型名稱...")
            # 如果列出模型失敗，直接嘗試常見的模型名稱
            model_names = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro']
            for model_name in model_names:
                try:
                    print(f"[API] 嘗試模型: {model_name}")
                    model = genai.GenerativeModel(model_name)
                    print(f"[API] 成功使用模型: {model_name}")
                    break
                except Exception as e2:
                    print(f"[API] 模型 {model_name} 失敗: {str(e2)[:100]}")
                    continue
            
            if model is None:
                raise Exception(f"無法找到可用的 Gemini 模型。錯誤: {str(e)[:200]}")
        
        prompt = f"""你是一位專業的專案管理顧問與任務拆解專家。你的唯一任務是將使用者提供的一個「大任務」分解成一系列清晰、具體、可執行的小任務。

請嚴格遵守以下規則：

1. 最終輸出的子任務數量必須介於 3～7 個之間。

2. 每個子任務都必須是具體、可衡量、可操作的獨立步驟。

3. 子任務需按照執行的邏輯順序排列。

4. 子任務之間需有足夠獨立性，能被單獨完成。

5. 只能輸出任務拆解，禁止加入額外說明、開場白、結論。

任務：{task_title}

請以 JSON 格式返回，格式如下：
{{
  "subtasks": [
    {{
      "title": "子任務1",
      "description": "詳細描述"
    }},
    {{
      "title": "子任務2",
      "description": "詳細描述"
    }}
  ]
}}

只返回 JSON，不要其他文字。"""
        
        response = model.generate_content(prompt)
        print(f"[API] Gemini API 回應成功")
        
        # 解析回應
        response_text = response.text.strip()
        print(f"[API] 原始回應長度: {len(response_text)} 字元")
        print(f"[API] 回應前200字元: {response_text[:200]}")
        
        # 嘗試提取 JSON（如果回應包含其他文字）
        # 尋找 JSON 部分（可能被 ```json 或 ``` 包圍）
        json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', response_text, re.DOTALL)
        if json_match:
            response_text = json_match.group(1)
        else:
            # 如果沒有代碼塊，直接尋找 JSON 對象
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                response_text = json_match.group(0)
        
        result = json.loads(response_text)
        print(f"[API] JSON 解析成功")
        
        # 驗證結果格式
        if 'subtasks' not in result or not isinstance(result['subtasks'], list):
            print(f"[ERROR] AI 回應格式不正確: {result}")
            return jsonify({'error': 'AI 回應格式不正確'}), 500
        
        print(f"[API] 成功拆解出 {len(result['subtasks'])} 個子任務")
        return jsonify(result)
        
    except json.JSONDecodeError as e:
        error_detail = f'解析 AI 回應失敗: {str(e)}'
        print(f"[ERROR] {error_detail}")
        print(f"[ERROR] 回應內容: {response_text[:500] if 'response_text' in locals() else '無'}")
        return jsonify({
            'error': error_detail,
            'response_preview': response_text[:200] if 'response_text' in locals() else '無'
        }), 500
    except Exception as e:
        error_msg = str(e)
        error_type = type(e).__name__
        print(f"[ERROR] 異常類型: {error_type}")
        print(f"[ERROR] 錯誤訊息: {error_msg}")
        print(f"[ERROR] 堆棧追蹤:\n{traceback.format_exc()}")
        
        # 處理模型未找到的錯誤
        if 'not found' in error_msg.lower() or '404' in error_msg.lower():
            return jsonify({
                'error': 'Gemini 模型不可用，請檢查 API 版本和模型名稱',
                'suggestion': '嘗試使用 gemini-1.5-flash 或 gemini-1.5-pro'
            }), 500
        
        if 'API key' in error_msg.lower() or 'authentication' in error_msg.lower():
            return jsonify({'error': 'Gemini API Key 無效或已過期，請檢查 .env 文件'}), 500
        
        return jsonify({
            'error': f'處理請求時發生錯誤: {error_msg}',
            'error_type': error_type
        }), 500

@app.route('/api/diagnose-procrastination', methods=['POST'])
def diagnose_procrastination():
    """分析用戶的拖延問題"""
    try:
        data = request.get_json()
        completed_tasks = data.get('completed_tasks', [])
        
        if not completed_tasks:
            return jsonify({
                "error": "沒有已完成的任務數據"
            }), 400
        
        # 構建任務感受數據
        task_data = []
        for task in completed_tasks:
            task_info = f"任務：{task.get('title', '')}"
            if task.get('feeling'):
                task_info += f"，完成感受：{task.get('feeling')}"
            if task.get('deadline') and task.get('completedDate'):
                deadline = task.get('deadline')
                completed = task.get('completedDate')
                if completed > deadline:
                    task_info += f"（延遲完成）"
                else:
                    task_info += f"（準時完成）"
            task_data.append(task_info)
        
        tasks_text = "\n".join(task_data)
        
        prompt = f"""你是一位行為科學教練，要協助我診斷拖延原因。不能直接猜我的拖延原因，根據任務完成時，使用者所選擇的感受去判斷。

用戶已完成的任務及感受：
{tasks_text}

診斷範圍可包含（但不強制套用）：
- 任務太大 / 不知道從何開始
- 缺乏明確的下一步
- 認知負擔過高
- 任務沒意義感或動機不足
- 情緒抗拒 / 壓力
- 資訊不足
- 時間預估錯誤
- 完美主義

請根據用戶選擇的感受，分析出最可能的拖延原因，並提供解決方案。

重要要求：
- 不能直接猜測，必須根據感受來判斷
- 不要使用任何 Markdown 語法（不要使用 **、##、*、- 等符號）
- 使用純文字描述

請以 JSON 格式返回，格式如下：
{{
  "cause": "一句拖延原因（根據感受判斷）",
  "solutions": [
    "具體可行解決方案1",
    "具體可行解決方案2",
    "具體可行解決方案3"
  ]
}}

只返回 JSON，不要其他文字。"""
        
        if not GEMINI_API_KEY:
            return jsonify({
                "error": "Gemini API key 未配置"
            }), 500
        
        try:
            # 使用與任務拆解相同的模型選擇邏輯
            model = None
            try:
                models = genai.list_models()
                available_models = []
                for m in models:
                    if 'generateContent' in m.supported_generation_methods:
                        model_name = m.name.split('/')[-1] if '/' in m.name else m.name
                        available_models.append(model_name)
                
                if available_models:
                    preferred_order = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro']
                    selected_model = None
                    for pref in preferred_order:
                        if pref in available_models:
                            selected_model = pref
                            break
                    
                    if not selected_model:
                        selected_model = available_models[0]
                    
                    model = genai.GenerativeModel(selected_model)
                else:
                    raise Exception("沒有找到支持 generateContent 的模型")
            except Exception as e:
                model_names = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro']
                for model_name in model_names:
                    try:
                        model = genai.GenerativeModel(model_name)
                        break
                    except:
                        continue
                
                if model is None:
                    raise Exception(f"無法找到可用的 Gemini 模型")
            
            response = model.generate_content(prompt)
            result_text = response.text.strip()
            
            print(f"[診斷] AI 原始回應長度: {len(result_text)} 字元")
            print(f"[診斷] AI 原始回應前 300 字元: {result_text[:300]}")
            
            # 先嘗試提取 JSON 部分
            json_match = re.search(r'\{[\s\S]*\}', result_text, re.DOTALL)
            if json_match:
                json_text = json_match.group()
            else:
                json_text = result_text
            
            # 清理 JSON 字符串中的控制字符
            # 方法1: 移除所有不可打印的控制字符（保留空格、換行、製表符）
            def clean_json_string(text):
                """清理 JSON 字符串，移除控制字符但保留必要的空白字符"""
                result = []
                for char in text:
                    # 保留可打印字符、空格、換行、製表符、回車
                    if char.isprintable() or char in ' \n\t\r':
                        result.append(char)
                    # 將其他控制字符轉換為空格
                    elif ord(char) < 32:
                        result.append(' ')
                return ''.join(result)
            
            cleaned_json = clean_json_string(json_text)
            
            # 嘗試解析 JSON
            try:
                result_json = json.loads(cleaned_json)
                print(f"[診斷] JSON 解析成功")
                return jsonify(result_json), 200
            except json.JSONDecodeError as e:
                print(f"[診斷] 第一次 JSON 解析失敗: {str(e)}")
                print(f"[診斷] 錯誤位置: line {e.lineno}, column {e.colno}")
                print(f"[診斷] JSON 文本前 500 字元: {cleaned_json[:500]}")
                
                # 方法2: 更激進的清理 - 移除所有控制字符
                cleaned_json2 = ''.join(char for char in json_text if char.isprintable() or char == ' ')
                # 修復可能的雙引號問題
                cleaned_json2 = cleaned_json2.replace('\n', ' ').replace('\r', ' ').replace('\t', ' ')
                # 移除多餘的空格
                cleaned_json2 = re.sub(r'\s+', ' ', cleaned_json2)
                
                try:
                    result_json = json.loads(cleaned_json2)
                    print(f"[診斷] 第二次 JSON 解析成功")
                    return jsonify(result_json), 200
                except json.JSONDecodeError as e2:
                    print(f"[診斷] 第二次 JSON 解析失敗: {str(e2)}")
                    
                    # 方法3: 嘗試手動修復常見問題
                    # 如果 summary 字段包含換行，需要正確轉義
                    cleaned_json3 = cleaned_json2
                    # 轉義字符串值中的特殊字符
                    # 找到 "summary": "..." 並轉義其中的特殊字符
                    summary_match = re.search(r'"summary"\s*:\s*"([^"]*(?:\\.[^"]*)*)"', cleaned_json3)
                    if summary_match:
                        summary_value = summary_match.group(1)
                        # 轉義控制字符
                        escaped_summary = json.dumps(summary_value)[1:-1]  # 使用 json.dumps 自動轉義，然後去掉外層引號
                        cleaned_json3 = cleaned_json3.replace(f'"{summary_value}"', f'"{escaped_summary}"')
                    
                    try:
                        result_json = json.loads(cleaned_json3)
                        print(f"[診斷] 第三次 JSON 解析成功")
                        return jsonify(result_json), 200
                    except json.JSONDecodeError as e3:
                        print(f"[診斷] 第三次 JSON 解析失敗: {str(e3)}")
                        # 如果所有方法都失敗，嘗試直接構建 JSON
                        # 提取 summary 內容（即使 JSON 格式不完整）
                        summary_match = re.search(r'"summary"\s*:\s*"([^"]+)"', cleaned_json3)
                        if summary_match:
                            summary_text = summary_match.group(1)
                            # 手動構建 JSON
                            result_json = {"summary": summary_text}
                            print(f"[診斷] 使用手動提取的 summary")
                            return jsonify(result_json), 200
                        else:
                            raise Exception(f"無法解析 AI 返回的 JSON。最後錯誤: {str(e3)}")
        except Exception as e:
            error_msg = str(e)
            error_type = type(e).__name__
            print(f"❌ Gemini API 錯誤: {error_type}: {error_msg}")
            print(f"   回應內容: {result_text[:200] if 'result_text' in locals() else '無'}")
            
            # 處理配額限制錯誤（檢查多種可能的錯誤訊息格式）
            is_quota_error = (
                '429' in error_msg or 
                'quota' in error_msg.lower() or 
                'Quota exceeded' in error_msg or
                'exceeded your current quota' in error_msg.lower() or
                'free_tier_requests' in error_msg.lower()
            )
            
            if is_quota_error:
                # 提取重試時間（嘗試多種格式）
                retry_match = re.search(r'retry in ([\d.]+)s', error_msg, re.IGNORECASE)
                if not retry_match:
                    retry_match = re.search(r'retry_delay.*?seconds[:\s]+(\d+)', error_msg, re.IGNORECASE)
                if not retry_match:
                    retry_match = re.search(r'(\d+\.?\d*)\s*秒', error_msg)
                
                retry_seconds = retry_match.group(1) if retry_match else None
                
                error_message = "API 配額已用完。免費層每天限制 20 次請求。"
                if retry_seconds:
                    retry_sec = int(float(retry_seconds))
                    error_message += f" 請在 {retry_sec} 秒後重試。"
                else:
                    error_message += " 請稍後再試，或明天再使用此功能。"
                
                return jsonify({
                    "error": error_message,
                    "error_type": "quota_exceeded",
                    "retry_after": retry_seconds
                }), 429
            
            return jsonify({
                "error": f"AI 分析失敗: {error_msg}",
                "error_type": "api_error"
            }), 500
            
    except Exception as e:
        error_msg = str(e)
        error_type = type(e).__name__
        print(f"❌ 診斷錯誤: {error_type}: {error_msg}")
        traceback.print_exc()
        
        # 在外層也檢查配額錯誤（以防內層沒有捕獲到）
        is_quota_error = (
            '429' in error_msg or 
            'quota' in error_msg.lower() or 
            'Quota exceeded' in error_msg or
            'exceeded your current quota' in error_msg.lower()
        )
        
        if is_quota_error:
            retry_match = re.search(r'retry in ([\d.]+)s', error_msg, re.IGNORECASE)
            retry_seconds = retry_match.group(1) if retry_match else None
            
            error_message = "API 配額已用完。免費層每天限制 20 次請求。"
            if retry_seconds:
                retry_sec = int(float(retry_seconds))
                error_message += f" 請在 {retry_sec} 秒後重試。"
            else:
                error_message += " 請稍後再試，或明天再使用此功能。"
            
            return jsonify({
                "error": error_message,
                "error_type": "quota_exceeded",
                "retry_after": retry_seconds
            }), 429
        
        return jsonify({
            "error": f"服務器錯誤: {error_msg}",
            "error_type": "server_error"
        }), 500

@app.route('/health', methods=['GET'])
def health():
    """健康檢查端點"""
    return jsonify({'status': 'ok', 'gemini_configured': bool(GEMINI_API_KEY)})

if __name__ == '__main__':
    print("啟動 AI 任務拆解服務器...")
    print(f"Gemini API Key 已配置: {bool(GEMINI_API_KEY)}")
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    app.run(host='0.0.0.0', port=port, debug=debug)

