const socket = io();
let scanResults = null;

document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initButtons();
    loadResources();
    startScan();
});

function initTabs() {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(tab.dataset.tab).classList.add('active');
        });
    });
}

function initButtons() {
    document.getElementById('scanBtn').addEventListener('click', startScan);
    document.getElementById('refreshBtn').addEventListener('click', startScan);
}

async function startScan() {
    showLoading(true);
    
    try {
        const response = await fetch('/api/scan');
        const data = await response.json();
        
        if (data.success) {
            scanResults = data.data;
            updateStats();
            renderServices();
            renderModels();
            renderApps();
            renderProcesses();
        }
    } catch (error) {
        console.error('Scan error:', error);
    }
    
    showLoading(false);
}

function showLoading(show) {
    document.querySelectorAll('.loading').forEach(el => {
        el.style.display = show ? 'block' : 'none';
    });
}

function updateStats() {
    if (!scanResults) return;
    
    document.getElementById('serviceCount').textContent = scanResults.services.length;
    document.getElementById('modelCount').textContent = scanResults.models.length;
    document.getElementById('appCount').textContent = scanResults.apps.length;
    document.getElementById('processCount').textContent = scanResults.processes.length;
}

function renderServices() {
    const container = document.getElementById('servicesList');
    if (!scanResults || !scanResults.services.length) {
        container.innerHTML = '<div class="empty-state"><div class="icon">🔧</div><p>未检测到运行中的AI服务</p></div>';
        return;
    }

    container.innerHTML = scanResults.services.map(service => `
        <div class="item-card">
            <div class="item-info">
                <h3>${service.name}</h3>
                <p>端口: ${service.port || 'N/A'} | PID: ${service.pid || 'N/A'}</p>
                ${service.modelsRaw ? `<p>模型: ${service.modelsRaw.substring(0, 100)}...</p>` : ''}
            </div>
            <div class="item-status">
                <span class="status-badge status-running">运行中</span>
            </div>
        </div>
    `).join('');
}

function renderModels() {
    const container = document.getElementById('modelsList');
    if (!scanResults || !scanResults.models.length) {
        container.innerHTML = '<div class="empty-state"><div class="icon">📁</div><p>未发现AI模型文件</p></div>';
        return;
    }

    container.innerHTML = scanResults.models.map(model => `
        <div class="item-card">
            <div class="item-info">
                <h3>${model.name}</h3>
                <p>类型: ${model.type}</p>
                <p>大小: ${model.sizeFormatted} | 路径: ${model.path}</p>
            </div>
            <div class="item-status">
                <span class="status-badge status-installed">${model.extension}</span>
            </div>
        </div>
    `).join('');
}

function renderApps() {
    const container = document.getElementById('appsList');
    if (!scanResults || !scanResults.apps.length) {
        container.innerHTML = '<div class="empty-state"><div class="icon">💻</div><p>未检测到AI应用程序</p></div>';
        return;
    }

    container.innerHTML = scanResults.apps.map(app => `
        <div class="item-card">
            <div class="item-info">
                <h3>${app.name}</h3>
                <p>路径: ${app.path || 'N/A'}</p>
            </div>
            <div class="item-status">
                <span class="status-badge ${app.running ? 'status-running' : 'status-installed'}">
                    ${app.running ? '运行中' : '已安装'}
                </span>
                <div class="item-actions">
                    ${app.installed && !app.running ? `<button class="action-btn action-btn-primary" onclick="launchApp('${app.name}')">启动</button>` : ''}
                    ${app.running ? `<button class="action-btn action-btn-danger" onclick="stopApp('${app.pid}')">停止</button>` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

function renderProcesses() {
    const container = document.getElementById('processesList');
    if (!scanResults || !scanResults.processes.length) {
        container.innerHTML = '<div class="empty-state"><div class="icon">⚙️</div><p>未检测到AI相关进程</p></div>';
        return;
    }

    container.innerHTML = scanResults.processes.map(proc => `
        <div class="item-card">
            <div class="item-info">
                <h3>${proc.name}</h3>
                <p>PID: ${proc.pid} | 类型: ${proc.type}</p>
                <p>内存: ${proc.memory || 'N/A'}</p>
            </div>
            <div class="item-status">
                <span class="status-badge status-running">运行中</span>
                <div class="item-actions">
                    <button class="action-btn action-btn-danger" onclick="killProcess(${proc.pid})">终止</button>
                </div>
            </div>
        </div>
    `).join('');
}

async function loadResources() {
    try {
        const response = await fetch('/api/resources');
        const data = await response.json();
        
        if (data.success) {
            updateResourceBars(data.data);
        }
    } catch (error) {
        console.error('Resource load error:', error);
    }
}

function updateResourceBars(resources) {
    document.getElementById('cpuBar').style.width = `${resources.cpuUsage}%`;
    document.getElementById('cpuText').textContent = `${resources.cpuUsage}%`;
    
    document.getElementById('memBar').style.width = `${resources.memUsage}%`;
    document.getElementById('memText').textContent = `${resources.memUsage}%`;
    
    if (resources.gpu && resources.gpu.length > 0) {
        const gpuHtml = resources.gpu.map(gpu => `
            <div class="gpu-item">
                <span>${gpu.name}</span>
                <span>${gpu.memory || 'N/A'}</span>
            </div>
        `).join('');
        document.getElementById('gpuInfo').innerHTML = `<h4>GPU信息</h4>${gpuHtml}`;
    }
}

async function killProcess(pid) {
    if (!confirm('确定要终止此进程吗？')) return;
    
    try {
        await fetch('/api/process/kill', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pid })
        });
        startScan();
    } catch (error) {
        alert('终止进程失败');
    }
}

function launchApp(appName) {
    alert(`启动 ${appName} 功能开发中...`);
}

function stopApp(pid) {
    killProcess(pid);
}

socket.on('scanResults', (results) => {
    scanResults = results;
    updateStats();
    renderServices();
    renderModels();
    renderApps();
    renderProcesses();
});

setInterval(loadResources, 5000);
