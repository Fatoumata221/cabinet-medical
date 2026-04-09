import React, { useState } from 'react';
import { Eye, X } from 'lucide-react';
import GeneralPreview from './previews/GeneralPreview';
import ApparencePreview from './previews/ApparencePreview';
import DocumentsPreview from './previews/DocumentsPreview';


// Composant d'aperçu en temps réel
const PreviewPanel = ({ settings, activeTab }) => {
    const [isExpanded, setIsExpanded] = useState(true);
  
    return (
      <div className="sticky top-6">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
          {/* Header de l'aperçu */}
          <div 
            className="px-4 py-3 border-b border-gray-200 flex items-center justify-between cursor-pointer"
            onClick={() => setIsExpanded(!isExpanded)}
            style={{ backgroundColor: settings.couleur_background || '#F9FAFB' }}
          >
            <div className="flex items-center">
              <Eye className="w-5 h-5 mr-2" style={{ color: settings.couleur_principale || '#3B82F6' }} />
              <h3 className="font-semibold" style={{ color: settings.couleur_texte || '#111827' }}>
                Aperçu en temps réel
              </h3>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              {isExpanded ? <X className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
  
          {/* Contenu de l'aperçu */}
          {isExpanded && (
            <div className="p-4 max-h-[calc(100vh-200px)] overflow-y-auto" style={{ backgroundColor: settings.couleur_background || '#F9FAFB' }}>
              {activeTab === 'general' && <GeneralPreview settings={settings} />}
              {activeTab === 'apparence' && <ApparencePreview settings={settings} />}
              {activeTab === 'documents' && <DocumentsPreview settings={settings} />}
            </div>
          )}
        </div>
      </div>
    );
  };

  export default PreviewPanel;