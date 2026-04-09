import React, { useState } from 'react';
import { TOOTH_STATES, TOOTH_NAMES } from './constants';
import { useTypesActes } from '../../hooks/useTypesActes';
import { supabase } from '../../lib/supabase';
import SearchableSelect from '../common/SearchableSelect';
import { X, Activity, History, Info, Check, FileText, Save } from 'lucide-react';

const ToothDetailsModal = ({ isOpen, onClose, toothId, toothData, onUpdateTooth, toothStates, onStateCreated, onCreateState, consultationId, fetchActes }) => {
  const { actes: typesActes, loading: loadingActes } = useTypesActes(); // Utilisation du hook
  
  const [activeTab, setActiveTab] = useState('status'); // status, procedures, history
  const [note, setNote] = useState(toothData?.notes || '');
  const [selectedProcedureId, setSelectedProcedureId] = useState(''); // ID au lieu de CODE
  
  // State creation form
  const [isCreatingState, setIsCreatingState] = useState(false);
  const [newStateName, setNewStateName] = useState('');
  const [newStateColor, setNewStateColor] = useState('#FECACA');

  const toothName = TOOTH_NAMES[toothId] || `Dent ${toothId}`;
  const currentStateId = toothData?.state || TOOTH_STATES.HEALTHY.id;
  const history = toothData?.history || [];
  
  // Utiliser les états dynamiques ou fallback
  const effectiveStates = toothStates || TOOTH_STATES;
  
  // Trouver l'état actuel
  let currentState = effectiveStates[currentStateId];
  if (!currentState) {
     currentState = Object.values(effectiveStates).find(s => s.id === currentStateId || s.code === currentStateId);
  }
  currentState = currentState || TOOTH_STATES.HEALTHY;

  const handleStateChange = (newStateId) => {
    onUpdateTooth(toothId, { ...toothData, state: newStateId });
  };
  
  const handleCreateState = async (e) => {
    e.preventDefault();
    if (!newStateName.trim() || !onCreateState) return;
    
    // Générer un code unique (simplifié)
    const code = newStateName.toUpperCase().replace(/[^A-Z0-9]/g, '_') + '_' + Date.now().toString().slice(-4);
    
    const newStateData = {
        name: newStateName,
        code: code,
        color: newStateColor,
        border_color: '#000000', // Default border
        order_index: 99
    };
    
    const result = await onCreateState(newStateData);
    if (result.success) {
        setIsCreatingState(false);
        setNewStateName('');
        // Rafraîchir la liste et sélectionner le nouvel état si possible
        // onStateCreated est appelé par le hook useToothStates via refresh, donc c'est implicite si onCreateState fait le refresh
        // Mais nous voulons sélectionner cet état.
        // onCreateState retourne { success: true, data: newState }
        if (result.data) {
             // Si result.data a un ID ou Code
             handleStateChange(result.data.code); 
        }
    }
  };

  const handleAddProcedure = async () => {
    if (!selectedProcedureId) return;
    
    // Trouver l'acte sélectionné dans la liste dynamique
    const procedure = typesActes.find(p => p.id.toString() === selectedProcedureId.toString());
    if (!procedure) return;

    const newHistoryItem = {
      date: new Date().toISOString(),
      type: 'PROCEDURE',
      code: procedure.code_ccam || `ACT-${procedure.id}`,
      name: procedure.nom,
      note: note
    };

    const newHistory = [newHistoryItem, ...history];
    
    // Auto-update state si c'est une extraction (basé sur le nom)
    const isExtraction = procedure.nom.toLowerCase().includes('extraction');
    const newState = isExtraction 
        ? TOOTH_STATES.EXTRACTED.id
        : toothData?.state;

    // 1. Mettre à jour le schéma dentaire (history locale)
    onUpdateTooth(toothId, { 
        ...toothData, 
        history: newHistory,
        state: newState
    });

    // 2. Insérer automatiquement dans actes_consultation si on a un consultationId
    if (consultationId) {
      try {
        const toothName = TOOTH_NAMES[toothId] || `Dent ${toothId}`;
        const { error } = await supabase
          .from('actes_consultation')
          .insert({
            consultation_id: parseInt(consultationId),
            type_acte_id: procedure.id,
            quantite: 1,
            tarif_unitaire: parseFloat(procedure.tarif_defaut || 0),
            dent_id: toothId.toString(),
            dent_nom: toothName,
            notes: note || null,
          });
        if (error) {
          console.error('[DentalChart] Erreur insertion acte dans actes_consultation:', error);
        } else {
          console.log('[DentalChart] Acte inséré dans actes_consultation pour dent', toothId);
          // Rafraîchir l'onglet Actes si le callback est fourni
          if (fetchActes) await fetchActes();
        }
      } catch (err) {
        console.error('[DentalChart] Erreur lors de l\'insertion de l\'acte:', err);
      }
    }
    
    setNote('');
    setSelectedProcedureId('');
    setActiveTab('history');
  };

  const handleSaveNotes = () => {
     onUpdateTooth(toothId, { ...toothData, notes: note });
  };

  // Filter states to show in the buttons
  // Exclure 'SELECTED' qui n'est pas un état clinique permanent
  const statesToShow = Object.values(effectiveStates).filter(
    (state) => state.id !== TOOTH_STATES.SELECTED.id && state.code !== 'SELECTED'
  ).sort((a, b) => (a.order_index || 0) - (b.order_index || 0));

  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header Content */}
        <div className="bg-white p-6 pb-4 border-b border-gray-100 flex justify-between items-start">
            <div className="flex items-start gap-4">
                <div className="bg-blue-50 text-blue-600 rounded-xl w-14 h-14 flex items-center justify-center text-xl font-bold border border-blue-100 shadow-sm">
                    {toothId}
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-900">{toothName}</h2>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-gray-500">État actuel:</span>
                        <span 
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border"
                            style={{ 
                                backgroundColor: currentState.color, 
                                color: currentState.id === 'HEALTHY' || currentState.code === 'HEALTHY' ? '#065F46' : '#92400E',
                                borderColor: currentState.color 
                            }}
                        >
                            {currentState.name}
                        </span>
                    </div>
                </div>
            </div>
            <button 
                onClick={onClose} 
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-all"
            >
                <X className="w-6 h-6" />
            </button>
        </div>

        {/* Tabs */}
        <div className="flex px-6 border-b border-gray-100 space-x-6">
          <button
            onClick={() => setActiveTab('status')}
            className={`pb-3 pt-2 text-sm font-medium flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'status' 
                ? 'border-blue-600 text-blue-600 transform translate-y-[1px]' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Info className="w-4 h-4" />
            État & Notes
          </button>
          <button
            onClick={() => setActiveTab('procedures')}
            className={`pb-3 pt-2 text-sm font-medium flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'procedures' 
                ? 'border-blue-600 text-blue-600 transform translate-y-[1px]' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Activity className="w-4 h-4" />
            Actes Cliniques
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 pt-2 text-sm font-medium flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'history' 
                ? 'border-blue-600 text-blue-600 transform translate-y-[1px]' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <History className="w-4 h-4" />
            Historique 
            <span className="bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs ml-1">{history.length}</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50">
          
          {/* TAB: STATUS */}
          {activeTab === 'status' && (
            <div className="space-y-6">
              <section>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Activity className="w-4 h-4" /> Définir l&apos;État de la dent
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {statesToShow.map((state) => {
                    const isSelected = currentStateId === state.id || currentStateId === state.code;
                    return (
                    <button
                      key={state.id || state.code}
                      onClick={() => handleStateChange(state.code || state.id)} 
                      className={`
                        relative group flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200
                        ${isSelected
                          ? 'border-blue-500 bg-white ring-4 ring-blue-500/10 shadow-md' 
                          : 'border-gray-200 bg-white text-gray-600 hover:border-blue-200 hover:bg-blue-50/30'
                        }
                      `}
                    >
                      <div 
                        className="w-8 h-8 rounded-full mb-2 shadow-sm border border-gray-100"
                        style={{ backgroundColor: state.color }}
                      />
                      <span className={`text-sm font-medium ${isSelected ? 'text-blue-700' : 'text-gray-700'}`}>
                        {state.name}
                      </span>
                      {isSelected && (
                        <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-0.5 shadow-sm">
                            <Check className="w-3 h-3" />
                        </div>
                      )}
                    </button>
                  )})}
                  
                  {/* Bouton Ajouter État */}
                  {onCreateState && !isCreatingState && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsCreatingState(true);
                          }}
                          className="relative group flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-gray-300 text-gray-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50/50 transition-all"
                        >
                            <div className="w-8 h-8 rounded-full mb-2 bg-gray-100 flex items-center justify-center group-hover:bg-blue-100">
                                <span className="text-xl font-bold">+</span>
                            </div>
                            <span className="text-sm font-medium">Nouveau</span>
                        </button>
                  )}
                </div>
                
                {/* Formulaire de création rapide */}
                {isCreatingState && (
                    <div className="mt-4 p-4 bg-white rounded-xl border border-blue-100 shadow-sm">
                        <h4 className="text-sm font-semibold text-gray-800 mb-3">Nouvel état dentaire</h4>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <input
                                type="text"
                                value={newStateName}
                                onChange={(e) => setNewStateName(e.target.value)}
                                placeholder="Nom (ex: Prothèse)"
                                className="flex-1 border-gray-200 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                                autoFocus
                            />
                            <div className="flex items-center gap-2">
                                <input 
                                    type="color" 
                                    value={newStateColor}
                                    onChange={(e) => setNewStateColor(e.target.value)}
                                    className="h-9 w-12 p-0 border border-gray-200 rounded block"
                                />
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => setIsCreatingState(false)}
                                        className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={handleCreateState}
                                        disabled={!newStateName.trim()}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Créer
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
              </section>

              <section className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-400" /> 
                        Notes & Observations
                    </h3>
                    <span className="text-xs text-green-600 font-medium flex items-center gap-1 bg-green-50 px-2 py-1 rounded-full">
                        <Save className="w-3 h-3" /> Sauvegarde auto (au focus out)
                    </span>
                </div>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  onBlur={handleSaveNotes}
                  className="w-full border-gray-200 rounded-lg text-sm p-3 min-h-[100px] focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all resize-none bg-gray-50/50 focus:bg-white"
                  placeholder="Saisissez ici les observations cliniques, douleurs, sensibilités ou particularités de cette dent..."
                />
              </section>
            </div>
          )}

          {/* TAB: PROCEDURES */}
          {activeTab === 'procedures' && (
             <div className="space-y-6">
                <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100">
                   <h3 className="text-sm font-semibold text-gray-800 mb-4">Nouvel Acte à réaliser</h3>
                   
                   <div className="space-y-4">
                        <div>
                           <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                             {loadingActes ? 'Chargement des actes...' : 'Type d&apos;acte disponible'}
                           </label>
                           <SearchableSelect
                              options={typesActes?.map(act => ({
                                id: act.id,
                                label: act.nom,
                                ...act // keep other props like nom/prenom for automatic filtering if fallback needed, though label is key
                              })) || []}
                              value={selectedProcedureId ? parseInt(selectedProcedureId, 10) : ''}
                              onChange={(val) => setSelectedProcedureId(val)}
                              placeholder={loadingActes ? 'Chargement...' : '-- Sélectionner un acte --'}
                              searchPlaceholder="Rechercher un acte..."
                              disabled={loadingActes}
                              maxHeight="max-h-40"
                              emptyMessage="Aucun acte trouvé"
                           />
                           {typesActes?.length === 0 && !loadingActes && (
                            <p className="text-xs text-red-500 mt-1">Aucun acte trouvé pour votre spécialité.</p>
                           )}
                        </div>
    
                        {selectedProcedureId && (
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Détails / Note (Optionnel)</label>
                                <input 
                                    type="text" 
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    className="w-full border-gray-200 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 mb-4 bg-white shadow-sm"
                                    placeholder="Ex: Anesthésie locale, difficulté particulière..."
                                />
                                <button
                                    onClick={handleAddProcedure}
                                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 active:transform active:scale-[0.98]"
                                >
                                    <Check className="w-5 h-5" />
                                    Valider et Ajouter à l&apos;historique
                                </button>
                            </div>
                        )}
                   </div>
                </div>
                
                <div className="flex items-center gap-3 p-4 bg-orange-50 text-orange-800 rounded-lg text-sm border border-orange-100">
                    <Info className="w-5 h-5 flex-shrink-0" />
                    <p>Certains actes (comme les extractions) mettront automatiquement à jour l&apos;état visuel de la dent sur le schéma.</p>
                </div>
             </div>
          )}

          {/* TAB: HISTORY */}
          {activeTab === 'history' && (
            <div>
               {history.length === 0 ? (
                 <div className="flex flex-col items-center justify-center py-12 text-center">
                   <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                       <History className="w-8 h-8 text-gray-400" />
                   </div>
                   <h4 className="text-gray-900 font-medium mb-1">Aucun historique</h4>
                   <p className="text-gray-500 text-sm max-w-xs mx-auto">
                     Aucun acte ou note n&apos;a encore été enregistré pour cette dent.
                   </p>
                 </div>
               ) : (
                 <div className="space-y-4">
                   <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 pl-1">Chronologie</h3>
                   <div className="relative pl-4 border-l-2 border-gray-200 space-y-6">
                       {history.map((item, index) => (
                         <div key={index} className="relative pl-6">
                            {/* Dot on timeline */}
                            <div className="absolute -left-[21px] top-1 w-3 h-3 bg-white border-2 border-blue-500 rounded-full ring-4 ring-gray-50"></div>
                            
                            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                            {item.type === 'PROCEDURE' ? 'ACTE' : 'NOTE'}
                                        </span>
                                        <h4 className="font-bold text-gray-900 mt-1 text-base">{item.name}</h4>
                                    </div>
                                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                                       {new Date(item.date).toLocaleDateString()}
                                    </span>
                                </div>
                                {item.note && (
                                    <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600 mt-2 border border-gray-100 italic">
                                        &quot;{item.note}&quot;
                                    </div>
                                )}
                            </div>
                         </div>
                       ))}
                   </div>
                 </div>
               )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ToothDetailsModal;
