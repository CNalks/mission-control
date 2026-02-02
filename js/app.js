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
    console.log('Mission Control 初始化...');
    if (STATE.token) {
        console.log('发现已保存的令牌，尝试加载数据...');
        loadData();
    } else {
        console.log('未找到令牌，显示登录界面');
        showLogin();
    }
});

// 显示登录界面
function showLogin() {
    console.log('显示登录界面');
    const loginScreen = document.getElementById('login-screen');
    const dashboard = document.getElementById('dashboard');
    if (loginScreen) loginScreen.style.display = 'flex';
    if (dashboard) dashboard.style.display = 'none';
    
    // 隐藏加载状态
    const loading = document.getElementById('login-loading');
    if (loading) loading.style.display = 'none';
}

// 显示仪表板
function showDashboard() {
    console.log('显示仪表板');
    const loginScreen = document.getElementById('login-screen');
    const dashboard = document.getElementById('dashboard');
    if (loginScreen) loginScreen.style.display = 'none';
    if (dashboard) dashboard.style.display = 'block';
}

// 处理登录
async function handleLogin() {
    console.log('开始登录流程...');
    
    const tokenInput = document.getElementById('login-token-input');
    const loginBtn = document.getElementById('login-btn');
    const loading = document.getElementById('login-loading');
    const error = document.getElementById('login-error');
    
    if (!tokenInput) {
        console.error('找不到令牌输入框');
        return;
    }
    
    const token = tokenInput.value.trim();
    
    // 隐藏之前的错误
    if (error) error.style.display = 'none';
    
    // 验证令牌格式
    if (!token) {
        alert('请输入 GitHub 令牌');
        return;
    }
    
    if (!token.startsWith('ghp_')) {
        alert('令牌格式不正确，应以 ghp_ 开头');
        return;
    }
    
    // 显示加载状态
    if (loginBtn) loginBtn.disabled = true;
    if (loading) loading.style.display = 'block';
    
    console.log('令牌格式正确，准备保存并加载数据...');
    
    STATE.token = token;
    localStorage.setItem('github_token', token);
    
    try {
        await loadData();
    } catch (err) {
        console.error('加载数据失败:', err);
        if (error) {
            error.textContent = '登录失败: ' + err.message;
            error.style.display = 'block';
        }
        // 重置按钮状态
        if (loginBtn) loginBtn.disabled = false;
        if (loading) loading.style.display = 'none';
    }
}

// 加载数据
async function loadData() {
    console.log('开始加载数据...');
    
    const loading = document.getElementById('login-loading');
    const error = document.getElementById('login-error');
    
    if (loading) loading.style.display = 'block';
    if (error) error.style.display = 'none';
    
    try {
        console.log('请求 GitHub API...');
        const response = await fetch(
            `https://api.github.com/repos/${CONFIG.owner}/${CONFIG.repo}/contents/${CONFIG.tasksFile}`,
            {
                headers: {
                    'Authorization': `token ${STATE.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );
        
        console.log('API 响应状态:', response.status);
        
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('令牌无效或已过期');
            } else if (response.status === 404) {
                throw new Error('找不到任务数据文件');
            } else {
                throw new Error(`请求失败: ${response.status}`);
            }
        }
        
        const fileData = await response.json();
        console.log('成功获取文件数据');
        
        const content = atob(fileData.content);
        STATE.data = JSON.parse(content);
        
        console.log('数据解析成功，任务数量:', STATE.data.tasks.length);
        
        renderTasks();
        showDashboard();
        
        console.log('数据加载完成，显示仪表板');
        
    } catch (err) {
        console.error('加载数据错误:', err);
        
        if (error) {
            error.textContent = '加载失败: ' + err.message;
            error.style.display = 'block';
        }
        
        // 如果是认证错误，清除令牌
        if (err.message.includes('令牌') || err.message.includes('401')) {
            logout();
        }
        
        throw err;
    } finally {
        // 确保隐藏加载状态
        const loadingEl = document.getElementById('login-loading');
        if (loadingEl) loadingEl.style.display = 'none';
        
        const btn = document.getElementById('login-btn');
        if (btn) btn.disabled = false;
    }
}

// 渲染任务
function renderTasks() {
    console.log('开始渲染任务...');
    
    const columns = ['backlog', 'in_progress', 'review', 'done'];
    const columnNames = {
        'backlog': '待办事项',
        'in_progress': '进行中',
        'review': '审核中',
        'done': '已完成'
    };
    
    columns.forEach(columnId => {
        const container = document.getElementById(`tasks-${columnId}`);
        if (!container) {
            console.warn(`找不到容器: tasks-${columnId}`);
            return;
        }
        
        const tasks = STATE.data.tasks.filter(t => t.status === columnId);
        
        console.log(`列 ${columnId}: ${tasks.length} 个任务`);
        
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
                <div class="task-title">${task.title || '无标题'}</div>
                ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
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
    
    console.log('任务渲染完成');
}

// 登出
function logout() {
    console.log('登出...');
    localStorage.removeItem('github_token');
    STATE.token = null;
    STATE.user = null;
    STATE.data = { tasks: [] };
    showLogin();
}
