import { supabase } from '../lib/supabase';

/**
 * Met à jour le statut dossier du patient lors d'un nouveau rendez-vous.
 */
const patientStatusService = {
  async updatePatientStatusOnAppointment(patientId) {
    if (!patientId) {
      return { patientWasInactive: false };
    }

    const { data: patient, error: fetchError } = await supabase
      .from('patients')
      .select('id, statut_patient, actif')
      .eq('id', patientId)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    const wasInactive =
      patient?.statut_patient === 'inactif' || patient?.actif === false;

    if (!wasInactive) {
      return { patientWasInactive: false };
    }

    const { error: updateError } = await supabase
      .from('patients')
      .update({
        statut_patient: 'actif',
        actif: true,
        derniere_activite: new Date().toISOString(),
      })
      .eq('id', patientId);

    if (updateError) {
      throw updateError;
    }

    return { patientWasInactive: true };
  },
};

export default patientStatusService;
