# Structure des fichiers CSS du calendrier

Ce dossier contient les styles CSS modulaires pour FullCalendar, organisés par fonctionnalité pour une meilleure maintenance et flexibilité.

## 📁 Fichiers disponibles

### 🎯 `calendar-base.css`
**Styles communs à tous les calendriers**
- Reset et styles de base
- Boutons de navigation
- Toolbar
- Popovers et listes d'événements
- Styles responsive
- Animations de base
- Support du mode sombre

### ⏰ `calendar-timegrid.css`
**Styles spécifiques à la vue horaire (timeGrid)**
- Headers des heures
- Colonnes de temps avec bordures
- Slots de temps et leurs labels
- Indicateur "maintenant"
- Sélection de créneaux
- Zones de drop

### 📅 `calendar-daygrid.css`
**Styles spécifiques à la vue mois/semaine (dayGrid)**
- Headers des colonnes (jours)
- Styles pour les jours cliquables
- Numéros de semaine
- Événements en mode mois
- Indicateurs visuels pour les jours avec événements

### 🎪 `calendar-events.css`
**Styles spécifiques aux événements**
- Design moderne des événements
- Styles selon la durée (court, moyen, long)
- Styles selon le statut (confirmé, en attente, annulé, etc.)
- Effets de survol et animations
- Couleurs personnalisées

### 👥 `calendar-resource.css`
**Styles spécifiques à la vue avec ressources (resourceTimeline)**
- En-têtes des ressources (médecins)
- Colonnes de ressources avec bordures
- Slots de ressources
- Handles de redimensionnement
- Indicateurs de spécialité

### 📋 `calendar-index.css`
**Fichier d'index qui importe tous les styles**
- Import automatique de tous les fichiers
- Documentation de la structure
- Recommandations d'utilisation

## 🚀 Utilisation

### Option 1 : Utiliser tous les styles
```css
@import './calendar-index.css';
```

### Option 2 : Utiliser seulement certains styles
```css
/* Pour une vue simple mois/semaine */
@import './calendar-base.css';
@import './calendar-daygrid.css';
@import './calendar-events.css';

/* Pour une vue horaire */
@import './calendar-base.css';
@import './calendar-timegrid.css';
@import './calendar-events.css';

/* Pour une vue avec ressources */
@import './calendar-base.css';
@import './calendar-timegrid.css';
@import './calendar-events.css';
@import './calendar-resource.css';
```

## 🎨 Fonctionnalités incluses

### Mode sombre
Tous les fichiers incluent le support du mode sombre avec la classe `.dark`

### Responsive
Styles adaptés pour mobile et tablette

### Animations
- Animations d'entrée pour les événements
- Effets de survol
- Transitions fluides

### Accessibilité
- Focus visible
- Contrastes appropriés
- Navigation au clavier

## 🔧 Personnalisation

### Couleurs des événements
Les événements peuvent avoir des couleurs personnalisées via :
- Classes CSS (`.confirme`, `.en_attente`, etc.)
- Styles inline (`background-color`)
- Attributs de données

### Bordures et espacements
Toutes les bordures et espacements sont configurables via les variables CSS

### Animations
Les animations peuvent être désactivées en supprimant les propriétés `transition` et `animation`

## 📝 Notes techniques

- Utilisation de Tailwind CSS avec `@apply`
- Support des navigateurs modernes
- Optimisé pour les performances
- Compatible avec FullCalendar v6+

## 🐛 Dépannage

### Styles non appliqués
1. Vérifiez que les fichiers sont bien importés
2. Assurez-vous que Tailwind CSS est configuré
3. Vérifiez la spécificité des sélecteurs CSS

### Problèmes de performance
1. Importez seulement les fichiers nécessaires
2. Utilisez les outils de minification
3. Évitez les sélecteurs trop spécifiques

### Mode sombre non fonctionnel
1. Vérifiez que la classe `.dark` est appliquée au bon élément
2. Assurez-vous que les styles dark sont bien chargés
3. Vérifiez la cascade CSS
