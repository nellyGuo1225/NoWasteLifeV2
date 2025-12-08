// API 配置 - 根據環境自動切換
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000'
    : 'https://nowastelifev2.onrender.com'; // 生產環境後端 URL

// 數據模型
let tasks = [];
let rewards = [];
let score = 0;
let taskIdCounter = 0;
let rewardIdCounter = 0;
let taskStatusFilter = 'pending'; // 任務完成狀態篩選: 'all', 'pending', 'completed'
let taskPriorityFilter = 'high'; // 任務優先度篩選: 'all', 'low', 'medium', 'high'

// 從localStorage載入數據
function loadData() {
    const savedTasks = localStorage.getItem('tasks');
    const savedRewards = localStorage.getItem('rewards');
    const savedScore = localStorage.getItem('score');
    const savedTaskIdCounter = localStorage.getItem('taskIdCounter');
    const savedRewardIdCounter = localStorage.getItem('rewardIdCounter');

    if (savedTasks) {
        tasks = JSON.parse(savedTasks);
    }
    if (savedRewards) {
        rewards = JSON.parse(savedRewards);
    }
    if (savedScore) {
        score = parseInt(savedScore);
    }
    if (savedTaskIdCounter) {
        taskIdCounter = parseInt(savedTaskIdCounter);
    }
    if (savedRewardIdCounter) {
        rewardIdCounter = parseInt(savedRewardIdCounter);
    }

    updateDisplay();
}

// 保存數據到localStorage
function saveData() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
    localStorage.setItem('rewards', JSON.stringify(rewards));
    localStorage.setItem('score', score.toString());
    localStorage.setItem('taskIdCounter', taskIdCounter.toString());
    localStorage.setItem('rewardIdCounter', rewardIdCounter.toString());
}

// 更新顯示
function updateDisplay() {
    updateTaskList();
    updateRewardList();
    updateScore();
    updateGachaButton();
}

// 更新任務列表
function updateTaskList() {
    const taskList = document.getElementById('taskList');
    if (!taskList) return;
    
    taskList.innerHTML = '';

    // 根據篩選條件過濾任務
    let filteredTasks = tasks;
    
    // 按完成狀態篩選
    if (taskStatusFilter === 'pending') {
        filteredTasks = filteredTasks.filter(task => !task.completed);
    } else if (taskStatusFilter === 'completed') {
        filteredTasks = filteredTasks.filter(task => task.completed);
    }
    
    // 按優先度篩選
    if (taskPriorityFilter !== 'all') {
        filteredTasks = filteredTasks.filter(task => task.priority === taskPriorityFilter);
    }

    filteredTasks.forEach(task => {
        const taskItem = document.createElement('div');
        taskItem.className = `task-item ${task.priority}-priority ${task.completed ? 'completed' : ''}`;
        
        const deadline = new Date(task.deadline);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const isOverdue = deadline < today && !task.completed;
        
        const priorityText = {
            'high': '高',
            'medium': '中',
            'low': '低'
        };

        taskItem.innerHTML = `
            <div class="task-info">
                <div class="task-title">${task.title}</div>
                <div class="task-details">
                    截止日期：${formatDate(task.deadline)} ${isOverdue ? '<span style="color: red;">（已逾期）</span>' : ''} | 
                    優先度:<span class="priority-text priority-${task.priority}">${priorityText[task.priority]}</span>
                </div>
                ${task.completed && task.feeling ? `<div class="task-feeling">${task.feeling}</div>` : ''}
            </div>
            <div class="task-actions">
                ${!task.completed ? `
                    <button class="btn-complete" onclick="completeTask(${task.id})">完成</button>
                    <button class="btn-edit" onclick="openEditModal(${task.id})">編輯</button>
                ` : `
                    <span class="task-completed-label">已完成</span>
                `}
            </div>
        `;
        
        taskList.appendChild(taskItem);
    });
}

// 更新獎勵列表
function updateRewardList() {
    const rewardList = document.getElementById('rewardList');
    const rewardCount = document.getElementById('rewardCount');
    const unclaimedRewards = rewards.filter(r => !r.claimed);
    
    rewardCount.textContent = unclaimedRewards.length;
    rewardList.innerHTML = '';

    rewards.forEach(reward => {
        const rewardItem = document.createElement('div');
        rewardItem.className = `reward-item ${reward.claimed ? 'claimed' : ''}`;
        const requiredScore = reward.requiredScore !== undefined ? reward.requiredScore : 20;
        rewardItem.innerHTML = `
            <span class="reward-name">${reward.name}</span>
            <span class="reward-score">需要 ${requiredScore} 積分</span>
            ${reward.claimed ? '<span style="color: #27ae60;">已領取</span>' : ''}
        `;
        rewardList.appendChild(rewardItem);
    });
}

// 更新積分顯示
function updateScore() {
    document.getElementById('currentScore').textContent = score;
}

// 更新扭蛋按鈕狀態
function updateGachaButton() {
    const normalBtn = document.getElementById('normalGachaBtn');
    const luxuryBtn = document.getElementById('luxuryGachaBtn');
    const premiumBtn = document.getElementById('premiumGachaBtn');
    const normalTooltip = document.getElementById('normalGachaTooltip');
    const luxuryTooltip = document.getElementById('luxuryGachaTooltip');
    const premiumTooltip = document.getElementById('premiumGachaTooltip');
    
    // 檢查是否有設定任何獎勵
    const hasAnyRewards = rewards && rewards.length > 0;
    const hasUnclaimedRewards = rewards.some(r => !r.claimed);
    
    // 如果沒有設定任何獎勵，所有按鈕都顯示提示
    if (!hasAnyRewards || !hasUnclaimedRewards) {
        if (normalBtn) {
            normalBtn.disabled = true;
            normalBtn.textContent = '一般抽獎';
            if (normalTooltip) normalTooltip.textContent = '沒有設定可抽獎勵';
        }
        if (luxuryBtn) {
            luxuryBtn.disabled = true;
            luxuryBtn.textContent = '豪華抽獎';
            if (luxuryTooltip) luxuryTooltip.textContent = '沒有設定可抽獎勵';
        }
        if (premiumBtn) {
            premiumBtn.disabled = true;
            premiumBtn.textContent = '頂級抽獎';
            if (premiumTooltip) premiumTooltip.textContent = '沒有設定可抽獎勵';
        }
        return;
    }
    
    // 一般抽獎：10~20積分
    if (normalBtn) {
        const normalRewards = rewards.filter(r => {
            if (r.claimed) return false;
            const rewardScore = r.requiredScore !== undefined ? r.requiredScore : 20;
            return (rewardScore === 10 || rewardScore === 20) && score >= 20;
        });
        if (normalRewards.length > 0 && score >= 20) {
            normalBtn.disabled = false;
            normalBtn.textContent = '一般抽獎';
            if (normalTooltip) normalTooltip.textContent = '';
        } else {
            normalBtn.disabled = true;
            normalBtn.textContent = '一般抽獎';
            if (normalTooltip) {
                if (score < 20) {
                    normalTooltip.textContent = `需要20積分，當前${score}積分`;
                } else {
                    normalTooltip.textContent = '沒有可用的10~20積分獎勵';
                }
            }
        }
    }
    
    // 豪華抽獎：50積分
    if (luxuryBtn) {
        const luxuryRewards = rewards.filter(r => {
            if (r.claimed) return false;
            const rewardScore = r.requiredScore !== undefined ? r.requiredScore : 20;
            return rewardScore === 50 && score >= 50;
        });
        if (luxuryRewards.length > 0 && score >= 50) {
            luxuryBtn.disabled = false;
            luxuryBtn.textContent = '豪華抽獎';
            if (luxuryTooltip) luxuryTooltip.textContent = '';
        } else {
            luxuryBtn.disabled = true;
            luxuryBtn.textContent = '豪華抽獎';
            if (luxuryTooltip) {
                if (score < 50) {
                    luxuryTooltip.textContent = `需要50積分，當前${score}積分`;
                } else {
                    luxuryTooltip.textContent = '沒有可用的50積分獎勵';
                }
            }
        }
    }
    
    // 頂級抽獎：100積分
    if (premiumBtn) {
        const premiumRewards = rewards.filter(r => {
            if (r.claimed) return false;
            const rewardScore = r.requiredScore !== undefined ? r.requiredScore : 20;
            return rewardScore === 100 && score >= 100;
        });
        if (premiumRewards.length > 0 && score >= 100) {
            premiumBtn.disabled = false;
            premiumBtn.textContent = '頂級抽獎';
            if (premiumTooltip) premiumTooltip.textContent = '';
        } else {
            premiumBtn.disabled = true;
            premiumBtn.textContent = '頂級抽獎';
            if (premiumTooltip) {
                if (score < 100) {
                    premiumTooltip.textContent = `需要100積分，當前${score}積分`;
                } else {
                    premiumTooltip.textContent = '沒有可用的100積分獎勵';
                }
            }
        }
    }
}

// 新增任務
function addTask() {
    const title = document.getElementById('taskTitle').value.trim();
    const deadline = document.getElementById('taskDeadline').value;
    const priority = document.getElementById('taskPriority').value;

    if (!title || !deadline) {
        alert('請填寫任務名稱和截止日期！');
        return;
    }

    // 驗證優先度
    if (!priority || priority === '') {
        alert('請選擇優先度！');
        document.getElementById('taskPriority').focus();
        return;
    }
    
    const task = {
        id: taskIdCounter++,
        title: title,
        deadline: deadline,
        priority: priority,
        completed: false,
        completedDate: null,
        feeling: null
    };

    tasks.push(task);
    saveData();
    updateDisplay();

    // 清空表單
    document.getElementById('taskTitle').value = '';
    document.getElementById('taskDeadline').value = '';
    document.getElementById('taskPriority').value = '';
}

// 添加批次任務輸入行
function addBatchTaskRow() {
    const batchTaskItems = document.getElementById('batchTaskItems');
    if (!batchTaskItems) return;
    
    const rowIndex = batchTaskItems.children.length;
    const rowId = `batch-task-row-${rowIndex}`;
    
    const row = document.createElement('div');
    row.className = 'batch-task-row';
    row.id = rowId;
    
    row.innerHTML = `
        <input type="text" class="batch-task-title" placeholder="任務名稱" data-row="${rowIndex}">
        <input type="date" class="batch-task-deadline" data-row="${rowIndex}">
        <select class="batch-task-priority" data-row="${rowIndex}">
            <option value="" selected>請選擇優先度</option>
            <option value="low">低</option>
            <option value="medium">中</option>
            <option value="high">高</option>
        </select>
        <button type="button" class="btn-remove-row" onclick="removeBatchTaskRow('${rowId}')" title="刪除此行">×</button>
    `;
    
    batchTaskItems.appendChild(row);
    
    // 設置優先度選擇器的行為
    const prioritySelect = row.querySelector('.batch-task-priority');
    if (prioritySelect && window.setupPrioritySelectorsForElement) {
        setupPrioritySelectorsForElement(prioritySelect);
    }
}

// 移除批次任務輸入行
function removeBatchTaskRow(rowId) {
    const row = document.getElementById(rowId);
    if (row) {
        row.remove();
    }
}

// 批次新增任務
function addBatchTasks() {
    console.log('addBatchTasks 函數被調用');
    const batchTaskItems = document.getElementById('batchTaskItems');
    if (!batchTaskItems) {
        console.error('找不到 batchTaskItems 元素');
        alert('找不到任務輸入區域，請刷新頁面重試');
        return;
    }
    
    const rows = batchTaskItems.querySelectorAll('.batch-task-row');
    console.log(`找到 ${rows.length} 個任務行`);
    if (rows.length === 0) {
        alert('請至少添加一個任務！');
        return;
    }
    
    let addedCount = 0;
    let errorMessages = [];
    
    rows.forEach((row, index) => {
        const rowNum = index + 1;
        const titleInput = row.querySelector('.batch-task-title');
        const deadlineInput = row.querySelector('.batch-task-deadline');
        const prioritySelect = row.querySelector('.batch-task-priority');
        
        if (!titleInput || !deadlineInput || !prioritySelect) return;
        
        const title = titleInput.value.trim();
        const deadline = deadlineInput.value;
        const priority = prioritySelect.value;
        
        // 跳過空行
        if (!title && !deadline && !priority) {
            return;
        }
        
        // 驗證任務名稱
        if (!title || title.length === 0) {
            errorMessages.push(`第 ${rowNum} 行：請輸入任務名稱`);
            return;
        }
        
        // 驗證日期
        if (!deadline) {
            errorMessages.push(`第 ${rowNum} 行：請選擇截止日期`);
            return;
        }
        
        // 驗證優先度
        if (!priority || priority === '') {
            errorMessages.push(`第 ${rowNum} 行：請選擇優先度`);
            return;
        }
        
        // 創建任務
        const task = {
            id: taskIdCounter++,
            title: title,
            deadline: deadline,
            priority: priority,
            completed: false,
            completedDate: null,
            feeling: null
        };
        
        tasks.push(task);
        addedCount++;
    });
    
    // 顯示錯誤訊息（如果有）
    if (errorMessages.length > 0) {
        const errorMsg = `以下任務格式錯誤：\n\n${errorMessages.join('\n')}\n\n${addedCount > 0 ? `已成功新增 ${addedCount} 個任務。` : '請修正錯誤後再試。'}`;
        alert(errorMsg);
    }
    
    // 如果有成功新增的任務，保存並更新顯示
    if (addedCount > 0) {
        saveData();
        updateDisplay();
        
        // 如果有錯誤，不清空輸入框，讓用戶修正
        if (errorMessages.length === 0) {
            // 清空所有輸入框
            rows.forEach(row => {
                const titleInput = row.querySelector('.batch-task-title');
                const deadlineInput = row.querySelector('.batch-task-deadline');
                const prioritySelect = row.querySelector('.batch-task-priority');
                if (titleInput) titleInput.value = '';
                if (deadlineInput) deadlineInput.value = '';
                if (prioritySelect) prioritySelect.value = '';
            });
            
            // 只保留一行空白的輸入框
            // 將 NodeList 轉換為數組，避免在刪除時出現問題
            const rowsArray = Array.from(rows);
            // 從後往前刪除，保留第一行
            for (let i = rowsArray.length - 1; i > 0; i--) {
                if (rowsArray[i] && rowsArray[i].parentNode) {
                    rowsArray[i].remove();
                }
            }
            
            alert(`✅ 成功新增 ${addedCount} 個任務！`);
        }
    } else if (errorMessages.length === 0) {
        alert('請至少填寫一個完整的任務！');
    }
}

// 當前要完成的任務 ID
let currentCompleteTaskId = null;

// 完成任務
function completeTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    // 先打開感受選擇彈窗
    currentCompleteTaskId = id;
    openFeelingModal();
}

// 打開感受選擇彈窗
function openFeelingModal() {
    const modal = document.getElementById('feelingModal');
    if (modal) {
        modal.style.display = 'block';
    }
}

// 關閉感受選擇彈窗
function closeFeelingModal() {
    const modal = document.getElementById('feelingModal');
    if (modal) {
        modal.style.display = 'none';
        currentCompleteTaskId = null;
    }
}

// 選擇感受並完成任務
function selectFeelingAndComplete(feeling) {
    if (currentCompleteTaskId === null) return;
    
    const task = tasks.find(t => t.id === currentCompleteTaskId);
    if (!task) return;

    task.completed = true;
    task.completedDate = new Date().toISOString().split('T')[0];
    task.feeling = feeling;

    const deadline = new Date(task.deadline);
    const completedDate = new Date(task.completedDate);
    deadline.setHours(0, 0, 0, 0);
    completedDate.setHours(0, 0, 0, 0);

    if (completedDate <= deadline) {
        // 在截止日期內完成，+2分
        score += 2;
    } else {
        // 延遲完成，-1分
        score -= 1;
    }

    saveData();
    updateDisplay();
    closeFeelingModal();
}

// 當前編輯的任務 ID
let currentEditTaskId = null;

// 打開編輯任務彈窗
function openEditModal(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    currentEditTaskId = id;
    const modal = document.getElementById('editTaskModal');
    
    // 填充表單
    document.getElementById('modalEditTitle').value = task.title;
    document.getElementById('modalEditDeadline').value = task.deadline;
    document.getElementById('modalEditPriority').value = task.priority || '';
    
    // 設置優先度選擇器
    const prioritySelect = document.getElementById('modalEditPriority');
    if (prioritySelect && window.setupPrioritySelectorsForElement) {
        setupPrioritySelectorsForElement(prioritySelect);
    }
    
    // 顯示彈窗
    modal.style.display = 'block';
}

// 關閉編輯任務彈窗
function closeEditModal() {
    const modal = document.getElementById('editTaskModal');
    modal.style.display = 'none';
    currentEditTaskId = null;
}

// 從彈窗保存任務
function saveTaskFromModal() {
    if (currentEditTaskId === null) return;
    
    const task = tasks.find(t => t.id === currentEditTaskId);
    if (!task) return;

    const title = document.getElementById('modalEditTitle').value.trim();
    const deadline = document.getElementById('modalEditDeadline').value;
    const priority = document.getElementById('modalEditPriority').value;

    if (!title || !deadline) {
        alert('請填寫任務名稱和截止日期！');
        return;
    }
    
    if (!priority || priority === '') {
        alert('請選擇優先度！');
        document.getElementById('modalEditPriority').focus();
        return;
    }

    task.title = title;
    task.deadline = deadline;
    task.priority = priority;

    saveData();
    updateDisplay();
    closeEditModal();
}

// 從彈窗刪除任務
function deleteTaskFromModal() {
    if (currentEditTaskId === null) return;
    
    const task = tasks.find(t => t.id === currentEditTaskId);
    if (!task) return;
    
    // 已完成的任務不可刪除
    if (task.completed) {
        alert('已完成的任務不可刪除！');
        return;
    }
    
    if (confirm('確定要刪除這個任務嗎？')) {
        tasks = tasks.filter(t => t.id !== currentEditTaskId);
        saveData();
        updateDisplay();
        closeEditModal();
    }
}

// 打開刪除確認彈窗（如果用戶直接點擊刪除按鈕）
function openDeleteModal(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    // 已完成的任務不可刪除
    if (task.completed) {
        alert('已完成的任務不可刪除！');
        return;
    }
    
    if (confirm('確定要刪除這個任務嗎？')) {
        tasks = tasks.filter(t => t.id !== id);
        saveData();
        updateDisplay();
    }
}

// 刪除任務
function deleteTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    // 已完成的任務不可刪除
    if (task.completed) {
        alert('已完成的任務不可刪除！');
        return;
    }
    
    if (confirm('確定要刪除這個任務嗎？')) {
        tasks = tasks.filter(t => t.id !== id);
        saveData();
        updateDisplay();
    }
}

// 設置任務篩選
function setTaskStatusFilter(filter) {
    taskStatusFilter = filter;
    
    // 更新完成狀態按鈕狀態
    document.querySelectorAll('.filter-btn[data-type="status"]').forEach(btn => {
        if (btn.getAttribute('data-filter') === filter) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // 更新任務列表
    updateTaskList();
}

function setTaskPriorityFilter(filter) {
    taskPriorityFilter = filter;
    
    // 更新優先度按鈕狀態
    document.querySelectorAll('.filter-btn[data-type="priority"]').forEach(btn => {
        if (btn.getAttribute('data-filter') === filter) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // 更新任務列表
    updateTaskList();
}

// 新增獎勵
function addReward() {
    const name = document.getElementById('rewardName').value.trim();
    
    if (!name) {
        alert('請輸入獎勵名稱！');
        return;
    }

    const unclaimedRewards = rewards.filter(r => !r.claimed);
    if (unclaimedRewards.length >= 20) {
        alert('未領取獎勵已達上限（20個）！請先領取一些獎勵。');
        return;
    }

    const reward = {
        id: rewardIdCounter++,
        name: name,
        requiredScore: 20, // 默認需要20積分
        claimed: false
    };

    rewards.push(reward);
    saveData();
    updateDisplay();

    // 清空輸入框
    document.getElementById('rewardName').value = '';
}

// 新增批次獎勵輸入行
function addBatchRewardRow() {
    const batchRewardItems = document.getElementById('batchRewardItems');
    if (!batchRewardItems) return;
    
    const rowId = `reward-row-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const row = document.createElement('div');
    row.className = 'batch-reward-row';
    row.id = rowId;
    row.innerHTML = `
        <input type="text" class="batch-reward-name" placeholder="獎勵名稱" required>
        <select class="batch-reward-score" required>
            <option value="">請選擇積分</option>
            <option value="10">10</option>
            <option value="20" selected>20</option>
            <option value="50">50</option>
            <option value="100">100</option>
        </select>
        <button type="button" class="btn-remove-row" onclick="removeBatchRewardRow('${rowId}')" title="刪除此行">×</button>
    `;
    
    batchRewardItems.appendChild(row);
    
    // 設置優先度選擇器的行為（使用相同的邏輯）
    const scoreSelect = row.querySelector('.batch-reward-score');
    if (scoreSelect && window.setupPrioritySelectorsForElement) {
        setupPrioritySelectorsForElement(scoreSelect);
    }
}

// 移除批次獎勵輸入行
function removeBatchRewardRow(rowId) {
    const row = document.getElementById(rowId);
    if (row) {
        row.remove();
    }
}

// 批次新增獎勵
function addBatchRewards() {
    console.log('addBatchRewards 函數被調用');
    const batchRewardItems = document.getElementById('batchRewardItems');
    if (!batchRewardItems) {
        console.error('找不到 batchRewardItems 元素');
        alert('找不到獎勵輸入區域，請刷新頁面重試');
        return;
    }
    
    const rows = batchRewardItems.querySelectorAll('.batch-reward-row');
    console.log(`找到 ${rows.length} 個獎勵行`);
    if (rows.length === 0) {
        alert('請至少添加一個獎勵！');
        return;
    }
    
    const unclaimedRewards = rewards.filter(r => !r.claimed);
    const availableSlots = 20 - unclaimedRewards.length;
    
    let addedCount = 0;
    let errorMessages = [];
    
    rows.forEach((row, index) => {
        const rowNum = index + 1;
        const nameInput = row.querySelector('.batch-reward-name');
        const scoreInput = row.querySelector('.batch-reward-score');
        
        if (!nameInput || !scoreInput) return;
        
        const name = nameInput.value.trim();
        const requiredScore = scoreInput.value ? parseInt(scoreInput.value) : null;
        
        // 跳過空行
        if (!name && !requiredScore) {
            return;
        }
        
        // 驗證獎勵名稱
        if (!name || name.length === 0) {
            errorMessages.push(`第 ${rowNum} 行：請輸入獎勵名稱`);
            return;
        }
        
        // 驗證積分
        if (!requiredScore || !['10', '20', '50', '100'].includes(scoreInput.value)) {
            errorMessages.push(`第 ${rowNum} 行：請選擇積分（10、20、50或100）`);
            return;
        }
        
        // 檢查是否超過上限
        if (addedCount >= availableSlots) {
            errorMessages.push(`第 ${rowNum} 行：未領取獎勵已達上限（20個）`);
            return;
        }
        
        // 創建獎勵
        const reward = {
            id: rewardIdCounter++,
            name: name,
            requiredScore: requiredScore,
            claimed: false
        };
        
        rewards.push(reward);
        addedCount++;
    });
    
    // 顯示錯誤訊息（如果有）
    if (errorMessages.length > 0) {
        const errorMsg = `以下獎勵格式錯誤：\n\n${errorMessages.join('\n')}\n\n${addedCount > 0 ? `已成功新增 ${addedCount} 個獎勵。` : '請修正錯誤後再試。'}`;
        alert(errorMsg);
    }
    
    // 如果有成功新增的獎勵，保存並更新顯示
    if (addedCount > 0) {
        saveData();
        updateDisplay();
        
        // 如果有錯誤，不清空輸入框，讓用戶修正
        if (errorMessages.length === 0) {
            // 將 NodeList 轉換為數組，避免在刪除時出現問題
            const rowsArray = Array.from(rows);
            // 從後往前刪除，保留第一行
            for (let i = rowsArray.length - 1; i > 0; i--) {
                if (rowsArray[i] && rowsArray[i].parentNode) {
                    rowsArray[i].remove();
                }
            }
            
            // 清空第一行的輸入框
            const firstRow = rowsArray[0];
            if (firstRow) {
                const nameInput = firstRow.querySelector('.batch-reward-name');
                const scoreSelect = firstRow.querySelector('.batch-reward-score');
                if (nameInput) nameInput.value = '';
                if (scoreSelect) scoreSelect.value = '20';
            }
            
            alert(`✅ 成功新增 ${addedCount} 個獎勵！`);
        }
    } else if (errorMessages.length === 0) {
        alert('請至少填寫一個完整的獎勵！');
    }
}

// 抽獎
function drawGacha(type) {
    // 根據類型篩選不同積分範圍的獎勵
    let availableRewards = [];
    let requiredScore = 0;
    let typeName = '';
    
    if (type === 'normal') {
        // 一般抽獎：10~20積分
        availableRewards = rewards.filter(r => {
            if (r.claimed) return false;
            const rewardScore = r.requiredScore !== undefined ? r.requiredScore : 20;
            return (rewardScore === 10 || rewardScore === 20) && score >= rewardScore;
        });
        requiredScore = 20; // 一般抽獎固定扣除20分
        typeName = '一般抽獎';
    } else if (type === 'luxury') {
        // 豪華抽獎：50積分
        availableRewards = rewards.filter(r => {
            if (r.claimed) return false;
            const rewardScore = r.requiredScore !== undefined ? r.requiredScore : 20;
            return rewardScore === 50 && score >= 50;
        });
        requiredScore = 50;
        typeName = '豪華抽獎';
    } else if (type === 'premium') {
        // 頂級抽獎：100積分
        availableRewards = rewards.filter(r => {
            if (r.claimed) return false;
            const rewardScore = r.requiredScore !== undefined ? r.requiredScore : 20;
            return rewardScore === 100 && score >= 100;
        });
        requiredScore = 100;
        typeName = '頂級抽獎';
    }
    
    if (availableRewards.length === 0) {
        if (type === 'normal') {
            alert('一般抽獎沒有可用的獎勵（10或20積分）！');
        } else if (type === 'luxury') {
            alert('豪華抽獎沒有可用的獎勵（50積分）或積分不足！');
        } else if (type === 'premium') {
            alert('頂級抽獎沒有可用的獎勵（100積分）或積分不足！');
        }
        return;
    }

    // 隨機抽取一個可用的獎勵
    const randomIndex = Math.floor(Math.random() * availableRewards.length);
    const selectedReward = availableRewards[randomIndex];
    
    // 扣除所需積分
    score -= requiredScore;
    selectedReward.claimed = true;

    saveData();
    updateDisplay();

    // 顯示彈窗結果
    showGachaResult(selectedReward.name);

    // 動畫效果
    const gachaMachine = document.getElementById('gachaMachine');
    gachaMachine.style.animation = 'spin 1s ease-in-out';
    setTimeout(() => {
        gachaMachine.style.animation = '';
    }, 1000);
}

// 顯示抽獎結果彈窗
function showGachaResult(rewardName) {
    const modal = document.getElementById('gachaResultModal');
    const rewardElement = document.getElementById('gachaResultReward');
    
    if (!modal || !rewardElement) return;
    
    rewardElement.textContent = rewardName;
    modal.style.display = 'block';
    
    // 創建彩帶效果
    createConfetti();
}

// 關閉抽獎結果彈窗
function closeGachaModal() {
    const modal = document.getElementById('gachaResultModal');
    if (modal) {
        modal.style.display = 'none';
        // 清除彩帶
        const confettiContainer = document.getElementById('confettiContainer');
        if (confettiContainer) {
            confettiContainer.innerHTML = '';
        }
    }
}

// 安全地解析 JSON 響應
async function safeJsonParse(response) {
    try {
        // 檢查響應是否有內容
        const contentType = response.headers.get('content-type');
        const text = await response.text();
        
        // 如果響應為空
        if (!text || text.trim().length === 0) {
            throw new Error('服務器返回空響應');
        }
        
        // 檢查 Content-Type 是否為 JSON
        if (contentType && !contentType.includes('application/json')) {
            console.error('非 JSON 響應，Content-Type:', contentType);
            console.error('響應內容前 500 字元:', text.substring(0, 500));
            throw new Error(`服務器返回非 JSON 格式的響應 (${contentType})`);
        }
        
        // 嘗試解析 JSON
        try {
            return JSON.parse(text);
        } catch (parseError) {
            console.error('JSON 解析失敗:', parseError);
            console.error('響應內容前 500 字元:', text.substring(0, 500));
            throw new Error(`JSON 解析失敗: ${parseError.message}`);
        }
    } catch (error) {
        // 如果是我們自己拋出的錯誤，直接重新拋出
        if (error.message.includes('服務器返回') || error.message.includes('JSON 解析失敗')) {
            throw error;
        }
        // 其他錯誤（如網絡錯誤）
        throw error;
    }
}

// 開始 AI 拖延診斷
async function startDiagnosis() {
    const diagnosisBtn = document.getElementById('diagnosisBtn');
    const loadingDiv = document.getElementById('diagnosisLoading');
    const resultDiv = document.getElementById('diagnosisResult');
    
    if (!diagnosisBtn || !loadingDiv || !resultDiv) return;
    
    // 獲取已完成的任務
    const completedTasks = tasks.filter(task => task.completed && task.feeling);
    
    if (completedTasks.length === 0) {
        alert('目前沒有已完成且有記錄感受的任務，請先完成一些任務並記錄感受！');
        return;
    }
    
    // 顯示載入狀態
    diagnosisBtn.disabled = true;
    loadingDiv.style.display = 'flex';
    resultDiv.style.display = 'none';
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/diagnose-procrastination`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                completed_tasks: completedTasks.map(task => ({
                    title: task.title,
                    feeling: task.feeling,
                    deadline: task.deadline,
                    completedDate: task.completedDate,
                    priority: task.priority
                }))
            })
        });
        
        // 安全地解析響應
        const data = await safeJsonParse(response);
        
        if (!response.ok) {
            const errorMsg = data.error || '診斷失敗';
            
            // 如果是配額限制錯誤，顯示更友好的訊息
            if (response.status === 429 || data.error_type === 'quota_exceeded') {
                let quotaMsg = 'API 配額已用完。免費層每天限制 20 次請求。';
                if (data.retry_after) {
                    quotaMsg += ` 請在 ${Math.ceil(parseFloat(data.retry_after))} 秒後重試。`;
                } else {
                    quotaMsg += ' 請稍後再試或明天再使用此功能。';
                }
                throw new Error(quotaMsg);
            }
            
            throw new Error(errorMsg);
        }
        
        displayDiagnosisResult(data);
        
    } catch (error) {
        console.error('診斷錯誤:', error);
        
        let errorMessage = error.message;
        let errorDetails = '請確認後端服務是否正常運行';
        
        // 檢查是否是 JSON 解析錯誤
        if (error.message.includes('JSON 解析失敗') || error.message.includes('Unexpected end of JSON input') || 
            error.message.includes('服務器返回空響應') || error.message.includes('非 JSON 格式')) {
            errorMessage = '無法解析服務器響應';
            errorDetails = `後端服務器可能未正常運行或返回了無效的響應。請檢查：<br>
                1. 後端服務器是否在運行（${API_BASE_URL}）<br>
                2. 瀏覽器控制台是否有更多錯誤訊息<br>
                3. 網絡連接是否正常<br>
                4. 後端服務器日誌是否有錯誤`;
        }
        // 檢查是否是網絡連接錯誤
        else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            errorMessage = '無法連接到後端服務器';
            errorDetails = `請確認後端服務器已啟動並運行在 ${API_BASE_URL}`;
        }
        // 檢查是否是配額限制錯誤
        else if (error.message.includes('429') || error.message.includes('quota') || error.message.includes('配額')) {
            errorDetails = 'API 配額已用完。免費層每天限制 20 次請求。請稍後再試或明天再使用此功能。';
        }
        
        resultDiv.innerHTML = `
            <div class="ai-error">
                <p>❌ 診斷失敗：${errorMessage}</p>
                <p style="font-size: 0.9em; color: #666; margin-top: 10px;">${errorDetails}</p>
            </div>
        `;
        resultDiv.style.display = 'block';
    } finally {
        diagnosisBtn.disabled = false;
        loadingDiv.style.display = 'none';
    }
}

// 將 Markdown 語法轉換為 HTML
function markdownToHtml(text) {
    if (!text) return '';
    
    // 轉換 **粗體** 為 <strong>
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // 轉換 *斜體* 為 <em>
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
    // 轉換 ## 標題 為 <h4>
    text = text.replace(/^##\s+(.+)$/gm, '<h4>$1</h4>');
    // 轉換 # 標題 為 <h3>
    text = text.replace(/^#\s+(.+)$/gm, '<h3>$1</h3>');
    // 轉換 - 列表項 為 <li>
    text = text.replace(/^-\s+(.+)$/gm, '<li>$1</li>');
    // 轉換數字列表 為 <li>
    text = text.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>');
    
    // 將連續的 <li> 包裹在 <ul> 中
    text = text.replace(/(<li>.*<\/li>\n?)+/g, function(match) {
        return '<ul>' + match + '</ul>';
    });
    
    // 將段落分割（雙換行）
    let paragraphs = text.split(/\n\n+/);
    paragraphs = paragraphs.map(p => {
        p = p.trim();
        if (!p) return '';
        // 如果已經是 HTML 標籤，直接返回
        if (p.startsWith('<')) {
            return p;
        }
        // 否則包裹在 <p> 中
        return '<p>' + p + '</p>';
    });
    
    return paragraphs.join('');
}

// 顯示診斷結果
function displayDiagnosisResult(data) {
    const resultDiv = document.getElementById('diagnosisResult');
    if (!resultDiv) return;
    
    let html = '<div class="diagnosis-result">';
    html += '<div class="diagnosis-header">';
    html += '<h3>📊 診斷結果</h3>';
    html += '</div>';
    
    html += '<div class="diagnosis-content">';
    
    // 新格式：一句原因 + 三個解決方案
    if (data.cause && data.solutions) {
        html += '<div class="diagnosis-cause">';
        html += '<h4>🔍 拖延原因</h4>';
        html += `<p class="cause-text">${escapeHtml(data.cause)}</p>`;
        html += '</div>';
        
        html += '<div class="diagnosis-solutions">';
        html += '<h4>💡 解決方案</h4>';
        html += '<ul class="solutions-list">';
        data.solutions.forEach((solution, index) => {
            html += `<li><span class="solution-number">${index + 1}</span><span class="solution-text">${escapeHtml(solution)}</span></li>`;
        });
        html += '</ul>';
        html += '</div>';
    } 
    // 兼容舊格式：summary
    else if (data.summary) {
        html += '<div class="diagnosis-summary">';
        const formattedSummary = markdownToHtml(data.summary);
        html += formattedSummary;
        html += '</div>';
    } 
    // 兼容舊格式：分項顯示
    else {
        if (data.patterns) {
            html += '<div class="diagnosis-item">';
            html += '<h4>🔍 拖延模式</h4>';
            html += `<p>${escapeHtml(data.patterns)}</p>`;
            html += '</div>';
        }
        
        if (data.triggers) {
            html += '<div class="diagnosis-item">';
            html += '<h4>⚡ 容易拖延的情況</h4>';
            html += `<p>${escapeHtml(data.triggers)}</p>`;
            html += '</div>';
        }
        
        if (data.causes) {
            html += '<div class="diagnosis-item">';
            html += '<h4>💭 可能的原因</h4>';
            html += `<p>${escapeHtml(data.causes)}</p>`;
            html += '</div>';
        }
        
        if (data.suggestions && Array.isArray(data.suggestions)) {
            html += '<div class="diagnosis-item">';
            html += '<h4>💡 改善建議</h4>';
            html += '<ul class="suggestions-list">';
            data.suggestions.forEach(suggestion => {
                html += `<li>${escapeHtml(suggestion)}</li>`;
            });
            html += '</ul>';
            html += '</div>';
        }
    }
    
    html += '</div>';
    html += '<div class="diagnosis-footer">';
    html += '<button class="btn-clear-result" onclick="clearDiagnosisResult()">清除結果</button>';
    html += '</div>';
    html += '</div>';
    
    resultDiv.innerHTML = html;
    resultDiv.style.display = 'block';
    
    // 添加動畫效果
    setTimeout(() => {
        resultDiv.style.opacity = '1';
        resultDiv.style.transform = 'translateY(0)';
    }, 10);
}

// 清除診斷結果
function clearDiagnosisResult() {
    const resultDiv = document.getElementById('diagnosisResult');
    if (resultDiv) {
        resultDiv.style.display = 'none';
        resultDiv.innerHTML = '';
    }
}

// 創建彩帶效果
function createConfetti() {
    const confettiContainer = document.getElementById('confettiContainer');
    if (!confettiContainer) return;
    
    confettiContainer.innerHTML = '';
    
    const colors = ['#667eea', '#764ba2', '#f39c12', '#e74c3c', '#27ae60', '#3498db', '#9b59b6', '#e67e22'];
    const confettiCount = 50;
    
    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDelay = Math.random() * 2 + 's';
        confetti.style.animationDuration = (Math.random() * 3 + 2) + 's';
        confetti.style.width = (Math.random() * 10 + 5) + 'px';
        confetti.style.height = (Math.random() * 10 + 5) + 'px';
        confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
        confettiContainer.appendChild(confetti);
    }
}

// 格式化日期
function formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
}

// AI 任務拆解
async function breakdownTaskWithAI() {
    console.log('開始 AI 任務拆解...');
    
    const taskInput = document.getElementById('aiTaskInput');
    const taskText = taskInput ? taskInput.value.trim() : '';
    const loadingDiv = document.getElementById('aiLoading');
    const resultDiv = document.getElementById('aiResult');
    const breakdownBtn = document.getElementById('aiBreakdownBtn');
    
    if (!taskInput) {
        console.error('找不到 aiTaskInput 元素');
        alert('系統錯誤：找不到輸入框');
        return;
    }
    
    if (!taskText) {
        alert('請輸入要拆解的任務！');
        taskInput.focus();
        return;
    }
    
    console.log('任務內容:', taskText);
    
    // 顯示載入狀態
    if (loadingDiv) loadingDiv.style.display = 'flex';
    if (resultDiv) {
        resultDiv.style.display = 'none';
        resultDiv.innerHTML = '';
    }
    if (breakdownBtn) breakdownBtn.disabled = true;
    
    try {
        console.log('發送請求到後端...');
        // 調用後端 API
        const response = await fetch(`${API_BASE_URL}/api/breakdown-task`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ task: taskText })
        });
        
        console.log('收到回應，狀態碼:', response.status);
        console.log('回應 Content-Type:', response.headers.get('content-type'));
        
        // 安全地解析響應
        const data = await safeJsonParse(response);
        console.log('回應數據:', data);
        
        if (!response.ok) {
            throw new Error(data.error || `請求失敗 (狀態碼: ${response.status})`);
        }
        
        if (!data.subtasks || !Array.isArray(data.subtasks) || data.subtasks.length === 0) {
            throw new Error('AI 未返回有效的子任務');
        }
        
        console.log('成功獲得子任務，數量:', data.subtasks.length);
        
        // 顯示結果（傳入原始任務名稱）
        displayBreakdownResult(data.subtasks, taskText);
        
    } catch (error) {
        console.error('AI 任務拆解錯誤:', error);
        console.error('錯誤詳情:', error.message, error.stack);
        
        let errorMessage = error.message;
        let errorDetails = `請檢查：<br>
            1. 後端服務器是否在運行（${API_BASE_URL}）<br>
            2. 瀏覽器控制台是否有更多錯誤訊息<br>
            3. 網絡連接是否正常`;
        
        // 檢查是否是 JSON 解析錯誤
        if (error.message.includes('JSON 解析失敗') || error.message.includes('Unexpected end of JSON input') || 
            error.message.includes('服務器返回空響應') || error.message.includes('非 JSON 格式')) {
            errorMessage = '無法解析服務器響應';
            errorDetails = `後端服務器可能未正常運行或返回了無效的響應。請檢查：<br>
                1. 後端服務器是否在運行（${API_BASE_URL}）<br>
                2. 瀏覽器控制台是否有更多錯誤訊息<br>
                3. 網絡連接是否正常<br>
                4. 後端服務器日誌是否有錯誤`;
        }
        // 檢查是否是網絡連接錯誤
        else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            errorMessage = '無法連接到後端服務器';
            errorDetails = `請確認後端服務器已啟動並運行在 ${API_BASE_URL}`;
        }
        
        if (resultDiv) {
            resultDiv.innerHTML = `
                <div class="ai-error">
                    <p><strong>❌ 錯誤：</strong>${errorMessage}</p>
                    <p style="font-size: 0.9em; color: #666; margin-top: 10px;">${errorDetails}</p>
                </div>
            `;
            resultDiv.style.display = 'block';
            // 滾動到結果區域
            resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
            alert(`錯誤：${errorMessage}`);
        }
    } finally {
        if (loadingDiv) loadingDiv.style.display = 'none';
        if (breakdownBtn) breakdownBtn.disabled = false;
    }
}

// 顯示拆解結果
function displayBreakdownResult(subtasks, originalTask = '') {
    const resultDiv = document.getElementById('aiResult');
    
    if (!subtasks || subtasks.length === 0) {
        resultDiv.innerHTML = `
            <div class="ai-error">
                <p>⚠️ 未獲得有效的子任務</p>
                <p style="font-size: 0.9em; color: #666; margin-top: 10px;">
                    AI 未能成功拆解任務，請嘗試重新輸入或調整任務描述
                </p>
            </div>
        `;
        resultDiv.style.display = 'block';
        resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        return;
    }
    
    let html = '<div class="ai-subtasks">';
    
    // 顯示原始任務
    if (originalTask) {
        html += `<div class="ai-original-task">
            <span class="ai-label">原始任務：</span>
            <span class="ai-task-text">${originalTask}</span>
        </div>`;
    }
    
    html += '<h4>✨ AI 拆解結果：</h4>';
    html += `<p class="ai-subtask-count">共拆解出 <strong>${subtasks.length}</strong> 個子任務</p>`;
    
    // 計算默認截止日期（7天後）
    const today = new Date();
    const defaultDeadline = new Date(today);
    defaultDeadline.setDate(today.getDate() + 7);
    const defaultDeadlineStr = defaultDeadline.toISOString().split('T')[0];
    
    html += '<div class="subtask-list">';
    
    subtasks.forEach((subtask, index) => {
        const title = subtask.title || subtask;
        const safeTitle = escapeHtml(title).replace(/"/g, '&quot;');
        
        html += `
            <div class="subtask-item" data-index="${index}">
                <div class="subtask-number">${index + 1}</div>
                <div class="subtask-content">
                    <div class="subtask-title">${escapeHtml(title)}</div>
                    <div class="subtask-settings">
                        <div class="subtask-setting-item">
                            <label>📅 截止日期：</label>
                            <input type="date" class="subtask-deadline" data-index="${index}" value="${defaultDeadlineStr}">
                        </div>
                        <div class="subtask-setting-item">
                            <label>⚡ 優先度：</label>
                            <select class="subtask-priority" data-index="${index}" required>
                                <option value="" selected>請選擇優先度</option>
                                <option value="low">低</option>
                                <option value="medium">中</option>
                                <option value="high">高</option>
                            </select>
                        </div>
                    </div>
                </div>
                <button class="btn-add-subtask" data-index="${index}" data-title="${safeTitle}">
                    加入任務
                </button>
            </div>
        `;
    });
    
    html += '</div>';
    html += '<div class="ai-actions">';
    html += '<button class="btn-add-all" id="btnAddAllSubtasks">📋 一鍵加入所有子任務</button>';
    html += '<button class="btn-clear-result" id="btnClearResult">清除結果</button>';
    html += '</div>';
    html += '</div>';
    
    resultDiv.innerHTML = html;
    resultDiv.style.display = 'block';
    
    // 綁定事件監聽器（使用事件委託，避免 onclick 的問題）
    const addAllBtn = document.getElementById('btnAddAllSubtasks');
    if (addAllBtn) {
        addAllBtn.addEventListener('click', addAllSubtasksAsTasks);
    }
    
    const clearBtn = document.getElementById('btnClearResult');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearAIResult);
    }
    
    // 為每個子任務的「加入任務」按鈕綁定事件
    resultDiv.querySelectorAll('.btn-add-subtask').forEach(btn => {
        btn.addEventListener('click', function(e) {
            const index = this.getAttribute('data-index');
            const title = this.getAttribute('data-title');
            if (title && index !== null) {
                // 獲取該子任務的日期和優先度
                const deadlineInput = resultDiv.querySelector(`.subtask-deadline[data-index="${index}"]`);
                const prioritySelect = resultDiv.querySelector(`.subtask-priority[data-index="${index}"]`);
                const deadline = deadlineInput ? deadlineInput.value : '';
                const priority = prioritySelect ? prioritySelect.value : '';
                
                if (!priority || priority === '') {
                    alert('請選擇優先度！');
                    if (prioritySelect) prioritySelect.focus();
                    return;
                }
                
                // 將按鈕元素和設定傳遞給函數
                addSubtaskAsTask(title, this, deadline, priority);
            }
        });
    });
    
    // 為新創建的優先度選擇器設置禁用「請選擇優先度」功能
    resultDiv.querySelectorAll('.subtask-priority').forEach(select => {
        if (window.setupPrioritySelectors) {
            setupPrioritySelectorsForElement(select);
        }
    });
    
    // 添加顯示動畫
    resultDiv.style.opacity = '0';
    resultDiv.style.transform = 'translateY(-10px)';
    setTimeout(() => {
        resultDiv.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        resultDiv.style.opacity = '1';
        resultDiv.style.transform = 'translateY(0)';
    }, 10);
    
    // 滾動到結果區域
    setTimeout(() => {
        resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
    
    // 保存當前拆解結果供後續使用
    window.currentSubtasks = subtasks;
}

// HTML 轉義函數（防止 XSS）
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 清除 AI 結果
function clearAIResult() {
    const resultDiv = document.getElementById('aiResult');
    const taskInput = document.getElementById('aiTaskInput');
    resultDiv.style.display = 'none';
    resultDiv.innerHTML = '';
    taskInput.value = '';
    window.currentSubtasks = null;
}

// 將子任務加入為任務
function addSubtaskAsTask(subtaskTitle, buttonElement = null, deadline = '', priority = 'medium') {
    // 解碼 HTML 實體（如果有的話）
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = subtaskTitle;
    const decodedTitle = tempDiv.textContent || tempDiv.innerText || subtaskTitle;
    
    // 如果沒有提供日期和優先度，嘗試從全局選擇器獲取（向後兼容）
    if (!deadline) {
        const deadlineInput = document.getElementById('aiTaskDeadline');
        deadline = deadlineInput ? deadlineInput.value : '';
    }
    if (!priority || priority === '') {
        const prioritySelect = document.getElementById('aiTaskPriority');
        priority = prioritySelect ? prioritySelect.value : '';
    }
    
    // 檢查是否在 AI 拆解頁面
    if (window.location.pathname.includes('ai-breakdown.html')) {
        // 直接創建任務並保存
        if (!deadline) {
            alert('請選擇截止日期！');
            return;
        }
        
        if (!priority || priority === '') {
            alert('請選擇優先度！');
            return;
        }
        
        const task = {
            id: taskIdCounter++,
            title: decodedTitle,
            deadline: deadline,
            priority: priority,
            completed: false,
            completedDate: null
        };
        
        tasks.push(task);
        saveData();
        updateDisplay();
        
        // 顯示成功訊息（如果有按鈕元素）
        if (buttonElement) {
            const originalText = buttonElement.textContent;
            buttonElement.textContent = '✓ 已加入';
            buttonElement.style.background = 'linear-gradient(135deg, #27ae60 0%, #229954 100%)';
            buttonElement.disabled = true;
            
            setTimeout(() => {
                buttonElement.textContent = originalText;
                buttonElement.style.background = '';
                buttonElement.disabled = false;
            }, 2000);
        }
        
        return;
    }
    
    // 如果在任務頁面，填入表單
    const taskTitleInput = document.getElementById('taskTitle');
    const taskDeadlineInput = document.getElementById('taskDeadline');
    const taskPrioritySelect = document.getElementById('taskPriority');
    
    if (taskTitleInput) {
        taskTitleInput.value = decodedTitle;
        if (taskDeadlineInput && deadline) {
            taskDeadlineInput.value = deadline;
        }
        if (taskPrioritySelect && priority) {
            taskPrioritySelect.value = priority;
        }
        taskTitleInput.focus();
        
        // 滾動到任務表單
        const taskForm = document.querySelector('.task-form');
        if (taskForm) {
            taskForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }
}

// 將所有子任務加入為任務
function addAllSubtasksAsTasks() {
    if (!window.currentSubtasks || window.currentSubtasks.length === 0) {
        alert('沒有可用的子任務');
        return;
    }
    
    const resultDiv = document.getElementById('aiResult');
    if (!resultDiv) {
        alert('找不到結果區域');
        return;
    }
    
    let addedCount = 0;
    let hasError = false;
    
    window.currentSubtasks.forEach((subtask, index) => {
        const taskTitle = subtask.title || subtask;
        if (taskTitle.trim()) {
            // 獲取該子任務的日期和優先度
            const deadlineInput = resultDiv.querySelector(`.subtask-deadline[data-index="${index}"]`);
            const prioritySelect = resultDiv.querySelector(`.subtask-priority[data-index="${index}"]`);
            
            const deadline = deadlineInput ? deadlineInput.value : '';
            const priority = prioritySelect ? prioritySelect.value : '';
            
            if (!deadline) {
                hasError = true;
                if (deadlineInput) {
                    deadlineInput.focus();
                    deadlineInput.style.borderColor = '#e74c3c';
                    setTimeout(() => {
                        deadlineInput.style.borderColor = '';
                    }, 2000);
                }
                return;
            }
            
            if (!priority || priority === '') {
                hasError = true;
                if (prioritySelect) {
                    prioritySelect.focus();
                    prioritySelect.style.borderColor = '#e74c3c';
                    setTimeout(() => {
                        prioritySelect.style.borderColor = '';
                    }, 2000);
                }
                return;
            }
            
            const task = {
                id: taskIdCounter++,
                title: taskTitle,
                deadline: deadline,
                priority: priority,
                completed: false,
                completedDate: null
            };
            tasks.push(task);
            addedCount++;
        }
    });
    
    if (hasError && addedCount === 0) {
        alert('請為所有子任務選擇截止日期和優先度！');
        return;
    }
    
    if (addedCount > 0) {
        saveData();
        updateDisplay();
        
        // 顯示成功訊息
        if (hasError) {
            alert(`⚠️ 成功加入 ${addedCount} 個子任務！\n\n部分任務因未選擇日期而跳過。`);
        } else {
            alert(`✅ 成功加入 ${addedCount} 個子任務！`);
        }
        
        // 如果不在任務頁面，詢問是否跳轉
        if (window.location.pathname.includes('ai-breakdown.html')) {
            if (confirm(`已成功加入 ${addedCount} 個子任務！\n\n是否要跳轉到任務頁面查看？`)) {
                window.location.href = 'tasks.html';
            }
        }
        
        // 清空 AI 輸入框和結果
        const aiTaskInput = document.getElementById('aiTaskInput');
        const aiResult = document.getElementById('aiResult');
        if (aiTaskInput) aiTaskInput.value = '';
        if (aiResult) aiResult.style.display = 'none';
        window.currentSubtasks = null;
    }
}

// 事件監聽器
document.addEventListener('DOMContentLoaded', () => {
    loadData();

    const addTaskBtn = document.getElementById('addTaskBtn');
    if (addTaskBtn) {
        addTaskBtn.addEventListener('click', addTask);
    }
    
    const addRewardBtn = document.getElementById('addRewardBtn');
    if (addRewardBtn) {
        addRewardBtn.addEventListener('click', addReward);
    }
    
    const gachaBtn = document.getElementById('gachaBtn');
    if (gachaBtn) {
        gachaBtn.addEventListener('click', drawGacha);
    }

    // 按Enter鍵新增任務
    document.getElementById('taskTitle').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTask();
        }
    });

    document.getElementById('taskDeadline').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTask();
        }
    });

    // 按Enter鍵新增獎勵
    const rewardName = document.getElementById('rewardName');
    if (rewardName) {
        rewardName.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                addReward();
            }
        });
    }
    
    // AI 任務拆解按鈕
    const aiBreakdownBtn = document.getElementById('aiBreakdownBtn');
    if (aiBreakdownBtn) {
        aiBreakdownBtn.addEventListener('click', breakdownTaskWithAI);
    }
    
    // AI 任務輸入框 Enter 鍵
    const aiTaskInput = document.getElementById('aiTaskInput');
    if (aiTaskInput) {
        aiTaskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                breakdownTaskWithAI();
            }
        });
    }
    
    // 為所有優先度選擇器添加禁用「請選擇優先度」的功能
    setupPrioritySelectors();
});

// 為單個優先度選擇器設置禁用「請選擇優先度」功能
function setupPrioritySelectorsForElement(selectElement) {
    if (!selectElement) return;
    
    // 如果已經設置過，跳過
    if (selectElement.dataset.prioritySetup === 'true') return;
    selectElement.dataset.prioritySetup = 'true';
    
    // 找到「請選擇優先度」選項
    const placeholderOption = Array.from(selectElement.options).find(opt => opt.value === '');
    if (!placeholderOption) return;
    
    // 如果當前選中的是「請選擇優先度」，則在打開下拉選單時禁用它
    const handleOpen = () => {
        if (selectElement.value === '' && !placeholderOption.disabled) {
            placeholderOption.disabled = true;
        }
    };
    
    // 當選擇改變時，如果選擇了其他選項，保持禁用狀態
    const handleChange = () => {
        if (selectElement.value !== '') {
            placeholderOption.disabled = true;
        }
    };
    
    // 綁定事件
    selectElement.addEventListener('mousedown', handleOpen);
    selectElement.addEventListener('focus', handleOpen);
    selectElement.addEventListener('change', handleChange);
}

// 設置優先度選擇器：當點開下拉選單後，禁用「請選擇優先度」選項
function setupPrioritySelectors() {
    // 為現有的優先度選擇器設置
    const taskPriority = document.getElementById('taskPriority');
    if (taskPriority) {
        setupPrioritySelectorsForElement(taskPriority);
    }
    
    // 將函數暴露到全局，供其他函數調用
    window.setupPrioritySelectors = setupPrioritySelectors;
    window.setupPrioritySelectorsForElement = setupPrioritySelectorsForElement;
    
    // 使用 MutationObserver 監聽新添加的優先度選擇器（用於 AI 拆解結果和編輯模式）
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1) { // Element node
                    // 檢查是否是優先度選擇器
                    if (node.tagName === 'SELECT' && 
                        (node.classList.contains('subtask-priority') || 
                         node.id && (node.id.startsWith('editPriority_') || node.id === 'taskPriority'))) {
                        setupPrioritySelectorsForElement(node);
                    }
                    // 檢查子元素中是否有優先度選擇器
                    if (node.querySelectorAll) {
                        const prioritySelects = node.querySelectorAll('.subtask-priority, [id^="editPriority_"], #taskPriority');
                        prioritySelects.forEach(select => {
                            setupPrioritySelectorsForElement(select);
                        });
                    }
                }
            });
        });
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

// 添加旋轉動畫
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);


