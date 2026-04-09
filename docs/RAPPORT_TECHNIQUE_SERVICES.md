# Rapport Technique des Services

## Vue d'ensemble

Ce document présente une documentation complète de tous les services disponibles dans l'application Cabinet Médical. Les services sont organisés en deux catégories principales :

1. **Services standards** (`src/lib/services.js`) - Services de base pour la gestion des données
2. **Services sécurisés** (`src/lib/secureServices.js`) - Services avec authentification obligatoire

---

## Services Standards (services.js)

### 1. userService - Gestion des Utilisateurs

**Description** : Service pour la gestion des utilisateurs du système (médecins, secrétaires, administrateurs).

#### Méthodes

##### `getAll()`
- **Description** : Récupère tous les utilisateurs du système
- **Paramètres** : Aucun
- **Retour** : `Array<User>` - Liste de tous les utilisateurs triés par date de création décroissante
- **Exemple** :
```javascript
const users = await userService.getAll();
```

##### `getById(id)`
- **Description** : Récupère un utilisateur par son ID
- **Paramètres** :
  - `id` (number) - ID de l'utilisateur
- **Retour** : `User` - Objet utilisateur
- **Exemple** :
```javascript
const user = await userService.getById(1);
```

##### `create(userData)`
- **Description** : Crée un nouvel utilisateur
- **Paramètres** :
  - `userData` (Object) - Données de l'utilisateur à créer
- **Retour** : `User` - Utilisateur créé
- **Exemple** :
```javascript
const newUser = await userService.create({
  nom: 'Dupont',
  prenom: 'Jean',
  email: 'jean.dupont@example.com',
  role: 'doctor'
});
```

##### `update(id, updates)`
- **Description** : Met à jour un utilisateur existant
- **Paramètres** :
  - `id` (number) - ID de l'utilisateur
  - `updates` (Object) - Champs à mettre à jour
- **Retour** : `User` - Utilisateur mis à jour
- **Exemple** :
```javascript
const updatedUser = await userService.update(1, { telephone: '0123456789' });
```

##### `delete(id)`
- **Description** : Supprime un utilisateur
- **Paramètres** :
  - `id` (number) - ID de l'utilisateur à supprimer
- **Retour** : `void`
- **Exemple** :
```javascript
await userService.delete(1);
```

##### `getDoctors()`
- **Description** : Récupère tous les médecins actifs, avec filtrage par spécialité si configuré
- **Paramètres** : Aucun
- **Retour** : `Array<User>` - Liste des médecins actifs
- **Notes** : Applique automatiquement le filtre de spécialité si le mode spécialité est activé
- **Exemple** :
```javascript
const doctors = await userService.getDoctors();
```

##### `getSecretaries()`
- **Description** : Récupère tous les secrétaires
- **Paramètres** : Aucun
- **Retour** : `Array<User>` - Liste des secrétaires
- **Exemple** :
```javascript
const secretaries = await userService.getSecretaries();
```

---

### 2. patientService - Gestion des Patients

**Description** : Service pour la gestion des dossiers patients.

#### Méthodes

##### `getAll()`
- **Description** : Récupère tous les patients
- **Paramètres** : Aucun
- **Retour** : `Array<Patient>` - Liste de tous les patients triés par nom
- **Exemple** :
```javascript
const patients = await patientService.getAll();
```

##### `getById(id)`
- **Description** : Récupère un patient par son ID
- **Paramètres** :
  - `id` (number) - ID du patient
- **Retour** : `Patient` - Objet patient
- **Exemple** :
```javascript
const patient = await patientService.getById(1);
```

##### `create(patientData)`
- **Description** : Crée un nouveau patient
- **Paramètres** :
  - `patientData` (Object) - Données du patient
- **Retour** : `Patient` - Patient créé
- **Exemple** :
```javascript
const newPatient = await patientService.create({
  nom: 'Martin',
  prenom: 'Marie',
  date_naissance: '1990-01-15',
  telephone: '0123456789'
});
```

##### `update(id, updates)`
- **Description** : Met à jour un patient
- **Paramètres** :
  - `id` (number) - ID du patient
  - `updates` (Object) - Champs à mettre à jour
- **Retour** : `Patient` - Patient mis à jour
- **Exemple** :
```javascript
const updatedPatient = await patientService.update(1, { adresse: '123 Rue Example' });
```

##### `delete(id)`
- **Description** : Supprime un patient
- **Paramètres** :
  - `id` (number) - ID du patient
- **Retour** : `void`
- **Exemple** :
```javascript
await patientService.delete(1);
```

##### `search(query)`
- **Description** : Recherche des patients par nom ou prénom
- **Paramètres** :
  - `query` (string) - Terme de recherche
- **Retour** : `Array<Patient>` - Liste des patients correspondants
- **Exemple** :
```javascript
const results = await patientService.search('Martin');
```

---

### 3. appointmentService - Gestion des Rendez-vous

**Description** : Service pour la gestion des rendez-vous médicaux.

#### Méthodes

##### `getAll()`
- **Description** : Récupère tous les rendez-vous avec détails des patients et médecins
- **Paramètres** : Aucun
- **Retour** : `Array<Appointment>` - Liste des rendez-vous
- **Notes** : Applique le filtre de spécialité si configuré
- **Exemple** :
```javascript
const appointments = await appointmentService.getAll();
```

##### `getByDoctor(medecinId, date)`
- **Description** : Récupère les rendez-vous d'un médecin
- **Paramètres** :
  - `medecinId` (number) - ID du médecin
  - `date` (string, optionnel) - Date au format YYYY-MM-DD pour filtrer
- **Retour** : `Array<Appointment>` - Liste des rendez-vous
- **Exemple** :
```javascript
const appointments = await appointmentService.getByDoctor(1, '2025-01-15');
```

##### `getByPatient(patientId)`
- **Description** : Récupère les rendez-vous d'un patient
- **Paramètres** :
  - `patientId` (number) - ID du patient
- **Retour** : `Array<Appointment>` - Liste des rendez-vous
- **Exemple** :
```javascript
const appointments = await appointmentService.getByPatient(1);
```

##### `getToday()`
- **Description** : Récupère les rendez-vous du jour
- **Paramètres** : Aucun
- **Retour** : `Array<Appointment>` - Liste des rendez-vous du jour
- **Notes** : Applique le filtre de spécialité si configuré
- **Exemple** :
```javascript
const todayAppointments = await appointmentService.getToday();
```

##### `create(appointmentData)`
- **Description** : Crée un nouveau rendez-vous
- **Paramètres** :
  - `appointmentData` (Object) - Données du rendez-vous
- **Retour** : `Appointment` - Rendez-vous créé
- **Exemple** :
```javascript
const newAppointment = await appointmentService.create({
  patient_id: 1,
  medecin_id: 2,
  date_heure: '2025-01-20T10:00:00',
  motif: 'Consultation'
});
```

##### `update(id, updates)`
- **Description** : Met à jour un rendez-vous
- **Paramètres** :
  - `id` (number) - ID du rendez-vous
  - `updates` (Object) - Champs à mettre à jour
- **Retour** : `Appointment` - Rendez-vous mis à jour
- **Exemple** :
```javascript
const updated = await appointmentService.update(1, { statut: 'annule' });
```

##### `delete(id)`
- **Description** : Supprime un rendez-vous
- **Paramètres** :
  - `id` (number) - ID du rendez-vous
- **Retour** : `void`
- **Exemple** :
```javascript
await appointmentService.delete(1);
```

---

### 4. consultationService - Gestion des Consultations

**Description** : Service pour la gestion des consultations médicales.

#### Méthodes

##### `getAll()`
- **Description** : Récupère toutes les consultations
- **Paramètres** : Aucun
- **Retour** : `Array<Consultation>` - Liste des consultations
- **Notes** : Applique le filtre de spécialité si configuré
- **Exemple** :
```javascript
const consultations = await consultationService.getAll();
```

##### `getByPatient(patientId)`
- **Description** : Récupère les consultations d'un patient
- **Paramètres** :
  - `patientId` (number) - ID du patient
- **Retour** : `Array<Consultation>` - Liste des consultations
- **Exemple** :
```javascript
const consultations = await consultationService.getByPatient(1);
```

##### `getByDoctor(medecinId)`
- **Description** : Récupère les consultations d'un médecin
- **Paramètres** :
  - `medecinId` (number) - ID du médecin
- **Retour** : `Array<Consultation>` - Liste des consultations
- **Exemple** :
```javascript
const consultations = await consultationService.getByDoctor(1);
```

##### `create(consultationData)`
- **Description** : Crée une nouvelle consultation
- **Paramètres** :
  - `consultationData` (Object) - Données de la consultation
- **Retour** : `Consultation` - Consultation créée
- **Exemple** :
```javascript
const newConsultation = await consultationService.create({
  patient_id: 1,
  medecin_id: 2,
  date_consultation: '2025-01-15',
  motif_consultation: 'Douleur'
});
```

##### `update(id, updates)`
- **Description** : Met à jour une consultation
- **Paramètres** :
  - `id` (number) - ID de la consultation
  - `updates` (Object) - Champs à mettre à jour
- **Retour** : `Consultation` - Consultation mise à jour
- **Exemple** :
```javascript
const updated = await consultationService.update(1, { diagnostic: 'Grippe' });
```

##### `finish(id)`
- **Description** : Termine une consultation (change le statut à 'terminee')
- **Paramètres** :
  - `id` (number) - ID de la consultation
- **Retour** : `Consultation` - Consultation terminée
- **Exemple** :
```javascript
const finished = await consultationService.finish(1);
```

---

### 5. medicalActionService - Gestion des Actes Médicaux

**Description** : Service pour la gestion des actes médicaux effectués lors des consultations.

#### Méthodes

##### `getByConsultation(consultationId)`
- **Description** : Récupère tous les actes médicaux d'une consultation
- **Paramètres** :
  - `consultationId` (number) - ID de la consultation
- **Retour** : `Array<MedicalAction>` - Liste des actes médicaux
- **Exemple** :
```javascript
const actions = await medicalActionService.getByConsultation(1);
```

##### `create(actionData)`
- **Description** : Crée un nouvel acte médical
- **Paramètres** :
  - `actionData` (Object) - Données de l'acte médical
- **Retour** : `MedicalAction` - Acte médical créé
- **Exemple** :
```javascript
const newAction = await medicalActionService.create({
  consultation_id: 1,
  type_action: 'examen',
  description: 'Examen clinique'
});
```

##### `update(id, updates)`
- **Description** : Met à jour un acte médical
- **Paramètres** :
  - `id` (number) - ID de l'acte médical
  - `updates` (Object) - Champs à mettre à jour
- **Retour** : `MedicalAction` - Acte médical mis à jour
- **Exemple** :
```javascript
const updated = await medicalActionService.update(1, { description: 'Examen approfondi' });
```

##### `delete(id)`
- **Description** : Supprime un acte médical
- **Paramètres** :
  - `id` (number) - ID de l'acte médical
- **Retour** : `void`
- **Exemple** :
```javascript
await medicalActionService.delete(1);
```

---

### 6. medicationService - Gestion des Médicaments

**Description** : Service pour la gestion du catalogue de médicaments.

#### Méthodes

##### `getAll()`
- **Description** : Récupère tous les médicaments
- **Paramètres** : Aucun
- **Retour** : `Array<Medication>` - Liste des médicaments triés par nom
- **Exemple** :
```javascript
const medications = await medicationService.getAll();
```

##### `search(query)`
- **Description** : Recherche des médicaments par nom
- **Paramètres** :
  - `query` (string) - Terme de recherche
- **Retour** : `Array<Medication>` - Liste des médicaments correspondants
- **Exemple** :
```javascript
const results = await medicationService.search('paracetamol');
```

##### `create(medicationData)`
- **Description** : Crée un nouveau médicament
- **Paramètres** :
  - `medicationData` (Object) - Données du médicament
- **Retour** : `Medication` - Médicament créé
- **Exemple** :
```javascript
const newMedication = await medicationService.create({
  nom: 'Paracétamol',
  forme: 'Comprimé',
  dosage: '500mg'
});
```

##### `update(id, updates)`
- **Description** : Met à jour un médicament
- **Paramètres** :
  - `id` (number) - ID du médicament
  - `updates` (Object) - Champs à mettre à jour
- **Retour** : `Medication` - Médicament mis à jour
- **Exemple** :
```javascript
const updated = await medicationService.update(1, { dosage: '1000mg' });
```

---

### 7. prescriptionService - Gestion des Prescriptions

**Description** : Service pour la gestion des prescriptions médicales.

#### Méthodes

##### `getByConsultation(consultationId)`
- **Description** : Récupère toutes les prescriptions d'une consultation
- **Paramètres** :
  - `consultationId` (number) - ID de la consultation
- **Retour** : `Array<Prescription>` - Liste des prescriptions avec détails des médicaments
- **Exemple** :
```javascript
const prescriptions = await prescriptionService.getByConsultation(1);
```

##### `getByPatient(patientId)`
- **Description** : Récupère toutes les prescriptions d'un patient
- **Paramètres** :
  - `patientId` (number) - ID du patient
- **Retour** : `Array<Prescription>` - Liste des prescriptions
- **Exemple** :
```javascript
const prescriptions = await prescriptionService.getByPatient(1);
```

##### `create(prescriptionData)`
- **Description** : Crée une nouvelle prescription
- **Paramètres** :
  - `prescriptionData` (Object) - Données de la prescription
- **Retour** : `Prescription` - Prescription créée
- **Exemple** :
```javascript
const newPrescription = await prescriptionService.create({
  consultation_id: 1,
  patient_id: 1,
  medicament_id: 5,
  posologie: '1 comprimé matin et soir',
  duree: 7
});
```

##### `updateStatus(id, statut)`
- **Description** : Met à jour le statut d'une prescription
- **Paramètres** :
  - `id` (number) - ID de la prescription
  - `statut` (string) - Nouveau statut ('en_attente', 'delivree', 'annulee')
- **Retour** : `Prescription` - Prescription mise à jour
- **Exemple** :
```javascript
const updated = await prescriptionService.updateStatus(1, 'delivree');
```

---

### 8. invoiceService - Gestion des Factures

**Description** : Service pour la gestion des factures.

#### Méthodes

##### `getAll()`
- **Description** : Récupère toutes les factures
- **Paramètres** : Aucun
- **Retour** : `Array<Invoice>` - Liste des factures
- **Exemple** :
```javascript
const invoices = await invoiceService.getAll();
```

##### `getByPatient(patientId)`
- **Description** : Récupère les factures d'un patient
- **Paramètres** :
  - `patientId` (number) - ID du patient
- **Retour** : `Array<Invoice>` - Liste des factures
- **Exemple** :
```javascript
const invoices = await invoiceService.getByPatient(1);
```

##### `create(invoiceData)`
- **Description** : Crée une nouvelle facture
- **Paramètres** :
  - `invoiceData` (Object) - Données de la facture
- **Retour** : `Invoice` - Facture créée
- **Exemple** :
```javascript
const newInvoice = await invoiceService.create({
  patient_id: 1,
  consultation_id: 1,
  montant_total: 50.00,
  statut_paiement: 'en_attente'
});
```

##### `updatePaymentStatus(id, statut)`
- **Description** : Met à jour le statut de paiement d'une facture
- **Paramètres** :
  - `id` (number) - ID de la facture
  - `statut` (string) - Nouveau statut ('en_attente', 'paye', 'annule')
- **Retour** : `Invoice` - Facture mise à jour
- **Exemple** :
```javascript
const updated = await invoiceService.updatePaymentStatus(1, 'paye');
```

---

### 9. waitingQueueService - Gestion de la File d'Attente

**Description** : Service pour la gestion de la file d'attente des patients.

#### Méthodes

##### `getAll()`
- **Description** : Récupère toutes les files d'attente
- **Paramètres** : Aucun
- **Retour** : `Array<WaitingQueueItem>` - Liste des patients en attente
- **Notes** : Utilise des requêtes séparées pour éviter les problèmes de jointure
- **Exemple** :
```javascript
const queue = await waitingQueueService.getAll();
```

##### `getByDoctor(medecinId)`
- **Description** : Récupère la file d'attente d'un médecin
- **Paramètres** :
  - `medecinId` (number) - ID du médecin
- **Retour** : `Array<WaitingQueueItem>` - Liste des patients en attente
- **Exemple** :
```javascript
const queue = await waitingQueueService.getByDoctor(1);
```

##### `addToQueue(queueData)`
- **Description** : Ajoute un patient à la file d'attente
- **Paramètres** :
  - `queueData` (Object) - Données de la file d'attente
- **Retour** : `WaitingQueueItem` - Élément ajouté
- **Exemple** :
```javascript
const newItem = await waitingQueueService.addToQueue({
  patient_id: 1,
  medecin_id: 2,
  status: 'waiting'
});
```

##### `updateStatus(id, status)`
- **Description** : Met à jour le statut d'un patient dans la file
- **Paramètres** :
  - `id` (number) - ID de l'élément
  - `status` (string) - Nouveau statut ('waiting', 'present', 'in_consultation', 'finished')
- **Retour** : `WaitingQueueItem` - Élément mis à jour
- **Exemple** :
```javascript
const updated = await waitingQueueService.updateStatus(1, 'present');
```

##### `removeFromQueue(id)`
- **Description** : Retire un patient de la file d'attente
- **Paramètres** :
  - `id` (number) - ID de l'élément
- **Retour** : `void`
- **Exemple** :
```javascript
await waitingQueueService.removeFromQueue(1);
```

##### `reorderQueue(medecinId, newOrder)`
- **Description** : Réorganise l'ordre de la file d'attente
- **Paramètres** :
  - `medecinId` (number) - ID du médecin
  - `newOrder` (Array) - Nouvel ordre des éléments
- **Retour** : `void`
- **Exemple** :
```javascript
await waitingQueueService.reorderQueue(1, [
  { id: 3, order_position: 1 },
  { id: 1, order_position: 2 }
]);
```

##### `callNextPatient(medecinId)`
- **Description** : Appelle le patient suivant dans la file
- **Paramètres** :
  - `medecinId` (number) - ID du médecin
- **Retour** : `WaitingQueueItem | null` - Patient appelé ou null si aucun
- **Exemple** :
```javascript
const nextPatient = await waitingQueueService.callNextPatient(1);
```

---

### 10. notificationService - Gestion des Notifications

**Description** : Service pour la gestion des notifications utilisateurs.

#### Méthodes

##### `getByUser(userId)`
- **Description** : Récupère les notifications d'un utilisateur
- **Paramètres** :
  - `userId` (number) - ID de l'utilisateur
- **Retour** : `Array<Notification>` - Liste des notifications
- **Exemple** :
```javascript
const notifications = await notificationService.getByUser(1);
```

##### `markAsRead(id)`
- **Description** : Marque une notification comme lue
- **Paramètres** :
  - `id` (number) - ID de la notification
- **Retour** : `Notification` - Notification mise à jour
- **Exemple** :
```javascript
const updated = await notificationService.markAsRead(1);
```

##### `markAllAsRead(userId)`
- **Description** : Marque toutes les notifications d'un utilisateur comme lues
- **Paramètres** :
  - `userId` (number) - ID de l'utilisateur
- **Retour** : `void`
- **Exemple** :
```javascript
await notificationService.markAllAsRead(1);
```

##### `delete(id)`
- **Description** : Supprime une notification
- **Paramètres** :
  - `id` (number) - ID de la notification
- **Retour** : `void`
- **Exemple** :
```javascript
await notificationService.delete(1);
```

---

### 11. billingService - Gestion de la Facturation

**Description** : Service pour la gestion complète de la facturation.

#### Méthodes

##### `getAll()`
- **Description** : Récupère toutes les factures
- **Paramètres** : Aucun
- **Retour** : `Array<Billing>` - Liste des factures
- **Exemple** :
```javascript
const bills = await billingService.getAll();
```

##### `getById(id)`
- **Description** : Récupère une facture par son ID
- **Paramètres** :
  - `id` (number) - ID de la facture
- **Retour** : `Billing` - Facture
- **Exemple** :
```javascript
const bill = await billingService.getById(1);
```

##### `create(billingData)`
- **Description** : Crée une nouvelle facture
- **Paramètres** :
  - `billingData` (Object) - Données de la facture
- **Retour** : `Billing` - Facture créée
- **Exemple** :
```javascript
const newBill = await billingService.create({
  patient_id: 1,
  medecin_id: 2,
  montant_total: 75.50,
  statut: 'en_attente'
});
```

##### `update(id, updates)`
- **Description** : Met à jour une facture
- **Paramètres** :
  - `id` (number) - ID de la facture
  - `updates` (Object) - Champs à mettre à jour
- **Retour** : `Billing` - Facture mise à jour
- **Exemple** :
```javascript
const updated = await billingService.update(1, { montant_total: 80.00 });
```

##### `delete(id)`
- **Description** : Supprime une facture
- **Paramètres** :
  - `id` (number) - ID de la facture
- **Retour** : `void`
- **Exemple** :
```javascript
await billingService.delete(1);
```

##### `getByPatient(patientId)`
- **Description** : Récupère les factures d'un patient
- **Paramètres** :
  - `patientId` (number) - ID du patient
- **Retour** : `Array<Billing>` - Liste des factures
- **Exemple** :
```javascript
const bills = await billingService.getByPatient(1);
```

##### `getByDoctor(medecinId)`
- **Description** : Récupère les factures d'un médecin
- **Paramètres** :
  - `medecinId` (number) - ID du médecin
- **Retour** : `Array<Billing>` - Liste des factures
- **Exemple** :
```javascript
const bills = await billingService.getByDoctor(1);
```

##### `markAsPaid(id)`
- **Description** : Marque une facture comme payée
- **Paramètres** :
  - `id` (number) - ID de la facture
- **Retour** : `Billing` - Facture mise à jour
- **Exemple** :
```javascript
const updated = await billingService.markAsPaid(1);
```

##### `generateInvoiceNumber()`
- **Description** : Génère un numéro de facture unique séquentiel
- **Paramètres** : Aucun
- **Retour** : `string` - Numéro de facture (format: FACT-0001)
- **Exemple** :
```javascript
const invoiceNumber = await billingService.generateInvoiceNumber();
// Retourne: "FACT-0001"
```

---

### 12. typesActesService - Gestion des Types d'Actes

**Description** : Service pour la gestion des types d'actes médicaux et leurs tarifs.

#### Méthodes

##### `getAll()`
- **Description** : Récupère tous les types d'actes actifs avec leurs tarifs
- **Paramètres** : Aucun
- **Retour** : `Array<TypeActe>` - Liste des types d'actes
- **Notes** : Applique le filtre de spécialité si configuré
- **Exemple** :
```javascript
const typesActes = await typesActesService.getAll();
```

##### `getById(id)`
- **Description** : Récupère un type d'acte par son ID avec ses tarifs
- **Paramètres** :
  - `id` (number) - ID du type d'acte
- **Retour** : `TypeActe` - Type d'acte avec tarifs
- **Exemple** :
```javascript
const typeActe = await typesActesService.getById(1);
```

---

### 13. appareilsService - Gestion des Appareils

**Description** : Service pour la gestion des appareils médicaux.

#### Méthodes

##### `getAll()`
- **Description** : Récupère tous les appareils actifs
- **Paramètres** : Aucun
- **Retour** : `Array<Appareil>` - Liste des appareils
- **Notes** : Applique le filtre de spécialité si configuré
- **Exemple** :
```javascript
const appareils = await appareilsService.getAll();
```

---

### 14. diagnosticsService - Gestion des Diagnostics

**Description** : Service pour la gestion des diagnostics médicaux.

#### Méthodes

##### `getAll()`
- **Description** : Récupère tous les diagnostics actifs
- **Paramètres** : Aucun
- **Retour** : `Array<Diagnostic>` - Liste des diagnostics
- **Notes** : Applique le filtre de spécialité si configuré
- **Exemple** :
```javascript
const diagnostics = await diagnosticsService.getAll();
```

---

### 15. medicamentsService - Gestion des Médicaments (Table medicaments)

**Description** : Service pour la gestion du catalogue de médicaments (table `medicaments`).

#### Méthodes

##### `getAll()`
- **Description** : Récupère tous les médicaments actifs
- **Paramètres** : Aucun
- **Retour** : `Array<Medicament>` - Liste des médicaments
- **Notes** : Applique le filtre de spécialité si configuré
- **Exemple** :
```javascript
const medicaments = await medicamentsService.getAll();
```

---

### 16. typesCertificatsService - Gestion des Types de Certificats

**Description** : Service pour la gestion des types de certificats médicaux.

#### Méthodes

##### `getAll()`
- **Description** : Récupère tous les types de certificats actifs
- **Paramètres** : Aucun
- **Retour** : `Array<TypeCertificat>` - Liste des types de certificats
- **Notes** : Applique le filtre de spécialité si configuré
- **Exemple** :
```javascript
const typesCertificats = await typesCertificatsService.getAll();
```

---

## Services Sécurisés (secureServices.js)

Les services sécurisés nécessitent une authentification active via Supabase Auth. Toutes les méthodes vérifient la présence d'une session avant d'exécuter les opérations.

### 1. secureUserService - Services Utilisateurs Sécurisés

**Description** : Version sécurisée du service utilisateurs avec authentification obligatoire.

#### Méthodes

##### `getAll()`
- **Description** : Récupère tous les utilisateurs (authentification requise)
- **Paramètres** : Aucun
- **Retour** : `Array<User>` - Liste des utilisateurs
- **Sécurité** : Vérifie la session Supabase, lance une erreur si non authentifié
- **Exemple** :
```javascript
const users = await secureUserService.getAll();
```

##### `getById(id)`
- **Description** : Récupère un utilisateur par ID (authentification requise)
- **Paramètres** :
  - `id` (number) - ID de l'utilisateur
- **Retour** : `User` - Utilisateur
- **Sécurité** : Vérifie la session Supabase
- **Exemple** :
```javascript
const user = await secureUserService.getById(1);
```

##### `getDoctors()`
- **Description** : Récupère tous les médecins (authentification requise)
- **Paramètres** : Aucun
- **Retour** : `Array<User>` - Liste des médecins
- **Sécurité** : Vérifie la session Supabase
- **Exemple** :
```javascript
const doctors = await secureUserService.getDoctors();
```

##### `getSecretaries()`
- **Description** : Récupère tous les secrétaires (authentification requise)
- **Paramètres** : Aucun
- **Retour** : `Array<User>` - Liste des secrétaires
- **Sécurité** : Vérifie la session Supabase
- **Exemple** :
```javascript
const secretaries = await secureUserService.getSecretaries();
```

---

### 2. securePatientService - Services Patients Sécurisés

**Description** : Version sécurisée du service patients avec authentification obligatoire et traçabilité.

#### Méthodes

##### `getAll()`
- **Description** : Récupère tous les patients (authentification requise)
- **Paramètres** : Aucun
- **Retour** : `Array<Patient>` - Liste des patients
- **Sécurité** : Vérifie la session Supabase
- **Exemple** :
```javascript
const patients = await securePatientService.getAll();
```

##### `getById(id)`
- **Description** : Récupère un patient par ID (authentification requise)
- **Paramètres** :
  - `id` (number) - ID du patient
- **Retour** : `Patient` - Patient
- **Sécurité** : Vérifie la session Supabase
- **Exemple** :
```javascript
const patient = await securePatientService.getById(1);
```

##### `create(patientData)`
- **Description** : Crée un nouveau patient avec traçabilité (authentification requise)
- **Paramètres** :
  - `patientData` (Object) - Données du patient
- **Retour** : `Patient` - Patient créé
- **Sécurité** : Vérifie la session Supabase, ajoute `created_by` automatiquement
- **Exemple** :
```javascript
const newPatient = await securePatientService.create({
  nom: 'Martin',
  prenom: 'Marie'
});
```

##### `update(id, updates)`
- **Description** : Met à jour un patient avec traçabilité (authentification requise)
- **Paramètres** :
  - `id` (number) - ID du patient
  - `updates` (Object) - Champs à mettre à jour
- **Retour** : `Patient` - Patient mis à jour
- **Sécurité** : Vérifie la session Supabase, ajoute `updated_by` automatiquement
- **Exemple** :
```javascript
const updated = await securePatientService.update(1, { telephone: '0123456789' });
```

##### `delete(id)`
- **Description** : Supprime un patient (authentification requise)
- **Paramètres** :
  - `id` (number) - ID du patient
- **Retour** : `void`
- **Sécurité** : Vérifie la session Supabase
- **Exemple** :
```javascript
await securePatientService.delete(1);
```

---

### 3. secureAppointmentService - Services Rendez-vous Sécurisés

**Description** : Version sécurisée du service rendez-vous avec authentification obligatoire et traçabilité.

#### Méthodes

##### `getAll()`
- **Description** : Récupère tous les rendez-vous (authentification requise)
- **Paramètres** : Aucun
- **Retour** : `Array<Appointment>` - Liste des rendez-vous
- **Sécurité** : Vérifie la session Supabase
- **Exemple** :
```javascript
const appointments = await secureAppointmentService.getAll();
```

##### `getByDoctor(medecinId, date)`
- **Description** : Récupère les rendez-vous d'un médecin (authentification requise)
- **Paramètres** :
  - `medecinId` (number) - ID du médecin
  - `date` (string, optionnel) - Date au format YYYY-MM-DD
- **Retour** : `Array<Appointment>` - Liste des rendez-vous
- **Sécurité** : Vérifie la session Supabase
- **Exemple** :
```javascript
const appointments = await secureAppointmentService.getByDoctor(1, '2025-01-15');
```

##### `getByPatient(patientId)`
- **Description** : Récupère les rendez-vous d'un patient (authentification requise)
- **Paramètres** :
  - `patientId` (number) - ID du patient
- **Retour** : `Array<Appointment>` - Liste des rendez-vous
- **Sécurité** : Vérifie la session Supabase
- **Exemple** :
```javascript
const appointments = await secureAppointmentService.getByPatient(1);
```

##### `getToday()`
- **Description** : Récupère les rendez-vous du jour (authentification requise)
- **Paramètres** : Aucun
- **Retour** : `Array<Appointment>` - Liste des rendez-vous du jour
- **Sécurité** : Vérifie la session Supabase
- **Exemple** :
```javascript
const todayAppointments = await secureAppointmentService.getToday();
```

##### `create(appointmentData)`
- **Description** : Crée un nouveau rendez-vous avec traçabilité (authentification requise)
- **Paramètres** :
  - `appointmentData` (Object) - Données du rendez-vous
- **Retour** : `Appointment` - Rendez-vous créé
- **Sécurité** : Vérifie la session Supabase, ajoute `created_by` automatiquement
- **Exemple** :
```javascript
const newAppointment = await secureAppointmentService.create({
  patient_id: 1,
  medecin_id: 2,
  date_heure: '2025-01-20T10:00:00'
});
```

##### `update(id, updates)`
- **Description** : Met à jour un rendez-vous avec traçabilité (authentification requise)
- **Paramètres** :
  - `id` (number) - ID du rendez-vous
  - `updates` (Object) - Champs à mettre à jour
- **Retour** : `Appointment` - Rendez-vous mis à jour
- **Sécurité** : Vérifie la session Supabase, ajoute `updated_by` automatiquement
- **Exemple** :
```javascript
const updated = await secureAppointmentService.update(1, { statut: 'annule' });
```

##### `delete(id)`
- **Description** : Supprime un rendez-vous (authentification requise)
- **Paramètres** :
  - `id` (number) - ID du rendez-vous
- **Retour** : `void`
- **Sécurité** : Vérifie la session Supabase
- **Exemple** :
```javascript
await secureAppointmentService.delete(1);
```

---

### 4. waitingQueueService (Version Sécurisée)

**Description** : Version sécurisée du service de file d'attente avec authentification obligatoire.

#### Méthodes

##### `getAll()`
- **Description** : Récupère toute la file d'attente (authentification requise)
- **Paramètres** : Aucun
- **Retour** : `Array<WaitingQueueItem>` - Liste des patients en attente
- **Sécurité** : Vérifie la session Supabase
- **Exemple** :
```javascript
const queue = await waitingQueueService.getAll();
```

##### `getByDoctor(medecinId)`
- **Description** : Récupère la file d'attente d'un médecin (authentification requise)
- **Paramètres** :
  - `medecinId` (number) - ID du médecin
- **Retour** : `Array<WaitingQueueItem>` - Liste des patients en attente
- **Sécurité** : Vérifie la session Supabase
- **Exemple** :
```javascript
const queue = await waitingQueueService.getByDoctor(1);
```

##### `addToQueue(queueData)`
- **Description** : Ajoute un patient à la file d'attente avec traçabilité (authentification requise)
- **Paramètres** :
  - `queueData` (Object) - Données de la file d'attente
- **Retour** : `WaitingQueueItem` - Élément ajouté
- **Sécurité** : Vérifie la session Supabase, ajoute `added_by` automatiquement
- **Exemple** :
```javascript
const newItem = await waitingQueueService.addToQueue({
  patient_id: 1,
  medecin_id: 2,
  status: 'waiting'
});
```

##### `updateStatus(id, status)`
- **Description** : Met à jour le statut d'un patient dans la file (authentification requise)
- **Paramètres** :
  - `id` (number) - ID de l'élément
  - `status` (string) - Nouveau statut
- **Retour** : `WaitingQueueItem` - Élément mis à jour
- **Sécurité** : Vérifie la session Supabase
- **Exemple** :
```javascript
const updated = await waitingQueueService.updateStatus(1, 'present');
```

##### `removeFromQueue(id)`
- **Description** : Retire un patient de la file d'attente (authentification requise)
- **Paramètres** :
  - `id` (number) - ID de l'élément
- **Retour** : `void`
- **Sécurité** : Vérifie la session Supabase
- **Exemple** :
```javascript
await waitingQueueService.removeFromQueue(1);
```

##### `reorderQueue(medecinId, newOrder)`
- **Description** : Réorganise l'ordre de la file d'attente (authentification requise)
- **Paramètres** :
  - `medecinId` (number) - ID du médecin
  - `newOrder` (Array) - Nouvel ordre des éléments
- **Retour** : `void`
- **Sécurité** : Vérifie la session Supabase
- **Exemple** :
```javascript
await waitingQueueService.reorderQueue(1, [{ id: 3, order_position: 1 }]);
```

##### `callNextPatient(medecinId)`
- **Description** : Appelle le patient suivant dans la file (authentification requise)
- **Paramètres** :
  - `medecinId` (number) - ID du médecin
- **Retour** : `WaitingQueueItem | null` - Patient appelé ou null
- **Sécurité** : Vérifie la session Supabase
- **Exemple** :
```javascript
const nextPatient = await waitingQueueService.callNextPatient(1);
```

---

## Fonctions Utilitaires

### checkAuthentication()

**Description** : Vérifie l'état d'authentification de l'utilisateur actuel.

- **Paramètres** : Aucun
- **Retour** : `Object` - `{ authenticated: boolean, user?: User, accessToken?: string, error?: Error }`
- **Exemple** :
```javascript
const auth = await checkAuthentication();
if (auth.authenticated) {
  console.log('Utilisateur connecté:', auth.user);
}
```

### fetchWithToken(table, options)

**Description** : Récupère des données d'une table avec le token d'authentification.

- **Paramètres** :
  - `table` (string) - Nom de la table
  - `options` (Object, optionnel) - Options de requête (`select`, `orderBy`, `ascending`)
- **Retour** : `Array` - Données récupérées
- **Sécurité** : Vérifie la session Supabase
- **Exemple** :
```javascript
const data = await fetchWithToken('patients', {
  select: 'id, nom, prenom',
  orderBy: 'nom',
  ascending: true
});
```

---

## Notes Importantes

### Filtrage par Spécialité

Plusieurs services appliquent automatiquement un filtre de spécialité si le mode spécialité est activé dans la configuration du cabinet. Les services concernés sont :
- `userService.getDoctors()`
- `appointmentService.getAll()` et `getToday()`
- `consultationService.getAll()`
- `typesActesService.getAll()`
- `appareilsService.getAll()`
- `diagnosticsService.getAll()`
- `medicamentsService.getAll()`
- `typesCertificatsService.getAll()`

### Gestion des Erreurs

Tous les services lancent des erreurs en cas de problème. Il est recommandé d'utiliser des blocs `try/catch` :

```javascript
try {
  const patients = await patientService.getAll();
} catch (error) {
  console.error('Erreur:', error);
}
```

### Authentification

Les services sécurisés vérifient automatiquement l'authentification. Si aucune session n'est active, une erreur `'Utilisateur non authentifié'` est lancée.

---

## Conclusion

Ce rapport technique couvre l'ensemble des services disponibles dans l'application. Pour toute question ou clarification, consultez le code source dans `src/lib/services.js` et `src/lib/secureServices.js`.


