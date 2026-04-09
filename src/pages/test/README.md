# Pages de Test

Ce dossier contient les pages de test pour visualiser et tester les composants de l'application.

## TestDoctorSpecificQueue

### Description
Page de test pour le composant `DoctorSpecificQueue` qui gère la file d'attente spécifique à un médecin.

### URL d'accès
```
http://localhost:5173/test-doctor-specific-queue
```

### Fonctionnalités de test

1. **Sélection du médecin** : Dropdown pour choisir le médecin à tester
2. **Terme de recherche** : Champ de recherche pour filtrer les patients
3. **Filtre de statut** : Dropdown pour filtrer par statut (en attente, présent, etc.)
4. **Actualisation** : Bouton pour recharger les données
5. **Informations de débogage** : Affichage des props passées au composant

### Props testées

- `doctor` : Objet médecin avec id, nom, prenom, specialite
- `searchTerm` : Terme de recherche pour filtrer les patients
- `filterStatus` : Statut pour filtrer la file d'attente

### Utilisation

1. Accédez à l'URL de test
2. Sélectionnez un médecin dans le dropdown
3. Utilisez les contrôles pour tester différentes combinaisons
4. Observez le comportement du composant `DoctorSpecificQueue`
5. Vérifiez les logs dans la console pour le débogage

### Composant testé

Le composant `DoctorSpecificQueue` affiche :
- Statistiques du médecin (total patients, en attente, en consultation, rendez-vous)
- File d'attente des patients
- Rendez-vous du jour
- Fonctionnalités d'ajout de patients depuis les rendez-vous
- Mises à jour temps réel

### Logs de débogage

La page affiche des logs détaillés dans la console :
- Chargement des médecins
- Sélection du médecin
- Props passées au composant
- Erreurs éventuelles
