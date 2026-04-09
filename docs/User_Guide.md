# Guide Utilisateur - Système de Gestion des Files d'Attente

## Table des Matières

1. [Introduction](#introduction)
2. [Connexion et Authentification](#connexion-et-authentification)
3. [Dashboard Médecin](#dashboard-médecin)
4. [Dashboard Secrétaire](#dashboard-secrétaire)
5. [Workflows Principaux](#workflows-principaux)
6. [Notifications et Alertes](#notifications-et-alertes)
7. [Gestion des Erreurs](#gestion-des-erreurs)
8. [Raccourcis Clavier](#raccourcis-clavier)
9. [FAQ](#faq)

## Introduction

Le système de gestion des files d'attente médicales permet une coordination fluide entre les médecins et les secrétaires pour optimiser le flux des patients et améliorer l'expérience de soins.

### Fonctionnalités Principales

- **Dashboard Médecin** : Interface unifiée pour gérer les patients et les consultations
- **Dashboard Secrétaire** : Vue globale et spécifique des files d'attente
- **Notifications Temps Réel** : Alertes instantanées pour les actions importantes
- **Animations Visuelles** : Feedback visuel pour une meilleure expérience utilisateur

## Connexion et Authentification

### Accès au Système

1. Ouvrez votre navigateur et accédez à l'application
2. Entrez vos identifiants de connexion
3. Sélectionnez votre rôle (Médecin ou Secrétaire)
4. Cliquez sur "Se connecter"

### Rôles Utilisateurs

- **Médecin** : Accès au dashboard médecin avec gestion des patients
- **Secrétaire** : Accès au dashboard secrétaire avec vue globale
- **Administrateur** : Accès complet à tous les modules

## Dashboard Médecin

### Interface Principale

Le dashboard médecin est divisé en plusieurs sections :

#### 1. En-tête
- **Nom et spécialité** du médecin connecté
- **Heure actuelle** mise à jour automatiquement
- **Statut actif/inactif** pour indiquer la disponibilité
- **Bouton d'actualisation** pour rafraîchir les données

#### 2. Statistiques Rapides
- **En attente** : Nombre de patients en file d'attente
- **En consultation** : Patients actuellement en consultation
- **Urgences** : Patients prioritaires
- **Notifications** : Nombre de notifications non lues

#### 3. Patient Actuel
- **Carte mise en évidence** du prochain patient à traiter
- **Informations détaillées** : nom, dossier, motif, temps d'attente
- **Boutons d'action** contextuels selon le statut

#### 4. Panneau Latéral
- **Patients en consultation** : liste des consultations en cours
- **Rendez-vous du jour** : planning des consultations prévues

### Workflow des Actions

#### Séquence d'Actions Patient

1. **"Faire rentrer"** → Appelle le patient
   - Le patient est marqué comme "appelé"
   - La secrétaire reçoit une notification
   - La carte du patient s'anime dans la vue secrétaire

2. **"Reçu"** → Confirme l'entrée du patient
   - Le patient est marqué comme "entré"
   - La consultation peut commencer
   - L'animation s'arrête côté secrétaire

3. **"Terminer"** → Finalise la consultation
   - Le patient est marqué comme "terminé"
   - La consultation est archivée

4. **"Suivant"** → Appelle le patient suivant
   - Le prochain patient est mis en évidence
   - Le cycle recommence

### Gestion des Priorités

- **Normale** : Consultation standard
- **Urgente** : Priorité élevée (animation de pulsation)
- **Très urgente** : Priorité maximale (animation renforcée)

## Dashboard Secrétaire

### Vue Globale

#### Interface
- **Liste des médecins** avec statistiques rapides
- **Filtres dynamiques** par nom de médecin et statut
- **Recherche en temps réel** pour trouver rapidement

#### Actions Disponibles
- **Sélectionner un médecin** pour vue détaillée
- **Ajouter un patient** à n'importe quelle file d'attente
- **Actualiser** les données en temps réel

### Vue Spécifique (par Médecin)

#### Section Rendez-vous
- **Liste des rendez-vous** du jour pour le médecin
- **Bouton "Présent"** pour ajouter un patient à la file d'attente
- **Informations détaillées** : heure, motif, durée

#### Section File d'Attente
- **Liste des patients** en attente
- **Statuts visuels** avec codes couleur
- **Temps d'attente** calculé automatiquement
- **Animations** pour les patients appelés

### Ajout de Patients

#### Processus en 2 Étapes

**Étape 1 : Sélection du Patient**
1. Cliquer sur "Ajouter Patient"
2. Rechercher un patient existant ou créer un nouveau
3. Sélectionner le patient

**Étape 2 : Configuration**
1. Choisir le médecin assigné
2. Définir la priorité (normale, urgente, très urgente)
3. Ajouter des notes optionnelles
4. Confirmer l'ajout

## Workflows Principaux

### Workflow Standard

1. **Secrétaire** ajoute un patient à la file d'attente
2. **Médecin** voit le patient apparaître dans son dashboard
3. **Médecin** clique "Faire rentrer" → notification à la secrétaire
4. **Secrétaire** voit l'animation du patient appelé
5. **Médecin** clique "Reçu" → patient entre en consultation
6. **Médecin** clique "Terminer" → consultation terminée
7. **Médecin** clique "Suivant" → prochain patient

### Workflow Urgence

1. **Secrétaire** ajoute un patient avec priorité "urgente"
2. **Médecin** voit immédiatement l'urgence (pulsation rouge)
3. **Médecin** peut traiter en priorité selon la gravité
4. **Notifications** renforcées pour les urgences

### Workflow Rendez-vous

1. **Secrétaire** voit les rendez-vous du jour
2. **Patient arrive** → clic sur "Présent"
3. **Patient ajouté** automatiquement à la file d'attente
4. **Médecin** voit le patient dans sa file
5. **Workflow standard** continue

## Notifications et Alertes

### Types de Notifications

#### Toast Notifications
- **Succès** : Actions réussies (vert)
- **Erreur** : Problèmes détectés (rouge)
- **Patient appelé** : Patient appelé par le médecin (bleu)
- **Patient entré** : Patient en consultation (vert)
- **Consultation terminée** : Fin de consultation (violet)

#### Notifications Temps Réel
- **Appel patient** : Animation de la carte patient
- **Entrée consultation** : Arrêt de l'animation
- **Nouveau patient** : Apparition dans la file
- **Urgence** : Pulsation d'alerte

### Gestion des Notifications

- **Auto-disparition** après 5 secondes
- **Fermeture manuelle** avec le bouton X
- **Historique** accessible dans le dashboard
- **Marquage comme lu** automatique

## Gestion des Erreurs

### Types d'Erreurs

#### Erreurs Réseau
- **Problème de connexion** : Vérifiez votre connexion internet
- **Serveur indisponible** : Contactez l'administrateur
- **Timeout** : Réessayez l'action

#### Erreurs d'Authentification
- **Session expirée** : Reconnexion automatique
- **Accès refusé** : Vérifiez vos permissions
- **Identifiants incorrects** : Vérifiez vos données

#### Erreurs de Données
- **Patient introuvable** : Vérifiez les informations
- **Médecin indisponible** : Sélectionnez un autre médecin
- **Données invalides** : Corrigez les champs

### Actions Correctives

1. **Actualiser** la page (F5)
2. **Vérifier** la connexion internet
3. **Se reconnecter** si nécessaire
4. **Contacter** le support technique

## Raccourcis Clavier

### Navigation
- **F5** : Actualiser la page
- **Ctrl + R** : Actualiser les données
- **Echap** : Fermer les modals

### Actions Rapides
- **Entrée** : Confirmer une action
- **Espace** : Activer/désactiver le statut
- **Tab** : Navigation entre les champs

### Recherche
- **Ctrl + F** : Recherche dans la page
- **Ctrl + K** : Recherche rapide de patients

## FAQ

### Questions Générales

**Q : Comment changer de vue dans le dashboard secrétaire ?**
R : Utilisez les boutons "Vue Globale" et "Vue Spécifique" en haut de l'interface.

**Q : Que faire si un patient n'apparaît pas dans la file d'attente ?**
R : Vérifiez que le patient a bien été ajouté et que le bon médecin est sélectionné.

**Q : Comment annuler une action ?**
R : La plupart des actions peuvent être annulées en cliquant sur le bouton correspondant ou en actualisant la page.

### Questions Techniques

**Q : Les notifications ne s'affichent pas, que faire ?**
R : Vérifiez que les notifications sont activées dans votre navigateur et que vous êtes connecté.

**Q : L'application est lente, comment l'améliorer ?**
R : Fermez les autres onglets, actualisez la page, ou contactez l'administrateur.

**Q : Comment exporter les données ?**
R : Cette fonctionnalité sera disponible dans une prochaine version.

### Questions sur les Workflows

**Q : Que faire si un patient ne répond pas à l'appel ?**
R : Vous pouvez le marquer comme "absent" ou le reprogrammer pour plus tard.

**Q : Comment gérer les urgences ?**
R : Ajoutez le patient avec priorité "urgente" ou "très urgente" pour le traiter en priorité.

**Q : Peut-on modifier l'ordre de la file d'attente ?**
R : L'ordre est automatique, mais les urgences passent en priorité.

### Support Technique

Pour toute question ou problème technique :

1. **Consultez** ce guide utilisateur
2. **Vérifiez** la section FAQ
3. **Contactez** votre administrateur système
4. **Signalez** les bugs via le formulaire de support

---

**Version du Guide** : 1.0  
**Dernière mise à jour** : Décembre 2024  
**Compatibilité** : Tous les navigateurs modernes



