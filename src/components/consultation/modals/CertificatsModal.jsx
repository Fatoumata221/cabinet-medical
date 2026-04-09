import React, { useState } from 'react';
import { supabase } from '../../../lib/supabase';

import { useConfirmDialog } from '../../../hooks/useConfirmDialog';
import PropTypes from 'prop-types';


const CertificatsModal = ({
setShowCertificatModal,
typesCertificatsRef,
fetchCertificats,
id,
consultation,
}) => {

    const {  showSuccess , showError, showWarning} = useConfirmDialog();
      
    
    const [certificatForm, setCertificatForm] = useState({
      type_certificat_id: '',
      date_debut: new Date().toISOString().split('T')[0],
      duree_jours: 1,
      motif: '',
      restrictions: ''
    });

      const saveCertificat = async () => {
        console.log('saveCertificat appelée');
        console.log('certificatForm:', certificatForm);
        
        if (!certificatForm.type_certificat_id) {
          showWarning('Veuillez sélectionner un type de certificat');
          return;
        }
    
        try {
          console.log('Insertion certificat avec:', {
            consultation_id: parseInt(id),
            patient_id: consultation.patient_id,
            medecin_id: consultation.medecin_id,
            type_certificat_id: parseInt(certificatForm.type_certificat_id),
            date_debut: certificatForm.date_debut,
            duree_jours: parseInt(certificatForm.duree_jours),
            motif: certificatForm.motif || null,
            restrictions: certificatForm.restrictions || null,
            statut: 'actif'
          });
          
          const { error } = await supabase
            .from('certificats_medicaux')
            .insert({
              consultation_id: parseInt(id),
              patient_id: consultation.patient_id,
              medecin_id: consultation.medecin_id,
              type_certificat_id: parseInt(certificatForm.type_certificat_id),
              date_debut: certificatForm.date_debut,
              duree_jours: parseInt(certificatForm.duree_jours),
              motif: certificatForm.motif || null,
              restrictions: certificatForm.restrictions || null,
              statut: 'actif'
            });
    
          console.log('Résultat insert certificat, error:', error);
          
          if (error) throw error;
          
          await fetchCertificats();
          setCertificatForm({
            type_certificat_id: '',
            date_debut: new Date().toISOString().split('T')[0],
            duree_jours: 1,
            motif: '',
            restrictions: ''
          });
          showSuccess('Certificat médical créé avec succès !');
          setShowCertificatModal(false);
        } catch (error) {
          console.error('Erreur lors de la création du certificat:', error);
          showError('Erreur lors de la création du certificat: ' + error.message);
        }
      };




return ( 
        
       <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Créer un certificat médical</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type de certificat *
                  </label>
                  <select
                    value={certificatForm.type_certificat_id}
                    onChange={(e) => {
                      const selectedType = typesCertificatsRef.find(t => t.id === parseInt(e.target.value));
                      setCertificatForm({
                        ...certificatForm, 
                        type_certificat_id: e.target.value,
                        duree_jours: selectedType?.duree_defaut || 1
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Sélectionner un type</option>
                    {typesCertificatsRef.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.nom}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date de début *
                    </label>
                    <input
                      type="date"
                      value={certificatForm.date_debut}
                      onChange={(e) => setCertificatForm({...certificatForm, date_debut: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Durée (jours) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={certificatForm.duree_jours}
                      onChange={(e) => setCertificatForm({...certificatForm, duree_jours: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Motif
                  </label>
                  <input
                    type="text"
                    value={certificatForm.motif}
                    onChange={(e) => setCertificatForm({...certificatForm, motif: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: État de santé nécessitant un repos"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Restrictions
                  </label>
                  <input
                    type="text"
                    value={certificatForm.restrictions}
                    onChange={(e) => setCertificatForm({...certificatForm, restrictions: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: Éviter les efforts physiques"
                  />
                </div>

              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowCertificatModal(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  Annuler
                </button>
                <button
                  onClick={saveCertificat}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Créer le certificat
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    };
export default CertificatsModal;

CertificatsModal.propTypes = {
  setShowCertificatModal: PropTypes.func.isRequired,
  typesCertificatsRef: PropTypes.array.isRequired,
  fetchCertificats: PropTypes.func.isRequired,
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  consultation: PropTypes.object.isRequired,
};

