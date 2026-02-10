// Application state
let pages = [];
let currentPageId = null;
let draggedBlock = null;

// Undo/Redo state
let history = [];
let historyIndex = -1;
const MAX_HISTORY = 50;

// Constants
const PARAGRAPH_BREAK_MARKER = '___PARAGRAPH_BREAK___';

// Block types
const BLOCK_TYPES = {
    TEXT: 'text',
    HEADING1: 'heading1',
    HEADING2: 'heading2',
    HEADING3: 'heading3',
    TODO: 'todo',
    BULLETED_LIST: 'bulleted_list',
    NUMBERED_LIST: 'numbered_list',
    CODE: 'code',
    QUOTE: 'quote',
    DIVIDER: 'divider'
};

// DOM Elements
const pagesList = document.getElementById('pagesList');
const newPageBtn = document.getElementById('newPageBtn');
const pageTitle = document.getElementById('pageTitle');
const blocksContainer = document.getElementById('blocksContainer');
const exportBtn = document.getElementById('exportBtn');
const deleteBtn = document.getElementById('deleteBtn');
const undoBtn = document.getElementById('undoBtn');
const redoBtn = document.getElementById('redoBtn');
const editorContainer = document.querySelector('.editor-container');
const welcomeScreen = document.getElementById('welcomeScreen');

// Initialize the application
function init() {
    loadPages();
    setupEventListeners();
    renderPagesList();
    
    // If there are pages, load the first one
    if (pages.length > 0) {
        loadPage(pages[0].id);
    } else {
        showWelcomeScreen();
    }
}

// Setup event listeners
function setupEventListeners() {
    newPageBtn.addEventListener('click', createNewPage);
    pageTitle.addEventListener('input', updatePageTitle);
    exportBtn.addEventListener('click', exportCurrentPage);
    deleteBtn.addEventListener('click', deleteCurrentPage);
    undoBtn.addEventListener('click', undo);
    redoBtn.addEventListener('click', redo);
    
    // Global keyboard shortcuts
    document.addEventListener('keydown', handleGlobalShortcuts);
}

// Load pages from localStorage
function loadPages() {
    const savedPages = localStorage.getItem('written-pages');
    if (savedPages) {
        pages = JSON.parse(savedPages);
    }
    
    // Load history
    const savedHistory = localStorage.getItem('written-history');
    if (savedHistory) {
        try {
            const parsed = JSON.parse(savedHistory);
            history = parsed.history || [];
            historyIndex = parsed.index || -1;
        } catch (e) {
            history = [];
            historyIndex = -1;
        }
    }
    updateUndoRedoButtons();
}

// Save pages to localStorage
function savePages() {
    localStorage.setItem('written-pages', JSON.stringify(pages));
}

// Save history to localStorage
function saveHistory() {
    localStorage.setItem('written-history', JSON.stringify({
        history: history,
        index: historyIndex
    }));
}

// Add state to history
function addToHistory(description) {
    // Remove any future history if we're not at the end
    if (historyIndex < history.length - 1) {
        history = history.slice(0, historyIndex + 1);
    }
    
    // Add new state
    history.push({
        pages: JSON.parse(JSON.stringify(pages)),
        currentPageId: currentPageId,
        description: description,
        timestamp: Date.now()
    });
    
    // Keep history size manageable
    if (history.length > MAX_HISTORY) {
        history.shift();
    } else {
        historyIndex++;
    }
    
    saveHistory();
    updateUndoRedoButtons();
}

// Undo action
function undo() {
    if (historyIndex > 0) {
        historyIndex--;
        restoreFromHistory();
    }
}

// Redo action
function redo() {
    if (historyIndex < history.length - 1) {
        historyIndex++;
        restoreFromHistory();
    }
}

// Restore state from history
function restoreFromHistory() {
    if (historyIndex >= 0 && historyIndex < history.length) {
        const state = history[historyIndex];
        pages = JSON.parse(JSON.stringify(state.pages));
        currentPageId = state.currentPageId;
        
        savePages();
        renderPagesList();
        
        if (currentPageId && pages.find(p => p.id === currentPageId)) {
            loadPage(currentPageId, false); // false = don't add to history
        } else {
            showWelcomeScreen();
        }
        
        updateUndoRedoButtons();
    }
}

// Update undo/redo button states
function updateUndoRedoButtons() {
    if (undoBtn) {
        undoBtn.disabled = historyIndex <= 0;
    }
    if (redoBtn) {
        redoBtn.disabled = historyIndex >= history.length - 1;
    }
}

// Create a new page
function createNewPage() {
    const newPage = {
        id: Date.now().toString(),
        title: 'Sans titre',
        icon: '📄',
        blocks: [
            {
                id: generateId(),
                type: BLOCK_TYPES.TEXT,
                content: '',
                properties: {}
            }
        ],
        properties: {
            tags: [],
            status: '',
            created: new Date().toISOString(),
            updated: new Date().toISOString()
        },
        parentId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    pages.unshift(newPage);
    savePages();
    addToHistory('Nouvelle page créée');
    renderPagesList();
    loadPage(newPage.id, false); // Don't add to history again
}

// Render the pages list in the sidebar
function renderPagesList() {
    pagesList.innerHTML = '';
    
    if (pages.length === 0) {
        pagesList.innerHTML = '<div style="padding: 20px; text-align: center; color: #9b9a97;">Aucune page</div>';
        return;
    }
    
    // Render root pages (no parent)
    const rootPages = pages.filter(p => !p.parentId);
    rootPages.forEach(page => {
        renderPageItem(page, 0);
    });
}

// Render a single page item with children
function renderPageItem(page, level) {
    const pageItem = document.createElement('div');
    pageItem.className = 'page-item';
    pageItem.style.paddingLeft = (12 + level * 20) + 'px';
    if (page.id === currentPageId) {
        pageItem.classList.add('active');
    }
    
    const icon = page.icon || '📄';
    const children = pages.filter(p => p.parentId === page.id);
    const hasChildren = children.length > 0;
    
    const toggleIcon = hasChildren ? 
        (page.expanded ? '▼' : '▶') : '';
    
    pageItem.innerHTML = `
        ${toggleIcon ? `<span class="page-toggle" data-page-id="${page.id}">${toggleIcon}</span>` : '<span class="page-toggle-spacer"></span>'}
        <span class="page-item-icon">${icon}</span>
        <span class="page-item-title">${escapeHtml(page.title)}</span>
        <button class="page-add-child" data-page-id="${page.id}" title="Ajouter une sous-page">+</button>
    `;
    
    pageItem.querySelector('.page-item-title').addEventListener('click', () => loadPage(page.id));
    pageItem.querySelector('.page-item-icon').addEventListener('click', () => loadPage(page.id));
    
    if (toggleIcon) {
        pageItem.querySelector('.page-toggle').addEventListener('click', (e) => {
            e.stopPropagation();
            togglePageExpanded(page.id);
        });
    }
    
    pageItem.querySelector('.page-add-child').addEventListener('click', (e) => {
        e.stopPropagation();
        createChildPage(page.id);
    });
    
    pagesList.appendChild(pageItem);
    
    // Render children if expanded
    if (page.expanded && hasChildren) {
        children.forEach(child => {
            renderPageItem(child, level + 1);
        });
    }
}

// Toggle page expansion
function togglePageExpanded(pageId) {
    const page = pages.find(p => p.id === pageId);
    if (page) {
        page.expanded = !page.expanded;
        savePages();
        renderPagesList();
    }
}

// Create a child page
function createChildPage(parentId) {
    const newPage = {
        id: Date.now().toString(),
        title: 'Sans titre',
        icon: '📄',
        blocks: [
            {
                id: generateId(),
                type: BLOCK_TYPES.TEXT,
                content: '',
                properties: {}
            }
        ],
        properties: {
            tags: [],
            status: '',
            created: new Date().toISOString(),
            updated: new Date().toISOString()
        },
        parentId: parentId,
        expanded: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    // Expand parent
    const parent = pages.find(p => p.id === parentId);
    if (parent) {
        parent.expanded = true;
    }
    
    pages.push(newPage);
    savePages();
    addToHistory('Sous-page créée');
    renderPagesList();
    loadPage(newPage.id, false); // Don't add to history again
}

// Load a specific page
function loadPage(pageId, addHistory = true) {
    const page = pages.find(p => p.id === pageId);
    if (!page) return;
    
    currentPageId = pageId;
    pageTitle.value = page.title;
    
    // Render breadcrumbs
    renderBreadcrumbs(page);
    
    // Render blocks
    renderBlocks(page.blocks || []);
    
    hideWelcomeScreen();
    renderPagesList();
    
    // Add to history if requested
    if (addHistory) {
        addToHistory('Page chargée: ' + page.title);
    }
}

// Render breadcrumbs
function renderBreadcrumbs(page) {
    const breadcrumbsContainer = document.getElementById('breadcrumbs');
    if (!breadcrumbsContainer) return;
    
    const breadcrumbs = [];
    let currentPage = page;
    
    // Build breadcrumb trail
    while (currentPage) {
        breadcrumbs.unshift(currentPage);
        if (currentPage.parentId) {
            currentPage = pages.find(p => p.id === currentPage.parentId);
        } else {
            currentPage = null;
        }
    }
    
    // Render breadcrumbs
    breadcrumbsContainer.innerHTML = breadcrumbs.map((p, index) => {
        const icon = p.icon || '📄';
        const isLast = index === breadcrumbs.length - 1;
        return `
            <span class="breadcrumb-item ${isLast ? 'active' : ''}" data-page-id="${p.id}">
                <span class="breadcrumb-icon">${icon}</span>
                <span class="breadcrumb-title">${escapeHtml(p.title)}</span>
            </span>
            ${!isLast ? '<span class="breadcrumb-separator">/</span>' : ''}
        `;
    }).join('');
    
    // Add click handlers
    breadcrumbsContainer.querySelectorAll('.breadcrumb-item:not(.active)').forEach(item => {
        item.addEventListener('click', () => {
            const pageId = item.dataset.pageId;
            loadPage(pageId);
        });
    });
}

// Render blocks in the editor
function renderBlocks(blocks) {
    blocksContainer.innerHTML = '';
    
    if (blocks.length === 0) {
        blocks.push({
            id: generateId(),
            type: BLOCK_TYPES.TEXT,
            content: '',
            properties: {}
        });
    }
    
    blocks.forEach((block, index) => {
        const blockElement = createBlockElement(block, index);
        blocksContainer.appendChild(blockElement);
    });
    
    // Focus first block if it's the only empty block
    const firstInput = blocksContainer.querySelector('[contenteditable="true"]');
    if (firstInput && blocks.length === 1 && !blocks[0].content) {
        firstInput.focus();
    }
}

// Create a block element
function createBlockElement(block, index) {
    const blockEl = document.createElement('div');
    blockEl.className = 'block';
    blockEl.dataset.blockId = block.id;
    blockEl.dataset.blockType = block.type;
    blockEl.draggable = true;
    
    // Drag and drop handlers
    blockEl.addEventListener('dragstart', handleBlockDragStart);
    blockEl.addEventListener('dragover', handleBlockDragOver);
    blockEl.addEventListener('drop', handleBlockDrop);
    blockEl.addEventListener('dragend', handleBlockDragEnd);
    
    // Block controls
    const controls = document.createElement('div');
    controls.className = 'block-controls';
    controls.innerHTML = `
        <button class="block-drag-handle" title="Glisser pour réorganiser">⋮⋮</button>
        <button class="block-add" title="Ajouter un bloc en dessous">+</button>
        <button class="block-menu" title="Changer le type">⚙</button>
        <button class="block-delete" title="Supprimer ce bloc">×</button>
    `;
    
    controls.querySelector('.block-add').addEventListener('click', () => addBlockAfter(index));
    controls.querySelector('.block-menu').addEventListener('click', (e) => showBlockMenu(e, block, index));
    controls.querySelector('.block-delete').addEventListener('click', () => deleteBlock(block.id));
    
    blockEl.appendChild(controls);
    
    // Block content based on type
    const content = createBlockContent(block);
    blockEl.appendChild(content);
    
    return blockEl;
}

// Create block content based on type
function createBlockContent(block) {
    const contentDiv = document.createElement('div');
    contentDiv.className = 'block-content';
    
    switch (block.type) {
        case BLOCK_TYPES.TEXT:
            contentDiv.innerHTML = `<div class="block-text" contenteditable="true" data-placeholder="Tapez '/' pour les commandes">${escapeHtml(block.content)}</div>`;
            break;
        case BLOCK_TYPES.HEADING1:
            contentDiv.innerHTML = `<h1 class="block-heading" contenteditable="true" data-placeholder="Titre 1">${escapeHtml(block.content)}</h1>`;
            break;
        case BLOCK_TYPES.HEADING2:
            contentDiv.innerHTML = `<h2 class="block-heading" contenteditable="true" data-placeholder="Titre 2">${escapeHtml(block.content)}</h2>`;
            break;
        case BLOCK_TYPES.HEADING3:
            contentDiv.innerHTML = `<h3 class="block-heading" contenteditable="true" data-placeholder="Titre 3">${escapeHtml(block.content)}</h3>`;
            break;
        case BLOCK_TYPES.TODO:
            const checked = block.properties?.checked ? 'checked' : '';
            contentDiv.innerHTML = `
                <div class="block-todo">
                    <input type="checkbox" ${checked}>
                    <div contenteditable="true" data-placeholder="Tâche à faire">${escapeHtml(block.content)}</div>
                </div>
            `;
            contentDiv.querySelector('input[type="checkbox"]').addEventListener('change', (e) => {
                block.properties = block.properties || {};
                block.properties.checked = e.target.checked;
                saveCurrentPage();
                addToHistory('Tâche ' + (e.target.checked ? 'cochée' : 'décochée'));
            });
            break;
        case BLOCK_TYPES.BULLETED_LIST:
            contentDiv.innerHTML = `<div class="block-list"><span class="list-marker">•</span><div contenteditable="true" data-placeholder="Élément de liste">${escapeHtml(block.content)}</div></div>`;
            break;
        case BLOCK_TYPES.NUMBERED_LIST:
            contentDiv.innerHTML = `<div class="block-list"><span class="list-marker">1.</span><div contenteditable="true" data-placeholder="Élément de liste">${escapeHtml(block.content)}</div></div>`;
            break;
        case BLOCK_TYPES.CODE:
            contentDiv.innerHTML = `<pre class="block-code" contenteditable="true" data-placeholder="Code">${escapeHtml(block.content)}</pre>`;
            break;
        case BLOCK_TYPES.QUOTE:
            contentDiv.innerHTML = `<blockquote class="block-quote" contenteditable="true" data-placeholder="Citation">${escapeHtml(block.content)}</blockquote>`;
            break;
        case BLOCK_TYPES.DIVIDER:
            contentDiv.innerHTML = `<hr class="block-divider">`;
            break;
    }
    
    // Add input listeners
    const editableEl = contentDiv.querySelector('[contenteditable="true"]');
    if (editableEl) {
        editableEl.addEventListener('input', (e) => {
            block.content = e.target.textContent;
            saveCurrentPage();
        });
        
        editableEl.addEventListener('keydown', (e) => handleBlockKeydown(e, block));
    }
    
    return contentDiv;
}

// Update page title
function updatePageTitle() {
    if (!currentPageId) return;
    
    const page = pages.find(p => p.id === currentPageId);
    if (page) {
        const oldTitle = page.title;
        page.title = pageTitle.value || 'Sans titre';
        page.updatedAt = new Date().toISOString();
        savePages();
        renderPagesList();
        
        if (oldTitle !== page.title) {
            addToHistory('Titre modifié: ' + page.title);
        }
    }
}

// Save current page
function saveCurrentPage() {
    if (!currentPageId) return;
    
    const page = pages.find(p => p.id === currentPageId);
    if (page) {
        page.updatedAt = new Date().toISOString();
        savePages();
    }
}

// Handle block keydown events
function handleBlockKeydown(e, block) {
    // Enter key - create new block
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const page = pages.find(p => p.id === currentPageId);
        if (!page) return;
        
        const blockIndex = page.blocks.findIndex(b => b.id === block.id);
        const newBlock = {
            id: generateId(),
            type: BLOCK_TYPES.TEXT,
            content: '',
            properties: {}
        };
        page.blocks.splice(blockIndex + 1, 0, newBlock);
        saveCurrentPage();
        addToHistory('Nouveau bloc créé');
        renderBlocks(page.blocks);
        
        // Focus new block
        setTimeout(() => {
            const newBlockEl = document.querySelector(`[data-block-id="${newBlock.id}"] [contenteditable="true"]`);
            if (newBlockEl) newBlockEl.focus();
        }, 0);
    }
    
    // Backspace on empty block - delete block
    if (e.key === 'Backspace' && !block.content) {
        e.preventDefault();
        const page = pages.find(p => p.id === currentPageId);
        if (!page || page.blocks.length === 1) return;
        
        const blockIndex = page.blocks.findIndex(b => b.id === block.id);
        page.blocks.splice(blockIndex, 1);
        saveCurrentPage();
        addToHistory('Bloc supprimé');
        renderBlocks(page.blocks);
        
        // Focus previous block
        if (blockIndex > 0) {
            setTimeout(() => {
                const prevBlock = page.blocks[blockIndex - 1];
                const prevBlockEl = document.querySelector(`[data-block-id="${prevBlock.id}"] [contenteditable="true"]`);
                if (prevBlockEl) {
                    prevBlockEl.focus();
                    // Move cursor to end
                    const range = document.createRange();
                    const sel = window.getSelection();
                    range.selectNodeContents(prevBlockEl);
                    range.collapse(false);
                    sel.removeAllRanges();
                    sel.addRange(range);
                }
            }, 0);
        }
    }
    
    // Slash command
    if (e.key === '/' && !block.content) {
        e.preventDefault();
        showBlockTypeMenu(e, block);
    }
}

// Add block after index
function addBlockAfter(index) {
    const page = pages.find(p => p.id === currentPageId);
    if (!page) return;
    
    const newBlock = {
        id: generateId(),
        type: BLOCK_TYPES.TEXT,
        content: '',
        properties: {}
    };
    page.blocks.splice(index + 1, 0, newBlock);
    saveCurrentPage();
    addToHistory('Bloc ajouté');
    renderBlocks(page.blocks);
}

// Delete a block
function deleteBlock(blockId) {
    const page = pages.find(p => p.id === currentPageId);
    if (!page) return;
    
    // Don't allow deleting the last block
    if (page.blocks.length <= 1) {
        return;
    }
    
    const blockIndex = page.blocks.findIndex(b => b.id === blockId);
    if (blockIndex === -1) return;
    
    const deletedBlock = page.blocks[blockIndex];
    page.blocks.splice(blockIndex, 1);
    saveCurrentPage();
    addToHistory('Bloc supprimé');
    renderBlocks(page.blocks);
    
    // Focus previous or next block
    setTimeout(() => {
        const targetIndex = Math.max(0, blockIndex - 1);
        if (page.blocks[targetIndex]) {
            const targetBlockEl = document.querySelector(`[data-block-id="${page.blocks[targetIndex].id}"] [contenteditable="true"]`);
            if (targetBlockEl) targetBlockEl.focus();
        }
    }, 0);
}

// Show block menu
function showBlockMenu(e, block, index) {
    e.stopPropagation();
    showBlockTypeMenu(e, block);
}

// Show block type menu
function showBlockTypeMenu(e, block) {
    const menu = document.createElement('div');
    menu.className = 'block-type-menu';
    menu.innerHTML = `
        <div class="menu-item" data-type="${BLOCK_TYPES.TEXT}">📝 Texte</div>
        <div class="menu-item" data-type="${BLOCK_TYPES.HEADING1}">H1 Titre 1</div>
        <div class="menu-item" data-type="${BLOCK_TYPES.HEADING2}">H2 Titre 2</div>
        <div class="menu-item" data-type="${BLOCK_TYPES.HEADING3}">H3 Titre 3</div>
        <div class="menu-item" data-type="${BLOCK_TYPES.TODO}">☑ Tâche</div>
        <div class="menu-item" data-type="${BLOCK_TYPES.BULLETED_LIST}">• Liste à puces</div>
        <div class="menu-item" data-type="${BLOCK_TYPES.NUMBERED_LIST}">1. Liste numérotée</div>
        <div class="menu-item" data-type="${BLOCK_TYPES.CODE}">💻 Code</div>
        <div class="menu-item" data-type="${BLOCK_TYPES.QUOTE}">❝ Citation</div>
        <div class="menu-item" data-type="${BLOCK_TYPES.DIVIDER}">— Séparateur</div>
    `;
    
    // Position menu
    const rect = e.target.getBoundingClientRect();
    menu.style.position = 'fixed';
    menu.style.left = rect.left + 'px';
    menu.style.top = (rect.bottom + 5) + 'px';
    menu.style.zIndex = '1000';
    
    // Handle click
    menu.addEventListener('click', (e) => {
        const type = e.target.dataset.type;
        if (type) {
            const oldType = block.type;
            block.type = type;
            if (type === BLOCK_TYPES.DIVIDER) {
                block.content = '';
            }
            saveCurrentPage();
            addToHistory('Type de bloc changé');
            const page = pages.find(p => p.id === currentPageId);
            if (page) renderBlocks(page.blocks);
        }
        menu.remove();
    });
    
    // Close on outside click after a small delay to avoid immediate closure
    setTimeout(() => {
        const closeMenu = (e) => {
            if (!menu.contains(e.target)) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        };
        document.addEventListener('click', closeMenu);
    }, 100);
    
    document.body.appendChild(menu);
}

// Drag and drop handlers
function handleBlockDragStart(e) {
    draggedBlock = e.currentTarget;
    e.currentTarget.classList.add('dragging');
}

function handleBlockDragOver(e) {
    e.preventDefault();
    const afterElement = getDragAfterElement(blocksContainer, e.clientY);
    if (afterElement == null) {
        blocksContainer.appendChild(draggedBlock);
    } else {
        blocksContainer.insertBefore(draggedBlock, afterElement);
    }
}

function handleBlockDrop(e) {
    e.preventDefault();
    updateBlocksOrder();
}

function handleBlockDragEnd(e) {
    e.currentTarget.classList.remove('dragging');
    draggedBlock = null;
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.block:not(.dragging)')];
    
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function updateBlocksOrder() {
    const page = pages.find(p => p.id === currentPageId);
    if (!page) return;
    
    const blockElements = [...blocksContainer.querySelectorAll('.block')];
    const newOrder = blockElements.map(el => {
        const blockId = el.dataset.blockId;
        return page.blocks.find(b => b.id === blockId);
    }).filter(Boolean);
    
    page.blocks = newOrder;
    saveCurrentPage();
    addToHistory('Blocs réorganisés');
}

// Global keyboard shortcuts
function handleGlobalShortcuts(e) {
    // Cmd/Ctrl + N - New page
    if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        createNewPage();
    }
    
    // Cmd/Ctrl + Z - Undo
    if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
    }
    
    // Cmd/Ctrl + Y or Cmd/Ctrl + Shift + Z - Redo
    if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
    }
}

// Simple markdown to HTML converter (fallback)
function simpleMarkdownToHtml(markdown) {
    if (!markdown) return '';
    
    let html = markdown;
    
    // Headers (process from most specific to least specific)
    // Escape HTML to prevent XSS
    html = html.replace(/^### (.+)$/gim, (match, content) => '<h3>' + escapeHtml(content) + '</h3>');
    html = html.replace(/^## (.+)$/gim, (match, content) => '<h2>' + escapeHtml(content) + '</h2>');
    html = html.replace(/^# (.+)$/gim, (match, content) => '<h1>' + escapeHtml(content) + '</h1>');
    
    // Bold
    html = html.replace(/\*\*(.+?)\*\*/g, (match, content) => '<strong>' + escapeHtml(content) + '</strong>');
    
    // Italic
    html = html.replace(/\*(.+?)\*/g, (match, content) => '<em>' + escapeHtml(content) + '</em>');
    
    // Links - sanitize URLs to prevent XSS
    html = html.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, (match, text, url) => {
        const sanitizedUrl = sanitizeUrl(url);
        return '<a href="' + sanitizedUrl + '">' + escapeHtml(text) + '</a>';
    });
    
    // Inline code
    html = html.replace(/`([^`]+)`/g, (match, content) => '<code>' + escapeHtml(content) + '</code>');
    
    // Preserve headers by replacing newlines in a way that doesn't break them
    html = html.replace(/\n\n/g, PARAGRAPH_BREAK_MARKER);
    html = html.replace(/\n/g, '<br>');
    
    // Wrap content in paragraphs, but not headers
    html = html.replace(new RegExp(PARAGRAPH_BREAK_MARKER, 'g'), '</p><p>');
    html = '<p>' + html + '</p>';
    
    // Fix headers wrapped in paragraphs
    html = html.replace(/<p>(<h[123]>)/g, '$1');
    html = html.replace(/(<\/h[123]>)<\/p>/g, '$1');
    html = html.replace(/<p><\/p>/g, '');
    
    return html;
}

// Sanitize URL to prevent XSS attacks
function sanitizeUrl(url) {
    const trimmedUrl = url.trim();
    // Check for dangerous protocols
    const dangerousProtocols = ['javascript:', 'data:', 'vbscript:'];
    const lowerUrl = trimmedUrl.toLowerCase();
    
    for (const protocol of dangerousProtocols) {
        if (lowerUrl.startsWith(protocol)) {
            return '#'; // Return safe fallback
        }
    }
    
    return escapeHtml(trimmedUrl);
}

// Export current page as markdown
function exportCurrentPage() {
    if (!currentPageId) return;
    
    const page = pages.find(p => p.id === currentPageId);
    if (!page) return;
    
    // Convert blocks to markdown
    let markdown = `# ${page.title}\n\n`;
    
    page.blocks.forEach(block => {
        switch (block.type) {
            case BLOCK_TYPES.TEXT:
                markdown += `${block.content}\n\n`;
                break;
            case BLOCK_TYPES.HEADING1:
                markdown += `# ${block.content}\n\n`;
                break;
            case BLOCK_TYPES.HEADING2:
                markdown += `## ${block.content}\n\n`;
                break;
            case BLOCK_TYPES.HEADING3:
                markdown += `### ${block.content}\n\n`;
                break;
            case BLOCK_TYPES.TODO:
                const checked = block.properties?.checked ? 'x' : ' ';
                markdown += `- [${checked}] ${block.content}\n`;
                break;
            case BLOCK_TYPES.BULLETED_LIST:
                markdown += `- ${block.content}\n`;
                break;
            case BLOCK_TYPES.NUMBERED_LIST:
                markdown += `1. ${block.content}\n`;
                break;
            case BLOCK_TYPES.CODE:
                markdown += `\`\`\`\n${block.content}\n\`\`\`\n\n`;
                break;
            case BLOCK_TYPES.QUOTE:
                markdown += `> ${block.content}\n\n`;
                break;
            case BLOCK_TYPES.DIVIDER:
                markdown += `---\n\n`;
                break;
        }
    });
    
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${page.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Delete current page
function deleteCurrentPage() {
    if (!currentPageId) return;
    
    if (confirm('Êtes-vous sûr de vouloir supprimer cette page ?')) {
        const deletedPage = pages.find(p => p.id === currentPageId);
        pages = pages.filter(p => p.id !== currentPageId);
        savePages();
        addToHistory('Page supprimée: ' + (deletedPage?.title || 'Sans titre'));
        
        if (pages.length > 0) {
            loadPage(pages[0].id, false);
        } else {
            currentPageId = null;
            showWelcomeScreen();
        }
        
        renderPagesList();
    }
}

// Show welcome screen
function showWelcomeScreen() {
    editorContainer.classList.remove('active');
    welcomeScreen.classList.remove('hidden');
}

// Hide welcome screen
function hideWelcomeScreen() {
    editorContainer.classList.add('active');
    welcomeScreen.classList.add('hidden');
}

// Utility function: generate unique ID
function generateId() {
    return Date.now().toString() + Math.random().toString(36).substring(2, 11);
}

// Utility function: debounce
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Utility function: escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
