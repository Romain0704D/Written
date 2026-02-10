# Written - Personal Notion-like Workspace

Un espace de travail personnel inspiré de Notion, créé avec du JavaScript vanilla et déployable sur GitHub Pages.

## ✨ Fonctionnalités

### 🧱 Système de Blocs Modulaires
- **10 types de blocs** : Texte, Headings (H1/H2/H3), Todo, Listes (à puces/numérotées), Code, Citation, Séparateur
- **Menu "/" slash command** : Tapez `/` pour changer rapidement le type de bloc
- **Drag & Drop** : Réorganisez les blocs en les faisant glisser
- **Raccourcis clavier** :
  - `Enter` : Créer un nouveau bloc
  - `Backspace` : Supprimer un bloc vide
  - `Cmd/Ctrl + N` : Nouvelle page
- **Contrôles de bloc** : Boutons +, ⚙ et poignée de déplacement sur chaque bloc

### 📂 Pages Hiérarchiques
- **Structure parent/enfant** : Organisez vos pages en arborescence illimitée
- **Expand/Collapse** : Flèches ▶/▼ pour replier/déplier les sous-pages
- **Breadcrumbs** : Navigation facile avec fil d'Ariane
- **Création rapide** : Bouton + sur chaque page pour ajouter une sous-page
- **Icônes personnalisées** : Chaque page peut avoir son propre émoji/icône

### 💾 Auto-Save & Export
- Sauvegarde automatique dans localStorage
- Export en markdown avec structure préservée
- Fonctionne 100% offline après le premier chargement

## 🚀 Démarrage Rapide

### Utiliser l'application

1. Visitez le site hébergé (voir section déploiement)
2. Cliquez sur "**+ New Page**" pour créer votre première page
3. Tapez `/` pour accéder au menu des types de blocs
4. Utilisez le bouton + à côté d'une page pour créer une sous-page
5. Exportez vos pages en markdown à tout moment

### Types de blocs disponibles

- 📝 **Texte** : Paragraphe normal
- **H1/H2/H3** : Titres de différentes tailles
- ☑ **To-do** : Cases à cocher interactives
- • **Liste à puces** : Listes non ordonnées
- 1. **Liste numérotée** : Listes ordonnées
- 💻 **Code** : Blocs de code avec formatage
- ❝ **Citation** : Citations en retrait
- — **Séparateur** : Ligne de séparation

## 🌐 Déploiement sur GitHub Pages

1. Forkez ce repository
2. Allez dans Settings → Pages
3. Sous "Source", sélectionnez la branche à déployer (ex: `main` ou `copilot/create-personal-markdown-site`)
4. Cliquez sur Save
5. Votre site sera disponible à `https://[username].github.io/Written/`

## 💡 Conseils d'utilisation

- **Données locales** : Toutes les données sont stockées dans le navigateur
- **Sauvegarde** : Exportez régulièrement vos pages importantes en markdown
- **Hiérarchie** : Utilisez les sous-pages pour organiser vos projets, notes, etc.
- **Blocs** : Glissez-déposez les blocs pour réorganiser votre contenu
- **Navigation** : Cliquez sur les breadcrumbs pour remonter dans la hiérarchie

## 🛠️ Architecture Technique

- **Pure HTML/CSS/JavaScript** : Aucun framework, pas de build
- **Système de blocs** : Chaque bloc est un objet avec type, contenu et propriétés
- **Drag & Drop HTML5** : API native pour la réorganisation
- **ContentEditable** : Édition inline des blocs
- **LocalStorage** : Persistance des données côté client
- **Structure hiérarchique** : Pages avec relations parent/enfant

## 📋 Structure des Données

```javascript
{
  id: "unique-id",
  title: "Page Title",
  icon: "📄",
  parentId: null, // ou ID du parent
  expanded: true,
  blocks: [
    {
      id: "block-id",
      type: "text|heading1|heading2|heading3|todo|bulleted_list|numbered_list|code|quote|divider",
      content: "Content here",
      properties: { checked: false } // pour les todos
    }
  ],
  properties: {
    tags: [],
    status: "",
    created: "ISO date",
    updated: "ISO date"
  }
}
```

## 🎯 Roadmap

### Phases suivantes prévues:
- **Phase 3** : Propriétés et métadonnées (tags, statut, filtres)
- **Phase 4** : Templates réutilisables
- **Phase 5** : Liens inter-pages [[Page Name]]
- **Phase 6** : Vues multiples (liste, grille, kanban)
- **Phase 7** : Dashboard et recherche rapide
- **Phase 8** : Mode sombre, animations

## 🤝 Contribution

Ce projet est conçu pour un usage personnel mais les contributions sont bienvenues!

## 📝 License

Open source pour usage personnel.

---

**Made with ❤️ - Inspired by Notion.so**