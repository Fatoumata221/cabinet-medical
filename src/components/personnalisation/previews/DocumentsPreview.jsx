import React from 'react';
import { Stamp } from 'lucide-react';


// Aperçu pour l'onglet Documents
const DocumentsPreview = ({ settings }) => {
    return (
      <div className="space-y-4">
        <div className="text-sm font-semibold mb-3" style={{ color: settings.couleur_texte || '#111827' }}>
          Aperçu des Documents
        </div>
  
        {/* Aperçu Certificat */}
        <div 
          className="rounded-lg p-4 border-2"
          style={{ 
            backgroundColor: settings.document_couleur_fond || '#FFFFFF',
            borderColor: settings.document_couleur_bordure || '#4f46e5'
          }}
        >
          {/* En-tête */}
          <div className="flex justify-between items-start mb-3 pb-2 border-b-2" style={{ borderColor: settings.document_couleur_bordure || '#4f46e5' }}>
            <div>
              {settings.document_logo_url && settings.document_afficher_logo !== false && (
                <img 
                  src={settings.document_logo_url || settings.logo_url} 
                  alt="Logo" 
                  className="h-10 w-auto mb-2"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              )}
              <div className="text-xs" style={{ color: settings.document_couleur_principale || '#4f46e5' }}>
                Dr. Nom Médecin
              </div>
            </div>
            <div className="text-right text-xs" style={{ color: settings.document_couleur_principale || '#4f46e5' }}>
              {settings.nom_cabinet || 'Cabinet Médical'}
            </div>
          </div>
  
          {/* Titre */}
          <div 
            className="text-center mb-3 py-2"
            style={{ 
              background: `linear-gradient(135deg, ${settings.document_couleur_principale || '#4f46e5'} 0%, ${settings.document_couleur_secondaire || '#7c3aed'} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            <div className="font-bold text-sm">
              {settings.certificat_titre || 'CERTIFICAT MÉDICAL'}
            </div>
          </div>
  
          {/* Contenu */}
          <div className="text-xs mb-3" style={{ color: settings.couleur_texte || '#111827', fontFamily: settings.document_police || 'Segoe UI' }}>
            <div className="mb-2">
              {settings.certificat_texte_introduction || 'Je soussigné, Docteur [NOM_MEDECIN], certifie avoir examiné ce jour :'}
            </div>
            <div className="bg-gray-50 p-2 rounded text-xs">
              Patient: Nom Prénom<br />
              Date: {new Date().toLocaleDateString('fr-FR')}
            </div>
          </div>
  
          {/* Signature */}
          <div className="flex justify-between items-end pt-2 border-t" style={{ borderColor: settings.document_couleur_bordure || '#4f46e5' }}>
            <div className="text-xs" style={{ color: settings.couleur_texte_secondaire || '#6B7280' }}>
              Fait à {settings.document_lieu_par_defaut || settings.ville || 'Lieu'}
            </div>
            {settings.document_cachet_url && settings.document_afficher_cachet !== false && (
              <div className="text-xs text-center">
                <div className="text-xs mb-1" style={{ color: settings.couleur_texte_secondaire || '#6B7280' }}>
                  Cachet
                </div>
                <div className="w-16 h-16 border-2 border-dashed flex items-center justify-center" style={{ borderColor: settings.document_couleur_bordure || '#4f46e5' }}>
                  <Stamp className="w-6 h-6" style={{ color: settings.document_couleur_principale || '#4f46e5' }} />
                </div>
              </div>
            )}
          </div>
        </div>
  
        {/* Aperçu Ordonnance */}
        <div 
          className="rounded-lg p-4 border-2"
          style={{ 
            backgroundColor: settings.document_couleur_fond || '#FFFFFF',
            borderColor: settings.document_couleur_bordure || '#4f46e5'
          }}
        >
          <div 
            className="text-center mb-3 py-2 font-bold text-sm"
            style={{ 
              color: settings.document_couleur_principale || '#4f46e5'
            }}
          >
            {settings.ordonnance_titre || 'ORDONNANCE MÉDICALE'}
          </div>
          <div className="text-xs space-y-1" style={{ color: settings.couleur_texte || '#111827', fontFamily: settings.document_police || 'Segoe UI' }}>
            <div>1. Médicament A - Posologie</div>
            <div>2. Médicament B - Posologie</div>
          </div>
          <div className="text-xs mt-3 pt-2 border-t" style={{ borderColor: settings.document_couleur_bordure || '#4f46e5', color: settings.couleur_texte_secondaire || '#6B7280' }}>
            {settings.ordonnance_footer_texte || 'Ce document est une ordonnance médicale - À conserver'}
          </div>
        </div>
      </div>
    );
  };
  
  export default DocumentsPreview;