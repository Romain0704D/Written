# Guide Utilisateur - Written

## 🚀 Démarrage Rapide

### Première utilisation

1. **Créer votre première page**
   - Cliquez sur le bouton bleu `+ New Page` dans la sidebar
   - Une nouvelle page "Untitled" apparaît

2. **Renommer la page**
   - Cliquez dans le champ titre en haut
   - Tapez le nom de votre page (ex: "Mes Projets")

3. **Ajouter du contenu**
   - Le curseur est automatiquement dans le premier bloc
   - Commencez à taper votre texte

## 📝 Travailler avec les Blocs

### Créer des blocs

- **Nouveau bloc** : Appuyez sur `Enter` à la fin d'un bloc
- **Menu des types** : Tapez `/` dans un bloc vide
- **Bouton +** : Cliquez sur le `+` qui apparaît au survol

### Types de blocs disponibles

| Icône | Type | Raccourci | Description |
|-------|------|-----------|-------------|
| 📝 | Texte | - | Paragraphe normal |
| H1 | Heading 1 | `/` → H1 | Grand titre |
| H2 | Heading 2 | `/` → H2 | Titre moyen |
| H3 | Heading 3 | `/` → H3 | Petit titre |
| ☑ | To-do | `/` → Todo | Case à cocher |
| • | Liste à puces | `/` → Bulleted | Liste non ordonnée |
| 1. | Liste numérotée | `/` → Numbered | Liste ordonnée |
| 💻 | Code | `/` → Code | Bloc de code |
| ❝ | Citation | `/` → Quote | Citation |
| — | Séparateur | `/` → Divider | Ligne de séparation |

### Réorganiser les blocs

1. **Glisser-déposer** :
   - Survolez un bloc pour voir la poignée `⋮⋮`
   - Cliquez et maintenez sur `⋮⋮`
   - Déplacez le bloc à la position souhaitée
   - Relâchez pour déposer

2. **Supprimer un bloc** :
   - Videz le contenu du bloc
   - Appuyez sur `Backspace`

### Changer le type d'un bloc

1. Survolez le bloc
2. Cliquez sur l'icône `⚙` (engrenage)
3. Sélectionnez le nouveau type dans le menu

## 📂 Organiser avec la Hiérarchie

### Créer une sous-page

1. **Méthode 1** : Bouton +
   - Survolez une page dans la sidebar
   - Cliquez sur le `+` qui apparaît
   - Une sous-page est créée

2. **Méthode 2** : Après création
   - Créez une nouvelle page normale
   - Faites un clic droit (futur feature)

### Naviguer dans l'arborescence

- **Replier/Déplier** : Cliquez sur `▶` ou `▼` devant les pages parentes
- **Breadcrumbs** : Cliquez sur les pages dans le fil d'Ariane en haut
- **Clic direct** : Cliquez sur n'importe quelle page dans la sidebar

### Organiser votre espace

Exemple de structure recommandée :

```
📁 Travail
  ├─ 🎨 Projet A
  ├─ 📱 Projet B
  └─ 📋 Réunions
       ├─ 2026-02-10 Équipe
       └─ 2026-02-11 Client

🏠 Personnel
  ├─ 🛒 Shopping
  ├─ 🍳 Recettes
  └─ 📚 À lire

💡 Idées
  └─ 🚀 Projets futurs
```

## ⌨️ Raccourcis Clavier

| Raccourci | Action |
|-----------|--------|
| `Enter` | Créer un nouveau bloc |
| `Backspace` | Supprimer un bloc vide |
| `Cmd/Ctrl + N` | Nouvelle page |
| `/` | Menu des types de blocs |
| `Shift + Enter` | Nouvelle ligne dans un bloc |

## 💾 Sauvegarde et Export

### Auto-save

- **Automatique** : Toutes les modifications sont sauvegardées instantanément
- **Local** : Les données restent dans votre navigateur (localStorage)
- **Offline** : Fonctionne sans connexion internet

### Exporter une page

1. Ouvrez la page à exporter
2. Cliquez sur `📥 Export MD` en haut à droite
3. Le fichier `.md` est téléchargé automatiquement

### Format d'export

Le fichier markdown contient :
- Le titre de la page comme `# Titre`
- Tous les blocs convertis en markdown standard
- Les todos comme `- [ ]` ou `- [x]`
- Le code dans des blocs ` ``` `

## 🎨 Personnalisation

### Icônes de pages

Les icônes sont automatiquement attribuées :
- 📄 : Page par défaut
- 📁 : Peut être personnalisé dans le code

Pour changer une icône (code) :
```javascript
page.icon = '🎨'  // ou n'importe quel émoji
```

## ⚠️ Limitations et Conseils

### Données locales

- ✅ **Avantage** : Vie privée totale, pas de serveur
- ⚠️ **Attention** : Les données peuvent être perdues si :
  - Vous videz le cache du navigateur
  - Vous changez de navigateur
  - Vous changez d'ordinateur

### Sauvegarde recommandée

1. **Exportez régulièrement** vos pages importantes en markdown
2. **Gardez une copie** des fichiers .md exportés
3. **Utilisez le même navigateur** pour un usage régulier

### Limites techniques

- Pas de synchronisation entre appareils
- Pas de collaboration en temps réel
- Pas de recherche avancée (pour l'instant)
- Pas de bases de données complexes

## 🐛 Résolution de Problèmes

### La page ne se charge pas

1. Videz le cache : `Cmd/Ctrl + Shift + R`
2. Vérifiez la console : `F12` → onglet Console
3. Essayez en navigation privée

### Mes pages ont disparu

1. Vérifiez que vous êtes sur le bon navigateur
2. Vérifiez que vous n'avez pas vidé le cache
3. Malheureusement, sans backup, les données sont perdues

### Le drag & drop ne fonctionne pas

1. Maintenez bien le clic sur `⋮⋮`
2. Déplacez lentement la souris
3. Relâchez quand la position est correcte

## 💡 Astuces et Bonnes Pratiques

### Organisation efficace

1. **Hiérarchie à 2-3 niveaux max** : Plus facile à naviguer
2. **Icônes significatives** : Facilitent la reconnaissance
3. **Noms courts et clairs** : "Projet A" plutôt que "Le projet de refonte du site web"

### Utilisation des blocs

1. **Un bloc = Une idée** : Ne mettez pas tout dans un seul bloc
2. **Headings pour structure** : H1 pour sections, H2 pour sous-sections
3. **Todos pour actions** : Cochez quand c'est fait
4. **Code pour exemples** : Gardez vos snippets dans des blocs code

### Workflow recommandé

```
1. Créer une page "Inbox" pour capture rapide
2. Organiser par projet/domaine en sous-pages
3. Utiliser des todos pour les actions
4. Exporter les pages terminées en markdown
5. Archiver dans une page "Archive"
```

## 🎯 Exemples d'Utilisation

### Journal quotidien

```
📅 Journal
  ├─ 2026-02
  │   ├─ 2026-02-10
  │   ├─ 2026-02-11
  │   └─ 2026-02-12
  └─ 2026-03
```

### Gestion de projet

```
📁 Projet Website
  ├─ 📋 Cahier des charges
  ├─ 🎨 Design
  ├─ 💻 Développement
  │   ├─ Frontend
  │   └─ Backend
  └─ 🚀 Déploiement
```

### Base de connaissances

```
📚 Connaissances
  ├─ 💻 Code
  │   ├─ JavaScript
  │   ├─ Python
  │   └─ CSS
  ├─ 🛠️ Outils
  └─ 📖 Tutoriels
```

---

**Besoin d'aide ?** Consultez le README.md ou créez une issue sur GitHub!