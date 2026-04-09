import { supabase } from '../../lib/supabase';

export const consultationWorkflowService = {
  // Récupère toutes les données liées à une consultation en parallèle
  fetchWorkflowDetails: async (consultationId) => {
    const requests = [
      supabase.from('constantes_consultation').select('*, constantes(nom, unite, description)').eq('consultation_id', consultationId),
      supabase.from('ordonnances').select('*, lignes_ordonnance(*, medicaments(nom, posologie_defaut))').eq('consultation_id', consultationId),
      supabase.from('certificats_medicaux').select('*, types_certificats(nom, description)').eq('consultation_id', consultationId),
      supabase.from('actes_consultation').select('*, types_actes(nom, description, tarif_defaut)').eq('consultation_id', consultationId),
      supabase.from('examens_prescrits').select('*').eq('consultation_id', consultationId),
      supabase.from('analyses_labo_prescrites').select('*').eq('consultation_id', consultationId),
      supabase.from('prescriptions_pharmacie').select('*').eq('consultation_id', consultationId),
      supabase.from('signes_cliniques_consultation').select('*, signes_cliniques(nom, description)').eq('consultation_id', consultationId),
      supabase.from('examens_appareils').select('*, appareils(nom, description)').eq('consultation_id', consultationId),
      supabase.from('syntheses_consultation').select('*, elements_synthese(nom, description)').eq('consultation_id', consultationId),
      supabase.from('diagnostics_consultation').select('*, diagnostics(nom, description)').eq('consultation_id', consultationId),
      supabase.from('antecedents_patients').select('*, antecedents(nom, description)').eq('consultation_id', consultationId)
    ];

    const results = await Promise.all(requests);

    // Mappage des résultats
    return {
      constantes: results[0].data || [],
      ordonnances: results[1].data || [],
      certificats: results[2].data || [],
      actes: results[3].data || [],
      examens: results[4].data || [],
      analysesLabo: results[5].data || [],
      prescriptionsPharmacie: results[6].data || [],
      signesCliniques: results[7].data || [],
      examensAppareils: results[8].data || [],
      syntheses: results[9].data || [],
      diagnostics: results[10].data || [],
      antecedents: results[11].data || []
    };
  },

  // Récupère la facture associée
  fetchFacture: async (consultationId) => {
    const { data, error } = await supabase
      .from('factures')
      .select('*, lignes_facture(*, actes_consultation(*, types_actes(nom, description)))')
      .eq('consultation_id', consultationId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },
  
  // Crée une nouvelle facture
  createFacture: async (consultation, montantTotal) => {
    const { data, error } = await supabase
      .from('factures')
      .insert({
        consultation_id: consultation.id,
        patient_id: consultation.patient_id,
        numero_facture: `FAC-${Date.now()}`,
        date_facture: new Date().toISOString().split('T')[0],
        montant_ht: montantTotal,
        tva: 0,
        montant_ttc: montantTotal,
        montant_paye: 0,
        statut_paiement: 'en_attente',
        assurance_id: consultation.patients?.assurances?.id || null
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};