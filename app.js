// Application state
let pages = [];
let currentPageId = null;
let draggedBlock = null;

// Undo/Redo state
let history = [];
let historyIndex = -1;
const MAX_HISTORY = 50;

// Cursor proximity threshold for block navigation (pixels)
const CURSOR_EDGE_THRESHOLD = 5;

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
    DIVIDER: 'divider',
    TABLE: 'table'
};

// DOM Elements
const pagesList = document.getElementById('pagesList');
const newPageBtn = document.getElementById('newPageBtn');
const pageTitle = document.getElementById('pageTitle');
const blocksContainer = document.getElementById('blocksContainer');
const exportBtn = document.getElementById('exportBtn');
const pdfExportBtn = document.getElementById('pdfExportBtn');
const deleteBtn = document.getElementById('deleteBtn');
const undoBtn = document.getElementById('undoBtn');
const redoBtn = document.getElementById('redoBtn');
const darkModeToggle = document.getElementById('darkModeToggle');
const importBtn = document.getElementById('importBtn');
const importFileInput = document.getElementById('importFileInput');
const editorContainer = document.querySelector('.editor-container');
const welcomeScreen = document.getElementById('welcomeScreen');

// Initialize the application
function init() {
    loadPages();
    setupEventListeners();
    renderPagesList();
    
    // Restore dark mode preference
    if (localStorage.getItem('written-dark-mode') === 'true') {
        document.body.classList.add('dark-mode');
        darkModeToggle.textContent = '☀️ Mode clair';
    }
    
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
    pdfExportBtn.addEventListener('click', exportPDF);
    deleteBtn.addEventListener('click', deleteCurrentPage);
    undoBtn.addEventListener('click', undo);
    redoBtn.addEventListener('click', redo);
    darkModeToggle.addEventListener('click', toggleDarkMode);
    importBtn.addEventListener('click', () => importFileInput.click());
    importFileInput.addEventListener('change', handleImportFile);
    
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
        <button class="block-settings" title="Paramètres du bloc">🎨</button>
        <button class="block-delete" title="Supprimer ce bloc">×</button>
    `;
    
    controls.querySelector('.block-add').addEventListener('click', () => addBlockAfter(index));
    controls.querySelector('.block-menu').addEventListener('click', (e) => showBlockMenu(e, block, index));
    controls.querySelector('.block-settings').addEventListener('click', (e) => showBlockSettingsPanel(e, block));
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
        case BLOCK_TYPES.TABLE:
            const tableData = block.properties?.tableData || [['', ''], ['', '']];
            const tableWrapper = document.createElement('div');
            tableWrapper.className = 'block-table-wrapper';
            const table = document.createElement('table');
            table.className = 'block-table';
            tableData.forEach((row, rowIdx) => {
                const tr = document.createElement('tr');
                row.forEach((cell, colIdx) => {
                    const td = document.createElement('td');
                    td.contentEditable = 'true';
                    td.textContent = cell;
                    td.addEventListener('input', () => {
                        block.properties = block.properties || {};
                        block.properties.tableData = block.properties.tableData || tableData;
                        block.properties.tableData[rowIdx][colIdx] = td.textContent;
                        saveCurrentPage();
                    });
                    tr.appendChild(td);
                });
                table.appendChild(tr);
            });
            tableWrapper.appendChild(table);
            const tableControls = document.createElement('div');
            tableControls.className = 'block-table-controls';
            tableControls.innerHTML = `
                <button class="table-add-row">+ Ligne</button>
                <button class="table-remove-row">− Ligne</button>
                <button class="table-add-col">+ Colonne</button>
                <button class="table-remove-col">− Colonne</button>
            `;
            tableControls.querySelector('.table-add-row').addEventListener('click', () => {
                const cols = (block.properties.tableData[0] || []).length || 2;
                block.properties.tableData.push(new Array(cols).fill(''));
                saveCurrentPage();
                addToHistory('Ligne ajoutée');
                const page = pages.find(p => p.id === currentPageId);
                if (page) renderBlocks(page.blocks);
            });
            tableControls.querySelector('.table-remove-row').addEventListener('click', () => {
                if (block.properties.tableData.length > 1) {
                    block.properties.tableData.pop();
                    saveCurrentPage();
                    addToHistory('Ligne supprimée');
                    const page = pages.find(p => p.id === currentPageId);
                    if (page) renderBlocks(page.blocks);
                }
            });
            tableControls.querySelector('.table-add-col').addEventListener('click', () => {
                block.properties.tableData.forEach(row => row.push(''));
                saveCurrentPage();
                addToHistory('Colonne ajoutée');
                const page = pages.find(p => p.id === currentPageId);
                if (page) renderBlocks(page.blocks);
            });
            tableControls.querySelector('.table-remove-col').addEventListener('click', () => {
                if (block.properties.tableData[0].length > 1) {
                    block.properties.tableData.forEach(row => row.pop());
                    saveCurrentPage();
                    addToHistory('Colonne supprimée');
                    const page = pages.find(p => p.id === currentPageId);
                    if (page) renderBlocks(page.blocks);
                }
            });
            tableWrapper.appendChild(tableControls);
            contentDiv.appendChild(tableWrapper);
            break;
    }
    
    // Apply block properties (color, alignment)
    const styledEl = contentDiv.querySelector('[contenteditable="true"]') || contentDiv.querySelector('.block-divider') || contentDiv.querySelector('.block-table-wrapper');
    if (styledEl) {
        if (block.properties?.color) {
            styledEl.style.color = block.properties.color;
        }
        if (block.properties?.align) {
            styledEl.style.textAlign = block.properties.align;
        }
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
    
    // ArrowUp - focus previous block
    if (e.key === 'ArrowUp') {
        const page = pages.find(p => p.id === currentPageId);
        if (!page) return;
        const blockIndex = page.blocks.findIndex(b => b.id === block.id);
        if (blockIndex > 0) {
            const sel = window.getSelection();
            const range = sel.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            const editable = e.target;
            const editableRect = editable.getBoundingClientRect();
            // Only navigate if cursor is at the top of the block
            if (rect.top - editableRect.top < CURSOR_EDGE_THRESHOLD) {
                e.preventDefault();
                const prevBlock = page.blocks[blockIndex - 1];
                const prevEl = document.querySelector(`[data-block-id="${prevBlock.id}"] [contenteditable="true"]`);
                if (prevEl) {
                    prevEl.focus();
                    const r = document.createRange();
                    r.selectNodeContents(prevEl);
                    r.collapse(false);
                    sel.removeAllRanges();
                    sel.addRange(r);
                }
            }
        }
    }
    
    // ArrowDown - focus next block
    if (e.key === 'ArrowDown') {
        const page = pages.find(p => p.id === currentPageId);
        if (!page) return;
        const blockIndex = page.blocks.findIndex(b => b.id === block.id);
        if (blockIndex < page.blocks.length - 1) {
            const sel = window.getSelection();
            const range = sel.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            const editable = e.target;
            const editableRect = editable.getBoundingClientRect();
            // Only navigate if cursor is at the bottom of the block
            if (editableRect.bottom - rect.bottom < CURSOR_EDGE_THRESHOLD) {
                e.preventDefault();
                const nextBlock = page.blocks[blockIndex + 1];
                const nextEl = document.querySelector(`[data-block-id="${nextBlock.id}"] [contenteditable="true"]`);
                if (nextEl) {
                    nextEl.focus();
                    const r = document.createRange();
                    r.selectNodeContents(nextEl);
                    r.collapse(true);
                    sel.removeAllRanges();
                    sel.addRange(r);
                }
            }
        }
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
        alert('Impossible de supprimer le dernier bloc de la page.');
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
        <div class="menu-item" data-type="${BLOCK_TYPES.TABLE}">📊 Tableau</div>
    `;
    
    // Position menu
    const rect = e.target.getBoundingClientRect();
    menu.style.position = 'fixed';
    menu.style.left = rect.left + 'px';
    menu.style.top = (rect.bottom + 5) + 'px';
    menu.style.zIndex = '1000';
    
    document.body.appendChild(menu);
    
    // Fix off-screen positioning
    const menuRect = menu.getBoundingClientRect();
    if (menuRect.bottom > window.innerHeight) {
        menu.style.top = Math.max(0, rect.top - menuRect.height - 5) + 'px';
    }
    
    const items = menu.querySelectorAll('.menu-item');
    let activeIndex = 0;
    
    function setActiveItem(index) {
        items.forEach(item => item.classList.remove('active'));
        activeIndex = index;
        items[activeIndex].classList.add('active');
        items[activeIndex].scrollIntoView({ block: 'nearest' });
    }
    
    function selectItem(type) {
        if (type) {
            const oldType = block.type;
            block.type = type;
            if (type === BLOCK_TYPES.DIVIDER) {
                block.content = '';
            }
            if (type === BLOCK_TYPES.TABLE) {
                block.properties = block.properties || {};
                block.properties.tableData = [['', ''], ['', '']];
                block.content = '';
            }
            saveCurrentPage();
            addToHistory(`Type de bloc changé: ${oldType} → ${type}`);
            const page = pages.find(p => p.id === currentPageId);
            if (page) renderBlocks(page.blocks);
        }
        cleanup();
    }
    
    // Focus first item
    setActiveItem(0);
    
    // Keyboard handler
    function handleMenuKeydown(evt) {
        if (evt.key === 'ArrowDown') {
            evt.preventDefault();
            setActiveItem((activeIndex + 1) % items.length);
        } else if (evt.key === 'ArrowUp') {
            evt.preventDefault();
            setActiveItem((activeIndex - 1 + items.length) % items.length);
        } else if (evt.key === 'Enter') {
            evt.preventDefault();
            selectItem(items[activeIndex].dataset.type);
        } else if (evt.key === 'Escape') {
            evt.preventDefault();
            cleanup();
        }
    }
    
    document.addEventListener('keydown', handleMenuKeydown);
    
    // Handle click
    menu.addEventListener('click', (evt) => {
        const type = evt.target.dataset.type;
        if (type) {
            selectItem(type);
        }
    });
    
    function cleanup() {
        menu.remove();
        document.removeEventListener('keydown', handleMenuKeydown);
        document.removeEventListener('click', closeMenu);
    }
    
    // Close on outside click after a small delay to avoid immediate closure
    const closeMenu = (evt) => {
        if (!menu.contains(evt.target)) {
            cleanup();
        }
    };
    setTimeout(() => {
        document.addEventListener('click', closeMenu);
    }, 100);
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
            case BLOCK_TYPES.TABLE:
                markdown += exportTableAsMarkdown(block.properties?.tableData);
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
        // Collect all descendant page IDs
        const idsToDelete = new Set();
        function collectDescendants(pageId) {
            idsToDelete.add(pageId);
            pages.filter(p => p.parentId === pageId).forEach(child => collectDescendants(child.id));
        }
        collectDescendants(currentPageId);
        pages = pages.filter(p => !idsToDelete.has(p.id));
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

// Toggle dark mode
function toggleDarkMode() {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('written-dark-mode', isDark);
    darkModeToggle.textContent = isDark ? '☀️ Mode clair' : '🌙 Mode sombre';
}

// Export as PDF using print
function exportPDF() {
    window.print();
}

// Handle markdown file import
function handleImportFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(event) {
        const content = event.target.result;
        const blocks = parseMarkdownToBlocks(content);
        const title = file.name.replace(/\.md$/i, '');
        
        const newPage = {
            id: Date.now().toString(),
            title: title,
            icon: '📄',
            blocks: blocks.length > 0 ? blocks : [{ id: generateId(), type: BLOCK_TYPES.TEXT, content: '', properties: {} }],
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
        addToHistory('Page importée: ' + title);
        renderPagesList();
        loadPage(newPage.id, false);
    };
    reader.readAsText(file);
    // Reset input so same file can be imported again
    importFileInput.value = '';
}

// Parse markdown content into blocks
function parseMarkdownToBlocks(md) {
    const lines = md.split('\n');
    const blocks = [];
    let inCodeBlock = false;
    let codeContent = '';
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        if (line.startsWith('```')) {
            if (inCodeBlock) {
                blocks.push({ id: generateId(), type: BLOCK_TYPES.CODE, content: codeContent, properties: {} });
                codeContent = '';
                inCodeBlock = false;
            } else {
                inCodeBlock = true;
                codeContent = '';
            }
            continue;
        }
        
        if (inCodeBlock) {
            codeContent += (codeContent ? '\n' : '') + line;
            continue;
        }
        
        if (line.trim() === '') continue;
        
        if (line.trim() === '---') {
            blocks.push({ id: generateId(), type: BLOCK_TYPES.DIVIDER, content: '', properties: {} });
        } else if (line.startsWith('### ')) {
            blocks.push({ id: generateId(), type: BLOCK_TYPES.HEADING3, content: line.slice(4), properties: {} });
        } else if (line.startsWith('## ')) {
            blocks.push({ id: generateId(), type: BLOCK_TYPES.HEADING2, content: line.slice(3), properties: {} });
        } else if (line.startsWith('# ')) {
            blocks.push({ id: generateId(), type: BLOCK_TYPES.HEADING1, content: line.slice(2), properties: {} });
        } else if (/^- \[[ xX]\] /.test(line)) {
            const checked = line.charAt(3).toLowerCase() === 'x';
            blocks.push({ id: generateId(), type: BLOCK_TYPES.TODO, content: line.slice(6), properties: { checked } });
        } else if (line.startsWith('- ')) {
            blocks.push({ id: generateId(), type: BLOCK_TYPES.BULLETED_LIST, content: line.slice(2), properties: {} });
        } else if (/^\d+\. /.test(line)) {
            blocks.push({ id: generateId(), type: BLOCK_TYPES.NUMBERED_LIST, content: line.replace(/^\d+\. /, ''), properties: {} });
        } else if (line.startsWith('> ')) {
            blocks.push({ id: generateId(), type: BLOCK_TYPES.QUOTE, content: line.slice(2), properties: {} });
        } else {
            blocks.push({ id: generateId(), type: BLOCK_TYPES.TEXT, content: line, properties: {} });
        }
    }
    
    // Handle unclosed code block
    if (inCodeBlock && codeContent) {
        blocks.push({ id: generateId(), type: BLOCK_TYPES.CODE, content: codeContent, properties: {} });
    }
    
    return blocks;
}

// Show block settings panel (color, alignment)
function showBlockSettingsPanel(e, block) {
    e.stopPropagation();
    
    // Remove existing panel
    const existing = document.querySelector('.block-settings-panel');
    if (existing) existing.remove();
    
    const colors = [
        { name: 'default', value: '' },
        { name: 'red', value: '#eb5757' },
        { name: 'blue', value: '#2f80ed' },
        { name: 'green', value: '#27ae60' },
        { name: 'yellow', value: '#f2c94c' },
        { name: 'purple', value: '#9b51e0' }
    ];
    
    const currentColor = block.properties?.color || '';
    const currentAlign = block.properties?.align || 'left';
    
    const panel = document.createElement('div');
    panel.className = 'block-settings-panel';
    
    panel.innerHTML = `
        <div class="settings-section">
            <h4>Couleur</h4>
            <div class="color-options">
                ${colors.map(c => `<div class="color-option ${currentColor === c.value ? 'selected' : ''}" data-color="${c.value}" style="background-color: ${c.value || '#37352f'}" title="${c.name}"></div>`).join('')}
            </div>
        </div>
        <div class="settings-section">
            <h4>Alignement</h4>
            <div class="align-options">
                <button class="align-option ${currentAlign === 'left' ? 'selected' : ''}" data-align="left">↤</button>
                <button class="align-option ${currentAlign === 'center' ? 'selected' : ''}" data-align="center">↔</button>
                <button class="align-option ${currentAlign === 'right' ? 'selected' : ''}" data-align="right">↦</button>
            </div>
        </div>
    `;
    
    const rect = e.target.getBoundingClientRect();
    panel.style.left = rect.left + 'px';
    panel.style.top = (rect.bottom + 5) + 'px';
    
    document.body.appendChild(panel);
    
    // Fix off-screen
    const panelRect = panel.getBoundingClientRect();
    if (panelRect.bottom > window.innerHeight) {
        panel.style.top = Math.max(0, rect.top - panelRect.height - 5) + 'px';
    }
    if (panelRect.right > window.innerWidth) {
        panel.style.left = Math.max(0, window.innerWidth - panelRect.width - 10) + 'px';
    }
    
    // Color click handlers
    panel.querySelectorAll('.color-option').forEach(opt => {
        opt.addEventListener('click', () => {
            block.properties = block.properties || {};
            block.properties.color = opt.dataset.color;
            saveCurrentPage();
            addToHistory('Couleur du bloc modifiée');
            const page = pages.find(p => p.id === currentPageId);
            if (page) renderBlocks(page.blocks);
            panel.remove();
        });
    });
    
    // Align click handlers
    panel.querySelectorAll('.align-option').forEach(opt => {
        opt.addEventListener('click', () => {
            block.properties = block.properties || {};
            block.properties.align = opt.dataset.align;
            saveCurrentPage();
            addToHistory('Alignement du bloc modifié');
            const page = pages.find(p => p.id === currentPageId);
            if (page) renderBlocks(page.blocks);
            panel.remove();
        });
    });
    
    // Close on outside click
    setTimeout(() => {
        const closePanel = (evt) => {
            if (!panel.contains(evt.target)) {
                panel.remove();
                document.removeEventListener('click', closePanel);
            }
        };
        document.addEventListener('click', closePanel);
    }, 100);
}

// Export table blocks as markdown
function exportTableAsMarkdown(tableData) {
    if (!tableData || tableData.length === 0) return '';
    const cols = tableData[0].length;
    let md = '';
    tableData.forEach((row, idx) => {
        md += '| ' + row.map(cell => cell || ' ').join(' | ') + ' |\n';
        if (idx === 0) {
            md += '| ' + new Array(cols).fill('---').join(' | ') + ' |\n';
        }
    });
    return md + '\n';
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
