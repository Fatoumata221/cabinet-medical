import React, { useState } from 'react';
import { Plus, FileText } from 'lucide-react';
import PropTypes from 'prop-types';
import DiagnosticModal from '../consultation/modals/DiagnosticsModal';


export default function DiagnosticsTab(
  { diagnostics,
    fetchDiagnostics,
    diagnosticsRef,
    setDiagnosticsRef,
    id,
    isTerminated = false
   }
  
) {
  // Handlers détectés et injectés automatiquement
  const [showDiagnosticModal, setShowDiagnosticModal] = useState(false)
  const handleAddDiagnostic = () => {
    setShowDiagnosticModal(true);
  };

  return (
    <>
    <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Diagnostics</h2>
          {!isTerminated && (
            <button 
              onClick={handleAddDiagnostic}
              className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 flex items-center text-sm"
            >
              <Plus className="w-4 h-4 mr-1" />
              Ajouter
            </button>
          )}
        </div>
    
        {diagnostics.length > 0 ? (
          <div className="space-y-3">
            {diagnostics.map((diagnostic) => (
              <div key={diagnostic.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {diagnostic.diagnostics?.nom}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {diagnostic.diagnostics?.description}
                    </p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${
                      diagnostic.certitude === 'certain' ? 'bg-green-100 text-green-800' :
                      diagnostic.certitude === 'probable' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      Certitude: {diagnostic.certitude}
                    </span>
                    {diagnostic.commentaires && (
                      <p className="text-sm text-gray-700 mt-2">
                        {diagnostic.commentaires}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun diagnostic</h3>
            <p className="mt-1 text-sm text-gray-500">
              Aucun diagnostic n&apos; été posé lors de cette consultation.
            </p>
          </div>
        )}
      </div>
      {showDiagnosticModal && (
        <DiagnosticModal
          fetchDiagnostics={fetchDiagnostics}
          diagnosticsRef={diagnosticsRef}
          setDiagnosticsRef={setDiagnosticsRef}
          setShowDiagnosticModal={setShowDiagnosticModal}
          id={id}
        />
      )}
    </>
      
    )}

DiagnosticsTab.propTypes = {
  diagnostics: PropTypes.array.isRequired,
  fetchDiagnostics: PropTypes.func.isRequired,
  diagnosticsRef: PropTypes.array.isRequired  ,
  setDiagnosticsRef: PropTypes.func.isRequired,
  id: PropTypes.number.isRequired
};
