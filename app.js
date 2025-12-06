// 數據模型
let tasks = [];
let rewards = [];
let score = 0;
let taskIdCounter = 0;
let rewardIdCounter = 0;

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
    taskList.innerHTML = '';

    tasks.forEach(task => {
        const taskItem = document.createElement('div');
        taskItem.className = `task-item ${task.priority}-priority ${task.completed ? 'completed' : ''}`;
        
        const deadline = new Date(task.deadline);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const isOverdue = deadline < today && !task.completed;
        
        const priorityText = {
            'high': '高優先度',
            'medium': '中優先度',
            'low': '低優先度'
        };

        taskItem.innerHTML = `
            <div class="task-info">
                <div class="task-title">${task.title}</div>
                <div class="task-details">
                    截止日期：${formatDate(task.deadline)} ${isOverdue ? '<span style="color: red;">（已逾期）</span>' : ''} | 
                    優先度:<span class="priority-text priority-${task.priority}">${priorityText[task.priority]}</span>
                </div>
            </div>
            <div class="task-actions">
                ${!task.completed ? `
                    <button class="btn-complete" onclick="completeTask(${task.id})">完成</button>
                    <button class="btn-edit" onclick="editTask(${task.id})">編輯</button>
                ` : ''}
                <button class="btn-delete" onclick="deleteTask(${task.id})">刪除</button>
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
        rewardItem.innerHTML = `
            <span class="reward-name">${reward.name}</span>
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
    const gachaBtn = document.getElementById('gachaBtn');
    if (score >= 20) {
        gachaBtn.disabled = false;
        gachaBtn.textContent = `抽獎（當前${score}分）`;
    } else {
        gachaBtn.disabled = true;
        gachaBtn.textContent = `抽獎（需要20分，當前${score}分）`;
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

    const task = {
        id: taskIdCounter++,
        title: title,
        deadline: deadline,
        priority: priority,
        completed: false,
        completedDate: null
    };

    tasks.push(task);
    saveData();
    updateDisplay();

    // 清空表單
    document.getElementById('taskTitle').value = '';
    document.getElementById('taskDeadline').value = '';
    document.getElementById('taskPriority').value = 'medium';
}

// 完成任務
function completeTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    task.completed = true;
    task.completedDate = new Date().toISOString().split('T')[0];

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
}

// 編輯任務
function editTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    // 找到包含編輯按鈕的任務項目
    const allTaskItems = document.querySelectorAll('.task-item');
    let taskItem = null;
    for (let item of allTaskItems) {
        const editBtn = item.querySelector(`button[onclick="editTask(${id})"]`);
        if (editBtn) {
            taskItem = item;
            break;
        }
    }
    if (!taskItem) return;

    const taskInfo = taskItem.querySelector('.task-info');
    const taskActions = taskItem.querySelector('.task-actions');

    const priorityText = {
        'high': '高優先度',
        'medium': '中優先度',
        'low': '低優先度'
    };

    taskInfo.innerHTML = `
        <div class="edit-mode">
            <input type="text" id="editTitle_${id}" value="${task.title}" placeholder="任務名稱">
            <input type="date" id="editDeadline_${id}" value="${task.deadline}">
            <select id="editPriority_${id}">
                <option value="high" ${task.priority === 'high' ? 'selected' : ''}>高優先度</option>
                <option value="medium" ${task.priority === 'medium' ? 'selected' : ''}>中優先度</option>
                <option value="low" ${task.priority === 'low' ? 'selected' : ''}>低優先度</option>
            </select>
            <button class="btn-save" onclick="saveTask(${id})">保存</button>
            <button class="btn-cancel" onclick="cancelEdit(${id})">取消</button>
        </div>
    `;
}

// 保存編輯
function saveTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const title = document.getElementById(`editTitle_${id}`).value.trim();
    const deadline = document.getElementById(`editDeadline_${id}`).value;
    const priority = document.getElementById(`editPriority_${id}`).value;

    if (!title || !deadline) {
        alert('請填寫任務名稱和截止日期！');
        return;
    }

    task.title = title;
    task.deadline = deadline;
    task.priority = priority;

    saveData();
    updateDisplay();
}

// 取消編輯
function cancelEdit(id) {
    updateDisplay();
}

// 刪除任務
function deleteTask(id) {
    if (confirm('確定要刪除這個任務嗎？')) {
        tasks = tasks.filter(t => t.id !== id);
        saveData();
        updateDisplay();
    }
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
        claimed: false
    };

    rewards.push(reward);
    saveData();
    updateDisplay();

    // 清空輸入框
    document.getElementById('rewardName').value = '';
}

// 抽獎
function drawGacha() {
    const unclaimedRewards = rewards.filter(r => !r.claimed);
    
    if (score < 20) {
        alert('積分不足！需要20分才能抽獎。');
        return;
    }

    if (unclaimedRewards.length === 0) {
        alert('沒有可用的獎勵！請先新增獎勵。');
        return;
    }

    // 扣除20分
    score -= 20;

    // 隨機抽取一個獎勵
    const randomIndex = Math.floor(Math.random() * unclaimedRewards.length);
    const selectedReward = unclaimedRewards[randomIndex];
    selectedReward.claimed = true;

    saveData();
    updateDisplay();

    // 顯示結果
    const gachaResult = document.getElementById('gachaResult');
    gachaResult.textContent = `🎉 恭喜獲得：${selectedReward.name} 🎉`;
    gachaResult.classList.add('show');

    // 動畫效果
    const gachaMachine = document.getElementById('gachaMachine');
    gachaMachine.style.animation = 'spin 1s ease-in-out';
    setTimeout(() => {
        gachaMachine.style.animation = '';
    }, 1000);

    setTimeout(() => {
        gachaResult.classList.remove('show');
    }, 3000);
}

// 格式化日期
function formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
}

// 事件監聽器
document.addEventListener('DOMContentLoaded', () => {
    loadData();

    document.getElementById('addTaskBtn').addEventListener('click', addTask);
    document.getElementById('addRewardBtn').addEventListener('click', addReward);
    document.getElementById('gachaBtn').addEventListener('click', drawGacha);

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
    document.getElementById('rewardName').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addReward();
        }
    });
});

// 添加旋轉動畫
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);


