# Written - Personal Markdown Notebook

A personal, Notion-like notebook application for creating and managing markdown pages. Built to be hosted on GitHub Pages.

## ✨ Features

- 📝 **Markdown Editor**: Write your notes in markdown with a live preview
- 📄 **Multiple Pages**: Create and manage multiple pages in one place
- 💾 **Auto-Save**: Your work is automatically saved to browser's local storage
- 📥 **Export**: Download your pages as markdown files
- 🎨 **Clean UI**: Notion-inspired interface for a pleasant writing experience
- 🔍 **Live Preview**: See your formatted markdown in real-time

## 🚀 Getting Started

### Using the Application

1. Visit the hosted site (see deployment section below)
2. Click "**+ New Page**" to create your first page
3. Start writing in markdown format
4. Your changes are automatically saved
5. Export your pages as `.md` files anytime

### Markdown Support

The editor supports standard markdown syntax:

- Headers: `# H1`, `## H2`, `### H3`
- **Bold**: `**text**`
- *Italic*: `*text*`
- Lists: `- item` or `1. item`
- Links: `[text](url)`
- Code: `` `inline` `` or triple backticks for blocks
- Blockquotes: `> quote`
- And more!

## 🌐 Deploying to GitHub Pages

1. Fork this repository
2. Go to repository Settings → Pages
3. Under "Source", select the branch you want to deploy (e.g., `main` or `copilot/create-personal-markdown-site`)
4. Click Save
5. Your site will be available at `https://[username].github.io/Written/`

## 💡 Usage Tips

- All data is stored locally in your browser
- To backup your notes, export them as markdown files
- Clear browser data will delete all pages
- Works completely offline after first load

## 🛠️ Technical Details

- Pure HTML, CSS, and JavaScript
- No build process required
- Uses [marked.js](https://marked.js.org/) for markdown parsing
- LocalStorage for data persistence
- Responsive design

## 📝 License

This project is open source and available for personal use.