import { supabase, fetchWithAuth, insertWithAuth, updateWithAuth, deleteWithAuth } from './supabase.js';

// ===== SERVICES SÉCURISÉS POUR LES UTILISATEURS =====
export const secureUserService = {
  // Récupérer tous les utilisateurs (avec authentification)
  async getAll() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Utilisateur non authentifié');
    }
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Récupérer un utilisateur par ID (avec authentification)
  async getById(id) {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Utilisateur non authentifié');
    }
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Récupérer les médecins (avec authentification)
  async getDoctors() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Utilisateur non authentifié');
    }
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'doctor')
      .order('nom', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  // Récupérer les secrétaires (avec authentification)
  async getSecretaries() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Utilisateur non authentifié');
    }
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'secretary')
      .order('nom', { ascending: true });
    
    if (error) throw error;
    return data;
  }
};

// ===== SERVICES SÉCURISÉS POUR LES PATIENTS =====
export const securePatientService = {
  // Récupérer tous les patients (avec authentification)
  async getAll() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Utilisateur non authentifié');
    }
    
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .order('nom', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  // Récupérer un patient par ID (avec authentification)
  async getById(id) {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Utilisateur non authentifié');
    }
    
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Créer un nouveau patient (avec authentification)
  async create(patientData) {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Utilisateur non authentifié');
    }
    
    const { data, error } = await supabase
      .from('patients')
      .insert([{ ...patientData, created_by: session.user.id }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Mettre à jour un patient (avec authentification)
  async update(id, updates) {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Utilisateur non authentifié');
    }
    
    const { data, error } = await supabase
      .from('patients')
      .update({ ...updates, updated_by: session.user.id })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Supprimer un patient (avec authentification)
  async delete(id) {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Utilisateur non authentifié');
    }
    
    const { error } = await supabase
      .from('patients')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// ===== SERVICES SÉCURISÉS POUR LES RENDEZ-VOUS =====
export const secureAppointmentService = {
  // Récupérer tous les rendez-vous (avec authentification)
  async getAll() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Utilisateur non authentifié');
    }
    
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        patient:patients(nom, prenom, telephone),
        medecin:users(nom, prenom, specialite)
      `)
      .order('date_heure', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  // Récupérer les rendez-vous d'un médecin (avec authentification)
  async getByDoctor(medecinId, date = null) {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Utilisateur non authentifié');
    }
    
    let query = supabase
      .from('appointments')
      .select(`
        *,
        patient:patients(nom, prenom, telephone)
      `)
      .eq('medecin_id', medecinId)
      .order('date_heure', { ascending: true });

    if (date) {
      query = query.gte('date_heure', date + 'T00:00:00')
        .lt('date_heure', date + 'T23:59:59');
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Récupérer les rendez-vous d'un patient (avec authentification)
  async getByPatient(patientId) {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Utilisateur non authentifié');
    }
    
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        medecin:users(nom, prenom, specialite)
      `)
      .eq('patient_id', patientId)
      .order('date_heure', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  // Récupérer les rendez-vous du jour (avec authentification)
  async getToday() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Utilisateur non authentifié');
    }
    
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        patient:patients(nom, prenom, telephone),
        medecin:users(nom, prenom, specialite)
      `)
      .gte('date_heure', today + 'T00:00:00')
      .lt('date_heure', today + 'T23:59:59')
      .order('date_heure', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  // Créer un nouveau rendez-vous (avec authentification)
  async create(appointmentData) {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Utilisateur non authentifié');
    }
    
    const { data, error } = await supabase
      .from('appointments')
      .insert([{ ...appointmentData, created_by: session.user.id }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Mettre à jour un rendez-vous (avec authentification)
  async update(id, updates) {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Utilisateur non authentifié');
    }
    
    const { data, error } = await supabase
      .from('appointments')
      .update({ ...updates, updated_by: session.user.id })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Supprimer un rendez-vous (avec authentification)
  async delete(id) {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Utilisateur non authentifié');
    }
    
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Mettre à jour plusieurs rendez-vous en lot
  async batchUpdate(updatesArray) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Utilisateur non authentifié');
    }
    const updatePromises = updatesArray.map(({ id, updates }) => 
      supabase
        .from('appointments')
        .update({ ...updates, updated_by: session.user.id })
        .eq('id', id)
        .select()
        .single()
    );
    const results = await Promise.all(updatePromises);
    const errors = results.filter(r => r.error).map(r => r.error);
    if (errors.length > 0) {
      throw new Error('Erreur lors de la mise à jour de plusieurs rendez-vous: ' + errors.map(e => e.message).join(', '));
    }
    return results.map(r => r.data);
  },

  // Supprimer plusieurs rendez-vous en lot
  async batchDelete(idsArray) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Utilisateur non authentifié');
    }
    const { error } = await supabase
      .from('appointments')
      .delete()
      .in('id', idsArray);
    
    if (error) throw error;
  }
};

// ===== FONCTION UTILITAIRE POUR VÉRIFIER L'AUTHENTIFICATION =====
export const checkAuthentication = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error('❌ Erreur lors de la vérification de l\'authentification:', error);
    return { authenticated: false, error };
  }
  
  if (!session) {
    return { authenticated: false, error: 'Aucune session active' };
  }
  
  return { 
    authenticated: true, 
    user: session.user, 
    accessToken: session.access_token 
  };
};

// ===== FONCTION POUR OBTENIR LES DONNÉES AVEC TOKEN =====
export const fetchWithToken = async (table, options = {}) => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('Utilisateur non authentifié');
  }
  
  // Utiliser le token d'accès pour les requêtes
  const { data, error } = await supabase
    .from(table)
    .select(options.select || '*')
    .order(options.orderBy || 'created_at', { ascending: options.ascending || false });
  
  if (error) throw error;
  return data;
};

// ===== SERVICE POUR LA FILE D'ATTENTE (AVEC AUTHENTIFICATION) =====
export const waitingQueueService = {
  // Récupérer toute la file d'attente (avec authentification)
  async getAll() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Utilisateur non authentifié');
    }
    
    const { data, error } = await supabase
      .from('waiting_queue')
      .select(`
        *,
        patient:patients(nom, prenom, telephone),
        medecin:users(nom, prenom, specialite)
      `)
      .order('order_position', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  // Récupérer la file d'attente d'un médecin (avec authentification)
  async getByDoctor(medecinId) {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Utilisateur non authentifié');
    }
    
    const { data, error } = await supabase
      .from('waiting_queue')
      .select(`
        *,
        patient:patients(nom, prenom, telephone)
      `)
      .eq('medecin_id', medecinId)
      .order('order_position', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  // Ajouter un patient à la file d'attente (avec authentification)
  async addToQueue(queueData) {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Utilisateur non authentifié');
    }
    
    const { data, error } = await supabase
      .from('waiting_queue')
      .insert([{ ...queueData, added_by: session.user.id }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Mettre à jour le statut d'un patient (avec authentification)
  async updateStatus(id, status) {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Utilisateur non authentifié');
    }
    
    const updates = { status };
    
    if (status === 'present') {
      updates.called_at = new Date().toISOString();
    } else if (status === 'termine') {
      updates.consultation_finished_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('waiting_queue')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Retirer un patient de la file d'attente (avec authentification)
  async removeFromQueue(id) {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Utilisateur non authentifié');
    }
    
    const { error } = await supabase
      .from('waiting_queue')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Réorganiser la file d'attente (avec authentification)
  async reorderQueue(medecinId, newOrder) {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Utilisateur non authentifié');
    }
    
    const updates = newOrder.map((item, index) => ({
      id: item.id,
      order_position: index + 1
    }));

    const { error } = await supabase
      .from('waiting_queue')
      .upsert(updates);
    
    if (error) throw error;
  },

  // Appeler le patient suivant (avec authentification)
  async callNextPatient(medecinId) {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Utilisateur non authentifié');
    }
    
    const { data: nextPatient, error } = await supabase
      .from('waiting_queue')
      .select('*')
      .eq('medecin_id', medecinId)
      .eq('status', 'waiting')
      .order('order_position', { ascending: true })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned

    if (nextPatient) {
      await this.updateStatus(nextPatient.id, 'present');
    }

    return nextPatient;
  }
};
