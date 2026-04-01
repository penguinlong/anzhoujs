let allBooks = [];

async function initDatabase() {
    if (typeof db !== 'undefined' && db) {
        if (!db.db) {
            await db.init();
        }
        return db;
    }
    return null;
}

async function getReadingProgress(bookId) {
    try {
        const progress = await db.getReadingProgress(bookId);
        return progress ? progress.progress_percent : 0;
    } catch (e) {
        console.error('获取进度失败:', e);
        return 0;
    }
}

async function getAllReadingProgress() {
    try {
        return await db.getAllReadingProgress();
    } catch (e) {
        console.error('获取所有进度失败:', e);
        return [];
    }
}

async function loadBooksWithProgress() {
    let books = [];
    
    try {
        const response = await fetch('books.json');
        console.log('books.json response:', response.status);
        if (response.ok) {
            books = await response.json();
            console.log('Loaded books:', books.length);
        } else {
            console.error('Failed to load books.json:', response.status);
        }
    } catch (e) {
        console.error('Error loading books.json:', e);
    }
    
    const progressList = await getAllReadingProgress();
    const progressMap = {};
    progressList.forEach(p => {
        progressMap[p.book_id] = p;
    });
    
    allBooks = books.map(book => ({
        ...book,
        progress: progressMap[book.id] ? progressMap[book.id].progress_percent : 0
    }));
    
    return allBooks;
}

function formatProgress(percentage) {
    return Math.round(percentage) + '%';
}

function renderBookCard(book) {
    const progressText = book.progress > 0 ? `已读 ${formatProgress(book.progress)}` : '未开始';
    
    return `
        <div class="book-card" onclick="window.location.href='reader.html?book=${encodeURIComponent(book.file)}&id=${book.id}'">
            <div class="book-cover">
                ${book.cover 
                    ? `<img src="${book.cover}" alt="${book.title}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                       <div class="book-cover-placeholder" style="display:none;">📖</div>`
                    : '<div class="book-cover-placeholder">📖</div>'
                }
            </div>
            <div class="book-info">
                <div class="book-title">${book.title}</div>
                <div class="book-author">${book.author || '未知作者'}</div>
                <div class="book-progress">
                    <div class="book-progress-bar" style="width: ${book.progress}%"></div>
                </div>
                <div class="book-progress-text">${progressText}</div>
            </div>
        </div>
    `;
}

function renderBookshelf(books) {
    const bookshelf = document.getElementById('bookshelf');
    
    if (!books || books.length === 0) {
        bookshelf.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📚</div>
                <div class="empty-text">暂无书籍</div>
                <div class="empty-hint">请联系管理员添加书籍</div>
            </div>
        `;
        return;
    }
    
    bookshelf.innerHTML = books.map(renderBookCard).join('');
}

async function loadBooks() {
    const bookshelf = document.getElementById('bookshelf');
    
    try {
        await initDatabase();
        const books = await loadBooksWithProgress();
        renderBookshelf(books);
    } catch (error) {
        console.error('Failed to load books:', error);
        bookshelf.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">⚠️</div>
                <div class="empty-text">加载失败</div>
                <div class="empty-hint">请检查网络连接</div>
            </div>
        `;
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadBooks);
} else {
    loadBooks();
}