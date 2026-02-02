// Mission Control - Chinese Version
// 任务控制中心 - 简体中文版本

const CONFIG = {
    owner: 'CNalks',
    repo: 'mission-control',
    tasksFile: 'data/tasks.json'
};

let STATE = {
    token: localStorage.getItem('github_token') || null,
    user: null,
    data: { tasks: [] },
    isLoading: false
};

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    if (STATE.token) {
        loadData();
    } else {
        showLogin();
    }
});

// 显示登录界面
function showLogin() {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('dashboard').style.display = 'none';
}

// 显示仪表板
function showDashboard() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
}

// 处理登录
async function handleLogin() {
    const tokenInput = document.getElementById('login-token-input');
    const token = tokenInput.value.trim();
    
    if (!token || !token.startsWith('ghp_')) {
        alert('请输入有效的 GitHub 令牌（以 ghp_ 开头）');
        return;
    }
    
    STATE.token = token;
    localStorage.setItem('github_token', token);
    
    await loadData();
}

// 加载数据
async function loadData() {
    try {
        const response = await fetch(
            `https://api.github.com/repos/${CONFIG.owner}/${CONFIG.repo}/contents/${CONFIG.tasksFile}`,
            {
                headers: {
                    'Authorization': `token ${STATE.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );
        
        if (!response.ok) {
            throw new Error('加载数据失败');
        }
        
        const fileData = await response.json();
        const content = atob(fileData.content);
        STATE.data = JSON.parse(content);
        
        renderTasks();
        showDashboard();
        
    } catch (error) {
        console.error('加载数据错误:', error);
        alert('加载数据失败，请检查令牌是否有效');
        logout();
    }
}

// 渲染任务
function renderTasks() {
    const columns = ['backlog', 'in_progress', 'review', 'done'];
    const columnNames = {
        'backlog': '待办事项',
        'in_progress': '进行中',
        'review': '审核中',
        'done': '已完成'
    };
    
    columns.forEach(columnId => {
        const container = document.getElementById(`tasks-${columnId}`);
        if (!container) return;
        
        const tasks = STATE.data.tasks.filter(t => t.status === columnId);
        
        if (tasks.length === 0) {
            container.innerHTML = '<div style="text-align: center; color: #8b949e; padding: 20px;">暂无任务</div>';
            return;
        }
        
        container.innerHTML = tasks.map(task => {
            const subtasksTotal = task.subtasks ? task.subtasks.length : 0;
            const subtasksDone = task.subtasks ? task.subtasks.filter(s => s.done).length : 0;
            const progress = subtasksTotal > 0 ? Math.round((subtasksDone / subtasksTotal) * 100) : 0;
            
            return `
            <div class="task-card" data-task-id="${task.id}">
                <div class="task-title">${task.title}</div>
                <div class="task-description">${task.description || ''}</div>
                ${task.tags && task.tags.length > 0 ? `
                    <div class="task-meta">
                        ${task.tags.map(tag => `<span class="task-tag">${tag}</span>`).join('')}
                    </div>
                ` : ''}
                ${subtasksTotal > 0 ? `
                    <div class="task-subtasks">
                        <div class="subtask-progress">
                            <span>${subtasksDone}/${subtasksTotal} 完成</span>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${progress}%"></div>
                            </div>
                            <span>${progress}%</span>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
        }).join('');
    });
}

// 登出
function logout() {
    localStorage.removeItem('github_token');
    STATE.token = null;
    STATE.data = { tasks: [] };
    showLogin();
}
ENDOFFILE
echo "App.js created"