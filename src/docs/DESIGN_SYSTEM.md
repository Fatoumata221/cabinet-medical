# Design System - Cabinet Médical

## 🎨 Vue d'ensemble

Ce design system capture tous les éléments de design utilisés dans le dashboard et le calendrier pour maintenir la cohérence visuelle dans toutes les pages de l'application.

## 📁 Structure des fichiers

```
src/
├── styles/
│   └── designSystem.css    # Classes CSS du design system
├── docs/
│   └── DESIGN_SYSTEM.md    # Cette documentation
└── components/
    └── EnhancedCalendar.jsx # Exemple d'utilisation
```

## 🎯 Principes de design

### 1. **Glassmorphism**
- Effet de verre avec backdrop-blur
- Transparence et flou pour un look moderne
- Bordures subtiles

### 2. **Cohérence des couleurs**
- Palette médicale (bleus, verts, oranges, rouges)
- Support du mode sombre
- Gradients cohérents

### 3. **Animations fluides**
- Transitions de 300ms pour les interactions
- Animations d'entrée et de sortie
- Effets de hover et de focus

## 🎨 Composants

### Cards (Cartes)

```css
/* Carte standard */
.card
.card-dark

/* Carte de statistiques */
.card-stats
.card-stats-dark
```

**Utilisation :**
```jsx
<div className="card">
  <h3>Contenu de la carte</h3>
</div>

<div className="card-stats">
  <div className="stat-value">24</div>
  <div className="stat-label">Total RDV</div>
</div>
```

### Buttons (Boutons)

```css
/* Boutons principaux */
.btn-primary    /* Bleu gradient */
.btn-secondary  /* Gris */
.btn-success    /* Vert */
.btn-warning    /* Orange */
.btn-danger     /* Rouge */

/* Bouton icône */
.btn-icon
```

**Utilisation :**
```jsx
<button className="btn btn-primary">
  Créer un RDV
</button>

<button className="btn-icon">
  <Plus size={20} />
</button>
```

### Inputs (Champs de saisie)

```css
.input          /* Mode clair */
.input-dark     /* Mode sombre */
```

**Utilisation :**
```jsx
<input 
  type="text" 
  className="input" 
  placeholder="Rechercher..."
/>
```

### Typography (Typographie)

```css
/* Titres */
.text-heading
.text-heading-dark

/* Sous-titres */
.text-subheading
.text-subheading-dark

/* Texte de corps */
.text-body
.text-body-dark
```

**Utilisation :**
```jsx
<h1 className="text-heading">Titre principal</h1>
<h2 className="text-subheading">Sous-titre</h2>
<p className="text-body">Texte de description</p>
```

## 📱 Layout (Mise en page)

### Grilles

```css
/* Grille de statistiques (4 colonnes) */
.grid-stats

/* Grille de contenu (3 colonnes) */
.grid-content

/* Container fluide */
.container-fluid
```

**Utilisation :**
```jsx
<div className="container-fluid">
  <div className="grid-stats">
    {/* 4 cartes de stats */}
  </div>
  
  <div className="grid-content">
    {/* 3 sections de contenu */}
  </div>
</div>
```

## 🎬 Animations

### Animations d'entrée

```css
.animate-slideUp      /* Glissement vers le haut */
.animate-slideInRight /* Glissement depuis la droite */
.animate-blob         /* Animation de blob */
```

### Délais d'animation

```css
.animation-delay-2000  /* Délai de 2s */
.animation-delay-4000  /* Délai de 4s */
```

**Utilisation :**
```jsx
<div className="animate-slideUp">
  Contenu animé
</div>
```

## 🏥 Composants spécifiques au calendrier

### Conteneurs

```css
.calendar-container
.calendar-container-dark
.calendar-header
.calendar-header-dark
```

### Créneaux horaires

```css
.time-slot
.time-slot-dark
.time-label
.time-label-dark
.doctor-header
.doctor-header-dark
```

**Utilisation :**
```jsx
<div className="calendar-container">
  <div className="calendar-header">
    <h2>Calendrier</h2>
  </div>
  
  <div className="time-slot">
    <div className="time-label">09:00</div>
  </div>
</div>
```

## 🏷️ Badges (Étiquettes)

```css
.badge
.badge-primary   /* Bleu */
.badge-success   /* Vert */
.badge-warning   /* Orange */
.badge-danger    /* Rouge */
```

**Utilisation :**
```jsx
<span className="badge badge-success">
  Confirmé
</span>
```

## 🔄 États de chargement

```css
.loading-spinner
.loading-container
.loading-text
```

**Utilisation :**
```jsx
<div className="loading-container">
  <div className="loading-spinner"></div>
  <p className="loading-text">Chargement...</p>
</div>
```

## 🌙 Mode sombre

### Transitions

```css
.dark-mode-transition
```

### Classes conditionnelles

Utilisez les classes avec suffixe `-dark` pour le mode sombre :

```jsx
<div className={`${darkMode ? 'card-dark' : 'card'}`}>
  Contenu
</div>
```

## 📐 Responsive Design

Le design system inclut des breakpoints automatiques :

- **Mobile** : < 640px
- **Tablet** : 640px - 768px  
- **Desktop** : > 768px

Les grilles s'adaptent automatiquement :
- `grid-stats` : 4 colonnes → 2 colonnes → 1 colonne
- `grid-content` : 3 colonnes → 1 colonne

## 🎨 Couleurs

### Variables CSS

```css
:root {
  --medical-primary: #3b82f6;
  --medical-secondary: #6366f1;
  --medical-success: #10b981;
  --medical-warning: #f59e0b;
  --medical-danger: #ef4444;
  --medical-purple: #8b5cf6;
}
```

### Gradients

```css
.gradient-primary
.gradient-success
.gradient-warning
.gradient-danger
```

## 📋 Checklist d'implémentation

Pour utiliser ce design system dans une nouvelle page :

- [ ] Importer `designSystem.css`
- [ ] Utiliser les classes de layout (`container-fluid`, `grid-*`)
- [ ] Appliquer les classes de cartes (`card`, `card-stats`)
- [ ] Utiliser la typographie cohérente (`text-heading`, `text-body`)
- [ ] Implémenter les animations d'entrée
- [ ] Tester le mode sombre
- [ ] Vérifier la responsivité

## 🔧 Exemple complet

```jsx
import React from 'react';
import '../styles/designSystem.css';

const ExamplePage = () => {
  return (
    <div className="container-fluid">
      {/* En-tête */}
      <h1 className="text-heading animate-slideUp">
        Page d'exemple
      </h1>
      
      {/* Grille de statistiques */}
      <div className="grid-stats">
        <div className="card-stats animate-slideUp" style={{ transitionDelay: '100ms' }}>
          <div className="stat-value">24</div>
          <div className="stat-label">Total RDV</div>
        </div>
        {/* ... autres stats */}
      </div>
      
      {/* Grille de contenu */}
      <div className="grid-content">
        <div className="card">
          <h2 className="text-subheading">Section 1</h2>
          <p className="text-body">Contenu...</p>
        </div>
        {/* ... autres sections */}
      </div>
      
      {/* Actions */}
      <div className="flex gap-4">
        <button className="btn btn-primary">
          Action principale
        </button>
        <button className="btn btn-secondary">
          Action secondaire
        </button>
      </div>
    </div>
  );
};

export default ExamplePage;
```

## 🚀 Bonnes pratiques

1. **Cohérence** : Utilisez toujours les classes du design system
2. **Accessibilité** : Ajoutez des attributs ARIA quand nécessaire
3. **Performance** : Évitez de surcharger les animations
4. **Maintenance** : Documentez les modifications du design system
5. **Tests** : Testez sur différents appareils et tailles d'écran

---

*Ce design system évolue avec l'application. Consultez cette documentation régulièrement pour les mises à jour.*
