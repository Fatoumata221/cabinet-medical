import { supabase } from '../../lib/supabase';

/**
 * Fetches the raw list of completed consultations from the database.
 * @returns {Promise<Array>} A list of consultation objects.
 */
const fetchRawCompletedConsultations = async () => {
  const { data, error } = await supabase
    .from('consultations')
    .select(`
      id,
      patient_id,
      medecin_id,
      date_consultation,
      motif_consultation,
      notes_generales,
      statut,
      created_at,
      updated_at,
      patients (
        id, nom, prenom, date_naissance, sexe, telephone, email, numero_dossier, adresse,
        assurances (nom, taux_remboursement)
      ),
      users (id, nom, prenom, specialite)
    `)
    .eq('statut', 'terminee')
    .order('date_consultation', { ascending: false })
    .limit(100);

  if (error) {
    console.error('❌ Error fetching completed consultations:', error);
    throw error;
  }
  return data || [];
};

/**
 * For a group of duplicate consultations (same patient/doctor/day),
 * this function finds the best one to keep based on which one has associated
 * workflow data (e.g., ordonnances, actes). It prioritizes the consultation
 * with the most workflow items, falling back to the most recently updated one.
 * @param {Array} group - A group of consultation objects.
 * @returns {Promise<Object>} The best consultation to keep from the group.
 */
const findBestConsultationInGroup = async (group) => {
  console.log(`🔄 Deduplicating: ${group.length} consultations for key ${group[0].patient_id}_${group[0].medecin_id}_${new Date(group[0].date_consultation).toISOString().split('T')[0]}, checking workflows...`);
  
  const consultationsWithWorkflows = await Promise.all(
    group.map(async (consultation) => {
      try {
        const [constantes, ordonnances, actes, examens, analysesLabo, prescriptionsPharmacie] = await Promise.all([
          supabase.from('constantes_consultation').select('id', { count: 'exact', head: true }).eq('consultation_id', consultation.id),
          supabase.from('ordonnances').select('id', { count: 'exact', head: true }).eq('consultation_id', consultation.id),
          supabase.from('actes_consultation').select('id', { count: 'exact', head: true }).eq('consultation_id', consultation.id),
          supabase.from('examens_prescrits').select('id', { count: 'exact', head: true }).eq('consultation_id', consultation.id),
          supabase.from('analyses_labo_prescrites').select('id', { count: 'exact', head: true }).eq('consultation_id', consultation.id),
          supabase.from('prescriptions_pharmacie').select('id', { count: 'exact', head: true }).eq('consultation_id', consultation.id)
        ]);
        
        const totalWorkflows = (constantes.count || 0) + 
                              (ordonnances.count || 0) + 
                              (actes.count || 0) + 
                              (examens.count || 0) + 
                              (analysesLabo.count || 0) + 
                              (prescriptionsPharmacie.count || 0);
        
        return { consultation, totalWorkflows };
      } catch (err) {
        console.warn(`⚠️ Error checking workflows for consultation ${consultation.id}:`, err);
        return { consultation, totalWorkflows: 0 };
      }
    })
  );
  
  consultationsWithWorkflows.sort((a, b) => {
    if (b.totalWorkflows !== a.totalWorkflows) {
      return b.totalWorkflows - a.totalWorkflows;
    }
    const dateA = a.consultation.updated_at ? new Date(a.consultation.updated_at) : new Date(a.consultation.created_at);
    const dateB = b.consultation.updated_at ? new Date(b.consultation.updated_at) : new Date(b.consultation.created_at);
    return dateB - dateA;
  });
  
  const best = consultationsWithWorkflows[0];
  console.log(`✅ Kept consultation: ${best.consultation.id} with ${best.totalWorkflows} workflows`);
  if (consultationsWithWorkflows.length > 1) {
    console.log(`   (Other consultations in group:`, consultationsWithWorkflows.slice(1).map(c => ({ id: c.consultation.id, workflows: c.totalWorkflows })));
  }
  
  return best.consultation;
};

/**
 * Takes a list of consultations and returns a deduplicated list.
 * For consultations on the same day for the same patient and doctor, it keeps
 * only the one with the most associated data.
 * @param {Array<Object>} consultations - The raw list of consultations.
 * @returns {Promise<Array<Object>>} The deduplicated list of consultations.
 */
const deduplicateConsultations = async (consultations) => {
  const groupedConsultations = new Map();
  (consultations || []).forEach(consultation => {
    const dateKey = new Date(consultation.date_consultation).toISOString().split('T')[0];
    const key = `${consultation.patient_id}_${consultation.medecin_id}_${dateKey}`;
    if (!groupedConsultations.has(key)) {
      groupedConsultations.set(key, []);
    }
    groupedConsultations.get(key).push(consultation);
  });
  
  const promises = Array.from(groupedConsultations.values()).map(group => {
    if (group.length === 1) {
        return Promise.resolve(group[0]);
    }
    return findBestConsultationInGroup(group);
  });

  return Promise.all(promises);
};

/**
 * Main service function to fetch, process, and return the history of completed consultations.
 * It fetches completed consultations, deduplicates them based on workflow data, and sorts them
 * by the most recent date.
 * @returns {Promise<Array<Object>>} The final sorted and deduplicated list of consultations.
 */
export const fetchHistoriqueConsultations = async () => {
  console.log('🔄 Loading completed consultations...');
  const rawData = await fetchRawCompletedConsultations();
  console.log(`✅ Found ${rawData.length} raw consultations. Starting deduplication...`);
  
  const uniqueConsultations = await deduplicateConsultations(rawData);
  console.log(`✅ Deduplicated consultations: ${uniqueConsultations.length} (${rawData.length} before).`);
  
  const sortedData = uniqueConsultations.sort((a, b) => {
    const dateA = a.updated_at ? new Date(a.updated_at) : new Date(a.date_consultation);
    const dateB = b.updated_at ? new Date(b.updated_at) : new Date(b.date_consultation);
    return dateB - dateA;
  });
  
  return sortedData;
};
