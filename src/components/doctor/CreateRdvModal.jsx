import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { unifiedNotificationService } from '../../services/unifiedNotificationService';
import SearchableSelect from '../common/SearchableSelect';
import { X, Calendar, Clock, FileText, Save, User, Stethoscope } from 'lucide-react';

/**
 * Modal de création de rendez-vous pour le médecin
 * 2 modes :
 * - Mode "après consultation" : patientId fourni, patient pré-sélectionné
 * - Mode "nouveau RDV" : patientId null, sélection du patient via SearchableSelect
 */
const CreateRdvModal = ({ 
  isOpen, 
  onClose, 
  patientId = null, // Si null, on peut sélectionner le patient
  medecinId,
  onSuccess 
}) => {
  const [loading, setLoading] = useState(false);
  const [patient, setPatient] = useState(null);
  const [medecin, setMedecin] = useState(null);
  const [patients, setPatients] = useState([]); // Liste des patients du médecin
  
  const [formData, setFormData] = useState({
    patient_id: patientId || '', // Si patientId fourni, on le pré-remplit
    date_heure: '',
    motif: patientId ? 'Suivi post-consultation' : 'Consultation',
    duree: 30,
    type_rdv: patientId ? 'suivi' : 'consultation',
    priorite: 'normale',
    statut: 'confirme',
    notes: ''
  });

  const [manualDate, setManualDate] = useState('');
  const [manualTime, setManualTime] = useState('');

  // Charger les infos du patient et du médecin
  useEffect(() => {
    if (isOpen && medecinId) {
      loadMedecinAndPatients();
    }
  }, [isOpen, medecinId]);

  // Mettre à jour patient_id dans formData quand patientId change
  useEffect(() => {
    if (patientId) {
      setFormData(prev => ({ ...prev, patient_id: patientId }));
    }
  }, [patientId]);

  const loadMedecinAndPatients = async () => {
    try {
      console.log('🔵 [CreateRdvModal] Chargement médecin et patients...');
      
      // Charger le médecin
      const { data: medecinData, error: medecinError } = await supabase
        .from('users')
        .select('*')
        .eq('id', medecinId)
        .single();

      if (medecinError) throw medecinError;
      setMedecin(medecinData);
      console.log('✅ [CreateRdvModal] Médecin chargé:', medecinData);

      // Charger les patients de ce médecin (via les consultations passées)
      const { data: consultationsData } = await supabase
        .from('consultations')
        .select('patient_id')
        .eq('medecin_id', medecinId);

      const patientIds = [...new Set(consultationsData?.map(c => c.patient_id) || [])];

      if (patientIds.length > 0) {
        const { data: patientsData, error: patientsError } = await supabase
          .from('patients')
          .select('*')
          .in('id', patientIds)
          .eq('actif', true)
          .order('nom');

        if (!patientsError) {
          setPatients(patientsData || []);
          console.log('✅ [CreateRdvModal] Patients chargés:', patientsData?.length || 0);
        }
      }

      // Si un patientId est fourni, charger ce patient spécifique
      if (patientId) {
        const { data: patientData, error: patientError } = await supabase
          .from('patients')
          .select('*')
          .eq('id', patientId)
          .single();

        if (!patientError) {
          setPatient(patientData);
          console.log('✅ [CreateRdvModal] Patient pré-sélectionné chargé:', patientData);
        }
      }

    } catch (error) {
      console.error('❌ [CreateRdvModal] Erreur chargement:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    console.log('🔵 [CreateRdvModal] Début création RDV');
    console.log('📝 [CreateRdvModal] Données formulaire:', formData);

    try {
      // Validation
      if (!formData.patient_id) {
        unifiedNotificationService.warning('Veuillez sélectionner un patient');
        setLoading(false);
        return;
      }

      if (!formData.date_heure) {
        unifiedNotificationService.warning('Veuillez sélectionner une date et une heure');
        setLoading(false);
        return;
      }

      const appointmentData = {
        patient_id: formData.patient_id,
        medecin_id: medecinId,
        date_heure: formData.date_heure,
        motif: formData.motif || 'Suivi post-consultation',
        duree: formData.duree || 30,
        statut: formData.statut || 'confirme',
        priorite: formData.priorite || 'normale',
        notes: formData.notes || '',
        type_rdv: formData.type_rdv || 'suivi',
        created_at: new Date().toISOString()
      };

      console.log('📤 [CreateRdvModal] Données à insérer:', appointmentData);

      const { data: newAppointment, error } = await supabase
        .from('appointments')
        .insert([appointmentData])
        .select()
        .single();

      if (error) {
        console.error('❌ [CreateRdvModal] Erreur Supabase:', error);
        throw error;
      }

      console.log('✅ [CreateRdvModal] RDV créé avec succès:', newAppointment);

      // Ajouter à la file d'attente
      try {
        const { data: currentQueue } = await supabase
          .from('waiting_queue')
          .select('order_position')
          .eq('medecin_id', medecinId)
          .order('order_position', { ascending: false })
          .limit(1);

        const nextPosition = currentQueue && currentQueue.length > 0 
          ? currentQueue[0].order_position + 1 
          : 1;

        const { error: qError } = await supabase
          .from('waiting_queue')
          .insert([{
            patient_id: formData.patient_id,
            medecin_id: medecinId,
            appointment_id: newAppointment.id,
            status: 'waiting',
            arrived_at: new Date().toISOString(),
            order_position: nextPosition
          }]);

        if (qError) {
          console.error('⚠️ [CreateRdvModal] Erreur ajout file d\'attente:', qError);
        } else {
          console.log('✅ [CreateRdvModal] RDV ajouté à la file d\'attente');
        }
      } catch (qe) {
        console.error('⚠️ [CreateRdvModal] Exception file d\'attente:', qe);
      }

      // Callback de succès
      if (onSuccess) {
        onSuccess(newAppointment);
      }

      // Fermer le modal
      handleClose();

    } catch (error) {
      console.error('❌ [CreateRdvModal] Erreur création RDV:', error);
      unifiedNotificationService.error(`Erreur lors de la création du rendez-vous: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      patient_id: patientId || '',
      date_heure: '',
      motif: patientId ? 'Suivi post-consultation' : 'Consultation',
      duree: 30,
      type_rdv: patientId ? 'suivi' : 'consultation',
      priorite: 'normale',
      statut: 'confirme',
      notes: ''
    });
    setManualDate('');
    setManualTime('');
    setPatient(null);
    onClose();
  };

  // Gérer la date et l'heure manuellement
  const handleDateChange = (e) => {
    const dateValue = e.target.value;
    setManualDate(dateValue);
    
    if (dateValue && manualTime) {
      const [hh, mm] = manualTime.split(':');
      const composed = new Date(dateValue + 'T00:00:00');
      composed.setHours(parseInt(hh, 10), parseInt(mm, 10), 0, 0);
      setFormData({ ...formData, date_heure: composed.toISOString() });
    }
  };

  const handleTimeChange = (e) => {
    const timeValue = e.target.value;
    setManualTime(timeValue);
    
    if (manualDate && timeValue) {
      const [hh, mm] = timeValue.split(':');
      const composed = new Date(manualDate + 'T00:00:00');
      composed.setHours(parseInt(hh, 10), parseInt(mm, 10), 0, 0);
      setFormData({ ...formData, date_heure: composed.toISOString() });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 flex items-center justify-between rounded-t-lg">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white bg-opacity-20 rounded-lg">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Planifier un rendez-vous de suivi</h2>
              <p className="text-sm text-blue-100">Créer un nouveau rendez-vous pour le patient</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Informations patient et médecin (non modifiables) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Patient - Badge si pré-sélectionné, SearchableSelect sinon */}
            {patientId ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-blue-600 font-medium">Patient</p>
                    {patient ? (
                      <>
                        <p className="font-semibold text-gray-900">
                          {patient.prenom} {patient.nom}
                        </p>
                        <p className="text-xs text-gray-600">{patient.telephone}</p>
                      </>
                    ) : (
                      <p className="text-sm text-gray-500">Chargement...</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <SearchableSelect
                label="Patient"
                required
                options={patients.map(p => ({
                  id: p.id,
                  label: `${p.prenom} ${p.nom}`,
                  nom: p.nom,
                  prenom: p.prenom,
                  telephone: p.telephone,
                  email: p.email
                }))}
                value={formData.patient_id}
                onChange={(value) => setFormData({...formData, patient_id: value})}
                placeholder="Sélectionner un patient"
                searchPlaceholder="Rechercher par nom, prénom, téléphone..."
                emptyMessage="Aucun patient trouvé"
                renderOption={(option) => (
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-900">
                      {option.prenom} {option.nom}
                    </span>
                    <span className="text-xs text-gray-500">
                      {option.telephone}
                    </span>
                  </div>
                )}
              />
            )}

            {/* Médecin - Toujours en badge non modifiable */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Stethoscope className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-green-600 font-medium">Médecin</p>
                  {medecin ? (
                    <>
                      <p className="font-semibold text-gray-900">
                        Dr. {medecin.prenom} {medecin.nom}
                      </p>
                      <p className="text-xs text-gray-600">{medecin.specialite || 'Médecin'}</p>
                    </>
                  ) : (
                    <p className="text-sm text-gray-500">Chargement...</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Type de RDV et Priorité */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type de rendez-vous *
              </label>
              <select
                value={formData.type_rdv}
                onChange={(e) => setFormData({...formData, type_rdv: e.target.value})}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="suivi">Suivi</option>
                <option value="consultation">Consultation</option>
                <option value="controle">Contrôle</option>
                <option value="urgence">Urgence</option>
                <option value="preventif">Préventif</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priorité
              </label>
              <select
                value={formData.priorite}
                onChange={(e) => setFormData({...formData, priorite: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="normale">Normale</option>
                <option value="urgente">Urgente</option>
                <option value="tres_urgente">Très urgente</option>
              </select>
            </div>
          </div>

          {/* Date, Heure et Durée */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date *
              </label>
              <input
                type="date"
                value={manualDate}
                onChange={handleDateChange}
                min={new Date().toISOString().split('T')[0]}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Heure *
              </label>
              <input
                type="time"
                value={manualTime}
                onChange={handleTimeChange}
                step="300"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Durée (min)
              </label>
              <select
                value={formData.duree}
                onChange={(e) => setFormData({...formData, duree: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="15">15 min</option>
                <option value="30">30 min</option>
                <option value="45">45 min</option>
                <option value="60">1 heure</option>
              </select>
            </div>
          </div>

          {/* Motif */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Motif du rendez-vous *
            </label>
            <input
              type="text"
              value={formData.motif}
              onChange={(e) => setFormData({...formData, motif: e.target.value})}
              placeholder="Ex: Suivi post-consultation, Contrôle des résultats..."
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes additionnelles
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows={3}
              placeholder="Instructions particulières, examens à prévoir..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Boutons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Création...' : 'Créer le rendez-vous'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRdvModal;
