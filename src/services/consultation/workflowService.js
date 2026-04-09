import { supabase } from '../../lib/supabase';
import { sendNotification, NOTIFICATION_TYPES } from '../../lib/notifications';

export const finishConsultationWorkflow = async (consultation, patient, waitingQueueId, notes_generales) => {
    if (!consultation) throw new Error("Consultation non fournie");

    const endTime = new Date().toISOString();
    
    // 1. Sauvegarder les notes et l'heure de fin
    const { data: savedConsultation, error: saveError } = await supabase
        .from('consultations')
        .update({
            updated_at: endTime,
            notes_generales: notes_generales || null,
            heure_fin_consultation: endTime,
            statut: 'terminee'
        })
        .eq('id', consultation.id)
        .select()
        .single();

    if (saveError) {
        console.error("Erreur lors de la sauvegarde de la consultation:", saveError);
        // On continue même en cas d'erreur pour ne pas bloquer le workflow
    }

    // 2. Envoyer la notification à la secrétaire
    try {
        const { data: secretaireData } = await supabase
            .from('users')
            .select('id')
            .eq('role', 'secretary')
            .eq('actif', true)
            .limit(1)
            .single();

        if (secretaireData && patient) {
            await sendNotification(
                NOTIFICATION_TYPES.CONSULTATION_ENDED,
                consultation.medecin_id,
                secretaireData.id,
                consultation.id,
                `${patient.prenom} ${patient.nom}`,
                { patientId: consultation.patient_id }
            );
        } else {
            console.warn("Aucune secrétaire active ou patient non trouvé pour la notification.");
        }
    } catch (notifError) {
        console.error("Erreur lors de l'envoi de la notification:", notifError);
    }

    // 3. Mettre à jour la file d'attente
    let queueError = null;
    if (waitingQueueId) {
        const { error } = await supabase
            .from('waiting_queue')
            .update({
                status: 'termine',
                consultation_ended_at: endTime,
                updated_at: endTime
            })
            .eq('id', Number(waitingQueueId));
        if(error) queueError = error;
    }
    
    return { 
        updatedConsultation: savedConsultation || { ...consultation, heure_fin_consultation: endTime, statut: 'terminee' }, 
        saveError,
        queueError
    };
};
