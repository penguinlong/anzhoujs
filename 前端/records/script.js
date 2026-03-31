/**
 * 禄命排盘 - 记录页面脚本
 */

// ===== 全局状态 =====
let allRecords = [];
let currentFilter = 'all';
let searchKeyword = '';
let deleteTargetId = null;

// 生肖映射
const ZODIAC_MAP = {
    '鼠': '🐀', '牛': '🐂', '虎': '🐅', '兔': '🐇',
    '龙': '🐉', '蛇': '🐍', '马': '🐎', '羊': '🐐',
    '猴': '🐒', '鸡': '🐓', '狗': '🐕', '猪': '🐷'
};

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', async function() {
    await initDatabase();
    await loadRecords();
    initEventListeners();
});

// ===== 初始化数据库 =====
async function initDatabase() {
    try {
        await db.init();
        console.log('数据库初始化成功');
    } catch (err) {
        console.error('数据库初始化失败:', err);
    }
}

// ===== 加载记录 =====
async function loadRecords() {
    try {
        if (currentFilter === 'all') {
            allRecords = await db.getAllRecords();
        } else {
            allRecords = await db.getRecordsByDateType(currentFilter);
        }
        
        if (searchKeyword) {
            allRecords = allRecords.filter(record => 
                record.name.toLowerCase().includes(searchKeyword.toLowerCase())
            );
        }
        
        // 按创建时间倒序排列
        allRecords.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        renderRecords();
    } catch (err) {
        console.error('加载记录失败:', err);
    }
}

// ===== 渲染记录列表 =====
function renderRecords() {
    const container = document.getElementById('records-list');
    const emptyState = document.getElementById('empty-state');
    
    if (allRecords.length === 0) {
        container.innerHTML = '';
        emptyState.style.display = 'flex';
        return;
    }
    
    emptyState.style.display = 'none';
    
    // 按首字母分组
    const grouped = {};
    allRecords.forEach(record => {
        const firstLetter = getFirstLetter(record.name);
        if (!grouped[firstLetter]) {
            grouped[firstLetter] = [];
        }
        grouped[firstLetter].push(record);
    });
    
    // 渲染分组
    let html = '';
    const sortedKeys = Object.keys(grouped).sort((a, b) => a.localeCompare(b));
    
    sortedKeys.forEach(letter => {
        html += `<div class="group-header">${letter}</div>`;
        
        grouped[letter].forEach(record => {
            html += renderRecordCard(record);
        });
    });
    
    container.innerHTML = html;
    
    // 绑定事件
    bindRecordEvents();
}

// ===== 渲染单条记录卡片 =====
function renderRecordCard(record) {
    const zodiac = record.zodiac || '';
    const zodiacEmoji = ZODIAC_MAP[zodiac] || '🔮';
    
    // 获取四柱首字（天干）
    const yearTop = (record.year || '')[0] || '';
    const monthTop = (record.month || '')[0] || '';
    const dayTop = (record.day || '')[0] || '';
    const hourTop = (record.hour || '')[0] || '';
    
    // 获取四柱次字（地支）
    const yearBottom = (record.year || '')[1] || '';
    const monthBottom = (record.month || '')[1] || '';
    const dayBottom = (record.day || '')[1] || '';
    const hourBottom = (record.hour || '')[1] || '';
    
    return `
        <div class="record-card" data-id="${record.id}">
            <div class="record-info">
                <div class="record-header">
                    <span class="record-name">${record.name}</span>
                    <span class="record-gender">${record.gender}</span>
                </div>
                <div class="record-date">${record.dateDisplay || ''}</div>
            </div>
            <div class="record-bazi">
                <div class="record-bazi-row">
                    <span class="record-bazi-char top">${yearTop}</span>
                    <span class="record-bazi-char top">${monthTop}</span>
                    <span class="record-bazi-char top">${dayTop}</span>
                    <span class="record-bazi-char top">${hourTop}</span>
                </div>
                <div class="record-bazi-row">
                    <span class="record-bazi-char">${yearBottom}</span>
                    <span class="record-bazi-char">${monthBottom}</span>
                    <span class="record-bazi-char">${dayBottom}</span>
                    <span class="record-bazi-char">${hourBottom}</span>
                </div>
            </div>
            <div class="record-zodiac">${zodiacEmoji}</div>
        </div>
    `;
}

// ===== 获取首字母 =====
function getFirstLetter(name) {
    if (!name) return '#';
    
    const firstChar = name.charAt(0);
    
    // 检查是否为英文字母
    if (/[A-Za-z]/.test(firstChar)) {
        return firstChar.toUpperCase();
    }
    
    // 检查是否为数字
    if (/[0-9]/.test(firstChar)) {
        return '#';
    }
    
    // 中文 - 使用拼音首字母（简化处理）
    return firstChar;
}

// ===== 绑定记录事件 =====
function bindRecordEvents() {
    // 点击记录卡片
    document.querySelectorAll('.record-card').forEach(card => {
        card.addEventListener('click', function() {
            const id = parseInt(this.dataset.id);
            showRecordDetail(id);
        });
        
        // 长按删除
        let pressTimer;
        card.addEventListener('touchstart', function(e) {
            const id = parseInt(this.dataset.id);
            pressTimer = setTimeout(() => {
                showDeleteConfirm(id);
            }, 800);
        });
        
        card.addEventListener('touchend', function() {
            clearTimeout(pressTimer);
        });
        
        card.addEventListener('touchmove', function() {
            clearTimeout(pressTimer);
        });
    });
}

// ===== 显示记录详情 =====
function showRecordDetail(id) {
    const record = allRecords.find(r => r.id === id);
    if (!record) {
        alert('未找到记录');
        return;
    }
    
    // 检查是否有完整数据
    if (!record.fullData) {
        if (confirm('该记录没有完整的排盘数据，是否重新计算？')) {
            // 重新计算并跳转到排盘页面
            const params = new URLSearchParams({
                recordId: record.id,
                recalculate: 'true'
            });
            window.location.href = `../首页排盘/index.html?${params.toString()}`;
        }
        return;
    }
    
    // 跳转到专业细盘页面，只传递记录ID
    const params = new URLSearchParams({
        recordId: record.id
    });
    
    window.location.href = `../professional/index.html?${params.toString()}`;
}

// ===== 显示删除确认 =====
function showDeleteConfirm(id) {
    deleteTargetId = id;
    document.getElementById('delete-modal').style.display = 'flex';
}

// ===== 隐藏删除确认 =====
function hideDeleteConfirm() {
    deleteTargetId = null;
    document.getElementById('delete-modal').style.display = 'none';
}

// ===== 删除记录 =====
async function deleteRecord(id) {
    try {
        await db.deleteRecord(id);
        await loadRecords();
    } catch (err) {
        console.error('删除记录失败:', err);
    }
}

// ===== 初始化事件监听 =====
function initEventListeners() {
    // 搜索输入
    const searchInput = document.getElementById('search-input');
    let searchTimer;
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
            searchKeyword = this.value;
            loadRecords();
        }, 300);
    });
    
    // 分类标签
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.type;
            loadRecords();
        });
    });
    
    // 添加按钮
    document.getElementById('add-btn').addEventListener('click', function() {
        window.location.href = '../首页排盘/index.html?new=1';
    });
    
    // 删除确认对话框
    document.getElementById('cancel-delete').addEventListener('click', hideDeleteConfirm);
    document.getElementById('confirm-delete').addEventListener('click', async function() {
        if (deleteTargetId) {
            await deleteRecord(deleteTargetId);
            hideDeleteConfirm();
        }
    });
    
    // 点击对话框外部关闭
    document.getElementById('delete-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            hideDeleteConfirm();
        }
    });
}