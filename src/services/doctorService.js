import { supabase } from '../lib/supabase';
import { notificationService } from './notificationService';

export const doctorService = {
  // Récupérer la file d'attente d'un médecin
  async getWaitingQueue(medecinId) {
    try {
      const { data, error } = await supabase
        .from('waiting_queue')
        .select(`
          *,
          patient:patients(nom, prenom, telephone, numero_dossier),
          appointment:appointments(motif, duree)
        `)
        .eq('medecin_id', medecinId)
        .order('order_position', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur lors du chargement de la file d\'attente:', error);
      throw error;
    }
  },

  // Récupérer les rendez-vous d'un médecin pour aujourd'hui
  async getTodayAppointments(medecinId) {
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
        .order('date_heure', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur lors du chargement des rendez-vous:', error);
      throw error;
    }
  },

  // Mettre à jour le statut d'un patient
  async updatePatientStatus(patientId, newStatus) {
    try {
      const { data, error } = await supabase
        .from('waiting_queue')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', patientId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      throw error;
    }
  },

  // Appeler un patient (changer statut à 'appele')
  async callPatient(patientId) {
    return this.updatePatientStatus(patientId, 'appele');
  },

  // Recevoir un patient (changer statut à 'entre')
  async receivePatient(patientId) {
    return this.updatePatientStatus(patientId, 'entre');
  },

  // Terminer une consultation (changer statut à 'termine')
  async finishConsultation(patientId) {
    return this.updatePatientStatus(patientId, 'termine');
  },

  // Créer une notification pour la secrétaire
  async notifySecretary(notificationData) {
    try {
      const { data, error } = await supabase
        .from('notifications_realtime')
        .insert([{
          user_id: 1, // ID de la secrétaire (à adapter selon votre structure)
          type_notification: notificationData.type || 'patient_status_change',
          titre: notificationData.titre || 'Changement de statut patient',
          message: notificationData.message,
          priorite: notificationData.priorite || 'normale',
          data: notificationData.data || {}
        }]);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur lors de la création de la notification:', error);
      throw error;
    }
  },

  // Récupérer les notifications d'un médecin
  async getNotifications(medecinId) {
    try {
      const { data, error } = await supabase
        .from('notifications_realtime')
        .select('*')
        .eq('user_id', medecinId)
        .eq('lu', false)
        .order('created_at', { ascending: false })
        .limit(10);

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

  // Récupérer le patient actuel (premier en attente)
  async getCurrentPatient(medecinId) {
    try {
      const { data, error } = await supabase
        .from('waiting_queue')
        .select(`
          *,
          patient:patients(nom, prenom, telephone, numero_dossier),
          appointment:appointments(motif, duree)
        `)
        .eq('medecin_id', medecinId)
        .eq('status', 'waiting')
        .order('order_position', { ascending: true })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
      return data || null;
    } catch (error) {
      console.error('Erreur lors de la récupération du patient actuel:', error);
      return null;
    }
  },

  // Récupérer les patients en consultation
  async getPatientsInConsultation(medecinId) {
    try {
      const { data, error } = await supabase
        .from('waiting_queue')
        .select(`
          *,
          patient:patients(nom, prenom, telephone, numero_dossier),
          appointment:appointments(motif, duree)
        `)
        .eq('medecin_id', medecinId)
        .in('status', ['entre', 'en_consultation'])
        .order('order_position', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des patients en consultation:', error);
      throw error;
    }
  },

  // Réassigner un patient à un autre médecin
  async reassignPatientToDoctor(waitingQueueId, newMedecinId, reason = 'Médecin indisponible') {
    try {
      const { data, error } = await supabase.rpc('reassign_patient_to_doctor', {
        p_waiting_queue_id: waitingQueueId,
        p_new_medecin_id: newMedecinId,
        p_reason: reason
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur lors de la réassignation du patient:', error);
      throw error;
    }
  },

  // Récupérer les médecins disponibles par spécialité
  async getAvailableDoctorsBySpeciality(specialiteId = null) {
    try {
      const { data, error } = await supabase.rpc('get_available_doctors_by_speciality', {
        p_specialite_id: specialiteId
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des médecins disponibles:', error);
      throw error;
    }
  },

  // Récupérer les patients avec médecin indisponible
  async getPatientsWithUnavailableDoctor() {
    try {
      const { data, error } = await supabase
        .from('waiting_queue_doctor_unavailable')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des patients avec médecin indisponible:', error);
      throw error;
    }
  }
};
