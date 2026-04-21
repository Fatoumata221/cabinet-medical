//import { supabaseQuery as supabase } from './supabase';
import { supabase } from './supabase'

// Types de notifications
export const NOTIFICATION_TYPES = {
  PATIENT_READY: 'patient_ready',         // Médecin → Secrétaire : "Je reçois le patient"
  PATIENT_ON_WAY: 'patient_on_way',       // Secrétaire → Médecin : "Le patient est en route"
  CONSULTATION_ENDED: 'consultation_ended' // Médecin → Secrétaire : "Consultation terminée, je suis disponible"
};

/**
 * Envoyer une notification
 * @param {string} type - Type de notification (NOTIFICATION_TYPES)
 * @param {string} senderId - ID de l'expéditeur
 * @param {string} receiverId - ID du destinataire
 * @param {string} consultationId - ID de la consultation (optionnel)
 * @param {string} patientName - Nom du patient
 * @param {object} additionalData - Données supplémentaires (optionnel)
 */
export const sendNotification = async (type, senderId, receiverId, consultationId, patientName, additionalData = {}) => {
  try {
    console.log('📤 [Notifications] Envoi notification:', { type, senderId, receiverId, patientName });
    
    // 1. Récupérer le tenant_id de l'expéditeur
    const { data: senderInfos } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', senderId)
      .single();
    
    const cabinetId = senderInfos?.tenant_id;
    
    const message = generateNotificationMessage(type, patientName, additionalData.medecinName);
    const titre = generateNotificationTitle(type);
    
    // Pour CONSULTATION_ENDED, envoyer à TOUTES les secrétaires actives du MÊME cabinet
    if (type === NOTIFICATION_TYPES.CONSULTATION_ENDED) {
      console.log('🔵 [Notifications] Notification CONSULTATION_ENDED - Envoi aux secrétaires actives du cabinet');
      
      let query = supabase
        .from('users')
        .select('id')
        .eq('role', 'secretary')
        .eq('actif', true);
        
      if (cabinetId) {
        query = query.eq('tenant_id', cabinetId);
      }
      
      let { data: secretaires, error: secretairesError } = await query;
      
      if (secretairesError) {
        console.error('❌ [Notifications] Erreur récupération secrétaires:', secretairesError);
        throw secretairesError;
      }
      
      if (!secretaires || secretaires.length === 0) {
        console.warn('⚠️ [Notifications] Aucune secrétaire active trouvée, utilisation du receiverId fourni');
        // Fallback: utiliser le receiverId fourni
        secretaires = [{ id: receiverId }];
      }
      
      console.log('📊 [Notifications] Secrétaires actives trouvées:', secretaires.length);
      console.log('📊 [Notifications] IDs des secrétaires:', secretaires.map(s => s.id));
      
      // Préparer les données de base
      const baseData = {
        type_notification: type,
        titre: titre,
        message: message,
        medecin_id: senderId,
        tenant_id: cabinetId, // Ajouter tenant_id
        waiting_queue_id: additionalData.waitingQueueId || null,
        patient_id: additionalData.patientId || null,
        lu: false,
        priorite: 'normale'
      };

      // Ajouter consultation_id seulement s'il est fourni
      const consultationIdValue = consultationId || additionalData.consultationId;
      if (consultationIdValue) {
        baseData.consultation_id = consultationIdValue;
      }

      // Créer une notification pour chaque secrétaire
      const notificationsToInsert = secretaires.map(secretaire => ({
        ...baseData,
        secretaire_id: secretaire.id
      }));

      console.log('📤 [Notifications] Insertion de', notificationsToInsert.length, 'notifications (une par secrétaire)');
      
      // Insérer toutes les notifications en une seule requête
      const { data: notifications, error: insertError } = await supabase
        .from('notifications_medecin_secretaire')
        .insert(notificationsToInsert)
        .select();

      if (insertError) {
        // Si l'erreur est due à une colonne manquante (consultation_id), réessayer sans cette colonne
        if (insertError.code === '42703' && baseData.consultation_id !== undefined) {
          console.warn('⚠️ [Notifications] Colonne consultation_id non trouvée, insertion sans cette colonne');
          delete baseData.consultation_id;
          const notificationsToInsertRetry = secretaires.map(secretaire => ({
            ...baseData,
            secretaire_id: secretaire.id
          }));
          
          const { data: retryNotifications, error: retryError } = await supabase
            .from('notifications_medecin_secretaire')
            .insert(notificationsToInsertRetry)
            .select();
          
          if (retryError) {
            console.error('❌ [Notifications] Erreur insertion (retry):', retryError);
            throw retryError;
          }
          
          console.log('✅ [Notifications]', retryNotifications.length, 'notifications envoyées avec succès à toutes les secrétaires');
          // Retourner la première notification avec consultation_id ajouté
          return retryNotifications.length > 0 
            ? { ...retryNotifications[0], consultation_id: consultationIdValue }
            : null;
        }
        
        console.error('❌ [Notifications] Erreur insertion:', insertError);
        throw insertError;
      }

      console.log('✅ [Notifications]', notifications.length, 'notifications envoyées avec succès à toutes les secrétaires');
      // Retourner la première notification
      return notifications && notifications.length > 0 ? notifications[0] : null;
    }
    
    // Pour les autres types de notifications, comportement normal
    const insertData = {
      type_notification: type,
      titre: titre,
      message: message,
      medecin_id: type === NOTIFICATION_TYPES.PATIENT_ON_WAY ? receiverId : senderId,
      secretaire_id: type === NOTIFICATION_TYPES.PATIENT_ON_WAY ? senderId : receiverId,
      tenant_id: cabinetId, // Ajouter tenant_id
      waiting_queue_id: additionalData.waitingQueueId || null,
      patient_id: additionalData.patientId || null,
      lu: false,
      priorite: 'normale'
    };

    // Ajouter consultation_id seulement s'il est fourni (la colonne peut ne pas exister encore)
    const consultationIdValue = consultationId || additionalData.consultationId;
    if (consultationIdValue) {
      insertData.consultation_id = consultationIdValue;
    }

    // Insérer dans notifications_medecin_secretaire
    const { data: notification, error } = await supabase
      .from('notifications_medecin_secretaire')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      // Si l'erreur est due à une colonne manquante (consultation_id), réessayer sans cette colonne
      if (error.code === '42703' && insertData.consultation_id !== undefined) {
        console.warn('⚠️ [Notifications] Colonne consultation_id non trouvée, insertion sans cette colonne');
        delete insertData.consultation_id;
        const { data: retryNotification, error: retryError } = await supabase
          .from('notifications_medecin_secretaire')
          .insert(insertData)
          .select()
          .single();
        
        if (retryError) {
          console.error('❌ [Notifications] Erreur insertion (retry):', retryError);
          throw retryError;
        }
        
        // Ajouter consultation_id dans les données retournées pour utilisation ultérieure
        return { ...retryNotification, consultation_id: consultationIdValue };
      }
      
      console.error('❌ [Notifications] Erreur insertion:', error);
      throw error;
    }

    console.log('✅ [Notifications] Notification envoyée avec succès:', notification.id);
    return notification;
  } catch (error) {
    console.error('❌ [Notifications] Erreur lors de l\'envoi de la notification:', error);
    throw error;
  }
};

/**
 * Générer le message de notification selon le type
 */
const generateNotificationMessage = (type, patientName, medecinName) => {
  switch (type) {
    case NOTIFICATION_TYPES.PATIENT_READY:
      return `Je reçois le patient ${patientName}`;
    case NOTIFICATION_TYPES.PATIENT_ON_WAY:
      return `Le patient ${patientName} est en route`;
    case NOTIFICATION_TYPES.CONSULTATION_ENDED:
      return medecinName 
        ? `${medecinName} a terminé la consultation avec ${patientName}. Cliquez pour compléter la facturation.`
        : `Consultation du patient ${patientName} terminée. Cliquez pour compléter la facturation.`;
    default:
      return 'Nouvelle notification';
  }
};

/**
 * Générer le titre de notification selon le type
 */
const generateNotificationTitle = (type) => {
  switch (type) {
    case NOTIFICATION_TYPES.PATIENT_READY:
      return 'Patient prêt à être reçu';
    case NOTIFICATION_TYPES.PATIENT_ON_WAY:
      return 'Patient en route';
    case NOTIFICATION_TYPES.CONSULTATION_ENDED:
      return 'Consultation terminée - Compléter la facturation';
    default:
      return 'Notification';
  }
};

/**
 * Marquer une notification comme lue
 * @param {string} notificationId - ID de la notification
 */
export const markAsRead = async (notificationId) => {
  try {
    const { error } = await supabase
      .from('notifications_medecin_secretaire')
      .update({ 
        lu: true, 
        lu_at: new Date().toISOString() 
      })
      .eq('id', notificationId);

    if (error) throw error;
    
    console.log('✅ [Notifications] Notification marquée comme lue:', notificationId);
    return true;
  } catch (error) {
    console.error('❌ [Notifications] Erreur marquage comme lu:', error);
    throw error;
  }
};

/**
 * Récupérer les notifications non lues d'un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @param {string} userRole - Rôle de l'utilisateur ('doctor' ou 'secretary')
 */
export const getUnreadNotifications = async (userId, userRole) => {
  try {
    const { data: user } = await supabase.from('users').select('tenant_id').eq('id', userId).single();
    const cabinetId = user?.tenant_id;

    let query = supabase
      .from('notifications_medecin_secretaire')
      .select(`
        *,
        medecin:users!notifications_medecin_secretaire_medecin_id_fkey(id, nom, prenom),
        secretaire:users!notifications_medecin_secretaire_secretaire_id_fkey(id, nom, prenom),
        patient:patients(id, nom, prenom)
      `)
      .eq('lu', false)
      .order('created_at', { ascending: false });

    if (cabinetId) {
      query = query.eq('tenant_id', cabinetId);
    }

    // Filtrer selon le rôle
    if (userRole === 'doctor') {
      // Le médecin reçoit UNIQUEMENT les notifications "patient_on_way" et "demande_autorisation"
      query = query
        .eq('medecin_id', userId)
        .in('type_notification', ['patient_on_way', 'doctor_request', 'demande_autorisation']);
    } else if (userRole === 'secretary') {
      query = query
        //.not('secretaire_id', 'is', null) // uniquement les notifications destinées aux secrétaires
        .neq('type_notification', 'patient_on_way') // exclure celles pour médecins
        .neq('type_notification', 'doctor_request');
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ [Notifications] Erreur requête getUnreadNotifications:', error);
      throw error;
    }
    
    console.log('✅ [Notifications] Notifications non lues récupérées (brutes):', data?.length || 0);
    
    // Filtrer côté client pour les secrétaires
    let filteredData = data || [];
    if (userRole === 'secretary' && data && data.length > 0) {
      // Exclure uniquement les notifications destinées aux médecins
      /*filteredData = data.filter(n => 
        n.type_notification !== 'patient_on_way' && 
        n.type_notification !== 'doctor_request'
      );*/
      console.log('🔵 [Notifications] Notifications non lues filtrées côté client (secrétaire):', filteredData.length, 'sur', data.length);
      if (filteredData.length > 0) {
        console.log('📊 [Notifications] Types de notifications trouvées pour secrétaire:', filteredData.map(n => n.type_notification));
      }
    }
    
    return filteredData;
  } catch (error) {
    console.error('❌ [Notifications] Erreur récupération notifications:', error);
    return [];
  }
};

/**
 * Récupérer toutes les notifications d'un utilisateur (lues et non lues)
 * @param {string} userId - ID de l'utilisateur
 * @param {string} userRole - Rôle de l'utilisateur ('doctor' ou 'secretary')
 * @param {number} limit - Nombre maximum de notifications à récupérer
 */
export const getAllNotifications = async (userId, userRole, limit = 50) => {
  try {
    const { data: user } = await supabase.from('users').select('tenant_id').eq('id', userId).single();
    const cabinetId = user?.tenant_id;

    let query = supabase
      .from('notifications_medecin_secretaire')
      .select(`
        *,
        medecin:users!notifications_medecin_secretaire_medecin_id_fkey(id, nom, prenom),
        secretaire:users!notifications_medecin_secretaire_secretaire_id_fkey(id, nom, prenom),
        patient:patients(id, nom, prenom)
      `)
      .order('created_at', { ascending: false })
      .limit(limit * 2);

    if (cabinetId) {
      query = query.eq('tenant_id', cabinetId);
    }

    // Filtrer selon le rôle
    if (userRole === 'doctor') {
      // Le médecin reçoit UNIQUEMENT les notifications "patient_on_way" et "demande_autorisation"
      query = query
        .eq('medecin_id', userId)
        .in('type_notification', ['patient_on_way', 'doctor_request', 'demande_autorisation']);
    }else if (userRole === 'secretary') {
  query = query
   // .not('secretaire_id', 'is', null)
    .neq('type_notification', 'patient_on_way')
    .neq('type_notification', 'doctor_request');
} 
    /*else if (userRole === 'secretary') {
      // TOUTES les secrétaires voient TOUTES les notifications destinées aux secrétaires
      // IMPORTANT: On ne filtre PAS par secretaire_id pour que toutes les secrétaires voient toutes les notifications
      // On ne filtre PAS non plus par type_notification côté serveur - on filtrera côté client
      // Cela garantit qu'on récupère TOUTES les notifications, puis on filtre
      console.log('🔵 [Notifications] Filtre secrétaire (getAllNotifications): AUCUN filtre côté serveur - récupération de TOUTES les notifications');
      console.log('🔵 [Notifications] User ID passé:', userId, '- Ce paramètre n\'est PAS utilisé pour filtrer les notifications secrétaire');
      // Pas de filtre - on récupère tout et on filtre côté client
    }*/

    console.log('🔍 [Notifications] Exécution de la requête getAllNotifications...');
    const { data, error } = await query;

    if (error) {
      console.error('❌ [Notifications] Erreur requête getAllNotifications:', error);
      console.error('❌ [Notifications] Détails de l\'erreur:', JSON.stringify(error, null, 2));
      throw error;
    }
    
    console.log('✅ [Notifications] Notifications récupérées (brutes):', data?.length || 0);
    
    // Filtrer côté client pour les secrétaires
    let filteredData = data || [];
    if (userRole === 'secretary' && data && data.length > 0) {
      // Exclure uniquement les notifications destinées aux médecins
      /*filteredData = data.filter(n => 
        n.type_notification !== 'patient_on_way' && 
        n.type_notification !== 'doctor_request'
      );*/
      console.log('🔵 [Notifications] Notifications filtrées côté client (secrétaire):', filteredData.length, 'sur', data.length);
      console.log('📊 [Notifications] Types de notifications trouvées pour secrétaire:', filteredData.map(n => n.type_notification));
      console.log('📊 [Notifications] IDs des notifications avec secretaire_id:', filteredData.map(n => ({ id: n.id, type: n.type_notification, secretaire_id: n.secretaire_id })));
      
      // Vérifier si toutes les notifications consultation_ended sont présentes
      const consultationEnded = filteredData.filter(n => n.type_notification === 'consultation_ended');
      console.log('📊 [Notifications] Notifications consultation_ended trouvées:', consultationEnded.length);
      if (consultationEnded.length > 0) {
        console.log('📊 [Notifications] Détails consultation_ended:', consultationEnded.map(n => ({ id: n.id, secretaire_id: n.secretaire_id, created_at: n.created_at })));
      }
      
      // Limiter à la limite demandée après filtrage
      filteredData = filteredData.slice(0, limit);
    }
    
    return filteredData;
  } catch (error) {
    console.error('❌ [Notifications] Erreur récupération toutes notifications:', error);
    return [];
  }
};

/**
 * Marquer toutes les notifications comme lues
 * @param {string} userId - ID de l'utilisateur
 * @param {string} userRole - Rôle de l'utilisateur ('doctor' ou 'secretary')
 */
export const markAllAsRead = async (userId, userRole) => {
  try {
    const { data: user } = await supabase.from('users').select('tenant_id').eq('id', userId).single();
    const cabinetId = user?.tenant_id;

    let query = supabase
      .from('notifications_medecin_secretaire')
      .update({ 
        lu: true, 
        lu_at: new Date().toISOString() 
      })
      .eq('lu', false);

    if (cabinetId) {
      query = query.eq('tenant_id', cabinetId);
    }

    // Filtrer selon le rôle
    if (userRole === 'doctor') {
      // Le médecin marque UNIQUEMENT ses notifications autorisées
      query = query
        .eq('medecin_id', userId)
        .in('type_notification', ['patient_on_way', 'doctor_request', 'demande_autorisation']);
    } else if (userRole === 'secretary') {
      // TOUTES les secrétaires peuvent marquer toutes les notifications secrétaire comme lues
      // On exclut uniquement les notifications destinées aux médecins
      query = query
        .neq('type_notification', 'patient_on_way')
        .neq('type_notification', 'doctor_request');
      // Note: On ne filtre PAS par secretaire_id pour que toutes les secrétaires puissent marquer toutes les notifications
    }

    const { error } = await query;

    if (error) throw error;
    
    console.log('✅ [Notifications] Toutes les notifications marquées comme lues');
    return true;
  } catch (error) {
    console.error('❌ [Notifications] Erreur marquage toutes comme lues:', error);
    throw error;
  }
};

/**
 * Supprimer une notification
 * @param {string} notificationId - ID de la notification
 */
export const deleteNotification = async (notificationId) => {
  try {
    const { error } = await supabase
      .from('notifications_medecin_secretaire')
      .delete()
      .eq('id', notificationId);

    if (error) throw error;
    
    console.log('✅ [Notifications] Notification supprimée:', notificationId);
    return true;
  } catch (error) {
    console.error('❌ [Notifications] Erreur suppression notification:', error);
    throw error;
  }
};

/**
 * S'abonner aux notifications en temps réel
 * @param {string} userId - ID de l'utilisateur
 * @param {string} userRole - Rôle de l'utilisateur ('doctor' ou 'secretary')
 * @param {function} callback - Fonction à appeler lors d'une nouvelle notification
 */
export const subscribeToNotifications = (userId, userRole, callback) => {
  try {
    if (userRole === 'doctor') {
      // Le médecin écoute uniquement ses notifications
      const channel = supabase
        .channel(`notifications_doctor_${userId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'notifications_medecin_secretaire',
          filter: `medecin_id=eq.${userId}`
        }, (payload) => {
          console.log('🔔 [Notifications] Changement détecté:', payload);
          if (callback) callback(payload);
        })
        .subscribe((status) => {
          console.log('📡 [Notifications] Statut abonnement:', status);
        });
      return channel;
    } else if (userRole === 'secretary') {
        // Filtrer par tenant_id via getUnreadNotifications callback logic ou au moment de récupérer les events.
      // Pour une vraie isolation RLS, la souscription doit être associée au filtre eq.tenant_id ou via supabase.auth
      // Etant donné la limitation du channel public, nous filtrons toutes les notifications sauf celles des médecins
      const channel = supabase
        .channel(`notifications_secretaires_shared`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'notifications_medecin_secretaire',
          //filter: 'secretaire_id=not.is.null'
          // Pas de filtre strict sur cabinet ici pour ne pas avoir de problème d'async dans setup, on gèrera via db view/rls
        }, (payload) => {
          console.log('🔔 [Notifications] Changement détecté:', payload);
          
          // Filtrer côté client pour les secrétaires (exclure les notifications médecins)
          if (payload.new) {
            const notificationType = payload.new.type_notification;
            const isForDoctors = ['patient_on_way', 'doctor_request'].includes(notificationType);
            if (isForDoctors) {
              console.log('⚠️ [Notifications] Notification ignorée (destinée aux médecins)');
              return;
            }
            console.log('✅ [Notifications] Notification acceptée (destinée aux secrétaires - visible par toutes)');
          }
          
          if (callback) callback(payload);
        })
        .subscribe((status) => {
          console.log('📡 [Notifications] Statut abonnement:', status);
        });
      return channel;
    }
    
    return null;
  } catch (error) {
    console.error('❌ [Notifications] Erreur abonnement temps réel:', error);
    return null;
  }
};

/**
 * Se désabonner des notifications
 * @param {object} channel - Canal Supabase à désabonner
 */
export const unsubscribeFromNotifications = async (channel) => {
  try {
    if (channel) {
      await supabase.removeChannel(channel);
      console.log('✅ [Notifications] Désabonnement effectué');
    }
  } catch (error) {
    console.error('❌ [Notifications] Erreur désabonnement:', error);
  }
};
