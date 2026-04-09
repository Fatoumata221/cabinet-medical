// Types pour la base de données du cabinet médical

export interface User {
  id: number
  email: string
  role: 'secretary' | 'doctor' | 'admin'
  nom?: string
  prenom?: string
  specialite?: string
  created_at: string
  updated_at: string
}

export interface Patient {
  id: number
  nom: string
  prenom: string
  date_naissance: string
  telephone?: string
  adresse?: string
  assurance?: string
  numero_dossier?: string
  email?: string
  sexe?: 'M' | 'F'
  lieu_naissance?: string
  nationalite?: string
  profession?: string
  situation_familiale?: string
  personne_contact?: string
  telephone_contact?: string
  lien_contact?: string
  medecin_traitant?: string
  numero_secu?: string
  mutuelle?: string
  numero_mutuelle?: string
  actif: boolean
  notes?: string
  created_at: string
  updated_at: string
  created_by?: string
  updated_by?: string
}

export interface Appointment {
  id: number
  patient_id: number
  medecin_id: number
  date_heure: string
  motif?: string
  statut: 'confirme' | 'en_attente' | 'annule'
  duree?: number
  created_at: string
  updated_at: string
  // Relations
  patient?: Patient
  medecin?: User
}

export interface Consultation {
  id: number
  patient_id: number
  medecin_id: number
  date_consultation: string
  motif?: string
  diagnostic?: string
  traitement?: string
  notes?: string
  created_at: string
  updated_at: string
  // Relations
  patient?: Patient
  medecin?: User
}

export interface Invoice {
  id: number
  patient_id: number
  consultation_id?: number
  montant: number
  statut_paiement: 'paye' | 'en_attente' | 'impaye'
  created_at: string
  updated_at: string
  // Relations
  patient?: Patient
  consultation?: Consultation
}

export interface Prescription {
  id: number
  patient_id: number
  medecin_id: number
  medicaments: string
  posologie: string
  date_prescription: string
  statut: 'active' | 'terminee' | 'annulee'
  created_at: string
  updated_at: string
  // Relations
  patient?: Patient
  medecin?: User
}

export interface WaitingQueue {
  id: number
  patient_id: number
  medecin_id: number
  order_position: number
  status: 'waiting' | 'present' | 'in_consultation' | 'late' | 'emergency'
  arrived_at?: string
  created_at: string
  updated_at: string
  // Relations
  patient?: Patient
}

// Types pour les formulaires
export interface CreateUserData {
  email: string
  role: 'secretary' | 'doctor' | 'admin'
  nom?: string
  prenom?: string
  specialite?: string
}

export interface CreatePatientData {
  nom: string
  prenom: string
  date_naissance: string
  telephone?: string
  adresse?: string
  assurance?: string
  numero_dossier?: string
  email?: string
  sexe?: 'M' | 'F'
  lieu_naissance?: string
  nationalite?: string
  profession?: string
  situation_familiale?: string
  personne_contact?: string
  telephone_contact?: string
  lien_contact?: string
  medecin_traitant?: string
  numero_secu?: string
  mutuelle?: string
  numero_mutuelle?: string
  actif?: boolean
  notes?: string
}

export interface CreateAppointmentData {
  patient_id: number
  medecin_id: number
  date_heure: string
  motif?: string
  statut?: 'confirme' | 'en_attente' | 'annule'
  duree?: number
}

export interface CreateConsultationData {
  patient_id: number
  medecin_id: number
  date_consultation: string
  motif?: string
  diagnostic?: string
  traitement?: string
  notes?: string
}

export interface CreateInvoiceData {
  patient_id: number
  consultation_id?: number
  montant: number
  statut_paiement?: 'paye' | 'en_attente' | 'impaye'
}

export interface CreatePrescriptionData {
  patient_id: number
  medecin_id: number
  medicaments: string
  posologie: string
  date_prescription?: string
  statut?: 'active' | 'terminee' | 'annulee'
}

export interface CreateWaitingQueueData {
  patient_id: number
  medecin_id: number
  status?: 'waiting' | 'present' | 'in_consultation' | 'late' | 'emergency'
  arrived_at?: string
}

// Types pour les statistiques
export interface DashboardStats {
  totalPatients: number
  totalAppointments: number
  appointmentsToday: number
  totalConsultations: number
  totalInvoices: number
  pendingInvoices: number
  totalRevenue: number
}

export interface AppointmentStats {
  confirmed: number
  pending: number
  cancelled: number
  byDoctor: Record<string, number>
  byMonth: Record<string, number>
}

export interface InvoiceStats {
  paid: number
  pending: number
  unpaid: number
  totalAmount: number
  byMonth: Record<string, number>
}

// Types pour les documents patients
export type DocumentType = 
  | 'analyse' 
  | 'radio' 
  | 'echographie' 
  | 'scanner' 
  | 'irm' 
  | 'ordonnance_externe'
  | 'certificat_medical'
  | 'compte_rendu'
  | 'autre';

export interface PatientDocument {
  id: number
  patient_id: number
  type_document: DocumentType
  nom_fichier: string
  fichier_url: string
  date_document: string
  date_upload: string
  uploaded_by: string
  notes?: string
  taille_fichier?: number
  type_mime?: string
  consultation_id?: number
  created_at: string
  updated_at: string
  // Relations
  patient?: Patient
  uploaded_by_nom?: string
  uploaded_by_prenom?: string
  uploaded_by_role?: string
}

export interface CreatePatientDocumentData {
  patient_id: number
  type_document: DocumentType
  nom_fichier: string
  fichier_url: string
  date_document: string
  notes?: string
  taille_fichier?: number
  type_mime?: string
  consultation_id?: number
}

export interface PatientDocumentStats {
  total_documents: number
  documents_par_type: Record<DocumentType, number>
  dernier_upload?: string
}

