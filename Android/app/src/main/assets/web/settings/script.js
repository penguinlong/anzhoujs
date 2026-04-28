// ===== 全局状态 =====
// db 从 database.js 全局引入
let currentUser = null;
let cloudUser = null;
let currentUserType = 'local'; // local 或 cloud

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', async function() {
    await initDatabase();
    await loadCurrentUser();
    await loadCloudUser();
    await updateDataCounts();
    initEventListeners();
    initUserTypeTabs();
});

// ===== 初始化数据库 =====
async function initDatabase() {
    try {
        await db.init();
        console.log('数据库初始化成功');
    } catch (error) {
        console.error('数据库初始化失败:', error);
    }
}

// ===== 初始化用户类型切换 =====
function initUserTypeTabs() {
    const tabs = document.querySelectorAll('.user-type-tabs .tab');
    const localSection = document.getElementById('local-user-section');
    const cloudSection = document.getElementById('cloud-user-section');
    
    console.log('找到标签数量:', tabs.length);
    console.log('local-section:', !!localSection);
    console.log('cloud-section:', !!cloudSection);
    
    tabs.forEach((tab, index) => {
        console.log(`标签${index}:`, tab.textContent, 'type:', tab.dataset.type);
        
        tab.addEventListener('click', function() {
            const type = this.dataset.type;
            currentUserType = type;
            
            console.log('点击标签:', type);
            
            // 更新标签状态
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // 显示对应部分
            if (type === 'local') {
                if (localSection) localSection.style.display = 'block';
                if (cloudSection) cloudSection.style.display = 'none';
            } else {
                if (localSection) localSection.style.display = 'none';
                if (cloudSection) cloudSection.style.display = 'block';
            }
        });
    });
}

// ===== 加载当前用户 =====
async function loadCurrentUser() {
    try {
        const userStr = localStorage.getItem('current_user');
        if (userStr) {
            currentUser = JSON.parse(userStr);
            updateUIForLoggedInUser();
        } else {
            updateUIForGuestUser();
        }
    } catch (error) {
        console.error('加载用户信息失败:', error);
        updateUIForGuestUser();
    }
}

// ===== 加载云端用户 =====
async function loadCloudUser() {
    try {
        const cloudUserStr = localStorage.getItem('cloud_user');
        if (cloudUserStr) {
            cloudUser = JSON.parse(cloudUserStr);
            updateUIForCloudUser();
        }
    } catch (error) {
        console.error('加载云端用户信息失败:', error);
    }
}

// ===== 更新UI为登录用户 =====
function updateUIForLoggedInUser() {
    const localUserDataSection = document.getElementById('local-user-data-section');
    const currentInfo = document.getElementById('current-user-info');
    
    if (localUserDataSection && currentUser && currentUser.type === 'local') {
        localUserDataSection.style.display = 'block';
    }
    
    if (currentInfo && currentUser) {
        if (currentUser.type === 'cloud') {
            currentInfo.innerHTML = `
                <div class="user-type">云端用户</div>
                <div class="user-name">${currentUser.nickname || '微信用户'}</div>
                <div class="user-tip">已登录云端账户</div>
            `;
        } else {
            currentInfo.innerHTML = `
                <div class="user-type">本地用户</div>
                <div class="user-name">${currentUser.username}</div>
                <div class="user-tip">已登录本地账户</div>
            `;
        }
    }
    
    const localUsername = document.getElementById('local-username');
    if (localUsername && currentUser && currentUser.username) {
        localUsername.textContent = currentUser.username;
    }
}

// ===== 更新UI为云端用户 =====
function updateUIForCloudUser() {
    const cloudSection = document.getElementById('cloud-user-section');
    const cloudUserInfo = document.getElementById('cloud-user-info');
    const cloudUserDetails = document.getElementById('cloud-user-details');
    
    if (cloudSection) cloudSection.style.display = 'none';
    if (cloudUserInfo) cloudUserInfo.style.display = 'block';
    
    if (cloudUserDetails && cloudUser) {
        cloudUserDetails.innerHTML = `
            <div class="user-type">云端用户</div>
            <div class="user-name">${cloudUser.nickname || '微信用户'}</div>
            <div class="user-tip">数据已同步到云端</div>
        `;
    }
}

// ===== 更新UI为游客用户 =====
function updateUIForGuestUser() {
    const localUserDataSection = document.getElementById('local-user-data-section');
    const cloudUserInfo = document.getElementById('cloud-user-info');
    const currentInfo = document.getElementById('current-user-info');
    
    if (localUserDataSection) localUserDataSection.style.display = 'none';
    if (cloudUserInfo) cloudUserInfo.style.display = 'none';
    
    if (currentInfo) {
        currentInfo.innerHTML = `
            <div class="user-type">游客模式</div>
            <div class="user-tip">创建本地用户后可保存更多数据</div>
        `;
    }
}

// ===== 更新数据计数 =====
async function updateDataCounts() {
    try {
        // 获取游客记录数
        const allRecords = await db.getAllRecords();
        const guestCount = allRecords.filter(r => !r.userId).length;
        const localCount = currentUser ? allRecords.filter(r => r.userId === currentUser.id).length : 0;
        
        const guestCountEl = document.getElementById('guest-count');
        const localCountEl = document.getElementById('local-count');
        
        if (guestCountEl) guestCountEl.textContent = guestCount;
        if (localCountEl) localCountEl.textContent = localCount;
    } catch (error) {
        console.error('更新数据计数失败:', error);
    }
}

// ===== 初始化事件监听 =====
function initEventListeners() {
    // 创建用户按钮
    const createUserBtn = document.getElementById('create-user-btn');
    if (createUserBtn) {
        createUserBtn.addEventListener('click', createLocalUser);
    }
    
    // 登录用户按钮
    const loginUserBtn = document.getElementById('login-user-btn');
    if (loginUserBtn) {
        loginUserBtn.addEventListener('click', loginLocalUser);
    }
    
    // 标签切换按钮
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const action = this.dataset.action;
            
            // 更新按钮状态
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // 显示对应表单
            const createForm = document.getElementById('create-form');
            const loginForm = document.getElementById('login-form');
            
            if (action === 'create') {
                createForm.style.display = 'block';
                loginForm.style.display = 'none';
            } else {
                createForm.style.display = 'none';
                loginForm.style.display = 'block';
            }
        });
    });
    
    // 微信登录按钮
    const wechatLoginBtn = document.getElementById('wechat-login-btn');
    if (wechatLoginBtn) {
        wechatLoginBtn.addEventListener('click', showWechatLogin);
    }
    
    // 关闭微信登录弹窗
    const closeWechatModal = document.getElementById('close-wechat-modal');
    if (closeWechatModal) {
        closeWechatModal.addEventListener('click', hideWechatLogin);
    }
    
    // 游客模式按钮
    const guestModeBtn = document.getElementById('guest-mode-btn');
    if (guestModeBtn) {
        guestModeBtn.addEventListener('click', continueAsGuest);
    }
    
    // 导入数据按钮
    const importDataBtn = document.getElementById('import-data-btn');
    if (importDataBtn) {
        importDataBtn.addEventListener('click', importDataToCloud);
    }
    
    // 退出云端登录按钮
    const cloudLogoutBtn = document.getElementById('cloud-logout-btn');
    if (cloudLogoutBtn) {
        cloudLogoutBtn.addEventListener('click', logoutCloud);
    }
    
    // 查看游客数据按钮
    const viewGuestDataBtn = document.getElementById('view-guest-data-btn');
    if (viewGuestDataBtn) {
        viewGuestDataBtn.addEventListener('click', viewGuestData);
    }
    
    // 清空游客数据按钮
    const clearGuestDataBtn = document.getElementById('clear-guest-data-btn');
    if (clearGuestDataBtn) {
        clearGuestDataBtn.addEventListener('click', clearGuestData);
    }
    
    // 查看本地用户数据按钮
    const viewLocalDataBtn = document.getElementById('view-local-data-btn');
    if (viewLocalDataBtn) {
        viewLocalDataBtn.addEventListener('click', viewLocalData);
    }
    
    // 退出登录按钮
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
}

// ===== 创建本地用户 =====
async function createLocalUser() {
    console.log('========== 创建本地用户开始 ==========');
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    
    console.log('输入的用户名:', username);
    
    if (!username) {
        alert('请输入用户名');
        return;
    }
    
    // 检查db对象
    console.log('db对象存在:', !!db);
    console.log('db.db存在:', !!(db && db.db));
    
    // 检查数据库是否初始化
    if (!db || !db.db) {
        console.log('数据库未初始化，尝试初始化...');
        try {
            await db.init();
            console.log('数据库初始化成功');
        } catch (e) {
            console.error('数据库初始化失败:', e);
            alert('数据库初始化失败: ' + e.message + '\n请确保使用 http://localhost:5000 访问');
            return;
        }
    }
    
    // 检查是否已有本地用户
    const existingUser = localStorage.getItem('local_user');
    console.log('已存在本地用户:', !!existingUser);
    
    if (existingUser) {
        alert('已存在本地用户，请先退出登录');
        return;
    }
    
    try {
        // 创建用户对象
        const user = {
            id: 'local_' + Date.now(),
            username: username,
            password: password,
            type: 'local',
            createdAt: new Date().toISOString()
        };
        
        console.log('准备创建用户:', user);
        
        // 保存用户信息
        localStorage.setItem('local_user', JSON.stringify(user));
        localStorage.setItem('current_user', JSON.stringify(user));
        
        console.log('用户信息已保存到localStorage');
        
        // 迁移游客数据
        console.log('开始迁移游客数据...');
        await migrateGuestData(user.id);
        
        // 更新UI
        currentUser = user;
        updateUIForLoggedInUser();
        await updateDataCounts();
        
        console.log('========== 用户创建成功 ==========');
        alert('本地用户创建成功！\n用户名: ' + username);
        
    } catch (error) {
        console.error('创建用户失败:', error);
        alert('创建用户失败: ' + error.message);
    }
}

// ===== 登录本地用户 =====
async function loginLocalUser() {
    console.log('========== 登录本地用户开始 ==========');
    
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value.trim();
    
    console.log('登录用户名:', username);
    
    if (!username) {
        alert('请输入用户名');
        return;
    }
    
    // 检查是否存在本地用户
    const existingUserStr = localStorage.getItem('local_user');
    if (!existingUserStr) {
        alert('没有已创建的本地用户，请先创建用户');
        return;
    }
    
    try {
        const existingUser = JSON.parse(existingUserStr);
        console.log('已存在的用户:', existingUser);
        
        // 验证用户名和密码
        if (existingUser.username !== username) {
            alert('用户名不正确');
            return;
        }
        
        if (existingUser.password && existingUser.password !== password) {
            alert('密码不正确');
            return;
        }
        
        // 设置当前用户
        localStorage.setItem('current_user', JSON.stringify(existingUser));
        
        // 更新UI
        currentUser = existingUser;
        updateUIForLoggedInUser();
        await updateDataCounts();
        
        console.log('========== 用户登录成功 ==========');
        alert('登录成功！\n欢迎回来，' + username);
        
    } catch (error) {
        console.error('登录失败:', error);
        alert('登录失败: ' + error.message);
    }
}

// ===== 迁移游客数据 =====
async function migrateGuestData(userId) {
    try {
        const allRecords = await db.getAllRecords();
        const guestRecords = allRecords.filter(r => !r.userId);
        
        for (const record of guestRecords) {
            record.userId = userId;
            record.userType = 'local';
            await db.updateRecord(record.id, record);
        }
        
        console.log(`已迁移 ${guestRecords.length} 条游客记录到本地用户`);
    } catch (error) {
        console.error('迁移游客数据失败:', error);
    }
}

// ===== 显示微信登录 =====
function showWechatLogin() {
    const modal = document.getElementById('wechat-modal');
    if (modal) {
        modal.style.display = 'flex';
        generateWechatQRCode();
    }
}

// ===== 隐藏微信登录 =====
function hideWechatLogin() {
    const modal = document.getElementById('wechat-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// ===== 生成微信二维码 =====
function generateWechatQRCode() {
    const qrcodePlaceholder = document.getElementById('qrcode-placeholder');
    if (!qrcodePlaceholder) return;
    
    // 这里需要调用微信开放平台的API生成二维码
    // 以下是模拟代码，实际需要替换为真实实现
    
    qrcodePlaceholder.innerHTML = `
        <div class="qrcode-image">
            <div style="width: 200px; height: 200px; background: #fff; margin: 0 auto; display: flex; align-items: center; justify-content: center; color: #000;">
                微信二维码
            </div>
        </div>
    `;
    
    // 模拟扫码登录过程
    setTimeout(() => {
        simulateWechatLogin();
    }, 3000);
}

// ===== 模拟微信登录 =====
function simulateWechatLogin() {
    const loginStatus = document.getElementById('login-status');
    if (loginStatus) {
        loginStatus.innerHTML = `
            <div class="status-text" style="color: #4CAF50;">登录成功！</div>
        `;
    }
    
    // 模拟用户信息
    const mockCloudUser = {
        id: 'cloud_' + Date.now(),
        openid: 'mock_openid_' + Date.now(),
        nickname: '微信用户',
        avatar: '',
        type: 'cloud',
        loginAt: new Date().toISOString()
    };
    
    // 保存云端用户信息
    localStorage.setItem('cloud_user', JSON.stringify(mockCloudUser));
    localStorage.setItem('current_user', JSON.stringify(mockCloudUser));
    
    cloudUser = mockCloudUser;
    currentUser = mockCloudUser;
    
    // 更新UI
    setTimeout(() => {
        hideWechatLogin();
        updateUIForLoggedInUser();
        updateUIForCloudUser();
        updateDataCounts();
        alert('微信登录成功！');
    }, 1000);
}

// ===== 继续以游客模式 =====
function continueAsGuest() {
    // 保持当前状态，不登录云端
    alert('继续以游客模式使用');
}

// ===== 导入数据到云端 =====
async function importDataToCloud() {
    if (!cloudUser) {
        alert('请先登录云端账户');
        return;
    }
    
    const importLocal = document.getElementById('import-local-data').checked;
    const importGuest = document.getElementById('import-guest-data').checked;
    
    if (!importLocal && !importGuest) {
        alert('请至少选择一种数据导入');
        return;
    }
    
    try {
        const allRecords = await db.getAllRecords();
        let importCount = 0;
        
        // 导入本地用户数据
        if (importLocal) {
            const localRecords = allRecords.filter(r => r.userType === 'local');
            for (const record of localRecords) {
                record.userId = cloudUser.id;
                record.userType = 'cloud';
                await db.updateRecord(record.id, record);
                importCount++;
            }
        }
        
        // 导入游客数据
        if (importGuest) {
            const guestRecords = allRecords.filter(r => r.userType === 'guest');
            for (const record of guestRecords) {
                record.userId = cloudUser.id;
                record.userType = 'cloud';
                await db.updateRecord(record.id, record);
                importCount++;
            }
        }
        
        // 同步到云端
        await syncToCloud();
        
        await updateDataCounts();
        alert(`成功导入 ${importCount} 条记录到云端账户`);
        
    } catch (error) {
        console.error('导入数据失败:', error);
        alert('导入失败: ' + error.message);
    }
}

// ===== 同步到云端 =====
async function syncToCloud() {
    try {
        const allRecords = await db.getAllRecords();
        const userRecords = allRecords.filter(r => r.userId === cloudUser.id);
        
        // 这里需要调用云端API同步数据
        console.log('准备同步', userRecords.length, '条记录到云端');
        
        // 模拟云端同步
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('云端同步完成');
    } catch (error) {
        console.error('云端同步失败:', error);
    }
}

// ===== 退出云端登录 =====
function logoutCloud() {
    if (!confirm('确定要退出云端登录吗？')) {
        return;
    }
    
    localStorage.removeItem('cloud_user');
    localStorage.removeItem('current_user');
    cloudUser = null;
    currentUser = null;
    
    // 更新UI
    updateUIForGuestUser();
    updateDataCounts();
    alert('已退出云端登录');
}

// ===== 查看游客数据 =====
function viewGuestData() {
    window.location.href = '../records/index.html?type=guest';
}

// ===== 清空游客数据 =====
async function clearGuestData() {
    if (!confirm('确定要清空所有游客数据吗？此操作不可恢复！')) {
        return;
    }
    
    try {
        const allRecords = await db.getAllRecords();
        const guestRecords = allRecords.filter(r => !r.userId);
        
        for (const record of guestRecords) {
            await db.deleteRecord(record.id);
        }
        
        await updateDataCounts();
        alert('游客数据已清空');
    } catch (error) {
        console.error('清空游客数据失败:', error);
        alert('清空失败: ' + error.message);
    }
}

// ===== 查看本地用户数据 =====
function viewLocalData() {
    window.location.href = '../records/index.html?type=local';
}

// ===== 退出登录 =====
function logout() {
    if (!confirm('确定要退出登录吗？')) {
        return;
    }
    
    localStorage.removeItem('current_user');
    currentUser = null;
    updateUIForGuestUser();
    updateDataCounts();
    alert('已退出登录');
}