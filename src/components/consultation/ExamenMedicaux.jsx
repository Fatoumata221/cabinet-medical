import React, {useState} from 'react';
import { Plus } from 'lucide-react';
import PropTypes from 'prop-types';
import { SignModal, OtherSignModal } from './modals/ExamenModal';

const ExamenMedicaux = ({ 
  fetchSignesCliniques,
  signesCliniques,
  autresSignes,
  signesCliniquesRef,
  fetchAutresSignesCliniques,
  id,
  isTerminated = false
}) => {
  // State
  const [showSigneModal, setShowSigneModal] = useState(false);
  const [showAutreSigneModal, setShowAutreSigneModal] = useState(false);

 

const handleAddSigne = () => {
    setShowSigneModal(true);
  };
 const handleAddAutreSigne = () => {
    setShowAutreSigneModal(true);
  };


  return (
    <>
   <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Examen général</h2>
              {/* Afficher le bouton Ajouter uniquement s'il y a déjà des signes cliniques et consultation non terminée */}
              {signesCliniques.length > 0 && !isTerminated && (
                <button 
                  onClick={handleAddSigne}
                  className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 flex items-center text-sm"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Ajouter
                </button>
              )}
            </div>
            
            <div className="space-y-6">
              {/* Signes cliniques */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Signes cliniques</h3>
                {signesCliniques && signesCliniques.length > 0 ? (
                  <div className="space-y-3">
                    {signesCliniques.map((signe) => (
                      <div key={signe.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {signe.signes_cliniques?.nom}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">
                              {signe.signes_cliniques?.description}
                            </p>
                            <div className="flex items-center gap-4 mt-2">
                              {signe.intensite && (
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  signe.intensite === 'forte' ? 'bg-red-100 text-red-800' :
                                  signe.intensite === 'moderee' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                  Intensité: {signe.intensite}
                                </span>
                              )}
                            </div>
                            {signe.commentaires && (
                              <p className="text-sm text-gray-700 mt-2">
                                {signe.commentaires}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50">
                    <p className="text-gray-500 text-sm mb-4">Aucun signe clinique observé</p>
                    {!isTerminated && (
                      <button 
                        onClick={handleAddSigne}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center text-sm mx-auto"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Ajouter des signes cliniques
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Autres signes physiques */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-medium text-gray-900">Autres signes physiques</h3>
                  {!isTerminated && (
                    <button 
                      onClick={handleAddAutreSigne}
                      className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 flex items-center text-sm"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Ajouter
                    </button>
                  )}
                </div>
                {autresSignes && autresSignes.length > 0 ? (
                  <div className="space-y-3">
                    {autresSignes.map((signe) => (
                      <div key={signe.id} className="border rounded-lg p-4">
                        <div>
                          <p className="text-sm text-gray-700">
                            {signe.description || signe.commentaires || 'Aucun commentaire'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Aucun autre signe physique noté</p>
                )}
              </div>
            </div>
          </div>
    { showSigneModal && (
      <SignModal
        fetchSignesCliniques={fetchSignesCliniques}
        signesCliniquesRef={signesCliniquesRef}
        id={id}
        setShowSigneModal={setShowSigneModal}
      />
    )}
    { showAutreSigneModal && (
      <OtherSignModal
        fetchAutresSignesCliniques={fetchAutresSignesCliniques}
        id={id}
        setShowAutreSigneModal={setShowAutreSigneModal}
    />
    )}
    </>
  );
};

export default ExamenMedicaux;

ExamenMedicaux.propTypes = {
  fetchSignesCliniques: PropTypes.func.isRequired,
  signesCliniques: PropTypes.array,
  autresSignes: PropTypes.array,
  signesCliniquesRef: PropTypes.array,
  fetchAutresSignesCliniques: PropTypes.func,
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired
};

ExamenMedicaux.defaultProps = {
  signesCliniques: [],
  autresSignes: [],
  signesCliniquesRef: [],
  fetchAutresSignesCliniques: () => {}
};