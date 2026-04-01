/**
 * 禄命排盘 - 记录页面脚本
 */

let allRecords = [];
let currentFilter = 'all';
let searchKeyword = '';
let deleteTargetId = null;
let noteTargetId = null;

const ZODIAC_MAP = {
    '鼠': '🐀', '牛': '🐂', '虎': '🐅', '兔': '🐇',
    '龙': '🐉', '蛇': '🐍', '马': '🐎', '羊': '🐐',
    '猴': '🐒', '鸡': '🐓', '狗': '🐕', '猪': '🐷'
};

document.addEventListener('DOMContentLoaded', async function() {
    await initDatabase();
    await loadRecords();
    initEventListeners();
});

async function initDatabase() {
    try {
        await db.init();
        console.log('数据库初始化成功');
    } catch (err) {
        console.error('数据库初始化失败:', err);
    }
}

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
        
        allRecords.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        renderRecords();
    } catch (err) {
        console.error('加载记录失败:', err);
    }
}

function renderRecords() {
    const container = document.getElementById('records-list');
    const emptyState = document.getElementById('empty-state');
    
    if (allRecords.length === 0) {
        container.innerHTML = '';
        emptyState.style.display = 'flex';
        return;
    }
    
    emptyState.style.display = 'none';
    
    const grouped = {};
    allRecords.forEach(record => {
        const firstLetter = getFirstLetter(record.name);
        if (!grouped[firstLetter]) {
            grouped[firstLetter] = [];
        }
        grouped[firstLetter].push(record);
    });
    
    let html = '';
    const sortedKeys = Object.keys(grouped).sort((a, b) => a.localeCompare(b));
    
    sortedKeys.forEach(letter => {
        html += `<div class="group-header">${letter}</div>`;
        grouped[letter].forEach(record => {
            html += renderRecordCard(record);
        });
    });
    
    container.innerHTML = html;
    bindRecordEvents();
}

function renderRecordCard(record) {
    const zodiac = record.zodiac || '';
    const zodiacEmoji = ZODIAC_MAP[zodiac] || '🔮';
    
    const yearTop = (record.year || '')[0] || '';
    const monthTop = (record.month || '')[0] || '';
    const dayTop = (record.day || '')[0] || '';
    const hourTop = (record.hour || '')[0] || '';
    
    const yearBottom = (record.year || '')[1] || '';
    const monthBottom = (record.month || '')[1] || '';
    const dayBottom = (record.day || '')[1] || '';
    const hourBottom = (record.hour || '')[1] || '';
    
    const hasNote = record.note && record.note.trim().length > 0;
    
    return `
        <div class="record-card-wrapper" data-id="${record.id}">
            <div class="record-actions">
                <button class="action-btn note-btn"><span class="btn-icon">📝</span><span class="btn-text">笔记</span></button>
                <button class="action-btn delete-btn"><span class="btn-icon">🗑️</span><span class="btn-text">删除</span></button>
            </div>
            <div class="record-card">
                ${hasNote ? '<div class="record-note-indicator">📝</div>' : ''}
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
        </div>
    `;
}

function getFirstLetter(name) {
    if (!name) return '#';
    const firstChar = name.charAt(0);
    if (/[A-Za-z]/.test(firstChar)) return firstChar.toUpperCase();
    if (/[0-9]/.test(firstChar)) return '#';
    return firstChar;
}

let currentOpenWrapper = null;
let startX = 0;
let currentX = 0;
let isDragging = false;

function bindRecordEvents() {
    const actionWidth = 160;
    
    document.querySelectorAll('.record-card').forEach(card => {
        card.addEventListener('click', function(e) {
            const wrapper = this.closest('.record-card-wrapper');
            if (currentOpenWrapper === wrapper) {
                e.stopPropagation();
                return;
            }
            const id = parseInt(wrapper.dataset.id);
            showRecordDetail(id);
        });
    });
    
    document.querySelectorAll('.record-card-wrapper').forEach(wrapper => {
        let startX = 0;
        let currentX = 0;
        let isDragging = false;
        
        wrapper.addEventListener('touchstart', function(e) {
            if (e.target.closest('.record-actions')) return;
            if (currentOpenWrapper && currentOpenWrapper !== wrapper) {
                closeAllWrappers();
            }
            startX = e.touches[0].clientX;
            currentX = startX;
            isDragging = true;
        }, { passive: true });
        
        wrapper.addEventListener('touchmove', function(e) {
            if (!isDragging) return;
            currentX = e.touches[0].clientX;
            let diff = startX - currentX;
            
            if (diff > 0) {
                diff = Math.min(diff, actionWidth);
                wrapper.querySelector('.record-card').style.transform = `translateX(-${diff}px)`;
            }
        }, { passive: true });
        
        wrapper.addEventListener('touchend', function() {
            if (!isDragging) return;
            isDragging = false;
            
            const diff = startX - currentX;
            const card = wrapper.querySelector('.record-card');
            
            if (diff > actionWidth * 0.4) {
                card.style.transform = `translateX(-${actionWidth}px)`;
                currentOpenWrapper = wrapper;
            } else {
                card.style.transform = 'translateX(0)';
                currentOpenWrapper = null;
            }
        }, { passive: true });
        
        const noteBtn = wrapper.querySelector('.note-btn');
        const deleteBtn = wrapper.querySelector('.delete-btn');
        
        noteBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const id = parseInt(wrapper.dataset.id);
            closeAllWrappers();
            showNoteModal(id);
        });
        
        deleteBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const id = parseInt(wrapper.dataset.id);
            closeAllWrappers();
            showDeleteConfirm(id);
        });
    });
    
    document.addEventListener('click', function(e) {
        if (currentOpenWrapper && !e.target.closest('.record-card-wrapper')) {
            closeAllWrappers();
        }
    });
}

function closeAllWrappers() {
    document.querySelectorAll('.record-card').forEach(card => {
        card.style.transform = 'translateX(0)';
    });
    currentOpenWrapper = null;
}

function showRecordDetail(id) {
    const record = allRecords.find(r => r.id === id);
    if (!record) {
        alert('未找到记录');
        return;
    }
    
    if (!record.fullData) {
        if (confirm('该记录没有完整的排盘数据，是否重新计算？')) {
            const params = new URLSearchParams({
                recordId: record.id,
                recalculate: 'true'
            });
            window.location.href = `../首页排盘/index.html?${params.toString()}`;
        }
        return;
    }
    
    const params = new URLSearchParams({ recordId: record.id });
    window.location.href = `../professional/index.html?${params.toString()}`;
}

async function showNoteModal(id) {
    noteTargetId = id;
    const record = allRecords.find(r => r.id === id);
    if (!record) {
        alert('未找到记录');
        return;
    }
    const textarea = document.getElementById('note-textarea');
    textarea.value = record.note || '';
    document.getElementById('note-modal').style.display = 'flex';
}

function hideNoteModal() {
    noteTargetId = null;
    document.getElementById('note-textarea').value = '';
    document.getElementById('note-modal').style.display = 'none';
}

async function saveNote() {
    if (!noteTargetId) return;
    const noteText = document.getElementById('note-textarea').value;
    try {
        const record = allRecords.find(r => r.id === noteTargetId);
        if (record) {
            record.note = noteText;
            await db.updateRecord(noteTargetId, record);
            await loadRecords();
        }
        hideNoteModal();
    } catch (err) {
        console.error('保存笔记失败:', err);
        alert('保存笔记失败');
    }
}

function showDeleteConfirm(id) {
    deleteTargetId = id;
    document.getElementById('delete-modal').style.display = 'flex';
}

function hideDeleteConfirm() {
    deleteTargetId = null;
    document.getElementById('delete-modal').style.display = 'none';
}

async function deleteRecord(id) {
    try {
        await db.deleteRecord(id);
        await loadRecords();
    } catch (err) {
        console.error('删除记录失败:', err);
    }
}

function initEventListeners() {
    const searchInput = document.getElementById('search-input');
    let searchTimer;
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
            searchKeyword = this.value;
            loadRecords();
        }, 300);
    });
    
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.type;
            loadRecords();
        });
    });
    
    document.getElementById('add-btn').addEventListener('click', function() {
        window.location.href = '../首页排盘/index.html?new=1';
    });
    
    document.getElementById('cancel-delete').addEventListener('click', hideDeleteConfirm);
    document.getElementById('confirm-delete').addEventListener('click', async function() {
        if (deleteTargetId) {
            await deleteRecord(deleteTargetId);
            hideDeleteConfirm();
        }
    });
    
    document.getElementById('delete-modal').addEventListener('click', function(e) {
        if (e.target === this) hideDeleteConfirm();
    });
    
    document.getElementById('note-cancel-btn').addEventListener('click', hideNoteModal);
    document.getElementById('note-save-btn').addEventListener('click', saveNote);
    
    document.getElementById('note-modal').addEventListener('click', function(e) {
        if (e.target === this) hideNoteModal();
    });
}