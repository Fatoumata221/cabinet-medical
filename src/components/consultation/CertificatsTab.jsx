import React, { useState } from 'react';
import { Plus, FileText, Award } from 'lucide-react';
import PropTypes from 'prop-types';
import CertificatModal from './modals/CertificatsModal';


export default function CertificatsTab(
  { certificats, typesCertificats, typesCertificatsRef, generateCertificatsPDF, generateSingleCertificatPDF,
    fetchCertificats,
    consultation, id
   }

) {

  const safetypesCertificats = typesCertificats || []; 
  const [activeCertificatSubTab, setActiveCertificatSubTab] = useState('all');
  const [showCertificatModal, setShowCertificatModal] = useState(false)
  const handleAddCertificat = () => {
    setShowCertificatModal(true);
  };

  return (
    <>
    
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Certificats médicaux</h2>
          <div className="flex gap-2">
            <button 
              onClick={handleAddCertificat}
              className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 flex items-center text-sm"
            >
              <Plus className="w-4 h-4 mr-1" />
              Créer
            </button>
            {certificats.length > 0 && (
              <button 
                onClick={generateCertificatsPDF}
                className="bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 flex items-center text-sm"
              >
                <FileText className="w-4 h-4 mr-1" />
                Générer PDF
              </button>
            )}
          </div>
        </div>
    
        {/* Sous-onglets pour les types de certificats */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {/* Onglet "Tous" */}
            <button
              onClick={() => setActiveCertificatSubTab('all')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeCertificatSubTab === 'all'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Tous
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                activeCertificatSubTab === 'all'
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {certificats.length}
              </span>
            </button>
    
            {/* Onglets par type de certificat */}
            {safetypesCertificats.map((type) => {
              const count = certificats.filter(cert => cert.type_certificat_id === type.id).length;
              if (count === 0) return null; // Ne pas afficher si aucun certificat de ce type
    
              return (
                <button
                  key={type.id}
                  onClick={() => setActiveCertificatSubTab(type.id.toString())}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeCertificatSubTab === type.id.toString()
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {type.nom}
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    activeCertificatSubTab === type.id.toString()
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
    
        {/* Liste des certificats filtrés */}
        {(() => {
          const filteredCertificats = activeCertificatSubTab === 'all'
            ? certificats
            : certificats.filter(cert => cert.type_certificat_id === parseInt(activeCertificatSubTab));
    
          return filteredCertificats.length > 0 ? (
            <div className="space-y-3">
              {filteredCertificats.map((certificat) => (
                <div key={certificat.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <Award className="w-5 h-5 text-blue-600" />
                          <h3 className="font-medium text-gray-900">
                            {certificat.types_certificats?.nom}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => generateSingleCertificatPDF(certificat)}
                            className="bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 flex items-center text-xs"
                          >
                            <FileText className="w-3 h-3 mr-1" />
                            Générer PDF
                          </button>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            certificat.statut === 'actif' ? 'bg-green-100 text-green-800' :
                            certificat.statut === 'expire' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {certificat.statut}
                          </span>
                        </div>
                      </div>
                      <div className="ml-8 space-y-2">
                        <p className="text-sm text-gray-600">
                          <strong>Durée:</strong> {certificat.duree_jours} jour{certificat.duree_jours > 1 ? 's' : ''}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>
                            <strong>Du:</strong> {new Date(certificat.date_debut).toLocaleDateString('fr-FR')}
                          </span>
                          {certificat.date_fin && (
                            <span>
                              <strong>Au:</strong> {new Date(certificat.date_fin).toLocaleDateString('fr-FR')}
                            </span>
                          )}
                        </div>
                        {certificat.motif && (
                          <p className="text-sm text-gray-700">
                            <strong>Motif:</strong> {certificat.motif}
                          </p>
                        )}
                        {certificat.restrictions && (
                          <p className="text-sm text-gray-700">
                            <strong>Restrictions:</strong> {certificat.restrictions}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <Award className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {activeCertificatSubTab === 'all' ? 'Aucun certificat' : 'Aucun certificat de ce type'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {activeCertificatSubTab === 'all' 
                  ? "Aucun certificat médical n'a été délivré lors de cette consultation."
                  : "Aucun certificat de ce type n'a été créé pour cette consultation."}
              </p>
            </div>
          );
        })()}
      </div>
      {showCertificatModal && (
        <CertificatModal
          setShowCertificatModal={setShowCertificatModal}
          typesCertificatsRef={typesCertificatsRef}
          fetchCertificats={fetchCertificats}
          id={id}
          consultation={consultation}
          />        )}
    </>
    )}
CertificatsTab.propTypes = {
  certificats: PropTypes.array.isRequired,
  typesCertificats: PropTypes.array.isRequired,
  generateCertificatsPDF: PropTypes.func.isRequired,
  generateSingleCertificatPDF: PropTypes.func.isRequired,
  consultation: PropTypes.object.isRequired,
  id: PropTypes.number.isRequired,
  typesCertificatsRef: PropTypes.array.isRequired,
  fetchCertificats: PropTypes.func.isRequired,
};
