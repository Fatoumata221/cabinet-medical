import { supabase } from '../lib/supabase';
import { unifiedNotificationService } from './unifiedNotificationService.jsx';

// Types de notifications
export const NOTIFICATION_TYPES = {
  PATIENT_ARRIVED: 'patient_arrived',
  PATIENT_CALLED: 'patient_called',
  PATIENT_ENTERED: 'patient_entered',
  PATIENT_ON_WAY: 'patient_on_way',
  CONSULTATION_FINISHED: 'consultation_finished',
  DOCTOR_AVAILABLE: 'doctor_available',
  DOCTOR_REQUEST: 'doctor_request',
  PATIENT_ADDED: 'patient_added',
  URGENCY: 'urgency',
  PATIENT_STATUS_CHANGE: 'patient_status_change'
};

// Fonction principale pour envoyer des notifications
export const sendNotification = async (type, fromUserId, toUserId, consultationId = null, patientName = '', metadata = {}) => {
  try {
    console.log('📤 [sendNotification] Envoi notification:', {
      type,
      fromUserId,
      toUserId,
      consultationId,
      patientName,
      metadata
    });

    // Construire le message selon le type
    let message = '';
    let titre = '';
    let priorite = 'normale';

    switch (type) {
      case NOTIFICATION_TYPES.PATIENT_ARRIVED:
        message = `${patientName} est arrivé en salle d'attente`;
        titre = 'Patient Arrivé';
        break;
      case NOTIFICATION_TYPES.PATIENT_ON_WAY:
        message = `${patientName} se dirige vers votre bureau`;
        titre = 'Patient En Route';
        break;
      case NOTIFICATION_TYPES.DOCTOR_AVAILABLE:
        message = `Médecin prêt à recevoir ${patientName}`;
        titre = 'Médecin Disponible';
        break;
      case NOTIFICATION_TYPES.CONSULTATION_FINISHED:
        message = `Consultation de ${patientName} terminée`;
        titre = 'Consultation Terminée';
        break;
      case NOTIFICATION_TYPES.URGENCY:
        message = `Patient urgent: ${patientName}`;
        titre = 'URGENT';
        priorite = 'urgente';
        break;
      default:
        message = `Notification concernant ${patientName}`;
        titre = 'Notification';
    }

    // Insérer dans la base de données
    const notificationData = {
      medecin_id: toUserId,
      secretaire_id: fromUserId,
      patient_id: metadata.patientId || null,
      consultation_id: consultationId,
      waiting_queue_id: metadata.waitingQueueId || null,
      type_notification: type,
      titre: titre,
      message: message,
      priorite: priorite,
      metadata: JSON.stringify(metadata),
      lu: false
    };

    const { data, error } = await supabase
      .from('notifications_medecin_secretaire')
      .insert([notificationData])
      .select()
      .single();

    if (error) throw error;

    console.log('✅ [sendNotification] Notification créée:', data);
    return data;
  } catch (error) {
    console.error('❌ [sendNotification] Erreur:', error);
    throw error;
  }
};

export const notificationService = {
  // Créer une notification pour la secrétaire
  async notifySecretary(notificationData) {
    try {
      // Récupérer toutes les secrétaires actives
      const { data: secretaries, error: usersError } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'secretary')
        .eq('actif', true);

      if (usersError) throw usersError;

      const rows = (secretaries || []).map((u) => ({
        secretaire_id: u.id,
        medecin_id: notificationData.data?.medecin_id || null,
        patient_id: notificationData.data?.patient_id || null,
        type_notification: notificationData.type || 'patient_status_change',
        titre: notificationData.titre || 'Changement de statut patient',
        message: notificationData.message,
        priorite: notificationData.priorite || 'normale',
        lu: false
      }));

      if (rows.length === 0) return [];

      const { data, error } = await supabase
        .from('notifications_medecin_secretaire')
        .insert(rows)
        .select();

      if (error) throw error;
      
      console.log('✅ [NotificationService] Notifications créées:', data);
      return data;
    } catch (error) {
      console.error('❌ [NotificationService] Erreur lors de la création de la notification:', error);
      throw error;
    }
  },

  // Notifier quand un patient est appelé
  async notifyPatientCalled(patientId, medecinId, patientName, doctorName) {
    try {
      await this.notifySecretary({
        type: 'patient_called',
        titre: 'Patient Appelé',
        message: `${patientName} a été appelé par Dr. ${doctorName}`,
        priorite: 'normale',
        data: {
          patient_id: patientId,
          medecin_id: medecinId,
          action: 'called',
          timestamp: new Date().toISOString()
        }
      });

      // Notification toast locale
      if (window.notificationManager) {
        window.notificationManager.add({
          message: `${patientName} a été appelé par Dr. ${doctorName}`,
          type: 'patient_called',
          duration: 5000
        });
      }
      
      // Toast react-toastify avec son
      unifiedNotificationService.medicalWorkflow('souhaite_recevoir', patientName, doctorName);
    } catch (error) {
      console.error('Erreur lors de la notification patient appelé:', error);
    }
  },

  // Notifier quand un patient entre en consultation
  async notifyPatientEntered(patientId, medecinId, patientName, doctorName) {
    try {
      await this.notifySecretary({
        type: 'patient_entered',
        titre: 'Patient en Consultation',
        message: `${patientName} est entré en consultation avec Dr. ${doctorName}`,
        priorite: 'normale',
        data: {
          patient_id: patientId,
          medecin_id: medecinId,
          action: 'entered',
          timestamp: new Date().toISOString()
        }
      });

      // Notification toast locale
      if (window.notificationManager) {
        window.notificationManager.add({
          message: `${patientName} est entré en consultation`,
          type: 'patient_entered',
          duration: 5000
        });
      }
      
      // Toast react-toastify avec son
      unifiedNotificationService.medicalWorkflow('patient_en_route', patientName, doctorName);
    } catch (error) {
      console.error('Erreur lors de la notification patient entré:', error);
    }
  },

  // Notifier quand une consultation est terminée
  async notifyConsultationFinished(patientId, medecinId, patientName, doctorName) {
    try {
      await this.notifySecretary({
        type: 'consultation_finished',
        titre: 'Consultation Terminée',
        message: `La consultation de ${patientName} avec Dr. ${doctorName} est terminée`,
        priorite: 'normale',
        data: {
          patient_id: patientId,
          medecin_id: medecinId,
          action: 'finished',
          timestamp: new Date().toISOString()
        }
      });

      // Notification toast locale
      if (window.notificationManager) {
        window.notificationManager.add({
          message: `Consultation de ${patientName} terminée`,
          type: 'consultation_finished',
          duration: 5000
        });
      }
      
      // Toast react-toastify avec son
      unifiedNotificationService.medicalWorkflow('consultation_terminee', patientName, doctorName);
    } catch (error) {
      console.error('Erreur lors de la notification consultation terminée:', error);
    }
  },

  // Notifier quand un patient est ajouté à la file d'attente
  async notifyPatientAdded(patientId, medecinId, patientName, doctorName) {
    try {
      await this.notifySecretary({
        type: 'patient_added',
        titre: 'Patient Ajouté',
        message: `${patientName} a été ajouté à la file d'attente de Dr. ${doctorName}`,
        priorite: 'normale',
        data: {
          patient_id: patientId,
          medecin_id: medecinId,
          action: 'added',
          timestamp: new Date().toISOString()
        }
      });

      // Notification toast locale
      if (window.notificationManager) {
        window.notificationManager.add({
          message: `${patientName} ajouté à la file d'attente`,
          type: 'success',
          duration: 3000
        });
      }
      
      // Toast react-toastify
      unifiedNotificationService.success(`➕ ${patientName} ajouté à la file d'attente de Dr. ${doctorName}`);
    } catch (error) {
      console.error('Erreur lors de la notification patient ajouté:', error);
    }
  },

  // Notifier une urgence
  async notifyUrgency(patientId, medecinId, patientName, urgencyLevel) {
    try {
      await this.notifySecretary({
        type: 'urgency',
        titre: 'Patient Urgent',
        message: `${patientName} - ${urgencyLevel === 'tres_urgente' ? 'Très urgent' : 'Urgent'}`,
        priorite: 'urgente',
        data: {
          patient_id: patientId,
          medecin_id: medecinId,
          urgency_level: urgencyLevel,
          timestamp: new Date().toISOString()
        }
      });

      // Notification toast locale
      if (window.notificationManager) {
        window.notificationManager.add({
          message: `Patient urgent: ${patientName}`,
          type: 'warning',
          duration: 8000
        });
      }
      
      // Toast react-toastify urgent
      unifiedNotificationService.error(`🚨 URGENT: ${patientName} - ${urgencyLevel === 'tres_urgente' ? 'Très urgent' : 'Urgent'}`);
    } catch (error) {
      console.error('Erreur lors de la notification urgence:', error);
    }
  },

  // Notifier qu'un médecin va recevoir un patient
  async notifyDoctorRequest(doctorId, patientId, patientName, doctorName) {
    try {
      // Récupérer le nom du médecin si non fourni
      let drName = doctorName;
      if (!drName) {
        const { data: doctor } = await supabase
          .from('users')
          .select('nom, prenom')
          .eq('id', doctorId)
          .single();
        
        if (doctor) {
          drName = `${doctor.prenom} ${doctor.nom}`;
        } else {
          drName = `Médecin #${doctorId}`;
        }
      }

      await this.notifySecretary({
        type: 'doctor_request',
        titre: 'Demande de Réception',
        message: `Dr. ${drName} va recevoir ${patientName}. Cliquez sur "Autoriser" dans Introduction Patient`,
        priorite: 'normale',
        data: {
          patient_id: patientId,
          medecin_id: doctorId,
          action: 'doctor_request',
          timestamp: new Date().toISOString()
        }
      });

      // Notification toast locale
      if (window.notificationManager) {
        window.notificationManager.add({
          message: `Dr. ${drName} demande ${patientName}`,
          type: 'doctor_request',
          duration: 5000
        });
      }
      
      // Toast react-toastify
      unifiedNotificationService.info(`👨‍⚕️ Dr. ${drName} va recevoir ${patientName}`);
    } catch (error) {
      console.error('Erreur lors de la notification de demande médecin:', error);
    }
  },

  // Récupérer les notifications d'un utilisateur
  async getNotifications(userId) {
    try {
      const { data, error } = await supabase
        .from('notifications_consultation')
        .select('*')
        .eq('destinataire_id', userId)
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
  async markAsRead(notificationId) {
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

  // Marquer toutes les notifications comme lues
  async markAllAsRead(userId) {
    try {
      const { data, error } = await supabase
        .from('notifications_consultation')
        .update({ 
          lu: true, 
          lu_at: new Date().toISOString() 
        })
        .eq('destinataire_id', userId)
        .eq('lu', false);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur lors du marquage de toutes les notifications:', error);
      throw error;
    }
  },

  // Supprimer une notification
  async deleteNotification(notificationId) {
    try {
      const { error } = await supabase
        .from('notifications_consultation')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression de la notification:', error);
      throw error;
    }
  },

  // Supprimer les anciennes notifications (plus de 7 jours)
  async cleanupOldNotifications() {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { error } = await supabase
        .from('notifications_consultation')
        .delete()
        .lt('created_at', sevenDaysAgo.toISOString());

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erreur lors du nettoyage des notifications:', error);
      throw error;
    }
  },

  // Obtenir les statistiques des notifications
  async getNotificationStats(userId) {
    try {
      const { data, error } = await supabase
        .from('notifications_consultation')
        .select('lu, priorite, type_notification')
        .eq('destinataire_id', userId);

      if (error) throw error;

      const stats = {
        total: data.length,
        unread: data.filter(n => !n.lu).length,
        urgent: data.filter(n => n.priorite === 'urgente' && !n.lu).length,
        byType: {}
      };

      // Compter par type
      data.forEach(notification => {
        const type = notification.type_notification;
        stats.byType[type] = (stats.byType[type] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Erreur lors du calcul des statistiques:', error);
      throw error;
    }
  }
};
