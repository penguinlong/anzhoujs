(function() {
    'use strict';

    const params = new URLSearchParams(window.location.search);
    const bookUrl = params.get('book') || 'books/sample.epub';
    const bookId = params.get('id') || 'default';

    let book = null;
    let rendition = null;
    let isInitialized = false;
    let currentFontSize = 16;
    let isPdf = false;
    let pdfDoc = null;
    let currentPage = 1;
    let totalPages = 0;
    let pdfScale = 1.0;
    let isVerticalScroll = true;
    let pdfRenderTask = null;

    const elements = {
        viewer: document.getElementById('viewer'),
        bookTitle: document.getElementById('book-title'),
        progressText: document.getElementById('progress-text'),
        progressBar: document.getElementById('progress-bar'),
        prevBtn: document.getElementById('prev-btn'),
        nextBtn: document.getElementById('next-btn'),
        backBtn: document.getElementById('back-btn'),
        menuBtn: document.getElementById('menu-btn'),
        closeTocBtn: document.getElementById('close-toc'),
        tocPanel: document.getElementById('toc-panel'),
        tocContent: document.getElementById('toc-content'),
        overlay: document.getElementById('overlay'),
        fontBtn: document.getElementById('font-btn'),
        fontPanel: document.getElementById('font-panel'),
        zoomBtn: document.getElementById('zoom-btn'),
        zoomPanel: document.getElementById('zoom-panel')
    };

    async function waitForDb() {
        if (typeof db !== 'undefined' && db && db.db) {
            return;
        }
        let retries = 0;
        while ((typeof db === 'undefined' || !db || !db.db) && retries < 50) {
            await new Promise(r => setTimeout(r, 100));
            retries++;
        }
    }

    async function saveReadingProgress(progress) {
        if (typeof db !== 'undefined' && db && db.db) {
            try {
                await db.saveReadingProgress({
                    book_id: bookId,
                    book_title: elements.bookTitle.textContent || '未知书籍',
                    progress_cfi: progress.page ? `page:${progress.page}` : (progress.cfi || null),
                    progress_percent: progress.percentage || 0,
                    current_chapter: progress.page ? `第${progress.page}页` : (progress.chapter || '')
                });
            } catch (e) {
                console.error('保存进度失败:', e);
            }
        }
    }

    async function getReadingProgress() {
        if (typeof db !== 'undefined' && db && db.db) {
            try {
                return await db.getReadingProgress(bookId);
            } catch (e) {
                console.error('获取进度失败:', e);
                return null;
            }
        }
        return null;
    }

    function updateProgress(percentage, page, cfi) {
        elements.progressText.textContent = Math.round(percentage) + '%';
        elements.progressBar.style.width = percentage + '%';
        
        saveReadingProgress({
            percentage: percentage,
            page: page,
            cfi: cfi
        });
    }

    function renderPdfPage(pageNum) {
        if (!pdfDoc) return;
        
        const canvas = document.getElementById('pdf-canvas');
        if (!canvas) return;
        
        pdfDoc.getPage(pageNum).then(function(page) {
            const ctx = canvas.getContext('2d');
            
            const containerWidth = elements.viewer.clientWidth - 20;
            const originalViewport = page.getViewport({ scale: 1 });
            const baseScale = containerWidth / originalViewport.width;
            const scale = baseScale * pdfScale;
            const viewport = page.getViewport({ scale: scale });
            
            const dpr = window.devicePixelRatio || 1;
            canvas.width = viewport.width * dpr;
            canvas.height = viewport.height * dpr;
            canvas.style.width = viewport.width + 'px';
            canvas.style.height = viewport.height + 'px';
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.scale(dpr, dpr);
            
            const renderContext = {
                canvasContext: ctx,
                viewport: viewport
            };
            
            page.render(renderContext).promise.then(function() {
                console.log('PDF rendered successfully');
            }).catch(function(error) {
                console.error('PDF render error:', error);
            });
        });
        
        currentPage = pageNum;
        const percentage = totalPages > 0 ? (pageNum / totalPages) * 100 : 0;
        updateProgress(percentage, pageNum);
    }
    
    function fitToScreen() {
        if (!pdfDoc || !currentPage) return;
        const canvas = document.getElementById('pdf-canvas');
        if (!canvas) return;
        
        pdfDoc.getPage(currentPage).then(function(page) {
            const viewport = page.getViewport({ scale: 1 });
            const screenWidth = window.innerWidth - 20;
            pdfScale = screenWidth / viewport.width;
            document.getElementById('zoom-level').textContent = '自适应';
            renderPdfPage(currentPage);
        });
    }

    function zoomIn() {
        if (pdfScale < 4) {
            pdfScale += 0.25;
            document.getElementById('zoom-level').textContent = Math.round(pdfScale * 100) + '%';
            renderPdfPage(currentPage);
        }
    }

    function zoomOut() {
        if (pdfScale > 0.5) {
            pdfScale -= 0.25;
            document.getElementById('zoom-level').textContent = Math.round(pdfScale * 100) + '%';
            renderPdfPage(currentPage);
        }
    }
    
    function fitToScreen() {
        if (!pdfDoc) return;
        const canvas = document.getElementById('pdf-canvas');
        if (!canvas) return;
        
        pdfDoc.getPage(currentPage).then(function(page) {
            const viewport = page.getViewport({ scale: 1 });
            const containerWidth = elements.viewer.clientWidth - 20;
            pdfScale = containerWidth / viewport.width;
            document.getElementById('zoom-level').textContent = '100%';
            renderPdfPage(currentPage);
        });
    }

    function toggleVerticalScroll() {
        isVerticalScroll = !isVerticalScroll;
        if (isVerticalScroll) {
            elements.viewer.classList.add('vertical-scroll');
        } else {
            elements.viewer.classList.remove('vertical-scroll');
        }
    }

    function initPdfReader() {
        console.log('Initializing PDF reader with URL:', bookUrl);
        elements.viewer.innerHTML = `
            <div class="pdf-container" id="pdf-container">
                <canvas id="pdf-canvas"></canvas>
            </div>
        `;
        elements.viewer.classList.add('vertical-scroll');
        
        if (typeof pdfjsLib === 'undefined') {
            console.error('PDF.js not loaded');
            elements.viewer.innerHTML = '<div class="loading">PDF.js 未加载，请刷新页面</div>';
            return;
        }
        
        console.log('PDF.js loaded, loading document...');
        const loadingTask = pdfjsLib.getDocument(bookUrl);
        loadingTask.promise.then(async function(pdf) {
            console.log('PDF loaded successfully, pages:', pdf.numPages);
            pdfDoc = pdf;
            totalPages = pdf.numPages;
            document.title = 'PDF 阅读器';
            elements.bookTitle.textContent = 'PDF 阅读器 (共' + totalPages + '页)';
            document.getElementById('zoom-level').textContent = '100%';
            
            try {
                const outline = await pdf.getOutline();
                if (outline && outline.length > 0) {
                    renderPdfToc(outline);
                } else {
                    elements.tocContent.innerHTML = '<div class="loading">暂无目录</div>';
                }
            } catch (e) {
                console.log('No outline available');
                elements.tocContent.innerHTML = '<div class="loading">暂无目录</div>';
            }
            
            getReadingProgress().then(function(savedProgress) {
                let startPage = 1;
                if (savedProgress && savedProgress.progress_cfi && savedProgress.progress_cfi.startsWith('page:')) {
                    startPage = parseInt(savedProgress.progress_cfi.replace('page:', ''), 10) || 1;
                }
                startPage = Math.min(Math.max(startPage, 1), totalPages);
                renderPdfPage(startPage);
            });
            
            elements.prevBtn.onclick = function() {
                if (currentPage > 1) renderPdfPage(currentPage - 1);
            };
            elements.nextBtn.onclick = function() {
                if (currentPage < totalPages) renderPdfPage(currentPage + 1);
            };
            
        }).catch(function(error) {
            console.error('PDF load error:', error);
            elements.viewer.innerHTML = '<div class="loading">加载PDF失败: ' + error.message + '</div>';
        });
    }
    
    async function renderPdfToc(outline) {
        let html = '';
        for (const item of outline) {
            const title = item.title || '无标题';
            let page = '未知';
            if (item.dest) {
                try {
                    if (typeof item.dest === 'string') {
                        const pageRef = await pdfDoc.getPageIndex(item.dest[0]);
                        page = pageRef + 1;
                    } else if (Array.isArray(item.dest) && item.dest.length > 0) {
                        const pageRef = await pdfDoc.getPageIndex(item.dest[0]);
                        page = pageRef + 1;
                    }
                } catch (e) {}
            }
            html += `<div class="toc-item" onclick="reader.goToPage(${page})">${title} <span class="toc-page">第${page}页</span></div>`;
            if (item.items && item.items.length > 0) {
                html += await renderPdfTocItems(item.items, 1);
            }
        }
        elements.tocContent.innerHTML = html || '<div class="loading">暂无目录</div>';
    }
    
    async function renderPdfTocItems(items, level) {
        let html = '';
        for (const item of items) {
            const title = item.title || '无标题';
            let page = '未知';
            if (item.dest) {
                try {
                    if (typeof item.dest === 'string') {
                        const pageRef = await pdfDoc.getPageIndex(item.dest[0]);
                        page = pageRef + 1;
                    } else if (Array.isArray(item.dest) && item.dest.length > 0) {
                        const pageRef = await pdfDoc.getPageIndex(item.dest[0]);
                        page = pageRef + 1;
                    }
                } catch (e) {}
            }
            html += `<div class="toc-item" style="padding-left:${level * 15}px" onclick="reader.goToPage(${page})">${title} <span class="toc-page">第${page}页</span></div>`;
            if (item.items && item.items.length > 0) {
                html += await renderPdfTocItems(item.items, level + 1);
            }
        }
        return html;
    }
    
    function goToPage(pageNum) {
        pageNum = parseInt(pageNum, 10);
        if (pageNum >= 1 && pageNum <= totalPages) {
            renderPdfPage(pageNum);
            closeToc();
        }
    }

    function prevPage() {
        if (isPdf && currentPage > 1) {
            renderPdfPage(currentPage - 1);
        } else if (rendition) {
            rendition.prev();
        }
    }

    function nextPage() {
        if (isPdf && currentPage < totalPages) {
            renderPdfPage(currentPage + 1);
        } else if (rendition) {
            rendition.next();
        }
    }

    function setFontSize(size) {
        currentFontSize = size;
        if (rendition) {
            rendition.themes.fontSize(size + 'px');
        }
        localStorage.setItem('reader_font_size', size);
        document.getElementById('font-size-display').textContent = size + 'px';
    }

    function increaseFontSize() {
        if (currentFontSize < 32) {
            setFontSize(currentFontSize + 2);
        }
    }

    function decreaseFontSize() {
        if (currentFontSize > 12) {
            setFontSize(currentFontSize - 2);
        }
    }

    window.reader = {
        navigateToToc: function(href) {
            if (rendition) {
                rendition.display(href);
                closeToc();
            }
        },
        
        prevPage: prevPage,
        nextPage: nextPage,
        goToPage: goToPage,

        increaseFontSize: increaseFontSize,
        decreaseFontSize: decreaseFontSize,
        zoomIn: zoomIn,
        zoomOut: zoomOut,
        fitToScreen: fitToScreen,
        toggleVerticalScroll: toggleVerticalScroll
    };

    function renderToc(toc) {
        if (!toc || toc.length === 0) {
            elements.tocContent.innerHTML = '<div class="loading">暂无目录</div>';
            return;
        }

        elements.tocContent.innerHTML = toc.map((item, index) => `
            <div class="toc-item" data-href="${item.href}" onclick="reader.navigateToToc('${item.href}')">
                ${item.label}
            </div>
        `).join('');
    }

    function openToc() {
        elements.tocPanel.classList.add('open');
        elements.overlay.classList.add('visible');
        
        if (isPdf && !document.querySelector('.book-description')) {
            fetch('books.json')
                .then(res => res.json())
                .then(books => {
                    const book = books.find(b => b.id === bookId);
                    if (book && book.description) {
                        const descHtml = `<div class="book-description">${book.description}</div><div class="toc-divider">目录</div>`;
                        elements.tocContent.innerHTML = descHtml + (elements.tocContent.innerHTML || '');
                    }
                })
                .catch(e => console.error('Failed to load book info:', e));
        }
    }

    function closeToc() {
        elements.tocPanel.classList.remove('open');
        elements.overlay.classList.remove('visible');
    }

    function openFontPanel() {
        if (elements.fontPanel) {
            elements.fontPanel.classList.add('open');
            elements.overlay.classList.add('visible');
        }
    }

    function closeFontPanel() {
        if (elements.fontPanel) {
            elements.fontPanel.classList.remove('open');
            elements.overlay.classList.remove('visible');
        }
    }

    function openZoomPanel() {
        if (elements.zoomPanel) {
            elements.zoomPanel.classList.add('open');
            elements.overlay.classList.add('visible');
        }
    }

    function closeZoomPanel() {
        if (elements.zoomPanel) {
            elements.zoomPanel.classList.remove('open');
            elements.overlay.classList.remove('visible');
        }
    }

    async function initReader() {
        isPdf = bookUrl.toLowerCase().endsWith('.pdf');
        
        if (isPdf) {
            document.getElementById('zoom-level').textContent = Math.round(pdfScale * 100) + '%';
            initPdfReader();
            return;
        }

        if (typeof ePub === 'undefined') {
            elements.viewer.innerHTML = '<div class="loading">epub.js 加载失败，请刷新页面</div>';
            return;
        }

        const savedFontSize = localStorage.getItem('reader_font_size');
        if (savedFontSize) {
            currentFontSize = parseInt(savedFontSize, 10);
        } else {
            currentFontSize = 18;
        }
        document.getElementById('font-size-display').textContent = currentFontSize + 'px';

        elements.bookTitle.textContent = '加载中...';

        book = ePub(bookUrl);

        rendition = book.renderTo('viewer', {
            width: '100%',
            height: '100%',
            spread: 'auto'
        });

        rendition.themes.fontSize(currentFontSize + 'px');

        await book.ready;
        try {
            await book.locations.generate();
        } catch (e) {
            console.error('Locations generate error:', e);
        }
        
        rendition.on('relocated', function(location) {
            let percentage = 0;
            
            if (rendition.location && rendition.location.start) {
                const loc = rendition.location.start;
                if (typeof loc.percentage === 'number') {
                    percentage = loc.percentage * 100;
                } else if (book.locations && book.locations.length > 0 && typeof loc.location === 'number') {
                    percentage = (loc.location / book.locations.length) * 100;
                }
            }
            
            let chapter = '';
            let cfi = null;
            if (location.start) {
                chapter = location.start.href || '';
                cfi = location.start.cfi || null;
            }
            
            updateProgress(percentage, null, cfi);

            elements.prevBtn.disabled = false;
            elements.nextBtn.disabled = false;
        });

        const displayed = rendition.display();

        displayed.then(async function() {
            isInitialized = true;
            
            await waitForDb();
            
            elements.progressText.textContent = '0%';
            elements.progressBar.style.width = '0%';
            
            if (book.package && book.package.metadata) {
                const title = book.package.metadata.title || '未知书籍';
                elements.bookTitle.textContent = title;
                document.title = title;
            }

            const navigation = await book.loaded.navigation;
            if (navigation && navigation.toc) {
                renderToc(navigation.toc);
            }

            const savedProgress = await getReadingProgress();
            if (savedProgress && savedProgress.progress_cfi && !savedProgress.progress_cfi.startsWith('page:')) {
                rendition.display(savedProgress.progress_cfi);
            }

        }).catch(function(error) {
            console.error('Error displaying book:', error);
            elements.viewer.innerHTML = '<div class="loading">加载书籍失败: ' + error.message + '</div>';
        });
    }

    elements.prevBtn.addEventListener('click', prevPage);
    elements.nextBtn.addEventListener('click', nextPage);

    elements.backBtn.addEventListener('click', function() {
        window.history.back();
    });

    elements.menuBtn.addEventListener('click', openToc);
    elements.closeTocBtn.addEventListener('click', closeToc);
    elements.overlay.addEventListener('click', function() {
        closeToc();
        closeFontPanel();
        closeZoomPanel();
    });

    if (elements.fontBtn) {
        elements.fontBtn.addEventListener('click', function() {
            if (elements.fontPanel && elements.fontPanel.classList.contains('open')) {
                closeFontPanel();
            } else {
                closeZoomPanel();
                openFontPanel();
            }
        });
    }

    if (elements.zoomBtn) {
        elements.zoomBtn.addEventListener('click', function() {
            if (elements.zoomPanel && elements.zoomPanel.classList.contains('open')) {
                closeZoomPanel();
            } else {
                closeFontPanel();
                openZoomPanel();
            }
        });
    }

    elements.viewer.addEventListener('click', function(e) {
        const rect = elements.viewer.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = rect.width;
        
        if (x < width * 0.3) {
            prevPage();
        } else if (x > width * 0.7) {
            nextPage();
        }
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowLeft') {
            prevPage();
        } else if (e.key === 'ArrowRight') {
            nextPage();
        } else if (e.key === 'Escape') {
            closeToc();
            closeFontPanel();
            closeZoomPanel();
        }
    });

    document.addEventListener('visibilitychange', function() {
        if (document.hidden && isInitialized) {
            if (isPdf) {
                const percentage = totalPages > 0 ? (currentPage / totalPages) * 100 : 0;
                updateProgress(percentage, currentPage);
            } else if (rendition) {
                const location = rendition.location;
                if (location && location.start) {
                    let percentage = 0;
                    if (book.locations && book.locations.length > 0 && typeof location.start.location === 'number') {
                        percentage = (location.start.location / book.locations.length) * 100;
                    }
                    updateProgress(percentage, null, location.start.cfi || null);
                }
            }
        }
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initReader);
    } else {
        initReader();
    }

})();