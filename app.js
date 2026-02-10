// Application state
let pages = [];
let currentPageId = null;

// Constants
const PARAGRAPH_BREAK_MARKER = '___PARAGRAPH_BREAK___';

// DOM Elements
const pagesList = document.getElementById('pagesList');
const newPageBtn = document.getElementById('newPageBtn');
const pageTitle = document.getElementById('pageTitle');
const markdownEditor = document.getElementById('markdownEditor');
const markdownPreview = document.getElementById('markdownPreview');
const exportBtn = document.getElementById('exportBtn');
const deleteBtn = document.getElementById('deleteBtn');
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
    markdownEditor.addEventListener('input', debounce(updatePageContent, 300));
    exportBtn.addEventListener('click', exportCurrentPage);
    deleteBtn.addEventListener('click', deleteCurrentPage);
}

// Load pages from localStorage
function loadPages() {
    const savedPages = localStorage.getItem('written-pages');
    if (savedPages) {
        pages = JSON.parse(savedPages);
    }
}

// Save pages to localStorage
function savePages() {
    localStorage.setItem('written-pages', JSON.stringify(pages));
}

// Create a new page
function createNewPage() {
    const newPage = {
        id: Date.now().toString(),
        title: 'Untitled',
        content: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    pages.unshift(newPage);
    savePages();
    renderPagesList();
    loadPage(newPage.id);
}

// Render the pages list in the sidebar
function renderPagesList() {
    pagesList.innerHTML = '';
    
    if (pages.length === 0) {
        pagesList.innerHTML = '<div style="padding: 20px; text-align: center; color: #9b9a97;">No pages yet</div>';
        return;
    }
    
    pages.forEach(page => {
        const pageItem = document.createElement('div');
        pageItem.className = 'page-item';
        if (page.id === currentPageId) {
            pageItem.classList.add('active');
        }
        
        pageItem.innerHTML = `
            <span class="page-item-icon">📄</span>
            <span class="page-item-title">${escapeHtml(page.title)}</span>
        `;
        
        pageItem.addEventListener('click', () => loadPage(page.id));
        pagesList.appendChild(pageItem);
    });
}

// Load a specific page
function loadPage(pageId) {
    const page = pages.find(p => p.id === pageId);
    if (!page) return;
    
    currentPageId = pageId;
    pageTitle.value = page.title;
    markdownEditor.value = page.content;
    updatePreview(page.content);
    
    hideWelcomeScreen();
    renderPagesList();
}

// Update page title
function updatePageTitle() {
    if (!currentPageId) return;
    
    const page = pages.find(p => p.id === currentPageId);
    if (page) {
        page.title = pageTitle.value || 'Untitled';
        page.updatedAt = new Date().toISOString();
        savePages();
        renderPagesList();
    }
}

// Update page content
function updatePageContent() {
    if (!currentPageId) return;
    
    const page = pages.find(p => p.id === currentPageId);
    if (page) {
        page.content = markdownEditor.value;
        page.updatedAt = new Date().toISOString();
        savePages();
        updatePreview(page.content);
    }
}

// Update markdown preview
function updatePreview(markdown) {
    // Check if marked.js is available, otherwise use simple fallback
    if (typeof marked !== 'undefined' && marked.parse) {
        markdownPreview.innerHTML = marked.parse(markdown);
    } else {
        // Simple markdown fallback
        markdownPreview.innerHTML = simpleMarkdownToHtml(markdown);
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
    
    const content = `# ${page.title}\n\n${page.content}`;
    const blob = new Blob([content], { type: 'text/markdown' });
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
    
    if (confirm('Are you sure you want to delete this page?')) {
        pages = pages.filter(p => p.id !== currentPageId);
        savePages();
        
        if (pages.length > 0) {
            loadPage(pages[0].id);
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
