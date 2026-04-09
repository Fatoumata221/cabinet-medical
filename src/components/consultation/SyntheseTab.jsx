import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import PropTypes from 'prop-types';
import { Activity, AlertCircle, Award, Brain, Calendar, Edit, Eye, FileText, Heart, Pill, Plus, Trash2, User } from 'lucide-react';
import { generateSynthesisPDF } from '../../services/impression/synthesePdf';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import SyntheseModal from './modals/SyntheseModal';
export default function SyntheseTab(
  {
    id,
    patient,
    consultation,
    antecedents,
    constantes,
    signesCliniques,
    examensAppareils,
    diagnostics,
    ordonnances,
    certificats,
    syntheses,
    syntheseHistorique,
    elementsSyntheseRef,
    fetchSyntheses,
    syntheseMode,
    setSyntheseMode
  }
) {
  // Handlers détectés et injectés 
    const { showError, showInfo, showSuccess, showWarning } = useConfirmDialog();
  

  // inline_handler : Inline (() => ...) défini directement dans JSX
  const [showSyntheseModal, setShowSyntheseModal] = useState(false)
  const handleAddSynthese = () => {
    setShowSyntheseModal(true);
  };
    // Fonction pour générer automatiquement une synthèse basée sur les données collectées
  const generateAutoSynthesis = async () => {
    try {
      // Créer un résumé automatique basé sur les données existantes
      let syntheseText = '';
      
      // Résumé des antécédents
      if (antecedents && antecedents.length > 0) {
        const antecedentsList = antecedents.map(ant => ant.antecedents?.nom || ant.antecedent).join(', ');
        syntheseText += `Antécédents significatifs : ${antecedentsList}. `;
      }
      
      // Résumé des constantes
      if (constantes && constantes.length > 0) {
        const constantesList = constantes.map(const_ => 
          `${const_.constantes?.nom}: ${const_.valeur_mesuree} ${const_.unite || const_.constantes?.unite || ''}`
        ).join(', ');
        syntheseText += `Constantes vitales : ${constantesList}. `;
      }
      
      // Résumé des signes cliniques
      if (signesCliniques && signesCliniques.length > 0) {
        const signesList = signesCliniques.map(signe => {
          let desc = signe.signes_cliniques?.nom;
          if (signe.intensite && signe.intensite !== 'faible') {
            desc += ` (${signe.intensite})`;
          }
          return desc;
        }).join(', ');
        syntheseText += `Signes cliniques observés : ${signesList}. `;
      }
      
      // Résumé des examens d'appareils
      if (examensAppareils && examensAppareils.length > 0) {
        const examensList = examensAppareils.map(examen => {
          let desc = `${examen.appareils?.nom}: ${examen.resultat_examen}`;
          if (examen.anomalies_detectees) {
            desc += ` (Anomalies: ${examen.anomalies_detectees})`;
          }
          return desc;
        }).join('; ');
        syntheseText += `Examens d'appareils : ${examensList}. `;
      }
      
      // Résumé des diagnostics
      if (diagnostics && diagnostics.length > 0) {
        const diagnosticsList = diagnostics.map(diag => 
          `${diag.diagnostics?.nom} (${diag.certitude})`
        ).join(', ');
        syntheseText += `Diagnostics posés : ${diagnosticsList}. `;
      }
      
      // Résumé des prescriptions
      if (ordonnances && ordonnances.length > 0) {
        const totalMedicaments = ordonnances.reduce((total, ord) => 
          total + (ord.lignes_ordonnance?.length || 0), 0
        );
        syntheseText += `${ordonnances.length} ordonnance(s) prescrite(s) avec ${totalMedicaments} médicament(s). `;
      }
      
      // Résumé des certificats
      if (certificats && certificats.length > 0) {
        const certificatsList = certificats.map(cert => 
          `${cert.types_certificats?.nom || 'Certificat médical'} (${cert.duree_jours} jour${cert.duree_jours > 1 ? 's' : ''})`
        ).join(', ');
        syntheseText += `Certificats émis : ${certificatsList}. `;
      }
      
      if (syntheseText.trim() === '') {
        showInfo('Aucune donnée disponible pour générer une synthèse automatique. Veuillez remplir les autres onglets d\'abord.');
        return;
      }
      
      // Chercher un élément de synthèse générique ou créer une entrée
      let elementSyntheseId = null;
      
      // Essayer de trouver un élément "Résumé automatique" ou similaire
      const elementAuto = elementsSyntheseRef.find(el => 
        el.nom.toLowerCase().includes('résumé') || 
        el.nom.toLowerCase().includes('synthèse') ||
        el.nom.toLowerCase().includes('automatique')
      );
      
      if (elementAuto) {
        elementSyntheseId = elementAuto.id;
      } else if (elementsSyntheseRef && elementsSyntheseRef.length > 0) {
        // Utiliser le premier élément disponible
        elementSyntheseId = elementsSyntheseRef[0].id;
      } else {
        showWarning('Aucun élément de synthèse disponible dans la base de données. Veuillez contacter l\'administrateur.');
        return;
      }
      
      // Insérer la synthèse automatique
      const { error } = await supabase
        .from('syntheses_consultation')
        .insert({
          consultation_id: parseInt(id),
          element_synthese_id: elementSyntheseId,
          commentaires: `[Synthèse automatique générée le ${new Date().toLocaleString('fr-FR')}]\n\n${syntheseText.trim()}`
        });

      if (error) throw error;
      
      // Recharger les synthèses
      await fetchSyntheses();
      showSuccess('Synthèse automatique générée avec succès !');
      
    } catch (error) {
      console.error('Erreur lors de la génération de la synthèse:', error);
      showError('Erreur lors de la génération de la synthèse: ' + error.message);
    }
  };
  
  const handleGenerateSynthesisPDF = () => {
    const { success, error } = generateSynthesisPDF(
      patient,
      consultation,
      antecedents,
      constantes,
      signesCliniques,
      examensAppareils,
      diagnostics,
      ordonnances,
      certificats
    );
    if (!success) {
      showError(`Erreur lors de la génération du PDF: ${error}`);
    }
  }

  return (
  <>
      
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Synthèse de la consultation</h2>
          <div className="flex gap-3">
            <button 
              onClick={() => {
                generateAutoSynthesis();
              }}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center text-sm"
            >
              <Brain className="w-4 h-4 mr-2" />
              Sauvegarder synthèse
            </button>
            <button 
              onClick={handleGenerateSynthesisPDF}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center text-sm"
            >
              <FileText className="w-4 h-4 mr-2" />
              Générer PDF
            </button>
          </div>
        </div>
    
        {/* Résumé automatique visuel */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
              <Brain className="w-5 h-5 mr-2" />
              Résumé automatique de la consultation
            </h3>
    
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Antécédents significatifs */}
              {antecedents && antecedents.length > 0 && (
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-3 flex items-center">
                    <User className="w-4 h-4 mr-2 text-blue-600" />
                    Antécédents significatifs
                  </h4>
                  <div className="space-y-2">
                    {antecedents.slice(0, 3).map((ant, idx) => (
                      <div key={idx} className="text-sm">
                        <span className="font-medium text-gray-900">
                          {ant.antecedents?.nom}
                        </span>
                        {ant.date_decouverte && (
                          <span className="text-gray-500 text-xs ml-2">
                            ({new Date(ant.date_decouverte).toLocaleDateString('fr-FR')})
                          </span>
                        )}
                      </div>
                    ))}
                    {antecedents.length > 3 && (
                      <p className="text-xs text-blue-600">
                        +{antecedents.length - 3} autre(s)
                      </p>
                    )}
                  </div>
                </div>
              )}
    
              {/* Constantes vitales */}
              {constantes && constantes.length > 0 && (
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-3 flex items-center">
                    <Activity className="w-4 h-4 mr-2 text-red-600" />
                    Constantes vitales
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {constantes.slice(0, 6).map((const_, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span className="text-gray-600 truncate">
                          {const_.constantes?.nom}:
                        </span>
                        <span className="font-medium text-gray-900">
                          {const_.valeur_mesuree} {const_.unite || const_.constantes?.unite}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
    
              {/* Signes cliniques */}
              {signesCliniques && signesCliniques.length > 0 && (
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-3 flex items-center">
                    <Eye className="w-4 h-4 mr-2 text-yellow-600" />
                    Signes cliniques
                  </h4>
                  <div className="space-y-2">
                    {signesCliniques.slice(0, 4).map((signe, idx) => (
                      <div key={idx} className="flex items-center text-sm">
                        <div className={`w-2 h-2 rounded-full mr-2 ${
                          signe.intensite === 'forte' ? 'bg-red-500' :
                          signe.intensite === 'moderee' ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}></div>
                        <span className="text-gray-900">
                          {signe.signes_cliniques?.nom}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
    
              {/* Examens d'appareils */}
              {examensAppareils && examensAppareils.length > 0 && (
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-3 flex items-center">
                    <Heart className="w-4 h-4 mr-2 text-purple-600" />
                    Examens d&apos;appareils
                  </h4>
                  <div className="space-y-2">
                    {examensAppareils.slice(0, 3).map((examen, idx) => (
                      <div key={idx} className="text-sm">
                        <div className="font-medium text-gray-900">
                          {examen.appareils?.nom}
                        </div>
                        <div className="text-gray-600 truncate">
                          {examen.resultat_examen.substring(0, 50)}
                          {examen.resultat_examen.length > 50 && '...'}
                        </div>
                        {examen.anomalies_detectees && (
                          <div className="text-red-600 text-xs flex items-center">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Anomalies détectées
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
    
              {/* Diagnostics */}
              {diagnostics && diagnostics.length > 0 && (
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-3 flex items-center">
                    <FileText className="w-4 h-4 mr-2 text-indigo-600" />
                    Diagnostics
                  </h4>
                  <div className="space-y-2">
                    {diagnostics.slice(0, 3).map((diag, idx) => (
                      <div key={idx} className="text-sm">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          diag.certitude === 'certain' ? 'bg-green-100 text-green-800' :
                          diag.certitude === 'probable' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {diag.diagnostics?.nom}
                        </span>
                        {diag.commentaires && (
                          <p className="text-gray-600 text-xs mt-1">
                            {diag.commentaires.substring(0, 60)}
                            {diag.commentaires.length > 60 && '...'}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
    
              {/* Prescriptions */}
              {ordonnances && ordonnances.length > 0 && (
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-3 flex items-center">
                    <Pill className="w-4 h-4 mr-2 text-green-600" />
                    Prescriptions
                  </h4>
                  <div className="space-y-2">
                    {ordonnances.slice(0, 2).map((ord, idx) => (
                      <div key={idx} className="text-sm">
                        <div className="font-medium text-gray-900">
                          Ordonnance #{ord.numero_ordonnance}
                        </div>
                        <div className="text-gray-600">
                          {ord.lignes_ordonnance?.length || 0} médicament(s)
                        </div>
                        {ord.instructions_generales && (
                          <p className="text-gray-500 text-xs italic">
                            {ord.instructions_generales.substring(0, 50)}
                            {ord.instructions_generales.length > 50 && '...'}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
    
              {/* Certificats */}
              {certificats && certificats.length > 0 && (
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-3 flex items-center">
                    <Award className="w-4 h-4 mr-2 text-orange-600" />
                    Certificats
                  </h4>
                  <div className="space-y-2">
                    {certificats.slice(0, 3).map((cert, idx) => (
                      <div key={idx} className="text-sm">
                        <div className="font-medium text-gray-900">
                          {cert.types_certificats?.nom}
                        </div>
                        <div className="text-gray-600">
                          {cert.duree_jours} jour(s) • 
                          {new Date(cert.date_debut).toLocaleDateString('fr-FR')} - 
                          {new Date(new Date(cert.date_debut).getTime() + cert.duree_jours * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR')}
                        </div>
                        {cert.motif && (
                          <p className="text-gray-500 text-xs">
                            {cert.motif}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
    
            {/* Message si aucune donnée */}
            {(!antecedents || antecedents.length === 0) && (!constantes || constantes.length === 0) && 
             (!signesCliniques || signesCliniques.length === 0) && 
             (!examensAppareils || examensAppareils.length === 0) && 
             (!diagnostics || diagnostics.length === 0) && 
             (!ordonnances || ordonnances.length === 0) && 
             (!certificats || certificats.length === 0) && (
              <div className="text-center py-8">
                <Brain className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune donnée disponible</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Remplissez les autres onglets pour voir apparaître la synthèse automatique.
                </p>
              </div>
            )}
          </div>
        </div>
    
        {/* Synthèses manuelles */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-semibold text-gray-900">Éléments de synthèse manuels</h3>
              {/* Toggle Mode */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setSyntheseMode('current')}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    syntheseMode === 'current'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Consultation actuelle
                </button>
                <button
                  onClick={() => setSyntheseMode('history')}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    syntheseMode === 'history'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Historique complet
                </button>
              </div>
            </div>
            <button 
              onClick={handleAddSynthese}
              className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 flex items-center text-sm"
            >
              <Plus className="w-4 h-4 mr-1" />
              Ajouter manuel
            </button>
          </div>
    
          {/* Vue consultation actuelle */}
          {syntheseMode === 'current' && (
            <>
              {syntheses && syntheses.length > 0 ? (
                <div className="space-y-4">
                  {syntheses.map((synthese) => (
                    <div key={synthese.id} className="bg-gray-50 border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">
                          {synthese.elements_synthese?.nom}
                        </h4>
                        <div className="flex items-center space-x-2">
                          <button className="text-blue-600 hover:text-blue-800">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="text-red-600 hover:text-red-800">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      {synthese.commentaires && (
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {synthese.commentaires}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun élément de synthèse manuel</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Cliquez sur &quot;Ajouter manuel&quot; pour ajouter des éléments spécifiques à la synthèse.
                  </p>
                </div>
              )}
            </>
          )}
    
          {/* Vue historique complet */}
          {syntheseMode === 'history' && (
            <>
              {syntheseHistorique && syntheseHistorique.length > 0 ? (
                <div className="space-y-6">
                  {syntheseHistorique.map((consultation, idx) => (
                    <div key={consultation.consultation_id} className="relative">
                      {/* Séparateur entre consultations */}
                      {idx > 0 && (
                        <div className="absolute left-0 right-0 -top-3 flex items-center">
                          <div className="flex-1 border-t-2 border-gray-300"></div>
                        </div>
                      )}
    
                      {/* Header de consultation */}
                      <div className={`rounded-lg border-2 ${
                        consultation.is_current
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 bg-white'
                      } p-4 mb-3`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Calendar className={`w-5 h-5 ${
                              consultation.is_current ? 'text-blue-600' : 'text-gray-600'
                            }`} />
                            <div>
                              <h4 className={`font-semibold ${
                                consultation.is_current ? 'text-blue-900' : 'text-gray-900'
                              }`}>
                                {new Date(consultation.date_consultation).toLocaleDateString('fr-FR', {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </h4>
                              <p className="text-sm text-gray-600">
                                Dr {consultation.medecin_prenom} {consultation.medecin_nom}
                              </p>
                            </div>
                          </div>
                          {consultation.is_current && (
                            <span className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-full">
                              Consultation actuelle
                            </span>
                          )}
                        </div>
                      </div>
    
                      {/* Synthèses de cette consultation */}
                      <div className="space-y-3 pl-8">
                        {consultation.syntheses.map((synthese) => (
                          <div key={synthese.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h5 className="font-medium text-gray-900 mb-1">
                                  {synthese.element_nom}
                                </h5>
                                {synthese.element_description && (
                                  <p className="text-xs text-gray-500 mb-2">
                                    {synthese.element_description}
                                  </p>
                                )}
                                {synthese.commentaires && (
                                  <p className="text-sm text-gray-700 whitespace-pre-wrap mt-2">
                                    {synthese.commentaires}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2 ml-4">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  synthese.element_categorie === 'generale' ? 'bg-blue-100 text-blue-700' :
                                  synthese.element_categorie === 'urgence' ? 'bg-red-100 text-red-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {synthese.element_type || 'observation'}
                                </span>
                              </div>
                            </div>
                            <div className="mt-2 text-xs text-gray-400">
                              Ajouté le {new Date(synthese.created_at).toLocaleDateString('fr-FR')} à {new Date(synthese.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune synthèse dans l&apos;historique</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Ce patient n&apos;a aucune synthèse enregistrée dans ses consultations précédentes.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      {showSyntheseModal && (
        <SyntheseModal
        setShowSyntheseModal={setShowSyntheseModal}
        id={id}
        fetchSyntheses={fetchSyntheses}
        elementsSyntheseRef={elementsSyntheseRef}
         />)}
  </>
    )}

    SyntheseTab.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  patient: PropTypes.object,
  consultation: PropTypes.object,
  antecedents: PropTypes.array,
  constantes: PropTypes.array,
  signesCliniques: PropTypes.array,
  examensAppareils: PropTypes.array,
  diagnostics: PropTypes.array,
  ordonnances: PropTypes.array,
  certificats: PropTypes.array,
  syntheses: PropTypes.array,
  syntheseHistorique: PropTypes.array,
  elementsSyntheseRef: PropTypes.array,
  fetchSyntheses: PropTypes.func,
  syntheseMode: PropTypes.string,
  setSyntheseMode: PropTypes.func
};

SyntheseTab.defaultProps = {
  patient: null,
  consultation: null,
  antecedents: [],
  constantes: [],
  signesCliniques: [],
  examensAppareils: [],
  diagnostics: [],
  ordonnances: [],
  certificats: [],
  syntheses: [],
  syntheseHistorique: [],
  elementsSyntheseRef: [],
  fetchSyntheses: () => {},
  syntheseMode: 'current',
  setSyntheseMode: () => {}
};