import { supabase } from '../lib/supabase';

class RealtimeNotificationService {
  constructor() {
    this.channels = new Map();
  }

  // Récupérer notifications unifiées (realtime + medecin_secretaire)
  async getUnifiedNotifications(userId) {
    try {
      const profileId = await this.resolveProfileId(userId);
      // Récupérer le rôle de l'utilisateur (profil)
      let userRole = null;
      try {
        if (profileId) {
          const { data: roleRow } = await supabase
            .from('users')
            .select('role')
            .eq('id', profileId)
            .single();
          userRole = roleRow?.role || null;
        } else {
          // Dernier recours: métadonnées de session
          const { data: { session } } = await supabase.auth.getSession();
          userRole = session?.user?.user_metadata?.role || session?.user?.app_metadata?.role || null;
        }
      } catch (e) {
        console.warn('[RealtimeNotification] Impossible de récupérer le rôle utilisateur:', e);
      }

      // Construire les requêtes en évitant toute comparaison UUID vs BIGINT
      let rtPromise = Promise.resolve({ data: [] });
      if (profileId) {
        rtPromise = supabase
          .from('notifications_realtime')
          .select('*')
          .eq('user_id', profileId)
          .order('created_at', { ascending: false });
      }

      let msPromise;
      if (userRole === 'secretary' || userRole === 'admin') {
        msPromise = supabase
          .from('notifications_medecin_secretaire')
          .select('*')
          .order('created_at', { ascending: false });
      } else if (profileId) {
        msPromise = supabase
          .from('notifications_medecin_secretaire')
          .select('*')
          .or(`medecin_id.eq.${profileId},secretaire_id.eq.${profileId}`)
          .order('created_at', { ascending: false });
      } else {
        msPromise = Promise.resolve({ data: [] });
      }

      const [rtRes, msRes] = await Promise.all([rtPromise, msPromise]);

      const listRt = Array.isArray(rtRes.data) ? rtRes.data.map(n => ({
        ...n,
        source: 'realtime'
      })) : [];

      const listMs = Array.isArray(msRes.data) ? msRes.data.map(n => ({
        ...n,
        source: 'medecin_secretaire',
        // Harmoniser champs manquants pour l'affichage du header
        // Si pas de titre stocké, utiliser le message comme titre pour être explicite.
        titre: n.titre || n.message || 'Notification',
        message: n.message,
        priorite: n.priorite || 'normale',
      })) : [];

      return [...listRt, ...listMs].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } catch (error) {
      console.error('❌ [RealtimeNotification] Erreur getUnifiedNotifications:', error);
      return [];
    }
  }

  async resolveProfileId(userId) {
    let queryUserId = null;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const authId = session?.user?.id;
      const email = session?.user?.email;
      // 1) Essayer via auth_id (UUID)
      if (authId) {
        const { data: byAuth } = await supabase
          .from('users')
          .select('id')
          .eq('auth_id', authId)
          .single();
        if (byAuth?.id) return byAuth.id;
      }
      // 2) Fallback via email
      if (email) {
        const { data: byEmail } = await supabase
          .from('users')
          .select('id')
          .eq('email', email)
          .single();
        if (byEmail?.id) return byEmail.id;
      }
    } catch (e) {
      console.warn('[RealtimeNotification] resolveProfileId failed:', e);
    }
    return queryUserId; // null si non résolu
  }

  // Créer une notification
  async createNotification({
    fromUserId,
    toUserId,
    type,
    patientId,
    waitingQueueId,
    message,
    data = {},
    expiresInMinutes = 5
  }) {
    try {
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes);

      // Convertir les UUIDs en IDs de profil utilisateur si nécessaire
      let fromUserProfileId = fromUserId;
      let toUserProfileId = toUserId;

      // Si fromUserId est un UUID, récupérer l'ID du profil
      if (typeof fromUserId === 'string' && fromUserId.includes('-')) {
        const { data: fromProfile } = await supabase
          .from('users')
          .select('id')
          .eq('email', (await supabase.auth.getSession()).data.session?.user?.email)
          .single();
        if (fromProfile?.id) {
          fromUserProfileId = fromProfile.id;
        }
      }

      // Si toUserId est un UUID, récupérer l'ID du profil
      if (typeof toUserId === 'string' && toUserId.includes('-')) {
        // Pour toUserId, on doit récupérer l'email depuis la session ou les métadonnées
        // Pour l'instant, on utilise une approche simplifiée
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email) {
          const { data: toProfile } = await supabase
            .from('users')
            .select('id')
            .eq('email', session.user.email)
            .single();
          if (toProfile?.id) {
            toUserProfileId = toProfile.id;
          }
        }
      }

      // Adapter les types pour la table existante
      let adaptedType = type;
      let titre = '';
      
      switch (type) {
        case 'call_patient':
          adaptedType = 'patient_called';
          titre = 'Appel Patient';
          break;
        case 'patient_called':
          adaptedType = 'patient_entered';
          titre = 'Patient Appelé';
          break;
        case 'consultation_started':
          adaptedType = 'patient_status_change';
          titre = 'Consultation Commencée';
          break;
        case 'consultation_finished':
          adaptedType = 'consultation_terminee';
          titre = 'Consultation Terminée';
          break;
        default:
          titre = 'Notification';
      }

      const { data: notification, error } = await supabase
        .from('notifications_realtime')
        .insert([{
          user_id: toUserProfileId, // Utiliser l'ID du profil utilisateur
          type_notification: adaptedType,
          titre,
          message,
          data: {
            ...data,
            from_user_id: fromUserProfileId,
            patient_id: patientId,
            waiting_queue_id: waitingQueueId,
            original_type: type
          },
          priorite: 'haute', // Priorité haute pour les notifications temps réel
          expires_at: expiresAt.toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ [RealtimeNotification] Erreur création notification:', error);
        throw error;
      }

      console.log('✅ [RealtimeNotification] Notification créée:', notification);
      return notification;
    } catch (error) {
      console.error('❌ [RealtimeNotification] Erreur:', error);
      // Ne pas faire échouer l'application si les notifications ne marchent pas
      return null;
    }
  }

  // Demander d'appeler un patient (médecin → secrétaire)
  async requestCallPatient(doctorId, secretaryId, patientId, waitingQueueId, patientName) {
    return this.createNotification({
      fromUserId: doctorId,
      toUserId: secretaryId,
      type: 'call_patient',
      patientId,
      waitingQueueId,
      message: `Appeler ${patientName} - Le médecin demande d'appeler ce patient`,
      data: {
        patientName,
        callRequestedAt: new Date().toISOString(),
        countdownSeconds: 60 // Compteur de 60 secondes
      },
      expiresInMinutes: 2
    });
  }

  // Confirmer l'appel (secrétaire → médecin)
  async confirmPatientCalled(secretaryId, doctorId, patientId, waitingQueueId, patientName) {
    return this.createNotification({
      fromUserId: secretaryId,
      toUserId: doctorId,
      type: 'patient_called',
      patientId,
      waitingQueueId,
      message: `${patientName} a été appelé et est en route`,
      data: {
        patientName,
        calledAt: new Date().toISOString()
      },
      expiresInMinutes: 1
    });
  }

  // Notifier le début de consultation
  async notifyConsultationStarted(doctorId, secretaryId, patientId, waitingQueueId, patientName) {
    return this.createNotification({
      fromUserId: doctorId,
      toUserId: secretaryId,
      type: 'consultation_started',
      patientId,
      waitingQueueId,
      message: `Consultation commencée avec ${patientName}`,
      data: {
        patientName,
        startedAt: new Date().toISOString()
      },
      expiresInMinutes: 1
    });
  }

  // Notifier la fin de consultation
  async notifyConsultationFinished(doctorId, secretaryId, patientId, waitingQueueId, patientName) {
    return this.createNotification({
      fromUserId: doctorId,
      toUserId: secretaryId,
      type: 'consultation_finished',
      patientId,
      waitingQueueId,
      message: `Consultation terminée avec ${patientName}`,
      data: {
        patientName,
        finishedAt: new Date().toISOString()
      },
      expiresInMinutes: 1
    });
  }

  // Récupérer les notifications pour un utilisateur
  async getNotifications(userId, status = 'pending') {
    try {
      // Vérifier si userId est un UUID (Supabase Auth) ou un bigint (profil utilisateur)
      let queryUserId = userId;
      
      // Si c'est un UUID, on doit d'abord récupérer l'ID du profil utilisateur
      if (typeof userId === 'string' && userId.includes('-')) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email) {
          const { data: userProfile } = await supabase
            .from('users')
            .select('id')
            .eq('email', session.user.email)
            .single();
          
          if (userProfile?.id) {
            queryUserId = userProfile.id;
          } else {
            console.warn('⚠️ [RealtimeNotification] Profil utilisateur non trouvé pour:', session.user.email);
            return [];
          }
        } else {
          console.warn('⚠️ [RealtimeNotification] Session utilisateur non trouvée');
          return [];
        }
      }

      const { data, error } = await supabase
        .from('notifications_realtime')
        .select(`
          *,
          user:users!notifications_realtime_user_id_fkey(nom, prenom, role)
        `)
        .eq('user_id', queryUserId)
        .eq('lu', status === 'pending' ? false : true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [RealtimeNotification] Erreur récupération notifications:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('❌ [RealtimeNotification] Erreur:', error);
      throw error;
    }
  }

  // Marquer une notification comme lue
  async markAsRead(notificationId) {
    try {
      const { error } = await supabase
        .from('notifications_realtime')
        .update({ 
          lu: true,
          lu_at: new Date().toISOString()
        })
        .eq('id', notificationId);

      if (error) {
        console.error('❌ [RealtimeNotification] Erreur marquage lu:', error);
        throw error;
      }

      console.log('✅ [RealtimeNotification] Notification marquée comme lue');
    } catch (error) {
      console.error('❌ [RealtimeNotification] Erreur:', error);
      throw error;
    }
  }

  // Confirmer une notification
  async confirmNotification(notificationId) {
    try {
      const { error } = await supabase
        .from('notifications_realtime')
        .update({ 
          lu: true,
          lu_at: new Date().toISOString()
        })
        .eq('id', notificationId);

      if (error) {
        console.error('❌ [RealtimeNotification] Erreur confirmation:', error);
        throw error;
      }

      console.log('✅ [RealtimeNotification] Notification confirmée');
    } catch (error) {
      console.error('❌ [RealtimeNotification] Erreur:', error);
      throw error;
    }
  }

  // S'abonner aux notifications en temps réel
  async subscribeToNotifications(userId, callback) {
    const channelName = `realtime_notifications_${userId}`;
    
    console.log('🔌 [RealtimeNotification] Tentative d\'abonnement pour userId:', userId);
    
    // Nettoyer l'ancien canal s'il existe
    if (this.channels.has(channelName)) {
      console.log('🧹 [RealtimeNotification] Nettoyage de l\'ancien canal');
      this.unsubscribeFromNotifications(userId);
    }

    let channel = null;
    try {
      // Convertir l'UUID en ID de profil utilisateur si nécessaire
      const queryUserId = await this.resolveProfileId(userId);
      if (!queryUserId) {
        console.error('❌ [RealtimeNotification] Impossible de résoudre le profil utilisateur pour l\'abonnement');
        return null;
      }

      console.log('🔗 [RealtimeNotification] Création du canal:', channelName, 'pour user_id:', queryUserId);

      channel = supabase.channel(channelName)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'notifications_realtime',
          filter: `user_id=eq.${queryUserId}`
        }, (payload) => {
          console.log('🔔 [RealtimeNotification] Nouvelle notification reçue:', payload);
          if (payload.new && callback) {
            callback(payload.new);
          }
        })
        .subscribe((status, err) => {
          console.log('📡 [RealtimeNotification] Statut d\'abonnement:', status);
          if (err) {
            console.error('❌ [RealtimeNotification] Erreur d\'abonnement:', err);
          }
          
          if (status === 'SUBSCRIBED') {
            console.log('✅ [RealtimeNotification] Abonnement créé avec succès pour utilisateur:', queryUserId);
          } else if (status === 'CHANNEL_ERROR') {
            console.error('❌ [RealtimeNotification] Erreur d\'abonnement CHANNEL_ERROR:', status);
            console.error('❌ [RealtimeNotification] Détails de l\'erreur:', err);
            // Tentative de reconnexion après 5 secondes
            setTimeout(() => {
              console.log('🔄 [RealtimeNotification] Tentative de reconnexion...');
              this.subscribeToNotifications(userId, callback);
            }, 5000);
          } else if (status === 'TIMED_OUT') {
            console.warn('⚠️ [RealtimeNotification] Timeout d\'abonnement:', status);
            // Tentative de reconnexion après 3 secondes
            setTimeout(() => {
              console.log('🔄 [RealtimeNotification] Tentative de reconnexion après timeout...');
              this.subscribeToNotifications(userId, callback);
            }, 3000);
          } else if (status === 'CLOSED') {
            console.log('ℹ️ [RealtimeNotification] Canal fermé:', status);
          } else {
            console.log('ℹ️ [RealtimeNotification] Statut d\'abonnement:', status);
          }
        });

      this.channels.set(channelName, channel);
    } catch (error) {
      console.error('❌ [RealtimeNotification] Impossible de créer l\'abonnement:', error);
      // Tentative de reconnexion après 10 secondes en cas d'erreur
      setTimeout(() => {
        console.log('🔄 [RealtimeNotification] Tentative de reconnexion après erreur...');
        this.subscribeToNotifications(userId, callback);
      }, 10000);
    }

    return channel;
  }

  // S'abonner aux deux sources de notifications
  async subscribeToUnifiedNotifications(userId, callback) {
    const profileId = await this.resolveProfileId(userId);
    const key = `unified_${profileId}`;
    // Cleanup any existing
    if (this.channels.has(key)) {
      this.unsubscribeFromNotifications(key);
    }

    const channels = [];
    try {
      // notifications_realtime by user_id
      const chRt = supabase.channel(`rt_${profileId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'notifications_realtime',
          filter: `user_id=eq.${profileId}`
        }, (payload) => {
          if (payload.new) callback({ ...payload.new, source: 'realtime' });
        })
        .subscribe();
      channels.push(chRt);

      // notifications_medecin_secretaire by medecin_id
      const chMsDoc = supabase.channel(`ms_doc_${profileId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications_medecin_secretaire',
          filter: `medecin_id=eq.${profileId}`
        }, (payload) => {
          if (payload.new) callback({ ...payload.new, source: 'medecin_secretaire' });
        })
        .subscribe();
      channels.push(chMsDoc);

      // notifications_medecin_secretaire by secretaire_id
      const chMsSec = supabase.channel(`ms_sec_${profileId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications_medecin_secretaire',
          filter: `secretaire_id=eq.${profileId}`
        }, (payload) => {
          if (payload.new) callback({ ...payload.new, source: 'medecin_secretaire' });
        })
        .subscribe();
      channels.push(chMsSec);

      this.channels.set(key, channels);
    } catch (e) {
      console.error('[RealtimeNotification] subscribeToUnifiedNotifications error:', e);
    }
    return channels;
  }

  // Se désabonner des notifications
  unsubscribeFromNotifications(userId) {
    const channelName = `realtime_notifications_${userId}`;
    const channel = this.channels.get(channelName);
    
    if (channel) {
      supabase.removeChannel(channel);
      this.channels.delete(channelName);
      console.log('✅ [RealtimeNotification] Désabonnement pour utilisateur:', userId);
    }
  }

  // Nettoyer toutes les notifications expirées
  async cleanupExpiredNotifications() {
    try {
      const { error } = await supabase
        .from('notifications_realtime')
        .delete()
        .lt('expires_at', new Date().toISOString());

      if (error) {
        console.error('❌ [RealtimeNotification] Erreur nettoyage:', error);
        throw error;
      }

      console.log('✅ [RealtimeNotification] Notifications expirées nettoyées');
    } catch (error) {
      console.error('❌ [RealtimeNotification] Erreur:', error);
      throw error;
    }
  }
}

export default new RealtimeNotificationService();
