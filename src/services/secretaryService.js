//import { supabaseQuery as supabase } from '../lib/supabase';
import { supabase } from '../lib/supabase';
import { generateNumeroDossier } from './patientService';
import { notificationService } from './notificationService';
import { sendNotification, NOTIFICATION_TYPES } from '../lib/notifications';

export const secretaryService = {
  // Récupérer tous les médecins actifs
  async getActiveDoctors() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'doctor')
        .eq('actif', true)
        .order('nom', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur lors du chargement des médecins:', error);
      throw error;
    }
  },

  // Récupérer la file d'attente d'un médecin spécifique
  async getDoctorWaitingQueue(medecinId) {
    try {
      const { data, error } = await supabase
        .from('waiting_queue')
        .select(`
          *,
          patient:patients(nom, prenom, telephone, numero_dossier),
          appointment:appointments(motif, duree)
        `)
        .eq('medecin_id', medecinId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur lors du chargement de la file d\'attente:', error);
      throw error;
    }
  },

  // Récupérer les rendez-vous d'un médecin pour aujourd'hui
  async getDoctorAppointments(medecinId) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patient:patients(nom, prenom, telephone, numero_dossier)
        `)
        .eq('medecin_id', medecinId)
        .gte('date_heure', today.toISOString())
        .lt('date_heure', tomorrow.toISOString())
        .order('date_heure', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur lors du chargement des rendez-vous:', error);
      throw error;
    }
  },

  // Récupérer toutes les files d'attente (vue globale)
  async getAllWaitingQueues() {
    try {
      const { data, error } = await supabase
        .from('waiting_queue')
        .select(`
          *,
          patient:patients(nom, prenom, telephone, numero_dossier),
          appointment:appointments(motif, duree),
          medecin:users!waiting_queue_medecin_id_fkey(nom, prenom, specialite)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur lors du chargement des files d\'attente:', error);
      throw error;
    }
  },

  // Ajouter un patient à la file d'attente
  async addPatientToQueue(patientData, tenantId = null) {
    try {
      // Récupérer la position actuelle dans la file d'attente
      const { data: currentQueue } = await supabase
        .from('waiting_queue')
        .select('order_position')
        .eq('medecin_id', patientData.medecin_id)
        .order('order_position', { ascending: false })
        .limit(1);

      const nextPosition = currentQueue && currentQueue.length > 0 ? currentQueue[0].order_position + 1 : 1;

      const { data, error } = await supabase
        .from('waiting_queue')
        .insert([{
          ...patientData,
          order_position: nextPosition,
          arrived_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      // Notification pour le médecin
      const patientName = `${patientData.patient?.prenom || 'Patient'} ${patientData.patient?.nom || ''}`;
      await notificationService.notifyPatientAdded(data.id, patientData.medecin_id, patientName, 'Dr. ' + patientData.prenom, tenantId);

      return data;
    } catch (error) {
      console.error('Erreur lors de l\'ajout du patient à la file d\'attente:', error);
      throw error;
    }
  },

  // Marquer un patient comme présent (depuis un rendez-vous)
  async markPatientPresent(appointmentId, patientId, medecinId, tenantId = null) {
    try {
      // Vérifier si le patient n'est pas déjà en file d'attente
      const { data: existingPatient } = await supabase
        .from('waiting_queue')
        .select('id')
        .eq('patient_id', patientId)
        .eq('medecin_id', medecinId)
        .eq('status', 'waiting')
        .single();

      if (existingPatient) {
        throw new Error('Le patient est déjà en file d\'attente');
      }

      // Récupérer la position actuelle
      const { data: currentQueue } = await supabase
        .from('waiting_queue')
        .select('order_position')
        .eq('medecin_id', medecinId)
        .order('order_position', { ascending: false })
        .limit(1);

      const nextPosition = currentQueue && currentQueue.length > 0 ? currentQueue[0].order_position + 1 : 1;

      // Ajouter à la file d'attente
      const { data, error } = await supabase
        .from('waiting_queue')
        .insert([{
          patient_id: patientId,
          medecin_id: medecinId,
          appointment_id: appointmentId,
          status: 'waiting',
          priority: 'normale',
          arrived_at: new Date().toISOString(),
          order_position: nextPosition
        }])
        .select()
        .single();

      if (error) throw error;

      // Notification pour le médecin
      const { data: patient } = await supabase
        .from('patients')
        .select('nom, prenom')
        .eq('id', patientId)
        .single();
      
      if (patient) {
        const patientName = `${patient.prenom} ${patient.nom}`;
        await notificationService.notifyPatientAdded(data.id, medecinId, patientName, 'Dr. ' + patient.prenom, tenantId);
      }

      return data;
    } catch (error) {
      console.error('Erreur lors du marquage du patient comme présent:', error);
      throw error;
    }
  },

  // Rechercher des patients
  async searchPatients(searchTerm) {
    try {
      let query = supabase
        .from('patients')
        .select('*')
        .order('nom', { ascending: true });

      if (searchTerm) {
        query = query.or(`nom.ilike.%${searchTerm}%,prenom.ilike.%${searchTerm}%,numero_dossier.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query.limit(20);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur lors de la recherche des patients:', error);
      throw error;
    }
  },

  // Créer un nouveau patient
  async createPatient(patientData) {
    try {
      // Générer automatiquement le numéro de dossier s'il n'est pas fourni
      if (!patientData.numero_dossier || patientData.numero_dossier.trim() === '') {
        patientData.numero_dossier = await generateNumeroDossier();
      }

      const { data, error } = await supabase
        .from('patients')
        .insert([patientData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur lors de la création du patient:', error);
      throw error;
    }
  },

  // Récupérer les statistiques globales
  async getGlobalStats() {
    try {
      const { data: waitingQueue, error: queueError } = await supabase
        .from('waiting_queue')
        .select('status, priority');

      if (queueError) throw queueError;

      const stats = {
        total: waitingQueue.length,
        waiting: waitingQueue.filter(p => p.status === 'waiting').length,
        inConsultation: waitingQueue.filter(p => p.status === 'present' || p.status === 'in_consultation').length,
        urgent: waitingQueue.filter(p => p.priority === 'urgente' || p.priority === 'tres_urgente').length,
        finished: waitingQueue.filter(p => p.status === 'finished').length
      };

      return stats;
    } catch (error) {
      console.error('Erreur lors du calcul des statistiques:', error);
      throw error;
    }
  },

  // Récupérer les notifications de la secrétaire
  async getNotifications(secretaryId) {
    try {
      const { data, error } = await supabase
        .from('notifications_realtime')
        .select('*')
        .eq('user_id', secretaryId)
        .eq('lu', false)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error);
      throw error;
    }
  },

  // Marquer une notification comme lue
  async markNotificationAsRead(notificationId) {
    try {
      const { data, error } = await supabase
        .from('notifications_realtime')
        .update({
          lu: true,
          lu_at: new Date().toISOString()
        })
        .eq('id', notificationId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur lors du marquage de la notification:', error);
      throw error;
    }
  },

  // Envoyer un patient dans le cabinet (changer statut à 'en_consultation' via RPC)
  async sendPatientToConsultation(waitingQueueId, secretaireId, medecinId) {
    try {
      const { data, error } = await supabase.rpc('secretaire_envoie_patient', {
        p_waiting_queue_id: waitingQueueId,
        p_secretaire_id: secretaireId
      });

      if (error) throw error;

      // Envoyer notification au médecin
      const patientName = data?.patient_name || 'Patient';
      await sendNotification(
        NOTIFICATION_TYPES.PATIENT_IN_CONSULTATION,
        secretaireId,
        medecinId,
        null,
        patientName,
        { waitingQueueId, patientId: data?.patient_id }
      );

      return data;
    } catch (error) {
      console.error('Erreur lors de l\'envoi du patient en consultation:', error);
      throw error;
    }
  },

  // Vérifier si un patient est déjà en file d'attente
  async isPatientInQueue(patientId, medecinId) {
    try {
      const { data, error } = await supabase
        .from('waiting_queue')
        .select('id')
        .eq('patient_id', patientId)
        .eq('medecin_id', medecinId)
        .in('status', ['waiting', 'late', 'present', 'in_consultation'])
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
      return !!data;
    } catch (error) {
      console.error('Erreur lors de la vérification du patient en file d\'attente:', error);
      return false;
    }
  },

  // Mettre à jour l'ordre de la file d'attente
  async updateQueueOrder(medecinId, newOrder) {
    try {
      const updates = newOrder.map((patientId, index) => ({
        id: patientId,
        order_position: index + 1
      }));

      const { error } = await supabase
        .from('waiting_queue')
        .upsert(updates, { onConflict: 'id' });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'ordre de la file d\'attente:', error);
      throw error;
    }
  }
};
